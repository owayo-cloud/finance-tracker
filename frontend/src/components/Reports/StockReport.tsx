import {
  Badge,
  Button,
  Card,
  Grid,
  Heading,
  HStack,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react"
import { FiDownload } from "react-icons/fi"
import { downloadCSV, formatCurrency } from "./utils"

interface StockReportProps {
  stockSummary: {
    totalProducts: number
    totalInventoryValue: number
    lowStockCount: number
    outOfStockCount: number
    products: Array<{
      id: string
      name: string
      category: string
      currentStock: number
      buyingPrice: number
      sellingPrice: number
      inventoryValue: number
      reorderLevel: number
      status: string
    }>
  }
}

function exportStockToCSV(stockSummary: StockReportProps["stockSummary"]) {
  const headers = [
    "Product",
    "Category",
    "Current Stock",
    "Reorder Level",
    "Buying Price",
    "Selling Price",
    "Inventory Value",
    "Status",
  ]
  const rows = stockSummary.products.map((product) => [
    product.name,
    product.category,
    product.currentStock.toString(),
    product.reorderLevel.toString(),
    formatCurrency(product.buyingPrice),
    formatCurrency(product.sellingPrice),
    formatCurrency(product.inventoryValue),
    product.status,
  ])
  downloadCSV(
    [headers, ...rows],
    `stock-report-${new Date().toISOString().split("T")[0]}.csv`,
  )
}

export function StockReport({ stockSummary }: StockReportProps) {
  return (
    <VStack gap={4} align="stretch">
      {/* Stock Summary Cards */}
      <Grid
        templateColumns={{
          base: "1fr",
          md: "repeat(3, 1fr)",
        }}
        gap={4}
      >
        <Card.Root
          variant="outline"
          bg="bg.surface"
          borderColor="border.card"
          borderWidth="1px"
        >
          <Card.Body>
            <VStack align="start" gap={2}>
              <Text fontSize="sm" color="fg.muted">
                Total Products
              </Text>
              <Text fontSize="2xl" fontWeight="bold">
                {stockSummary.totalProducts}
              </Text>
            </VStack>
          </Card.Body>
        </Card.Root>
        <Card.Root
          variant="outline"
          bg="bg.surface"
          borderColor="border.card"
          borderWidth="1px"
        >
          <Card.Body>
            <VStack align="start" gap={2}>
              <Text fontSize="sm" color="fg.muted">
                Low Stock Items
              </Text>
              <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                {stockSummary.lowStockCount}
              </Text>
            </VStack>
          </Card.Body>
        </Card.Root>
        <Card.Root
          variant="outline"
          bg="bg.surface"
          borderColor="border.card"
          borderWidth="1px"
        >
          <Card.Body>
            <VStack align="start" gap={2}>
              <Text fontSize="sm" color="fg.muted">
                Out of Stock
              </Text>
              <Text fontSize="2xl" fontWeight="bold" color="red.500">
                {stockSummary.outOfStockCount}
              </Text>
            </VStack>
          </Card.Body>
        </Card.Root>
      </Grid>

      {/* Stock Table */}
      <Card.Root
        variant="outline"
        bg="bg.surface"
        borderColor="border.card"
        borderWidth="1px"
      >
        <Card.Body>
          <VStack align="stretch" gap={4}>
            <HStack justify="space-between">
              <Heading size="md">Product Inventory</Heading>
              <HStack gap={2}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportStockToCSV(stockSummary)}
                >
                  <FiDownload size={14} style={{ marginRight: "4px" }} />
                  Export CSV
                </Button>
              </HStack>
            </HStack>
            <Table.Root size="sm" variant="outline">
              <Table.Header>
                <Table.Row bg="table.header.bg">
                  <Table.ColumnHeader>Product</Table.ColumnHeader>
                  <Table.ColumnHeader>Category</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right">
                    Stock
                  </Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right">
                    Buying Price
                  </Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right">
                    Inventory Value
                  </Table.ColumnHeader>
                  <Table.ColumnHeader>Status</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {stockSummary.products
                  .sort((a, b) => b.inventoryValue - a.inventoryValue)
                  .map((product) => (
                    <Table.Row
                      key={product.id}
                      bg="table.row.bg"
                      _hover={{ bg: "table.row.hover" }}
                    >
                      <Table.Cell fontWeight="medium">
                        {product.name}
                      </Table.Cell>
                      <Table.Cell>
                        <Badge colorPalette="purple">{product.category}</Badge>
                      </Table.Cell>
                      <Table.Cell textAlign="right">
                        <Badge
                          colorPalette={
                            product.currentStock === 0
                              ? "red"
                              : product.currentStock <= product.reorderLevel
                                ? "orange"
                                : "green"
                          }
                        >
                          {product.currentStock}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell textAlign="right">
                        Ksh {formatCurrency(product.buyingPrice)}
                      </Table.Cell>
                      <Table.Cell textAlign="right" fontWeight="medium">
                        Ksh {formatCurrency(product.inventoryValue)}
                      </Table.Cell>
                      <Table.Cell>
                        <Badge
                          colorPalette={
                            product.status === "Active" ? "green" : "gray"
                          }
                        >
                          {product.status}
                        </Badge>
                      </Table.Cell>
                    </Table.Row>
                  ))}
              </Table.Body>
            </Table.Root>
          </VStack>
        </Card.Body>
      </Card.Root>
    </VStack>
  )
}
