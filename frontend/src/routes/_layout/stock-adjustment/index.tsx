import {
  Badge,
  Box,
  Container,
  Flex,
  Grid,
  Heading,
  HStack,
  Input,
  Separator,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import {
  FiChevronLeft,
  FiChevronRight,
  FiEdit,
  FiPackage,
  FiSearch,
} from "react-icons/fi"
import type { ProductPublic, ProductUpdate } from "../../../client"
import { ProductsService } from "../../../client"
import { Button } from "../../../components/ui/button"
import {
  DrawerBackdrop,
  DrawerBody,
  DrawerCloseTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerRoot,
  DrawerTitle,
} from "../../../components/ui/drawer"
import { Field } from "../../../components/ui/field"
import useCustomToast from "../../../hooks/useCustomToast"
import { handleError } from "../../../utils"

export const Route = createFileRoute("/_layout/stock-adjustment/")({
  component: StockAdjustment,
})

// Theme-aware Select Component
function ThemedSelect({
  value,
  onChange,
  children,
  ...props
}: {
  value: string | number
  onChange: (value: string) => void
  children: React.ReactNode
  [key: string]: any
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        padding: "8px",
        borderRadius: "6px",
        borderWidth: "1px",
        borderStyle: "solid",
        backgroundColor: "var(--chakra-colors-input-bg)",
        borderColor: "var(--chakra-colors-input-border)",
        color: "var(--chakra-colors-text-primary)",
        fontSize: "14px",
        cursor: "pointer",
        ...props.style,
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "var(--chakra-colors-teal-500)"
        e.currentTarget.style.boxShadow =
          "0 0 0 1px var(--chakra-colors-teal-500)"
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "var(--chakra-colors-input-border)"
        e.currentTarget.style.boxShadow = "none"
      }}
      {...props}
    >
      {children}
    </select>
  )
}

// Helper functions
function getStockColor(product: ProductPublic): string {
  if (product.current_stock === 0) return "red"
  if (
    product.reorder_level &&
    product.current_stock !== undefined &&
    product.current_stock <= product.reorder_level
  ) {
    return "orange"
  }
  return "green"
}

function getStockStatus(product: ProductPublic): string {
  if (product.current_stock === 0) return "Out of Stock"
  if (
    product.reorder_level &&
    product.current_stock !== undefined &&
    product.current_stock <= product.reorder_level
  ) {
    return "Low Stock"
  }
  return "In Stock"
}

// Stock Adjustment Form Component
function StockAdjustmentForm({
  selectedProduct,
  onClose,
}: {
  selectedProduct: ProductPublic | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()

  const [currentStock, setCurrentStock] = useState(0)
  const [reorderLevel, setReorderLevel] = useState(0)
  const [_notes, setNotes] = useState("")

  // Update form when product changes
  useEffect(() => {
    if (selectedProduct) {
      setCurrentStock(selectedProduct.current_stock || 0)
      setReorderLevel(selectedProduct.reorder_level || 0)
      setNotes("")
    }
  }, [selectedProduct])

  const mutation = useMutation({
    mutationFn: (data: ProductUpdate) =>
      ProductsService.updateProduct({
        id: selectedProduct!.id,
        requestBody: data,
      }),
    onSuccess: () => {
      showSuccessToast("Stock levels updated successfully.")
      queryClient.invalidateQueries({ queryKey: ["products"] })
      onClose()
    },
    onError: (err: any) => {
      handleError(err)
    },
  })

  const handleSubmit = () => {
    if (!selectedProduct) return

    const updateData: ProductUpdate = {
      current_stock: currentStock,
      reorder_level: reorderLevel,
    }

    mutation.mutate(updateData)
  }

  if (!selectedProduct) {
    return (
      <Box
        textAlign="center"
        py={12}
        color={{ base: "gray.500", _light: "gray.600" }}
      >
        <FiPackage size={48} style={{ margin: "0 auto 16px" }} />
        <Text fontSize="lg">No product selected</Text>
      </Box>
    )
  }

  const hasChanges =
    currentStock !== (selectedProduct.current_stock || 0) ||
    reorderLevel !== (selectedProduct.reorder_level || 0)

  return (
    <VStack gap={6} align="stretch">
      {/* Product Info */}
      <Box>
        <Text fontSize="md" fontWeight="semibold" mb={3}>
          Product Details
        </Text>
        <VStack
          align="stretch"
          gap={2}
          p={4}
          borderWidth="1px"
          borderRadius="md"
          bg={{ base: "gray.900", _light: "gray.50" }}
          borderColor={{ base: "gray.700", _light: "gray.200" }}
        >
          <HStack justify="space-between">
            <Text
              fontSize="sm"
              color={{ base: "gray.400", _light: "gray.600" }}
            >
              Product
            </Text>
            <Text fontWeight="semibold">{selectedProduct.name}</Text>
          </HStack>
          <HStack justify="space-between">
            <Text
              fontSize="sm"
              color={{ base: "gray.400", _light: "gray.600" }}
            >
              Category
            </Text>
            <Badge colorScheme="blue" size="sm">
              {selectedProduct.category.name}
            </Badge>
          </HStack>
          <HStack justify="space-between">
            <Text
              fontSize="sm"
              color={{ base: "gray.400", _light: "gray.600" }}
            >
              Status
            </Text>
            <Badge colorScheme="purple" size="sm">
              {selectedProduct.status.name}
            </Badge>
          </HStack>
          <HStack justify="space-between">
            <Text
              fontSize="sm"
              color={{ base: "gray.400", _light: "gray.600" }}
            >
              Selling Price
            </Text>
            <Text fontWeight="bold" color="teal.400">
              KES {parseFloat(selectedProduct.selling_price).toLocaleString()}
            </Text>
          </HStack>
        </VStack>
      </Box>

      <Separator />

      {/* Stock Adjustment Form */}
      <Box>
        <Text fontSize="md" fontWeight="semibold" mb={3}>
          Adjust Stock Levels
        </Text>
        <VStack gap={4} align="stretch">
          <Field
            label="Current Stock"
            helperText="Available units in inventory"
          >
            <Input
              type="number"
              value={currentStock}
              onChange={(e) => setCurrentStock(Number(e.target.value))}
              min={0}
              placeholder="Enter current stock"
            />
          </Field>

          <Field
            label="Reorder Level"
            helperText="Minimum stock before reordering"
          >
            <Input
              type="number"
              value={reorderLevel}
              onChange={(e) => setReorderLevel(Number(e.target.value))}
              min={0}
              placeholder="Enter reorder level"
            />
          </Field>

          {/* Stock Status Preview */}
          <Box
            p={4}
            bg={{ base: "gray.900", _light: "gray.50" }}
            borderRadius="md"
            borderWidth="1px"
            borderColor={{ base: "gray.700", _light: "gray.200" }}
          >
            <Text
              fontSize="xs"
              color={{ base: "gray.400", _light: "gray.600" }}
              mb={2}
            >
              Stock Status Preview
            </Text>
            <HStack justify="space-between">
              <Text fontSize="sm">Status:</Text>
              <Badge
                colorScheme={
                  currentStock === 0
                    ? "red"
                    : currentStock <= reorderLevel
                      ? "orange"
                      : "green"
                }
              >
                {currentStock === 0
                  ? "Out of Stock"
                  : currentStock <= reorderLevel
                    ? "Low Stock"
                    : "In Stock"}
              </Badge>
            </HStack>
            {reorderLevel > 0 &&
              currentStock <= reorderLevel &&
              currentStock > 0 && (
                <Text fontSize="xs" color="orange.400" mt={2}>
                  ⚠️ Stock is at or below reorder level
                </Text>
              )}
          </Box>

          {/* Change Summary */}
          {hasChanges && (
            <Box
              p={3}
              borderRadius="md"
              bg={{ base: "blue.900/20", _light: "blue.50" }}
              borderWidth="1px"
              borderColor={{ base: "blue.700", _light: "blue.200" }}
            >
              <Text
                fontWeight="semibold"
                fontSize="sm"
                color={{ base: "blue.300", _light: "blue.700" }}
                mb={2}
              >
                Changes Summary
              </Text>
              {currentStock !== (selectedProduct.current_stock || 0) && (
                <Text
                  fontSize="xs"
                  color={{ base: "gray.400", _light: "gray.600" }}
                >
                  Current Stock: {selectedProduct.current_stock || 0} →{" "}
                  {currentStock}(
                  {currentStock - (selectedProduct.current_stock || 0) > 0
                    ? "+"
                    : ""}
                  {currentStock - (selectedProduct.current_stock || 0)} units)
                </Text>
              )}
              {reorderLevel !== (selectedProduct.reorder_level || 0) && (
                <Text
                  fontSize="xs"
                  color={{ base: "gray.400", _light: "gray.600" }}
                >
                  Reorder Level: {selectedProduct.reorder_level || 0} →{" "}
                  {reorderLevel}
                </Text>
              )}
            </Box>
          )}

          {/* Submit Button */}
          <Button
            colorScheme="teal"
            size="lg"
            onClick={handleSubmit}
            loading={mutation.isPending}
            disabled={!hasChanges || currentStock < 0 || reorderLevel < 0}
            w="full"
          >
            Update Stock Levels
          </Button>
        </VStack>
      </Box>
    </VStack>
  )
}

// Main Component
function StockAdjustment() {
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<ProductPublic | null>(
    null,
  )
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(25)
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch categories and statuses
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => ProductsService.readCategories(),
  })

  const { data: statuses } = useQuery({
    queryKey: ["statuses"],
    queryFn: () => ProductsService.readStatuses(),
  })

  // Fetch products with server-side filtering and pagination
  const { data: productsData, isLoading } = useQuery({
    queryKey: [
      "products",
      page,
      pageSize,
      debouncedSearchQuery,
      selectedCategory,
      selectedStatus,
    ],
    queryFn: () => {
      const params: any = {
        skip: (page - 1) * pageSize,
        limit: pageSize,
      }

      if (debouncedSearchQuery.trim()) {
        params.name = debouncedSearchQuery.trim()
      }

      if (selectedCategory) {
        params.category_id = selectedCategory
      }

      if (selectedStatus) {
        params.status_id = selectedStatus
      }

      return ProductsService.readProducts(params)
    },
  })

  const products = productsData?.data || []
  const totalProducts = productsData?.count || 0
  const totalPages = Math.ceil(totalProducts / pageSize)

  const handleProductSelect = (product: ProductPublic) => {
    setSelectedProduct(product)
    setDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setDrawerOpen(false)
    setTimeout(() => setSelectedProduct(null), 300)
  }

  const handleClearFilters = () => {
    setSearchQuery("")
    setDebouncedSearchQuery("")
    setSelectedCategory("")
    setSelectedStatus("")
    setPage(1)
  }

  // Reset to first page when filters change
  useEffect(() => {
    setPage(1)
  }, [])

  const hasFilters = searchQuery || selectedCategory || selectedStatus

  return (
    <Container maxW="full" minH="100vh" py={8}>
      <VStack gap={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading
            size="lg"
            mb={2}
            color={{ base: "#e5e7eb", _light: "#111827" }}
          >
            Stock Adjustment
          </Heading>
          <Text color={{ base: "#d1d5db", _light: "#6b7280" }}>
            Adjust current stock levels and reorder points for your products.
            {totalProducts > 0 && ` Managing ${totalProducts} products total.`}
          </Text>
        </Box>

        {/* Filters */}
        <Grid templateColumns={{ base: "1fr", md: "2fr 1fr 1fr auto" }} gap={4}>
          <Field label="Search Products">
            <HStack>
              <Box position="relative" flex={1}>
                <Input
                  placeholder="Search by product name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  pl={10}
                />
                <Box
                  position="absolute"
                  left={3}
                  top="50%"
                  transform="translateY(-50%)"
                  color={{ base: "gray.500", _light: "gray.400" }}
                >
                  <FiSearch />
                </Box>
              </Box>
            </HStack>
          </Field>

          <Field label="Category">
            <ThemedSelect
              value={selectedCategory}
              onChange={setSelectedCategory}
            >
              <option value="">All Categories</option>
              {categories?.data.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </ThemedSelect>
          </Field>

          <Field label="Status">
            <ThemedSelect value={selectedStatus} onChange={setSelectedStatus}>
              <option value="">All Statuses</option>
              {statuses?.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </ThemedSelect>
          </Field>

          <Flex align="flex-end">
            <Button
              variant="outline"
              onClick={handleClearFilters}
              disabled={!hasFilters}
              w="full"
            >
              Clear Filters
            </Button>
          </Flex>
        </Grid>

        {/* Products Table */}
        <Box
          borderWidth="1px"
          borderRadius="md"
          overflow="hidden"
          bg={{ base: "gray.900", _light: "white" }}
        >
          <Box overflowX="auto">
            <Table.Root size="sm" variant="outline">
              <Table.Header>
                <Table.Row bg={{ base: "gray.800", _light: "gray.50" }}>
                  <Table.ColumnHeader>Product Name</Table.ColumnHeader>
                  <Table.ColumnHeader>Category</Table.ColumnHeader>
                  <Table.ColumnHeader>Status</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right">
                    Current Stock
                  </Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right">
                    Reorder Level
                  </Table.ColumnHeader>
                  <Table.ColumnHeader>Stock Status</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right">
                    Actions
                  </Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {isLoading ? (
                  <Table.Row>
                    <Table.Cell colSpan={7} textAlign="center" py={8}>
                      <Text color={{ base: "gray.500", _light: "gray.600" }}>
                        Loading products...
                      </Text>
                    </Table.Cell>
                  </Table.Row>
                ) : products.length === 0 ? (
                  <Table.Row>
                    <Table.Cell colSpan={7} textAlign="center" py={8}>
                      <VStack gap={2}>
                        <FiPackage
                          size={48}
                          color="var(--chakra-colors-gray-500)"
                        />
                        <Text color={{ base: "gray.500", _light: "gray.600" }}>
                          {hasFilters
                            ? "No products match your filters"
                            : "No products available"}
                        </Text>
                        {hasFilters && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleClearFilters}
                          >
                            Clear Filters
                          </Button>
                        )}
                      </VStack>
                    </Table.Cell>
                  </Table.Row>
                ) : (
                  products.map((product) => (
                    <Table.Row
                      key={product.id}
                      _hover={{ bg: { base: "gray.800", _light: "gray.50" } }}
                    >
                      <Table.Cell fontWeight="medium">
                        {product.name}
                      </Table.Cell>
                      <Table.Cell>
                        <Badge colorScheme="blue" size="sm">
                          {product.category.name}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge colorScheme="purple" size="sm">
                          {product.status.name}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell textAlign="right">
                        <Badge colorScheme={getStockColor(product)}>
                          {product.current_stock || 0}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell textAlign="right">
                        {product.reorder_level || 0}
                      </Table.Cell>
                      <Table.Cell>
                        <Badge colorScheme={getStockColor(product)} size="sm">
                          {getStockStatus(product)}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Flex justify="flex-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            colorScheme="teal"
                            onClick={() => handleProductSelect(product)}
                          >
                            <FiEdit /> Adjust
                          </Button>
                        </Flex>
                      </Table.Cell>
                    </Table.Row>
                  ))
                )}
              </Table.Body>
            </Table.Root>
          </Box>

          {/* Pagination */}
          {!isLoading && products.length > 0 && (
            <Flex
              justify="space-between"
              align="center"
              p={4}
              borderTopWidth="1px"
              borderColor={{ base: "gray.700", _light: "gray.200" }}
            >
              <Text
                fontSize="sm"
                color={{ base: "gray.400", _light: "gray.600" }}
              >
                Showing {(page - 1) * pageSize + 1} to{" "}
                {Math.min(page * pageSize, totalProducts)} of {totalProducts}{" "}
                products
              </Text>
              <HStack gap={2}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <FiChevronLeft /> Previous
                </Button>
                <Text
                  fontSize="sm"
                  color={{ base: "gray.400", _light: "gray.600" }}
                >
                  Page {page} of {totalPages}
                </Text>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next <FiChevronRight />
                </Button>
              </HStack>
            </Flex>
          )}
        </Box>
      </VStack>

      {/* Adjustment Drawer */}
      <DrawerRoot
        open={drawerOpen}
        onOpenChange={(e) => !e.open && handleCloseDrawer()}
        size="md"
        placement="end"
      >
        <DrawerBackdrop />
        <DrawerContent>
          <DrawerHeader borderBottomWidth="1px">
            <DrawerTitle>Adjust Stock Levels</DrawerTitle>
            <DrawerCloseTrigger />
          </DrawerHeader>
          <DrawerBody>
            <StockAdjustmentForm
              selectedProduct={selectedProduct}
              onClose={handleCloseDrawer}
            />
          </DrawerBody>
        </DrawerContent>
      </DrawerRoot>
    </Container>
  )
}
