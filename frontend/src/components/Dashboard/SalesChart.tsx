import { Box, Heading, VStack, HStack, Text, Card, Skeleton } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { SalesService } from "@/client"
import { formatCurrency } from "./utils"

interface SalesChartProps {
  totalRevenue: number
}

export function SalesChart({}: SalesChartProps) {
  // Get last 7 days of sales (including today)
  const today = new Date()
  today.setHours(23, 59, 59, 999) // End of today
  const sixDaysAgo = new Date(today)
  sixDaysAgo.setDate(sixDaysAgo.getDate() - 6)
  sixDaysAgo.setHours(0, 0, 0, 0) // Start of day

  const startDate = sixDaysAgo.toISOString().split("T")[0]
  const endDate = today.toISOString().split("T")[0]

  const { data: salesData, isLoading, error } = useQuery({
    queryKey: ["sales-chart", startDate, endDate],
    queryFn: () =>
      SalesService.readSales({
        skip: 0,
        limit: 1000,
        startDate: startDate,
        endDate: endDate,
      }),
  })

  // Group sales by date
  const dailySales = useMemo(() => {
    if (!salesData?.data) return []

    const salesByDate: Record<string, number> = {}
    const chartToday = new Date()
    
    // Initialize all 7 days with 0 (last 6 days + today)
    for (let i = 6; i >= 0; i--) {
      const date = new Date(chartToday)
      date.setDate(date.getDate() - i)
      const dateKey = date.toISOString().split("T")[0]
      salesByDate[dateKey] = 0
    }

    // Sum sales by date
    salesData.data.forEach((sale) => {
      if (sale.sale_date) {
        const saleDate = new Date(sale.sale_date).toISOString().split("T")[0]
        if (salesByDate[saleDate] !== undefined) {
          salesByDate[saleDate] += parseFloat(sale.total_amount || "0")
        }
      }
    })

    // Convert to array and format
    return Object.entries(salesByDate)
      .map(([date, amount]) => ({
        date,
        amount,
        label: new Date(date).toLocaleDateString("en-KE", { weekday: "short", day: "numeric" }),
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [salesData])

  const maxAmount = Math.max(...dailySales.map((d) => d.amount), 1)
  const chartHeight = 200
  const barWidth = 30

  return (
    <Card.Root
      p={6}
      bg={{ base: "#1a1d29", _light: "#ffffff" }}
      borderRadius="lg"
      border="1px solid"
      borderColor={{ base: "rgba(255, 255, 255, 0.08)", _light: "#e5e7eb" }}
      boxShadow={{ base: "0 2px 4px rgba(0, 0, 0, 0.2)", _light: "0 1px 3px rgba(0, 0, 0, 0.1)" }}
    >
      <Card.Body>
        <VStack align="stretch" gap={4}>
          <Heading
            size="md"
            fontWeight="600"
            color={{ base: "#ffffff", _light: "#1a1d29" }}
          >
            Sales Trend (Last 7 Days)
          </Heading>

          {isLoading ? (
            <Box
              h={`${chartHeight}px`}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Skeleton h="full" w="full" />
            </Box>
          ) : error ? (
            <Box
              h={`${chartHeight}px`}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text fontSize="sm" color="red.500">
                Error loading sales data
              </Text>
            </Box>
          ) : (
            <Box position="relative" w="full">
              {/* Chart */}
              <Box
                h={`${chartHeight}px`}
                w="full"
                position="relative"
                borderBottom="2px solid"
                borderColor={{ base: "rgba(255, 255, 255, 0.1)", _light: "#e5e7eb" }}
              >
                {dailySales.length > 0 ? (
                  <HStack
                    justify="space-around"
                    align="flex-end"
                    h="full"
                    px={2}
                    pb={2}
                  >
                    {dailySales.map((day) => {
                      const calculatedHeight = maxAmount > 0 ? (day.amount / maxAmount) * (chartHeight - 40) : 0
                      // Ensure minimum height for visibility (at least 4px if there's any amount)
                      const barHeight = day.amount > 0 && calculatedHeight < 4 ? 4 : calculatedHeight
                      const chartToday = new Date()
                      const isToday = day.date === chartToday.toISOString().split("T")[0]
                      
                      return (
                        <VStack
                          key={day.date}
                          gap={1}
                          align="center"
                          flex={1}
                          h="full"
                          justify="flex-end"
                        >
                          <Box
                            position="relative"
                            w={`${barWidth}px`}
                            h={`${Math.max(barHeight, 0)}px`}
                            minH={day.amount > 0 ? "4px" : "0px"}
                            bg={day.amount > 0 ? (isToday ? "#14b8a6" : "#3b82f6") : "transparent"}
                            border={day.amount === 0 ? "1px dashed" : "none"}
                            borderColor={{ base: "rgba(255, 255, 255, 0.2)", _light: "#e5e7eb" }}
                            borderRadius="md md 0 0"
                            transition="all 0.3s"
                            _hover={{
                              bg: day.amount > 0 ? (isToday ? "#0d9488" : "#2563eb") : undefined,
                              transform: day.amount > 0 ? "scaleY(1.05)" : undefined,
                              transformOrigin: "bottom",
                            }}
                            cursor="pointer"
                            title={`${day.label}: ${formatCurrency(day.amount)}`}
                          >
                            {day.amount > 0 && (
                              <Text
                                position="absolute"
                                top="-20px"
                                left="50%"
                                transform="translateX(-50%)"
                                fontSize="xs"
                                fontWeight="600"
                                color={{ base: "#ffffff", _light: "#1a1d29" }}
                                whiteSpace="nowrap"
                              >
                                {formatCurrency(day.amount)}
                              </Text>
                            )}
                          </Box>
                          <Text
                            fontSize="xs"
                            color={{ base: "#9ca3af", _light: "#6b7280" }}
                            fontWeight="500"
                            textAlign="center"
                          >
                            {day.label}
                          </Text>
                        </VStack>
                      )
                    })}
                  </HStack>
                ) : (
                  <Box
                    h="full"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text fontSize="sm" color={{ base: "#9ca3af", _light: "#6b7280" }}>
                      No sales data available
                    </Text>
                  </Box>
                )}
              </Box>

              {/* Summary */}
              {dailySales.length > 0 && (
                <HStack justify="space-between" mt={4} pt={4} borderTop="1px solid" borderColor={{ base: "rgba(255, 255, 255, 0.1)", _light: "#e5e7eb" }}>
                  <VStack align="start" gap={0}>
                    <Text fontSize="xs" color={{ base: "#9ca3af", _light: "#6b7280" }}>
                      Total (7 days)
                    </Text>
                    <Text fontSize="lg" fontWeight="700" color={{ base: "#ffffff", _light: "#1a1d29" }}>
                      {formatCurrency(dailySales.reduce((sum, day) => sum + day.amount, 0))}
                    </Text>
                  </VStack>
                  <VStack align="end" gap={0}>
                    <Text fontSize="xs" color={{ base: "#9ca3af", _light: "#6b7280" }}>
                      Average per day
                    </Text>
                    <Text fontSize="lg" fontWeight="700" color={{ base: "#ffffff", _light: "#1a1d29" }}>
                      {formatCurrency(
                        dailySales.reduce((sum, day) => sum + day.amount, 0) / (dailySales.length || 1)
                      )}
                    </Text>
                  </VStack>
                </HStack>
              )}
            </Box>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}

