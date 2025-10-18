"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, DollarSign, Users, ShoppingCart, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Sidebar } from "@/components/dashboard/layout/Sidebar";
import { TopBar } from "@/components/dashboard/layout/TopBar";
import { NotificationPanel } from "@/components/dashboard/NotificationPanel";
import { ErrorBoundary } from "@/components/dashboard/ErrorBoundary";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { apiService, Stats, Activity, Notification } from "@/services/apiService";

function DashboardContent() {
  const { user, logout } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<string>("Month");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [notificationOpen, setNotificationOpen] = useState<boolean>(false);
  const [stats, setStats] = useState<Stats>({ revenue: 0, users: 0, sales: 0, growth: 0 });
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, activityData, notifData] = await Promise.all([
          apiService.fetchStats(selectedPeriod),
          apiService.fetchRecentActivity(),
          apiService.fetchNotifications()
        ]);

        setStats(statsData);
        setRecentActivity(activityData);
        setNotifications(notifData);
      } catch (error) {
        console.error("failed to load data:", error);
      }
    };

    loadData();
  }, [selectedPeriod]);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);

    try {
      const newStats = await apiService.fetchStats(selectedPeriod);
      setStats(newStats);
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, selectedPeriod]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const statsData = [
    {
      title: "Total Revenue",
      value: `$${stats.revenue.toLocaleString()}`,
      change: "+12.5%",
      isPositive: true,
      icon: DollarSign,
      gradient: "from-blue-500 to-blue-600"
    },
    {
      title: "Total Users",
      value: stats.users.toLocaleString(),
      change: "+8.2%",
      isPositive: true,
      icon: Users,
      gradient: "from-emerald-500 to-emerald-600"
    },
    {
      title: "Active Sales",
      value: stats.sales.toLocaleString(),
      change: "-2.4%",
      isPositive: false,
      icon: ShoppingCart,
      gradient: "from-violet-500 to-violet-600"
    },
    {
      title: "Growth Rate",
      value: `${stats.growth}%`,
      change: "+5.1%",
      isPositive: true,
      icon: TrendingUp,
      gradient: "from-amber-500 to-amber-600"
    }
  ];

  return (
    <div className="relative min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onLogout={logout}
        user={user}
      />

      <div className="flex flex-col min-h-screen">
        <div className={`fixed top-0 right-0 left-0 z-30 transition-all duration-300 ${sidebarCollapsed ? 'lg:left-20' : 'lg:left-64'}`}>
          <TopBar
            user={user}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
            onMenuClick={() => setSidebarOpen(true)}
            onNotificationClick={() => setNotificationOpen(true)}
            notificationCount={unreadCount}
          />
        </div>

        <main className={`flex-1 pt-16 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
          <div className="p-4 md:p-6 lg:p-8">
            <div className="max-w-screen-2xl mx-auto space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {selectedPeriod}ly Overview
                </h1>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isRefreshing ? "Refreshing..." : "Refresh Data"}
                </button>
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 md:gap-6">
                {statsData.map((stat, index) => (
                  <div
                    key={index}
                    className="relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                          {stat.title}
                        </p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                          {stat.value}
                        </h3>
                        <div className="flex items-center gap-1">
                          {stat.isPositive ? (
                            <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 text-red-600 dark:text-red-400" />
                          )}
                          <span
                            className={`text-sm font-semibold ${
                              stat.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {stat.change}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-500 ml-1">vs last {selectedPeriod.toLowerCase()}</span>
                        </div>
                      </div>
                      <div className={`flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br ${stat.gradient}`}>
                        <stat.icon className="w-7 h-7 text-white" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Additional Content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Recent Activity */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    {recentActivity.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                          <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {item.description}
                          </p>
                          <p className="text-xs text-gray-500">{item.time}</p>
                        </div>
                        {item.amount > 0 && (
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            ${item.amount}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Quick Stats</h3>
                  <div className="space-y-4">
                    {[
                      { label: "Conversion Rate", value: "3.2%", color: "bg-emerald-500" },
                      { label: "Avg Order Value", value: "$142", color: "bg-blue-500" },
                      { label: "Customer Retention", value: "87%", color: "bg-violet-500" },
                      { label: "Active Sessions", value: "234", color: "bg-amber-500" }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <NotificationPanel
        isOpen={notificationOpen}
        onClose={() => setNotificationOpen(false)}
        notifications={notifications}
      />
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-700 dark:text-gray-300 font-medium">Loading dashboard...</p>
      </div>
    </div>
  );
}

function ErrorScreen({ error }: { error: string }) {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <div className="flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full mx-auto">
          <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-gray-100 text-center">
          Authentication Error
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400 text-center">{error}</p>
        <p className="mt-4 text-sm text-gray-500 text-center">
          Please refresh the page to try again
        </p>
      </div>
    </div>
  );
}

function DashboardWrapper() {
  const { isLoading, authError } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (authError) return <ErrorScreen error={authError} />;
  
  return <DashboardContent />;
}

export default function FinanceDashboard() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DashboardWrapper />
      </AuthProvider>
    </ErrorBoundary>
  );
}