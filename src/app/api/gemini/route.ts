import { NextRequest, NextResponse } from "next/server";
import { parseRawText, autoTag, detectMisconception } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    // BYOK: client-supplied key takes precedence over server env
    const userKey = req.headers.get("x-gemini-key") || undefined;
    if (!userKey && !process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          ok: false,
          error: "BYOK_REQUIRED",
          message: "請先到「設定」貼上你的 Gemini API key",
        },
        { status: 400 },
      );
    }

    const body = await req.json();
    const { action, payload } = body as { action: string; payload: unknown };

    switch (action) {
      case "parse_raw": {
        const { rawText, context } = payload as Parameters<typeof parseRawText>[1] extends infer C
          ? { rawText: string; context: C }
          : never;
        const out = await parseRawText(rawText, context as never, userKey);
        return NextResponse.json({ ok: true, data: out });
      }
      case "auto_tag": {
        const { question, unitTree } = payload as {
          question: Parameters<typeof autoTag>[0];
          unitTree: string[];
        };
        const out = await autoTag(question, unitTree, userKey);
        return NextResponse.json({ ok: true, data: out });
      }
      case "detect_misconception": {
        const out = await detectMisconception(
          payload as Parameters<typeof detectMisconception>[0],
          userKey,
        );
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
