import { NextResponse } from "next/server";
import { extractReceiptData } from "@/lib/claude-vision";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

type AllowedMediaType = (typeof ALLOWED_TYPES)[number];

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("receipt");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No receipt image provided" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type as AllowedMediaType)) {
      return NextResponse.json(
        { error: "Invalid image type. Supported: JPEG, PNG, GIF, WebP" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Image too large. Maximum size is 5MB" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    const extraction = await extractReceiptData(
      base64,
      file.type as AllowedMediaType
    );

    return NextResponse.json({ success: true, data: extraction });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("rate_limit_error")
    ) {
      return NextResponse.json(
        { error: "Rate limited. Please try again in a moment." },
        { status: 429 }
      );
    }

    console.error("Receipt extraction error:", error);
    return NextResponse.json(
      {
        error: "The ravens couldn't read this scroll. Enter the details by hand.",
        fallback: true,
      },
      { status: 422 }
    );
  }
}
