import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Box,
  Flex,
  Separator,
  Grid,
} from "@chakra-ui/react";
import { FiEdit, FiPackage, FiUpload } from "react-icons/fi";
import { Button } from "../../../components/ui/button";
import AddProduct from "../../../components/Products/AddProduct";
import useAuth from "../../../hooks/useAuth";

export const Route = createFileRoute("/_layout/stock-entry/")({
  component: StockEntry,
});

// Main Component
function StockEntry() {
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()

  return (
    <Container maxW="full" minH="100vh" py={8}>
      <VStack gap={8} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="start">
          <Box>
            <Heading 
              size="2xl" 
              mb={2}
              color={{ base: "#e5e7eb", _light: "#111827" }}
            >
              Stock Entry Management
            </Heading>
            <Text color={{ base: "#d1d5db", _light: "#6b7280" }} fontSize="lg">
              Manage your product inventory and stock operations
            </Text>
          </Box>
        </Flex>

        {/* Main Action Cards */}
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
          {/* Add Product Card */}
          <Box
            p={8}
            borderWidth="2px"
            borderRadius="lg"
            bg={{ base: "gray.900", _light: "white" }}
            borderColor={{ base: "gray.700", _light: "gray.200" }}
            _hover={{ 
              borderColor: "teal.500",
              transform: "translateY(-2px)",
              boxShadow: "lg"
            }}
            transition="all 0.2s"
          >
            <VStack align="stretch" gap={4}>
              <Box
                p={4}
                borderRadius="full"
                bg={{ base: "teal.900/30", _light: "teal.50" }}
                w="fit-content"
              >
                <FiPackage size={32} color="var(--chakra-colors-teal-500)" />
              </Box>
              <Heading size="md" color={{ base: "#e5e7eb", _light: "#111827" }}>
                Add New Product
              </Heading>
              <Text color={{ base: "#d1d5db", _light: "#6b7280" }}>
                Create a new product entry in your inventory system. Define product details, 
                pricing, and initial categorization.
              </Text>
              <Box pt={2}>
                <AddProduct />
              </Box>
            </VStack>
          </Box>

          {/* Bulk Import Card - Admin Only */}
          {currentUser?.is_superuser && (
            <Box
              p={8}
              borderWidth="2px"
              borderRadius="lg"
              bg={{ base: "gray.900", _light: "white" }}
              borderColor={{ base: "gray.700", _light: "gray.200" }}
              _hover={{ 
                borderColor: "blue.500",
                transform: "translateY(-2px)",
                boxShadow: "lg"
              }}
              transition="all 0.2s"
              cursor="pointer"
              onClick={() => navigate({ to: "/stock-entry/bulk-import" })}
            >
              <VStack align="stretch" gap={4}>
                <Box
                  p={4}
                  borderRadius="full"
                  bg={{ base: "blue.900/30", _light: "blue.50" }}
                  w="fit-content"
                >
                  <FiUpload size={32} color="var(--chakra-colors-blue-500)" />
                </Box>
                <Heading size="md" color={{ base: "#e5e7eb", _light: "#111827" }}>
                  Bulk Import Products
                </Heading>
                <Text color={{ base: "#d1d5db", _light: "#6b7280" }}>
                  Import multiple products at once using a CSV or Excel file. Perfect for 
                  setting up your inventory quickly or updating multiple items.
                </Text>
                <Box pt={2}>
                  <Button
                    variant="outline"
                    colorScheme="blue"
                    size="lg"
                    w="full"
                  >
                    <FiUpload /> Start Bulk Import
                  </Button>
                </Box>
              </VStack>
            </Box>
          )}
        </Grid>

        <Separator />

        {/* Quick Links Section */}
        <Box>
          <Heading size="md" mb={4} color={{ base: "#e5e7eb", _light: "#111827" }}>
            Quick Access
          </Heading>
          <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4}>
            {/* Stock Adjustment Link */}
            <Box
              p={6}
              borderWidth="1px"
              borderRadius="md"
              bg={{ base: "gray.900", _light: "white" }}
              borderColor={{ base: "gray.700", _light: "gray.200" }}
              _hover={{ 
                borderColor: "purple.500",
                bg: { base: "gray.800", _light: "gray.50" }
              }}
              cursor="pointer"
              transition="all 0.2s"
              onClick={() => navigate({ to: "/stock-adjustment" })}
            >
              <VStack align="start" gap={2}>
                <HStack>
                  <Box color="purple.500">
                    <FiEdit size={20} />
                  </Box>
                  <Text fontWeight="semibold">Stock Adjustment</Text>
                </HStack>
                <Text fontSize="sm" color={{ base: "gray.400", _light: "gray.600" }}>
                  Adjust current stock levels and reorder points
                </Text>
              </VStack>
            </Box>

            {/* Products Management Link */}
            <Box
              p={6}
              borderWidth="1px"
              borderRadius="md"
              bg={{ base: "gray.900", _light: "white" }}
              borderColor={{ base: "gray.700", _light: "gray.200" }}
              _hover={{ 
                borderColor: "teal.500",
                bg: { base: "gray.800", _light: "gray.50" }
              }}
              cursor="pointer"
              transition="all 0.2s"
              onClick={() => navigate({ to: "/products" })}
            >
              <VStack align="start" gap={2}>
                <HStack>
                  <Box color="teal.500">
                    <FiPackage size={20} />
                  </Box>
                  <Text fontWeight="semibold">Products Management</Text>
                </HStack>
                <Text fontSize="sm" color={{ base: "gray.400", _light: "gray.600" }}>
                  View and manage all your products
                </Text>
              </VStack>
            </Box>

            {/* GRN Link */}
            <Box
              p={6}
              borderWidth="1px"
              borderRadius="md"
              bg={{ base: "gray.900", _light: "white" }}
              borderColor={{ base: "gray.700", _light: "gray.200" }}
              _hover={{ 
                borderColor: "orange.500",
                bg: { base: "gray.800", _light: "gray.50" }
              }}
              cursor="pointer"
              transition="all 0.2s"
              onClick={() => navigate({ to: "/grn" })}
            >
              <VStack align="start" gap={2}>
                <HStack>
                  <Box color="orange.500">
                    <FiUpload size={20} />
                  </Box>
                  <Text fontWeight="semibold">Goods Receipt Note (GRN)</Text>
                </HStack>
                <Text fontSize="sm" color={{ base: "gray.400", _light: "gray.600" }}>
                  Record incoming stock and deliveries
                </Text>
              </VStack>
            </Box>
          </Grid>
        </Box>

        {/* Info Box */}
        <Box
          p={6}
          borderRadius="md"
          bg={{ base: "blue.900/20", _light: "blue.50" }}
          borderWidth="1px"
          borderColor={{ base: "blue.700", _light: "blue.200" }}
        >
          <HStack gap={3} align="start">
            <Box color={{ base: "blue.400", _light: "blue.600" }} mt={1}>
              <FiPackage size={24} />
            </Box>
            <VStack align="start" gap={2}>
              <Text fontWeight="semibold" color={{ base: "blue.300", _light: "blue.700" }}>
                Stock Management Workflow
              </Text>
              <Text fontSize="sm" color={{ base: "gray.400", _light: "gray.600" }}>
                <strong>1. Add Products:</strong> Create new product entries with pricing and details<br/>
                <strong>2. Stock Adjustment:</strong> Set initial stock levels and reorder points<br/>
                <strong>3. GRN:</strong> Record incoming deliveries and update stock<br/>
                <strong>4. Monitor:</strong> Track stock levels and manage your inventory
              </Text>
            </VStack>
          </HStack>
        </Box>
      </VStack>
    </Container>
  );
}