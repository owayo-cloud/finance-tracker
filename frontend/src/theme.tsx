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
            base: "{colors.gray.900}",
            _light: "{colors.white}",
            _dark: "{colors.gray.900}",
          },
        },
        "bg.surface": {
          value: {
            base: "{colors.gray.800}",
            _light: "{colors.gray.50}",
            _dark: "{colors.gray.800}",
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
        // Input/form colors
        "input.bg": {
          value: {
            base: "{colors.gray.800}",
            _light: "{colors.white}",
            _dark: "{colors.gray.800}",
          },
        },
        "input.border": {
          value: {
            base: "{colors.gray.600}",
            _light: "{colors.gray.300}",
            _dark: "{colors.gray.600}",
          },
        },
      },
    },
    recipes: {
      button: buttonRecipe,
    },
  },
})
