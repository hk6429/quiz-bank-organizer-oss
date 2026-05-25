import { NextRequest, NextResponse } from "next/server";
import { parseRawText, autoTag, detectMisconception } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload } = body as { action: string; payload: unknown };

    switch (action) {
      case "parse_raw": {
        const { rawText, context } = payload as Parameters<typeof parseRawText>[1] extends infer C
          ? { rawText: string; context: C }
          : never;
        const out = await parseRawText(rawText, context as never);
        return NextResponse.json({ ok: true, data: out });
      }
      case "auto_tag": {
        const { question, unitTree } = payload as {
          question: Parameters<typeof autoTag>[0];
          unitTree: string[];
        };
        const out = await autoTag(question, unitTree);
        return NextResponse.json({ ok: true, data: out });
      }
      case "detect_misconception": {
        const out = await detectMisconception(payload as Parameters<typeof detectMisconception>[0]);
        return NextResponse.json({ ok: true, data: out });
      }
      default:
        return NextResponse.json(
          { ok: false, error: "UNKNOWN_ACTION", message: action },
          { status: 400 },
        );
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: "GEMINI_ERROR", message }, { status: 500 });
  }
}
