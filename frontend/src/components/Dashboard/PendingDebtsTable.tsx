import { Badge, Box, Heading, Table, Text, VStack } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { DebtsService } from "@/client"
import { formatCurrency } from "@/components/POS/utils"

interface PendingDebtsTableProps {
  isMounted: boolean
}

export function PendingDebtsTable({ isMounted }: PendingDebtsTableProps) {
  // Fetch pending debts (status: pending, partial, overdue)
  const { data: debtsData, isLoading } = useQuery({
    queryKey: ["pending-debts"],
    queryFn: () =>
      DebtsService.readDebts({
        skip: 0,
        limit: 50,
        status: "pending,partial,overdue", // Only show pending debts
      }),
  })

  const debts = debtsData?.data || []

  // Filter to only show debts with balance > 0 (actual pending debts)
  const pendingDebts = debts
    .filter((d) => {
      const balance = parseFloat(d.balance?.toString() || "0")
      return (
        balance > 0 &&
        (d.status === "pending" ||
          d.status === "partial" ||
          d.status === "overdue")
      )
    })
    .slice(0, 10) // Show top 10

  const getStatusColor = (status: string) => {
    switch (status) {
      case "overdue":
        return "red"
      case "partial":
        return "orange"
      case "pending":
        return "yellow"
      default:
        return "gray"
    }
  }

  return (
    <Box
      opacity={isMounted ? 1 : 0}
      transform={isMounted ? "translateY(0)" : "translateY(20px)"}
      transition="all 0.5s ease 0.5s"
      mb={8}
    >
      <Box
        p={6}
        bg="bg.surface"
        borderRadius="lg"
        border="1px solid"
        borderColor="border.card"
        boxShadow={{
          base: "0 2px 4px rgba(0, 0, 0, 0.2)",
          _light: "0 1px 3px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Heading size="md" fontWeight="600" color="text.primary" mb={4}>
          Pending Customer Debts
        </Heading>

        <Box overflowX="auto">
          <Table.Root variant="outline" size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader
                  color="text.muted"
                  fontWeight="600"
                  fontSize="xs"
                  textTransform="uppercase"
                  letterSpacing="0.5px"
                >
                  Customer Name
                </Table.ColumnHeader>
                <Table.ColumnHeader
                  color="text.muted"
                  fontWeight="600"
                  fontSize="xs"
                  textTransform="uppercase"
                  letterSpacing="0.5px"
                >
                  Product
                </Table.ColumnHeader>
                <Table.ColumnHeader
                  color="text.muted"
                  fontWeight="600"
                  fontSize="xs"
                  textTransform="uppercase"
                  letterSpacing="0.5px"
                >
                  Amount Owed
                </Table.ColumnHeader>
                <Table.ColumnHeader
                  color="text.muted"
                  fontWeight="600"
                  fontSize="xs"
                  textTransform="uppercase"
                  letterSpacing="0.5px"
                >
                  Debt Date
                </Table.ColumnHeader>
                <Table.ColumnHeader
                  color="text.muted"
                  fontWeight="600"
                  fontSize="xs"
                  textTransform="uppercase"
                  letterSpacing="0.5px"
                >
                  Due Date
                </Table.ColumnHeader>
                <Table.ColumnHeader
                  color="text.muted"
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
                  <Table.Cell colSpan={6} textAlign="center" py={8}>
                    <Text fontSize="sm" color="text.muted">
                      Loading debts...
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ) : pendingDebts.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={6} textAlign="center" py={8}>
                    <VStack gap={2}>
                      <Text fontSize="sm" color="text.muted">
                        No pending debts
                      </Text>
                    </VStack>
                  </Table.Cell>
                </Table.Row>
              ) : (
                pendingDebts.map((debt) => {
                  // Get product name from sale if available
                  const productName =
                    (debt as any).sale?.product?.name || debt.notes || "N/A"
                  return (
                    <Table.Row key={debt.id}>
                      <Table.Cell color="text.primary">
                        {debt.customer_name || "N/A"}
                      </Table.Cell>
                      <Table.Cell color="text.primary" fontSize="sm">
                        {productName}
                      </Table.Cell>
                      <Table.Cell color="text.primary" fontWeight="medium">
                        {formatCurrency(
                          parseFloat(debt.balance?.toString() || "0"),
                        )}
                      </Table.Cell>
                      <Table.Cell color="text.muted" fontSize="sm">
                        {debt.debt_date
                          ? format(new Date(debt.debt_date), "MMM dd, yyyy")
                          : "N/A"}
                      </Table.Cell>
                      <Table.Cell color="text.muted" fontSize="sm">
                        {debt.due_date
                          ? format(new Date(debt.due_date), "MMM dd, yyyy")
                          : "N/A"}
                      </Table.Cell>
                      <Table.Cell>
                        <Badge
                          colorPalette={getStatusColor(
                            debt.status || "pending",
                          )}
                        >
                          {debt.status?.toUpperCase() || "PENDING"}
                        </Badge>
                      </Table.Cell>
                    </Table.Row>
                  )
                })
              )}
            </Table.Body>
          </Table.Root>
        </Box>
      </Box>
    </Box>
  )
}
