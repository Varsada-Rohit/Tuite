import { Controller, Get, Query, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { TenantsService } from './tenants.service';

/**
 * Public tenant endpoints — no authentication required.
 * Used by the frontend for white-labeling before the user logs in.
 */
@ApiTags('Tenants (Public)')
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
}
