import {
  Box,
  Button,
  HStack,
  Icon,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { FiRefreshCw, FiX } from "react-icons/fi"
import { SalesService } from "@/client"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatCurrency } from "./utils"
import useCustomToast from "@/hooks/useCustomToast"

interface QuickSaleHistoryProps {
  isOpen: boolean
  onClose: () => void
  onViewReceipt?: (receiptId: string) => void
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const day = date.getDate().toString().padStart(2, "0")
  const month = date.toLocaleString("en-US", { month: "short" })
  const year = date.getFullYear()
  const hours = date.getHours().toString().padStart(2, "0")
  const minutes = date.getMinutes().toString().padStart(2, "0")
  return `${day}/${month}/${year} ${hours}:${minutes}`
}

export function QuickSaleHistory({
  isOpen,
  onClose,
  onViewReceipt,
}: QuickSaleHistoryProps) {
  const showToast = useCustomToast()
  const queryClient = useQueryClient()
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null)

  // Fetch recent sales
  const { data: recentSales, isLoading, refetch } = useQuery({
    queryKey: ["recent-sales"],
    queryFn: () => SalesService.getRecentSales({ limit: 20, includeVoided: false }),
    enabled: isOpen,
    refetchInterval: 10000, // Refresh every 10 seconds
  })

  // Void sale mutation
  const voidSaleMutation = useMutation({
    mutationFn: async ({ saleId, reason }: { saleId: string; reason: string }) => {
      const token = localStorage.getItem("access_token") || ""
      const apiBase = import.meta.env.VITE_API_URL || ""
      const response = await fetch(`${apiBase}/api/v1/sales/${saleId}/void?reason=${encodeURIComponent(reason)}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to void sale")
      }
      return response.json()
    },
    onSuccess: () => {
      showToast.showSuccessToast("Sale voided successfully")
      queryClient.invalidateQueries({ queryKey: ["recent-sales"] })
      queryClient.invalidateQueries({ queryKey: ["sales"] })
      setSelectedSaleId(null)
    },
    onError: (error: Error) => {
      showToast.showErrorToast(error.message)
    },
  })

  const handleVoidSale = (saleId: string) => {
    const reason = prompt("Enter reason for voiding this sale:")
    if (reason && reason.trim()) {
      voidSaleMutation.mutate({ saleId, reason: reason.trim() })
    }
  }

  const sales = recentSales?.data || []

  return (
    <DialogRoot
      size="xl"
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => !open && onClose()}
    >
      <DialogContent maxW="900px" maxH="90vh" overflow="hidden">
        <DialogCloseTrigger />
        <DialogHeader bg="#3b82f6" color="white" py={3} px={6}>
          <HStack justify="space-between" align="center">
            <DialogTitle color="white" fontSize="md" fontWeight="600">
              Quick Sale History
            </DialogTitle>
            <Button
              size="sm"
              variant="ghost"
              color="white"
              _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
              onClick={() => refetch()}
              loading={isLoading}
            >
              <Icon as={FiRefreshCw} mr={1} />
              Refresh
            </Button>
          </HStack>
        </DialogHeader>
        <DialogBody p={0} overflow="hidden">
          <VStack gap={0} align="stretch" h="calc(90vh - 120px)">
            {isLoading ? (
              <Box p={8} textAlign="center">
                <Text>Loading recent sales...</Text>
              </Box>
            ) : sales.length === 0 ? (
              <Box p={8} textAlign="center">
                <Text color="gray.500">No recent sales found</Text>
              </Box>
            ) : (
              <Box flex={1} overflowY="auto">
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>Time</Table.ColumnHeader>
                      <Table.ColumnHeader>Product</Table.ColumnHeader>
                      <Table.ColumnHeader>Qty</Table.ColumnHeader>
                      <Table.ColumnHeader>Amount</Table.ColumnHeader>
                      <Table.ColumnHeader>Payment</Table.ColumnHeader>
                      <Table.ColumnHeader>Actions</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {sales.map((sale) => (
                      <Table.Row
                        key={sale.id}
                        cursor="pointer"
                        bg={selectedSaleId === sale.id ? "blue.50" : undefined}
                        _hover={{ bg: selectedSaleId === sale.id ? "blue.100" : "gray.50" }}
                        onClick={() => setSelectedSaleId(sale.id)}
                      >
                        <Table.Cell>
                          <Text fontSize="xs">{formatDate(sale.sale_date)}</Text>
                        </Table.Cell>
                        <Table.Cell fontWeight="medium">
                          {sale.product.name}
                        </Table.Cell>
                        <Table.Cell textAlign="center">{sale.quantity}</Table.Cell>
                        <Table.Cell fontWeight="bold" textAlign="right">
                          Ksh {formatCurrency(parseFloat(sale.total_amount))}
                        </Table.Cell>
                        <Table.Cell>
                          <Text fontSize="xs">{sale.payment_method.name}</Text>
                        </Table.Cell>
                        <Table.Cell>
                          <HStack gap={2} justify="flex-end">
                            {onViewReceipt && (
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onViewReceipt(sale.id)
                                }}
                              >
                                View
                              </Button>
                            )}
                            <Button
                              size="xs"
                              variant="ghost"
                              colorPalette="red"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleVoidSale(sale.id)
                              }}
                              disabled={sale.voided || voidSaleMutation.isPending}
                            >
                              <Icon as={FiX} />
                              Void
                            </Button>
                          </HStack>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}
          </VStack>
        </DialogBody>
      </DialogContent>
    </DialogRoot>
  )
}

