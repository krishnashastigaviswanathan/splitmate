"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatCurrency } from "@/lib/formatters";
import { Sparkles, TrendingUp, Users } from "lucide-react";

interface MonthData {
  key: string;
  label: string;
  monthName: string;
  total: number;
  totalDecimal: number;
  perPersonSplit?: number;
  perPersonSplitDecimal?: number;
  funRemark: string;
  groupBreakdown: { name: string; emoji: string; amount: number }[];
}

interface OverallDashboardBarChartProps {
  data: MonthData[];
  currency?: string;
}

const BAR_COLORS = [
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // emerald
  "#06b6d4", // cyan
];

export function OverallDashboardBarChart({
  data,
  currency = "INR",
}: OverallDashboardBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400">
        No spending history available yet.
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as MonthData;
      return (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm min-w-[220px]">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
            <span className="font-extrabold text-slate-900 dark:text-white">
              {item.label}
            </span>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
              Overall Spend
            </span>
          </div>

          <div className="text-lg font-black text-slate-900 dark:text-white tabular-nums mb-1.5">
            {formatCurrency(item.total, currency)}
          </div>

          {/* Split Per Person Monthly Display */}
          <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-2 py-1 px-2 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/40">
            <span className="flex items-center gap-1 font-medium">
              <Users className="w-3.5 h-3.5" />
              <span>Split per person:</span>
            </span>
            <span className="tabular-nums font-extrabold">
              ≈ {formatCurrency(item.perPersonSplit || Math.round(item.total / 4), currency, false)} / person
            </span>
          </div>

          {/* Group breakdown */}
          {item.groupBreakdown.length > 0 && (
            <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800/80 mb-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Groups:
              </span>
              {item.groupBreakdown.map((g, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300"
                >
                  <span className="truncate flex items-center gap-1">
                    <span>{g.emoji}</span>
                    <span className="truncate">{g.name}</span>
                  </span>
                  <span className="font-semibold tabular-nums ml-2">
                    {formatCurrency(g.amount, currency)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Funny Remark */}
          <div className="mt-2 text-[11px] font-medium text-amber-600 dark:text-amber-400 italic bg-amber-50 dark:bg-amber-950/40 p-1.5 rounded-lg">
            {item.funRemark}
          </div>
        </div>
      );
    }
    return null;
  };

  const highestMonth = [...data].sort((a, b) => b.total - a.total)[0];

  return (
    <div className="rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg flex items-center gap-2">
            <span>Overall Spending Bar Graph</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> All Groups
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Total monthly spending across all your apartments, flatmates, and trips.
          </p>
        </div>

        {highestMonth && highestMonth.total > 0 && (
          <div className="text-right text-xs">
            <span className="text-slate-400">Peak month: </span>
            <strong className="text-slate-800 dark:text-slate-200 font-bold">
              {highestMonth.label} ({formatCurrency(highestMonth.total, currency, false)})
            </strong>
          </div>
        )}
      </div>

      <div className="w-full h-72 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.2} />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="totalDecimal"
              radius={[10, 10, 0, 0]}
              maxBarSize={50}
              animationDuration={800}
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={BAR_COLORS[index % BAR_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
