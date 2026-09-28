import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { StudentsService } from './students.service';
import { PrismaService } from '../../database/prisma.service';
import { BatchesService } from '../batches/batches.service';

describe('StudentsService', () => {
  let service: StudentsService;
  let prismaService: DeepMockProxy<PrismaService>;
  let batchesService: DeepMockProxy<BatchesService>;

  beforeEach(async () => {
    prismaService = mockDeep<PrismaService>();
    prismaService.withTenant.mockReturnValue(prismaService as any);
    prismaService.withoutTenant.mockReturnValue(prismaService as any);

    batchesService = mockDeep<BatchesService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        { provide: PrismaService, useValue: prismaService },
        { provide: BatchesService, useValue: batchesService },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all students for a tenant', async () => {
      const tenantId = 'tenant-1';
      const mockStudents = [
        {
          id: 'student-1',
          tenant_id: tenantId,
          full_name: 'Aarav Sharma',
          phone: '+919876543210',
          email: null,
          gender: null,
          date_of_birth: null,
          address: null,
          parent_name: 'Rajesh Sharma',
          parent_phone: '+919876543211',
          parent_email: null,
          is_active: true,
          created_at: new Date('2026-01-01'),
          updated_at: new Date('2026-01-01'),
          batches: [],
        },
      ];

      (prismaService.student.findMany as jest.Mock).mockResolvedValue(mockStudents);

      const result = await service.findAll(tenantId);

      expect(result).toHaveLength(1);
      expect(result[0].fullName).toBe('Aarav Sharma');
      expect(result[0].tenantId).toBe(tenantId);
      expect(prismaService.withTenant).toHaveBeenCalledWith(tenantId);
    });

    it('should filter students by search term', async () => {
      const tenantId = 'tenant-1';
      (prismaService.student.findMany as jest.Mock).mockResolvedValue([]);

      await service.findAll(tenantId, 'Aarav');

      expect(prismaService.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        }),
      );
    });
  });

  describe('create', () => {
    it('should create a student for the tenant', async () => {
      const tenantId = 'tenant-1';
      const dto = { fullName: 'Aarav Sharma', parentName: 'Rajesh Sharma' };
      const mockStudent = {
        id: 'student-new',
        tenant_id: tenantId,
        full_name: dto.fullName,
        phone: null,
        email: null,
        gender: null,
        date_of_birth: null,
        address: null,
        parent_name: dto.parentName,
        parent_phone: null,
        parent_email: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (prismaService.student.create as jest.Mock).mockResolvedValue(mockStudent);
      (prismaService.student.findUnique as jest.Mock).mockResolvedValue({
        ...mockStudent,
        batches: [],
      });

      const result = await service.create(tenantId, dto);

      expect(result.fullName).toBe('Aarav Sharma');
      expect(result.tenantId).toBe(tenantId);
    });

    it('should verify batch ownership before enrolling', async () => {
      const tenantId = 'tenant-1';
      const dto = { fullName: 'Test', batchIds: ['batch-from-tenant-2'] };

      batchesService.findOrFail.mockRejectedValue(
        new NotFoundException('Batch not found'),
      );

      await expect(service.create(tenantId, dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOrFail', () => {
    it('should throw NotFoundException when student does not belong to tenant', async () => {
      (prismaService.student.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOrFail('tenant-1', 'student-from-tenant-2')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('softDelete', () => {
    it('should set is_active to false', async () => {
      const tenantId = 'tenant-1';
      const studentId = 'student-1';

      (prismaService.student.findUnique as jest.Mock).mockResolvedValue({
        id: studentId,
        tenant_id: tenantId,
        is_active: true,
      });

      (prismaService.student.update as jest.Mock).mockResolvedValue({});

      await service.softDelete(tenantId, studentId);

      expect(prismaService.student.update).toHaveBeenCalledWith({
        where: { id: studentId },
        data: { is_active: false },
      });
    });
  });
});
