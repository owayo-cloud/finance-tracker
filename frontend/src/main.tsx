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
      
      // Show user-friendly message before redirect
      console.warn("Authentication error:", errorMessage)
      
      // Redirect to login page
      window.location.href = "/login"
      return
    }
    
    // Handle forbidden errors (403 - Forbidden)
    if (error.status === 403) {
      const errDetail = (error.body as any)?.detail
      let errorMessage = errDetail || "Access denied. You don't have permission to perform this action."
      
      // Check if it's an authentication issue disguised as 403
      if (errDetail === "Not authenticated" || errDetail?.includes("authenticated")) {
        errorMessage = "Your session has expired. Please log in again."
        localStorage.removeItem("access_token")
        window.location.href = "/login"
      } else {
        // For genuine permission issues, log the error
        console.error("Permission denied:", errorMessage)
        
        // Optionally redirect to home or show a message
        // For now, we'll let the component handle displaying the error
        // but we could redirect to home if needed:
        // window.location.href = "/"
      }
      return
    }
  }
}
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: handleApiError,
  }),
  mutationCache: new MutationCache({
    onError: handleApiError,
  }),
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
