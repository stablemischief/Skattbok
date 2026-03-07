import { NextResponse } from "next/server";
import { extractReceiptData } from "@/lib/claude-vision";

// Extend Vercel serverless function timeout to 60s
export const maxDuration = 60;

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

    // iOS Safari sometimes sends images as "image/heic" or with empty type
    const fileType = file.type || "image/jpeg";
    if (!ALLOWED_TYPES.includes(fileType as AllowedMediaType)) {
      console.error(
        `Receipt extraction: unsupported image type "${file.type}" (size: ${file.size}, name: ${file.name})`
      );
      return NextResponse.json(
        {
          error: `Unsupported image type "${file.type || "unknown"}". Supported: JPEG, PNG, GIF, WebP. Try taking a screenshot of the receipt instead.`,
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Image too large. Maximum size is 5MB" },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      console.error("Receipt extraction: received empty file");
      return NextResponse.json(
        { error: "Image file is empty. Please retake the photo." },
        { status: 400 }
      );
    }

    console.log(
      `Receipt extraction: processing ${fileType}, size=${file.size}, name=${file.name}`
    );

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("Receipt extraction: ANTHROPIC_API_KEY is not set");
      return NextResponse.json(
        { error: "AI service not configured. Please contact support." },
        { status: 503 }
      );
    }

    const extraction = await extractReceiptData(
      base64,
      fileType as AllowedMediaType
    );

    return NextResponse.json({ success: true, data: extraction });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const errStack = error instanceof Error ? error.stack : undefined;

    console.error("Receipt extraction error:", {
      message: errMsg,
      stack: errStack,
      type: error instanceof Error ? error.constructor.name : typeof error,
    });

    if (errMsg.includes("rate_limit_error")) {
      return NextResponse.json(
        { error: "Rate limited. Please try again in a moment." },
        { status: 429 }
      );
    }

    if (errMsg.includes("invalid_api_key") || errMsg.includes("authentication_error")) {
      return NextResponse.json(
        { error: "AI service authentication failed. Please contact support." },
        { status: 503 }
      );
    }

    if (errMsg.includes("Could not process image") || errMsg.includes("invalid_request_error")) {
      return NextResponse.json(
        {
          error: "Could not process this image. Try a clearer photo or a different angle.",
          fallback: true,
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      {
        error: "The ravens couldn't read this scroll. Enter the details by hand.",
        fallback: true,
      },
      { status: 422 }
    );
  }
}
