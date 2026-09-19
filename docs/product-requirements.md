# 📖 Product Requirements Document (PRD): Multi-Tenant Tuition Management SaaS

## 1. Product Overview
A centralized, multi-tenant Software-as-a-Service (SaaS) platform designed to digitize and manage daily operations, academic delivery, and administrative tasks for independent tuition centers and coaching classes. The platform provides isolated workspaces for each center while allowing centralized control by the platform owner.

## 2. Platform Architecture & Multi-Tenancy

### 2.1 Multi-Tenant Isolation
The system operates on a single codebase where each tuition center acts as an isolated "tenant." Data must be strictly isolated at the database level so that a center can only access its own students, staff, and records.

### 2.2 Feature Flagging (Module Management)
- **Super Admin Control:** The Super Admin can toggle specific modules (e.g., Video Lectures, Notes, Online Tests) on or off for individual tenants.
- **Monetization Readiness:** This allows the creation of pricing tiers (Basic, Pro, Premium).
- **Dynamic UI:** If a feature is toggled off for a tenant, all related UI elements (tabs, buttons, menus) automatically hide for that tenant's users to ensure a clean, error-free experience.

### 2.3 Tenant Customization (White-Labeling)
Each tuition center can customize their workspace to reflect their brand identity.
- **Brand Settings Dashboard:** Tuition Owners can upload a custom Logo, specify their Institute Name, and choose Primary/Secondary Theme Colors.
- **Dynamic Rendering:** When a user logs into a specific center's workspace, the login screen, navigation bars, and buttons dynamically adopt the center's configured branding.

## 3. User Personas & Role-Based Access Control (RBAC)

| Role | Description | Key Permissions |
| :--- | :--- | :--- |
| **Super Admin** | Product Owner (You) | Create/disable tenants, manage Feature Flags per tenant, manage app-level billing. |
| **Tuition Owner** | Center Administrator | Configure Brand Settings, manage batches, add/edit staff & students, configure fees, view revenue. |
| **Teacher** | Academic Staff | Mark attendance, upload notes, embed video lectures, post class-specific notices. |
| **Student** | End Consumer | View personal attendance, download notes, watch videos, check fee status. |
| **Parent (Optional)** | Sponsor | View child's attendance, pay fees, receive institute notices. |

## 4. Core Features (MVP)

### 4.1 Administration & Center Management
- **Institute Profile:** Setup for contact details, address, and Brand Settings (colors/logo).
- **Batch/Class Management:** Creation of batches (e.g., "Class 10 Math") and assignment of respective students and teachers.
- **Staff Management:** System to invite teachers and assign them to specific batches.

### 4.2 Student & Attendance Management
- **Student Roster:** Centralized database capturing student details, parent contact info, and batch enrollments.
- **Attendance Logging:** A fast toggle/checkbox interface for teachers to mark daily batch attendance.
- **Leave Management:** Portal for students/parents to submit leave requests.
- **Attendance Tracking:** Monthly percentage calculations to flag low-attendance students.

### 4.3 Financial & Fee Management
- **Fee Structures:** Ability for Owners to set recurring (monthly/quarterly) or one-time fees.
- **Ledger Dashboard:** Overview of expected revenue, collected fees, and pending dues.
- **Payment Logging & Receipts:** Manual logging of cash/transfer payments with auto-generated, downloadable PDF receipts.
- **Automated Reminders:** Push notifications or SMS/WhatsApp alerts for pending dues.

### 4.4 Academic & Content Delivery
- **Study Materials (Notes):** Cloud storage repository for uploading PDFs, PPTs, and Docs, structured by batch and subject.
- **Video Lectures:** Integration for embedding unlisted YouTube/Vimeo links. Requirement: Avoid direct raw video hosting to minimize server costs.
- **Notice Board:** Centralized feed for broadcasting announcements (schedules, holidays) to specific batches or the whole institute.

## 5. Non-Functional Requirements
- **Mobile-First Design:** The primary interfaces for Teachers, Students, and Parents must be highly responsive on mobile devices (recommendation: PWA, Flutter, or React Native).
- **Push Notifications:** Integration with Firebase Cloud Messaging (FCM) for real-time alerts on attendance, fees, and notices.
- **Data Security:** Strict tenant-ID verification on every API endpoint to prevent cross-tenant data leaks.

## 6. Future Roadmap (Phase 2)
- **Payment Gateway Integration:** In-app fee payments via Stripe, Razorpay, or UPI.
- **Online Assessments:** MCQ quizzes with auto-grading and portals for subjective assignment submissions.
- **Performance Reports:** Digital report card generation based on test scores.
- **Live Classes:** API integration with Zoom or Google Meet for one-click live session joining.
