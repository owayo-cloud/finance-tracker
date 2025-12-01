/**
 * Color Palette Utilities
 *
 * This file provides reusable color constants based on the theme.
 * Use theme semantic tokens where possible, but this provides common
 * color combinations and utilities.
 */

// Primary brand colors
export const colors = {
  // Primary teal/cyan
  primary: "#14b8a6",
  primaryHover: "#0d9488",
  primaryActive: "#0f766e",
  primaryLight: "#5eead4",
  primaryDark: "#134e4a",

  // Secondary blue
  secondary: "#60a5fa",
  secondaryHover: "#3b82f6",
  secondaryActive: "#2563eb",

  // Accent purple
  accent: "#a855f7",
  accentHover: "#9333ea",
  accentActive: "#7c3aed",

  // Text colors
  textPrimary: {
    dark: "#ffffff",
    light: "#111827",
  },
  textSecondary: {
    dark: "#9ca3af",
    light: "#6b7280",
  },
  textMuted: {
    dark: "#9ca3af",
    light: "#6b7280",
  },

  // Background colors
  bgCanvas: {
    dark: "#1a1d29",
    light: "#f3f4f6",
  },
  bgSurface: {
    dark: "#2d3142",
    light: "#ffffff",
  },
  bgElevated: {
    dark: "#363a4d",
    light: "#ffffff",
  },

  // Border colors
  borderDefault: {
    dark: "rgba(255, 255, 255, 0.1)",
    light: "#e5e7eb",
  },
  borderCard: {
    dark: "rgba(255, 255, 255, 0.12)",
    light: "#e5e7eb",
  },

  // Status colors
  success: "#10b981",
  error: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6",
} as const

// Responsive breakpoints (matches Chakra UI default)
export const breakpoints = {
  base: "0em",
  sm: "30em", // 480px
  md: "48em", // 768px
  lg: "62em", // 992px
  xl: "80em", // 1280px
  "2xl": "96em", // 1536px
} as const

// Common responsive values helper
export const responsive = {
  // Spacing that adapts to screen size
  padding: {
    mobile: 4,
    tablet: 6,
    desktop: 8,
  },
  // Container max widths
  container: {
    mobile: "100%",
    tablet: "container.md",
    desktop: "container.lg",
  },
} as const
