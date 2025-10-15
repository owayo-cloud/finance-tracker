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
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* top cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Stats title="Total Users" value="1,234" icon={<Users className="w-6 h-6 text-white" />} />
        <Stats title="Total Sales" value="$56,789" icon={<Package className="w-6 h-6 text-white" />} />
        <Stats title="Active Subscriptions" value="345" icon={<Users className="w-6 h-6 text-white" />} />

        <ProgressCard
          percentage={75.55}
          increase="+10%"
          target="20K"
          revenue="20K"
          today="20K"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartOne data={chartData} />
        <ChartOne data={chartData} />
      </div>
      <div className="mt-6">
        <TableOne rows={tableRows} />
      </div>
    </div>
  )
}

export default DashboardPage
