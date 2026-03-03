"use client";

import { useState } from "react";
import { DEFAULT_PAYMENT_METHODS } from "@/lib/defaults";
import type { PaymentMethod } from "@/lib/types";

const PM_STORAGE_KEY = "skattbok-payment-methods";

export function getStoredPaymentMethods(): PaymentMethod[] {
  if (typeof window === "undefined") return DEFAULT_PAYMENT_METHODS;
  const raw = localStorage.getItem(PM_STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(
      PM_STORAGE_KEY,
      JSON.stringify(DEFAULT_PAYMENT_METHODS)
    );
    return DEFAULT_PAYMENT_METHODS;
  }
  return JSON.parse(raw) as PaymentMethod[];
}

export function savePaymentMethods(methods: PaymentMethod[]): void {
  localStorage.setItem(PM_STORAGE_KEY, JSON.stringify(methods));
}

function formatPaymentMethod(pm: PaymentMethod): string {
  if (pm.lastFour) {
    return `${pm.nickname} (${pm.type} ****${pm.lastFour})`;
  }
  return pm.nickname;
}

interface WarChestSelectorProps {
  value: string;
  cardNickname: string;
  onChange: (paymentMethod: string, cardNickname: string) => void;
}

export function WarChestSelector({
  cardNickname,
  onChange,
}: WarChestSelectorProps) {
  const [methods] = useState<PaymentMethod[]>(() => getStoredPaymentMethods());

  function handleChange(selectedId: string) {
    const method = methods.find((m) => m.id === selectedId);
    if (method) {
      onChange(method.type, method.nickname);
    }
  }

  // Find selected by matching nickname
  const selectedId =
    methods.find((m) => m.nickname === cardNickname)?.id ?? "";

  return (
    <div>
      <label className="mb-1 block text-sm text-norse-text-muted">
        War Chest (Payment Method)
      </label>
      <select
        value={selectedId}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full rounded-lg border border-norse-border bg-norse-card px-3 py-2 text-norse-text"
      >
        <option value="">Select payment method...</option>
        {methods.map((pm) => (
          <option key={pm.id} value={pm.id}>
            {formatPaymentMethod(pm)}
          </option>
        ))}
      </select>
    </div>
  );
}
