"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { ExpenseForm } from "@/components/expense-form";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { BottomNav } from "@/components/bottom-nav";
import { useToast } from "@/components/toast";
import type { Expense } from "@/lib/types";

export default function ExpenseDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();

  const expenseId = params.id as string;
  const entity = searchParams.get("entity") ?? "";
  const year = parseInt(
    searchParams.get("year") ?? String(new Date().getFullYear())
  );

  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);

  const fetchExpense = useCallback(async () => {
    if (!entity) return;
    try {
      const res = await fetch(
        `/api/expenses?entity=${encodeURIComponent(entity)}&year=${year}`
      );
      const result = await res.json();
      if (result.success) {
        const found = (result.data as Expense[]).find(
          (e) => e.id === expenseId
        );
        setExpense(found ?? null);
      } else if (res.status === 401 || result.code === "GOOGLE_NOT_CONNECTED") {
        showToast(
          result.error || "Google account not connected. Connect Google in Settings.",
          "error"
        );
      } else {
        showToast(result.error || "Failed to load expense", "error");
      }
    } catch {
      showToast("Failed to load expense", "error");
    } finally {
      setLoading(false);
    }
  }, [entity, year, expenseId, showToast]);

  useEffect(() => {
    fetchExpense();
  }, [fetchExpense]);

  async function handleSave(data: Partial<Expense>) {
    setSaving(true);
    try {
      const res = await fetch(`/api/expenses/${expenseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, entity }),
      });
      const result = await res.json();
      if (result.success) {
        showToast("Expense updated!", "success");
        router.back();
      } else if (res.status === 401 || result.code === "GOOGLE_NOT_CONNECTED") {
        showToast(
          result.error || "Google account not connected. Connect Google in Settings.",
          "error"
        );
      } else {
        showToast(result.error || "Update failed", "error");
      }
    } catch {
      showToast("Failed to update", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      const res = await fetch(
        `/api/expenses/${expenseId}?entity=${encodeURIComponent(entity)}&year=${year}`,
        { method: "DELETE" }
      );
      const result = await res.json();
      if (result.success) {
        showToast("Cast into the fire!", "success");
        router.back();
      } else if (res.status === 401 || result.code === "GOOGLE_NOT_CONNECTED") {
        showToast(
          result.error || "Google account not connected. Connect Google in Settings.",
          "error"
        );
      } else {
        showToast(result.error || "Delete failed", "error");
      }
    } catch {
      showToast("Failed to delete", "error");
    }
    setDeleteModal(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-norse-bg">
        <p className="text-norse-text-muted">Loading...</p>
        <BottomNav />
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-norse-bg">
        <p className="text-norse-text-muted">Expense not found</p>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-norse-bg pb-24 pt-safe">
      <div className="px-4 py-6">
        <button
          onClick={() => router.back()}
          className="mb-4 text-sm text-norse-text-muted"
        >
          &larr; Back
        </button>

        <h1 className="mb-1 text-2xl font-bold text-norse-gold">
          Edit Expense
        </h1>
        <p className="mb-6 text-sm text-norse-text-muted">
          {expense.vendor} &middot; {expense.date}
        </p>

        <ExpenseForm
          initialData={expense}
          initialEntity={entity}
          imagePreview={expense.imageUrl || undefined}
          onSave={handleSave}
          onDelete={() => setDeleteModal(true)}
          saving={saving}
        />
      </div>

      <ConfirmationModal
        open={deleteModal}
        message={`Delete expense from ${expense.vendor}?`}
        confirmLabel="Cast into the Fire"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal(false)}
      />

      <BottomNav />
    </div>
  );
}
