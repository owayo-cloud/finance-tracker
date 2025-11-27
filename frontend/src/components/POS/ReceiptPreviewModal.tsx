import { Box, Button, HStack, Table, Text, VStack } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { OpenAPI, SalesService } from "@/client"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatCurrency } from "./utils"

interface ReceiptPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  receiptId: string | null
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const day = date.getDate().toString().padStart(2, "0")
  const month = date.toLocaleString("en-US", { month: "short" })
  const year = date.getFullYear()
  const hours = date.getHours().toString().padStart(2, "0")
  const minutes = date.getMinutes().toString().padStart(2, "0")
  const seconds = date.getSeconds().toString().padStart(2, "0")
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
      const token = localStorage.getItem("access_token") || ""
      const apiBase = OpenAPI.BASE || import.meta.env.VITE_API_URL || ""
      const response = await fetch(
        `${apiBase}/api/v1/sales/${receiptId}/payments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
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
                <Box
                  p={6}
                  bg={{ base: "#1a1d29", _light: "#ffffff" }}
                  borderBottom="2px solid"
                  borderColor="#14b8a6"
                >
                  <VStack gap={2} align="center">
                    <Text
                      fontSize="2xl"
                      fontWeight="bold"
                      color="#14b8a6"
                      letterSpacing="wide"
                    >
                      WISEMAN PALACE
                    </Text>
                    <Box
                      w="full"
                      borderTop="1px solid"
                      borderColor={{
                        base: "rgba(255, 255, 255, 0.1)",
                        _light: "#e5e7eb",
                      }}
                      pt={2}
                      mt={1}
                    >
                      <VStack
                        gap={1.5}
                        align="center"
                        fontSize="xs"
                        color={{ base: "#9ca3af", _light: "#6b7280" }}
                      >
                        <Text fontWeight="medium">
                          Receipt No:{" "}
                          <Text
                            as="span"
                            fontWeight="bold"
                            color={{ base: "#ffffff", _light: "#1a1d29" }}
                          >
                            {receipt.id.slice(-6)}
                          </Text>
                        </Text>
                        <Text>Date: {formatDate(receipt.sale_date)}</Text>
                        {(receipt as any).created_by && (
                          <Text>
                            Cashier:{" "}
                            <Text
                              as="span"
                              fontWeight="medium"
                              color={{ base: "#ffffff", _light: "#1a1d29" }}
                            >
                              {(receipt as any).created_by.full_name ||
                                (receipt as any).created_by.username ||
                                "Unknown"}
                            </Text>
                          </Text>
                        )}
                        {receipt.notes && (
                          <Text
                            mt={1}
                            pt={2}
                            borderTop="1px solid"
                            borderColor={{
                              base: "rgba(255, 255, 255, 0.1)",
                              _light: "#e5e7eb",
                            }}
                            w="full"
                            textAlign="center"
                          >
                            Remarks:{" "}
                            <Text
                              as="span"
                              fontWeight="medium"
                              color={{ base: "#ffffff", _light: "#1a1d29" }}
                            >
                              {receipt.notes}
                            </Text>
                          </Text>
                        )}
                      </VStack>
                    </Box>
                  </VStack>
                </Box>

                {/* Receipt Items */}
                <Box
                  flex={1}
                  overflowY="auto"
                  p={6}
                  bg={{ base: "rgba(255, 255, 255, 0.02)", _light: "#f9fafb" }}
                >
                  <Table.Root size="sm" variant="outline">
                    <Table.Header>
                      <Table.Row bg={{ base: "#14b8a6", _light: "#e0f2fe" }}>
                        <Table.ColumnHeader
                          color="white"
                          fontWeight="bold"
                          textAlign="left"
                        >
                          Product
                        </Table.ColumnHeader>
                        <Table.ColumnHeader
                          color="white"
                          fontWeight="bold"
                          textAlign="center"
                        >
                          Qty
                        </Table.ColumnHeader>
                        <Table.ColumnHeader
                          color="white"
                          fontWeight="bold"
                          textAlign="right"
                        >
                          Unit Price
                        </Table.ColumnHeader>
                        <Table.ColumnHeader
                          color="white"
                          fontWeight="bold"
                          textAlign="right"
                        >
                          Total
                        </Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      <Table.Row
                        _hover={{
                          bg: {
                            base: "rgba(20, 184, 166, 0.1)",
                            _light: "#f0f9ff",
                          },
                        }}
                      >
                        <Table.Cell
                          fontWeight="medium"
                          color={{ base: "#ffffff", _light: "#1a1d29" }}
                        >
                          {receipt.product.name}
                        </Table.Cell>
                        <Table.Cell
                          color={{ base: "#ffffff", _light: "#1a1d29" }}
                          textAlign="center"
                        >
                          {receipt.quantity}
                        </Table.Cell>
                        <Table.Cell
                          color={{ base: "#ffffff", _light: "#1a1d29" }}
                          textAlign="right"
                        >
                          Ksh {formatCurrency(unitPrice)}
                        </Table.Cell>
                        <Table.Cell
                          fontWeight="bold"
                          color={{ base: "#ffffff", _light: "#1a1d29" }}
                          textAlign="right"
                        >
                          Ksh {formatCurrency(totalAmount)}
                        </Table.Cell>
                      </Table.Row>
                    </Table.Body>
                  </Table.Root>
                </Box>

                {/* Receipt Summary */}
                <Box
                  p={6}
                  bg={{ base: "#1a1d29", _light: "#ffffff" }}
                  borderTop="2px solid"
                  borderColor="#14b8a6"
                >
                  <VStack gap={3} align="stretch" fontSize="sm">
                    <VStack gap={1.5} align="stretch">
                      <HStack justify="space-between" py={1}>
                        <Text
                          fontWeight="medium"
                          color={{ base: "#d1d5db", _light: "#6b7280" }}
                        >
                          Subtotal:
                        </Text>
                        <Text
                          fontWeight="medium"
                          color={{ base: "#ffffff", _light: "#1a1d29" }}
                        >
                          Ksh {formatCurrency(netTotal)}
                        </Text>
                      </HStack>
                      <HStack justify="space-between" py={1}>
                        <Text
                          fontWeight="medium"
                          color={{ base: "#d1d5db", _light: "#6b7280" }}
                        >
                          VAT ({vatRate}%):
                        </Text>
                        <Text
                          fontWeight="medium"
                          color={{ base: "#ffffff", _light: "#1a1d29" }}
                        >
                          Ksh {formatCurrency(vatAmount)}
                        </Text>
                      </HStack>
                    </VStack>
                    <Box
                      borderTop="2px solid"
                      borderColor="#14b8a6"
                      pt={3}
                      mt={1}
                    >
                      <HStack justify="space-between">
                        <Text fontWeight="bold" fontSize="lg" color="#14b8a6">
                          Total:
                        </Text>
                        <Text fontWeight="bold" fontSize="lg" color="#14b8a6">
                          Ksh {formatCurrency(totalAmount)}
                        </Text>
                      </HStack>
                    </Box>
                    {/* Payment Methods */}
                    <Box
                      mt={2}
                      pt={3}
                      borderTop="1px solid"
                      borderColor={{
                        base: "rgba(255, 255, 255, 0.1)",
                        _light: "#e5e7eb",
                      }}
                    >
                      <Text
                        fontWeight="bold"
                        mb={2}
                        fontSize="sm"
                        color={{ base: "#ffffff", _light: "#1a1d29" }}
                      >
                        Payment Methods:
                      </Text>
                      {salePayments && salePayments.length > 0 ? (
                        <VStack gap={2} align="stretch">
                          {salePayments.map((payment: any) => {
                            const cashMethod = payment.payment_method?.name
                              ?.toUpperCase()
                              .includes("CASH")
                            const cashAmount = parseFloat(payment.amount || "0")
                            const change =
                              cashMethod && cashAmount > totalAmount
                                ? cashAmount - totalAmount
                                : 0

                            return (
                              <Box
                                key={payment.id}
                                p={2}
                                bg={{
                                  base: "rgba(255, 255, 255, 0.05)",
                                  _light: "#f9fafb",
                                }}
                                borderRadius="md"
                              >
                                <HStack
                                  justify="space-between"
                                  mb={
                                    payment.reference_number || change > 0
                                      ? 1
                                      : 0
                                  }
                                >
                                  <Text
                                    fontSize="sm"
                                    fontWeight="medium"
                                    color={{
                                      base: "#ffffff",
                                      _light: "#1a1d29",
                                    }}
                                  >
                                    {payment.payment_method?.name || "Unknown"}:
                                  </Text>
                                  <Text
                                    fontSize="sm"
                                    fontWeight="bold"
                                    color={{
                                      base: "#ffffff",
                                      _light: "#1a1d29",
                                    }}
                                  >
                                    Ksh{" "}
                                    {formatCurrency(
                                      parseFloat(payment.amount || "0"),
                                    )}
                                  </Text>
                                </HStack>
                                {payment.reference_number && (
                                  <Text
                                    fontSize="xs"
                                    color={{
                                      base: "#9ca3af",
                                      _light: "#6b7280",
                                    }}
                                    mt={1}
                                  >
                                    Ref: {payment.reference_number}
                                  </Text>
                                )}
                                {change > 0 && (
                                  <HStack
                                    justify="space-between"
                                    mt={2}
                                    pt={2}
                                    borderTop="1px solid"
                                    borderColor={{
                                      base: "rgba(255, 255, 255, 0.1)",
                                      _light: "#e5e7eb",
                                    }}
                                  >
                                    <Text
                                      fontSize="sm"
                                      fontWeight="bold"
                                      color="#22c55e"
                                    >
                                      Change:
                                    </Text>
                                    <Text
                                      fontSize="sm"
                                      fontWeight="bold"
                                      color="#22c55e"
                                    >
                                      Ksh {formatCurrency(change)}
                                    </Text>
                                  </HStack>
                                )}
                              </Box>
                            )
                          })}
                        </VStack>
                      ) : (
                        <Box
                          p={2}
                          bg={{
                            base: "rgba(255, 255, 255, 0.05)",
                            _light: "#f9fafb",
                          }}
                          borderRadius="md"
                        >
                          <HStack justify="space-between">
                            <Text
                              fontSize="sm"
                              fontWeight="medium"
                              color={{ base: "#ffffff", _light: "#1a1d29" }}
                            >
                              {receipt.payment_method.name}:
                            </Text>
                            <Text
                              fontSize="sm"
                              fontWeight="bold"
                              color={{ base: "#ffffff", _light: "#1a1d29" }}
                            >
                              Ksh {formatCurrency(totalAmount)}
                            </Text>
                          </HStack>
                        </Box>
                      )}
                    </Box>
                    {/* Remarks Section */}
                    {receipt.notes && (
                      <Box
                        mt={3}
                        pt={3}
                        borderTop="1px solid"
                        borderColor={{
                          base: "rgba(255, 255, 255, 0.1)",
                          _light: "#e5e7eb",
                        }}
                      >
                        <Text
                          fontWeight="bold"
                          mb={1}
                          fontSize="sm"
                          color={{ base: "#ffffff", _light: "#1a1d29" }}
                        >
                          Remarks:
                        </Text>
                        <Text
                          fontSize="sm"
                          color={{ base: "#d1d5db", _light: "#6b7280" }}
                        >
                          {receipt.notes}
                        </Text>
                      </Box>
                    )}
                  </VStack>
                </Box>

                {/* Action Buttons */}
                <Box
                  p={4}
                  bg={{ base: "rgba(255, 255, 255, 0.02)", _light: "#f9fafb" }}
                  borderTop="1px solid"
                  borderColor={{
                    base: "rgba(255, 255, 255, 0.1)",
                    _light: "#e5e7eb",
                  }}
                >
                  <HStack gap={2} justify="flex-end">
                    <Button
                      size="sm"
                      bg="#14b8a6"
                      color="white"
                      _hover={{ bg: "#0d9488" }}
                      onClick={() => {
                        // Create a print-friendly version
                        const printWindow = window.open("", "_blank")
                        if (printWindow) {
                          printWindow.document.write(`
                            <!DOCTYPE html>
                            <html>
                              <head>
                                <title>Receipt - ${receipt.id.slice(-6)}</title>
                                <style>
                                  @media print {
                                    body { margin: 0; padding: 20px; }
                                    .no-print { display: none; }
                                  }
                                  body {
                                    font-family: Arial, sans-serif;
                                    max-width: 300px;
                                    margin: 0 auto;
                                    padding: 20px;
                                  }
                                  .header { text-align: center; border-bottom: 2px solid #14b8a6; padding-bottom: 10px; margin-bottom: 15px; }
                                  .header h1 { color: #14b8a6; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px; }
                                  .receipt-info { text-align: center; margin-bottom: 15px; font-size: 11px; color: #666; line-height: 1.6; }
                                  .receipt-info p { margin: 4px 0; }
                                  table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
                                  th, td { padding: 10px 8px; text-align: left; border-bottom: 1px solid #ddd; }
                                  th { background-color: #14b8a6; color: white; font-weight: bold; text-align: left; }
                                  th:nth-child(2), th:nth-child(3), th:nth-child(4) { text-align: right; }
                                  td:nth-child(2), td:nth-child(3), td:nth-child(4) { text-align: right; }
                                  .total-section { border-top: 2px solid #14b8a6; padding-top: 12px; margin-top: 15px; }
                                  .total-row { display: flex; justify-content: space-between; margin: 6px 0; font-size: 13px; }
                                  .grand-total { font-size: 18px; font-weight: bold; color: #14b8a6; margin-top: 8px; }
                                  .payment-methods { margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd; }
                                  .payment-methods h3 { font-size: 13px; margin-bottom: 10px; color: #333; }
                                  .payment-item { display: flex; justify-content: space-between; margin: 6px 0; padding: 6px; background-color: #f9fafb; border-radius: 4px; }
                                  .payment-item span:first-child { font-weight: 500; }
                                  .payment-item span:last-child { font-weight: bold; }
                                  .change-item { color: #22c55e; font-weight: bold; }
                                  .footer { text-align: center; margin-top: 25px; font-size: 11px; color: #999; padding-top: 15px; border-top: 1px solid #ddd; }
                                </style>
                              </head>
                              <body>
                                <div class="header">
                                  <h1>WISEMAN PALACE</h1>
                                </div>
                                <div class="receipt-info">
                                  <p><strong>Receipt No:</strong> ${receipt.id.slice(-6)}</p>
                                  <p><strong>Date:</strong> ${formatDate(receipt.sale_date)}</p>
                                  ${(receipt as any).created_by ? `<p><strong>Cashier:</strong> ${(receipt as any).created_by.full_name || (receipt as any).created_by.username || "Unknown"}</p>` : ""}
                                  ${receipt.notes ? `<p style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #ddd;"><strong>Remarks:</strong> ${receipt.notes}</p>` : ""}
                                </div>
                                <table>
                                  <thead>
                                    <tr>
                                      <th>Product</th>
                                      <th>Qty</th>
                                      <th>Price</th>
                                      <th>Total</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr>
                                      <td>${receipt.product.name}</td>
                                      <td>${receipt.quantity}</td>
                                      <td>Ksh ${formatCurrency(unitPrice)}</td>
                                      <td>Ksh ${formatCurrency(totalAmount)}</td>
                                    </tr>
                                  </tbody>
                                </table>
                                <div class="total-section">
                                  <div class="total-row">
                                    <span>Subtotal:</span>
                                    <span>Ksh ${formatCurrency(netTotal)}</span>
                                  </div>
                                  <div class="total-row">
                                    <span>VAT (${vatRate}%):</span>
                                    <span>Ksh ${formatCurrency(vatAmount)}</span>
                                  </div>
                                  <div class="total-row grand-total">
                                    <span>Total:</span>
                                    <span>Ksh ${formatCurrency(totalAmount)}</span>
                                  </div>
                                </div>
                                ${
                                  salePayments && salePayments.length > 0
                                    ? `
                                  <div class="payment-methods">
                                    <h3>Payment Methods:</h3>
                                    ${salePayments
                                      .map((payment: any) => {
                                        const cashMethod =
                                          payment.payment_method?.name
                                            ?.toUpperCase()
                                            .includes("CASH")
                                        const cashAmount = parseFloat(
                                          payment.amount || "0",
                                        )
                                        const change =
                                          cashMethod && cashAmount > totalAmount
                                            ? cashAmount - totalAmount
                                            : 0
                                        return `
                                        <div class="payment-item">
                                          <span>${payment.payment_method?.name || "Unknown"}:</span>
                                          <span>Ksh ${formatCurrency(cashAmount)}</span>
                                        </div>
                                        ${payment.reference_number ? `<div style="font-size: 10px; color: #666; margin-left: 10px; margin-top: 2px;">Ref: ${payment.reference_number}</div>` : ""}
                                        ${
                                          change > 0
                                            ? `<div class="payment-item change-item">
                                          <span>Change:</span>
                                          <span>Ksh ${formatCurrency(change)}</span>
                                        </div>`
                                            : ""
                                        }
                                      `
                                      })
                                      .join("")}
                                  </div>
                                `
                                    : `
                                  <div class="payment-methods">
                                    <h3>Payment Methods:</h3>
                                    <div class="payment-item">
                                      <span>${receipt.payment_method.name}:</span>
                                      <span>Ksh ${formatCurrency(totalAmount)}</span>
                                    </div>
                                  </div>
                                `
                                }
                                ${
                                  receipt.notes
                                    ? `<div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
                                  <div style="font-weight: bold; font-size: 13px; color: #333; margin-bottom: 5px;">Remarks:</div>
                                  <div style="font-size: 12px; color: #666;">${receipt.notes}</div>
                                </div>`
                                    : ""
                                }
                                <div class="footer">
                                  <p>Thank you for your business!</p>
                                  <p>©Anchor Core : Developed by NBS</p>
                                </div>
                              </body>
                            </html>
                          `)
                          printWindow.document.close()
                          setTimeout(() => {
                            printWindow.print()
                            printWindow.close()
                          }, 250)
                        } else {
                          // Fallback to regular print
                          window.print()
                        }
                      }}
                    >
                      Print
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      borderColor={{
                        base: "rgba(255, 255, 255, 0.1)",
                        _light: "#e5e7eb",
                      }}
                      color={{ base: "#ffffff", _light: "#1a1d29" }}
                      _hover={{
                        bg: {
                          base: "rgba(255, 255, 255, 0.05)",
                          _light: "#f3f4f6",
                        },
                      }}
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
