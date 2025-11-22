import { Box, Grid, HStack, VStack, Text, Icon } from "@chakra-ui/react"
import { FiBox, FiShoppingCart, FiPackage } from "react-icons/fi"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { SalesService, ProductsService } from "@/client"
import { formatCurrency } from "./utils"

interface RevenueSalesPurchaseCardsProps {
  totalRevenue: number
  isMounted: boolean
}

function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

export function RevenueSalesPurchaseCards({ isMounted }: RevenueSalesPurchaseCardsProps) {
  const today = new Date()
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
  const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)

  // Fetch current month sales
  const { data: currentMonthSales } = useQuery({
    queryKey: ["sales-revenue-cards-current", firstDayOfMonth.toISOString().split("T")[0], today.toISOString().split("T")[0]],
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
    queryKey: ["sales-revenue-cards-previous", firstDayOfLastMonth.toISOString().split("T")[0], lastDayOfLastMonth.toISOString().split("T")[0]],
    queryFn: () =>
      SalesService.readSales({
        skip: 0,
        limit: 1000,
        startDate: firstDayOfLastMonth.toISOString().split("T")[0],
        endDate: lastDayOfLastMonth.toISOString().split("T")[0],
      }),
  })

  // Fetch products for inventory value
  const { data: productsData } = useQuery({
    queryKey: ["products-inventory"],
    queryFn: () => ProductsService.readProducts({ skip: 0, limit: 1000 }),
  })

  // Calculate current month revenue
  const currentMonthRevenue = useMemo(() => {
    if (!currentMonthSales?.data) return 0
    return currentMonthSales.data.reduce(
      (sum, sale) => sum + parseFloat(sale.total_amount || "0"),
      0
    )
  }, [currentMonthSales])

  // Calculate previous month revenue
  const previousMonthRevenue = useMemo(() => {
    if (!previousMonthSales?.data) return 0
    return previousMonthSales.data.reduce(
      (sum, sale) => sum + parseFloat(sale.total_amount || "0"),
      0
    )
  }, [previousMonthSales])

  // Calculate sales count (number of transactions)
  const currentMonthSalesCount = useMemo(() => {
    return currentMonthSales?.data?.length || 0
  }, [currentMonthSales])

  const previousMonthSalesCount = useMemo(() => {
    return previousMonthSales?.data?.length || 0
  }, [previousMonthSales])

  // Calculate inventory value (stock quantity × cost price)
  const inventoryValue = useMemo(() => {
    if (!productsData?.data) return 0
    return productsData.data.reduce((sum, product) => {
      const stock = product.current_stock || 0
      const costPrice = parseFloat(product.buying_price?.toString() || "0")
      return sum + (stock * costPrice)
    }, 0)
  }, [productsData])

  // Calculate total products count
  const totalProductsCount = useMemo(() => {
    return productsData?.data?.length || 0
  }, [productsData])

  // Calculate percentages
  const revenueChange = calculatePercentageChange(currentMonthRevenue, previousMonthRevenue)
  const salesCountChange = calculatePercentageChange(currentMonthSalesCount, previousMonthSalesCount)

  return (
    <Box 
      mb={8}
      opacity={isMounted ? 1 : 0}
      transform={isMounted ? "translateY(0)" : "translateY(20px)"}
      transition="all 0.5s ease 0.4s"
    >
      <Grid
        templateColumns={{
          base: "repeat(1, 1fr)",
          md: "repeat(3, 1fr)",
        }}
        gap={4}
      >
        {/* Revenue Card */}
        <Box 
          p={6} 
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
          <HStack justify="space-between" align="start" mb={3}>
            <VStack align="start" gap={0} flex={1}>
              <Text fontSize="xs" color={{ base: "#9ca3af", _light: "#6b7280" }} fontWeight="500" textTransform="uppercase" letterSpacing="0.5px" mb={2}>
                Revenue
              </Text>
              <Text 
                fontSize="3xl" 
                fontWeight="700"
                color={{ base: "#ffffff", _light: "#1a1d29" }}
                mb={1}
              >
                {formatCurrency(currentMonthRevenue)}
              </Text>
              <HStack gap={2} mt={1}>
                <Text 
                  fontSize="xs" 
                  color={revenueChange >= 0 ? "#22c55e" : "#ef4444"} 
                  fontWeight="600"
                >
                  {revenueChange >= 0 ? "+" : ""}{revenueChange.toFixed(1)}%
                </Text>
                <Text fontSize="xs" color={{ base: "#6b7280", _light: "#9ca3af" }}>
                  vs last month
                </Text>
              </HStack>
            </VStack>
            <Box
              w={12}
              h={12}
              borderRadius="full"
              bg="rgba(59, 130, 246, 0.15)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <Icon as={FiBox} fontSize="xl" color="#3b82f6" />
            </Box>
          </HStack>
        </Box>

        {/* Sales Count Card */}
        <Box 
          p={6} 
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
          <HStack justify="space-between" align="start" mb={3}>
            <VStack align="start" gap={0} flex={1}>
              <Text fontSize="xs" color={{ base: "#9ca3af", _light: "#6b7280" }} fontWeight="500" textTransform="uppercase" letterSpacing="0.5px" mb={2}>
                Transactions
              </Text>
              <Text 
                fontSize="3xl" 
                fontWeight="700"
                color={{ base: "#ffffff", _light: "#1a1d29" }}
                mb={1}
              >
                {currentMonthSalesCount}
              </Text>
              <HStack gap={2} mt={1}>
                <Text 
                  fontSize="xs" 
                  color={salesCountChange >= 0 ? "#22c55e" : "#ef4444"} 
                  fontWeight="600"
                >
                  {salesCountChange >= 0 ? "+" : ""}{salesCountChange.toFixed(1)}%
                </Text>
                <Text fontSize="xs" color={{ base: "#6b7280", _light: "#9ca3af" }}>
                  vs last month
                </Text>
              </HStack>
            </VStack>
            <Box
              w={12}
              h={12}
              borderRadius="full"
              bg="rgba(239, 68, 68, 0.15)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <Icon as={FiShoppingCart} fontSize="xl" color="#ef4444" />
            </Box>
          </HStack>
        </Box>

        {/* Inventory Value Card */}
        <Box 
          p={6} 
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
          <HStack justify="space-between" align="start" mb={3}>
            <VStack align="start" gap={0} flex={1}>
              <Text fontSize="xs" color={{ base: "#9ca3af", _light: "#6b7280" }} fontWeight="500" textTransform="uppercase" letterSpacing="0.5px" mb={2}>
                Inventory Value
              </Text>
              <Text 
                fontSize="3xl" 
                fontWeight="700"
                color={{ base: "#ffffff", _light: "#1a1d29" }}
                mb={1}
              >
                {formatCurrency(inventoryValue)}
              </Text>
              <HStack gap={2} mt={1}>
                <Text fontSize="xs" color={{ base: "#6b7280", _light: "#9ca3af" }} fontWeight="500">
                  {totalProductsCount} products
                </Text>
              </HStack>
            </VStack>
            <Box
              w={12}
              h={12}
              borderRadius="full"
              bg="rgba(34, 197, 94, 0.15)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <Icon as={FiPackage} fontSize="xl" color="#22c55e" />
            </Box>
          </HStack>
        </Box>
      </Grid>
    </Box>
  )
}
