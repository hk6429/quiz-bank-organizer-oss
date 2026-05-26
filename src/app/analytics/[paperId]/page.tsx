"use client";

import { use, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type QStat = {
  question_id: string;
  type?: string;
  stem?: string;
  correct_answer?: string;
  total_responses?: number;
  correct_count?: number;
  correct_rate?: number | null;
  discrimination?: number | null;
  distractor_dist?: Record<string, number>;
  error?: string;
};

type AnalyticsPayload = {
  paper: { name: string; paper_id: string; subject: string; grade: string; questions: { id: string; stem: string; answer: string; explanation?: string; options?: string[] }[] };
  has_responses: boolean;
  message?: string;
  total_responses?: number;
  per_question?: QStat[];
  paper_avg?: number;
};

async function fetchAnalytics(paperId: string): Promise<AnalyticsPayload> {
  const res = await fetch(`/api/sheets?action=analytics&paper_id=${encodeURIComponent(paperId)}`);
  const json = await res.json();
  if (!json.ok) throw new Error(json.message);
  return json.data;
}

export default function AnalyticsDetailPage({ params }: { params: Promise<{ paperId: string }> }) {
  const { paperId } = use(params);
  const { data, error, isLoading, mutate } = useSWR(["analytics", paperId], () => fetchAnalytics(paperId));

  if (isLoading) return <Centered>載入中…</Centered>;
  if (error) return <Centered className="text-destructive">載入失敗：{error.message}</Centered>;
  if (!data) return <Centered>找不到資料</Centered>;

  return (
    <main className="container mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Link href="/analytics" className="text-sm text-muted-foreground hover:underline">← 回分析列表</Link>
          <h1 className="mt-1 text-2xl font-bold">{data.paper.name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-mono text-muted-foreground">{data.paper.paper_id}</span>
            <Badge variant="outline">{data.paper.subject}</Badge>
            <Badge variant="outline">{data.paper.grade}</Badge>
            {data.has_responses && (
              <Badge className="bg-emerald-100 text-emerald-800">
                {data.total_responses} 人作答
              </Badge>
            )}
          </p>
        </div>
        <Button variant="outline" onClick={() => mutate()}>🔄 重新計算</Button>
      </div>

      {!data.has_responses && (
        <Card className="p-12 text-center">
          <p className="text-4xl">📊</p>
          <p className="mt-3 text-lg font-bold">尚無作答資料</p>
          <p className="mt-2 text-sm text-muted-foreground">{data.message ?? "請學生用線上測驗網址作答後再回來看分析。"}</p>
        </Card>
      )}

      {data.has_responses && (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Stat label="作答人數" value={String(data.total_responses)} />
            <Stat label="全卷平均答對率"
                  value={data.paper_avg != null ? `${(data.paper_avg * 100).toFixed(1)}%` : "—"}
                  tone={data.paper_avg != null && data.paper_avg < 0.6 ? "warning" : "ok"} />
            <Stat label="題目數" value={String(data.per_question?.length ?? 0)} />
          </div>

          <Card className="mb-6 p-6">
            <h2 className="mb-4 text-sm font-semibold">逐題分析</h2>
            <div className="space-y-4">
              {(data.per_question ?? []).map((stat, i) => (
                <QuestionStatRow key={stat.question_id} stat={stat} index={i + 1} totalN={data.total_responses ?? 0} />
              ))}
            </div>
          </Card>
        </>
      )}
    </main>
  );
}

function Stat({ label, value, tone = "ok" }: { label: string; value: string; tone?: "ok" | "warning" }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${tone === "warning" ? "text-amber-600" : ""}`}>{value}</p>
    </Card>
  );
}

function QuestionStatRow({ stat, index, totalN }: { stat: QStat; index: number; totalN: number }) {
  const [aiNote, setAiNote] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const rate = stat.correct_rate;
  const discrim = stat.discrimination;

  async function aiAnalyze() {
    if (!stat.distractor_dist || Object.keys(stat.distractor_dist).length === 0) return;
    setAiBusy(true);
    try {
      const { byokHeaders } = await import("@/lib/byok");
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...byokHeaders() },
        body: JSON.stringify({
          action: "detect_misconception",
          payload: {
            question: { stem: stat.stem, options: [], answer: stat.correct_answer },
            correct_rate: rate,
            distractor_dist: stat.distractor_dist,
          },
        }),
      });
      const json = await res.json();
      setAiNote(json.ok ? json.data : `錯誤：${json.message}`);
    } finally {
      setAiBusy(false);
    }
  }

  return (
    <div className="space-y-2 rounded border p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm">
            <span className="font-bold">{index}.</span>{" "}
            <span className="font-mono text-xs text-muted-foreground">{stat.question_id}</span>{" "}
            {stat.type && <Badge variant="outline" className="text-xs">{stat.type}</Badge>}
          </p>
          <p className="mt-1 text-sm">{stat.stem}</p>
          <p className="mt-1 text-xs text-muted-foreground">正答：<span className="font-mono">{stat.correct_answer}</span></p>
        </div>
        {rate != null && (
          <div className="text-right">
            <p className={`text-2xl font-bold ${rate < 0.5 ? "text-red-600" : rate < 0.7 ? "text-amber-600" : "text-emerald-600"}`}>
              {(rate * 100).toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground">{stat.correct_count}/{totalN}</p>
          </div>
        )}
      </div>

      {rate != null && (
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full ${rate < 0.5 ? "bg-red-500" : rate < 0.7 ? "bg-amber-500" : "bg-emerald-500"}`}
            style={{ width: `${rate * 100}%` }}
          />
        </div>
      )}

      {discrim != null && (
        <p className="text-xs text-muted-foreground">
          鑑別度：<span className={`font-mono font-semibold ${discrim < 0.2 ? "text-amber-600" : ""}`}>{discrim.toFixed(2)}</span>
          {discrim < 0.2 && <span className="ml-2">⚠️ 鑑別度偏低，建議檢視題目</span>}
        </p>
      )}

      {stat.distractor_dist && Object.keys(stat.distractor_dist).length > 0 && (
        <details className="pt-2 text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">📊 選項分布 / 🤖 AI 迷思分析</summary>
          <div className="mt-2 space-y-1">
            {Object.entries(stat.distractor_dist)
              .sort((a, b) => b[1] - a[1])
              .map(([k, v]) => (
                <div key={k} className="flex items-center gap-2">
                  <span className="w-48 truncate">{k}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary" style={{ width: `${(v / totalN) * 100}%` }} />
                  </div>
                  <span className="w-12 text-right font-mono">{v}人</span>
                </div>
              ))}
          </div>
          <Button size="sm" variant="outline" className="mt-3" onClick={aiAnalyze} disabled={aiBusy}>
            {aiBusy ? "Gemini 分析中…" : "🤖 用 Gemini 解讀迷思概念"}
          </Button>
          {aiNote && (
            <div className="mt-2 rounded bg-muted/50 p-3 text-xs whitespace-pre-wrap">{aiNote}</div>
          )}
        </details>
      )}
    </div>
  );
}

function Centered({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <main className="container mx-auto max-w-4xl px-6 py-20 text-center">
      <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>
    </main>
  );
}
