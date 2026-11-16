"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Plus,
  Copy,
  Check,
  AlertTriangle,
  QrCode,
  Download,
  Calendar,
  Layers,
  BarChart3,
  Repeat,
  Settings,
  Users,
  Sparkles,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Edit2,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { Navbar } from "@/components/ui/Navbar";
import { MobileBottomNav } from "@/components/ui/MobileBottomNav";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { HeroKpiCards } from "@/components/dashboard/HeroKpiCards";
import { WhoOwesWhomCard } from "@/components/dashboard/WhoOwesWhomCard";
import { RecurringBillsTab } from "@/components/dashboard/RecurringBillsTab";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { MonthlyGoalBarChart } from "@/components/charts/MonthlyGoalBarChart";
import { CategoryDonutChart } from "@/components/charts/CategoryDonutChart";
import { AddExpenseModal } from "@/components/modals/AddExpenseModal";
import { SettleUpModal } from "@/components/modals/SettleUpModal";
import { EditGoalModal } from "@/components/modals/EditGoalModal";
import { ReceiptViewerModal } from "@/components/modals/ReceiptViewerModal";
import { formatCurrency, getCurrencySymbol } from "@/lib/formatters";
import { SimplifiedDebt, MemberBalanceInfo } from "@/lib/debtSimplification";
import { useToast } from "@/components/ui/Toast";

export default function GroupDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast, success, warning } = useToast();

  const groupId = params.groupId as string;
  const initialTab = searchParams.get("tab") || "overview";

  const [activeTab, setActiveTab] = useState<
    "overview" | "expenses" | "balances" | "recurring" | "analytics" | "settings"
  >(initialTab as any);

  const [data, setData] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [selectedDebtToSettle, setSelectedDebtToSettle] = useState<SimplifiedDebt | null>(null);
  const [isEditGoalOpen, setIsEditGoalOpen] = useState(false);
  const [receiptModal, setReceiptModal] = useState<{ isOpen: boolean; url: string; title: string }>({
    isOpen: false,
    url: "",
    title: "",
  });
  const [recurringPrefill, setRecurringPrefill] = useState<any>(null);

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Keyboard shortcut `N` listener to open Add Expense modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing inside an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setRecurringPrefill(null);
        setIsAddExpenseOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const fetchGroupDetails = useCallback(async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}`);
      const json = await res.json();
      if (res.ok) {
        setData(json);
      } else {
        toast({ type: "error", message: json.error || "Failed to load group" });
        router.push("/dashboard");
      }
    } catch (err) {
      console.error(err);
    }
  }, [groupId, router, toast]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch(`/api/analytics?groupId=${groupId}`);
      const json = await res.json();
      if (res.ok) {
        setAnalyticsData(json);
      }
    } catch (err) {
      console.error(err);
    }
  }, [groupId]);

  useEffect(() => {
    if (status === "authenticated" && groupId) {
      setIsLoading(true);
      Promise.all([fetchGroupDetails(), fetchAnalytics()]).finally(() => {
        setIsLoading(false);
      });
    } else if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, groupId, fetchGroupDetails, fetchAnalytics, router]);

  // Handle comment submit
  const handleAddComment = async (expenseId: string, content: string) => {
    try {
      const res = await fetch(`/api/expenses/${expenseId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        success("Comment added!");
        fetchGroupDetails();
      }
    } catch (err) {
      toast({ type: "error", message: "Failed to post comment" });
    }
  };

  // Handle delete expense
  const handleDeleteExpense = async (expenseId: string) => {
    try {
      const res = await fetch(`/api/expenses/${expenseId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        success("Expense deleted successfully");
        fetchGroupDetails();
        fetchAnalytics();
      }
    } catch (err) {
      toast({ type: "error", message: "Failed to delete expense" });
    }
  };

  // Open settle up modal for a specific debt
  const handleOpenSettleDebt = (debt: SimplifiedDebt) => {
    setSelectedDebtToSettle(debt);
    setIsSettleModalOpen(true);
  };

  // Quick 1-click log recurring bill
  const handleLogRecurringBill = (bill: any) => {
    setRecurringPrefill({
      description: `${bill.description} (${new Date().toLocaleDateString("en-US", { month: "short" })})`,
      amount: bill.amount,
      category: bill.category,
      isRecurring: true,
      recurringInterval: bill.recurringInterval,
    });
    setIsAddExpenseOpen(true);
  };

  const handleCopyCode = () => {
    if (!data?.group?.inviteCode) return;
    navigator.clipboard.writeText(data.group.inviteCode);
    setCopiedCode(true);
    success(`Invite code ${data.group.inviteCode} copied to clipboard!`);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyLink = () => {
    if (!data?.group?.inviteCode) return;
    const url = `${window.location.origin}/join/${data.group.inviteCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    success(`Shareable invite link copied to clipboard!`);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <div className="animate-pulse space-y-6">
            <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-44 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
              ))}
            </div>
            <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          </div>
        </main>
      </div>
    );
  }

  const { group, members, currentUserBalance, simplifiedTransactions, expenses, settlements, recurringExpenses, budgetStats } = data;
  const currentUserId = (session?.user as any)?.id;

  const symbol = getCurrencySymbol(group.currency);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col pb-20 md:pb-8 transition-colors">
      <Navbar
        onOpenAddExpense={() => {
          setRecurringPrefill(null);
          setIsAddExpenseOpen(true);
        }}
        currentGroupId={groupId}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
        {/* Pulsing Red Over-Budget Alert Banner */}
        {budgetStats?.isOverBudget && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500/15 via-rose-500/10 to-amber-500/15 border-2 border-rose-500/50 dark:border-rose-500/70 shadow-lg shadow-rose-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-md">
                <AlertTriangle className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-extrabold text-rose-900 dark:text-rose-200 tracking-tight">
                  Budget Exceeded: Monthly spending (
                  {formatCurrency(budgetStats.currentMonthTotal, group.currency, false)}) is{" "}
                  {formatCurrency(budgetStats.overBudgetAmount, group.currency, false)} over your{" "}
                  {formatCurrency(budgetStats.monthlyGoal, group.currency, false)} goal!
                </h4>
                <p className="text-xs text-rose-700 dark:text-rose-300">
                  Review recent high-value expenses in the Analytics tab or adjust this month&apos;s goal.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsEditGoalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm"
              >
                Adjust Goal
              </button>
            </div>
          </div>
        )}

        {/* Group Header Banner */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-3xl shadow-inner shrink-0">
              {group.emoji}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {group.name}
                </h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {group.currency}
                </span>
              </div>

              {/* Members initials list */}
              <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex -space-x-1.5 overflow-hidden">
                  {members.map((m: any) => (
                    <div key={m.id} className="ring-2 ring-white dark:ring-slate-900 rounded-full">
                      <UserAvatar name={m.name} size="xs" />
                    </div>
                  ))}
                </div>
                <span>
                  {members.map((m: any) => m.name.split(" ")[0]).join(", ")}
                </span>
              </div>
            </div>
          </div>

          {/* Right Header Buttons: Invite Code, Link, Add Expense */}
          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 transition-colors"
              title="Copy 6-char Invite Code"
            >
              <span>Code: {group.inviteCode}</span>
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
              title="Copy shareable invite link"
            >
              <span>{copiedLink ? "Link Copied!" : "Invite Link"}</span>
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <ExternalLink className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            <button
              onClick={() => {
                setRecurringPrefill(null);
                setIsAddExpenseOpen(true);
              }}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Expense</span>
              <kbd className="hidden lg:inline-block ml-1 text-[10px] bg-emerald-700 text-emerald-100 px-1.5 py-0.5 rounded font-mono font-normal">
                N
              </kbd>
            </button>
          </div>
        </div>

        {/* 3 Top Hero Summary KPI Cards */}
        <HeroKpiCards
          userNetBalance={currentUserBalance}
          currentMonthTotal={budgetStats.currentMonthTotal}
          monthlyGoal={budgetStats.monthlyGoal}
          currency={group.currency}
          pendingSettlementCount={simplifiedTransactions.length}
          memberCount={budgetStats.memberCount}
          averagePerPersonMonthly={budgetStats.averagePerPersonMonthly}
          topCategory={
            analyticsData?.categoryBreakdown?.[0]
              ? {
                  name: analyticsData.categoryBreakdown[0].name,
                  total: analyticsData.categoryBreakdown[0].total,
                  percentage: analyticsData.categoryBreakdown[0].percentage,
                }
              : undefined
          }
          onEditGoal={() => setIsEditGoalOpen(true)}
          onOpenSettleUp={
            simplifiedTransactions.length > 0
              ? () => handleOpenSettleDebt(simplifiedTransactions[0])
              : undefined
          }
        />

        {/* Tab Navigation Navigation Bar */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm overflow-x-auto scrollbar-none">
          {[
            { id: "overview", label: "Overview", icon: Layers },
            { id: "expenses", label: `Expenses (${expenses.length})`, icon: Plus },
            { id: "balances", label: "Balances & Debts", icon: Users },
            { id: "recurring", label: `Recurring Bills (${recurringExpenses.length})`, icon: Repeat },
            { id: "analytics", label: "Analytics & Export", icon: BarChart3 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
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

        {/* Tab 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-fade-in">
            {/* Who Owes Whom Debt Simplification Card */}
            <WhoOwesWhomCard
              debts={simplifiedTransactions}
              currency={group.currency}
              currentUserId={currentUserId}
              onSettleDebt={handleOpenSettleDebt}
            />

            {/* Split 2-column: Quick Monthly Chart + Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 cols: Monthly Goal Bar Chart Preview */}
              <div className="lg:col-span-2 rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                      <span>Monthly Spending vs Goal</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        Past 6 Months
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Emerald: &lt;80% • Amber: 80-100% • Rose: Over Budget
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveTab("analytics")}
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <span>Full Analytics</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {analyticsData?.monthsData ? (
                  <MonthlyGoalBarChart
                    data={analyticsData.monthsData}
                    monthlyGoal={budgetStats.monthlyGoal}
                    currency={group.currency}
                  />
                ) : (
                  <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                    Loading bar graph...
                  </div>
                )}
              </div>

              {/* Right col: Upcoming recurring bill quick pill */}
              <div className="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-1.5 mb-2">
                    <Repeat className="w-4 h-4 text-purple-600" />
                    <span>Household Utilities</span>
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Upcoming bills due this month.
                  </p>

                  <div className="space-y-3">
                    {recurringExpenses.slice(0, 3).map((bill: any) => (
                      <div
                        key={bill.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                            {bill.description}
                          </span>
                          <span className="font-extrabold text-slate-900 dark:text-white tabular-nums">
                            {formatCurrency(bill.amount, group.currency)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                          <span>{bill.recurringInterval}</span>
                          <button
                            onClick={() => handleLogRecurringBill(bill)}
                            className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                          >
                            Log Bill
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab("recurring")}
                  className="mt-4 w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                >
                  View All Recurring Bills ({recurringExpenses.length})
                </button>
              </div>
            </div>

            {/* Recent Expenses Activity Feed */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                  Recent Expenses
                </h3>
                <button
                  onClick={() => setActiveTab("expenses")}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <span>View All & Filter</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <ActivityFeed
                expenses={expenses.slice(0, 6)}
                settlements={settlements.slice(0, 4)}
                currency={group.currency}
                currentUserId={currentUserId}
                onDeleteExpense={handleDeleteExpense}
                onAddComment={handleAddComment}
                onViewReceipt={(url, title) => setReceiptModal({ isOpen: true, url, title })}
              />
            </div>
          </div>
        )}

        {/* Tab 2: EXPENSES (Full filterable feed) */}
        {activeTab === "expenses" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                  All Group Expenses & Settlements
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Search by bill title, person, or category. Add comments to discuss details.
                </p>
              </div>

              <button
                onClick={() => {
                  setRecurringPrefill(null);
                  setIsAddExpenseOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Expense</span>
              </button>
            </div>

            <ActivityFeed
              expenses={expenses}
              settlements={settlements}
              currency={group.currency}
              currentUserId={currentUserId}
              onDeleteExpense={handleDeleteExpense}
              onAddComment={handleAddComment}
              onViewReceipt={(url, title) => setReceiptModal({ isOpen: true, url, title })}
            />
          </div>
        )}

        {/* Tab 3: BALANCES & DEBTS */}
        {activeTab === "balances" && (
          <div className="space-y-6 animate-fade-in">
            <WhoOwesWhomCard
              debts={simplifiedTransactions}
              currency={group.currency}
              currentUserId={currentUserId}
              onSettleDebt={handleOpenSettleDebt}
            />

            {/* Complete Member Net Balance Ledger Table */}
            <div className="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Member Balances Ledger
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Formula: Net Balance = (Total Paid + Settlements Sent) - (Total Splits Assigned + Settlements Received)
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-3">Member</th>
                      <th className="py-3 px-3 text-right">Total Paid</th>
                      <th className="py-3 px-3 text-right">Total Share</th>
                      <th className="py-3 px-3 text-right">Settlements Sent</th>
                      <th className="py-3 px-3 text-right">Settlements Recv</th>
                      <th className="py-3 px-3 text-right">Net Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.memberBalances?.map((m: MemberBalanceInfo) => {
                      const isPos = m.netBalance > 0;
                      const isNeg = m.netBalance < 0;
                      return (
                        <tr key={m.userId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <UserAvatar name={m.name} size="xs" />
                              <div className="font-semibold text-slate-800 dark:text-slate-200">
                                {m.name}
                                {m.userId === currentUserId && (
                                  <span className="ml-1 text-[10px] text-emerald-600 font-bold">
                                    (You)
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-medium text-slate-700 dark:text-slate-300 tabular-nums">
                            {formatCurrency(m.totalPaid, group.currency)}
                          </td>
                          <td className="py-3 px-3 text-right font-medium text-slate-700 dark:text-slate-300 tabular-nums">
                            {formatCurrency(m.totalSplit, group.currency)}
                          </td>
                          <td className="py-3 px-3 text-right text-slate-500 tabular-nums">
                            {formatCurrency(m.settlementsSent, group.currency)}
                          </td>
                          <td className="py-3 px-3 text-right text-slate-500 tabular-nums">
                            {formatCurrency(m.settlementsReceived, group.currency)}
                          </td>
                          <td className="py-3 px-3 text-right font-bold tabular-nums">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs ${
                                isPos
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : isNeg
                                  ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                              }`}
                            >
                              {formatCurrency(m.netBalance, group.currency)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: RECURRING BILLS */}
        {activeTab === "recurring" && (
          <div className="animate-fade-in">
            <RecurringBillsTab
              recurringBills={recurringExpenses}
              currency={group.currency}
              onLogRecurringBill={handleLogRecurringBill}
              onOpenAddExpense={() => {
                setRecurringPrefill({ isRecurring: true });
                setIsAddExpenseOpen(true);
              }}
            />
          </div>
        )}

        {/* Tab 5: ANALYTICS & EXPORT */}
        {activeTab === "analytics" && (
          <div className="space-y-6 animate-fade-in">
            {/* Header with Export to CSV Button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                  Spending Analytics & Trends
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Track 6-month budget adherence, category distributions, and export data.
                </p>
              </div>

              <a
                href={`/api/groups/${groupId}/export`}
                download
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Export to CSV</span>
              </a>
            </div>

            {/* Over-budget alert reminder in analytics tab */}
            {budgetStats?.isOverBudget && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    Current month spending exceeds monthly goal by{" "}
                    <strong>{formatCurrency(budgetStats.overBudgetAmount, group.currency)}</strong>.
                  </span>
                </div>
                <button
                  onClick={() => setIsEditGoalOpen(true)}
                  className="font-bold underline text-rose-700 dark:text-rose-300"
                >
                  Edit Goal
                </button>
              </div>
            )}

            {/* Monthly Expenses vs Goal Bar Graph */}
            <div className="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">
                    Monthly Expenses vs. Goal
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Comparing total group spend across the last 6 months against the dashed budget line.
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> &lt;80% Goal
                  </span>
                  <span className="flex items-center gap-1 text-amber-600 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> 80-100%
                  </span>
                  <span className="flex items-center gap-1 text-rose-600 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Over Budget
                  </span>
                </div>
              </div>

              {analyticsData?.monthsData ? (
                <MonthlyGoalBarChart
                  data={analyticsData.monthsData}
                  monthlyGoal={budgetStats.monthlyGoal}
                  currency={group.currency}
                />
              ) : (
                <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                  Loading chart...
                </div>
              )}
            </div>

            {/* Category Donut Breakdown Chart */}
            <div className="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-4">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                  Category-Wise Spending Breakdown
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Distribution of expenses across household food, rent, travel, and utilities.
                </p>
              </div>

              {analyticsData?.categoryBreakdown ? (
                <CategoryDonutChart
                  data={analyticsData.categoryBreakdown}
                  currency={group.currency}
                />
              ) : (
                <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                  Loading breakdown...
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Button (+ Add Expense) */}
      <div className="fixed bottom-20 md:bottom-8 right-6 z-30">
        <button
          onClick={() => {
            setRecurringPrefill(null);
            setIsAddExpenseOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-3.5 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>Add Expense</span>
          <kbd className="hidden lg:inline-block ml-1 text-[10px] bg-emerald-700/80 text-emerald-100 px-1.5 py-0.5 rounded font-mono font-normal">
            N
          </kbd>
        </button>
      </div>

      {/* Modals */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => {
          setIsAddExpenseOpen(false);
          setRecurringPrefill(null);
        }}
        groupId={groupId}
        currency={group.currency}
        members={members}
        currentUserId={currentUserId}
        initialData={recurringPrefill}
        onExpenseAdded={() => {
          fetchGroupDetails();
          fetchAnalytics();
        }}
      />

      {selectedDebtToSettle && (
        <SettleUpModal
          isOpen={isSettleModalOpen}
          onClose={() => {
            setIsSettleModalOpen(false);
            setSelectedDebtToSettle(null);
          }}
          groupId={groupId}
          currency={group.currency}
          fromUser={{
            id: selectedDebtToSettle.fromUserId,
            name: selectedDebtToSettle.fromUserName,
          }}
          toUser={{
            id: selectedDebtToSettle.toUserId,
            name: selectedDebtToSettle.toUserName,
            upiId: selectedDebtToSettle.toUserUpi,
          }}
          suggestedAmount={selectedDebtToSettle.amount}
          onSettlementCompleted={() => {
            fetchGroupDetails();
            fetchAnalytics();
          }}
        />
      )}

      <EditGoalModal
        isOpen={isEditGoalOpen}
        onClose={() => setIsEditGoalOpen(false)}
        groupId={groupId}
        currentGoal={budgetStats.monthlyGoal}
        currency={group.currency}
        onGoalUpdated={() => {
          fetchGroupDetails();
          fetchAnalytics();
        }}
      />

      <ReceiptViewerModal
        isOpen={receiptModal.isOpen}
        onClose={() => setReceiptModal({ isOpen: false, url: "", title: "" })}
        imageUrl={receiptModal.url}
        title={receiptModal.title}
      />

      <MobileBottomNav
        onOpenAddExpense={() => {
          setRecurringPrefill(null);
          setIsAddExpenseOpen(true);
        }}
        currentGroupId={groupId}
      />
    </div>
  );
}
