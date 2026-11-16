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
  ReferenceLine,
  Cell,
} from "recharts";
import { formatCurrency, getCurrencySymbol } from "@/lib/formatters";

interface MonthDataPoint {
  label: string;
  total: number; // in smallest unit
  totalDecimal: number;
  goal: number; // in smallest unit
  goalDecimal: number;
  percentage: number;
  colorStatus: "emerald" | "amber" | "rose";
  barColor: string;
}

interface MonthlyGoalBarChartProps {
  data: MonthDataPoint[];
  monthlyGoal: number; // in smallest unit
  currency?: string;
}

export function MonthlyGoalBarChart({
  data,
  monthlyGoal,
  currency = "INR",
}: MonthlyGoalBarChartProps) {
  const goalDecimal = monthlyGoal / 100;
  const symbol = getCurrencySymbol(currency);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload as MonthDataPoint;
      const isOver = point.total > point.goal && point.goal > 0;
      const isNear = point.total >= point.goal * 0.8 && !isOver && point.goal > 0;

      return (
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm min-w-[200px]">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
            <span className="font-bold text-slate-800 dark:text-slate-100">{point.label}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                isOver
                  ? "bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300"
                  : isNear
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300"
              }`}
            >
              {isOver ? "Over Budget" : isNear ? "Near Limit" : "Under Budget"}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>Total Spent:</span>
              <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                {formatCurrency(point.total, currency)}
              </span>
            </div>

            {point.goal > 0 && (
              <>
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span>Monthly Goal:</span>
                  <span className="font-medium tabular-nums">
                    {formatCurrency(point.goal, currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span>Usage:</span>
                  <span
                    className={`font-semibold tabular-nums ${
                      isOver
                        ? "text-rose-600 dark:text-rose-400"
                        : isNear
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {point.percentage}%
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
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
            tickFormatter={(val) => `${symbol}${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
          />
          <Tooltip content={<CustomTooltip />} />

          {monthlyGoal > 0 && (
            <ReferenceLine
              y={goalDecimal}
              stroke="#f43f5e"
              strokeDasharray="4 4"
              strokeWidth={2}
              label={{
                value: `Goal: ${symbol}${goalDecimal.toLocaleString()}`,
                fill: "#f43f5e",
                fontSize: 11,
                position: "insideTopRight",
              }}
            />
          )}

          <Bar
            dataKey="totalDecimal"
            radius={[8, 8, 0, 0]}
            maxBarSize={48}
            animationDuration={800}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.barColor} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
