import {
  Container,
  Heading,
  VStack,
  HStack,
  Text,
  Button,
  Box,
  Grid,
  Badge,
  Input,
  SelectRoot,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValueText,
  Flex,
  Skeleton,
  createListCollection,
} from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { FiPlus, FiX, FiCalendar, FiTag } from "react-icons/fi"

import { ExpensesService, type ExpenseCategoryPublic, type ExpensePublic } from "@/client"
import { formatCurrency } from "@/components/Dashboard/utils"
import { AddExpense } from "@/components/Expenses/AddExpense"


export const Route = createFileRoute("/_layout/expenses")({
  component: Expenses,
})

function Expenses() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<ExpensePublic | null>(null)
  
  const pageSize = 25

  // Fetch expenses
  const { data: expensesData, isLoading: isLoadingExpenses } = useQuery({
    queryKey: ["expenses", page, search, selectedCategory, startDate, endDate],
    queryFn: async () => {
      try {
        return await ExpensesService.readExpenses({
          skip: (page - 1) * pageSize,
          limit: pageSize,
          categoryId: selectedCategory || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          search: search || undefined,
        })
      } catch (error) {
        // Fallback if client not generated yet
        return { data: [], count: 0 }
      }
    },
  })

  // Fetch categories
  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["expenseCategories"],
    queryFn: async () => {
      try {
        return await ExpensesService.readExpenseCategories()
      } catch (error) {
        // Fallback if client not generated yet
        return { data: [], count: 0 }
      }
    },
  })

  // Fetch expense summary
  const { data: summaryData, isLoading: isLoadingSummary } = useQuery({
    queryKey: ["expenseSummary", startDate, endDate, selectedCategory],
    queryFn: async () => {
      try {
        return await ExpensesService.getExpenseSummary({
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          categoryId: selectedCategory || undefined,
        })
      } catch (error) {
        // Fallback if client not generated yet
        return {
          total_amount: 0,
          count: 0,
          average_amount: 0,
          category_totals: {} as Record<string, number>,
        }
      }
    },
  })

  const expenses = expensesData?.data || []
  const categories = categoriesData?.data || []
  type SummaryType = {
    total_amount: number
    count: number
    average_amount: number
    category_totals: Record<string, number>
  }
  const summary: SummaryType = (summaryData && typeof summaryData === 'object' && 'total_amount' in summaryData) 
    ? summaryData as SummaryType
    : { 
        total_amount: 0, 
        count: 0, 
        average_amount: 0, 
        category_totals: {}
      }

  // Group expenses by date
  const groupedExpenses = expenses.reduce((acc, expense) => {
    if (expense.expense_date) {
      const date = new Date(expense.expense_date)
      const dateKey = date.toISOString().split('T')[0] // Format: YYYY-MM-DD
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(expense)
    }
    return acc
  }, {} as Record<string, ExpensePublic[]>)

  // Sort dates descending
  const sortedDates = Object.keys(groupedExpenses).sort((a, b) => b.localeCompare(a))

  const handleClearFilters = () => {
    setSearch("")
    setSelectedCategory("")
    setStartDate("")
    setEndDate("")
    setPage(1)
  }

  return (
    <Container maxW="full" py={6}>
      <VStack gap={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
          <VStack align="start" gap={1}>
            <Heading
              size="lg"
              color={{ base: "#e5e7eb", _light: "#111827" }}
            >
              Expenses
            </Heading>
            <Text color={{ base: "#9ca3af", _light: "#6b7280" }} fontSize="sm">
              Track and manage your business expenses
            </Text>
          </VStack>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            bg={{ base: "#009688", _light: "#009688" }}
            color="white"
            _hover={{ bg: { base: "#00796b", _light: "#00796b" } }}
          >
            <FiPlus style={{ marginRight: "8px" }} />
            Add Expense
          </Button>
        </Flex>

        {/* Summary Statistics Cards */}
        <Grid
          templateColumns={{
            base: "repeat(1, 1fr)",
            md: "repeat(2, 1fr)",
            lg: "repeat(4, 1fr)",
          }}
          gap={4}
        >
          <StatCard
            label="Total Expenses"
            value={formatCurrency(Number(summary.total_amount))}
            isLoading={isLoadingSummary}
            colorScheme="blue"
          />
          <StatCard
            label="Total Count"
            value={summary.count.toString()}
            isLoading={isLoadingSummary}
            colorScheme="purple"
          />
          <StatCard
            label="Average"
            value={formatCurrency(Number(summary.average_amount))}
            isLoading={isLoadingSummary}
            colorScheme="green"
          />
          <StatCard
            label="Categories"
            value={categories.length.toString()}
            isLoading={isLoadingCategories}
            colorScheme="orange"
          />
        </Grid>

        {/* Filters */}
        <Box
          p={4}
          bg="bg.surface"
          borderRadius="lg"
          border="1px solid"
          borderColor="border.card"
        >
          <Flex gap={4} flexWrap="wrap" align="end">
            <Box flex="1" minW="200px">
              <Text fontSize="sm" mb={2} color={{ base: "#9ca3af", _light: "#6b7280" }}>
                Search
              </Text>
              <Input
                placeholder="Search expenses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                bg="input.bg"
                borderColor="input.border"
              />
            </Box>
            <Box flex="1" minW="200px">
              <Text fontSize="sm" mb={2} color={{ base: "#9ca3af", _light: "#6b7280" }}>
                Category
              </Text>
              <SelectRoot
                value={selectedCategory ? [selectedCategory] : []}
                onValueChange={(e) => setSelectedCategory(e.value[0] || "")}
                collection={createListCollection({
                  items: categories.map((cat) => ({
                    label: cat.name,
                    value: cat.id,
                  })),
                })}
              >
                <SelectTrigger
                  bg={{ base: "#0f1419", _light: "#f9fafb" }}
                  borderColor={{ base: "rgba(255, 255, 255, 0.1)", _light: "#e5e7eb" }}
                >
                  <SelectValueText placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem item={{ label: "All Categories", value: "" }}>
                    All Categories
                  </SelectItem>
                  {categories.map((cat: ExpenseCategoryPublic) => (
                    <SelectItem key={cat.id} item={{ label: cat.name, value: cat.id }}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectRoot>
            </Box>
            <Box flex="1" minW="150px">
              <Text fontSize="sm" mb={2} color={{ base: "#9ca3af", _light: "#6b7280" }}>
                Start Date
              </Text>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                bg="input.bg"
                borderColor="input.border"
              />
            </Box>
            <Box flex="1" minW="150px">
              <Text fontSize="sm" mb={2} color={{ base: "#9ca3af", _light: "#6b7280" }}>
                End Date
              </Text>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                bg="input.bg"
                borderColor="input.border"
              />
            </Box>
            <Button
              variant="outline"
              onClick={handleClearFilters}
            >
              <FiX style={{ marginRight: "8px" }} />
              Clear
            </Button>
          </Flex>
        </Box>

        {/* Expenses List */}
        <Box
          bg="bg.surface"
          borderRadius="lg"
          border="1px solid"
          borderColor="border.card"
          overflow="hidden"
        >
          {isLoadingExpenses ? (
            <ExpensesListSkeleton />
          ) : expenses.length === 0 ? (
            <EmptyExpensesState />
          ) : (
            <ExpensesList
              groupedExpenses={groupedExpenses}
              sortedDates={sortedDates}
              categories={categories}
              onEdit={(expense) => setEditingExpense(expense)}
            />
          )}
        </Box>

        {/* Add/Edit Expense Dialog */}
        <AddExpense
          isOpen={isAddDialogOpen || !!editingExpense}
          onOpenChange={(open) => {
            setIsAddDialogOpen(open)
            if (!open) {
              setEditingExpense(null)
            }
          }}
          editingExpense={editingExpense}
          onSuccess={() => {
            setEditingExpense(null)
            setIsAddDialogOpen(false)
          }}
        />
      </VStack>
    </Container>
  )
}

// Stat Card Component
function StatCard({
  label,
  value,
  isLoading,
}: {
  label: string
  value: string
  isLoading: boolean
  colorScheme?: string
}) {
  return (
    <Box
      p={5}
      bg="bg.surface"
      borderRadius="lg"
      border="1px solid"
      borderColor="border.card"
      boxShadow={{ base: "0 2px 4px rgba(0, 0, 0, 0.2)", _light: "0 1px 3px rgba(0, 0, 0, 0.1)" }}
    >
      {isLoading ? (
        <VStack align="start" gap={2}>
          <Skeleton height="16px" width="60%" />
          <Skeleton height="24px" width="40%" />
        </VStack>
      ) : (
        <VStack align="start" gap={1}>
          <Text fontSize="xs" color={{ base: "#9ca3af", _light: "#6b7280" }} textTransform="uppercase" letterSpacing="0.5px">
            {label}
          </Text>
          <Text fontSize="2xl" fontWeight="700" color={{ base: "#ffffff", _light: "#1a1d29" }}>
            {value}
          </Text>
        </VStack>
      )}
    </Box>
  )
}

// Expenses List Component
function ExpensesList({
  groupedExpenses,
  sortedDates,
  categories,
  onEdit,
}: {
  groupedExpenses: Record<string, ExpensePublic[]>
  sortedDates: string[]
  categories: ExpenseCategoryPublic[]
  onEdit: (expense: ExpensePublic) => void
}) {
  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId)
    return category?.name || "Unknown"
  }

  return (
    <Box p={4}>
      <VStack gap={6} align="stretch">
        {sortedDates.map((dateKey) => {
          const expenses = groupedExpenses[dateKey]
          const dateTotal = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
          
          return (
            <Box key={dateKey}>
              {/* Date Header */}
              <HStack justify="space-between" mb={3} pb={2} borderBottom="1px solid" borderColor={{ base: "rgba(255, 255, 255, 0.1)", _light: "#e5e7eb" }}>
                <HStack gap={2}>
                  <FiCalendar size={16} color="var(--chakra-colors-text-secondary)" />
                  <Text fontWeight="600" color={{ base: "#ffffff", _light: "#111827" }}>
                    {new Date(dateKey).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </Text>
                </HStack>
                <Text fontWeight="600" color={{ base: "#9ca3af", _light: "#6b7280" }}>
                  {formatCurrency(dateTotal)}
                </Text>
              </HStack>

              {/* Expenses for this date */}
              <VStack gap={2} align="stretch">
                {expenses.map((expense) => (
                  <ExpenseRow
                    key={expense.id}
                    expense={expense}
                    categoryName={getCategoryName(expense.category_id)}
                    onEdit={() => onEdit(expense)}
                  />
                ))}
              </VStack>
            </Box>
          )
        })}
      </VStack>
    </Box>
  )
}

// Expense Row Component
function ExpenseRow({
  expense,
  categoryName,
  onEdit,
}: {
  expense: ExpensePublic
  categoryName: string
  onEdit: () => void
}) {
  return (
    <HStack
      p={3}
      borderRadius="md"
      bg={{ base: "rgba(255, 255, 255, 0.05)", _light: "#f9fafb" }}
      border="1px solid"
      borderColor="border.card"
      justify="space-between"
      _hover={{
        bg: { base: "rgba(255, 255, 255, 0.05)", _light: "#f3f4f6" },
        borderColor: { base: "rgba(255, 255, 255, 0.1)", _light: "#d1d5db" },
      }}
      cursor="pointer"
      onClick={onEdit}
    >
      <HStack gap={4} flex="1">
        <Box>
          <HStack gap={2} mb={1}>
            <FiTag size={14} color="var(--chakra-colors-text-secondary)" />
            <Badge colorScheme="blue" fontSize="xs">
              {categoryName}
            </Badge>
          </HStack>
          <Text fontWeight="500" color={{ base: "#ffffff", _light: "#111827" }}>
            {expense.description}
          </Text>
          {expense.notes && (
            <Text fontSize="sm" color={{ base: "#9ca3af", _light: "#6b7280" }} mt={1}>
              {expense.notes}
            </Text>
          )}
        </Box>
      </HStack>
      <VStack align="end" gap={0}>
        <Text fontSize="lg" fontWeight="700" color={{ base: "#ffffff", _light: "#111827" }}>
          {formatCurrency(Number(expense.amount))}
        </Text>
        <Text fontSize="xs" color={{ base: "#9ca3af", _light: "#6b7280" }}>
          {expense.expense_date ? new Date(expense.expense_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : ''}
        </Text>
      </VStack>
    </HStack>
  )
}

// Loading Skeleton
function ExpensesListSkeleton() {
  return (
    <Box p={4}>
      <VStack gap={4} align="stretch">
        {[1, 2, 3].map((i) => (
          <Box key={i}>
            <Skeleton height="24px" width="200px" mb={3} />
            <VStack gap={2} align="stretch">
              {[1, 2].map((j) => (
                <Skeleton key={j} height="60px" borderRadius="md" />
              ))}
            </VStack>
          </Box>
        ))}
      </VStack>
    </Box>
  )
}

// Empty State
function EmptyExpensesState() {
  return (
    <Box p={12} textAlign="center">
      <VStack gap={4}>
        <Text fontSize="xl" fontWeight="600" color={{ base: "#ffffff", _light: "#111827" }}>
          No expenses found
        </Text>
        <Text color={{ base: "#9ca3af", _light: "#6b7280" }}>
          Start tracking your expenses by adding your first expense.
        </Text>
      </VStack>
    </Box>
  )
}

export default Expenses
