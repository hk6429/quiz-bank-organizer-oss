"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getByok, hasSheets, hasGemini } from "@/lib/byok";

const ITEMS = [
  { href: "/questions", label: "題庫" },
  { href: "/questions/import", label: "AI 匯入" },
  { href: "/review", label: "審題" },
  { href: "/compose", label: "組卷" },
  { href: "/analytics", label: "分析" },
];

export function NavBar() {
  const pathname = usePathname();
  const [configured, setConfigured] = useState<{ sheets: boolean; gemini: boolean } | null>(null);

  useEffect(() => {
    const update = () => {
      const c = getByok();
      setConfigured({ sheets: hasSheets(c), gemini: hasGemini(c) });
    };
    update();
    const onFocus = () => update();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [pathname]);

  const ready = configured?.sheets && configured?.gemini;

  return (
    <nav className="sticky top-0 z-40 border-b border-border/50 bg-background/60 backdrop-blur-xl print:hidden">
      <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="container mx-auto flex max-w-7xl items-center gap-4 px-6 py-3">
        <Link href="/" className="group flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded border border-primary/40 bg-primary/10 font-mono text-sm text-primary transition-shadow group-hover:shadow-[0_0_12px_oklch(0.78_0.16_200_/_0.5)]">
            ▤
          </span>
          <span className="font-bold tracking-tight text-gradient-tech">
            QuizBank
          </span>
          <span className="hidden font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:inline">
            OSS
          </span>
        </Link>
        <div className="ml-2 flex flex-1 items-center gap-1 overflow-x-auto text-sm">
          {ITEMS.map((it) => {
            const active = pathname === it.href || pathname.startsWith(it.href + "/");
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 font-medium transition-all ${
                  active
                    ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_oklch(0.78_0.16_200_/_0.4)]"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                }`}
              >
                {it.label}
              </Link>
            );
          })}
        </div>
        <Link
          href="/setup"
          className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors ${
            pathname === "/setup"
              ? "border-primary/60 text-primary"
              : "border-border/60 text-muted-foreground hover:border-primary/50 hover:text-primary"
          }`}
          title="API 設定"
        >
          <span
            className={`inline-block size-1.5 rounded-full ${
              configured === null
                ? "bg-muted-foreground/40"
                : ready
                  ? "bg-primary animate-pulse"
                  : "bg-destructive animate-pulse"
            }`}
          />
          ⚙ Setup
        </Link>
        <a
          href="https://github.com/hk6429/quiz-bank-organizer-oss"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden rounded-md border border-border/60 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary sm:inline-block"
          title="GitHub"
        >
          ★ GitHub
        </a>
      </div>
    </nav>
  );
}
