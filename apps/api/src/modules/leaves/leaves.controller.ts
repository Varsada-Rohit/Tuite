import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Role, LeaveStatus } from '@tuite/shared-types';
import { Roles, CurrentTenant, CurrentUser } from '../../common/decorators';
import { LeavesService } from './leaves.service';
import { CreateLeaveDto, ReviewLeaveDto } from './dto';

/**
 * Leave management endpoints.
 * Students/Parents can submit; Owners/Teachers can review.
 */
@ApiTags('Leaves')
@ApiBearerAuth()
@Controller('api/v1/leaves')
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  /**
   * POST /api/v1/leaves
   * Submit a leave request.
   */
  @Post()
  @Roles(Role.OWNER, Role.TEACHER, Role.STUDENT, Role.PARENT)
  @ApiOperation({ summary: 'Submit a leave request' })
  @ApiResponse({ status: 201, description: 'Leave request submitted' })
  async create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateLeaveDto,
  ) {
    return this.leavesService.create(tenantId, dto);
  }

  /**
   * GET /api/v1/leaves
   * List leave requests (optional status filter).
   */
  @Get()
  @Roles(Role.OWNER, Role.TEACHER)
  @ApiOperation({ summary: 'List leave requests' })
  @ApiQuery({ name: 'status', required: false, enum: LeaveStatus })
  @ApiResponse({ status: 200, description: 'Leave requests retrieved' })
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query('status') status?: LeaveStatus,
  ) {
    return this.leavesService.findAll(tenantId, status);
  }

  /**
   * GET /api/v1/leaves/student/:id
   * Get leave history for a student.
   */
  @Get('student/:id')
  @Roles(Role.OWNER, Role.TEACHER, Role.STUDENT, Role.PARENT)
  @ApiOperation({ summary: 'Get student leave history' })
  @ApiParam({ name: 'id', description: 'Student UUID' })
  @ApiResponse({ status: 200, description: 'Leave history retrieved' })
  async findByStudent(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.leavesService.findByStudent(tenantId, id);
  }

  /**
   * PATCH /api/v1/leaves/:id/review
   * Approve or reject a leave request.
   */
  @Patch(':id/review')
  @Roles(Role.OWNER, Role.TEACHER)
  @ApiOperation({ summary: 'Approve or reject a leave request' })
  @ApiParam({ name: 'id', description: 'Leave request UUID' })
  @ApiResponse({ status: 200, description: 'Leave reviewed successfully' })
  @ApiResponse({ status: 404, description: 'Leave request not found' })
  async review(
    @CurrentTenant() tenantId: string,
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewLeaveDto,
  ) {
    return this.leavesService.review(tenantId, id, userId, dto);
  }
}
