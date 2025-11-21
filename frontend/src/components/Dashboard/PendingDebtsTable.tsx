import { Box, Heading, Table, VStack, Text } from "@chakra-ui/react"

interface PendingDebtsTableProps {
  isMounted: boolean
}

export function PendingDebtsTable({ isMounted }: PendingDebtsTableProps) {
  return (
    <Box
      opacity={isMounted ? 1 : 0}
      transform={isMounted ? "translateY(0)" : "translateY(20px)"}
      transition="all 0.5s ease 0.5s"
      mb={8}
    >
      <Box 
        p={6} 
        bg={{ base: "#1a1d29", _light: "#ffffff" }}
        borderRadius="lg" 
        border="1px solid"
        borderColor={{ base: "rgba(255, 255, 255, 0.08)", _light: "#e5e7eb" }}
        boxShadow={{ base: "0 2px 4px rgba(0, 0, 0, 0.2)", _light: "0 1px 3px rgba(0, 0, 0, 0.1)" }}
      >
        <Heading 
          size="md" 
          fontWeight="600"
          color={{ base: "#ffffff", _light: "#1a1d29" }}
          mb={4}
        >
          Pending Debts
        </Heading>
        
        <Box overflowX="auto">
          <Table.Root variant="outline" size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader color={{ base: "#9ca3af", _light: "#6b7280" }} fontWeight="600" fontSize="xs" textTransform="uppercase" letterSpacing="0.5px">
                  Client Name
                </Table.ColumnHeader>
                <Table.ColumnHeader color={{ base: "#9ca3af", _light: "#6b7280" }} fontWeight="600" fontSize="xs" textTransform="uppercase" letterSpacing="0.5px">
                  Debt No
                </Table.ColumnHeader>
                <Table.ColumnHeader color={{ base: "#9ca3af", _light: "#6b7280" }} fontWeight="600" fontSize="xs" textTransform="uppercase" letterSpacing="0.5px">
                  Amount Owed
                </Table.ColumnHeader>
                <Table.ColumnHeader color={{ base: "#9ca3af", _light: "#6b7280" }} fontWeight="600" fontSize="xs" textTransform="uppercase" letterSpacing="0.5px">
                  Product
                </Table.ColumnHeader>
                <Table.ColumnHeader color={{ base: "#9ca3af", _light: "#6b7280" }} fontWeight="600" fontSize="xs" textTransform="uppercase" letterSpacing="0.5px">
                  Payment Mode
                </Table.ColumnHeader>
                <Table.ColumnHeader color={{ base: "#9ca3af", _light: "#6b7280" }} fontWeight="600" fontSize="xs" textTransform="uppercase" letterSpacing="0.5px">
                  Start Date
                </Table.ColumnHeader>
                <Table.ColumnHeader color={{ base: "#9ca3af", _light: "#6b7280" }} fontWeight="600" fontSize="xs" textTransform="uppercase" letterSpacing="0.5px">
                  Status
                </Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              <Table.Row>
                <Table.Cell colSpan={7} textAlign="center" py={8}>
                  <VStack gap={2}>
                    <Text fontSize="sm" color={{ base: "#9ca3af", _light: "#6b7280" }}>
                      No pending debts
                    </Text>
                    <Text fontSize="xs" color={{ base: "#6b7280", _light: "#9ca3af" }}>
                      This feature will be implemented soon
                    </Text>
                  </VStack>
                </Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table.Root>
        </Box>
      </Box>
    </Box>
  )
}

