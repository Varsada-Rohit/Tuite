import { AttendanceStatus } from './enums';

// ──────────────────────────────────────────────
// Attendance Types
// ──────────────────────────────────────────────

/** Single attendance record */
export interface AttendanceRecord {
  id: string;
  tenantId: string;
  batchId: string;
  studentId: string;
  date: string;
  status: AttendanceStatus;
  markedBy: string;
  createdAt: string;
}

/** Entry for a single student in a batch attendance submission */
export interface BatchAttendanceEntry {
  studentId: string;
  status: AttendanceStatus;
}

/** Request body for submitting batch attendance */
export interface SubmitAttendanceRequest {
  batchId: string;
  date: string;
  entries: BatchAttendanceEntry[];
}

/** Attendance record with student name (for display) */
export interface AttendanceWithStudent extends AttendanceRecord {
  studentName: string;
}

/** Monthly attendance summary for a student */
export interface AttendanceSummary {
  studentId: string;
  studentName: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  percentage: number;
}

/** Batch-level attendance summary */
export interface BatchAttendanceSummary {
  batchId: string;
  batchName: string;
  date: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
}
