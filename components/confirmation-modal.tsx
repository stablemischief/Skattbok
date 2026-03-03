"use client";

interface ConfirmationModalProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "warning";
}

export function ConfirmationModal({
  open,
  title = "Cast into the Fire?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  variant = "danger",
}: ConfirmationModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm rounded-xl border border-norse-border bg-norse-card p-6">
        <h2 className="mb-2 text-lg font-bold text-norse-text">{title}</h2>
        <p className="mb-6 text-norse-text-muted">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-norse-border px-4 py-2 font-semibold text-norse-text"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-lg px-4 py-2 font-semibold text-white ${
              variant === "danger" ? "bg-norse-danger" : "bg-norse-gold text-norse-bg"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
