import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { ReceiptExtractionSchema } from "./types";
import type { ReceiptExtraction } from "./types";

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `You are a receipt parsing assistant. Analyze the provided receipt image and extract structured expense data.

Instructions:
- Extract the vendor/merchant name exactly as printed
- Parse the date in YYYY-MM-DD format. If ambiguous (e.g., 03/04), prefer MM/DD (US format)
- Extract all line items with descriptions and amounts
- Identify subtotal, tax, and total amounts
- Currency defaults to USD unless otherwise indicated
- If a payment method is visible (e.g., "VISA ****1234"), extract it
- Set confidence to "high" if all key fields are clearly readable, "medium" if some fields are unclear, "low" if the image is poor quality
- Include any relevant notes about the receipt (e.g., "tip included", "partial payment")
- If you cannot read a field, omit it or use a reasonable default`;

export async function extractReceiptData(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp"
): Promise<ReceiptExtraction> {
  const response = await anthropic.messages.parse({
    model: "claude-sonnet-4-6",
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
            text: "Extract the expense data from this receipt.",
          },
        ],
      },
    ],
    output_config: {
      format: zodOutputFormat(ReceiptExtractionSchema),
    },
  });

  if (!response.parsed_output) {
    throw new Error("No parsed output from Claude");
  }

  return response.parsed_output;
}
