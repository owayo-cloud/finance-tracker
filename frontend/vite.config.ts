import path from "node:path"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import react from "@vitejs/plugin-react-swc"
import { visualizer } from "rollup-plugin-visualizer"
import { defineConfig } from "vite"

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0", // Listen on all addresses (required for Docker)
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true, // Enable polling for file changes (works better in Docker)
      interval: 1000, // Poll every second
    },
    hmr: {
      host: "localhost", // HMR client connects to localhost
      port: 5173,
      clientPort: 5173, // Port the client connects to
    },
  },
  build: {
    // Increase chunk size warning limit (optional - can remove if you want stricter limits)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split node_modules into separate chunks
          if (id.includes("node_modules")) {
            // React and React DOM - core framework
            if (id.includes("react") || id.includes("react-dom")) {
              return "vendor-react"
            }
            
            // TanStack libraries - router and query
            if (
              id.includes("@tanstack/react-router") ||
              id.includes("@tanstack/react-query")
            ) {
              return "vendor-tanstack"
            }
            
            // Chakra UI - UI library
            if (
              id.includes("@chakra-ui") ||
              id.includes("@emotion")
            ) {
              return "vendor-chakra"
            }
            
            // Form libraries
            if (
              id.includes("react-hook-form") ||
              id.includes("zod")
            ) {
              return "vendor-forms"
            }
            
            // Other large libraries
            if (
              id.includes("axios") ||
              id.includes("date-fns")
            ) {
              return "vendor-utils"
            }
            
            // Everything else from node_modules
            return "vendor-other"
          }
          
          // Split large client SDK files
          if (id.includes("/src/client/")) {
            return "client-sdk"
          }
        },
      },
    },
  },
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
    visualizer({
      open: mode === "development" && process.env.CI !== "true",
      filename: "bundle-analysis.html",
    }),
  ],
}))
