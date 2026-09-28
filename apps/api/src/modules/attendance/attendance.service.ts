import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { BatchesService } from '../batches/batches.service';
import { SubmitAttendanceDto } from './dto';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly batchesService: BatchesService,
  ) {}

  /**
   * Submit daily attendance for a batch.
   * Uses upsert to allow corrections (re-submission overwrites).
   */
  async submit(tenantId: string, userId: string, dto: SubmitAttendanceDto) {
    // Verify the batch belongs to this tenant
    await this.batchesService.findOrFail(tenantId, dto.batchId);

    const dateObj = new Date(dto.date);

    // Upsert each entry — allows correcting previously submitted attendance
    const results = await Promise.all(
      dto.entries.map((entry) =>
        this.prisma.withTenant(tenantId).attendance.upsert({
          where: {
            batch_id_student_id_date: {
              batch_id: dto.batchId,
              student_id: entry.studentId,
              date: dateObj,
            },
          },
          create: {
            tenant_id: tenantId,
            batch_id: dto.batchId,
            student_id: entry.studentId,
            date: dateObj,
            status: entry.status,
            marked_by: userId,
          },
          update: {
            status: entry.status,
            marked_by: userId,
          },
        }),
      ),
    );

    this.logger.log(
      `Attendance submitted for batch ${dto.batchId} on ${dto.date}: ${results.length} entries by user ${userId}`,
    );

    return {
      batchId: dto.batchId,
      date: dto.date,
      entriesCount: results.length,
      entries: results.map((r) => ({
        id: r.id,
        studentId: r.student_id,
        status: r.status,
      })),
    };
  }

  /**
   * Get attendance records for a batch on a specific date.
   */
  async getByBatchAndDate(tenantId: string, batchId: string, date: string) {
    await this.batchesService.findOrFail(tenantId, batchId);

    const records = await this.prisma.withTenant(tenantId).attendance.findMany({
      where: {
        batch_id: batchId,
        date: new Date(date),
      },
      include: {
        student: { select: { id: true, full_name: true } },
      },
      orderBy: { student: { full_name: 'asc' } },
    });

    return records.map((r) => ({
      id: r.id,
      tenantId: r.tenant_id,
      batchId: r.batch_id,
      studentId: r.student_id,
      studentName: r.student.full_name,
      date: r.date.toISOString().split('T')[0],
      status: r.status,
      markedBy: r.marked_by,
      createdAt: r.created_at.toISOString(),
    }));
  }

  /**
   * Get monthly attendance summary for a student across all batches.
   */
  async getStudentSummary(tenantId: string, studentId: string, month?: string, year?: string) {
    // Verify student exists in this tenant
    const student = await this.prisma.withTenant(tenantId).student.findUnique({
      where: { id: studentId },
    });
    if (!student) {
      throw new NotFoundException(`Student ${studentId} not found`);
    }

    const now = new Date();
    const targetMonth = month ? parseInt(month, 10) : now.getMonth() + 1;
    const targetYear = year ? parseInt(year, 10) : now.getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);

    const records = await this.prisma.withTenant(tenantId).attendance.findMany({
      where: {
        student_id: studentId,
        date: { gte: startDate, lte: endDate },
      },
    });

    const totalDays = records.length;
    const presentDays = records.filter((r) => r.status === 'PRESENT').length;
    const absentDays = records.filter((r) => r.status === 'ABSENT').length;
    const lateDays = records.filter((r) => r.status === 'LATE').length;

    return {
      studentId,
      studentName: student.full_name,
      month: targetMonth,
      year: targetYear,
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      percentage: totalDays > 0 ? Math.round(((presentDays + lateDays) / totalDays) * 100) : 0,
    };
  }

  /**
   * Get batch-level attendance summary (analytics).
   */
  async getBatchSummary(tenantId: string, batchId: string, month?: string, year?: string) {
    await this.batchesService.findOrFail(tenantId, batchId);

    const now = new Date();
    const targetMonth = month ? parseInt(month, 10) : now.getMonth() + 1;
    const targetYear = year ? parseInt(year, 10) : now.getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);

    // Get all students enrolled in this batch
    const enrollments = await this.prisma.withTenant(tenantId).studentBatch.findMany({
      where: { batch_id: batchId },
      include: {
        student: { select: { id: true, full_name: true } },
      },
    });

    // Get attendance records for the month
    const records = await this.prisma.withTenant(tenantId).attendance.findMany({
      where: {
        batch_id: batchId,
        date: { gte: startDate, lte: endDate },
      },
    });

    // Build per-student summaries
    const studentSummaries = enrollments.map((enrollment) => {
      const studentRecords = records.filter((r) => r.student_id === enrollment.student_id);
      const total = studentRecords.length;
      const present = studentRecords.filter((r) => r.status === 'PRESENT').length;
      const absent = studentRecords.filter((r) => r.status === 'ABSENT').length;
      const late = studentRecords.filter((r) => r.status === 'LATE').length;

      return {
        studentId: enrollment.student_id,
        studentName: enrollment.student.full_name,
        totalDays: total,
        presentDays: present,
        absentDays: absent,
        lateDays: late,
        percentage: total > 0 ? Math.round(((present + late) / total) * 100) : 0,
      };
    });

    // Flag students below 75% attendance
    const lowAttendance = studentSummaries.filter((s) => s.totalDays > 0 && s.percentage < 75);

    return {
      batchId,
      month: targetMonth,
      year: targetYear,
      students: studentSummaries,
      lowAttendanceStudents: lowAttendance,
    };
  }
}
