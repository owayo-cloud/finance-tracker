import {
  Box,
  Flex,
  HStack,
  IconButton,
  Input,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react"
import { FiMinus, FiPlus } from "react-icons/fi"
import type { ProductPublic } from "@/client"
import type { CartItem } from "./types"
import { formatCurrency } from "./utils"

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
              <Table.ColumnHeader color="text.primary">
                Product Name
              </Table.ColumnHeader>
              <Table.ColumnHeader color="text.primary">
                Avl Qty
              </Table.ColumnHeader>
              <Table.ColumnHeader color="text.primary">Qty</Table.ColumnHeader>
              <Table.ColumnHeader color="text.primary">
                Price
              </Table.ColumnHeader>
              <Table.ColumnHeader color="text.primary">
                Disc%
              </Table.ColumnHeader>
              <Table.ColumnHeader color="text.primary">
                Total
              </Table.ColumnHeader>
              <Table.ColumnHeader color="text.primary">-</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {cart.map((item) => {
              const price = Number(item.product.selling_price)
              const discountAmount =
                (price * item.quantity * (item.discount || 0)) / 100
              const total = price * item.quantity - discountAmount
              return (
                <Table.Row key={item.product.id}>
                  <Table.Cell
                    fontWeight="medium"
                    maxW="200px"
                    overflow="hidden"
                    textOverflow="ellipsis"
                    whiteSpace="nowrap"
                    color="text.primary"
                  >
                    {item.product.name}
                  </Table.Cell>
                  <Table.Cell textAlign="center" color="text.primary">
                    {item.product.current_stock || 0}
                  </Table.Cell>
                  <Table.Cell>
                    <HStack gap={1} justify="center">
                      <IconButton
                        size="xs"
                        onClick={() => onUpdateQuantity(item.product.id, -1)}
                        aria-label="Decrease"
                        variant="ghost"
                        color="text.primary"
                      >
                        <FiMinus />
                      </IconButton>
                      <Text
                        minW="40px"
                        textAlign="center"
                        fontWeight="medium"
                        color="text.primary"
                      >
                        {item.quantity}
                      </Text>
                      <IconButton
                        size="xs"
                        onClick={() => onUpdateQuantity(item.product.id, 1)}
                        aria-label="Increase"
                        variant="ghost"
                        color="text.primary"
                      >
                        <FiPlus />
                      </IconButton>
                    </HStack>
                  </Table.Cell>
                  <Table.Cell textAlign="center" color="text.primary">
                    Ksh {formatCurrency(price)}
                  </Table.Cell>
                  <Table.Cell>
                    <Input
                      type="number"
                      value={item.discount || 0}
                      onChange={(e) =>
                        onUpdateDiscount(
                          item.product.id,
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      size="sm"
                      w="80px"
                      min={0}
                      max={100}
                      step="0.001"
                      textAlign="center"
                      bg="input.bg"
                      borderColor="input.border"
                      color="text.primary"
                      _focus={{
                        borderColor: "input.focus.border",
                        boxShadow: "input.focus.shadow",
                      }}
                    />
                  </Table.Cell>
                  <Table.Cell
                    fontWeight="bold"
                    textAlign="center"
                    color="text.primary"
                  >
                    Ksh {formatCurrency(total)}
                  </Table.Cell>
                  <Table.Cell textAlign="center">
                    <Text
                      as="button"
                      color="button.danger"
                      fontSize="sm"
                      fontWeight="500"
                      onClick={() => onRemoveFromCart(item.product.id)}
                      _hover={{
                        textDecoration: "underline",
                        color: "button.danger.hover",
                      }}
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
                    if (
                      e.key === "Enter" &&
                      searchQuery &&
                      searchResults &&
                      searchResults.length > 0
                    ) {
                      onAddToCart(searchResults[0])
                      onSearchQueryChange("")
                    }
                  }}
                  bg="input.bg"
                  borderColor="input.border"
                  color="text.primary"
                  border="none"
                  _focus={{ border: "none", boxShadow: "none" }}
                  size="sm"
                />
              </Table.Cell>
              <Table.Cell />
              <Table.Cell />
              <Table.Cell />
              <Table.Cell textAlign="right" fontWeight="medium">
                0.000
              </Table.Cell>
              <Table.Cell />
              <Table.Cell textAlign="center">
                <IconButton
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (
                      searchQuery &&
                      searchResults &&
                      searchResults.length > 0
                    ) {
                      onAddToCart(searchResults[0])
                      onSearchQueryChange("")
                    }
                  }}
                  aria-label="Add product"
                  border="2px solid"
                  borderColor="brand.primary"
                  color="brand.primary"
                  borderRadius="md"
                  _hover={{
                    bg: "rgba(20, 184, 166, 0.1)",
                    borderColor: "brand.primary.hover",
                    color: "brand.primary.hover",
                  }}
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
            bg="bg.surface"
            border="1px solid"
            borderColor="border.default"
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
                  _hover={{
                    bg: {
                      base: "rgba(255, 255, 255, 0.05)",
                      _light: "#f3f4f6",
                    },
                  }}
                  onClick={() => {
                    onAddToCart(product)
                    onSearchQueryChange("")
                  }}
                >
                  <HStack justify="space-between">
                    <Text
                      fontSize="sm"
                      fontWeight="medium"
                      color="text.primary"
                    >
                      {product.name}
                    </Text>
                    <Text fontSize="sm" color="brand.primary" fontWeight="600">
                      Ksh {formatCurrency(Number(product.selling_price))}
                    </Text>
                  </HStack>
                  <Text fontSize="xs" color="text.muted">
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
        borderColor="border.card"
        bg="bg.surface"
      >
        <Flex
          justify="space-between"
          alignItems="center"
          gap={{ base: 4, md: 8 }}
          fontSize="sm"
          flexWrap="wrap"
        >
          <HStack gap={2}>
            <Text fontWeight="medium" color="text.primary">
              TOTAL QTY:
            </Text>
            <Text color="text.primary">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </Text>
          </HStack>
          <HStack gap={2}>
            <Text fontWeight="medium" color="text.primary">
              SUBTOTAL:
            </Text>
            <Text color="text.primary">{cartTotal.toFixed(3)}</Text>
          </HStack>
          <HStack gap={2}>
            <Text fontWeight="medium" color="text.primary">
              VAT:
            </Text>
            <Text color="text.primary">0.000</Text>
          </HStack>
          <HStack gap={2}>
            <Text fontWeight="medium" color="text.primary">
              TOTAL:
            </Text>
            <Text fontSize="lg" fontWeight="bold" color="text.primary">
              {cartTotal.toFixed(3)}
            </Text>
          </HStack>
        </Flex>
      </Box>
    </>
  )
}
