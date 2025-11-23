import {
  Box,
  Button,
  Flex,
  Input,
  Text,
  HStack,
  Table,
  VStack,
  IconButton,
  Icon,
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
import { useState, useEffect } from "react"
import { FiSearch, FiCalendar, FiFilter, FiLink, FiChevronLeft, FiChevronRight, FiEye } from "react-icons/fi"
import { SalesService } from "@/client"
import { formatCurrency } from "./utils"

interface RecentReceiptsModalProps {
  isOpen: boolean
  onClose: () => void
  onAttach?: (receiptId: string) => void
  onPreviewReceipt?: (receiptId: string) => void
  onSelectReceipt?: (receiptId: string | null) => void
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

export function RecentReceiptsModal({
  isOpen,
  onClose,
  onAttach,
  onPreviewReceipt,
  onSelectReceipt,
}: RecentReceiptsModalProps) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null)
  // Default to today's date
  const getTodayDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }
  
  const [dateFilter, setDateFilter] = useState<string>(() => {
    const today = new Date()
    const day = today.getDate().toString().padStart(2, '0')
    const month = today.toLocaleString('en-US', { month: 'short' })
    const year = today.getFullYear()
    return `${day}/${month}/${year}`
  })
  const [dateFilterValue, setDateFilterValue] = useState<string>(() => getTodayDate())
  const [salesRepFilter, setSalesRepFilter] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState<string>("")

  // Reset to today when modal opens
  useEffect(() => {
    if (isOpen) {
      const today = getTodayDate()
      const todayDate = new Date(today)
      const day = todayDate.getDate().toString().padStart(2, '0')
      const month = todayDate.toLocaleString('en-US', { month: 'short' })
      const year = todayDate.getFullYear()
      setDateFilter(`${day}/${month}/${year}`)
      setDateFilterValue(today)
      setPage(1) // Reset to first page
    }
  }, [isOpen])

  // Use date filter in query - default to today
  const selectedDate = dateFilterValue || getTodayDate()
  
  const { data, isLoading } = useQuery({
    queryKey: ["recent-receipts", page, pageSize, selectedDate],
    queryFn: () => SalesService.readSales({
      skip: (page - 1) * pageSize,
      limit: pageSize,
      startDate: selectedDate, // Filter by selected date
      endDate: selectedDate,    // Same date for single day filter
    }),
    enabled: isOpen,
  })

  const receipts = data?.data || []
  const totalReceipts = data?.count || 0
  const totalPages = Math.ceil(totalReceipts / pageSize)

  // Filter receipts based on search query
  const filteredReceipts = receipts.filter((receipt) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    const receiptNo = receipt.id.slice(-6).toLowerCase()
    const remarks = receipt.notes?.toLowerCase() || ""
    // Search by receipt no and remarks
    return receiptNo.includes(query) || remarks.includes(query)
  }).filter((receipt) => {
    // Filter by sales rep (cashier) if specified
    if (!salesRepFilter) return true
    const filter = salesRepFilter.toLowerCase()
    const cashierName = (receipt as any).created_by?.full_name?.toLowerCase() || (receipt as any).created_by?.username?.toLowerCase() || ""
    return cashierName.includes(filter)
  })

  const handleDateFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.type = "date"
    e.target.value = dateFilterValue
  }

  const handleDateBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.type = "text"
    if (e.target.value) {
      const date = new Date(e.target.value)
      const day = date.getDate().toString().padStart(2, '0')
      const month = date.toLocaleString('en-US', { month: 'short' })
      const year = date.getFullYear()
      setDateFilter(`${day}/${month}/${year}`)
      setDateFilterValue(e.target.value)
      setPage(1) // Reset to first page when date changes
    } else {
      // If cleared, reset to today
      const today = new Date()
      const day = today.getDate().toString().padStart(2, '0')
      const month = today.toLocaleString('en-US', { month: 'short' })
      const year = today.getFullYear()
      setDateFilter(`${day}/${month}/${year}`)
      setDateFilterValue(getTodayDate())
      setPage(1)
    }
  }

  const handleAttach = (receiptId: string) => {
    if (onAttach) {
      onAttach(receiptId)
    }
    onClose()
  }

  return (
    <DialogRoot
      size="xl"
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => {
        if (!open) {
          if (onSelectReceipt && selectedReceiptId) {
            onSelectReceipt(selectedReceiptId)
          }
          onClose()
        }
      }}
    >
      <DialogContent maxW="90vw" maxH="90vh" overflow="hidden">
        <DialogCloseTrigger />
        <DialogHeader bg="#3b82f6" color="white" py={3} px={6}>
          <Flex justify="space-between" align="center">
            <DialogTitle color="white" fontSize="md" fontWeight="600">
              Recent Receipts: NAIROBI
            </DialogTitle>
          </Flex>
        </DialogHeader>
        <DialogBody p={0} overflow="hidden">
          <VStack gap={0} align="stretch" h="calc(90vh - 120px)">
            {/* Search and Filter Section */}
            <Box p={4} borderBottom="1px solid" borderColor="gray.200" bg="gray.50" _dark={{ bg: "gray.800", borderColor: "gray.700" }}>
              <Flex gap={3} flexWrap="wrap" alignItems="end">
                <Box>
                  <Text fontSize="xs" fontWeight="medium" mb={1}>Date:</Text>
                  <HStack gap={1}>
                    <Input
                      type="text"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      onFocus={handleDateFocus}
                      onBlur={handleDateBlur}
                      size="sm"
                      w="150px"
                      bg="white"
                      _dark={{ bg: "gray.700" }}
                    />
                    <IconButton
                      aria-label="Calendar"
                      size="sm"
                      variant="ghost"
                    >
                      <Icon as={FiCalendar} />
                    </IconButton>
                  </HStack>
                </Box>
                <Box>
                  <Text fontSize="xs" fontWeight="medium" mb={1}>Cashier:</Text>
                  <Input
                    value={salesRepFilter}
                    onChange={(e) => setSalesRepFilter(e.target.value)}
                    placeholder="Filter by cashier"
                    size="sm"
                    w="150px"
                    bg="white"
                    _dark={{ bg: "gray.700" }}
                  />
                </Box>
                <Box flex={1}>
                  <Text fontSize="xs" fontWeight="medium" mb={1}>Search By: Receipt No / Remarks</Text>
                  <HStack gap={1}>
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder=""
                      size="sm"
                      bg="white"
                      _dark={{ bg: "gray.700" }}
                    />
                    <IconButton
                      aria-label="Filter"
                      size="sm"
                      variant="ghost"
                    >
                      <Icon as={FiFilter} />
                    </IconButton>
                    <Button
                      size="sm"
                      bg="#14b8a6"
                      color="white"
                      _hover={{ bg: "#0d9488" }}
                    >
                      <Icon as={FiSearch} mr={2} />
                      Find
                    </Button>
                  </HStack>
                </Box>
              </Flex>
            </Box>

            {/* Receipts Table */}
            <Box flex={1} overflowY="auto">
              <Table.Root size="sm">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>Receipt No</Table.ColumnHeader>
                    <Table.ColumnHeader>Date</Table.ColumnHeader>
                    <Table.ColumnHeader>Receipt Amount</Table.ColumnHeader>
                    <Table.ColumnHeader>Cashier</Table.ColumnHeader>
                    <Table.ColumnHeader>Remarks</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {isLoading ? (
                    <Table.Row>
                      <Table.Cell colSpan={5} textAlign="center" py={8}>
                        <Text>Loading...</Text>
                      </Table.Cell>
                    </Table.Row>
                  ) : filteredReceipts.length === 0 ? (
                    <Table.Row>
                      <Table.Cell colSpan={5} textAlign="center" py={8}>
                        <Text color="gray.500">No receipts found.</Text>
                      </Table.Cell>
                    </Table.Row>
                  ) : (
                    filteredReceipts.map((receipt) => (
                      <Table.Row
                        key={receipt.id}
                        cursor="pointer"
                        bg={selectedReceiptId === receipt.id ? "blue.50" : undefined}
                        _hover={{ bg: selectedReceiptId === receipt.id ? "blue.100" : "gray.50", _dark: { bg: selectedReceiptId === receipt.id ? "blue.900" : "gray.800" } }}
                        onClick={() => {
                          setSelectedReceiptId(receipt.id)
                          if (onSelectReceipt) {
                            onSelectReceipt(receipt.id)
                          }
                        }}
                      >
                        <Table.Cell fontWeight="medium">{receipt.id.slice(-6)}</Table.Cell>
                        <Table.Cell>{formatDate(receipt.sale_date)}</Table.Cell>
                        <Table.Cell fontWeight="medium">Ksh {formatCurrency(parseFloat(receipt.total_amount))}</Table.Cell>
                        <Table.Cell>{(receipt as any).created_by?.full_name || (receipt as any).created_by?.username || "-"}</Table.Cell>
                        <Table.Cell>{receipt.notes || "-"}</Table.Cell>
                      </Table.Row>
                    ))
                  )}
                </Table.Body>
              </Table.Root>
            </Box>

            {/* Pagination */}
            <Box p={4} borderTop="1px solid" borderColor="gray.200" bg="gray.50" _dark={{ bg: "gray.800", borderColor: "gray.700" }}>
              <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
                <Text fontSize="sm" color="gray.600" _dark={{ color: "gray.400" }}>
                  Showing {filteredReceipts.length > 0 ? (page - 1) * pageSize + 1 : 0} - {Math.min(page * pageSize, filteredReceipts.length)} out of {filteredReceipts.length}
                </Text>
                <HStack gap={2}>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                    aria-label="First page"
                  >
                    «
                  </Button>
                  <IconButton
                    size="sm"
                    variant="ghost"
                    aria-label="Previous page"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <Icon as={FiChevronLeft} />
                  </IconButton>
                  <Text fontSize="sm" px={2} fontWeight="medium" bg="blue.100" _dark={{ bg: "blue.900" }} borderRadius="md">
                    {page}
                  </Text>
                  <IconButton
                    size="sm"
                    variant="ghost"
                    aria-label="Next page"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    <Icon as={FiChevronRight} />
                  </IconButton>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPage(totalPages)}
                    disabled={page >= totalPages}
                    aria-label="Last page"
                  >
                    »
                  </Button>
                  <Box w="70px">
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value))
                        setPage(1)
                      }}
                      style={{
                        width: "100%",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "0.375rem",
                        border: "1px solid",
                        fontSize: "0.875rem",
                      }}
                    >
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                    </select>
                  </Box>
                </HStack>
                <HStack gap={2}>
                  {filteredReceipts.length > 0 && selectedReceiptId && (
                    <Button
                      size="sm"
                      bg="#14b8a6"
                      color="white"
                      _hover={{ bg: "#0d9488" }}
                      onClick={() => {
                        if (onPreviewReceipt && selectedReceiptId) {
                          onPreviewReceipt(selectedReceiptId)
                        }
                      }}
                    >
                      <Icon as={FiEye} mr={2} />
                      Preview Receipt
                    </Button>
                  )}
                  {filteredReceipts.length > 0 && selectedReceiptId && (
                    <Button
                      size="sm"
                      bg="#3b82f6"
                      color="white"
                      _hover={{ bg: "#2563eb" }}
                      onClick={() => selectedReceiptId && handleAttach(selectedReceiptId)}
                    >
                      <Icon as={FiLink} mr={2} />
                      Attach
                    </Button>
                  )}
                </HStack>
              </Flex>
            </Box>
          </VStack>
        </DialogBody>
      </DialogContent>
    </DialogRoot>
  )
}

