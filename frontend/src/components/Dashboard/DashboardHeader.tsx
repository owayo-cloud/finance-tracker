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
        <Heading size="xl" fontWeight="700" color="text.primary" mb={1}>
          Dashboard
        </Heading>
        <Text fontSize="sm" color="text.muted" fontWeight="500">
          Welcome back, nice to see you again!
        </Text>
        <Text fontSize="xs" color="text.muted" fontWeight="500">
          Signed in as {userName || "user"}
        </Text>
      </Box>
    </Box>
  )
}
