import {
  Box,
  Button,
  Flex,
  Input,
  Stack,
  Text,
  HStack,
  Table,
  VStack,
} from "@chakra-ui/react"
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogCloseTrigger,
} from "@/components/ui/dialog"
import { CartItem } from "./types"
import { useMemo, useState } from "react"

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
  onSave: (payments: Record<string, { amount: number; refNo?: string }>) => Promise<void>
  onSaveAndPrint: (payments: Record<string, { amount: number; refNo?: string }>) => Promise<void>
  isProcessing?: boolean
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
}: PaymentModalProps) {
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, number>>({})
  const [paymentRefs, setPaymentRefs] = useState<Record<string, string>>({})

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
    return Object.values(paymentAmounts).reduce((sum, amount) => sum + (amount || 0), 0)
  }, [paymentAmounts])

  const changeDue = useMemo(() => {
    return Math.max(0, totalPaid - totalAmount)
  }, [totalPaid, totalAmount])

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

  const handleSave = async () => {
    const payments: Record<string, { amount: number; refNo?: string }> = {}
    Object.entries(paymentAmounts).forEach(([methodId, amount]) => {
      if (amount > 0) {
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
      if (amount > 0) {
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
        <DialogHeader bg="#3b82f6" color="white" py={3} px={6}>
          <DialogTitle color="white" fontSize="md" fontWeight="600">
            Payment Details :: {totalAmount.toFixed(1)}
          </DialogTitle>
        </DialogHeader>
        <DialogBody p={0} overflow="hidden">
          <Flex h="calc(90vh - 120px)" overflow="hidden">
            {/* Left Section - Payment Input (60%) */}
            <Box flex="0 0 60%" p={6} overflowY="auto" bg="bg.canvas">
              <VStack gap={4} align="stretch">
                {/* Summary Fields */}
                <HStack gap={4}>
                  <Box flex={1}>
                    <Text fontSize="sm" fontWeight="medium" mb={1}>
                      TOTAL ITEMS
                    </Text>
                    <Input
                      value={totalItems.toFixed(0)}
                      readOnly
                      bg="white"
                      border="1px solid"
                      borderColor="gray.300"
                    />
                  </Box>
                  <Box flex={1}>
                    <Text fontSize="sm" fontWeight="medium" mb={1}>
                      AMOUNT DUE
                    </Text>
                    <Input
                      value={totalAmount.toFixed(2)}
                      readOnly
                      bg="white"
                      border="1px solid"
                      borderColor="gray.300"
                    />
                  </Box>
                  <Box flex={1}>
                    <Text fontSize="sm" fontWeight="medium" mb={1}>
                      CHANGE DUE
                    </Text>
                    <Input
                      value={changeDue.toFixed(2)}
                      readOnly
                      bg="white"
                      border="1px solid"
                      borderColor="gray.300"
                    />
                  </Box>
                </HStack>

                {/* Payment Methods */}
                <Stack gap={4}>
                  {paymentMethods.map((method) => (
                    <Box key={method.id}>
                      <Text fontSize="sm" fontWeight="medium" mb={2}>
                        {method.name} {method.type !== "OTHER" && `(${method.type})`}
                      </Text>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={paymentAmounts[method.id] || ""}
                        onChange={(e) => handleAmountChange(method.id, e.target.value)}
                        step="0.01"
                        min="0"
                        bg="white"
                        border="1px solid"
                        borderColor="gray.300"
                        mb={method.type === "MPESA" ? 2 : method.type !== "CREDIT_NOTE" ? 2 : 0}
                      />
                      {method.type === "MPESA" && (
                        <Button
                          size="sm"
                          bg="#3b82f6"
                          color="white"
                          _hover={{ bg: "#2563eb" }}
                          mb={2}
                        >
                          Validate Mpesa Paid
                        </Button>
                      )}
                      {method.type !== "CREDIT_NOTE" && (
                        <Box>
                          <Text fontSize="xs" mb={1} fontWeight="medium">
                            PAYMENT REF NO:
                          </Text>
                          <Input
                            placeholder=""
                            value={paymentRefs[method.id] || ""}
                            onChange={(e) => handleRefChange(method.id, e.target.value)}
                            size="sm"
                            bg="white"
                            border="1px solid"
                            borderColor="gray.300"
                          />
                        </Box>
                      )}
                    </Box>
                  ))}
                </Stack>
              </VStack>
            </Box>

            {/* Right Section - Order Summary (40%) */}
            <Box
              flex="0 0 40%"
              p={6}
              overflowY="auto"
              bg="bg.canvas"
              borderLeft="3px solid"
              borderColor="#22c55e"
            >
              <VStack gap={4} align="stretch">
                {/* Header */}
                 <Text fontSize="lg" fontWeight="bold" textAlign="center" mb={2}>
                   WISEMAN PALACE
                 </Text>

                {/* Product Table */}
                <Box overflowX="auto">
                  <Table.Root size="sm">
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeader>Product Name</Table.ColumnHeader>
                        <Table.ColumnHeader>Unit Price</Table.ColumnHeader>
                        <Table.ColumnHeader>Qty</Table.ColumnHeader>
                        <Table.ColumnHeader>Total</Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {cart.map((item) => {
                        const price = Number(item.product.selling_price)
                        const discountAmount = (price * item.quantity * (item.discount || 0)) / 100
                        const itemTotal = price * item.quantity - discountAmount
                        return (
                          <Table.Row key={item.product.id}>
                            <Table.Cell>{item.product.name}</Table.Cell>
                            <Table.Cell>{price.toFixed(2)}</Table.Cell>
                            <Table.Cell>{item.quantity.toFixed(2)}</Table.Cell>
                            <Table.Cell>{itemTotal.toFixed(2)}</Table.Cell>
                          </Table.Row>
                        )
                      })}
                    </Table.Body>
                  </Table.Root>
                </Box>

                {/* Financial Summary */}
                <VStack gap={2} align="stretch" fontSize="sm">
                  <HStack justify="space-between">
                    <Text fontWeight="medium">Vat Rate:</Text>
                    <Text>{vatRate.toFixed(2)}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontWeight="medium">Net Total:</Text>
                    <Text>{netTotal.toFixed(2)}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontWeight="medium">Vat Amount:</Text>
                    <Text>{vatAmount.toFixed(2)}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontWeight="medium">Gross Amount:</Text>
                    <Text fontWeight="bold">{totalAmount.toFixed(2)}</Text>
                  </HStack>
                  <Box borderTop="1px solid" borderColor="gray.300" pt={2} mt={2}>
                  <HStack justify="space-between" mb={1}>
                    <Text fontWeight="medium">Credit Card:</Text>
                    <Text>
                      {(paymentAmounts[paymentMethods.find((m) => m.type === "PDQ")?.id || ""] || 0).toFixed(2)}
                    </Text>
                  </HStack>
                  <HStack justify="space-between" mb={1}>
                    <Text fontWeight="medium">Cash Paid:</Text>
                    <Text>
                      {(paymentAmounts[paymentMethods.find((m) => m.type === "CASH")?.id || ""] || 0).toFixed(2)}
                    </Text>
                  </HStack>
                  <HStack justify="space-between" mb={1}>
                    <Text fontWeight="medium">Mpesa:</Text>
                    <Text>
                      {(paymentAmounts[paymentMethods.find((m) => m.type === "MPESA")?.id || ""] || 0).toFixed(2)}
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontWeight="medium">Change Due:</Text>
                    <Text fontWeight="bold">{changeDue.toFixed(2)}</Text>
                  </HStack>
                  </Box>
                  <Box borderTop="1px solid" borderColor="gray.300" pt={2} mt={2}>
                    <HStack justify="space-between">
                      <Text fontWeight="medium">Total Items:</Text>
                      <Text>{totalItems.toFixed(2)}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontWeight="medium">VATABLE AMT:</Text>
                      <Text fontWeight="bold">{totalAmount.toFixed(2)}</Text>
                    </HStack>
                  </Box>
                </VStack>
                
                {/* Action Buttons */}
                <HStack gap={2} mt={4} pt={4} borderTop="1px solid" borderColor="gray.300">
                  <Button
                    variant="solid"
                    bg="#3b82f6"
                    color="white"
                    _hover={{ bg: "#2563eb" }}
                    onClick={handleSaveAndPrint}
                    disabled={totalPaid < totalAmount || isProcessing}
                    loading={isProcessing}
                    flex={1}
                  >
                    Save & Print
                  </Button>
                  <Button
                    variant="solid"
                    bg="#3b82f6"
                    color="white"
                    _hover={{ bg: "#2563eb" }}
                    onClick={handleSave}
                    disabled={totalPaid < totalAmount || isProcessing}
                    loading={isProcessing}
                    flex={1}
                  >
                    Save Only
                  </Button>
                </HStack>
              </VStack>
            </Box>
          </Flex>
        </DialogBody>
      </DialogContent>
    </DialogRoot>
  )
}

