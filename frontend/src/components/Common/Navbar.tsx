import { Flex, Image, useBreakpointValue } from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"

import Logo from "/assets/images/fastapi-logo.svg"
import { ColorModeButton } from "../ui/color-mode"
import UserMenu from "./UserMenu"

function Navbar() {
  const display = useBreakpointValue({ base: "none", md: "flex" })

  return (
    <Flex
      display={display}
      justify="space-between"
      position="sticky"
      align="center"
      bg={{ base: "rgba(15, 20, 30, 0.95)", _light: "rgba(255, 255, 255, 0.95)" }}
      backdropFilter="blur(20px) saturate(180%)"
      borderBottom="1px solid"
      borderColor={{ base: "rgba(59, 130, 246, 0.2)", _light: "rgba(59, 130, 246, 0.3)" }}
      w="100%"
      top={0}
      p={4}
      zIndex={10}
      boxShadow={{ base: "0 4px 20px rgba(0, 0, 0, 0.3)", _light: "0 4px 20px rgba(0, 0, 0, 0.1)" }}
    >
      <Link to="/">
        <Image 
          src={Logo} 
          alt="Logo" 
          maxW="3xs" 
          p={2}
          filter="drop-shadow(0 0 10px rgba(59, 130, 246, 0.3))"
          transition="all 0.3s"
          _hover={{
            filter: "drop-shadow(0 0 15px rgba(59, 130, 246, 0.5))",
            transform: "scale(1.05)",
          }}
        />
      </Link>
      <Flex gap={2} alignItems="center">
        <ColorModeButton />
        <UserMenu />
      </Flex>
    </Flex>
  )
}

export default Navbar
