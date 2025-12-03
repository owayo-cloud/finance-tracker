import { Box, Flex, Icon, Text } from "@chakra-ui/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Link as RouterLink, useLocation } from "@tanstack/react-router"
import { useState } from "react"
import {
  FiBarChart2,
  FiBox,
  FiChevronDown,
  FiChevronRight,
  FiCreditCard,
  FiDollarSign,
  FiHome,
  FiLock,
  FiPackage,
  FiSettings,
  FiShoppingCart,
  FiTag,
  FiTrendingUp,
  FiTruck,
  FiUserCheck,
  FiUsers,
} from "react-icons/fi"
import type { IconType } from "react-icons/lib"
import { TbReceiptDollar } from "react-icons/tb"
import type { UserPublic } from "@/client"
import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from "../ui/menu"
import { Tooltip } from "../ui/tooltip"

const _API_BASE = import.meta.env.VITE_API_URL || ""

const _getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
})

interface SidebarMenuItem {
  icon: IconType
  title: string
  path?: string
  adminOnly?: boolean
  submenu?: { title: string; path: string }[]
}

const menuItems: SidebarMenuItem[] = [
  { icon: FiHome, title: "Dashboard", path: "/", adminOnly: true },
  {
    icon: FiShoppingCart,
    title: "Sales",
    submenu: [
      { title: "POS", path: "/sales" },
      { title: "Shift Reconciliation", path: "/shift-reconciliation" },
    ],
  },
  {
    icon: FiBox,
    title: "Purchases",
    submenu: [
      { title: "Goods Receipt Note", path: "/grn" },
      { title: "Stock Entry", path: "/stock-entry" },
      { title: "Suppliers", path: "/suppliers" },
      { title: "Transporters", path: "/transporters" },
    ],
  },
  {
    icon: FiPackage,
    title: "Products",
    adminOnly: true,
    submenu: [
      { title: "Products", path: "/products" },
      { title: "Stock Adjustment", path: "/stock-adjustment" },
    ],
  },
  { icon: FiBarChart2, title: "Reports", path: "/reports", adminOnly: true },
  {
    icon: FiDollarSign,
    title: "Expenses",
    adminOnly: true,
    submenu: [
      { title: "Expenses", path: "/expenses" },
      { title: "Categories", path: "/expense-categories" },
    ],
  },
  { icon: FiTrendingUp, title: "Invoices", path: "/invoices", adminOnly: true },
  {
    icon: FiCreditCard,
    title: "Payment Methods",
    path: "/payment-methods",
    adminOnly: true,
  },
  { icon: FiUsers, title: "Users", path: "/admin", adminOnly: true },
  { icon: FiSettings, title: "User Settings", path: "/settings" },
]

interface SidebarItemsProps {
  onClose?: () => void
  isCollapsed?: boolean
}

const getIconColor = (title: string, isActive: boolean): string => {
  if (isActive) {
    return "#14b8a6"
  }

  const colorMap: Record<string, string> = {
    Dashboard: "#3b82f6",
    Sales: "#ef4444",
    Purchases: "#f59e0b",
    Products: "#8b5cf6",
    Reports: "#10b981",
    Expenses: "#f97316",
    Invoices: "#ec4899",
    "Payment Methods": "#06b6d4",
    Users: "#6366f1",
    "User Settings": "#64748b",
  }

  return colorMap[title] || "#9ca3af"
}

const getSubmenuIcon = (title: string): IconType => {
  const iconMap: Record<string, IconType> = {
    POS: FiCreditCard,
    "Shift Reconciliation": TbReceiptDollar,
    "Goods Receipt Note": TbReceiptDollar,
    "Stock Entry": FiBox,
    Suppliers: FiUserCheck,
    Transporters: FiTruck,
    Products: FiPackage,
    "Stock Adjustment": FiBox,
    Expenses: FiDollarSign,
    Categories: FiTag,
  }

  return iconMap[title] || FiBox
}

const SidebarItems = ({ onClose, isCollapsed = false }: SidebarItemsProps) => {
  const queryClient = useQueryClient()
  const location = useLocation()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    Sales:
      location.pathname === "/sales" ||
      location.pathname === "/shift-reconciliation",
    Expenses:
      location.pathname === "/expenses" ||
      location.pathname === "/expense-categories",
    Purchases:
      location.pathname === "/grn" ||
      location.pathname === "/stock-entry" ||
      location.pathname === "/suppliers" ||
      location.pathname === "/transporters",
    Products:
      location.pathname === "/products" ||
      location.pathname === "/stock-adjustment",
  })

  // Check till status for POS link
  const { data: tillStatus } = useQuery({
    queryKey: ["till-status"],
    queryFn: async () => {
      try {
        return await TillService.getTillStatus()
      } catch (error: any) {
        // If 404 or any error, return closed status
        if (error?.status === 404) {
          return { is_open: false }
        }
        return { is_open: false }
      }
    },
    refetchInterval: 5000, // Check every 5 seconds
    enabled: true,
  })

  const isTillOpen = tillStatus?.is_open === true

  const filteredItems = menuItems.filter(
    (item) => !item.adminOnly || currentUser?.is_superuser,
  )

  const finalItems: SidebarMenuItem[] = filteredItems

  const toggleSubmenu = (title: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [title]: !prev[title],
    }))
  }

  const isPathActive = (path?: string) => {
    if (!path) return false
    return location.pathname === path
  }

  const isSubmenuItemActive = (submenu?: { title: string; path: string }[]) => {
    if (!submenu) return false
    return submenu.some((item) => location.pathname === item.path)
  }

  const listItems = finalItems.map((item) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0
    const isSubmenuOpen = openSubmenus[item.title] || false
    const isActive =
      isPathActive(item.path) || isSubmenuItemActive(item.submenu)
    const isParentActive = Boolean(
      hasSubmenu && isSubmenuItemActive(item.submenu),
    )

    return (
      <Box key={item.title} mb={1}>
        {hasSubmenu ? (
          <>
            {isCollapsed ? (
              <MenuRoot
                positioning={{
                  placement: "right-start",
                  offset: { mainAxis: 8 },
                }}
              >
                <MenuTrigger asChild>
                  <Flex
                    justifyContent="center"
                    alignItems="center"
                    py={2.5}
                    mx={1}
                    borderRadius="md"
                    transition="all 0.2s"
                    cursor="pointer"
                    _hover={{
                      bg: {
                        base: "rgba(255, 255, 255, 0.1)",
                        _light: "#f3f4f6",
                      },
                    }}
                    bg={
                      isParentActive
                        ? {
                            base: "rgba(20, 184, 166, 0.2)",
                            _light: "rgba(20, 184, 166, 0.1)",
                          }
                        : "transparent"
                    }
                    title={item.title}
                  >
                    <Icon
                      as={item.icon}
                      fontSize="20px"
                      color={getIconColor(item.title, isParentActive)}
                    />
                  </Flex>
                </MenuTrigger>
                <MenuContent
                  bg={{ base: "#1a1d29", _light: "#ffffff" }}
                  borderColor={{
                    base: "rgba(255, 255, 255, 0.1)",
                    _light: "#e5e7eb",
                  }}
                  minW="200px"
                  py={1}
                >
                  {item.submenu?.map((subItem) => {
                    const isSubActive = location.pathname === subItem.path
                    const isPOSLink = subItem.path === "/sales"
                    const isPOSDisabled = isPOSLink && !isTillOpen

                    const submenuItem = (
                      <MenuItem
                        key={subItem.path}
                        value={subItem.path}
                        asChild
                        disabled={isPOSDisabled}
                        bg={
                          isSubActive
                            ? {
                                base: "rgba(20, 184, 166, 0.2)",
                                _light: "rgba(20, 184, 166, 0.1)",
                              }
                            : "transparent"
                        }
                        color={
                          isSubActive
                            ? { base: "#14b8a6", _light: "#14b8a6" }
                            : { base: "#ffffff", _light: "#1a1d29" }
                        }
                        _hover={
                          isPOSDisabled
                            ? {}
                            : {
                                bg: {
                                  base: "rgba(255, 255, 255, 0.1)",
                                  _light: "#f3f4f6",
                                },
                              }
                        }
                        opacity={isPOSDisabled ? 0.5 : 1}
                        cursor={isPOSDisabled ? "not-allowed" : "pointer"}
                      >
                        <RouterLink to={subItem.path as any} onClick={onClose}>
                          <Flex gap={2} alignItems="center" w="full">
                            {isPOSDisabled && (
                              <Icon
                                as={FiLock}
                                fontSize="14px"
                                color="red.500"
                              />
                            )}
                            <Icon
                              as={getSubmenuIcon(subItem.title)}
                              fontSize="16px"
                              color={
                                isSubActive
                                  ? "#14b8a6"
                                  : getIconColor(item.title, false)
                              }
                            />
                            <Text fontSize="sm">{subItem.title}</Text>
                          </Flex>
                        </RouterLink>
                      </MenuItem>
                    )

                    if (isPOSDisabled) {
                      return (
                        <Tooltip
                          key={subItem.path}
                          content="Till not yet opened"
                          openDelay={300}
                        >
                          <Box>{submenuItem}</Box>
                        </Tooltip>
                      )
                    }

                    return submenuItem
                  })}
                </MenuContent>
              </MenuRoot>
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
                  bg: isParentActive
                    ? {
                        base: "rgba(88, 28, 135, 0.3)",
                        _light: "rgba(88, 28, 135, 0.15)",
                      }
                    : { base: "rgba(255, 255, 255, 0.05)", _light: "#f3f4f6" },
                }}
                bg={
                  isParentActive
                    ? {
                        base: "rgba(88, 28, 135, 0.3)",
                        _light: "rgba(88, 28, 135, 0.15)",
                      }
                    : "transparent"
                }
                color={
                  isParentActive
                    ? { base: "#ffffff", _light: "#581c87" }
                    : { base: "#d1d5db", _light: "#374151" }
                }
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
                  color={
                    isParentActive
                      ? { base: "#ffffff", _light: "#581c87" }
                      : { base: "#9ca3af", _light: "#6b7280" }
                  }
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
                  // Check if this is the POS link and if till is open
                  const isPOSLink = subItem.path === "/sales"
                  const isPOSDisabled = isPOSLink && !isTillOpen

                  const menuItem = (
                    <Flex
                      gap={2.5}
                      px={4}
                      py={2}
                      mx={1}
                      mb={0.5}
                      borderRadius="md"
                      transition="all 0.2s"
                      cursor={isPOSDisabled ? "not-allowed" : "pointer"}
                      opacity={isPOSDisabled ? 0.5 : 1}
                      onClick={
                        isPOSDisabled ? (e) => e.preventDefault() : undefined
                      }
                      _hover={
                        isPOSDisabled
                          ? {}
                          : {
                              bg: isSubActive
                                ? {
                                    base: "rgba(88, 28, 135, 0.3)",
                                    _light: "rgba(88, 28, 135, 0.15)",
                                  }
                                : {
                                    base: "rgba(255, 255, 255, 0.05)",
                                    _light: "#f3f4f6",
                                  },
                              transform: "translateX(2px)",
                            }
                      }
                      bg={
                        isSubActive
                          ? {
                              base: "rgba(88, 28, 135, 0.3)",
                              _light: "rgba(88, 28, 135, 0.15)",
                            }
                          : isPOSDisabled
                            ? {
                                base: "rgba(0, 0, 0, 0.1)",
                                _light: "rgba(0, 0, 0, 0.05)",
                              }
                            : "transparent"
                      }
                      color={
                        isSubActive
                          ? { base: "#ffffff", _light: "#581c87" }
                          : isPOSDisabled
                            ? { base: "#6b7280", _light: "#9ca3af" }
                            : { base: "#9ca3af", _light: "#6b7280" }
                      }
                      alignItems="center"
                      fontSize="sm"
                      fontWeight={isSubActive ? "600" : "500"}
                      position="relative"
                      _before={
                        isSubActive
                          ? {
                              content: '""',
                              position: "absolute",
                              left: 0,
                              top: "50%",
                              transform: "translateY(-50%)",
                              width: "3px",
                              height: "14px",
                              bg: "#14b8a6",
                              borderRadius: "0 2px 2px 0",
                            }
                          : undefined
                      }
                    >
                      {isPOSDisabled && (
                        <Icon
                          as={FiLock}
                          fontSize="14px"
                          color="red.500"
                          mr={-1}
                        />
                      )}
                      <Icon
                        as={getSubmenuIcon(subItem.title)}
                        fontSize="16px"
                        color={
                          isSubActive
                            ? "#14b8a6"
                            : getIconColor(item.title, false)
                        }
                      />
                      <Text>{subItem.title}</Text>
                    </Flex>
                  )

                  if (isPOSDisabled) {
                    return (
                      <Tooltip
                        key={subItem.path}
                        content="Till not yet opened"
                        openDelay={300}
                      >
                        <Box>{menuItem}</Box>
                      </Tooltip>
                    )
                  }

                  return (
                    <RouterLink
                      key={subItem.path}
                      to={subItem.path as any}
                      onClick={onClose}
                    >
                      {menuItem}
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
                bg={
                  isActive
                    ? {
                        base: "rgba(20, 184, 166, 0.2)",
                        _light: "rgba(20, 184, 166, 0.1)",
                      }
                    : "transparent"
                }
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
                  bg: isActive
                    ? {
                        base: "rgba(88, 28, 135, 0.3)",
                        _light: "rgba(88, 28, 135, 0.15)",
                      }
                    : { base: "rgba(255, 255, 255, 0.05)", _light: "#f3f4f6" },
                  transform: "translateX(2px)",
                }}
                bg={
                  isActive
                    ? {
                        base: "rgba(88, 28, 135, 0.3)",
                        _light: "rgba(88, 28, 135, 0.15)",
                      }
                    : "transparent"
                }
                color={
                  isActive
                    ? { base: "#ffffff", _light: "#581c87" }
                    : { base: "#d1d5db", _light: "#374151" }
                }
                position="relative"
                alignItems="center"
                fontSize="sm"
                fontWeight={isActive ? "600" : "500"}
                _before={
                  isActive
                    ? {
                        content: '""',
                        position: "absolute",
                        left: 0,
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: "3px",
                        height: "20px",
                        bg: "#14b8a6",
                        borderRadius: "0 2px 2px 0",
                      }
                    : undefined
                }
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
