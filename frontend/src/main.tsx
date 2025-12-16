import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"
import { createRouter, RouterProvider } from "@tanstack/react-router"
import { StrictMode } from "react"
import ReactDOM from "react-dom/client"
import { ApiError, OpenAPI } from "./client"
import ErrorBoundary from "./components/Common/ErrorBoundary"
import { CustomProvider } from "./components/ui/provider"
import { REFRESH_INTERVALS } from "./hooks/useAutoRefresh"
import { routeTree } from "./routeTree.gen"
import { getAccessToken, refreshAccessToken } from "./utils/tokenRefresh"

OpenAPI.BASE = import.meta.env.VITE_API_URL
OpenAPI.TOKEN = async () => {
  const token = await getAccessToken()
  return token || ""
}

const handleApiError = async (error: Error) => {
  if (error instanceof ApiError) {
    // Handle authentication errors (401 - Unauthorized)
    if (error.status === 401) {
      // Try to refresh token first
      try {
        const newToken = await refreshAccessToken()
        if (newToken) {
          // Token refreshed, retry the request
          return
        }
      } catch {
        // Refresh failed, proceed with logout
      }

      // Clear authentication state
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")

      // Redirect to login page
      window.location.href = "/login"
      return
    }

    // Handle forbidden errors (403 - Forbidden)
    if (error.status === 403) {
      const errDetail = (error.body as any)?.detail

      // Check if it's an authentication issue disguised as 403
      // Backend returns 403 for "Could not validate credentials" which is actually an auth issue
      if (
        errDetail === "Not authenticated" ||
        errDetail?.includes("authenticated") ||
        errDetail === "Could not validate credentials" ||
        errDetail?.includes("validate credentials")
      ) {
        // Try to refresh token first
        try {
          const newToken = await refreshAccessToken()
          if (newToken) {
            // Token refreshed, retry the request
            return
          }
        } catch {
          // Refresh failed, proceed with logout
        }

        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
        window.location.href = "/login"
      } else {
        // For genuine permission issues, show error message
        console.error("Access denied:", errDetail)
      }
      return
    }
  }
}
// Initialize auto-refresh interval from localStorage
const getInitialRefreshInterval = () => {
  try {
    if (typeof window === "undefined") return REFRESH_INTERVALS.DEFAULT

    const storedEnabled = localStorage.getItem("autoRefreshEnabled")
    const storedInterval = localStorage.getItem("autoRefreshInterval")

    if (storedEnabled === "false") return false
    return storedInterval
      ? parseInt(storedInterval, 10)
      : REFRESH_INTERVALS.DEFAULT
  } catch (_error) {
    // If localStorage is not available, use default
    return REFRESH_INTERVALS.DEFAULT
  }
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: handleApiError,
  }),
  mutationCache: new MutationCache({
    onError: handleApiError,
  }),
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
      staleTime: 0, // Consider data stale immediately for auto-refresh
      gcTime: 5 * 60 * 1000, // Keep unused data for 5 minutes
      refetchInterval: getInitialRefreshInterval(), // Global auto-refresh
    },
  },
})

const router = createRouter({ routeTree })
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <CustomProvider>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </CustomProvider>
    </ErrorBoundary>
  </StrictMode>,
)
