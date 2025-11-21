import { Box, Container, Grid } from "@chakra-ui/react"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"

import useAuth from "@/hooks/useAuth"
import { UsersService, SalesService } from "@/client"
import { usePageVisits } from "@/hooks/usePageVisits"
import { DashboardHeader } from "@/components/Dashboard/DashboardHeader"
import { StatsCards } from "@/components/Dashboard/StatsCards"
import { TransactionHistory } from "@/components/Dashboard/TransactionHistory"
import { QuickAccess } from "@/components/Dashboard/QuickAccess"
import { RevenueSalesPurchaseCards } from "@/components/Dashboard/RevenueSalesPurchaseCards"
import { PendingDebtsTable } from "@/components/Dashboard/PendingDebtsTable"
import { modules } from "@/components/Dashboard/constants"

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
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Filter modules based on user role
  const availableModules = modules.filter(
    (module) => !module.adminOnly || currentUser?.is_superuser
  )

  // Get page visits for Quick Access
  const { getMostVisitedPages } = usePageVisits()
  const mostVisitedPages = getMostVisitedPages(6)
  
  // Map most visited paths to modules - only show modules that have been visited
  const quickAccessModules = mostVisitedPages
    .map((visit) => availableModules.find((module) => module.path === visit.path))
    .filter((module): module is typeof modules[0] => module !== undefined)

  // Fetch recent sales for Transaction History
  const { data: recentSalesData } = useQuery({
    queryKey: ["recentSales"],
    queryFn: () => SalesService.readSales({ skip: 0, limit: 5 }),
  })

  const recentSales = recentSalesData?.data || []

  // Calculate totals
  const totalRevenue = recentSales.reduce((sum, sale) => sum + parseFloat(sale.total_amount || "0"), 0)

  return (
    <>
      <Box
        position="relative"
        minH="calc(100vh - 80px)"
        bg="bg.canvas"
      >
        <Container maxW="full" minH="100vh" position="relative" zIndex={1}>
          <DashboardHeader userName={currentUser?.full_name || undefined} isMounted={isMounted} />

          {currentUser?.is_superuser && (
            <StatsCards totalRevenue={totalRevenue} isMounted={isMounted} />
          )}

          <Grid
            templateColumns={{
              base: "repeat(1, 1fr)",
              lg: "repeat(2, 1fr)",
            }}
            gap={6}
            mb={8}
            opacity={isMounted ? 1 : 0}
            transform={isMounted ? "translateY(0)" : "translateY(20px)"}
            transition="all 0.5s ease 0.3s"
          >
            <TransactionHistory recentSales={recentSales} totalRevenue={totalRevenue} />
            <QuickAccess quickAccessModules={quickAccessModules} mostVisitedPages={mostVisitedPages} />
          </Grid>

          {currentUser?.is_superuser && (
            <RevenueSalesPurchaseCards totalRevenue={totalRevenue} isMounted={isMounted} />
          )}

          <PendingDebtsTable isMounted={isMounted} />
        </Container>
      </Box>
    </>
  )
}
