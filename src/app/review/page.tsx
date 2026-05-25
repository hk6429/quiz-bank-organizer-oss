"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { api } from "@/lib/client-sheets";
import { Question } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const REVIEWER_KEY = "quiz_reviewer_email";

export default function ReviewPage() {
  const [reviewer, setReviewer] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    setReviewer(localStorage.getItem(REVIEWER_KEY) ?? "");
  }, []);

  useEffect(() => {
    if (reviewer) localStorage.setItem(REVIEWER_KEY, reviewer);
  }, [reviewer]);

  const { data, error, isLoading, mutate } = useSWR(
    ["review-queue"],
    () => api.list({ status: "待審" }),
  );

  const pending = useMemo(() => data ?? [], [data]);

  async function decide(id: string, status: Question["status"]) {
    if (!reviewer) return alert("先填審核者 email");
    setBusyId(id);
    try {
      await api.review(id, status, reviewer);
      await mutate();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="container mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <Link href="/" className="text-sm text-muted-foreground hover:underline">← 回首頁</Link>
          <h1 className="mt-1 text-2xl font-bold">審題佇列</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "載入中…" : `待審 ${pending.length} 題`}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">審核者 email（會記錄）</Label>
          <Input
            value={reviewer}
            onChange={(e) => setReviewer(e.target.value)}
            placeholder="hk6429@gmail.com"
            className="w-72"
          />
        </div>
      </div>

      {error && (
        <Card className="mb-4 border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          載入失敗：{error.message}
        </Card>
      )}

      {!isLoading && pending.length === 0 && (
        <Card className="space-y-2 p-12 text-center">
          <p className="text-4xl">✨</p>
          <p className="text-lg font-bold">佇列清空！</p>
          <p className="text-sm text-muted-foreground">目前沒有待審題目。AI 匯入新題後會自動進這裡。</p>
          <div className="pt-2">
            <Link href="/questions/import"><Button>去 AI 匯入</Button></Link>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {pending.map((q) => (
          <QuestionCard
            key={q.id}
            q={q}
            busy={busyId === q.id}
            disabled={!reviewer}
            onApprove={() => decide(q.id, "已審")}
            onReject={() => decide(q.id, "需修改")}
          />
        ))}
      </div>
    </main>
  );
}

function QuestionCard({
  q, busy, disabled, onApprove, onReject,
}: {
  q: Question;
  busy: boolean;
  disabled: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <Card className="space-y-3 p-5">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-mono text-muted-foreground">{q.id}</span>
        <Badge>{q.type}</Badge>
        <Badge variant="secondary">{q.unit}</Badge>
        {q.subconcept && <Badge variant="secondary">{q.subconcept}</Badge>}
        <Badge variant="outline">難度 {q.difficulty}</Badge>
        <Badge variant="outline">{q.bloom}</Badge>
        <Badge variant="outline">{q.source}</Badge>
      </div>

      <p className="text-base font-medium leading-relaxed">{q.stem}</p>

      {q.options && q.options.length > 0 && (
        <ul className="ml-4 list-none space-y-1 text-sm">
          {q.options.map((o, i) => {
            const letter = String.fromCharCode(65 + i);
            const isAnswer = q.answer === letter || q.answer === o || (q.type === "是非" && i === 0 && q.answer === "是") || (q.type === "是非" && i === 1 && q.answer === "否");
            return (
              <li key={i} className={isAnswer ? "font-semibold text-emerald-700" : "text-muted-foreground"}>
                {isAnswer && "✓ "}{o}
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex items-start gap-2 text-sm">
        <span className="font-semibold">正答：</span>
        <span>{q.answer}</span>
      </div>

      {q.explanation && (
        <div className="rounded bg-muted/50 px-3 py-2 text-sm">
          <span className="font-semibold">解析：</span>{q.explanation}
        </div>
      )}

      {q.tags && q.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {q.tags.map((t) => <Badge key={t} variant="outline" className="text-xs">#{t}</Badge>)}
        </div>
      )}

      <div className="flex items-center justify-end gap-2 border-t pt-3">
        <Link href={`/questions/${q.id}`}>
          <Button variant="ghost" size="sm" disabled={busy}>編輯</Button>
        </Link>
        <Button variant="outline" size="sm" onClick={onReject} disabled={busy || disabled}>
          ✗ 退回修改
        </Button>
        <Button size="sm" onClick={onApprove} disabled={busy || disabled}>
          {busy ? "處理中…" : "✓ 通過"}
        </Button>
      </div>
    </Card>
  );
}
