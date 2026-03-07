import Anthropic from "@anthropic-ai/sdk";
import { ReceiptExtractionSchema } from "./types";
import type { ReceiptExtraction } from "./types";

const SYSTEM_PROMPT = `You are a receipt parsing assistant. Analyze the provided receipt image and extract structured expense data.

Return ONLY a valid JSON object with these fields:
- vendor (string): merchant name exactly as printed
- date (string): in YYYY-MM-DD format. If ambiguous (e.g., 03/04), prefer MM/DD (US format)
- currency (string): defaults to "USD" unless otherwise indicated
- subtotal (number, optional): subtotal amount
- tax (number, optional): tax amount
- total (number): total amount
- line_items (array): each with "description" (string), "amount" (number), and optionally "quantity" (number)
- description (string): brief description of the expense
- payment_method (string, optional): e.g., "VISA ****1234" if visible
- confidence ("high" | "medium" | "low"): "high" if all key fields are clearly readable, "medium" if some fields are unclear, "low" if the image is poor quality
- notes (string, optional): any relevant notes (e.g., "tip included", "partial payment")

If you cannot read a field, omit it or use a reasonable default. Return ONLY the JSON object, no markdown fences or extra text.`;

export async function extractReceiptData(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp"
): Promise<ReceiptExtraction> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
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
            text: "Extract the expense data from this receipt. Return only a JSON object.",
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  const raw = JSON.parse(textBlock.text);
  return ReceiptExtractionSchema.parse(raw);
}
