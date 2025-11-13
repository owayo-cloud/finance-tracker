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
  FiTrendingUp
} from "react-icons/fi"
import { TbReceiptDollar } from "react-icons/tb"
import type { IconType } from "react-icons/lib"

import type { UserPublic } from "@/client"

const items = [
  { icon: FiHome, title: "Dashboard", path: "/" },
  { icon: FiBox, title: "Stock Entry", path: "/stock-entry" },
  { icon: FiShoppingCart, title: "Sales", path: "/sales" },
  { icon: FiPackage, title: "Products", path: "/products", adminOnly: true },
  { icon: FiBarChart2, title: "Reports", path: "/reports" },
  { icon: TbReceiptDollar, title: "Shift Reconciliation", path: "/shift-reconciliation" },
  { icon: FiDollarSign, title: "Expenses", path: "/expenses", adminOnly: true },
  { icon: FiTrendingUp, title: "Debts", path: "/debts" },
  { icon: FiSettings, title: "User Settings", path: "/settings" },
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
    const isActive = location.pathname === path
    
    return (
      <RouterLink key={title} to={path as any} onClick={onClose}>
        <Flex
          gap={3}
          px={3}
          py={3}
          mx={2}
          mb={1}
          borderRadius="lg"
          transition="all 0.2s"
          cursor="pointer"
          _hover={{
            bg: isActive ? "teal.600" : { base: "gray.700", _light: "gray.100" },
            transform: "translateX(2px)",
          }}
          bg={isActive ? "teal.500" : "transparent"}
          color={isActive ? "white" : { base: "gray.300", _light: "gray.700" }}
          position="relative"
          alignItems="center"
          fontSize="sm"
          fontWeight={isActive ? "600" : "500"}
          _before={isActive ? {
            content: '""',
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            width: "3px",
            height: "20px",
            bg: "white",
            borderRadius: "0 2px 2px 0",
          } : undefined}
        >
          <Icon 
            as={icon} 
            fontSize="lg"
            color={isActive ? "white" : { base: "gray.400", _light: "gray.600" }}
          />
          <Text>{title}</Text>
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
        color="gray.500"
        textTransform="uppercase"
        letterSpacing="wider"
        mb={2}
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
