"use client";

import { use, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Question } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Paper = {
  paper_id: string;
  name: string;
  subject: string;
  grade: string;
  units: string;
  question_ids: string;
  config_json: string;
  created_at: string;
  docs_url?: string;
  pdf_url?: string;
  form_url?: string;
  questions: Question[];
};

async function fetchPaper(paperId: string): Promise<Paper> {
  const res = await fetch(`/api/sheets?action=get_paper&paper_id=${encodeURIComponent(paperId)}`);
  const json = await res.json();
  if (!json.ok) throw new Error(json.message);
  return json.data;
}

type ExportResult = {
  student?: { doc_url: string; pdf_url: string };
  answer?: { doc_url: string; pdf_url: string };
  explanation?: { doc_url: string; pdf_url: string };
};

type FormResult = {
  form_url: string;
  edit_url: string;
  responses_sheet: string;
};

export default function PaperPage({ params }: { params: Promise<{ paperId: string }> }) {
  const { paperId } = use(params);
  const { data, error, isLoading } = useSWR(["paper", paperId], () => fetchPaper(paperId));
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState<ExportResult | null>(null);
  const [exportErr, setExportErr] = useState("");
  const [creatingForm, setCreatingForm] = useState(false);
  const [formResult, setFormResult] = useState<FormResult | null>(null);
  const [formErr, setFormErr] = useState("");

  if (isLoading) return <Centered>載入中…</Centered>;
  if (error) return <Centered className="text-destructive">載入失敗：{error.message}</Centered>;
  if (!data) return <Centered>找不到這份試卷</Centered>;

  const config = (() => { try { return JSON.parse(data.config_json); } catch { return null; } })();

  function printPage() {
    window.print();
  }

  async function createForm() {
    setCreatingForm(true);
    setFormErr("");
    try {
      const res = await fetch("/api/sheets?action=create_form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_form", paper_id: paperId }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message);
      setFormResult(json.data);
    } catch (e) {
      setFormErr(e instanceof Error ? e.message : String(e));
    } finally {
      setCreatingForm(false);
    }
  }

  async function exportDocs() {
    setExporting(true);
    setExportErr("");
    try {
      const res = await fetch("/api/sheets?action=export_doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "export_doc",
          paper_id: paperId,
          versions: ["student", "answer", "explanation"],
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message);
      setExported(json.data);
    } catch (e) {
      setExportErr(e instanceof Error ? e.message : String(e));
    } finally {
      setExporting(false);
    }
  }

  return (
    <main className="container mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6 flex items-start justify-between print:hidden">
        <div>
          <Link href="/compose" className="text-sm text-muted-foreground hover:underline">← 重新組卷</Link>
          <h1 className="mt-1 text-2xl font-bold">{data.name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-mono text-muted-foreground">{data.paper_id}</span>
            <Badge variant="outline">{data.subject}</Badge>
            <Badge variant="outline">{data.grade}</Badge>
            <Badge variant="secondary">{data.questions.length} 題</Badge>
            <span className="text-muted-foreground">{fmt(data.created_at)}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={printPage}>🖨 列印 / PDF</Button>
          <Button onClick={exportDocs} disabled={exporting}>
            {exporting ? "產生中（約 30 秒）…" : "📄 產生 Google Docs"}
          </Button>
          <Button variant="secondary" onClick={createForm} disabled={creatingForm}>
            {creatingForm ? "建立中…" : "📝 產生線上測驗"}
          </Button>
        </div>
      </div>

      {(formResult || formErr) && (
        <Card className="mb-4 p-4 print:hidden">
          {formErr ? (
            <p className="text-sm text-destructive">產生失敗：{formErr}</p>
          ) : formResult && (
            <div className="space-y-3">
              <p className="text-sm font-semibold">✅ Google Form 已產生（已設為測驗模式，學生作答後自動評分）</p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <a href={formResult.form_url} target="_blank" rel="noreferrer" className="rounded border p-3 text-sm hover:bg-accent">
                  <p className="font-medium">📤 給學生填的網址</p>
                  <p className="mt-1 break-all text-xs text-primary underline">{formResult.form_url}</p>
                </a>
                <a href={formResult.edit_url} target="_blank" rel="noreferrer" className="rounded border p-3 text-sm hover:bg-accent">
                  <p className="font-medium">⚙️ 編輯表單</p>
                  <p className="mt-1 break-all text-xs text-primary underline">{formResult.edit_url}</p>
                </a>
              </div>
              <p className="text-xs text-muted-foreground">學生作答後，成績會自動寫入試算表（新增 "表單回應 1" 分頁），階段 8 分析會吃這份資料。</p>
            </div>
          )}
        </Card>
      )}

      {(exported || exportErr) && (
        <Card className="mb-6 p-4 print:hidden">
          {exportErr ? (
            <p className="text-sm text-destructive">產生失敗：{exportErr}</p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-semibold">✅ 已產生 3 版（存於 Drive 的 "QuizBank Papers" 資料夾）</p>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                {(["student", "answer", "explanation"] as const).map((v) => {
                  const r = exported?.[v];
                  if (!r) return null;
                  const label = { student: "📘 學生版", answer: "🟢 答案版", explanation: "📖 解析版" }[v];
                  return (
                    <div key={v} className="rounded border p-3 text-sm">
                      <p className="font-medium">{label}</p>
                      <div className="mt-2 flex gap-2 text-xs">
                        <a href={r.doc_url} target="_blank" rel="noreferrer" className="text-primary underline">開 Docs</a>
                        <a href={r.pdf_url} target="_blank" rel="noreferrer" className="text-primary underline">開 PDF</a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Header for print */}
      <div className="mb-6 hidden border-b pb-4 print:block">
        <h1 className="text-center text-xl font-bold">{data.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          班級：　　　　座號：　　　　姓名：　　　　　　共 {data.questions.length} 題
        </p>
      </div>

      <Card className="space-y-6 p-6 print:border-0 print:shadow-none">
        {data.questions.map((q, i) => (
          <QuestionView key={q.id} q={q} index={i + 1} shuffleOpts={config?.shuffle_options ?? false} />
        ))}
      </Card>

      <details className="mt-6 rounded border bg-muted/30 p-4 text-sm print:hidden">
        <summary className="cursor-pointer font-semibold">📋 答案 + 解析（折疊區，列印不會出現）</summary>
        <div className="mt-3 space-y-2">
          {data.questions.map((q, i) => (
            <div key={q.id} className="text-xs">
              <strong>{i + 1}.</strong> 答案：<span className="font-mono">{q.answer}</span>
              {q.explanation && <span className="text-muted-foreground"> ／ {q.explanation}</span>}
            </div>
          ))}
        </div>
      </details>
    </main>
  );
}

function QuestionView({ q, index, shuffleOpts }: { q: Question; index: number; shuffleOpts: boolean }) {
  const displayedOptions = useMemoOptions(q, shuffleOpts);

  return (
    <div className="space-y-2 border-b pb-4 last:border-0">
      <div className="flex items-start gap-2">
        <span className="font-bold">{index}.</span>
        <div className="flex-1 space-y-2">
          <p className="leading-relaxed">{q.stem}</p>
          {displayedOptions.length > 0 && (
            <ol className="ml-4 list-none space-y-1 text-sm">
              {displayedOptions.map((opt, i) => (
                <li key={i}>({String.fromCharCode(65 + i)}) {opt}</li>
              ))}
            </ol>
          )}
          {q.type === "問答" && (
            <div className="mt-2 h-16 rounded border border-dashed border-muted-foreground/30"></div>
          )}
          {q.type === "填充" && (
            <div className="mt-1 h-8 rounded border-b border-muted-foreground/50"></div>
          )}
        </div>
        <span className="text-xs text-muted-foreground print:hidden">[{q.difficulty} / {q.bloom}]</span>
      </div>
    </div>
  );
}

function useMemoOptions(q: Question, shuffle: boolean) {
  // Stable shuffle per render: only re-shuffle on q.id change
  const opts = q.options ?? [];
  if (!shuffle) return opts;
  // Deterministic shuffle based on id hash for consistent print
  const arr = [...opts];
  const seed = q.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (seed * (i + 1)) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function Centered({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <main className="container mx-auto max-w-4xl px-6 py-20 text-center">
      <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>
    </main>
  );
}

function fmt(s?: string) {
  if (!s) return "";
  try {
    return new Date(s).toLocaleString("zh-TW", { hour12: false });
  } catch {
    return s;
  }
}
