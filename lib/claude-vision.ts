import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ReceiptExtraction } from "./types";

const PROMPT = `You are a receipt parsing assistant. Look carefully at this receipt image and extract ALL visible expense data.

Return a single JSON object with these fields:
- vendor: the merchant/restaurant/store name exactly as printed
- date: the transaction date in YYYY-MM-DD format
- currency: "USD"
- subtotal: subtotal dollar amount as a number (e.g. 7.70)
- tax: tax dollar amount as a number (e.g. 0.75)
- tip: tip or gratuity amount as a number (e.g. 3.00). May be handwritten. Use 0 if no tip visible.
- total: grand total dollar amount as a number (e.g. 8.45)
- line_items: array of objects with "description" (string) and "amount" (number)
- description: brief one-line summary of what was purchased
- payment_method: payment method if visible (e.g. "Amex ****1001"), or ""
- confidence: "high", "medium", or "low"
- notes: other info like server name, check number, table number, etc.

CRITICAL: Extract ACTUAL dollar amounts from the receipt. Never use 0 as a placeholder.
Return ONLY the JSON object, no markdown, no explanation.`;

export async function extractReceiptData(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp",
  debug = false
): Promise<ReceiptExtraction & { _raw?: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" },
  });

  const result = await model.generateContent([
    { inlineData: { mimeType: mediaType, data: imageBase64 } },
    PROMPT,
  ]);

  const text = result.response.text().trim();
  console.log("Gemini response:", text.substring(0, 500));

  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("Gemini returned invalid JSON: " + text.substring(0, 300));
  }

  const toNum = (v: unknown): number => {
    if (typeof v === "number" && !isNaN(v)) return v;
    if (typeof v === "string") return parseFloat(v.replace(/[^0-9.]/g, "")) || 0;
    return 0;
  };

  const lineItems = Array.isArray(raw.line_items)
    ? (raw.line_items as Array<Record<string, unknown>>).map((item) => ({
        description: String(item.description || ""),
        amount: toNum(item.amount),
      }))
    : [];

  const confidence = ["high", "medium", "low"].includes(String(raw.confidence))
    ? (raw.confidence as "high" | "medium" | "low")
    : "medium";

  return {
    vendor: String(raw.vendor || ""),
    date: String(raw.date || new Date().toISOString().split("T")[0]),
    currency: String(raw.currency || "USD"),
    subtotal: toNum(raw.subtotal),
    tax: toNum(raw.tax),
    tip: toNum(raw.tip),
    total: toNum(raw.total),
    line_items: lineItems,
    description: String(raw.description || raw.vendor || ""),
    payment_method: raw.payment_method ? String(raw.payment_method) : undefined,
    confidence,
    notes: raw.notes ? String(raw.notes) : undefined,
    ...(debug ? { _raw: text } : {}),
  };
}
