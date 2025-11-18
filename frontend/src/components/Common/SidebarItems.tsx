import { Box, Flex, Icon, Text } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { Link as RouterLink, useLocation } from "@tanstack/react-router"
import { 
  FiHome, 
  FiSettings, 
  FiUsers,
  FiBox,
  FiShoppingCart,
  FiPackage,
  FiBarChart2,
  FiDollarSign,
  FiTrendingUp,
  FiList
} from "react-icons/fi"
import { TbReceiptDollar } from "react-icons/tb"
import type { IconType } from "react-icons/lib"

import type { UserPublic } from "@/client"

const items = [
  { icon: FiHome, title: "Dashboard", path: "/", adminOnly: true }, // Admin only
  { icon: FiShoppingCart, title: "Point of Sale", path: "/sales" }, // Available to all
  { icon: FiList, title: "Sales History", path: "/sales-list" }, // Available to all
  { icon: FiBox, title: "Stock Entry", path: "/stock-entry" }, // Available to all
  { icon: FiPackage, title: "Products", path: "/products", adminOnly: true },
  { icon: FiBarChart2, title: "Reports", path: "/reports" }, // Available to all
  { icon: TbReceiptDollar, title: "Shift Reconciliation", path: "/shift-reconciliation" }, // Available to all
  { icon: FiDollarSign, title: "Expenses", path: "/expenses", adminOnly: true },
  { icon: FiTrendingUp, title: "Debts", path: "/debts" }, // Available to all
  { icon: FiSettings, title: "User Settings", path: "/settings" }, // Available to all
]

interface SidebarItemsProps {
  onClose?: () => void
}

interface Item {
  icon: IconType
  title: string
  path: string
  adminOnly?: boolean
}

const SidebarItems = ({ onClose }: SidebarItemsProps) => {
  const queryClient = useQueryClient()
  const location = useLocation()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])

  // Filter items based on user role
  const filteredItems = items.filter(
    (item) => !item.adminOnly || currentUser?.is_superuser
  )

  // Add Admin menu item for superusers
  const finalItems: Item[] = currentUser?.is_superuser
    ? [...filteredItems, { icon: FiUsers, title: "Admin", path: "/admin" }]
    : filteredItems

  const listItems = finalItems.map(({ icon, title, path }) => {
    // Check if current path matches exactly or starts with the path (for nested routes)
    const isActive = location.pathname === path || 
                     (path !== "/" && location.pathname.startsWith(path + "/"))
    const isSales = path === "/sales" || path === "/sales-list"
    
    return (
      <RouterLink key={title} to={path as any} onClick={onClose}>
        <Flex
          gap={3}
          px={3}
          py={3}
          mx={2}
          mb={isSales ? 2 : 1}
          borderRadius="lg"
          transition="all 0.2s"
          cursor="pointer"
          _hover={{
            bg: isActive ? "rgba(59, 130, 246, 0.3)" : isSales ? "rgba(59, 130, 246, 0.15)" : "rgba(59, 130, 246, 0.1)",
            transform: "translateX(4px)",
            borderColor: isSales ? "rgba(59, 130, 246, 0.4)" : "rgba(59, 130, 246, 0.3)",
            boxShadow: isSales ? "0 4px 12px rgba(59, 130, 246, 0.25)" : "none",
          }}
          bg={isActive ? "rgba(59, 130, 246, 0.2)" : isSales ? "rgba(59, 130, 246, 0.08)" : "transparent"}
          border="1px solid"
          borderColor={isActive ? "rgba(59, 130, 246, 0.4)" : isSales ? "rgba(59, 130, 246, 0.25)" : "transparent"}
          color={isActive ? "#60a5fa" : isSales ? "#60a5fa" : { base: "gray.300", _light: "gray.700" }}
          position="relative"
          alignItems="center"
          fontSize="sm"
          fontWeight={isActive || isSales ? "600" : "500"}
          _before={isActive ? {
            content: '""',
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            width: "3px",
            height: "24px",
            bg: "linear-gradient(to bottom, #60a5fa, #3b82f6)",
            borderRadius: "0 2px 2px 0",
            boxShadow: "0 0 10px rgba(59, 130, 246, 0.5)",
          } : undefined}
        >
          <Icon 
            as={icon} 
            fontSize="lg"
            color={isActive ? "#60a5fa" : isSales ? "#60a5fa" : { base: "gray.400", _light: "gray.600" }}
          />
          <Text fontWeight={isSales ? "600" : undefined}>{title}</Text>
        </Flex>
      </RouterLink>
    )
  })

  return (
    <Box>
      <Text 
        fontSize="xs" 
        px={4} 
        py={3} 
        fontWeight="700"
        color={{ base: "gray.400", _light: "gray.600" }}
        textTransform="uppercase"
        letterSpacing="wider"
        mb={2}
        bgGradient="linear(to-r, #60a5fa, #3b82f6)"
        bgClip="text"
      >
        Menu
      </Text>
      <Box px={2}>
        {listItems}
      </Box>
    </Box>
  )
}

export default SidebarItems
