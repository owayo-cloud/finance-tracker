import {
  Container,
  EmptyState,
  Flex,
  Heading,
  Table,
  VStack,
  Badge,
  Button,
  Text,
  Image,
  Input,
  Box,
  HStack,
  Stack,
} from "@chakra-ui/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { FiSearch, FiEye, FiEyeOff, FiX } from "react-icons/fi"
import { z } from "zod"
import { useState, useEffect } from "react"

import { ProductsService } from "@/client"
import AddProduct from "@/components/Products/AddProduct"
import ProductActionsMenu from "@/components/Products/ProductActionsMenu"
import PendingProducts from "@/components/Pending/PendingProducts"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
import { Field } from "@/components/ui/field"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination.tsx"
import {
  MenuRoot,
  MenuTrigger,
  MenuContent,
  MenuItem,
} from "@/components/ui/menu"

const productsSearchSchema = z.object({
  page: z.number().catch(1),
  search: z.string().catch(""),
  category: z.string().catch(""),
  status: z.string().catch(""),
  pageSize: z.number().catch(25),
})

const DEFAULT_PAGE_SIZE = 25

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
        ...props.style
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "var(--chakra-colors-teal-500)";
        e.currentTarget.style.boxShadow = "0 0 0 1px var(--chakra-colors-teal-500)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "var(--chakra-colors-input-border)";
        e.currentTarget.style.boxShadow = "none";
      }}
      {...props}
    >
      {children}
    </select>
  )
}

// Helper function to get status color scheme
function getStatusColorScheme(statusName: string): string {
  const name = statusName.toLowerCase()
  if (name.includes('active')) return 'green'
  if (name.includes('inactive') || name.includes('discontinued')) return 'red'
  if (name.includes('out of stock')) return 'red'
  if (name.includes('coming soon')) return 'blue'
  return 'gray'
}

// Helper function to get stock color scheme
function getStockColorScheme(currentStock: number, reorderLevel?: number): string {
  if (currentStock === 0) return 'red'
  if (reorderLevel && currentStock <= reorderLevel) return 'orange'
  return 'green'
}

// Status Badge Component with inline editing
function StatusBadge({ 
  product, 
  statuses, 
  onStatusChange 
}: { 
  product: any
  statuses: any[]
  onStatusChange: (productId: string, statusId: string) => void 
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  
  const currentStatus = statuses.find(s => s.id === product.status_id)
  const colorScheme = getStatusColorScheme(currentStatus?.name || '')
  
  const handleStatusSelect = async (newStatusId: string) => {
    if (newStatusId !== product.status_id) {
      setIsUpdating(true)
      try {
        await onStatusChange(product.id, newStatusId)
        // Small delay for visual feedback
        setTimeout(() => {
          setIsUpdating(false)
          setIsEditing(false)
        }, 500)
      } catch (error) {
        console.error('Failed to update status:', error)
        setIsUpdating(false)
        setIsEditing(false)
        // The error will be handled by the mutation's onError
      }
    } else {
      setIsEditing(false)
    }
  }
  
  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false)
    }
  }
  
  const handleBlur = () => {
    // Small delay to allow click events to fire first
    setTimeout(() => setIsEditing(false), 150)
  }
  
  if (isEditing) {
    return (
      <select
        value={product.status_id}
        onChange={(e) => handleStatusSelect(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        autoFocus
        disabled={isUpdating}
        style={{
          fontSize: "14px",
          minWidth: "130px",
          opacity: isUpdating ? 0.7 : 1,
          cursor: isUpdating ? "wait" : "pointer",
          backgroundColor: "var(--chakra-colors-input-bg)",
          borderColor: "var(--chakra-colors-input-border)",
          padding: "6px",
          borderRadius: "6px",
          borderWidth: "1px",
          borderStyle: "solid",
          color: "var(--chakra-colors-text-primary)",
        }}
      >
        {statuses.map((status) => (
          <option key={status.id} value={status.id}>
            {status.name}
          </option>
        ))}
      </select>
    )
  }
  
  return (
    <Badge
      colorScheme={isUpdating ? 'blue' : colorScheme}
      cursor="pointer"
      onClick={() => setIsEditing(true)}
      _hover={{ 
        opacity: 0.8,
        transform: 'scale(1.02)',
        boxShadow: 'md'
      }}
      transition="all 0.2s ease"
      size="sm"
      px={3}
      py={1}
      borderRadius="md"
      title="Click to change status"
      position="relative"
      overflow="hidden"
    >
      {isUpdating && (
        <Text
          as="span"
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg={{ base: "rgba(0,0,0,0.2)", _light: "rgba(255,255,255,0.8)" }}
          fontSize="xs"
          color={{ base: "white", _light: "gray.800" }}
        >
          ⏳
        </Text>
      )}
      {currentStatus?.name || 'Unknown'}
    </Badge>
  )
}

function getProductsQueryOptions({ 
  page, 
  pageSize, 
  search, 
  category, 
  status 
}: { 
  page: number
  pageSize: number
  search: string
  category: string
  status: string
}) {
  const params: any = {
    skip: (page - 1) * pageSize,
    limit: pageSize,
  }
  
  // Add search by name only
  if (search.trim()) {
    params.name = search.trim()
  }
  
  // Add category filter
  if (category) {
    params.categoryId = category
  }
  
  // Add status filter
  if (status) {
    params.statusId = status
  }
  
  return {
    queryKey: ["products", { page, pageSize, search, category, status }],
    queryFn: () => ProductsService.readProducts(params),
  }
}

export const Route = createFileRoute("/_layout/products")({
  component: Products,
  validateSearch: (search) => productsSearchSchema.parse(search),
})

function ProductsTable() {
  const navigate = useNavigate({ from: "/products" })
  const { page, search, category, status, pageSize } = Route.useSearch()
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()

  // Local search state with debouncing
  const [searchQuery, setSearchQuery] = useState(search)
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(search)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Update URL when debounced search changes
  useEffect(() => {
    if (debouncedSearchQuery !== search) {
      navigate({
        to: "/products" as any,
        search: (prev: any) => ({ 
          ...prev, 
          search: debouncedSearchQuery,
          page: 1, // Reset to first page when search changes
        }),
      })
    }
  }, [debouncedSearchQuery, search, navigate])

  // Reset to first page when filters change
  useEffect(() => {
    navigate({
      to: "/products" as any,
      search: (prev: any) => ({ ...prev, page: 1 }),
    })
  }, [category, status])

  // Column visibility state - hide Stock, BP, SP, Description, Image by default
  const [visibleColumns, setVisibleColumns] = useState({
    image: false,
    name: true,
    description: false,
    category: true,
    buyingPrice: false,
    sellingPrice: false,
    currentStock: false,
    reorderLevel: true,
    status: true,
    actions: true,
  })

  // Fetch categories and statuses
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => ProductsService.readCategories(),
  })

  const { data: statusesData } = useQuery({
    queryKey: ["statuses"],
    queryFn: () => ProductsService.readStatuses(),
  })

  const statuses = statusesData || []

  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getProductsQueryOptions({ 
      page, 
      pageSize, 
      search: debouncedSearchQuery, 
      category, 
      status 
    }),
    placeholderData: (prevData) => prevData,
  })

  // Quick status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ productId, statusId }: { productId: string; statusId: string }) =>
      ProductsService.updateProduct({
        id: productId,
        requestBody: { status_id: statusId },
      }),
    onSuccess: () => {
      showSuccessToast("Status updated successfully! ✅")
      queryClient.invalidateQueries({ queryKey: ["products"] })
    },
    onError: (error: any) => {
      console.error('Update status error:', error)
      if (error?.status === 403 || error?.body?.detail?.includes('permission')) {
        handleError(error)
      } else if (error?.status === 404) {
        handleError(error)
      } else {
        handleError(error)
      }
    },
  })

  const handleStatusChange = async (productId: string, statusId: string) => {
    return updateStatusMutation.mutateAsync({ productId, statusId })
  }

  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns((prev) => ({ ...prev, [column]: !prev[column] }))
  }

  const setPage = (newPage: number) => {
    navigate({
      to: "/products" as any,
      search: (prev: any) => ({ ...prev, page: newPage }),
    })
  }

  const setPageSize = (newPageSize: number) => {
    navigate({
      to: "/products" as any,
      search: (prev: any) => ({ 
        ...prev, 
        pageSize: newPageSize,
        page: 1, // Reset to first page when changing page size
      }),
    })
  }

  const setCategory = (newCategory: string) => {
    navigate({
      to: "/products" as any,
      search: (prev: any) => ({ 
        ...prev, 
        category: newCategory,
        page: 1, // Reset to first page when changing category
      }),
    })
  }

  const setStatus = (newStatus: string) => {
    navigate({
      to: "/products" as any,
      search: (prev: any) => ({ 
        ...prev, 
        status: newStatus,
        page: 1, // Reset to first page when changing status
      }),
    })
  }

  const handleClearFilters = () => {
    setSearchQuery("")
    navigate({
      to: "/products" as any,
      search: () => ({ 
        page: 1, 
        search: "", 
        category: "", 
        status: "", 
        pageSize: pageSize || DEFAULT_PAGE_SIZE
      }),
    })
  }

  const products = data?.data || []
  const count = data?.count || 0
  const totalPages = Math.ceil(count / pageSize)

  const hasFilters = searchQuery || category || status

  if (isLoading) {
    return <PendingProducts />
  }

  if (products.length === 0) {
    return (
      <VStack gap={6} align="stretch">
        {/* Search and Filters */}
        <Box p={4} borderWidth="1px" borderRadius="lg">
          <VStack gap={4} align="stretch">
            <Stack direction={{ base: "column", md: "row" }} gap={4}>
              {/* Search */}
              <Box flex={1}>
                <Field label="Search Products">
                  <Box position="relative">
                    <Input
                      placeholder="Search by product name only..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      size="md"
                      pr={searchQuery && searchQuery !== debouncedSearchQuery ? "10" : "4"}
                    />
                    {searchQuery && searchQuery !== debouncedSearchQuery && (
                      <Box
                        position="absolute"
                        right="2"
                        top="50%"
                        transform="translateY(-50%)"
                      >
                        <Text fontSize="xs" color={{ base: "gray.500", _light: "gray.600" }}>
                          ⏳
                        </Text>
                      </Box>
                    )}
                  </Box>
                </Field>
              </Box>

              {/* Category Filter */}
              <Box minW={{ base: "full", md: "200px" }}>
                <Field label="Category">
                  <ThemedSelect
                    value={category}
                    onChange={setCategory}
                  >
                    <option value="">All Categories</option>
                    {categories?.data.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </ThemedSelect>
                </Field>
              </Box>

              {/* Status Filter */}
              <Box minW={{ base: "full", md: "200px" }}>
                <Field label="Status">
                  <ThemedSelect
                    value={status}
                    onChange={setStatus}
                  >
                    <option value="">All Statuses</option>
                    {statuses?.map((statusOption) => (
                      <option key={statusOption.id} value={statusOption.id}>
                        {statusOption.name}
                      </option>
                    ))}
                  </ThemedSelect>
                </Field>
              </Box>
            </Stack>

            <Flex justify="space-between" align="center">
              <HStack gap={2}>
                <Text fontSize="sm" color={{ base: "gray.500", _light: "gray.600" }}>
                  Showing {products.length} of {count} products
                  {totalPages > 1 && ` (Page ${page} of ${totalPages})`}
                </Text>
                
                {/* Active filters indicators */}
                {hasFilters && (
                  <HStack gap={1}>
                    {debouncedSearchQuery && (
                      <Badge colorScheme="teal" size="sm">
                        Name: "{debouncedSearchQuery}"
                      </Badge>
                    )}
                    {category && categories?.data && (
                      <Badge colorScheme="blue" size="sm">
                        {categories.data.find(c => c.id === category)?.name}
                      </Badge>
                    )}
                    {status && statuses && (
                      <Badge colorScheme="purple" size="sm">
                        {statuses.find(s => s.id === status)?.name}
                      </Badge>
                    )}
                  </HStack>
                )}
              </HStack>
              
              {hasFilters && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleClearFilters}
                >
                  <FiX /> Clear Filters
                </Button>
              )}
            </Flex>
          </VStack>
        </Box>

        <EmptyState.Root>
          <EmptyState.Content>
            <EmptyState.Indicator>
              <FiSearch />
            </EmptyState.Indicator>
            <VStack textAlign="center">
              <EmptyState.Title>
                {hasFilters ? "No products match your filters" : "You don't have any products yet"}
              </EmptyState.Title>
              <EmptyState.Description>
                {hasFilters
                  ? "Try adjusting your search or filters"
                  : "Start by adding your first product to the inventory."}
              </EmptyState.Description>
            </VStack>
          </EmptyState.Content>
        </EmptyState.Root>
      </VStack>
    )
  }

  return (
    <>
      {/* Search and Filters */}
      <Box p={4} borderWidth="1px" borderRadius="lg" mb={4}>
        <VStack gap={4} align="stretch">
          <Stack direction={{ base: "column", md: "row" }} gap={4}>
            {/* Search */}
            <Box flex={1}>
              <Field label="Search Products">
                <Box position="relative">
                  <Input
                    placeholder="Search by product name only..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    size="md"
                    pr={searchQuery && searchQuery !== debouncedSearchQuery ? "10" : "4"}
                  />
                  {searchQuery && searchQuery !== debouncedSearchQuery && (
                    <Box
                      position="absolute"
                      right="2"
                      top="50%"
                      transform="translateY(-50%)"
                    >
                      <Text fontSize="xs" color={{ base: "gray.500", _light: "gray.600" }}>
                        ⏳
                      </Text>
                    </Box>
                  )}
                </Box>
              </Field>
            </Box>

            {/* Category Filter */}
            <Box minW={{ base: "full", md: "200px" }}>
              <Field label="Category">
                <ThemedSelect
                  value={category}
                  onChange={setCategory}
                >
                  <option value="">All Categories</option>
                  {categories?.data.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </ThemedSelect>
              </Field>
            </Box>

            {/* Status Filter */}
            <Box minW={{ base: "full", md: "200px" }}>
              <Field label="Status">
                <ThemedSelect
                  value={status}
                  onChange={setStatus}
                >
                  <option value="">All Statuses</option>
                  {statuses?.map((statusOption) => (
                    <option key={statusOption.id} value={statusOption.id}>
                      {statusOption.name}
                    </option>
                  ))}
                </ThemedSelect>
              </Field>
            </Box>
          </Stack>

          <Flex justify="space-between" align="center">
            <HStack gap={2}>
              <Text fontSize="sm" color={{ base: "gray.500", _light: "gray.600" }}>
                Showing {products.length} of {count} products
                {totalPages > 1 && ` (Page ${page} of ${totalPages})`}
              </Text>
              
              {/* Active filters indicators */}
              {hasFilters && (
                <HStack gap={1}>
                  {debouncedSearchQuery && (
                    <Badge colorScheme="teal" size="sm">
                      Name: "{debouncedSearchQuery}"
                    </Badge>
                  )}
                  {category && categories?.data && (
                    <Badge colorScheme="blue" size="sm">
                      {categories.data.find(c => c.id === category)?.name}
                    </Badge>
                  )}
                  {status && statuses && (
                    <Badge colorScheme="purple" size="sm">
                      {statuses.find(s => s.id === status)?.name}
                    </Badge>
                  )}
                </HStack>
              )}
            </HStack>
            
            {hasFilters && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClearFilters}
              >
                <FiX /> Clear Filters
              </Button>
            )}
          </Flex>
        </VStack>
      </Box>

      {/* Column Visibility Menu */}
      <Flex justify="flex-end" mb={4}>
        <MenuRoot>
          <MenuTrigger asChild>
            <Button variant="outline" size="sm">
              <FiEye /> Columns
            </Button>
          </MenuTrigger>
          <MenuContent>
            <MenuItem value="name" onClick={() => toggleColumn("name")}>
              {visibleColumns.name ? <FiEye /> : <FiEyeOff />}
              Product
            </MenuItem>
            <MenuItem value="category" onClick={() => toggleColumn("category")}>
              {visibleColumns.category ? <FiEye /> : <FiEyeOff />}
              Category
            </MenuItem>
            <MenuItem value="buyingPrice" onClick={() => toggleColumn("buyingPrice")}>
              {visibleColumns.buyingPrice ? <FiEye /> : <FiEyeOff />}
              Buying Price
            </MenuItem>
            <MenuItem value="sellingPrice" onClick={() => toggleColumn("sellingPrice")}>
              {visibleColumns.sellingPrice ? <FiEye /> : <FiEyeOff />}
              Selling Price
            </MenuItem>
            <MenuItem value="currentStock" onClick={() => toggleColumn("currentStock")}>
              {visibleColumns.currentStock ? <FiEye /> : <FiEyeOff />}
              Current Stock
            </MenuItem>
            <MenuItem value="reorderLevel" onClick={() => toggleColumn("reorderLevel")}>
              {visibleColumns.reorderLevel ? <FiEye /> : <FiEyeOff />}
              Reorder Level
            </MenuItem>
            <MenuItem value="status" onClick={() => toggleColumn("status")}>
              {visibleColumns.status ? <FiEye /> : <FiEyeOff />}
              Status
            </MenuItem>
          </MenuContent>
        </MenuRoot>
      </Flex>

      <Table.Root size={{ base: "sm", md: "md" }} variant="outline">
        <Table.Header>
          <Table.Row>
            {/* {visibleColumns.image && <Table.ColumnHeader>Image</Table.ColumnHeader>} */}
            {visibleColumns.name && <Table.ColumnHeader>Product</Table.ColumnHeader>}
            {visibleColumns.category && <Table.ColumnHeader>Category</Table.ColumnHeader>}
            {visibleColumns.buyingPrice && <Table.ColumnHeader>Buying Price</Table.ColumnHeader>}
            {visibleColumns.sellingPrice && <Table.ColumnHeader>Selling Price</Table.ColumnHeader>}
            {visibleColumns.currentStock && <Table.ColumnHeader>Current Stock</Table.ColumnHeader>}
            {visibleColumns.reorderLevel && <Table.ColumnHeader>Reorder Level</Table.ColumnHeader>}
            {visibleColumns.status && <Table.ColumnHeader>Status</Table.ColumnHeader>}
            {visibleColumns.actions && <Table.ColumnHeader>Actions</Table.ColumnHeader>}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {products.map((product) => (
            <Table.Row 
              key={product.id} 
              opacity={isPlaceholderData ? 0.5 : 1}
            >
              {visibleColumns.image && (
                <Table.Cell>
                  {product.image?.file_name ? (
                    <Image
                      src={`/uploads/products/${product.image.file_name}`}
                      alt={product.name}
                      boxSize="40px"
                      objectFit="cover"
                      borderRadius="md"
                    />
                  ) : (
                    <Text fontSize="xs" color={{ base: "gray.500", _light: "gray.400" }}>
                      No image
                    </Text>
                  )}
                </Table.Cell>
              )}
              {visibleColumns.name && <Table.Cell fontWeight="medium">{product.name}</Table.Cell>}
              {visibleColumns.description && <Table.Cell>{product.description || "-"}</Table.Cell>}
              {visibleColumns.category && (
                <Table.Cell>
                  <Badge colorScheme="purple" size="sm">
                    {product.category?.name || "-"}
                  </Badge>
                </Table.Cell>
              )}
              {visibleColumns.buyingPrice && (
                <Table.Cell>
                  KES {parseFloat(product.buying_price).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Table.Cell>
              )}
              {visibleColumns.sellingPrice && (
                <Table.Cell fontWeight="semibold">
                  KES {parseFloat(product.selling_price).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Table.Cell>
              )}
              {visibleColumns.currentStock && (
                <Table.Cell>
                  <Badge
                    colorScheme={getStockColorScheme(
                      product.current_stock ?? 0,
                      product.reorder_level ?? undefined
                    )}
                    size="sm"
                  >
                    {product.current_stock ?? 0} units
                  </Badge>
                </Table.Cell>
              )}
              {visibleColumns.reorderLevel && (
                <Table.Cell>{product.reorder_level || "-"}</Table.Cell>
              )}
              {visibleColumns.status && (
                <Table.Cell>
                  <StatusBadge
                    product={product}
                    statuses={statuses}
                    onStatusChange={handleStatusChange}
                  />
                </Table.Cell>
              )}
              {visibleColumns.actions && (
                <Table.Cell>
                  <ProductActionsMenu product={product} />
                </Table.Cell>
              )}
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
      
      {/* Enhanced Pagination */}
      <Box p={4} borderWidth="1px" borderRadius="lg" mt={4}>
        <Stack direction={{ base: "column", md: "row" }} justify="space-between" align="center" gap={4}>
          {/* Items per page */}
          <HStack gap={2}>
            <Text fontSize="sm" color={{ base: "gray.500", _light: "gray.600" }}>
              Items per page:
            </Text>
            <ThemedSelect
              value={pageSize}
              onChange={(value) => setPageSize(Number(value))}
              style={{ maxWidth: "80px", fontSize: "14px", padding: "4px" }}
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </ThemedSelect>
            <Text fontSize="sm" color={{ base: "gray.500", _light: "gray.600" }}>
              ({((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, count)} of {count})
            </Text>
          </HStack>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <PaginationRoot
              count={count}
              pageSize={pageSize}
              page={page}
              onPageChange={(e) => setPage(e.page)}
            >
              <PaginationPrevTrigger />
              <PaginationItems />
              <PaginationNextTrigger />
            </PaginationRoot>
          )}

          {/* Quick jump to page (for large datasets) */}
          {totalPages > 10 && (
            <HStack gap={2}>
              <Text fontSize="sm" color="gray.500">
                Go to page:
              </Text>
              <Input
                type="number"
                min="1"
                max={totalPages}
                value={page}
                onChange={(e) => {
                  const newPage = Number(e.target.value)
                  if (newPage >= 1 && newPage <= totalPages) {
                    setPage(newPage)
                  }
                }}
                w="20"
                size="sm"
              />
            </HStack>
          )}
        </Stack>
      </Box>
    </>
  )
}

function Products() {
  return (
    <Container maxW="full" minH="100vh">
      <Flex 
        direction="column" 
        gap={6}
        pt={12}
        pb={8}
      >
        <Flex justify="space-between" align="center">
          <Heading size="lg">
            Products Management
          </Heading>
          <AddProduct />
        </Flex>
        <ProductsTable />
      </Flex>
    </Container>
  )
}
