import { Injectable, NotFoundException } from '@nestjs/common';
import { Role, FeatureName, MeResponse } from '@tuite/shared-types';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(tenantId: string, userId: string) {
    return this.prisma.withTenant(tenantId).user.findUnique({
      where: { id: userId },
    });
  }

  async findByTenantAndPhone(tenantId: string, phone: string) {
    return this.prisma.withTenant(tenantId).user.findUnique({
      where: {
        tenant_id_phone: {
          tenant_id: tenantId,
          phone,
        },
      },
    });
  }

  /**
   * Build the /users/me response, including the tenant's active feature flags.
   */
  async getMe(userId: string, tenantId: string | null): Promise<MeResponse> {
    const user = await this.prisma.withoutTenant().user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Fetch enabled feature flags for the tenant
    let features: FeatureName[] = [];

    if (tenantId) {
      const flags = await this.prisma.withoutTenant().tenantFeatureFlag.findMany({
        where: { tenant_id: tenantId, is_enabled: true },
        select: { feature_name: true },
      });

      features = flags.map((f) => f.feature_name as FeatureName);
    } else if (user.role === Role.SUPER_ADMIN) {
      // Super Admin sees all features
      features = Object.values(FeatureName);
    }

    return {
      id: user.id,
      tenantId: user.tenant_id,
      phone: user.phone,
      fullName: user.full_name,
      role: user.role as Role,
      isActive: user.is_active,
      features,
    };
  }
}
