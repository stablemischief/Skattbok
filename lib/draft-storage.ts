import type { Expense, DraftExpense } from "./types";

const DRAFTS_KEY = "skattbok-drafts";

export function saveDraft(
  expense: Partial<Expense>,
  imageData?: string
): string {
  const drafts = getDrafts();
  const id = crypto.randomUUID();
  const draft: DraftExpense = {
    id,
    expense,
    imageData,
    savedAt: new Date().toISOString(),
  };
  drafts.push(draft);
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  return id;
}

export function getDrafts(): DraftExpense[] {
  const raw = localStorage.getItem(DRAFTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as DraftExpense[];
  } catch {
    return [];
  }
}

export function removeDraft(id: string): void {
  const drafts = getDrafts().filter((d) => d.id !== id);
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
}

export function hasDrafts(): boolean {
  return getDrafts().length > 0;
}
