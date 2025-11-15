import { Container, Heading, Text } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"


export const Route = createFileRoute("/_layout/debts")({
  component: Debts,
})

function Debts() {
  return (
    <Container maxW="full">
      <Heading size="lg" pt={12} mb={4}>
        Debts & Credit Management
      </Heading>
      <Text color="gray.600">
        Track credit sales, customer account balances, payment history, and aging reports.
      </Text>
      {/* Debts functionality will be implemented here */}
    </Container>
  )
}
