"use client";

import React, { useState } from "react";
import {
  Search,
  MessageSquare,
  Paperclip,
  Trash2,
  Send,
  ChevronDown,
  ChevronUp,
  Receipt,
  CheckCircle,
} from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { formatCurrency, formatDate } from "@/lib/formatters";

interface ExpenseSplit {
  id: string;
  userId: string;
  amount: number;
  user: { id: string; name: string };
}

interface ExpenseComment {
  id: string;
  userId: string;
  content: string;
  createdAt: string | Date;
  user: { id: string; name: string };
}

interface ExpenseItem {
  id: string;
  description: string;
  amount: number;
  category: string;
  splitType: string;
  receiptUrl?: string | null;
  isRecurring: boolean;
  expenseDate: string | Date;
  paidBy: { id: string; name: string };
  splits: ExpenseSplit[];
  comments: ExpenseComment[];
}

interface SettlementItem {
  id: string;
  amount: number;
  note?: string | null;
  createdAt: string | Date;
  fromUser: { id: string; name: string };
  toUser: { id: string; name: string };
}

interface ActivityFeedProps {
  expenses: ExpenseItem[];
  settlements: SettlementItem[];
  currency?: string;
  currentUserId?: string;
  onDeleteExpense?: (expenseId: string) => Promise<void>;
  onAddComment?: (expenseId: string, content: string) => Promise<void>;
  onViewReceipt?: (url: string, title: string) => void;
}

export function ActivityFeed({
  expenses,
  settlements,
  currency = "INR",
  currentUserId,
  onDeleteExpense,
  onAddComment,
  onViewReceipt,
}: ActivityFeedProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [isSubmittingComment, setIsSubmittingComment] = useState<Record<string, boolean>>({});

  const categories = [
    "ALL",
    "Rent & Utilities",
    "Groceries",
    "Food & Dining",
    "Travel",
    "Entertainment",
    "Other",
  ];

  // Combine and sort expenses + settlements chronologically
  const feedItems = [
    ...expenses.map((e) => ({ type: "expense" as const, date: new Date(e.expenseDate), data: e })),
    ...settlements.map((s) => ({ type: "settlement" as const, date: new Date(s.createdAt), data: s })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  // Filter
  const filteredItems = feedItems.filter((item) => {
    if (item.type === "expense") {
      const exp = item.data as ExpenseItem;
      const matchesCat = selectedCategory === "ALL" || exp.category === selectedCategory;
      const matchesSearch =
        !search.trim() ||
        exp.description.toLowerCase().includes(search.toLowerCase()) ||
        exp.paidBy.name.toLowerCase().includes(search.toLowerCase());
      return matchesCat && matchesSearch;
    } else {
      if (selectedCategory !== "ALL") return false;
      const st = item.data as SettlementItem;
      const matchesSearch =
        !search.trim() ||
        st.fromUser.name.toLowerCase().includes(search.toLowerCase()) ||
        st.toUser.name.toLowerCase().includes(search.toLowerCase()) ||
        (st.note && st.note.toLowerCase().includes(search.toLowerCase()));
      return matchesSearch;
    }
  });

  const toggleComments = (expenseId: string) => {
    setExpandedComments((prev) => ({
      ...prev,
      [expenseId]: !prev[expenseId],
    }));
  };

  const handleCommentSubmit = async (expenseId: string) => {
    const text = commentInputs[expenseId]?.trim();
    if (!text || !onAddComment) return;

    setIsSubmittingComment((prev) => ({ ...prev, [expenseId]: true }));
    try {
      await onAddComment(expenseId, text);
      setCommentInputs((prev) => ({ ...prev, [expenseId]: "" }));
    } finally {
      setIsSubmittingComment((prev) => ({ ...prev, [expenseId]: false }));
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search bills, people, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>

        {/* Category Filter Pills (scrollable on mobile) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? "bg-slate-900 text-white dark:bg-emerald-600 dark:text-white font-semibold"
                  : "bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Feed list */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-slate-400">
          <p className="text-sm font-medium">No activity matches your filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            if (item.type === "settlement") {
              const st = item.data as SettlementItem;
              return (
                <div
                  key={`settlement-${st.id}`}
                  className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        <span className="font-bold">{st.fromUser.name}</span> paid{" "}
                        <span className="font-bold">{st.toUser.name}</span>
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{formatDate(st.createdAt)}</span>
                        {st.note && <span>• &ldquo;{st.note}&rdquo;</span>}
                      </p>
                    </div>
                  </div>

                  <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    +{formatCurrency(st.amount, currency)}
                  </div>
                </div>
              );
            }

            // Expense Item
            const exp = item.data as ExpenseItem;
            const isPayer = exp.paidBy.id === currentUserId;
            const userSplit = exp.splits.find((s) => s.userId === currentUserId);
            const isCommentsOpen = !!expandedComments[exp.id];
            const commentCount = exp.comments?.length || 0;

            return (
              <div
                key={`expense-${exp.id}`}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-sm transition-all hover:border-slate-300 dark:hover:border-slate-700"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  {/* Left: Category Badge & Details */}
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-0.5">
                      <CategoryBadge category={exp.category} size="md" />
                    </div>

                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                        {exp.description}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                        <span>{formatDate(exp.expenseDate)}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <span>Paid by</span>
                          <UserAvatar name={exp.paidBy.name} size="xs" showName />
                        </div>
                        <span>•</span>
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                          {exp.splitType} Split ({exp.splits.length} members)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Total Amount & Your Share */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    <div className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tabular-nums">
                      {formatCurrency(exp.amount, currency)}
                    </div>
                    {userSplit ? (
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Your share:{" "}
                        <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                          {formatCurrency(userSplit.amount, currency)}
                        </span>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic">Not in this split</div>
                    )}
                  </div>
                </div>

                {/* Footer Controls: Comments toggle, Receipt, Delete */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleComments(exp.id)}
                      className="flex items-center gap-1 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>
                        {commentCount} {commentCount === 1 ? "comment" : "comments"}
                      </span>
                      {isCommentsOpen ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {exp.receiptUrl && (
                      <button
                        onClick={() => onViewReceipt && onViewReceipt(exp.receiptUrl!, exp.description)}
                        className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>View Receipt</span>
                      </button>
                    )}
                  </div>

                  {onDeleteExpense && (
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete "${exp.description}"?`)) {
                          onDeleteExpense(exp.id);
                        }
                      }}
                      className="text-slate-400 hover:text-rose-600 transition-colors"
                      title="Delete expense"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Expandable Comment Thread */}
                {isCommentsOpen && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5 animate-fade-in">
                    {exp.comments && exp.comments.length > 0 ? (
                      <div className="space-y-2">
                        {exp.comments.map((c) => (
                          <div
                            key={c.id}
                            className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs"
                          >
                            <UserAvatar name={c.user.name} size="xs" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {c.user.name}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {formatDate(c.createdAt)}
                                </span>
                              </div>
                              <p className="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                                {c.content}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No comments yet. Start a discussion!</p>
                    )}

                    {/* New Comment Input */}
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="text"
                        placeholder="Add a comment or note..."
                        value={commentInputs[exp.id] || ""}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({ ...prev, [exp.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleCommentSubmit(exp.id);
                          }
                        }}
                        className="flex-1 px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <button
                        onClick={() => handleCommentSubmit(exp.id)}
                        disabled={isSubmittingComment[exp.id] || !commentInputs[exp.id]?.trim()}
                        className="p-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
