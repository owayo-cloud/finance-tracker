import {
  Badge,
  Box,
  Container,
  Flex,
  Heading,
  Input,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { format } from "date-fns"
import { useState } from "react"
import { DebtsService } from "@/client"
import { formatCurrency } from "@/components/POS/utils"

export const Route = createFileRoute("/_layout/invoices")({
  component: Invoices,
})

function Invoices() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Fetch customer debts (invoices)
  const { data: debtsData, isLoading } = useQuery({
    queryKey: ["customer-invoices", searchQuery, statusFilter],
    queryFn: () =>
      DebtsService.readDebts({
        skip: 0,
        limit: 1000,
        customerName: searchQuery.trim() || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      }),
  })

  const debts = debtsData?.data || []

  const getStatusColor = (status: string) => {
    switch (status) {
      case "overdue":
        return "red"
      case "partial":
        return "orange"
      case "pending":
        return "yellow"
      case "paid":
        return "green"
      default:
        return "gray"
    }
  }

  return (
    <Container maxW="full" py={8}>
      <Heading size="lg" mb={6} color={{ base: "#e5e7eb", _light: "#111827" }}>
        Customer Invoices & Debts
      </Heading>

      <Text color={{ base: "#d1d5db", _light: "#6b7280" }} mb={6}>
        Track customer invoices, outstanding debts, payment history, and aging
        reports.
      </Text>

      {/* Filters */}
      <Box
        mb={6}
        p={4}
        bg={{ base: "#1a1d29", _light: "#ffffff" }}
        borderRadius="lg"
        border="1px solid"
        borderColor={{ base: "rgba(255, 255, 255, 0.08)", _light: "#e5e7eb" }}
      >
        <Flex gap={4} flexWrap="wrap" alignItems="end">
          <Box flex={1} minW="200px">
            <Text
              fontSize="sm"
              fontWeight="medium"
              mb={2}
              color={{ base: "#ffffff", _light: "#1a1d29" }}
            >
              Search Customer
            </Text>
            <Input
              placeholder="Customer name..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchQuery(e.target.value)
              }
              bg={{ base: "#1a1d29", _light: "#ffffff" }}
              borderColor={{
                base: "rgba(255, 255, 255, 0.1)",
                _light: "#e5e7eb",
              }}
              color={{ base: "#ffffff", _light: "#1a1d29" }}
              _focus={{
                borderColor: "#14b8a6",
                boxShadow: "0 0 0 1px #14b8a6",
              }}
            />
          </Box>
          <Box minW="150px">
            <Text
              fontSize="sm"
              fontWeight="medium"
              mb={2}
              color={{ base: "#ffffff", _light: "#1a1d29" }}
            >
              Status
            </Text>
            <select
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setStatusFilter(e.target.value)
              }
              style={{
                width: "100%",
                padding: "0.5rem",
                borderRadius: "0.375rem",
                border: "1px solid",
                backgroundColor: "var(--chakra-colors-bg-surface)",
                color: "var(--chakra-colors-text-primary)",
              }}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="overdue">Overdue</option>
              <option value="paid">Paid</option>
            </select>
          </Box>
        </Flex>
      </Box>

      {/* Invoices Table */}
      <Box
        p={6}
        bg={{ base: "#1a1d29", _light: "#ffffff" }}
        borderRadius="lg"
        border="1px solid"
        borderColor={{ base: "rgba(255, 255, 255, 0.08)", _light: "#e5e7eb" }}
        boxShadow={{
          base: "0 2px 4px rgba(0, 0, 0, 0.2)",
          _light: "0 1px 3px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Box overflowX="auto">
          <Table.Root variant="outline" size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader
                  color={{ base: "#9ca3af", _light: "#6b7280" }}
                  fontWeight="600"
                  fontSize="xs"
                  textTransform="uppercase"
                  letterSpacing="0.5px"
                >
                  Customer Name
                </Table.ColumnHeader>
                <Table.ColumnHeader
                  color={{ base: "#9ca3af", _light: "#6b7280" }}
                  fontWeight="600"
                  fontSize="xs"
                  textTransform="uppercase"
                  letterSpacing="0.5px"
                >
                  Invoice Date
                </Table.ColumnHeader>
                <Table.ColumnHeader
                  color={{ base: "#9ca3af", _light: "#6b7280" }}
                  fontWeight="600"
                  fontSize="xs"
                  textTransform="uppercase"
                  letterSpacing="0.5px"
                >
                  Due Date
                </Table.ColumnHeader>
                <Table.ColumnHeader
                  color={{ base: "#9ca3af", _light: "#6b7280" }}
                  fontWeight="600"
                  fontSize="xs"
                  textTransform="uppercase"
                  letterSpacing="0.5px"
                >
                  Amount
                </Table.ColumnHeader>
                <Table.ColumnHeader
                  color={{ base: "#9ca3af", _light: "#6b7280" }}
                  fontWeight="600"
                  fontSize="xs"
                  textTransform="uppercase"
                  letterSpacing="0.5px"
                >
                  Paid
                </Table.ColumnHeader>
                <Table.ColumnHeader
                  color={{ base: "#9ca3af", _light: "#6b7280" }}
                  fontWeight="600"
                  fontSize="xs"
                  textTransform="uppercase"
                  letterSpacing="0.5px"
                >
                  Balance
                </Table.ColumnHeader>
                <Table.ColumnHeader
                  color={{ base: "#9ca3af", _light: "#6b7280" }}
                  fontWeight="600"
                  fontSize="xs"
                  textTransform="uppercase"
                  letterSpacing="0.5px"
                >
                  Status
                </Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {isLoading ? (
                <Table.Row>
                  <Table.Cell colSpan={7} textAlign="center" py={8}>
                    <Text
                      fontSize="sm"
                      color={{ base: "#9ca3af", _light: "#6b7280" }}
                    >
                      Loading invoices...
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ) : debts.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={7} textAlign="center" py={8}>
                    <VStack gap={2}>
                      <Text
                        fontSize="sm"
                        color={{ base: "#9ca3af", _light: "#6b7280" }}
                      >
                        No invoices found
                      </Text>
                    </VStack>
                  </Table.Cell>
                </Table.Row>
              ) : (
                debts.map((debt) => (
                  <Table.Row key={debt.id}>
                    <Table.Cell
                      color={{ base: "#ffffff", _light: "#1a1d29" }}
                      fontWeight="medium"
                    >
                      {debt.customer_name || "N/A"}
                    </Table.Cell>
                    <Table.Cell
                      color={{ base: "#9ca3af", _light: "#6b7280" }}
                      fontSize="sm"
                    >
                      {debt.debt_date
                        ? format(new Date(debt.debt_date), "MMM dd, yyyy")
                        : "N/A"}
                    </Table.Cell>
                    <Table.Cell
                      color={{ base: "#9ca3af", _light: "#6b7280" }}
                      fontSize="sm"
                    >
                      {debt.due_date
                        ? format(new Date(debt.due_date), "MMM dd, yyyy")
                        : "N/A"}
                    </Table.Cell>
                    <Table.Cell color={{ base: "#ffffff", _light: "#1a1d29" }}>
                      {formatCurrency(
                        parseFloat(debt.amount?.toString() || "0"),
                      )}
                    </Table.Cell>
                    <Table.Cell color={{ base: "#ffffff", _light: "#1a1d29" }}>
                      {formatCurrency(
                        parseFloat(debt.amount_paid?.toString() || "0"),
                      )}
                    </Table.Cell>
                    <Table.Cell
                      color={{ base: "#ffffff", _light: "#1a1d29" }}
                      fontWeight="medium"
                    >
                      {formatCurrency(
                        parseFloat(debt.balance?.toString() || "0"),
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge
                        colorPalette={getStatusColor(debt.status || "pending")}
                      >
                        {debt.status?.toUpperCase() || "PENDING"}
                      </Badge>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table.Root>
        </Box>
      </Box>
    </Container>
  )
}
