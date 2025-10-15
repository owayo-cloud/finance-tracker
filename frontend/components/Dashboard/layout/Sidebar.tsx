'use client';
import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Calendar, 
  UserCircle, 
  FileText, 
  Table, 
  Settings,
  ChevronDown,
  X
} from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});

  const toggleMenu = (menu: string) => {
    setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  const menuItems = [
    {
      title: "MENU",
      items: [
        { 
          icon: LayoutDashboard, 
          label: "Dashboard", 
          href: "/dashboard",
        },
        { 
          icon: Calendar, 
          label: "Calendar", 
          href: "/calendar",
        },
        { 
          icon: UserCircle, 
          label: "Profile", 
          href: "/profile",
        },
        {
          icon: FileText,
          label: "Forms",
          href: "#",
          submenu: [
            { label: "Form Elements", href: "/forms/elements" },
            { label: "Form Layout", href: "/forms/layout" },
          ]
        },
        {
          icon: Table,
          label: "Tables",
          href: "/tables",
        },
        { 
          icon: Settings, 
          label: "Settings", 
          href: "/settings",
        },
      ]
    }
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`absolute left-0 top-0 z-30 flex h-screen w-72 flex-col overflow-y-hidden bg-black duration-300 ease-linear dark:bg-boxdark lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5">
          <Link href="/dashboard" className="text-white text-2xl font-bold">
            TailAdmin
          </Link>

          <button
            onClick={() => setSidebarOpen(false)}
            className="block lg:hidden text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Sidebar Menu */}
        <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
          <nav className="mt-5 py-4 px-4 lg:mt-9 lg:px-6">
            {menuItems.map((section, index) => (
              <div key={index}>
                <h3 className="mb-4 ml-4 text-sm font-semibold text-bodydark2">
                  {section.title}
                </h3>

                <ul className="mb-6 flex flex-col gap-1.5">
                  {section.items.map((item, itemIndex) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || 
                      (item.submenu && item.submenu.some(sub => pathname === sub.href));
                    const hasSubmenu = item.submenu && item.submenu.length > 0;
                    const isOpen = openMenus[item.label];

                    return (
                      <li key={itemIndex}>
                        {hasSubmenu ? (
                          <>
                            <button
                              onClick={() => toggleMenu(item.label)}
                              className={`group relative flex w-full items-center gap-2.5 rounded-sm px-4 py-2 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${
                                isActive ? "bg-graydark dark:bg-meta-4" : ""
                              }`}
                            >
                              <Icon size={18} />
                              {item.label}
                              <ChevronDown 
                                size={16} 
                                className={`absolute right-4 top-1/2 -translate-y-1/2 transition-transform ${
                                  isOpen ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                            {isOpen && (
                              <ul className="mt-1 mb-2 flex flex-col gap-1 pl-6">
                                {item.submenu.map((subItem, subIndex) => (
                                  <li key={subIndex}>
                                    <Link
                                      href={subItem.href}
                                      className={`group relative flex items-center gap-2.5 rounded-md px-4 py-2 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${
                                        pathname === subItem.href ? "text-white" : ""
                                      }`}
                                    >
                                      {subItem.label}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </>
                        ) : (
                          <Link
                            href={item.href}
                            className={`group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${
                              isActive ? "bg-graydark dark:bg-meta-4" : ""
                            }`}
                          >
                            <Icon size={18} />
                            {item.label}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}