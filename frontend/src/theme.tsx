import { createSystem, defaultConfig } from "@chakra-ui/react"
import { buttonRecipe } from "./theme/button.recipe"

export const system = createSystem(defaultConfig, {
  globalCss: {
    html: {
      fontSize: "16px",
    },
    body: {
      fontSize: "0.875rem",
      margin: 0,
      padding: 0,
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
      },
    },
    recipes: {
      button: buttonRecipe,
    },
  },
})
