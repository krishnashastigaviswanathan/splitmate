"use client";

import React, { useState } from "react";
import { X, Target, Save } from "lucide-react";
import { formatCurrency, getCurrencySymbol, toSmallestUnit } from "@/lib/formatters";
import { useToast } from "@/components/ui/Toast";

interface EditGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  currentGoal: number; // in smallest unit
  currency?: string;
  onGoalUpdated: (newGoal: number) => void;
}

export function EditGoalModal({
  isOpen,
  onClose,
  groupId,
  currentGoal,
  currency = "INR",
  onGoalUpdated,
}: EditGoalModalProps) {
  const { toast, success } = useToast();
  const symbol = getCurrencySymbol(currency);
  const [goalStr, setGoalStr] = useState(
    currentGoal > 0 ? (currentGoal / 100).toString() : ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newGoalPaise = goalStr ? toSmallestUnit(goalStr) : null;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/goal`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlyGoal: newGoalPaise }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update monthly goal");
      }

      success(
        newGoalPaise
          ? `Updated monthly goal to ${formatCurrency(newGoalPaise, currency)}!`
          : "Monthly goal removed."
      );
      onGoalUpdated(newGoalPaise || 0);
      onClose();
    } catch (err: any) {
      toast({ type: "error", message: err.message || "Failed to update goal" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-fade-in p-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mb-3">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Monthly Expense Goal</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Set a monthly spending limit for this roommate group.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Budget Goal ({symbol}/month)
            </label>
            <div className="relative mt-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                {symbol}
              </span>
              <input
                type="number"
                step="100"
                placeholder="0"
                value={goalStr}
                onChange={(e) => setGoalStr(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-base font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Leave blank to disable budget tracking.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 transition-all flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? "Saving..." : "Save Goal"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
