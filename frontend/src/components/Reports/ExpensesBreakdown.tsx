import {
  Badge,
  Button,
  Card,
  Heading,
  HStack,
  Table,
  VStack,
} from "@chakra-ui/react"
import { FiDownload } from "react-icons/fi"
import { downloadCSV, formatCurrency, formatDate } from "./utils"

interface ExpensesBreakdownProps {
  expenseSummary: {
    total_amount: number | string
    category_totals: Record<string, number>
  }
  expensesData: any[]
  startDate: string
  endDate: string
}

function exportExpensesToCSV(
  expensesData: any[],
  startDate: string,
  endDate: string,
) {
  const headers = ["Date", "Category", "Description", "Amount", "Created By"]
  const rows = expensesData.map((expense) => [
    formatDate(expense.expense_date),
    expense.category?.name || "Uncategorized",
    expense.description,
    formatCurrency(expense.amount),
    expense.created_by?.full_name || expense.created_by?.username || "Unknown",
  ])
  downloadCSV(
    [headers, ...rows],
    `expenses-report-${startDate}-to-${endDate}.csv`,
  )
}

export function ExpensesBreakdown({
  expenseSummary,
  expensesData,
  startDate,
  endDate,
}: ExpensesBreakdownProps) {
  if (
    !expenseSummary.category_totals ||
    Object.keys(expenseSummary.category_totals).length === 0
  ) {
    return null
  }

  return (
    <Card.Root
      variant="outline"
      bg="bg.surface"
      borderColor="border.card"
      borderWidth="1px"
    >
      <Card.Body>
        <VStack align="stretch" gap={4}>
          <HStack justify="space-between">
            <Heading size="md">Expenses by Category</Heading>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                exportExpensesToCSV(expensesData, startDate, endDate)
              }
            >
              <FiDownload size={14} style={{ marginRight: "4px" }} />
              Export CSV
            </Button>
          </HStack>
          <Table.Root size="sm" variant="outline">
            <Table.Header>
              <Table.Row bg="table.header.bg">
                <Table.ColumnHeader>Category</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="right">
                  Amount
                </Table.ColumnHeader>
                <Table.ColumnHeader textAlign="right">%</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {Object.entries(expenseSummary.category_totals)
                .sort((a, b) => b[1] - a[1])
                .map(([category, amount]) => (
                  <Table.Row
                    key={category}
                    bg="table.row.bg"
                    _hover={{ bg: "table.row.hover" }}
                  >
                    <Table.Cell fontWeight="medium">{category}</Table.Cell>
                    <Table.Cell textAlign="right">
                      Ksh {formatCurrency(amount)}
                    </Table.Cell>
                    <Table.Cell textAlign="right">
                      <Badge colorPalette="red">
                        {(
                          (amount /
                            parseFloat(
                              expenseSummary.total_amount?.toString() || "1",
                            )) *
                          100
                        ).toFixed(1)}
                        %
                      </Badge>
                    </Table.Cell>
                  </Table.Row>
                ))}
            </Table.Body>
          </Table.Root>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
