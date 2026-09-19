# 🗺️ Software Development Roadmap

## Phase 1: Platform Foundation, Multi-Tenancy & RBAC
This phase establishes data isolation, core user authentication, and administrative controls across tenants.
- **Database & Tenancy Architecture:**
  - Implement a shared-database, isolated-schema or shared-table model with a mandatory tenant_id column across all relational tables.
  - Enforce middleware-level query scoping ensuring every query filters automatically by tenant_id.
  - Build API middleware to extract and validate tenant_id from JWT claims on every incoming request.
- **Role-Based Access Control (RBAC):**
  - Define core roles: Super Admin, Tuition Owner, Teacher, Student, and Parent.
  - Implement token-based authentication (e.g., JWT) with role verification guards for API endpoints.
- **Super Admin Control & Feature Flags:**
  - Create Super Admin endpoints to provision, activate, or disable tenant accounts.
  - Implement a feature flag module allowing the Super Admin to toggle specific services (Notes, Video Lectures, Online Tests) per tenant.
  - Set up Super Admin app-level billing controls for subscription tier management.

## Phase 2: Tenant White-Labeling & Administration Setup
This phase enables tuition centers to customize their branding and configure operational hierarchies.
- **White-Labeling & Dynamic Theming:**
  - Build the Institute Profile dashboard for tuition owners to upload custom logos and define primary/secondary hex color codes.
  - Implement dynamic client-side CSS variable injection or theme provider wrapping so login pages, navigation bars, and buttons reflect tenant branding automatically upon resolution.
  - Store tenant contact info, physical address, and metadata in the tenant profile table.
- **Batch & Staff Management:**
  - Create CRUD APIs and administrative UI for batches (e.g., "Class 10 Math").
  - Build the staff invitation workflow allowing Tuition Owners to add teachers via email/phone and map them to designated batches.
  - Enforce UI-level feature hiding based on active feature flags returned in the tenant configuration payload.

## Phase 3: Student Roster & Attendance Management
This phase digitizes daily classroom operations, student enrollment, and attendance records.
- **Student Data Management:**
  - Implement the Student Roster database capturing full student profiles, parent contact details, and multiple batch assignments.
  - Build management interfaces for tuition owners and teachers to enroll, update, and search student profiles.
- **Attendance Logging Interface:**
  - Develop a mobile-responsive batch attendance view with quick toggle/checkbox actions for daily presence, absence, and late marks.
  - Build backend validation preventing duplicate attendance logs for the same batch and date.
- **Leave Management & Analytics:**
  - Create a portal for students and parents to submit leave applications with dates and reasons.
  - Develop review screens for teachers and owners to approve or reject leave requests.
  - Set up background aggregation routines or database views to calculate monthly attendance percentages and flag students below defined attendance thresholds.

## Phase 4: Academic Content Delivery & Communication
This phase delivers educational content and class-wide communication without incurring direct video streaming costs.
- **Study Materials (Notes):**
  - Integrate cloud object storage (e.g., AWS S3, Google Cloud Storage) with signed URL generation for secure file uploads and downloads.
  - Support PDF, PPT, and DOC formats organized hierarchically by batch and subject.
  - Restrict access permissions so students can only download files mapped to their enrolled batches.
- **Video Lectures:**
  - Create a metadata repository storing unlisted YouTube and Vimeo URLs alongside titles, descriptions, and batch tags.
  - Embed a responsive, sandboxed video player on mobile and web client interfaces, strictly avoiding direct raw video hosting to minimize bandwidth and storage overhead.
- **Notice Board:**
  - Build an announcement engine for publishing notices targeted to specific batches or broadcast institute-wide.
  - Display a chronological feed of notices on the student, parent, and teacher home dashboards.

## Phase 5: Financial Ledger & Offline Billing
This phase tracks institute revenue, logs manual fee collections, and issues verifiable receipts.
- **Fee Structure Definition:**
  - Create schema models and configuration interfaces for one-time and recurring fee schedules (monthly, quarterly, annual) mapped per batch.
  - Generate individual student billing schedules based on enrolled batch fee templates.
- **Payment Logging & Receipt Generation:**
  - Develop the manual payment entry portal for cash, check, and offline bank transfer recordings.
  - Integrate a PDF generation engine (e.g., PDFKit, Puppeteer) to create auto-generated, branded fee receipts containing the tenant logo, receipt number, and payment breakdown.
- **Ledger Dashboard:**
  - Build aggregate analytics calculating total expected revenue, collected fees, and overdue balances for Tuition Owners.
  - Add ledger filtering by batch, date range, and payment status (paid, partial, unpaid).

## Phase 6: Push Notifications & Cross-Platform Client Polish
This phase completes non-functional requirements and delivery channels before production release.
- **Firebase Cloud Messaging (FCM) Integration:**
  - Register client device tokens across web and mobile platforms upon user authentication.
  - Implement automated notification dispatch routines for pending fee reminders, low attendance alerts, and notice board broadcasts.
- **Responsive Client Optimization:**
  - Audit all teacher, student, and parent views for high-performance rendering on mobile screen viewports.
  - Verify offline state fallbacks and caching for viewing downloaded materials and past notices.
- **End-to-End Security & Tenant Leak Audit:**
  - Execute automated tests verifying cross-tenant isolation boundaries across all endpoints.
  - Validate that disabled tenant accounts immediately terminate active user sessions and lock API access.
