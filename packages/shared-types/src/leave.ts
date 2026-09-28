import { LeaveStatus } from './enums';

// ──────────────────────────────────────────────
// Leave Management Types
// ──────────────────────────────────────────────

/** Full leave request record */
export interface LeaveRequest {
  id: string;
  tenantId: string;
  studentId: string;
  batchId: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Leave request with associated names (for display) */
export interface LeaveRequestWithDetails extends LeaveRequest {
  studentName: string;
  batchName: string;
  reviewerName: string | null;
}

/** Request body for submitting a leave application */
export interface CreateLeaveRequest {
  studentId: string;
  batchId: string;
  startDate: string;
  endDate: string;
  reason: string;
}

/** Request body for approving/rejecting a leave */
export interface ReviewLeaveRequest {
  status: LeaveStatus.APPROVED | LeaveStatus.REJECTED;
}
