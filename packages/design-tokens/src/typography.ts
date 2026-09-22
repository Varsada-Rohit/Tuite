// ─────────────────────────────────────────────────────────────────────────────
// @tuite/design-tokens — Typography Tokens (Phase 1 Foundation)
// ─────────────────────────────────────────────────────────────────────────────

// ---------------------------------------------------------------------------
// Font families
// ---------------------------------------------------------------------------

export const fontFamilies = {
  /** Primary UI font — used for body text, labels, inputs */
  sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  /** Monospaced font — used for code snippets, IDs */
  mono: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
} as const;

export type FontFamily = keyof typeof fontFamilies;

// ---------------------------------------------------------------------------
// Font sizes  (rem-based for web, px equivalents noted for mobile)
// ---------------------------------------------------------------------------

export const fontSizes = {
  /** 12px */
  xs: '0.75rem',
  /** 14px */
  sm: '0.875rem',
  /** 16px — body default */
  base: '1rem',
  /** 18px */
  lg: '1.125rem',
  /** 20px */
  xl: '1.25rem',
  /** 24px */
  '2xl': '1.5rem',
  /** 30px */
  '3xl': '1.875rem',
  /** 36px */
  '4xl': '2.25rem',
} as const;

export type FontSize = keyof typeof fontSizes;

/**
 * Numeric (pixel) equivalents of `fontSizes` for React Native's
 * `fontSize` style property, which requires a number.
 */
export const fontSizesNumeric = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const satisfies Record<FontSize, number>;

// ---------------------------------------------------------------------------
// Font weights
// ---------------------------------------------------------------------------

export const fontWeights = {
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export type FontWeight = keyof typeof fontWeights;

/**
 * Numeric equivalents for React Native.
 */
export const fontWeightsNumeric = {
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const satisfies Record<FontWeight, number>;

// ---------------------------------------------------------------------------
// Line heights
// ---------------------------------------------------------------------------

export const lineHeights = {
  /** Tight — headings, compact UI */
  tight: '1.25',
  /** Normal — body copy */
  normal: '1.5',
  /** Relaxed — long-form reading */
  relaxed: '1.75',
} as const;

export type LineHeight = keyof typeof lineHeights;
