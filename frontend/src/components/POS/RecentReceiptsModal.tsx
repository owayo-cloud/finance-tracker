import {
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  IconButton,
  Input,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiLink,
  FiSearch,
} from "react-icons/fi"
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

interface RecentReceiptsModalProps {
  isOpen: boolean
  onClose: () => void
  onAttach?: (receiptId: string) => void
  onPreviewReceipt?: (receiptId: string) => void
  onSelectReceipt?: (receiptId: string | null) => void
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

export function RecentReceiptsModal({
  isOpen,
  onClose,
  onAttach,
  onPreviewReceipt,
  onSelectReceipt,
}: RecentReceiptsModalProps) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(
    null,
  )
  // Default to today's date
  const getTodayDate = useCallback(() => {
    const today = new Date()
    return today.toISOString().split("T")[0]
  }, [])

  const formatDateDisplay = useCallback((dateValue: string) => {
    if (!dateValue) return ""
    const date = new Date(dateValue)
    const day = date.getDate().toString().padStart(2, "0")
    const month = date.toLocaleString("en-US", { month: "short" })
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }, [])

  const [startDateFilter, setStartDateFilter] = useState<string>(() => {
    return formatDateDisplay(getTodayDate())
  })
  const [startDateFilterValue, setStartDateFilterValue] = useState<string>(() =>
    getTodayDate(),
  )
  const [endDateFilter, setEndDateFilter] = useState<string>(() => {
    return formatDateDisplay(getTodayDate())
  })
  const [endDateFilterValue, setEndDateFilterValue] = useState<string>(() =>
    getTodayDate(),
  )
  const [searchQuery, setSearchQuery] = useState<string>("")
  // Applied filters - these are what actually get sent to the API
  const [appliedFilters, setAppliedFilters] = useState<{
    search: string
    startDate: string
    endDate: string
  }>({
    search: "",
    startDate: getTodayDate(),
    endDate: getTodayDate(),
  })
  const startDateInputRef = useRef<HTMLInputElement>(null)
  const endDateInputRef = useRef<HTMLInputElement>(null)

  // Use applied filters for the query (only applied when Find is clicked)
  const { data, isLoading, refetch, error } = useQuery({
    queryKey: [
      "recent-receipts",
      page,
      pageSize,
      appliedFilters.startDate,
      appliedFilters.endDate,
      appliedFilters.search,
    ],
    queryFn: async () => {
      const result = await SalesService.readSales({
        skip: (page - 1) * pageSize,
        limit: pageSize,
        startDate: appliedFilters.startDate,
        endDate: appliedFilters.endDate,
        // Don't filter by cashier - show all receipts for the date range
        // cashierName: appliedFilters.cashier || undefined,
        search: appliedFilters.search || undefined,
        excludeWithDebt: true, // Exclude sales with debts - those appear in invoices
      })
      // Debug logging
      console.log("Receipts query result:", {
        dataLength: result?.data?.length || 0,
        count: result?.count || 0,
        startDate: appliedFilters.startDate,
        endDate: appliedFilters.endDate,
        search: appliedFilters.search,
      })
      return result
    },
    enabled: isOpen,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Always consider data stale to ensure fresh fetches when filters change
  })

  // Reset to today when modal opens and apply filters
  useEffect(() => {
    if (isOpen) {
      const today = getTodayDate()
      setStartDateFilter(formatDateDisplay(today))
      setStartDateFilterValue(today)
      setEndDateFilter(formatDateDisplay(today))
      setEndDateFilterValue(today)
      // Apply today's date as default filter
      setAppliedFilters({
        search: "",
        startDate: today,
        endDate: today,
      })
      setPage(1) // Reset to first page
    }
  }, [isOpen, getTodayDate, formatDateDisplay])

  const receipts = data?.data || []
  const totalReceipts = data?.count || 0

  // Server-side filtering is applied, so receipts are already filtered
  const filteredReceipts = receipts

  // Note: Pagination works with API data, filters are applied server-side
  const totalPages = Math.ceil(totalReceipts / pageSize)

  const handleFind = async () => {
    const newFilters = {
      search: searchQuery.trim(),
      startDate: startDateFilterValue || getTodayDate(),
      endDate: endDateFilterValue || getTodayDate(),
    }
    setAppliedFilters(newFilters)
    setPage(1) // Reset to first page when applying filters
    // Explicitly refetch to provide feedback
    await refetch()
  }

  const handleClearFilters = () => {
    const today = getTodayDate()
    setSearchQuery("")
    setStartDateFilter(formatDateDisplay(today))
    setStartDateFilterValue(today)
    setEndDateFilter(formatDateDisplay(today))
    setEndDateFilterValue(today)
    setAppliedFilters({
      search: "",
      startDate: today,
      endDate: today,
    })
    setPage(1)
  }

  const handleStartDateChange = (newDateValue: string) => {
    if (newDateValue) {
      const today = getTodayDate()
      // Ensure start date is not after today
      const validStartDate = newDateValue > today ? today : newDateValue
      setStartDateFilter(formatDateDisplay(validStartDate))
      setStartDateFilterValue(validStartDate)
      // If start date is after end date, update end date to match
      if (validStartDate > endDateFilterValue) {
        setEndDateFilter(formatDateDisplay(validStartDate))
        setEndDateFilterValue(validStartDate)
      }
      setPage(1) // Reset to first page when date changes
    } else {
      // If cleared, reset to today
      const today = getTodayDate()
      setStartDateFilter(formatDateDisplay(today))
      setStartDateFilterValue(today)
      setPage(1)
    }
  }

  const handleEndDateChange = (newDateValue: string) => {
    if (newDateValue) {
      const today = getTodayDate()
      // Ensure end date is not before start date and not after today
      if (newDateValue < startDateFilterValue) {
        // If end date is before start date, set it to start date
        setEndDateFilter(formatDateDisplay(startDateFilterValue))
        setEndDateFilterValue(startDateFilterValue)
      } else if (newDateValue > today) {
        // If end date is after today, set it to today
        setEndDateFilter(formatDateDisplay(today))
        setEndDateFilterValue(today)
      } else {
        setEndDateFilter(formatDateDisplay(newDateValue))
        setEndDateFilterValue(newDateValue)
      }
      setPage(1) // Reset to first page when date changes
    } else {
      // If cleared, reset to today
      const today = getTodayDate()
      setEndDateFilter(formatDateDisplay(today))
      setEndDateFilterValue(today)
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
              Recent Receipts: WiseMan Palace
            </DialogTitle>
          </Flex>
        </DialogHeader>
        <DialogBody p={0} overflow="hidden">
          <VStack gap={0} align="stretch" h="calc(90vh - 120px)">
            {/* Search and Filter Section */}
            <Box
              p={4}
              borderBottom="1px solid"
              borderColor="gray.200"
              bg="gray.50"
              _dark={{ bg: "gray.800", borderColor: "gray.700" }}
            >
              <Flex gap={3} flexWrap="wrap" alignItems="end">
                <Box>
                  <Text fontSize="xs" fontWeight="medium" mb={1}>
                    From Date:
                  </Text>
                  <HStack gap={1}>
                    <Box
                      position="relative"
                      w="150px"
                      as="label"
                      cursor="pointer"
                    >
                      <Input
                        ref={startDateInputRef}
                        type="date"
                        value={startDateFilterValue}
                        onChange={(e) => {
                          if (e.target.value) {
                            handleStartDateChange(e.target.value)
                          }
                        }}
                        size="sm"
                        w="150px"
                        bg="white"
                        _dark={{ bg: "gray.700" }}
                        position="absolute"
                        opacity={0}
                        zIndex={2}
                        cursor="pointer"
                        max={getTodayDate()}
                      />
                      <Input
                        type="text"
                        value={startDateFilter}
                        size="sm"
                        w="150px"
                        bg="white"
                        _dark={{ bg: "gray.700" }}
                        readOnly
                        pointerEvents="none"
                        position="relative"
                        zIndex={1}
                      />
                    </Box>
                    <IconButton
                      aria-label="Select From Date"
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (startDateInputRef.current) {
                          // Try showPicker() first (modern browsers)
                          if (
                            typeof startDateInputRef.current.showPicker ===
                            "function"
                          ) {
                            try {
                              // showPicker() may return void or Promise<void> depending on browser
                              const pickerResult =
                                startDateInputRef.current.showPicker() as unknown
                              // Check if showPicker returned a Promise (some browsers)
                              if (
                                pickerResult &&
                                typeof pickerResult === "object" &&
                                "catch" in pickerResult &&
                                typeof (pickerResult as { catch?: unknown })
                                  .catch === "function"
                              ) {
                                ;(pickerResult as Promise<void>).catch(() => {
                                  // Fallback to click if showPicker fails
                                  startDateInputRef.current?.click()
                                })
                              }
                            } catch {
                              // If showPicker throws or doesn't work, fallback to click
                              startDateInputRef.current.click()
                            }
                          } else {
                            // Fallback for older browsers
                            startDateInputRef.current.click()
                          }
                        }
                      }}
                    >
                      <Icon as={FiCalendar} />
                    </IconButton>
                  </HStack>
                </Box>
                <Box>
                  <Text fontSize="xs" fontWeight="medium" mb={1}>
                    To Date:
                  </Text>
                  <HStack gap={1}>
                    <Box
                      position="relative"
                      w="150px"
                      as="label"
                      cursor="pointer"
                    >
                      <Input
                        ref={endDateInputRef}
                        type="date"
                        value={endDateFilterValue}
                        onChange={(e) => {
                          if (e.target.value) {
                            handleEndDateChange(e.target.value)
                          }
                        }}
                        size="sm"
                        w="150px"
                        bg="white"
                        _dark={{ bg: "gray.700" }}
                        position="absolute"
                        opacity={0}
                        zIndex={2}
                        cursor="pointer"
                        min={startDateFilterValue}
                        max={getTodayDate()}
                      />
                      <Input
                        type="text"
                        value={endDateFilter}
                        size="sm"
                        w="150px"
                        bg="white"
                        _dark={{ bg: "gray.700" }}
                        readOnly
                        pointerEvents="none"
                        position="relative"
                        zIndex={1}
                      />
                    </Box>
                    <IconButton
                      aria-label="Select To Date"
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (endDateInputRef.current) {
                          // Try showPicker() first (modern browsers)
                          if (
                            typeof endDateInputRef.current.showPicker ===
                            "function"
                          ) {
                            try {
                              // showPicker() may return void or Promise<void> depending on browser
                              const pickerResult =
                                endDateInputRef.current.showPicker() as unknown
                              // Check if showPicker returned a Promise (some browsers)
                              if (
                                pickerResult &&
                                typeof pickerResult === "object" &&
                                "catch" in pickerResult &&
                                typeof (pickerResult as { catch?: unknown })
                                  .catch === "function"
                              ) {
                                ;(pickerResult as Promise<void>).catch(() => {
                                  // Fallback to click if showPicker fails
                                  endDateInputRef.current?.click()
                                })
                              }
                            } catch {
                              // If showPicker throws or doesn't work, fallback to click
                              endDateInputRef.current.click()
                            }
                          } else {
                            // Fallback for older browsers
                            endDateInputRef.current.click()
                          }
                        }
                      }}
                    >
                      <Icon as={FiCalendar} />
                    </IconButton>
                  </HStack>
                </Box>
                <Box flex={1}>
                  <Text fontSize="xs" fontWeight="medium" mb={1}>
                    Search By: Receipt No / Remarks
                  </Text>
                  <HStack gap={1}>
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleFind()
                        }
                      }}
                      placeholder="Enter receipt no or remarks"
                      size="sm"
                      bg="white"
                      _dark={{ bg: "gray.700" }}
                      flex={1}
                    />
                    <Button
                      size="sm"
                      bg="#14b8a6"
                      color="white"
                      _hover={{ bg: "#0d9488" }}
                      onClick={handleFind}
                      loading={isLoading}
                      disabled={isLoading}
                    >
                      <Icon as={FiSearch} mr={2} />
                      {isLoading ? "Searching..." : "Find"}
                    </Button>
                    {appliedFilters.search && (
                      <Button
                        size="sm"
                        variant="ghost"
                        colorPalette="gray"
                        onClick={handleClearFilters}
                      >
                        Clear
                      </Button>
                    )}
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
                  ) : error ? (
                    <Table.Row>
                      <Table.Cell colSpan={5} textAlign="center" py={8}>
                        <Text color="red.500">
                          Error loading receipts:{" "}
                          {error instanceof Error
                            ? error.message
                            : "Unknown error"}
                        </Text>
                      </Table.Cell>
                    </Table.Row>
                  ) : filteredReceipts.length === 0 ? (
                    <Table.Row>
                      <Table.Cell colSpan={5} textAlign="center" py={8}>
                        <Text color="gray.500">
                          No receipts found for{" "}
                          {formatDateDisplay(appliedFilters.startDate)} -{" "}
                          {formatDateDisplay(appliedFilters.endDate)}.
                          {appliedFilters.search
                            ? " Try clearing the search filter or adjusting the date range."
                            : " Try adjusting the date range and clicking Find."}
                        </Text>
                      </Table.Cell>
                    </Table.Row>
                  ) : (
                    filteredReceipts.map((receipt) => (
                      <Table.Row
                        key={receipt.id}
                        cursor="pointer"
                        bg={
                          selectedReceiptId === receipt.id
                            ? "blue.50"
                            : undefined
                        }
                        _hover={{
                          bg:
                            selectedReceiptId === receipt.id
                              ? "blue.100"
                              : "gray.50",
                          _dark: {
                            bg:
                              selectedReceiptId === receipt.id
                                ? "blue.900"
                                : "gray.800",
                          },
                        }}
                        onClick={() => {
                          setSelectedReceiptId(receipt.id)
                          if (onSelectReceipt) {
                            onSelectReceipt(receipt.id)
                          }
                        }}
                      >
                        <Table.Cell fontWeight="medium">
                          <Text
                            as="span"
                            fontWeight="600"
                            color="brand.primary"
                          >
                            {receipt.id.slice(-6).toUpperCase()}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>{formatDate(receipt.sale_date)}</Table.Cell>
                        <Table.Cell fontWeight="medium">
                          Ksh {formatCurrency(parseFloat(receipt.total_amount))}
                        </Table.Cell>
                        <Table.Cell>
                          {(
                            (receipt as any).created_by?.full_name ||
                            (receipt as any).created_by?.username ||
                            "-"
                          ).toUpperCase()}
                        </Table.Cell>
                        <Table.Cell>{receipt.notes || "-"}</Table.Cell>
                      </Table.Row>
                    ))
                  )}
                </Table.Body>
              </Table.Root>
            </Box>

            {/* Pagination */}
            <Box
              p={4}
              borderTop="1px solid"
              borderColor="gray.200"
              bg="gray.50"
              _dark={{ bg: "gray.800", borderColor: "gray.700" }}
            >
              <Flex
                justify="space-between"
                align="center"
                flexWrap="wrap"
                gap={3}
              >
                <Text
                  fontSize="sm"
                  color="gray.600"
                  _dark={{ color: "gray.400" }}
                >
                  {filteredReceipts.length > 0 ? (
                    <>
                      Showing {filteredReceipts.length} receipt
                      {filteredReceipts.length !== 1 ? "s" : ""} on this page
                      {totalReceipts > receipts.length && (
                        <Text as="span" color="gray.500">
                          {" "}
                          (of {totalReceipts} total for date range:{" "}
                          {formatDateDisplay(appliedFilters.startDate)} -{" "}
                          {formatDateDisplay(appliedFilters.endDate)})
                        </Text>
                      )}
                    </>
                  ) : (
                    <>
                      No receipts found
                      {totalReceipts > 0 && (
                        <Text as="span" color="gray.500">
                          {" "}
                          (try adjusting filters or date range)
                        </Text>
                      )}
                    </>
                  )}
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
                  <Text
                    fontSize="sm"
                    px={2}
                    fontWeight="medium"
                    bg="blue.100"
                    _dark={{ bg: "blue.900" }}
                    borderRadius="md"
                  >
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
                      onClick={() =>
                        selectedReceiptId && handleAttach(selectedReceiptId)
                      }
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
