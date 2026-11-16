"use client";

import React, { useState } from "react";
import { X, Sparkles, Plus, Target, Check } from "lucide-react";
import { toSmallestUnit } from "@/lib/formatters";
import { useToast } from "@/components/ui/Toast";

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (newGroup: any) => void;
}

const COMMON_EMOJIS = ["🏠", "🏖️", "🍕", "🚗", "✈️", "🎉", "🛋️", "⛺", "🚀", "💡"];
const CURRENCIES = [
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
];

export function CreateGroupModal({
  isOpen,
  onClose,
  onGroupCreated,
}: CreateGroupModalProps) {
  const { toast, success } = useToast();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🏠");
  const [currency, setCurrency] = useState("INR");
  const [monthlyGoalStr, setMonthlyGoalStr] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ type: "error", message: "Group name is required" });
      return;
    }

    setIsSubmitting(true);
    try {
      const monthlyGoalPaise = monthlyGoalStr ? toSmallestUnit(monthlyGoalStr) : null;
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          emoji,
          currency,
          monthlyGoal: monthlyGoalPaise,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create group");
      }

      success(`Group "${name}" created with invite code ${data.group.inviteCode}!`);
      onGroupCreated(data.group);
      onClose();
    } catch (err: any) {
      toast({ type: "error", message: err.message || "Failed to create group" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-fade-in p-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create New Group</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Set up an apartment, shared house, or trip to start splitting bills.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Emoji & Name row */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Group Cover Emoji & Name
            </label>
            <div className="flex items-center gap-2 mt-1">
              <div className="relative">
                <input
                  type="text"
                  maxLength={2}
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  className="w-12 h-11 text-center text-xl rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <input
                type="text"
                required
                placeholder="e.g. Apartment 4B, Goa Trip, Flat 102"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Quick emoji presets */}
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1">
              {COMMON_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                    emoji === e ? "bg-emerald-100 dark:bg-emerald-950/60 ring-1 ring-emerald-500" : ""
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Currency selection */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Group Currency
            </label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {CURRENCIES.map((c) => (
                <button
                  type="button"
                  key={c.code}
                  onClick={() => setCurrency(c.code)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    currency === c.code
                      ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 ring-1 ring-emerald-500"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <span>
                    <strong className="font-bold mr-1">{c.symbol}</strong> {c.name}
                  </span>
                  {currency === c.code && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
              ))}
            </div>
          </div>

          {/* Monthly Spending Goal */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-emerald-500" /> Optional Monthly Expense Goal
              </span>
              <span className="text-[11px] text-slate-400">Budget Limit</span>
            </label>
            <div className="relative mt-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                {CURRENCIES.find((c) => c.code === currency)?.symbol || "₹"}
              </span>
              <input
                type="number"
                step="100"
                placeholder="e.g. 30000"
                value={monthlyGoalStr}
                onChange={(e) => setMonthlyGoalStr(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Get visual warnings when spending nears 80% or exceeds this limit.
            </p>
          </div>

          {/* Buttons */}
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
              disabled={isSubmitting || !name.trim()}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? "Creating..." : "Create Group"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
