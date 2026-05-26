"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getByok, hasSheets, hasGemini } from "@/lib/byok";

export function SetupBanner() {
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");

  useEffect(() => {
    const c = getByok();
    setState(hasSheets(c) && hasGemini(c) ? "ready" : "missing");
  }, []);

  if (state === "loading") return null;

  if (state === "ready") {
    return (
      <div className="card-tech flex items-center gap-3 rounded-xl border-primary/40 p-4">
        <span className="inline-block size-2 animate-pulse rounded-full bg-primary" />
        <p className="text-sm">
          <strong className="text-primary">API ready</strong> · 你已設定 keys，可以開始用所有功能。
          需要修改到{" "}
          <Link href="/setup" className="underline">設定頁</Link>。
        </p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-destructive/40 bg-destructive/5 p-5">
      <div className="absolute -right-8 -top-8 size-32 rounded-full bg-destructive/10 blur-2xl" />
      <div className="relative flex items-start gap-3">
        <span className="mt-1 inline-block size-2 animate-pulse rounded-full bg-destructive" />
        <div className="flex-1">
          <p className="font-medium">
            <span className="font-mono text-xs uppercase tracking-wider text-destructive">⚠ setup required</span>
            {" — "}尚未設定 API keys
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            這個 demo 不替訪客付 API 費用。請貼上你自己的 Sheets URL + Secret + Gemini key
            （只存在這個瀏覽器分頁，關掉就消失）。
          </p>
          <Link
            href="/setup"
            className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
          >
            ⚙ 前往設定 →
          </Link>
        </div>
      </div>
    </div>
  );
}
