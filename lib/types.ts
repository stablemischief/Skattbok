import { z } from "zod";

// --- Line Items ---

export const LineItemSchema = z.object({
  description: z.string(),
  amount: z.number(),
  quantity: z.number().optional(),
});

export type LineItem = z.infer<typeof LineItemSchema>;

// --- Receipt Extraction (Claude Vision response) ---

export const ReceiptExtractionSchema = z.object({
  vendor: z.string(),
  date: z.string(), // YYYY-MM-DD
  currency: z.string().default("USD"),
  subtotal: z.number().optional(),
  tax: z.number().optional(),
  total: z.number(),
  line_items: z.array(LineItemSchema).default([]),
  description: z.string().default(""),
  payment_method: z.string().optional(),
  confidence: z.enum(["high", "medium", "low"]),
  notes: z.string().optional(),
});

export type ReceiptExtraction = z.infer<typeof ReceiptExtractionSchema>;

// --- Expense (Google Sheets row) ---

export const ExpenseSchema = z.object({
  id: z.string(),
  date: z.string(), // YYYY-MM-DD
  vendor: z.string(),
  description: z.string(),
  category: z.string(),
  amount: z.number(),
  tax: z.number(),
  total: z.number(),
  paymentMethod: z.string(),
  cardNickname: z.string(),
  notes: z.string(),
  imageUrl: z.string(),
  createdAt: z.string(), // ISO 8601
});

export type Expense = z.infer<typeof ExpenseSchema>;

// --- Settings: Clans, Runes, Payment Methods ---

export const ClanSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type Clan = z.infer<typeof ClanSchema>;

export const RuneSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type Rune = z.infer<typeof RuneSchema>;

export const PaymentMethodSchema = z.object({
  id: z.string(),
  type: z.string(), // "visa", "mastercard", "amex", "cash", "other"
  lastFour: z.string().optional(),
  nickname: z.string(),
});

export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

// --- View modes ---

export type DashboardView = "by-month" | "by-category";

// --- Draft storage ---

export const DraftExpenseSchema = z.object({
  id: z.string(),
  expense: ExpenseSchema.partial(),
  imageData: z.string().optional(),
  savedAt: z.string(), // ISO 8601
});

export type DraftExpense = z.infer<typeof DraftExpenseSchema>;

// --- API response shapes ---

export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
};

export type ApiErrorResponse = {
  error: string;
  fallback?: boolean;
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
