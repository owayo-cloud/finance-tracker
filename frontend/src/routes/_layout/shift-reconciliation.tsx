import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Icon,
  Input,
  Link,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useMemo, useState } from "react"
import { FiCalendar, FiLock, FiSave, FiUnlock } from "react-icons/fi"
import { ThemedSelect } from "@/components/POS/ThemedSelect"
import { formatCurrency } from "@/components/POS/utils"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"

export const Route = createFileRoute("/_layout/shift-reconciliation")({
  component: ShiftReconciliation,
})

const API_BASE = import.meta.env.VITE_API_URL || ""

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
})

interface TillShift {
  id: string
  shift_type: string
  opening_cash_float: number
  opening_balance?: number
  closing_cash_float?: number
  opening_time: string
  closing_time?: string
  status: string
  opened_by_name?: string
  closed_by_name?: string
}

interface PaymentMethodCount {
  payment_method_id: string
  payment_method_name: string
  system_count: number
}

interface SystemCountsResponse {
  till_shift_id: string
  opening_time: string
  closing_time?: string
  payment_methods: PaymentMethodCount[]
}

function ShiftReconciliation() {
  const { user: currentUser } = useAuth()
  const showToast = useCustomToast()
  const queryClient = useQueryClient()

  const [task, setTask] = useState<"open" | "close">("open")
  const [attach, setAttach] = useState<string>("")
  const [tillCashAccount, setTillCashAccount] = useState<string>("")
  const [tillCashier, setTillCashier] = useState<string>("")
  const [tillSupervisor, setTillSupervisor] = useState<string>("")
  const [supervisorDesc, setSupervisorDesc] = useState<string>("")
  const [supervisorAcc, setSupervisorAcc] = useState<string>("")
  const [workingShift, setWorkingShift] = useState<string>("Morning Shift")
  const [shiftType, setShiftType] = useState<"day" | "night">("day")
  const [openingCashFloat, setOpeningCashFloat] = useState<string>("0.00")
  const [openingBalance, setOpeningBalance] = useState<string>("0.00")
  const [closingCashFloat, setClosingCashFloat] = useState<string>("0.00")
  const [closeDate, setCloseDate] = useState<string>("")
  const [checkApprove, setCheckApprove] = useState<boolean>(false)
  const [notes, setNotes] = useState<string>("")
  const [physicalCounts, setPhysicalCounts] = useState<Record<string, string>>(
    {},
  )
  const [reconciliationNotes, setReconciliationNotes] = useState<string>("")
  const [lastClosedShift, setLastClosedShift] = useState<TillShift | null>(null)
  const [physicalCash, setPhysicalCash] = useState<string>("0.00")
  const [mpesaAtHand, setMpesaAtHand] = useState<string>("0.00")
  const [transferMpesaBal, setTransferMpesaBal] = useState<string>("0.00")
  const [transferMpesaChecked, setTransferMpesaChecked] =
    useState<boolean>(false)
  const [isAttachModalOpen, setIsAttachModalOpen] = useState<boolean>(false)

  // Check till status
  const { data: tillStatus } = useQuery({
    queryKey: ["till-status"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/v1/till/status`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) {
        if (response.status === 404) {
          return { is_open: false }
        }
        throw new Error("Failed to fetch till status")
      }
      return response.json()
    },
    refetchInterval: 5000,
  })

  // Update task based on till status
  useEffect(() => {
    if (tillStatus?.is_open) {
      setTask("close")
    } else {
      setTask("open")
    }
  }, [tillStatus])

  // Get current till if open
  const { data: currentTill } = useQuery({
    queryKey: ["current-till"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/v1/till/current`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error("Failed to fetch current till")
      }
      return response.json() as Promise<TillShift>
    },
    enabled: tillStatus?.is_open === true,
  })

  // Get system counts for reconciliation
  const { data: systemCounts } = useQuery({
    queryKey: ["system-counts"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/v1/till/system-counts`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) {
        throw new Error("Failed to fetch system counts")
      }
      return response.json() as Promise<SystemCountsResponse>
    },
    enabled: tillStatus?.is_open === false && currentTill === null,
  })

  // Get last closed shift
  const { data: lastClosedShiftData } = useQuery({
    queryKey: ["last-closed-shift"],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE}/api/v1/till?status=closed&limit=1`,
        {
          headers: getAuthHeaders(),
        },
      )
      if (!response.ok) {
        return null
      }
      const data = await response.json()
      return data.data && data.data.length > 0 ? data.data[0] : null
    },
    enabled: tillStatus?.is_open === false,
  })

  // Get list of closed tills for "Attach Closed Till" dropdown
  const { data: closedTillsData } = useQuery({
    queryKey: ["closed-tills"],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE}/api/v1/till?status=closed&limit=100`,
        {
          headers: getAuthHeaders(),
        },
      )
      if (!response.ok) {
        return { data: [], count: 0 }
      }
      return response.json() as Promise<{ data: TillShift[]; count: number }>
    },
    enabled: task === "open",
  })

  // Fetch sales data for current shift
  const { data: salesData } = useQuery({
    queryKey: ["shift-sales", currentTill?.id],
    queryFn: async () => {
      if (!currentTill)
        return {
          total_sales: 0,
          cash_sales: 0,
          mpesa_sales: 0,
          pdq_sales: 0,
          equity_sales: 0,
          cheque_sales: 0,
          credit_notes: 0,
        }

      const startDate = new Date(currentTill.opening_time)
      const endDate = currentTill.closing_time
        ? new Date(currentTill.closing_time)
        : new Date()

      const startDateStr = startDate.toISOString().split("T")[0]
      const endDateStr = endDate.toISOString().split("T")[0]

      const response = await fetch(
        `${API_BASE}/api/v1/sales?start_date=${startDateStr}&end_date=${endDateStr}&limit=1000`,
        {
          headers: getAuthHeaders(),
        },
      )
      if (!response.ok) {
        return {
          total_sales: 0,
          cash_sales: 0,
          mpesa_sales: 0,
          pdq_sales: 0,
          equity_sales: 0,
          cheque_sales: 0,
          credit_notes: 0,
        }
      }
      const data = await response.json()
      const sales = data.data || []

      let totalSales = 0
      let cashSales = 0
      let mpesaSales = 0
      let pdqSales = 0
      let equitySales = 0
      let chequeSales = 0

      sales.forEach((sale: any) => {
        const saleDate = new Date(sale.sale_date)
        if (
          saleDate < startDate ||
          (currentTill.closing_time && saleDate > endDate)
        ) {
          return
        }

        const amount = parseFloat(sale.total_amount || 0)
        totalSales += amount

        const pmName = sale.payment_method?.name?.toUpperCase() || ""
        if (pmName.includes("CASH")) {
          cashSales += amount
        } else if (pmName.includes("MPESA")) {
          mpesaSales += amount
        } else if (pmName.includes("PDQ") || pmName.includes("KCB")) {
          pdqSales += amount
        } else if (pmName.includes("EQUITY") || pmName.includes("BANK")) {
          equitySales += amount
        } else if (pmName.includes("CHEQUE")) {
          chequeSales += amount
        }
      })

      return {
        total_sales: totalSales,
        cash_sales: cashSales,
        mpesa_sales: mpesaSales,
        pdq_sales: pdqSales,
        equity_sales: equitySales,
        cheque_sales: chequeSales,
        credit_notes: 0,
      }
    },
    enabled: !!currentTill,
    refetchInterval: 5000,
  })

  // Determine next shift type and set opening balance
  useEffect(() => {
    if (lastClosedShiftData) {
      const lastShift = lastClosedShiftData as TillShift
      setLastClosedShift(lastShift)
      const nextShift = lastShift.shift_type === "day" ? "night" : "day"
      setShiftType(nextShift as "day" | "night")
      setWorkingShift(nextShift === "day" ? "Morning Shift" : "Evening Shift")

      if (lastShift.status === "closed" && lastShift.closing_cash_float) {
        setOpeningBalance(lastShift.closing_cash_float.toString())
      } else {
        setOpeningBalance("0.00")
      }

      // Set attach to previous shift ID
      setAttach(lastShift.id)
    } else {
      setShiftType("day")
      setWorkingShift("Morning Shift")
      setOpeningBalance("0.00")
      setLastClosedShift(null)
      setAttach("")
    }
  }, [lastClosedShiftData])

  // Set current user as cashier
  useEffect(() => {
    if (currentUser?.full_name) {
      setTillCashier(currentUser.full_name)
    }
  }, [currentUser])

  // Set attach to current till ID when closing
  useEffect(() => {
    if (task === "close" && currentTill) {
      setAttach(currentTill.id)
    }
  }, [task, currentTill])

  // Set attach to last closed shift when opening
  useEffect(() => {
    if (task === "open" && lastClosedShiftData && !attach) {
      setAttach(lastClosedShiftData.id)
    }
  }, [task, lastClosedShiftData, attach])

  // Initialize physical counts from system counts
  useEffect(() => {
    if (systemCounts?.payment_methods) {
      const counts: Record<string, string> = {}
      systemCounts.payment_methods.forEach((pm) => {
        counts[pm.payment_method_id] = pm.system_count.toString()
      })
      setPhysicalCounts(counts)

      const cashPM = systemCounts.payment_methods.find((pm) =>
        pm.payment_method_name.toUpperCase().includes("CASH"),
      )
      if (cashPM) {
        setPhysicalCash(cashPM.system_count.toString())
      }

      const mpesaPM = systemCounts.payment_methods.find((pm) =>
        pm.payment_method_name.toUpperCase().includes("MPESA"),
      )
      if (mpesaPM) {
        setMpesaAtHand(mpesaPM.system_count.toString())
      }
    }
  }, [systemCounts])

  // Get current date/time
  const currentDate = useMemo(() => {
    const now = new Date()
    const day = now.getDate().toString().padStart(2, "0")
    const month = now.toLocaleString("en-US", { month: "short" })
    const year = now.getFullYear()
    const hours = now.getHours().toString().padStart(2, "0")
    const minutes = now.getMinutes().toString().padStart(2, "0")
    const seconds = now.getSeconds().toString().padStart(2, "0")
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
  }, [])

  // Set close date when task is close
  useEffect(() => {
    if (task === "close") {
      setCloseDate(currentDate)
    }
  }, [task, currentDate])

  // Open till mutation
  const openTillMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_BASE}/api/v1/till/open`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          shift_type: shiftType,
          opening_cash_float: parseFloat(openingCashFloat) || 0,
          opening_balance:
            openingBalance && parseFloat(openingBalance) > 0
              ? parseFloat(openingBalance)
              : undefined,
          notes: notes || undefined,
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to open till")
      }
      return response.json()
    },
    onSuccess: () => {
      showToast.showSuccessToast("Till opened successfully")
      queryClient.invalidateQueries({ queryKey: ["till-status"] })
      queryClient.invalidateQueries({ queryKey: ["current-till"] })
      queryClient.invalidateQueries({ queryKey: ["last-closed-shift"] })
      setNotes("")
    },
    onError: (error: Error) => {
      showToast.showErrorToast(error.message)
    },
  })

  // Close till mutation
  const closeTillMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `${API_BASE}/api/v1/till/close?closing_cash_float=${parseFloat(closingCashFloat) || 0}`,
        {
          method: "POST",
          headers: getAuthHeaders(),
        },
      )
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to close till")
      }
      return response.json()
    },
    onSuccess: () => {
      showToast.showSuccessToast("Till closed successfully")
      queryClient.invalidateQueries({ queryKey: ["till-status"] })
      queryClient.invalidateQueries({ queryKey: ["current-till"] })
      queryClient.invalidateQueries({ queryKey: ["system-counts"] })
      setClosingCashFloat("0.00")
    },
    onError: (error: Error) => {
      showToast.showErrorToast(error.message)
    },
  })

  // Reconcile mutation
  const reconcileMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_BASE}/api/v1/till/reconcile`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          physical_counts: physicalCounts,
          notes: reconciliationNotes || undefined,
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to reconcile shift")
      }
      return response.json()
    },
    onSuccess: (data) => {
      const varianceType = data.variance_type
      const varianceAmount = Math.abs(data.total_variance)
      if (varianceType === "none") {
        showToast.showSuccessToast(
          "Shift reconciled successfully - No variance",
        )
      } else {
        showToast.showSuccessToast(
          `Shift reconciled - ${varianceType === "shortage" ? "Shortage" : "Overage"}: ${formatCurrency(varianceAmount)}`,
        )
      }
      queryClient.invalidateQueries({ queryKey: ["till-status"] })
      queryClient.invalidateQueries({ queryKey: ["cashier-variances"] })
      setPhysicalCounts({})
      setReconciliationNotes("")
    },
    onError: (error: Error) => {
      showToast.showErrorToast(error.message)
    },
  })

  // Calculate totals
  const grandTotalSales = useMemo(
    () => salesData?.total_sales || 0,
    [salesData],
  )
  const totalPosCNotes = useMemo(
    () => salesData?.credit_notes || 0,
    [salesData],
  )
  const totalNetSales = useMemo(
    () => grandTotalSales - totalPosCNotes,
    [grandTotalSales, totalPosCNotes],
  )
  const totalSalesPaid = useMemo(() => {
    return (
      (salesData?.pdq_sales || 0) +
      (salesData?.equity_sales || 0) +
      (salesData?.cheque_sales || 0)
    )
  }, [salesData])

  // Calculate till management values
  const openingBalanceNum = parseFloat(openingBalance || "0")
  const posCashSales = salesData?.cash_sales || 0
  const tillCbkRcts = 0
  const tillCbkExpenses = 0
  const pendingCbkRcts = 0
  const pendingCbkPymts = 0
  const moneyIn = openingBalanceNum + posCashSales + tillCbkRcts
  const moneyOut = tillCbkExpenses
  const expectedTillBalance = moneyIn - moneyOut
  const physicalCashNum = parseFloat(physicalCash || "0")
  const cashClosingBal = physicalCashNum
  const tillTotalSales = grandTotalSales
  const tillPosCNotes = totalPosCNotes
  const tillNetSales = totalNetSales

  // Calculate Mpesa values
  const mpesaOpeningBal = 0
  const mpesaPosSales = salesData?.mpesa_sales || 0
  const othMpesaSales = 0
  const mpesaExpenses = 0
  const totalMpesaBal =
    mpesaOpeningBal + mpesaPosSales + othMpesaSales - mpesaExpenses
  const mpesaAtHandNum = parseFloat(mpesaAtHand || "0")
  const transferMpesaBalNum = parseFloat(transferMpesaBal || "0")
  const mpesaClosingBal =
    mpesaAtHandNum - (transferMpesaChecked ? transferMpesaBalNum : 0)
  const mpesaNotValidated = totalMpesaBal - mpesaAtHandNum

  const handleSubmit = () => {
    if (task === "open") {
      if (!openingCashFloat || parseFloat(openingCashFloat) < 0) {
        showToast.showErrorToast("Please enter a valid opening cash float")
        return
      }

      if (
        lastClosedShift &&
        lastClosedShift.status !== "reconciled" &&
        (!openingBalance || parseFloat(openingBalance) <= 0)
      ) {
        const confirmed = window.confirm(
          `Warning: The previous shift's money has not been submitted yet. ` +
            `The previous cashier left ${formatCurrency(lastClosedShift.closing_cash_float || 0)}. ` +
            `Are you sure you want to set opening balance to 0?`,
        )
        if (!confirmed) {
          return
        }
      }

      openTillMutation.mutate()
    } else if (task === "close") {
      if (!closingCashFloat || parseFloat(closingCashFloat) < 0) {
        showToast.showErrorToast("Please enter a valid closing cash float")
        return
      }
      closeTillMutation.mutate()
    } else if (systemCounts) {
      if (
        !systemCounts?.payment_methods ||
        systemCounts.payment_methods.length === 0
      ) {
        showToast.showErrorToast("No payment methods found")
        return
      }
      reconcileMutation.mutate()
    }
  }

  return (
    <Container maxW="full" py={4}>
      <Flex gap={4} flexDirection={{ base: "column", lg: "row" }}>
        {/* Left Section - Form Inputs */}
        <Box
          flex="1"
          bg="bg.surface"
          borderRadius="lg"
          p={6}
          border="1px solid"
          borderColor="border.card"
        >
          <VStack gap={2} align="stretch">
            {/* Task Selection */}
            <Box>
              <Text
                fontSize="sm"
                fontWeight="medium"
                mb={1}
                color="text.primary"
              >
                Task{" "}
                <Text as="span" color={{ base: "#ef4444", _light: "#ef4444" }}>
                  *
                </Text>
              </Text>
              <ThemedSelect
                value={task}
                onChange={(value) => setTask(value as "open" | "close")}
                aria-label="Task"
                title="Task"
                disabled={tillStatus?.is_open && task === "open"}
              >
                <option value="open">Open Till</option>
                <option value="close">Close Till</option>
              </ThemedSelect>
            </Box>

            {/* Conditional Attach field */}
            <Box>
              <Text
                fontSize="sm"
                fontWeight="medium"
                mb={1}
                color={{ base: "#06b6d4", _light: "#06b6d4" }}
              >
                {task === "open" ? "Attach Closed Till" : "Attach Open Till"}{" "}
                <Text as="span" color={{ base: "#ef4444", _light: "#ef4444" }}>
                  *
                </Text>
              </Text>
              {task === "open" ? (
                attach &&
                closedTillsData?.data?.find((till) => till.id === attach) ? (
                  <Box
                    p={2}
                    border="1px solid"
                    borderColor="border.card"
                    borderRadius="md"
                    bg="bg.surface"
                  >
                    <Text fontSize="sm" color="text.primary">
                      {(() => {
                        const selectedTill = closedTillsData.data.find(
                          (till) => till.id === attach,
                        )!
                        const openDate = new Date(selectedTill.opening_time)
                        const dateStr = openDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                        const timeStr = openDate.toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                        const shiftType =
                          selectedTill.shift_type === "day" ? "Day" : "Night"
                        const cashierName =
                          selectedTill.opened_by_name || "Unknown"
                        const status =
                          selectedTill.status === "reconciled"
                            ? "Reconciled"
                            : "Closed"
                        return `${dateStr} ${timeStr} - ${shiftType} Shift (${cashierName}) - ${status}`
                      })()}
                    </Text>
                  </Box>
                ) : (
                  <DialogRoot
                    open={isAttachModalOpen}
                    onOpenChange={({ open }) => setIsAttachModalOpen(open)}
                  >
                    <DialogTrigger asChild>
                      <Link
                        as="button"
                        type="button"
                        color={{ base: "#06b6d4", _light: "#06b6d4" }}
                        textDecoration="underline"
                        cursor="pointer"
                        fontSize="sm"
                        _hover={{
                          color: { base: "#0891b2", _light: "#0891b2" },
                        }}
                      >
                        Click to select a closed till...
                      </Link>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Select Closed Till</DialogTitle>
                      </DialogHeader>
                      <DialogBody>
                        <VStack
                          gap={2}
                          align="stretch"
                          maxH="400px"
                          overflowY="auto"
                        >
                          {closedTillsData?.data &&
                          closedTillsData.data.length > 0 ? (
                            closedTillsData.data.map((till) => {
                              const openDate = new Date(till.opening_time)
                              const dateStr = openDate.toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )
                              const timeStr = openDate.toLocaleTimeString(
                                "en-US",
                                { hour: "2-digit", minute: "2-digit" },
                              )
                              const shiftType =
                                till.shift_type === "day" ? "Day" : "Night"
                              const cashierName =
                                till.opened_by_name || "Unknown"
                              const status =
                                till.status === "reconciled"
                                  ? "Reconciled"
                                  : "Closed"
                              const isSelected = attach === till.id
                              return (
                                <Box
                                  key={till.id}
                                  p={3}
                                  border="1px solid"
                                  borderColor={
                                    isSelected
                                      ? { base: "#06b6d4", _light: "#06b6d4" }
                                      : "border.card"
                                  }
                                  borderRadius="md"
                                  bg={
                                    isSelected
                                      ? {
                                          base: "rgba(6, 182, 212, 0.1)",
                                          _light: "rgba(6, 182, 212, 0.05)",
                                        }
                                      : "bg.surface"
                                  }
                                  cursor="pointer"
                                  onClick={() => {
                                    setAttach(till.id)
                                    // Update opening balance when a closed till is selected
                                    if (till.closing_cash_float) {
                                      setOpeningBalance(
                                        till.closing_cash_float.toString(),
                                      )
                                    }
                                    // Determine next shift type
                                    const nextShift =
                                      till.shift_type === "day"
                                        ? "night"
                                        : "day"
                                    setShiftType(nextShift as "day" | "night")
                                    setWorkingShift(
                                      nextShift === "day"
                                        ? "Morning Shift"
                                        : "Evening Shift",
                                    )
                                    setIsAttachModalOpen(false)
                                  }}
                                  _hover={{
                                    bg: {
                                      base: "rgba(6, 182, 212, 0.1)",
                                      _light: "rgba(6, 182, 212, 0.05)",
                                    },
                                  }}
                                >
                                  <Text
                                    fontSize="sm"
                                    fontWeight={isSelected ? "bold" : "medium"}
                                    color="text.primary"
                                  >
                                    {dateStr} {timeStr} - {shiftType} Shift
                                  </Text>
                                  <Text fontSize="xs" color="text.secondary">
                                    Cashier: {cashierName} | Status: {status}
                                  </Text>
                                  {till.closing_cash_float && (
                                    <Text fontSize="xs" color="text.secondary">
                                      Closing Balance:{" "}
                                      {formatCurrency(till.closing_cash_float)}
                                    </Text>
                                  )}
                                </Box>
                              )
                            })
                          ) : (
                            <Text fontSize="sm" color="text.secondary">
                              No closed tills available
                            </Text>
                          )}
                        </VStack>
                      </DialogBody>
                      <DialogFooter>
                        <DialogActionTrigger asChild>
                          <Button variant="subtle" colorPalette="gray">
                            Close
                          </Button>
                        </DialogActionTrigger>
                      </DialogFooter>
                      <DialogCloseTrigger />
                    </DialogContent>
                  </DialogRoot>
                )
              ) : attach && currentTill ? (
                <Box
                  p={2}
                  border="1px solid"
                  borderColor="border.card"
                  borderRadius="md"
                  bg="bg.surface"
                >
                  <Text fontSize="sm" color="text.primary">
                    {(() => {
                      const openDate = new Date(currentTill.opening_time)
                      const dateStr = openDate.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                      const timeStr = openDate.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                      const shiftType =
                        currentTill.shift_type === "day" ? "Day" : "Night"
                      const cashierName =
                        currentTill.opened_by_name || "Unknown"
                      return `${dateStr} ${timeStr} - ${shiftType} Shift (${cashierName})`
                    })()}
                  </Text>
                </Box>
              ) : (
                <Link
                  as="button"
                  type="button"
                  color={
                    currentTill
                      ? { base: "#06b6d4", _light: "#06b6d4" }
                      : "text.secondary"
                  }
                  textDecoration="underline"
                  cursor={currentTill && !attach ? "pointer" : "not-allowed"}
                  fontSize="sm"
                  opacity={currentTill && !attach ? 1 : 0.5}
                  _hover={
                    currentTill && !attach
                      ? { color: { base: "#0891b2", _light: "#0891b2" } }
                      : {}
                  }
                  _disabled={{ opacity: 0.5, cursor: "not-allowed" }}
                  onClick={() => {
                    if (currentTill && !attach) {
                      setAttach(currentTill.id)
                    }
                  }}
                >
                  {currentTill
                    ? "Click to select open till..."
                    : "No till currently open"}
                </Link>
              )}
            </Box>

            {/* Till Cash Account (only for Open) */}
            {task === "open" && (
              <Box>
                <Text
                  fontSize="sm"
                  fontWeight="medium"
                  mb={1}
                  color="text.primary"
                >
                  Till Cash Account{" "}
                  <Text
                    as="span"
                    color={{ base: "#ef4444", _light: "#ef4444" }}
                  >
                    *
                  </Text>
                </Text>
                <Input
                  value={tillCashAccount}
                  onChange={(e) => setTillCashAccount(e.target.value)}
                  placeholder=""
                  bg="bg.surface"
                  borderColor="input.border"
                  color="text.primary"
                  _focus={{
                    borderColor: { base: "#14b8a6", _light: "#14b8a6" },
                    boxShadow: {
                      base: "0 0 0 1px #14b8a6",
                      _light: "0 0 0 1px #14b8a6",
                    },
                  }}
                />
              </Box>
            )}

            {/* Till Cashier */}
            <Box>
              <Text
                fontSize="sm"
                fontWeight="medium"
                mb={1}
                color="text.primary"
              >
                Till Cashier{" "}
                <Text as="span" color={{ base: "#ef4444", _light: "#ef4444" }}>
                  *
                </Text>
              </Text>
              <Input
                value={tillCashier}
                onChange={(e) => setTillCashier(e.target.value)}
                placeholder=""
                bg="bg.surface"
                borderColor="input.border"
                color="text.primary"
                _focus={{
                  borderColor: { base: "#14b8a6", _light: "#14b8a6" },
                  boxShadow: {
                    base: "0 0 0 1px #14b8a6",
                    _light: "0 0 0 1px #14b8a6",
                  },
                }}
              />
            </Box>

            {/* Till Supervisor */}
            <Box>
              <Text
                fontSize="sm"
                fontWeight="medium"
                mb={1}
                color="text.primary"
              >
                Till Supervisor{" "}
                <Text as="span" color={{ base: "#ef4444", _light: "#ef4444" }}>
                  *
                </Text>
              </Text>
              <Input
                value={tillSupervisor}
                onChange={(e) => setTillSupervisor(e.target.value)}
                placeholder=""
                bg="bg.surface"
                borderColor="input.border"
                color="text.primary"
                _focus={{
                  borderColor: { base: "#14b8a6", _light: "#14b8a6" },
                  boxShadow: {
                    base: "0 0 0 1px #14b8a6",
                    _light: "0 0 0 1px #14b8a6",
                  },
                }}
              />
            </Box>

            {/* Supervisor Desc */}
            <Box>
              <Text
                fontSize="sm"
                fontWeight="medium"
                mb={1}
                color="text.primary"
              >
                Supervisor Desc
              </Text>
              <Input
                value={supervisorDesc}
                onChange={(e) => setSupervisorDesc(e.target.value)}
                placeholder=""
                bg="bg.surface"
                borderColor="input.border"
                color="text.primary"
                _focus={{
                  borderColor: { base: "#14b8a6", _light: "#14b8a6" },
                  boxShadow: {
                    base: "0 0 0 1px #14b8a6",
                    _light: "0 0 0 1px #14b8a6",
                  },
                }}
              />
            </Box>

            {/* Supervisor Acc */}
            <Box>
              <Text
                fontSize="sm"
                fontWeight="medium"
                mb={1}
                color="text.primary"
              >
                Supervisor Acc
              </Text>
              <Input
                value={supervisorAcc}
                onChange={(e) => setSupervisorAcc(e.target.value)}
                placeholder=""
                bg="bg.surface"
                borderColor="input.border"
                color="text.primary"
                _focus={{
                  borderColor: { base: "#14b8a6", _light: "#14b8a6" },
                  boxShadow: {
                    base: "0 0 0 1px #14b8a6",
                    _light: "0 0 0 1px #14b8a6",
                  },
                }}
              />
            </Box>

            {/* Working Shift */}
            <Box>
              <Text
                fontSize="sm"
                fontWeight="medium"
                mb={1}
                color="text.primary"
              >
                Working Shift{" "}
                <Text as="span" color={{ base: "#ef4444", _light: "#ef4444" }}>
                  *
                </Text>
              </Text>
              <ThemedSelect
                value={workingShift}
                onChange={(value) => {
                  setWorkingShift(value)
                  setShiftType(value === "Morning Shift" ? "day" : "night")
                }}
                aria-label="Working Shift"
                title="Working Shift"
                disabled={task === "close"}
              >
                <option value="Morning Shift">Morning Shift</option>
                <option value="Evening Shift">Evening Shift</option>
              </ThemedSelect>
            </Box>

            {/* Transaction Date */}
            <Box>
              <Text
                fontSize="sm"
                fontWeight="medium"
                mb={1}
                color="text.primary"
              >
                Transaction Date
              </Text>
              <Input
                value={currentDate}
                readOnly
                bg="bg.surface"
                borderColor="input.border"
                color="text.primary"
              />
            </Box>

            {/* Create Date */}
            <Box>
              <Text
                fontSize="sm"
                fontWeight="medium"
                mb={1}
                color="text.primary"
              >
                Create Date{" "}
                <Text as="span" color={{ base: "#ef4444", _light: "#ef4444" }}>
                  *
                </Text>
              </Text>
              <Input
                value={currentDate}
                readOnly
                bg="bg.surface"
                borderColor="input.border"
                color="text.primary"
              />
            </Box>

            {/* Close Date (only for Close Till) */}
            {task === "close" && (
              <Box>
                <Text
                  fontSize="sm"
                  fontWeight="medium"
                  mb={1}
                  color="text.primary"
                >
                  Close Date{" "}
                  <Text
                    as="span"
                    color={{ base: "#ef4444", _light: "#ef4444" }}
                  >
                    *
                  </Text>
                </Text>
                <HStack gap={2}>
                  <Input
                    value={closeDate}
                    onChange={(e) => setCloseDate(e.target.value)}
                    placeholder=""
                    flex={1}
                    bg="bg.surface"
                    borderColor="input.border"
                    color="text.primary"
                    _focus={{
                      borderColor: { base: "#14b8a6", _light: "#14b8a6" },
                      boxShadow: {
                        base: "0 0 0 1px #14b8a6",
                        _light: "0 0 0 1px #14b8a6",
                      },
                    }}
                  />
                  <Button
                    size="sm"
                    bg={{ base: "#06b6d4", _light: "#06b6d4" }}
                    color="white"
                    _hover={{ bg: { base: "#0891b2", _light: "#0891b2" } }}
                    onClick={() => setCloseDate(currentDate)}
                  >
                    <Icon as={FiCalendar} />
                  </Button>
                </HStack>
                <HStack gap={2} mt={2}>
                  <Checkbox
                    checked={checkApprove}
                    onCheckedChange={({ checked }) =>
                      setCheckApprove(checked as boolean)
                    }
                  />
                  <Text fontSize="sm" color="text.primary">
                    Check
                  </Text>
                </HStack>
              </Box>
            )}

            {/* Opening Balance (only for Open Till) */}
            {task === "open" && (
              <Box>
                <Text
                  fontSize="sm"
                  fontWeight="medium"
                  mb={1}
                  color="text.primary"
                >
                  Opening Balance (Left by Previous Cashier){" "}
                  <Text
                    as="span"
                    color={
                      lastClosedShift && lastClosedShift.status !== "reconciled"
                        ? { base: "#ef4444", _light: "#ef4444" }
                        : "text.secondary"
                    }
                  >
                    {lastClosedShift && lastClosedShift.status !== "reconciled"
                      ? "(Required)"
                      : "(Optional)"}
                  </Text>
                </Text>
                <Input
                  type="number"
                  step="0.01"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  placeholder="0.00"
                  bg="bg.surface"
                  borderColor={
                    lastClosedShift &&
                    lastClosedShift.status !== "reconciled" &&
                    (!openingBalance || parseFloat(openingBalance) <= 0)
                      ? { base: "#f59e0b", _light: "#f59e0b" }
                      : "input.border"
                  }
                  color="text.primary"
                  _focus={{
                    borderColor: { base: "#14b8a6", _light: "#14b8a6" },
                    boxShadow: {
                      base: "0 0 0 1px #14b8a6",
                      _light: "0 0 0 1px #14b8a6",
                    },
                  }}
                />
              </Box>
            )}

            {/* Opening Cash Float (only for Open Till) */}
            {task === "open" && (
              <Box>
                <Text
                  fontSize="sm"
                  fontWeight="medium"
                  mb={1}
                  color="text.primary"
                >
                  Opening Cash Float{" "}
                  <Text
                    as="span"
                    color={{ base: "#ef4444", _light: "#ef4444" }}
                  >
                    *
                  </Text>
                </Text>
                <Input
                  type="number"
                  step="0.01"
                  value={openingCashFloat}
                  onChange={(e) => setOpeningCashFloat(e.target.value)}
                  placeholder="0.00"
                  bg="bg.surface"
                  borderColor="input.border"
                  color="text.primary"
                  _focus={{
                    borderColor: { base: "#14b8a6", _light: "#14b8a6" },
                    boxShadow: {
                      base: "0 0 0 1px #14b8a6",
                      _light: "0 0 0 1px #14b8a6",
                    },
                  }}
                />
              </Box>
            )}

            {/* Closing Cash Float (only for Close Till) */}
            {task === "close" && (
              <Box>
                <Text
                  fontSize="sm"
                  fontWeight="medium"
                  mb={1}
                  color="text.primary"
                >
                  Closing Cash Float{" "}
                  <Text
                    as="span"
                    color={{ base: "#ef4444", _light: "#ef4444" }}
                  >
                    *
                  </Text>
                </Text>
                <Input
                  type="number"
                  step="0.01"
                  value={closingCashFloat}
                  onChange={(e) => setClosingCashFloat(e.target.value)}
                  placeholder="0.00"
                  bg="bg.surface"
                  borderColor="input.border"
                  color="text.primary"
                  _focus={{
                    borderColor: { base: "#14b8a6", _light: "#14b8a6" },
                    boxShadow: {
                      base: "0 0 0 1px #14b8a6",
                      _light: "0 0 0 1px #14b8a6",
                    },
                  }}
                />
              </Box>
            )}

            {/* Physical Cash and MPESA (for reconciliation) */}
            {systemCounts &&
              task !== "open" &&
              task !== "close" &&
              systemCounts.payment_methods.map((pm) => {
                const isCash = pm.payment_method_name
                  .toUpperCase()
                  .includes("CASH")
                const isMpesa = pm.payment_method_name
                  .toUpperCase()
                  .includes("MPESA")

                if (!isCash && !isMpesa) return null

                return (
                  <Box key={pm.payment_method_id}>
                    <Text
                      fontSize="sm"
                      fontWeight="medium"
                      mb={1}
                      color="text.primary"
                    >
                      Physical {pm.payment_method_name}
                    </Text>
                    <Input
                      type="number"
                      step="0.01"
                      value={isCash ? physicalCash : mpesaAtHand}
                      onChange={(e) => {
                        if (isCash) {
                          setPhysicalCash(e.target.value)
                          setPhysicalCounts({
                            ...physicalCounts,
                            [pm.payment_method_id]: e.target.value,
                          })
                        } else {
                          setMpesaAtHand(e.target.value)
                          setPhysicalCounts({
                            ...physicalCounts,
                            [pm.payment_method_id]: e.target.value,
                          })
                        }
                      }}
                      placeholder="0.00"
                      bg="bg.surface"
                      borderColor="input.border"
                      color="text.primary"
                      _focus={{
                        borderColor: { base: "#14b8a6", _light: "#14b8a6" },
                        boxShadow: {
                          base: "0 0 0 1px #14b8a6",
                          _light: "0 0 0 1px #14b8a6",
                        },
                      }}
                    />
                  </Box>
                )
              })}

            {/* GRAND TOTAL Section */}
            <Box
              mt={2}
              p={4}
              bg={{ base: "rgba(255, 255, 255, 0.05)", _light: "#f9fafb" }}
              borderRadius="md"
            >
              <Text fontSize="sm" fontWeight="bold" mb={2} color="text.primary">
                GRAND TOTAL
              </Text>
              <VStack gap={1} align="stretch">
                <HStack justify="space-between">
                  <Text fontSize="sm" color="text.primary">
                    GRAND TOTAL SALES
                  </Text>
                  <Text
                    fontSize="sm"
                    fontWeight="bold"
                    color="text.primary"
                    textAlign="right"
                  >
                    {formatCurrency(grandTotalSales)}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm" color="text.primary">
                    TOTAL POS CNOTES
                  </Text>
                  <Text
                    fontSize="sm"
                    fontWeight="bold"
                    color="text.primary"
                    textAlign="right"
                  >
                    {formatCurrency(totalPosCNotes)}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm" color="text.primary">
                    TOTAL NET SALES
                  </Text>
                  <Text
                    fontSize="sm"
                    fontWeight="bold"
                    color="text.primary"
                    textAlign="right"
                  >
                    {formatCurrency(totalNetSales)}
                  </Text>
                </HStack>
              </VStack>
            </Box>

            {/* OTHER PAYMENT DETAILS Section */}
            <Box
              mt={2}
              p={4}
              bg={{ base: "rgba(255, 255, 255, 0.05)", _light: "#f9fafb" }}
              borderRadius="md"
            >
              <Text fontSize="sm" fontWeight="bold" mb={2} color="text.primary">
                OTHER PAYMENT DETAILS
              </Text>
              <VStack gap={1} align="stretch">
                <HStack justify="space-between">
                  <Text fontSize="sm" color="text.primary">
                    PDQ Sales
                  </Text>
                  <Text
                    fontSize="sm"
                    fontWeight="bold"
                    color="text.primary"
                    textAlign="right"
                  >
                    {formatCurrency(salesData?.pdq_sales || 0)}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm" color="text.primary">
                    Equity Sales
                  </Text>
                  <Text
                    fontSize="sm"
                    fontWeight="bold"
                    color="text.primary"
                    textAlign="right"
                  >
                    {formatCurrency(salesData?.equity_sales || 0)}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm" color="text.primary">
                    Cheque Sales
                  </Text>
                  <Text
                    fontSize="sm"
                    fontWeight="bold"
                    color="text.primary"
                    textAlign="right"
                  >
                    {formatCurrency(salesData?.cheque_sales || 0)}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm" fontWeight="bold" color="text.primary">
                    TOTAL SALES PAID
                  </Text>
                  <Text
                    fontSize="sm"
                    fontWeight="bold"
                    color="text.primary"
                    textAlign="right"
                  >
                    {formatCurrency(totalSalesPaid)}
                  </Text>
                </HStack>
              </VStack>
            </Box>

            {/* Remarks */}
            <Box>
              <Text
                fontSize="sm"
                fontWeight="medium"
                mb={1}
                color="text.primary"
              >
                Remarks
              </Text>
              <Textarea
                value={task === "open" ? notes : reconciliationNotes}
                onChange={(e) => {
                  if (task === "open") {
                    setNotes(e.target.value)
                  } else {
                    setReconciliationNotes(e.target.value)
                  }
                }}
                placeholder=""
                rows={4}
                bg="bg.surface"
                borderColor="input.border"
                color="text.primary"
                _focus={{
                  borderColor: { base: "#14b8a6", _light: "#14b8a6" },
                  boxShadow: {
                    base: "0 0 0 1px #14b8a6",
                    _light: "0 0 0 1px #14b8a6",
                  },
                }}
              />
            </Box>

            {/* Submit Button */}
            <Button
              bg={{ base: "#06b6d4", _light: "#06b6d4" }}
              color="white"
              _hover={{ bg: { base: "#0891b2", _light: "#0891b2" } }}
              onClick={handleSubmit}
              loading={
                openTillMutation.isPending ||
                closeTillMutation.isPending ||
                reconcileMutation.isPending
              }
              disabled={
                (task === "open" &&
                  (!openingCashFloat || parseFloat(openingCashFloat) < 0)) ||
                (task === "close" &&
                  (!closingCashFloat || parseFloat(closingCashFloat) < 0))
              }
              w="full"
              mt={2}
            >
              <Icon
                as={
                  task === "open"
                    ? FiUnlock
                    : task === "close"
                      ? FiLock
                      : FiSave
                }
                mr={2}
              />
              {task === "open"
                ? "Open"
                : task === "close"
                  ? "Close"
                  : "Reconcile"}
            </Button>
          </VStack>
        </Box>

        {/* Middle Section - Till Management Summary */}
        <Box
          flex="1"
          bg="bg.surface"
          borderRadius="lg"
          p={6}
          border="1px solid"
          borderColor="border.card"
        >
          <Heading size="md" mb={4} color="text.primary">
            TILL MANAGEMENT
          </Heading>

          {task === "open" ? (
            <VStack gap={2} align="stretch">
              <HStack justify="space-between">
                <Text fontSize="sm" color="text.primary">
                  Cash Opening Bal
                </Text>
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color="text.primary"
                  textAlign="right"
                >
                  {formatCurrency(openingBalanceNum)}
                </Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="sm" color="text.primary">
                  Mpesa Opening Bal
                </Text>
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color="text.primary"
                  textAlign="right"
                >
                  {formatCurrency(mpesaOpeningBal)}
                </Text>
              </HStack>
            </VStack>
          ) : (
            <VStack gap={2} align="stretch">
              <HStack justify="space-between">
                <Text fontSize="sm" color="text.primary">
                  Opening Balance
                </Text>
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color="text.primary"
                  textAlign="right"
                >
                  {formatCurrency(openingBalanceNum)}
                </Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="sm" color="text.primary">
                  POS Cash Sales
                </Text>
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color="text.primary"
                  textAlign="right"
                >
                  {formatCurrency(posCashSales)}
                </Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="sm" color="text.primary">
                  Till Cbk Rcts
                </Text>
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color="text.primary"
                  textAlign="right"
                >
                  {formatCurrency(tillCbkRcts)}
                </Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="sm" color="text.primary">
                  Till Cbk Expenses
                </Text>
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color="text.primary"
                  textAlign="right"
                >
                  {formatCurrency(tillCbkExpenses)}
                </Text>
              </HStack>
              <HStack justify="space-between">
                <Text
                  fontSize="sm"
                  color={{ base: "#ef4444", _light: "#ef4444" }}
                >
                  Pending Cbk Rcts
                </Text>
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color={{ base: "#ef4444", _light: "#ef4444" }}
                  textAlign="right"
                >
                  {formatCurrency(pendingCbkRcts)}
                </Text>
              </HStack>
              <HStack justify="space-between">
                <Text
                  fontSize="sm"
                  color={{ base: "#ef4444", _light: "#ef4444" }}
                >
                  Pending Cbk Pymts
                </Text>
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color={{ base: "#ef4444", _light: "#ef4444" }}
                  textAlign="right"
                >
                  {formatCurrency(pendingCbkPymts)}
                </Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="sm" color="text.primary">
                  Money In
                </Text>
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color="text.primary"
                  textAlign="right"
                >
                  {formatCurrency(moneyIn)}
                </Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="sm" color="text.primary">
                  Money Out
                </Text>
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color="text.primary"
                  textAlign="right"
                >
                  {formatCurrency(moneyOut)}
                </Text>
              </HStack>
              <HStack justify="space-between">
                <Text
                  fontSize="sm"
                  color={{ base: "#3b82f6", _light: "#3b82f6" }}
                  fontWeight="bold"
                >
                  Expected Till Balance
                </Text>
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color={{ base: "#3b82f6", _light: "#3b82f6" }}
                  textAlign="right"
                >
                  {formatCurrency(expectedTillBalance)}
                </Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="sm" color="text.primary">
                  Physical Cash
                </Text>
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color="text.primary"
                  textAlign="right"
                >
                  {formatCurrency(physicalCashNum)}
                </Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="sm" color="text.primary">
                  Cash Closing Bal
                </Text>
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color="text.primary"
                  textAlign="right"
                >
                  {formatCurrency(cashClosingBal)}
                </Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="sm" color="text.primary">
                  Till Total Sales
                </Text>
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color="text.primary"
                  textAlign="right"
                >
                  {formatCurrency(tillTotalSales)}
                </Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="sm" color="text.primary">
                  Till POS CNotes
                </Text>
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color="text.primary"
                  textAlign="right"
                >
                  {formatCurrency(tillPosCNotes)}
                </Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="sm" color="text.primary">
                  Till Net Sales
                </Text>
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color="text.primary"
                  textAlign="right"
                >
                  {formatCurrency(tillNetSales)}
                </Text>
              </HStack>
            </VStack>
          )}
        </Box>

        {/* Right Section - MPESA Summary (only for Close Till) */}
        {task === "close" && (
          <Box
            flex="1"
            bg="bg.surface"
            borderRadius="lg"
            p={6}
            border="1px solid"
            borderColor="border.card"
          >
            <Heading size="md" mb={4} color="text.primary">
              MPESA SUMMARY
            </Heading>
            <VStack gap={2} align="stretch">
              <HStack justify="space-between">
                <Text fontSize="sm" color="text.primary">
                  Mpesa Opening Bal
                </Text>
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color="text.primary"
                  textAlign="right"
                >
                  {formatCurrency(mpesaOpeningBal)}
                </Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="sm" color="text.primary">
                  Mpesa POS Sales
                </Text>
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color="text.primary"
                  textAlign="right"
                >
                  {formatCurrency(mpesaPosSales)}
                </Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="sm" color="text.primary">
                  Oth.Mpesa Sales
                </Text>
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color="text.primary"
                  textAlign="right"
                >
                  {formatCurrency(othMpesaSales)}
                </Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="sm" color="text.primary">
                  Mpesa Expenses
                </Text>
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color="text.primary"
                  textAlign="right"
                >
                  {formatCurrency(mpesaExpenses)}
                </Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="sm" color="text.primary">
                  Total Mpesa Bal
                </Text>
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color="text.primary"
                  textAlign="right"
                >
                  {formatCurrency(totalMpesaBal)}
                </Text>
              </HStack>
              <HStack justify="space-between">
                <Text
                  fontSize="sm"
                  color={{ base: "#10b981", _light: "#10b981" }}
                  fontWeight="bold"
                >
                  MPESA (At Hand)
                </Text>
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color={{ base: "#10b981", _light: "#10b981" }}
                  textAlign="right"
                >
                  {formatCurrency(mpesaAtHandNum)}
                </Text>
              </HStack>
              <HStack gap={2} align="center" justify="space-between">
                <HStack gap={2}>
                  <Checkbox
                    checked={transferMpesaChecked}
                    onCheckedChange={({ checked }) =>
                      setTransferMpesaChecked(checked as boolean)
                    }
                  />
                  <Text fontSize="sm" color="text.primary">
                    TransferMpesaBal
                  </Text>
                </HStack>
                <Input
                  type="number"
                  step="0.01"
                  value={transferMpesaBal}
                  onChange={(e) => setTransferMpesaBal(e.target.value)}
                  placeholder="0.00"
                  size="sm"
                  w="100px"
                  bg="bg.surface"
                  borderColor="input.border"
                  color="text.primary"
                  disabled={!transferMpesaChecked}
                  textAlign="right"
                  _focus={{
                    borderColor: { base: "#14b8a6", _light: "#14b8a6" },
                    boxShadow: {
                      base: "0 0 0 1px #14b8a6",
                      _light: "0 0 0 1px #14b8a6",
                    },
                  }}
                />
              </HStack>
              <HStack justify="space-between">
                <Text
                  fontSize="sm"
                  color={{ base: "#10b981", _light: "#10b981" }}
                  fontWeight="bold"
                >
                  MPESA Closing Bal
                </Text>
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color={{ base: "#10b981", _light: "#10b981" }}
                  textAlign="right"
                >
                  {formatCurrency(mpesaClosingBal)}
                </Text>
              </HStack>
              <HStack justify="space-between">
                <Text
                  fontSize="sm"
                  color={{ base: "#ef4444", _light: "#ef4444" }}
                  fontWeight="bold"
                >
                  MPESA Not Validated
                </Text>
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color={{ base: "#ef4444", _light: "#ef4444" }}
                  textAlign="right"
                >
                  {formatCurrency(mpesaNotValidated)}
                </Text>
              </HStack>
            </VStack>
          </Box>
        )}
      </Flex>

      {/* Footer */}
      <Box py={2} textAlign="right" mt={4} fontSize="xs" color="text.secondary">
        © Wiseman Palace : Developed by Owayo
      </Box>
    </Container>
  )
}
