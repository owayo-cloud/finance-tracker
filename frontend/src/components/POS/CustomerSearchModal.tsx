import {
  Box,
  Button,
  Flex,
  Input,
  Text,
  VStack,
  HStack,
  Grid,
} from "@chakra-ui/react"
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog"
import { useState, useMemo, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { FiSearch, FiHome } from "react-icons/fi"

interface Customer {
  name: string
  tel: string
  balance: number
  lastSaleDate?: string
}

interface CustomerSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectCustomer: (customer: Customer) => void
}

export function CustomerSearchModal({
  isOpen,
  onClose,
  onSelectCustomer,
}: CustomerSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  
  // Fetch customers from backend (handles all aggregation logic)
  const { data: customersData, refetch: refetchCustomers } = useQuery({
    queryKey: ["customers", searchQuery],
    queryFn: async () => {
      const token = localStorage.getItem("access_token") || ""
      const apiBase = import.meta.env.VITE_API_URL || ""
      const searchParam = searchQuery.trim() ? `&search=${encodeURIComponent(searchQuery.trim())}` : ""
      const response = await fetch(`${apiBase}/api/v1/customers/?limit=1000${searchParam}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store", // Prevent caching to ensure fresh data
      })
      if (!response.ok) {
        return null
      }
      const data = await response.json()
      return data
    },
    enabled: isOpen,
    staleTime: 0, // Always consider data stale to force refetch
  })

  // Refresh when modal opens
  useEffect(() => {
    if (isOpen) {
      refetchCustomers()
    }
  }, [isOpen, refetchCustomers])

  // Listen for customer created event
  useEffect(() => {
    if (isOpen) {
      const handleCustomerCreated = async (event: Event) => {
        // Small delay to ensure backend has processed the creation
        await new Promise(resolve => setTimeout(resolve, 300))
        // Force refetch with fresh data
        await refetchCustomers()
      }
      window.addEventListener("customerCreated", handleCustomerCreated)
      return () => {
        window.removeEventListener("customerCreated", handleCustomerCreated)
      }
    }
  }, [isOpen, refetchCustomers])

  // Map backend customer data to frontend format
  const customers = useMemo(() => {
    if (!customersData?.data) return []
    
    return customersData.data.map((customer: any) => ({
      name: customer.name,
      tel: customer.tel || "",
      balance: customer.balance || 0,
      lastSaleDate: customer.last_sale_date || undefined,
    }))
  }, [customersData])

  // Filtered customers (already filtered by backend if search query provided)
  const filteredCustomers = customers

  const handleSelectCustomer = (customer: Customer) => {
    onSelectCustomer(customer)
    onClose()
    setSearchQuery("")
  }

  const handleFind = () => {
    // If there's a search query and results, select the first one
    if (searchQuery.trim() && filteredCustomers.length > 0) {
      handleSelectCustomer(filteredCustomers[0])
    }
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "xl" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => !open && onClose()}
    >
      <DialogContent maxW="900px" maxH="90vh">
        <DialogHeader>
          <DialogTitle>Select Customer</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <VStack gap={4} align="stretch">
            {/* Search Input */}
            <Box>
              <HStack gap={2}>
                <Input
                  placeholder="Customer/Tel"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  bg="input.bg"
                  borderColor="input.border"
                  color="text.primary"
                  _focus={{ borderColor: "input.focus.border", boxShadow: "input.focus.shadow" }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleFind()
                    }
                  }}
                  flex={1}
                />
                <Button
                  bg="brand.primary"
                  color="white"
                  _hover={{ bg: "brand.primary.hover" }}
                  onClick={handleFind}
                  flexShrink={0}
                >
                  <FiSearch style={{ marginRight: "8px" }} />
                  Find
                </Button>
              </HStack>
            </Box>

            {/* Customer Grid */}
            <Box
              maxH="500px"
              overflowY="auto"
              overflowX="auto"
              border="1px solid"
              borderColor="border.default"
              borderRadius="md"
              p={4}
            >
              {filteredCustomers.length === 0 ? (
                <Box p={8} textAlign="center">
                  <Text color="text.muted">
                    {searchQuery ? "No customers found" : "No customers available"}
                  </Text>
                </Box>
              ) : (
                <Grid
                  templateColumns={{
                    base: "repeat(1, 1fr)",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(3, 1fr)",
                    lg: "repeat(4, 1fr)",
                  }}
                  gap={3}
                >
                  {filteredCustomers.map((customer: Customer, index: number) => {
                    const balance = customer.balance
                    const isNegative = balance < 0
                    const displayBalance = Math.abs(balance)
                    
                    return (
                      <Button
                        key={`${customer.name}-${index}`}
                        onClick={() => handleSelectCustomer(customer)}
                        bg={isNegative ? "button.danger" : "brand.accent"}
                        color="white"
                        _hover={{ 
                          bg: isNegative ? "button.danger.hover" : "brand.accent.hover",
                          transform: "scale(1.02)",
                        }}
                        h="auto"
                        p={3}
                        flexDirection="column"
                        alignItems="flex-start"
                        textAlign="left"
                        whiteSpace="normal"
                        wordBreak="break-word"
                        transition="all 0.2s"
                        borderRadius="md"
                        boxShadow="sm"
                      >
                        <Text
                          fontSize="sm"
                          fontWeight="medium"
                          mb={1}
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {customer.name}
                        </Text>
                        <Text fontSize="xs" opacity={0.9}>
                          {isNegative ? "-" : ""}Ksh {displayBalance.toFixed(2)}
                        </Text>
                      </Button>
                    )
                  })}
                </Grid>
              )}
            </Box>
          </VStack>
        </DialogBody>
        <DialogFooter>
          <Flex gap={2} w="full" justify="flex-end">
            <Button
              bg="#14b8a6"
              color="white"
              _hover={{ bg: "#0d9488" }}
              onClick={onClose}
            >
              <FiHome style={{ marginRight: "8px" }} />
              Close
            </Button>
          </Flex>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  )
}
