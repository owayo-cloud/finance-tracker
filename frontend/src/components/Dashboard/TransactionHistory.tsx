import { Box, Heading, HStack, Text, VStack } from "@chakra-ui/react"
import type { SalePublic } from "@/client"
import { formatCurrency, formatDate } from "./utils"

interface TransactionHistoryProps {
  recentSales: SalePublic[]
  totalRevenue: number
}

export function TransactionHistory({
  recentSales,
  totalRevenue,
}: TransactionHistoryProps) {
  return (
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
      <Heading
        size="md"
        fontWeight="600"
        color={{ base: "#ffffff", _light: "#1a1d29" }}
        mb={4}
      >
        Transaction History
      </Heading>

      {/* Donut Chart Placeholder */}
      <Box mb={4} display="flex" justifyContent="center" alignItems="center">
        <Box
          w="120px"
          h="120px"
          borderRadius="full"
          border="8px solid"
          borderColor={{ base: "#374151", _light: "#e5e7eb" }}
          display="flex"
          alignItems="center"
          justifyContent="center"
          position="relative"
        >
          <VStack gap={0}>
            <Text
              fontSize="lg"
              fontWeight="700"
              color={{ base: "#ffffff", _light: "#1a1d29" }}
            >
              {formatCurrency(totalRevenue)}
            </Text>
            <Text fontSize="xs" color={{ base: "#9ca3af", _light: "#6b7280" }}>
              Total
            </Text>
          </VStack>
        </Box>
      </Box>

      {/* Recent Transactions */}
      <VStack gap={3} align="stretch">
        {recentSales.slice(0, 3).map((sale) => (
          <Box
            key={sale.id}
            p={3}
            borderRadius="md"
            bg={{ base: "rgba(255, 255, 255, 0.05)", _light: "#f9fafb" }}
            border="1px solid"
            borderColor={{
              base: "rgba(255, 255, 255, 0.08)",
              _light: "#e5e7eb",
            }}
          >
            <HStack justify="space-between">
              <VStack align="start" gap={0}>
                <Text
                  fontSize="sm"
                  fontWeight="600"
                  color={{ base: "#ffffff", _light: "#1a1d29" }}
                >
                  {sale.product?.name || "Product"}
                </Text>
                <Text
                  fontSize="xs"
                  color={{ base: "#9ca3af", _light: "#6b7280" }}
                >
                  {formatDate(sale.sale_date)}
                </Text>
              </VStack>
              <Text
                fontSize="sm"
                fontWeight="700"
                color={{ base: "#ffffff", _light: "#1a1d29" }}
              >
                {formatCurrency(sale.total_amount)}
              </Text>
            </HStack>
          </Box>
        ))}
        {recentSales.length === 0 && (
          <Text
            fontSize="sm"
            color={{ base: "#9ca3af", _light: "#6b7280" }}
            textAlign="center"
            py={4}
          >
            No recent transactions
          </Text>
        )}
      </VStack>
    </Box>
  )
}
