import { Box, Button, Card, Grid, Heading, HStack, Separator, Text, VStack } from "@chakra-ui/react"
import { FiDownload } from "react-icons/fi"
import { formatCurrency, downloadCSV } from "./utils"

interface BalanceSheetProps {
  balanceSheet: {
    assets: {
      inventory: number
      cashAndReceivables: number
      total: number
    }
    liabilities: {
      expenses: number
      total: number
    }
    equity: number
  }
  startDate: string
  endDate: string
}

function exportBalanceSheetToCSV(
  balanceSheet: BalanceSheetProps["balanceSheet"],
  startDate: string,
  endDate: string
) {
  const headers = ["Item", "Amount"]
  const rows = [
    ["ASSETS", ""],
    ["Inventory", formatCurrency(balanceSheet.assets.inventory)],
    ["Cash & Receivables", formatCurrency(balanceSheet.assets.cashAndReceivables)],
    ["Total Assets", formatCurrency(balanceSheet.assets.total)],
    ["", ""],
    ["LIABILITIES", ""],
    ["Expenses", formatCurrency(balanceSheet.liabilities.total)],
    ["Total Liabilities", formatCurrency(balanceSheet.liabilities.total)],
    ["", ""],
    ["EQUITY", ""],
    ["Equity", formatCurrency(balanceSheet.equity)],
    ["", ""],
    [
      "Total Liabilities & Equity",
      formatCurrency(balanceSheet.liabilities.total + balanceSheet.equity),
    ],
  ]
  downloadCSV([headers, ...rows], `balance-sheet-${startDate}-to-${endDate}.csv`)
}

export function BalanceSheet({
  balanceSheet,
  startDate,
  endDate,
}: BalanceSheetProps) {
  return (
    <Card.Root
      variant="outline"
      bg="bg.surface"
      borderColor="border.card"
      borderWidth="1px"
    >
      <Card.Body>
        <VStack align="stretch" gap={6}>
          <HStack justify="space-between">
            <Heading size="lg">Balance Sheet</Heading>
            <Button
              size="sm"
              variant="outline"
              onClick={() => exportBalanceSheetToCSV(balanceSheet, startDate, endDate)}
            >
              <FiDownload size={14} style={{ marginRight: "4px" }} />
              Export CSV
            </Button>
          </HStack>

          <Grid
            templateColumns={{
              base: "1fr",
              lg: "repeat(2, 1fr)",
            }}
            gap={6}
          >
            {/* Assets */}
            <Box>
              <Heading size="md" mb={4}>
                Assets
              </Heading>
              <VStack align="stretch" gap={3}>
                <HStack
                  justify="space-between"
                  p={3}
                  bg="item.bg"
                  borderRadius="md"
                  border="1px solid"
                  borderColor="item.border"
                  _hover={{ bg: "item.bg.hover" }}
                >
                  <Text fontWeight="medium" color="fg.muted">
                    Inventory
                  </Text>
                  <Text fontWeight="bold">
                    Ksh {formatCurrency(balanceSheet.assets.inventory)}
                  </Text>
                </HStack>
                <HStack
                  justify="space-between"
                  p={3}
                  bg="item.bg"
                  borderRadius="md"
                  border="1px solid"
                  borderColor="item.border"
                  _hover={{ bg: "item.bg.hover" }}
                >
                  <Text fontWeight="medium" color="fg.muted">
                    Cash & Receivables
                  </Text>
                  <Text fontWeight="bold">
                    Ksh {formatCurrency(balanceSheet.assets.cashAndReceivables)}
                  </Text>
                </HStack>
                <Separator />
                <HStack justify="space-between" p={3} bg="teal.500" borderRadius="md">
                  <Text fontWeight="bold" color="white">
                    Total Assets
                  </Text>
                  <Text fontWeight="bold" fontSize="lg" color="white">
                    Ksh {formatCurrency(balanceSheet.assets.total)}
                  </Text>
                </HStack>
              </VStack>
            </Box>

            {/* Liabilities & Equity */}
            <Box>
              <Heading size="md" mb={4}>
                Liabilities & Equity
              </Heading>
              <VStack align="stretch" gap={3}>
                <HStack
                  justify="space-between"
                  p={3}
                  bg="item.bg"
                  borderRadius="md"
                  border="1px solid"
                  borderColor="item.border"
                  _hover={{ bg: "item.bg.hover" }}
                >
                  <Text fontWeight="medium" color="fg.muted">
                    Expenses (Liabilities)
                  </Text>
                  <Text fontWeight="bold">
                    Ksh {formatCurrency(balanceSheet.liabilities.total)}
                  </Text>
                </HStack>
                <Separator />
                <HStack justify="space-between" p={3} bg="blue.500" borderRadius="md">
                  <Text fontWeight="bold" color="white">
                    Equity
                  </Text>
                  <Text fontWeight="bold" fontSize="lg" color="white">
                    Ksh {formatCurrency(balanceSheet.equity)}
                  </Text>
                </HStack>
                <Separator />
                <HStack justify="space-between" p={3} bg="purple.500" borderRadius="md">
                  <Text fontWeight="bold" color="white">
                    Total Liabilities & Equity
                  </Text>
                  <Text fontWeight="bold" fontSize="lg" color="white">
                    Ksh{" "}
                    {formatCurrency(
                      balanceSheet.liabilities.total + balanceSheet.equity
                    )}
                  </Text>
                </HStack>
              </VStack>
            </Box>
          </Grid>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}

