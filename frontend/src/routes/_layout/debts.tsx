import { Container, Heading, Text } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/debts")({
  component: Debts,
})

function Debts() {
  return (
    <Container maxW="full">
      <Heading
        size="lg"
        pt={12}
        mb={4}
        color={{ base: "#e5e7eb", _light: "#111827" }}
      >
        Debts & Credit Management
      </Heading>
      <Text color={{ base: "#d1d5db", _light: "#6b7280" }}>
        Track credit sales, customer account balances, payment history, and
        aging reports.
      </Text>
      {/* Debts functionality will be implemented here */}
    </Container>
  )
}
