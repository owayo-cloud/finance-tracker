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

const Sidebar = () => {
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
  const { logout } = useAuth()
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile */}
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
            aria-label="Open Menu"
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
        <DrawerContent maxW="xs" bg={{ base: "rgba(15, 20, 30, 0.98)", _light: "rgba(255, 255, 255, 0.98)" }} backdropFilter="blur(20px)">
          <DrawerCloseTrigger />
          <DrawerBody 
            p={0}
            bg={{ base: "rgba(15, 20, 30, 0.95)", _light: "rgba(255, 255, 255, 0.95)" }}
            css={{
              "&::-webkit-scrollbar": {
                width: "8px",
              },
              "&::-webkit-scrollbar-track": {
                background: "transparent",
              },
              "&::-webkit-scrollbar-thumb": {
                background: "rgba(59, 130, 246, 0.3)",
                borderRadius: "4px",
              },
              "&::-webkit-scrollbar-thumb:hover": {
                background: "rgba(59, 130, 246, 0.5)",
              },
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(59, 130, 246, 0.3) transparent",
            }}
          >
            <Flex flexDir="column" h="full">
              <Box flex="1" overflowY="auto" p={4}>
                <SidebarItems onClose={() => setOpen(false)} />
              </Box>
              
              {/* Footer section - always visible */}
              <Box 
                borderTop="1px solid" 
                borderColor={{ base: "rgba(59, 130, 246, 0.2)", _light: "rgba(59, 130, 246, 0.3)" }}
                bg={{ base: "rgba(10, 14, 20, 0.6)", _light: "rgba(255, 255, 255, 0.6)" }}
                p={4}
              >
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
                    bg: "rgba(59, 130, 246, 0.1)",
                    color: "#60a5fa",
                    transform: "translateX(2px)",
                  }}
                  transition="all 0.2s"
                >
                  <FiLogOut />
                  <Text fontWeight="medium">Log Out</Text>
                </Flex>
                
                {currentUser?.full_name && (
                  <Text fontSize="xs" color={{ base: "gray.400", _light: "gray.600" }} mt={2} truncate>
                    {currentUser.full_name}
                  </Text>
                )}
              </Box>
            </Flex>
          </DrawerBody>
          <DrawerCloseTrigger />
        </DrawerContent>
      </DrawerRoot>

      {/* Desktop */}
      <Box
        display={{ base: "none", md: "flex" }}
        position="sticky"
        bg={{ base: "rgba(15, 20, 30, 0.95)", _light: "rgba(255, 255, 255, 0.95)" }}
        backdropFilter="blur(20px) saturate(180%)"
        borderRight="1px solid"
        borderColor={{ base: "rgba(59, 130, 246, 0.2)", _light: "rgba(59, 130, 246, 0.3)" }}
        top={0}
        minW="xs"
        h="100vh"
        flexDirection="column"
        boxShadow={{ base: "4px 0 20px rgba(0, 0, 0, 0.3)", _light: "4px 0 20px rgba(0, 0, 0, 0.1)" }}
      >
        {/* Scrollable menu items */}
        <Box 
          flex="1"
          overflowY="auto"
          p={4}
          css={{
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
            // Firefox
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(59, 130, 246, 0.3) transparent",
          }}
        >
          <SidebarItems />
        </Box>

        {/* Footer section - always visible */}
        <Box 
          borderTop="1px solid" 
          borderColor={{ base: "rgba(59, 130, 246, 0.2)", _light: "rgba(59, 130, 246, 0.3)" }}
          bg={{ base: "rgba(10, 14, 20, 0.6)", _light: "rgba(255, 255, 255, 0.6)" }}
          p={4}
        >
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
              bg: "rgba(59, 130, 246, 0.1)",
              color: "#60a5fa",
              transform: "translateX(2px)",
            }}
            transition="all 0.2s"
          >
            <FiLogOut />
            <Text fontSize="sm" fontWeight="medium">Log Out</Text>
          </Flex>
          
          {currentUser?.full_name && (
            <Text fontSize="xs" color={{ base: "gray.400", _light: "gray.600" }} mt={2} truncate>
              {currentUser.full_name}
            </Text>
          )}
        </Box>
      </Box>
    </>
  )
}

export default Sidebar
