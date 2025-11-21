import { Box, Grid, HStack, VStack, Text, Icon } from "@chakra-ui/react"
import { FiArrowUp, FiArrowDown } from "react-icons/fi"
import { formatCurrency } from "./utils"

interface StatsCardsProps {
  totalRevenue: number
  isMounted: boolean
}

export function StatsCards({ totalRevenue, isMounted }: StatsCardsProps) {
  return (
    <Box 
      mb={8}
      opacity={isMounted ? 1 : 0}
      transform={isMounted ? "translateY(0)" : "translateY(20px)"}
      transition="all 0.5s ease 0.1s"
    >
      <Grid
        templateColumns={{
          base: "repeat(1, 1fr)",
          md: "repeat(2, 1fr)",
          lg: "repeat(4, 1fr)",
        }}
        gap={4}
      >
        {/* Potential Growth Card */}
        <Box 
          p={5} 
          bg={{ base: "#1a1d29", _light: "#ffffff" }}
          borderRadius="lg" 
          border="1px solid"
          borderColor={{ base: "rgba(255, 255, 255, 0.08)", _light: "#e5e7eb" }}
          boxShadow={{ base: "0 2px 4px rgba(0, 0, 0, 0.2)", _light: "0 1px 3px rgba(0, 0, 0, 0.1)" }}
          transition="all 0.3s ease"
          _hover={{ 
            shadow: { base: "0 4px 12px rgba(0, 0, 0, 0.3)", _light: "0 4px 12px rgba(0, 0, 0, 0.15)" },
            transform: "translateY(-2px)",
          }}
          position="relative"
          overflow="hidden"
        >
          <HStack justify="space-between" mb={2} align="start">
            <VStack align="start" gap={0}>
              <Text fontSize="xs" color={{ base: "#9ca3af", _light: "#6b7280" }} fontWeight="500" textTransform="uppercase" letterSpacing="0.5px">
                Potential growth
              </Text>
              <Text 
                fontSize="2xl" 
                fontWeight="700"
                color={{ base: "#ffffff", _light: "#1a1d29" }}
                mt={1}
              >
                {formatCurrency(0)}
              </Text>
            </VStack>
            <Icon as={FiArrowUp} color="#22c55e" fontSize="lg" />
          </HStack>
          <HStack gap={1}>
            <Text fontSize="xs" color="#22c55e" fontWeight="600">+3.5%</Text>
          </HStack>
        </Box>

        {/* Revenue Current Card */}
        <Box 
          p={5} 
          bg={{ base: "#1a1d29", _light: "#ffffff" }}
          borderRadius="lg" 
          border="1px solid"
          borderColor={{ base: "rgba(255, 255, 255, 0.08)", _light: "#e5e7eb" }}
          boxShadow={{ base: "0 2px 4px rgba(0, 0, 0, 0.2)", _light: "0 1px 3px rgba(0, 0, 0, 0.1)" }}
          transition="all 0.3s ease"
          _hover={{ 
            shadow: { base: "0 4px 12px rgba(0, 0, 0, 0.3)", _light: "0 4px 12px rgba(0, 0, 0, 0.15)" },
            transform: "translateY(-2px)",
          }}
          position="relative"
          overflow="hidden"
        >
          <HStack justify="space-between" mb={2} align="start">
            <VStack align="start" gap={0}>
              <Text fontSize="xs" color={{ base: "#9ca3af", _light: "#6b7280" }} fontWeight="500" textTransform="uppercase" letterSpacing="0.5px">
                Revenue current
              </Text>
              <Text 
                fontSize="2xl" 
                fontWeight="700"
                color={{ base: "#ffffff", _light: "#1a1d29" }}
                mt={1}
              >
                {formatCurrency(totalRevenue)}
              </Text>
            </VStack>
            <Icon as={FiArrowUp} color="#22c55e" fontSize="lg" />
          </HStack>
          <HStack gap={1}>
            <Text fontSize="xs" color="#22c55e" fontWeight="600">+11%</Text>
          </HStack>
        </Box>

        {/* Daily Income Card */}
        <Box 
          p={5} 
          bg={{ base: "#1a1d29", _light: "#ffffff" }}
          borderRadius="lg" 
          border="1px solid"
          borderColor={{ base: "rgba(255, 255, 255, 0.08)", _light: "#e5e7eb" }}
          boxShadow={{ base: "0 2px 4px rgba(0, 0, 0, 0.2)", _light: "0 1px 3px rgba(0, 0, 0, 0.1)" }}
          transition="all 0.3s ease"
          _hover={{ 
            shadow: { base: "0 4px 12px rgba(0, 0, 0, 0.3)", _light: "0 4px 12px rgba(0, 0, 0, 0.15)" },
            transform: "translateY(-2px)",
          }}
          position="relative"
          overflow="hidden"
        >
          <HStack justify="space-between" mb={2} align="start">
            <VStack align="start" gap={0}>
              <Text fontSize="xs" color={{ base: "#9ca3af", _light: "#6b7280" }} fontWeight="500" textTransform="uppercase" letterSpacing="0.5px">
                Daily Income
              </Text>
              <Text 
                fontSize="2xl" 
                fontWeight="700"
                color={{ base: "#ffffff", _light: "#1a1d29" }}
                mt={1}
              >
                {formatCurrency(0)}
              </Text>
            </VStack>
            <Icon as={FiArrowDown} color="#ef4444" fontSize="lg" />
          </HStack>
          <HStack gap={1}>
            <Text fontSize="xs" color="#ef4444" fontWeight="600">-2.4%</Text>
          </HStack>
        </Box>

        {/* Expense Current Card */}
        <Box 
          p={5} 
          bg={{ base: "#1a1d29", _light: "#ffffff" }}
          borderRadius="lg" 
          border="1px solid"
          borderColor={{ base: "rgba(255, 255, 255, 0.08)", _light: "#e5e7eb" }}
          boxShadow={{ base: "0 2px 4px rgba(0, 0, 0, 0.2)", _light: "0 1px 3px rgba(0, 0, 0, 0.1)" }}
          transition="all 0.3s ease"
          _hover={{ 
            shadow: { base: "0 4px 12px rgba(0, 0, 0, 0.3)", _light: "0 4px 12px rgba(0, 0, 0, 0.15)" },
            transform: "translateY(-2px)",
          }}
          position="relative"
          overflow="hidden"
        >
          <HStack justify="space-between" mb={2} align="start">
            <VStack align="start" gap={0}>
              <Text fontSize="xs" color={{ base: "#9ca3af", _light: "#6b7280" }} fontWeight="500" textTransform="uppercase" letterSpacing="0.5px">
                Expense current
              </Text>
              <Text 
                fontSize="2xl" 
                fontWeight="700"
                color={{ base: "#ffffff", _light: "#1a1d29" }}
                mt={1}
              >
                {formatCurrency(0)}
              </Text>
            </VStack>
            <Icon as={FiArrowUp} color="#22c55e" fontSize="lg" />
          </HStack>
          <HStack gap={1}>
            <Text fontSize="xs" color="#22c55e" fontWeight="600">+3.5%</Text>
          </HStack>
        </Box>
      </Grid>
    </Box>
  )
}

