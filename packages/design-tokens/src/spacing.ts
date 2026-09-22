// ─────────────────────────────────────────────────────────────────────────────
// @tuite/design-tokens — Spacing Tokens (Phase 1 Foundation)
// ─────────────────────────────────────────────────────────────────────────────
//
// Based on a **4pt base grid** (multiples of 4px).
// This gives finer granularity than an 8pt grid while still keeping
// consistent rhythm.  Common shortcuts:
//   spacing.sm  =  8px   (comfortable padding for chips / badges)
//   spacing.md  = 16px   (default component padding)
//   spacing.lg  = 24px   (section gaps)
//   spacing.xl  = 32px   (page-level gutters)
// ─────────────────────────────────────────────────────────────────────────────

// ---------------------------------------------------------------------------
// Spacing scale  (rem for web, numeric px for mobile)
// ---------------------------------------------------------------------------

export const spacing = {
  /** 0px */
  none: '0rem',
  /** 2px — hairline borders, micro-adjustments */
  '2xs': '0.125rem',
  /** 4px */
  xs: '0.25rem',
  /** 8px */
  sm: '0.5rem',
  /** 12px */
  md_sm: '0.75rem',
  /** 16px — base unit */
  md: '1rem',
  /** 20px */
  lg_sm: '1.25rem',
  /** 24px */
  lg: '1.5rem',
  /** 32px */
  xl: '2rem',
  /** 40px */
  '2xl': '2.5rem',
  /** 48px */
  '3xl': '3rem',
  /** 64px */
  '4xl': '4rem',
  /** 80px */
  '5xl': '5rem',
  /** 96px */
  '6xl': '6rem',
} as const;

export type SpacingKey = keyof typeof spacing;

/**
 * Numeric (pixel) equivalents for React Native's style properties.
 */
export const spacingNumeric = {
  none: 0,
  '2xs': 2,
  xs: 4,
  sm: 8,
  md_sm: 12,
  md: 16,
  lg_sm: 20,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
  '4xl': 64,
  '5xl': 80,
  '6xl': 96,
} as const satisfies Record<SpacingKey, number>;

// ---------------------------------------------------------------------------
// Border radii
// ---------------------------------------------------------------------------

export const radii = {
  none: '0px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
} as const;

export type RadiusKey = keyof typeof radii;

export const radiiNumeric = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const satisfies Record<RadiusKey, number>;
