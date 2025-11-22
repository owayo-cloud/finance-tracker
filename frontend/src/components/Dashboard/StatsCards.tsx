import { Box, Grid, HStack, VStack, Text, Icon } from "@chakra-ui/react"
import { FiArrowUp, FiArrowDown } from "react-icons/fi"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { ExpensesService, SalesService } from "@/client"
import { formatCurrency } from "./utils"

interface StatsCardsProps {
  totalRevenue: number
  isMounted: boolean
}

function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

export function StatsCards({ totalRevenue, isMounted }: StatsCardsProps) {
  const today = new Date()
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
  const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const lastWeekStart = new Date(today)
  lastWeekStart.setDate(lastWeekStart.getDate() - 7)
  const lastWeekEnd = new Date(today)
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 1)

  // Fetch current month expenses
  const { data: currentMonthExpenses } = useQuery({
    queryKey: ["expenseSummary", firstDayOfMonth.toISOString().split("T")[0], today.toISOString().split("T")[0]],
    queryFn: () =>
      ExpensesService.getExpenseSummary({
        startDate: firstDayOfMonth.toISOString().split("T")[0],
        endDate: today.toISOString().split("T")[0],
      }),
  })

  // Fetch previous month expenses
  const { data: previousMonthExpenses } = useQuery({
    queryKey: ["expenseSummary", firstDayOfLastMonth.toISOString().split("T")[0], lastDayOfLastMonth.toISOString().split("T")[0]],
    queryFn: () =>
      ExpensesService.getExpenseSummary({
        startDate: firstDayOfLastMonth.toISOString().split("T")[0],
        endDate: lastDayOfLastMonth.toISOString().split("T")[0],
      }),
  })

  // Fetch current month sales
  const { data: currentMonthSales } = useQuery({
    queryKey: ["sales-current-month", firstDayOfMonth.toISOString().split("T")[0], today.toISOString().split("T")[0]],
    queryFn: () =>
      SalesService.readSales({
        skip: 0,
        limit: 1000,
        startDate: firstDayOfMonth.toISOString().split("T")[0],
        endDate: today.toISOString().split("T")[0],
      }),
  })

  // Fetch previous month sales
  const { data: previousMonthSales } = useQuery({
    queryKey: ["sales-previous-month", firstDayOfLastMonth.toISOString().split("T")[0], lastDayOfLastMonth.toISOString().split("T")[0]],
    queryFn: () =>
      SalesService.readSales({
        skip: 0,
        limit: 1000,
        startDate: firstDayOfLastMonth.toISOString().split("T")[0],
        endDate: lastDayOfLastMonth.toISOString().split("T")[0],
      }),
  })

  // Fetch today's sales
  const { data: todaySales } = useQuery({
    queryKey: ["sales-today", today.toISOString().split("T")[0]],
    queryFn: () =>
      SalesService.readSales({
        skip: 0,
        limit: 1000,
        startDate: today.toISOString().split("T")[0],
        endDate: today.toISOString().split("T")[0],
      }),
  })

  // Fetch yesterday's sales
  const { data: yesterdaySales } = useQuery({
    queryKey: ["sales-yesterday", yesterday.toISOString().split("T")[0]],
    queryFn: () =>
      SalesService.readSales({
        skip: 0,
        limit: 1000,
        startDate: yesterday.toISOString().split("T")[0],
        endDate: yesterday.toISOString().split("T")[0],
      }),
  })

  // Calculate values
  const currentMonthRevenue = useMemo(() => {
    if (!currentMonthSales?.data) return 0
    return currentMonthSales.data.reduce(
      (sum, sale) => sum + parseFloat(sale.total_amount || "0"),
      0
    )
  }, [currentMonthSales])

  const previousMonthRevenue = useMemo(() => {
    if (!previousMonthSales?.data) return 0
    return previousMonthSales.data.reduce(
      (sum, sale) => sum + parseFloat(sale.total_amount || "0"),
      0
    )
  }, [previousMonthSales])

  const todayRevenue = useMemo(() => {
    if (!todaySales?.data) return 0
    return todaySales.data.reduce(
      (sum, sale) => sum + parseFloat(sale.total_amount || "0"),
      0
    )
  }, [todaySales])

  const yesterdayRevenue = useMemo(() => {
    if (!yesterdaySales?.data) return 0
    return yesterdaySales.data.reduce(
      (sum, sale) => sum + parseFloat(sale.total_amount || "0"),
      0
    )
  }, [yesterdaySales])

  const totalExpenses = useMemo(() => {
    if (!currentMonthExpenses || typeof currentMonthExpenses !== 'object' || !('total_amount' in currentMonthExpenses)) return 0
    return Number((currentMonthExpenses as any).total_amount) || 0
  }, [currentMonthExpenses])

  const previousMonthExpensesValue = useMemo(() => {
    if (!previousMonthExpenses || typeof previousMonthExpenses !== 'object' || !('total_amount' in previousMonthExpenses)) return 0
    return Number((previousMonthExpenses as any).total_amount) || 0
  }, [previousMonthExpenses])

  // Calculate percentages
  const revenueChange = calculatePercentageChange(currentMonthRevenue, previousMonthRevenue)
  const dailyIncomeChange = calculatePercentageChange(todayRevenue, yesterdayRevenue)
  const expenseChange = calculatePercentageChange(totalExpenses, previousMonthExpensesValue)
  
  // Potential growth = Net profit (Revenue - Expenses)
  const currentNetProfit = currentMonthRevenue - totalExpenses
  const previousNetProfit = previousMonthRevenue - previousMonthExpensesValue
  const potentialGrowthChange = calculatePercentageChange(currentNetProfit, previousNetProfit)

  return (
    <Box 
      mb={8}
      opacity={isMounted ? 1 : 0}
      transform={isMounted ? "translateY(0)" : "translateY(20px)"}
      transition="all 0.5s ease 0.1s"
    >
      <Grid
        templateColumns={{
          base: "repeat(1, 1fr)",
          md: "repeat(2, 1fr)",
          lg: "repeat(4, 1fr)",
        }}
        gap={4}
      >
        {/* Net Profit Card */}
        <Box 
          p={5} 
          bg={{ base: "#1a1d29", _light: "#ffffff" }}
          borderRadius="lg" 
          border="1px solid"
          borderColor={{ base: "rgba(255, 255, 255, 0.08)", _light: "#e5e7eb" }}
          boxShadow={{ base: "0 2px 4px rgba(0, 0, 0, 0.2)", _light: "0 1px 3px rgba(0, 0, 0, 0.1)" }}
          transition="all 0.3s ease"
          _hover={{ 
            shadow: { base: "0 4px 12px rgba(0, 0, 0, 0.3)", _light: "0 4px 12px rgba(0, 0, 0, 0.15)" },
            transform: "translateY(-2px)",
          }}
          position="relative"
          overflow="hidden"
        >
          <HStack justify="space-between" mb={2} align="start">
            <VStack align="start" gap={0}>
              <Text fontSize="xs" color={{ base: "#9ca3af", _light: "#6b7280" }} fontWeight="500" textTransform="uppercase" letterSpacing="0.5px">
                Net profit
              </Text>
              <Text 
                fontSize="2xl" 
                fontWeight="700"
                color={{ base: "#ffffff", _light: "#1a1d29" }}
                mt={1}
              >
                {formatCurrency(currentNetProfit)}
              </Text>
            </VStack>
            <Icon 
              as={currentNetProfit >= 0 ? FiArrowUp : FiArrowDown} 
              color={currentNetProfit >= 0 ? "#22c55e" : "#ef4444"} 
              fontSize="lg" 
            />
          </HStack>
          <HStack gap={1}>
            <Text 
              fontSize="xs" 
              color={potentialGrowthChange >= 0 ? "#22c55e" : "#ef4444"} 
              fontWeight="600"
            >
              {potentialGrowthChange >= 0 ? "+" : ""}{potentialGrowthChange.toFixed(1)}%
            </Text>
            <Text fontSize="xs" color={{ base: "#9ca3af", _light: "#6b7280" }}>
              vs last month
            </Text>
          </HStack>
        </Box>

        {/* Revenue Current Card */}
        <Box 
          p={5} 
          bg={{ base: "#1a1d29", _light: "#ffffff" }}
          borderRadius="lg" 
          border="1px solid"
          borderColor={{ base: "rgba(255, 255, 255, 0.08)", _light: "#e5e7eb" }}
          boxShadow={{ base: "0 2px 4px rgba(0, 0, 0, 0.2)", _light: "0 1px 3px rgba(0, 0, 0, 0.1)" }}
          transition="all 0.3s ease"
          _hover={{ 
            shadow: { base: "0 4px 12px rgba(0, 0, 0, 0.3)", _light: "0 4px 12px rgba(0, 0, 0, 0.15)" },
            transform: "translateY(-2px)",
          }}
          position="relative"
          overflow="hidden"
        >
          <HStack justify="space-between" mb={2} align="start">
            <VStack align="start" gap={0}>
              <Text fontSize="xs" color={{ base: "#9ca3af", _light: "#6b7280" }} fontWeight="500" textTransform="uppercase" letterSpacing="0.5px">
                Revenue current
              </Text>
              <Text 
                fontSize="2xl" 
                fontWeight="700"
                color={{ base: "#ffffff", _light: "#1a1d29" }}
                mt={1}
              >
                {formatCurrency(currentMonthRevenue)}
              </Text>
            </VStack>
            <Icon 
              as={revenueChange >= 0 ? FiArrowUp : FiArrowDown} 
              color={revenueChange >= 0 ? "#22c55e" : "#ef4444"} 
              fontSize="lg" 
            />
          </HStack>
          <HStack gap={1}>
            <Text 
              fontSize="xs" 
              color={revenueChange >= 0 ? "#22c55e" : "#ef4444"} 
              fontWeight="600"
            >
              {revenueChange >= 0 ? "+" : ""}{revenueChange.toFixed(1)}%
            </Text>
            <Text fontSize="xs" color={{ base: "#9ca3af", _light: "#6b7280" }}>
              vs last month
            </Text>
          </HStack>
        </Box>

        {/* Daily Income Card */}
        <Box 
          p={5} 
          bg={{ base: "#1a1d29", _light: "#ffffff" }}
          borderRadius="lg" 
          border="1px solid"
          borderColor={{ base: "rgba(255, 255, 255, 0.08)", _light: "#e5e7eb" }}
          boxShadow={{ base: "0 2px 4px rgba(0, 0, 0, 0.2)", _light: "0 1px 3px rgba(0, 0, 0, 0.1)" }}
          transition="all 0.3s ease"
          _hover={{ 
            shadow: { base: "0 4px 12px rgba(0, 0, 0, 0.3)", _light: "0 4px 12px rgba(0, 0, 0, 0.15)" },
            transform: "translateY(-2px)",
          }}
          position="relative"
          overflow="hidden"
        >
          <HStack justify="space-between" mb={2} align="start">
            <VStack align="start" gap={0}>
              <Text fontSize="xs" color={{ base: "#9ca3af", _light: "#6b7280" }} fontWeight="500" textTransform="uppercase" letterSpacing="0.5px">
                Daily Income
              </Text>
              <Text 
                fontSize="2xl" 
                fontWeight="700"
                color={{ base: "#ffffff", _light: "#1a1d29" }}
                mt={1}
              >
                {formatCurrency(todayRevenue)}
              </Text>
            </VStack>
            <Icon 
              as={dailyIncomeChange >= 0 ? FiArrowUp : FiArrowDown} 
              color={dailyIncomeChange >= 0 ? "#22c55e" : "#ef4444"} 
              fontSize="lg" 
            />
          </HStack>
          <HStack gap={1}>
            <Text 
              fontSize="xs" 
              color={dailyIncomeChange >= 0 ? "#22c55e" : "#ef4444"} 
              fontWeight="600"
            >
              {dailyIncomeChange >= 0 ? "+" : ""}{dailyIncomeChange.toFixed(1)}%
            </Text>
            <Text fontSize="xs" color={{ base: "#9ca3af", _light: "#6b7280" }}>
              vs yesterday
            </Text>
          </HStack>
        </Box>

        {/* Expense Current Card */}
        <Box 
          p={5} 
          bg={{ base: "#1a1d29", _light: "#ffffff" }}
          borderRadius="lg" 
          border="1px solid"
          borderColor={{ base: "rgba(255, 255, 255, 0.08)", _light: "#e5e7eb" }}
          boxShadow={{ base: "0 2px 4px rgba(0, 0, 0, 0.2)", _light: "0 1px 3px rgba(0, 0, 0, 0.1)" }}
          transition="all 0.3s ease"
          _hover={{ 
            shadow: { base: "0 4px 12px rgba(0, 0, 0, 0.3)", _light: "0 4px 12px rgba(0, 0, 0, 0.15)" },
            transform: "translateY(-2px)",
          }}
          position="relative"
          overflow="hidden"
        >
          <HStack justify="space-between" mb={2} align="start">
            <VStack align="start" gap={0}>
              <Text fontSize="xs" color={{ base: "#9ca3af", _light: "#6b7280" }} fontWeight="500" textTransform="uppercase" letterSpacing="0.5px">
                Expense current
              </Text>
              <Text 
                fontSize="2xl" 
                fontWeight="700"
                color={{ base: "#ffffff", _light: "#1a1d29" }}
                mt={1}
              >
                {formatCurrency(totalExpenses)}
              </Text>
            </VStack>
            <Icon 
              as={expenseChange >= 0 ? FiArrowUp : FiArrowDown} 
              color={expenseChange >= 0 ? "#ef4444" : "#22c55e"} 
              fontSize="lg" 
            />
          </HStack>
          <HStack gap={1}>
            <Text 
              fontSize="xs" 
              color={expenseChange >= 0 ? "#ef4444" : "#22c55e"} 
              fontWeight="600"
            >
              {expenseChange >= 0 ? "+" : ""}{expenseChange.toFixed(1)}%
            </Text>
            <Text fontSize="xs" color={{ base: "#9ca3af", _light: "#6b7280" }}>
              vs last month
            </Text>
          </HStack>
        </Box>
      </Grid>
    </Box>
  )
}
