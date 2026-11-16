"use client";

import React from "react";
import { getAvatarGradient, getInitials } from "@/lib/formatters";

interface UserAvatarProps {
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  showName?: boolean;
}

const SIZE_MAP = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm font-semibold",
  lg: "w-12 h-12 text-base font-bold",
  xl: "w-16 h-16 text-xl font-bold",
};

export function UserAvatar({
  name,
  size = "md",
  className = "",
  showName = false,
}: UserAvatarProps) {
  const gradient = getAvatarGradient(name);
  const initials = getInitials(name);
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div
        className={`rounded-full flex items-center justify-center text-white bg-gradient-to-tr ${gradient} shadow-sm shrink-0 uppercase select-none ${sizeClass}`}
        title={name}
      >
        {initials}
      </div>
      {showName && (
        <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
          {name}
        </span>
      )}
    </div>
  );
}
