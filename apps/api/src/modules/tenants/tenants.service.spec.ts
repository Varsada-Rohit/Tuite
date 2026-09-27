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
        contact_email: 'test@academy.com',
        contact_phone: '+919876543210',
        address: '123 Main St',
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
        contactEmail: mockTenant.contact_email,
        contactPhone: mockTenant.contact_phone,
        address: mockTenant.address,
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
          contact_email: true,
          contact_phone: true,
          address: true,
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

    it('should pass contactEmail and contactPhone to Prisma when provided', async () => {
      const dto = {
        name: 'Contact Academy',
        slug: 'contact-academy',
        contactEmail: 'admin@contact.com',
        contactPhone: '+919876543210',
      };

      prismaService.tenant.findUnique.mockResolvedValue(null);
      prismaService.tenant.create.mockResolvedValue({ id: 'tenant-contact' } as any);

      await service.create(dto);

      expect(prismaService.tenant.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            contact_email: 'admin@contact.com',
            contact_phone: '+919876543210',
          }),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return all tenants with camelCase mapping', async () => {
      const now = new Date();
      const mockTenants = [
        {
          id: 'tenant-1',
          name: 'Academy One',
          slug: 'academy-one',
          logo_url: 'https://example.com/logo1.png',
          primary_color: '#111111',
          secondary_color: '#222222',
          contact_email: 'one@example.com',
          contact_phone: '+911111111111',
          address: '1 Main St',
          is_active: true,
          created_at: now,
          updated_at: now,
          feature_flags: [],
        },
        {
          id: 'tenant-2',
          name: 'Academy Two',
          slug: 'academy-two',
          logo_url: null,
          primary_color: '#333333',
          secondary_color: '#444444',
          contact_email: null,
          contact_phone: null,
          address: null,
          is_active: false,
          created_at: now,
          updated_at: now,
          feature_flags: [],
        },
      ];

      prismaService.tenant.findMany.mockResolvedValue(mockTenants as any);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'tenant-1',
        name: 'Academy One',
        slug: 'academy-one',
        logoUrl: 'https://example.com/logo1.png',
        primaryColor: '#111111',
        secondaryColor: '#222222',
        contactEmail: 'one@example.com',
        contactPhone: '+911111111111',
        address: '1 Main St',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      expect(result[1].isActive).toBe(false);
      expect(result[1].contactEmail).toBeNull();
    });

    it('should return empty array when no tenants exist', async () => {
      prismaService.tenant.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });

    it('should order tenants by created_at desc', async () => {
      prismaService.tenant.findMany.mockResolvedValue([]);

      await service.findAll();

      expect(prismaService.tenant.findMany).toHaveBeenCalledWith({
        orderBy: { created_at: 'desc' },
        include: { feature_flags: true },
      });
    });
  });
});
