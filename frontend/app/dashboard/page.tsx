"use client";
import { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  // CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  //Calendar,
  Settings,
  LogOut,
  Bell,
  Search,
  //Plus,
  //MoreVertical,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function FinanceDashboard() {
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState("month");

  // redirect to /auth if not logged in
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const expiry = localStorage.getItem("token_expiry");

    //no token = redirect
    if (!token || !expiry || Date.now() / 1000 > Number (expiry)) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("token_expiry");
      window.location.href = "/auth";
    }

    //check expiry
    if (expiry) {
      const expiryTime = parseInt(expiry, 10);
      const now = Math.floor(Date.now() / 1000); 

      // If token expired, clear and redirect
      if (now >= expiryTime){
        localStorage.removeItem("access_token");
        localStorage.removeItem("token_expiry");
        router.push("/auth");
        return;
      }
    }
  }, [router]);

  // logout function
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    router.push("/auth"); // instant redirect
  };

  // Sample data
  const stats = [
    {
      title: "Total Balance",
      value: "$24,582.50",
      change: "+12.5%",
      trend: "up",
      icon: Wallet,
      color: "emerald",
    },
    {
      title: "Income",
      value: "$8,420.00",
      change: "+8.2%",
      trend: "up",
      icon: TrendingUp,
      color: "blue",
    },
    {
      title: "Expenses",
      value: "$5,832.40",
      change: "-3.1%",
      trend: "down",
      icon: TrendingDown,
      color: "red",
    },
    {
      title: "Savings",
      value: "$2,587.60",
      change: "+15.3%",
      trend: "up",
      icon: PieChart,
      color: "purple",
    },
  ];

  // const recentTransactions = [
  //   {
  //     id: 1,
  //     name: "Salary Payment",
  //     category: "Income",
  //     amount: "+$4,200.00",
  //     date: "Oct 13, 2025",
  //     type: "income",
  //     icon: "💼",
  //   },
  //   {
  //     id: 2,
  //     name: "Grocery Shopping",
  //     category: "Food & Dining",
  //     amount: "-$152.30",
  //     date: "Oct 12, 2025",
  //     type: "expense",
  //     icon: "🛒",
  //   },
  //   {
  //     id: 3,
  //     name: "Netflix Subscription",
  //     category: "Entertainment",
  //     amount: "-$15.99",
  //     date: "Oct 11, 2025",
  //     type: "expense",
  //     icon: "🎬",
  //   },
  //   {
  //     id: 4,
  //     name: "Freelance Project",
  //     category: "Income",
  //     amount: "+$850.00",
  //     date: "Oct 10, 2025",
  //     type: "income",
  //     icon: "💻",
  //   },
  //   {
  //     id: 5,
  //     name: "Electric Bill",
  //     category: "Utilities",
  //     amount: "-$89.50",
  //     date: "Oct 9, 2025",
  //     type: "expense",
  //     icon: "⚡",
  //   },
  // ];

  // const accounts = [
  //   { name: "Main Wallet", balance: "$12,450.00", icon: "💳", color: "bg-emerald-500" },
  //   { name: "Savings", balance: "$8,920.50", icon: "💰", color: "bg-blue-500" },
  //   { name: "Credit Card", balance: "-$3,788.00", icon: "💎", color: "bg-purple-500" },
  // ];

  // const budgets = [
  //   { category: "Food", spent: 580, total: 800, color: "emerald" },
  //   { category: "Transport", spent: 220, total: 300, color: "blue" },
  //   { category: "Entertainment", spent: 180, total: 200, color: "purple" },
  // ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2 group cursor-pointer">
              <DollarSign className="text-emerald-600 dark:text-emerald-400 w-8 h-8 group-hover:rotate-12 transition-transform duration-300" />
              <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                FinanceFlow
              </h1>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors relative">
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>

              {/* ✅ Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all duration-200"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Welcome back, Beth! 👋
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Here&apos;s your financial overview for October 2025
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center space-x-2 mb-6">
          {["week", "month", "year"].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                selectedPeriod === period
                  ? "bg-emerald-600 text-white shadow-lg"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 group hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-${stat.color}-100 dark:bg-${stat.color}-900/30`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                </div>
                <div
                  className={`flex items-center space-x-1 px-2 py-1 rounded-full text-sm font-medium ${
                    stat.trend === "up"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}
                >
                  {stat.trend === "up" ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  <span>{stat.change}</span>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* ✅ (Rest of your transactions, budgets, accounts remains unchanged) */}
      </main>
    </div>
  );
}
