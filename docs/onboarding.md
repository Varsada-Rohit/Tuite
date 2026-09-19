# 🚀 Onboarding & Local Development

## Prerequisites

1. **Node.js** (v20+ LTS recommended, we use v22).
2. **npm** (v10+).
3. **Supabase / PostgreSQL**: We use a cloud-hosted Supabase PostgreSQL instance.
4. **Firebase Project**: Required for SMS OTP authentication.

## Initial Setup

1. **Install Dependencies:**
   From the root of the monorepo, run:
   ```bash
   npm install
   ```

2. **Environment Variables:**
   - Navigate to `apps/api/`.
   - Copy `.env.example` to `.env` (if not already done).
   - Update `DATABASE_URL`, `DIRECT_URL` (for Supabase connection pooling and migrations respectively), and `FIREBASE_PROJECT_ID` with your actual credentials.

3. **Database Migrations & Prisma Client:**
   Ensure your `.env` is correctly pointing to your Supabase instance, then apply the schema and generate the client:
   ```bash
   cd apps/api
   npx prisma migrate dev --name init
   npx prisma generate
   ```

## Running the Apps

Thanks to **Turborepo**, you can run development servers for all apps simultaneously from the root directory:

```bash
# Run all apps in development mode
npm run dev
```

Alternatively, you can run specific apps:
```bash
# Run only the API
npx turbo run dev --filter=@tuite/api

# Run the Admin Web App
npx turbo run dev --filter=@tuite/admin-web
```

---

## 🧪 Testing Setup

Testing is a critical part of the platform:

- **Unit/Integration Tests (Jest):** The API uses Jest for testing. You can run tests via `npm run test` inside `apps/api`.
- **E2E Testing:** E2E tests in NestJS use Supertest. They interact with a dedicated test database to ensure endpoints behave correctly.
- **Turborepo Integration:** Tests can be run across the entire monorepo using `turbo run test`.

*(Note: If you are just starting, ensure you write tests for any new services or controllers in the `api` app. We enforce high coverage for security and auth modules).*

### Running Tests
```bash
# Run tests across all workspaces
npx turbo run test
```
