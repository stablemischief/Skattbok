"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ClanSelector } from "@/components/clan-selector";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { BottomNav } from "@/components/bottom-nav";
import { useToast } from "@/components/toast";
import type { Expense, DashboardView } from "@/lib/types";

interface MonthSummary {
  month: string; // YYYY-MM
  label: string;
  total: number;
  count: number;
}

interface CategorySummary {
  category: string;
  total: number;
  count: number;
}

export default function HallPage() {
  const { showToast } = useToast();
  const [clan, setClan] = useState("");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [view, setView] = useState<DashboardView>("by-month");
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);

  const year = new Date().getFullYear();

  const fetchExpenses = useCallback(async () => {
    if (!clan) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/expenses?entity=${encodeURIComponent(clan)}&year=${year}`
      );
      const result = await res.json();
      if (result.success) {
        setExpenses(result.data);
      }
    } catch {
      showToast("Failed to load expenses", "error");
    } finally {
      setLoading(false);
    }
  }, [clan, year, showToast]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const ytdTotal = expenses.reduce((sum, e) => sum + e.total, 0);

  const monthSummaries: MonthSummary[] = (() => {
    const map = new Map<string, { total: number; count: number }>();
    for (const e of expenses) {
      const month = e.date.substring(0, 7); // YYYY-MM
      const existing = map.get(month) ?? { total: 0, count: 0 };
      map.set(month, {
        total: existing.total + e.total,
        count: existing.count + 1,
      });
    }
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([month, data]) => ({
        month,
        label: new Date(month + "-01").toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
        ...data,
      }));
  })();

  const categorySummaries: CategorySummary[] = (() => {
    const map = new Map<string, { total: number; count: number }>();
    for (const e of expenses) {
      const existing = map.get(e.category) ?? { total: 0, count: 0 };
      map.set(e.category, {
        total: existing.total + e.total,
        count: existing.count + 1,
      });
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .map(([category, data]) => ({ category, ...data }));
  })();

  async function handleDelete(expense: Expense) {
    try {
      const res = await fetch(
        `/api/expenses/${expense.id}?entity=${encodeURIComponent(clan)}&year=${year}`,
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

  return (
    <div className="min-h-screen bg-norse-bg pb-24 pt-safe">
      <div className="px-4 py-6">
        <h1 className="mb-1 text-2xl font-bold text-norse-gold">
          The Great Hall
        </h1>
        <p className="mb-4 text-sm text-norse-text-muted">
          Expense dashboard
        </p>

        <ClanSelector value={clan} onChange={setClan} />

        {clan && (
          <>
            <div className="my-4 rounded-lg border border-norse-border bg-norse-card p-4 text-center">
              <p className="text-sm text-norse-text-muted">YTD Total</p>
              <p className="text-3xl font-bold text-norse-gold">
                ${ytdTotal.toFixed(2)}
              </p>
            </div>

            <div className="mb-4 flex rounded-lg border border-norse-border bg-norse-card p-1">
              <button
                onClick={() => setView("by-month")}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold ${
                  view === "by-month"
                    ? "bg-norse-gold text-norse-bg"
                    : "text-norse-text-muted"
                }`}
              >
                By Month
              </button>
              <button
                onClick={() => setView("by-category")}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold ${
                  view === "by-category"
                    ? "bg-norse-gold text-norse-bg"
                    : "text-norse-text-muted"
                }`}
              >
                By Rune
              </button>
            </div>

            {loading ? (
              <p className="py-8 text-center text-norse-text-muted">
                Summoning the ledgers...
              </p>
            ) : view === "by-month" ? (
              <div className="space-y-2">
                {monthSummaries.length === 0 ? (
                  <p className="py-8 text-center text-norse-text-muted">
                    No expenses recorded yet
                  </p>
                ) : (
                  monthSummaries.map((ms) => (
                    <Link
                      key={ms.month}
                      href={`/hall/${ms.month}?entity=${encodeURIComponent(clan)}`}
                      className="flex items-center justify-between rounded-lg border border-norse-border bg-norse-card p-4"
                    >
                      <div>
                        <p className="font-semibold text-norse-text">
                          {ms.label}
                        </p>
                        <p className="text-sm text-norse-text-muted">
                          {ms.count} expense{ms.count !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <p className="text-lg font-bold text-norse-gold">
                        ${ms.total.toFixed(2)}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {categorySummaries.length === 0 ? (
                  <p className="py-8 text-center text-norse-text-muted">
                    No expenses recorded yet
                  </p>
                ) : (
                  categorySummaries.map((cs) => (
                    <div
                      key={cs.category}
                      className="flex items-center justify-between rounded-lg border border-norse-border bg-norse-card p-4"
                    >
                      <div>
                        <p className="font-semibold text-norse-text">
                          {cs.category}
                        </p>
                        <p className="text-sm text-norse-text-muted">
                          {cs.count} expense{cs.count !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <p className="text-lg font-bold text-norse-gold">
                        ${cs.total.toFixed(2)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
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
