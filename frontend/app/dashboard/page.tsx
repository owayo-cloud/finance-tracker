"use client";
import { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Users,
  ShoppingCart,
  Activity,
  Download,
  RefreshCw,
  Bell,
  Search,
  Settings,
  Menu,
  X,
  CreditCard,
  Wallet,
  LogOut,
} from "lucide-react";

export default function FinanceDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("Month");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Simulated real-time data
  const [stats, setStats] = useState({
    revenue: 56789,
    users: 1234,
    sales: 345,
    growth: 8.5,
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setStats((prev) => ({
        revenue: prev.revenue + Math.floor(Math.random() * 1000),
        users: prev.users + Math.floor(Math.random() * 10),
        sales: prev.sales + Math.floor(Math.random() * 5),
        growth: +(prev.growth + (Math.random() - 0.5)).toFixed(1),
      }));
      setIsRefreshing(false);
    }, 1000);
  };

  // Chart data
  const revenueData = [
    { label: "Jan", value: 42000 },
    { label: "Feb", value: 38000 },
    { label: "Mar", value: 51000 },
    { label: "Apr", value: 45000 },
    { label: "May", value: 58000 },
    { label: "Jun", value: 62000 },
  ];

  // Transaction data
  const transactions = [
    {
      id: 1,
      name: "John Doe",
      amount: 2450,
      status: "Paid",
      date: "Oct 15, 2025",
      type: "Sale",
    },
    {
      id: 2,
      name: "Jane Smith",
      amount: 1890,
      status: "Pending",
      date: "Oct 14, 2025",
      type: "Subscription",
    },
    {
      id: 3,
      name: "Alice Johnson",
      amount: 3200,
      status: "Paid",
      date: "Oct 14, 2025",
      type: "Sale",
    },
    {
      id: 4,
      name: "Bob Williams",
      amount: 950,
      status: "Paid",
      date: "Oct 13, 2025",
      type: "Refund",
    },
    {
      id: 5,
      name: "Carol Davis",
      amount: 1500,
      status: "Failed",
      date: "Oct 12, 2025",
      type: "Sale",
    },
    {
      id: 6,
      name: "David Brown",
      amount: 2100,
      status: "Paid",
      date: "Oct 12, 2025",
      type: "Subscription",
    },
  ];

  // Category breakdown
  const categories = [
    { name: "Products", value: 45, color: "bg-blue-500" },
    { name: "Services", value: 30, color: "bg-green-500" },
    { name: "Subscriptions", value: 25, color: "bg-purple-500" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">FinApp</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-white bg-blue-500 rounded-lg"
            >
              <Activity className="w-5 h-5" />
              Dashboard
            </a>
            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Wallet className="w-5 h-5" />
              Transactions
            </a>
            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <CreditCard className="w-5 h-5" />
              Payments
            </a>
            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Users className="w-5 h-5" />
              Customers
            </a>
            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Package className="w-5 h-5" />
              Products
            </a>
            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Log Out
            </a>
            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5" />
              Settings
            </a>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                JD
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  John Doe
                </p>
                <p className="text-xs text-gray-500 truncate">
                  john@example.com
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                className="pl-10 pr-4 py-2 w-64 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <button
              onClick={handleRefresh}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`w-5 h-5 text-gray-600 ${
                  isRefreshing ? "animate-spin" : ""
                }`}
              />
            </button>

            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Week</option>
              <option>Month</option>
              <option>Quarter</option>
              <option>Year</option>
            </select>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Welcome Section */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, John
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Here's what's happening with your business today
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Revenue Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-500 bg-opacity-10 rounded-lg p-3">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                    <ArrowUpRight className="w-4 h-4" />
                    +12.5%
                  </div>
                </div>
                <div>
                  <p className="text-gray-500 text-sm font-medium">
                    Total Revenue
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    ${stats.revenue.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Users Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-500 bg-opacity-10 rounded-lg p-3">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                    <ArrowUpRight className="w-4 h-4" />
                    +8.2%
                  </div>
                </div>
                <div>
                  <p className="text-gray-500 text-sm font-medium">
                    Total Users
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.users.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Sales Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-purple-500 bg-opacity-10 rounded-lg p-3">
                    <ShoppingCart className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex items-center gap-1 text-sm font-medium text-red-600">
                    <ArrowDownRight className="w-4 h-4" />
                    -2.4%
                  </div>
                </div>
                <div>
                  <p className="text-gray-500 text-sm font-medium">
                    Active Sales
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.sales}
                  </p>
                </div>
              </div>

              {/* Growth Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-orange-500 bg-opacity-10 rounded-lg p-3">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                    <ArrowUpRight className="w-4 h-4" />
                    +5.1%
                  </div>
                </div>
                <div>
                  <p className="text-gray-500 text-sm font-medium">
                    Growth Rate
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.growth}%
                  </p>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Revenue Chart */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Revenue Overview
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Monthly revenue performance
                    </p>
                  </div>
                </div>

                <div className="relative h-64">
                  <div className="flex items-end justify-between h-full gap-3">
                    {revenueData.map((item, idx) => {
                      const maxValue = Math.max(
                        ...revenueData.map((d) => d.value)
                      );
                      const heightPercent = (item.value / maxValue) * 100;

                      return (
                        <div
                          key={idx}
                          className="flex-1 flex flex-col items-center gap-2"
                        >
                          <div className="w-full flex items-end justify-center relative group">
                            <div
                              className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg hover:from-blue-600 hover:to-blue-500 transition-all cursor-pointer"
                              style={{ height: `${heightPercent}%` }}
                            >
                              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                ${item.value.toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs font-medium text-gray-500">
                            {item.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Revenue by Category
                </h3>

                <div className="space-y-4">
                  {categories.map((category, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          {category.name}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {category.value}%
                        </span>
                      </div>
                      <div className="relative w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`absolute top-0 left-0 h-full ${category.color} rounded-full transition-all duration-500`}
                          style={{ width: `${category.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-blue-900 uppercase">
                        Monthly Target
                      </p>
                      <p className="text-2xl font-bold text-blue-900 mt-1">
                        $60K
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-blue-700">
                        Current
                      </p>
                      <p className="text-lg font-bold text-blue-900">$42.5K</p>
                    </div>
                  </div>
                  <div className="mt-3 relative w-full h-2 bg-blue-200 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-blue-600 rounded-full"
                      style={{ width: "70.8%" }}
                    />
                  </div>
                  <p className="text-xs text-blue-700 mt-2 font-medium">
                    70.8% completed
                  </p>
                </div>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Recent Transactions
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Latest customer transactions
                  </p>
                </div>
                <button className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                        Customer
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                        Type
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                        Amount
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium text-sm">
                              {transaction.name.charAt(0)}
                            </div>
                            <span className="font-medium text-gray-900">
                              {transaction.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-600">
                            {transaction.type}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-semibold text-gray-900">
                          ${transaction.amount.toLocaleString()}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              transaction.status === "Paid"
                                ? "bg-green-50 text-green-700"
                                : transaction.status === "Pending"
                                ? "bg-yellow-50 text-yellow-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {transaction.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-500">
                          {transaction.date}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
