"use client";

import { useState } from "react";
import { DEFAULT_RUNES } from "@/lib/defaults";
import type { Rune } from "@/lib/types";

const RUNES_STORAGE_KEY = "skattbok-runes";

export function getStoredRunes(): Rune[] {
  if (typeof window === "undefined") return DEFAULT_RUNES;
  const raw = localStorage.getItem(RUNES_STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(RUNES_STORAGE_KEY, JSON.stringify(DEFAULT_RUNES));
    return DEFAULT_RUNES;
  }
  return JSON.parse(raw) as Rune[];
}

export function saveRunes(runes: Rune[]): void {
  localStorage.setItem(RUNES_STORAGE_KEY, JSON.stringify(runes));
}

interface RuneSelectorProps {
  value: string;
  onChange: (runeName: string) => void;
}

export function RuneSelector({ value, onChange }: RuneSelectorProps) {
  const [runes, setRunes] = useState<Rune[]>(() => getStoredRunes());
  const [isAdding, setIsAdding] = useState(false);
  const [newRuneName, setNewRuneName] = useState("");

  function handleAddRune() {
    if (!newRuneName.trim()) return;
    const newRune: Rune = {
      id: `rune-${Date.now()}`,
      name: newRuneName.trim(),
    };
    const updated = [...runes, newRune];
    saveRunes(updated);
    setRunes(updated);
    onChange(newRune.name);
    setNewRuneName("");
    setIsAdding(false);
  }

  function handleSelectChange(val: string) {
    if (val === "__add_new__") {
      setIsAdding(true);
    } else {
      onChange(val);
    }
  }

  return (
    <div>
      <label className="mb-1 block text-sm text-norse-text-muted">
        Rune (Category)
      </label>
      {isAdding ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={newRuneName}
            onChange={(e) => setNewRuneName(e.target.value)}
            placeholder="New category name..."
            className="flex-1 rounded-lg border border-norse-border bg-norse-card px-3 py-2 text-norse-text"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddRune();
              if (e.key === "Escape") setIsAdding(false);
            }}
          />
          <button
            type="button"
            onClick={handleAddRune}
            className="rounded-lg bg-norse-gold px-3 py-2 font-semibold text-norse-bg"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setIsAdding(false)}
            className="rounded-lg border border-norse-border px-3 py-2 text-norse-text-muted"
          >
            Cancel
          </button>
        </div>
      ) : (
        <select
          value={value}
          onChange={(e) => handleSelectChange(e.target.value)}
          className="w-full rounded-lg border border-norse-border bg-norse-card px-3 py-2 text-norse-text"
          required
        >
          <option value="">Select a Rune...</option>
          {runes.map((rune) => (
            <option key={rune.id} value={rune.name}>
              {rune.name}
            </option>
          ))}
          <option value="__add_new__">+ Add new...</option>
        </select>
      )}
    </div>
  );
}
