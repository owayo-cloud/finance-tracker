import { createSystem, defaultConfig } from "@chakra-ui/react"
import { buttonRecipe } from "./theme/button.recipe"

export const system = createSystem(defaultConfig, {
  globalCss: {
    html: {
      fontSize: "16px",
      colorScheme: {
        base: "dark",
        _light: "light",
        _dark: "dark",
      },
    },
    body: {
      fontSize: "0.875rem",
      margin: 0,
      padding: 0,
      bg: "bg.canvas",
      color: "text.primary",
    },
    ".main-link": {
      color: "ui.main",
      fontWeight: "bold",
    },
  },
  theme: {
    tokens: {
      colors: {
        ui: {
          main: { value: "#2563eb" },
          "main.hover": { value: "#1d4ed8" },
          "main.active": { value: "#1e40af" },
          "main.light": { value: "#60a5fa" },
          "main.dark": { value: "#1e3a8a" },
        },
        // Primary brand colors (Blue theme)
        brand: {
          primary: { value: "#2563eb" },
          "primary.hover": { value: "#1d4ed8" },
          "primary.active": { value: "#1e40af" },
          "primary.light": { value: "#60a5fa" },
          "primary.dark": { value: "#1e3a8a" },
          secondary: { value: "#0ea5e9" },
          "secondary.hover": { value: "#0284c7" },
          accent: { value: "#3b82f6" },
          "accent.hover": { value: "#2563eb" },
        },
      },
    },
    semanticTokens: {
      colors: {
        bg: {
          muted: {
            value: {
              base: "{colors.gray.800}",
              _light: "{colors.gray.50}",
              _dark: "{colors.gray.900}",
            },
          },
        },
        // Primary brand color tokens
        "brand.primary": {
          value: {
            base: "#2563eb",
            _light: "#2563eb",
            _dark: "#2563eb",
          },
        },
        "brand.primary.hover": {
          value: {
            base: "#1d4ed8",
            _light: "#1d4ed8",
            _dark: "#1d4ed8",
          },
        },
        "brand.primary.active": {
          value: {
            base: "#1e40af",
            _light: "#1e40af",
            _dark: "#1e40af",
          },
        },
        // Button colors
        "button.primary": {
          value: {
            base: "#2563eb",
            _light: "#2563eb",
            _dark: "#2563eb",
          },
        },
        "button.primary.hover": {
          value: {
            base: "#1d4ed8",
            _light: "#1d4ed8",
            _dark: "#1d4ed8",
          },
        },
        "button.success": {
          value: {
            base: "#22c55e",
            _light: "#22c55e",
            _dark: "#22c55e",
          },
        },
        "button.success.hover": {
          value: {
            base: "#16a34a",
            _light: "#16a34a",
            _dark: "#16a34a",
          },
        },
        "button.danger": {
          value: {
            base: "#ef4444",
            _light: "#ef4444",
            _dark: "#ef4444",
          },
        },
        "button.danger.hover": {
          value: {
            base: "#dc2626",
            _light: "#dc2626",
            _dark: "#dc2626",
          },
        },
        "button.warning": {
          value: {
            base: "#f59e0b",
            _light: "#f59e0b",
            _dark: "#f59e0b",
          },
        },
        "button.warning.hover": {
          value: {
            base: "#d97706",
            _light: "#d97706",
            _dark: "#d97706",
          },
        },
        // Gradient colors
        "gradient.primary": {
          value: {
            base: "linear-gradient(120deg, #2563eb 0%, #60a5fa 60%, #0ea5e9 100%)",
            _light:
              "linear-gradient(120deg, #2563eb 0%, #60a5fa 60%, #0ea5e9 100%)",
            _dark:
              "linear-gradient(120deg, #2563eb 0%, #60a5fa 60%, #0ea5e9 100%)",
          },
        },
        "gradient.primary.hover": {
          value: {
            base: "linear-gradient(120deg, #1d4ed8 0%, #3b82f6 60%, #0284c7 100%)",
            _light:
              "linear-gradient(120deg, #1d4ed8 0%, #3b82f6 60%, #0284c7 100%)",
            _dark:
              "linear-gradient(120deg, #1d4ed8 0%, #3b82f6 60%, #0284c7 100%)",
          },
        },
        "gradient.canvas": {
          value: {
            base: "linear-gradient(135deg, #0c1c2e 0%, #1a2847 40%, #142a4a 100%)",
            _light:
              "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 45%, #e0e7ff 100%)",
            _dark:
              "linear-gradient(135deg, #0c1c2e 0%, #1a2847 40%, #142a4a 100%)",
          },
        },
        // Role-based badge gradients
        "gradient.role.admin": {
          value: {
            base: "linear-gradient(135deg, #1e40af 0%, #2563eb 100%)",
            _light: "linear-gradient(135deg, #1e40af 0%, #2563eb 100%)",
            _dark: "linear-gradient(135deg, #1e40af 0%, #2563eb 100%)",
          },
        },
        "gradient.role.auditor": {
          value: {
            base: "linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)",
            _light: "linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)",
            _dark: "linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)",
          },
        },
        "gradient.role.cashier": {
          value: {
            base: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
            _light: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
            _dark: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
          },
        },
        // Text colors for brand
        "text.brand": {
          value: {
            base: "#2563eb",
            _light: "#2563eb",
            _dark: "#2563eb",
          },
        },
        "text.link": {
          value: {
            base: "#60a5fa",
            _light: "#2563eb",
            _dark: "#60a5fa",
          },
        },
        "text.muted": {
          value: {
            base: "#9ca3af",
            _light: "#6b7280",
            _dark: "#9ca3af",
          },
        },
        // Text colors
        "text.primary": {
          value: {
            base: "{colors.white}",
            _light: "{colors.gray.900}",
            _dark: "{colors.white}",
          },
        },
        "text.secondary": {
          value: {
            base: "{colors.whiteAlpha.800}",
            _light: "{colors.gray.600}",
            _dark: "{colors.whiteAlpha.800}",
          },
        },
        // Background colors
        "bg.canvas": {
          value: {
            base: "#1a1d29",
            _light: "#f3f4f6",
            _dark: "#1a1d29",
          },
        },
        "bg.surface": {
          value: {
            base: "#2d3142",
            _light: "#ffffff",
            _dark: "#2d3142",
          },
        },
        "bg.elevated": {
          value: {
            base: "#363a4d",
            _light: "#ffffff",
            _dark: "#363a4d",
          },
        },
        // Border colors
        "border.default": {
          value: {
            base: "{colors.whiteAlpha.200}",
            _light: "{colors.gray.200}",
            _dark: "{colors.whiteAlpha.200}",
          },
        },
        "border.subtle": {
          value: {
            base: "{colors.gray.700}",
            _light: "{colors.gray.200}",
            _dark: "{colors.gray.700}",
          },
        },
        "border.card": {
          value: {
            base: "rgba(255, 255, 255, 0.12)",
            _light: "#e5e7eb",
            _dark: "rgba(255, 255, 255, 0.12)",
          },
        },
        // Input/form colors
        "input.bg": {
          value: {
            base: "#2d3142",
            _light: "#ffffff",
            _dark: "#2d3142",
          },
        },
        "input.border": {
          value: {
            base: "rgba(255, 255, 255, 0.1)",
            _light: "#e5e7eb",
            _dark: "rgba(255, 255, 255, 0.1)",
          },
        },
        "input.focus.border": {
          value: {
            base: "#2563eb",
            _light: "#2563eb",
            _dark: "#2563eb",
          },
        },
        "input.focus.shadow": {
          value: {
            base: "0 0 0 1px #2563eb",
            _light: "0 0 0 1px #2563eb",
            _dark: "0 0 0 1px #2563eb",
          },
        },
        // Table colors
        "table.bg": {
          value: {
            base: "#2d3142",
            _light: "#ffffff",
            _dark: "#2d3142",
          },
        },
        "table.header.bg": {
          value: {
            base: "rgba(255, 255, 255, 0.08)",
            _light: "#f9fafb",
            _dark: "rgba(255, 255, 255, 0.08)",
          },
        },
        "table.row.bg": {
          value: {
            base: "transparent",
            _light: "transparent",
            _dark: "transparent",
          },
        },
        "table.row.hover": {
          value: {
            base: "rgba(255, 255, 255, 0.08)",
            _light: "rgba(0, 0, 0, 0.02)",
            _dark: "rgba(255, 255, 255, 0.08)",
          },
        },
        "table.row.selected": {
          value: {
            base: "rgba(56, 178, 172, 0.12)",
            _light: "rgba(56, 178, 172, 0.06)",
            _dark: "rgba(56, 178, 172, 0.12)",
          },
        },
        "table.border": {
          value: {
            base: "rgba(255, 255, 255, 0.1)",
            _light: "#e5e7eb",
            _dark: "rgba(255, 255, 255, 0.1)",
          },
        },
        // Item/Row colors (for list items, expense rows, etc.)
        "item.bg": {
          value: {
            base: "rgba(255, 255, 255, 0.08)",
            _light: "#f9fafb",
            _dark: "rgba(255, 255, 255, 0.08)",
          },
        },
        "item.bg.hover": {
          value: {
            base: "rgba(255, 255, 255, 0.12)",
            _light: "#f3f4f6",
            _dark: "rgba(255, 255, 255, 0.12)",
          },
        },
        "item.border": {
          value: {
            base: "rgba(255, 255, 255, 0.12)",
            _light: "#e5e7eb",
            _dark: "rgba(255, 255, 255, 0.12)",
          },
        },
      },
    },
    recipes: {
      button: buttonRecipe,
    },
  },
})
