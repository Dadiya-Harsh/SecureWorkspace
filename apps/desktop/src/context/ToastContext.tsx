import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { CheckCircle2, Info, AlertTriangle, AlertCircle, X } from "lucide-react";

export type ToastType = "success" | "info" | "warning" | "error";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  dismissToast: (id: string) => void;
  toast: {
    success: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info", duration = 4500) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast: ToastItem = { id, message, type, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast]
  );

  const toastHelpers = useMemo(
    () => ({
      success: (msg: string, d?: number) => showToast(msg, "success", d),
      info: (msg: string, d?: number) => showToast(msg, "info", d),
      warning: (msg: string, d?: number) => showToast(msg, "warning", d),
      error: (msg: string, d?: number) => showToast(msg, "error", d),
    }),
    [showToast]
  );

  const value = useMemo(
    () => ({
      showToast,
      dismissToast,
      toast: toastHelpers,
    }),
    [showToast, dismissToast, toastHelpers]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Global Toast Overlay Container - Always on top (z-[9999]) across all states */}
      <div
        aria-live="polite"
        className="fixed bottom-8 right-8 z-[9999] flex flex-col gap-2.5 max-w-md w-full sm:w-auto pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-xl border text-xs font-semibold backdrop-blur-sm transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${
              t.type === "error"
                ? "bg-red-50/95 border-red-200 text-red-900 shadow-red-950/10"
                : t.type === "warning"
                ? "bg-amber-50/95 border-amber-200 text-amber-900 shadow-amber-950/10"
                : t.type === "success"
                ? "bg-emerald-50/95 border-emerald-200 text-emerald-900 shadow-emerald-950/10"
                : "bg-surface-card/95 border-line text-ink shadow-black/10"
            }`}
          >
            {t.type === "error" && (
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            {t.type === "warning" && (
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            )}
            {t.type === "success" && (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            )}
            {t.type === "info" && (
              <Info className="w-4 h-4 text-vault-green flex-shrink-0 mt-0.5" />
            )}

            <span className="flex-1 leading-relaxed break-words">{t.message}</span>

            <button
              onClick={() => dismissToast(t.id)}
              className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition text-ink-muted hover:text-ink ml-1 flex-shrink-0"
              aria-label="Close notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
