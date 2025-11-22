import {
  Box,
  Button,
  Flex,
  Input,
  Text,
  VStack,
  HStack,
  Table,
} from "@chakra-ui/react"
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
} from "@/components/ui/dialog"
import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { SalesService } from "@/client"
import { FiSearch } from "react-icons/fi"

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
  onNewCustomer: () => void
}

export function CustomerSearchModal({
  isOpen,
  onClose,
  onSelectCustomer,
  onNewCustomer,
}: CustomerSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("")

  // Fetch recent sales to extract customer data
  const { data: salesData } = useQuery({
    queryKey: ["recent-sales-for-customers"],
    queryFn: () => SalesService.readSales({ skip: 0, limit: 1000 }),
    enabled: isOpen,
  })

  // Extract unique customers from sales
  const customers = useMemo(() => {
    if (!salesData?.data) return []
    
    const customerMap = new Map<string, Customer>()
    
    salesData.data.forEach((sale) => {
      if (sale.customer_name) {
        const key = sale.customer_name.toLowerCase().trim()
        if (!customerMap.has(key)) {
          customerMap.set(key, {
            name: sale.customer_name,
            tel: "", // Phone not stored in sale model currently
            balance: 0, // Balance not tracked in sale model currently
            lastSaleDate: sale.sale_date,
          })
        } else {
          // Update last sale date if this sale is more recent
          const existing = customerMap.get(key)!
          if (sale.sale_date > (existing.lastSaleDate || "")) {
            existing.lastSaleDate = sale.sale_date
          }
        }
      }
    })
    
    // Also load from localStorage (for manually added customers)
    try {
      const savedCustomers = JSON.parse(localStorage.getItem("pos_customers") || "[]")
      savedCustomers.forEach((customer: Customer) => {
        const key = customer.name.toLowerCase().trim()
        if (!customerMap.has(key)) {
          customerMap.set(key, customer)
        }
      })
    } catch (error) {
      console.error("Failed to load customers from localStorage:", error)
    }
    
    return Array.from(customerMap.values()).sort((a, b) => {
      // Sort by last sale date (most recent first)
      const dateA = a.lastSaleDate || ""
      const dateB = b.lastSaleDate || ""
      return dateB.localeCompare(dateA)
    })
  }, [salesData])

  // Filter customers based on search query
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers.slice(0, 50) // Limit to 50 for performance
    
    const query = searchQuery.toLowerCase().trim()
    return customers
      .filter((customer) => 
        customer.name.toLowerCase().includes(query) ||
        customer.tel.toLowerCase().includes(query)
      )
      .slice(0, 50)
  }, [customers, searchQuery])

  const handleSelectCustomer = (customer: Customer) => {
    onSelectCustomer(customer)
    onClose()
    setSearchQuery("")
  }

  const handleNewCustomer = () => {
    onNewCustomer()
    onClose()
    setSearchQuery("")
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "lg" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => !open && onClose()}
    >
      <DialogContent maxW="700px">
        <DialogHeader>
          <DialogTitle>Search Customer</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <VStack gap={4} align="stretch">
            {/* Search Input */}
            <Box>
              <HStack gap={2}>
                <Input
                  placeholder="Search by name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  bg={{ base: "#1a1d29", _light: "#ffffff" }}
                  borderColor={{ base: "rgba(255, 255, 255, 0.1)", _light: "#e5e7eb" }}
                  color={{ base: "#ffffff", _light: "#1a1d29" }}
                  _focus={{ borderColor: "#14b8a6", boxShadow: "0 0 0 1px #14b8a6" }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && filteredCustomers.length > 0) {
                      handleSelectCustomer(filteredCustomers[0])
                    }
                  }}
                />
                <Button
                  bg="#14b8a6"
                  color="white"
                  _hover={{ bg: "#0d9488" }}
                  onClick={handleNewCustomer}
                >
                  <FiSearch style={{ marginRight: "8px" }} />
                  New Customer
                </Button>
              </HStack>
            </Box>

            {/* Customer List */}
            <Box
              maxH="400px"
              overflowY="auto"
              border="1px solid"
              borderColor={{ base: "rgba(255, 255, 255, 0.1)", _light: "#e5e7eb" }}
              borderRadius="md"
            >
              {filteredCustomers.length === 0 ? (
                <Box p={8} textAlign="center">
                  <Text color={{ base: "#9ca3af", _light: "#6b7280" }}>
                    {searchQuery ? "No customers found" : "Start typing to search customers"}
                  </Text>
                </Box>
              ) : (
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader color={{ base: "#ffffff", _light: "#1a1d29" }}>Name</Table.ColumnHeader>
                      <Table.ColumnHeader color={{ base: "#ffffff", _light: "#1a1d29" }}>Phone</Table.ColumnHeader>
                      <Table.ColumnHeader color={{ base: "#ffffff", _light: "#1a1d29" }}>Balance</Table.ColumnHeader>
                      <Table.ColumnHeader color={{ base: "#ffffff", _light: "#1a1d29" }}>Last Sale</Table.ColumnHeader>
                      <Table.ColumnHeader color={{ base: "#ffffff", _light: "#1a1d29" }}>Action</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {filteredCustomers.map((customer, index) => (
                      <Table.Row
                        key={`${customer.name}-${index}`}
                        cursor="pointer"
                        _hover={{ bg: { base: "rgba(255, 255, 255, 0.05)", _light: "#f9fafb" } }}
                        onClick={() => handleSelectCustomer(customer)}
                      >
                        <Table.Cell fontWeight="medium" color={{ base: "#ffffff", _light: "#1a1d29" }}>
                          {customer.name}
                        </Table.Cell>
                        <Table.Cell color={{ base: "#9ca3af", _light: "#6b7280" }}>
                          {customer.tel || "—"}
                        </Table.Cell>
                        <Table.Cell color={{ base: "#9ca3af", _light: "#6b7280" }}>
                          Ksh {customer.balance.toFixed(2)}
                        </Table.Cell>
                        <Table.Cell color={{ base: "#9ca3af", _light: "#6b7280" }}>
                          {customer.lastSaleDate
                            ? new Date(customer.lastSaleDate).toLocaleDateString()
                            : "—"}
                        </Table.Cell>
                        <Table.Cell>
                          <Button
                            size="xs"
                            bg="#14b8a6"
                            color="white"
                            _hover={{ bg: "#0d9488" }}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSelectCustomer(customer)
                            }}
                          >
                            Select
                          </Button>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              )}
            </Box>
          </VStack>
        </DialogBody>
        <DialogFooter>
          <Flex gap={2} w="full" justify="flex-end">
            <DialogCloseTrigger asChild>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
            </DialogCloseTrigger>
          </Flex>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  )
}

