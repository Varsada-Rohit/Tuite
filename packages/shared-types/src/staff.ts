import { Role } from './enums';

// ──────────────────────────────────────────────
// Staff / Teacher Types
// ──────────────────────────────────────────────

/** Teacher profile including assigned batches */
export interface TeacherProfile {
  id: string;
  tenantId: string;
  phone: string;
  fullName: string | null;
  role: Role.TEACHER;
  isActive: boolean;
  batches: { id: string; name: string }[];
}

/** Request body for inviting a staff member (teacher) */
export interface InviteStaffRequest {
  phone: string;
  fullName?: string;
  batchIds: string[];
}
