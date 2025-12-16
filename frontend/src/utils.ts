import type { ApiError } from "./client"
import useCustomToast from "./hooks/useCustomToast"

export const emailPattern = {
  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  message: "Invalid email address",
}

export const namePattern = {
  value: /^[A-Za-z\s\u00C0-\u017F]{1,30}$/,
  message: "Invalid name",
}

export const passwordRules = (isRequired = true) => {
  const rules: any = {
    minLength: {
      value: 8,
      message: "Password must be at least 8 characters",
    },
  }

  if (isRequired) {
    rules.required = "Password is required"
  }

  return rules
}

export const confirmPasswordRules = (
  getValues: () => any,
  isRequired = true,
) => {
  const rules: any = {
    validate: (value: string) => {
      const password = getValues().password || getValues().new_password
      return value === password ? true : "The passwords do not match"
    },
  }

  if (isRequired) {
    rules.required = "Password confirmation is required"
  }

  return rules
}

export const handleError = (err: ApiError) => {
  const { showErrorToast } = useCustomToast()
  const errDetail = (err.body as any)?.detail

  // Handle specific error cases
  if (err.status === 403) {
    if (
      errDetail === "Not authenticated" ||
      errDetail?.includes("authenticated") ||
      errDetail === "Could not validate credentials" ||
      errDetail?.includes("validate credentials")
    ) {
      showErrorToast("Your session has expired. Please log in again.")
    } else {
      const errorMessage =
        errDetail ||
        "Access denied. You don't have permission to perform this action."
      showErrorToast(errorMessage)
    }
    return
  }

  if (err.status === 401) {
    showErrorToast("Authentication required. Please log in.")
    return
  }

  // Handle other errors
  let errorMessage = errDetail || "Something went wrong."
  if (Array.isArray(errDetail) && errDetail.length > 0) {
    errorMessage = errDetail[0].msg
  }
  showErrorToast(errorMessage)
}

/**
 * Get user initials from full name or email
 * - If full_name has multiple words, returns first letter of first and last word (e.g., "John Doe" -> "JD")
 * - If full_name is a single word, returns first letter (e.g., "John" -> "J")
 * - Falls back to email first letter or "U" if no name/email
 */
export const getUserInitials = (
  fullName?: string | null,
  email?: string | null,
): string => {
  if (fullName) {
    const nameParts = fullName
      .trim()
      .split(/\s+/)
      .filter((part) => part.length > 0)
    if (nameParts.length >= 2) {
      // Multiple names: take first letter of first and last name
      return (
        nameParts[0][0] + nameParts[nameParts.length - 1][0]
      ).toUpperCase()
    }
    if (nameParts.length === 1) {
      // Single name: take first letter
      return nameParts[0][0].toUpperCase()
    }
  }

  // Fallback to email or "U"
  if (email) {
    return email[0].toUpperCase()
  }

  return "U"
}
