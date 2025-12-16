import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useState } from "react"

import {
  type Body_login_login_access_token as AccessToken,
  type ApiError,
  LoginService,
  type UserPublic,
  type UserRegister,
  UsersService,
} from "@/client"
import { handleError } from "@/utils"

// Extended Token type with refresh_token (will be in client after regeneration)
type TokenWithRefresh = {
  access_token: string
  refresh_token?: string
  token_type?: string
}

const isLoggedIn = () => {
  return localStorage.getItem("access_token") !== null
}

const useAuth = () => {
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: user } = useQuery<UserPublic | null, Error>({
    queryKey: ["currentUser"],
    queryFn: UsersService.readUserMe,
    enabled: isLoggedIn(),
  })

  const signUpMutation = useMutation({
    mutationFn: (data: UserRegister) =>
      UsersService.registerUser({ requestBody: data }),

    onSuccess: () => {
      navigate({ to: "/login" })
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })

  const login = async (data: AccessToken) => {
    const response = (await LoginService.loginAccessToken({
      formData: data,
    })) as TokenWithRefresh
    localStorage.setItem("access_token", response.access_token)
    if (response.refresh_token) {
      localStorage.setItem("refresh_token", response.refresh_token)
    }
  }

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: async () => {
      // Fetch user data to determine role (for future use if needed)
      await UsersService.readUserMe()

      // Redirect all users to dashboard
      navigate({ to: "/" }) // Dashboard
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
  })

  const refreshTokenMutation = useMutation({
    mutationFn: async () => {
      const refreshToken = localStorage.getItem("refresh_token")
      if (!refreshToken) {
        throw new Error("No refresh token available")
      }
      // refreshAccessToken will be available after client regeneration
      const response = (await (LoginService as any).refreshAccessToken({
        requestBody: { refresh_token: refreshToken },
      })) as TokenWithRefresh
      localStorage.setItem("access_token", response.access_token)
      if (response.refresh_token) {
        localStorage.setItem("refresh_token", response.refresh_token)
      }
      return response
    },
    onError: () => {
      // If refresh fails, logout user
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
      navigate({ to: "/login" })
    },
  })

  const logout = async () => {
    const refreshToken = localStorage.getItem("refresh_token")
    if (refreshToken) {
      try {
        // revokeRefreshToken will be available after client regeneration
        await (LoginService as any).revokeRefreshToken({
          requestBody: { refresh_token: refreshToken },
        })
      } catch (error) {
        // Ignore errors during logout
        console.error("Error revoking refresh token:", error)
      }
    }
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    navigate({ to: "/login" })
  }

  return {
    signUpMutation,
    loginMutation,
    refreshTokenMutation,
    logout,
    user,
    error,
    resetError: () => setError(null),
  }
}

export { isLoggedIn }
export default useAuth
