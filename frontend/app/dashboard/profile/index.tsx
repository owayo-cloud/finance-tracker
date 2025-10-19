"use client";

import { useState } from "react";
import { 
  User,
  Shield,
  Key,
  Smartphone,
  Lock,
  AlertTriangle,
  ChevronRight,
  Home,
  Settings,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Clock,
  Monitor,
  MapPin,
  Calendar,
  Save,
  Trash2
} from "lucide-react";

export default function AccountPage() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const activeSessions = [
    {
      device: "Chrome on MacBook Pro",
      location: "San Francisco, CA",
      ip: "192.168.1.1",
      lastActive: "Active now",
      isCurrent: true
    },
    {
      device: "Safari on iPhone 14",
      location: "San Francisco, CA",
      ip: "192.168.1.2",
      lastActive: "2 hours ago",
      isCurrent: false
    },
    {
      device: "Chrome on Windows",
      location: "New York, NY",
      ip: "192.168.1.3",
      lastActive: "3 days ago",
      isCurrent: false
    }
  ];

  const loginHistory = [
    {
      date: "2025-10-19",
      time: "10:30 AM",
      device: "Chrome on MacBook Pro",
      location: "San Francisco, CA",
      status: "success"
    },
    {
      date: "2025-10-18",
      time: "03:45 PM",
      device: "Safari on iPhone 14",
      location: "San Francisco, CA",
      status: "success"
    },
    {
      date: "2025-10-17",
      time: "11:20 AM",
      device: "Chrome on Windows",
      location: "New York, NY",
      status: "success"
    },
    {
      date: "2025-10-16",
      time: "09:15 AM",
      device: "Unknown Device",
      location: "Unknown Location",
      status: "failed"
    }
  ];

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
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-900 dark:text-gray-100 font-medium flex items-center gap-1">
            <User className="w-4 h-4" />
            Account
          </span>
        </nav>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Account Security</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage your account security and authentication settings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Quick Stats */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                Security Score
              </h3>
              <div className="flex items-center justify-center mb-4">
                <div className="relative w-32 h-32">
                  <svg className="transform -rotate-90 w-32 h-32">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-gray-200 dark:text-gray-700"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${2 * Math.PI * 56 * (1 - 0.75)}`}
                      className="text-emerald-500"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">75%</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Good</div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Your account security is good. Enable 2FA for better protection.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button className="flex items-center justify-between w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <span className="flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    Change Password
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button className="flex items-center justify-between w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <span className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    Setup 2FA
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button className="flex items-center justify-between w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Privacy Settings
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Change Password */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Change Password
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Update your password to keep your account secure
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter current password"
                    />
                    <button
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter new password"
                    />
                    <button
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Confirm new password"
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                    <Save className="w-4 h-4" />
                    Update Password
                  </button>
                  <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </div>

            {/* Two-Factor Authentication */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  Two-Factor Authentication
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Add an extra layer of security to your account
                </p>
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                        Authenticator App
                      </h4>
                      {twoFactorEnabled ? (
                        <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium rounded">
                          Enabled
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium rounded">
                          Disabled
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Use an authenticator app to generate verification codes
                    </p>
                  </div>
                  <button
                    onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      twoFactorEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {twoFactorEnabled && (
                  <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                          Two-factor authentication is active
                        </p>
                        <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                          Your account is protected with an additional security layer.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Active Sessions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Monitor className="w-5 h-5" />
                  Active Sessions
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Manage devices where you&apos;re currently logged in
                </p>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {activeSessions.map((session, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Monitor className="w-5 h-5 text-gray-400" />
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {session.device}
                          </h4>
                          {session.isCurrent && (
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium rounded">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{session.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{session.lastActive}</span>
                          </div>
                          <div className="text-xs">IP: {session.ip}</div>
                        </div>
                      </div>
                      {!session.isCurrent && (
                        <button className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button className="mt-4 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                  Revoke All Other Sessions
                </button>
              </div>
            </div>

            {/* Login History */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Login History
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Recent login attempts to your account
                </p>
              </div>

              <div className="p-6">
                <div className="space-y-3">
                  {loginHistory.map((login, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex items-start gap-3">
                        {login.status === "success" ? (
                          <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                              {login.device}
                            </h4>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded ${
                                login.status === "success"
                                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                                  : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                              }`}
                            >
                              {login.status === "success" ? "Successful" : "Failed"}
                            </span>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {login.date} at {login.time}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>{login.location}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-900 shadow-sm">
              <div className="p-6 border-b border-red-200 dark:border-red-900">
                <h3 className="text-lg font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Danger Zone
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Irreversible actions that affect your account
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                      Delete Account
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Permanently delete your account and all associated data
                    </p>
                  </div>
                  <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}