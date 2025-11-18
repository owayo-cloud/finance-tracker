import { Container, Heading, Text } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/expenses")({
  component: Expenses,
})

function Expenses() {
  return (
    <Container maxW="full">
      <Heading 
        size="lg" 
        pt={12} 
        mb={4}
        color={{ base: "#e5e7eb", _light: "#111827" }}
      >
        Expenses Management
      </Heading>
      <Text color={{ base: "#d1d5db", _light: "#6b7280" }}>
        Track operational expenses, categorize costs, and analyze spending trends.
      </Text>
      {/* Expenses functionality will be implemented here */}
    </Container>
  )
}
