// ──────────────────────────────────────────────
// Batch Types
// ──────────────────────────────────────────────

/** Full batch record */
export interface Batch {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Request body for creating a batch */
export interface CreateBatchRequest {
  name: string;
  description?: string;
}

/** Request body for updating a batch */
export interface UpdateBatchRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}
