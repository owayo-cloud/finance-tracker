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
      bg={{ base: "#1a1d29", _light: "#ffffff" }}
      borderBottom="1px solid"
      borderColor={{ base: "rgba(255, 255, 255, 0.08)", _light: "#e5e7eb" }}
      p={{ base: 3, md: 4 }}
    >
      <Flex gap={4} alignItems="center" flexWrap="wrap">
        <HStack gap={2} alignItems="center">
          <Text fontSize="sm" fontWeight="medium" color={{ base: "#ffffff", _light: "#1a1d29" }}>
            Receipt Date *
          </Text>
          <Input
            type="text"
            value={receiptDate}
            onChange={(e) => onReceiptDateChange(e.target.value)}
            onFocus={onReceiptDateFocus}
            onBlur={onReceiptDateBlur}
            bg={{ base: "#1a1d29", _light: "#ffffff" }}
            borderColor={{ base: "rgba(255, 255, 255, 0.1)", _light: "#e5e7eb" }}
            color={{ base: "#ffffff", _light: "#1a1d29" }}
            size="sm"
            w={{ base: "120px", md: "150px" }}
            borderRadius="md"
          />
        </HStack>
        <HStack gap={2} alignItems="center">
          <Text fontSize="sm" fontWeight="medium" color={{ base: "#ffffff", _light: "#1a1d29" }}>
            Pricelist Name
          </Text>
          <Input
            type="text"
            value={pricelist}
            onChange={(e) => onPricelistChange(e.target.value)}
            bg={{ base: "#1a1d29", _light: "#ffffff" }}
            borderColor={{ base: "rgba(255, 255, 255, 0.1)", _light: "#e5e7eb" }}
            color={{ base: "#ffffff", _light: "#1a1d29" }}
            border="1px solid"
            size="sm"
            w={{ base: "100px", md: "120px" }}
            borderRadius="md"
            _focus={{ borderColor: "#14b8a6", boxShadow: "0 0 0 1px #14b8a6" }}
          />
        </HStack>
        <Button bg="#3b82f6" color="white" _hover={{ bg: "#2563eb" }} fontWeight="600" size="sm" onClick={onSearch}>
          <Icon as={FiSearch} mr={2} />
          Search
        </Button>
      </Flex>
    </Box>
  )
}

