import {
  Box,
  Button,
  Container,
  DrawerBackdrop,
  DrawerBody,
  DrawerCloseTrigger,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerRoot,
  DrawerTitle,
  Grid,
  Heading,
  HStack,
  IconButton,
  Input,
  Portal,
  Separator,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useId, useRef, useState } from "react"
import { FiPlus, FiSave, FiTrash2 } from "react-icons/fi"
import type {
  GRNCreate,
  ProductPublic,
  ProductsPublic,
  SupplierCreate,
  SupplierPublic,
  TransporterCreate,
  TransporterPublic,
} from "@/client"
import { GrnService, ProductsService } from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import { usePageMetadata } from "@/hooks/usePageMetadata"

// Utility function to calculate optimal dropdown position
const calculateDropdownPosition = (
  inputElement: HTMLInputElement,
  dropdownMaxHeight: number = 300,
) => {
  const rect = inputElement.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const spaceBelow = viewportHeight - rect.bottom
  const spaceAbove = rect.top

  // Decide whether to show dropdown above or below
  const showAbove = spaceBelow < dropdownMaxHeight && spaceAbove > spaceBelow

  return {
    top: showAbove ? `${rect.top - dropdownMaxHeight}px` : `${rect.bottom}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    maxHeight: showAbove
      ? `${Math.min(spaceAbove - 10, dropdownMaxHeight)}px`
      : `${Math.min(spaceBelow - 10, dropdownMaxHeight)}px`,
  }
}

export const Route = createFileRoute("/_layout/grn/")({
  component: GRNCreatePage,
})

interface GRNFormData {
  supplier_id: string
  transporter_id: string
  transaction_date: string
  goods_receipt_date: string
  shipping_address: string
  delivery_number: string
  delivery_date: string
  consignment_number: string
  consignment_date: string
  batch_number: string
  driver_name: string
  vehicle_reg_number: string
  currency: string
  is_approved: boolean
  notes: string
}

interface GRNItemFormData {
  id: string
  product_id: string
  product_name: string
  lpo_number: string
  order_quantity: number
  pending_quantity: number
  received_quantity: number
  is_promo: boolean
}

function GRNCreatePage() {
  usePageMetadata({
    title: "Goods Receipt Note",
    description:
      "Create and manage goods receipt notes for inventory management",
  })

  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  // Generate unique IDs for all form labels
  const supplierId = useId()
  const currencyId = useId()
  const shippingAddressId = useId()
  const transactionDateId = useId()
  const goodsReceiptDateId = useId()
  const deliveryNumberId = useId()
  const deliveryDateId = useId()
  const consignmentNumberId = useId()
  const consignmentDateId = useId()
  const batchNumberId = useId()
  const transporterId = useId()
  const driverNameId = useId()
  const vehicleRegNumberId = useId()
  const newSupplierNameId = useId()
  const newSupplierContactId = useId()
  const newSupplierPhoneId = useId()
  const newSupplierEmailId = useId()
  const newSupplierAddressId = useId()
  const newTransporterNameId = useId()
  const newTransporterContactId = useId()
  const newTransporterPhoneId = useId()
  const newTransporterVehicleId = useId()
  const approvedCheckboxId = useId()

  const [formData, setFormData] = useState<GRNFormData>({
    supplier_id: "",
    transporter_id: "",
    transaction_date: new Date().toISOString().split("T")[0],
    goods_receipt_date: new Date().toISOString().split("T")[0],
    shipping_address: "",
    delivery_number: "",
    delivery_date: "",
    consignment_number: "",
    consignment_date: "",
    batch_number: "",
    driver_name: "",
    vehicle_reg_number: "",
    currency: "KES",
    is_approved: false,
    notes: "",
  })

  const [items, setItems] = useState<GRNItemFormData[]>([])
  const [productSearch, setProductSearch] = useState("")
  const [debouncedProductSearch, setDebouncedProductSearch] = useState("")
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null)

  // Supplier autocomplete
  const [supplierSearch, setSupplierSearch] = useState("")
  const [debouncedSupplierSearch, setDebouncedSupplierSearch] = useState("")
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false)

  // Transporter autocomplete
  const [transporterSearch, setTransporterSearch] = useState("")
  const [debouncedTransporterSearch, setDebouncedTransporterSearch] =
    useState("")
  const [showTransporterDropdown, setShowTransporterDropdown] = useState(false)

  // Refs for autocomplete positioning
  const productInputRefs = useRef<(HTMLInputElement | null)[]>([])
  const supplierInputRef = useRef<HTMLInputElement | null>(null)
  const transporterInputRef = useRef<HTMLInputElement | null>(null)

  // Drawer states
  const [showSupplierDrawer, setShowSupplierDrawer] = useState(false)
  const [showTransporterDrawer, setShowTransporterDrawer] = useState(false)

  // Transporter form state
  const [newTransporterName, setNewTransporterName] = useState("")
  const [newTransporterContact, setNewTransporterContact] = useState("")
  const [newTransporterPhone, setNewTransporterPhone] = useState("")
  const [newTransporterVehicle, setNewTransporterVehicle] = useState("")

  // Supplier form state
  const [newSupplierName, setNewSupplierName] = useState("")
  const [newSupplierContact, setNewSupplierContact] = useState("")
  const [newSupplierPhone, setNewSupplierPhone] = useState("")
  const [newSupplierEmail, setNewSupplierEmail] = useState("")
  const [newSupplierAddress, setNewSupplierAddress] = useState("")

  // Validation state
  const [supplierNameError, setSupplierNameError] = useState("")
  const [supplierNameWarning, setSupplierNameWarning] = useState("")

  // Debouncing effects
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedProductSearch(productSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [productSearch])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSupplierSearch(supplierSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [supplierSearch])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTransporterSearch(transporterSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [transporterSearch])

  // Queries for initial data (all suppliers and transporters)
  const { data: suppliersData } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () =>
      GrnService.readSuppliers({ skip: 0, limit: 1000, isActive: true }),
  })

  const { data: transportersData } = useQuery({
    queryKey: ["transporters"],
    queryFn: () =>
      GrnService.readTransporters({ skip: 0, limit: 1000, isActive: true }),
  })

  // Search queries for autocomplete
  const { data: filteredSuppliers, isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ["suppliers-search", debouncedSupplierSearch],
    queryFn: async () => {
      if (!debouncedSupplierSearch.trim()) return { data: [], count: 0 }
      return await GrnService.readSuppliers({
        skip: 0,
        limit: 20,
        search: debouncedSupplierSearch,
        isActive: true,
      })
    },
    enabled: debouncedSupplierSearch.trim().length > 0,
  })

  const { data: filteredTransporters, isLoading: isLoadingTransporters } =
    useQuery({
      queryKey: ["transporters-search", debouncedTransporterSearch],
      queryFn: async () => {
        if (!debouncedTransporterSearch.trim()) return { data: [], count: 0 }
        return await GrnService.readTransporters({
          skip: 0,
          limit: 20,
          search: debouncedTransporterSearch,
          isActive: true,
        })
      },
      enabled: debouncedTransporterSearch.trim().length > 0,
    })

  const { data: productsData, isLoading: isLoadingProducts } =
    useQuery<ProductsPublic>({
      queryKey: ["products-search", debouncedProductSearch],
      queryFn: async () => {
        if (!debouncedProductSearch.trim()) return { data: [], count: 0 }
        return await ProductsService.readProducts({
          skip: 0,
          limit: 20,
          name: debouncedProductSearch,
        })
      },
      enabled: debouncedProductSearch.trim().length > 0,
    })

  const createSupplierMutation = useMutation({
    mutationFn: (data: SupplierCreate) =>
      GrnService.createSupplier({ requestBody: data }),
    onSuccess: (newSupplier) => {
      showSuccessToast("Supplier created successfully!")
      queryClient.invalidateQueries({ queryKey: ["suppliers"] })
      setFormData((prev) => ({ ...prev, supplier_id: newSupplier.id }))
      setSupplierSearch(newSupplier.name) // Set search to new supplier name
      setShowSupplierDrawer(false)
      setNewSupplierName("")
      setNewSupplierContact("")
      setNewSupplierPhone("")
      setNewSupplierEmail("")
      setNewSupplierAddress("")
      setSupplierNameError("")
      setSupplierNameWarning("")
    },
    onError: (error: any) => {
      const detail = error?.body?.detail || "An error occurred"
      showErrorToast(detail)
    },
  })

  const createTransporterMutation = useMutation({
    mutationFn: (data: TransporterCreate) =>
      GrnService.createTransporter({ requestBody: data }),
    onSuccess: (newTransporter) => {
      showSuccessToast("Transporter created successfully!")
      queryClient.invalidateQueries({ queryKey: ["transporters"] })
      setFormData((prev) => ({ ...prev, transporter_id: newTransporter.id }))
      setTransporterSearch(newTransporter.name) // Set search to new transporter name
      setShowTransporterDrawer(false)
      setNewTransporterName("")
      setNewTransporterContact("")
      setNewTransporterPhone("")
      setNewTransporterVehicle("")
    },
    onError: (error: any) => {
      const detail = error?.body?.detail || "An error occurred"
      showErrorToast(detail)
    },
  })

  const createGRNMutation = useMutation({
    mutationFn: (data: GRNCreate) =>
      GrnService.createGrn({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("GRN created successfully!")
      queryClient.invalidateQueries({ queryKey: ["grns"] })
      setFormData({
        supplier_id: "",
        transporter_id: "",
        transaction_date: new Date().toISOString().split("T")[0],
        goods_receipt_date: new Date().toISOString().split("T")[0],
        shipping_address: "",
        delivery_number: "",
        delivery_date: "",
        consignment_number: "",
        consignment_date: "",
        batch_number: "",
        driver_name: "",
        vehicle_reg_number: "",
        currency: "KES",
        is_approved: false,
        notes: "",
      })
      setItems([])
    },
    onError: (error: any) => {
      const detail = error?.body?.detail || "An error occurred"
      showErrorToast(detail)
    },
  })

  const validateSupplierName = (value: string) => {
    // Check for invalid characters (only letters, spaces, and dashes allowed)
    const invalidChars = /[^A-Za-z\s-]/
    if (invalidChars.test(value)) {
      setSupplierNameError("Only letters, spaces, and dashes are allowed")
      return false
    }

    // Clear error if valid
    setSupplierNameError("")

    // Check for duplicate (case-insensitive)
    const upperValue = value.toUpperCase().trim()
    if (upperValue && suppliersData?.data) {
      const duplicate = suppliersData.data.find(
        (supplier) => supplier.name.toUpperCase() === upperValue,
      )

      if (duplicate) {
        setSupplierNameWarning("A supplier with this name already exists")
      } else {
        setSupplierNameWarning("")
      }
    }

    return true
  }

  const handleSupplierNameChange = (value: string) => {
    // Convert to uppercase
    const upperValue = value.toUpperCase()
    setNewSupplierName(upperValue)
    validateSupplierName(upperValue)
  }

  const handleCreateSupplier = () => {
    if (!newSupplierName.trim()) {
      showErrorToast("Supplier name is required")
      return
    }

    // Validate name format
    if (!validateSupplierName(newSupplierName)) {
      showErrorToast("Please fix the supplier name errors")
      return
    }

    // Check for duplicates on submit
    if (supplierNameWarning) {
      showErrorToast("A supplier with this name already exists")
      return
    }

    createSupplierMutation.mutate({
      name: newSupplierName,
      contact_person: newSupplierContact || undefined,
      phone: newSupplierPhone || undefined,
      email: newSupplierEmail || undefined,
      address: newSupplierAddress || undefined,
      is_active: true,
    })
  }

  const handleCreateTransporter = () => {
    if (!newTransporterName.trim()) {
      showErrorToast("Transporter name is required")
      return
    }
    createTransporterMutation.mutate({
      name: newTransporterName,
      contact_person: newTransporterContact || undefined,
      phone: newTransporterPhone || undefined,
      is_active: true,
    })
  }

  const handleInputChange = (field: keyof GRNFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddItem = () => {
    const newItem: GRNItemFormData = {
      id: `temp-${Date.now()}`,
      product_id: "",
      product_name: "",
      lpo_number: "",
      order_quantity: 0,
      pending_quantity: 0,
      received_quantity: 0,
      is_promo: false,
    }
    setItems((prev) => [...prev, newItem])
  }

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleItemChange = (
    index: number,
    field: keyof GRNItemFormData,
    value: any,
  ) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    )
  }

  const handleProductSelect = (index: number, product: ProductPublic) => {
    handleItemChange(index, "product_id", product.id)
    handleItemChange(index, "product_name", product.name)
    setProductSearch("")
    setActiveItemIndex(null)
  }

  const handleSupplierSelect = (supplier: SupplierPublic) => {
    handleInputChange("supplier_id", supplier.id)
    setSupplierSearch(supplier.name)
    setShowSupplierDropdown(false)
  }

  const handleTransporterSelect = (transporter: TransporterPublic) => {
    handleInputChange("transporter_id", transporter.id)
    setTransporterSearch(transporter.name)
    setShowTransporterDropdown(false)
  }

  const getSelectedSupplierName = () => {
    if (!formData.supplier_id) return ""
    const supplier = suppliersData?.data.find(
      (s: SupplierPublic) => s.id === formData.supplier_id,
    )
    return supplier?.name || ""
  }

  const getSelectedTransporterName = () => {
    if (!formData.transporter_id) return ""
    const transporter = transportersData?.data.find(
      (t: TransporterPublic) => t.id === formData.transporter_id,
    )
    return transporter?.name || ""
  }

  const handleSubmit = () => {
    if (!formData.supplier_id) {
      showErrorToast("Please select a supplier")
      return
    }

    if (items.length === 0) {
      showErrorToast("Please add at least one product")
      return
    }

    for (const item of items) {
      if (!item.product_id) {
        showErrorToast("All items must have a product selected")
        return
      }
      if (item.received_quantity <= 0) {
        showErrorToast("All items must have a received quantity greater than 0")
        return
      }
    }

    const grnData: GRNCreate = {
      supplier_id: formData.supplier_id,
      transporter_id: formData.transporter_id || undefined,
      transaction_date: new Date(formData.transaction_date).toISOString(),
      goods_receipt_date: new Date(formData.goods_receipt_date).toISOString(),
      shipping_address: formData.shipping_address || undefined,
      delivery_number: formData.delivery_number || undefined,
      delivery_date: formData.delivery_date
        ? new Date(formData.delivery_date).toISOString()
        : undefined,
      consignment_number: formData.consignment_number || undefined,
      consignment_date: formData.consignment_date
        ? new Date(formData.consignment_date).toISOString()
        : undefined,
      batch_number: formData.batch_number || undefined,
      driver_name: formData.driver_name || undefined,
      vehicle_reg_number: formData.vehicle_reg_number || undefined,
      currency: formData.currency,
      total_amount: 0,
      is_approved: formData.is_approved,
      notes: formData.notes || undefined,
      items: items.map((item) => ({
        product_id: item.product_id,
        lpo_number: item.lpo_number || undefined,
        order_quantity: item.order_quantity,
        pending_quantity: item.pending_quantity,
        received_quantity: item.received_quantity,
        is_promo: item.is_promo,
      })),
    }

    createGRNMutation.mutate(grnData)
  }

  return (
    <Container maxW="full" py={8}>
      <VStack gap={6} align="stretch">
        <HStack justify="space-between">
          <Heading size="2xl">GRN Create</Heading>
          <HStack>
            <Button
              variant="outline"
              onClick={() => {
                setFormData({
                  supplier_id: "",
                  transporter_id: "",
                  transaction_date: new Date().toISOString().split("T")[0],
                  goods_receipt_date: new Date().toISOString().split("T")[0],
                  shipping_address: "",
                  delivery_number: "",
                  delivery_date: "",
                  consignment_number: "",
                  consignment_date: "",
                  batch_number: "",
                  driver_name: "",
                  vehicle_reg_number: "",
                  currency: "KES",
                  is_approved: false,
                  notes: "",
                })
                setItems([])
              }}
            >
              Clear
            </Button>
            <Button
              colorPalette="teal"
              loading={createGRNMutation.isPending}
              onClick={handleSubmit}
            >
              <FiSave /> Save GRN
            </Button>
          </HStack>
        </HStack>

        <Box
          p={8}
          borderWidth="1px"
          borderRadius="md"
          bg={{ base: "gray.900", _light: "white" }}
        >
          <VStack gap={8} align="stretch">
            <Grid templateColumns="repeat(5, 1fr)" gap={6}>
              <Box>
                <label
                  htmlFor={supplierId}
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  Supplier <span style={{ color: "red" }}>*</span>
                </label>
                <HStack gap={2}>
                  <Box flex={1} position="relative">
                    <Input
                      id={supplierId}
                      ref={supplierInputRef}
                      value={supplierSearch || getSelectedSupplierName()}
                      onChange={(e) => {
                        const value = e.target.value
                        setSupplierSearch(value)
                        setShowSupplierDropdown(true)
                        if (!value) {
                          handleInputChange("supplier_id", "")
                        }
                      }}
                      onFocus={() => {
                        setShowSupplierDropdown(true)
                        if (!supplierSearch && formData.supplier_id) {
                          setSupplierSearch(getSelectedSupplierName())
                        }
                      }}
                      onBlur={() => {
                        setTimeout(() => {
                          setShowSupplierDropdown(false)
                          // If no supplier selected, clear search
                          if (!formData.supplier_id) {
                            setSupplierSearch("")
                          }
                        }, 200)
                      }}
                      placeholder="Search supplier..."
                      size="sm"
                    />
                    {showSupplierDropdown &&
                      debouncedSupplierSearch.trim().length > 0 &&
                      (() => {
                        const inputElement = supplierInputRef.current
                        if (!inputElement) return null

                        const position = calculateDropdownPosition(inputElement)
                        return (
                          <Portal>
                            <Box
                              position="fixed"
                              top={position.top}
                              left={position.left}
                              width={position.width}
                              maxH={position.maxHeight}
                              bg={{ base: "gray.800", _light: "white" }}
                              borderWidth="1px"
                              borderRadius="md"
                              boxShadow="xl"
                              zIndex={9999}
                              overflowY="auto"
                            >
                              {isLoadingSuppliers ? (
                                <Box p={3} textAlign="center">
                                  <Text fontSize="sm" color="gray.500">
                                    Loading...
                                  </Text>
                                </Box>
                              ) : filteredSuppliers?.data &&
                                filteredSuppliers.data.length > 0 ? (
                                filteredSuppliers.data.map(
                                  (supplier: SupplierPublic) => (
                                    <Box
                                      key={supplier.id}
                                      p={3}
                                      cursor="pointer"
                                      _hover={{
                                        bg: {
                                          base: "gray.700",
                                          _light: "gray.100",
                                        },
                                      }}
                                      onClick={() =>
                                        handleSupplierSelect(supplier)
                                      }
                                      borderBottomWidth="1px"
                                    >
                                      <Text fontWeight="500" fontSize="sm">
                                        {supplier.name}
                                      </Text>
                                      {supplier.phone && (
                                        <Text fontSize="xs" color="gray.500">
                                          Phone: {supplier.phone}
                                        </Text>
                                      )}
                                    </Box>
                                  ),
                                )
                              ) : (
                                <Box p={3} textAlign="center">
                                  <Text fontSize="sm" color="gray.500">
                                    No suppliers found
                                  </Text>
                                </Box>
                              )}
                            </Box>
                          </Portal>
                        )
                      })()}
                  </Box>
                  <IconButton
                    size="sm"
                    variant="outline"
                    colorPalette="teal"
                    onClick={() => setShowSupplierDrawer(true)}
                    title="Add Supplier"
                  >
                    <FiPlus />
                  </IconButton>
                </HStack>
              </Box>

              <Box>
                <label
                  htmlFor={currencyId}
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  Currency
                </label>
                <Input
                  id={currencyId}
                  value={formData.currency}
                  onChange={(e) =>
                    handleInputChange("currency", e.target.value)
                  }
                  placeholder="KES"
                />
              </Box>

              <Box>
                <label
                  htmlFor={shippingAddressId}
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  Shipping Address
                </label>
                <Input
                  id={shippingAddressId}
                  value={formData.shipping_address}
                  onChange={(e) =>
                    handleInputChange("shipping_address", e.target.value)
                  }
                  placeholder="Enter address"
                />
              </Box>

              <Box>
                <label
                  htmlFor={transactionDateId}
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  Transaction Date
                </label>
                <Input
                  id={transactionDateId}
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) =>
                    handleInputChange("transaction_date", e.target.value)
                  }
                />
              </Box>

              <Box>
                <label
                  htmlFor={goodsReceiptDateId}
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  Goods Receipt Date <span style={{ color: "red" }}>*</span>
                </label>
                <Input
                  id={goodsReceiptDateId}
                  type="date"
                  value={formData.goods_receipt_date}
                  onChange={(e) =>
                    handleInputChange("goods_receipt_date", e.target.value)
                  }
                />
              </Box>
            </Grid>

            <Separator />

            <Grid templateColumns="1fr 1fr" gap={8}>
              <Box>
                <Heading size="md" mb={4}>
                  Delivery Detail
                </Heading>
                <VStack gap={4} align="stretch">
                  <Box>
                    <label
                      htmlFor={deliveryNumberId}
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        marginBottom: "8px",
                        display: "block",
                      }}
                    >
                      Delivery No
                    </label>
                    <Input
                      id={deliveryNumberId}
                      value={formData.delivery_number}
                      onChange={(e) =>
                        handleInputChange("delivery_number", e.target.value)
                      }
                      placeholder="Enter delivery number"
                    />
                  </Box>

                  <Box>
                    <label
                      htmlFor={deliveryDateId}
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        marginBottom: "8px",
                        display: "block",
                      }}
                    >
                      Date
                    </label>
                    <Input
                      id={deliveryDateId}
                      type="date"
                      value={formData.delivery_date}
                      onChange={(e) =>
                        handleInputChange("delivery_date", e.target.value)
                      }
                    />
                  </Box>

                  <Box>
                    <label
                      htmlFor={consignmentNumberId}
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        marginBottom: "8px",
                        display: "block",
                      }}
                    >
                      Consignment No
                    </label>
                    <Input
                      id={consignmentNumberId}
                      value={formData.consignment_number}
                      onChange={(e) =>
                        handleInputChange("consignment_number", e.target.value)
                      }
                      placeholder="Enter consignment number"
                    />
                  </Box>

                  <Box>
                    <label
                      htmlFor={consignmentDateId}
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        marginBottom: "8px",
                        display: "block",
                      }}
                    >
                      Date
                    </label>
                    <Input
                      id={consignmentDateId}
                      type="date"
                      value={formData.consignment_date}
                      onChange={(e) =>
                        handleInputChange("consignment_date", e.target.value)
                      }
                    />
                  </Box>

                  <Box>
                    <label
                      htmlFor={batchNumberId}
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        marginBottom: "8px",
                        display: "block",
                      }}
                    >
                      Batch No
                    </label>
                    <Input
                      id={batchNumberId}
                      value={formData.batch_number}
                      onChange={(e) =>
                        handleInputChange("batch_number", e.target.value)
                      }
                      placeholder="Enter batch number"
                    />
                  </Box>
                </VStack>
              </Box>

              <Box>
                <HStack justify="space-between" align="center" mb={4}>
                  <Heading size="md">Transporter Detail</Heading>
                </HStack>
                <VStack gap={4} align="stretch">
                  <Box>
                    <label
                      htmlFor={transporterId}
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        marginBottom: "8px",
                        display: "block",
                      }}
                    >
                      Transporter
                    </label>
                    <HStack gap={2}>
                      <Box flex={1} position="relative">
                        <Input
                          id={transporterId}
                          ref={transporterInputRef}
                          value={
                            transporterSearch || getSelectedTransporterName()
                          }
                          onChange={(e) => {
                            const value = e.target.value
                            setTransporterSearch(value)
                            setShowTransporterDropdown(true)
                            if (!value) {
                              handleInputChange("transporter_id", "")
                            }
                          }}
                          onFocus={() => {
                            setShowTransporterDropdown(true)
                            if (!transporterSearch && formData.transporter_id) {
                              setTransporterSearch(getSelectedTransporterName())
                            }
                          }}
                          onBlur={() => {
                            setTimeout(() => {
                              setShowTransporterDropdown(false)
                              // If no transporter selected, clear search
                              if (!formData.transporter_id) {
                                setTransporterSearch("")
                              }
                            }, 200)
                          }}
                          placeholder="Search transporter..."
                          size="sm"
                        />
                        {showTransporterDropdown &&
                          debouncedTransporterSearch.trim().length > 0 &&
                          (() => {
                            const inputElement = transporterInputRef.current
                            if (!inputElement) return null

                            const position =
                              calculateDropdownPosition(inputElement)
                            return (
                              <Portal>
                                <Box
                                  position="fixed"
                                  top={position.top}
                                  left={position.left}
                                  width={position.width}
                                  maxH={position.maxHeight}
                                  bg={{ base: "gray.800", _light: "white" }}
                                  borderWidth="1px"
                                  borderRadius="md"
                                  boxShadow="xl"
                                  zIndex={9999}
                                  overflowY="auto"
                                >
                                  {isLoadingTransporters ? (
                                    <Box p={3} textAlign="center">
                                      <Text fontSize="sm" color="gray.500">
                                        Loading...
                                      </Text>
                                    </Box>
                                  ) : filteredTransporters?.data &&
                                    filteredTransporters.data.length > 0 ? (
                                    filteredTransporters.data.map(
                                      (transporter: TransporterPublic) => (
                                        <Box
                                          key={transporter.id}
                                          p={3}
                                          cursor="pointer"
                                          _hover={{
                                            bg: {
                                              base: "gray.700",
                                              _light: "gray.100",
                                            },
                                          }}
                                          onClick={() =>
                                            handleTransporterSelect(transporter)
                                          }
                                          borderBottomWidth="1px"
                                        >
                                          <Text fontWeight="500" fontSize="sm">
                                            {transporter.name}
                                          </Text>
                                          {transporter.phone && (
                                            <Text
                                              fontSize="xs"
                                              color="gray.500"
                                            >
                                              Phone: {transporter.phone}
                                            </Text>
                                          )}
                                        </Box>
                                      ),
                                    )
                                  ) : (
                                    <Box p={3} textAlign="center">
                                      <Text fontSize="sm" color="gray.500">
                                        No transporters found
                                      </Text>
                                    </Box>
                                  )}
                                </Box>
                              </Portal>
                            )
                          })()}
                      </Box>
                      <IconButton
                        size="sm"
                        variant="outline"
                        colorPalette="teal"
                        onClick={() => setShowTransporterDrawer(true)}
                        title="Add Transporter"
                      >
                        <FiPlus />
                      </IconButton>
                    </HStack>
                  </Box>

                  <Box>
                    <label
                      htmlFor={driverNameId}
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        marginBottom: "8px",
                        display: "block",
                      }}
                    >
                      Driver Name
                    </label>
                    <Input
                      id={driverNameId}
                      value={formData.driver_name}
                      onChange={(e) =>
                        handleInputChange("driver_name", e.target.value)
                      }
                      placeholder="Enter driver name"
                    />
                  </Box>

                  <Box>
                    <label
                      htmlFor={vehicleRegNumberId}
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        marginBottom: "8px",
                        display: "block",
                      }}
                    >
                      Reg No.
                    </label>
                    <Input
                      id={vehicleRegNumberId}
                      value={formData.vehicle_reg_number}
                      onChange={(e) =>
                        handleInputChange("vehicle_reg_number", e.target.value)
                      }
                      placeholder="Enter vehicle registration"
                    />
                  </Box>
                </VStack>
              </Box>
            </Grid>

            <Separator />

            <HStack align="flex-start" justifyContent="flex-end" width="100%">
              <input
                type="checkbox"
                checked={formData.is_approved}
                onChange={(e) =>
                  handleInputChange("is_approved", e.target.checked)
                }
                id={approvedCheckboxId}
                style={{ marginTop: "4px" }}
              />
              <label
                htmlFor={approvedCheckboxId}
                style={{ fontSize: "14px", fontWeight: "500" }}
              >
                Approved
              </label>
            </HStack>

            <Box>
              <HStack justify="space-between" mb={4}>
                <Heading size="md">Attach Open LPOs:</Heading>
                <Button size="sm" colorPalette="teal" onClick={handleAddItem}>
                  <FiPlus /> Add Product
                </Button>
              </HStack>

              <Box overflowX="auto">
                <Table.Root size="sm" variant="outline">
                  <Table.Header>
                    <Table.Row bg={{ base: "gray.800", _light: "gray.100" }}>
                      <Table.ColumnHeader>LPO</Table.ColumnHeader>
                      <Table.ColumnHeader>Product Name *</Table.ColumnHeader>
                      <Table.ColumnHeader>Order Qty</Table.ColumnHeader>
                      <Table.ColumnHeader>Pending Qty</Table.ColumnHeader>
                      <Table.ColumnHeader>Received Qty *</Table.ColumnHeader>
                      <Table.ColumnHeader>Promo</Table.ColumnHeader>
                      <Table.ColumnHeader>Actions</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {items.length === 0 ? (
                      <Table.Row>
                        <Table.Cell
                          colSpan={7}
                          textAlign="center"
                          color="gray.500"
                          py={8}
                        >
                          No products added. Click "Add Product" to start.
                        </Table.Cell>
                      </Table.Row>
                    ) : (
                      items.map((item, index) => (
                        <Table.Row key={item.id}>
                          <Table.Cell>
                            <Input
                              size="sm"
                              value={item.lpo_number}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "lpo_number",
                                  e.target.value,
                                )
                              }
                              placeholder="LPO"
                            />
                          </Table.Cell>
                          <Table.Cell minW="250px">
                            <Box position="relative">
                              <Input
                                ref={(el) => {
                                  productInputRefs.current[index] = el
                                }}
                                size="sm"
                                value={item.product_name}
                                onChange={(e) => {
                                  const value = e.target.value
                                  handleItemChange(index, "product_name", value)
                                  setProductSearch(value)
                                  setActiveItemIndex(index)
                                }}
                                placeholder="Search product..."
                                onFocus={() => {
                                  setActiveItemIndex(index)
                                  if (item.product_name) {
                                    setProductSearch(item.product_name)
                                  }
                                }}
                                onBlur={() => {
                                  setTimeout(() => {
                                    setActiveItemIndex(null)
                                  }, 200)
                                }}
                              />
                              {activeItemIndex === index &&
                                debouncedProductSearch.trim().length > 0 &&
                                (() => {
                                  const inputElement =
                                    productInputRefs.current[index]
                                  if (!inputElement) return null

                                  const position =
                                    calculateDropdownPosition(inputElement)
                                  return (
                                    <Portal>
                                      <Box
                                        position="fixed"
                                        top={position.top}
                                        left={position.left}
                                        width={position.width}
                                        maxH={position.maxHeight}
                                        bg={{
                                          base: "gray.800",
                                          _light: "white",
                                        }}
                                        borderWidth="1px"
                                        borderRadius="md"
                                        boxShadow="xl"
                                        zIndex={9999}
                                        overflowY="auto"
                                      >
                                        {isLoadingProducts ? (
                                          <Box p={3} textAlign="center">
                                            <Text
                                              fontSize="sm"
                                              color="gray.500"
                                            >
                                              Loading...
                                            </Text>
                                          </Box>
                                        ) : productsData?.data &&
                                          productsData.data.length > 0 ? (
                                          productsData.data.map(
                                            (product: ProductPublic) => (
                                              <Box
                                                key={product.id}
                                                p={3}
                                                cursor="pointer"
                                                _hover={{
                                                  bg: {
                                                    base: "gray.700",
                                                    _light: "gray.100",
                                                  },
                                                }}
                                                onClick={() =>
                                                  handleProductSelect(
                                                    index,
                                                    product,
                                                  )
                                                }
                                                borderBottomWidth="1px"
                                              >
                                                <Text
                                                  fontWeight="500"
                                                  fontSize="sm"
                                                >
                                                  {product.name}
                                                </Text>
                                                <Text
                                                  fontSize="xs"
                                                  color="gray.500"
                                                >
                                                  Category:{" "}
                                                  {product.category.name}
                                                </Text>
                                              </Box>
                                            ),
                                          )
                                        ) : (
                                          <Box p={3} textAlign="center">
                                            <Text
                                              fontSize="sm"
                                              color="gray.500"
                                            >
                                              No products found
                                            </Text>
                                          </Box>
                                        )}
                                      </Box>
                                    </Portal>
                                  )
                                })()}
                            </Box>
                          </Table.Cell>
                          <Table.Cell>
                            <Input
                              size="sm"
                              type="number"
                              value={item.order_quantity}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "order_quantity",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              placeholder="0"
                            />
                          </Table.Cell>
                          <Table.Cell>
                            <Input
                              size="sm"
                              type="number"
                              value={item.pending_quantity}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "pending_quantity",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              placeholder="0"
                            />
                          </Table.Cell>
                          <Table.Cell>
                            <Input
                              size="sm"
                              type="number"
                              value={item.received_quantity}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "received_quantity",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              placeholder="0"
                              borderColor={
                                item.received_quantity === 0
                                  ? "red.500"
                                  : undefined
                              }
                            />
                          </Table.Cell>
                          <Table.Cell textAlign="center">
                            <input
                              type="checkbox"
                              checked={item.is_promo}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "is_promo",
                                  e.target.checked,
                                )
                              }
                            />
                          </Table.Cell>
                          <Table.Cell>
                            <IconButton
                              size="sm"
                              variant="ghost"
                              colorPalette="red"
                              onClick={() => handleRemoveItem(index)}
                            >
                              <FiTrash2 />
                            </IconButton>
                          </Table.Cell>
                        </Table.Row>
                      ))
                    )}
                  </Table.Body>
                </Table.Root>
              </Box>
            </Box>
          </VStack>
        </Box>
      </VStack>

      {/* Add Supplier Drawer */}
      <DrawerRoot
        open={showSupplierDrawer}
        onOpenChange={(e) => setShowSupplierDrawer(e.open)}
        placement="end"
        size="md"
      >
        <DrawerBackdrop />
        <DrawerContent
          style={{
            position: "fixed",
            right: 0,
            top: 0,
            bottom: 0,
            width: "400px",
            maxWidth: "90vw",
          }}
        >
          <DrawerHeader borderBottomWidth="1px">
            <DrawerTitle>Add New Supplier</DrawerTitle>
            <DrawerCloseTrigger />
          </DrawerHeader>
          <DrawerBody p={6}>
            <VStack gap={4} align="stretch">
              <Box>
                <label
                  htmlFor={newSupplierNameId}
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  Supplier Name <span style={{ color: "red" }}>*</span>
                </label>
                <Input
                  id={newSupplierNameId}
                  value={newSupplierName}
                  onChange={(e) => handleSupplierNameChange(e.target.value)}
                  placeholder="Enter supplier name"
                  borderColor={supplierNameError ? "red.500" : undefined}
                  style={{ textTransform: "uppercase" }}
                />
                {supplierNameError && (
                  <Text fontSize="sm" color="red.500" mt={1}>
                    {supplierNameError}
                  </Text>
                )}
                {supplierNameWarning && !supplierNameError && (
                  <Text fontSize="sm" color="orange.500" mt={1}>
                    ⚠️ {supplierNameWarning}
                  </Text>
                )}
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Only letters, spaces, and dashes allowed
                </Text>
              </Box>
              <Box>
                <label
                  htmlFor={newSupplierContactId}
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  Contact Person
                </label>
                <Input
                  id={newSupplierContactId}
                  value={newSupplierContact}
                  onChange={(e) => setNewSupplierContact(e.target.value)}
                  placeholder="Enter contact person name"
                />
              </Box>
              <Box>
                <label
                  htmlFor={newSupplierPhoneId}
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  Phone
                </label>
                <Input
                  id={newSupplierPhoneId}
                  value={newSupplierPhone}
                  onChange={(e) => setNewSupplierPhone(e.target.value)}
                  placeholder="Enter phone number"
                />
              </Box>
              <Box>
                <label
                  htmlFor={newSupplierEmailId}
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  Email
                </label>
                <Input
                  id={newSupplierEmailId}
                  type="email"
                  value={newSupplierEmail}
                  onChange={(e) => setNewSupplierEmail(e.target.value)}
                  placeholder="Enter email address"
                />
              </Box>
              <Box>
                <label
                  htmlFor={newSupplierAddressId}
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  Address
                </label>
                <Input
                  id={newSupplierAddressId}
                  value={newSupplierAddress}
                  onChange={(e) => setNewSupplierAddress(e.target.value)}
                  placeholder="Enter address"
                />
              </Box>
            </VStack>
          </DrawerBody>
          <DrawerFooter borderTopWidth="1px">
            <HStack width="full" justify="flex-end" gap={3}>
              <Button
                variant="outline"
                onClick={() => {
                  setShowSupplierDrawer(false)
                  setNewSupplierName("")
                  setNewSupplierContact("")
                  setNewSupplierPhone("")
                  setNewSupplierEmail("")
                  setNewSupplierAddress("")
                  setSupplierNameError("")
                  setSupplierNameWarning("")
                }}
              >
                Cancel
              </Button>
              <Button
                colorPalette="teal"
                loading={createSupplierMutation.isPending}
                onClick={handleCreateSupplier}
              >
                Create Supplier
              </Button>
            </HStack>
          </DrawerFooter>
        </DrawerContent>
      </DrawerRoot>

      {/* Add Transporter Drawer */}
      <DrawerRoot
        open={showTransporterDrawer}
        onOpenChange={(e) => setShowTransporterDrawer(e.open)}
        placement="end"
        size="md"
      >
        <DrawerBackdrop />
        <DrawerContent
          style={{
            position: "fixed",
            right: 0,
            top: 0,
            bottom: 0,
            width: "400px",
            maxWidth: "90vw",
          }}
        >
          <DrawerHeader borderBottomWidth="1px">
            <DrawerTitle>Add New Transporter</DrawerTitle>
            <DrawerCloseTrigger />
          </DrawerHeader>
          <DrawerBody p={6}>
            <VStack gap={4} align="stretch">
              <Box>
                <label
                  htmlFor={newTransporterNameId}
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  Transporter Name <span style={{ color: "red" }}>*</span>
                </label>
                <Input
                  id={newTransporterNameId}
                  value={newTransporterName}
                  onChange={(e) => setNewTransporterName(e.target.value)}
                  placeholder="Enter transporter name"
                />
              </Box>
              <Box>
                <label
                  htmlFor={newTransporterContactId}
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  Contact Person
                </label>
                <Input
                  id={newTransporterContactId}
                  value={newTransporterContact}
                  onChange={(e) => setNewTransporterContact(e.target.value)}
                  placeholder="Enter contact person name"
                />
              </Box>
              <Box>
                <label
                  htmlFor={newTransporterPhoneId}
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  Phone
                </label>
                <Input
                  id={newTransporterPhoneId}
                  value={newTransporterPhone}
                  onChange={(e) => setNewTransporterPhone(e.target.value)}
                  placeholder="Enter phone number"
                />
              </Box>
              <Box>
                <label
                  htmlFor={newTransporterVehicleId}
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  Vehicle Registration (Optional)
                </label>
                <Input
                  id={newTransporterVehicleId}
                  value={newTransporterVehicle}
                  onChange={(e) => setNewTransporterVehicle(e.target.value)}
                  placeholder="Enter vehicle registration"
                />
              </Box>
            </VStack>
          </DrawerBody>
          <DrawerFooter borderTopWidth="1px">
            <HStack width="full" justify="flex-end" gap={3}>
              <Button
                variant="outline"
                onClick={() => {
                  setShowTransporterDrawer(false)
                  setNewTransporterName("")
                  setNewTransporterContact("")
                  setNewTransporterPhone("")
                  setNewTransporterVehicle("")
                }}
              >
                Cancel
              </Button>
              <Button
                colorPalette="teal"
                loading={createTransporterMutation.isPending}
                onClick={handleCreateTransporter}
              >
                Create Transporter
              </Button>
            </HStack>
          </DrawerFooter>
        </DrawerContent>
      </DrawerRoot>
    </Container>
  )
}
