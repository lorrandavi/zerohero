/**
 * ZeroHero Design System - Single Source of Truth (SST) Tokens
 * Strongly-typed constants for colors, radii, spacing, typography, and chart rendering.
 */

export const colors = {
  // Background surfaces
  bgPrimary: '#090a0f',
  bgSecondary: '#0f111a',
  surfaceCard: '#12141d',
  surfaceCardHover: '#161924',
  surfaceElevated: '#1a1d29',

  // Borders
  borderSubtle: '#1e2235',
  borderMedium: '#282e45',
  borderDistinct: '#384160',

  // Typography
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  textInverse: '#090a0f',

  // Semantic Accents
  accentEmerald: '#10b981', // Zero debt / Paid off / Healthy
  accentEmeraldGlow: 'rgba(16, 185, 129, 0.15)',
  accentCyan: '#06b6d4', // Payoff curve / Highlighting / Active cycle
  accentCyanGlow: 'rgba(6, 182, 212, 0.15)',
  accentIndigo: '#6366f1', // Primary interactive buttons
  accentIndigoHover: '#4f46e5',
  accentAmber: '#f59e0b', // Approaching cutoff / Warning
  accentRose: '#f43f5e', // Active debt / High burn rate / Danger
  accentRoseGlow: 'rgba(244, 63, 94, 0.15)',

  // Visualization / Chart Specific
  chart: {
    curveLine: '#06b6d4',
    gradientStart: 'rgba(6, 182, 212, 0.35)',
    gradientEnd: 'rgba(16, 185, 129, 0.02)',
    gridLine: '#1e2235',
    milestonePin: '#10b981',
    scrubberLine: '#f8fafc',
    tooltipBg: 'rgba(18, 20, 29, 0.92)',
    subscriptionBar: '#6366f1',
    installmentBar: '#f43f5e',
  },
} as const;

export const radii = {
  xs: '2px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
} as const;

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
} as const;

export const typography = {
  fontFamilySans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontFamilyMono: 'JetBrains Mono, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  tabularNums: 'tabular-nums',
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

export const shadows = {
  card: '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
  glowCyan: '0 0 16px -2px rgba(6, 182, 212, 0.25)',
  glowEmerald: '0 0 16px -2px rgba(16, 185, 129, 0.25)',
} as const;

export const tokens = {
  colors,
  radii,
  spacing,
  typography,
  shadows,
} as const;

export type DesignTokens = typeof tokens;
