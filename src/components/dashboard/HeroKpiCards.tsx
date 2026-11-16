"use client";

import React from "react";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  Edit2,
  Clock,
  CheckCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface HeroKpiCardsProps {
  userNetBalance: number; // in smallest unit
  currentMonthTotal: number; // in smallest unit
  monthlyGoal: number; // in smallest unit
  currency?: string;
  pendingSettlementCount?: number;
  topCategory?: { name: string; total: number; percentage: number };
  memberCount?: number;
  averagePerPersonMonthly?: number;
  onEditGoal?: () => void;
  onOpenSettleUp?: () => void;
}

export function HeroKpiCards({
  userNetBalance,
  currentMonthTotal,
  monthlyGoal,
  currency = "INR",
  pendingSettlementCount = 0,
  topCategory,
  memberCount = 4,
  averagePerPersonMonthly,
  onEditGoal,
  onOpenSettleUp,
}: HeroKpiCardsProps) {
  const isPositive = userNetBalance > 0;
  const isNegative = userNetBalance < 0;
  const isZero = userNetBalance === 0;

  // Budget calculations
  const goal = monthlyGoal || 0;
  const percentage = goal > 0 ? Math.round((currentMonthTotal / goal) * 100) : 0;
  const isOverBudget = goal > 0 && currentMonthTotal > goal;
  const isNearBudget = goal > 0 && currentMonthTotal >= goal * 0.8 && !isOverBudget;

  const progressBarWidth = Math.min(percentage, 100);

  // Per person monthly split calculation
  const perPersonSplit =
    averagePerPersonMonthly !== undefined
      ? averagePerPersonMonthly
      : Math.round(currentMonthTotal / Math.max(1, memberCount));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
      {/* 1. Your Net Balance Card (Eye-catching Gradient) */}
      <div
        className={`relative overflow-hidden rounded-2xl p-6 shadow-sm border transition-all duration-300 hover:-translate-y-0.5 ${
          isPositive
            ? "bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white border-emerald-500/40 shadow-emerald-500/10"
            : isNegative
            ? "bg-gradient-to-br from-rose-600 via-orange-600 to-rose-700 text-white border-rose-500/40 shadow-rose-500/10"
            : "bg-gradient-to-br from-slate-800 to-slate-900 text-white border-slate-700 shadow-slate-900/10"
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs uppercase tracking-wider font-semibold text-white/80">
            Your Net Balance
          </span>
          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-emerald-100" />
            ) : isNegative ? (
              <TrendingDown className="w-4 h-4 text-rose-100" />
            ) : (
              <CheckCircle className="w-4 h-4 text-slate-200" />
            )}
          </div>
        </div>

        <div className="text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums mb-2">
          {formatCurrency(userNetBalance, currency)}
        </div>

        <div className="text-xs sm:text-sm text-white/90 flex items-center justify-between">
          <span>
            {isPositive
              ? "You are owed money overall"
              : isNegative
              ? "You owe money to roommates"
              : "All settled up! Zero debt"}
          </span>
          {onOpenSettleUp && isNegative && (
            <button
              onClick={onOpenSettleUp}
              className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-xs font-semibold backdrop-blur-sm transition-colors"
            >
              Settle Now
            </button>
          )}
        </div>
      </div>

      {/* 2. Monthly Budget Pulse Card (Animated Horizontal Progress Bar) */}
      <div className="rounded-2xl p-6 bg-white dark:bg-slate-900 shadow-sm border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between hover:-translate-y-0.5 transition-all">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-emerald-500" /> Monthly Budget Pulse
            </span>
            {onEditGoal && (
              <button
                onClick={onEditGoal}
                className="text-xs text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 font-medium transition-colors"
                title="Edit Budget Goal"
              >
                <Edit2 className="w-3 h-3" />
                <span>Goal</span>
              </button>
            )}
          </div>

          <div className="flex items-baseline justify-between mb-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
              {formatCurrency(currentMonthTotal, currency, false)}
            </span>
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500 tabular-nums">
              {goal > 0 ? `of ${formatCurrency(goal, currency, false)}` : "No goal set"}
            </span>
          </div>

          {/* Split Per Person Monthly Display */}
          <div className="mb-2.5 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
              <span className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                👥
              </span>
              <span>Split Per Person:</span>
            </div>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
              ≈ {formatCurrency(perPersonSplit, currency, false)} / person
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden relative mb-2">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                isOverBudget
                  ? "bg-rose-500"
                  : isNearBudget
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              }`}
              style={{ width: `${progressBarWidth}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          <span
            className={`font-semibold flex items-center gap-1 ${
              isOverBudget
                ? "text-rose-600 dark:text-rose-400"
                : isNearBudget
                ? "text-amber-600 dark:text-amber-400"
                : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {isOverBudget ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Over budget by {formatCurrency(currentMonthTotal - goal, currency, false)}</span>
              </>
            ) : goal > 0 ? (
              <span>{100 - percentage}% budget remaining</span>
            ) : (
              <span className="text-slate-400">Set a monthly limit</span>
            )}
          </span>
          <span className="text-slate-400 dark:text-slate-500 font-medium tabular-nums">
            {percentage}%
          </span>
        </div>
      </div>

      {/* 3. Quick Settle / Group Activity Card */}
      <div className="rounded-2xl p-6 bg-white dark:bg-slate-900 shadow-sm border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between hover:-translate-y-0.5 transition-all">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-500" /> Pending Settlements
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
              {pendingSettlementCount} active
            </span>
          </div>

          <div className="mt-1">
            {pendingSettlementCount > 0 ? (
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {pendingSettlementCount} debt {pendingSettlementCount === 1 ? "stream" : "streams"} waiting to be settled.
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Simplified via greedy algorithm to minimize transactions.
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  No debts currently outstanding!
                </p>
                {topCategory && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Top category this month: <strong className="text-slate-700 dark:text-slate-200">{topCategory.name}</strong> ({topCategory.percentage}%)
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="pt-3">
          {onOpenSettleUp ? (
            <button
              onClick={onOpenSettleUp}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold transition-colors"
            >
              <span>Instant UPI Settle-Up</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Real-time debt ledger updated</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
