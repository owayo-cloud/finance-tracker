import {
  Container,
  Heading,
  Text,
  Table,
  VStack,
  Badge,
  Box,
  HStack,
  Input,
  Flex,
  Button,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { FiSearch, FiCalendar, FiFilter } from "react-icons/fi"
import { SalesService, type SalePublic } from "../../client"
import { useColorMode } from "@/components/ui/color-mode"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination.tsx"

function formatCurrency(amount: string | number): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const Route = createFileRoute("/_layout/sales-list")({
  component: SalesList,
})

function SalesList() {
  const { colorMode } = useColorMode()
  const [page, setPage] = useState(1)
  const [pageSize] = useState(25)
  const [searchQuery, setSearchQuery] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["sales", page, pageSize],
    queryFn: () => SalesService.readSales({
      skip: (page - 1) * pageSize,
      limit: pageSize,
    }),
  })

  const sales = data?.data || []
  const totalSales = data?.count || 0
  const totalPages = Math.ceil(totalSales / pageSize)

  // Calculate totals
  const totalAmount = sales.reduce((sum, sale) => {
    return sum + parseFloat(sale.total_amount)
  }, 0)

  const valueGradient = colorMode === "dark"
    ? "linear-gradient(to right, #60a5fa, #3b82f6)"
    : "linear-gradient(to right, #2563eb, #3b82f6)"

  return (
    <Container maxW="full" minH="100vh" py={8}>
      <VStack gap={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="start" flexWrap="wrap" gap={4}>
          <Box>
            <Heading 
              size="lg" 
              mb={2}
              color={{ base: "#e5e7eb", _light: "#111827" }}
            >
              Sales History
            </Heading>
            <Text color={{ base: "#d1d5db", _light: "#6b7280" }}>
              View and manage all sales transactions
            </Text>
          </Box>
          <HStack gap={3}>
            <Box
              p={4}
              bg={{ base: "rgba(15, 20, 30, 0.7)", _light: "rgba(255, 255, 255, 0.8)" }}
              backdropFilter="blur(20px)"
              borderRadius="xl"
              border="1px solid"
              borderColor={{ base: "rgba(59, 130, 246, 0.2)", _light: "rgba(59, 130, 246, 0.3)" }}
            >
              <Text fontSize="xs" color={{ base: "#9ca3af", _light: "#6b7280" }} mb={1}>
                Total Sales
              </Text>
              <Text 
                fontSize="2xl" 
                fontWeight="bold"
                css={{
                  background: valueGradient,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                KES {formatCurrency(totalAmount)}
              </Text>
            </Box>
          </HStack>
        </Flex>

        {/* Search and Filters */}
        <Box
          p={4}
          bg={{ base: "rgba(15, 20, 30, 0.7)", _light: "rgba(255, 255, 255, 0.8)" }}
          backdropFilter="blur(20px)"
          borderRadius="xl"
          border="1px solid"
          borderColor={{ base: "rgba(59, 130, 246, 0.2)", _light: "rgba(59, 130, 246, 0.3)" }}
        >
          <HStack gap={3}>
            <Box position="relative" flex={1}>
              <Input
                placeholder="Search sales..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                bg={{ base: "rgba(10, 14, 20, 0.6)", _light: "rgba(255, 255, 255, 0.6)" }}
                borderColor={{ base: "rgba(59, 130, 246, 0.2)", _light: "rgba(59, 130, 246, 0.3)" }}
                color={{ base: "#e5e7eb", _light: "#111827" }}
                _focus={{
                  borderColor: "rgba(59, 130, 246, 0.5)",
                  boxShadow: "0 0 0 1px rgba(59, 130, 246, 0.3)",
                }}
              />
              <Box
                position="absolute"
                right={3}
                top="50%"
                transform="translateY(-50%)"
                pointerEvents="none"
              >
                <FiSearch color={colorMode === "dark" ? "#9ca3af" : "#6b7280"} />
              </Box>
            </Box>
            <Button
              variant="outline"
              colorScheme="blue"
              leftIcon={<FiCalendar />}
            >
              Filter
            </Button>
          </HStack>
        </Box>

        {/* Sales Table */}
        <Box
          bg={{ base: "rgba(15, 20, 30, 0.7)", _light: "rgba(255, 255, 255, 0.8)" }}
          backdropFilter="blur(20px)"
          borderRadius="xl"
          border="1px solid"
          borderColor={{ base: "rgba(59, 130, 246, 0.2)", _light: "rgba(59, 130, 246, 0.3)" }}
          overflow="hidden"
        >
          {isLoading ? (
            <Box p={8} textAlign="center">
              <Text color={{ base: "#d1d5db", _light: "#6b7280" }}>Loading sales...</Text>
            </Box>
          ) : sales.length === 0 ? (
            <Box p={8} textAlign="center">
              <Text color={{ base: "#d1d5db", _light: "#6b7280" }} fontSize="lg" mb={2}>
                No sales found
              </Text>
              <Text color={{ base: "#9ca3af", _light: "#9ca3af" }} fontSize="sm">
                Sales transactions will appear here
              </Text>
            </Box>
          ) : (
            <>
              <Table.Root size="sm" variant="outline">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader color={{ base: "#9ca3af", _light: "#6b7280" }}>
                      Date & Time
                    </Table.ColumnHeader>
                    <Table.ColumnHeader color={{ base: "#9ca3af", _light: "#6b7280" }}>
                      Product
                    </Table.ColumnHeader>
                    <Table.ColumnHeader color={{ base: "#9ca3af", _light: "#6b7280" }}>
                      Quantity
                    </Table.ColumnHeader>
                    <Table.ColumnHeader color={{ base: "#9ca3af", _light: "#6b7280" }}>
                      Unit Price
                    </Table.ColumnHeader>
                    <Table.ColumnHeader color={{ base: "#9ca3af", _light: "#6b7280" }}>
                      Total Amount
                    </Table.ColumnHeader>
                    <Table.ColumnHeader color={{ base: "#9ca3af", _light: "#6b7280" }}>
                      Payment Method
                    </Table.ColumnHeader>
                    <Table.ColumnHeader color={{ base: "#9ca3af", _light: "#6b7280" }}>
                      Status
                    </Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {sales.map((sale: SalePublic) => (
                    <Table.Row key={sale.id}>
                      <Table.Cell color={{ base: "#d1d5db", _light: "#374151" }}>
                        {formatDate(sale.sale_date)}
                      </Table.Cell>
                      <Table.Cell color={{ base: "#e5e7eb", _light: "#111827" }} fontWeight="medium">
                        {sale.product.name}
                      </Table.Cell>
                      <Table.Cell color={{ base: "#d1d5db", _light: "#374151" }}>
                        {sale.quantity}
                      </Table.Cell>
                      <Table.Cell color={{ base: "#d1d5db", _light: "#374151" }}>
                        KES {formatCurrency(sale.unit_price)}
                      </Table.Cell>
                      <Table.Cell 
                        fontWeight="bold"
                        css={{
                          background: valueGradient,
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                          color: "transparent",
                        }}
                      >
                        KES {formatCurrency(sale.total_amount)}
                      </Table.Cell>
                      <Table.Cell>
                        <Badge
                          colorScheme="blue"
                          variant="subtle"
                        >
                          {sale.payment_method.name}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        {sale.voided ? (
                          <Badge colorScheme="red" variant="subtle">
                            Voided
                          </Badge>
                        ) : (
                          <Badge colorScheme="green" variant="subtle">
                            Completed
                          </Badge>
                        )}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>

              {/* Pagination */}
              {totalPages > 1 && (
                <Box p={4} borderTop="1px solid" borderColor={{ base: "rgba(59, 130, 246, 0.2)", _light: "rgba(59, 130, 246, 0.3)" }}>
                  <PaginationRoot
                    count={totalSales}
                    pageSize={pageSize}
                    page={page}
                    onPageChange={(details) => setPage(details.page)}
                  >
                    <HStack justify="space-between" w="full">
                      <Text fontSize="sm" color={{ base: "#9ca3af", _light: "#6b7280" }}>
                        Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalSales)} of {totalSales} sales
                      </Text>
                      <HStack gap={2}>
                        <PaginationPrevTrigger />
                        <PaginationItems />
                        <PaginationNextTrigger />
                      </HStack>
                    </HStack>
                  </PaginationRoot>
                </Box>
              )}
            </>
          )}
        </Box>
      </VStack>
    </Container>
  )
}

