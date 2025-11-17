import { createFileRoute, redirect } from "@tanstack/react-router"
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Input,
  Stack,
  Text,
  Grid,
  Card,
  Badge,
  IconButton,
  VStack,
  HStack,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, useMemo } from "react"
import { FiPlus, FiMinus, FiTrash2, FiShoppingCart, FiSearch } from "react-icons/fi"

import { ProductsService, SalesService, UsersService, type ProductPublic } from "../../client"
import useCustomToast from "../../hooks/useCustomToast"


function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export const Route = createFileRoute("/_layout/sales")({
  component: Sales,
  beforeLoad: async () => {
    // Only cashiers can access the sales dashboard
    try {
      const user = await UsersService.readUserMe()
      
      // If user is an admin (superuser), redirect to admin dashboard
      if (user.is_superuser) {
        throw redirect({
          to: "/",
        })
      }
    } catch (error) {
      throw error
    }
  },
})


function ThemedSelect({
  value,
  onChange,
  children,
  ...props
}: {
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
  [key: string]: any
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={(e) => {
        e.target.style.borderColor = "var(--chakra-colors-border-focused)"
        e.target.style.boxShadow = "0 0 0 1px var(--chakra-colors-border-focused)"
      }}
      onBlur={(e) => {
        e.target.style.borderColor = "var(--chakra-colors-input-border)"
        e.target.style.boxShadow = "none"
      }}
      style={{
        width: "100%",
        padding: "0.5rem 0.75rem",
        borderRadius: "0.375rem",
        border: "1px solid",
        backgroundColor: "var(--chakra-colors-input-bg)",
        borderColor: "var(--chakra-colors-input-border)",
        color: "var(--chakra-colors-text-primary)",
        fontSize: "1rem",
        outline: "none",
        cursor: "pointer",
      }}
      {...props}
    >
      {children}
    </select>
  )
}

// Cart item interface
interface CartItem {
  product: ProductPublic
  quantity: number
}

function Sales() {
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  
  // State management
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("")

  // Fetch product categories for filtering
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => ProductsService.readCategories(),
  })

  // Fetch payment methods
  const { data: paymentMethods } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: () => SalesService.readPaymentMethods({}),
  })

  // Fetch today's sales summary
  const { data: todaySummary } = useQuery({
    queryKey: ["today-summary"],
    queryFn: () => SalesService.getTodaySalesSummary(),
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  // Search products mutation
  const searchProducts = useQuery({
    queryKey: ["search-products", searchQuery, selectedCategoryId],
    queryFn: () =>
      SalesService.searchProductsForSale({
        q: searchQuery || "a", // Default search to show some products
        categoryId: selectedCategoryId || undefined,
        limit: 50,
      }),
    // Always enabled - when "All" is selected, show all products
    enabled: true,
  })

  // Create sale mutation
  const createSale = useMutation({
    mutationFn: (data: {
      productId: string
      quantity: number
      unitPrice: number
      totalAmount: number
      paymentMethodId: string
    }) =>
      SalesService.createSale({
        requestBody: {
          product_id: data.productId,
          quantity: data.quantity,
          unit_price: data.unitPrice,
          total_amount: data.totalAmount,
          payment_method_id: data.paymentMethodId,
        },
      }),
    onSuccess: () => {
      // Don't show toast or invalidate yet - wait for all items
    },
    onError: (error: any) => {
      const detail = error.body?.detail || "Failed to create sale"
      showToast.showErrorToast(detail)
      throw error // Re-throw to stop batch processing
    },
  })

  // Cart management functions
  const addToCart = (product: ProductPublic) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product.id === product.id)
      if (existingItem) {
        // Check stock availability
        if (existingItem.quantity + 1 > (product.current_stock || 0)) {
          showToast.showErrorToast("Insufficient stock")
          return prevCart
        }
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prevCart, { product, quantity: 1 }]
    })
  }

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId))
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const newQuantity = item.quantity + delta
            // Check stock availability
            if (newQuantity > (item.product.current_stock || 0)) {
              showToast.showErrorToast("Insufficient stock")
              return item
            }
            return { ...item, quantity: newQuantity }
          }
          return item
        })
        .filter((item) => item.quantity > 0)
    )
  }

  // Calculate cart totals
  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => {
      return total + Number(item.product.selling_price) * item.quantity
    }, 0)
  }, [cart])

  const cartItemsCount = useMemo(() => {
    return cart.reduce((count, item) => count + item.quantity, 0)
  }, [cart])

  // Complete sale
  const completeSale = async () => {
    if (cart.length === 0) {
      showToast.showErrorToast("Cart is empty")
      return
    }

    if (!selectedPaymentMethod) {
      showToast.showErrorToast("Please select a payment method")
      return
    }

    try {
      // Process each cart item as a separate sale
      for (const item of cart) {
        // Validate stock availability before processing
        const currentProduct = await ProductsService.readProduct({ id: item.product.id })
        
        if (!currentProduct.current_stock || currentProduct.current_stock < item.quantity) {
          showToast.showErrorToast(
            `Insufficient stock for ${item.product.name}. Available: ${currentProduct.current_stock || 0}`
          )
          return
        }

        const unitPrice = Number(item.product.selling_price)
        const totalAmount = unitPrice * item.quantity

        await createSale.mutateAsync({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: unitPrice,
          totalAmount: totalAmount,
          paymentMethodId: selectedPaymentMethod,
        })
      }

      // All sales successful
      showToast.showSuccessToast(`${cart.length} sale(s) completed successfully`)
      queryClient.invalidateQueries({ queryKey: ["today-summary"] })
      queryClient.invalidateQueries({ queryKey: ["search-products"] })

      // Clear cart after successful sale
      setCart([])
      setSelectedPaymentMethod("")
      setSearchQuery("")
    } catch (error) {
      // Error already handled in mutation
      console.error("Sale completion error:", error)
    }
  }

  return (
    <Container maxW="full" p={0} h="calc(100vh - 60px)">
      {/* POS-Style Two-Panel Layout */}
      <Grid 
        templateColumns={{ base: "1fr", lg: "1fr 400px" }} 
        h="full"
        gap={0}
      >
        {/* LEFT PANEL - Product Search & Discovery */}
        <Flex 
          direction="column" 
          h="full" 
          borderRight="1px solid"
          borderColor="var(--chakra-colors-input-border)"
          bg="var(--chakra-colors-bg-canvas)"
        >
          {/* Sticky Search Header */}
          <Box
            position="sticky"
            top={0}
            zIndex={10}
            bg="var(--chakra-colors-bg-surface)"
            borderBottom="1px solid"
            borderColor="var(--chakra-colors-input-border)"
            p={4}
          >
            <Heading size="lg" mb={4}>Product Search</Heading>
            
            {/* Search and Filter */}
            <Stack gap={3}>
              <Box position="relative">
                <Input
                  placeholder="Search products by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  bg="var(--chakra-colors-input-bg)"
                  borderColor="var(--chakra-colors-input-border)"
                  color="var(--chakra-colors-text-primary)"
                  size="lg"
                  _focus={{
                    borderColor: "var(--chakra-colors-border-focused)",
                    boxShadow: "0 0 0 1px var(--chakra-colors-border-focused)",
                  }}
                />
                <Box
                  position="absolute"
                  right={3}
                  top="50%"
                  transform="translateY(-50%)"
                  pointerEvents="none"
                >
                  <FiSearch size={20} />
                </Box>
              </Box>

              {/* Category Filter Tabs */}
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2}>
                  Filter by Category
                </Text>
                <Flex gap={2} flexWrap="wrap">
                  <Button
                    size="sm"
                    variant={selectedCategoryId === "" ? "solid" : "outline"}
                    colorScheme={selectedCategoryId === "" ? "blue" : "gray"}
                    onClick={() => setSelectedCategoryId("")}
                  >
                    All
                  </Button>
                  {categories?.data?.map((category: { id: string; name: string }) => (
                    <Button
                      key={category.id}
                      size="sm"
                      variant={selectedCategoryId === category.id ? "solid" : "outline"}
                      colorScheme={selectedCategoryId === category.id ? "blue" : "gray"}
                      onClick={() => setSelectedCategoryId(category.id)}
                    >
                      {category.name}
                    </Button>
                  ))}
                </Flex>
              </Box>
            </Stack>
          </Box>

          {/* Scrollable Product Grid */}
          <Box flex={1} overflowY="auto" p={4}>
            {searchProducts.isLoading ? (
              <Grid templateColumns="repeat(auto-fill, minmax(160px, 1fr))" gap={3}>
                {[...Array(8)].map((_, i) => (
                  <Box key={i} h="200px" bg="var(--chakra-colors-bg-surface)" borderRadius="lg" />
                ))}
              </Grid>
            ) : searchProducts.data && searchProducts.data.length > 0 ? (
              <Grid templateColumns="repeat(auto-fill, minmax(160px, 1fr))" gap={3}>
                {searchProducts.data.map((product) => (
                  <Card.Root
                    key={product.id}
                    cursor="pointer"
                    onClick={() => addToCart(product)}
                    borderWidth={1}
                    borderColor="var(--chakra-colors-input-border)"
                    transition="all 0.2s"
                    _hover={{
                      borderColor: "var(--chakra-colors-border-focused)",
                      boxShadow: "lg",
                      transform: "translateY(-2px)",
                    }}
                    _active={{
                      transform: "scale(0.98)",
                    }}
                  >
                    <Card.Body p={3}>
                      <VStack align="stretch" gap={2}>
                        <Badge colorScheme="purple" alignSelf="flex-start" fontSize="xs">
                          {product.category?.name}
                        </Badge>
                        <Text fontWeight="bold" fontSize="sm" lineClamp={2} minH="40px">
                          {product.name}
                        </Text>
                        <Flex justify="space-between" align="center" mt={2}>
                          <Text fontSize="xl" fontWeight="bold" color="green.500">
                            Ksh {formatCurrency(Number(product.selling_price))}
                          </Text>
                        </Flex>
                        <Text fontSize="xs" color="gray.500">
                          Stock: {product.current_stock}
                        </Text>
                        <Button size="sm" colorScheme="blue" w="full">
                          Add
                        </Button>
                      </VStack>
                    </Card.Body>
                  </Card.Root>
                ))}
              </Grid>
            ) : (
              <Flex direction="column" align="center" justify="center" h="full" gap={4}>
                <Text fontSize="lg" color="gray.500">No products found</Text>
                <Text fontSize="sm" color="gray.400">
                  {searchQuery || selectedCategoryId 
                    ? "Try a different search or category" 
                    : "No products available"}
                </Text>
              </Flex>
            )}
          </Box>
        </Flex>

        {/* RIGHT PANEL - Checkout Cart */}
        <Flex 
          direction="column" 
          h="full"
          bg="var(--chakra-colors-bg-surface)"
        >
          {/* Cart Header */}
          <Box
            borderBottom="1px solid"
            borderColor="var(--chakra-colors-input-border)"
            p={4}
          >
            <Flex justify="space-between" align="center">
              <Heading size="md">
                <HStack>
                  <FiShoppingCart />
                  <Text>Cart ({cartItemsCount})</Text>
                </HStack>
              </Heading>
              {cart.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  colorScheme="red"
                  onClick={() => setCart([])}
                >
                  Clear All
                </Button>
              )}
            </Flex>
          </Box>

          {/* Scrollable Cart Items */}
          <Box flex={1} overflowY="auto" p={4}>
            {cart.length === 0 ? (
              <Flex direction="column" align="center" justify="center" h="full" gap={4}>
                <FiShoppingCart size={48} color="var(--chakra-colors-gray-400)" />
                <Text fontSize="lg" color="gray.500" textAlign="center">
                  Cart is empty
                </Text>
                <Text fontSize="sm" color="gray.400" textAlign="center">
                  Search and click products to add
                </Text>
              </Flex>
            ) : (
              <Stack gap={3}>
                {cart.map((item) => (
                  <Box
                    key={item.product.id}
                    p={3}
                    borderWidth={1}
                    borderRadius="md"
                    borderColor="var(--chakra-colors-input-border)"
                    bg="var(--chakra-colors-bg-canvas)"
                  >
                    <Flex justify="space-between" align="start" mb={2}>
                      <VStack align="start" flex={1} gap={1}>
                        <Text fontWeight="bold" fontSize="sm" lineClamp={2}>
                          {item.product.name}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          Ksh {formatCurrency(Number(item.product.selling_price))} each
                        </Text>
                      </VStack>
                      <IconButton
                        size="xs"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => removeFromCart(item.product.id)}
                        aria-label="Remove from cart"
                      >
                        <FiTrash2 />
                      </IconButton>
                    </Flex>
                    
                    <Flex justify="space-between" align="center">
                      <HStack gap={2}>
                        <IconButton
                          size="sm"
                          onClick={() => updateQuantity(item.product.id, -1)}
                          aria-label="Decrease quantity"
                          variant="outline"
                        >
                          <FiMinus />
                        </IconButton>
                        <Text fontWeight="bold" minW="40px" textAlign="center" fontSize="lg">
                          {item.quantity}
                        </Text>
                        <IconButton
                          size="sm"
                          onClick={() => updateQuantity(item.product.id, 1)}
                          aria-label="Increase quantity"
                          variant="outline"
                        >
                          <FiPlus />
                        </IconButton>
                      </HStack>
                      <Text fontWeight="bold" fontSize="lg" color="green.500">
                        Ksh {formatCurrency(Number(item.product.selling_price) * item.quantity)}
                      </Text>
                    </Flex>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>

          {/* Fixed Bottom Section - Totals + Sell Button */}
          <Box
            borderTop="2px solid"
            borderColor="var(--chakra-colors-input-border)"
            p={4}
            bg="var(--chakra-colors-bg-surface)"
          >
            <Stack gap={3}>
              {/* Payment Method Selection */}
              {cart.length > 0 && (
                <Box>
                  <Text fontWeight="bold" mb={2} fontSize="sm">
                    Payment Method *
                  </Text>
                  <ThemedSelect
                    value={selectedPaymentMethod}
                    onChange={setSelectedPaymentMethod}
                  >
                    <option value="">Select payment method...</option>
                    {paymentMethods?.data?.map((method) => (
                      <option key={method.id} value={method.id}>
                        {method.name}
                      </option>
                    ))}
                  </ThemedSelect>
                </Box>
              )}

              {/* Total */}
              <Flex justify="space-between" align="center" py={2}>
                <Text fontSize="lg" fontWeight="bold">
                  Total
                </Text>
                <Text fontSize="3xl" fontWeight="bold" color="green.500">
                  Ksh {formatCurrency(cartTotal)}
                </Text>
              </Flex>

              {/* Big SELL Button */}
              <Button
                size="lg"
                h="60px"
                fontSize="xl"
                fontWeight="bold"
                colorScheme="green"
                onClick={completeSale}
                disabled={cart.length === 0 || !selectedPaymentMethod || createSale.isPending}
                loading={createSale.isPending}
                w="full"
              >
                {createSale.isPending ? "Processing..." : "SELL"}
              </Button>

              {/* Today's Summary (Collapsible) */}
              {todaySummary && (todaySummary as any).total_sales > 0 && (
                <Box
                  mt={2}
                  p={3}
                  borderRadius="md"
                  bg="var(--chakra-colors-bg-canvas)"
                  borderWidth={1}
                  borderColor="var(--chakra-colors-input-border)"
                >
                  <Text fontSize="xs" fontWeight="bold" mb={2} color="gray.500">
                    TODAY'S SUMMARY
                  </Text>
                  <Flex justify="space-between" fontSize="sm">
                    <Text>Sales</Text>
                    <Text fontWeight="bold">Ksh {formatCurrency(Number((todaySummary as any).total_amount) || 0)}</Text>
                  </Flex>
                  <Flex justify="space-between" fontSize="sm" color="gray.500">
                    <Text>{(todaySummary as any).total_sales} transactions</Text>
                    <Text>{(todaySummary as any).total_items} items</Text>
                  </Flex>
                </Box>
              )}
            </Stack>
          </Box>
        </Flex>
      </Grid>
    </Container>
  )
}
