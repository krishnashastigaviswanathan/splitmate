"use client";

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency, CATEGORY_CONFIG } from "@/lib/formatters";

interface CategoryItem {
  name: string;
  total: number;
  totalDecimal: number;
  count: number;
  percentage: number;
  color: string;
}

interface CategoryDonutChartProps {
  data: CategoryItem[];
  currency?: string;
}

export function CategoryDonutChart({ data, currency = "INR" }: CategoryDonutChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-sm">
        <p>No expense data recorded yet.</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as CategoryItem;
      const config = CATEGORY_CONFIG[item.name] || CATEGORY_CONFIG["Other"];
      return (
        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 text-xs sm:text-sm">
          <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100 mb-1">
            <span>{config.icon}</span>
            <span>{item.name}</span>
          </div>
          <div className="text-slate-600 dark:text-slate-300 flex items-center justify-between gap-4">
            <span>Total:</span>
            <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
              {formatCurrency(item.total, currency)}
            </span>
          </div>
          <div className="text-slate-500 dark:text-slate-400 flex items-center justify-between gap-4">
            <span>Share:</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {item.percentage}% ({item.count} bills)
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      <div className="w-52 h-52 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={data}
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="total"
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
        {data.map((item) => {
          const config = CATEGORY_CONFIG[item.name] || CATEGORY_CONFIG["Other"];
          return (
            <div
              key={item.name}
              className="flex items-center justify-between p-2 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 text-xs"
            >
              <div className="flex items-center gap-2 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate text-slate-700 dark:text-slate-200">
                  {config.icon} {item.name}
                </span>
              </div>
              <div className="text-right shrink-0">
                <div className="font-semibold text-slate-900 dark:text-white tabular-nums">
                  {item.percentage}%
                </div>
                <div className="text-[10px] text-slate-400">
                  {formatCurrency(item.total, currency, false)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
