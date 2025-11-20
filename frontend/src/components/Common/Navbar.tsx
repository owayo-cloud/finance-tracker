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
      bg={{ base: "gray.800", _light: "white" }}
      borderBottom="1px"
      borderColor={{ base: "gray.700", _light: "gray.200" }}
      w="100%"
      top={0}
      p={4}
      zIndex={10}
    >
      <Link to="/">
        <Image src={Logo} alt="Logo" maxW="3xs" p={2} />
      </Link>
      <Flex gap={2} alignItems="center">
        <ColorModeButton />
        <UserMenu />
      </Flex>
    </Flex>
  )
}

export default Navbar