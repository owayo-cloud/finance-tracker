import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  Spinner,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { LuDollarSign } from "react-icons/lu"

import { type DebtPublic, DebtsService } from "../../client"
import RecordPayment from "./RecordPayment"

const PER_PAGE = 20

function getStatusBadgeColor(status: string) {
  switch (status) {
    case "pending":
      return "orange"
    case "partial":
      return "blue"
    case "paid":
      return "green"
    case "overdue":
      return "red"
    default:
      return "gray"
  }
}

function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    minimumFractionDigits: 0,
  }).format(num)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-UG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export default function DebtList() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedDebt, setSelectedDebt] = useState<DebtPublic | null>(null)

  const {
    data: debtsData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["debts", { page, search: searchTerm, status: statusFilter }],
    queryFn: () =>
      DebtsService.readDebts({
        skip: (page - 1) * PER_PAGE,
        limit: PER_PAGE,
      }),
  })

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setPage(1)
  }

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
    setPage(1)
  }

  const handlePaymentSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["debts"] })
    setSelectedDebt(null)
  }

  // Filter debts based on search and status
  const filteredDebts = debtsData?.data?.filter((debt) => {
    const matchesSearch =
      searchTerm === "" ||
      debt.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      debt.id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || debt.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const totalItems = filteredDebts?.length || 0

  return (
    <Container maxW="full" px={0}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" color={{ base: "#e5e7eb", _light: "#111827" }}>
          Customer Debts
        </Heading>
      </Flex>

      {/* Filters */}
      <Box
        mb={6}
        p={4}
        bg={{ base: "#1a1d29", _light: "#ffffff" }}
        borderRadius="lg"
        border="1px solid"
        borderColor={{ base: "rgba(255, 255, 255, 0.08)", _light: "#e5e7eb" }}
      >
        <Flex gap={4} wrap="wrap">
          <Box flex="1" minW="250px">
            <Input
              placeholder="Search by customer or debt ID..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              bg={{ base: "#0f1117", _light: "#f9fafb" }}
              border="1px solid"
              borderColor={{
                base: "rgba(255, 255, 255, 0.08)",
                _light: "#e5e7eb",
              }}
            />
          </Box>

          <HStack>
            <Button
              size="sm"
              variant={statusFilter === "all" ? "solid" : "outline"}
              onClick={() => handleStatusFilter("all")}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={statusFilter === "pending" ? "solid" : "outline"}
              colorPalette="orange"
              onClick={() => handleStatusFilter("pending")}
            >
              Pending
            </Button>
            <Button
              size="sm"
              variant={statusFilter === "partial" ? "solid" : "outline"}
              colorPalette="blue"
              onClick={() => handleStatusFilter("partial")}
            >
              Partial
            </Button>
            <Button
              size="sm"
              variant={statusFilter === "overdue" ? "solid" : "outline"}
              colorPalette="red"
              onClick={() => handleStatusFilter("overdue")}
            >
              Overdue
            </Button>
            <Button
              size="sm"
              variant={statusFilter === "paid" ? "solid" : "outline"}
              colorPalette="green"
              onClick={() => handleStatusFilter("paid")}
            >
              Paid
            </Button>
          </HStack>
        </Flex>
      </Box>

      {/* Debts Table */}
      <Box
        bg={{ base: "#1a1d29", _light: "#ffffff" }}
        borderRadius="lg"
        border="1px solid"
        borderColor={{ base: "rgba(255, 255, 255, 0.08)", _light: "#e5e7eb" }}
        overflow="hidden"
      >
        {isLoading ? (
          <Flex justify="center" align="center" minH="400px">
            <Spinner size="xl" />
          </Flex>
        ) : isError ? (
          <Flex justify="center" align="center" minH="400px">
            <Text color="red.500">Error loading debts</Text>
          </Flex>
        ) : filteredDebts && filteredDebts.length > 0 ? (
          <>
            <Box overflowX="auto">
              <Table.Root variant="outline" size="sm">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader
                      color={{ base: "#9ca3af", _light: "#6b7280" }}
                      fontWeight="600"
                      fontSize="xs"
                      textTransform="uppercase"
                    >
                      Customer
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      color={{ base: "#9ca3af", _light: "#6b7280" }}
                      fontWeight="600"
                      fontSize="xs"
                      textTransform="uppercase"
                    >
                      Contact
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      color={{ base: "#9ca3af", _light: "#6b7280" }}
                      fontWeight="600"
                      fontSize="xs"
                      textTransform="uppercase"
                    >
                      Total Amount
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      color={{ base: "#9ca3af", _light: "#6b7280" }}
                      fontWeight="600"
                      fontSize="xs"
                      textTransform="uppercase"
                    >
                      Amount Paid
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      color={{ base: "#9ca3af", _light: "#6b7280" }}
                      fontWeight="600"
                      fontSize="xs"
                      textTransform="uppercase"
                    >
                      Balance
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      color={{ base: "#9ca3af", _light: "#6b7280" }}
                      fontWeight="600"
                      fontSize="xs"
                      textTransform="uppercase"
                    >
                      Date
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      color={{ base: "#9ca3af", _light: "#6b7280" }}
                      fontWeight="600"
                      fontSize="xs"
                      textTransform="uppercase"
                    >
                      Due Date
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      color={{ base: "#9ca3af", _light: "#6b7280" }}
                      fontWeight="600"
                      fontSize="xs"
                      textTransform="uppercase"
                    >
                      Status
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      color={{ base: "#9ca3af", _light: "#6b7280" }}
                      fontWeight="600"
                      fontSize="xs"
                      textTransform="uppercase"
                    >
                      Actions
                    </Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {filteredDebts.map((debt) => (
                    <Table.Row key={debt.id}>
                      <Table.Cell
                        color={{ base: "#e5e7eb", _light: "#374151" }}
                        fontWeight="500"
                      >
                        {debt.customer_name}
                      </Table.Cell>
                      <Table.Cell
                        color={{ base: "#9ca3af", _light: "#6b7280" }}
                      >
                        {debt.customer_contact || "—"}
                      </Table.Cell>
                      <Table.Cell
                        color={{ base: "#e5e7eb", _light: "#374151" }}
                        fontWeight="500"
                      >
                        {formatCurrency(debt.amount)}
                      </Table.Cell>
                      <Table.Cell
                        color={{ base: "#9ca3af", _light: "#6b7280" }}
                      >
                        {formatCurrency(debt.amount_paid || 0)}
                      </Table.Cell>
                      <Table.Cell
                        color={{ base: "#fbbf24", _light: "#f59e0b" }}
                        fontWeight="600"
                      >
                        {formatCurrency(debt.balance)}
                      </Table.Cell>
                      <Table.Cell
                        color={{ base: "#9ca3af", _light: "#6b7280" }}
                      >
                        {debt.debt_date ? formatDate(debt.debt_date) : "—"}
                      </Table.Cell>
                      <Table.Cell
                        color={{ base: "#9ca3af", _light: "#6b7280" }}
                      >
                        {debt.due_date ? formatDate(debt.due_date) : "—"}
                      </Table.Cell>
                      <Table.Cell>
                        <Badge
                          colorPalette={getStatusBadgeColor(
                            debt.status || "pending",
                          )}
                        >
                          {debt.status || "pending"}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <IconButton
                          aria-label="Record payment"
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedDebt(debt)}
                          disabled={debt.status === "paid"}
                        >
                          <LuDollarSign />
                        </IconButton>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>

            <Flex justify="space-between" align="center" mt={4}>
              <Button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                size="sm"
              >
                Previous
              </Button>
              <Text
                fontSize="sm"
                color={{ base: "#9ca3af", _light: "#6b7280" }}
              >
                Page {page} of {Math.ceil(totalItems / PER_PAGE)}
              </Text>
              <Button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * PER_PAGE >= totalItems}
                size="sm"
              >
                Next
              </Button>
            </Flex>
          </>
        ) : (
          <Flex justify="center" align="center" minH="400px">
            <VStack gap={2}>
              <Text
                fontSize="sm"
                color={{ base: "#9ca3af", _light: "#6b7280" }}
              >
                No debts found
              </Text>
              <Text
                fontSize="xs"
                color={{ base: "#6b7280", _light: "#9ca3af" }}
              >
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Credit sales will appear here"}
              </Text>
            </VStack>
          </Flex>
        )}
      </Box>

      {/* Record Payment Modal */}
      {selectedDebt && (
        <RecordPayment
          debt={selectedDebt}
          isOpen={!!selectedDebt}
          onClose={() => setSelectedDebt(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </Container>
  )
}
