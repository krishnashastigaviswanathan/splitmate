"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Mail,
  Zap,
  TrendingUp,
  Receipt,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (res?.error) {
        toast({ type: "error", message: res.error });
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      toast({ type: "error", message: "An unexpected error occurred." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
    setIsLoading(true);

    try {
      const res = await signIn("credentials", {
        email: demoEmail,
        password: "password123",
        redirect: false,
      });

      if (res?.error) {
        toast({ type: "error", message: res.error });
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      toast({ type: "error", message: "Failed to sign in with demo account" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Left Column: Product Showcase & Brand Highlights */}
      <div className="lg:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        {/* Top brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">SplitMate</h1>
          </div>
        </div>

        {/* Middle hero copy & feature highlights */}
        <div className="my-10 lg:my-0 relative z-10 space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" /> Modern Household Expense Splitter
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15]">
            Split roommate bills without the awkward math.
          </h2>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            The next-generation expense sharing app for flats, trips, and shared households.
            Keep everyone on budget with real-time analytics and instant UPI settlements.
          </p>

          {/* Highlights checklist */}
          <div className="space-y-3 pt-2 text-sm text-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span>
                <strong>Greedy Debt Simplification:</strong> Minimize payments into the fewest possible transfers.
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span>
                <strong>Monthly Budget Pulse & Alerts:</strong> Visual 6-month bar graph with over-budget warnings.
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span>
                <strong>4 Split Modes:</strong> Equal, exact, percentage, and itemized dishes with taxes.
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span>
                <strong>Instant UPI Deep Links & QR Codes:</strong> 1-click GPay / PhonePe settle-up.
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Social Proof */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>Trusted by thousands of roommates across Bangalore, Mumbai & Delhi.</span>
          <span className="font-semibold text-emerald-400">Zero rounding errors</span>
        </div>
      </div>

      {/* Right Column: Sign In Form & Demo Accounts */}
      <div className="lg:w-1/2 p-6 sm:p-12 lg:p-16 flex items-center justify-center">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Welcome back
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Sign in to manage your household expenses and settlements.
            </p>
          </div>

          {/* Quick Demo Accounts Pill Selector */}
          <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> 1-Click Demo Accounts
              </span>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-bold">
                Apartment 4B
              </span>
            </div>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mb-2.5">
              Select any pre-seeded roommate to test live balances, charts & settlements:
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { name: "Rahul (Creditor)", email: "rahul@roommates.app" },
                { name: "Priya (Roommate)", email: "priya@roommates.app" },
                { name: "Arjun (Debtor)", email: "arjun@roommates.app" },
                { name: "Sneha (Roommate)", email: "sneha@roommates.app" },
              ].map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleDemoLogin(acc.email)}
                  disabled={isLoading}
                  className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 hover:border-emerald-500 dark:hover:border-emerald-500 text-slate-800 dark:text-slate-200 text-xs font-semibold text-left transition-all active:scale-95 shadow-sm truncate"
                >
                  {acc.name}
                </button>
              ))}
            </div>
          </div>

          {/* Regular Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <div className="relative mt-1">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative mt-1">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-md shadow-emerald-600/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <span>{isLoading ? "Signing in..." : "Sign In to SplitMate"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Switch to Signup */}
          <div className="text-center text-xs text-slate-500 dark:text-slate-400">
            Don&apos;t have an account yet?{" "}
            <Link
              href="/signup"
              className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
