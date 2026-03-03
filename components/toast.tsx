"use client";

import { useEffect, useState, useCallback, createContext, useContext } from "react";

type ToastVariant = "success" | "error" | "warning";

interface ToastMessage {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextType {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "success") => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, variant }]);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 left-4 z-[200] flex flex-col items-center gap-2 pt-safe">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            variant={toast.variant}
            onDismiss={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function Toast({
  message,
  variant,
  onDismiss,
}: {
  message: string;
  variant: ToastVariant;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const variantStyles = {
    success: "border-norse-success bg-norse-success/10 text-norse-success",
    error: "border-norse-danger bg-norse-danger/10 text-norse-danger",
    warning: "border-norse-gold bg-norse-gold/10 text-norse-gold",
  };

  return (
    <div
      className={`w-full max-w-sm rounded-lg border px-4 py-3 text-sm font-medium shadow-lg ${variantStyles[variant]}`}
    >
      {message}
    </div>
  );
}
