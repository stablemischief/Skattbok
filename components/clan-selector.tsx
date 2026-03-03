"use client";

import { useState } from "react";
import { DEFAULT_CLANS } from "@/lib/defaults";
import type { Clan } from "@/lib/types";

const CLANS_STORAGE_KEY = "skattbok-clans";

export function getStoredClans(): Clan[] {
  if (typeof window === "undefined") return DEFAULT_CLANS;
  const raw = localStorage.getItem(CLANS_STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(CLANS_STORAGE_KEY, JSON.stringify(DEFAULT_CLANS));
    return DEFAULT_CLANS;
  }
  return JSON.parse(raw) as Clan[];
}

export function saveClans(clans: Clan[]): void {
  localStorage.setItem(CLANS_STORAGE_KEY, JSON.stringify(clans));
}

interface ClanSelectorProps {
  value: string;
  onChange: (clanName: string) => void;
}

export function ClanSelector({ value, onChange }: ClanSelectorProps) {
  const [clans] = useState<Clan[]>(() => getStoredClans());

  return (
    <div>
      <label className="mb-1 block text-sm text-norse-text-muted">
        Clan (Entity)
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-norse-border bg-norse-card px-3 py-2 text-norse-text"
        required
      >
        <option value="">Select a Clan...</option>
        {clans.map((clan) => (
          <option key={clan.id} value={clan.name}>
            {clan.name}
          </option>
        ))}
      </select>
    </div>
  );
}
