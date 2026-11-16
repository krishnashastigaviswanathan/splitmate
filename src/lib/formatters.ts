export const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

export function getCurrencySymbol(currency: string = "INR"): string {
  return CURRENCY_SYMBOLS[currency.toUpperCase()] || "₹";
}

/**
 * Formats integer amount in smallest currency unit (e.g. paise/cents)
 * 250000 paise -> "₹2,500.00" or "₹2,500" if no paise
 */
export function formatCurrency(
  amountInSmallestUnit: number,
  currency: string = "INR",
  showDecimals: boolean = true
): string {
  const symbol = getCurrencySymbol(currency);
  const isNegative = amountInSmallestUnit < 0;
  const absAmount = Math.abs(amountInSmallestUnit) / 100;

  const formatted = new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    minimumFractionDigits: showDecimals && amountInSmallestUnit % 100 !== 0 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(absAmount);

  return `${isNegative ? "-" : ""}${symbol}${formatted}`;
}

/**
 * Convert user input number (e.g. 24.50) into integer smallest currency unit (2450)
 */
export function toSmallestUnit(amount: number | string): number {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

/**
 * Convert integer smallest unit (2450) to decimal number (24.50)
 */
export function fromSmallestUnit(amountInSmallestUnit: number): number {
  return (amountInSmallestUnit || 0) / 100;
}

/**
 * Formats a date nicely: e.g. "Today", "Yesterday", or "Oct 24, 2026"
 */
export function formatDate(dateInput: string | Date): string {
  const date = new Date(dateInput);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

/**
 * Generates initials from a name (e.g. "Rahul Sharma" -> "RS")
 */
export function getInitials(name: string): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Generates consistent background colors for user avatars
 */
const AVATAR_COLORS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-blue-600",
  "from-fuchsia-500 to-pink-600",
];

export function getAvatarGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

/**
 * Category styling config with icons & badge colors
 */
export const CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: string; bg: string; text: string; border: string; darkBg: string }
> = {
  "Rent & Utilities": {
    label: "Rent & Utilities",
    icon: "🏠",
    bg: "bg-blue-50",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
    darkBg: "dark:bg-blue-950/40",
  },
  "Groceries": {
    label: "Groceries",
    icon: "🛒",
    bg: "bg-emerald-50",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
    darkBg: "dark:bg-emerald-950/40",
  },
  "Food & Dining": {
    label: "Food & Dining",
    icon: "🍕",
    bg: "bg-orange-50",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-800",
    darkBg: "dark:bg-orange-950/40",
  },
  "Travel": {
    label: "Travel",
    icon: "✈️",
    bg: "bg-purple-50",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800",
    darkBg: "dark:bg-purple-950/40",
  },
  "Entertainment": {
    label: "Entertainment",
    icon: "🎬",
    bg: "bg-pink-50",
    text: "text-pink-700 dark:text-pink-300",
    border: "border-pink-200 dark:border-pink-800",
    darkBg: "dark:bg-pink-950/40",
  },
  "Other": {
    label: "Other",
    icon: "📦",
    bg: "bg-slate-100",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-200 dark:border-slate-700",
    darkBg: "dark:bg-slate-800/40",
  },
};
