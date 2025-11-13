import {
  Container,
  EmptyState,
  Flex,
  Heading,
  Table,
  VStack,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { FiSearch } from "react-icons/fi"
import { z } from "zod"

import { ProductsService } from "@/client"
import AddProduct from "@/components/Products/AddProduct"
import ProductActionsMenu from "@/components/Products/ProductActionsMenu"
import PendingProducts from "@/components/Pending/PendingProducts"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination.tsx"

const productsSearchSchema = z.object({
  page: z.number().catch(1),
})

const PER_PAGE = 5

function getProductsQueryOptions({ page }: { page: number }) {
  return {
    queryKey: ["products", { page }],
    queryFn: () =>
      ProductsService.readProducts({ skip: (page - 1) * PER_PAGE, limit: PER_PAGE }),
  }
}

export const Route = createFileRoute("/_layout/products")({
  component: Products,
  validateSearch: (search) => productsSearchSchema.parse(search),
})

function ProductsTable() {
  const navigate = useNavigate({ from: "/products" })
  const { page } = Route.useSearch()

  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getProductsQueryOptions({ page }),
    placeholderData: (prevData) => prevData,
  })

  const setPage = (page: number) => {
    navigate({
      to: "/products" as any,
      search: (prev: any) => ({ ...prev, page }),
    })
  }

  const products = data?.data.slice(0, PER_PAGE) ?? []
  const count = data?.count ?? 0

  if (isLoading) {
    return <PendingProducts />
  }

  if (products.length === 0) {
    return (
      <EmptyState.Root>
        <EmptyState.Content>
          <EmptyState.Indicator>
            <FiSearch />
          </EmptyState.Indicator>
          <VStack textAlign="center">
            <EmptyState.Title>You don't have any products yet</EmptyState.Title>
            <EmptyState.Description>
              Start by adding your first product to the inventory.
            </EmptyState.Description>
          </VStack>
        </EmptyState.Content>
      </EmptyState.Root>
    )
  }

  return (
    <>
      <Table.Root size={{ base: "sm", md: "md" }} variant="outline">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Name</Table.ColumnHeader>
            <Table.ColumnHeader>Description</Table.ColumnHeader>
            <Table.ColumnHeader>Category</Table.ColumnHeader>
            <Table.ColumnHeader>Tag</Table.ColumnHeader>
            <Table.ColumnHeader>Current Stock</Table.ColumnHeader>
            <Table.ColumnHeader>Selling Price</Table.ColumnHeader>
            <Table.ColumnHeader>Status</Table.ColumnHeader>
            <Table.ColumnHeader>Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {products.map((product) => (
            <Table.Row 
              key={product.id} 
              opacity={isPlaceholderData ? 0.5 : 1}
            >
              <Table.Cell>{product.name}</Table.Cell>
              <Table.Cell>{product.description || "-"}</Table.Cell>
              <Table.Cell>{product.category?.name || "-"}</Table.Cell>
              <Table.Cell>{product.tag?.name || "-"}</Table.Cell>
              <Table.Cell>{product.current_stock}</Table.Cell>
              <Table.Cell>
                KES {parseFloat(product.selling_price).toFixed(2)}
              </Table.Cell>
              <Table.Cell>{product.status?.name || "-"}</Table.Cell>
              <Table.Cell>
                <ProductActionsMenu product={product} />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
      <Flex
        gap={4}
        alignItems="center"
        mt={4}
        direction={{ base: "column", md: "row" }}
        pt={4}
      >
        <PaginationRoot
          count={count}
          pageSize={PER_PAGE}
          page={page}
          onPageChange={(e) => setPage(e.page)}
        >
          <PaginationPrevTrigger />
          <PaginationItems />
          <PaginationNextTrigger />
        </PaginationRoot>
      </Flex>
    </>
  )
}

function Products() {
  return (
    <Container maxW="full" minH="100vh">
      <Flex 
        direction="column" 
        gap={6}
        pt={12}
        pb={8}
      >
        <Flex justify="space-between" align="center">
          <Heading size="lg">
            Products Management
          </Heading>
          <AddProduct />
        </Flex>
        <ProductsTable />
      </Flex>
    </Container>
  )
}
