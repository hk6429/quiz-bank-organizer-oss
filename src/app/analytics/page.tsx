"use client";

import Link from "next/link";
import useSWR from "swr";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Paper = {
  paper_id: string;
  name: string;
  subject: string;
  grade: string;
  units: string;
  question_ids: string;
  created_at: string;
  form_url?: string;
};

async function fetchPapers(): Promise<Paper[]> {
  const res = await fetch("/api/sheets?action=list_papers");
  const json = await res.json();
  if (!json.ok) throw new Error(json.message);
  return json.data;
}

export default function AnalyticsPage() {
  const { data, error, isLoading } = useSWR(["papers"], fetchPapers);

  return (
    <main className="container mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6">
        <Link href="/" className="text-sm text-muted-foreground hover:underline">← 回首頁</Link>
        <h1 className="mt-1 text-2xl font-bold">分析儀表板</h1>
        <p className="text-sm text-muted-foreground">
          {isLoading ? "載入中…" : `共 ${data?.length ?? 0} 份試卷`}
        </p>
      </div>

      {error && (
        <Card className="mb-4 border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          載入失敗：{error.message}
        </Card>
      )}

      {!isLoading && data?.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-lg font-bold">還沒有試卷</p>
          <p className="mt-2 text-sm text-muted-foreground">
            先去 <Link className="text-primary underline" href="/compose">組卷</Link> 並產生線上測驗，學生作答後這裡會顯示分析。
          </p>
        </Card>
      )}

      <div className="space-y-3">
        {(data ?? []).map((p) => {
          const qCount = String(p.question_ids || "").split(",").filter(Boolean).length;
          return (
            <Link key={p.paper_id} href={`/analytics/${p.paper_id}`}>
              <Card className="p-4 transition-colors hover:bg-accent">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono text-muted-foreground">{p.paper_id}</span>
                      <Badge variant="outline">{p.subject}</Badge>
                      <Badge variant="outline">{p.grade}</Badge>
                      <Badge variant="secondary">{qCount} 題</Badge>
                      {p.form_url && <Badge className="bg-emerald-100 text-emerald-800">已連線上測驗</Badge>}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">{fmt(p.created_at)}</p>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </main>
  );
}

function fmt(s?: string) {
  if (!s) return "";
  try { return new Date(s).toLocaleString("zh-TW", { hour12: false }); } catch { return s; }
}
