# Tuite API Documentation — Students, Attendance & Leaves

This document outlines the REST API endpoints introduced for Student Roster, Attendance, and Leave Management.

> **Security Note:** All endpoints require a valid JWT Bearer token. All operations are strictly scoped to the authenticated user's `tenantId`.

---

## 1. Students API
**Base Path:** `/api/v1/students`

| Method | Endpoint | Roles | Description | Request Body |
|--------|----------|-------|-------------|--------------|
| `GET` | `/` | OWNER, TEACHER | List all students. Supports `?search=` query parameter for full name and phone search. | - |
| `GET` | `/:id` | OWNER, TEACHER | Get a specific student's full profile including enrolled batches. | - |
| `POST` | `/` | OWNER | Enroll a new student and optionally assign them to batches. | `CreateStudentDto` |
| `PATCH` | `/:id` | OWNER | Update a student's personal or parent contact details. | `UpdateStudentDto` |
| `DELETE` | `/:id` | OWNER | Soft-delete a student (sets `is_active = false`). | - |
| `POST` | `/:id/batches` | OWNER | Assign an existing student to one or more batches. | `EnrollStudentBatchDto` |
| `DELETE` | `/:id/batches/:batchId` | OWNER | Remove a student from a specific batch. | - |

---

## 2. Attendance API
**Base Path:** `/api/v1/attendance`

| Method | Endpoint | Roles | Description | Request Body |
|--------|----------|-------|-------------|--------------|
| `POST` | `/` | OWNER, TEACHER | Submit or update batch attendance for a specific date. Uses an upsert mechanism to allow corrections. | `SubmitAttendanceDto` |
| `GET` | `/` | OWNER, TEACHER | Get attendance records for a batch on a specific date. Requires `?batchId=` and `?date=` queries. | - |
| `GET` | `/student/:id/summary` | ALL ROLES | Get a student's monthly attendance summary (total, present, absent, late, percentage). Optional `?month=` and `?year=`. | - |
| `GET` | `/batch/:id/summary` | OWNER, TEACHER | Get batch-level attendance analytics, including a list of students with attendance below 75%. | - |

---

## 3. Leave Management API
**Base Path:** `/api/v1/leaves`

| Method | Endpoint | Roles | Description | Request Body |
|--------|----------|-------|-------------|--------------|
| `POST` | `/` | ALL ROLES | Submit a new leave application for a student. | `CreateLeaveDto` |
| `GET` | `/` | OWNER, TEACHER | List leave applications for the center. Supports `?status=` query filter (PENDING, APPROVED, REJECTED). | - |
| `GET` | `/student/:id` | ALL ROLES | Get leave history for a specific student. | - |
| `PATCH` | `/:id/review` | OWNER, TEACHER | Approve or reject a pending leave application. | `ReviewLeaveDto` |

---

## Shared Enums

```typescript
enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
}

enum LeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}
```
