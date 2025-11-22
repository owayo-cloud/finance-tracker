import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Box, Container, Heading, Text, Flex, HStack, VStack, Input, Button, Icon } from "@chakra-ui/react"
import { Checkbox } from "@/components/ui/checkbox"
import { useState, useEffect } from "react"
import { ThemedSelect } from "@/components/POS/ThemedSelect"
import { formatCurrency } from "@/components/POS/utils"
import { FiRefreshCw, FiSave, FiFolder, FiHome } from "react-icons/fi"
import useAuth from "@/hooks/useAuth"
import { useQuery } from "@tanstack/react-query"
import { UsersService } from "@/client"
import useCustomToast from "@/hooks/useCustomToast"

export const Route = createFileRoute("/_layout/shift-reconciliation")({
  component: ShiftReconciliation,
})

function ShiftReconciliation() {
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()
  const showToast = useCustomToast()
  
  const [task, setTask] = useState<string>("Open Till")
  const [attach, setAttach] = useState<string>("")
  const [tillCashier, setTillCashier] = useState<string>("")
  const [tillSupervisor, setTillSupervisor] = useState<string>("")
  const [supervisorDesc, setSupervisorDesc] = useState<string>("")
  const [supervisorAcc, setSupervisorAcc] = useState<string>("")
  const [workingShift, setWorkingShift] = useState<string>("Morning Shift")
  const [transferMpesaBal, setTransferMpesaBal] = useState<boolean>(false)

  // Fetch admin users for supervisor
  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: () => UsersService.readUsers({ limit: 100 }),
  })

  // Get today's date for cash summary
  const today = new Date()
  const todayDateStr = today.toISOString().split("T")[0]

  // Fetch cash summary from backend
  const { data: cashSummary } = useQuery({
    queryKey: ["cash-summary", todayDateStr],
    queryFn: async () => {
      const token = localStorage.getItem("access_token") || ""
      const apiBase = import.meta.env.VITE_API_URL || ""
      const response = await fetch(`${apiBase}/api/v1/shift-reconciliation/current/cash-summary?start_date=${todayDateStr}&end_date=${todayDateStr}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        throw new Error("Failed to fetch cash summary")
      }
      return response.json()
    },
  })

  // Use backend-calculated values
  const physicalCash = cashSummary?.cash_sales || 0
  const grandTotalSales = cashSummary?.total_sales || 0

  // Auto-fill cashier and supervisor
  useEffect(() => {
    if (currentUser) {
      // Set cashier to current logged in user
      setTillCashier(currentUser.full_name || currentUser.email || "")
      
      // Set supervisor to first admin user found, or current user if they're admin
      if (usersData?.data) {
        const adminUser = usersData.data.find(u => u.is_superuser)
        if (adminUser) {
          setTillSupervisor(adminUser.full_name || adminUser.email || "")
        } else if (currentUser.is_superuser) {
          setTillSupervisor(currentUser.full_name || currentUser.email || "")
        }
      } else if (currentUser.is_superuser) {
        setTillSupervisor(currentUser.full_name || currentUser.email || "")
      }
    }
  }, [currentUser, usersData])

  // Get current date/time
  const now = new Date()
  const transactionDate = `${now.getDate().toString().padStart(2, '0')}/${now.toLocaleString('en-US', { month: 'short' })}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`

  // Button handlers
  const handleReset = () => {
    setTask("Open Till")
    setAttach("")
    setSupervisorDesc("")
    setSupervisorAcc("")
    setWorkingShift("Morning Shift")
    setTransferMpesaBal(false)
    // Reset cashier and supervisor to defaults
    if (currentUser) {
      setTillCashier(currentUser.full_name || currentUser.email || "")
      if (usersData?.data) {
        const adminUser = usersData.data.find(u => u.is_superuser)
        if (adminUser) {
          setTillSupervisor(adminUser.full_name || adminUser.email || "")
        } else if (currentUser.is_superuser) {
          setTillSupervisor(currentUser.full_name || currentUser.email || "")
        }
      }
    }
    showToast.showSuccessToast("Form reset successfully")
  }

  const handleSave = () => {
    // TODO: Implement save functionality
    if (!tillCashier || !tillSupervisor) {
      showToast.showErrorToast("Please fill in all required fields")
      return
    }
    showToast.showSuccessToast("Shift reconciliation saved successfully")
  }

  const handleList = () => {
    // TODO: Navigate to list of shift reconciliations
    showToast.showSuccessToast("List view coming soon")
  }

  const handleClose = () => {
    navigate({ to: "/" })
  }

  return (
    <Container maxW="full" py={6}>
      <Heading 
        size="lg" 
        mb={6}
        color={{ base: "#ffffff", _light: "#1a1d29" }}
      >
        POS Till Management-Create
      </Heading>

      <Flex gap={6} flexDirection={{ base: "column", lg: "row" }}>
        {/* Left Panel */}
        <Box flex={1} bg="bg.surface" borderRadius="lg" p={6} border="1px solid" borderColor="border.card">
          <VStack gap={4} align="stretch">
            {/* Task Selection */}
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2} color={{ base: "#ffffff", _light: "#1a1d29" }}>
                Task <Text as="span" color="red.500">*</Text>
              </Text>
              <ThemedSelect
                value={task}
                onChange={(value) => setTask(value)}
                aria-label="Task"
                title="Task"
              >
                <option value="Open Till">Open Till</option>
                <option value="Close Till">Close Till</option>
              </ThemedSelect>
            </Box>

            {/* Input Fields */}
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2} color={{ base: "#ffffff", _light: "#1a1d29" }}>
                Attach
              </Text>
              <Input
                value={attach}
                onChange={(e) => setAttach(e.target.value)}
                bg="bg.surface"
                borderColor="input.border"
                color={{ base: "#ffffff", _light: "#1a1d29" }}
                _focus={{ borderColor: "#14b8a6", boxShadow: "0 0 0 1px #14b8a6" }}
              />
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2} color={{ base: "#ffffff", _light: "#1a1d29" }}>
                Till Cashier <Text as="span" color="red.500">*</Text>
              </Text>
              <Input
                value={tillCashier}
                readOnly
                bg="bg.surface"
                borderColor="input.border"
                color={{ base: "#ffffff", _light: "#1a1d29" }}
                cursor="not-allowed"
                opacity={0.7}
              />
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2} color={{ base: "#ffffff", _light: "#1a1d29" }}>
                Till Supervisor <Text as="span" color="red.500">*</Text>
              </Text>
              <Input
                value={tillSupervisor}
                readOnly
                bg="bg.surface"
                borderColor="input.border"
                color={{ base: "#ffffff", _light: "#1a1d29" }}
                cursor="not-allowed"
                opacity={0.7}
              />
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2} color={{ base: "#ffffff", _light: "#1a1d29" }}>
                Supervisor Desc
              </Text>
              <Input
                value={supervisorDesc}
                onChange={(e) => setSupervisorDesc(e.target.value)}
                bg="bg.surface"
                borderColor="input.border"
                color={{ base: "#ffffff", _light: "#1a1d29" }}
                _focus={{ borderColor: "#14b8a6", boxShadow: "0 0 0 1px #14b8a6" }}
              />
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2} color={{ base: "#ffffff", _light: "#1a1d29" }}>
                Supervisor Acc
              </Text>
              <Input
                value={supervisorAcc}
                onChange={(e) => setSupervisorAcc(e.target.value)}
                bg="bg.surface"
                borderColor="input.border"
                color={{ base: "#ffffff", _light: "#1a1d29" }}
                _focus={{ borderColor: "#14b8a6", boxShadow: "0 0 0 1px #14b8a6" }}
              />
            </Box>

            {/* Shift and Date/Time */}
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2} color={{ base: "#ffffff", _light: "#1a1d29" }}>
                Working Shift <Text as="span" color="red.500">*</Text>
              </Text>
              <ThemedSelect
                value={workingShift}
                onChange={(value) => setWorkingShift(value)}
                aria-label="Working Shift"
                title="Working Shift"
              >
                <option value="Morning Shift">Morning Shift</option>
                <option value="Afternoon Shift">Afternoon Shift</option>
                <option value="Evening Shift">Evening Shift</option>
                <option value="Night Shift">Night Shift</option>
              </ThemedSelect>
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2} color={{ base: "#ffffff", _light: "#1a1d29" }}>
                Transaction Date
              </Text>
              <Input
                value={transactionDate}
                readOnly
                bg="bg.surface"
                borderColor="input.border"
                color={{ base: "#ffffff", _light: "#1a1d29" }}
              />
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2} color={{ base: "#ffffff", _light: "#1a1d29" }}>
                Create Date <Text as="span" color="red.500">*</Text>
              </Text>
              <Input
                value={transactionDate}
                readOnly
                bg="bg.surface"
                borderColor="input.border"
                color={{ base: "#ffffff", _light: "#1a1d29" }}
              />
            </Box>

            {/* GRAND TOTAL Section */}
            <Box mt={4} p={4} bg={{ base: "rgba(255, 255, 255, 0.05)", _light: "#f9fafb" }} borderRadius="md" border="1px solid" borderColor="border.card">
              <Text fontSize="sm" fontWeight="bold" mb={3} color={{ base: "#ffffff", _light: "#1a1d29" }}>
                GRAND TOTAL
              </Text>
              <VStack gap={2} align="stretch">
                <HStack justify="space-between">
                  <Text fontSize="sm" color={{ base: "#ffffff", _light: "#1a1d29" }}>GRAND TOTAL SALES:</Text>
                  <Text fontSize="sm" fontWeight="bold" color={{ base: "#ffffff", _light: "#1a1d29" }}>{formatCurrency(grandTotalSales)}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm" color={{ base: "#ffffff", _light: "#1a1d29" }}>TOTAL POS CNOTES:</Text>
                  <Text fontSize="sm" fontWeight="bold" color={{ base: "#ffffff", _light: "#1a1d29" }}>0.00</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm" color={{ base: "#ffffff", _light: "#1a1d29" }}>TOTAL NET SALES:</Text>
                  <Text fontSize="sm" fontWeight="bold" color={{ base: "#ffffff", _light: "#1a1d29" }}>{formatCurrency(grandTotalSales)}</Text>
                </HStack>
              </VStack>
            </Box>

            {/* OTHER PAYMENT DETAILS Section */}
            <Box p={4} bg={{ base: "rgba(255, 255, 255, 0.05)", _light: "#f9fafb" }} borderRadius="md" border="1px solid" borderColor="border.card">
              <Text fontSize="sm" fontWeight="bold" mb={3} color={{ base: "#ffffff", _light: "#1a1d29" }}>
                OTHER PAYMENT DETAILS
              </Text>
              <VStack gap={2} align="stretch">
                <HStack justify="space-between">
                  <Text fontSize="sm" color={{ base: "#ffffff", _light: "#1a1d29" }}>PDQ Sales:</Text>
                  <Text fontSize="sm" fontWeight="bold" color={{ base: "#ffffff", _light: "#1a1d29" }}>0.00</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm" color={{ base: "#ffffff", _light: "#1a1d29" }}>Equity Sales:</Text>
                  <Text fontSize="sm" fontWeight="bold" color={{ base: "#ffffff", _light: "#1a1d29" }}>0.00</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm" color={{ base: "#ffffff", _light: "#1a1d29" }}>Cheque Sales:</Text>
                  <Text fontSize="sm" fontWeight="bold" color={{ base: "#ffffff", _light: "#1a1d29" }}>0.00</Text>
                </HStack>
              </VStack>
            </Box>
          </VStack>
        </Box>

        {/* Right Panel */}
        <Box w={{ base: "100%", lg: "400px" }} flexShrink={0}>
          <VStack gap={4} align="stretch">
            {/* TILL MANAGEMENT Section */}
            <Box bg="bg.surface" borderRadius="lg" p={6} border="1px solid" borderColor="border.card">
              <Text fontSize="md" fontWeight="bold" mb={4} color={{ base: "#ffffff", _light: "#1a1d29" }}>
                TILL MANAGEMENT
              </Text>
              <VStack gap={2} align="stretch" fontSize="sm">
                <HStack justify="space-between">
                  <Text color={{ base: "#ffffff", _light: "#1a1d29" }}>Opening Balance:</Text>
                  <Text fontWeight="bold" color={{ base: "#ffffff", _light: "#1a1d29" }}>0.00</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text color={{ base: "#ffffff", _light: "#1a1d29" }}>POS Cash Sales:</Text>
                  <Text fontWeight="bold" color={{ base: "#ffffff", _light: "#1a1d29" }}>{formatCurrency(physicalCash)}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text color={{ base: "#ffffff", _light: "#1a1d29" }}>Till Cbk Rcts:</Text>
                  <Text fontWeight="bold" color={{ base: "#ffffff", _light: "#1a1d29" }}>0.00</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text color={{ base: "#ffffff", _light: "#1a1d29" }}>Till Cbk Expenses:</Text>
                  <Text fontWeight="bold" color={{ base: "#ffffff", _light: "#1a1d29" }}>0.00</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text color="red.500">Pending Cbk Rcts:</Text>
                  <Text fontWeight="bold" color="red.500">0.00</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text color="red.500">Pending Cbk Pymts:</Text>
                  <Text fontWeight="bold" color="red.500">0.00</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text color={{ base: "#ffffff", _light: "#1a1d29" }}>Money In:</Text>
                  <Text fontWeight="bold" color={{ base: "#ffffff", _light: "#1a1d29" }}>0.00</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text color={{ base: "#ffffff", _light: "#1a1d29" }}>Money Out:</Text>
                  <Text fontWeight="bold" color={{ base: "#ffffff", _light: "#1a1d29" }}>0.00</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text color="#3b82f6">Expected Till Balance:</Text>
                  <Text fontWeight="bold" color="#3b82f6">0.00</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text color={{ base: "#ffffff", _light: "#1a1d29" }}>Physical Cash:</Text>
                  <Text fontWeight="bold" color={{ base: "#ffffff", _light: "#1a1d29" }}>{formatCurrency(physicalCash)}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text color={{ base: "#ffffff", _light: "#1a1d29" }}>Cash Closing Bal:</Text>
                  <Text fontWeight="bold" color={{ base: "#ffffff", _light: "#1a1d29" }}>0.00</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text color={{ base: "#ffffff", _light: "#1a1d29" }}>Till Total Sales:</Text>
                  <Text fontWeight="bold" color={{ base: "#ffffff", _light: "#1a1d29" }}>0.00</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text color={{ base: "#ffffff", _light: "#1a1d29" }}>Till POS CNotes:</Text>
                  <Text fontWeight="bold" color={{ base: "#ffffff", _light: "#1a1d29" }}>0.00</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text color={{ base: "#ffffff", _light: "#1a1d29" }}>Till Net Sales:</Text>
                  <Text fontWeight="bold" color={{ base: "#ffffff", _light: "#1a1d29" }}>0.00</Text>
                </HStack>
              </VStack>
            </Box>

            {/* MPESA SUMMARY Section */}
            <Box bg="bg.surface" borderRadius="lg" p={6} border="1px solid" borderColor="border.card">
              <Text fontSize="md" fontWeight="bold" mb={4} color={{ base: "#ffffff", _light: "#1a1d29" }}>
                MPESA SUMMARY
      </Text>
              <VStack gap={2} align="stretch" fontSize="sm">
                <HStack justify="space-between">
                  <Text color={{ base: "#ffffff", _light: "#1a1d29" }}>Mpesa Opening Bal:</Text>
                  <Text fontWeight="bold" color={{ base: "#ffffff", _light: "#1a1d29" }}>0.00</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text color={{ base: "#ffffff", _light: "#1a1d29" }}>Mpesa POS Sales:</Text>
                  <Text fontWeight="bold" color={{ base: "#ffffff", _light: "#1a1d29" }}>0.00</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text color={{ base: "#ffffff", _light: "#1a1d29" }}>Oth.Mpesa Sales:</Text>
                  <Text fontWeight="bold" color={{ base: "#ffffff", _light: "#1a1d29" }}>0.00</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text color={{ base: "#ffffff", _light: "#1a1d29" }}>Mpesa Expenses:</Text>
                  <Text fontWeight="bold" color={{ base: "#ffffff", _light: "#1a1d29" }}>0.00</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text color={{ base: "#ffffff", _light: "#1a1d29" }}>Total Mpesa Bal:</Text>
                  <Text fontWeight="bold" color={{ base: "#ffffff", _light: "#1a1d29" }}></Text>
                </HStack>
                <HStack justify="space-between">
                  <Text color="#22c55e">MPESA (At Hand):</Text>
                  <Text fontWeight="bold" color="#22c55e">0.00</Text>
                </HStack>
                <HStack gap={2} alignItems="center">
                  <Checkbox
                    checked={transferMpesaBal}
                    onCheckedChange={({ checked }) => setTransferMpesaBal(checked as boolean)}
                    colorPalette="blue"
                  />
                  <Text color={{ base: "#ffffff", _light: "#1a1d29" }}>TransferMpesaBal</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text color="#22c55e">MPESA Closing Bal:</Text>
                  <Text fontWeight="bold" color="#22c55e">0.00</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text color="red.500">MPESA Not Validated:</Text>
                  <Text fontWeight="bold" color="red.500">0.00</Text>
                </HStack>
              </VStack>
            </Box>
          </VStack>
        </Box>
      </Flex>

      {/* Action Buttons */}
      <Box mt={6} p={4} bg="bg.surface" borderRadius="lg" border="1px solid" borderColor="border.card">
        <Flex justify="space-between" align="center" gap={4} flexWrap="wrap">
          <Button
            bg="#14b8a6"
            color="white"
            _hover={{ bg: "#0d9488" }}
            onClick={handleReset}
          >
            <Icon as={FiRefreshCw} style={{ marginRight: "8px" }} />
            Reset
          </Button>
          <HStack gap={2}>
            <Button
              bg="#14b8a6"
              color="white"
              _hover={{ bg: "#0d9488" }}
              onClick={handleSave}
            >
              <Icon as={FiSave} style={{ marginRight: "8px" }} />
              Save
            </Button>
            <Button
              bg="#14b8a6"
              color="white"
              _hover={{ bg: "#0d9488" }}
              onClick={handleList}
            >
              <Icon as={FiFolder} style={{ marginRight: "8px" }} />
              List
            </Button>
            <Button
              bg="#14b8a6"
              color="white"
              _hover={{ bg: "#0d9488" }}
              onClick={handleClose}
            >
              <Icon as={FiHome} style={{ marginRight: "8px" }} />
              Close
            </Button>
          </HStack>
        </Flex>
      </Box>

      {/* Footer */}
      <Box py={2} textAlign="right" mt={4} fontSize="xs" color={{ base: "#9ca3af", _light: "#6b7280" }}>
        © Anchor Core : Developed by NBS
      </Box>
    </Container>
  )
}
