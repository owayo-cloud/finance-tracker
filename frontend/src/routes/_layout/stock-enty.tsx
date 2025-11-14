import { Container, Heading, Text } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"

// @ts-expect-error - Route will be registered after Vite regenerates routeTree.gen.ts
export const Route = createFileRoute("/_layout/stock-enty")({
  component: StockEntry,
})

function StockEntry() {
  return (
    <Container maxW="full">
      <Heading size="lg" pt={12} mb={4}>
        Stock Entry
      </Heading>
      <Text color="gray.600">
        Track daily inventory: opening stock, incoming deliveries, sales, and closing stock.
      </Text>
      {/* Stock Entry functionality will be implemented here */}
    </Container>
  )
}
