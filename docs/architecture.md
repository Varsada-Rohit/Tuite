# 🏗️ Final Decided Tech Stack & Architecture

Based on the requirements outlined in the "Tuition Management App" PRD, the following is the finalized technology stack chosen to support the multi-tenant architecture, role-based access control, and dynamic UI elements.

## 1. Frontend Architecture (Mobile & Web)
- **Mobile App Framework: React Native (Expo).** Chosen to fulfill the mobile-first design requirement for Teachers, Students, and Parents, enabling cross-platform deployment from a single codebase.
- **Web Framework: React (Next.js).** Selected for the Super Admin and Tuition Owner web dashboards to seamlessly handle dynamic rendering and white-labeling (custom logos, primary/secondary theme colors) based on the tenant workspace.
- **Feature Flagging System:** Integrated on the frontend to dynamically hide tabs, buttons, and menus when specific modules (e.g., Video Lectures, Notes) are toggled off by the Super Admin.

## 2. Backend Architecture
- **Server Framework:** Node.js with NestJS (TypeScript).
- **API Security & Multi-Tenancy:** The backend implements strict tenant-ID verification via global guards on every API endpoint to prevent cross-tenant data leaks and enforce strict data isolation.
- **Role-Based Access Control (RBAC):** TypeScript ensures type-safe handling of multiple user roles, including Super Admin, Tuition Owner, Teacher, Student, and Parent permissions.

## 3. Database Strategy
- **Primary Database:** PostgreSQL.
- **Multi-Tenant Isolation:** Leverages PostgreSQL's Row-Level Security (RLS) / Prisma Client Extensions to ensure that a center can only query and access its own students, staff, and records.

## 4. Cloud Services & Third-Party Integrations
- **Push Notifications:** Firebase Cloud Messaging (FCM) for real-time alerts on attendance, fees, and notices.
- **Cloud Storage:** AWS S3 / Google Cloud Storage serving as the repository for study materials (PDFs, PPTs, Docs).
- **Video Delivery:** Embedded YouTube or Vimeo (Unlisted) integrations to handle video lectures without direct raw video hosting to minimize server costs.

## 5. Phase 2 (Future) Integrations
- **Payment Gateways:** Stripe, Razorpay, or UPI for in-app fee payments.
- **Live Classes:** Zoom or Google Meet API for one-click live session joining.

---

## 🔒 Security Best Practices

When contributing to this codebase, adhere to the following strict security and multi-tenancy rules:

- **Never bypass the `TenantGuard`.** All tenant-scoped entities must be queried with the active `tenantId`.
- **Use the Scoped Prisma Client.** Always use `this.prisma.withTenant(tenantId)` in feature services to ensure queries are automatically scoped and prevent cross-tenant data leaks.
- **Never Use Nested Writes.** The Prisma `$allOperations` extension does **not** intercept nested writes (e.g., `user.create({ data: { refresh_tokens: { create: {...} } } })`). Always execute creates/updates as separate top-level operations (inside a `$transaction` if atomicity is required) to ensure `tenant_id` is properly injected.
- **Never commit secrets.** Use `.env` files and ensure they are ignored in `.gitignore`.
- **Token Security:** Access tokens are short-lived (15m). Refresh tokens are long-lived (7d) and stored as SHA-256 hashes in the database.
