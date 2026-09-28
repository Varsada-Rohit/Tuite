import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { LeaveStatus } from '@tuite/shared-types';
import { PrismaService } from '../../database/prisma.service';
import { CreateLeaveDto, ReviewLeaveDto } from './dto';

@Injectable()
export class LeavesService {
  private readonly logger = new Logger(LeavesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Submit a leave request.
   */
  async create(tenantId: string, dto: CreateLeaveDto) {
    // Validate date range
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    if (endDate < startDate) {
      throw new BadRequestException('End date cannot be before start date');
    }

    // Verify student belongs to this tenant
    const student = await this.prisma.withTenant(tenantId).student.findUnique({
      where: { id: dto.studentId },
    });
    if (!student) {
      throw new NotFoundException(`Student ${dto.studentId} not found`);
    }

    // Verify batch belongs to this tenant
    const batch = await this.prisma.withTenant(tenantId).batch.findUnique({
      where: { id: dto.batchId },
    });
    if (!batch) {
      throw new NotFoundException(`Batch ${dto.batchId} not found`);
    }

    const leave = await this.prisma.withTenant(tenantId).leaveRequest.create({
      data: {
        tenant_id: tenantId,
        student_id: dto.studentId,
        batch_id: dto.batchId,
        start_date: startDate,
        end_date: endDate,
        reason: dto.reason,
      },
      include: {
        student: { select: { full_name: true } },
        batch: { select: { name: true } },
      },
    });

    this.logger.log(
      `Leave request created for student ${dto.studentId} in batch ${dto.batchId} (${dto.startDate} to ${dto.endDate})`,
    );

    return this.mapLeaveRequest(leave);
  }

  /**
   * List leave requests with optional status filter.
   */
  async findAll(tenantId: string, status?: LeaveStatus) {
    const leaves = await this.prisma.withTenant(tenantId).leaveRequest.findMany({
      where: status ? { status } : undefined,
      orderBy: { created_at: 'desc' },
      include: {
        student: { select: { full_name: true } },
        batch: { select: { name: true } },
        reviewer: { select: { full_name: true } },
      },
    });

    return leaves.map((l) => this.mapLeaveRequest(l));
  }

  /**
   * Get leave history for a specific student.
   */
  async findByStudent(tenantId: string, studentId: string) {
    const student = await this.prisma.withTenant(tenantId).student.findUnique({
      where: { id: studentId },
    });
    if (!student) {
      throw new NotFoundException(`Student ${studentId} not found`);
    }

    const leaves = await this.prisma.withTenant(tenantId).leaveRequest.findMany({
      where: { student_id: studentId },
      orderBy: { created_at: 'desc' },
      include: {
        student: { select: { full_name: true } },
        batch: { select: { name: true } },
        reviewer: { select: { full_name: true } },
      },
    });

    return leaves.map((l) => this.mapLeaveRequest(l));
  }

  /**
   * Approve or reject a leave request.
   */
  async review(tenantId: string, leaveId: string, reviewerId: string, dto: ReviewLeaveDto) {
    const leave = await this.prisma.withTenant(tenantId).leaveRequest.findUnique({
      where: { id: leaveId },
    });

    if (!leave) {
      throw new NotFoundException(`Leave request ${leaveId} not found`);
    }

    if (leave.status !== LeaveStatus.PENDING) {
      throw new BadRequestException(
        `Leave request has already been ${leave.status.toLowerCase()}`,
      );
    }

    const updated = await this.prisma.withTenant(tenantId).leaveRequest.update({
      where: { id: leaveId },
      data: {
        status: dto.status,
        reviewed_by: reviewerId,
        reviewed_at: new Date(),
      },
      include: {
        student: { select: { full_name: true } },
        batch: { select: { name: true } },
        reviewer: { select: { full_name: true } },
      },
    });

    this.logger.log(
      `Leave request ${leaveId} ${dto.status.toLowerCase()} by user ${reviewerId}`,
    );

    return this.mapLeaveRequest(updated);
  }

  // ─── Internal Helpers ───────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapLeaveRequest(leave: any) {
    return {
      id: leave.id,
      tenantId: leave.tenant_id,
      studentId: leave.student_id,
      batchId: leave.batch_id,
      startDate: leave.start_date.toISOString().split('T')[0],
      endDate: leave.end_date.toISOString().split('T')[0],
      reason: leave.reason,
      status: leave.status,
      reviewedBy: leave.reviewed_by,
      reviewedAt: leave.reviewed_at?.toISOString() ?? null,
      createdAt: leave.created_at.toISOString(),
      updatedAt: leave.updated_at.toISOString(),
      studentName: leave.student?.full_name ?? null,
      batchName: leave.batch?.name ?? null,
      reviewerName: leave.reviewer?.full_name ?? null,
    };
  }
}
