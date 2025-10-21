import { ChevronRight, Home, ShoppingBag, Users } from "lucide-react";

export default function BreadCrumbs() {
  return (
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
  );
}
