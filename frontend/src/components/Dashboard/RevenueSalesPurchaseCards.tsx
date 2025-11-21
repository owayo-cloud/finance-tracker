import { Box, Grid, HStack, VStack, Text, Icon } from "@chakra-ui/react"
import { FiBox, FiShoppingCart, FiPackage } from "react-icons/fi"
import { formatCurrency } from "./utils"

interface RevenueSalesPurchaseCardsProps {
  totalRevenue: number
  isMounted: boolean
}

export function RevenueSalesPurchaseCards({ totalRevenue, isMounted }: RevenueSalesPurchaseCardsProps) {
  return (
    <Box 
      mb={8}
      opacity={isMounted ? 1 : 0}
      transform={isMounted ? "translateY(0)" : "translateY(20px)"}
      transition="all 0.5s ease 0.4s"
    >
      <Grid
        templateColumns={{
          base: "repeat(1, 1fr)",
          md: "repeat(3, 1fr)",
        }}
        gap={4}
      >
        {/* Revenue Card */}
        <Box 
          p={6} 
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
          <HStack justify="space-between" align="start" mb={3}>
            <VStack align="start" gap={0} flex={1}>
              <Text fontSize="xs" color={{ base: "#9ca3af", _light: "#6b7280" }} fontWeight="500" textTransform="uppercase" letterSpacing="0.5px" mb={2}>
                Revenue
              </Text>
              <Text 
                fontSize="3xl" 
                fontWeight="700"
                color={{ base: "#ffffff", _light: "#1a1d29" }}
                mb={1}
              >
                {formatCurrency(totalRevenue)}
              </Text>
              <HStack gap={2} mt={1}>
                <Text fontSize="xs" color="#22c55e" fontWeight="600">+3.5%</Text>
                <Text fontSize="xs" color={{ base: "#6b7280", _light: "#9ca3af" }}>11.38% Since last month</Text>
              </HStack>
            </VStack>
            <Box
              w={12}
              h={12}
              borderRadius="full"
              bg="rgba(59, 130, 246, 0.15)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <Icon as={FiBox} fontSize="xl" color="#3b82f6" />
            </Box>
          </HStack>
        </Box>

        {/* Sales Card */}
        <Box 
          p={6} 
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
          <HStack justify="space-between" align="start" mb={3}>
            <VStack align="start" gap={0} flex={1}>
              <Text fontSize="xs" color={{ base: "#9ca3af", _light: "#6b7280" }} fontWeight="500" textTransform="uppercase" letterSpacing="0.5px" mb={2}>
                Sales
              </Text>
              <Text 
                fontSize="3xl" 
                fontWeight="700"
                color={{ base: "#ffffff", _light: "#1a1d29" }}
                mb={1}
              >
                {formatCurrency(totalRevenue)}
              </Text>
              <HStack gap={2} mt={1}>
                <Text fontSize="xs" color="#22c55e" fontWeight="600">+8.3%</Text>
                <Text fontSize="xs" color={{ base: "#6b7280", _light: "#9ca3af" }}>9.61% Since last month</Text>
              </HStack>
            </VStack>
            <Box
              w={12}
              h={12}
              borderRadius="full"
              bg="rgba(239, 68, 68, 0.15)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <Icon as={FiShoppingCart} fontSize="xl" color="#ef4444" />
            </Box>
          </HStack>
        </Box>

        {/* Purchase Card */}
        <Box 
          p={6} 
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
          <HStack justify="space-between" align="start" mb={3}>
            <VStack align="start" gap={0} flex={1}>
              <Text fontSize="xs" color={{ base: "#9ca3af", _light: "#6b7280" }} fontWeight="500" textTransform="uppercase" letterSpacing="0.5px" mb={2}>
                Purchase
              </Text>
              <Text 
                fontSize="3xl" 
                fontWeight="700"
                color={{ base: "#ffffff", _light: "#1a1d29" }}
                mb={1}
              >
                {formatCurrency(0)}
              </Text>
              <HStack gap={2} mt={1}>
                <Text fontSize="xs" color="#ef4444" fontWeight="600">-2.1%</Text>
                <Text fontSize="xs" color={{ base: "#6b7280", _light: "#9ca3af" }}>2.27% Since last month</Text>
              </HStack>
            </VStack>
            <Box
              w={12}
              h={12}
              borderRadius="full"
              bg="rgba(34, 197, 94, 0.15)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <Icon as={FiPackage} fontSize="xl" color="#22c55e" />
            </Box>
          </HStack>
        </Box>
      </Grid>
    </Box>
  )
}

