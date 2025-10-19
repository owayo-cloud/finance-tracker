"use client";

import { useState } from "react";
import { 
  Users,
  Plus,
  Search,
  Filter,
  Grid3x3,
  List,
  Edit,
  Trash2,
  MoreVertical,
  Eye,
  Mail,
  Phone,
  MapPin,
  Star,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  ChevronRight,
  Home,
  UserCircle,
  Calendar,
  Award,
  AlertCircle,
  Check,
  X
} from "lucide-react";

export default function CustomersPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);

  const stats = [
    {
      label: "Total Customers",
      value: "2,543",
      change: "+12.5%",
      isPositive: true,
      icon: Users,
      gradient: "from-blue-500 to-blue-600"
    },
    {
      label: "Active This Month",
      value: "1,892",
      change: "+8.2%",
      isPositive: true,
      icon: TrendingUp,
      gradient: "from-emerald-500 to-emerald-600"
    },
    {
      label: "Avg. Order Value",
      value: "$342",
      change: "+15.3%",
      isPositive: true,
      icon: DollarSign,
      gradient: "from-violet-500 to-violet-600"
    },
    {
      label: "VIP Customers",
      value: "148",
      count: "Top tier",
      icon: Award,
      gradient: "from-amber-500 to-amber-600"
    }
  ];

  const customers = [
    {
      id: "CUST-001",
      name: "Sarah Johnson",
      email: "sarah.johnson@email.com",
      phone: "+1 (555) 123-4567",
      location: "New York, NY",
      orders: 45,
      totalSpent: 12450.00,
      status: "vip",
      rating: 4.9,
      joinDate: "2024-01-15",
      lastOrder: "2025-10-18"
    },
    {
      id: "CUST-002",
      name: "Michael Chen",
      email: "michael.chen@email.com",
      phone: "+1 (555) 234-5678",
      location: "San Francisco, CA",
      orders: 32,
      totalSpent: 8920.00,
      status: "active",
      rating: 4.7,
      joinDate: "2024-02-20",
      lastOrder: "2025-10-17"
    },
    {
      id: "CUST-003",
      name: "Emily Rodriguez",
      email: "emily.rodriguez@email.com",
      phone: "+1 (555) 345-6789",
      location: "Austin, TX",
      orders: 28,
      totalSpent: 7650.00,
      status: "active",
      rating: 4.8,
      joinDate: "2024-03-10",
      lastOrder: "2025-10-19"
    },
    {
      id: "CUST-004",
      name: "David Park",
      email: "david.park@email.com",
      phone: "+1 (555) 456-7890",
      location: "Seattle, WA",
      orders: 3,
      totalSpent: 450.00,
      status: "inactive",
      rating: 4.2,
      joinDate: "2024-08-05",
      lastOrder: "2025-08-15"
    },
    {
      id: "CUST-005",
      name: "Jessica Williams",
      email: "jessica.williams@email.com",
      phone: "+1 (555) 567-8901",
      location: "Boston, MA",
      orders: 67,
      totalSpent: 18900.00,
      status: "vip",
      rating: 5.0,
      joinDate: "2023-11-20",
      lastOrder: "2025-10-19"
    },
    {
      id: "CUST-006",
      name: "Robert Taylor",
      email: "robert.taylor@email.com",
      phone: "+1 (555) 678-9012",
      location: "Miami, FL",
      orders: 19,
      totalSpent: 5230.00,
      status: "active",
      rating: 4.5,
      joinDate: "2024-04-15",
      lastOrder: "2025-10-16"
    },
    {
      id: "CUST-007",
      name: "Amanda Martinez",
      email: "amanda.martinez@email.com",
      phone: "+1 (555) 789-0123",
      location: "Chicago, IL",
      orders: 12,
      totalSpent: 3420.00,
      status: "active",
      rating: 4.6,
      joinDate: "2024-05-22",
      lastOrder: "2025-10-14"
    },
    {
      id: "CUST-008",
      name: "James Anderson",
      email: "james.anderson@email.com",
      phone: "+1 (555) 890-1234",
      location: "Denver, CO",
      orders: 8,
      totalSpent: 2180.00,
      status: "new",
      rating: 4.3,
      joinDate: "2025-09-10",
      lastOrder: "2025-10-12"
    }
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      vip: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      inactive: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
      new: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
    };
    
    const labels = {
      vip: "VIP",
      active: "Active",
      inactive: "Inactive",
      new: "New"
    };

    const icons = {
      vip: Award,
      active: Check,
      inactive: AlertCircle,
      new: Star
    };

    const Icon = icons[status as keyof typeof icons];
    
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles]}`}>
        <Icon className="w-3 h-3" />
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         c.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === "all" || c.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-screen-2xl mx-auto p-4 md:p-6 lg:p-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm mb-4">
          <button className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
            <Home className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <button className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
            <ShoppingBag className="w-4 h-4" />
            <span>Sales</span>
          </button>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-900 dark:text-gray-100 font-medium flex items-center gap-1">
            <Users className="w-4 h-4" />
            Customers
          </span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Customers</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage your customer relationships and data
            </p>
          </div>
          <button
            onClick={() => setShowNewCustomer(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Customer
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
                      {stat.isPositive && <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
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
          {/* Toolbar */}
          <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Controls */}
              <div className="flex gap-2">
                <div className="relative">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Filter className="w-4 h-4" />
                    Filter
                  </button>
                  
                  {showFilters && (
                    <div className="absolute top-full mt-2 right-0 w-48 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10">
                      <div className="p-2">
                        {[
                          { label: "All Customers", value: "all" },
                          { label: "VIP", value: "vip" },
                          { label: "Active", value: "active" },
                          { label: "Inactive", value: "inactive" },
                          { label: "New", value: "new" }
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

                <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded transition-colors ${
                      viewMode === "grid"
                        ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    }`}
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded transition-colors ${
                      viewMode === "list"
                        ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Customers Grid View */}
          {viewMode === "grid" && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow group"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-lg">
                        {customer.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="mb-4">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {customer.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{customer.id}</p>
                      {getStatusBadge(customer.status)}
                    </div>

                    {/* Contact */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{customer.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{customer.location}</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Spent</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            ${customer.totalSpent.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Orders</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {customer.orders}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mt-3">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {customer.rating}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                          rating
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customers List View */}
          {viewMode === "list" && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Total Spent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                            {customer.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {customer.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{customer.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                            <span className="truncate max-w-[200px]">{customer.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            <span>{customer.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{customer.location}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {customer.orders}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          ${customer.totalSpent.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(customer.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {customer.rating}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors">
                            <Mail className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty State */}
          {filteredCustomers.length === 0 && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No customers found
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>
      </div>

      {/* New Customer Modal */}
      {showNewCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Add New Customer</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Create a new customer profile
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    placeholder="John"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="Doe"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="john.doe@example.com"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Location
                </label>
                <input
                  type="text"
                  placeholder="City, State"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Customer Status
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>New</option>
                  <option>Active</option>
                  <option>VIP</option>
                  <option>Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Add any additional notes about this customer..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowNewCustomer(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}