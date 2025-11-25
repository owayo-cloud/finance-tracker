import { Box, Button, Flex, HStack, Input, Text, Icon } from "@chakra-ui/react"
import { FiSearch } from "react-icons/fi"

interface ReceiptDetailsProps {
  receiptDate: string
  receiptDateValue: string
  onReceiptDateChange: (date: string) => void
  onReceiptDateFocus: (e: React.FocusEvent<HTMLInputElement>) => void
  onReceiptDateBlur: (e: React.FocusEvent<HTMLInputElement>) => void
  pricelist: string
  onPricelistChange: (value: string) => void
  onSearch: () => void
}

export function ReceiptDetails({
  receiptDate,
  receiptDateValue: _receiptDateValue,
  onReceiptDateChange,
  onReceiptDateFocus,
  onReceiptDateBlur,
  pricelist,
  onPricelistChange,
  onSearch,
}: ReceiptDetailsProps) {
  return (
    <Box
      bg="bg.canvas"
      borderBottom="1px solid"
      borderColor="border.card"
      p={{ base: 3, md: 4 }}
    >
      <Flex gap={4} alignItems="center" flexWrap="wrap">
        <HStack gap={2} alignItems="center">
          <Text fontSize="sm" fontWeight="medium" color="text.primary">
            Receipt Date *
          </Text>
          <Input
            type="text"
            value={receiptDate}
            onChange={(e) => onReceiptDateChange(e.target.value)}
            onFocus={onReceiptDateFocus}
            onBlur={onReceiptDateBlur}
            bg="input.bg"
            borderColor="input.border"
            color="text.primary"
            size="sm"
            w={{ base: "120px", md: "150px" }}
            borderRadius="md"
          />
        </HStack>
        <HStack gap={2} alignItems="center">
          <Text fontSize="sm" fontWeight="medium" color="text.primary">
            Pricelist Name
          </Text>
          <Input
            type="text"
            value={pricelist}
            onChange={(e) => onPricelistChange(e.target.value)}
            bg="input.bg"
            borderColor="input.border"
            color="text.primary"
            border="1px solid"
            size="sm"
            w={{ base: "100px", md: "120px" }}
            borderRadius="md"
            _focus={{ borderColor: "input.focus.border", boxShadow: "input.focus.shadow" }}
          />
        </HStack>
        <Button bg="brand.secondary" color="white" _hover={{ bg: "brand.secondary.hover" }} fontWeight="600" size="sm" onClick={onSearch}>
          <Icon as={FiSearch} mr={2} />
          Search
        </Button>
      </Flex>
    </Box>
  )
}

