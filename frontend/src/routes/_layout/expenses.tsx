import { Container, Heading, Text } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"

// @ts-expect-error - Route will be registered after Vite regenerates routeTree.gen.ts
export const Route = createFileRoute("/_layout/expenses")({
  component: Expenses,
})

function Expenses() {
  return (
    <Container maxW="full">
      <Heading size="lg" pt={12} mb={4}>
        Expenses Management
      </Heading>
      <Text color="gray.600">
        Track operational expenses, categorize costs, and analyze spending trends.
      </Text>
      {/* Expenses functionality will be implemented here */}
    </Container>
  )
}
