"use client";

import React from "react";
import { CATEGORY_CONFIG } from "@/lib/formatters";

interface CategoryBadgeProps {
  category: string;
  size?: "sm" | "md";
  className?: string;
}

export function CategoryBadge({
  category,
  size = "md",
  className = "",
}: CategoryBadgeProps) {
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG["Other"];

  const sizeClasses =
    size === "sm"
      ? "text-xs px-2 py-0.5 gap-1"
      : "text-xs font-medium px-2.5 py-1 gap-1.5";

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.bg} ${config.darkBg} ${config.border} ${config.text} ${sizeClasses} ${className}`}
    >
      <span className="text-sm leading-none">{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}
