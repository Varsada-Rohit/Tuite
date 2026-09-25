import {
  Injectable,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Role } from '@tuite/shared-types';
import { PrismaService } from '../../database/prisma.service';
import { BatchesService } from '../batches/batches.service';
import { InviteStaffDto } from './dto';

@Injectable()
export class StaffService {
  private readonly logger = new Logger(StaffService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly batchesService: BatchesService,
  ) {}

  /**
   * List all teachers for a tenant with their batch assignments.
   */
  async findAll(tenantId: string) {
    const teachers = await this.prisma.withTenant(tenantId).user.findMany({
      where: { role: Role.TEACHER },
      orderBy: { created_at: 'desc' },
      include: {
        teacher_batches: {
          include: {
            batch: {
              select: { id: true, name: true, is_active: true },
            },
          },
        },
      },
    });

    return teachers.map((teacher) => ({
      id: teacher.id,
      tenantId: teacher.tenant_id,
      phone: teacher.phone,
      fullName: teacher.full_name,
      role: teacher.role,
      isActive: teacher.is_active,
      batches: teacher.teacher_batches.map((tb) => ({
        id: tb.batch.id,
        name: tb.batch.name,
        isActive: tb.batch.is_active,
      })),
    }));
  }

  /**
   * Invite a teacher by phone number and assign to batches.
   *
   * Security invariants:
   * 1. Every batchId must belong to the SAME tenant (cross-tenant leak prevention).
   * 2. If a user already exists with a different role, reject with ConflictException.
   * 3. If a user already exists as TEACHER, skip creation and just add new batch mappings.
   */
  async invite(tenantId: string, dto: InviteStaffDto) {
    // 1. Verify ALL batches belong to this tenant
    for (const batchId of dto.batchIds) {
      try {
        await this.batchesService.findOrFail(tenantId, batchId);
      } catch {
        throw new ForbiddenException(
          `Batch ${batchId} does not belong to this tenant`,
        );
      }
    }

    // 2. Find or create the teacher user
    let user = await this.prisma.withTenant(tenantId).user.findFirst({
      where: { phone: dto.phone },
    });

    if (user) {
      // User exists — check role conflict
      if (user.role !== Role.TEACHER) {
        throw new ConflictException(
          `A user with phone ${dto.phone} already exists with role ${user.role}. ` +
          `Cannot invite as TEACHER.`,
        );
      }
      this.logger.log(`Teacher ${user.id} already exists, adding batch mappings`);
    } else {
      // Create new teacher user
      user = await this.prisma.withTenant(tenantId).user.create({
        data: {
          phone: dto.phone,
          full_name: dto.fullName,
          role: Role.TEACHER,
        },
      });
      this.logger.log(`Created teacher user ${user.id} for tenant ${tenantId}`);
    }

    // 3. Create batch mappings (skip duplicates gracefully)
    const mappingResults = await Promise.allSettled(
      dto.batchIds.map((batchId) =>
        this.prisma.withoutTenant().teacherBatch.create({
          data: {
            user_id: user!.id,
            batch_id: batchId,
          },
        }),
      ),
    );

    const successCount = mappingResults.filter((r) => r.status === 'fulfilled').length;
    const skippedCount = mappingResults.filter((r) => r.status === 'rejected').length;

    this.logger.log(
      `Assigned teacher ${user.id} to ${successCount} batches (${skippedCount} already existed)`,
    );

    // 4. Return the teacher profile with batch assignments
    const fullTeacher = await this.prisma.withTenant(tenantId).user.findUnique({
      where: { id: user.id },
      include: {
        teacher_batches: {
          include: {
            batch: { select: { id: true, name: true } },
          },
        },
      },
    });

    return {
      id: fullTeacher!.id,
      tenantId: fullTeacher!.tenant_id,
      phone: fullTeacher!.phone,
      fullName: fullTeacher!.full_name,
      role: fullTeacher!.role,
      isActive: fullTeacher!.is_active,
      batches: fullTeacher!.teacher_batches.map((tb) => ({
        id: tb.batch.id,
        name: tb.batch.name,
      })),
    };
  }
}
