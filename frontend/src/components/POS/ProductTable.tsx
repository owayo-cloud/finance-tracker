import { Box, Input, Stack, Text, IconButton, HStack, Table, Flex } from "@chakra-ui/react"
import { FiPlus, FiMinus } from "react-icons/fi"
import { CartItem } from "./types"
import { formatCurrency } from "./utils"
import { ProductPublic } from "@/client"

interface ProductTableProps {
  cart: CartItem[]
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  onAddToCart: (product: ProductPublic) => void
  onRemoveFromCart: (productId: string) => void
  onUpdateQuantity: (productId: string, delta: number) => void
  onUpdateDiscount: (productId: string, discount: number) => void
  searchResults?: ProductPublic[]
  cartTotal: number
}

export function ProductTable({
  cart,
  searchQuery,
  onSearchQueryChange,
  onAddToCart,
  onRemoveFromCart,
  onUpdateQuantity,
  onUpdateDiscount,
  searchResults,
  cartTotal,
}: ProductTableProps) {
  return (
    <>
      <Box flex={1} overflowY="auto" minH={0}>
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader color={{ base: "#ffffff", _light: "#1a1d29" }}>Product Name</Table.ColumnHeader>
              <Table.ColumnHeader color={{ base: "#ffffff", _light: "#1a1d29" }}>Avl Qty</Table.ColumnHeader>
              <Table.ColumnHeader color={{ base: "#ffffff", _light: "#1a1d29" }}>Qty</Table.ColumnHeader>
              <Table.ColumnHeader color={{ base: "#ffffff", _light: "#1a1d29" }}>Price</Table.ColumnHeader>
              <Table.ColumnHeader color={{ base: "#ffffff", _light: "#1a1d29" }}>Disc%</Table.ColumnHeader>
              <Table.ColumnHeader color={{ base: "#ffffff", _light: "#1a1d29" }}>Total</Table.ColumnHeader>
              <Table.ColumnHeader color={{ base: "#ffffff", _light: "#1a1d29" }}>-</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {cart.map((item) => {
              const price = Number(item.product.selling_price)
              const discountAmount = (price * item.quantity * (item.discount || 0)) / 100
              const total = price * item.quantity - discountAmount
              return (
                <Table.Row key={item.product.id}>
                  <Table.Cell fontWeight="medium" maxW="200px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" color={{ base: "#ffffff", _light: "#1a1d29" }}>
                    {item.product.name}
                  </Table.Cell>
                  <Table.Cell textAlign="center" color={{ base: "#ffffff", _light: "#1a1d29" }}>{item.product.current_stock || 0}</Table.Cell>
                  <Table.Cell>
                    <HStack gap={1} justify="center">
                      <IconButton
                        size="xs"
                        onClick={() => onUpdateQuantity(item.product.id, -1)}
                        aria-label="Decrease"
                        variant="ghost"
                        color={{ base: "#ffffff", _light: "#1a1d29" }}
                      >
                        <FiMinus />
                      </IconButton>
                      <Text minW="40px" textAlign="center" fontWeight="medium" color={{ base: "#ffffff", _light: "#1a1d29" }}>
                        {item.quantity}
                      </Text>
                      <IconButton
                        size="xs"
                        onClick={() => onUpdateQuantity(item.product.id, 1)}
                        aria-label="Increase"
                        variant="ghost"
                        color={{ base: "#ffffff", _light: "#1a1d29" }}
                      >
                        <FiPlus />
                      </IconButton>
                    </HStack>
                  </Table.Cell>
                  <Table.Cell textAlign="center" color={{ base: "#ffffff", _light: "#1a1d29" }}>Ksh {formatCurrency(price)}</Table.Cell>
                  <Table.Cell>
                    <Input
                      type="number"
                      value={item.discount || 0}
                      onChange={(e) => onUpdateDiscount(item.product.id, parseFloat(e.target.value) || 0)}
                      size="sm"
                      w="80px"
                      min={0}
                      max={100}
                      step="0.001"
                      textAlign="center"
                      bg={{ base: "#1a1d29", _light: "#ffffff" }}
                      borderColor={{ base: "rgba(255, 255, 255, 0.1)", _light: "#e5e7eb" }}
                      color={{ base: "#ffffff", _light: "#1a1d29" }}
                      _focus={{ borderColor: "#14b8a6", boxShadow: "0 0 0 1px #14b8a6" }}
                    />
                  </Table.Cell>
                  <Table.Cell fontWeight="bold" textAlign="center" color={{ base: "#ffffff", _light: "#1a1d29" }}>
                    Ksh {formatCurrency(total)}
                  </Table.Cell>
                  <Table.Cell textAlign="center">
                    <Text
                      as="button"
                      color="#ef4444"
                      fontSize="sm"
                      fontWeight="500"
                      onClick={() => onRemoveFromCart(item.product.id)}
                      _hover={{ textDecoration: "underline", color: "#dc2626" }}
                    >
                      Remove
                    </Text>
                  </Table.Cell>
                </Table.Row>
              )
            })}

            {/* Empty row for new product entry */}
            <Table.Row>
              <Table.Cell>
                <Input
                  placeholder=":"
                  value={searchQuery}
                  onChange={(e) => onSearchQueryChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchQuery && searchResults && searchResults.length > 0) {
                      onAddToCart(searchResults[0])
                      onSearchQueryChange("")
                    }
                  }}
                  bg={{ base: "#1a1d29", _light: "#ffffff" }}
                  borderColor={{ base: "rgba(255, 255, 255, 0.1)", _light: "#e5e7eb" }}
                  color={{ base: "#ffffff", _light: "#1a1d29" }}
                  border="none"
                  _focus={{ border: "none", boxShadow: "none" }}
                  size="sm"
                />
              </Table.Cell>
              <Table.Cell></Table.Cell>
              <Table.Cell></Table.Cell>
              <Table.Cell></Table.Cell>
              <Table.Cell textAlign="right" fontWeight="medium">
                0.000
              </Table.Cell>
              <Table.Cell></Table.Cell>
              <Table.Cell textAlign="center">
                <IconButton
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (searchQuery && searchResults && searchResults.length > 0) {
                      onAddToCart(searchResults[0])
                      onSearchQueryChange("")
                    }
                  }}
                  aria-label="Add product"
                  border="2px solid"
                  borderColor="#14b8a6"
                  color="#14b8a6"
                  borderRadius="md"
                  _hover={{ bg: "rgba(20, 184, 166, 0.1)", borderColor: "#0d9488", color: "#0d9488" }}
                >
                  <FiPlus />
                </IconButton>
              </Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table.Root>

        {/* Product Search Results Dropdown */}
        {searchQuery && searchResults && searchResults.length > 0 && (
          <Box
            mt={2}
            mx={{ base: 2, md: 4 }}
            p={3}
            borderRadius="md"
            bg={{ base: "#1a1d29", _light: "#ffffff" }}
            border="1px solid"
            borderColor={{ base: "rgba(255, 255, 255, 0.1)", _light: "#e5e7eb" }}
            boxShadow="lg"
            maxH="300px"
            overflowY="auto"
          >
            <Stack gap={1}>
              {searchResults.slice(0, 10).map((product) => (
                <Box
                  key={product.id}
                  p={2}
                  borderRadius="sm"
                  cursor="pointer"
                  _hover={{ bg: { base: "rgba(255, 255, 255, 0.05)", _light: "#f3f4f6" } }}
                  onClick={() => {
                    onAddToCart(product)
                    onSearchQueryChange("")
                  }}
                >
                  <HStack justify="space-between">
                    <Text fontSize="sm" fontWeight="medium" color={{ base: "#ffffff", _light: "#1a1d29" }}>
                      {product.name}
                    </Text>
                    <Text fontSize="sm" color="#14b8a6" fontWeight="600">
                      Ksh {formatCurrency(Number(product.selling_price))}
                    </Text>
                  </HStack>
                  <Text fontSize="xs" color={{ base: "#9ca3af", _light: "#6b7280" }}>
                    Stock: {product.current_stock || 0}
                  </Text>
                </Box>
              ))}
            </Stack>
          </Box>
        )}
      </Box>

      {/* Totals Section */}
      <Box
        p={{ base: 3, md: 4 }}
        borderTop="1px solid"
        borderColor={{ base: "rgba(255, 255, 255, 0.08)", _light: "#e5e7eb" }}
        bg={{ base: "rgba(255, 255, 255, 0.02)", _light: "#f9fafb" }}
      >
        <Flex justify="space-between" alignItems="center" gap={{ base: 4, md: 8 }} fontSize="sm" flexWrap="wrap">
          <HStack gap={2}>
            <Text fontWeight="medium" color={{ base: "#ffffff", _light: "#1a1d29" }}>TOTAL QTY:</Text>
            <Text color={{ base: "#ffffff", _light: "#1a1d29" }}>{cart.reduce((sum, item) => sum + item.quantity, 0)}</Text>
          </HStack>
          <HStack gap={2}>
            <Text fontWeight="medium" color={{ base: "#ffffff", _light: "#1a1d29" }}>SUBTOTAL:</Text>
            <Text color={{ base: "#ffffff", _light: "#1a1d29" }}>{cartTotal.toFixed(3)}</Text>
          </HStack>
          <HStack gap={2}>
            <Text fontWeight="medium" color={{ base: "#ffffff", _light: "#1a1d29" }}>VAT:</Text>
            <Text color={{ base: "#ffffff", _light: "#1a1d29" }}>0.000</Text>
          </HStack>
          <HStack gap={2}>
            <Text fontWeight="medium" color={{ base: "#ffffff", _light: "#1a1d29" }}>TOTAL:</Text>
            <Text fontSize="lg" fontWeight="bold" color={{ base: "#ffffff", _light: "#1a1d29" }}>
              {cartTotal.toFixed(3)}
            </Text>
          </HStack>
        </Flex>
      </Box>
    </>
  )
}

