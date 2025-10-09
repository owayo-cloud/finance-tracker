"use client";
import { useState } from "react";
import { DollarSign, Mail, Lock, Eye, EyeOff, TrendingUp } from "lucide-react";

export default function FinanceLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = () => {
    if (!isLogin && password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    if (!isLogin && fullName.trim() === "") {
      alert("Please enter your full name");
      return;
    }
    console.log("Form submitted:", { email, password, isLogin, fullName });
    alert(isLogin ? "Login successful!" : "Account created successfully!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-700"></div>
      </div>

      <div className="relative w-full max-w-6xl flex flex-col lg:flex-row bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-white/20">
        {/* Left side - Branding */}
        <div className="lg:w-1/2 bg-gradient-to-br from-purple-600 to-blue-600 p-12 flex flex-col justify-center text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
              <DollarSign className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold">FinanceFlow</h1>
          </div>

          <h2 className="text-4xl font-bold mb-6 leading-tight">
            Take Control of Your Financial Future
          </h2>

          <p className="text-lg text-purple-100 mb-8">
            Track expenses, monitor investments, and achieve your financial
            goals with intelligent insights and beautiful analytics.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-purple-100">
                Real-time financial tracking
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <DollarSign className="w-5 h-5" />
              </div>
              <span className="text-purple-100">Smart budget management</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Lock className="w-5 h-5" />
              </div>
              <span className="text-purple-100">Bank-level security</span>
            </div>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="lg:w-1/2 p-12 bg-white">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-gray-800 mb-2">
                {isLogin ? "Welcome Back" : "Create Account"}
              </h3>
              <p className="text-gray-600">
                {isLogin
                  ? "Sign in to continue to your account"
                  : "Start your financial journey today"}
              </p>
            </div>

            <div className="space-y-6">
              {!isLogin && (
                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-gray-800"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-gray-800"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-gray-800"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-gray-800"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {isLogin && (
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2 rounded" />
                    <span className="text-gray-600">Remember me</span>
                  </label>
                  <button className="text-purple-600 hover:text-purple-700 font-medium">
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                onClick={handleSubmit}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition duration-200"
              >
                {isLogin ? "Sign In" : "Create Account"}
              </button>
            </div>

            <div className="mt-8 text-center">
              <p className="text-gray-600">
                {isLogin
                  ? "Don't have an account? "
                  : "Already have an account? "}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-purple-600 hover:text-purple-700 font-semibold"
                >
                  {isLogin ? "Sign up" : "Sign in"}
                </button>
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                By continuing, you agree to our Terms of Service and Privacy
                Policy
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
