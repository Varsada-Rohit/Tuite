import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { BatchesService } from './batches.service';
import { PrismaService } from '../../database/prisma.service';

describe('BatchesService', () => {
  let service: BatchesService;
  let prismaService: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prismaService = mockDeep<PrismaService>();
    prismaService.withTenant.mockReturnValue(prismaService as any);
    prismaService.withoutTenant.mockReturnValue(prismaService as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BatchesService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<BatchesService>(BatchesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all batches for a tenant', async () => {
      const tenantId = 'tenant-1';
      const mockBatches = [
        {
          id: 'batch-1',
          tenant_id: tenantId,
          name: 'Class 10 Math',
          description: 'Math batch',
          is_active: true,
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
          teachers: [],
        },
      ];

      prismaService.batch.findMany.mockResolvedValue(mockBatches as any);

      const result = await service.findAll(tenantId);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Class 10 Math');
      expect(result[0].tenantId).toBe(tenantId);
      expect(prismaService.withTenant).toHaveBeenCalledWith(tenantId);
    });
  });

  describe('create', () => {
    it('should create a batch for the tenant', async () => {
      const tenantId = 'tenant-1';
      const dto = { name: 'Class 10 Science', description: 'Science batch' };
      const mockBatch = {
        id: 'batch-new',
        tenant_id: tenantId,
        name: dto.name,
        description: dto.description,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      prismaService.batch.create.mockResolvedValue(mockBatch as any);

      const result = await service.create(tenantId, dto);

      expect(result.name).toBe('Class 10 Science');
      expect(result.tenantId).toBe(tenantId);
    });
  });

  describe('softDelete', () => {
    it('should set is_active to false', async () => {
      const tenantId = 'tenant-1';
      const batchId = 'batch-1';

      prismaService.batch.findUnique.mockResolvedValue({
        id: batchId,
        tenant_id: tenantId,
        is_active: true,
      } as any);

      prismaService.batch.update.mockResolvedValue({} as any);

      await service.softDelete(tenantId, batchId);

      expect(prismaService.batch.update).toHaveBeenCalledWith({
        where: { id: batchId },
        data: { is_active: false },
      });
    });

    it('should throw NotFoundException for non-existent batch', async () => {
      prismaService.batch.findUnique.mockResolvedValue(null);

      await expect(service.softDelete('tenant-1', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findOrFail', () => {
    it('should throw NotFoundException when batch does not belong to tenant', async () => {
      prismaService.batch.findUnique.mockResolvedValue(null);

      await expect(service.findOrFail('tenant-1', 'batch-from-tenant-2')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
