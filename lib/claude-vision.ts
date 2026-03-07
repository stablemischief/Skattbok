import { GoogleGenerativeAI } from "@google/generative-ai";
import { ReceiptExtractionSchema } from "./types";
import type { ReceiptExtraction } from "./types";

const PROMPT = `You are a receipt parsing assistant. Look carefully at this receipt image and extract ALL visible expense data.

Return a single JSON object with these fields:
- vendor: the merchant/restaurant/store name exactly as printed
- date: the transaction date in YYYY-MM-DD format
- currency: currency code, default "USD"
- subtotal: the subtotal dollar amount as a number (e.g. 7.70)
- tax: the tax dollar amount as a number (e.g. 0.75)
- total: the grand total dollar amount as a number (e.g. 8.45)
- line_items: array of objects with "description" (string) and "amount" (number) for each item
- description: a brief one-line summary of what was purchased
- payment_method: payment method if visible (e.g. "Amex ****1001"), or empty string
- confidence: "high" if all key fields clearly readable, "medium" if some unclear, "low" if hard to read
- notes: any other relevant info such as server name, check number, tip amount, etc.

CRITICAL:
- Extract the ACTUAL dollar amounts visible on the receipt - never use 0 as a placeholder
- If you see "$8.45" as the total, return the number 8.45
- All amounts (subtotal, tax, total) must be real numbers extracted from the receipt
- Return ONLY the JSON object, no markdown fences, no explanation text`;

export async function extractReceiptData(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp"
): Promise<ReceiptExtraction> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: mediaType,
        data: imageBase64,
      },
    },
    PROMPT,
  ]);

  let text = result.response.text().trim();
  console.log("Gemini raw response:", text.substring(0, 500));

  // Strip markdown fences if present
  if (text.startsWith("\`\`\`")) {
    text = text.replace(/^\`\`\`[a-z]*\n?/, "").replace(/\n?\`\`\`$/, "").trim();
  }

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("Gemini returned invalid JSON: " + text.substring(0, 200));
  }

  // Coerce string numbers to actual numbers
  if (raw && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    if (typeof r.total === "string") r.total = parseFloat(r.total) || 0;
    if (typeof r.subtotal === "string") r.subtotal = parseFloat(r.subtotal) || 0;
    if (typeof r.tax === "string") r.tax = parseFloat(r.tax) || 0;
    if (!r.confidence) r.confidence = "medium";
    if (!r.description) r.description = String(r.vendor || "");
    if (!r.currency) r.currency = "USD";
    if (!Array.isArray(r.line_items)) r.line_items = [];
  }

  return ReceiptExtractionSchema.parse(raw);
}
