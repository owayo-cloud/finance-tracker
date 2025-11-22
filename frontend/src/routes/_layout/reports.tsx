import { Box, Container, Heading, Text, VStack, HStack, Tabs, Alert } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"
import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { FiBarChart2, FiFileText, FiLayers, FiAlertCircle } from "react-icons/fi"
import { SalesService, ExpensesService, ProductsService } from "@/client"
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

  // Fetch sales data
  const {
    data: salesData,
    isLoading: salesLoading,
    refetch: refetchSales,
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

  // Fetch products for stock report
  const {
    data: productsData,
    isLoading: productsLoading,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ["products-stock"],
    queryFn: () => ProductsService.readProducts({ skip: 0, limit: 1000 }),
  })

  // Calculate sales summary
  const salesSummary = useMemo(() => {
    if (!salesData?.data) return null

    const sales = salesData.data
    const totalSales = sales.length
    const totalAmount = sales.reduce(
      (sum, sale) => sum + parseFloat(sale.total_amount || "0"),
      0
    )
    const totalItems = sales.reduce((sum, sale) => sum + sale.quantity, 0)

    // Group by payment method
    const paymentMethodBreakdown: Record<
      string,
      { count: number; amount: number }
    > = {}
    sales.forEach((sale) => {
      const methodName = sale.payment_method?.name || "Unknown"
      if (!paymentMethodBreakdown[methodName]) {
        paymentMethodBreakdown[methodName] = { count: 0, amount: 0 }
      }
      paymentMethodBreakdown[methodName].count++
      paymentMethodBreakdown[methodName].amount += parseFloat(
        sale.total_amount || "0"
      )
    })

    // Group by cashier
    const cashierBreakdown: Record<string, { count: number; amount: number }> =
      {}
    sales.forEach((sale: any) => {
      const cashierName =
        sale.created_by?.full_name || sale.created_by?.username || "Unknown"
      if (!cashierBreakdown[cashierName]) {
        cashierBreakdown[cashierName] = { count: 0, amount: 0 }
      }
      cashierBreakdown[cashierName].count++
      cashierBreakdown[cashierName].amount += parseFloat(
        sale.total_amount || "0"
      )
    })

    return {
      totalSales,
      totalAmount,
      totalItems,
      averageSale: totalSales > 0 ? totalAmount / totalSales : 0,
      paymentMethodBreakdown,
      cashierBreakdown,
    }
  }, [salesData])

  // Calculate stock inventory value
  const stockSummary = useMemo(() => {
    if (!productsData?.data) return null

    const products = productsData.data
    let totalInventoryValue = 0
    let totalProducts = 0
    let lowStockCount = 0
    let outOfStockCount = 0

    products.forEach((product) => {
      const stock = product.current_stock || 0
      const buyingPrice = parseFloat(product.buying_price?.toString() || "0")
      totalInventoryValue += stock * buyingPrice
      totalProducts++
      if (stock === 0) {
        outOfStockCount++
      } else if (
        product.reorder_level &&
        stock <= product.reorder_level
      ) {
        lowStockCount++
      }
    })

    return {
      totalProducts,
      totalInventoryValue,
      lowStockCount,
      outOfStockCount,
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category?.name || "Uncategorized",
        currentStock: p.current_stock || 0,
        buyingPrice: parseFloat(p.buying_price?.toString() || "0"),
        sellingPrice: parseFloat(p.selling_price?.toString() || "0"),
        inventoryValue:
          (p.current_stock || 0) * parseFloat(p.buying_price?.toString() || "0"),
        reorderLevel: p.reorder_level || 0,
        status: p.status?.name || "Unknown",
      })),
    }
  }, [productsData])

  // Calculate balance sheet
  const balanceSheet = useMemo(() => {
    if (!salesSummary || !expenseSummary || !stockSummary) return null

    // Assets
    const inventoryValue = stockSummary.totalInventoryValue
    const cashAndReceivables = salesSummary.totalAmount // Simplified: assume all sales are cash/receivables
    const totalAssets = inventoryValue + cashAndReceivables

    // Liabilities
    const expenseTotal = typeof expenseSummary === 'object' && expenseSummary !== null && 'total_amount' in expenseSummary
      ? (expenseSummary as any).total_amount
      : 0
    const totalExpenses = parseFloat(expenseTotal?.toString() || "0")
    const totalLiabilities = totalExpenses

    // Equity
    const equity = totalAssets - totalLiabilities

    return {
      assets: {
        inventory: inventoryValue,
        cashAndReceivables: cashAndReceivables,
        total: totalAssets,
      },
      liabilities: {
        expenses: totalExpenses,
        total: totalLiabilities,
      },
      equity: equity,
    }
  }, [salesSummary, expenseSummary, stockSummary])

  // Calculate net profit
  const netProfit = useMemo(() => {
    if (!salesSummary || !expenseSummary) return null
    const expenseTotal = typeof expenseSummary === 'object' && expenseSummary !== null && 'total_amount' in expenseSummary
      ? parseFloat((expenseSummary as any).total_amount?.toString() || "0")
      : 0
    return salesSummary.totalAmount - expenseTotal
  }, [salesSummary, expenseSummary])

  const isLoading = salesLoading || expensesLoading || productsLoading

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
                      salesSummary={salesSummary}
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
                    balanceSheet={balanceSheet}
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
                  <StockReport stockSummary={stockSummary} />
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
