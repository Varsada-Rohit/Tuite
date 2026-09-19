import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { TenantsService } from './tenants.service';
import { PrismaService } from '../../database/prisma.service';

describe('TenantsService', () => {
  let service: TenantsService;
  let prismaService: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    // Mock the PrismaService using jest-mock-extended
    prismaService = mockDeep<PrismaService>();
    prismaService.withoutTenant.mockReturnValue(prismaService as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('resolveBySlug', () => {
    it('should return a tenant profile when given a valid and active slug', async () => {
      const mockTenant = {
        id: 'tenant-123',
        name: 'Test Academy',
        slug: 'test-academy',
        logo_url: null,
        primary_color: '#000000',
        secondary_color: '#ffffff',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      prismaService.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await service.resolveBySlug('test-academy');

      expect(result).toEqual({
        id: mockTenant.id,
        name: mockTenant.name,
        slug: mockTenant.slug,
        logoUrl: mockTenant.logo_url,
        primaryColor: mockTenant.primary_color,
        secondaryColor: mockTenant.secondary_color,
      });

      expect(prismaService.tenant.findUnique).toHaveBeenCalledWith({
        where: { slug: 'test-academy' },
        select: {
          id: true,
          name: true,
          slug: true,
          logo_url: true,
          primary_color: true,
          secondary_color: true,
          is_active: true,
        },
      });
    });

    it('should throw NotFoundException if tenant does not exist', async () => {
      prismaService.tenant.findUnique.mockResolvedValue(null);

      await expect(service.resolveBySlug('invalid-slug')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if tenant exists but is inactive', async () => {
      const mockTenant = {
        id: 'tenant-123',
        name: 'Test Academy',
        slug: 'test-academy',
        logo_url: null,
        primary_color: '#000000',
        secondary_color: '#ffffff',
        is_active: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      prismaService.tenant.findUnique.mockResolvedValue(mockTenant);

      await expect(service.resolveBySlug('test-academy')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a new tenant if slug is unique', async () => {
      const dto = {
        name: 'New Academy',
        slug: 'new-academy',
        primaryColor: '#111111',
        secondaryColor: '#222222',
      };

      const mockTenant = {
        id: 'tenant-new',
        name: dto.name,
        slug: dto.slug,
        logo_url: null,
        primary_color: dto.primaryColor,
        secondary_color: dto.secondaryColor,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Ensure slug check returns null (meaning it does not exist)
      prismaService.tenant.findUnique.mockResolvedValue(null);
      // Mock the create action
      prismaService.tenant.create.mockResolvedValue(mockTenant as any);

      const result = await service.create(dto);

      expect(result).toEqual(mockTenant);
      expect(prismaService.tenant.findUnique).toHaveBeenCalledWith({
        where: { slug: dto.slug },
      });
      expect(prismaService.tenant.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if slug already exists', async () => {
      const dto = {
        name: 'Existing Academy',
        slug: 'existing-academy',
      };

      // Mock finding an existing tenant
      prismaService.tenant.findUnique.mockResolvedValue({ id: 'existing' } as any);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      expect(prismaService.tenant.create).not.toHaveBeenCalled();
    });
  });
});
