# Color Palette Guide

This document describes the reusable color palette system for the Finance Tracker application.

## Theme Colors

### Primary Brand Colors

The application uses a **Teal/Cyan** color scheme as the primary brand identity:

- **Primary**: `#14b8a6` - Main brand color for buttons, links, and accents
- **Primary Hover**: `#0d9488` - Darker shade for hover states
- **Primary Active**: `#0f766e` - Even darker for active/pressed states
- **Primary Light**: `#5eead4` - Lighter variant for subtle accents
- **Primary Dark**: `#134e4a` - Dark variant for backgrounds

### Secondary Colors

- **Secondary**: `#60a5fa` - Blue accent for secondary actions
- **Secondary Hover**: `#3b82f6` - Hover state
- **Accent**: `#a855f7` - Purple accent for highlights
- **Accent Hover**: `#9333ea` - Hover state

### Using Theme Tokens

Always use semantic tokens from the theme instead of hardcoded color values:

```tsx
// ✅ GOOD - Use theme tokens
<Button bg="brand.primary" _hover={{ bg: "brand.primary.hover" }}>
<Text color="text.primary">
<Box bg="bg.canvas" borderColor="border.default">

// ❌ BAD - Hardcoded colors
<Button bg="#14b8a6" _hover={{ bg: "#0d9488" }}>
<Text color="#ffffff">
<Box bg="#1a1d29" borderColor="rgba(255, 255, 255, 0.1)">
```

## Available Theme Tokens

### Text Colors
- `text.primary` - Main text color (white in dark mode, dark gray in light mode)
- `text.secondary` - Secondary text (muted)
- `text.muted` - Muted text (`#9ca3af` / `#6b7280`)
- `text.brand` - Brand colored text (`#14b8a6`)
- `text.link` - Link color (`#60a5fa` / `#2563eb`)

### Background Colors
- `bg.canvas` - Main background (`#1a1d29` / `#f3f4f6`)
- `bg.surface` - Card/panel background (`#2d3142` / `#ffffff`)
- `bg.elevated` - Elevated surface (`#363a4d` / `#ffffff`)

### Border Colors
- `border.default` - Default borders
- `border.subtle` - Subtle borders
- `border.card` - Card borders

### Button Colors
- `button.primary` - Primary button color
- `button.primary.hover` - Primary button hover

### Input Colors
- `input.bg` - Input background
- `input.border` - Input border
- `input.focus.border` - Focus border color
- `input.focus.shadow` - Focus shadow

### Table Colors
- `table.bg` - Table background
- `table.header.bg` - Header background
- `table.row.hover` - Row hover state
- `table.row.selected` - Selected row
- `table.border` - Table borders

### Item/Row Colors
- `item.bg` - Item background
- `item.bg.hover` - Item hover background
- `item.border` - Item border

### Gradients
- `gradient.primary` - Primary gradient (teal → blue → purple)
- `gradient.primary.hover` - Primary gradient hover state
- `gradient.canvas` - Canvas background gradient

## Responsive Design

### Breakpoints

Use Chakra UI's responsive syntax for all layouts:

```tsx
<Box
  w={{ base: "100%", md: "50%", lg: "33%" }}
  p={{ base: 4, md: 6, lg: 8 }}
  fontSize={{ base: "sm", md: "md", lg: "lg" }}
>
```

### Common Responsive Patterns

```tsx
// Container padding
p={{ base: 4, md: 6, lg: 8 }}

// Flex direction (column on mobile, row on desktop)
direction={{ base: "column", md: "row" }}

// Grid columns
columns={{ base: 1, md: 2, lg: 3 }}

// Visibility
display={{ base: "none", md: "block" }}

// Font sizes
fontSize={{ base: "sm", md: "md", lg: "lg" }}
```

## Migration Guide

When updating existing components:

1. **Replace hardcoded colors** with theme tokens
2. **Add responsive breakpoints** where missing
3. **Use semantic color names** (e.g., `text.muted` instead of `#9ca3af`)
4. **Test in both light and dark modes**
5. **Test on mobile, tablet, and desktop**

### Example Migration

```tsx
// Before
<Box
  bg="#2d3142"
  color="#ffffff"
  borderColor="rgba(255, 255, 255, 0.1)"
  p={4}
>

// After
<Box
  bg="bg.surface"
  color="text.primary"
  borderColor="border.default"
  p={{ base: 4, md: 6 }}
>
```

## Color Utilities

Import color utilities from `@/utils/colors` if needed:

```tsx
import { colors, breakpoints, responsive } from "@/utils/colors"
```

However, prefer using theme tokens in most cases as they automatically adapt to light/dark mode.

