"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getByok, setByok, clearByok, hasSheets, hasGemini } from "@/lib/byok";

export default function SetupPage() {
  const router = useRouter();
  const [sheetsUrl, setSheetsUrl] = useState("");
  const [sheetsSecret, setSheetsSecret] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const c = getByok();
    setSheetsUrl(c.sheetsUrl);
    setSheetsSecret(c.sheetsSecret);
    setGeminiKey(c.geminiKey);
  }, []);

  function save(e: React.FormEvent) {
    e.preventDefault();
    setByok({ sheetsUrl: sheetsUrl.trim(), sheetsSecret: sheetsSecret.trim(), geminiKey: geminiKey.trim() });
    setSaved(true);
    setTimeout(() => router.push("/"), 600);
  }

  function clear() {
    if (!confirm("確定要清除這個分頁所有 API 設定？")) return;
    clearByok();
    setSheetsUrl("");
    setSheetsSecret("");
    setGeminiKey("");
  }

  const status = {
    sheets: hasSheets({ sheetsUrl, sheetsSecret, geminiKey }),
    gemini: hasGemini({ sheetsUrl, sheetsSecret, geminiKey }),
  };

  return (
    <main className="container mx-auto max-w-2xl px-6 py-12">
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-primary">
        <span className="inline-block size-1.5 animate-pulse rounded-full bg-primary" />
        BYOK · session-only
      </div>

      <h1 className="text-3xl font-bold tracking-tight text-gradient-tech">設定你的 API Keys</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        這是 OSS demo。所有 key 只存在你的瀏覽器分頁記憶體（sessionStorage），
        <strong className="text-foreground">關掉分頁就消失</strong>，不會送到任何伺服器永久保存。
      </p>
      <div className="mt-4">
        <Link
          href="/how-to"
          className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
        >
          📘 第一次來？看完整教學（15–20 分鐘）→
        </Link>
      </div>

      <Card className="card-tech mt-6 p-6">
        <form onSubmit={save} className="space-y-5">
          <Section
            label="① Google Sheets Apps Script URL"
            hint={
              <>
                你部署的 Apps Script Web App URL。沒有？
                <Link href="/how-to#step-2" className="ml-1 text-primary underline">教我做一個 →</Link>
                {" · "}
                <a
                  href="https://script.google.com/home"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  開 script.google.com ↗
                </a>
              </>
            }
            ok={status.sheets}
          >
            <Input
              type="text"
              value={sheetsUrl}
              onChange={(e) => setSheetsUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/<部署ID>/exec"
              className="font-mono text-xs"
            />
          </Section>

          <Section
            label="② Sheets API Secret"
            hint={
              <>
                你自己用 <code className="rounded bg-muted/40 px-1 font-mono text-[10px]">openssl rand -hex 32</code> 產的 64 字元字串，
                跟 Apps Script Script Property 一致。
                <Link href="/how-to#step-4" className="ml-1 text-primary underline">教我產一個 →</Link>
              </>
            }
            ok={status.sheets}
          >
            <Input
              type="password"
              value={sheetsSecret}
              onChange={(e) => setSheetsSecret(e.target.value)}
              placeholder="64-char hex"
              className="font-mono text-xs"
            />
          </Section>

          <Section
            label="③ Gemini API Key"
            hint={
              <>
                到{" "}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  aistudio.google.com/apikey ↗
                </a>{" "}
                免費取得（每日 1500 次 quota）。
                <Link href="/how-to#step-1" className="ml-1 text-primary underline">教我拿 →</Link>
              </>
            }
            ok={status.gemini}
          >
            <Input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="font-mono text-xs"
            />
          </Section>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" className="font-medium">
              {saved ? "已儲存，導向首頁…" : "💾 儲存到此分頁"}
            </Button>
            <button
              type="button"
              onClick={clear}
              className="rounded-md border border-border/60 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
            >
              清除
            </button>
          </div>
        </form>
      </Card>

      <Card className="card-tech mt-6 p-6">
        <h2 className="text-lg font-bold">為什麼需要貼你自己的 keys？</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>• 這是 open source demo，作者不想用自己的 API 配額幫所有訪客付錢</li>
          <li>• 你的 Sheets 是你的資料，作者也不該替你保管</li>
          <li>• <strong className="text-foreground">關掉分頁所有 key 立刻消失</strong>（sessionStorage 特性）</li>
          <li>• 想長期用？fork 這個 repo，在你的 Vercel 自架，就不用每次貼了</li>
        </ul>
        <p className="mt-4 font-mono text-xs text-muted-foreground">
          <a
            href="https://github.com/hk6429/quiz-bank-organizer-oss"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            ★ GitHub: hk6429/quiz-bank-organizer-oss
          </a>
        </p>
      </Card>
    </main>
  );
}

function Section({
  label,
  hint,
  ok,
  children,
}: {
  label: string;
  hint: React.ReactNode;
  ok: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <span
          className={`font-mono text-[10px] uppercase tracking-wider ${
            ok ? "text-primary" : "text-muted-foreground"
          }`}
        >
          {ok ? "● ready" : "○ empty"}
        </span>
      </div>
      {children}
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
