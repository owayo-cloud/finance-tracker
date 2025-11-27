import {
  Badge,
  Box,
  Flex,
  HStack,
  Icon,
  IconButton,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useState } from "react"
import { FiLogOut, FiMoreVertical, FiUser, FiX } from "react-icons/fi"

import type { UserPublic } from "@/client"
import useAuth from "@/hooks/useAuth"
import { getUserInitials } from "@/utils"
import {
  DrawerBackdrop,
  DrawerBody,
  DrawerCloseTrigger,
  DrawerContent,
  DrawerRoot,
} from "../ui/drawer"
import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from "../ui/menu"
import SidebarItems from "./SidebarItems"

interface SidebarProps {
  open?: boolean
  onOpenChange?: (e: { open: boolean }) => void
  isCollapsed?: boolean
}

const Sidebar = ({
  open: controlledOpen,
  onOpenChange,
  isCollapsed = false,
}: SidebarProps) => {
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
  const { logout } = useAuth()
  const [internalOpen, setInternalOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
  }

  // Use controlled state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange({ open: newOpen })
    } else {
      setInternalOpen(newOpen)
    }
  }

  return (
    <>
      {/* Mobile Drawer - Only for mobile screens */}
      <DrawerRoot
        placement="start"
        open={open}
        onOpenChange={(e) => setOpen(e.open)}
      >
        <DrawerBackdrop />
        <DrawerContent
          maxW="xs"
          w="280px"
          bg={{ base: "#1a1d29", _light: "#ffffff" }}
          borderRight="1px solid"
          borderColor={{ base: "rgba(255, 255, 255, 0.08)", _light: "#e5e7eb" }}
        >
          {/* Mobile Drawer Header */}
          <Flex
            align="center"
            justify="space-between"
            p={4}
            borderBottom="1px solid"
            borderColor={{
              base: "rgba(255, 255, 255, 0.08)",
              _light: "#e5e7eb",
            }}
            flexShrink={0}
          >
            <HStack gap={2}>
              <Box
                w={8}
                h={8}
                borderRadius="lg"
                bg="rgba(0, 150, 136, 0.1)"
                border="2px solid"
                borderColor="rgba(0, 150, 136, 0.3)"
                display="flex"
                alignItems="center"
                justifyContent="center"
                flexShrink={0}
              >
                <Text fontSize="xs" fontWeight="800" color="#009688">
                  FT
                </Text>
              </Box>
              <Text
                fontSize="md"
                fontWeight="700"
                color={{ base: "#ffffff", _light: "#1a1d29" }}
              >
                Menu
              </Text>
            </HStack>
            <DrawerCloseTrigger asChild>
              <IconButton
                variant="ghost"
                aria-label="Close menu"
                size="sm"
                color={{ base: "#9ca3af", _light: "#6b7280" }}
                _hover={{
                  bg: {
                    base: "rgba(255, 255, 255, 0.05)",
                    _light: "rgba(0, 0, 0, 0.05)",
                  },
                }}
              >
                <Icon as={FiX} fontSize="20px" />
              </IconButton>
            </DrawerCloseTrigger>
          </Flex>
          <DrawerBody p={0} overflow="hidden">
            <Flex flexDir="column" h="full" overflow="hidden">
              {/* Menu Items - Scrollable */}
              <Box
                flex="1"
                overflowY="auto"
                overflowX="hidden"
                py={4}
                minH="0"
                css={{
                  "&::-webkit-scrollbar": {
                    width: "6px",
                  },
                  "&::-webkit-scrollbar-track": {
                    background: "transparent",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    background: {
                      base: "rgba(255, 255, 255, 0.2)",
                      _light: "rgba(0, 0, 0, 0.2)",
                    },
                    borderRadius: "3px",
                  },
                  "&::-webkit-scrollbar-thumb:hover": {
                    background: {
                      base: "rgba(255, 255, 255, 0.3)",
                      _light: "rgba(0, 0, 0, 0.3)",
                    },
                  },
                  scrollbarWidth: "thin",
                  scrollbarColor: {
                    base: "rgba(255, 255, 255, 0.2) transparent",
                    _light: "rgba(0, 0, 0, 0.2) transparent",
                  },
                }}
              >
                <SidebarItems onClose={() => setOpen(false)} />
              </Box>

              {/* User Profile Footer - Fixed */}
              <Box
                borderTop="1px solid"
                borderColor={{
                  base: "rgba(255, 255, 255, 0.1)",
                  _light: "gray.200",
                }}
                p={4}
                bg={{ base: "rgba(0, 0, 0, 0.2)", _light: "gray.50" }}
                flexShrink={0}
              >
                {currentUser && (
                  <HStack
                    mb={3}
                    p={2}
                    borderRadius="lg"
                    _hover={{
                      bg: {
                        base: "rgba(255, 255, 255, 0.05)",
                        _light: "rgba(0, 0, 0, 0.05)",
                      },
                    }}
                  >
                    <Box
                      w={8}
                      h={8}
                      borderRadius="full"
                      bg="blue.500"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      color="white"
                      fontSize="sm"
                      fontWeight="bold"
                      flexShrink={0}
                    >
                      {getUserInitials(
                        currentUser.full_name,
                        currentUser.email,
                      )}
                    </Box>
                    <VStack align="start" flex={1} gap={0}>
                      <Text
                        fontSize="sm"
                        fontWeight="600"
                        color={{ base: "white", _light: "gray.800" }}
                      >
                        {currentUser.full_name || "User"}
                      </Text>
                      <Text
                        fontSize="xs"
                        color={{ base: "gray.400", _light: "gray.600" }}
                        truncate
                        maxW="150px"
                      >
                        {currentUser.email}
                      </Text>
                    </VStack>
                  </HStack>
                )}
                <Flex
                  as="button"
                  onClick={() => {
                    logout()
                  }}
                  alignItems="center"
                  gap={3}
                  px={3}
                  py={2}
                  borderRadius="lg"
                  w="full"
                  color={{ base: "gray.300", _light: "gray.700" }}
                  _hover={{
                    bg: {
                      base: "rgba(255, 255, 255, 0.1)",
                      _light: "rgba(0, 0, 0, 0.05)",
                    },
                    color: { base: "white", _light: "gray.900" },
                  }}
                  transition="all 0.2s"
                >
                  <FiLogOut />
                  <Text fontSize="sm">Log Out</Text>
                </Flex>
              </Box>
            </Flex>
          </DrawerBody>
        </DrawerContent>
      </DrawerRoot>

      {/* Desktop */}
      <Flex
        display={{ base: "none", md: "flex" }}
        bg={{ base: "#1a1d29", _light: "#ffffff" }}
        borderRight="1px solid"
        borderColor={{ base: "rgba(255, 255, 255, 0.08)", _light: "#e5e7eb" }}
        w={isCollapsed ? "70px" : "260px"}
        h="100%"
        direction="column"
        boxShadow={{
          base: "2px 0 8px rgba(0, 0, 0, 0.4)",
          _light: "2px 0 8px rgba(0, 0, 0, 0.08)",
        }}
        transition="width 0.3s ease, box-shadow 0.3s ease"
        overflow="hidden"
        flexShrink={0}
        alignSelf="stretch"
      >
        {/* User Profile Section at Top - Fixed */}
        {currentUser && !isCollapsed && (
          <Box
            p={4}
            bg={{ base: "#1a1d29", _light: "#ffffff" }}
            minW="260px"
            flexShrink={0}
            borderBottom="1px solid"
            borderColor={{
              base: "rgba(255, 255, 255, 0.08)",
              _light: "#e5e7eb",
            }}
          >
            <HStack gap={3} justify="space-between" align="center">
              <HStack gap={3} flex={1}>
                <Box
                  w={12}
                  h={12}
                  borderRadius="full"
                  bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  color="white"
                  fontSize="sm"
                  fontWeight="700"
                  flexShrink={0}
                  border="2px solid"
                  borderColor={{
                    base: "rgba(255, 255, 255, 0.1)",
                    _light: "rgba(0, 0, 0, 0.1)",
                  }}
                >
                  {getUserInitials(currentUser.full_name, currentUser.email)}
                </Box>
                <VStack align="start" gap={0} flex={1} minW={0}>
                  <Text
                    fontSize="sm"
                    fontWeight="600"
                    color={{ base: "#ffffff", _light: "#1a1d29" }}
                    lineHeight="1.2"
                  >
                    {currentUser.full_name || "User"}
                  </Text>
                  <Badge
                    mt={1}
                    px={2}
                    py={0.5}
                    bg={
                      currentUser.is_superuser
                        ? "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)" // Purple for Admin
                        : currentUser.is_auditor
                          ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" // Blue for Auditor
                          : "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)" // Green for Cashier
                    }
                    color="white"
                    fontSize="2xs"
                    fontWeight="700"
                    borderRadius="sm"
                    textTransform="uppercase"
                    letterSpacing="0.5px"
                  >
                    {currentUser.is_superuser
                      ? "Admin"
                      : currentUser.is_auditor
                        ? "Auditor"
                        : "Cashier"}
                  </Badge>
                </VStack>
              </HStack>
              <MenuRoot>
                <MenuTrigger asChild>
                  <IconButton
                    variant="ghost"
                    aria-label="More options"
                    size="sm"
                    color={{ base: "#9ca3af", _light: "#6b7280" }}
                    _hover={{
                      bg: {
                        base: "rgba(255, 255, 255, 0.05)",
                        _light: "rgba(0, 0, 0, 0.05)",
                      },
                    }}
                  >
                    <Icon as={FiMoreVertical} fontSize="16px" />
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
                    onClick={handleLogout}
                    style={{ cursor: "pointer" }}
                  >
                    <FiLogOut />
                    Log Out
                  </MenuItem>
                </MenuContent>
              </MenuRoot>
            </HStack>
          </Box>
        )}

        {/* Scrollable menu items */}
        <Box
          flex="1"
          overflowY="auto"
          overflowX="hidden"
          py={4}
          minW={isCollapsed ? "70px" : "260px"}
          minH="0"
          maxH="100%"
          css={{
            "&::-webkit-scrollbar": {
              width: "6px",
            },
            "&::-webkit-scrollbar-track": {
              background: "transparent",
            },
            "&::-webkit-scrollbar-thumb": {
              background: {
                base: "rgba(255, 255, 255, 0.2)",
                _light: "rgba(0, 0, 0, 0.2)",
              },
              borderRadius: "3px",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              background: {
                base: "rgba(255, 255, 255, 0.3)",
                _light: "rgba(0, 0, 0, 0.3)",
              },
            },
            scrollbarWidth: "thin",
            scrollbarColor: {
              base: "rgba(255, 255, 255, 0.2) transparent",
              _light: "rgba(0, 0, 0, 0.2) transparent",
            },
          }}
        >
          <SidebarItems isCollapsed={isCollapsed} />
        </Box>
      </Flex>
    </>
  )
}

export default Sidebar
