import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Role } from '@tuite/shared-types';
import { Roles, CurrentTenant, CurrentUser } from '../../common/decorators';
import { AttendanceService } from './attendance.service';
import { SubmitAttendanceDto } from './dto';

/**
 * Attendance endpoints for Teachers and Owners.
 * All queries are scoped to the authenticated user's tenant.
 */
@ApiTags('Attendance')
@ApiBearerAuth()
@Controller('api/v1/attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  /**
   * POST /api/v1/attendance
   * Submit batch attendance for a date.
   */
  @Post()
  @Roles(Role.OWNER, Role.TEACHER)
  @ApiOperation({ summary: 'Submit batch attendance' })
  @ApiResponse({ status: 201, description: 'Attendance submitted successfully' })
  async submit(
    @CurrentTenant() tenantId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: SubmitAttendanceDto,
  ) {
    return this.attendanceService.submit(tenantId, userId, dto);
  }

  /**
   * GET /api/v1/attendance?batchId=&date=
   * Get attendance for a batch on a specific date.
   */
  @Get()
  @Roles(Role.OWNER, Role.TEACHER)
  @ApiOperation({ summary: 'Get attendance for a batch/date' })
  @ApiQuery({ name: 'batchId', required: true })
  @ApiQuery({ name: 'date', required: true, description: 'YYYY-MM-DD' })
  @ApiResponse({ status: 200, description: 'Attendance retrieved successfully' })
  async getByBatchAndDate(
    @CurrentTenant() tenantId: string,
    @Query('batchId', ParseUUIDPipe) batchId: string,
    @Query('date') date: string,
  ) {
    return this.attendanceService.getByBatchAndDate(tenantId, batchId, date);
  }

  /**
   * GET /api/v1/attendance/student/:id/summary
   * Get monthly attendance summary for a student.
   */
  @Get('student/:id/summary')
  @Roles(Role.OWNER, Role.TEACHER, Role.STUDENT, Role.PARENT)
  @ApiOperation({ summary: 'Get student attendance summary' })
  @ApiParam({ name: 'id', description: 'Student UUID' })
  @ApiQuery({ name: 'month', required: false, description: '1-12' })
  @ApiQuery({ name: 'year', required: false, description: 'YYYY' })
  @ApiResponse({ status: 200, description: 'Summary retrieved successfully' })
  async getStudentSummary(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.attendanceService.getStudentSummary(tenantId, id, month, year);
  }

  /**
   * GET /api/v1/attendance/batch/:id/summary
   * Get batch-level attendance analytics.
   */
  @Get('batch/:id/summary')
  @Roles(Role.OWNER, Role.TEACHER)
  @ApiOperation({ summary: 'Get batch attendance analytics' })
  @ApiParam({ name: 'id', description: 'Batch UUID' })
  @ApiQuery({ name: 'month', required: false })
  @ApiQuery({ name: 'year', required: false })
  @ApiResponse({ status: 200, description: 'Batch summary retrieved successfully' })
  async getBatchSummary(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.attendanceService.getBatchSummary(tenantId, id, month, year);
  }
}
