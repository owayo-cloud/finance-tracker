import {
  Badge,
  Box,
  Button,
  Container,
  EmptyState,
  Flex,
  Heading,
  HStack,
  Icon,
  Input,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { FiSearch, FiTrash2 } from "react-icons/fi"
import { z } from "zod"
import { ProductsService } from "@/client"
import PendingProducts from "@/components/Pending/PendingProducts"
import ProductActionsMenu from "@/components/Products/ProductActionsMenu"
import { Checkbox } from "@/components/ui/checkbox"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination.tsx"
import useCustomToast from "@/hooks/useCustomToast"
import { usePageMetadata } from "@/hooks/usePageMetadata"
import { handleError } from "@/utils"

const productsSearchSchema = z.object({
  page: z.number().catch(1),
  search: z.string().catch(""),
  category: z.string().catch(""),
  status: z.string().catch(""),
  pageSize: z.number().catch(25),
})

// Theme-aware Select Component matching the image
function ThemedSelect({
  value,
  onChange,
  children,
  placeholder,
  ...props
}: {
  value: string | number
  onChange: (value: string) => void
  children: React.ReactNode
  placeholder?: string
  [key: string]: any
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        padding: "10px 12px",
        borderRadius: "6px",
        borderWidth: "1px",
        borderStyle: "solid",
        backgroundColor: "var(--chakra-colors-bg-panel)",
        borderColor: "var(--chakra-colors-border-emphasized)",
        color: "var(--chakra-colors-fg-emphasized)",
        fontSize: "14px",
        cursor: "pointer",
        outline: "none",
        ...props.style,
      }}
      {...props}
    >
      {children}
    </select>
  )
}

function getProductsQueryOptions({
  page,
  pageSize,
  search,
  category,
  status,
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

  if (search.trim()) {
    params.name = search.trim()
  }

  if (category) {
    params.categoryId = category
  }

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

  usePageMetadata({
    title: "Products",
    description: "Manage your product inventory, categories, and stock levels",
  })

  // Local search state with debouncing
  const [searchQuery, setSearchQuery] = useState(search)
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(search)

  // Bulk selection state
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set(),
  )
  const [isDeleting, setIsDeleting] = useState(false)

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
          page: 1,
        }),
      })
    }
  }, [debouncedSearchQuery, search, navigate])

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
      status,
    }),
    placeholderData: (prevData) => prevData,
  })

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (productIds: string[]) => {
      await Promise.all(
        productIds.map((id) => ProductsService.deleteProduct({ id })),
      )
    },
    onSuccess: () => {
      showSuccessToast(
        `Successfully deleted ${selectedProducts.size} product(s)! 🗑️`,
      )
      setSelectedProducts(new Set())
      queryClient.invalidateQueries({ queryKey: ["products"] })
    },
    onError: (error: any) => {
      handleError(error)
    },
  })

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
        page: 1,
      }),
    })
  }

  const setCategory = (newCategory: string) => {
    navigate({
      to: "/products" as any,
      search: (prev: any) => ({
        ...prev,
        category: newCategory,
        page: 1,
      }),
    })
  }

  const setStatus = (newStatus: string) => {
    navigate({
      to: "/products" as any,
      search: (prev: any) => ({
        ...prev,
        status: newStatus,
        page: 1,
      }),
    })
  }

  const products = data?.data || []
  const count = data?.count || 0
  const totalPages = Math.ceil(count / pageSize)

  // Bulk action handlers
  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) return

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedProducts.size} product(s)? This action cannot be undone.`,
    )

    if (confirmed) {
      setIsDeleting(true)
      try {
        await bulkDeleteMutation.mutateAsync(Array.from(selectedProducts))
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(productId)) {
        newSet.delete(productId)
      } else {
        newSet.add(productId)
      }
      return newSet
    })
  }

  const toggleAllProducts = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set())
    } else {
      setSelectedProducts(new Set(products.map((p) => p.id)))
    }
  }

  const isAllSelected =
    products.length > 0 && selectedProducts.size === products.length
  const isIndeterminate =
    selectedProducts.size > 0 && selectedProducts.size < products.length

  if (isLoading) {
    return <PendingProducts />
  }

  return (
    <VStack gap={4} align="stretch">
      {/* Top Filter Bar - exactly like the image */}
      <HStack gap={3} width="100%">
        {/* Search Input */}
        <Box flex={1} position="relative">
          <Icon
            position="absolute"
            left="12px"
            top="50%"
            transform="translateY(-50%)"
            color="gray.500"
            zIndex={1}
          >
            <FiSearch />
          </Icon>
          <Input
            placeholder="Search product"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            pl="40px"
            size="md"
            borderRadius="md"
          />
        </Box>

        {/* Category Dropdown */}
        <Box minW="200px">
          <ThemedSelect value={category} onChange={setCategory}>
            <option value="">Category: Any</option>
            {categories?.data.map((cat) => (
              <option key={cat.id} value={cat.id}>
                Category: {cat.name}
              </option>
            ))}
          </ThemedSelect>
        </Box>

        {/* Status Dropdown */}
        <Box minW="200px">
          <ThemedSelect value={status} onChange={setStatus}>
            <option value="">Stock: Any</option>
            {statuses?.map((statusOption) => (
              <option key={statusOption.id} value={statusOption.id}>
                Stock: {statusOption.name}
              </option>
            ))}
          </ThemedSelect>
        </Box>
      </HStack>

      {/* Bulk Actions Bar */}
      {selectedProducts.size > 0 && (
        <HStack
          p={3}
          bg={{
            base: "rgba(56, 178, 172, 0.1)",
            _light: "rgba(56, 178, 172, 0.05)",
          }}
          borderRadius="md"
          justify="space-between"
        >
          <HStack gap={3}>
            <Badge colorScheme="blue" size="lg" px={3} py={1}>
              {selectedProducts.size} selected
            </Badge>
            <Button
              size="sm"
              colorScheme="red"
              variant="solid"
              onClick={handleBulkDelete}
              loading={isDeleting}
              loadingText="Deleting..."
            >
              <FiTrash2 /> Delete Selected
            </Button>
          </HStack>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedProducts(new Set())}
          >
            Clear Selection
          </Button>
        </HStack>
      )}

      {/* Products Table */}
      {products.length === 0 ? (
        <EmptyState.Root>
          <EmptyState.Content>
            <EmptyState.Indicator>
              <FiSearch />
            </EmptyState.Indicator>
            <VStack textAlign="center">
              <EmptyState.Title>No products found</EmptyState.Title>
              <EmptyState.Description>
                Try adjusting your search or filters
              </EmptyState.Description>
            </VStack>
          </EmptyState.Content>
        </EmptyState.Root>
      ) : (
        <>
          <Box borderWidth="1px" borderRadius="lg" overflow="hidden">
            <Table.Root size="md" variant="outline">
              <Table.Header>
                <Table.Row bg="table.header.bg">
                  <Table.ColumnHeader width="50px">
                    <Checkbox
                      checked={isAllSelected}
                      {...(isIndeterminate ? { _indeterminate: {} } : {})}
                      onCheckedChange={toggleAllProducts}
                      aria-label="Select all products"
                    />
                  </Table.ColumnHeader>
                  <Table.ColumnHeader>Name</Table.ColumnHeader>
                  <Table.ColumnHeader>Category</Table.ColumnHeader>
                  <Table.ColumnHeader>Buying Price</Table.ColumnHeader>
                  <Table.ColumnHeader>Selling Price</Table.ColumnHeader>
                  <Table.ColumnHeader>Stock</Table.ColumnHeader>
                  <Table.ColumnHeader>Status</Table.ColumnHeader>
                  <Table.ColumnHeader width="80px">Actions</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {products.map((product) => (
                  <Table.Row
                    key={product.id}
                    opacity={isPlaceholderData ? 0.5 : 1}
                    bg={
                      selectedProducts.has(product.id)
                        ? "table.row.selected"
                        : "table.row.bg"
                    }
                    _hover={{
                      bg: selectedProducts.has(product.id)
                        ? "table.row.selected"
                        : "table.row.hover",
                    }}
                  >
                    <Table.Cell>
                      <Checkbox
                        checked={selectedProducts.has(product.id)}
                        onCheckedChange={() =>
                          toggleProductSelection(product.id)
                        }
                        aria-label={`Select ${product.name}`}
                      />
                    </Table.Cell>
                    <Table.Cell fontWeight="medium">{product.name}</Table.Cell>
                    <Table.Cell>
                      <Badge colorScheme="purple" size="sm">
                        {product.category?.name || "-"}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      KES{" "}
                      {parseFloat(product.buying_price).toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        },
                      )}
                    </Table.Cell>
                    <Table.Cell fontWeight="semibold">
                      KES{" "}
                      {parseFloat(product.selling_price).toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        },
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge
                        colorScheme={
                          (product.current_stock ?? 0) === 0
                            ? "red"
                            : product.reorder_level &&
                                (product.current_stock ?? 0) <=
                                  product.reorder_level
                              ? "orange"
                              : "green"
                        }
                        size="sm"
                      >
                        {product.current_stock ?? 0} units
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge
                        colorScheme={
                          product.status?.name?.toLowerCase().includes("active")
                            ? "green"
                            : product.status?.name
                                  ?.toLowerCase()
                                  .includes("inactive")
                              ? "red"
                              : "gray"
                        }
                        size="sm"
                      >
                        {product.status?.name || "Unknown"}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <ProductActionsMenu product={product} />
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>

          {/* Pagination */}
          {totalPages > 1 && (
            <Flex justify="space-between" align="center" pt={2}>
              <HStack gap={2}>
                <Text fontSize="sm" color="gray.500">
                  Rows per page:
                </Text>
                <ThemedSelect
                  value={pageSize}
                  onChange={(value) => setPageSize(Number(value))}
                  style={{
                    maxWidth: "80px",
                    fontSize: "14px",
                    padding: "6px 8px",
                  }}
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </ThemedSelect>
                <Text fontSize="sm" color="gray.500">
                  {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, count)}{" "}
                  of {count}
                </Text>
              </HStack>

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
            </Flex>
          )}
        </>
      )}
    </VStack>
  )
}

function Products() {
  return (
    <Container maxW="full" minH="100vh">
      <Flex direction="column" gap={6} pt={12} pb={8}>
        <Flex justify="space-between" align="center">
          <Heading size="lg" color="text.primary">
            Products Catalog
          </Heading>
        </Flex>
        <ProductsTable />
      </Flex>
    </Container>
  )
}
