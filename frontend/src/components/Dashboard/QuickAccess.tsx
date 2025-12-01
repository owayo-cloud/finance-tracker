import {
  Badge,
  Box,
  Heading,
  HStack,
  Icon,
  Text,
  VStack,
} from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"
import { FiClock } from "react-icons/fi"
import type { IconType } from "react-icons/lib"

interface Module {
  icon: IconType
  title: string
  description: string
  path: string
  iconColor: string
}

interface PageVisit {
  path: string
  count: number
}

interface QuickAccessProps {
  quickAccessModules: Module[]
  mostVisitedPages: PageVisit[]
}

export function QuickAccess({
  quickAccessModules,
  mostVisitedPages,
}: QuickAccessProps) {
  return (
    <Box
      p={6}
      bg={{ base: "#1a1d29", _light: "#ffffff" }}
      borderRadius="lg"
      border="1px solid"
      borderColor={{ base: "rgba(255, 255, 255, 0.08)", _light: "#e5e7eb" }}
      boxShadow={{
        base: "0 2px 4px rgba(0, 0, 0, 0.2)",
        _light: "0 1px 3px rgba(0, 0, 0, 0.1)",
      }}
    >
      <Heading
        size="md"
        fontWeight="600"
        color={{ base: "#ffffff", _light: "#1a1d29" }}
        mb={4}
      >
        Quick Access
      </Heading>

      <VStack gap={3} align="stretch" maxH="400px" overflowY="auto">
        {quickAccessModules.length > 0 ? (
          quickAccessModules.map((module) => {
            const visitData = mostVisitedPages.find(
              (v) => v.path === module.path,
            )
            return (
              <Link
                key={module.title}
                to={module.path}
                style={{ textDecoration: "none" }}
              >
                <Box
                  p={3}
                  borderRadius="md"
                  bg={{ base: "rgba(255, 255, 255, 0.05)", _light: "#f9fafb" }}
                  border="1px solid"
                  borderColor={{
                    base: "rgba(255, 255, 255, 0.08)",
                    _light: "#e5e7eb",
                  }}
                  _hover={{
                    bg: {
                      base: "rgba(255, 255, 255, 0.08)",
                      _light: "#f3f4f6",
                    },
                    transform: "translateX(4px)",
                  }}
                  transition="all 0.2s"
                >
                  <HStack gap={3}>
                    <Icon
                      as={module.icon}
                      fontSize="lg"
                      color={module.iconColor}
                    />
                    <VStack align="start" gap={0} flex={1}>
                      <HStack gap={2} w="full">
                        <Text
                          fontSize="sm"
                          fontWeight="600"
                          color={{ base: "#ffffff", _light: "#1a1d29" }}
                        >
                          {module.title}
                        </Text>
                        {visitData && visitData.count > 0 && (
                          <Badge
                            colorPalette="blue"
                            variant="subtle"
                            fontSize="2xs"
                          >
                            {visitData.count}x
                          </Badge>
                        )}
                      </HStack>
                      <Text
                        fontSize="xs"
                        color={{ base: "#9ca3af", _light: "#6b7280" }}
                      >
                        {module.description}
                      </Text>
                    </VStack>
                    <Icon
                      as={FiClock}
                      fontSize="sm"
                      color={{ base: "#9ca3af", _light: "#6b7280" }}
                    />
                  </HStack>
                </Box>
              </Link>
            )
          })
        ) : (
          <Text
            fontSize="sm"
            color={{ base: "#9ca3af", _light: "#6b7280" }}
            textAlign="center"
            py={4}
          >
            Start visiting pages to see your quick access here
          </Text>
        )}
      </VStack>
    </Box>
  )
}
