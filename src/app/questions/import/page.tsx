"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { QuestionDraft, SubjectMap } from "@/lib/schemas";

const SUBJECTS = Object.values(SubjectMap);
const GRADES = ["七年級", "八年級", "九年級"];

const DEFAULT_UNITS_LDR = [
  "習慣一 主動積極",
  "習慣二 以終為始",
  "習慣三 要事第一",
  "習慣四 雙贏思維",
  "習慣五 知彼解己",
  "習慣六 統合綜效",
  "習慣七 不斷更新",
].join("\n");

type ParseStage = "input" | "parsing" | "preview" | "importing" | "done";

export default function ImportPage() {
  const router = useRouter();
  const [stage, setStage] = useState<ParseStage>("input");
  const [subject, setSubject] = useState("國文");
  const [grade, setGrade] = useState("八年級");
  const [units, setUnits] = useState(DEFAULT_UNITS_LDR);
  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState<Partial<QuestionDraft>[]>([]);
  const [err, setErr] = useState("");
  const [imported, setImported] = useState(0);

  async function handleParse() {
    if (!rawText.trim()) return setErr("先貼一段題目原文");
    setErr("");
    setStage("parsing");
    try {
      const { byokHeaders } = await import("@/lib/byok");
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...byokHeaders() },
        body: JSON.stringify({
          action: "parse_raw",
          payload: {
            rawText,
            context: {
              subject,
              grade,
              units: units.split("\n").map((u) => u.trim()).filter(Boolean),
            },
          },
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message);
      setParsed(json.data);
      setStage("preview");
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setStage("input");
    }
  }

  async function handleImport() {
    setStage("importing");
    setErr("");
    let count = 0;
    try {
      for (const q of parsed) {
        await fetch("/api/sheets?action=create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create",
            question: { subject, grade, source: "AI生成", status: "待審", ...q },
          }),
        });
        count++;
        setImported(count);
      }
      setStage("done");
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setStage("preview");
    }
  }

  return (
    <main className="container mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6">
        <Link href="/questions" className="text-sm text-muted-foreground hover:underline">← 回題庫</Link>
        <h1 className="mt-1 text-2xl font-bold">AI 批次匯入</h1>
        <p className="text-sm text-muted-foreground">
          貼上一段原文（Word/紙本/網路題目皆可），Gemini 自動拆解成結構化題目；預覽後一鍵入庫，狀態自動標「待審」。
        </p>
      </div>

      {/* Stage 1: input */}
      {(stage === "input" || stage === "parsing") && (
        <Card className="space-y-4 p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">學科</Label>
              <Select value={subject} onValueChange={(v) => setSubject(v ?? "")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">年級</Label>
              <Select value={grade} onValueChange={(v) => setGrade(v ?? "")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GRADES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">單元清單（一行一個，給 AI 對照用）</Label>
              <Input value={units.split("\n").length + " 個單元"} readOnly />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">單元清單詳情</Label>
            <Textarea value={units} onChange={(e) => setUnits(e.target.value)} rows={4} className="font-mono text-xs" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">題目原文（可一次貼多題）</Label>
            <Textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={14}
              placeholder={`範例：

1. 以下何者屬於第二象限（重要不緊急）的活動？
(A) 突然冒出的危機
(B) 為下週段考預作複習計畫
(C) 滑手機看短影音
(D) 同學臨時找你抱怨
答案：B
解析：第二象限是「重要但不緊急」的長期投資型活動…

2. 「我控制不了我的脾氣」屬於主動積極語言嗎？(是/否)
答案：否

3. 簡答題：請說明「影響圈」與「關注圈」的差異，並舉一個校園生活中的例子。
`}
            />
            <p className="text-xs text-muted-foreground">支援多題混合、編號可有可無；Gemini 會自動辨識題目邊界。</p>
          </div>

          {err && <p className="rounded bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</p>}

          <div className="flex justify-end gap-2">
            <Button onClick={handleParse} disabled={stage === "parsing"}>
              {stage === "parsing" ? "Gemini 解析中…" : "🤖 用 Gemini 解析"}
            </Button>
          </div>
        </Card>
      )}

      {/* Stage 2: preview */}
      {(stage === "preview" || stage === "importing") && (
        <div className="space-y-4">
          <Card className="flex items-center justify-between p-4">
            <p className="text-sm">
              ✅ Gemini 解析出 <strong>{parsed.length}</strong> 題。預覽下方內容，確認無誤後按「批次入庫」。
              <br />
              <span className="text-xs text-muted-foreground">入庫後狀態為「待審」，請去審題佇列檢核。</span>
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStage("input")} disabled={stage === "importing"}>重新編輯</Button>
              <Button onClick={handleImport} disabled={stage === "importing"}>
                {stage === "importing" ? `匯入中 ${imported}/${parsed.length}…` : `📥 批次入庫（${parsed.length} 題）`}
              </Button>
            </div>
          </Card>

          {err && <Card className="border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{err}</Card>}

          <div className="space-y-3">
            {parsed.map((q, i) => (
              <Card key={i} className="space-y-2 p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="outline">第 {i + 1} 題</Badge>
                  <Badge>{q.type ?? "未知題型"}</Badge>
                  {q.unit && <Badge variant="secondary">{q.unit}</Badge>}
                  {q.subconcept && <Badge variant="secondary">{q.subconcept}</Badge>}
                  {q.difficulty && <Badge variant="outline">難度 {q.difficulty}</Badge>}
                  {q.bloom && <Badge variant="outline">{q.bloom}</Badge>}
                </div>
                <p className="text-sm font-medium">{q.stem}</p>
                {q.options && q.options.length > 0 && (
                  <ul className="ml-4 list-disc space-y-1 text-sm text-muted-foreground">
                    {q.options.map((o, j) => <li key={j}>{o}</li>)}
                  </ul>
                )}
                <p className="text-sm"><strong>答案：</strong>{q.answer ?? "(無)"}</p>
                {q.explanation && <p className="text-xs text-muted-foreground">解析：{q.explanation}</p>}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Stage 3: done */}
      {stage === "done" && (
        <Card className="space-y-4 p-8 text-center">
          <p className="text-4xl">🎉</p>
          <p className="text-lg font-bold">已匯入 {imported} 題到題庫</p>
          <p className="text-sm text-muted-foreground">所有題目狀態為「待審」，請去審題佇列檢核 AI 標註是否正確。</p>
          <div className="flex justify-center gap-2 pt-4">
            <Link href="/questions"><Button variant="outline">回題庫</Button></Link>
            <Link href="/review"><Button>去審題 →</Button></Link>
            <Button variant="ghost" onClick={() => { setRawText(""); setParsed([]); setImported(0); setStage("input"); }}>再匯入一批</Button>
          </div>
        </Card>
      )}
    </main>
  );
}
