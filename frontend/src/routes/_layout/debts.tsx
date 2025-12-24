import { Container, Heading, Text } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"
import { usePageMetadata } from "@/hooks/usePageMetadata"

export const Route = createFileRoute("/_layout/debts")({
  component: Debts,
})

function Debts() {
  usePageMetadata({
    title: "Debts & Credits",
    description:
      "Track credit sales, customer account balances, and payment history",
  })
  return (
    <Container maxW="full">
      <Heading size="lg" pt={12} mb={4} color="text.primary">
        Debts & Credits
      </Heading>
      <Text color="text.muted">
        Track credit sales, customer account balances, payment history, and
        aging reports.
      </Text>
      {/* Debts functionality will be implemented here */}
    </Container>
  )
}
