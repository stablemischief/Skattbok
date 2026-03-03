"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { SwipeableRow } from "@/components/swipeable-row";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { BottomNav } from "@/components/bottom-nav";
import { useToast } from "@/components/toast";
import type { Expense } from "@/lib/types";

export default function MonthPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const month = params.month as string;
  const entity = searchParams.get("entity") ?? "";
  const year = parseInt(month.split("-")[0]);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);

  const monthLabel = new Date(month + "-01").toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const fetchExpenses = useCallback(async () => {
    if (!entity) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/expenses?entity=${encodeURIComponent(entity)}&year=${year}`
      );
      const result = await res.json();
      if (result.success) {
        const filtered = (result.data as Expense[]).filter((e) =>
          e.date.startsWith(month)
        );
        setExpenses(filtered);
      } else {
        showToast(result.error || "Failed to load expenses", "error");
      }
    } catch {
      showToast("Failed to load expenses", "error");
    } finally {
      setLoading(false);
    }
  }, [entity, year, month, showToast]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  async function handleDelete(expense: Expense) {
    try {
      const res = await fetch(
        `/api/expenses/${expense.id}?entity=${encodeURIComponent(entity)}&year=${year}`,
        { method: "DELETE" }
      );
      const result = await res.json();
      if (result.success) {
        showToast("Cast into the fire!", "success");
        fetchExpenses();
      } else {
        showToast(result.error || "Delete failed", "error");
      }
    } catch {
      showToast("Failed to delete", "error");
    }
    setDeleteTarget(null);
  }

  const total = expenses.reduce((sum, e) => sum + e.total, 0);

  return (
    <div className="min-h-screen bg-norse-bg pb-24 pt-safe">
      <div className="px-4 py-6">
        <Link
          href="/hall"
          className="mb-4 inline-block text-sm text-norse-text-muted"
        >
          &larr; Back to The Great Hall
        </Link>

        <h1 className="mb-1 text-2xl font-bold text-norse-gold">
          {monthLabel}
        </h1>
        <p className="mb-4 text-sm text-norse-text-muted">
          {entity} &middot; {expenses.length} expense
          {expenses.length !== 1 ? "s" : ""} &middot; $
          {total.toFixed(2)}
        </p>

        {loading ? (
          <p className="py-8 text-center text-norse-text-muted">
            Loading...
          </p>
        ) : expenses.length === 0 ? (
          <p className="py-8 text-center text-norse-text-muted">
            No expenses this month
          </p>
        ) : (
          <div className="space-y-2">
            {expenses.map((expense) => (
              <SwipeableRow
                key={expense.id}
                onDelete={() => setDeleteTarget(expense)}
              >
                <Link
                  href={`/expense/${expense.id}?entity=${encodeURIComponent(entity)}&year=${year}`}
                  className="flex items-center justify-between p-4"
                >
                  <div>
                    <p className="font-semibold text-norse-text">
                      {expense.vendor}
                    </p>
                    <p className="text-sm text-norse-text-muted">
                      {expense.date} &middot; {expense.category}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-norse-gold">
                    ${expense.total.toFixed(2)}
                  </p>
                </Link>
              </SwipeableRow>
            ))}
          </div>
        )}
      </div>

      <ConfirmationModal
        open={!!deleteTarget}
        message={`Delete expense from ${deleteTarget?.vendor ?? ""}?`}
        confirmLabel="Cast into the Fire"
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />

      <BottomNav />
    </div>
  );
}
