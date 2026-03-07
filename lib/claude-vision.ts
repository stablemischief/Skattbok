import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { ReceiptExtraction } from "./types";

const RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    vendor: { type: SchemaType.STRING, description: "Merchant name as printed on receipt" },
    date: { type: SchemaType.STRING, description: "Transaction date in YYYY-MM-DD format" },
    currency: { type: SchemaType.STRING, description: "Currency code, e.g. USD" },
    subtotal: { type: SchemaType.NUMBER, description: "Subtotal amount before tax" },
    tax: { type: SchemaType.NUMBER, description: "Tax amount" },
    total: { type: SchemaType.NUMBER, description: "Grand total amount paid" },
    line_items: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          description: { type: SchemaType.STRING },
          amount: { type: SchemaType.NUMBER },
        },
        required: ["description", "amount"],
      },
    },
    description: { type: SchemaType.STRING, description: "Brief summary of the purchase" },
    payment_method: { type: SchemaType.STRING, description: "Payment method, e.g. Amex ****1001" },
    confidence: { type: SchemaType.STRING, description: "high, medium, or low" },
    notes: { type: SchemaType.STRING, description: "Server name, check number, tip, etc." },
  },
  required: ["vendor", "date", "total", "confidence"],
};

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
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  });

  const result = await model.generateContent([
    { inlineData: { mimeType: mediaType, data: imageBase64 } },
    "Extract all expense data from this receipt image. Look carefully for the merchant name, date, subtotal, tax, and total amount. If the receipt shows dollar amounts, extract the exact numbers.",
  ]);

  const text = result.response.text().trim();
  console.log("Gemini structured response:", text.substring(0, 500));

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
    total: toNum(raw.total),
    line_items: lineItems,
    description: String(raw.description || raw.vendor || ""),
    payment_method: raw.payment_method ? String(raw.payment_method) : undefined,
    confidence,
    notes: raw.notes ? String(raw.notes) : undefined,
    ...(debug ? { _raw: text } : {}),
  };
}
