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
            color="inherit"
            display={{ base: "flex", md: "none" }}
            aria-label="Open Menu"
            position="absolute"
            zIndex="100"
            m={4}
          >
            <FaBars />
          </IconButton>
        </DrawerTrigger>
        <DrawerContent maxW="xs">
          <DrawerCloseTrigger />
          <DrawerBody 
            p={0}
            css={{
              "&::-webkit-scrollbar": {
                width: "8px",
              },
              "&::-webkit-scrollbar-track": {
                background: "transparent",
              },
              "&::-webkit-scrollbar-thumb": {
                background: "var(--chakra-colors-gray-300)",
                borderRadius: "4px",
              },
              "&::-webkit-scrollbar-thumb:hover": {
                background: "var(--chakra-colors-gray-400)",
              },
              scrollbarWidth: "thin",
              scrollbarColor: "var(--chakra-colors-gray-300) transparent",
            }}
          >
            <Flex flexDir="column" h="full">
              <Box flex="1" overflowY="auto" p={4}>
                <SidebarItems onClose={() => setOpen(false)} />
              </Box>
              
              {/* Footer section - always visible */}
              <Box 
                borderTop="1px solid" 
                borderColor="border.subtle"
                bg="bg.subtle"
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
                  _hover={{
                    bg: { base: "gray.700", _light: "gray.100" },
                  }}
                  transition="all 0.2s"
                >
                  <FiLogOut />
                  <Text>Log Out</Text>
                </Flex>
                
                {currentUser?.email && (
                  <Text fontSize="xs" color={{ base: "gray.400", _light: "gray.600" }} mt={2} truncate>
                    {currentUser.email}
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
        bg={{ base: "gray.800", _light: "white" }}
        borderRight="1px solid"
        borderColor={{ base: "gray.700", _light: "gray.200" }}
        top={0}
        minW="xs"
        h="100vh"
        flexDirection="column"
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
              background: "var(--chakra-colors-gray-400)",
              borderRadius: "4px",
              border: "2px solid transparent",
              backgroundClip: "content-box",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              background: "var(--chakra-colors-gray-500)",
              backgroundClip: "content-box",
            },
            "&::-webkit-scrollbar-thumb:active": {
              background: "var(--chakra-colors-gray-600)",
              backgroundClip: "content-box",
            },
            // Firefox
            scrollbarWidth: "thin",
            scrollbarColor: "var(--chakra-colors-gray-400) transparent",
          }}
        >
          <SidebarItems />
        </Box>

        {/* Footer section - always visible */}
        <Box 
          borderTop="1px solid" 
          borderColor={{ base: "gray.700", _light: "gray.200" }}
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
            _hover={{
              bg: { base: "gray.700", _light: "gray.100" },
            }}
            transition="all 0.2s"
          >
            <FiLogOut />
            <Text fontSize="sm">Log Out</Text>
          </Flex>
          
          {currentUser?.email && (
            <Text fontSize="xs" color={{ base: "gray.400", _light: "gray.600" }} mt={2} truncate>
              {currentUser.email}
            </Text>
          )}
        </Box>
      </Box>
    </>
  )
}

export default Sidebar
