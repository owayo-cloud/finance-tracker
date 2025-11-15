import { Table } from "@chakra-ui/react"
import { SkeletonText } from "../ui/skeleton"

const PendingProducts = () => (
  <Table.Root size={{ base: "sm", md: "md" }}>
    <Table.Header>
      <Table.Row>
        <Table.ColumnHeader>Product</Table.ColumnHeader>
        <Table.ColumnHeader>Category</Table.ColumnHeader>
        <Table.ColumnHeader>Tag</Table.ColumnHeader>
        <Table.ColumnHeader>Buying Price</Table.ColumnHeader>
        <Table.ColumnHeader>Selling Price</Table.ColumnHeader>
        <Table.ColumnHeader>Current Stock</Table.ColumnHeader>
        <Table.ColumnHeader>Reorder Level</Table.ColumnHeader>
        <Table.ColumnHeader>Status</Table.ColumnHeader>
        <Table.ColumnHeader>Actions</Table.ColumnHeader>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {[...Array(5)].map((_, index) => (
        <Table.Row key={index}>
          <Table.Cell>
            <SkeletonText noOfLines={1} />
          </Table.Cell>
          <Table.Cell>
            <SkeletonText noOfLines={1} />
          </Table.Cell>
          <Table.Cell>
            <SkeletonText noOfLines={1} />
          </Table.Cell>
          <Table.Cell>
            <SkeletonText noOfLines={1} />
          </Table.Cell>
          <Table.Cell>
            <SkeletonText noOfLines={1} />
          </Table.Cell>
          <Table.Cell>
            <SkeletonText noOfLines={1} />
          </Table.Cell>
          <Table.Cell>
            <SkeletonText noOfLines={1} />
          </Table.Cell>
        </Table.Row>
      ))}
    </Table.Body>
  </Table.Root>
)

export default PendingProducts