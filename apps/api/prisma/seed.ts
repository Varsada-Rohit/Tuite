import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create the global Super Admin (no tenant affiliation)
  const superAdmin = await prisma.user.upsert({
    where: {
      // Use a deterministic lookup — Super Admin phone with null tenant.
      // Since the unique constraint is (tenant_id, phone) and tenant_id is null,
      // we use the raw findFirst + create pattern below.
      id: '00000000-0000-0000-0000-000000000001',
    },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      tenant_id: null,
      phone: '+919876543210', // Change this to your actual phone number
      full_name: 'Super Admin',
      role: Role.SUPER_ADMIN,
    },
  });

  console.log(`Created Super Admin: ${superAdmin.full_name} (Phone: ${superAdmin.phone})`);
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
