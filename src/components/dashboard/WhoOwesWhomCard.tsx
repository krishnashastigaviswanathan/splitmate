"use client";

import React from "react";
import { ArrowRight, QrCode, CheckCircle, ShieldCheck } from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { formatCurrency } from "@/lib/formatters";
import { SimplifiedDebt } from "@/lib/debtSimplification";

interface WhoOwesWhomCardProps {
  debts: SimplifiedDebt[];
  currency?: string;
  currentUserId?: string;
  onSettleDebt: (debt: SimplifiedDebt) => void;
}

export function WhoOwesWhomCard({
  debts,
  currency = "INR",
  currentUserId,
  onSettleDebt,
}: WhoOwesWhomCardProps) {
  if (!debts || debts.length === 0) {
    return (
      <div className="rounded-2xl p-6 bg-white dark:bg-slate-900 shadow-sm border border-slate-200/60 dark:border-slate-800 text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 mb-3">
          <CheckCircle className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-800 dark:text-slate-100">All Settled Up!</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          There are no pending debts in this group. All shared expenses are completely balanced.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-6 bg-white dark:bg-slate-900 shadow-sm border border-slate-200/60 dark:border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg flex items-center gap-2">
            <span>Who Owes Whom</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              Greedy Optimized
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Debts simplified to the minimum possible number of payment transfers.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {debts.map((debt, idx) => {
          const isUserDebtor = debt.fromUserId === currentUserId;
          const isUserCreditor = debt.toUserId === currentUserId;

          return (
            <div
              key={`${debt.fromUserId}-${debt.toUserId}-${idx}`}
              className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition-all ${
                isUserDebtor
                  ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50"
                  : isUserCreditor
                  ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50"
                  : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800"
              }`}
            >
              {/* Left: From User -> Arrow -> To User */}
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <UserAvatar name={debt.fromUserName} size="sm" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {debt.fromUserName}
                    {isUserDebtor && (
                      <span className="ml-1 text-[10px] text-rose-600 dark:text-rose-400 font-bold">
                        (You)
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-slate-400">
                  <span className="text-xs">owes</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                </div>

                <div className="flex items-center gap-1.5">
                  <UserAvatar name={debt.toUserName} size="sm" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {debt.toUserName}
                    {isUserCreditor && (
                      <span className="ml-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                        (You)
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Right: Amount & Settle Button */}
              <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                <div className="text-right">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white tabular-nums">
                    {formatCurrency(debt.amount, currency)}
                  </span>
                  {debt.toUserUpi && (
                    <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 truncate max-w-[130px]">
                      UPI: {debt.toUserUpi}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onSettleDebt(debt)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95 ${
                    isUserDebtor
                      ? "bg-rose-600 hover:bg-rose-700 text-white"
                      : "bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900"
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Settle Up</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
