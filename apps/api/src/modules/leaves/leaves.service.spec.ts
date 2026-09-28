import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { LeavesService } from './leaves.service';
import { PrismaService } from '../../database/prisma.service';

describe('LeavesService', () => {
  let service: LeavesService;
  let prismaService: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prismaService = mockDeep<PrismaService>();
    prismaService.withTenant.mockReturnValue(prismaService as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeavesService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<LeavesService>(LeavesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should reject when endDate is before startDate', async () => {
      const dto = {
        studentId: 'student-1',
        batchId: 'batch-1',
        startDate: '2026-10-05',
        endDate: '2026-10-01',
        reason: 'Test',
      };

      await expect(service.create('tenant-1', dto)).rejects.toThrow(BadRequestException);
    });

    it('should reject when student does not belong to tenant', async () => {
      const dto = {
        studentId: 'student-from-other-tenant',
        batchId: 'batch-1',
        startDate: '2026-10-01',
        endDate: '2026-10-03',
        reason: 'Test',
      };

      (prismaService.student.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.create('tenant-1', dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('review', () => {
    it('should reject reviewing an already-reviewed leave', async () => {
      const leaveId = 'leave-1';
      (prismaService.leaveRequest.findUnique as jest.Mock).mockResolvedValue({
        id: leaveId,
        status: 'APPROVED',
      });

      await expect(
        service.review('tenant-1', leaveId, 'user-1', { status: 'REJECTED' as any }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject when leave is not found', async () => {
      (prismaService.leaveRequest.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.review('tenant-1', 'nonexistent', 'user-1', { status: 'APPROVED' as any }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should approve a pending leave request', async () => {
      const leaveId = 'leave-1';
      (prismaService.leaveRequest.findUnique as jest.Mock).mockResolvedValue({
        id: leaveId,
        status: 'PENDING',
      });

      const mockUpdated = {
        id: leaveId,
        tenant_id: 'tenant-1',
        student_id: 'student-1',
        batch_id: 'batch-1',
        start_date: new Date('2026-10-01'),
        end_date: new Date('2026-10-03'),
        reason: 'Family event',
        status: 'APPROVED',
        reviewed_by: 'user-1',
        reviewed_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        student: { full_name: 'Aarav' },
        batch: { name: 'Math 10' },
        reviewer: { full_name: 'Teacher' },
      };
      (prismaService.leaveRequest.update as jest.Mock).mockResolvedValue(mockUpdated);

      const result = await service.review('tenant-1', leaveId, 'user-1', { status: 'APPROVED' as any });

      expect(result.status).toBe('APPROVED');
      expect(result.reviewedBy).toBe('user-1');
    });
  });
});
