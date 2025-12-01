import {
  Box,
  Flex,
  HStack,
  Icon,
  IconButton,
  Text,
  useBreakpointValue,
  VStack,
} from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"
import { FaBars } from "react-icons/fa"
import { FiChevronDown, FiLogOut, FiUser } from "react-icons/fi"
import useAuth from "@/hooks/useAuth"
import { getUserInitials } from "@/utils"
import { ColorModeButton } from "../ui/color-mode"
import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from "../ui/menu"
import NotificationBell from "./NotificationBell"

interface NavbarProps {
  onMenuClick?: () => void
  sidebarCollapsed?: boolean
  isPOSMode?: boolean
}

function Navbar({
  onMenuClick,
  sidebarCollapsed = false,
  isPOSMode = false,
}: NavbarProps) {
  const display = useBreakpointValue({ base: "none", md: "flex" })
  const { user, logout } = useAuth()

  return (
    <>
      {/* Mobile Navbar - Visible on small screens */}
      <Flex
        display={{ base: "flex", md: "none" }}
        justify="space-between"
        position="sticky"
        align="center"
        bg="bg.canvas"
        w="100%"
        top={0}
        px={4}
        py={3}
        zIndex={10}
        boxShadow={{
          base: "0 1px 3px rgba(0, 0, 0, 0.2)",
          _light: "0 1px 2px rgba(0, 0, 0, 0.05)",
        }}
        gap={4}
      >
        {/* Left: Hamburger Menu */}
        <HStack gap={2}>
          <IconButton
            variant="ghost"
            aria-label="Menu"
            color="text.primary"
            _hover={{
              bg: {
                base: "rgba(255, 255, 255, 0.1)",
                _light: "rgba(0, 0, 0, 0.05)",
              },
            }}
            size="sm"
            onClick={onMenuClick}
          >
            <FaBars fontSize="20px" />
          </IconButton>
          <Text
            fontSize="lg"
            fontWeight="700"
            color={{ base: "#ffffff", _light: "#1a1d29" }}
          >
            Finance Tracker
          </Text>
        </HStack>

        {/* Right: User Profile */}
        <MenuRoot>
          <MenuTrigger asChild>
            <IconButton
              variant="ghost"
              aria-label="User menu"
              size="sm"
              w={10}
              h={10}
              borderRadius="full"
              bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              color="white"
              fontSize="xs"
              fontWeight="700"
              border="2px solid"
              borderColor={{
                base: "rgba(255, 255, 255, 0.1)",
                _light: "rgba(0, 0, 0, 0.1)",
              }}
            >
              {getUserInitials(user?.full_name, user?.email)}
            </IconButton>
          </MenuTrigger>
          <MenuContent>
            <Link to="/settings">
              <MenuItem
                closeOnSelect
                value="user-settings"
                gap={2}
                py={2}
                style={{ cursor: "pointer" }}
              >
                <FiUser fontSize="18px" />
                <Box flex="1">My Profile</Box>
              </MenuItem>
            </Link>
            <MenuItem
              value="logout"
              gap={2}
              py={2}
              onClick={logout}
              style={{ cursor: "pointer" }}
            >
              <FiLogOut />
              Log Out
            </MenuItem>
          </MenuContent>
        </MenuRoot>
      </Flex>

      {/* Desktop Navbar - Visible on medium+ screens */}
      <Flex
        display={display}
        justify="space-between"
        position="sticky"
        align="center"
        bg="bg.canvas"
        w="100%"
        top={0}
        px={isPOSMode ? 4 : 6}
        py={3}
        zIndex={10}
        boxShadow={{
          base: "0 1px 3px rgba(0, 0, 0, 0.2)",
          _light: "0 1px 2px rgba(0, 0, 0, 0.05)",
        }}
        gap={4}
      >
        {/* Left Section: Logo and Hamburger */}
        <HStack gap={3} flexShrink={0} alignItems="center" position="relative">
          <Link to="/" style={{ textDecoration: "none" }}>
            <HStack gap={2} alignItems="center">
              {/* Logo Icon */}
              <Box
                w={10}
                h={10}
                borderRadius="lg"
                bg={{
                  base: "rgba(26, 29, 41, 0.8)",
                  _light: "rgba(255, 255, 255, 0.9)",
                }}
                border="2px solid"
                borderColor={{
                  base: "rgba(255, 255, 255, 0.1)",
                  _light: "rgba(0, 0, 0, 0.1)",
                }}
                display="flex"
                alignItems="center"
                justifyContent="center"
                flexShrink={0}
                boxShadow={{
                  base: "0 2px 8px rgba(0, 0, 0, 0.3)",
                  _light: "0 2px 8px rgba(0, 0, 0, 0.1)",
                }}
                transition="all 0.3s ease"
              >
                <HStack gap={0.5} alignItems="center" justifyContent="center">
                  <Text
                    fontSize={isPOSMode ? "sm" : sidebarCollapsed ? "xs" : "sm"}
                    fontWeight="800"
                    color="brand.primary"
                    letterSpacing="0px"
                    lineHeight="1"
                  >
                    W
                  </Text>
                  <Text
                    fontSize={isPOSMode ? "sm" : sidebarCollapsed ? "xs" : "sm"}
                    fontWeight="800"
                    color="brand.secondary"
                    letterSpacing="0px"
                    lineHeight="1"
                  >
                    M
                  </Text>
                  <Text
                    fontSize={isPOSMode ? "sm" : sidebarCollapsed ? "xs" : "sm"}
                    fontWeight="800"
                    color="brand.accent"
                    letterSpacing="0px"
                    lineHeight="1"
                  >
                    P
                  </Text>
                </HStack>
              </Box>

              {/* Logo Text */}
              <VStack
                align="start"
                gap={0}
                display={
                  isPOSMode ? "flex" : sidebarCollapsed ? "none" : "flex"
                }
                transition="all 0.3s ease"
                opacity={isPOSMode ? 1 : sidebarCollapsed ? 0 : 1}
                maxW={isPOSMode ? "200px" : sidebarCollapsed ? "0" : "200px"}
                overflow="hidden"
              >
                <HStack gap={0} alignItems="baseline" lineHeight="1.2">
                  <Text
                    fontSize="lg"
                    fontWeight="700"
                    color="brand.primary"
                    letterSpacing="0.5px"
                  >
                    W
                  </Text>
                  <Text
                    fontSize="lg"
                    fontWeight="700"
                    color="text.primary"
                    letterSpacing="0.5px"
                  >
                    ise
                  </Text>
                  <Text
                    fontSize="lg"
                    fontWeight="700"
                    color="brand.secondary"
                    letterSpacing="0.5px"
                  >
                    M
                  </Text>
                  <Text
                    fontSize="lg"
                    fontWeight="700"
                    color="text.primary"
                    letterSpacing="0.5px"
                  >
                    an
                  </Text>
                  <Text
                    fontSize="lg"
                    fontWeight="700"
                    color="brand.accent"
                    letterSpacing="0.5px"
                  >
                    P
                  </Text>
                  <Text
                    fontSize="lg"
                    fontWeight="700"
                    color="text.primary"
                    letterSpacing="0.5px"
                  >
                    alace
                  </Text>
                </HStack>
                <Text
                  fontSize="xs"
                  fontWeight="500"
                  color="text.muted"
                  letterSpacing="0.3px"
                  textTransform="uppercase"
                >
                  Club Management
                </Text>
              </VStack>
            </HStack>
          </Link>
          {!isPOSMode && (
            <IconButton
              variant="ghost"
              aria-label="Menu"
              color={{ base: "#9ca3af", _light: "#6b7280" }}
              _hover={{
                bg: {
                  base: "rgba(255, 255, 255, 0.05)",
                  _light: "rgba(0, 0, 0, 0.05)",
                },
              }}
              size="sm"
              onClick={onMenuClick}
              display="flex"
            >
              <FaBars fontSize="18px" />
            </IconButton>
          )}
        </HStack>

        {/* Center Section: Search Bar - Hidden in POS mode */}
        {/* {!isPOSMode && (
        <Box flex="1" maxW="400px" mx={4} display={{ base: "none", md: "block" }}>
          <Input
            placeholder="Search products"
            bg={{ base: "rgba(255, 255, 255, 0.05)", _light: "#f3f4f6" }}
            border="1px solid"
            borderColor={{ base: "rgba(255, 255, 255, 0.1)", _light: "#e5e7eb" }}
            borderRadius="md"
            color="text.primary"
            _placeholder={{ color: { base: "#6b7280", _light: "#9ca3af" } }}
            _focus={{
              borderColor: { base: "rgba(255, 255, 255, 0.2)", _light: "#14b8a6" },
              boxShadow: "none",
            }}
            px={4}
            py={2}
          />
        </Box>
      )} */}

        {/* Right Section: Icons and User - Hidden in POS mode */}
        {!isPOSMode && (
          <HStack gap={3} alignItems="center" flexShrink={0}>
            {/* Theme Toggle */}
            <ColorModeButton />

            {/* Notification Bell Component */}
            <NotificationBell variant="desktop" />

            {/* User Profile */}
            <MenuRoot>
              <MenuTrigger asChild>
                <HStack
                  as="button"
                  gap={2}
                  alignItems="center"
                  px={2}
                  py={1}
                  borderRadius="md"
                  _hover={{
                    bg: {
                      base: "rgba(255, 255, 255, 0.05)",
                      _light: "rgba(0, 0, 0, 0.05)",
                    },
                  }}
                  transition="all 0.2s"
                >
                  <Box
                    w={10}
                    h={10}
                    borderRadius="full"
                    bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    color="white"
                    fontSize="xs"
                    fontWeight="700"
                    flexShrink={0}
                    border="2px solid"
                    borderColor={{
                      base: "rgba(255, 255, 255, 0.1)",
                      _light: "rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    {getUserInitials(user?.full_name, user?.email)}
                  </Box>
                  <Text
                    fontSize="sm"
                    fontWeight="600"
                    color={{ base: "#ffffff", _light: "#1a1d29" }}
                    display={{ base: "none", lg: "block" }}
                  >
                    {user?.full_name || "User"}
                  </Text>
                  <Icon
                    as={FiChevronDown}
                    fontSize="14px"
                    color={{ base: "#9ca3af", _light: "#6b7280" }}
                    display={{ base: "none", lg: "block" }}
                  />
                </HStack>
              </MenuTrigger>
              <MenuContent>
                <Link to="/settings">
                  <MenuItem
                    closeOnSelect
                    value="user-settings"
                    gap={2}
                    py={2}
                    style={{ cursor: "pointer" }}
                  >
                    <FiUser fontSize="18px" />
                    <Box flex="1">My Profile</Box>
                  </MenuItem>
                </Link>
                <MenuItem
                  value="logout"
                  gap={2}
                  py={2}
                  onClick={logout}
                  style={{ cursor: "pointer" }}
                >
                  <FiLogOut />
                  Log Out
                </MenuItem>
              </MenuContent>
            </MenuRoot>
          </HStack>
        )}
      </Flex>
    </>
  )
}

export default Navbar
