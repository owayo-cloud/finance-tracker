import { useState, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"

const AUTO_REFRESH_KEY = "autoRefreshEnabled"
const AUTO_REFRESH_INTERVAL_KEY = "autoRefreshInterval"
const PAGE_REFRESH_KEY = "pageAutoRefreshEnabled"
const PAGE_REFRESH_INTERVAL_KEY = "pageAutoRefreshInterval"

// Default intervals in milliseconds
export const REFRESH_INTERVALS = {
  DASHBOARD: 30000, // 30 seconds
  LIST: 60000, // 60 seconds
  DETAIL: 120000, // 2 minutes
  DEFAULT: 60000, // 60 seconds - default for all queries
  PAGE_REFRESH: 300000, // 5 minutes - default for page refresh
} as const

// Global auto-refresh state
let globalAutoRefreshEnabled = true
let globalAutoRefreshInterval = REFRESH_INTERVALS.DEFAULT

// Initialize from localStorage (with error handling)
if (typeof window !== "undefined") {
  try {
    const storedEnabled = localStorage.getItem(AUTO_REFRESH_KEY)
    if (storedEnabled !== null) {
      globalAutoRefreshEnabled = storedEnabled === "true"
    }
    
    const storedInterval = localStorage.getItem(AUTO_REFRESH_INTERVAL_KEY)
    if (storedInterval) {
      const parsed = parseInt(storedInterval, 10)
      if (!isNaN(parsed)) {
        globalAutoRefreshInterval = parsed
      }
    }
  } catch (error) {
    // If localStorage is not available, use defaults
    console.warn("Could not access localStorage for auto-refresh settings:", error)
  }
}

export const useAutoRefresh = (defaultInterval?: number) => {
  const queryClient = useQueryClient()
  const [enabled, setEnabled] = useState(globalAutoRefreshEnabled)
  const [interval, setIntervalState] = useState(globalAutoRefreshInterval)

  useEffect(() => {
    try {
      globalAutoRefreshEnabled = enabled
      localStorage.setItem(AUTO_REFRESH_KEY, enabled.toString())
      
      // Update QueryClient default options
      const newInterval = enabled ? (defaultInterval || interval) : false
      const currentDefaults = queryClient.getDefaultOptions().queries || {}
      queryClient.setDefaultOptions({
        queries: {
          ...currentDefaults,
          refetchInterval: newInterval,
        },
      })
      
      // Update all active queries
      queryClient.getQueryCache().getAll().forEach((query) => {
        try {
          queryClient.setQueryDefaults(query.queryKey, {
            refetchInterval: newInterval,
          })
        } catch (err) {
          // Ignore errors for individual queries
          console.warn("Error updating query defaults:", err)
        }
      })
    } catch (error) {
      console.error("Error in useAutoRefresh effect:", error)
    }
  }, [enabled, interval, defaultInterval, queryClient])

  const toggle = () => {
    setEnabled((prev) => {
      const newValue = !prev
      globalAutoRefreshEnabled = newValue
      return newValue
    })
  }

  const setInterval = (newInterval: number) => {
    setIntervalState(newInterval)
    globalAutoRefreshInterval = newInterval
  }

  return {
    enabled,
    interval,
    toggle,
    setInterval,
    refetchInterval: enabled ? (defaultInterval || interval) : false,
  }
}

// Export global getters for use in QueryClient configuration
export const getGlobalAutoRefreshInterval = () => {
  return globalAutoRefreshEnabled ? globalAutoRefreshInterval : false
}

// Page auto-refresh hook (reloads entire page)
export const usePageAutoRefresh = (interval: number = REFRESH_INTERVALS.PAGE_REFRESH) => {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === "undefined") return false
    const stored = localStorage.getItem(PAGE_REFRESH_KEY)
    return stored !== null ? stored === "true" : false // Default to disabled
  })

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return

    localStorage.setItem(PAGE_REFRESH_KEY, enabled.toString())

    const refreshInterval = setInterval(() => {
      window.location.reload()
    }, interval)

    return () => clearInterval(refreshInterval)
  }, [enabled, interval])

  const toggle = () => {
    setEnabled((prev) => {
      const newValue = !prev
      if (typeof window !== "undefined") {
        localStorage.setItem(PAGE_REFRESH_KEY, newValue.toString())
      }
      return newValue
    })
  }

  return {
    enabled,
    toggle,
  }
}

