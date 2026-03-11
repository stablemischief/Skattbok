"use client";

import { useState } from "react";
import { ClanSelector } from "./clan-selector";
import { RuneSelector } from "./rune-selector";
import { WarChestSelector } from "./war-chest-selector";
import type { Expense, ReceiptExtraction } from "@/lib/types";

interface ExpenseFormProps {
  initialData?: Partial<Expense>;
  initialEntity?: string;
  extraction?: ReceiptExtraction;
  imagePreview?: string;
  onSave: (data: Partial<Expense>) => void;
  onDelete?: () => void;
  saving?: boolean;
}

export function ExpenseForm({
  initialData = {},
  initialEntity,
  extraction,
  imagePreview,
  onSave,
  onDelete,
  saving = false,
}: ExpenseFormProps) {
  const [vendor, setVendor] = useState(
    initialData.vendor ?? extraction?.vendor ?? ""
  );
  const [date, setDate] = useState(
    initialData.date ??
      extraction?.date ??
      new Date().toISOString().split("T")[0]
  );
  const [amount, setAmount] = useState(
    String(initialData.amount ?? extraction?.subtotal ?? extraction?.total ?? 0)
  );
  const [tax, setTax] = useState(
    String(initialData.tax ?? extraction?.tax ?? 0)
  );
  const [tip, setTip] = useState(
    String(initialData.tip ?? extraction?.tip ?? 0)
  );
  const [total, setTotal] = useState(
    String(initialData.total ?? extraction?.total ?? 0)
  );
  const [category, setCategory] = useState(initialData.category ?? "");
  const [entity, setEntity] = useState(initialEntity ?? "");
  const [paymentMethod, setPaymentMethod] = useState(
    initialData.paymentMethod ?? extraction?.payment_method ?? ""
  );
  const [cardNickname, setCardNickname] = useState(
    initialData.cardNickname ?? ""
  );
  const [description, setDescription] = useState(
    initialData.description ?? extraction?.description ?? ""
  );
  const [notes, setNotes] = useState(
    initialData.notes ?? extraction?.notes ?? ""
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      vendor,
      date,
      amount: parseFloat(amount) || 0,
      tax: parseFloat(tax) || 0,
      tip: parseFloat(tip) || 0,
      total: parseFloat(total) || 0,
      category,
      paymentMethod,
      cardNickname,
      description,
      notes,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {imagePreview && (
        <div className="overflow-hidden rounded-lg border border-norse-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagePreview}
            alt="Receipt"
            className="h-auto max-h-48 w-full object-contain"
          />
        </div>
      )}

      {extraction?.line_items && extraction.line_items.length > 0 && (
        <div className="rounded-lg border border-norse-border bg-norse-card p-3">
          <h3 className="mb-2 text-sm font-semibold text-norse-text-muted">
            Line Items
          </h3>
          <div className="space-y-1">
            {extraction.line_items.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-norse-text">{item.description}</span>
                <span className="text-norse-gold">
                  ${item.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm text-norse-text-muted">
          Vendor
        </label>
        <input
          type="text"
          value={vendor}
          onChange={(e) => setVendor(e.target.value)}
          className="w-full rounded-lg border border-norse-border bg-norse-card px-3 py-2 text-norse-text"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-norse-text-muted">
          Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-lg border border-norse-border bg-norse-card px-3 py-2 text-norse-text"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm text-norse-text-muted">
            Amount (Subtotal)
          </label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-lg border border-norse-border bg-norse-card px-3 py-2 text-norse-text"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-norse-text-muted">
            Tax
          </label>
          <input
            type="number"
            step="0.01"
            value={tax}
            onChange={(e) => setTax(e.target.value)}
            className="w-full rounded-lg border border-norse-border bg-norse-card px-3 py-2 text-norse-text"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm text-norse-text-muted">
            Tip
          </label>
          <input
            type="number"
            step="0.01"
            value={tip}
            onChange={(e) => setTip(e.target.value)}
            className="w-full rounded-lg border border-norse-border bg-norse-card px-3 py-2 text-norse-text"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-norse-text-muted">
            Total
          </label>
          <input
            type="number"
            step="0.01"
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            className="w-full rounded-lg border border-norse-border bg-norse-card px-3 py-2 text-norse-text"
            required
          />
        </div>
      </div>

      <ClanSelector value={entity} onChange={setEntity} />
      <RuneSelector value={category} onChange={setCategory} />
      <WarChestSelector
        value={paymentMethod}
        cardNickname={cardNickname}
        onChange={(pm, nick) => {
          setPaymentMethod(pm);
          setCardNickname(nick);
        }}
      />

      <div>
        <label className="mb-1 block text-sm text-norse-text-muted">
          Description
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border border-norse-border bg-norse-card px-3 py-2 text-norse-text"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-norse-text-muted">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-norse-border bg-norse-card px-3 py-2 text-norse-text"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-lg bg-norse-gold px-4 py-3 font-bold text-norse-bg disabled:opacity-50"
        >
          {saving ? "Etching..." : "Etch in Stone"}
        </button>

        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg bg-norse-danger px-4 py-3 font-bold text-white"
          >
            Cast into the Fire
          </button>
        )}
      </div>
    </form>
  );
}
