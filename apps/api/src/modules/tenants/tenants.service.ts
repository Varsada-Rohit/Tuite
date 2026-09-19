import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { Role, FeatureName, TenantProfile } from '@tuite/shared-types';
import { PrismaService } from '../../database/prisma.service';
import { CreateTenantDto, UpdateFeatureFlagsDto, SeedOwnerDto } from './dto';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Public: Resolve tenant metadata by slug for frontend white-labeling.
   */
  async resolveBySlug(slug: string): Promise<TenantProfile> {
    const tenant = await this.prisma.withoutTenant().tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        logo_url: true,
        primary_color: true,
        secondary_color: true,
        is_active: true,
      },
    });

    if (!tenant || !tenant.is_active) {
      throw new NotFoundException(`Tenant "${slug}" not found`);
    }

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      logoUrl: tenant.logo_url,
      primaryColor: tenant.primary_color,
      secondaryColor: tenant.secondary_color,
    };
  }

  /**
   * Admin: Create a new tenant with default feature flags.
   */
  async create(dto: CreateTenantDto) {
    const existing = await this.prisma.withoutTenant().tenant.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException(`Tenant with slug "${dto.slug}" already exists`);
    }

    const tenant = await this.prisma.withoutTenant().tenant.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        logo_url: dto.logoUrl,
        primary_color: dto.primaryColor || '#1E40AF',
        secondary_color: dto.secondaryColor || '#F3F4F6',
        // Create default feature flags (all disabled)
        feature_flags: {
          create: Object.values(FeatureName).map((feature) => ({
            feature_name: feature,
            is_enabled: false,
          })),
        },
      },
      include: { feature_flags: true },
    });

    this.logger.log(`Created tenant: ${tenant.name} (${tenant.slug})`);
    return tenant;
  }

  /**
   * Admin: Toggle tenant active status.
   */
  async updateStatus(tenantId: string, isActive: boolean) {
    const tenant = await this.findOrFail(tenantId);

    const updated = await this.prisma.withoutTenant().tenant.update({
      where: { id: tenant.id },
      data: { is_active: isActive },
    });

    this.logger.log(`Tenant ${tenant.slug} status updated to: ${isActive ? 'active' : 'inactive'}`);
    return updated;
  }

  /**
   * Admin: Batch update feature flags for a tenant.
   */
  async updateFeatureFlags(tenantId: string, dto: UpdateFeatureFlagsDto) {
    await this.findOrFail(tenantId);

    const results = await Promise.all(
      dto.features.map((flag) =>
        this.prisma.withoutTenant().tenantFeatureFlag.upsert({
          where: {
            tenant_id_feature_name: {
              tenant_id: tenantId,
              feature_name: flag.name,
            },
          },
          update: {
            is_enabled: flag.isEnabled,
          },
          create: {
            tenant_id: tenantId,
            feature_name: flag.name,
            is_enabled: flag.isEnabled,
          },
        }),
      ),
    );

    this.logger.log(`Updated ${results.length} feature flags for tenant ${tenantId}`);
    return results;
  }

  /**
   * Admin: Seed the initial OWNER for a tenant.
   */
  async seedOwner(tenantId: string, dto: SeedOwnerDto) {
    await this.findOrFail(tenantId);

    // Check if an owner already exists for this tenant
    const existingOwner = await this.prisma.withoutTenant().user.findFirst({
      where: { tenant_id: tenantId, role: Role.OWNER },
    });

    if (existingOwner) {
      throw new ConflictException('This tenant already has an owner');
    }

    // Check if the phone number is already registered for this tenant
    const existingUser = await this.prisma.withoutTenant().user.findUnique({
      where: {
        tenant_id_phone: {
          tenant_id: tenantId,
          phone: dto.phone,
        },
      },
    });

    if (existingUser) {
      throw new ConflictException('A user with this phone number already exists in this tenant');
    }

    const owner = await this.prisma.withoutTenant().user.create({
      data: {
        tenant_id: tenantId,
        phone: dto.phone,
        full_name: dto.fullName,
        role: Role.OWNER,
      },
    });

    this.logger.log(`Seeded owner ${owner.id} for tenant ${tenantId}`);
    return owner;
  }

  // ─── Private Helpers ───────────────────────────────────

  private async findOrFail(tenantId: string) {
    const tenant = await this.prisma.withoutTenant().tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    return tenant;
  }
}
