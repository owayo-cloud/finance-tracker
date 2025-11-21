import { useEffect } from "react"

const VISIT_TRACKING_KEY = "pageVisits"

interface PageVisit {
  path: string
  count: number
  lastVisited: string
}

export const usePageVisits = () => {
  const trackVisit = (path: string) => {
    if (typeof window === "undefined") return

    try {
      const stored = localStorage.getItem(VISIT_TRACKING_KEY)
      const visits: Record<string, PageVisit> = stored ? JSON.parse(stored) : {}

      if (visits[path]) {
        visits[path].count += 1
        visits[path].lastVisited = new Date().toISOString()
      } else {
        visits[path] = {
          path,
          count: 1,
          lastVisited: new Date().toISOString(),
        }
      }

      localStorage.setItem(VISIT_TRACKING_KEY, JSON.stringify(visits))
    } catch (error) {
      console.error("Error tracking page visit:", error)
    }
  }

  const getPageVisits = (): Record<string, PageVisit> => {
    if (typeof window === "undefined") return {}

    try {
      const stored = localStorage.getItem(VISIT_TRACKING_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch (error) {
      console.error("Error getting page visits:", error)
      return {}
    }
  }

  const getMostVisitedPages = (limit: number = 6): PageVisit[] => {
    const visits = getPageVisits()
    return Object.values(visits)
      .sort((a, b) => {
        // Sort by count first, then by last visited
        if (b.count !== a.count) {
          return b.count - a.count
        }
        return new Date(b.lastVisited).getTime() - new Date(a.lastVisited).getTime()
      })
      .slice(0, limit)
  }

  return {
    trackVisit,
    getPageVisits,
    getMostVisitedPages,
  }
}

// Hook to track current page visit
export const useTrackPageVisit = (path: string) => {
  useEffect(() => {
    // Only track actual module pages, not the dashboard itself
    if (path && path !== "/" && path !== "/dashboard" && typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(VISIT_TRACKING_KEY)
        const visits: Record<string, PageVisit> = stored ? JSON.parse(stored) : {}

        if (visits[path]) {
          visits[path].count += 1
          visits[path].lastVisited = new Date().toISOString()
        } else {
          visits[path] = {
            path,
            count: 1,
            lastVisited: new Date().toISOString(),
          }
        }

        localStorage.setItem(VISIT_TRACKING_KEY, JSON.stringify(visits))
      } catch (error) {
        console.error("Error tracking page visit:", error)
      }
    }
  }, [path])
}

