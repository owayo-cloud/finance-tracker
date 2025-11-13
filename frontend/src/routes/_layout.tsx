import { Flex } from "@chakra-ui/react"
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"

import Navbar from "@/components/Common/Navbar"
import Sidebar from "@/components/Common/Sidebar"
import { isLoggedIn } from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout")({
  component: Layout,
  beforeLoad: async () => {
    if (!isLoggedIn()) {
      throw redirect({
        to: "/login",
      })
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
