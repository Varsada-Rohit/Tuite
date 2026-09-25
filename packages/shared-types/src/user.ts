import { Role } from './enums';
import { FeatureName } from './enums';

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

/** Response from GET /api/v1/users/me — includes tenant feature flags */
export interface MeResponse {
  id: string;
  tenantId: string | null;
  phone: string;
  fullName: string | null;
  role: Role;
  isActive: boolean;
  features: FeatureName[];
}
