import { Badge, Container, Flex, Heading, Table, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"
import type { PaymentMethodPublic } from "@/client"
import { SalesService, UsersService } from "@/client"
import AddPaymentMethod from "@/components/Admin/AddPaymentMethod"
import EditPaymentMethod from "@/components/Admin/EditPaymentMethod"

export const Route = createFileRoute("/_layout/payment-methods")({
  component: PaymentMethods,
  beforeLoad: async () => {
    const user = await UsersService.readUserMe()
    if (!user.is_superuser) {
      throw redirect({
        to: "/sales",
      })
    }
  },
})

function PaymentMethodsTable() {
  const { data, isLoading } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: () => SalesService.readPaymentMethods({ skip: 0, limit: 1000 }),
  })

  const paymentMethods = data?.data || []

  if (isLoading) {
    return (
      <Text
        color={{ base: "#9ca3af", _light: "#6b7280" }}
        textAlign="center"
        py={8}
      >
        Loading payment methods...
      </Text>
    )
  }

  if (paymentMethods.length === 0) {
    return (
      <Text
        color={{ base: "#9ca3af", _light: "#6b7280" }}
        textAlign="center"
        py={8}
      >
        No payment methods found. Create one to get started.
      </Text>
    )
  }

  return (
    <Table.Root size={{ base: "sm", md: "md" }} variant="outline">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader color={{ base: "#ffffff", _light: "#1a1d29" }}>
            Name
          </Table.ColumnHeader>
          <Table.ColumnHeader color={{ base: "#ffffff", _light: "#1a1d29" }}>
            Description
          </Table.ColumnHeader>
          <Table.ColumnHeader color={{ base: "#ffffff", _light: "#1a1d29" }}>
            Status
          </Table.ColumnHeader>
          <Table.ColumnHeader color={{ base: "#ffffff", _light: "#1a1d29" }}>
            Actions
          </Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {paymentMethods.map((paymentMethod: PaymentMethodPublic) => (
          <Table.Row key={paymentMethod.id}>
            <Table.Cell
              fontWeight="medium"
              color={{ base: "#ffffff", _light: "#1a1d29" }}
            >
              {paymentMethod.name}
            </Table.Cell>
            <Table.Cell color={{ base: "#9ca3af", _light: "#6b7280" }}>
              {paymentMethod.description || "—"}
            </Table.Cell>
            <Table.Cell>
              <Badge
                colorScheme={paymentMethod.is_active ? "green" : "gray"}
                bg={paymentMethod.is_active ? "#22c55e" : "#6b7280"}
                color="white"
              >
                {paymentMethod.is_active ? "Active" : "Inactive"}
              </Badge>
            </Table.Cell>
            <Table.Cell>
              <EditPaymentMethod paymentMethod={paymentMethod} />
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  )
}

function PaymentMethods() {
  return (
    <Container maxW="full" minH="100vh">
      <Flex direction="column" gap={6} pt={12} pb={8}>
        <Flex justify="space-between" align="center">
          <Heading size="lg" color={{ base: "#ffffff", _light: "#1a1d29" }}>
            Payment Methods Management
          </Heading>
          <AddPaymentMethod />
        </Flex>
        <PaymentMethodsTable />
      </Flex>
    </Container>
  )
}
