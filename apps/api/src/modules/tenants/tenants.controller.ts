import { Controller, Get, Patch, Query, Body, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Role } from '@tuite/shared-types';
import { Public, Roles, CurrentTenant } from '../../common/decorators';
import { TenantsService } from './tenants.service';
import { UpdateTenantProfileDto } from './dto';

/**
 * Tenant endpoints — public resolve + authenticated profile management.
 */
@ApiTags('Tenants')
@Controller('api/v1/tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  /**
   * GET /api/v1/tenants/resolve?slug=:slug
   * Returns tenant metadata (name, logo, colors) for dynamic theming.
   */
  @Public()
  @Get('resolve')
  @ApiOperation({ summary: 'Resolve tenant metadata by slug' })
  @ApiQuery({ name: 'slug', description: 'The unique slug of the tenant' })
  @ApiResponse({ status: 200, description: 'Tenant metadata returned successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found or inactive' })
  async resolve(@Query('slug') slug: string) {
    if (!slug) {
      throw new NotFoundException('Slug query parameter is required');
    }
    return this.tenantsService.resolveBySlug(slug);
  }

  /**
   * GET /api/v1/tenants/profile
   * Returns the authenticated user's own tenant profile (used to restore
   * theme and prefill the Institute page after a reload).
   */
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the current tenant profile' })
  @ApiResponse({ status: 200, description: 'Tenant profile returned successfully' })
  async getProfile(@CurrentTenant() tenantId: string) {
    return this.tenantsService.getProfile(tenantId);
  }

  /**
   * PATCH /api/v1/tenants/profile
   * Update the current tenant's profile (contact info, branding).
   * Only accessible by the Tuition Owner.
   */
  @Patch('profile')
  @ApiBearerAuth()
  @Roles(Role.OWNER)
  @ApiOperation({ summary: 'Update tenant profile (Owner only)' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateTenantProfileDto,
  ) {
    return this.tenantsService.updateProfile(tenantId, dto);
  }
}
