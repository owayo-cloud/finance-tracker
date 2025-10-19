"use client";

import { useState } from "react";
import { 
  CreditCard,
  Plus,
  DollarSign,
  Calendar,
  Users,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2,
  Edit,
  MoreVertical,
  ArrowUpRight,
  Building2,
  Wallet,
  TrendingUp,
  Filter,
  Search
} from "lucide-react";

export default function PaymentsPage() {
  const [showNewPayment, setShowNewPayment] = useState(false);
  const [selectedTab, setSelectedTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const stats = [
    {
      label: "Total Sent",
      value: "$45,231.00",
      change: "+15.2%",
      isPositive: true,
      icon: Send,
      gradient: "from-blue-500 to-blue-600"
    },
    {
      label: "Scheduled",
      value: "$12,450.00",
      count: "8 payments",
      icon: Clock,
      gradient: "from-violet-500 to-violet-600"
    },
    {
      label: "Recipients",
      value: "24",
      change: "+3 this month",
      icon: Users,
      gradient: "from-emerald-500 to-emerald-600"
    },
    {
      label: "Success Rate",
      value: "98.5%",
      change: "+2.1%",
      isPositive: true,
      icon: TrendingUp,
      gradient: "from-amber-500 to-amber-600"
    }
  ];

  const payments = [
    {
      id: "PAY-001",
      recipient: "Acme Corporation",
      email: "billing@acme.com",
      amount: 5000.00,
      status: "completed",
      method: "Bank Transfer",
      date: "2025-10-19",
      time: "10:30 AM",
      reference: "INV-2024-001"
    },
    {
      id: "PAY-002",
      recipient: "John Smith",
      email: "john.smith@email.com",
      amount: 1250.00,
      status: "completed",
      method: "PayPal",
      date: "2025-10-18",
      time: "03:45 PM",
      reference: "Freelance Work"
    },
    {
      id: "PAY-003",
      recipient: "Tech Solutions Ltd",
      email: "payments@techsolutions.com",
      amount: 3500.00,
      status: "pending",
      method: "Wire Transfer",
      date: "2025-10-20",
      time: "09:00 AM",
      reference: "Monthly Retainer"
    },
    {
      id: "PAY-004",
      recipient: "Office Supplies Co",
      email: "accounts@officesupplies.com",
      amount: 450.00,
      status: "scheduled",
      method: "Credit Card",
      date: "2025-10-22",
      time: "12:00 PM",
      reference: "Order #5521"
    },
    {
      id: "PAY-005",
      recipient: "Marketing Agency",
      email: "hello@marketingpro.com",
      amount: 2800.00,
      status: "completed",
      method: "Bank Transfer",
      date: "2025-10-17",
      time: "11:20 AM",
      reference: "Campaign Q4"
    },
    {
      id: "PAY-006",
      recipient: "Cloud Services Inc",
      email: "billing@cloudservices.io",
      amount: 899.00,
      status: "failed",
      method: "Credit Card",
      date: "2025-10-16",
      time: "02:15 PM",
      reference: "Monthly Subscription"
    }
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      pending: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      scheduled: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
      failed: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
    };
    
    const icons = {
      completed: CheckCircle,
      pending: Clock,
      scheduled: Calendar,
      failed: AlertCircle
    };

    const Icon = icons[status as keyof typeof icons];
    
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles]}`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.recipient.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.reference.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = selectedTab === "all" || p.status === selectedTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-screen-2xl mx-auto p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Payments</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Send and manage all your payments
            </p>
          </div>
          <button
            onClick={() => setShowNewPayment(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Payment
          </button>
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
                      {stat.isPositive && <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                      <span className={`text-sm font-semibold ${
                        stat.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-gray-600 dark:text-gray-400"
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
          {/* Tabs and Search */}
          <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              {/* Tabs */}
              <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                {[
                  { id: "all", label: "All Payments" },
                  { id: "completed", label: "Completed" },
                  { id: "pending", label: "Pending" },
                  { id: "scheduled", label: "Scheduled" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedTab === tab.id
                        ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative w-full lg:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search payments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Payments List */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredPayments.map((payment) => (
              <div key={payment.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {payment.recipient}
                        </h3>
                        {getStatusBadge(payment.status)}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1">
                        {payment.email}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {payment.date} at {payment.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <Wallet className="w-3 h-3" />
                          {payment.method}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Amount and Actions */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        ${payment.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {payment.reference}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredPayments.length === 0 && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No payments found
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>
      </div>

      {/* New Payment Modal */}
      {showNewPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                New Payment
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Send money to a recipient
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Recipient Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Recipient Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Recipient Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter recipient name"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="recipient@example.com"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Payment Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Amount
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        placeholder="0.00"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Payment Method
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option>Bank Transfer</option>
                      <option>Wire Transfer</option>
                      <option>Credit Card</option>
                      <option>PayPal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Reference / Note
                    </label>
                    <input
                      type="text"
                      placeholder="Invoice number or description"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Schedule Payment (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowNewPayment(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Send className="w-4 h-4" />
                Send Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}