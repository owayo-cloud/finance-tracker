import { Box, Button, Flex, Text } from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"
import { FaUserAstronaut } from "react-icons/fa"
import { FiLogOut, FiUser } from "react-icons/fi"

import useAuth from "@/hooks/useAuth"
import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from "../ui/menu"

const UserMenu = () => {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    logout()
  }

  return (
    <>
      {/* Desktop */}
      <Flex>
        <MenuRoot>
          <MenuTrigger asChild p={2}>
            <Button 
              data-testid="user-menu" 
              variant="solid" 
              maxW="sm" 
              truncate
              bg="rgba(59, 130, 246, 0.1)"
              border="1px solid"
              borderColor="rgba(59, 130, 246, 0.3)"
              color="#60a5fa"
              _hover={{
                bg: "rgba(59, 130, 246, 0.2)",
                borderColor: "rgba(59, 130, 246, 0.5)",
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
              }}
              transition="all 0.2s"
            >
              <FaUserAstronaut fontSize="18" />
              <Text fontWeight="medium">{user?.full_name || "User"}</Text>
            </Button>
          </MenuTrigger>

          <MenuContent
            bg="rgba(15, 20, 30, 0.98)"
            backdropFilter="blur(20px)"
            border="1px solid"
            borderColor="rgba(59, 130, 246, 0.2)"
            boxShadow="0 10px 40px rgba(0, 0, 0, 0.5)"
          >
            <Link to="/settings">
              <MenuItem
                closeOnSelect
                value="user-settings"
                gap={2}
                py={2}
                color="gray.300"
                _hover={{
                  bg: "rgba(59, 130, 246, 0.1)",
                  color: "#60a5fa",
                }}
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
              color="gray.300"
              _hover={{
                bg: "rgba(239, 68, 68, 0.1)",
                color: "#ef4444",
              }}
              style={{ cursor: "pointer" }}
            >
              <FiLogOut />
              Log Out
            </MenuItem>
          </MenuContent>
        </MenuRoot>
      </Flex>
    </>
  )
}

export default UserMenu
