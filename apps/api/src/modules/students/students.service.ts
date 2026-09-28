import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { BatchesService } from '../batches/batches.service';
import { CreateStudentDto, UpdateStudentDto, EnrollStudentBatchDto } from './dto';

@Injectable()
export class StudentsService {
  private readonly logger = new Logger(StudentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly batchesService: BatchesService,
  ) {}

  /**
   * List all students for a tenant with optional search.
   */
  async findAll(tenantId: string, search?: string) {
    const students = await this.prisma.withTenant(tenantId).student.findMany({
      where: search
        ? {
            OR: [
              { full_name: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search } },
              { parent_phone: { contains: search } },
            ],
          }
        : undefined,
      orderBy: { created_at: 'desc' },
      include: {
        batches: {
          include: {
            batch: { select: { id: true, name: true } },
          },
        },
      },
    });

    return students.map((s) => this.mapStudentProfile(s));
  }

  /**
   * Get a single student by ID.
   */
  async findOne(tenantId: string, studentId: string) {
    const student = await this.prisma.withTenant(tenantId).student.findUnique({
      where: { id: studentId },
      include: {
        batches: {
          include: {
            batch: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student ${studentId} not found`);
    }

    return this.mapStudentProfile(student);
  }

  /**
   * Enroll a new student (optionally with batch assignments).
   */
  async create(tenantId: string, dto: CreateStudentDto) {
    // Verify all batch IDs belong to this tenant
    if (dto.batchIds?.length) {
      for (const batchId of dto.batchIds) {
        await this.batchesService.findOrFail(tenantId, batchId);
      }
    }

    const student = await this.prisma.withTenant(tenantId).student.create({
      data: {
        tenant_id: tenantId,
        full_name: dto.fullName,
        phone: dto.phone,
        email: dto.email,
        gender: dto.gender,
        date_of_birth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        address: dto.address,
        parent_name: dto.parentName,
        parent_phone: dto.parentPhone,
        parent_email: dto.parentEmail,
      },
    });

    // Create batch enrollments separately (avoids nested create type issues)
    if (dto.batchIds?.length) {
      await Promise.allSettled(
        dto.batchIds.map((batchId) =>
          this.prisma.withTenant(tenantId).studentBatch.create({
            data: {
              tenant_id: tenantId,
              student_id: student.id,
              batch_id: batchId,
            },
          }),
        ),
      );
    }

    // Re-fetch with batch relations
    const fullStudent = await this.prisma.withTenant(tenantId).student.findUnique({
      where: { id: student.id },
      include: {
        batches: {
          include: {
            batch: { select: { id: true, name: true } },
          },
        },
      },
    });

    this.logger.log(`Created student "${student.full_name}" (${student.id}) for tenant ${tenantId}`);

    return this.mapStudentProfile(fullStudent!);
  }

  /**
   * Update student details.
   */
  async update(tenantId: string, studentId: string, dto: UpdateStudentDto) {
    await this.findOrFail(tenantId, studentId);

    const updated = await this.prisma.withTenant(tenantId).student.update({
      where: { id: studentId },
      data: {
        ...(dto.fullName !== undefined && { full_name: dto.fullName }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.gender !== undefined && { gender: dto.gender }),
        ...(dto.dateOfBirth !== undefined && { date_of_birth: new Date(dto.dateOfBirth) }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.parentName !== undefined && { parent_name: dto.parentName }),
        ...(dto.parentPhone !== undefined && { parent_phone: dto.parentPhone }),
        ...(dto.parentEmail !== undefined && { parent_email: dto.parentEmail }),
        ...(dto.isActive !== undefined && { is_active: dto.isActive }),
      },
      include: {
        batches: {
          include: {
            batch: { select: { id: true, name: true } },
          },
        },
      },
    });

    this.logger.log(`Updated student ${studentId} for tenant ${tenantId}`);

    return this.mapStudentProfile(updated);
  }

  /**
   * Soft-delete a student.
   */
  async softDelete(tenantId: string, studentId: string) {
    await this.findOrFail(tenantId, studentId);

    await this.prisma.withTenant(tenantId).student.update({
      where: { id: studentId },
      data: { is_active: false },
    });

    this.logger.log(`Soft-deleted student ${studentId} for tenant ${tenantId}`);
  }

  /**
   * Assign a student to one or more batches.
   */
  async enrollInBatches(tenantId: string, studentId: string, dto: EnrollStudentBatchDto) {
    await this.findOrFail(tenantId, studentId);

    // Verify all batches belong to this tenant
    for (const batchId of dto.batchIds) {
      await this.batchesService.findOrFail(tenantId, batchId);
    }

    // Create mappings (skip duplicates)
    const results = await Promise.allSettled(
      dto.batchIds.map((batchId) =>
        this.prisma.withTenant(tenantId).studentBatch.create({
          data: {
            tenant_id: tenantId,
            student_id: studentId,
            batch_id: batchId,
          },
        }),
      ),
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    this.logger.log(`Enrolled student ${studentId} into ${successCount} batches`);

    return this.findOne(tenantId, studentId);
  }

  /**
   * Remove a student from a batch.
   */
  async removeFromBatch(tenantId: string, studentId: string, batchId: string) {
    await this.findOrFail(tenantId, studentId);

    const mapping = await this.prisma.withTenant(tenantId).studentBatch.findFirst({
      where: { student_id: studentId, batch_id: batchId },
    });

    if (!mapping) {
      throw new NotFoundException(`Student is not enrolled in batch ${batchId}`);
    }

    await this.prisma.withoutTenant().studentBatch.delete({
      where: { id: mapping.id },
    });

    this.logger.log(`Removed student ${studentId} from batch ${batchId}`);
  }

  // ─── Internal Helpers ───────────────────────────────────

  async findOrFail(tenantId: string, studentId: string) {
    const student = await this.prisma.withTenant(tenantId).student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException(`Student ${studentId} not found`);
    }

    return student;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapStudentProfile(student: any) {
    return {
      id: student.id,
      tenantId: student.tenant_id,
      fullName: student.full_name,
      phone: student.phone,
      email: student.email,
      gender: student.gender,
      dateOfBirth: student.date_of_birth?.toISOString().split('T')[0] ?? null,
      address: student.address,
      parentName: student.parent_name,
      parentPhone: student.parent_phone,
      parentEmail: student.parent_email,
      isActive: student.is_active,
      createdAt: student.created_at.toISOString(),
      updatedAt: student.updated_at.toISOString(),
      batches: student.batches?.map((sb: any) => ({
        id: sb.batch.id,
        name: sb.batch.name,
        enrolledAt: sb.enrolled_at.toISOString(),
      })) ?? [],
    };
  }
}
