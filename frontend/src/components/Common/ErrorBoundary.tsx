import { Box, Button, Heading, Text, VStack } from "@chakra-ui/react"
import { Component, type ReactNode } from "react"
import { ApiError } from "@/client"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: string | null
}

/**
 * Error Boundary component for catching and handling React errors
 * Provides special handling for API authentication and authorization errors
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Error caught by boundary - set state to show error UI

    // Handle API errors specifically
    if (error instanceof ApiError) {
      if (error.status === 401) {
        localStorage.removeItem("access_token")
        window.location.href = "/login"
        return
      }

      if (error.status === 403) {
        const errDetail = (error.body as any)?.detail
        if (errDetail === "Not authenticated" || errDetail?.includes("authenticated")) {
          localStorage.removeItem("access_token")
          window.location.href = "/login"
          return
        }
      }
    }

    this.setState({
      errorInfo: errorInfo.componentStack,
    })
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />
    }

    return this.props.children
  }
}

/**
 * Fallback UI displayed when an error is caught
 */
function ErrorFallback({ error }: { error: Error | null }) {

  const handleGoHome = () => {
    window.location.href = "/"
  }

  const handleReload = () => {
    window.location.reload()
  }

  // Determine error message based on error type
  let errorMessage = "An unexpected error occurred."
  let errorTitle = "Something went wrong"

  if (error instanceof ApiError) {
    if (error.status === 403) {
      errorTitle = "Access Denied"
      errorMessage = "You don't have permission to access this resource."
    } else if (error.status === 404) {
      errorTitle = "Not Found"
      errorMessage = "The requested resource could not be found."
    } else if (error.status >= 500) {
      errorTitle = "Server Error"
      errorMessage = "Our server is experiencing issues. Please try again later."
    }
  }

  return (
    <Box
      height="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={4}
    >
      <VStack gap={4} maxW="md" textAlign="center">
        <Heading size="2xl" color="red.500">
          {errorTitle}
        </Heading>
        <Text fontSize="lg" color="gray.600">
          {errorMessage}
        </Text>
        {error && (
          <Text fontSize="sm" color="gray.500" fontFamily="mono">
            {error.message}
          </Text>
        )}
        <VStack gap={2} width="full" mt={4}>
          <Button onClick={handleGoHome} colorScheme="blue" width="full">
            Go to Home
          </Button>
          <Button onClick={handleReload} variant="outline" width="full">
            Reload Page
          </Button>
        </VStack>
      </VStack>
    </Box>
  )
}

export default ErrorBoundary
