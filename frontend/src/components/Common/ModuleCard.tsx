import { Box, Card, Flex, Icon, Text } from "@chakra-ui/react"
import { Link as RouterLink } from "@tanstack/react-router"
import type { IconType } from "react-icons/lib"
import { useColorMode } from "@/components/ui/color-mode"

interface ModuleCardProps {
  icon: IconType
  title: string
  description: string
  path: string
  iconColor?: string
  iconBg?: string
  disabled?: boolean
}

const ModuleCard = ({
  icon,
  title,
  description,
  path,
  iconColor = "#3b82f6",
  iconBg = "rgba(59, 130, 246, 0.1)",
  disabled = false,
}: ModuleCardProps) => {
  const { colorMode } = useColorMode()
  
  // Theme-aware gradient for title
  const titleGradient = colorMode === "dark"
    ? "linear-gradient(to right, #60a5fa, #3b82f6)"
    : "linear-gradient(to right, #2563eb, #3b82f6)"
  const content = (
    <Card.Root
      variant="outline"
      bg={{ base: "rgba(15, 20, 30, 0.7)", _light: "rgba(255, 255, 255, 0.8)" }}
      backdropFilter="blur(20px) saturate(180%)"
      border="1px solid"
      borderColor={{ base: "rgba(59, 130, 246, 0.2)", _light: "rgba(59, 130, 246, 0.3)" }}
      borderRadius="2xl"
      boxShadow={{ base: "0 10px 40px rgba(0, 0, 0, 0.4), 0 0 1px rgba(59, 130, 246, 0.2)", _light: "0 10px 40px rgba(0, 0, 0, 0.1), 0 0 1px rgba(59, 130, 246, 0.2)" }}
      _hover={{
        shadow: disabled ? "none" : { base: "0 20px 60px rgba(59, 130, 246, 0.3), 0 0 30px rgba(59, 130, 246, 0.15)", _light: "0 20px 60px rgba(59, 130, 246, 0.2), 0 0 30px rgba(59, 130, 246, 0.1)" },
        transform: disabled ? "none" : "translateY(-4px)",
        borderColor: disabled ? undefined : "rgba(59, 130, 246, 0.4)",
      }}
      transition="all 0.3s ease"
      cursor={disabled ? "not-allowed" : "pointer"}
      opacity={disabled ? 0.6 : 1}
      h="full"
      minH="140px"
      display="flex"
      flexDirection="column"
    >
      <Card.Body p={{ base: 5, md: 6 }} flex="1" display="flex" alignItems="center">
        <Flex gap={{ base: 3, md: 4 }} align="center" w="full">
          {/* Icon Container */}
          <Flex
            align="center"
            justify="center"
            bg={iconBg}
            borderRadius="xl"
            w={{ base: 14, md: 16 }}
            h={{ base: 14, md: 16 }}
            flexShrink={0}
            border="1px solid"
            borderColor="rgba(59, 130, 246, 0.2)"
            boxShadow="0 0 20px rgba(59, 130, 246, 0.2)"
          >
            <Icon as={icon} boxSize={{ base: 6, md: 7 }} color={iconColor} />
          </Flex>

          {/* Text Content */}
          <Flex direction="column" gap={1} flex={1} minW={0}>
            <Text 
              fontSize={{ base: "md", md: "lg" }} 
              fontWeight="bold" 
              lineHeight="tight"
              lineClamp={2}
              css={{
                background: titleGradient,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {title}
            </Text>
            <Text 
              fontSize="sm"
              color={{ base: "#9ca3af", _light: "#6b7280" }}
              lineClamp={1}
            >
              {description}
            </Text>
          </Flex>
        </Flex>
      </Card.Body>
    </Card.Root>
  )

  if (disabled) {
    return <Box h="full">{content}</Box>
  }

  return (
    <RouterLink to={path} style={{ textDecoration: "none", height: "100%", display: "block" }}>
      {content}
    </RouterLink>
  )
}

export default ModuleCard