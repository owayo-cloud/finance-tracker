import { Box, Heading, Table, VStack, Text, Badge } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { DebtsService } from "@/client"
import { formatCurrency } from "@/components/POS/utils"
import { format } from "date-fns"

interface PendingDebtsTableProps {
  isMounted: boolean
}

export function PendingDebtsTable({ isMounted }: PendingDebtsTableProps) {
  // Fetch pending debts (status: pending, partial, overdue)
  const { data: debtsData, isLoading, error } = useQuery({
    queryKey: ["pending-debts"],
    queryFn: () => DebtsService.readDebts({ 
      skip: 0, 
      limit: 50,
      status: "pending,partial,overdue" // Only show pending debts
    }),
  })

  const debts = debtsData?.data || []
  console.log("[PendingDebtsTable] Raw debts data:", debtsData)
  console.log("[PendingDebtsTable] Debts array:", debts)
  console.log("[PendingDebtsTable] Debts count:", debts.length)
  
  // Filter to only show debts with balance > 0 (actual pending debts)
  const pendingDebts = debts
    .filter(d => {
      const balance = parseFloat(d.balance?.toString() || "0")
      const isPending = balance > 0 && (d.status === "pending" || d.status === "partial" || d.status === "overdue")
      console.log(`[PendingDebtsTable] Debt ${d.id}: customer=${d.customer_name}, balance=${balance}, status=${d.status}, isPending=${isPending}`)
      return isPending
    })
    .slice(0, 10) // Show top 10
    
  console.log("[PendingDebtsTable] Fetched debts:", debts.length, "Pending:", pendingDebts.length, "Error:", error)

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
        bg={{ base: "#1a1d29", _light: "#ffffff" }}
        borderRadius="lg" 
        border="1px solid"
        borderColor={{ base: "rgba(255, 255, 255, 0.08)", _light: "#e5e7eb" }}
        boxShadow={{ base: "0 2px 4px rgba(0, 0, 0, 0.2)", _light: "0 1px 3px rgba(0, 0, 0, 0.1)" }}
      >
        <Heading 
          size="md" 
          fontWeight="600"
          color={{ base: "#ffffff", _light: "#1a1d29" }}
          mb={4}
        >
          Pending Customer Debts
        </Heading>
        
        <Box overflowX="auto">
          <Table.Root variant="outline" size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader color={{ base: "#9ca3af", _light: "#6b7280" }} fontWeight="600" fontSize="xs" textTransform="uppercase" letterSpacing="0.5px">
                  Customer Name
                </Table.ColumnHeader>
                <Table.ColumnHeader color={{ base: "#9ca3af", _light: "#6b7280" }} fontWeight="600" fontSize="xs" textTransform="uppercase" letterSpacing="0.5px">
                  Product
                </Table.ColumnHeader>
                <Table.ColumnHeader color={{ base: "#9ca3af", _light: "#6b7280" }} fontWeight="600" fontSize="xs" textTransform="uppercase" letterSpacing="0.5px">
                  Amount Owed
                </Table.ColumnHeader>
                <Table.ColumnHeader color={{ base: "#9ca3af", _light: "#6b7280" }} fontWeight="600" fontSize="xs" textTransform="uppercase" letterSpacing="0.5px">
                  Debt Date
                </Table.ColumnHeader>
                <Table.ColumnHeader color={{ base: "#9ca3af", _light: "#6b7280" }} fontWeight="600" fontSize="xs" textTransform="uppercase" letterSpacing="0.5px">
                  Due Date
                </Table.ColumnHeader>
                <Table.ColumnHeader color={{ base: "#9ca3af", _light: "#6b7280" }} fontWeight="600" fontSize="xs" textTransform="uppercase" letterSpacing="0.5px">
                  Status
                </Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {isLoading ? (
                <Table.Row>
                  <Table.Cell colSpan={6} textAlign="center" py={8}>
                    <Text fontSize="sm" color={{ base: "#9ca3af", _light: "#6b7280" }}>
                      Loading debts...
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ) : pendingDebts.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={6} textAlign="center" py={8}>
                    <VStack gap={2}>
                      <Text fontSize="sm" color={{ base: "#9ca3af", _light: "#6b7280" }}>
                        No pending debts
                      </Text>
                    </VStack>
                  </Table.Cell>
                </Table.Row>
              ) : (
                pendingDebts.map((debt) => {
                  // Get product name from sale if available
                  const productName = (debt as any).sale?.product?.name || debt.notes || "N/A"
                  return (
                    <Table.Row key={debt.id}>
                      <Table.Cell color={{ base: "#ffffff", _light: "#1a1d29" }}>
                        {debt.customer_name || "N/A"}
                      </Table.Cell>
                      <Table.Cell color={{ base: "#ffffff", _light: "#1a1d29" }} fontSize="sm">
                        {productName}
                      </Table.Cell>
                      <Table.Cell color={{ base: "#ffffff", _light: "#1a1d29" }} fontWeight="medium">
                        {formatCurrency(parseFloat(debt.balance?.toString() || "0"))}
                      </Table.Cell>
                      <Table.Cell color={{ base: "#9ca3af", _light: "#6b7280" }} fontSize="sm">
                        {debt.debt_date ? format(new Date(debt.debt_date), "MMM dd, yyyy") : "N/A"}
                      </Table.Cell>
                      <Table.Cell color={{ base: "#9ca3af", _light: "#6b7280" }} fontSize="sm">
                        {debt.due_date ? format(new Date(debt.due_date), "MMM dd, yyyy") : "N/A"}
                      </Table.Cell>
                      <Table.Cell>
                        <Badge colorPalette={getStatusColor(debt.status || "pending")}>
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

