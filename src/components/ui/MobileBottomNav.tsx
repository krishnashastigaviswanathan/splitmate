"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Layers, Plus, BarChart3, Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/providers/AuthProvider";

interface MobileBottomNavProps {
  onOpenAddExpense?: () => void;
  currentGroupId?: string;
}

export function MobileBottomNav({ onOpenAddExpense, currentGroupId }: MobileBottomNavProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800 px-6 py-2">
      <div className="flex items-center justify-between max-w-md mx-auto relative">
        <Link
          href="/dashboard"
          className={`flex flex-col items-center gap-1 py-1 text-xs font-medium transition-colors ${
            pathname === "/dashboard"
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </Link>

        {currentGroupId ? (
          <Link
            href={`/groups/${currentGroupId}?tab=expenses`}
            className={`flex flex-col items-center gap-1 py-1 text-xs font-medium transition-colors ${
              pathname.includes(`/groups/${currentGroupId}`) && !pathname.includes("analytics")
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Layers className="w-5 h-5" />
            <span>Expenses</span>
          </Link>
        ) : (
          <Link
            href="/dashboard"
            className="flex flex-col items-center gap-1 py-1 text-xs font-medium text-slate-500 dark:text-slate-400"
          >
            <Layers className="w-5 h-5" />
            <span>Groups</span>
          </Link>
        )}

        {/* Central Prominent Floating + Button */}
        <div className="relative -top-5">
          <button
            onClick={onOpenAddExpense}
            className="w-13 h-13 p-3.5 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center border-4 border-slate-50 dark:border-slate-950"
            aria-label="Add Expense"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        {currentGroupId ? (
          <Link
            href={`/groups/${currentGroupId}?tab=analytics`}
            className={`flex flex-col items-center gap-1 py-1 text-xs font-medium transition-colors ${
              pathname.includes("tab=analytics")
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span>Stats</span>
          </Link>
        ) : (
          <button
            onClick={toggleTheme}
            className="flex flex-col items-center gap-1 py-1 text-xs font-medium text-slate-500 dark:text-slate-400"
          >
            {theme === "dark" ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            <span>Theme</span>
          </button>
        )}

        <button
          onClick={toggleTheme}
          className="flex flex-col items-center gap-1 py-1 text-xs font-medium text-slate-500 dark:text-slate-400"
        >
          {theme === "dark" ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          <span>{theme === "dark" ? "Light" : "Dark"}</span>
        </button>
      </div>
    </div>
  );
}
