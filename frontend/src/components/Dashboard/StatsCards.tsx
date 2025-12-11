import { Box, Grid, HStack, Icon, Text, VStack } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { FiArrowDown, FiArrowUp } from "react-icons/fi"
import { formatCurrency } from "./utils"

interface StatsCardsProps {
  totalRevenue: number
  isMounted: boolean
}

export function StatsCards({ isMounted }: StatsCardsProps) {
  // Fetch dashboard statistics from backend
  const { data: dashboardStats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token") || ""
      const apiBase = import.meta.env.VITE_API_URL || ""
      const response = await fetch(
        `${apiBase}/api/v1/analytics/dashboard-stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard statistics")
      }
      return response.json()
    },
  })

  // Use backend-calculated values
  const currentMonthRevenue = dashboardStats?.current_month_revenue || 0
  const todayRevenue = dashboardStats?.today_revenue || 0
  const totalExpenses = dashboardStats?.current_month_expenses || 0
  const revenueChange = dashboardStats?.revenue_change_percent || 0
  const dailyIncomeChange = dashboardStats?.daily_income_change_percent || 0
  const expenseChange = dashboardStats?.expense_change_percent || 0
  const currentNetProfit = dashboardStats?.net_profit || 0
  const potentialGrowthChange = dashboardStats?.net_profit_change_percent || 0
  const unpaidDebtsTotal = dashboardStats?.unpaid_debts_total || 0
  const unpaidDebtsCount = dashboardStats?.unpaid_debts_count || 0

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
          lg: "repeat(5, 1fr)",
        }}
        gap={4}
      >
        {/* Net Profit Card */}
        <Box
          p={5}
          bg="bg.surface"
          borderRadius="lg"
          border="1px solid"
          borderColor="border.card"
          boxShadow={{
            base: "0 2px 4px rgba(0, 0, 0, 0.2)",
            _light: "0 1px 3px rgba(0, 0, 0, 0.1)",
          }}
          transition="all 0.3s ease"
          _hover={{
            shadow: {
              base: "0 4px 12px rgba(0, 0, 0, 0.3)",
              _light: "0 4px 12px rgba(0, 0, 0, 0.15)",
            },
            transform: "translateY(-2px)",
          }}
          position="relative"
          overflow="hidden"
        >
          <HStack justify="space-between" mb={2} align="start">
            <VStack align="start" gap={0}>
              <Text
                fontSize="xs"
                color="text.muted"
                fontWeight="500"
                textTransform="uppercase"
                letterSpacing="0.5px"
              >
                Net profit
              </Text>
              <Text fontSize="2xl" fontWeight="700" color="text.primary" mt={1}>
                {formatCurrency(currentNetProfit)}
              </Text>
            </VStack>
            <Icon
              as={currentNetProfit >= 0 ? FiArrowUp : FiArrowDown}
              color={currentNetProfit >= 0 ? "button.success" : "button.danger"}
              fontSize="lg"
            />
          </HStack>
          <HStack gap={1}>
            <Text
              fontSize="xs"
              color={
                potentialGrowthChange >= 0 ? "button.success" : "button.danger"
              }
              fontWeight="600"
            >
              {potentialGrowthChange >= 0 ? "+" : ""}
              {potentialGrowthChange.toFixed(1)}%
            </Text>
            <Text fontSize="xs" color={{ base: "#9ca3af", _light: "#6b7280" }}>
              vs last month
            </Text>
          </HStack>
        </Box>

        {/* Revenue Current Card */}
        <Box
          p={5}
          bg="bg.surface"
          borderRadius="lg"
          border="1px solid"
          borderColor="border.card"
          boxShadow={{
            base: "0 2px 4px rgba(0, 0, 0, 0.2)",
            _light: "0 1px 3px rgba(0, 0, 0, 0.1)",
          }}
          transition="all 0.3s ease"
          _hover={{
            shadow: {
              base: "0 4px 12px rgba(0, 0, 0, 0.3)",
              _light: "0 4px 12px rgba(0, 0, 0, 0.15)",
            },
            transform: "translateY(-2px)",
          }}
          position="relative"
          overflow="hidden"
        >
          <HStack justify="space-between" mb={2} align="start">
            <VStack align="start" gap={0}>
              <Text
                fontSize="xs"
                color="text.muted"
                fontWeight="500"
                textTransform="uppercase"
                letterSpacing="0.5px"
              >
                Revenue current
              </Text>
              <Text fontSize="2xl" fontWeight="700" color="text.primary" mt={1}>
                {formatCurrency(currentMonthRevenue)}
              </Text>
            </VStack>
            <Icon
              as={revenueChange >= 0 ? FiArrowUp : FiArrowDown}
              color={revenueChange >= 0 ? "button.success" : "button.danger"}
              fontSize="lg"
            />
          </HStack>
          <HStack gap={1}>
            <Text
              fontSize="xs"
              color={revenueChange >= 0 ? "button.success" : "button.danger"}
              fontWeight="600"
            >
              {revenueChange >= 0 ? "+" : ""}
              {revenueChange.toFixed(1)}%
            </Text>
            <Text fontSize="xs" color={{ base: "#9ca3af", _light: "#6b7280" }}>
              vs last month
            </Text>
          </HStack>
        </Box>

        {/* Daily Income Card */}
        <Box
          p={5}
          bg="bg.surface"
          borderRadius="lg"
          border="1px solid"
          borderColor="border.card"
          boxShadow={{
            base: "0 2px 4px rgba(0, 0, 0, 0.2)",
            _light: "0 1px 3px rgba(0, 0, 0, 0.1)",
          }}
          transition="all 0.3s ease"
          _hover={{
            shadow: {
              base: "0 4px 12px rgba(0, 0, 0, 0.3)",
              _light: "0 4px 12px rgba(0, 0, 0, 0.15)",
            },
            transform: "translateY(-2px)",
          }}
          position="relative"
          overflow="hidden"
        >
          <HStack justify="space-between" mb={2} align="start">
            <VStack align="start" gap={0}>
              <Text
                fontSize="xs"
                color="text.muted"
                fontWeight="500"
                textTransform="uppercase"
                letterSpacing="0.5px"
              >
                Daily Income
              </Text>
              <Text fontSize="2xl" fontWeight="700" color="text.primary" mt={1}>
                {formatCurrency(todayRevenue)}
              </Text>
            </VStack>
            <Icon
              as={dailyIncomeChange >= 0 ? FiArrowUp : FiArrowDown}
              color={
                dailyIncomeChange >= 0 ? "button.success" : "button.danger"
              }
              fontSize="lg"
            />
          </HStack>
          <HStack gap={1}>
            <Text
              fontSize="xs"
              color={
                dailyIncomeChange >= 0 ? "button.success" : "button.danger"
              }
              fontWeight="600"
            >
              {dailyIncomeChange >= 0 ? "+" : ""}
              {dailyIncomeChange.toFixed(1)}%
            </Text>
            <Text fontSize="xs" color={{ base: "#9ca3af", _light: "#6b7280" }}>
              vs yesterday
            </Text>
          </HStack>
        </Box>

        {/* Expense Current Card */}
        <Box
          p={5}
          bg="bg.surface"
          borderRadius="lg"
          border="1px solid"
          borderColor="border.card"
          boxShadow={{
            base: "0 2px 4px rgba(0, 0, 0, 0.2)",
            _light: "0 1px 3px rgba(0, 0, 0, 0.1)",
          }}
          transition="all 0.3s ease"
          _hover={{
            shadow: {
              base: "0 4px 12px rgba(0, 0, 0, 0.3)",
              _light: "0 4px 12px rgba(0, 0, 0, 0.15)",
            },
            transform: "translateY(-2px)",
          }}
          position="relative"
          overflow="hidden"
        >
          <HStack justify="space-between" mb={2} align="start">
            <VStack align="start" gap={0}>
              <Text
                fontSize="xs"
                color="text.muted"
                fontWeight="500"
                textTransform="uppercase"
                letterSpacing="0.5px"
              >
                Expense current
              </Text>
              <Text fontSize="2xl" fontWeight="700" color="text.primary" mt={1}>
                {formatCurrency(totalExpenses)}
              </Text>
            </VStack>
            <Icon
              as={expenseChange >= 0 ? FiArrowUp : FiArrowDown}
              color={expenseChange >= 0 ? "button.danger" : "button.success"}
              fontSize="lg"
            />
          </HStack>
          <HStack gap={1}>
            <Text
              fontSize="xs"
              color={expenseChange >= 0 ? "button.danger" : "button.success"}
              fontWeight="600"
            >
              {expenseChange >= 0 ? "+" : ""}
              {expenseChange.toFixed(1)}%
            </Text>
            <Text fontSize="xs" color={{ base: "#9ca3af", _light: "#6b7280" }}>
              vs last month
            </Text>
          </HStack>
        </Box>

        {/* Unpaid Debts Card */}
        <Box
          p={5}
          bg="bg.surface"
          borderRadius="lg"
          border="1px solid"
          borderColor="border.card"
          boxShadow={{
            base: "0 2px 4px rgba(0, 0, 0, 0.2)",
            _light: "0 1px 3px rgba(0, 0, 0, 0.1)",
          }}
          transition="all 0.3s ease"
          _hover={{
            shadow: {
              base: "0 4px 12px rgba(0, 0, 0, 0.3)",
              _light: "0 4px 12px rgba(0, 0, 0, 0.15)",
            },
            transform: "translateY(-2px)",
          }}
          position="relative"
          overflow="hidden"
        >
          <HStack justify="space-between" mb={2} align="start">
            <VStack align="start" gap={0}>
              <Text
                fontSize="xs"
                color="text.muted"
                fontWeight="500"
                textTransform="uppercase"
                letterSpacing="0.5px"
              >
                Unpaid Debts
              </Text>
              <Text
                fontSize="2xl"
                fontWeight="700"
                color="button.warning"
                mt={1}
              >
                {formatCurrency(unpaidDebtsTotal)}
              </Text>
            </VStack>
            <Icon as={FiArrowDown} color="button.warning" fontSize="lg" />
          </HStack>
          <HStack gap={1}>
            <Text fontSize="xs" color="text.muted" fontWeight="600">
              {unpaidDebtsCount}{" "}
              {unpaidDebtsCount === 1 ? "invoice" : "invoices"}
            </Text>
            <Text fontSize="xs" color={{ base: "#9ca3af", _light: "#6b7280" }}>
              pending
            </Text>
          </HStack>
        </Box>
      </Grid>
    </Box>
  )
}
