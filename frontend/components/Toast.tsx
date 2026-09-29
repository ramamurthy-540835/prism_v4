"use client";

import { createContext, useContext, useMemo, useState, type ComponentType, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X, type LucideIcon } from "lucide-react";

type ToastType = "success" | "info" | "warning" | "error";

type ToastItem = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const STYLES: Record<ToastType, { border: string; text: string; Icon: LucideIcon }> = {
  success: { border: "#24a148", text: "#0e6027", Icon: CheckCircle2 },
  info: { border: "#0f62fe", text: "#0043ce", Icon: Info },
  warning: { border: "#f1c21b", text: "#633806", Icon: TriangleAlert },
  error: { border: "#da1e28", text: "#a2191f", Icon: AlertCircle },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = (message: string, type: ToastType = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const value = useMemo(() => ({ showToast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex w-[360px] flex-col gap-3">
        {toasts.map((toast) => {
          const style = STYLES[toast.type];
          const Icon = style.Icon;
          return (
            <div key={toast.id} className="rounded border border-[#dcdcdc] bg-white shadow-md" style={{ borderLeft: `4px solid ${style.border}` }}>
              <div className="flex items-start gap-2 px-4 py-3">
                <Icon className="mt-0.5 h-4 w-4" style={{ color: style.text }} />
                <p className="flex-1 text-sm" style={{ color: style.text }}>{toast.message}</p>
                <button onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))} className="text-[#525252] hover:text-[#161616]">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
