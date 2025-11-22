import { Box, Button, Card, HStack, Input, Text, VStack } from "@chakra-ui/react"
import { FiRefreshCw } from "react-icons/fi"

interface DateFiltersProps {
  startDate: string
  endDate: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  onRefresh: () => void
  isLoading?: boolean
}

export function DateFilters({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onRefresh,
  isLoading = false,
}: DateFiltersProps) {
  const setDateRange = (range: string) => {
    const end = new Date()
    let start = new Date()

    switch (range) {
      case "today":
        start = new Date()
        break
      case "week":
        start.setDate(end.getDate() - 7)
        break
      case "month":
        start = new Date(end.getFullYear(), end.getMonth(), 1)
        break
      case "quarter":
        start.setMonth(end.getMonth() - 3)
        break
      case "year":
        start = new Date(end.getFullYear(), 0, 1)
        break
    }

    onStartDateChange(start.toISOString().split("T")[0])
    onEndDateChange(end.toISOString().split("T")[0])
  }

  return (
    <Card.Root
      variant="outline"
      bg="bg.surface"
      borderColor="border.card"
      borderWidth="1px"
    >
      <Card.Body>
        <VStack gap={4} align="stretch">
          <HStack gap={4} flexWrap="wrap" align="end">
            <Box flex="1" minW="200px">
              <Text fontSize="sm" fontWeight="semibold" mb={2}>
                Start Date
              </Text>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                size="md"
              />
            </Box>
            <Box flex="1" minW="200px">
              <Text fontSize="sm" fontWeight="semibold" mb={2}>
                End Date
              </Text>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                size="md"
              />
            </Box>
            <Button
              size="md"
              colorPalette="teal"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <FiRefreshCw style={{ marginRight: "8px" }} />
              Refresh
            </Button>
          </HStack>

          {/* Quick Date Presets */}
          <HStack gap={2} flexWrap="wrap">
            <Text fontSize="sm" fontWeight="semibold">
              Quick Select:
            </Text>
            <Button size="sm" variant="outline" onClick={() => setDateRange("today")}>
              Today
            </Button>
            <Button size="sm" variant="outline" onClick={() => setDateRange("week")}>
              Last 7 Days
            </Button>
            <Button size="sm" variant="outline" onClick={() => setDateRange("month")}>
              This Month
            </Button>
            <Button size="sm" variant="outline" onClick={() => setDateRange("quarter")}>
              Last Quarter
            </Button>
            <Button size="sm" variant="outline" onClick={() => setDateRange("year")}>
              This Year
            </Button>
          </HStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}

