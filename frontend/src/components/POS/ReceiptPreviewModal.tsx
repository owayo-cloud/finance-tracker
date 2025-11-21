import {
  Box,
  Button,
  Flex,
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
import { useQuery } from "@tanstack/react-query"
import { SalesService, OpenAPI } from "@/client"
import { formatCurrency } from "./utils"

interface ReceiptPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  receiptId: string | null
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const day = date.getDate().toString().padStart(2, '0')
  const month = date.toLocaleString('en-US', { month: 'short' })
  const year = date.getFullYear()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
}

export function ReceiptPreviewModal({
  isOpen,
  onClose,
  receiptId,
}: ReceiptPreviewModalProps) {
  const { data: receipt, isLoading } = useQuery({
    queryKey: ["receipt", receiptId],
    queryFn: () => SalesService.readSale({ saleId: receiptId! }),
    enabled: isOpen && !!receiptId,
  })

  // Fetch all payment methods for this sale
  const { data: salePayments } = useQuery({
    queryKey: ["sale-payments", receiptId],
    queryFn: async () => {
      if (!receiptId) return []
      const token = await OpenAPI.TOKEN?.() || localStorage.getItem("access_token") || ""
      const apiBase = OpenAPI.BASE || import.meta.env.VITE_API_URL || ""
      const response = await fetch(
        `${apiBase}/api/v1/sales/${receiptId}/payments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      if (!response.ok) return []
      return response.json()
    },
    enabled: isOpen && !!receiptId,
  })

  if (!receiptId) {
    return null
  }

  const totalAmount = receipt ? parseFloat(receipt.total_amount) : 0
  const unitPrice = receipt ? parseFloat(receipt.unit_price) : 0
  const vatRate = 16.0
  const netTotal = totalAmount / (1 + vatRate / 100)
  const vatAmount = totalAmount - netTotal

  return (
    <DialogRoot
      size="xl"
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => !open && onClose()}
    >
      <DialogContent maxW="600px" maxH="90vh" overflow="hidden">
        <DialogCloseTrigger />
        <DialogHeader bg="#3b82f6" color="white" py={3} px={6}>
          <DialogTitle color="white" fontSize="md" fontWeight="600">
            Receipt Preview
          </DialogTitle>
        </DialogHeader>
        <DialogBody p={0} overflow="hidden">
          <VStack gap={0} align="stretch" h="calc(90vh - 120px)">
            {isLoading ? (
              <Box p={8} textAlign="center">
                <Text>Loading receipt...</Text>
              </Box>
            ) : receipt ? (
              <>
                {/* Receipt Header */}
                <Box p={6} bg={{ base: "#1a1d29", _light: "#ffffff" }} borderBottom="2px solid" borderColor="#14b8a6">
                  <VStack gap={2} align="center">
                    <Text fontSize="xl" fontWeight="bold" color="#14b8a6">
                      WISEMAN PALACE
                    </Text>
                    <Text fontSize="sm" color={{ base: "#9ca3af", _light: "#6b7280" }}>
                      Receipt No: {receipt.id.slice(-6)}
                    </Text>
                    <Text fontSize="sm" color={{ base: "#9ca3af", _light: "#6b7280" }}>
                      Date: {formatDate(receipt.sale_date)}
                    </Text>
                    {receipt.customer_name && (
                      <Text fontSize="sm" color={{ base: "#9ca3af", _light: "#6b7280" }}>
                        Customer: {receipt.customer_name}
                      </Text>
                    )}
                  </VStack>
                </Box>

                {/* Receipt Items */}
                <Box flex={1} overflowY="auto" p={6} bg={{ base: "rgba(255, 255, 255, 0.02)", _light: "#f9fafb" }}>
                  <Table.Root size="sm">
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeader color={{ base: "#ffffff", _light: "#1a1d29" }}>Product</Table.ColumnHeader>
                        <Table.ColumnHeader color={{ base: "#ffffff", _light: "#1a1d29" }}>Qty</Table.ColumnHeader>
                        <Table.ColumnHeader color={{ base: "#ffffff", _light: "#1a1d29" }}>Unit Price</Table.ColumnHeader>
                        <Table.ColumnHeader color={{ base: "#ffffff", _light: "#1a1d29" }}>Total</Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      <Table.Row>
                        <Table.Cell fontWeight="medium" color={{ base: "#ffffff", _light: "#1a1d29" }}>{receipt.product.name}</Table.Cell>
                        <Table.Cell color={{ base: "#ffffff", _light: "#1a1d29" }}>{receipt.quantity}</Table.Cell>
                        <Table.Cell color={{ base: "#ffffff", _light: "#1a1d29" }}>Ksh {formatCurrency(unitPrice)}</Table.Cell>
                        <Table.Cell fontWeight="bold" color={{ base: "#ffffff", _light: "#1a1d29" }}>Ksh {formatCurrency(totalAmount)}</Table.Cell>
                      </Table.Row>
                    </Table.Body>
                  </Table.Root>
                </Box>

                {/* Receipt Summary */}
                <Box p={6} bg={{ base: "#1a1d29", _light: "#ffffff" }} borderTop="2px solid" borderColor="#14b8a6">
                  <VStack gap={2} align="stretch" fontSize="sm">
                    <HStack justify="space-between">
                      <Text fontWeight="medium" color={{ base: "#ffffff", _light: "#1a1d29" }}>Subtotal:</Text>
                      <Text color={{ base: "#ffffff", _light: "#1a1d29" }}>Ksh {formatCurrency(netTotal)}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontWeight="medium" color={{ base: "#ffffff", _light: "#1a1d29" }}>VAT ({vatRate}%):</Text>
                      <Text color={{ base: "#ffffff", _light: "#1a1d29" }}>Ksh {formatCurrency(vatAmount)}</Text>
                    </HStack>
                    <Box borderTop="1px solid" borderColor={{ base: "rgba(255, 255, 255, 0.1)", _light: "#e5e7eb" }} pt={2} mt={2}>
                      <HStack justify="space-between">
                        <Text fontWeight="bold" fontSize="lg" color={{ base: "#ffffff", _light: "#1a1d29" }}>Total:</Text>
                        <Text fontWeight="bold" fontSize="lg" color={{ base: "#ffffff", _light: "#1a1d29" }}>Ksh {formatCurrency(totalAmount)}</Text>
                      </HStack>
                    </Box>
                      {/* Payment Methods */}
                      <Box mt={2} pt={2} borderTop="1px solid" borderColor={{ base: "rgba(255, 255, 255, 0.1)", _light: "gray.300" }}>
                        <Text fontWeight="bold" mb={2} color={{ base: "#ffffff", _light: "#1a1d29" }}>Payment Methods:</Text>
                        {salePayments && salePayments.length > 0 ? (
                          <VStack gap={1} align="stretch">
                            {salePayments.map((payment: any) => {
                              const cashMethod = payment.payment_method?.name?.toUpperCase().includes("CASH")
                              const cashAmount = parseFloat(payment.amount || "0")
                              const change = cashMethod && cashAmount > totalAmount ? cashAmount - totalAmount : 0
                              
                              return (
                                <Box key={payment.id}>
                                  <HStack justify="space-between">
                                    <Text fontSize="sm" color={{ base: "#ffffff", _light: "#1a1d29" }}>
                                      {payment.payment_method?.name || "Unknown"}:
                                    </Text>
                                    <Text fontSize="sm" fontWeight="medium" color={{ base: "#ffffff", _light: "#1a1d29" }}>
                                      Ksh {formatCurrency(parseFloat(payment.amount || "0"))}
                                    </Text>
                                  </HStack>
                                  {payment.reference_number && (
                                    <Text fontSize="xs" color={{ base: "#9ca3af", _light: "#6b7280" }} ml={2}>
                                      Ref: {payment.reference_number}
                                    </Text>
                                  )}
                                  {change > 0 && (
                                    <HStack justify="space-between" mt={1}>
                                      <Text fontSize="sm" fontWeight="bold" color="#22c55e">Change:</Text>
                                      <Text fontSize="sm" fontWeight="bold" color="#22c55e">
                                        Ksh {formatCurrency(change)}
                                      </Text>
                                    </HStack>
                                  )}
                                </Box>
                              )
                            })}
                          </VStack>
                        ) : (
                          <HStack justify="space-between">
                            <Text fontSize="sm" color={{ base: "#ffffff", _light: "#1a1d29" }}>
                              {receipt.payment_method.name}:
                            </Text>
                            <Text fontSize="sm" fontWeight="medium" color={{ base: "#ffffff", _light: "#1a1d29" }}>
                              Ksh {formatCurrency(totalAmount)}
                            </Text>
                          </HStack>
                        )}
                      </Box>
                    {receipt.notes && (
                      <Box mt={2} pt={2} borderTop="1px solid" borderColor={{ base: "rgba(255, 255, 255, 0.1)", _light: "#e5e7eb" }}>
                        <Text fontWeight="medium" mb={1} color={{ base: "#ffffff", _light: "#1a1d29" }}>Notes:</Text>
                        <Text fontSize="xs" color={{ base: "#9ca3af", _light: "#6b7280" }}>{receipt.notes}</Text>
                      </Box>
                    )}
                  </VStack>
                </Box>

                {/* Action Buttons */}
                <Box p={4} bg={{ base: "rgba(255, 255, 255, 0.02)", _light: "#f9fafb" }} borderTop="1px solid" borderColor={{ base: "rgba(255, 255, 255, 0.1)", _light: "#e5e7eb" }}>
                  <HStack gap={2} justify="flex-end">
                    <Button
                      size="sm"
                      bg="#14b8a6"
                      color="white"
                      _hover={{ bg: "#0d9488" }}
                      onClick={() => {
                        // TODO: Add print functionality
                        window.print()
                      }}
                    >
                      Print
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      borderColor={{ base: "rgba(255, 255, 255, 0.1)", _light: "#e5e7eb" }}
                      color={{ base: "#ffffff", _light: "#1a1d29" }}
                      _hover={{ bg: { base: "rgba(255, 255, 255, 0.05)", _light: "#f3f4f6" } }}
                      onClick={onClose}
                    >
                      Close
                    </Button>
                  </HStack>
                </Box>
              </>
            ) : (
              <Box p={8} textAlign="center">
                <Text color="gray.500">Receipt not found.</Text>
              </Box>
            )}
          </VStack>
        </DialogBody>
      </DialogContent>
    </DialogRoot>
  )
}

