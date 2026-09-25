import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Role } from '@tuite/shared-types';
import { Roles, CurrentTenant } from '../../common/decorators';
import { StaffService } from './staff.service';
import { InviteStaffDto } from './dto';

/**
 * Staff management endpoints for Tuition Owners.
 * Handles teacher invitations and batch assignments.
 */
@ApiTags('Staff')
@ApiBearerAuth()
@Controller('api/v1/staff')
@Roles(Role.OWNER)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  /**
   * GET /api/v1/staff
   * List all teachers for the current tenant with batch assignments.
   */
  @Get()
  @ApiOperation({ summary: 'List all teachers for the tenant' })
  @ApiResponse({ status: 200, description: 'Staff list retrieved successfully' })
  async findAll(@CurrentTenant() tenantId: string) {
    return this.staffService.findAll(tenantId);
  }

  /**
   * POST /api/v1/staff/invite
   * Invite a teacher by phone number and assign to batches.
   */
  @Post('invite')
  @ApiOperation({ summary: 'Invite a teacher and assign to batches' })
  @ApiResponse({ status: 201, description: 'Teacher invited successfully' })
  @ApiResponse({ status: 403, description: 'Batch does not belong to this tenant' })
  @ApiResponse({ status: 409, description: 'User exists with a different role' })
  async invite(
    @CurrentTenant() tenantId: string,
    @Body() dto: InviteStaffDto,
  ) {
    return this.staffService.invite(tenantId, dto);
  }
}
