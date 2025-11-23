import { Box, Container, Grid } from "@chakra-ui/react"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"

import useAuth from "@/hooks/useAuth"
import { UsersService, SalesService } from "@/client"
import { DashboardHeader } from "@/components/Dashboard/DashboardHeader"
import { StatsCards } from "@/components/Dashboard/StatsCards"
import { SalesChart } from "@/components/Dashboard/SalesChart"
import { RecentActivity } from "@/components/Dashboard/RecentActivity"
import { RevenueSalesPurchaseCards } from "@/components/Dashboard/RevenueSalesPurchaseCards"
import { PendingDebtsTable } from "@/components/Dashboard/PendingDebtsTable"

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


  // Fetch recent sales for RevenueSalesPurchaseCards
  const { data: recentSalesData } = useQuery({
    queryKey: ["recentSales"],
    queryFn: () => SalesService.readSales({ skip: 0, limit: 100 }),
  })

  const recentSales = recentSalesData?.data || []

  // Calculate totals for RevenueSalesPurchaseCards
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
            <SalesChart totalRevenue={totalRevenue} />
            <RecentActivity recentSales={recentSales} />
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