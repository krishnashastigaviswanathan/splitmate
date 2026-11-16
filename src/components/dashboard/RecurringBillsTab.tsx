"use client";

import React from "react";
import { Calendar, Repeat, ArrowUpRight, CheckCircle2, Clock } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { UserAvatar } from "@/components/ui/UserAvatar";

interface RecurringExpense {
  id: string;
  description: string;
  amount: number;
  category: string;
  recurringInterval?: string | null;
  nextDueDate?: string | Date | null;
  paidBy: { id: string; name: string };
  splits: Array<{ userId: string; amount: number; user: { name: string } }>;
}

interface RecurringBillsTabProps {
  recurringBills: RecurringExpense[];
  currency?: string;
  onLogRecurringBill: (bill: RecurringExpense) => void;
  onOpenAddExpense: () => void;
}

export function RecurringBillsTab({
  recurringBills,
  currency = "INR",
  onLogRecurringBill,
  onOpenAddExpense,
}: RecurringBillsTabProps) {
  // Compute countdown pill info
  const getDueStatus = (dateInput?: string | Date | null) => {
    if (!dateInput) return { text: "No date set", color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" };
    const due = new Date(dateInput);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        text: `Overdue by ${Math.abs(diffDays)}d`,
        color: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-bold animate-pulse",
      };
    }
    if (diffDays === 0) {
      return {
        text: "Due Today",
        color: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold",
      };
    }
    if (diffDays === 1) {
      return {
        text: "Due Tomorrow",
        color: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
      };
    }
    return {
      text: `Due in ${diffDays} days`,
      color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
    };
  };

  if (!recurringBills || recurringBills.length === 0) {
    return (
      <div className="rounded-2xl p-8 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 mb-3">
          <Repeat className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-900 dark:text-white text-base">No Recurring Bills Yet</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          Add regular household expenses like Rent, Wi-Fi, Cook/Maid salary, or electricity with auto-reminders.
        </p>
        <button
          onClick={onOpenAddExpense}
          className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all"
        >
          Create Recurring Bill
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Upcoming Household Bills</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {recurringBills.length} Active
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Never miss household utilities with quick one-click logging.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recurringBills.map((bill) => {
          const dueStatus = getDueStatus(bill.nextDueDate);

          return (
            <div
              key={bill.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-4 hover:-translate-y-0.5 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CategoryBadge category={bill.category} size="sm" />
                    <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 flex items-center gap-1">
                      <Repeat className="w-3 h-3" />
                      {bill.recurringInterval || "MONTHLY"}
                    </span>
                  </div>

                  {/* Countdown pill */}
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${dueStatus.color}`}>
                    {dueStatus.text}
                  </span>
                </div>

                <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  {bill.description}
                </h4>

                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                    {formatCurrency(bill.amount, currency)}
                  </span>
                  <span className="text-xs text-slate-400">
                    / {bill.recurringInterval?.toLowerCase() || "month"}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>Usually paid by</span>
                  <UserAvatar name={bill.paidBy.name} size="xs" showName />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {bill.nextDueDate ? formatDate(bill.nextDueDate) : "Next cycle"}
                </span>

                <button
                  onClick={() => onLogRecurringBill(bill)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Log This Month's Bill</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
