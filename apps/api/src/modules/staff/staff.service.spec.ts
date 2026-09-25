import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, ConflictException } from '@nestjs/common';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { StaffService } from './staff.service';
import { BatchesService } from '../batches/batches.service';
import { PrismaService } from '../../database/prisma.service';
import { Role } from '@tuite/shared-types';

describe('StaffService', () => {
  let service: StaffService;
  let prismaService: DeepMockProxy<PrismaService>;
  let batchesService: DeepMockProxy<BatchesService>;

  beforeEach(async () => {
    prismaService = mockDeep<PrismaService>();
    prismaService.withTenant.mockReturnValue(prismaService as any);
    prismaService.withoutTenant.mockReturnValue(prismaService as any);

    batchesService = mockDeep<BatchesService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StaffService,
        { provide: PrismaService, useValue: prismaService },
        { provide: BatchesService, useValue: batchesService },
      ],
    }).compile();

    service = module.get<StaffService>(StaffService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('invite', () => {
    const tenantA = 'tenant-a';
    const tenantB = 'tenant-b';

    it('should reject when a batchId belongs to a different tenant', async () => {
      const dto = {
        phone: '+919876543210',
        fullName: 'Test Teacher',
        batchIds: ['batch-from-tenant-b'],
      };

      // Simulate: batch not found for Tenant A (because it belongs to Tenant B)
      batchesService.findOrFail.mockRejectedValueOnce(
        new Error('Batch batch-from-tenant-b not found'),
      );

      await expect(service.invite(tenantA, dto)).rejects.toThrow(ForbiddenException);
    });

    it('should reject when user exists with a different role', async () => {
      const dto = {
        phone: '+919876543210',
        batchIds: ['batch-1'],
      };

      // Batch belongs to the tenant
      batchesService.findOrFail.mockResolvedValueOnce({} as any);

      // User exists as STUDENT
      prismaService.user.findFirst.mockResolvedValueOnce({
        id: 'user-1',
        tenant_id: tenantA,
        phone: dto.phone,
        role: Role.STUDENT,
        is_active: true,
      } as any);

      await expect(service.invite(tenantA, dto)).rejects.toThrow(ConflictException);
    });

    it('should successfully invite a new teacher and assign batches', async () => {
      const dto = {
        phone: '+919876543210',
        fullName: 'New Teacher',
        batchIds: ['batch-1', 'batch-2'],
      };

      // Both batches belong to the tenant
      batchesService.findOrFail.mockResolvedValue({} as any);

      // No existing user
      prismaService.user.findFirst.mockResolvedValueOnce(null);

      // Create user
      const createdUser = {
        id: 'user-new',
        tenant_id: tenantA,
        phone: dto.phone,
        full_name: dto.fullName,
        role: Role.TEACHER,
        is_active: true,
      };
      prismaService.user.create.mockResolvedValueOnce(createdUser as any);

      // Create batch mappings
      prismaService.teacherBatch.create.mockResolvedValue({} as any);

      // Final fetch
      prismaService.user.findUnique.mockResolvedValueOnce({
        ...createdUser,
        teacher_batches: [
          { batch: { id: 'batch-1', name: 'Math' } },
          { batch: { id: 'batch-2', name: 'Science' } },
        ],
      } as any);

      const result = await service.invite(tenantA, dto);

      expect(result.phone).toBe(dto.phone);
      expect(result.batches).toHaveLength(2);
      expect(prismaService.user.create).toHaveBeenCalled();
    });

    it('should add batch mappings for an existing teacher', async () => {
      const dto = {
        phone: '+919876543210',
        batchIds: ['batch-3'],
      };

      batchesService.findOrFail.mockResolvedValue({} as any);

      // Existing teacher
      prismaService.user.findFirst.mockResolvedValueOnce({
        id: 'existing-teacher',
        tenant_id: tenantA,
        phone: dto.phone,
        role: Role.TEACHER,
        is_active: true,
      } as any);

      prismaService.teacherBatch.create.mockResolvedValue({} as any);

      prismaService.user.findUnique.mockResolvedValueOnce({
        id: 'existing-teacher',
        tenant_id: tenantA,
        phone: dto.phone,
        full_name: null,
        role: Role.TEACHER,
        is_active: true,
        teacher_batches: [{ batch: { id: 'batch-3', name: 'English' } }],
      } as any);

      const result = await service.invite(tenantA, dto);

      expect(result.batches).toHaveLength(1);
      // User.create should NOT have been called (teacher already exists)
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });
  });
});
