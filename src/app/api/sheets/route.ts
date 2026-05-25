import { NextRequest, NextResponse } from "next/server";

const SHEETS_API_URL = process.env.SHEETS_API_URL!;
const SHEETS_API_SECRET = process.env.SHEETS_API_SECRET!;

async function proxy(req: NextRequest, method: "GET" | "POST") {
  if (!SHEETS_API_URL || !SHEETS_API_SECRET) {
    return NextResponse.json(
      { ok: false, error: "CONFIG", message: "SHEETS_API_URL / SHEETS_API_SECRET 未設定" },
      { status: 500 },
    );
  }

  const url = new URL(SHEETS_API_URL);
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
