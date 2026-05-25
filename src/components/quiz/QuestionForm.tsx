"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Question, QuestionDraft, SubjectMap,
} from "@/lib/schemas";

const SUBJECTS = Object.values(SubjectMap);
const GRADES = ["七年級", "八年級", "九年級"];
const TYPES = ["選擇", "填充", "問答", "是非"] as const;
const DIFFICULTIES = ["易", "中", "難"] as const;
const BLOOMS = ["記憶", "理解", "應用", "分析", "評鑑", "創造"] as const;
const STATUSES = ["草稿", "待審", "已審", "需修改", "停用"] as const;
const SOURCES = ["自編", "AI生成", "出版社", "舊考卷"] as const;

export type QuestionFormValue = Partial<Question>;

export function QuestionForm({
  initial,
  submitLabel = "儲存",
  onSubmit,
}: {
  initial?: QuestionFormValue;
  submitLabel?: string;
  onSubmit: (v: QuestionDraft) => Promise<void>;
}) {
  const [v, setV] = useState<QuestionFormValue>({
    subject: "國文",
    grade: "八年級",
    type: "選擇",
    difficulty: "中",
    bloom: "理解",
    status: "草稿",
    source: "自編",
    options: ["", "", "", ""],
    tags: [],
    ...initial,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const set = <K extends keyof QuestionFormValue>(k: K, val: QuestionFormValue[K]) =>
    setV((prev) => ({ ...prev, [k]: val }));

  const needsOptions = v.type === "選擇" || v.type === "是非";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!v.stem?.trim()) return setErr("題幹不可空白");
    if (!v.answer?.trim()) return setErr("答案不可空白");
    if (!v.unit?.trim()) return setErr("單元不可空白");
    setBusy(true);
    try {
      const payload = { ...v };
      if (!needsOptions) delete payload.options;
      else payload.options = (payload.options ?? []).filter((o) => o.trim());
      if (typeof payload.tags === "string") {
        payload.tags = (payload.tags as unknown as string)
          .split(",").map((s) => s.trim()).filter(Boolean);
      }
      await onSubmit(payload as QuestionDraft);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Field label="學科" required>
          <SelectBox value={v.subject} onChange={(x) => set("subject", x)} opts={SUBJECTS} />
        </Field>
        <Field label="年級" required>
          <SelectBox value={v.grade} onChange={(x) => set("grade", x)} opts={GRADES} />
        </Field>
        <Field label="題型" required>
          <SelectBox value={v.type} onChange={(x) => set("type", x as Question["type"])} opts={[...TYPES]} />
        </Field>
        <Field label="難度" required>
          <SelectBox value={v.difficulty} onChange={(x) => set("difficulty", x as Question["difficulty"])} opts={[...DIFFICULTIES]} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <Field label="單元" required>
          <Input value={v.unit ?? ""} onChange={(e) => set("unit", e.target.value)} placeholder="習慣三 要事第一" />
        </Field>
        <Field label="子概念">
          <Input value={v.subconcept ?? ""} onChange={(e) => set("subconcept", e.target.value)} placeholder="緊急/重要四象限" />
        </Field>
        <Field label="認知層次" required>
          <SelectBox value={v.bloom} onChange={(x) => set("bloom", x as Question["bloom"])} opts={[...BLOOMS]} />
        </Field>
      </div>

      <Field label="題幹" required>
        <Textarea
          value={v.stem ?? ""}
          onChange={(e) => set("stem", e.target.value)}
          rows={4}
          placeholder="輸入題目原文…"
        />
      </Field>

      {needsOptions && (
        <Field label={v.type === "是非" ? "選項（是 / 否）" : "選項 A-D"}>
          <div className="space-y-2">
            {(v.options ?? ["", "", "", ""]).map((opt, i) => (
              <Input
                key={i}
                value={opt}
                onChange={(e) => {
                  const next = [...(v.options ?? ["", "", "", ""])];
                  next[i] = e.target.value;
                  set("options", next);
                }}
                placeholder={v.type === "是非" ? (i === 0 ? "是" : "否") : `選項 ${String.fromCharCode(65 + i)}`}
              />
            ))}
          </div>
        </Field>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="正確答案" required>
          <Input value={v.answer ?? ""} onChange={(e) => set("answer", e.target.value)} placeholder="B 或 文字答案" />
        </Field>
        <Field label="解析">
          <Input value={v.explanation ?? ""} onChange={(e) => set("explanation", e.target.value)} placeholder="(選填) 答題思路" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Field label="狀態">
          <SelectBox value={v.status} onChange={(x) => set("status", x as Question["status"])} opts={[...STATUSES]} />
        </Field>
        <Field label="來源">
          <SelectBox value={v.source} onChange={(x) => set("source", x as Question["source"])} opts={[...SOURCES]} />
        </Field>
        <Field label="圖片 URL">
          <Input value={v.image_url ?? ""} onChange={(e) => set("image_url", e.target.value)} placeholder="(選填)" />
        </Field>
        <Field label="標籤">
          <Input
            value={Array.isArray(v.tags) ? v.tags.join(",") : (v.tags ?? "")}
            onChange={(e) => set("tags", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
            placeholder="素養,易錯題"
          />
        </Field>
      </div>

      {err && <p className="rounded bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</p>}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={busy}>
          {busy ? "處理中…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

function SelectBox({ value, onChange, opts }: { value?: string; onChange: (v: string) => void; opts: string[] }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v ?? "")}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {opts.map((o) => (
          <SelectItem key={o} value={o}>{o}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
