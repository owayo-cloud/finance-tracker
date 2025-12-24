import {
  Box,
  Button,
  Flex,
  Grid,
  HStack,
  Icon,
  IconButton,
  Input,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react"
import {
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiPlay,
  FiPlus,
} from "react-icons/fi"
import useAuth from "@/hooks/useAuth"
import { ThemedSelect } from "./ThemedSelect"
import type { SuspendedSale } from "./types"
import { formatCurrency } from "./utils"

interface CustomerPanelProps {
  activeTab: "customer" | "suspended"
  onTabChange: (tab: "customer" | "suspended") => void
  customerName: string
  customerTel: string
  customerBalance: number
  remarks: string
  customerPin: string
  onCustomerNameChange: (value: string) => void
  onCustomerTelChange: (value: string) => void
  onCustomerBalanceChange: (value: number) => void
  onRemarksChange: (value: string) => void
  onCustomerPinChange: (value: string) => void
  onSelectCustomer: () => void
  onNewCustomer: () => void
  onClearCustomer: () => void
  suspendedSales: SuspendedSale[]
  selectedSaleId: string | null
  onSelectSale: (saleId: string) => void
  onResumeSale: (saleId: string) => void
  onViewReceipt?: () => void
  selectedReceiptId?: string | null
  onPreviewReceipt?: () => void
}

export function CustomerPanel({
  activeTab,
  onTabChange,
  customerName,
  customerTel,
  customerBalance,
  remarks,
  customerPin,
  onCustomerNameChange,
  onCustomerTelChange,
  onCustomerBalanceChange,
  onRemarksChange,
  onCustomerPinChange,
  onSelectCustomer,
  onNewCustomer,
  onClearCustomer,
  suspendedSales,
  selectedSaleId,
  onSelectSale,
  onResumeSale,
  onViewReceipt,
  selectedReceiptId,
  onPreviewReceipt,
}: CustomerPanelProps) {
  const { user: currentUser } = useAuth()
  const isAdmin = currentUser?.is_superuser || false

  return (
    <Box
      w={{ base: "100%", lg: "400px" }}
      flexShrink={0}
      bg="bg.canvas"
      borderLeft={{ base: "none", lg: "1px solid" }}
      borderTop={{ base: "1px solid", lg: "none" }}
      borderColor="border.card"
      display="flex"
      flexDirection="column"
      overflow="hidden"
    >
      {/* Tabs */}
      <Flex borderBottom="1px solid" borderColor="border.card">
        <Button
          onClick={() => onTabChange("customer")}
          flex={1}
          borderRadius={0}
          bg={activeTab === "customer" ? "brand.primary" : "transparent"}
          color={activeTab === "customer" ? "white" : "text.muted"}
          fontWeight="medium"
          size="sm"
          py={3}
          _hover={{
            bg:
              activeTab === "customer"
                ? "brand.primary.hover"
                : { base: "rgba(255, 255, 255, 0.05)", _light: "#f3f4f6" },
          }}
        >
          Attach Customer
        </Button>
        <Button
          onClick={() => onTabChange("suspended")}
          flex={1}
          borderRadius={0}
          bg={activeTab === "suspended" ? "brand.primary" : "transparent"}
          color={activeTab === "suspended" ? "white" : "text.muted"}
          fontWeight="medium"
          size="sm"
          py={3}
          _hover={{
            bg:
              activeTab === "suspended"
                ? "brand.primary.hover"
                : { base: "rgba(255, 255, 255, 0.05)", _light: "#f3f4f6" },
          }}
        >
          Suspended
        </Button>
      </Flex>

      {/* Tab Content */}
      {activeTab === "customer" ? (
        <Box
          p={{ base: 3, md: 4 }}
          flex={1}
          display="flex"
          flexDirection="column"
          overflowY="auto"
          minH={0}
        >
          {/* Customer Action Buttons */}
          <Grid
            templateColumns={isAdmin ? "repeat(3, 1fr)" : "repeat(2, 1fr)"}
            gap={2}
            mb={4}
          >
            <Button
              bg="brand.secondary"
              color="white"
              size="sm"
              _hover={{ bg: "brand.secondary.hover" }}
              fontWeight="600"
              fontSize="xs"
              whiteSpace="nowrap"
              overflow="hidden"
              textOverflow="ellipsis"
              onClick={onSelectCustomer}
            >
              Select Customer
            </Button>
            {isAdmin && (
              <Button
                bg="brand.secondary"
                color="white"
                size="sm"
                _hover={{ bg: "brand.secondary.hover" }}
                fontWeight="600"
                fontSize="xs"
                whiteSpace="nowrap"
                overflow="hidden"
                textOverflow="ellipsis"
                display="flex"
                alignItems="center"
                justifyContent="center"
                minW={0}
                onClick={onNewCustomer}
              >
                <Icon as={FiPlus} mr={1} fontSize="xs" flexShrink={0} />
                <Text
                  as="span"
                  overflow="hidden"
                  textOverflow="ellipsis"
                  whiteSpace="nowrap"
                >
                  New Customer
                </Text>
              </Button>
            )}
            <Button
              bg="brand.secondary"
              color="white"
              size="sm"
              onClick={onClearCustomer}
              _hover={{ bg: "brand.secondary.hover" }}
              fontWeight="600"
              fontSize="xs"
              whiteSpace="nowrap"
              overflow="hidden"
              textOverflow="ellipsis"
            >
              Clear Customer
            </Button>
          </Grid>

          {/* Customer Details */}
          <Stack gap={3} mb={4}>
            <Box>
              <Text fontSize="sm" mb={1} fontWeight="500" color="text.primary">
                Name:
              </Text>
              <Input
                value={customerName}
                onChange={(e) => onCustomerNameChange(e.target.value)}
                placeholder=""
                bg="transparent"
                border="none"
                borderBottom="1px solid"
                borderColor="border.default"
                borderRadius={0}
                color="text.primary"
                px={1}
                _focus={{ borderBottomColor: "#22d3ee", boxShadow: "none" }}
              />
            </Box>
            <Box>
              <Text fontSize="sm" mb={1} fontWeight="500" color="text.primary">
                Tel:
              </Text>
              <Input
                value={customerTel}
                onChange={(e) => onCustomerTelChange(e.target.value)}
                placeholder=""
                bg="transparent"
                border="none"
                borderBottom="1px solid"
                borderColor="border.default"
                borderRadius={0}
                color="text.primary"
                px={1}
                _focus={{ borderBottomColor: "#22d3ee", boxShadow: "none" }}
              />
            </Box>
            <Box>
              <Text fontSize="sm" mb={1} fontWeight="500" color="text.primary">
                Balance:
              </Text>
              <Input
                type="number"
                value={customerBalance || ""}
                onChange={(e) =>
                  onCustomerBalanceChange(parseFloat(e.target.value) || 0)
                }
                placeholder=""
                bg="transparent"
                border="none"
                borderBottom="1px solid"
                borderColor="border.default"
                borderRadius={0}
                color="text.primary"
                px={1}
                _focus={{ borderBottomColor: "#22d3ee", boxShadow: "none" }}
              />
            </Box>
          </Stack>

          {/* Remarks and Customer PIN */}
          <Stack gap={3} mb={4}>
            <Box>
              <Text fontSize="sm" mb={1} fontWeight="500" color="text.primary">
                REMARKS/CUSTOMER NAME:
              </Text>
              <Input
                value={remarks}
                onChange={(e) => onRemarksChange(e.target.value)}
                placeholder=""
                bg="transparent"
                border="none"
                borderBottom="1px solid"
                borderColor="border.default"
                borderRadius={0}
                color="text.primary"
                px={1}
                _focus={{ borderBottomColor: "#22d3ee", boxShadow: "none" }}
              />
            </Box>
            <Box>
              <Text fontSize="sm" mb={1} fontWeight="500" color="text.primary">
                CUSTOMER PIN:
              </Text>
              <Input
                type="password"
                value={customerPin}
                onChange={(e) => onCustomerPinChange(e.target.value)}
                placeholder=""
                bg="transparent"
                border="none"
                borderBottom="1px solid"
                borderColor="border.default"
                borderRadius={0}
                color="text.primary"
                px={1}
                _focus={{ borderBottomColor: "#22d3ee", boxShadow: "none" }}
              />
            </Box>
          </Stack>

          {/* View Receipt Section */}
          <HStack gap={3} alignItems="center" flexWrap="wrap">
            <Text
              as="button"
              fontSize="0.875rem"
              color="brand.primary"
              cursor="pointer"
              onClick={onViewReceipt}
              _hover={{
                textDecoration: "underline",
                color: "brand.primary.hover",
              }}
            >
              View Receipt
            </Text>
            <Input
              value={selectedReceiptId ? selectedReceiptId.slice(-6) : "0"}
              readOnly
              w="60px"
              textAlign="center"
              size="sm"
              bg="input.bg"
              borderColor="input.border"
              color="text.primary"
              borderRadius="md"
            />
            <Button
              bg="brand.primary"
              color="white"
              size="sm"
              _hover={{ bg: "brand.primary.hover" }}
              fontWeight="600"
              onClick={onPreviewReceipt}
              disabled={!selectedReceiptId}
            >
              <Icon as={FiEye} mr={2} />
              Preview Receipt
            </Button>
          </HStack>
        </Box>
      ) : (
        /* Suspended Sales Tab */
        <Box
          flex={1}
          display="flex"
          flexDirection="column"
          overflow="hidden"
          minH={0}
        >
          {/* Suspended Sales Table */}
          <Box flex={1} overflowY="auto" minH={0}>
            <Table.Root size="sm">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Cashier</Table.ColumnHeader>
                  <Table.ColumnHeader>Items</Table.ColumnHeader>
                  <Table.ColumnHeader>Total</Table.ColumnHeader>
                  <Table.ColumnHeader>Name</Table.ColumnHeader>
                  <Table.ColumnHeader>Rct No</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {suspendedSales.length === 0 ? (
                  <Table.Row>
                    <Table.Cell colSpan={5} textAlign="center" py={8}>
                      <Text color="text.muted">No records found.</Text>
                    </Table.Cell>
                  </Table.Row>
                ) : (
                  suspendedSales.map((sale) => {
                    const total = sale.cart.reduce((sum, item) => {
                      const price = Number(item.product.selling_price)
                      const discountType = item.discountType || "percentage"
                      const discountAmount =
                        discountType === "fixed" && item.fixedDiscount
                          ? item.fixedDiscount
                          : (price * item.quantity * (item.discount || 0)) / 100
                      return sum + (price * item.quantity - discountAmount)
                    }, 0)
                    const itemsCount = sale.cart.reduce(
                      (sum, item) => sum + item.quantity,
                      0,
                    )
                    const isSelected = selectedSaleId === sale.id
                    return (
                      <Table.Row
                        key={sale.id}
                        cursor="pointer"
                        bg={
                          isSelected
                            ? {
                                base: "rgba(20, 184, 166, 0.2)",
                                _light: "rgba(20, 184, 166, 0.1)",
                              }
                            : "transparent"
                        }
                        _hover={{
                          bg: isSelected
                            ? {
                                base: "rgba(20, 184, 166, 0.25)",
                                _light: "rgba(20, 184, 166, 0.15)",
                              }
                            : {
                                base: "rgba(255, 255, 255, 0.05)",
                                _light: "#f9fafb",
                              },
                        }}
                        onClick={() => {
                          onSelectSale(sale.id)
                        }}
                      >
                        <Table.Cell>-</Table.Cell>
                        <Table.Cell>{itemsCount}</Table.Cell>
                        <Table.Cell fontWeight="medium">
                          Ksh {formatCurrency(total)}
                        </Table.Cell>
                        <Table.Cell>{sale.customer?.name || "-"}</Table.Cell>
                        <Table.Cell>{sale.id.slice(-6)}</Table.Cell>
                      </Table.Row>
                    )
                  })
                )}
              </Table.Body>
            </Table.Root>
          </Box>

          {/* Resume Sale Button */}
          {selectedSaleId && (
            <Box
              p={{ base: 3, md: 4 }}
              borderTop="1px solid"
              borderColor="border.card"
              bg={{
                base: "rgba(20, 184, 166, 0.1)",
                _light: "rgba(20, 184, 166, 0.05)",
              }}
            >
              <Button
                w="full"
                bg="brand.primary"
                color="white"
                _hover={{ bg: "brand.primary.hover" }}
                onClick={() => {
                  onResumeSale(selectedSaleId)
                  onTabChange("customer")
                }}
              >
                <Icon as={FiPlay} mr={2} />
                Resume Selected Sale
              </Button>
            </Box>
          )}

          {/* Pagination */}
          <Box
            p={{ base: 3, md: 4 }}
            borderTop="1px solid"
            borderColor="border.card"
          >
            <Flex
              justify="space-between"
              alignItems="center"
              mb={4}
              flexWrap="wrap"
              gap={2}
            >
              <Text fontSize="sm" color="text.muted">
                Showing {suspendedSales.length > 0 ? "0" : "0"} -{" "}
                {suspendedSales.length > 0 ? "0" : "0"} out of{" "}
                {suspendedSales.length}
              </Text>
              <HStack gap={2} flexWrap="wrap">
                <IconButton
                  size="sm"
                  variant="ghost"
                  aria-label="First page"
                  disabled
                >
                  <Icon as={FiChevronLeft} />
                </IconButton>
                <IconButton
                  size="sm"
                  variant="ghost"
                  aria-label="Previous page"
                  disabled
                >
                  <Icon as={FiChevronLeft} />
                </IconButton>
                <IconButton
                  size="sm"
                  variant="ghost"
                  aria-label="Next page"
                  disabled
                >
                  <Icon as={FiChevronRight} />
                </IconButton>
                <IconButton
                  size="sm"
                  variant="ghost"
                  aria-label="Last page"
                  disabled
                >
                  <Icon as={FiChevronRight} />
                </IconButton>
                <Box w="70px">
                  <ThemedSelect
                    value="10"
                    onChange={() => {}}
                    aria-label="Items per page"
                    title="Items per page"
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                  </ThemedSelect>
                </Box>
              </HStack>
            </Flex>

            {/* Remarks and PIN in Suspended Tab */}
            <Stack gap={3}>
              <Box>
                <Text
                  fontSize="sm"
                  mb={1}
                  fontWeight="500"
                  color="text.primary"
                >
                  REMARKS/CUSTOMER NAME:
                </Text>
                <Input
                  value={remarks}
                  onChange={(e) => onRemarksChange(e.target.value)}
                  placeholder=""
                  bg="transparent"
                  border="none"
                  borderBottom="1px solid"
                  borderColor="border.default"
                  borderRadius={0}
                  color="text.primary"
                  px={1}
                  _focus={{ borderBottomColor: "#22d3ee", boxShadow: "none" }}
                />
              </Box>
              <Box>
                <Text
                  fontSize="sm"
                  mb={1}
                  fontWeight="500"
                  color="text.primary"
                >
                  CUSTOMER PIN:
                </Text>
                <Input
                  type="password"
                  value={customerPin}
                  onChange={(e) => onCustomerPinChange(e.target.value)}
                  placeholder=""
                  bg="transparent"
                  border="none"
                  borderBottom="1px solid"
                  borderColor="border.default"
                  borderRadius={0}
                  color="text.primary"
                  px={1}
                  _focus={{ borderBottomColor: "#22d3ee", boxShadow: "none" }}
                />
              </Box>
            </Stack>
          </Box>
        </Box>
      )}
    </Box>
  )
}
