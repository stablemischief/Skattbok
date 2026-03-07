import { GoogleGenerativeAI } from "@google/generative-ai";
import { ReceiptExtractionSchema } from "./types";
import type { ReceiptExtraction } from "./types";

const PROMPT = `You are a receipt parsing assistant. Analyze this receipt image and extract the expense data.

Return ONLY a valid JSON object with these exact fields (no markdown, no code fences):
{
  "vendor": "merchant name as printed",
  "date": "YYYY-MM-DD",
  "currency": "USD",
  "subtotal": 0.00,
  "tax": 0.00,
  "total": 0.00,
  "line_items": [{"description": "item name", "amount": 0.00}],
  "description": "brief one-line description",
  "payment_method": "e.g. Amex ****1001 or empty string",
  "confidence": "high",
  "notes": ""
}

Rules:
- total, subtotal, tax must be numbers (not strings)
- date must be YYYY-MM-DD
- confidence must be "high", "medium", or "low"
- Return ONLY the JSON object, nothing else`;

export async function extractReceiptData(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp"
): Promise<ReceiptExtraction> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
  console.log("Gemini raw response:", text.substring(0, 200));

  // Strip markdown fences if present
  if (text.startsWith("```")) {
    text = text.replace(/^```[a-z]*\n?/, "").replace(/\n?```$/, "").trim();
  }

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error(`Gemini returned invalid JSON: ${text.substring(0, 100)}`);
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
