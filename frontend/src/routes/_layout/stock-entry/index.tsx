import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Container,
  Heading,
  Text,
  Input,
  VStack,
  HStack,
  Box,
  Badge,
  Flex,
  Separator,
  Stack,
  Grid,
  For,
} from "@chakra-ui/react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { FiEdit, FiPackage, FiX, FiChevronLeft, FiChevronRight, FiUpload } from "react-icons/fi";
import { Button } from "../../../components/ui/button";
import { Field } from "../../../components/ui/field";
import {
  DrawerBackdrop,
  DrawerBody,
  DrawerCloseTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerRoot,
  DrawerTitle,
} from "../../../components/ui/drawer";
import type { ProductPublic, StockEntryCreate } from "../../../client";
import { StockEntriesService, ProductsService } from "../../../client";
import useCustomToast from "../../../hooks/useCustomToast";
import { handleError } from "../../../utils";
import AddProduct from "../../../components/Products/AddProduct";
import useAuth from "../../../hooks/useAuth";

export const Route = createFileRoute("/_layout/stock-entry/")({
  component: StockEntry,
});

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

// Helper functions
function getStockColor(product: ProductPublic): string {
  if (product.current_stock === 0) return "red";
  if (
    product.reorder_level &&
    product.current_stock !== undefined &&
    product.current_stock <= product.reorder_level
  ) {
    return "orange";
  }
  return "green";
}

function getStockStatus(product: ProductPublic): string {
  if (product.current_stock === 0) return "Out of Stock";
  if (
    product.reorder_level &&
    product.current_stock !== undefined &&
    product.current_stock <= product.reorder_level
  ) {
    return "Low Stock";
  }
  return "In Stock";
}

// Stock Entry Form Component
function StockEntryForm({
  selectedProduct,
  onClose,
}: {
  selectedProduct: ProductPublic | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { showSuccessToast } = useCustomToast();

  const [openingStock, setOpeningStock] = useState(
    selectedProduct?.current_stock || 0
  );
  const [addedStock, setAddedStock] = useState(0);
  const [sales, setSales] = useState(0);
  const [physicalCount, setPhysicalCount] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  // Update form when product changes
  useEffect(() => {
    if (selectedProduct) {
      setOpeningStock(selectedProduct.current_stock || 0);
      setAddedStock(0);
      setSales(0);
      setPhysicalCount(null);
      setNotes("");
    }
  }, [selectedProduct]);

  // Auto-calculate fields
  const totalStock = openingStock + addedStock;
  const closingStock = totalStock - sales;
  const variance =
    physicalCount !== null ? physicalCount - closingStock : null;

  const mutation = useMutation({
    mutationFn: (data: StockEntryCreate) =>
      StockEntriesService.createStockEntry({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Stock entry created successfully.");
      queryClient.invalidateQueries({ queryKey: ["stock-entries"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      onClose();
    },
    onError: (err: any) => {
      handleError(err);
    },
  });

  const handleSubmit = () => {
    if (!selectedProduct) return;

    const entryData: StockEntryCreate = {
      product_id: selectedProduct.id,
      opening_stock: openingStock,
      added_stock: addedStock,
      total_stock: totalStock,
      sales: sales,
      closing_stock: closingStock,
      physical_count: physicalCount || undefined,
      variance: variance || undefined,
      amount: sales * parseFloat(selectedProduct.selling_price),
      notes: notes || undefined,
      entry_date: new Date().toISOString(),
    };

    mutation.mutate(entryData);
  };

  if (!selectedProduct) {
    return (
      <Box textAlign="center" py={12} color={{ base: "gray.500", _light: "gray.600" }}>
        <FiPackage size={48} style={{ margin: "0 auto 16px" }} />
        <Text fontSize="lg">No product selected</Text>
      </Box>
    );
  }

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
            <Text fontSize="sm" color={{ base: "gray.400", _light: "gray.600" }}>
              Product
            </Text>
            <Text fontWeight="semibold">{selectedProduct.name}</Text>
          </HStack>
          <HStack justify="space-between">
            <Text fontSize="sm" color={{ base: "gray.400", _light: "gray.600" }}>
              Category
            </Text>
            <Badge colorScheme="blue" size="sm">
              {selectedProduct.category.name}
            </Badge>
          </HStack>
          <HStack justify="space-between">
            <Text fontSize="sm" color={{ base: "gray.400", _light: "gray.600" }}>
              Status
            </Text>
            <Badge colorScheme="purple" size="sm">
              {selectedProduct.status.name}
            </Badge>
          </HStack>
          <HStack justify="space-between">
            <Text fontSize="sm" color={{ base: "gray.400", _light: "gray.600" }}>
              Selling Price
            </Text>
            <Text fontWeight="bold" color="teal.400">
              KES{" "}
              {parseFloat(selectedProduct.selling_price).toLocaleString()}
            </Text>
          </HStack>
          <HStack justify="space-between">
            <Text fontSize="sm" color={{ base: "gray.400", _light: "gray.600" }}>
              Current Stock
            </Text>
            <Badge colorScheme={getStockColor(selectedProduct)} size="sm">
              {selectedProduct.current_stock} units
            </Badge>
          </HStack>
        </VStack>
      </Box>

      <Separator />

      {/* Stock Entry Form */}
      <Box>
        <Text fontSize="md" fontWeight="semibold" mb={3}>
          Stock Entry
        </Text>
        <VStack gap={4} align="stretch">
          <Field label="Opening Stock" helperText="Stock at start of day">
            <Input
              type="number"
              value={openingStock}
              readOnly
              opacity={0.7}
              cursor="not-allowed"
            />
          </Field>

          <Field label="Added Stock" helperText="New deliveries/restocking">
            <Input
              type="number"
              value={addedStock}
              onChange={(e) => setAddedStock(Number(e.target.value))}
              min={0}
            />
          </Field>

          <Field label="Total Available" helperText="Auto-calculated">
            <Input
              type="number"
              value={totalStock}
              readOnly
              opacity={0.7}
              cursor="not-allowed"
            />
          </Field>

          <Field label="Sales" helperText="Units sold during shift">
            <Input
              type="number"
              value={sales}
              onChange={(e) => setSales(Number(e.target.value))}
              min={0}
              max={totalStock}
            />
          </Field>

          <Field label="Closing Stock" helperText="Auto-calculated">
            <Input
              type="number"
              value={closingStock}
              readOnly
              opacity={0.7}
              cursor="not-allowed"
            />
          </Field>

          <Field label="Physical Count" helperText="Manual count (optional)">
            <Input
              type="number"
              value={physicalCount ?? ""}
              onChange={(e) =>
                setPhysicalCount(
                  e.target.value ? Number(e.target.value) : null
                )
              }
              min={0}
              placeholder="Enter physical count"
            />
          </Field>

          {/* Variance Alert */}
          {variance !== null && variance !== 0 && (
            <Box
              p={3}
              borderRadius="md"
              bg={variance < 0 ? "red.900" : "orange.900"}
              borderWidth="1px"
              borderColor={variance < 0 ? "red.500" : "orange.500"}
            >
              <Text
                fontWeight="bold"
                color={variance < 0 ? "red.300" : "orange.300"}
                fontSize="sm"
              >
                ⚠️ Variance: {variance > 0 ? "+" : ""}
                {variance} units
              </Text>
              <Text fontSize="xs" color="gray.400">
                {variance < 0
                  ? "Stock shortage detected"
                  : "Stock surplus detected"}
              </Text>
            </Box>
          )}

          {/* Sales Amount */}
          <Box
            p={4}
            bg={{ base: "gray.900", _light: "gray.50" }}
            borderRadius="md"
            borderWidth="1px"
            borderColor={{base: "grey.700", _light: "grey.200"}}
          >
            <Text fontSize="xs" color={{ base: "gray.400", _light: "gray.600" }} mb={1}>
              Total Sales Amount
            </Text>
            <Text fontSize="xl" fontWeight="bold" color="teal.300">
              KES{" "}
              {(sales * parseFloat(selectedProduct.selling_price)).toLocaleString(
                undefined,
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }
              )}
            </Text>
          </Box>

          <Field label="Notes" helperText="Additional observations">
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
            />
          </Field>

          {/* Submit Button */}
          <Button
            colorScheme="teal"
            size="lg"
            onClick={handleSubmit}
            loading={mutation.isPending}
            disabled={sales < 0 || sales > totalStock}
            w="full"
          >
            Submit Stock Entry
          </Button>
        </VStack>
      </Box>
    </VStack>
  );
}

// Product Card Component
function ProductCard({
  product,
  onSelect,
}: {
  product: ProductPublic;
  onSelect: () => void;
}) {
  return (
    <Box
      p={4}
      borderWidth="1px"
      borderRadius="md"
      bg={{ base: "gray.900", _light: "white" }}
      borderColor={{ base: "gray.700", _light: "gray.200" }}
      _hover={{ 
        borderColor: "teal.500", 
        bg: { base: "gray.800", _light: "gray.50" }
      }}
      transition="all 0.2s"
      cursor="pointer"
      onClick={onSelect}
    >
      <Flex justify="space-between" align="start" mb={3}>
        <VStack align="start" gap={1} flex={1}>
          <Text fontWeight="bold" fontSize="md">
            {product.name}
          </Text>
          <HStack gap={2}>
            <Badge colorScheme="blue" size="sm">
              {product.category.name}
            </Badge>
            <Badge colorScheme="purple" size="sm">
              {product.status.name}
            </Badge>
          </HStack>
        </VStack>
        <Button
          size="sm"
          variant="ghost"
          colorScheme="teal"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          <FiEdit />
        </Button>
      </Flex>

      <Grid templateColumns="repeat(3, 1fr)" gap={4}>
        <Box>
          <Text fontSize="xs" color={{ base: "gray.500", _light: "gray.600" }}>
            Stock
          </Text>
          <Badge colorScheme={getStockColor(product)} mt={1}>
            {product.current_stock}
          </Badge>
        </Box>
        <Box>
          <Text fontSize="xs" color={{ base: "gray.500", _light: "gray.600" }}>
            Status
          </Text>
          <Text fontSize="xs" fontWeight="medium" mt={1}>
            {getStockStatus(product)}
          </Text>
        </Box>
        <Box textAlign="right">
          <Text fontSize="xs" color={{ base: "gray.500", _light: "gray.600" }}>
            Price
          </Text>
          <Text fontSize="sm" fontWeight="bold" color="teal.400" mt={1}>
            KES {parseFloat(product.selling_price).toLocaleString()}
          </Text>
        </Box>
      </Grid>
    </Box>
  );
}

// Main Component
function StockEntry() {
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProductPublic | null>(
    null
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch categories and statuses
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => ProductsService.readCategories(),
  });

  const { data: statuses } = useQuery({
    queryKey: ["statuses"],
    queryFn: () => ProductsService.readStatuses(),
  });

  // Fetch products with server-side filtering and pagination
  const { data: productsData, isLoading } = useQuery({
    queryKey: ["products", page, pageSize, debouncedSearchQuery, selectedCategory, selectedStatus],
    queryFn: () => {
      const params: any = {
        skip: (page - 1) * pageSize,
        limit: pageSize,
      };
      
      // Add search by name only
      if (debouncedSearchQuery.trim()) {
        params.name = debouncedSearchQuery.trim();
      }
      
      // Add category filter
      if (selectedCategory) {
        params.category_id = selectedCategory;
      }
      
      // Add status filter
      if (selectedStatus) {
        params.status_id = selectedStatus;
      }
      
      return ProductsService.readProducts(params);
    },
  });

  const products = productsData?.data || [];
  const totalProducts = productsData?.count || 0;
  const totalPages = Math.ceil(totalProducts / pageSize);

  const handleProductSelect = (product: ProductPublic) => {
    setSelectedProduct(product);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => setSelectedProduct(null), 300);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setDebouncedSearchQuery("");
    setSelectedCategory("");
    setSelectedStatus("");
    setPage(1); // Reset to first page when clearing filters
  };

  // Reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery, selectedCategory, selectedStatus]);

  const hasFilters = searchQuery || selectedCategory || selectedStatus;

  return (
    <Container maxW="full" minH="100vh" py={8}>
      <VStack gap={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="start">
          <Box>
            <Heading 
              size="lg" 
              mb={2}
              color={{ base: "#e5e7eb", _light: "#111827" }}
            >
              Product Stock Management
            </Heading>
            <Text color={{ base: "#d1d5db", _light: "#6b7280" }}>
              Select a product to record stock entry, deliveries, and sales.
              {totalProducts > 0 && ` Managing ${totalProducts} products total.`}
            </Text>
          </Box>
          <HStack gap={3}>
            {/* Bulk Import button - only for admins */}
            {currentUser?.is_superuser && (
              <Button
                variant="outline"
                colorScheme="blue"
                onClick={() => navigate({ to: "/stock-entry/bulk-import" })}
              >
                <FiUpload /> Bulk Import
              </Button>
            )}
            <AddProduct />
          </HStack>
        </Flex>

        {/* Filters */}
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
                        <Text fontSize="xs" color="gray.500">
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
                    value={selectedCategory}
                    onChange={setSelectedCategory}
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
                    value={selectedStatus}
                    onChange={setSelectedStatus}
                  >
                    <option value="">All Statuses</option>
                    {statuses?.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.name}
                      </option>
                    ))}
                  </ThemedSelect>
                </Field>
              </Box>
            </Stack>

            <Flex justify="space-between" align="center">
              <HStack gap={2}>
                <Text fontSize="sm" color={{ base: "gray.500", _light: "gray.600" }}>
                  Showing {products.length} of {totalProducts} products
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
                    {selectedCategory && categories?.data && (
                      <Badge colorScheme="blue" size="sm">
                        {categories.data.find(c => c.id === selectedCategory)?.name}
                      </Badge>
                    )}
                    {selectedStatus && statuses && (
                      <Badge colorScheme="purple" size="sm">
                        {statuses.find(s => s.id === selectedStatus)?.name}
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

        {/* Products Grid */}
        {isLoading ? (
          <Box p={8} textAlign="center">
            <Text color={{ base: "gray.500", _light: "gray.600" }}>Loading products...</Text>
          </Box>
        ) : products.length === 0 ? (
          <Box p={8} textAlign="center" borderWidth="1px" borderRadius="lg">
            <FiPackage
              size={48}
              style={{ margin: "0 auto 16px", opacity: 0.3 }}
            />
            <Text color={{ base: "gray.500", _light: "gray.600" }} fontSize="lg" mb={2}>
              No products found
            </Text>
            <Text color={{ base: "gray.600", _light: "gray.500" }} fontSize="sm">
              {hasFilters
                ? "Try adjusting your filters"
                : "Add products to get started"}
            </Text>
          </Box>
        ) : (
          <Grid
            templateColumns={{
              base: "1fr",
              md: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)",
              xl: "repeat(4, 1fr)",
            }}
            gap={4}
          >
            <For each={products}>
              {(product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={() => handleProductSelect(product)}
                />
              )}
            </For>
          </Grid>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 0 && (
          <Box p={4} borderWidth="1px" borderRadius="lg">
            <Stack direction={{ base: "column", md: "row" }} justify="space-between" align="center" gap={4}>
              {/* Items per page */}
              <HStack gap={2}>
                <Text fontSize="sm" color={{ base: "gray.500", _light: "gray.600" }}>
                  Items per page:
                </Text>
                <ThemedSelect
                  value={pageSize}
                  onChange={(value) => {
                    setPageSize(Number(value));
                    setPage(1);
                  }}
                  style={{ maxWidth: "80px", fontSize: "14px", padding: "4px" }}
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </ThemedSelect>
                <Text fontSize="sm" color={{ base: "gray.500", _light: "gray.600" }}>
                  ({((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, totalProducts)} of {totalProducts})
                </Text>
              </HStack>

              {/* Pagination controls */}
              <HStack gap={2}>
                {/* First page */}
                <Button
                  size="sm"
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  variant="ghost"
                >
                  First
                </Button>

                {/* Previous page */}
                <Button
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  variant="ghost"
                >
                  <FiChevronLeft />
                </Button>

                {/* Page numbers */}
                <HStack gap={1}>
                  {/* Show page numbers around current page */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        size="sm"
                        variant={page === pageNum ? "solid" : "ghost"}
                        colorScheme={page === pageNum ? "teal" : "gray"}
                        onClick={() => setPage(pageNum)}
                        minW="8"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </HStack>

                {/* Next page */}
                <Button
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  variant="ghost"
                >
                  <FiChevronRight />
                </Button>

                {/* Last page */}
                <Button
                  size="sm"
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  variant="ghost"
                >
                  Last
                </Button>
              </HStack>

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
                      const newPage = Number(e.target.value);
                      if (newPage >= 1 && newPage <= totalPages) {
                        setPage(newPage);
                      }
                    }}
                    w="20"
                    size="sm"
                  />
                </HStack>
              )}
            </Stack>
          </Box>
        )}
      </VStack>

      {/* Stock Entry Drawer */}
      <DrawerRoot
        open={drawerOpen}
        onOpenChange={(e) => !e.open && handleCloseDrawer()}
        size="md"
        placement="end"
      >
        <DrawerBackdrop />
        <DrawerContent>
          <DrawerHeader borderBottomWidth="1px">
            <DrawerTitle>
              Add Stock Entry
              {selectedProduct && ` - ${selectedProduct.name}`}
            </DrawerTitle>
            <DrawerCloseTrigger />
          </DrawerHeader>
          <DrawerBody>
            <StockEntryForm
              selectedProduct={selectedProduct}
              onClose={handleCloseDrawer}
            />
          </DrawerBody>
        </DrawerContent>
      </DrawerRoot>
    </Container>
  );
}