"use client";
import { useState } from "react";
//import { useRouter } from "next/navigation";
import {
  DollarSign,
  Mail,
  Lock,
  Eye,
  EyeOff,
  TrendingUp,
  User,
} from "lucide-react";

export default function FinanceLogin() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  //const router = useRouter();

  const API_BASE = "http://127.0.0.1:8000/auth";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    if (!isLogin && password !== confirmPassword) {
      setMessage(" Passwords do not match!");
      setLoading(false);
      return;
    }

    try {
      const url = isLogin ? `${API_BASE}/login` : `${API_BASE}/register`;
      const body = isLogin
        ? { email, password }
        : { full_name: fullName, email, password };

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        if (isLogin) {
          //save token/expiry and redirect
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("user", JSON.stringify(data.user));

          // calculate absolute expiry defaults to 1 hour if not provided
          const expiresIn = Number(data.expires_in) || 3600;
          const expiryTimestamp = Math.floor(Date.now() / 1000) + expiresIn;
          localStorage.setItem("token_expiry", expiryTimestamp.toString());

          setMessage("Login successful! Redirecting...");
          setTimeout(() => (window.location.href = "/dashboard"), 800);
          // router.replace("/dashboard"); //redirects instantly
        } else {
          setMessage(" Account created successfully! You can now log in.");
          setIsLogin(true);
        }
      } else {
        setMessage(data.detail || "Something went wrong!");
      }
    } catch (error) {
      setMessage(" Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setMessage(" Google OAuth integration coming soon!");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-6 py-10 transition-colors duration-300">
      <div className="flex items-center space-x-2 mb-6 group">
        <DollarSign className="text-emerald-600 dark:text-emerald-400 w-8 h-8 group-hover:rotate-12 transition-transform duration-300" />
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          FinanceFlow
        </h1>
      </div>

      <div className="w-full max-w-md bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 transition-all duration-300 hover:shadow-2xl border border-gray-100 dark:border-gray-700">
        <h2 className="text-2xl font-semibold text-center mb-6 text-gray-800 dark:text-gray-100">
          {isLogin ? "Welcome Back" : "Create an Account"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div>
              <label className="block text-gray-600 dark:text-gray-300 mb-2 text-sm font-medium">
                Full Name
              </label>
              <div className="relative group">
                <User
                  className="absolute left-3 top-3 text-gray-400 dark:text-gray-500 group-hover:text-emerald-500 transition-colors duration-200"
                  size={20}
                />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200 hover:border-emerald-300 dark:hover:border-emerald-600"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-gray-600 dark:text-gray-300 mb-2 text-sm font-medium">
              Email
            </label>
            <div className="relative group">
              <Mail
                className="absolute left-3 top-3 text-gray-400 dark:text-gray-500 group-hover:text-emerald-500 transition-colors duration-200"
                size={20}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200 hover:border-emerald-300 dark:hover:border-emerald-600"
                placeholder="example@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-600 dark:text-gray-300 mb-2 text-sm font-medium">
              Password
            </label>
            <div className="relative group">
              <Lock
                className="absolute left-3 top-3 text-gray-400 dark:text-gray-500 group-hover:text-emerald-500 transition-colors duration-200"
                size={20}
              />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200 hover:border-emerald-300 dark:hover:border-emerald-600"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 dark:text-gray-500 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors duration-200"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-gray-600 dark:text-gray-300 mb-2 text-sm font-medium">
                Confirm Password
              </label>
              <div className="relative group">
                <Lock
                  className="absolute left-3 top-3 text-gray-400 dark:text-gray-500 group-hover:text-emerald-500 transition-colors duration-200"
                  size={20}
                />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200 hover:border-emerald-300 dark:hover:border-emerald-600"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-400 dark:text-gray-500 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors duration-200"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          )}

          {message && (
            <p
              className={`text-sm text-center font-medium ${
                message.includes("") || message.includes("")
                  ? "text-green-600 dark:text-green-400"
                  : "text-green-500 dark:text-green-400"
              }`}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center space-x-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {loading ? (
              <span className="animate-pulse">Processing...</span>
            ) : (
              <>
                <TrendingUp size={18} />
                <span>{isLogin ? "Login" : "Register"}</span>
              </>
            )}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              Or continue with
            </span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold py-2.5 rounded-lg flex items-center justify-center space-x-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <p className="text-sm text-gray-600 dark:text-gray-400 mt-6 text-center">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setMessage("");
              setConfirmPassword("");
            }}
            className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline underline-offset-2 transition-all duration-200"
          >
            {isLogin ? "Register" : "Login"}
          </button>
        </p>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-6 text-center max-w-md">
        By continuing, you agree to our{" "}
        <a
          href="#"
          className="text-emerald-600 dark:text-emerald-400 hover:underline underline-offset-2 transition-all duration-200"
        >
          Terms of Service
        </a>{" "}
        and{" "}
        <a
          href="#"
          className="text-emerald-600 dark:text-emerald-400 hover:underline underline-offset-2 transition-all duration-200"
        >
          Privacy Policy
        </a>
      </p>
    </div>
  );
}