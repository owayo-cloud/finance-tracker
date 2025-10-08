"use client";
import React, { useState, useEffect } from "react";

import {
  DollarSign,
  TrendingUp,
  PieChart,
  Bell,
  Menu,
  Sun,
  Moon,
  ArrowRight,
  Check,
} from "lucide-react";

const FinanceTrackerHome = () => {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedTheme = theme;
    document.documentElement.classList.toggle("dark", savedTheme === "dark");
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const features = [
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: "Track Expenses",
      desc: "Monitor your spending in real-time",
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Budget Goals",
      desc: "Set and achieve your financial targets",
    },
    {
      icon: <PieChart className="w-6 h-6" />,
      title: "Visual Reports",
      desc: "Understand your finances at a glance",
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: "Smart Alerts",
      desc: "Get notified about important transactions",
    },
  ];

  const plans = [
    {
      name: "Free",
      price: "$0",
      features: [
        "Track up to 50 transactions",
        "Basic reports",
        "1 budget category",
      ],
    },
    {
      name: "Pro",
      price: "$9.99",
      popular: true,
      features: [
        "Unlimited transactions",
        "Advanced analytics",
        "Unlimited categories",
        "Priority support",
      ],
    },
    {
      name: "Business",
      price: "$29.99",
      features: [
        "Team collaboration",
        "API access",
        "Custom integrations",
        "Dedicated account manager",
      ],
    },
  ];

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        theme === "dark" ? "dark bg-gray-900" : "bg-white"
      }`}
    >
      {/* Navigation */}
      <nav
        className={`${
          theme === "dark"
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        } border-b sticky top-0 z-50 transition-colors`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <DollarSign
                className={`w-8 h-8 ${
                  theme === "dark" ? "text-emerald-400" : "text-emerald-600"
                }`}
              />
              <span
                className={`text-xl font-bold ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                FinanceTrack
              </span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#features"
                className={`${
                  theme === "dark"
                    ? "text-gray-300 hover:text-white"
                    : "text-gray-600 hover:text-gray-900"
                } transition`}
              >
                Features
              </a>
              <a
                href="#pricing"
                className={`${
                  theme === "dark"
                    ? "text-gray-300 hover:text-white"
                    : "text-gray-600 hover:text-gray-900"
                } transition`}
              >
                Pricing
              </a>
              <a
                href="#about"
                className={`${
                  theme === "dark"
                    ? "text-gray-300 hover:text-white"
                    : "text-gray-600 hover:text-gray-900"
                } transition`}
              >
                About
              </a>
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg ${
                  theme === "dark"
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-gray-100 hover:bg-gray-200"
                } transition`}
              >
                {theme === "light" ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5 text-yellow-400" />
                )}
              </button>
              <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg transition">
                Get Started
              </button>
            </div>

            <div className="md:hidden flex items-center space-x-2">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg ${
                  theme === "dark" ? "bg-gray-700" : "bg-gray-100"
                }`}
              >
                {theme === "light" ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5 text-yellow-400" />
                )}
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`p-2 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          className={`md:hidden ${
            theme === "dark" ? "bg-gray-800" : "bg-white"
          } border-b ${
            theme === "dark" ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <div className="px-4 py-4 space-y-3">
            <a
              href="#features"
              className={`block ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Features
            </a>
            <a
              href="#pricing"
              className={`block ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Pricing
            </a>
            <a
              href="#about"
              className={`block ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              }`}
            >
              About
            </a>
            <button className="w-full bg-emerald-600 text-white px-6 py-2 rounded-lg">
              Get Started
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section
        className={`${
          theme === "dark"
            ? "bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900"
            : "bg-gradient-to-br from-emerald-50 via-white to-blue-50"
        } transition-colors`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center">
            <h1
              className={`text-4xl md:text-6xl font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              } mb-6`}
            >
              Take Control of Your{" "}
              <span className="text-emerald-600">Finances</span>
            </h1>
            <p
              className={`text-xl ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              } mb-8 max-w-2xl mx-auto`}
            >
              Track expenses, set budgets, and achieve your financial goals with
              our intuitive finance tracker.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg text-lg font-semibold transition flex items-center justify-center">
                Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
              </button>
              <button
                className={`${
                  theme === "dark"
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-white hover:bg-gray-50 text-gray-900"
                } px-8 py-3 rounded-lg text-lg font-semibold border ${
                  theme === "dark" ? "border-gray-600" : "border-gray-300"
                } transition`}
              >
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className={`py-20 ${
          theme === "dark" ? "bg-gray-900" : "bg-white"
        } transition-colors`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2
              className={`text-3xl md:text-4xl font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              } mb-4`}
            >
              Powerful Features
            </h2>
            <p
              className={`text-lg ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Everything you need to manage your money effectively
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className={`${
                  theme === "dark"
                    ? "bg-gray-800 hover:bg-gray-750"
                    : "bg-gray-50 hover:bg-gray-100"
                } p-6 rounded-xl transition cursor-pointer`}
              >
                <div
                  className={`${
                    theme === "dark"
                      ? "bg-emerald-900 text-emerald-400"
                      : "bg-emerald-100 text-emerald-600"
                  } w-12 h-12 rounded-lg flex items-center justify-center mb-4`}
                >
                  {feature.icon}
                </div>
                <h3
                  className={`text-xl font-semibold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  } mb-2`}
                >
                  {feature.title}
                </h3>
                <p
                  className={`${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id="pricing"
        className={`py-20 ${
          theme === "dark" ? "bg-gray-800" : "bg-gray-50"
        } transition-colors`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2
              className={`text-3xl md:text-4xl font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              } mb-4`}
            >
              Simple Pricing
            </h2>
            <p
              className={`text-lg ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Choose the plan that works for you
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, idx) => (
              <div
                key={idx}
                className={`${
                  theme === "dark" ? "bg-gray-900" : "bg-white"
                } rounded-xl p-8 ${
                  plan.popular ? "ring-2 ring-emerald-600" : ""
                } transition relative`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-emerald-600 text-white px-4 py-1 rounded-bl-xl rounded-tr-xl text-sm font-semibold">
                    Popular
                  </div>
                )}
                <h3
                  className={`text-2xl font-bold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  } mb-2`}
                >
                  {plan.name}
                </h3>
                <div className="mb-6">
                  <span
                    className={`text-4xl font-bold ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {plan.price}
                  </span>
                  <span
                    className={`${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    /month
                  </span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="w-5 h-5 text-emerald-600 mr-2 flex-shrink-0 mt-0.5" />
                      <span
                        className={`${
                          theme === "dark" ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full py-3 rounded-lg font-semibold transition ${
                    plan.popular
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : theme === "dark"
                      ? "bg-gray-800 hover:bg-gray-700 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                  }`}
                >
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className={`${
          theme === "dark"
            ? "bg-gray-900 border-gray-800"
            : "bg-gray-50 border-gray-200"
        } border-t transition-colors`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <DollarSign
                  className={`w-6 h-6 ${
                    theme === "dark" ? "text-emerald-400" : "text-emerald-600"
                  }`}
                />
                <span
                  className={`text-lg font-bold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  FinanceTrack
                </span>
              </div>
              <p
                className={`${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Your trusted partner in financial management.
              </p>
            </div>
            <div>
              <h4
                className={`font-semibold ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                } mb-4`}
              >
                Product
              </h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className={`${
                      theme === "dark"
                        ? "text-gray-400 hover:text-white"
                        : "text-gray-600 hover:text-gray-900"
                    } transition`}
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className={`${
                      theme === "dark"
                        ? "text-gray-400 hover:text-white"
                        : "text-gray-600 hover:text-gray-900"
                    } transition`}
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className={`${
                      theme === "dark"
                        ? "text-gray-400 hover:text-white"
                        : "text-gray-600 hover:text-gray-900"
                    } transition`}
                  >
                    Security
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4
                className={`font-semibold ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                } mb-4`}
              >
                Company
              </h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className={`${
                      theme === "dark"
                        ? "text-gray-400 hover:text-white"
                        : "text-gray-600 hover:text-gray-900"
                    } transition`}
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className={`${
                      theme === "dark"
                        ? "text-gray-400 hover:text-white"
                        : "text-gray-600 hover:text-gray-900"
                    } transition`}
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className={`${
                      theme === "dark"
                        ? "text-gray-400 hover:text-white"
                        : "text-gray-600 hover:text-gray-900"
                    } transition`}
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4
                className={`font-semibold ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                } mb-4`}
              >
                Legal
              </h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className={`${
                      theme === "dark"
                        ? "text-gray-400 hover:text-white"
                        : "text-gray-600 hover:text-gray-900"
                    } transition`}
                  >
                    Privacy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className={`${
                      theme === "dark"
                        ? "text-gray-400 hover:text-white"
                        : "text-gray-600 hover:text-gray-900"
                    } transition`}
                  >
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div
            className={`mt-8 pt-8 border-t ${
              theme === "dark" ? "border-gray-800" : "border-gray-200"
            } text-center ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}
          >
            <p>© 2025 FinanceTrack. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default FinanceTrackerHome;
