// ─────────────────────────────────────────────────────────────────────────────
// @tuite/design-tokens — Public API
// ─────────────────────────────────────────────────────────────────────────────
//
// Single barrel export so consumers can do:
//   import { neutralColors, fontSizes, spacing, BrandColors } from '@tuite/design-tokens';
// ─────────────────────────────────────────────────────────────────────────────

// Colors
export {
  neutralColors,
  semanticColors,
  defaultBrandColors,
  cssVar,
  brandColorsCssVars,
} from './colors';
export type { NeutralColor, SemanticColor, BrandColors } from './colors';

// Typography
export {
  fontFamilies,
  fontSizes,
  fontSizesNumeric,
  fontWeights,
  fontWeightsNumeric,
  lineHeights,
} from './typography';
export type { FontFamily, FontSize, FontWeight, LineHeight } from './typography';

// Spacing & Radii
export {
  spacing,
  spacingNumeric,
  radii,
  radiiNumeric,
} from './spacing';
export type { SpacingKey, RadiusKey } from './spacing';
