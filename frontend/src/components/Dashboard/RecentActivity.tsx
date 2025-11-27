import {
  Badge,
  Box,
  Heading,
  HStack,
  Icon,
  Link,
  Text,
  VStack,
} from "@chakra-ui/react"
import { FiArrowRight, FiShoppingCart } from "react-icons/fi"
import type { SalePublic } from "@/client"
import { formatCurrency, formatDate } from "./utils"

interface RecentActivityProps {
  recentSales: SalePublic[]
}

export function RecentActivity({ recentSales }: RecentActivityProps) {
  // Get the 5 most recent sales
  const activities = recentSales.slice(0, 5)

  return (
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
      <HStack justify="space-between" mb={4}>
        <Heading
          size="md"
          fontWeight="600"
          color={{ base: "#ffffff", _light: "#1a1d29" }}
        >
          Recent Activity
        </Heading>
        {recentSales.length > 0 && (
          <Link href="/sales" style={{ textDecoration: "none" }}>
            <HStack gap={1}>
              <Text
                fontSize="xs"
                color={{ base: "#14b8a6", _light: "#009688" }}
                fontWeight="500"
              >
                View All
              </Text>
              <Icon
                as={FiArrowRight}
                fontSize="xs"
                color={{ base: "#14b8a6", _light: "#009688" }}
              />
            </HStack>
          </Link>
        )}
      </HStack>

      <VStack gap={3} align="stretch" maxH="400px" overflowY="auto">
        {activities.length > 0 ? (
          activities.map((sale) => (
            <Box
              key={sale.id}
              p={3}
              borderRadius="md"
              bg="item.bg"
              border="1px solid"
              borderColor="item.border"
              _hover={{
                bg: "item.bg.hover",
                transform: "translateX(4px)",
              }}
              transition="all 0.2s"
            >
              <HStack gap={3} justify="space-between">
                <HStack gap={3} flex={1}>
                  <Box
                    p={2}
                    borderRadius="md"
                    bg={{
                      base: "rgba(239, 68, 68, 0.1)",
                      _light: "rgba(239, 68, 68, 0.05)",
                    }}
                    border="1px solid"
                    borderColor={{
                      base: "rgba(239, 68, 68, 0.2)",
                      _light: "rgba(239, 68, 68, 0.1)",
                    }}
                  >
                    <Icon as={FiShoppingCart} fontSize="md" color="#ef4444" />
                  </Box>
                  <VStack align="start" gap={0} flex={1}>
                    <HStack gap={2} w="full">
                      <Text
                        fontSize="sm"
                        fontWeight="600"
                        color={{ base: "#ffffff", _light: "#1a1d29" }}
                      >
                        {sale.product?.name || "Product"}
                      </Text>
                      {sale.customer_name && (
                        <Badge
                          colorPalette="blue"
                          variant="subtle"
                          fontSize="2xs"
                        >
                          {sale.customer_name}
                        </Badge>
                      )}
                    </HStack>
                    <HStack gap={2}>
                      <Text
                        fontSize="xs"
                        color={{ base: "#9ca3af", _light: "#6b7280" }}
                      >
                        {formatDate(sale.sale_date)}
                      </Text>
                      <Text
                        fontSize="xs"
                        color={{ base: "#9ca3af", _light: "#6b7280" }}
                      >
                        Qty: {sale.quantity}
                      </Text>
                    </HStack>
                  </VStack>
                </HStack>
                <VStack align="end" gap={0}>
                  <Text
                    fontSize="sm"
                    fontWeight="700"
                    color={{ base: "#10b981", _light: "#059669" }}
                  >
                    {formatCurrency(sale.total_amount)}
                  </Text>
                  <Text
                    fontSize="xs"
                    color={{ base: "#9ca3af", _light: "#6b7280" }}
                  >
                    {sale.payment_method?.name || "Payment"}
                  </Text>
                </VStack>
              </HStack>
            </Box>
          ))
        ) : (
          <Box
            p={6}
            textAlign="center"
            borderRadius="md"
            bg={{ base: "rgba(255, 255, 255, 0.05)", _light: "#f9fafb" }}
            border="1px solid"
            borderColor={{
              base: "rgba(255, 255, 255, 0.08)",
              _light: "#e5e7eb",
            }}
          >
            <Icon
              as={FiShoppingCart}
              fontSize="2xl"
              color={{ base: "#6b7280", _light: "#9ca3af" }}
              mb={2}
            />
            <Text fontSize="sm" color={{ base: "#9ca3af", _light: "#6b7280" }}>
              No recent activity
            </Text>
            <Text
              fontSize="xs"
              color={{ base: "#6b7280", _light: "#9ca3af" }}
              mt={1}
            >
              Sales will appear here once transactions are made
            </Text>
          </Box>
        )}
      </VStack>
    </Box>
  )
}
