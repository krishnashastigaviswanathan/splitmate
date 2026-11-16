"use client";

import React, { useState } from "react";
import confetti from "canvas-confetti";
import { X, ArrowRight, QrCode, CheckCircle2, ExternalLink, Sparkles, AlertCircle } from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { formatCurrency, getCurrencySymbol, toSmallestUnit } from "@/lib/formatters";
import { useToast } from "@/components/ui/Toast";

interface SettleUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  currency?: string;
  fromUser: { id: string; name: string };
  toUser: { id: string; name: string; upiId?: string | null };
  suggestedAmount: number; // in smallest unit
  onSettlementCompleted: (data: any) => void;
}

export function SettleUpModal({
  isOpen,
  onClose,
  groupId,
  currency = "INR",
  fromUser,
  toUser,
  suggestedAmount,
  onSettlementCompleted,
}: SettleUpModalProps) {
  const { toast, success } = useToast();
  const symbol = getCurrencySymbol(currency);

  const [amountStr, setAmountStr] = useState((suggestedAmount / 100).toString());
  const [note, setNote] = useState("Settled up via UPI");
  const [showQr, setShowQr] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const amountPaise = toSmallestUnit(amountStr);
  const amountDecimal = (amountPaise / 100).toFixed(2);

  // Generate UPI Deep Link
  // format: upi://pay?pa=name@bank&pn=ReceiverName&am=250.00&cu=INR&tn=SharedHouseholdSettlement
  const upiId = toUser.upiId || "";
  const upiDeepLink = upiId
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
        toUser.name
      )}&am=${amountDecimal}&cu=${currency}&tn=${encodeURIComponent(
        `SplitMate: ${note || "Settlement"}`
      )}`
    : "";

  // QR Code URL using standard qrserver
  const qrCodeUrl = upiDeepLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(
        upiDeepLink
      )}`
    : "";

  const handleMarkAsPaid = async () => {
    if (amountPaise <= 0) {
      toast({ type: "error", message: "Amount must be greater than zero" });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          fromUserId: fromUser.id,
          toUserId: toUser.id,
          amount: amountPaise,
          note,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to record settlement");
      }

      // Celebratory Confetti!
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6"],
      });

      success(
        `Settled ${formatCurrency(amountPaise, currency)} between ${fromUser.name} and ${toUser.name}! 🎉`,
        "Payment Recorded"
      );

      onSettlementCompleted(data.settlement);
      onClose();
    } catch (err: any) {
      toast({ type: "error", message: err.message || "Failed to settle payment" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-fade-in p-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Settle Up Balance</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Record a debt settlement and pay instantly via UPI.
          </p>
        </div>

        {/* Transfer Visual: From -> To */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 mb-5">
          <div className="flex flex-col items-center gap-1.5 text-center flex-1">
            <UserAvatar name={fromUser.name} size="md" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[100px]">
              {fromUser.name}
            </span>
            <span className="text-[10px] text-slate-400">Payer</span>
          </div>

          <div className="flex flex-col items-center gap-1 px-3">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Pays
            </span>
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>

          <div className="flex flex-col items-center gap-1.5 text-center flex-1">
            <UserAvatar name={toUser.name} size="md" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[100px]">
              {toUser.name}
            </span>
            <span className="text-[10px] text-slate-400">Receiver</span>
          </div>
        </div>

        {/* Amount & Note Inputs */}
        <div className="space-y-4 mb-5">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Settlement Amount ({symbol})
            </label>
            <div className="relative mt-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                {symbol}
              </span>
              <input
                type="number"
                step="0.01"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-lg font-extrabold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Payment Note
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. GPay / PhonePe / Cash transfer"
              className="w-full mt-1 px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* UPI Payment Options if receiver has UPI ID */}
        {upiId ? (
          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-emerald-600" />
                Receiver&apos;s UPI ID
              </span>
              <span className="text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-300">
                {upiId}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3">
              <a
                href={upiDeepLink}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all text-center"
              >
                <span>Pay via UPI App</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={() => setShowQr(!showQr)}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-200 text-xs font-semibold hover:bg-emerald-50 transition-all"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>{showQr ? "Hide QR" : "Scan QR Code"}</span>
              </button>
            </div>

            {/* QR Code Container */}
            {showQr && (
              <div className="mt-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 flex flex-col items-center justify-center animate-fade-in">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrCodeUrl}
                  alt="UPI Payment QR Code"
                  className="w-44 h-44 rounded-lg shadow-sm"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 text-center">
                  Scan with Google Pay, PhonePe, Paytm, or any UPI app to pay{" "}
                  <strong>{formatCurrency(amountPaise, currency)}</strong>
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 mb-5 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <p>
              {toUser.name} hasn&apos;t linked a UPI ID yet. You can still pay via cash or bank transfer and record it here.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleMarkAsPaid}
            disabled={isSubmitting || amountPaise <= 0}
            className="flex-1 px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-white" />
            <span>{isSubmitting ? "Recording..." : "Mark as Paid & Settle"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
