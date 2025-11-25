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
import { routeTree } from "./routeTree.gen"
import { REFRESH_INTERVALS } from "./hooks/useAutoRefresh"

OpenAPI.BASE = import.meta.env.VITE_API_URL
OpenAPI.TOKEN = async () => {
  return localStorage.getItem("access_token") || ""
}

const handleApiError = (error: Error) => {
  if (error instanceof ApiError) {
    // Handle authentication errors (401 - Unauthorized)
    if (error.status === 401) {
      const errDetail = (error.body as any)?.detail
      const errorMessage = errDetail || "Your session has expired. Please log in again."
      
      // Clear authentication state
      localStorage.removeItem("access_token")
      
      // Redirect to login page
      window.location.href = "/login"
      return
    }
    
    // Handle forbidden errors (403 - Forbidden)
    if (error.status === 403) {
      const errDetail = (error.body as any)?.detail
      let errorMessage = errDetail || "Access denied. You don't have permission to perform this action."
      
      // Check if it's an authentication issue disguised as 403
      // Backend returns 403 for "Could not validate credentials" which is actually an auth issue
      if (
        errDetail === "Not authenticated" || 
        errDetail?.includes("authenticated") ||
        errDetail === "Could not validate credentials" ||
        errDetail?.includes("validate credentials")
      ) {
        errorMessage = "Your session has expired. Please log in again."
        localStorage.removeItem("access_token")
        window.location.href = "/login"
      } else {
        // For genuine permission issues, optionally redirect to home or show a message
        // For now, we'll let the component handle displaying the error
        // but we could redirect to home if needed:
        // window.location.href = "/"
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
    return storedInterval ? parseInt(storedInterval, 10) : REFRESH_INTERVALS.DEFAULT
  } catch (error) {
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
