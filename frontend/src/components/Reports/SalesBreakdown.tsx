import { Badge, Button, Card, Grid, HStack, Heading, Table, VStack } from "@chakra-ui/react"
import { FiDownload, FiPrinter } from "react-icons/fi"
import { formatCurrency, downloadCSV, formatDate } from "./utils"

interface SalesBreakdownProps {
  salesSummary: {
    totalAmount: number
    paymentMethodBreakdown: Record<string, { count: number; amount: number }>
    cashierBreakdown: Record<string, { count: number; amount: number }>
  }
  salesData: any[]
  startDate: string
  endDate: string
}

function exportSalesToCSV(salesData: any[], startDate: string, endDate: string) {
  const headers = [
    "Date",
    "Receipt No",
    "Product",
    "Quantity",
    "Unit Price",
    "Total Amount",
    "Payment Method",
    "Cashier",
    "Remarks",
  ]
  const rows = salesData.map((sale) => [
    formatDate(sale.sale_date),
    sale.id.slice(-6),
    sale.product.name,
    sale.quantity.toString(),
    formatCurrency(sale.unit_price),
    formatCurrency(sale.total_amount),
    sale.payment_method?.name || "Unknown",
    sale.created_by?.full_name || sale.created_by?.username || "Unknown",
    sale.notes || "",
  ])
  downloadCSV([headers, ...rows], `sales-report-${startDate}-to-${endDate}.csv`)
}

function printReport() {
  window.print()
}

export function SalesBreakdown({
  salesSummary,
  salesData,
  startDate,
  endDate,
}: SalesBreakdownProps) {
  return (
    <Grid templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }} gap={4}>
      {/* Payment Method Breakdown */}
      <Card.Root
        variant="outline"
        bg="bg.surface"
        borderColor="border.card"
        borderWidth="1px"
      >
        <Card.Body>
          <VStack align="stretch" gap={4}>
            <HStack justify="space-between">
              <Heading size="md">By Payment Method</Heading>
              <HStack gap={2}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportSalesToCSV(salesData, startDate, endDate)}
                >
                  <FiDownload size={14} style={{ marginRight: "4px" }} />
                  CSV
                </Button>
                <Button size="sm" variant="outline" onClick={printReport}>
                  <FiPrinter size={14} style={{ marginRight: "4px" }} />
                  Print
                </Button>
              </HStack>
            </HStack>
            <Table.Root size="sm">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Method</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right">Count</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right">Amount</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right">%</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {Object.entries(salesSummary.paymentMethodBreakdown)
                  .sort((a, b) => b[1].amount - a[1].amount)
                  .map(([method, data]) => (
                    <Table.Row key={method}>
                      <Table.Cell fontWeight="medium">{method}</Table.Cell>
                      <Table.Cell textAlign="right">{data.count}</Table.Cell>
                      <Table.Cell textAlign="right">
                        Ksh {formatCurrency(data.amount)}
                      </Table.Cell>
                      <Table.Cell textAlign="right">
                        <Badge colorPalette="blue">
                          {((data.amount / salesSummary.totalAmount) * 100).toFixed(1)}%
                        </Badge>
                      </Table.Cell>
                    </Table.Row>
                  ))}
              </Table.Body>
            </Table.Root>
          </VStack>
        </Card.Body>
      </Card.Root>

      {/* Cashier Breakdown */}
      <Card.Root
        variant="outline"
        bg="bg.surface"
        borderColor="border.card"
        borderWidth="1px"
      >
        <Card.Body>
          <VStack align="stretch" gap={4}>
            <HStack justify="space-between">
              <Heading size="md">By Cashier</Heading>
              <Button
                size="sm"
                variant="outline"
                onClick={() => exportSalesToCSV(salesData, startDate, endDate)}
              >
                <FiDownload size={14} style={{ marginRight: "4px" }} />
                CSV
              </Button>
            </HStack>
            <Table.Root size="sm">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Cashier</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right">Count</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right">Amount</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right">%</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {Object.entries(salesSummary.cashierBreakdown)
                  .sort((a, b) => b[1].amount - a[1].amount)
                  .map(([cashier, data]) => (
                    <Table.Row key={cashier}>
                      <Table.Cell fontWeight="medium">{cashier}</Table.Cell>
                      <Table.Cell textAlign="right">{data.count}</Table.Cell>
                      <Table.Cell textAlign="right">
                        Ksh {formatCurrency(data.amount)}
                      </Table.Cell>
                      <Table.Cell textAlign="right">
                        <Badge colorPalette="teal">
                          {((data.amount / salesSummary.totalAmount) * 100).toFixed(1)}%
                        </Badge>
                      </Table.Cell>
                    </Table.Row>
                  ))}
              </Table.Body>
            </Table.Root>
          </VStack>
        </Card.Body>
      </Card.Root>
    </Grid>
  )
}

