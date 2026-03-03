"use client";

import { useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { BottomNav } from "@/components/bottom-nav";
import { useToast } from "@/components/toast";
import { getStoredClans, saveClans } from "@/components/clan-selector";
import { getStoredRunes, saveRunes } from "@/components/rune-selector";
import {
  getStoredPaymentMethods,
  savePaymentMethods,
} from "@/components/war-chest-selector";
import { PROTECTED_PAYMENT_METHOD_IDS } from "@/lib/defaults";
import type { Clan, Rune, PaymentMethod } from "@/lib/types";

function SectionHeader({
  name,
  label,
  openSection,
  onToggle,
}: {
  name: string;
  label: string;
  openSection: string | null;
  onToggle: (name: string) => void;
}) {
  return (
    <button
      onClick={() => onToggle(name)}
      className="flex w-full items-center justify-between rounded-lg border border-norse-border bg-norse-card p-4"
    >
      <span className="font-semibold text-norse-text">{label}</span>
      <span className="text-norse-text-muted">
        {openSection === name ? "−" : "+"}
      </span>
    </button>
  );
}

export default function ForgePage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { showToast } = useToast();

  // Clans
  const [clans, setClans] = useState<Clan[]>(() => getStoredClans());
  const [newClanName, setNewClanName] = useState("");

  // Runes
  const [runes, setRunes] = useState<Rune[]>(() => getStoredRunes());
  const [newRuneName, setNewRuneName] = useState("");

  // War Chest
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(() => getStoredPaymentMethods());
  const [newPMType, setNewPMType] = useState("visa");
  const [newPMLastFour, setNewPMLastFour] = useState("");
  const [newPMNickname, setNewPMNickname] = useState("");

  // Export
  const [exportEntity, setExportEntity] = useState("");
  const [exportYear, setExportYear] = useState(
    String(new Date().getFullYear())
  );
  const [exportFormat, setExportFormat] = useState("standard");

  // Sections
  const [openSection, setOpenSection] = useState<string | null>(null);

  function toggleSection(name: string) {
    setOpenSection(openSection === name ? null : name);
  }

  // --- Clan operations ---
  function addClan() {
    if (!newClanName.trim()) return;
    const updated = [
      ...clans,
      { id: `clan-${Date.now()}`, name: newClanName.trim() },
    ];
    saveClans(updated);
    setClans(updated);
    setNewClanName("");
    showToast("Clan added", "success");
  }

  function deleteClan(id: string) {
    const updated = clans.filter((c) => c.id !== id);
    saveClans(updated);
    setClans(updated);
    showToast("Clan removed", "success");
  }

  // --- Rune operations ---
  function addRune() {
    if (!newRuneName.trim()) return;
    const updated = [
      ...runes,
      { id: `rune-${Date.now()}`, name: newRuneName.trim() },
    ];
    saveRunes(updated);
    setRunes(updated);
    setNewRuneName("");
    showToast("Rune added", "success");
  }

  function deleteRune(id: string) {
    const updated = runes.filter((r) => r.id !== id);
    saveRunes(updated);
    setRunes(updated);
    showToast("Rune removed", "success");
  }

  // --- Payment Method operations ---
  function addPaymentMethod() {
    if (!newPMNickname.trim()) return;
    const updated = [
      ...paymentMethods,
      {
        id: `pm-${Date.now()}`,
        type: newPMType,
        lastFour: newPMLastFour || undefined,
        nickname: newPMNickname.trim(),
      },
    ];
    savePaymentMethods(updated);
    setPaymentMethods(updated);
    setNewPMType("visa");
    setNewPMLastFour("");
    setNewPMNickname("");
    showToast("Payment method added", "success");
  }

  function deletePaymentMethod(id: string) {
    if (PROTECTED_PAYMENT_METHOD_IDS.includes(id)) {
      showToast("Cannot delete Cash or Other", "warning");
      return;
    }
    const updated = paymentMethods.filter((p) => p.id !== id);
    savePaymentMethods(updated);
    setPaymentMethods(updated);
    showToast("Payment method removed", "success");
  }

  // --- Export ---
  function handleExport() {
    if (!exportEntity) {
      showToast("Select a clan to export", "warning");
      return;
    }
    const url = `/api/export?entity=${encodeURIComponent(exportEntity)}&year=${exportYear}&format=${exportFormat}`;
    window.open(url, "_blank");
    showToast("Ravens dispatched!", "success");
  }

  return (
    <div className="min-h-screen bg-norse-bg pb-24 pt-safe">
      <div className="px-4 py-6">
        <h1 className="mb-1 text-2xl font-bold text-norse-gold">The Forge</h1>
        <p className="mb-6 text-sm text-norse-text-muted">Settings</p>

        <div className="space-y-3">
          {/* --- CLANS --- */}
          <SectionHeader
            name="clans"
            label="Clans (Entities)"
            openSection={openSection}
            onToggle={toggleSection}
          />
          {openSection === "clans" && (
            <div className="space-y-2 rounded-lg border border-norse-border bg-norse-card p-4">
              {clans.map((clan) => (
                <div
                  key={clan.id}
                  className="flex items-center justify-between"
                >
                  <span className="text-norse-text">{clan.name}</span>
                  <button
                    onClick={() => deleteClan(clan.id)}
                    className="text-sm text-norse-danger"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={newClanName}
                  onChange={(e) => setNewClanName(e.target.value)}
                  placeholder="New clan name..."
                  className="flex-1 rounded-lg border border-norse-border bg-norse-bg px-3 py-2 text-norse-text"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addClan();
                  }}
                />
                <button
                  onClick={addClan}
                  className="rounded-lg bg-norse-gold px-3 py-2 font-semibold text-norse-bg"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* --- RUNES --- */}
          <SectionHeader
            name="runes"
            label="Runes (Categories)"
            openSection={openSection}
            onToggle={toggleSection}
          />
          {openSection === "runes" && (
            <div className="space-y-2 rounded-lg border border-norse-border bg-norse-card p-4">
              {runes.map((rune) => (
                <div
                  key={rune.id}
                  className="flex items-center justify-between"
                >
                  <span className="text-norse-text">{rune.name}</span>
                  <button
                    onClick={() => deleteRune(rune.id)}
                    className="text-sm text-norse-danger"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={newRuneName}
                  onChange={(e) => setNewRuneName(e.target.value)}
                  placeholder="New rune name..."
                  className="flex-1 rounded-lg border border-norse-border bg-norse-bg px-3 py-2 text-norse-text"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addRune();
                  }}
                />
                <button
                  onClick={addRune}
                  className="rounded-lg bg-norse-gold px-3 py-2 font-semibold text-norse-bg"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* --- WAR CHEST --- */}
          <SectionHeader
            name="warchest"
            label="War Chest (Payment Methods)"
            openSection={openSection}
            onToggle={toggleSection}
          />
          {openSection === "warchest" && (
            <div className="space-y-2 rounded-lg border border-norse-border bg-norse-card p-4">
              {paymentMethods.map((pm) => (
                <div
                  key={pm.id}
                  className="flex items-center justify-between"
                >
                  <span className="text-norse-text">
                    {pm.nickname}
                    {pm.lastFour && (
                      <span className="text-norse-text-muted">
                        {" "}
                        ({pm.type} ****{pm.lastFour})
                      </span>
                    )}
                  </span>
                  {!PROTECTED_PAYMENT_METHOD_IDS.includes(pm.id) && (
                    <button
                      onClick={() => deletePaymentMethod(pm.id)}
                      className="text-sm text-norse-danger"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <div className="space-y-2 pt-2">
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={newPMType}
                    onChange={(e) => setNewPMType(e.target.value)}
                    className="rounded-lg border border-norse-border bg-norse-bg px-2 py-2 text-sm text-norse-text"
                  >
                    <option value="visa">Visa</option>
                    <option value="mastercard">Mastercard</option>
                    <option value="amex">Amex</option>
                    <option value="discover">Discover</option>
                    <option value="debit">Debit</option>
                  </select>
                  <input
                    type="text"
                    value={newPMLastFour}
                    onChange={(e) =>
                      setNewPMLastFour(e.target.value.slice(0, 4))
                    }
                    placeholder="Last 4"
                    maxLength={4}
                    className="rounded-lg border border-norse-border bg-norse-bg px-2 py-2 text-sm text-norse-text"
                  />
                  <input
                    type="text"
                    value={newPMNickname}
                    onChange={(e) => setNewPMNickname(e.target.value)}
                    placeholder="Nickname"
                    className="rounded-lg border border-norse-border bg-norse-bg px-2 py-2 text-sm text-norse-text"
                  />
                </div>
                <button
                  onClick={addPaymentMethod}
                  className="w-full rounded-lg bg-norse-gold px-3 py-2 font-semibold text-norse-bg"
                >
                  Add Card
                </button>
              </div>
            </div>
          )}

          {/* --- GOOGLE CONNECTION --- */}
          <SectionHeader
            name="google"
            label="Google Connection"
            openSection={openSection}
            onToggle={toggleSection}
          />
          {openSection === "google" && (
            <div className="rounded-lg border border-norse-border bg-norse-card p-4">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-norse-success" />
                <span className="text-norse-text">
                  Connected as{" "}
                  {user?.primaryEmailAddress?.emailAddress ?? "—"}
                </span>
              </div>
              <p className="mt-2 text-sm text-norse-text-muted">
                Google Sheets and Drive access is managed through your Clerk
                sign-in.
              </p>
            </div>
          )}

          {/* --- EXPORT --- */}
          <SectionHeader
            name="export"
            label="Send the Ravens (Export)"
            openSection={openSection}
            onToggle={toggleSection}
          />
          {openSection === "export" && (
            <div className="space-y-3 rounded-lg border border-norse-border bg-norse-card p-4">
              <select
                value={exportEntity}
                onChange={(e) => setExportEntity(e.target.value)}
                className="w-full rounded-lg border border-norse-border bg-norse-bg px-3 py-2 text-norse-text"
              >
                <option value="">Select Clan...</option>
                {clans.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={exportYear}
                onChange={(e) => setExportYear(e.target.value)}
                className="w-full rounded-lg border border-norse-border bg-norse-bg px-3 py-2 text-norse-text"
              />
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="w-full rounded-lg border border-norse-border bg-norse-bg px-3 py-2 text-norse-text"
              >
                <option value="standard">CSV (Standard)</option>
                <option value="quickbooks">CSV (QuickBooks)</option>
              </select>
              <button
                onClick={handleExport}
                className="w-full rounded-lg bg-norse-gold px-4 py-3 font-bold text-norse-bg"
              >
                Send the Ravens
              </button>
            </div>
          )}

          {/* --- ACCOUNT --- */}
          <SectionHeader
            name="account"
            label="Account"
            openSection={openSection}
            onToggle={toggleSection}
          />
          {openSection === "account" && (
            <div className="rounded-lg border border-norse-border bg-norse-card p-4">
              <p className="mb-3 text-norse-text">
                Signed in as{" "}
                {user?.primaryEmailAddress?.emailAddress ?? "—"}
              </p>
              <button
                onClick={() => signOut()}
                className="w-full rounded-lg bg-norse-danger px-4 py-2 font-semibold text-white"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
