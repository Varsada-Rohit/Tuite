// ──────────────────────────────────────────────
// API Response Types — RFC 7807 Problem Details
// ──────────────────────────────────────────────

/** Standard success envelope */
export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

/**
 * RFC 7807 Problem Details for HTTP APIs.
 * Used for all error responses from the platform.
 * @see https://www.rfc-editor.org/rfc/rfc7807
 */
export interface ProblemDetails {
  /** URI reference identifying the problem type */
  type: string;
  /** Short human-readable summary */
  title: string;
  /** HTTP status code */
  status: number;
  /** Human-readable explanation specific to this occurrence */
  detail: string;
  /** URI reference identifying the specific occurrence */
  instance: string;
  /** Request trace ID for debugging */
  requestId?: string;
  /** Additional error context (validation errors, etc.) */
  errors?: Record<string, string[]>;
}
