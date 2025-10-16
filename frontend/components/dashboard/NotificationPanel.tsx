"use client";
import { X } from "lucide-react";

interface Notification {
  id: number;
  name: string;
  message: string;
  project: string;
  time: string;
  avatar: string;
  read: boolean;
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const notifications: Notification[] = [
    {
      id: 1,
      name: "Terry Franci",
      message: "requests permission to change Project - Nganter App",
      project: "Project",
      time: "5 min ago",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      read: false,
    },
    {
      id: 2,
      name: "Olivia Smith",
      message: "commented on your financial report update",
      project: "Finance",
      time: "10 min ago",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
      read: true,
    },
    {
      id: 3,
      name: "Marcus Lee",
      message: "uploaded a new file to Project - Sales Data",
      project: "Sales",
      time: "20 min ago",
      avatar: "https://randomuser.me/api/portraits/men/68.jpg",
      read: true,
    },
    {
      id: 4,
      name: "Sophia Turner",
      message: "assigned you to Project - Dashboard UX",
      project: "UI Design",
      time: "35 min ago",
      avatar: "https://randomuser.me/api/portraits/women/58.jpg",
      read: true,
    },
  ];

  return (
    <>
      {/* Overlay to close when clicking outside */}
      <div
        className={`fixed inset-0 z-40 bg-black transition-opacity duration-200 ${
          isOpen ? "opacity-10 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Notification Dropdown */}
      <div
        className={`absolute right-4 top-16 w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden transition-all duration-200 ${
          isOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-5 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Notifications</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Notification List */}
        <div className="max-h-80 overflow-y-auto">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                !n.read ? "bg-gray-50" : ""
              }`}
            >
              <div className="relative">
                <img
                  src={n.avatar}
                  alt={n.name}
                  width={40}
                  height={40}
                  className="rounded-full w-10 h-10"
                />
                {!n.read ? (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                ) : (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-gray-300 border-2 border-white rounded-full" />
                )}
              </div>

              <div className="flex-1">
                <p className="text-sm text-gray-800">
                  <span className="font-semibold">{n.name}</span>{" "}
                  {n.message}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {n.project} • {n.time}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100">
          <button className="w-full py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition">
            View All Notifications
          </button>
        </div>
      </div>
    </>
  );
}