import Anthropic from "@anthropic-ai/sdk";
import { ReceiptExtractionSchema } from "./types";
import type { ReceiptExtraction } from "./types";

const SYSTEM_PROMPT = `You are a receipt parsing assistant. Analyze the provided receipt image and extract structured expense data.

Return ONLY a valid JSON object with these exact fields:
{
  "vendor": "merchant name as printed",
  "date": "YYYY-MM-DD",
  "currency": "USD",
  "subtotal": 0.00,
  "tax": 0.00,
  "total": 0.00,
  "line_items": [{"description": "item", "amount": 0.00}],
  "description": "brief description",
  "payment_method": "VISA ****1234 or empty string",
  "confidence": "high",
  "notes": ""
}

Rules:
- total must be a number (e.g. 8.45, not "8.45")
- date must be YYYY-MM-DD format
- confidence must be exactly "high", "medium", or "low"
- Return ONLY the JSON object, no markdown, no code fences, no extra text`;

export async function extractReceiptData(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp"
): Promise<ReceiptExtraction> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const response = await anthropic.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: "Extract the expense data from this receipt. Return only valid JSON.",
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  // Strip markdown fences if Claude added them anyway
  let text = textBlock.text.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```[a-z]*\n?/, "").replace(/\n?```$/, "").trim();
  }

  console.log("Claude raw response:", text.substring(0, 200));

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    throw new Error(`Claude returned invalid JSON: ${text.substring(0, 100)}`);
  }

  // Coerce total/subtotal/tax to numbers if they came as strings
  if (raw && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    if (typeof r.total === "string") r.total = parseFloat(r.total) || 0;
    if (typeof r.subtotal === "string") r.subtotal = parseFloat(r.subtotal) || 0;
    if (typeof r.tax === "string") r.tax = parseFloat(r.tax) || 0;
    if (!r.confidence) r.confidence = "medium";
    if (!r.description) r.description = "";
    if (!r.currency) r.currency = "USD";
    if (!r.line_items) r.line_items = [];
  }

  return ReceiptExtractionSchema.parse(raw);
}
