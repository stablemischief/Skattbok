import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function GET() {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  const result: Record<string, unknown> = {
    anthropic_key: anthropicKey ? `set (${anthropicKey.substring(0,10)}...)` : "MISSING",
    gemini_key: geminiKey ? `set (${geminiKey.substring(0,10)}...)` : "MISSING",
  };

  // Test Anthropic
  try {
    const anthropic = new Anthropic({ apiKey: anthropicKey });
    const r = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 10,
      messages: [{ role: "user", content: "Say: ok" }],
    });
    result.anthropic_test = (r.content[0] as {text:string}).text;
  } catch (e) {
    result.anthropic_test = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
  }

  // Test Gemini
  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(geminiKey!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });
    const r = await model.generateContent("Say: ok");
    result.gemini_test = r.response.text().trim().substring(0, 50);
  } catch (e) {
    result.gemini_test = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
  }

  return NextResponse.json(result);
}
