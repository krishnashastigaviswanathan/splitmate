"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Sun,
  Moon,
  Plus,
  LogOut,
  ChevronDown,
  Layers,
  Sparkles,
  QrCode,
  User as UserIcon,
  Check,
} from "lucide-react";
import { useTheme } from "@/components/providers/AuthProvider";
import { UserAvatar } from "@/components/ui/UserAvatar";

interface NavbarProps {
  onOpenAddExpense?: () => void;
  groups?: Array<{ id: string; name: string; emoji: string }>;
  currentGroupId?: string;
}

export function Navbar({ onOpenAddExpense, groups = [], currentGroupId }: NavbarProps) {
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);

  const currentGroup = groups.find((g) => g.id === currentGroupId);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand & Group Selector */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 dark:text-white tracking-tight text-lg leading-tight flex items-center gap-1.5">
                SplitMate
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Roommates
                </span>
              </span>
            </div>
          </Link>

          {/* Group Switcher dropdown if groups provided */}
          {groups.length > 0 && (
            <div className="relative hidden md:block">
              <button
                onClick={() => setGroupDropdownOpen(!groupDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span>{currentGroup ? `${currentGroup.emoji} ${currentGroup.name}` : "All Groups"}</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {groupDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setGroupDropdownOpen(false)}
                  />
                  <div className="absolute left-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-20 py-2 animate-fade-in">
                    <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Switch Group
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setGroupDropdownOpen(false)}
                      className={`flex items-center justify-between px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                        !currentGroupId ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold" : ""
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-slate-400" /> All Groups
                      </span>
                      {!currentGroupId && <Check className="w-4 h-4 text-emerald-600" />}
                    </Link>
                    {groups.map((g) => (
                      <Link
                        key={g.id}
                        href={`/groups/${g.id}`}
                        onClick={() => setGroupDropdownOpen(false)}
                        className={`flex items-center justify-between px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                          currentGroupId === g.id ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold" : ""
                        }`}
                      >
                        <span className="truncate">
                          {g.emoji} {g.name}
                        </span>
                        {currentGroupId === g.id && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Add Expense button */}
          {onOpenAddExpense && (
            <button
              onClick={onOpenAddExpense}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm shadow-emerald-600/30 hover:shadow-md transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Add Expense</span>
              <kbd className="hidden lg:inline-block ml-1 text-[10px] bg-emerald-700 text-emerald-100 px-1.5 py-0.5 rounded font-mono font-normal">
                N
              </kbd>
            </button>
          )}

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* User Profile dropdown */}
          {session?.user && (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-emerald-500/30 transition-all"
              >
                <UserAvatar name={session.user.name || "User"} size="sm" />
              </button>

              {userDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setUserDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-20 py-2 animate-fade-in">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {session.user.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {session.user.email}
                      </p>
                      {(session.user as any).upiId ? (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-1 rounded-lg">
                          <QrCode className="w-3.5 h-3.5" />
                          <span className="font-mono">{(session.user as any).upiId}</span>
                        </div>
                      ) : (
                        <p className="mt-1.5 text-[11px] text-amber-600 dark:text-amber-400">
                          No UPI ID saved in profile
                        </p>
                      )}
                    </div>

                    <div className="py-1">
                      <Link
                        href="/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      >
                        <Layers className="w-4 h-4 text-slate-400" /> Dashboard
                      </Link>
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          signOut({ callbackUrl: "/login" });
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
