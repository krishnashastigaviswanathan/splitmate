"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  Repeat,
  AlertCircle,
  CheckCircle,
  FileText,
  Users,
} from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { formatCurrency, getCurrencySymbol, toSmallestUnit } from "@/lib/formatters";
import {
  calculateEqualSplits,
  calculateExactSplits,
  calculatePercentageSplits,
  calculateItemizedSplits,
  ItemizedLineItem,
  SplitResult,
} from "@/lib/splitCalculations";
import { useToast } from "@/components/ui/Toast";

interface GroupMember {
  id: string;
  name: string;
  email: string;
}

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  currency?: string;
  members: GroupMember[];
  currentUserId?: string;
  onExpenseAdded: (data: any) => void;
  initialData?: {
    description?: string;
    amount?: number;
    category?: string;
    isRecurring?: boolean;
    recurringInterval?: string;
  };
}

export function AddExpenseModal({
  isOpen,
  onClose,
  groupId,
  currency = "INR",
  members,
  currentUserId,
  onExpenseAdded,
  initialData,
}: AddExpenseModalProps) {
  const { toast, warning, success } = useToast();
  const symbol = getCurrencySymbol(currency);

  const [description, setDescription] = useState(initialData?.description || "");
  const [amountStr, setAmountStr] = useState(
    initialData?.amount ? (initialData.amount / 100).toString() : ""
  );
  const [category, setCategory] = useState(initialData?.category || "Groceries");
  const [paidById, setPaidById] = useState(currentUserId || members[0]?.id || "");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [receiptUrl, setReceiptUrl] = useState("");

  // Recurring options
  const [isRecurring, setIsRecurring] = useState(initialData?.isRecurring || false);
  const [recurringInterval, setRecurringInterval] = useState(initialData?.recurringInterval || "MONTHLY");
  const [nextDueDate, setNextDueDate] = useState("");

  // Split tabs: EQUAL, EXACT, PERCENTAGE, ITEMIZED
  const [splitMode, setSplitMode] = useState<"EQUAL" | "EXACT" | "PERCENTAGE" | "ITEMIZED">("EQUAL");

  // 1. Equal mode state: which members are checked
  const [equalSelectedUsers, setEqualSelectedUsers] = useState<string[]>(
    members.map((m) => m.id)
  );

  // 2. Exact mode state: custom amount per person
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});

  // 3. Percentage mode state: percentage per person
  const [percentages, setPercentages] = useState<Record<string, string>>({});

  // 4. Itemized mode state
  const [lineItems, setLineItems] = useState<ItemizedLineItem[]>([
    { id: "item-1", name: "Dish / Grocery Item 1", price: 0, assignedUserIds: members.map((m) => m.id) },
  ]);
  const [sharedFeeStr, setSharedFeeStr] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update defaults when members or initialData change
  useEffect(() => {
    if (members.length > 0) {
      if (!paidById) setPaidById(currentUserId || members[0].id);
      setEqualSelectedUsers(members.map((m) => m.id));

      // Prefill equal percentages
      const equalPct = (100 / members.length).toFixed(1);
      const pctMap: Record<string, string> = {};
      members.forEach((m) => {
        pctMap[m.id] = equalPct;
      });
      setPercentages(pctMap);
    }
  }, [members, currentUserId]);

  if (!isOpen) return null;

  const totalAmountPaise = toSmallestUnit(amountStr);

  // Compute splits & remaining amount to allocate based on splitMode
  let splits: SplitResult[] = [];
  let remainingPaise = 0;
  let isValid = false;

  if (splitMode === "EQUAL") {
    splits = calculateEqualSplits(totalAmountPaise, equalSelectedUsers);
    remainingPaise = totalAmountPaise - splits.reduce((sum, s) => sum + s.amount, 0);
    isValid = totalAmountPaise > 0 && equalSelectedUsers.length > 0 && remainingPaise === 0;
  } else if (splitMode === "EXACT") {
    const numericAmounts: Record<string, number> = {};
    for (const [uid, val] of Object.entries(exactAmounts)) {
      numericAmounts[uid] = toSmallestUnit(val);
    }
    const result = calculateExactSplits(totalAmountPaise, numericAmounts);
    splits = result.splits;
    remainingPaise = result.remaining;
    isValid = result.isValid && totalAmountPaise > 0;
  } else if (splitMode === "PERCENTAGE") {
    const numericPct: Record<string, number> = {};
    for (const [uid, val] of Object.entries(percentages)) {
      numericPct[uid] = parseFloat(val) || 0;
    }
    const result = calculatePercentageSplits(totalAmountPaise, numericPct);
    splits = result.splits;
    remainingPaise = result.remaining;
    isValid = result.isValid && totalAmountPaise > 0;
  } else if (splitMode === "ITEMIZED") {
    const sharedFeePaise = toSmallestUnit(sharedFeeStr);
    const result = calculateItemizedSplits(
      lineItems,
      sharedFeePaise,
      members.map((m) => m.id)
    );
    splits = result.splits;
    remainingPaise = totalAmountPaise - result.grandTotal;
    isValid = Math.abs(remainingPaise) === 0 && result.grandTotal > 0;
  }

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      toast({ type: "error", message: "Please enter a description for the expense" });
      return;
    }

    if (totalAmountPaise <= 0) {
      toast({ type: "error", message: "Expense amount must be greater than zero" });
      return;
    }

    if (remainingPaise !== 0) {
      toast({
        type: "error",
        message: `Splits do not equal total amount! Remaining to allocate: ${formatCurrency(remainingPaise, currency)}`,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          amount: totalAmountPaise,
          category,
          splitType: splitMode,
          receiptUrl: receiptUrl.trim() || null,
          isRecurring,
          recurringInterval: isRecurring ? recurringInterval : null,
          nextDueDate: isRecurring && nextDueDate ? nextDueDate : null,
          groupId,
          paidById,
          expenseDate,
          splits: splits.map((s) => ({ userId: s.userId, amount: s.amount })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to log expense");
      }

      // Check if newly logged expense triggered over-budget alert!
      if (data.overBudgetWarning?.triggered) {
        warning(
          data.overBudgetWarning.message,
          "⚠️ Monthly Budget Alert"
        );
      } else {
        success(`Logged "${description}" (${formatCurrency(totalAmountPaise, currency)})`);
      }

      onExpenseAdded(data.expense);
      onClose();
    } catch (err: any) {
      toast({ type: "error", message: err.message || "Failed to log expense" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    "Rent & Utilities",
    "Groceries",
    "Food & Dining",
    "Travel",
    "Entertainment",
    "Other",
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-fade-in my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">Add New Expense</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Log and split shared household spending with zero rounding errors.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Top row: Description & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Description
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Blinkit Groceries, Wi-Fi, Swiggy Dinner"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Total Amount ({symbol})
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                  {symbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl text-sm font-semibold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Category badges */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    category === cat
                      ? "bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-sm ring-2 ring-emerald-500/30"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Paid By & Date row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Paid By
              </label>
              <div className="grid grid-cols-2 gap-2">
                {members.map((m) => {
                  const isSelected = paidById === m.id;
                  return (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => setPaidById(m.id)}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-medium transition-all ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 ring-1 ring-emerald-500"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <UserAvatar name={m.name} size="xs" />
                      <span className="truncate">{m.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Expense Date
              </label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />

              <div className="pt-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Optional Receipt Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={receiptUrl}
                  onChange={(e) => setReceiptUrl(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Recurring bill toggle */}
          <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Mark as Recurring Household Bill
                </span>
              </div>
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
            </div>

            {isRecurring && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <div>
                  <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Frequency
                  </label>
                  <select
                    value={recurringInterval}
                    onChange={(e) => setRecurringInterval(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="WEEKLY">Weekly</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Next Due Date
                  </label>
                  <input
                    type="date"
                    value={nextDueDate}
                    onChange={(e) => setNextDueDate(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 4 Split Modes Interactive Tabs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Split Mode
              </label>

              {/* Live Remaining to Allocate Badge */}
              <div
                className={`text-xs px-2.5 py-1 rounded-full font-bold tabular-nums flex items-center gap-1 ${
                  isValid
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 animate-pulse"
                }`}
              >
                {isValid ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Balanced (100%)</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>
                      Remaining: {formatCurrency(remainingPaise, currency)}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Split Mode Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
              {(["EQUAL", "EXACT", "PERCENTAGE", "ITEMIZED"] as const).map((mode) => (
                <button
                  type="button"
                  key={mode}
                  onClick={() => setSplitMode(mode)}
                  className={`py-2 rounded-xl transition-all ${
                    splitMode === mode
                      ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Split Mode Content */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
              {/* 1. EQUAL SPLIT */}
              {splitMode === "EQUAL" && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    Splits total amount equally among selected members. Extra paise distributed evenly.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {members.map((m) => {
                      const isChecked = equalSelectedUsers.includes(m.id);
                      const userSplit = splits.find((s) => s.userId === m.id);
                      return (
                        <div
                          key={m.id}
                          onClick={() => {
                            if (isChecked) {
                              setEqualSelectedUsers(equalSelectedUsers.filter((id) => id !== m.id));
                            } else {
                              setEqualSelectedUsers([...equalSelectedUsers, m.id]);
                            }
                          }}
                          className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                            isChecked
                              ? "bg-white dark:bg-slate-800 border-emerald-500/50 shadow-sm"
                              : "bg-slate-100/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="w-4 h-4 text-emerald-600 rounded"
                            />
                            <UserAvatar name={m.name} size="xs" showName />
                          </div>
                          {isChecked && userSplit && (
                            <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                              {formatCurrency(userSplit.amount, currency)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. EXACT SPLIT */}
              {splitMode === "EXACT" && (
                <div className="space-y-2.5">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    Enter exact currency amounts for each roommate.
                  </p>
                  <div className="space-y-2">
                    {members.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between gap-3 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      >
                        <UserAvatar name={m.name} size="xs" showName />
                        <div className="flex items-center gap-1.5 w-36">
                          <span className="text-xs text-slate-400 font-bold">{symbol}</span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={exactAmounts[m.id] || ""}
                            onChange={(e) =>
                              setExactAmounts((prev) => ({ ...prev, [m.id]: e.target.value }))
                            }
                            className="w-full px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 tabular-nums focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. PERCENTAGE SPLIT */}
              {splitMode === "PERCENTAGE" && (
                <div className="space-y-2.5">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    Assign percentage shares. Must sum strictly to 100%.
                  </p>
                  <div className="space-y-2">
                    {members.map((m) => {
                      const userSplit = splits.find((s) => s.userId === m.id);
                      return (
                        <div
                          key={m.id}
                          className="flex items-center justify-between gap-3 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        >
                          <UserAvatar name={m.name} size="xs" showName />
                          <div className="flex items-center gap-3">
                            {userSplit && (
                              <span className="text-xs font-medium text-slate-500 tabular-nums">
                                {formatCurrency(userSplit.amount, currency)}
                              </span>
                            )}
                            <div className="flex items-center gap-1 w-24">
                              <input
                                type="number"
                                step="0.5"
                                placeholder="0"
                                value={percentages[m.id] || ""}
                                onChange={(e) =>
                                  setPercentages((prev) => ({ ...prev, [m.id]: e.target.value }))
                                }
                                className="w-full px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 tabular-nums text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                              <span className="text-xs text-slate-400 font-bold">%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. ITEMIZED SPLIT */}
              {splitMode === "ITEMIZED" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Add dishes/items & assign to consumers. Taxes & delivery split proportionally.
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setLineItems((prev) => [
                          ...prev,
                          {
                            id: `item-${Date.now()}`,
                            name: `Item ${prev.length + 1}`,
                            price: 0,
                            assignedUserIds: members.map((m) => m.id),
                          },
                        ])
                      }
                      className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Item
                    </button>
                  </div>

                  <div className="space-y-2">
                    {lineItems.map((item, index) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Dish / item name"
                            value={item.name}
                            onChange={(e) => {
                              const updated = [...lineItems];
                              updated[index].name = e.target.value;
                              setLineItems(updated);
                            }}
                            className="flex-1 px-2.5 py-1 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                          />
                          <div className="flex items-center gap-1 w-28">
                            <span className="text-xs text-slate-400 font-bold">{symbol}</span>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={item.price ? (item.price / 100).toString() : ""}
                              onChange={(e) => {
                                const updated = [...lineItems];
                                updated[index].price = toSmallestUnit(e.target.value);
                                setLineItems(updated);
                              }}
                              className="w-full px-2 py-1 text-xs font-semibold rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 tabular-nums"
                            />
                          </div>
                          {lineItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setLineItems(lineItems.filter((_, i) => i !== index))
                              }
                              className="text-slate-400 hover:text-rose-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Assign members checkboxes */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">
                            Eaten by:
                          </span>
                          {members.map((m) => {
                            const isAssigned = item.assignedUserIds.includes(m.id);
                            return (
                              <button
                                type="button"
                                key={m.id}
                                onClick={() => {
                                  const updated = [...lineItems];
                                  if (isAssigned) {
                                    updated[index].assignedUserIds = item.assignedUserIds.filter(
                                      (id) => id !== m.id
                                    );
                                  } else {
                                    updated[index].assignedUserIds = [
                                      ...item.assignedUserIds,
                                      m.id,
                                    ];
                                  }
                                  setLineItems(updated);
                                }}
                                className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                                  isAssigned
                                    ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-400 text-emerald-800 dark:text-emerald-300 font-semibold"
                                    : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400"
                                }`}
                              >
                                {m.name.split(" ")[0]}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Shared tax & delivery fee */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/40">
                    <div>
                      <span className="text-xs font-semibold text-purple-900 dark:text-purple-200">
                        Shared Tax, Tip & Delivery Fee
                      </span>
                      <p className="text-[10px] text-purple-600 dark:text-purple-400">
                        Automatically distributed proportional to each person&apos;s food subtotal.
                      </p>
                    </div>
                    <div className="flex items-center gap-1 w-28">
                      <span className="text-xs text-purple-400 font-bold">{symbol}</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={sharedFeeStr}
                        onChange={(e) => setSharedFeeStr(e.target.value)}
                        className="w-full px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-700 tabular-nums"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit & Cancel Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-md shadow-emerald-600/30 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <span>Recording...</span>
              ) : (
                <>
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Save Expense</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
