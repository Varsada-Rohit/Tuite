import { FeatureName } from './enums';

// ──────────────────────────────────────────────
// Tenant Types
// ──────────────────────────────────────────────

/** Public tenant profile returned by the resolve endpoint (for white-labeling) */
export interface TenantProfile {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
}

/** Full tenant record (admin view) */
export interface Tenant extends TenantProfile {
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Feature flag state for a tenant */
export interface TenantFeatureFlag {
  featureName: FeatureName;
  isEnabled: boolean;
}

/** Request body for creating a tenant */
export interface CreateTenantRequest {
  name: string;
  slug: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

/** Request body for toggling tenant status */
export interface UpdateTenantStatusRequest {
  isActive: boolean;
}

/** Request body for toggling feature flags */
export interface UpdateFeatureFlagsRequest {
  features: TenantFeatureFlag[];
}

/** Request body for seeding tenant owner */
export interface SeedTenantOwnerRequest {
  phone: string;
  fullName: string;
}

/** Request body for updating the tenant profile (by OWNER) */
export interface UpdateTenantProfileRequest {
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}
