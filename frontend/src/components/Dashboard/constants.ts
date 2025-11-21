import {
  FiBarChart2,
  FiBox,
  FiDollarSign,
  FiPackage,
  FiShoppingCart,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi"
import { TbReceiptDollar } from "react-icons/tb"
import type { IconType } from "react-icons/lib"

export interface Module {
  icon: IconType
  title: string
  description: string
  path: string
  iconColor: string
  iconBg: string
  adminOnly: boolean
}

export const modules: Module[] = [
  {
    icon: FiBox,
    title: "Stock Entry",
    description: "Manage inventory",
    path: "/stock-entry",
    iconColor: "#3b82f6",
    iconBg: "rgba(59, 130, 246, 0.1)",
    adminOnly: false,
  },
  {
    icon: FiShoppingCart,
    title: "Sales",
    description: "Process transactions",
    path: "/sales",
    iconColor: "#2563eb",
    iconBg: "rgba(37, 99, 235, 0.1)",
    adminOnly: false,
  },
  {
    icon: FiPackage,
    title: "Products",
    description: "Manage products",
    path: "/products",
    iconColor: "#1d4ed8",
    iconBg: "rgba(29, 78, 216, 0.1)",
    adminOnly: true,
  },
  {
    icon: FiBarChart2,
    title: "Reports",
    description: "View analytics",
    path: "/reports",
    iconColor: "#60a5fa",
    iconBg: "rgba(96, 165, 250, 0.1)",
    adminOnly: false,
  },
  {
    icon: TbReceiptDollar,
    title: "Shift Reconciliation",
    description: "Reconcile shifts",
    path: "/shift-reconciliation",
    iconColor: "#3b82f6",
    iconBg: "rgba(59, 130, 246, 0.1)",
    adminOnly: false,
  },
  {
    icon: FiDollarSign,
    title: "Expenses",
    description: "Track expenses",
    path: "/expenses",
    iconColor: "#2563eb",
    iconBg: "rgba(37, 99, 235, 0.1)",
    adminOnly: true,
  },
  {
    icon: FiTrendingUp,
    title: "Debts",
    description: "Manage debts",
    path: "/debts",
    iconColor: "#1d4ed8",
    iconBg: "rgba(29, 78, 216, 0.1)",
    adminOnly: false,
  },
  {
    icon: FiUsers,
    title: "Users",
    description: "User management",
    path: "/admin",
    iconColor: "#60a5fa",
    iconBg: "rgba(96, 165, 250, 0.1)",
    adminOnly: true,
  },
]

