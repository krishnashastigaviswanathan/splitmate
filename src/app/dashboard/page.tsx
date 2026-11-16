"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Plus,
  KeyRound,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  Layers,
  Sparkles,
  ArrowRight,
  Target,
  AlertTriangle,
  Users,
  Calendar,
  BarChart3,
  Smile,
  MessageSquare,
  Coffee,
} from "lucide-react";
import { Navbar } from "@/components/ui/Navbar";
import { MobileBottomNav } from "@/components/ui/MobileBottomNav";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { CreateGroupModal } from "@/components/modals/CreateGroupModal";
import { JoinGroupModal } from "@/components/modals/JoinGroupModal";
import { AddExpenseModal } from "@/components/modals/AddExpenseModal";
import { OverallDashboardBarChart } from "@/components/charts/OverallDashboardBarChart";
import { MonthlyExpenseCalendar } from "@/components/dashboard/MonthlyExpenseCalendar";
import { CornerEasterEggs } from "@/components/fun/CornerEasterEggs";
import { FridgeStickyNotes } from "@/components/fun/FridgeStickyNotes";
import { RoommateChatShoutbox } from "@/components/fun/RoommateChatShoutbox";
import { RoommateFunZone } from "@/components/fun/RoommateFunZone";
import { formatCurrency } from "@/lib/formatters";
import { useToast } from "@/components/ui/Toast";

interface GroupSummary {
  id: string;
  name: string;
  emoji: string;
  currency: string;
  monthlyGoal: number | null;
  inviteCode: string;
  createdAt: string;
  membersCount: number;
  members: Array<{ id: string; name: string; email: string; upiId?: string | null }>;
  userNetBalance: number;
  totalExpensesCount: number;
  currentMonthTotal: number;
  isOverBudget: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { success, toast } = useToast();

  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [overviewData, setOverviewData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Calendar selected month state
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);

  // Tab filter on dashboard
  const [dashboardTab, setDashboardTab] = useState<"overview" | "calendar" | "messages" | "fridge" | "fun">("overview");

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch("/api/groups");
      const data = await res.json();
      if (res.ok) {
        setGroups(data.groups || []);
      }
    } catch (err) {
      console.error("Failed to load groups:", err);
    }
  }, []);

  const fetchOverview = useCallback(async (year: number, month: number) => {
    try {
      const res = await fetch(`/api/dashboard/overview?year=${year}&month=${month}`);
      const data = await res.json();
      if (res.ok) {
        setOverviewData(data);
      }
    } catch (err) {
      console.error("Failed to load overview data:", err);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      setIsLoading(true);
      Promise.all([fetchGroups(), fetchOverview(selectedYear, selectedMonth)]).finally(() => {
        setIsLoading(false);
      });
    }
  }, [status, router, fetchGroups, fetchOverview, selectedYear, selectedMonth]);

  const handleMonthChange = (newYear: number, newMonth: number) => {
    setSelectedYear(newYear);
    setSelectedMonth(newMonth);
    fetchOverview(newYear, newMonth);
  };

  const handleCopyInviteCode = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    success(`Invite code ${code} copied to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <div className="animate-pulse space-y-6">
            <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Calculate totals
  const totalNetBalance = groups.reduce((acc, g) => acc + g.userNetBalance, 0);
  const totalCurrentMonthSpending = groups.reduce((acc, g) => acc + g.currentMonthTotal, 0);
  const currentUserId = (session?.user as any)?.id;
  const firstGroup = groups[0];

  const totalHouseholdMembers =
    overviewData?.selectedMonth?.totalHouseholdMembers ||
    Math.max(1, new Set(groups.flatMap((g) => g.members.map((m) => m.id))).size);

  const averagePerPersonMonthly =
    overviewData?.selectedMonth?.averagePerPersonMonthly ||
    Math.round(totalCurrentMonthSpending / Math.max(1, totalHouseholdMembers));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col pb-24 md:pb-8 transition-colors relative">
      <Navbar
        groups={groups.map((g) => ({ id: g.id, name: g.name, emoji: g.emoji }))}
        onOpenAddExpense={groups.length > 0 ? () => setIsAddExpenseOpen(true) : undefined}
      />

      {/* Floating Corner Easter Eggs (Ice tray report & Emergency Snack Signal) */}
      <CornerEasterEggs />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-8">
        {/* Top Header & Greeting with Corner Chai Counter */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-1.5">
              <span>🥑 Roommate HQ</span>
              <span>•</span>
              <span>{groups.length} active households</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>Hi, {session?.user?.name?.split(" ")[0] || "Roommate"}</span>
              <span className="text-xl">🍕</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Zero awkward math, effortless settlements, and friendly roommate banter.
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
            <button
              onClick={() => setIsJoinModalOpen(true)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm transition-all"
            >
              <KeyRound className="w-4 h-4 text-slate-500" />
              <span>Join via Code</span>
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-md shadow-emerald-600/30 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create Group</span>
            </button>
          </div>
        </div>

        {/* Global KPI Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Net Balance Card */}
          <div
            className={`p-5 rounded-2xl border transition-all ${
              totalNetBalance > 0
                ? "bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-emerald-500/40 shadow-emerald-500/10"
                : totalNetBalance < 0
                ? "bg-gradient-to-br from-rose-600 to-orange-600 text-white border-rose-500/40 shadow-rose-500/10"
                : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800"
            }`}
          >
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                totalNetBalance !== 0 ? "text-white/80" : "text-slate-500 dark:text-slate-400"
              }`}
            >
              Overall Net Balance
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold mt-1 tabular-nums">
              {formatCurrency(totalNetBalance, "INR")}
            </div>
            <p
              className={`text-xs mt-1 flex items-center gap-1 ${
                totalNetBalance !== 0 ? "text-white/90" : "text-slate-500 dark:text-slate-400"
              }`}
            >
              {totalNetBalance > 0 ? (
                <>
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>You are owed money overall 💰</span>
                </>
              ) : totalNetBalance < 0 ? (
                <>
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>You owe flatmates money (time to UPI!) 💌</span>
                </>
              ) : (
                <span>All your household ledgers are 100% balanced ☕</span>
              )}
            </p>
          </div>

          {/* Active Groups */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Groups
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold mt-1 text-slate-900 dark:text-white tabular-nums">
              {groups.length}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Apartments, flatmates & trips</span>
            </p>
          </div>

          {/* Current Month Spending */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  This Month&apos;s Household Expenses
                </span>
                <span className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Target className="w-4 h-4 text-emerald-500" />
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold mt-1 text-slate-900 dark:text-white tabular-nums">
                {formatCurrency(totalCurrentMonthSpending, "INR", false)}
              </div>
            </div>

            {/* Split Per Person Monthly Below Overall Expenses */}
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
                  <Users className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Split Per Person:</span>
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold tabular-nums">
                  ≈ {formatCurrency(averagePerPersonMonthly, "INR", false)} / person
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
                <span>Across {totalHouseholdMembers} roommates</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Equal Share</span>
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm overflow-x-auto scrollbar-none">
          {[
            { id: "overview", label: "Dashboard & Groups", icon: Layers },
            { id: "calendar", label: "Monthly Calendar (Date-Wise)", icon: Calendar },
            { id: "messages", label: "Roommate Shoutbox 💬", icon: MessageSquare },
            { id: "fridge", label: "Apartment Fridge Notes 📌", icon: Sparkles },
            { id: "fun", label: "Roommate Roasts & Quirks 🤖", icon: Smile },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = dashboardTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setDashboardTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: MAIN OVERVIEW (Groups + Overall Spending Bar Graph + Live Chat Sneak-Peek) */}
        {dashboardTab === "overview" && (
          <div className="space-y-8 animate-fade-in">
            {/* Groups Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Your Groups</h2>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Click any group to open bills & settlements
                </span>
              </div>

              {groups.length === 0 ? (
                <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    No Expense Groups Yet
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Create a group for your apartment, or join your flatmates using their 6-character
                    invite code.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {groups.map((group) => {
                    const goal = group.monthlyGoal || 0;
                    const pct =
                      goal > 0
                        ? Math.min(Math.round((group.currentMonthTotal / goal) * 100), 100)
                        : 0;
                    const isPositive = group.userNetBalance > 0;
                    const isNegative = group.userNetBalance < 0;

                    return (
                      <div
                        key={group.id}
                        onClick={() => router.push(`/groups/${group.id}`)}
                        className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl shadow-inner group-hover:scale-105 transition-transform">
                              {group.emoji}
                            </div>

                            <button
                              onClick={(e) => handleCopyInviteCode(e, group.inviteCode)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-300 transition-colors"
                              title="Click to copy invite code"
                            >
                              <span>{group.inviteCode}</span>
                              {copiedCode === group.inviteCode ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3 text-slate-400" />
                              )}
                            </button>
                          </div>

                          <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {group.name}
                          </h3>

                          {/* Member Avatars Stack */}
                          <div className="flex items-center gap-1.5 mt-2.5">
                            <div className="flex -space-x-2 overflow-hidden">
                              {group.members.slice(0, 4).map((m) => (
                                <div
                                  key={m.id}
                                  className="ring-2 ring-white dark:ring-slate-900 rounded-full"
                                >
                                  <UserAvatar name={m.name} size="xs" />
                                </div>
                              ))}
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium ml-1">
                              {group.membersCount} {group.membersCount === 1 ? "member" : "members"}
                            </span>
                          </div>

                          {/* Monthly Budget Progress Bar */}
                          {goal > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                              <div className="flex items-center justify-between text-xs mb-1.5">
                                <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                                  <Target className="w-3.5 h-3.5 text-slate-400" />
                                  This Month:
                                </span>
                                <span
                                  className={`font-bold tabular-nums ${
                                    group.isOverBudget
                                      ? "text-rose-600 dark:text-rose-400"
                                      : "text-slate-800 dark:text-slate-200"
                                  }`}
                                >
                                  {formatCurrency(group.currentMonthTotal, group.currency, false)} /{" "}
                                  {formatCurrency(goal, group.currency, false)}
                                </span>
                              </div>

                              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    group.isOverBudget
                                      ? "bg-rose-500"
                                      : pct >= 80
                                      ? "bg-amber-500"
                                      : "bg-emerald-500"
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>

                              {group.isOverBudget && (
                                <div className="mt-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>Over monthly goal</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Bottom Balance */}
                        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Your balance:
                          </div>
                          <div
                            className={`text-sm font-extrabold tabular-nums flex items-center gap-1 ${
                              isPositive
                                ? "text-emerald-600 dark:text-emerald-400"
                                : isNegative
                                ? "text-rose-600 dark:text-rose-400"
                                : "text-slate-500 dark:text-slate-400"
                            }`}
                          >
                            {formatCurrency(group.userNetBalance, group.currency)}
                            <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Overall Spending Bar Graph (Directly on Dashboard) */}
            {overviewData?.overallBarGraph && (
              <OverallDashboardBarChart data={overviewData.overallBarGraph} />
            )}

            {/* Split Row: Roommate Shoutbox + Virtual Fridge Sticky Notes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {groups.length > 0 && (
                <RoommateChatShoutbox
                  groups={groups.map((g) => ({ id: g.id, name: g.name, emoji: g.emoji }))}
                  currentUserId={currentUserId}
                />
              )}
              <FridgeStickyNotes />
            </div>
          </div>
        )}

        {/* TAB 2: MONTHLY EXPENSE CALENDAR (Date-Wise view) */}
        {dashboardTab === "calendar" && (
          <div className="animate-fade-in space-y-6">
            {overviewData?.calendarDays ? (
              <MonthlyExpenseCalendar
                currentMonth={overviewData.selectedMonth}
                calendarDays={overviewData.calendarDays}
                onMonthChange={handleMonthChange}
                onOpenAddExpense={groups.length > 0 ? () => setIsAddExpenseOpen(true) : undefined}
              />
            ) : (
              <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <p className="text-sm text-slate-400">Loading calendar data...</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ROOMMATE SHOUTBOX (Dedicated Space to Send Messages) */}
        {dashboardTab === "messages" && (
          <div className="animate-fade-in space-y-6">
            <RoommateChatShoutbox
              groups={groups.map((g) => ({ id: g.id, name: g.name, emoji: g.emoji }))}
              currentUserId={currentUserId}
            />
          </div>
        )}

        {/* TAB 4: APARTMENT FRIDGE POST-IT NOTES */}
        {dashboardTab === "fridge" && (
          <div className="animate-fade-in space-y-6">
            <FridgeStickyNotes />
          </div>
        )}

        {/* TAB 5: ROOMMATE FUN ZONE (Roasts & Quirks) */}
        {dashboardTab === "fun" && (
          <div className="animate-fade-in space-y-6">
            <RoommateFunZone />
          </div>
        )}
      </main>

      {/* Modals */}
      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onGroupCreated={(newGroup) => {
          setGroups((prev) => [newGroup, ...prev]);
          router.push(`/groups/${newGroup.id}`);
        }}
      />

      <JoinGroupModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onJoinedGroup={() => {
          fetchGroups();
          fetchOverview(selectedYear, selectedMonth);
        }}
      />

      {firstGroup && (
        <AddExpenseModal
          isOpen={isAddExpenseOpen}
          onClose={() => setIsAddExpenseOpen(false)}
          groupId={firstGroup.id}
          currency={firstGroup.currency}
          members={firstGroup.members}
          currentUserId={currentUserId}
          onExpenseAdded={() => {
            fetchGroups();
            fetchOverview(selectedYear, selectedMonth);
          }}
        />
      )}

      <MobileBottomNav
        onOpenAddExpense={() => {
          if (firstGroup) setIsAddExpenseOpen(true);
          else setIsCreateModalOpen(true);
        }}
      />
    </div>
  );
}
