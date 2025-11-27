import {
  Box,
  Card,
  Grid,
  HStack,
  Skeleton,
  Text,
  VStack,
} from "@chakra-ui/react"
import {
  FiDollarSign,
  FiPackage,
  FiTrendingDown,
  FiTrendingUp,
} from "react-icons/fi"
import { formatCurrency } from "./utils"

interface SummaryCardsProps {
  salesSummary: {
    totalSales: number
    totalAmount: number
    totalItems: number
  } | null
  expenseSummary: {
    total_amount: number | string
    count: number
  } | null
  netProfit: number | null
  stockSummary: {
    totalInventoryValue: number
    totalProducts: number
  } | null
  isLoading?: boolean
}

export function SummaryCards({
  salesSummary,
  expenseSummary,
  netProfit,
  stockSummary,
  isLoading = false,
}: SummaryCardsProps) {
  if (isLoading) {
    return (
      <Grid
        templateColumns={{
          base: "1fr",
          md: "repeat(2, 1fr)",
          lg: "repeat(4, 1fr)",
        }}
        gap={4}
      >
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} height="140px" borderRadius="lg" />
        ))}
      </Grid>
    )
  }

  return (
    <Grid
      templateColumns={{
        base: "1fr",
        md: "repeat(2, 1fr)",
        lg: "repeat(4, 1fr)",
      }}
      gap={4}
    >
      {salesSummary && (
        <Card.Root
          variant="outline"
          bg="bg.surface"
          borderColor="border.card"
          borderWidth="1px"
          _hover={{
            transform: "translateY(-4px)",
            shadow: "lg",
            borderColor: { base: "rgba(59, 130, 246, 0.4)", _light: "#3b82f6" },
          }}
          transition="all 0.3s"
        >
          <Card.Body>
            <VStack align="start" gap={3}>
              <HStack justify="space-between" w="full">
                <Text fontSize="sm" fontWeight="medium" color="fg.muted">
                  Total Revenue
                </Text>
                <Box p={2.5} bg="blue.500" borderRadius="lg">
                  <FiDollarSign color="white" size={18} />
                </Box>
              </HStack>
              <Text fontSize="3xl" fontWeight="bold">
                Ksh {formatCurrency(salesSummary.totalAmount)}
              </Text>
              <Text fontSize="xs" color="fg.muted">
                {salesSummary.totalSales} sales • {salesSummary.totalItems}{" "}
                items
              </Text>
            </VStack>
          </Card.Body>
        </Card.Root>
      )}

      {expenseSummary && (
        <Card.Root
          variant="outline"
          bg="bg.surface"
          borderColor="border.card"
          borderWidth="1px"
          _hover={{
            transform: "translateY(-4px)",
            shadow: "lg",
            borderColor: { base: "rgba(59, 130, 246, 0.4)", _light: "#3b82f6" },
          }}
          transition="all 0.3s"
        >
          <Card.Body>
            <VStack align="start" gap={3}>
              <HStack justify="space-between" w="full">
                <Text fontSize="sm" fontWeight="medium" color="fg.muted">
                  Total Expenses
                </Text>
                <Box p={2.5} bg="red.500" borderRadius="lg">
                  <FiTrendingDown color="white" size={18} />
                </Box>
              </HStack>
              <Text fontSize="3xl" fontWeight="bold">
                Ksh{" "}
                {formatCurrency(
                  parseFloat(expenseSummary.total_amount?.toString() || "0"),
                )}
              </Text>
              <Text fontSize="xs" color="fg.muted">
                {expenseSummary.count} transactions
              </Text>
            </VStack>
          </Card.Body>
        </Card.Root>
      )}

      {netProfit !== null && (
        <Card.Root
          variant="outline"
          bg="bg.surface"
          borderColor="border.card"
          borderWidth="1px"
          _hover={{
            transform: "translateY(-4px)",
            shadow: "lg",
            borderColor: { base: "rgba(59, 130, 246, 0.4)", _light: "#3b82f6" },
          }}
          transition="all 0.3s"
        >
          <Card.Body>
            <VStack align="start" gap={3}>
              <HStack justify="space-between" w="full">
                <Text fontSize="sm" fontWeight="medium" color="fg.muted">
                  Net Profit
                </Text>
                <Box
                  p={2.5}
                  bg={netProfit >= 0 ? "green.500" : "red.500"}
                  borderRadius="lg"
                >
                  {netProfit >= 0 ? (
                    <FiTrendingUp color="white" size={18} />
                  ) : (
                    <FiTrendingDown color="white" size={18} />
                  )}
                </Box>
              </HStack>
              <Text
                fontSize="3xl"
                fontWeight="bold"
                color={netProfit >= 0 ? "green.500" : "red.500"}
              >
                Ksh {formatCurrency(netProfit)}
              </Text>
              <Text fontSize="xs" color="fg.muted">
                Revenue - Expenses
              </Text>
            </VStack>
          </Card.Body>
        </Card.Root>
      )}

      {stockSummary && (
        <Card.Root
          variant="outline"
          bg="bg.surface"
          borderColor="border.card"
          borderWidth="1px"
          _hover={{
            transform: "translateY(-4px)",
            shadow: "lg",
            borderColor: { base: "rgba(59, 130, 246, 0.4)", _light: "#3b82f6" },
          }}
          transition="all 0.3s"
        >
          <Card.Body>
            <VStack align="start" gap={3}>
              <HStack justify="space-between" w="full">
                <Text fontSize="sm" fontWeight="medium" color="fg.muted">
                  Inventory Value
                </Text>
                <Box p={2.5} bg="purple.500" borderRadius="lg">
                  <FiPackage color="white" size={18} />
                </Box>
              </HStack>
              <Text fontSize="3xl" fontWeight="bold">
                Ksh {formatCurrency(stockSummary.totalInventoryValue)}
              </Text>
              <Text fontSize="xs" color="fg.muted">
                {stockSummary.totalProducts} products
              </Text>
            </VStack>
          </Card.Body>
        </Card.Root>
      )}
    </Grid>
  )
}
