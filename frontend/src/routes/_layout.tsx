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
      
      if (user.is_superuser) {
        // ADMIN: Can access all routes including sales
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
  
  // Track page visits for Quick Access
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
        onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)} 
        sidebarCollapsed={sidebarCollapsed}
        isPOSMode={isPOSPage}
      />
      <Flex flex="1" overflow="hidden">
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
          p={isPOSPage ? 0 : 4} 
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
