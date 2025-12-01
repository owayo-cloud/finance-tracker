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
