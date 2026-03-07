import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function GET() {
  try {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) return NextResponse.json({ error: "No API key set" }, { status: 500 });
    const anthropic = new Anthropic({ apiKey: key });
    const response = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 10,
      messages: [{ role: "user", content: "Say: ok" }],
    });
    return NextResponse.json({ ok: true, reply: (response.content[0] as {text:string}).text });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
