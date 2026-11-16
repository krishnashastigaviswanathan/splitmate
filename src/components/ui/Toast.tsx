"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: (options: { type?: ToastType; title?: string; message: string; duration?: number }) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({
      type = "info",
      title,
      message,
      duration = 5000,
    }: {
      type?: ToastType;
      title?: string;
      message: string;
      duration?: number;
    }) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: Toast = { id, type, title, message, duration };
      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = (message: string, title?: string) => addToast({ type: "success", title, message });
  const error = (message: string, title?: string) => addToast({ type: "error", title, message });
  const warning = (message: string, title?: string) => addToast({ type: "warning", title: title || "⚠️ Warning", message, duration: 8000 });
  const info = (message: string, title?: string) => addToast({ type: "info", title, message });

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, warning, info }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-300 animate-fade-in ${
              t.type === "success"
                ? "bg-emerald-50/95 border-emerald-300 text-emerald-950 dark:bg-emerald-950/90 dark:border-emerald-800 dark:text-emerald-100"
                : t.type === "error"
                ? "bg-rose-50/95 border-rose-300 text-rose-950 dark:bg-rose-950/90 dark:border-rose-800 dark:text-rose-100"
                : t.type === "warning"
                ? "bg-amber-50/95 border-amber-300 text-amber-950 dark:bg-amber-950/90 dark:border-amber-800 dark:text-amber-100 shadow-amber-500/10"
                : "bg-slate-50/95 border-slate-300 text-slate-950 dark:bg-slate-900/90 dark:border-slate-700 dark:text-slate-100"
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {t.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
              {t.type === "error" && <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
              {t.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 animate-bounce" />}
              {t.type === "info" && <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
            </div>
            <div className="flex-1 text-sm">
              {t.title && <h5 className="font-semibold text-sm mb-0.5">{t.title}</h5>}
              <p className="leading-snug text-xs sm:text-sm">{t.message}</p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
