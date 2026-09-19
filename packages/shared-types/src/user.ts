import { Role } from './enums';

// ──────────────────────────────────────────────
// User Types
// ──────────────────────────────────────────────

/** Full user record */
export interface User {
  id: string;
  tenantId: string | null;
  phone: string;
  fullName: string | null;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
