"use client";

import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Sparkles,
  Receipt,
  Plus,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { UserAvatar } from "@/components/ui/UserAvatar";

interface CalendarDayData {
  day: number;
  dateStr: string;
  totalAmount: number;
  expenses: any[];
}

interface MonthlyExpenseCalendarProps {
  currentMonth: {
    year: number;
    month: number;
    monthName: string;
    daysInMonth: number;
    firstDayOfWeek: number;
    totalSpending: number;
    highestDay: { day: number; amount: number; title: string };
  };
  calendarDays: CalendarDayData[];
  currency?: string;
  onMonthChange: (year: number, month: number) => void;
  onOpenAddExpense?: () => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MonthlyExpenseCalendar({
  currentMonth,
  calendarDays,
  currency = "INR",
  onMonthChange,
  onOpenAddExpense,
}: MonthlyExpenseCalendarProps) {
  const today = new Date();
  const isCurrentMonthYear =
    today.getFullYear() === currentMonth.year && today.getMonth() + 1 === currentMonth.month;

  // Find a sensible default selected day: either today if current month, or the highest spend day, or day with expenses
  const dayWithExpenses = calendarDays.find((d) => d.expenses.length > 0)?.day || 1;
  const initialDay = isCurrentMonthYear ? today.getDate() : dayWithExpenses;
  const [selectedDay, setSelectedDay] = useState<number>(initialDay);

  const handlePrevMonth = () => {
    let newMonth = currentMonth.month - 1;
    let newYear = currentMonth.year;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    onMonthChange(newYear, newMonth);
    setSelectedDay(1);
  };

  const handleNextMonth = () => {
    let newMonth = currentMonth.month + 1;
    let newYear = currentMonth.year;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    onMonthChange(newYear, newMonth);
    setSelectedDay(1);
  };

  const selectedDayData = calendarDays.find((d) => d.day === selectedDay);

  // Empty cells before day 1
  const emptyPrefixCells = Array.from({ length: currentMonth.firstDayOfWeek });

  return (
    <div className="rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm space-y-6">
      {/* Calendar Header with Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-emerald-500" />
            <span>Monthly Expense Calendar</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              Date-wise View
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Click any day on the calendar to inspect all roommate bills logged on that date.
          </p>
        </div>

        {/* Month Navigator Buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 min-w-[120px] text-center">
              {currentMonth.monthName} {currentMonth.year}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid + Details Side/Bottom Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (7 cols): The Calendar Grid */}
        <div className="lg:col-span-7 space-y-2">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            {WEEKDAYS.map((wd) => (
              <div key={wd} className="py-1">
                {wd}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Empty slots before day 1 */}
            {emptyPrefixCells.map((_, i) => (
              <div
                key={`empty-${i}`}
                className="aspect-square rounded-2xl bg-slate-50/40 dark:bg-slate-800/20 opacity-30"
              />
            ))}

            {/* Days 1..N */}
            {calendarDays.map((dayItem) => {
              const isToday = isCurrentMonthYear && dayItem.day === today.getDate();
              const isSelected = dayItem.day === selectedDay;
              const hasExpenses = dayItem.expenses.length > 0;
              const isHighest = dayItem.day === currentMonth.highestDay.day && dayItem.totalAmount > 0;

              return (
                <button
                  type="button"
                  key={dayItem.day}
                  onClick={() => setSelectedDay(dayItem.day)}
                  className={`relative aspect-square rounded-2xl p-1 sm:p-2 flex flex-col justify-between items-center transition-all cursor-pointer ${
                    isSelected
                      ? "ring-2 ring-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/50 shadow-sm scale-105 z-10"
                      : hasExpenses
                      ? "bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60"
                      : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60"
                  }`}
                >
                  {/* Day Number */}
                  <div className="w-full flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isToday
                          ? "w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center -ml-0.5"
                          : isSelected
                          ? "text-emerald-700 dark:text-emerald-300"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {dayItem.day}
                    </span>

                    {isHighest && (
                      <span title="Peak Spending Day">
                        <Flame className="w-3 h-3 text-rose-500 animate-pulse" />
                      </span>
                    )}
                  </div>

                  {/* Expense Indicators */}
                  {hasExpenses ? (
                    <div className="w-full text-center">
                      <div className="text-[10px] sm:text-[11px] font-black text-slate-900 dark:text-white tabular-nums truncate">
                        {formatCurrency(dayItem.totalAmount, currency, false)}
                      </div>
                      <div className="flex items-center justify-center gap-0.5 mt-0.5">
                        {dayItem.expenses.slice(0, 3).map((_, idx) => (
                          <span
                            key={idx}
                            className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"
                          />
                        ))}
                        {dayItem.expenses.length > 3 && (
                          <span className="text-[8px] font-bold text-emerald-600">
                            +{dayItem.expenses.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-300 dark:text-slate-700 select-none">
                      -
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right (5 cols): Selected Day Detail Panel */}
        <div className="lg:col-span-5 rounded-2xl p-5 bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between space-y-4">
          <div>
            {/* Header of selected day */}
            <div className="flex items-start justify-between border-b border-slate-200/80 dark:border-slate-700 pb-3 mb-3">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                  Selected Date Details
                </span>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {currentMonth.monthName} {selectedDay}, {currentMonth.year}
                </h4>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400">Day&apos;s Total</span>
                <div className="text-base font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {formatCurrency(selectedDayData?.totalAmount || 0, currency)}
                </div>
              </div>
            </div>

            {/* List of expenses on this day */}
            {selectedDayData && selectedDayData.expenses.length > 0 ? (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {selectedDayData.expenses.map((exp: any) => (
                  <div
                    key={exp.id}
                    className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                          {exp.description}
                        </h5>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <span>{exp.group.emoji} {exp.group.name}</span>
                          <span>•</span>
                          <span>Paid by <strong>{exp.paidBy.name}</strong></span>
                        </div>
                      </div>

                      <div className="text-xs font-extrabold text-slate-900 dark:text-white tabular-nums shrink-0">
                        {formatCurrency(exp.amount, currency)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px]">
                      <CategoryBadge category={exp.category} size="sm" />
                      <span className="text-slate-400 font-medium">
                        {exp.splits?.length || 0} split members
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 space-y-2">
                <p className="text-xs font-medium">
                  🧘 Zero expenses recorded on this day.
                </p>
                <p className="text-[11px] text-slate-500 italic">
                  A serene day of budget peace and no pizza splits!
                </p>
              </div>
            )}
          </div>

          {/* Quick action button */}
          {onOpenAddExpense && (
            <button
              onClick={onOpenAddExpense}
              className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Expense for this Month</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
