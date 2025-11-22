import { Box, Flex, Icon, Text } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { Link as RouterLink, useLocation } from "@tanstack/react-router"
import { useState } from "react"
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
  FiChevronDown,
  FiChevronRight,
  FiCreditCard,
  FiTag
} from "react-icons/fi"
import { TbReceiptDollar } from "react-icons/tb"
import type { IconType } from "react-icons/lib"

import type { UserPublic } from "@/client"

interface MenuItem {
  icon: IconType
  title: string
  path?: string
  adminOnly?: boolean
  submenu?: { title: string; path: string }[]
}

const menuItems: MenuItem[] = [
  { icon: FiHome, title: "Dashboard", path: "/", adminOnly: true },
  { 
    icon: FiShoppingCart, 
    title: "Sales", 
    submenu: [
      { title: "POS", path: "/sales" },
      { title: "Shift Reconciliation", path: "/shift-reconciliation" }
    ]
  },
  { icon: FiBox, title: "Stock Entry", path: "/stock-entry" },
  { icon: FiPackage, title: "Products", path: "/products", adminOnly: true },
  { icon: FiBarChart2, title: "Reports", path: "/reports", adminOnly: true },
  { 
    icon: FiDollarSign, 
    title: "Expenses", 
    adminOnly: true,
    submenu: [
      { title: "Expenses", path: "/expenses" },
      { title: "Categories", path: "/expense-categories" }
    ]
  },
  { icon: FiTrendingUp, title: "Debts", path: "/debts", adminOnly: true },
  { icon: FiCreditCard, title: "Payment Methods", path: "/payment-methods", adminOnly: true },
  { icon: FiUsers, title: "Users", path: "/admin", adminOnly: true },
  { icon: FiSettings, title: "User Settings", path: "/settings" },
]

interface SidebarItemsProps {
  onClose?: () => void
  isCollapsed?: boolean
}

// Icon color mapping for each menu item
const getIconColor = (title: string, isActive: boolean): string => {
  if (isActive) {
    return "#14b8a6" // Teal for active items
  }
  
  // Different colors for each menu item
  const colorMap: Record<string, string> = {
    "Dashboard": "#3b82f6",      // Blue
    "Sales": "#ef4444",           // Red
    "Stock Entry": "#f59e0b",     // Amber
    "Products": "#8b5cf6",        // Purple
    "Reports": "#10b981",         // Green
    "Expenses": "#f97316",        // Orange
    "Debts": "#ec4899",           // Pink
    "Payment Methods": "#06b6d4", // Cyan
    "Users": "#6366f1",           // Indigo
    "User Settings": "#64748b",   // Slate
  }
  
  return colorMap[title] || "#9ca3af" // Default gray
}

const SidebarItems = ({ onClose, isCollapsed = false }: SidebarItemsProps) => {
  const queryClient = useQueryClient()
  const location = useLocation()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    Sales: location.pathname === "/sales" || location.pathname === "/shift-reconciliation",
    Expenses: location.pathname === "/expenses" || location.pathname === "/expense-categories"
  })

  // Filter items based on user role
  const filteredItems = menuItems.filter(
    (item) => !item.adminOnly || currentUser?.is_superuser
  )

  const finalItems: MenuItem[] = filteredItems

  const toggleSubmenu = (title: string) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [title]: !prev[title]
    }))
  }

  const isPathActive = (path?: string) => {
    if (!path) return false
    return location.pathname === path
  }

  const isSubmenuItemActive = (submenu?: { title: string; path: string }[]) => {
    if (!submenu) return false
    return submenu.some(item => location.pathname === item.path)
  }

  const listItems = finalItems.map((item) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0
    const isSubmenuOpen = openSubmenus[item.title] || false
    const isActive = isPathActive(item.path) || isSubmenuItemActive(item.submenu)
    const isParentActive = hasSubmenu && isSubmenuItemActive(item.submenu)

    return (
      <Box key={item.title} mb={1}>
        {hasSubmenu ? (
          <>
            {isCollapsed ? (
              <Flex
                justifyContent="center"
                alignItems="center"
                py={2.5}
                mx={1}
                borderRadius="md"
                transition="all 0.2s"
                cursor="pointer"
                onClick={() => toggleSubmenu(item.title)}
                _hover={{
                  bg: { base: "rgba(255, 255, 255, 0.1)", _light: "#f3f4f6" },
                }}
                bg={isParentActive ? { base: "rgba(20, 184, 166, 0.2)", _light: "rgba(20, 184, 166, 0.1)" } : "transparent"}
                title={item.title}
              >
                <Icon 
                  as={item.icon} 
                  fontSize="20px"
                  color={getIconColor(item.title, isParentActive)}
                />
              </Flex>
            ) : (
              <Flex
                gap={3}
                px={4}
                py={2.5}
                mx={1}
                borderRadius="md"
                transition="all 0.2s"
                cursor="pointer"
                onClick={() => toggleSubmenu(item.title)}
                _hover={{
                  bg: isParentActive ? { base: "rgba(88, 28, 135, 0.3)", _light: "rgba(88, 28, 135, 0.15)" } : { base: "rgba(255, 255, 255, 0.05)", _light: "#f3f4f6" },
                }}
                bg={isParentActive ? { base: "rgba(88, 28, 135, 0.3)", _light: "rgba(88, 28, 135, 0.15)" } : "transparent"}
                color={isParentActive ? { base: "#ffffff", _light: "#581c87" } : { base: "#d1d5db", _light: "#374151" }}
                alignItems="center"
                fontSize="sm"
                fontWeight={isParentActive ? "600" : "500"}
              >
                <Icon 
                  as={item.icon} 
                  fontSize="18px"
                  color={getIconColor(item.title, isParentActive)}
                />
                <Text flex={1}>{item.title}</Text>
                <Icon 
                  as={isSubmenuOpen ? FiChevronDown : FiChevronRight}
                  fontSize="14px"
                  color={isParentActive ? { base: "#ffffff", _light: "#581c87" } : { base: "#9ca3af", _light: "#6b7280" }}
                />
              </Flex>
            )}
            {isSubmenuOpen && !isCollapsed && (
              <Box
                pl={8}
                pr={2}
                mt={1}
                animation="slideDown 0.3s ease-in-out"
                css={{
                  "@keyframes slideDown": {
                    "0%": {
                      opacity: "0",
                      maxHeight: "0",
                      transform: "translateY(-10px)",
                    },
                    "100%": {
                      opacity: "1",
                      maxHeight: "500px",
                      transform: "translateY(0)",
                    },
                  },
                }}
              >
              {item.submenu?.map((subItem) => {
                const isSubActive = location.pathname === subItem.path
                return (
                  <RouterLink key={subItem.path} to={subItem.path as any} onClick={onClose}>
                      <Flex
                        gap={2.5}
                        px={4}
                        py={2}
                        mx={1}
                        mb={0.5}
                        borderRadius="md"
                        transition="all 0.2s"
                        cursor="pointer"
                        _hover={{
                          bg: isSubActive ? { base: "rgba(88, 28, 135, 0.3)", _light: "rgba(88, 28, 135, 0.15)" } : { base: "rgba(255, 255, 255, 0.05)", _light: "#f3f4f6" },
                          transform: "translateX(2px)",
                        }}
                        bg={isSubActive ? { base: "rgba(88, 28, 135, 0.3)", _light: "rgba(88, 28, 135, 0.15)" } : "transparent"}
                        color={isSubActive ? { base: "#ffffff", _light: "#581c87" } : { base: "#9ca3af", _light: "#6b7280" }}
                        alignItems="center"
                        fontSize="sm"
                        fontWeight={isSubActive ? "600" : "500"}
                        position="relative"
                        _before={isSubActive ? {
                          content: '""',
                          position: "absolute",
                          left: 0,
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: "3px",
                          height: "14px",
                          bg: "#14b8a6",
                          borderRadius: "0 2px 2px 0",
                        } : undefined}
                      >
                        <Icon 
                          as={
                            subItem.title === "POS" 
                              ? FiCreditCard 
                              : subItem.title === "Categories"
                              ? FiTag
                              : TbReceiptDollar
                          }
                          fontSize="16px"
                          color={isSubActive ? "#14b8a6" : getIconColor(item.title, false)}
                        />
                        <Text>{subItem.title}</Text>
                      </Flex>
                  </RouterLink>
                )
              })}
              </Box>
            )}
          </>
        ) : (
          <RouterLink to={item.path as any} onClick={onClose}>
            {isCollapsed ? (
              <Flex
                justifyContent="center"
                alignItems="center"
                py={2.5}
                mx={1}
                borderRadius="md"
                transition="all 0.2s"
                cursor="pointer"
                _hover={{
                  bg: { base: "rgba(255, 255, 255, 0.1)", _light: "#f3f4f6" },
                }}
                bg={isActive ? { base: "rgba(20, 184, 166, 0.2)", _light: "rgba(20, 184, 166, 0.1)" } : "transparent"}
                title={item.title}
              >
                <Icon 
                  as={item.icon} 
                  fontSize="20px"
                  color={getIconColor(item.title, isActive)}
                />
              </Flex>
            ) : (
              <Flex
                gap={3}
                px={4}
                py={2.5}
                mx={1}
                borderRadius="md"
                transition="all 0.2s"
                cursor="pointer"
                _hover={{
                  bg: isActive ? { base: "rgba(88, 28, 135, 0.3)", _light: "rgba(88, 28, 135, 0.15)" } : { base: "rgba(255, 255, 255, 0.05)", _light: "#f3f4f6" },
                  transform: "translateX(2px)",
                }}
                bg={isActive ? { base: "rgba(88, 28, 135, 0.3)", _light: "rgba(88, 28, 135, 0.15)" } : "transparent"}
                color={isActive ? { base: "#ffffff", _light: "#581c87" } : { base: "#d1d5db", _light: "#374151" }}
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
                  bg: "#14b8a6",
                  borderRadius: "0 2px 2px 0",
                } : undefined}
              >
                <Icon 
                  as={item.icon} 
                  fontSize="18px"
                  color={getIconColor(item.title, isActive)}
                />
                <Text>{item.title}</Text>
              </Flex>
            )}
          </RouterLink>
        )}
      </Box>
    )
  })

  return (
    <Box>
      {!isCollapsed && (
        <Text 
          fontSize="xs" 
          px={5} 
          py={3} 
          fontWeight="700"
          color={{ base: "#6b7280", _light: "#6b7280" }}
          textTransform="uppercase"
          letterSpacing="1.5px"
          mb={1}
        >
          Navigation
        </Text>
      )}
      <Box px={isCollapsed ? 1 : 2} pt={2}>
        {listItems}
      </Box>
    </Box>
  )
}

export default SidebarItems