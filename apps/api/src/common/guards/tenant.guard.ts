import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@tuite/shared-types';
import { PrismaService } from '../../database/prisma.service';
import { IS_PUBLIC_KEY } from '../decorators';

/**
 * Ensures tenant-level isolation:
 *
 * 1. SUPER_ADMIN → passes through (global access, no tenant_id required).
 * 2. Public routes (@Public()) → passes through.
 * 3. All other roles → must have a valid `tenantId` in their JWT,
 *    and that tenant must exist and be active.
 *
 * This guard runs AFTER JwtAuthGuard and RolesGuard in the guard chain.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  private readonly logger = new Logger(TenantGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Skip public routes
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as { role?: Role; tenantId?: string | null } | undefined;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // SUPER_ADMIN has global access — no tenant scoping
    if (user.role === Role.SUPER_ADMIN) {
      return true;
    }

    // All other roles must have a tenant_id
    if (!user.tenantId) {
      this.logger.warn(`Non-admin user without tenant_id attempted access`);
      throw new ForbiddenException('Access denied: no tenant association');
    }

    // Verify the tenant exists and is active
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { is_active: true },
    });

    if (!tenant) {
      this.logger.warn(`User referenced non-existent tenant: ${user.tenantId}`);
      throw new ForbiddenException('Access denied: tenant not found');
    }

    if (!tenant.is_active) {
      this.logger.warn(`User attempted access to inactive tenant: ${user.tenantId}`);
      throw new ForbiddenException('Access denied: tenant is inactive');
    }

    return true;
  }
}
