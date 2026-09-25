import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateBatchDto, UpdateBatchDto } from './dto';

@Injectable()
export class BatchesService {
  private readonly logger = new Logger(BatchesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * List all batches for a tenant (including inactive ones for admin view).
   */
  async findAll(tenantId: string) {
    const batches = await this.prisma.withTenant(tenantId).batch.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        teachers: {
          include: {
            user: {
              select: { id: true, full_name: true, phone: true },
            },
          },
        },
      },
    });

    return batches.map((batch) => ({
      id: batch.id,
      tenantId: batch.tenant_id,
      name: batch.name,
      description: batch.description,
      isActive: batch.is_active,
      createdAt: batch.created_at.toISOString(),
      updatedAt: batch.updated_at.toISOString(),
      teacherCount: batch.teachers.length,
      teachers: batch.teachers.map((tb) => ({
        id: tb.user.id,
        fullName: tb.user.full_name,
        phone: tb.user.phone,
      })),
    }));
  }

  /**
   * Create a new batch within the tenant.
   */
  async create(tenantId: string, dto: CreateBatchDto) {
    const batch = await this.prisma.withTenant(tenantId).batch.create({
      data: {
        tenant_id: tenantId,
        name: dto.name,
        description: dto.description,
      },
    });

    this.logger.log(`Created batch "${batch.name}" (${batch.id}) for tenant ${tenantId}`);

    return {
      id: batch.id,
      tenantId: batch.tenant_id,
      name: batch.name,
      description: batch.description,
      isActive: batch.is_active,
      createdAt: batch.created_at.toISOString(),
      updatedAt: batch.updated_at.toISOString(),
    };
  }

  /**
   * Update a batch (name, description, active status).
   * Soft delete is handled by setting isActive = false.
   */
  async update(tenantId: string, batchId: string, dto: UpdateBatchDto) {
    await this.findOrFail(tenantId, batchId);

    const updated = await this.prisma.withTenant(tenantId).batch.update({
      where: { id: batchId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isActive !== undefined && { is_active: dto.isActive }),
      },
    });

    this.logger.log(`Updated batch ${batchId} for tenant ${tenantId}`);

    return {
      id: updated.id,
      tenantId: updated.tenant_id,
      name: updated.name,
      description: updated.description,
      isActive: updated.is_active,
      createdAt: updated.created_at.toISOString(),
      updatedAt: updated.updated_at.toISOString(),
    };
  }

  /**
   * Soft-delete a batch by setting is_active = false.
   */
  async softDelete(tenantId: string, batchId: string) {
    await this.findOrFail(tenantId, batchId);

    await this.prisma.withTenant(tenantId).batch.update({
      where: { id: batchId },
      data: { is_active: false },
    });

    this.logger.log(`Soft-deleted batch ${batchId} for tenant ${tenantId}`);
  }

  // ─── Internal Helpers ───────────────────────────────────

  /**
   * Verify a batch exists and belongs to the tenant.
   * Used internally and by StaffService to validate batch ownership.
   */
  async findOrFail(tenantId: string, batchId: string) {
    const batch = await this.prisma.withTenant(tenantId).batch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new NotFoundException(`Batch ${batchId} not found`);
    }

    return batch;
  }
}
