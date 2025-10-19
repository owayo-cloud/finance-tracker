"use client";

import { useState } from "react";
import { 
  Search, 
  Filter, 
  Download, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar,
  ChevronDown,
  TrendingUp,
  DollarSign,
  CreditCard,
  RefreshCw,
  MoreVertical,
  Eye,
  FileText,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("30");
  const [showFilters, setShowFilters] = useState(false);

  const transactions = [
    {
      id: "TXN-001234",
      description: "Payment from Acme Corp",
      amount: 2500.00,
      type: "credit",
      status: "completed",
      date: "2025-10-19",
      time: "10:23 AM",
      method: "Bank Transfer",
      category: "Income"
    },
    {
      id: "TXN-001233",
      description: "Subscription - Adobe Creative Cloud",
      amount: 54.99,
      type: "debit",
      status: "completed",
      date: "2025-10-18",
      time: "03:15 PM",
      method: "Credit Card",
      category: "Software"
    },
    {
      id: "TXN-001232",
      description: "Refund - Office Supplies",
      amount: 127.50,
      type: "credit",
      status: "completed",
      date: "2025-10-18",
      time: "11:42 AM",
      method: "Bank Transfer",
      category: "Refund"
    },
    {
      id: "TXN-001231",
      description: "Payment to Vendor XYZ",
      amount: 1850.00,
      type: "debit",
      status: "pending",
      date: "2025-10-17",
      time: "09:30 AM",
      method: "Wire Transfer",
      category: "Operations"
    },
    {
      id: "TXN-001230",
      description: "Client Invoice #4521",
      amount: 3200.00,
      type: "credit",
      status: "completed",
      date: "2025-10-16",
      time: "02:18 PM",
      method: "Bank Transfer",
      category: "Income"
    },
    {
      id: "TXN-001229",
      description: "AWS Cloud Services",
      amount: 489.99,
      type: "debit",
      status: "completed",
      date: "2025-10-15",
      time: "12:00 PM",
      method: "Credit Card",
      category: "Infrastructure"
    },
    {
      id: "TXN-001228",
      description: "Payment declined - Insufficient funds",
      amount: 750.00,
      type: "debit",
      status: "failed",
      date: "2025-10-14",
      time: "04:55 PM",
      method: "Credit Card",
      category: "Operations"
    },
    {
      id: "TXN-001227",
      description: "Consulting Services Payment",
      amount: 5000.00,
      type: "credit",
      status: "completed",
      date: "2025-10-13",
      time: "10:10 AM",
      method: "Wire Transfer",
      category: "Income"
    }
  ];

  const stats = [
    {
      label: "Total Income",
      value: "$10,827.50",
      change: "+12.5%",
      isPositive: true,
      icon: TrendingUp,
      gradient: "from-emerald-500 to-emerald-600"
    },
    {
      label: "Total Expenses",
      value: "$3,144.98",
      change: "+5.2%",
      isPositive: false,
      icon: ArrowDownRight,
      gradient: "from-rose-500 to-rose-600"
    },
    {
      label: "Net Balance",
      value: "$7,682.52",
      change: "+18.3%",
      isPositive: true,
      icon: DollarSign,
      gradient: "from-blue-500 to-blue-600"
    },
    {
      label: "Pending",
      value: "$1,850.00",
      count: "1 transaction",
      icon: Clock,
      gradient: "from-amber-500 to-amber-600"
    }
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      failed: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
    };
    
    const icons = {
      completed: CheckCircle,
      pending: Clock,
      failed: XCircle
    };

    const Icon = icons[status as keyof typeof icons];
    
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles]}`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         t.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === "all" || t.type === selectedFilter || t.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-screen-2xl mx-auto p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Transactions</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            View and manage all your financial transactions
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {stat.label}
                  </p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {stat.value}
                  </h3>
                  {stat.change && (
                    <div className="flex items-center gap-1">
                      {stat.isPositive ? (
                        <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      )}
                      <span className={`text-sm font-semibold ${
                        stat.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                      }`}>
                        {stat.change}
                      </span>
                    </div>
                  )}
                  {stat.count && (
                    <p className="text-xs text-gray-500 dark:text-gray-500">{stat.count}</p>
                  )}
                </div>
                <div className={`flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br ${stat.gradient}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          {/* Filters Bar */}
          <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filter Buttons */}
              <div className="flex gap-2 flex-wrap">
                <div className="relative">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Filter className="w-4 h-4" />
                    Filter
                    <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showFilters && (
                    <div className="absolute top-full mt-2 right-0 w-48 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10">
                      <div className="p-2">
                        {[
                          { label: "All", value: "all" },
                          { label: "Income", value: "credit" },
                          { label: "Expenses", value: "debit" },
                          { label: "Completed", value: "completed" },
                          { label: "Pending", value: "pending" },
                          { label: "Failed", value: "failed" }
                        ].map((filter) => (
                          <button
                            key={filter.value}
                            onClick={() => {
                              setSelectedFilter(filter.value);
                              setShowFilters(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                              selectedFilter === filter.value
                                ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                            }`}
                          >
                            {filter.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="365">Last year</option>
                </select>

                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Transaction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.type === "credit"
                            ? "bg-emerald-100 dark:bg-emerald-900/30"
                            : "bg-rose-100 dark:bg-rose-900/30"
                        }`}>
                          {transaction.type === "credit" ? (
                            <ArrowDownRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400 rotate-180" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {transaction.description}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {transaction.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="font-medium">{transaction.date}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{transaction.time}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{transaction.method}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(transaction.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-sm font-bold ${
                        transaction.type === "credit"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}>
                        {transaction.type === "credit" ? "+" : "-"}${transaction.amount.toFixed(2)}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{transaction.category}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors">
                          <FileText className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing <span className="font-semibold">{filteredTransactions.length}</span> of{" "}
              <span className="font-semibold">{transactions.length}</span> transactions
            </p>
            <div className="flex gap-2">
              <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Previous
              </button>
              <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                1
              </button>
              <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                2
              </button>
              <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}