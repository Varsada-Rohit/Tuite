import { Controller, Post, Patch, Param, Body, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Role } from '@tuite/shared-types';
import { Roles } from '../../common/decorators';
import { TenantsService } from './tenants.service';
import {
  CreateTenantDto,
  UpdateTenantStatusDto,
  UpdateFeatureFlagsDto,
  SeedOwnerDto,
} from './dto';

/**
 * Super Admin tenant management endpoints.
 * All routes require SUPER_ADMIN role.
 */
@ApiTags('Admin / Tenants')
@ApiBearerAuth()
@Controller('api/v1/admin/tenants')
@Roles(Role.SUPER_ADMIN)
export class TenantsAdminController {
  constructor(private readonly tenantsService: TenantsService) {}

  /**
   * POST /api/v1/admin/tenants
   * Create a new tenant with default feature flags.
   */
  @Post()
  @ApiOperation({ summary: 'Create a new tenant (Super Admin only)' })
  @ApiResponse({ status: 201, description: 'Tenant created successfully' })
  @ApiResponse({ status: 409, description: 'Tenant slug already exists' })
  async create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  /**
   * PATCH /api/v1/admin/tenants/:id/status
   * Toggle the active/inactive status of a tenant.
   */
  @Patch(':id/status')
  @ApiOperation({ summary: 'Toggle tenant active status' })
  @ApiParam({ name: 'id', description: 'Tenant UUID' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTenantStatusDto,
  ) {
    return this.tenantsService.updateStatus(id, dto.isActive);
  }

  /**
   * PATCH /api/v1/admin/tenants/:id/features
   * Batch toggle feature flags for a tenant.
   */
  @Patch(':id/features')
  @ApiOperation({ summary: 'Batch update tenant feature flags' })
  @ApiParam({ name: 'id', description: 'Tenant UUID' })
  async updateFeatures(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFeatureFlagsDto,
  ) {
    return this.tenantsService.updateFeatureFlags(id, dto);
  }

  /**
   * POST /api/v1/admin/tenants/:id/owner
   * Seed the initial OWNER profile for a tenant.
   */
  @Post(':id/owner')
  @ApiOperation({ summary: 'Seed the initial OWNER for a tenant' })
  @ApiParam({ name: 'id', description: 'Tenant UUID' })
  @ApiResponse({ status: 201, description: 'Owner seeded successfully' })
  @ApiResponse({ status: 409, description: 'Owner already exists or phone number taken' })
  async seedOwner(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SeedOwnerDto,
  ) {
    return this.tenantsService.seedOwner(id, dto);
  }
}
