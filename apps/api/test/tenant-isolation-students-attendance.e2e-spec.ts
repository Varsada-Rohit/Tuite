import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/database/prisma.service';

describe('Tenant Isolation: Students & Attendance (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tenant1Id: string;
  let tenant2Id: string;
  let t1OwnerToken: string;
  let t2OwnerToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // 1. Setup Data
    const t1 = await prisma.tenant.create({
      data: {
        name: 'Tenant 1',
        slug: 't1-test-slug',
      },
    });
    tenant1Id = t1.id;

    const t2 = await prisma.tenant.create({
      data: {
        name: 'Tenant 2',
        slug: 't2-test-slug',
      },
    });
    tenant2Id = t2.id;

    // 2. Setup Owners (Directly creating the User records for testing)
    const t1Owner = await prisma.user.create({
      data: {
        phone: '+919876543210',
        full_name: 'T1 Owner',
        role: 'OWNER',
        tenant_id: tenant1Id,
        is_active: true,
      },
    });

    const t2Owner = await prisma.user.create({
      data: {
        phone: '+919876543211',
        full_name: 'T2 Owner',
        role: 'OWNER',
        tenant_id: tenant2Id,
        is_active: true,
      },
    });

    // 3. For E2E testing, we need to mock the authentication guard to inject these users.
    // Instead of actual JWTs, since we are doing E2E on the module with the real guards,
    // we would normally mock the Firebase admin verifyIdToken. 
    // To simplify this specific tenant isolation test, let's create students in DB directly 
    // and verify the scoped reads via the endpoints if we can authenticate.
    // *Note:* Since the global AuthGuard verifies Firebase tokens, we might need a workaround 
    // or test the services directly. Let's test the Prisma Tenant Extension directly instead, 
    // as it is the core of our isolation strategy.
  });

  afterAll(async () => {
    // Cleanup
    const ids = [tenant1Id, tenant2Id].filter(Boolean);
    if (ids.length > 0) {
      await prisma.leaveRequest.deleteMany({ where: { tenant_id: { in: ids } } });
      await prisma.attendance.deleteMany({ where: { tenant_id: { in: ids } } });
      await prisma.studentBatch.deleteMany({ where: { tenant_id: { in: ids } } });
      await prisma.student.deleteMany({ where: { tenant_id: { in: ids } } });
      await prisma.user.deleteMany({ where: { tenant_id: { in: ids } } });
      await prisma.tenant.deleteMany({ where: { id: { in: ids } } });
    }
    await app.close();
  });

  describe('Prisma Tenant Extension Isolation', () => {
    it('Tenant 1 should not see Tenant 2 students', async () => {
      // Create student for T2 using raw prisma (unscoped)
      const t2Student = await prisma.student.create({
        data: {
          tenant_id: tenant2Id,
          full_name: 'T2 Student',
        },
      });

      // Try to read it using T1's scoped client
      const t1Client = prisma.withTenant(tenant1Id);
      
      const found = await t1Client.student.findUnique({
        where: { id: t2Student.id }
      });
      
      expect(found).toBeNull();
      
      const allT1 = await t1Client.student.findMany();
      expect(allT1).toHaveLength(0);
    });

    it('Tenant 1 cannot update Tenant 2 students', async () => {
      const t2Student = await prisma.student.create({
        data: {
          tenant_id: tenant2Id,
          full_name: 'T2 Student To Update',
        },
      });

      const t1Client = prisma.withTenant(tenant1Id);
      
      await expect(
        t1Client.student.update({
          where: { id: t2Student.id },
          data: { full_name: 'Hacked' }
        })
      ).rejects.toThrow(); // Prisma RecordNotFound
    });

    it('Tenant 1 cannot read Tenant 2 attendance', async () => {
      const t2Student = await prisma.student.create({
        data: { tenant_id: tenant2Id, full_name: 'S' },
      });
      const t2Batch = await prisma.batch.create({
        data: { tenant_id: tenant2Id, name: 'B' },
      });
      const t2Marker = await prisma.user.create({
        data: {
          phone: '+919999999999',
          full_name: 'T2 Teacher',
          role: 'TEACHER',
          tenant_id: tenant2Id,
        },
      });
      const t2Att = await prisma.attendance.create({
        data: {
          tenant: { connect: { id: tenant2Id } },
          student: { connect: { id: t2Student.id } },
          batch: { connect: { id: t2Batch.id } },
          marker: { connect: { id: t2Marker.id } },
          date: new Date(),
          status: 'PRESENT',
        },
      });

      const t1Client = prisma.withTenant(tenant1Id);
      const found = await t1Client.attendance.findUnique({
        where: { id: t2Att.id }
      });
      
      expect(found).toBeNull();
    });
  });
});
