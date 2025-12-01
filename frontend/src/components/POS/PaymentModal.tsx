import {
  Box,
  Button,
  Flex,
  HStack,
  Input,
  Stack,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useMemo, useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog"
import type { CartItem } from "./types"
import { formatCurrency } from "./utils"

interface PaymentMethod {
  id: string
  name: string
  type: string
}

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  cart: CartItem[]
  totalAmount: number
  paymentMethods?: PaymentMethod[]
  onSave: (
    payments: Record<string, { amount: number; refNo?: string }>,
  ) => Promise<void>
  onSaveAndPrint: (
    payments: Record<string, { amount: number; refNo?: string }>,
  ) => Promise<void>
  isProcessing?: boolean
  isLoadingPaymentMethods?: boolean
  paymentMethodsError?: Error | null
  customerName?: string
  customerBalance?: number
}

export function PaymentModal({
  isOpen,
  onClose,
  cart,
  totalAmount,
  paymentMethods = [],
  onSave,
  onSaveAndPrint,
  isProcessing = false,
  isLoadingPaymentMethods = false,
  paymentMethodsError = null,
  customerName,
  customerBalance = 0,
}: PaymentModalProps) {
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, number>>(
    {},
  )
  const [paymentRefs, setPaymentRefs] = useState<Record<string, string>>({})
  const [selectedMethods, setSelectedMethods] = useState<
    Record<string, boolean>
  >({})

  // Calculate totals
  const totalItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }, [cart])

  const vatRate = 16.0
  const netTotal = useMemo(() => {
    return totalAmount / (1 + vatRate / 100)
  }, [totalAmount])
  const vatAmount = useMemo(() => {
    return totalAmount - netTotal
  }, [totalAmount, netTotal])

  const totalPaid = useMemo(() => {
    return Object.values(paymentAmounts).reduce(
      (sum, amount) => sum + (amount || 0),
      0,
    )
  }, [paymentAmounts])

  const changeDue = useMemo(() => {
    return Math.max(0, totalPaid - totalAmount)
  }, [totalPaid, totalAmount])

  // Check if payment is sufficient (full payment required if no customer, partial/zero allowed if customer selected)
  const isPaymentSufficient = useMemo(() => {
    // Check if customer is actually selected (handle empty string, null, undefined)
    const hasCustomer = customerName && customerName.trim().length > 0

    if (!hasCustomer) {
      // No customer: require full payment (allow small rounding differences)
      return totalPaid >= totalAmount - 0.01
    }
    // Customer selected: allow partial or zero payment (entire amount can be debt)
    return totalPaid >= 0
  }, [totalPaid, totalAmount, customerName])

  const paymentShortfall = useMemo(() => {
    const hasCustomer = customerName && customerName.trim().length > 0
    if (!hasCustomer && totalPaid < totalAmount) {
      return totalAmount - totalPaid
    }
    return 0
  }, [totalPaid, totalAmount, customerName])

  const handleAmountChange = (methodId: string, amount: string) => {
    setPaymentAmounts((prev) => ({
      ...prev,
      [methodId]: parseFloat(amount) || 0,
    }))
  }

  const handleRefChange = (methodId: string, ref: string) => {
    setPaymentRefs((prev) => ({
      ...prev,
      [methodId]: ref,
    }))
  }

  const handleMethodToggle = (methodId: string, checked: boolean) => {
    setSelectedMethods((prev) => ({
      ...prev,
      [methodId]: checked,
    }))
    if (!checked) {
      setPaymentAmounts((prev) => {
        const newAmounts = { ...prev }
        delete newAmounts[methodId]
        return newAmounts
      })
      setPaymentRefs((prev) => {
        const newRefs = { ...prev }
        delete newRefs[methodId]
        return newRefs
      })
    }
  }

  const handleSave = async () => {
    const payments: Record<string, { amount: number; refNo?: string }> = {}
    Object.entries(paymentAmounts).forEach(([methodId, amount]) => {
      if (selectedMethods[methodId] && amount > 0) {
        payments[methodId] = {
          amount,
          refNo: paymentRefs[methodId] || undefined,
        }
      }
    })
    await onSave(payments)
    handleClose()
  }

  const handleSaveAndPrint = async () => {
    const payments: Record<string, { amount: number; refNo?: string }> = {}
    Object.entries(paymentAmounts).forEach(([methodId, amount]) => {
      if (selectedMethods[methodId] && amount > 0) {
        payments[methodId] = {
          amount,
          refNo: paymentRefs[methodId] || undefined,
        }
      }
    })
    await onSaveAndPrint(payments)
    handleClose()
  }

  const handleClose = () => {
    setPaymentAmounts({})
    setPaymentRefs({})
    setSelectedMethods({})
    onClose()
  }

  return (
    <DialogRoot
      size="full"
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => !open && handleClose()}
    >
      <DialogContent maxW="90vw" maxH="90vh" overflow="hidden">
        <DialogCloseTrigger />
        <DialogHeader bg="brand.secondary" color="white" py={3} px={6}>
          <DialogTitle color="white" fontSize="md" fontWeight="600">
            Payment Details :: {formatCurrency(totalAmount)}
          </DialogTitle>
          {customerName && (
            <Text fontSize="sm" color="white" opacity={0.9} mt={1}>
              Customer: {customerName}{" "}
              {customerBalance > 0 &&
                `(Balance: ${formatCurrency(customerBalance)})`}
            </Text>
          )}
        </DialogHeader>
        <DialogBody p={0} overflow="hidden">
          <Flex h="calc(90vh - 120px)" overflow="hidden">
            {/* Left Section - Payment Input (60%) */}
            <Box flex="0 0 60%" p={6} overflowY="auto" bg="bg.canvas">
              <VStack gap={4} align="stretch">
                {/* Summary Fields */}
                <HStack gap={4}>
                  <Box flex={1}>
                    <Text
                      fontSize="sm"
                      fontWeight="medium"
                      mb={1}
                      color="text.primary"
                    >
                      TOTAL ITEMS
                    </Text>
                    <Input
                      value={totalItems.toFixed(0)}
                      readOnly
                      bg="input.bg"
                      border="1px solid"
                      borderColor="input.border"
                      color="text.primary"
                    />
                  </Box>
                  <Box flex={1}>
                    <Text
                      fontSize="sm"
                      fontWeight="medium"
                      mb={1}
                      color="text.primary"
                    >
                      AMOUNT DUE
                    </Text>
                    <Input
                      value={totalAmount.toFixed(2)}
                      readOnly
                      bg="input.bg"
                      border="1px solid"
                      borderColor="input.border"
                      color="text.primary"
                    />
                  </Box>
                  <Box flex={1}>
                    <Text
                      fontSize="sm"
                      fontWeight="medium"
                      mb={1}
                      color="text.primary"
                    >
                      CHANGE DUE
                    </Text>
                    <Input
                      value={changeDue.toFixed(2)}
                      readOnly
                      bg="input.bg"
                      border="1px solid"
                      borderColor="input.border"
                      color="text.primary"
                    />
                  </Box>
                </HStack>

                {/* Payment Methods */}
                <Box mt={4}>
                  <Text
                    fontSize="sm"
                    fontWeight="bold"
                    mb={3}
                    color="text.primary"
                  >
                    Payment Methods
                  </Text>
                  <Stack gap={4}>
                    {isLoadingPaymentMethods ? (
                      <Text
                        fontSize="sm"
                        color="text.muted"
                        textAlign="center"
                        py={4}
                      >
                        Loading payment methods...
                      </Text>
                    ) : paymentMethodsError ? (
                      <Text
                        fontSize="sm"
                        color="red.500"
                        textAlign="center"
                        py={4}
                      >
                        Error loading payment methods. Please refresh the page.
                      </Text>
                    ) : paymentMethods.length === 0 ? (
                      <Text
                        fontSize="sm"
                        color="text.muted"
                        textAlign="center"
                        py={4}
                      >
                        No payment methods available. Please configure payment
                        methods in the system.
                      </Text>
                    ) : (
                      paymentMethods.map((method) => (
                        <Box
                          key={method.id}
                          p={3}
                          borderRadius="md"
                          border="1px solid"
                          borderColor="border.default"
                          bg="item.bg"
                        >
                          <HStack gap={2} mb={2} alignItems="center">
                            <Checkbox
                              checked={selectedMethods[method.id] || false}
                              onCheckedChange={({ checked }) =>
                                handleMethodToggle(
                                  method.id,
                                  checked as boolean,
                                )
                              }
                              colorPalette="blue"
                            />
                            <Text
                              fontSize="sm"
                              fontWeight="medium"
                              color="text.primary"
                              flex={1}
                            >
                              {method.name}{" "}
                              {method.type !== "OTHER" && `(${method.type})`}
                            </Text>
                          </HStack>
                          {selectedMethods[method.id] &&
                            (method.type === "MPESA" ? (
                              <VStack gap={2} align="stretch">
                                <Input
                                  type="number"
                                  placeholder="0.00"
                                  value={paymentAmounts[method.id] || ""}
                                  onChange={(e) =>
                                    handleAmountChange(
                                      method.id,
                                      e.target.value,
                                    )
                                  }
                                  step="0.01"
                                  min="0"
                                  bg="input.bg"
                                  border="1px solid"
                                  borderColor="input.border"
                                  color="text.primary"
                                  _focus={{
                                    borderColor: "input.focus.border",
                                    boxShadow: "input.focus.shadow",
                                  }}
                                />
                                <HStack gap={2} align="end">
                                  <Button
                                    size="sm"
                                    bg="brand.secondary"
                                    color="white"
                                    _hover={{ bg: "brand.secondary.hover" }}
                                    flexShrink={0}
                                  >
                                    Validate Mpesa Paid
                                  </Button>
                                  <Box flex={1}>
                                    <Text
                                      fontSize="xs"
                                      mb={1}
                                      fontWeight="medium"
                                      color="text.muted"
                                    >
                                      PAYMENT REF NO:
                                    </Text>
                                    <Input
                                      placeholder=""
                                      value={paymentRefs[method.id] || ""}
                                      onChange={(e) =>
                                        handleRefChange(
                                          method.id,
                                          e.target.value,
                                        )
                                      }
                                      size="sm"
                                      bg="input.bg"
                                      border="1px solid"
                                      borderColor="input.border"
                                      color="text.primary"
                                      _focus={{
                                        borderColor: "input.focus.border",
                                        boxShadow: "input.focus.shadow",
                                      }}
                                    />
                                  </Box>
                                </HStack>
                              </VStack>
                            ) : method.type === "CREDIT_NOTE" ? (
                              <Input
                                type="number"
                                placeholder="0.00"
                                value={paymentAmounts[method.id] || ""}
                                onChange={(e) =>
                                  handleAmountChange(method.id, e.target.value)
                                }
                                step="0.01"
                                min="0"
                                bg={{ base: "#1a1d29", _light: "#ffffff" }}
                                border="1px solid"
                                borderColor={{
                                  base: "rgba(255, 255, 255, 0.1)",
                                  _light: "#e5e7eb",
                                }}
                                color={{ base: "#ffffff", _light: "#1a1d29" }}
                                _focus={{
                                  borderColor: "input.focus.border",
                                  boxShadow: "input.focus.shadow",
                                }}
                              />
                            ) : (
                              <HStack gap={2} align="end">
                                <Input
                                  type="number"
                                  placeholder="0.00"
                                  value={paymentAmounts[method.id] || ""}
                                  onChange={(e) =>
                                    handleAmountChange(
                                      method.id,
                                      e.target.value,
                                    )
                                  }
                                  step="0.01"
                                  min="0"
                                  bg="input.bg"
                                  border="1px solid"
                                  borderColor="input.border"
                                  color="text.primary"
                                  _focus={{
                                    borderColor: "input.focus.border",
                                    boxShadow: "input.focus.shadow",
                                  }}
                                  flex={1}
                                />
                                <Box flex={1}>
                                  <Text
                                    fontSize="xs"
                                    mb={1}
                                    fontWeight="medium"
                                    color={{
                                      base: "#9ca3af",
                                      _light: "#6b7280",
                                    }}
                                  >
                                    PAYMENT REF NO:
                                  </Text>
                                  <Input
                                    placeholder=""
                                    value={paymentRefs[method.id] || ""}
                                    onChange={(e) =>
                                      handleRefChange(method.id, e.target.value)
                                    }
                                    size="sm"
                                    bg="input.bg"
                                    border="1px solid"
                                    borderColor={{
                                      base: "rgba(255, 255, 255, 0.1)",
                                      _light: "#e5e7eb",
                                    }}
                                    color={{
                                      base: "#ffffff",
                                      _light: "#1a1d29",
                                    }}
                                    _focus={{
                                      borderColor: "input.focus.border",
                                      boxShadow: "input.focus.shadow",
                                    }}
                                  />
                                </Box>
                              </HStack>
                            ))}
                        </Box>
                      ))
                    )}
                  </Stack>
                </Box>
              </VStack>
            </Box>

            {/* Right Section - Order Summary (40%) */}
            <Box
              flex="0 0 40%"
              p={6}
              overflowY="auto"
              bg="bg.canvas"
              borderLeft="3px solid"
              borderColor="brand.primary"
            >
              <VStack gap={4} align="stretch">
                {/* Header */}
                <Text
                  fontSize="lg"
                  fontWeight="bold"
                  textAlign="center"
                  mb={2}
                  color="brand.primary"
                >
                  WISEMAN PALACE
                </Text>

                {/* Product Table */}
                <Box overflowX="auto" bg="bg.surface" borderRadius="md" p={2}>
                  <Table.Root size="sm">
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeader color="text.primary">
                          Product Name
                        </Table.ColumnHeader>
                        <Table.ColumnHeader color="text.primary">
                          Unit Price
                        </Table.ColumnHeader>
                        <Table.ColumnHeader color="text.primary">
                          Qty
                        </Table.ColumnHeader>
                        <Table.ColumnHeader color="text.primary">
                          Total
                        </Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {cart.map((item) => {
                        const price = Number(item.product.selling_price)
                        const discountAmount =
                          (price * item.quantity * (item.discount || 0)) / 100
                        const itemTotal = price * item.quantity - discountAmount
                        return (
                          <Table.Row key={item.product.id}>
                            <Table.Cell color="text.primary">
                              {item.product.name}
                            </Table.Cell>
                            <Table.Cell color="text.primary">
                              {price.toFixed(2)}
                            </Table.Cell>
                            <Table.Cell color="text.primary">
                              {item.quantity.toFixed(2)}
                            </Table.Cell>
                            <Table.Cell
                              color="text.primary"
                              fontWeight="medium"
                            >
                              {itemTotal.toFixed(2)}
                            </Table.Cell>
                          </Table.Row>
                        )
                      })}
                    </Table.Body>
                  </Table.Root>
                </Box>

                {/* Financial Summary */}
                <VStack gap={2} align="stretch" fontSize="sm">
                  <HStack justify="space-between">
                    <Text
                      fontWeight="medium"
                      color={{ base: "#ffffff", _light: "#1a1d29" }}
                    >
                      Vat Rate:
                    </Text>
                    <Text color={{ base: "#ffffff", _light: "#1a1d29" }}>
                      {vatRate.toFixed(2)}
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text
                      fontWeight="medium"
                      color={{ base: "#ffffff", _light: "#1a1d29" }}
                    >
                      Net Total:
                    </Text>
                    <Text color={{ base: "#ffffff", _light: "#1a1d29" }}>
                      {netTotal.toFixed(2)}
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text
                      fontWeight="medium"
                      color={{ base: "#ffffff", _light: "#1a1d29" }}
                    >
                      Vat Amount:
                    </Text>
                    <Text color={{ base: "#ffffff", _light: "#1a1d29" }}>
                      {vatAmount.toFixed(2)}
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text
                      fontWeight="medium"
                      color={{ base: "#ffffff", _light: "#1a1d29" }}
                    >
                      Gross Amount:
                    </Text>
                    <Text
                      fontWeight="bold"
                      color={{ base: "#ffffff", _light: "#1a1d29" }}
                    >
                      {totalAmount.toFixed(2)}
                    </Text>
                  </HStack>
                  <Box
                    borderTop="1px solid"
                    borderColor={{
                      base: "rgba(255, 255, 255, 0.1)",
                      _light: "#e5e7eb",
                    }}
                    pt={2}
                    mt={2}
                  >
                    {paymentMethods.map((method) => {
                      const amount = paymentAmounts[method.id] || 0
                      if (amount <= 0) return null
                      return (
                        <HStack key={method.id} justify="space-between" mb={1}>
                          <Text fontWeight="medium" color="text.primary">
                            {method.name}:
                          </Text>
                          <Text color="text.primary">{amount.toFixed(2)}</Text>
                        </HStack>
                      )
                    })}
                    {changeDue > 0 && (
                      <HStack justify="space-between" mt={2}>
                        <Text fontWeight="bold" fontSize="md" color="#22c55e">
                          Change Due:
                        </Text>
                        <Text fontWeight="bold" fontSize="md" color="#22c55e">
                          {changeDue.toFixed(2)}
                        </Text>
                      </HStack>
                    )}
                  </Box>
                  <Box
                    borderTop="1px solid"
                    borderColor={{
                      base: "rgba(255, 255, 255, 0.1)",
                      _light: "#e5e7eb",
                    }}
                    pt={2}
                    mt={2}
                  >
                    <HStack justify="space-between">
                      <Text fontWeight="medium" color="text.primary">
                        Total Items:
                      </Text>
                      <Text color={{ base: "#ffffff", _light: "#1a1d29" }}>
                        {totalItems.toFixed(2)}
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontWeight="medium" color="text.primary">
                        VATABLE AMT:
                      </Text>
                      <Text
                        fontWeight="bold"
                        color={{ base: "#ffffff", _light: "#1a1d29" }}
                      >
                        {totalAmount.toFixed(2)}
                      </Text>
                    </HStack>
                  </Box>
                </VStack>

                {/* Action Buttons */}
                <HStack
                  gap={2}
                  mt={4}
                  pt={4}
                  borderTop="1px solid"
                  borderColor="border.default"
                >
                  <Button
                    variant="solid"
                    bg="button.success"
                    color="white"
                    _hover={{ bg: "button.success.hover" }}
                    onClick={handleSaveAndPrint}
                    disabled={!isPaymentSufficient || isProcessing}
                    loading={isProcessing}
                    flex={1}
                  >
                    Save & Print
                  </Button>
                  <Button
                    variant="solid"
                    bg="brand.secondary"
                    color="white"
                    _hover={{ bg: "brand.secondary.hover" }}
                    onClick={handleSave}
                    disabled={!isPaymentSufficient || isProcessing}
                    loading={isProcessing}
                    flex={1}
                  >
                    Save Only
                  </Button>
                </HStack>
                {(!customerName || customerName.trim().length === 0) &&
                  paymentShortfall > 0 && (
                    <Text
                      fontSize="xs"
                      color="red.500"
                      textAlign="center"
                      mt={2}
                      fontWeight="medium"
                    >
                      Full payment required: Please add{" "}
                      {formatCurrency(paymentShortfall)} more
                    </Text>
                  )}
                {customerName &&
                  customerName.trim().length > 0 &&
                  totalPaid < totalAmount && (
                    <Text
                      fontSize="xs"
                      color="orange.500"
                      textAlign="center"
                      mt={2}
                    >
                      {totalPaid === 0
                        ? `Full amount (${formatCurrency(totalAmount)}) will be recorded as debt`
                        : `Partial payment: ${formatCurrency(totalAmount - totalPaid)} will be recorded as debt`}
                    </Text>
                  )}
              </VStack>
            </Box>
          </Flex>
        </DialogBody>
      </DialogContent>
    </DialogRoot>
  )
}
