import { LoginService } from "@/client"

// Extended Token type with refresh_token (will be in client after regeneration)
type TokenWithRefresh = {
  access_token: string
  refresh_token?: string
  token_type?: string
}

let refreshPromise: Promise<string> | null = null

/**
 * Decode JWT token to get expiration time
 */
function getTokenExpiration(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    return payload.exp ? payload.exp * 1000 : null // Convert to milliseconds
  } catch {
    return null
  }
}

/**
 * Check if token is expired or will expire soon (within 5 minutes)
 */
function isTokenExpiringSoon(token: string | null): boolean {
  if (!token) return true

  const expiration = getTokenExpiration(token)
  if (!expiration) return true

  const fiveMinutesFromNow = Date.now() + 5 * 60 * 1000
  return expiration <= fiveMinutesFromNow
}

/**
 * Refresh access token using refresh token
 * Uses a promise cache to prevent multiple simultaneous refresh requests
 */
export async function refreshAccessToken(): Promise<string | null> {
  // If already refreshing, wait for that promise
  if (refreshPromise) {
    return refreshPromise
  }

  const refreshToken = localStorage.getItem("refresh_token")
  if (!refreshToken) {
    return null
  }

  refreshPromise = (async () => {
    try {
      const response = (await (LoginService as any).refreshAccessToken({
        requestBody: { refresh_token: refreshToken },
      })) as TokenWithRefresh

      localStorage.setItem("access_token", response.access_token)
      if (response.refresh_token) {
        localStorage.setItem("refresh_token", response.refresh_token)
      }

      return response.access_token
    } catch (error) {
      // Refresh failed, clear tokens
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
      throw error
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

/**
 * Get access token, refreshing if necessary
 */
export async function getAccessToken(): Promise<string | null> {
  const accessToken = localStorage.getItem("access_token")

  if (!accessToken) {
    return null
  }

  // If token is expiring soon, refresh it
  if (isTokenExpiringSoon(accessToken)) {
    try {
      return await refreshAccessToken()
    } catch {
      return null
    }
  }

  return accessToken
}
