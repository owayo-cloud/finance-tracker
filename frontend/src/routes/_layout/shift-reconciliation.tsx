import { Container, Heading, Text } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/shift-reconciliation")({
  component: ShiftReconciliation,
})

function ShiftReconciliation() {
  return (
    <Container maxW="full">
      <Heading 
        size="lg" 
        pt={12} 
        mb={4}
        color={{ base: "#e5e7eb", _light: "#111827" }}
      >
        Shift Reconciliation
      </Heading>
      <Text color={{ base: "#d1d5db", _light: "#6b7280" }}>
        End-of-shift reconciliation: physical count, variance tracking, and payment method summaries.
      </Text>
      {/* Shift Reconciliation functionality will be implemented here */}
    </Container>
  )
}
