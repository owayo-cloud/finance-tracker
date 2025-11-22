import { Badge, Container, Flex, Heading, Table, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"
import type { ExpenseCategoryPublic } from "@/client"
import { ExpensesService, UsersService } from "@/client"
import AddExpenseCategory from "@/components/Expenses/AddExpenseCategory"
import EditExpenseCategory from "@/components/Expenses/EditExpenseCategory"

export const Route = createFileRoute("/_layout/expense-categories")({
  component: ExpenseCategories,
  beforeLoad: async () => {
    // Ensure only admins can access expense categories management
    try {
      const user = await UsersService.readUserMe()
      if (!user.is_superuser) {
        throw redirect({
          to: "/sales",
        })
      }
    } catch (error) {
      // Re-throw redirect errors
      throw error
    }
  },
})

function ExpenseCategoriesTable() {
  const { data, isLoading } = useQuery({
    queryKey: ["expenseCategories"],
    queryFn: () => ExpensesService.readExpenseCategories({ skip: 0, limit: 1000 }),
  })

  const categories = data?.data || []

  if (isLoading) {
    return (
      <Text color={{ base: "#9ca3af", _light: "#6b7280" }} textAlign="center" py={8}>
        Loading expense categories...
      </Text>
    )
  }

  if (categories.length === 0) {
    return (
      <Text color={{ base: "#9ca3af", _light: "#6b7280" }} textAlign="center" py={8}>
        No expense categories found. Create one to get started.
      </Text>
    )
  }

  return (
    <Table.Root size={{ base: "sm", md: "md" }} variant="outline">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader color={{ base: "#ffffff", _light: "#1a1d29" }}>Name</Table.ColumnHeader>
          <Table.ColumnHeader color={{ base: "#ffffff", _light: "#1a1d29" }}>Description</Table.ColumnHeader>
          <Table.ColumnHeader color={{ base: "#ffffff", _light: "#1a1d29" }}>Actions</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {categories.map((category: ExpenseCategoryPublic) => (
          <Table.Row key={category.id}>
            <Table.Cell fontWeight="medium" color={{ base: "#ffffff", _light: "#1a1d29" }}>
              {category.name}
            </Table.Cell>
            <Table.Cell color={{ base: "#9ca3af", _light: "#6b7280" }}>
              {category.description || "—"}
            </Table.Cell>
            <Table.Cell>
              <EditExpenseCategory category={category} />
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  )
}

function ExpenseCategories() {
  return (
    <Container maxW="full" minH="100vh">
      <Flex direction="column" gap={6} pt={12} pb={8}>
        <Flex justify="space-between" align="center">
          <Heading
            size="lg"
            color={{ base: "#ffffff", _light: "#1a1d29" }}
          >
            Expense Categories Management
          </Heading>
          <AddExpenseCategory />
        </Flex>
        <ExpenseCategoriesTable />
      </Flex>
    </Container>
  )
}

