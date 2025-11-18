import { Box, Container, Grid, Heading, Text, HStack } from "@chakra-ui/react"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { useState, useEffect } from "react"
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
import { UsersService } from "@/client"
import { useColorMode } from "@/components/ui/color-mode"

export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
  beforeLoad: async () => {
    // CRITICAL: Ensure only admins can access the admin dashboard
    try {
      const user = await UsersService.readUserMe()
      
      // If user is a cashier (not superuser), redirect to sales dashboard
      if (!user.is_superuser) {
        throw redirect({
          to: "/sales",
        })
      }
    } catch (error) {
      // Re-throw redirect errors
      throw error
    }
  },
})

function Dashboard() {
  const { user: currentUser } = useAuth()
  const { colorMode } = useColorMode()

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Theme-aware gradient styles
  const headingGradient = colorMode === "dark" 
    ? "linear-gradient(to right, #60a5fa, #3b82f6, #2563eb)"
    : "linear-gradient(to right, #2563eb, #3b82f6, #60a5fa)"
  
  const valueGradient = colorMode === "dark"
    ? "linear-gradient(to right, #60a5fa, #3b82f6)"
    : "linear-gradient(to right, #2563eb, #3b82f6)"

  // Define all modules with their properties - Blue theme
  const modules = [
    {
      icon: FiBox,
      title: "Stock Entry",
      description: "Manage inventory",
      path: "/stock-entry",
      iconColor: "#3b82f6",
      iconBg: "rgba(59, 130, 246, 0.1)",
      adminOnly: false,
    },
    {
      icon: FiShoppingCart,
      title: "Sales",
      description: "Process transactions",
      path: "/sales",
      iconColor: "#2563eb",
      iconBg: "rgba(37, 99, 235, 0.1)",
      adminOnly: false,
    },
    {
      icon: FiPackage,
      title: "Products",
      description: "Manage products",
      path: "/products",
      iconColor: "#1d4ed8",
      iconBg: "rgba(29, 78, 216, 0.1)",
      adminOnly: true,
    },
    {
      icon: FiBarChart2,
      title: "Reports",
      description: "View analytics",
      path: "/reports",
      iconColor: "#60a5fa",
      iconBg: "rgba(96, 165, 250, 0.1)",
      adminOnly: false,
    },
    {
      icon: TbReceiptDollar,
      title: "Shift Reconciliation",
      description: "Reconcile shifts",
      path: "/shift-reconciliation",
      iconColor: "#3b82f6",
      iconBg: "rgba(59, 130, 246, 0.1)",
      adminOnly: false,
    },
    {
      icon: FiDollarSign,
      title: "Expenses",
      description: "Track expenses",
      path: "/expenses",
      iconColor: "#2563eb",
      iconBg: "rgba(37, 99, 235, 0.1)",
      adminOnly: true,
    },
    {
      icon: FiTrendingUp,
      title: "Debts",
      description: "Manage debts",
      path: "/debts",
      iconColor: "#1d4ed8",
      iconBg: "rgba(29, 78, 216, 0.1)",
      adminOnly: false,
    },
    {
      icon: FiUsers,
      title: "Users",
      description: "User management",
      path: "/admin",
      iconColor: "#60a5fa",
      iconBg: "rgba(96, 165, 250, 0.1)",
      adminOnly: true,
    },
  ]

  // Filter modules based on user role
  const availableModules = modules.filter(
    (module) => !module.adminOnly || currentUser?.is_superuser
  )

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.8; }
          50% { transform: scale(1.05) rotate(2deg); opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, -30px); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <Box
        position="relative"
        minH="calc(100vh - 80px)"
        overflow="hidden"
        bg="bg.canvas"
      >
        {/* Animated gradient background */}
        <Box
          position="absolute"
          top="-50%"
          left="-50%"
          right="-50%"
          bottom="-50%"
          bgGradient="radial(circle at 20% 30%, rgba(59, 130, 246, 0.15), transparent 50%), radial(circle at 80% 70%, rgba(37, 99, 235, 0.15), transparent 50%), radial(circle at 50% 50%, rgba(96, 165, 250, 0.1), transparent 50%)"
          animation="pulse 10s ease-in-out infinite"
        />

        {/* Floating orbs */}
        <Box
          position="absolute"
          top="10%"
          left="5%"
          w="400px"
          h="400px"
          borderRadius="full"
          bgGradient="radial(circle, rgba(59, 130, 246, 0.2), transparent 70%)"
          filter="blur(80px)"
          animation="float 15s ease-in-out infinite"
        />
        <Box
          position="absolute"
          bottom="10%"
          right="5%"
          w="350px"
          h="350px"
          borderRadius="full"
          bgGradient="radial(circle, rgba(37, 99, 235, 0.2), transparent 70%)"
          filter="blur(80px)"
          animation="float 12s ease-in-out infinite reverse"
        />

        <Container maxW="full" minH="100vh" position="relative" zIndex={1}>
          {/* Welcome Header */}
          <Box 
            pt={12} 
            pb={8}
            opacity={isMounted ? 1 : 0}
            transform={isMounted ? "translateY(0)" : "translateY(20px)"}
            transition="all 0.5s ease"
          >
            <HStack gap={3} mb={3}>
              <Heading 
                size="2xl" 
                fontWeight="bold"
                css={{
                  background: headingGradient,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  color: "transparent",
                  display: "inline-block",
                }}
              >
                Hello {currentUser?.full_name || "user"} 👋🏼
              </Heading>
            </HStack>
            <Text 
              fontSize="lg" 
              color={{ base: "#e5e7eb", _light: "#374151" }}
              letterSpacing="wide"
              fontWeight="500"
            >
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
            {availableModules.map((module, index) => (
              <Box
                key={module.title}
                opacity={isMounted ? 1 : 0}
                transform={isMounted ? "translateY(0)" : "translateY(20px)"}
                transition={`all 0.5s ease ${index * 0.1}s`}
              >
                <ModuleCard
                  icon={module.icon}
                  title={module.title}
                  description={module.description}
                  path={module.path}
                  iconColor={module.iconColor}
                  iconBg={module.iconBg}
                />
              </Box>
            ))}
          </Grid>

          {/* Quick Stats Section */}
          {currentUser?.is_superuser && (
            <Box 
              mt={8} 
              mb={8}
              p={8}
              bg={{ base: "rgba(15, 20, 30, 0.7)", _light: "rgba(255, 255, 255, 0.8)" }}
              backdropFilter="blur(20px) saturate(180%)"
              borderRadius="3xl" 
              border="1px solid"
              borderColor={{ base: "rgba(59, 130, 246, 0.2)", _light: "rgba(59, 130, 246, 0.3)" }}
              shadow={{ base: "0 20px 60px rgba(0, 0, 0, 0.6), 0 0 1px rgba(59, 130, 246, 0.3)", _light: "0 20px 60px rgba(0, 0, 0, 0.1), 0 0 1px rgba(59, 130, 246, 0.2)" }}
              opacity={isMounted ? 1 : 0}
              transform={isMounted ? "translateY(0)" : "translateY(20px)"}
              transition="all 0.5s ease 0.3s"
            >
              <Heading 
                size="md" 
                mb={6}
                css={{
                  background: valueGradient,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
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
                  p={6} 
                  bg={{ base: "rgba(10, 14, 20, 0.6)", _light: "rgba(255, 255, 255, 0.6)" }}
                  borderRadius="xl" 
                  border="1px solid"
                  borderColor={{ base: "rgba(59, 130, 246, 0.2)", _light: "rgba(59, 130, 246, 0.3)" }}
                  transition="all 0.3s ease"
                  _hover={{ 
                    shadow: { base: "0 10px 30px rgba(59, 130, 246, 0.3)", _light: "0 10px 30px rgba(59, 130, 246, 0.2)" },
                    transform: "translateY(-2px)",
                    borderColor: "rgba(59, 130, 246, 0.4)"
                  }}
                >
                  <Text fontSize="sm" color={{ base: "#d1d5db", _light: "#6b7280" }} mb={2} fontWeight="medium">
                    Total Sales
                  </Text>
                  <Text 
                    fontSize="3xl" 
                    fontWeight="bold"
                    css={{
                      background: valueGradient,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    KES 0.00
                  </Text>
                </Box>
                <Box 
                  p={6} 
                  bg={{ base: "rgba(10, 14, 20, 0.6)", _light: "rgba(255, 255, 255, 0.6)" }}
                  borderRadius="xl" 
                  border="1px solid"
                  borderColor={{ base: "rgba(59, 130, 246, 0.2)", _light: "rgba(59, 130, 246, 0.3)" }}
                  transition="all 0.3s ease"
                  _hover={{ 
                    shadow: { base: "0 10px 30px rgba(59, 130, 246, 0.3)", _light: "0 10px 30px rgba(59, 130, 246, 0.2)" },
                    transform: "translateY(-2px)",
                    borderColor: "rgba(59, 130, 246, 0.4)"
                  }}
                >
                  <Text fontSize="sm" color={{ base: "#d1d5db", _light: "#6b7280" }} mb={2} fontWeight="medium">
                    Transactions
                  </Text>
                  <Text 
                    fontSize="3xl" 
                    fontWeight="bold"
                    css={{
                      background: valueGradient,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    0
                  </Text>
                </Box>
                <Box 
                  p={6} 
                  bg={{ base: "rgba(10, 14, 20, 0.6)", _light: "rgba(255, 255, 255, 0.6)" }}
                  borderRadius="xl" 
                  border="1px solid"
                  borderColor={{ base: "rgba(59, 130, 246, 0.2)", _light: "rgba(59, 130, 246, 0.3)" }}
                  transition="all 0.3s ease"
                  _hover={{ 
                    shadow: { base: "0 10px 30px rgba(59, 130, 246, 0.3)", _light: "0 10px 30px rgba(59, 130, 246, 0.2)" },
                    transform: "translateY(-2px)",
                    borderColor: "rgba(59, 130, 246, 0.4)"
                  }}
                >
                  <Text fontSize="sm" color={{ base: "#d1d5db", _light: "#6b7280" }} mb={2} fontWeight="medium">
                    Low Stock Items
                  </Text>
                  <Text fontSize="3xl" fontWeight="bold" color="#f59e0b">
                    0
                  </Text>
                </Box>
                <Box 
                  p={6} 
                  bg={{ base: "rgba(10, 14, 20, 0.6)", _light: "rgba(255, 255, 255, 0.6)" }}
                  borderRadius="xl" 
                  border="1px solid"
                  borderColor={{ base: "rgba(59, 130, 246, 0.2)", _light: "rgba(59, 130, 246, 0.3)" }}
                  transition="all 0.3s ease"
                  _hover={{ 
                    shadow: { base: "0 10px 30px rgba(59, 130, 246, 0.3)", _light: "0 10px 30px rgba(59, 130, 246, 0.2)" },
                    transform: "translateY(-2px)",
                    borderColor: "rgba(59, 130, 246, 0.4)"
                  }}
                >
                  <Text fontSize="sm" color={{ base: "#d1d5db", _light: "#6b7280" }} mb={2} fontWeight="medium">
                    Pending Debts
                  </Text>
                  <Text fontSize="3xl" fontWeight="bold" color="#ef4444">
                    KES 0.00
                  </Text>
                </Box>
              </Grid>
            </Box>
          )}
        </Container>
      </Box>
    </>
  )
}
