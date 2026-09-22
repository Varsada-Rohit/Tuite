// ─────────────────────────────────────────────────────────────────────────────
// @tuite/design-tokens — Color Tokens (Phase 1 Foundation)
// ─────────────────────────────────────────────────────────────────────────────
//
// White-labeling strategy:
//   Web  → CSS custom properties (--tuite-color-primary, etc.) override defaults
//   Mobile → React Context provides a runtime ThemeColors override object
//
// Consumers should treat `defaultBrandColors` as fallbacks.  The actual brand
// colors are resolved at runtime per tenant.
// ─────────────────────────────────────────────────────────────────────────────

// ---------------------------------------------------------------------------
// Neutral palette
// ---------------------------------------------------------------------------

export const neutralColors = {
  white: '#FFFFFF',
  black: '#000000',

  gray50: '#FAFAFA',
  gray100: '#F5F5F5',
  gray200: '#E5E5E5',
  gray300: '#D4D4D4',
  gray400: '#A3A3A3',
  gray500: '#737373',
  gray600: '#525252',
  gray700: '#404040',
  gray800: '#262626',
  gray900: '#171717',
  gray950: '#0A0A0A',
} as const;

export type NeutralColor = keyof typeof neutralColors;

// ---------------------------------------------------------------------------
// Semantic / feedback colors
// ---------------------------------------------------------------------------

export const semanticColors = {
  success: '#16A34A',
  successLight: '#DCFCE7',
  successDark: '#166534',

  error: '#DC2626',
  errorLight: '#FEE2E2',
  errorDark: '#991B1B',

  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  warningDark: '#92400E',

  info: '#2563EB',
  infoLight: '#DBEAFE',
  infoDark: '#1E40AF',
} as const;

export type SemanticColor = keyof typeof semanticColors;

// ---------------------------------------------------------------------------
// Brand / white-label colors  (tenant-overridable)
// ---------------------------------------------------------------------------

/**
 * Shape of the brand colors each tenant can customise.
 *
 * On **web** these map 1:1 to CSS custom properties:
 *   --tuite-color-primary, --tuite-color-primary-light, …
 *
 * On **mobile** they are provided through a `<ThemeProvider>` React Context.
 */
export interface BrandColors {
  /** Main CTA / accent colour */
  primary: string;
  primaryLight: string;
  primaryDark: string;

  /** Secondary accent — used for complementary surfaces */
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
}

/**
 * Sensible defaults used when a tenant has not configured custom branding.
 * Indigo / Teal palette — professional & education-friendly.
 */
export const defaultBrandColors: BrandColors = {
  primary: '#4F46E5',      // Indigo-600
  primaryLight: '#E0E7FF', // Indigo-100
  primaryDark: '#3730A3',  // Indigo-800

  secondary: '#0D9488',      // Teal-600
  secondaryLight: '#CCFBF1', // Teal-100
  secondaryDark: '#115E59',  // Teal-800
} as const;

// ---------------------------------------------------------------------------
// CSS variable mapping helper (web consumers only)
// ---------------------------------------------------------------------------

/**
 * Returns a CSS variable reference string for a given brand color key.
 * Falls back to the default value when the variable is not set.
 *
 * @example
 *   cssVar('primary')       → 'var(--tuite-color-primary, #4F46E5)'
 *   cssVar('secondaryDark') → 'var(--tuite-color-secondary-dark, #115E59)'
 */
export function cssVar(key: keyof BrandColors): string {
  const kebab = key.replace(/([A-Z])/g, '-$1').toLowerCase();
  return `var(--tuite-color-${kebab}, ${defaultBrandColors[key]})`;
}

/**
 * Generates a flat object of CSS custom-property declarations for a given
 * set of brand colours (or the defaults).  Useful for applying to a root
 * element's `style` attribute or injecting into a `<style>` tag.
 *
 * @example
 *   brandColorsCssVars()
 *   // → { '--tuite-color-primary': '#4F46E5', … }
 */
export function brandColorsCssVars(
  overrides: Partial<BrandColors> = {},
): Record<string, string> {
  const merged: BrandColors = { ...defaultBrandColors, ...overrides };
  const vars: Record<string, string> = {};

  for (const [key, value] of Object.entries(merged)) {
    const kebab = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    vars[`--tuite-color-${kebab}`] = value;
  }

  return vars;
}
