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
          main: { value: "#009688" },
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
