// ──────────────────────────────────────────────
// Enums — single source of truth across the stack
// ──────────────────────────────────────────────

export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  OWNER = 'OWNER',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
}

export enum FeatureName {
  NOTES = 'NOTES',
  VIDEO_LECTURES = 'VIDEO_LECTURES',
  ONLINE_TESTS = 'ONLINE_TESTS',
  COMMUNICATION = 'COMMUNICATION',
}
