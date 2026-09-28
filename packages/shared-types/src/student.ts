import { Gender } from './enums';

// ──────────────────────────────────────────────
// Student Types
// ──────────────────────────────────────────────

/** Full student record */
export interface Student {
  id: string;
  tenantId: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  gender: Gender | null;
  dateOfBirth: string | null;
  address: string | null;
  parentName: string | null;
  parentPhone: string | null;
  parentEmail: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Student profile with batch assignments */
export interface StudentProfile extends Student {
  batches: { id: string; name: string; enrolledAt: string }[];
}

/** Request body for enrolling a new student */
export interface CreateStudentRequest {
  fullName: string;
  phone?: string;
  email?: string;
  gender?: Gender;
  dateOfBirth?: string;
  address?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  batchIds?: string[];
}

/** Request body for updating a student */
export interface UpdateStudentRequest {
  fullName?: string;
  phone?: string;
  email?: string;
  gender?: Gender;
  dateOfBirth?: string;
  address?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  isActive?: boolean;
}

/** Request body for assigning student to batches */
export interface EnrollStudentBatchRequest {
  batchIds: string[];
}
