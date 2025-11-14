import { Box, Card, Flex, Icon, Text } from "@chakra-ui/react"
import { Link as RouterLink } from "@tanstack/react-router"
import type { IconType } from "react-icons/lib"

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
  iconColor = "teal.600",
  iconBg = "teal.50",
  disabled = false,
}: ModuleCardProps) => {
  const content = (
    <Card.Root
      variant="outline"
      _hover={{
        shadow: disabled ? "none" : "lg",
        transform: disabled ? "none" : "translateY(-2px)",
        borderColor: disabled ? undefined : "teal.500",
      }}
      transition="all 0.2s"
      cursor={disabled ? "not-allowed" : "pointer"}
      opacity={disabled ? 0.6 : 1}
      h="full"
      minH="120px"
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
            borderRadius="lg"
            w={{ base: 12, md: 14 }}
            h={{ base: 12, md: 14 }}
            flexShrink={0}
          >
            <Icon as={icon} boxSize={{ base: 5, md: 6 }} color={iconColor} />
          </Flex>

          {/* Text Content */}
          <Flex direction="column" gap={1} flex={1} minW={0}>
            <Text 
              fontSize={{ base: "md", md: "lg" }} 
              fontWeight="semibold" 
              lineHeight="tight"
              noOfLines={2}
            >
              {title}
            </Text>
            <Text 
              fontSize="sm"
              color={{ base: "gray.400", _light: "gray.600" }}
              noOfLines={1}
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
