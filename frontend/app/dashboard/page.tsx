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
