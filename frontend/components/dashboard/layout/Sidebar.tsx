"use client";
import { useTheme } from "@/providers/ThemeProvider";
import {
  DollarSign,
  Activity,
  Wallet,
  CreditCard,
  Users,
  Package,
  Settings,
  LogOut,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onClose: () => void;
  onLogout: () => void;
  user: { full_name: string; email: string } | null;
}

export function Sidebar({
  isOpen,
  isCollapsed,
  onToggleCollapse,
  onClose,
  onLogout,
  user,
}: SidebarProps) {
  const getUserInitials = (name: string): string =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const { theme } = useTheme();

  return (
    <>
      <aside
        className={`
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 fixed inset-y-0 left-0 z-50
          ${isCollapsed ? "w-20" : "w-64"}
          transition-all duration-300 ease-in-out
          ${theme === "light"
            ? "bg-white border-gray-200 text-gray-900"
            : "bg-gray-900 border-gray-700 text-gray-100"}
          border-r
        `}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="h-full flex flex-col">
          {/* Logo & Collapse */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              {!isCollapsed && (
                <span className="text-xl font-bold text-gray-900">FinApp</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onToggleCollapse}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Collapse sidebar"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                )}
              </button>

              <button
                onClick={onClose}
                className="lg:hidden p-1 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close sidebar"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-1">
            {[
              { name: "Dashboard", icon: Activity },
              { name: "Transactions", icon: Wallet },
              { name: "Payments", icon: CreditCard },
              { name: "Customers", icon: Users },
              { name: "Products", icon: Package },
              { name: "Settings", icon: Settings },
            ].map((item) => (
              <a
                key={item.name}
                href="#"
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  item.name === "Dashboard"
                    ? "bg-blue-500 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {!isCollapsed && <span>{item.name}</span>}
              </a>
            ))}

            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              {!isCollapsed && <span>Log Out</span>}
            </button>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {user ? getUserInitials(user.full_name) : "?"}
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.full_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
}
