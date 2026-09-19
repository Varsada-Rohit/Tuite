import { Role } from './enums';

// ──────────────────────────────────────────────
// JWT & Authentication Types
// ──────────────────────────────────────────────

/** Payload encoded into the access JWT */
export interface JwtPayload {
  /** User UUID (maps to `sub` claim) */
  sub: string;
  /** User's role */
  role: Role;
  /** Tenant UUID — null for SUPER_ADMIN */
  tenantId: string | null;
  /** Issued-at (epoch seconds) */
  iat?: number;
  /** Expiry (epoch seconds) */
  exp?: number;
}

/** Shape returned after successful authentication */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** Full auth response including user profile */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthenticatedUser;
}

/** Minimal user profile returned in auth responses */
export interface AuthenticatedUser {
  id: string;
  phone: string;
  fullName: string | null;
  role: Role;
  tenantId: string | null;
}

/** Request body for phone verification */
export interface VerifyPhoneRequest {
  firebaseIdToken: string;
  tenantSlug: string;
}

/** Request body for token refresh */
export interface RefreshTokenRequest {
  refreshToken: string;
}
