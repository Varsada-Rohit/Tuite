import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Role } from '@tuite/shared-types';
import { Roles, CurrentTenant } from '../../common/decorators';
import { StudentsService } from './students.service';
import { CreateStudentDto, UpdateStudentDto, EnrollStudentBatchDto } from './dto';

/**
 * Student management endpoints for Tuition Owners and Teachers.
 * All queries are scoped to the authenticated user's tenant.
 */
@ApiTags('Students')
@ApiBearerAuth()
@Controller('api/v1/students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  /**
   * GET /api/v1/students
   * List all students for the current tenant, with optional search.
   */
  @Get()
  @Roles(Role.OWNER, Role.TEACHER)
  @ApiOperation({ summary: 'List students for the tenant' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name or phone' })
  @ApiResponse({ status: 200, description: 'Students retrieved successfully' })
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query('search') search?: string,
  ) {
    return this.studentsService.findAll(tenantId, search);
  }

  /**
   * GET /api/v1/students/:id
   * Get a single student profile with batch info.
   */
  @Get(':id')
  @Roles(Role.OWNER, Role.TEACHER)
  @ApiOperation({ summary: 'Get student profile' })
  @ApiParam({ name: 'id', description: 'Student UUID' })
  @ApiResponse({ status: 200, description: 'Student retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  async findOne(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.studentsService.findOne(tenantId, id);
  }

  /**
   * POST /api/v1/students
   * Enroll a new student (optionally with batch assignments).
   */
  @Post()
  @Roles(Role.OWNER)
  @ApiOperation({ summary: 'Enroll a new student' })
  @ApiResponse({ status: 201, description: 'Student enrolled successfully' })
  async create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateStudentDto,
  ) {
    return this.studentsService.create(tenantId, dto);
  }

  /**
   * PATCH /api/v1/students/:id
   * Update student details.
   */
  @Patch(':id')
  @Roles(Role.OWNER)
  @ApiOperation({ summary: 'Update student details' })
  @ApiParam({ name: 'id', description: 'Student UUID' })
  @ApiResponse({ status: 200, description: 'Student updated successfully' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  async update(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStudentDto,
  ) {
    return this.studentsService.update(tenantId, id, dto);
  }

  /**
   * DELETE /api/v1/students/:id
   * Soft-delete a student (sets is_active = false).
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.OWNER)
  @ApiOperation({ summary: 'Soft-delete a student' })
  @ApiParam({ name: 'id', description: 'Student UUID' })
  @ApiResponse({ status: 204, description: 'Student deactivated successfully' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  async softDelete(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.studentsService.softDelete(tenantId, id);
  }

  /**
   * POST /api/v1/students/:id/batches
   * Assign student to one or more batches.
   */
  @Post(':id/batches')
  @Roles(Role.OWNER)
  @ApiOperation({ summary: 'Assign student to batches' })
  @ApiParam({ name: 'id', description: 'Student UUID' })
  @ApiResponse({ status: 201, description: 'Student enrolled in batches' })
  async enrollInBatches(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EnrollStudentBatchDto,
  ) {
    return this.studentsService.enrollInBatches(tenantId, id, dto);
  }

  /**
   * DELETE /api/v1/students/:id/batches/:batchId
   * Remove student from a batch.
   */
  @Delete(':id/batches/:batchId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.OWNER)
  @ApiOperation({ summary: 'Remove student from a batch' })
  @ApiParam({ name: 'id', description: 'Student UUID' })
  @ApiParam({ name: 'batchId', description: 'Batch UUID' })
  @ApiResponse({ status: 204, description: 'Student removed from batch' })
  async removeFromBatch(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('batchId', ParseUUIDPipe) batchId: string,
  ) {
    await this.studentsService.removeFromBatch(tenantId, id, batchId);
  }
}
