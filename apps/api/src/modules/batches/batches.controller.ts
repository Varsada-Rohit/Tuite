import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Role } from '@tuite/shared-types';
import { Roles, CurrentTenant } from '../../common/decorators';
import { BatchesService } from './batches.service';
import { CreateBatchDto, UpdateBatchDto } from './dto';

/**
 * Batch management endpoints for Tuition Owners.
 * All queries are scoped to the authenticated user's tenant.
 */
@ApiTags('Batches')
@ApiBearerAuth()
@Controller('api/v1/batches')
@Roles(Role.OWNER)
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  /**
   * GET /api/v1/batches
   * List all batches for the current tenant.
   */
  @Get()
  @ApiOperation({ summary: 'List all batches for the tenant' })
  @ApiResponse({ status: 200, description: 'Batches retrieved successfully' })
  async findAll(@CurrentTenant() tenantId: string) {
    return this.batchesService.findAll(tenantId);
  }

  /**
   * POST /api/v1/batches
   * Create a new batch.
   */
  @Post()
  @ApiOperation({ summary: 'Create a new batch' })
  @ApiResponse({ status: 201, description: 'Batch created successfully' })
  async create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateBatchDto,
  ) {
    return this.batchesService.create(tenantId, dto);
  }

  /**
   * PATCH /api/v1/batches/:id
   * Update an existing batch.
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update a batch' })
  @ApiParam({ name: 'id', description: 'Batch UUID' })
  @ApiResponse({ status: 200, description: 'Batch updated successfully' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  async update(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBatchDto,
  ) {
    return this.batchesService.update(tenantId, id, dto);
  }

  /**
   * DELETE /api/v1/batches/:id
   * Soft-delete a batch (sets is_active = false).
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a batch' })
  @ApiParam({ name: 'id', description: 'Batch UUID' })
  @ApiResponse({ status: 204, description: 'Batch deactivated successfully' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  async softDelete(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.batchesService.softDelete(tenantId, id);
  }
}
