import { NextRequest, NextResponse } from "next/server";

async function proxy(req: NextRequest, method: "GET" | "POST") {
  // BYOK: prefer headers from client; fall back to env vars (self-hosted mode)
  const SHEETS_API_URL = req.headers.get("x-sheets-url") || process.env.SHEETS_API_URL || "";
  const SHEETS_API_SECRET =
    req.headers.get("x-sheets-secret") || process.env.SHEETS_API_SECRET || "";

  if (!SHEETS_API_URL || !SHEETS_API_SECRET) {
    return NextResponse.json(
      {
        ok: false,
        error: "BYOK_REQUIRED",
        message:
          "請先到「設定」貼上你的 Sheets API URL 與 Secret（或自架時設 env vars）",
      },
      { status: 400 },
    );
  }

  let url: URL;
  try {
    url = new URL(SHEETS_API_URL);
  } catch {
    return NextResponse.json(
      { ok: false, error: "BAD_URL", message: "Sheets API URL 格式錯誤" },
      { status: 400 },
    );
  }

  const incoming = new URL(req.url);
  for (const [k, v] of incoming.searchParams) url.searchParams.set(k, v);
  // Apps Script Web Apps don't expose HTTP headers — pass secret via query string
  url.searchParams.set("secret", SHEETS_API_SECRET);

  const init: RequestInit = {
    method,
    headers: {
      ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
    },
    ...(method === "POST" ? { body: await req.text() } : {}),
  };

  const res = await fetch(url.toString(), init);
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}

export const GET = (req: NextRequest) => proxy(req, "GET");
export const POST = (req: NextRequest) => proxy(req, "POST");
