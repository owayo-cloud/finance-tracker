import { Flex } from "@chakra-ui/react"
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"

import Navbar from "@/components/Common/Navbar"
import Sidebar from "@/components/Common/Sidebar"
import { isLoggedIn } from "@/hooks/useAuth"
import { UsersService } from "@/client"

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
        // ADMIN: Cannot access cashier-exclusive dashboard
        // Admin trying to access /sales should be redirected to admin dashboard
        if (location.pathname === '/sales') {
          throw redirect({
            to: "/",
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
      // If user fetch fails, redirect to login
      if (error instanceof Response && error.status === 401) {
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
  return (
    <Flex 
      direction="column" 
      h="100vh" 
      bg={{ base: "gray.900", _light: "gray.50" }}
    >
      <Navbar />
      <Flex flex="1" overflow="hidden">
        <Sidebar />
        <Flex 
          flex="1" 
          direction="column" 
          p={4} 
          overflowY="auto"
          bg={{ base: "gray.900", _light: "gray.50" }}
        >
          <Outlet />
        </Flex>
      </Flex>
    </Flex>
  )
}

export default Layout
