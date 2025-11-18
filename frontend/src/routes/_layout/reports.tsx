import { Container, Heading, Text } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/reports")({
  component: Reports,
})

function Reports() {
  return (
    <Container maxW="full">
      <Heading 
        size="lg" 
        pt={12} 
        mb={4}
        color={{ base: "#e5e7eb", _light: "#111827" }}
      >
        Reports & Analytics
      </Heading>
      <Text color={{ base: "#d1d5db", _light: "#6b7280" }}>
        View sales reports, stock movements, financial summaries, and business insights.
      </Text>
      {/* Reports functionality will be implemented here */}
    </Container>
  )
}
