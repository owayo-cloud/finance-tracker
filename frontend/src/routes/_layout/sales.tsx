import { Container, Heading, Text } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"

// @ts-expect-error - Route will be registered after Vite regenerates routeTree.gen.ts
export const Route = createFileRoute("/_layout/sales")({
  component: Sales,
})

function Sales() {
  return (
    <Container maxW="full">
      <Heading size="lg" pt={12} mb={4}>
        Sales Management
      </Heading>
      <Text color="gray.600">
        Record sales transactions, track payment methods (Cash, M-Pesa), and manage real-time inventory updates.
      </Text>
      {/* Sales functionality will be implemented here */}
    </Container>
  )
}
