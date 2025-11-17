import { Container, Heading, Text } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/reports")({
  component: Reports,
})

function Reports() {
  return (
    <Container maxW="full">
      <Heading size="lg" pt={12} mb={4}>
        Reports & Analytics
      </Heading>
      <Text color="gray.600">
        View sales reports, stock movements, financial summaries, and business insights.
      </Text>
      {/* Reports functionality will be implemented here */}
    </Container>
  )
}
