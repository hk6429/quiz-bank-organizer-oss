import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const FEATURES = [
  { href: "/questions", title: "題庫", desc: "瀏覽、搜尋、編輯所有題目", badge: "S2", icon: "▤" },
  { href: "/questions/new", title: "新增單題", desc: "手動輸入單一題目", badge: "S2", icon: "+" },
  { href: "/questions/import", title: "AI 批次匯入", desc: "貼上原文 → Gemini 解析 → 入庫", badge: "S3", icon: "✦" },
  { href: "/review", title: "審題佇列", desc: "批次審核 AI 標註結果", badge: "S4", icon: "✓" },
  { href: "/compose", title: "組卷", desc: "條件抽題 + A/B 卷", badge: "S5-6", icon: "▦" },
  { href: "/analytics", title: "分析", desc: "答對率 / 鑑別度 / 易錯選項 / 迷思概念", badge: "S8", icon: "◔" },
];

const STACK = ["Next.js 16", "Google Sheets", "Apps Script", "Gemini 2.5", "shadcn/ui"];

export default function Home() {
  return (
    <main className="container mx-auto max-w-6xl px-6 py-16">
      <header className="mb-14">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-primary">
          <span className="inline-block size-1.5 animate-pulse rounded-full bg-primary" />
          quiz-bank-organizer · v1
        </div>
        <h1 className="text-5xl font-bold tracking-tight md:text-6xl">
          <span className="text-gradient-tech glow-text">試卷題庫整理器</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          從題目收納、AI 審題、組卷到分析回饋的一站式工作流
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {STACK.map((s) => (
            <Badge
              key={s}
              variant="outline"
              className="border-primary/30 bg-background/40 font-mono text-[11px] uppercase tracking-wider text-muted-foreground"
            >
              {s}
            </Badge>
          ))}
        </div>
      </header>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <Link key={f.href} href={f.href} className="group">
            <div className="card-tech relative h-full overflow-hidden rounded-xl p-6">
              <div className="absolute -right-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl transition-opacity group-hover:opacity-70 opacity-30" />
              <div className="relative flex items-start justify-between">
                <div className="flex size-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 font-mono text-lg text-primary">
                  {f.icon}
                </div>
                <span className="rounded border border-border bg-background/60 px-2 py-0.5 font-mono text-[10px] tracking-wider text-muted-foreground">
                  {f.badge}
                </span>
              </div>
              <h3 className="relative mt-5 text-xl font-semibold tracking-tight">
                {f.title}
              </h3>
              <p className="relative mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
              <div className="relative mt-5 flex items-center font-mono text-xs text-primary/80 opacity-0 transition-opacity group-hover:opacity-100">
                進入 <span className="ml-1">→</span>
              </div>
            </div>
          </Link>
        ))}
      </section>

      <footer className="mt-16 border-t border-border/50 pt-6 font-mono text-xs text-muted-foreground">
        <p>
          <span className="text-primary/70">$</span> stage 1-8 deployed · see{" "}
          <code className="rounded bg-muted/40 px-1.5 py-0.5">DESIGN.md</code>{" "}
          <code className="rounded bg-muted/40 px-1.5 py-0.5">README.md</code>
        </p>
      </footer>
    </main>
  );
}
