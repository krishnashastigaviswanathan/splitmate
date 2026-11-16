"use client";

import React, { useState } from "react";
import confetti from "canvas-confetti";
import {
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Flame,
  Award,
  Coffee,
  Pizza,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

const ROAST_TEMPLATES = [
  {
    quote: "Dost dost na raha: Please clear the pizza split before the cheese fossilizes into an archaeological artifact. 🍕",
    tag: "Food & Swiggy Debt",
  },
  {
    quote: "My bank balance is currently practicing severe Himalayan meditation. Please awaken it with a gentle UPI ping. 🧘‍♂️💸",
    tag: "Spiritual Banking",
  },
  {
    quote: "Friendly reminder: money doesn't grow on the balcony money plant (I checked, it only grows dust). 🪴",
    tag: "Botany 101",
  },
  {
    quote: "The Wi-Fi router works only because electricity bills get paid. Help keep the 4K Netflix dream alive! 📡🎬",
    tag: "Critical Infrastructure",
  },
  {
    quote: "My horoscope today said: 'You will receive an unexpected UPI credit from an extraordinarily handsome roommate.' Is that you? 🔮",
    tag: "Astrological Truth",
  },
  {
    quote: "This is a polite reminder before I begin charging compounding interest in slices of garlic bread. 🥖",
    tag: "Fintech Policy",
  },
];

const ROOMMATE_ARCHETYPES = [
  {
    icon: "👑",
    title: "The Midnight Swiggy Architect",
    desc: "Orders butter chicken at 1:45 AM, calculates itemized naan split to the nearest paise.",
    trait: "+10 Culinary Karma",
    bg: "from-amber-500/10 to-orange-500/10 border-orange-200 dark:border-orange-800",
  },
  {
    icon: "⚡",
    title: "The Power-Grid Vigilante",
    desc: "Switches off the hallway geyser and fans within 0.3 seconds of anyone stepping away.",
    trait: "Saves ₹40/mo on BESCOM",
    bg: "from-emerald-500/10 to-teal-500/10 border-emerald-200 dark:border-emerald-800",
  },
  {
    icon: "📡",
    title: "The Bandwidth Sultan",
    desc: "Says they only use Wi-Fi for work Slack, secretly streams 4K gaming tournaments all night.",
    trait: "Ping: 9ms",
    bg: "from-purple-500/10 to-indigo-500/10 border-purple-200 dark:border-purple-800",
  },
  {
    icon: "🥛",
    title: "The Mystery Milk Sip Collector",
    desc: "Takes exactly two gulps from the shared milk carton so it never officially looks empty.",
    trait: "Stealth: 100",
    bg: "from-rose-500/10 to-pink-500/10 border-rose-200 dark:border-rose-800",
  },
];

export function RoommateFunZone() {
  const { success } = useToast();
  const [currentRoastIdx, setCurrentRoastIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const roast = ROAST_TEMPLATES[currentRoastIdx];

  const handleNextRoast = () => {
    setCurrentRoastIdx((prev) => (prev + 1) % ROAST_TEMPLATES.length);
    setCopied(false);
  };

  const handleCopyRoast = () => {
    navigator.clipboard.writeText(roast.quote);
    setCopied(true);
    success("Copied polite funny nudge to clipboard! Paste it into your flatmates WhatsApp group.");
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePartyBurst = () => {
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.7 },
      colors: ["#ec4899", "#8b5cf6", "#f59e0b", "#10b981"],
    });
    success("Roommate Vibe Boost activated! 🎉");
  };

  return (
    <div className="space-y-6">
      {/* 1. The Roommate Nudge Machine */}
      <div className="rounded-3xl p-6 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-amber-500/10 border border-purple-200/80 dark:border-purple-800/60 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20 text-xl">
              🤖
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Roommate Nudge &amp; Roast Machine</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                  Zero Awkwardness
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Generate polite, witty WhatsApp reminders to get your split back with a smile.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleNextRoast}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 text-xs font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Shuffle</span>
            </button>

            <button
              onClick={handlePartyBurst}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hype Flat</span>
            </button>
          </div>
        </div>

        {/* The Quote Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-purple-100 dark:border-purple-800/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-[11px] font-semibold text-purple-600 dark:text-purple-400">
            <span className="uppercase tracking-wider">🏷️ {roast.tag}</span>
            <span className="text-slate-400">Ready to send</span>
          </div>

          <p className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100 italic leading-relaxed">
            &ldquo;{roast.quote}&rdquo;
          </p>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-400">
              Paste in WhatsApp, Slack, or group chat
            </span>

            <button
              onClick={handleCopyRoast}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white text-xs font-bold transition-all active:scale-95"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy Nudge"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Roommate Archetypes / Hall of Quirks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Roommate Hall of Quirks 🏆</span>
            <span className="text-xs text-slate-400 font-normal">Which one are you?</span>
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {ROOMMATE_ARCHETYPES.map((arch, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl bg-gradient-to-br ${arch.bg} border shadow-xs hover:-translate-y-1 transition-all flex flex-col justify-between`}
            >
              <div>
                <div className="text-2xl mb-2">{arch.icon}</div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                  {arch.title}
                </h5>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                  {arch.desc}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300">
                  {arch.trait}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
