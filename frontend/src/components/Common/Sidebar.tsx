import { Box, Flex, IconButton, Text } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { FaBars } from "react-icons/fa"
import { FiLogOut } from "react-icons/fi"

import type { UserPublic } from "@/client"
import useAuth from "@/hooks/useAuth"
import {
  DrawerBackdrop,
  DrawerBody,
  DrawerCloseTrigger,
  DrawerContent,
  DrawerRoot,
  DrawerTrigger,
} from "../ui/drawer"
import SidebarItems from "./SidebarItems"

// Shared scrollbar styles
const SCROLLBAR_STYLES = {
  "&::-webkit-scrollbar": {
    width: "8px",
  },
  "&::-webkit-scrollbar-track": {
    background: "transparent",
    borderRadius: "4px",
  },
  "&::-webkit-scrollbar-thumb": {
    background: "rgba(59, 130, 246, 0.3)",
    borderRadius: "4px",
    border: "2px solid transparent",
    backgroundClip: "content-box",
  },
  "&::-webkit-scrollbar-thumb:hover": {
    background: "rgba(59, 130, 246, 0.5)",
    backgroundClip: "content-box",
  },
  "&::-webkit-scrollbar-thumb:active": {
    background: "rgba(59, 130, 246, 0.7)",
    backgroundClip: "content-box",
  },
  scrollbarWidth: "thin",
  scrollbarColor: "rgba(59, 130, 246, 0.3) transparent",
} as const

// Shared color values
const COLORS = {
  glassBg: { base: "rgba(15, 20, 30, 0.95)", _light: "rgba(255, 255, 255, 0.95)" },
  footerBg: { base: "rgba(10, 14, 20, 0.6)", _light: "rgba(255, 255, 255, 0.6)" },
  border: { base: "rgba(59, 130, 246, 0.2)", _light: "rgba(59, 130, 246, 0.3)" },
  text: { base: "gray.300", _light: "gray.700" },
  subtext: { base: "gray.400", _light: "gray.600" },
} as const

// Footer component used in both mobile and desktop
const SidebarFooter = ({ currentUser, logout }: { currentUser?: UserPublic | null; logout: () => void }) => (
  <Box 
    borderTop="1px solid" 
    borderColor={COLORS.border}
    bg={COLORS.footerBg}
    p={4}
  >
    <Flex
      as="button"
      onClick={logout}
      alignItems="center"
      gap={3}
      px={3}
      py={2}
      borderRadius="lg"
      w="full"
      color={COLORS.text}
      aria-label="Log out of your account"
      _hover={{
        bg: "rgba(59, 130, 246, 0.1)",
        color: "#60a5fa",
        transform: "translateX(2px)",
      }}
      transition="all 0.2s"
    >
      <FiLogOut aria-hidden="true" />
      <Text fontSize="sm" fontWeight="medium">Log Out</Text>
    </Flex>
    
    {currentUser?.full_name && (
      <Text fontSize="xs" color={COLORS.subtext} mt={2} truncate>
        {currentUser.full_name}
      </Text>
    )}
  </Box>
)

const Sidebar = () => {
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
  const { logout } = useAuth()
  const [open, setOpen] = useState(false)

  const handleClose = () => setOpen(false)

  return (
    <>
      {/* Mobile Drawer */}
      <DrawerRoot
        placement="start"
        open={open}
        onOpenChange={(e) => setOpen(e.open)}
      >
        <DrawerBackdrop />
        <DrawerTrigger asChild>
          <IconButton
            variant="ghost"
            color="gray.300"
            display={{ base: "flex", md: "none" }}
            aria-label="Open navigation menu"
            position="absolute"
            zIndex="100"
            m={4}
            bg="rgba(15, 20, 30, 0.8)"
            backdropFilter="blur(10px)"
            border="1px solid"
            borderColor="rgba(59, 130, 246, 0.2)"
            _hover={{
              bg: "rgba(59, 130, 246, 0.1)",
              color: "#60a5fa",
              borderColor: "rgba(59, 130, 246, 0.4)",
              transform: "scale(1.1)",
            }}
            transition="all 0.2s"
          >
            <FaBars />
          </IconButton>
        </DrawerTrigger>
        <DrawerContent 
          maxW="xs" 
          bg={{ base: "rgba(15, 20, 30, 0.98)", _light: "rgba(255, 255, 255, 0.98)" }} 
          backdropFilter="blur(20px)"
        >
          <DrawerCloseTrigger />
          <DrawerBody p={0} bg={COLORS.glassBg} css={SCROLLBAR_STYLES}>
            <Flex flexDir="column" h="full">
              <Box flex="1" overflowY="auto" p={4}>
                <SidebarItems onClose={handleClose} />
              </Box>
              
              <SidebarFooter currentUser={currentUser} logout={logout} />
            </Flex>
          </DrawerBody>
        </DrawerContent>
      </DrawerRoot>

      {/* Desktop Sidebar */}
      <Box
        display={{ base: "none", md: "flex" }}
        position="sticky"
        bg={COLORS.glassBg}
        backdropFilter="blur(20px) saturate(180%)"
        borderRight="1px solid"
        borderColor={COLORS.border}
        top={0}
        minW="xs"
        h="100vh"
        flexDirection="column"
        boxShadow={{ base: "4px 0 20px rgba(0, 0, 0, 0.3)", _light: "4px 0 20px rgba(0, 0, 0, 0.1)" }}
      >
        <Box flex="1" overflowY="auto" p={4} css={SCROLLBAR_STYLES}>
          <SidebarItems />
        </Box>

        <SidebarFooter currentUser={currentUser} logout={logout} />
      </Box>
    </>
  )
}

export default Sidebar