import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import { Role, JwtPayload, AuthResponse } from '@tuite/shared-types';
import { PrismaService } from '../../database/prisma.service';
import { FirebaseService } from './firebase.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly refreshExpiry: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly firebaseService: FirebaseService,
    private readonly configService: ConfigService,
  ) {
    this.refreshExpiry = this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRY');
  }

  /**
   * Hybrid authentication flow:
   * 1. Verify Firebase ID token → extract phone number.
   * 2. Resolve tenant by slug.
   * 3. Find or create user in PostgreSQL.
   * 4. Issue internal JWT access + refresh token pair.
   */
  async verifyPhone(firebaseIdToken: string, tenantSlug: string): Promise<AuthResponse> {
    // Step 1: Verify Firebase token
    let decodedToken;
    try {
      decodedToken = await this.firebaseService.verifyIdToken(firebaseIdToken);
    } catch (error) {
      this.logger.warn(`Firebase token verification failed: ${(error as Error).message}`);
      throw new UnauthorizedException('Invalid or expired Firebase token');
    }

    const phoneNumber = decodedToken.phone_number;
    if (!phoneNumber) {
      throw new UnauthorizedException('Firebase token does not contain a phone number');
    }

    // Step 2: Resolve tenant
    const tenant = await this.prisma.withoutTenant().tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with slug "${tenantSlug}" not found`);
    }

    if (!tenant.is_active) {
      throw new ForbiddenException('This institution is currently inactive');
    }

    // Step 3: Find or create user
    let user = await this.prisma.withoutTenant().user.findUnique({
      where: {
        tenant_id_phone: {
          tenant_id: tenant.id,
          phone: phoneNumber,
        },
      },
    });

    if (!user) {
      // Auto-create user as STUDENT by default (owner/teacher must be pre-seeded)
      user = await this.prisma.withoutTenant().user.create({
        data: {
          tenant_id: tenant.id,
          phone: phoneNumber,
          role: Role.STUDENT,
        },
      });
      this.logger.log(`Created new user ${user.id} for tenant ${tenant.id}`);
    }

    if (!user.is_active) {
      throw new ForbiddenException('Your account has been deactivated');
    }

    // Step 4: Issue tokens
    const tokens = await this.issueTokens(user.id, user.role as Role, tenant.id);

    return {
      ...tokens,
      user: {
        id: user.id,
        phone: user.phone,
        fullName: user.full_name,
        role: user.role as Role,
        tenantId: user.tenant_id,
      },
    };
  }

  /**
   * Super Admin login flow:
   * 1. Verify Firebase ID token → extract phone number.
   * 2. Find the user with tenant_id = null and matching phone.
   * 3. Issue internal JWT access + refresh token pair.
   */
  async adminLogin(firebaseIdToken: string): Promise<AuthResponse> {
    // Step 1: Verify Firebase token
    let decodedToken;
    try {
      decodedToken = await this.firebaseService.verifyIdToken(firebaseIdToken);
    } catch (error) {
      this.logger.warn(`Firebase token verification failed: ${(error as Error).message}`);
      throw new UnauthorizedException('Invalid or expired Firebase token');
    }

    const phoneNumber = decodedToken.phone_number;
    if (!phoneNumber) {
      throw new UnauthorizedException('Firebase token does not contain a phone number');
    }

    // Step 2: Find user
    const user = await this.prisma.withoutTenant().user.findFirst({
      where: {
        tenant_id: null,
        phone: phoneNumber,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User is not a super admin or does not exist');
    }

    if (user.role !== Role.SUPER_ADMIN) {
      throw new UnauthorizedException('User is not a super admin');
    }

    if (!user.is_active) {
      throw new ForbiddenException('Your account has been deactivated');
    }

    // Step 3: Issue tokens
    const tokens = await this.issueTokens(user.id, user.role as Role, null);

    return {
      ...tokens,
      user: {
        id: user.id,
        phone: user.phone,
        fullName: user.full_name,
        role: user.role as Role,
        tenantId: null,
      },
    };
  }


  /**
   * Refresh token rotation:
   * 1. Hash the incoming raw token → find the matching DB record.
   * 2. Validate it's not revoked or expired.
   * 3. Revoke the old token.
   * 4. Issue a new access + refresh token pair.
   */
  async refreshTokens(rawRefreshToken: string): Promise<AuthResponse> {
    const tokenHash = this.hashToken(rawRefreshToken);

    const storedToken = await this.prisma.withoutTenant().refreshToken.findFirst({
      where: { token_hash: tokenHash },
      include: { user: { include: { tenant: true } } },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (storedToken.revoked) {
      // Possible token reuse attack — revoke all tokens for this user
      this.logger.warn(
        `Refresh token reuse detected for user ${storedToken.user_id}. Revoking all tokens.`,
      );
      await this.prisma.withoutTenant().refreshToken.updateMany({
        where: { user_id: storedToken.user_id },
        data: { revoked: true },
      });
      throw new UnauthorizedException('Refresh token has been revoked — all sessions terminated');
    }

    if (new Date() > storedToken.expires_at) {
      await this.prisma.withoutTenant().refreshToken.update({
        where: { id: storedToken.id },
        data: { revoked: true },
      });
      throw new UnauthorizedException('Refresh token has expired');
    }

    // Revoke the old token
    await this.prisma.withoutTenant().refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    const user = storedToken.user;
    if (!user.is_active) {
      throw new ForbiddenException('Your account has been deactivated');
    }

    if (user.tenant && !user.tenant.is_active) {
      throw new ForbiddenException('This institution is currently inactive');
    }

    // Issue new pair
    const tokens = await this.issueTokens(
      user.id,
      user.role as Role,
      user.tenant_id,
    );

    return {
      ...tokens,
      user: {
        id: user.id,
        phone: user.phone,
        fullName: user.full_name,
        role: user.role as Role,
        tenantId: user.tenant_id,
      },
    };
  }

  /**
   * Revoke all refresh tokens for a user (e.g., on logout or password change).
   */
  async revokeAllTokens(userId: string): Promise<void> {
    await this.prisma.withoutTenant().refreshToken.updateMany({
      where: { user_id: userId, revoked: false },
      data: { revoked: true },
    });
  }

  // ─── Private Helpers ───────────────────────────────────

  private async issueTokens(
    userId: string,
    role: Role,
    tenantId: string | null,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Access token (short-lived)
    const payload: JwtPayload = {
      sub: userId,
      role,
      tenantId,
    };
    const accessToken = this.jwtService.sign(payload);

    // Refresh token (long-lived, stored as hash)
    const rawRefreshToken = randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = this.calculateExpiry(this.refreshExpiry);

    await this.prisma.withoutTenant().refreshToken.create({
      data: {
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private calculateExpiry(duration: string): Date {
    const now = Date.now();
    const match = duration.match(/^(\d+)([smhd])$/);

    if (!match) {
      // Default to 7 days if format is unexpected
      return new Date(now + 7 * 24 * 60 * 60 * 1000);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return new Date(now + value * multipliers[unit]);
  }
}
