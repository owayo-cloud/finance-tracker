import { Box, Container, Heading, Text, VStack, HStack, Tabs, Alert } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"
import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { FiBarChart2, FiFileText, FiLayers, FiAlertCircle } from "react-icons/fi"
import { SalesService, ExpensesService } from "@/client"
import { DateFilters } from "@/components/Reports/DateFilters"
import { SummaryCards } from "@/components/Reports/SummaryCards"
import { SalesBreakdown } from "@/components/Reports/SalesBreakdown"
import { ExpensesBreakdown } from "@/components/Reports/ExpensesBreakdown"
import { BalanceSheet } from "@/components/Reports/BalanceSheet"
import { StockReport } from "@/components/Reports/StockReport"

export const Route = createFileRoute("/_layout/reports")({
  component: Reports,
})

function Reports() {
  const today = new Date()
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const [startDate, setStartDate] = useState<string>(
    firstDayOfMonth.toISOString().split("T")[0]
  )
  const [endDate, setEndDate] = useState<string>(today.toISOString().split("T")[0])
  const [activeTab, setActiveTab] = useState<string>("overview")

  // Fetch sales summary from backend
  const {
    data: salesSummary,
    isLoading: salesLoading,
    refetch: refetchSales,
  } = useQuery({
    queryKey: ["sales-summary", startDate, endDate],
    queryFn: async () => {
      const token = localStorage.getItem("access_token") || ""
      const apiBase = import.meta.env.VITE_API_URL || ""
      const startParam = startDate ? `&start_date=${startDate}` : ""
      const endParam = endDate ? `&end_date=${endDate}` : ""
      const response = await fetch(`${apiBase}/api/v1/analytics/sales-summary?${startParam}${endParam}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        throw new Error("Failed to fetch sales summary")
      }
      return response.json()
    },
  })

  // Fetch sales data for breakdown components (still needed for detailed views)
  const {
    data: salesData,
    isLoading: salesDataLoading,
  } = useQuery({
    queryKey: ["sales-report", startDate, endDate],
    queryFn: () =>
      SalesService.readSales({
        skip: 0,
        limit: 1000,
        startDate: startDate,
        endDate: endDate,
      }),
  })

  // Fetch expenses data
  const {
    data: expensesData,
    isLoading: expensesLoading,
    refetch: refetchExpenses,
  } = useQuery({
    queryKey: ["expenses-report", startDate, endDate],
    queryFn: () =>
      ExpensesService.readExpenses({
        skip: 0,
        limit: 1000,
        startDate: startDate,
        endDate: endDate,
      }),
  })

  // Fetch expense summary
  const { data: expenseSummary } = useQuery({
    queryKey: ["expense-summary", startDate, endDate],
    queryFn: () =>
      ExpensesService.getExpenseSummary({
        startDate: startDate,
        endDate: endDate,
      }),
  })

  // Fetch stock summary from backend
  const {
    data: stockSummary,
    isLoading: productsLoading,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ["stock-summary"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token") || ""
      const apiBase = import.meta.env.VITE_API_URL || ""
      const response = await fetch(`${apiBase}/api/v1/analytics/stock-summary`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        throw new Error("Failed to fetch stock summary")
      }
      return response.json()
    },
  })

  // Fetch balance sheet from backend
  const { data: balanceSheet } = useQuery({
    queryKey: ["balance-sheet", startDate, endDate],
    queryFn: async () => {
      const token = localStorage.getItem("access_token") || ""
      const apiBase = import.meta.env.VITE_API_URL || ""
      const startParam = startDate ? `&start_date=${startDate}` : ""
      const endParam = endDate ? `&end_date=${endDate}` : ""
      const response = await fetch(`${apiBase}/api/v1/analytics/balance-sheet?${startParam}${endParam}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        throw new Error("Failed to fetch balance sheet")
      }
      return response.json()
    },
  })

  // Calculate net profit
  const netProfit = useMemo(() => {
    if (!salesSummary || !expenseSummary) return null
    const expenseTotal = typeof expenseSummary === 'object' && expenseSummary !== null && 'total_amount' in expenseSummary
      ? parseFloat((expenseSummary as any).total_amount?.toString() || "0")
      : 0
    return salesSummary.total_amount - expenseTotal
  }, [salesSummary, expenseSummary])

  const isLoading = salesLoading || salesDataLoading || expensesLoading || productsLoading

  const handleRefresh = () => {
    refetchSales()
    refetchExpenses()
    refetchProducts()
  }

  return (
    <Box minH="100vh" bg="bg.canvas" py={8}>
      <Container maxW="7xl">
        <VStack gap={6} align="stretch">
          {/* Header */}
          <Box>
            <Heading size="2xl" mb={2} fontWeight="bold">
              Reports & Analytics
            </Heading>
            <Text fontSize="md" color="fg.muted">
              Comprehensive financial reports, stock inventory, and business insights
            </Text>
          </Box>

          {/* Date Filters */}
          <DateFilters
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onRefresh={handleRefresh}
            isLoading={isLoading}
          />

          {/* Summary Cards */}
          <SummaryCards
            salesSummary={salesSummary}
            expenseSummary={expenseSummary as any}
            netProfit={netProfit}
            stockSummary={stockSummary}
            isLoading={isLoading}
          />

          {/* Tabs */}
          <Tabs.Root value={activeTab} onValueChange={(e) => setActiveTab(e.value)}>
            <Tabs.List>
              <Tabs.Trigger value="overview">
                <HStack gap={2}>
                  <FiBarChart2 size={16} />
                  <Text>Overview</Text>
                </HStack>
              </Tabs.Trigger>
              <Tabs.Trigger value="balance">
                <HStack gap={2}>
                  <FiFileText size={16} />
                  <Text>Balance Sheet</Text>
                </HStack>
              </Tabs.Trigger>
              <Tabs.Trigger value="stock">
                <HStack gap={2}>
                  <FiLayers size={16} />
                  <Text>Stock Report</Text>
                </HStack>
              </Tabs.Trigger>
            </Tabs.List>

            <Box mt={6}>
              {/* Overview Tab */}
              <Tabs.Content value="overview">
                <VStack gap={6} align="stretch">
                  {salesSummary && salesData?.data && (
                    <SalesBreakdown
                      salesSummary={{
                        totalAmount: salesSummary.total_amount,
                        paymentMethodBreakdown: Object.fromEntries(
                          salesSummary.payment_method_breakdown.map((pm: any) => [
                            pm.payment_method,
                            { count: pm.count, amount: pm.amount }
                          ])
                        ),
                        cashierBreakdown: Object.fromEntries(
                          salesSummary.cashier_breakdown.map((c: any) => [
                            c.cashier_name,
                            { count: c.count, amount: c.amount }
                          ])
                        ),
                      }}
                      salesData={salesData.data}
                      startDate={startDate}
                      endDate={endDate}
                    />
                  )}

                  {expenseSummary &&
                  expensesData?.data &&
                  typeof expenseSummary === "object" &&
                  expenseSummary !== null
                    ? (
                        <ExpensesBreakdown
                          expenseSummary={expenseSummary as any}
                          expensesData={expensesData.data as any[]}
                          startDate={startDate}
                          endDate={endDate}
                        />
                      )
                    : null}
                </VStack>
              </Tabs.Content>

              {/* Balance Sheet Tab */}
              <Tabs.Content value="balance">
                {balanceSheet ? (
                  <BalanceSheet
                    balanceSheet={{
                      assets: {
                        inventory: balanceSheet.assets.inventory,
                        cashAndReceivables: balanceSheet.assets.cash_and_receivables,
                        total: balanceSheet.assets.total,
                      },
                      liabilities: {
                        expenses: balanceSheet.liabilities.expenses,
                        total: balanceSheet.liabilities.total,
                      },
                      equity: balanceSheet.equity,
                    }}
                    startDate={startDate}
                    endDate={endDate}
                  />
                ) : (
                  <Alert.Root status="info">
                    <Alert.Indicator>
                      <FiAlertCircle />
                    </Alert.Indicator>
                    <Alert.Content>
                      <Alert.Title>Loading balance sheet data...</Alert.Title>
                    </Alert.Content>
                  </Alert.Root>
                )}
              </Tabs.Content>

              {/* Stock Report Tab */}
              <Tabs.Content value="stock">
                {stockSummary ? (
                  <StockReport stockSummary={{
                    totalProducts: stockSummary.total_products,
                    totalInventoryValue: stockSummary.total_inventory_value,
                    lowStockCount: stockSummary.low_stock_count,
                    outOfStockCount: stockSummary.out_of_stock_count,
                    products: stockSummary.products.map((p: any) => ({
                      id: p.id,
                      name: p.name,
                      category: p.category,
                      currentStock: p.current_stock,
                      buyingPrice: p.buying_price,
                      sellingPrice: p.selling_price,
                      inventoryValue: p.inventory_value,
                      reorderLevel: p.reorder_level,
                      status: p.status,
                    })),
                  }} />
                ) : (
                  <Alert.Root status="info">
                    <Alert.Indicator>
                      <FiAlertCircle />
                    </Alert.Indicator>
                    <Alert.Content>
                      <Alert.Title>Loading stock data...</Alert.Title>
                    </Alert.Content>
                  </Alert.Root>
                )}
              </Tabs.Content>
            </Box>
          </Tabs.Root>
        </VStack>
      </Container>
    </Box>
  )
}
