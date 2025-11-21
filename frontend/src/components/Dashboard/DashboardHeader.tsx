import { Box, Heading, Text } from "@chakra-ui/react"

interface DashboardHeaderProps {
  userName?: string
  isMounted: boolean
}

export function DashboardHeader({ userName, isMounted }: DashboardHeaderProps) {
  return (
    <Box 
      pt={8} 
      pb={6}
      opacity={isMounted ? 1 : 0}
      transform={isMounted ? "translateY(0)" : "translateY(20px)"}
      transition="all 0.5s ease"
    >
      <Box mb={6}>
        <Heading 
          size="xl" 
          fontWeight="700"
          color={{ base: "#ffffff", _light: "#1a1d29" }}
          mb={1}
        >
          Dashboard
        </Heading>
        <Text 
          fontSize="sm" 
          color={{ base: "#9ca3af", _light: "#6b7280" }}
          fontWeight="500"
        >
          Welcome back, {userName || "user"}
        </Text>
      </Box>
    </Box>
  )
}

