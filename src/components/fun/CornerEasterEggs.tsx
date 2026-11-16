"use client";

import React, { useState } from "react";
import confetti from "canvas-confetti";
import { Coffee, Flame, AlertCircle, Pizza, Sparkles, X, Heart } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export function CornerEasterEggs() {
  const { success, info } = useToast();
  const [showFridgeReport, setShowFridgeReport] = useState(false);
  const [chaiCount, setChaiCount] = useState(14);
  const [isPouringChai, setIsPouringChai] = useState(false);

  const handleChaiClick = () => {
    setIsPouringChai(true);
    setChaiCount((prev) => prev + 1);
    setTimeout(() => setIsPouringChai(false), 800);
    success(
      `☕ Chai round logged! Total household chai cups boiled: ${chaiCount + 1}`,
      "Chai Diplomacy"
    );
  };

  const handleEmergencySnack = () => {
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.8 },
      colors: ["#f59e0b", "#ef4444", "#10b981", "#8b5cf6"],
    });
    success(
      "🍕 Emergency Snack Signal sent to all roommates! Stand by for delivery app warfare.",
      "Emergency Protocol"
    );
  };

  return (
    <>
      {/* 1. Corner Badge: Chai Meter (Top Right Sub-Corner) */}
      <div className="flex items-center gap-2 p-2 px-3 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 shadow-xs backdrop-blur-sm">
        <button
          onClick={handleChaiClick}
          className={`w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-sm ${
            isPouringChai ? "animate-bounce" : ""
          }`}
          title="Click to log a round of chai!"
        >
          <Coffee className="w-4 h-4" />
        </button>
        <div className="text-left">
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
            <span>Chai Counter ☕</span>
          </div>
          <p className="text-xs font-black text-slate-800 dark:text-slate-100 tabular-nums leading-none">
            {chaiCount} cups boiled
          </p>
        </div>
      </div>

      {/* 2. Floating Bottom Corner Widget: Fridge State & Emergency Snack Button */}
      <div className="fixed bottom-20 md:bottom-6 left-6 z-30 flex items-center gap-2">
        {/* Ice Tray Status Pill */}
        <button
          onClick={() => setShowFridgeReport(!showFridgeReport)}
          className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-700 shadow-lg hover:shadow-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:-translate-y-0.5 transition-all"
          title="Inspect Flat Fridge Intel"
        >
          <span className="text-base">🧊</span>
          <span className="hidden sm:inline">Ice Tray: 2 cubes</span>
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
        </button>

        {/* Emergency Pizza Signal */}
        <button
          onClick={handleEmergencySnack}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg hover:shadow-orange-500/25 text-xs font-bold hover:scale-105 active:scale-95 transition-all"
          title="Broadcast Emergency Snack Alert to Flat"
        >
          <Pizza className="w-4 h-4" />
          <span className="hidden sm:inline">Snack SOS</span>
        </button>
      </div>

      {/* Funny Fridge Intel Modal */}
      {showFridgeReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <button
              onClick={() => setShowFridgeReport(false)}
              className="absolute right-4 top-4 p-1 rounded-full text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-100 dark:bg-cyan-950 text-cyan-600 flex items-center justify-center text-xl">
                🧊
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Flat Fridge Intel &amp; Status
                </h4>
                <p className="text-xs text-slate-400">Classified roommate intelligence</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span>🧊 Ice Tray Status</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">2 empty cubes left</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span>🥛 Mystery Milk Carton</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">Suspiciously light</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span>🍕 Leftover Pizza Box</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Safely guarded</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span>🪴 Balcony Plant</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Surviving on vibes</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 italic text-center">
              &ldquo;A clean fridge is the sign of a happy household.&rdquo; — Roommate Proverb
            </p>
          </div>
        </div>
      )}
    </>
  );
}
