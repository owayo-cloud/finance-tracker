import { Box, Container, Grid, Heading, Text } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"
import {
  FiBarChart2,
  FiBox,
  FiDollarSign,
  FiPackage,
  FiShoppingCart,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi"
import { TbReceiptDollar } from "react-icons/tb"

import useAuth from "@/hooks/useAuth"
import ModuleCard from "@/components/Common/ModuleCard"

export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
})

function Dashboard() {
  const { user: currentUser } = useAuth()

  // Define all modules with their properties
  const modules = [
    {
      icon: FiBox,
      title: "Stock Entry",
      description: "Access module",
      path: "/stock-entry",
      iconColor: "blue.600",
      iconBg: "blue.50",
      adminOnly: false,
    },
    {
      icon: FiShoppingCart,
      title: "Sales",
      description: "Access module",
      path: "/sales",
      iconColor: "green.600",
      iconBg: "green.50",
      adminOnly: false,
    },
    {
      icon: FiPackage,
      title: "Products",
      description: "Admin only",
      path: "/products",
      iconColor: "purple.600",
      iconBg: "purple.50",
      adminOnly: true,
    },
    {
      icon: FiBarChart2,
      title: "Reports",
      description: "Access module",
      path: "/reports",
      iconColor: "orange.600",
      iconBg: "orange.50",
      adminOnly: false,
    },
    {
      icon: TbReceiptDollar,
      title: "Shift Reconciliation",
      description: "Access module",
      path: "/shift-reconciliation",
      iconColor: "pink.600",
      iconBg: "pink.50",
      adminOnly: false,
    },
    {
      icon: FiDollarSign,
      title: "Expenses",
      description: "Admin only",
      path: "/expenses",
      iconColor: "red.600",
      iconBg: "red.50",
      adminOnly: true,
    },
    {
      icon: FiTrendingUp,
      title: "Debts",
      description: "Access module",
      path: "/debts",
      iconColor: "yellow.600",
      iconBg: "yellow.50",
      adminOnly: false,
    },
    {
      icon: FiUsers,
      title: "Users",
      description: "Admin only",
      path: "/admin",
      iconColor: "indigo.600",
      iconBg: "indigo.50",
      adminOnly: true,
    },
  ]

  // Filter modules based on user role
  const availableModules = modules.filter(
    (module) => !module.adminOnly || currentUser?.is_superuser
  )

  return (
    <Container maxW="full" minH="100vh">
      {/* Welcome Header */}
      <Box pt={12} pb={8}>
        <Heading size="2xl" mb={2}>
          Hi, {currentUser?.full_name || currentUser?.email} 👋🏼
        </Heading>
        <Text fontSize="lg" color="gray.600">
          Welcome back, nice to see you again!
        </Text>
      </Box>

      {/* Module Cards Grid */}
      <Grid
        templateColumns={{
          base: "repeat(1, 1fr)",
          sm: "repeat(2, 1fr)",
          md: "repeat(2, 1fr)",
          lg: "repeat(3, 1fr)",
          xl: "repeat(4, 1fr)",
        }}
        gap={{ base: 4, md: 5, lg: 6 }}
        pb={8}
        alignItems="stretch"
      >
        {availableModules.map((module) => (
          <ModuleCard
            key={module.title}
            icon={module.icon}
            title={module.title}
            description={module.description}
            path={module.path}
            iconColor={module.iconColor}
            iconBg={module.iconBg}
          />
        ))}
      </Grid>

      {/* Quick Stats Section */}
      {currentUser?.is_superuser && (
        <Box 
          mt={8} 
          p={6} 
          bg={{ base: "gray.800", _light: "white" }}
          borderRadius="xl" 
          border="1px solid"
          borderColor={{ base: "gray.700", _light: "gray.200" }}
          shadow="sm"
        >
          <Heading size="md" mb={6}>
            Today's Overview
          </Heading>
          <Grid
            templateColumns={{
              base: "repeat(1, 1fr)",
              md: "repeat(2, 1fr)",
              lg: "repeat(4, 1fr)",
            }}
            gap={6}
          >
            <Box 
              p={5} 
              bg={{ base: "gray.700", _light: "gray.50" }}
              borderRadius="lg" 
              shadow="sm"
              border="1px solid"
              borderColor={{ base: "gray.600", _light: "gray.200" }}
              transition="all 0.2s"
              _hover={{ 
                shadow: "md",
                transform: "translateY(-1px)" 
              }}
            >
              <Text fontSize="sm" color={{ base: "gray.400", _light: "gray.600" }} mb={2} fontWeight="medium">
                Total Sales
              </Text>
              <Text fontSize="3xl" fontWeight="bold">
                KES 0.00
              </Text>
            </Box>
            <Box 
              p={5} 
              bg={{ base: "gray.700", _light: "gray.50" }}
              borderRadius="lg" 
              shadow="sm"
              border="1px solid"
              borderColor={{ base: "gray.600", _light: "gray.200" }}
              transition="all 0.2s"
              _hover={{ 
                shadow: "md",
                transform: "translateY(-1px)" 
              }}
            >
              <Text fontSize="sm" color={{ base: "gray.400", _light: "gray.600" }} mb={2} fontWeight="medium">
                Transactions
              </Text>
              <Text fontSize="3xl" fontWeight="bold">
                0
              </Text>
            </Box>
            <Box 
              p={5} 
              bg={{ base: "gray.700", _light: "gray.50" }}
              borderRadius="lg" 
              shadow="sm"
              border="1px solid"
              borderColor={{ base: "gray.600", _light: "gray.200" }}
              transition="all 0.2s"
              _hover={{ 
                shadow: "md",
                transform: "translateY(-1px)" 
              }}
            >
              <Text fontSize="sm" color={{ base: "gray.400", _light: "gray.600" }} mb={2} fontWeight="medium">
                Low Stock Items
              </Text>
              <Text fontSize="3xl" fontWeight="bold" color="orange.500">
                0
              </Text>
            </Box>
            <Box 
              p={5} 
              bg={{ base: "gray.700", _light: "gray.50" }}
              borderRadius="lg" 
              shadow="sm"
              border="1px solid"
              borderColor={{ base: "gray.600", _light: "gray.200" }}
              transition="all 0.2s"
              _hover={{ 
                shadow: "md",
                transform: "translateY(-1px)" 
              }}
            >
              <Text fontSize="sm" color={{ base: "gray.400", _light: "gray.600" }} mb={2} fontWeight="medium">
                Pending Debts
              </Text>
              <Text fontSize="3xl" fontWeight="bold" color="red.500">
                KES 0.00
              </Text>
            </Box>
          </Grid>
        </Box>
      )}
    </Container>
  )
}
