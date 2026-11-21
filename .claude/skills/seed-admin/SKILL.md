---
name: seed-admin
description: Seed the Tuite database with the global Super Admin user using the existing apps/api/prisma/seed.ts. Use when asked to seed the admin, create the super admin, or seed the database after a fresh clone or DB reset.
---

# Seed the Super Admin

Seeds the global Super Admin (`tenant_id = null`, role `SUPER_ADMIN`) via the existing script `apps/api/prisma/seed.ts`. The script is an idempotent upsert on a fixed id (`00000000-0000-0000-0000-000000000001`), so re-running is safe. Do not write a new seed script; use this one.

## Steps

1. Confirm `apps/api/.env` exists with real `DATABASE_URL` and `DIRECT_URL`. If missing, copy `apps/api/.env.example` to `apps/api/.env` and ask the user to fill in credentials. Never print connection strings; mask passwords if you must show them.
2. Make sure the schema is applied and the client generated (from `apps/api`):
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```
3. Run the seed (from `apps/api`):
   ```bash
   npm run db:seed
   ```
   Expect `Created Super Admin: Super Admin (Phone: ...)` and `Seeding completed successfully!`.

## Notes

- Login is Firebase SMS OTP, so the seeded phone must be the number the user signs in with. The script ships with the placeholder `+919876543210` (see the "Change this" comment in `seed.ts`). The upsert uses `update: {}`, so re-running does **not** change an already-seeded phone; to change it, edit the user row in the DB or edit `seed.ts` and delete the existing user first. Ask the user before changing the phone.
- If the seed fails with `Can't reach database server`, check the host in `DATABASE_URL` resolves from this machine (VPN, corporate network, paused Neon/Supabase project) before touching code.
- Run from `apps/api`: the script loads `.env` from there.
