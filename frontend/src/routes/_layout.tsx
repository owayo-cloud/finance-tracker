import { Flex } from "@chakra-ui/react"
import { createFileRoute, Outlet, redirect, useLocation } from "@tanstack/react-router"
import { useState } from "react"

import Navbar from "@/components/Common/Navbar"
import Sidebar from "@/components/Common/Sidebar"
import Breadcrumbs from "@/components/Common/Breadcrumbs"
import { isLoggedIn } from "@/hooks/useAuth"
import { UsersService, ApiError } from "@/client"
import { useTrackPageVisit } from "@/hooks/usePageVisits"

export const Route = createFileRoute("/_layout")({
  component: Layout,
  beforeLoad: async ({ location }) => {
    if (!isLoggedIn()) {
      throw redirect({
        to: "/login",
      })
    }

    // Check user role and enforce strict role-based access control
    try {
      const user = await UsersService.readUserMe()
      
      // Define role-specific allowed paths
      const cashierAllowedPaths = ['/sales', '/settings', '/stock-entry', '/shift-reconciliation', '/debts', '/reports']
      const auditorAllowedPaths = ['/products', '/sales', '/stock-entry', '/expenses', '/debts', '/reports', '/shift-reconciliation', '/settings']
      
      if (user.is_superuser) {
        // ADMIN: Can access all routes including sales
      } else if (user.is_auditor) {
        // AUDITOR: Can access read-only routes (reports, products, etc.)
        // Cannot access admin routes
        const isAdminRoute = location.pathname === '/admin' || location.pathname.startsWith('/admin/')
        if (isAdminRoute) {
          throw redirect({
            to: "/reports",
          })
        }
        
        const isAllowedPath = auditorAllowedPaths.some(path => 
          location.pathname === path || location.pathname.startsWith(path + '/')
        )
        
        if (!isAllowedPath) {
          // Auditor trying to access unauthorized routes, redirect to reports
          throw redirect({
            to: "/reports",
          })
        }
      } else {
        // CASHIER: Can only access specific paths
        const isAllowedPath = cashierAllowedPaths.some(path => 
          location.pathname === path || location.pathname.startsWith(path + '/')
        )
        
        if (!isAllowedPath) {
          // Cashier trying to access admin routes, redirect to sales dashboard
          throw redirect({
            to: "/sales",
          })
        }
      }
    } catch (error) {
      // If user fetch fails due to authentication/authorization, redirect to login
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        // Clear invalid token
        localStorage.removeItem("access_token")
        throw redirect({
          to: "/login",
        })
      }
      // Re-throw redirect errors
      if (error instanceof Response && error.status === 401) {
        localStorage.removeItem("access_token")
        throw redirect({
          to: "/login",
        })
      }
      // Re-throw redirect errors
      throw error
    }
  },
})

function Layout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false) // For mobile drawer only
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false) // For desktop collapse
  
  // Track page visits (for analytics)
  useTrackPageVisit(location.pathname)

  // Hide sidebar on POS page, but keep navbar
  const isPOSPage = location.pathname === "/sales"

  return (
    <Flex 
      direction="column" 
      h="100vh" 
      bg="bg.canvas"
      overflow="hidden"
    >
      <Navbar 
        onMenuClick={() => {
          // On mobile, toggle the drawer
          // On desktop, toggle collapse
          const isMobile = window.innerWidth < 768
          if (isMobile) {
            setSidebarOpen(!sidebarOpen)
          } else {
            setSidebarCollapsed(!sidebarCollapsed)
          }
        }}
        sidebarCollapsed={sidebarCollapsed}
        isPOSMode={isPOSPage}
      />
      <Flex flex="1" overflow="hidden" minH="0">
        {!isPOSPage && (
          <Sidebar 
            open={sidebarOpen} 
            onOpenChange={(e) => setSidebarOpen(e.open)} 
            isCollapsed={sidebarCollapsed}
          />
        )}
        <Flex 
          flex="1" 
          direction="column" 
          px={isPOSPage ? 0 : 4}
          pt={isPOSPage ? 0 : 4}
          pb={isPOSPage ? 0 : 8}
          overflowY="auto"
          overflowX="hidden"
          bg="bg.canvas"
          css={{
            "&::-webkit-scrollbar": {
              display: "none",
            },
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {!isPOSPage && <Breadcrumbs />}
          <Outlet />
        </Flex>
      </Flex>
    </Flex>
  )
}

export default Layout
