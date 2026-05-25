"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { api } from "@/lib/client-sheets";
import { ComposeConfig, Question, SubjectMap } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const SUBJECTS = Object.values(SubjectMap);
const GRADES = ["七年級", "八年級", "九年級"];

export default function ComposePage() {
  const router = useRouter();
  const { data: allQuestions } = useSWR(["all-q"], () => api.list({ status: "已審" }));

  const [config, setConfig] = useState<ComposeConfig>({
    name: "",
    subject: "國文",
    grade: "八年級",
    units: [],
    layout: { 選擇: 10, 填充: 0, 問答: 0, 是非: 0 },
    difficulty_ratio: { 易: 0.4, 中: 0.4, 難: 0.2 },
    exclude_recent_days: 30,
    shuffle_questions: true,
    shuffle_options: true,
    generate_ab: false,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const availableUnits = useMemo(() => {
    if (!allQuestions) return [];
    const set = new Set<string>();
    allQuestions
      .filter((q) => q.subject === config.subject && q.grade === config.grade)
      .forEach((q) => set.add(q.unit));
    return Array.from(set).sort();
  }, [allQuestions, config.subject, config.grade]);

  const poolStats = useMemo(() => {
    if (!allQuestions) return null;
    const filtered = allQuestions.filter((q) =>
      q.subject === config.subject &&
      q.grade === config.grade &&
      (config.units.length === 0 || config.units.includes(q.unit)),
    );
    return {
      total: filtered.length,
      by_type: groupCount(filtered, "type"),
      by_diff: groupCount(filtered, "difficulty"),
    };
  }, [allQuestions, config.subject, config.grade, config.units]);

  const requested = Object.values(config.layout).reduce((a, b) => a + b, 0);
  const ratioSum = +(config.difficulty_ratio.易 + config.difficulty_ratio.中 + config.difficulty_ratio.難).toFixed(2);

  async function handleCompose() {
    setErr("");
    if (!config.name.trim()) return setErr("試卷名稱不可空白");
    if (requested === 0) return setErr("題型配比加總必須 > 0");
    if (Math.abs(ratioSum - 1) > 0.01) return setErr(`難度比例加總要等於 1（目前 ${ratioSum}）`);

    setBusy(true);
    try {
      const res = await fetch("/api/sheets?action=compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "compose", config }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message);
      router.push(`/compose/${json.data.paper_id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function toggleUnit(u: string) {
    setConfig((c) => ({
      ...c,
      units: c.units.includes(u) ? c.units.filter((x) => x !== u) : [...c.units, u],
    }));
  }

  return (
    <main className="container mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6">
        <Link href="/" className="text-sm text-muted-foreground hover:underline">← 回首頁</Link>
        <h1 className="mt-1 text-2xl font-bold">組卷</h1>
        <p className="text-sm text-muted-foreground">
          設定試卷配置，從「已審」狀態的題庫中依條件抽題。共 {allQuestions?.length ?? "…"} 題可組。
        </p>
      </div>

      <Card className="space-y-6 p-6">
        {/* Basic */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold">基本設定</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1.5 md:col-span-3">
              <Label className="text-xs">試卷名稱 *</Label>
              <Input
                value={config.name}
                onChange={(e) => setConfig((c) => ({ ...c, name: e.target.value }))}
                placeholder="八年級國文 第一次段考"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">學科</Label>
              <Select value={config.subject} onValueChange={(v) => setConfig((c) => ({ ...c, subject: v ?? "", units: [] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">年級</Label>
              <Select value={config.grade} onValueChange={(v) => setConfig((c) => ({ ...c, grade: v ?? "", units: [] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GRADES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">排除近期使用（天）</Label>
              <Input
                type="number"
                min={0}
                value={config.exclude_recent_days}
                onChange={(e) => setConfig((c) => ({ ...c, exclude_recent_days: +e.target.value || 0 }))}
              />
            </div>
          </div>
        </section>

        {/* Units */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">
            單元（{config.units.length === 0 ? "全選" : `${config.units.length}/${availableUnits.length}`}）
          </h2>
          {availableUnits.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              這個學科+年級下還沒有「已審」題目。先去 <Link className="text-primary underline" href="/review">審題</Link> 通過題目。
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableUnits.map((u) => {
                const active = config.units.length === 0 || config.units.includes(u);
                return (
                  <button
                    key={u}
                    type="button"
                    onClick={() => toggleUnit(u)}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      active && config.units.includes(u) ? "border-primary bg-primary text-primary-foreground" :
                      active ? "border-muted-foreground/30 bg-muted" :
                      "border-muted-foreground/20 text-muted-foreground"
                    }`}
                  >
                    {u}
                  </button>
                );
              })}
              {config.units.length > 0 && (
                <button
                  type="button"
                  onClick={() => setConfig((c) => ({ ...c, units: [] }))}
                  className="rounded-full border border-dashed px-3 py-1 text-xs text-muted-foreground"
                >
                  清空（=全選）
                </button>
              )}
            </div>
          )}
        </section>

        {/* Layout */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">題型配比（共 {requested} 題）</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {(["選擇", "填充", "問答", "是非"] as const).map((t) => (
              <div key={t} className="space-y-1.5">
                <Label className="text-xs">{t}</Label>
                <Input
                  type="number"
                  min={0}
                  value={config.layout[t]}
                  onChange={(e) => setConfig((c) => ({
                    ...c, layout: { ...c.layout, [t]: +e.target.value || 0 },
                  }))}
                />
              </div>
            ))}
          </div>
          {poolStats && (
            <p className="text-xs text-muted-foreground">
              題庫池可用：{poolStats.total} 題（選擇 {poolStats.by_type["選擇"] || 0} ／ 填充 {poolStats.by_type["填充"] || 0} ／ 問答 {poolStats.by_type["問答"] || 0} ／ 是非 {poolStats.by_type["是非"] || 0}）
            </p>
          )}
        </section>

        {/* Difficulty */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">
            難度比例（加總 {ratioSum}{Math.abs(ratioSum - 1) > 0.01 && " ⚠️ 不等於 1"}）
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {(["易", "中", "難"] as const).map((d) => (
              <div key={d} className="space-y-1.5">
                <Label className="text-xs">
                  {d}（題庫有 {poolStats?.by_diff[d] || 0} 題）
                </Label>
                <Input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={config.difficulty_ratio[d]}
                  onChange={(e) => setConfig((c) => ({
                    ...c, difficulty_ratio: { ...c.difficulty_ratio, [d]: +e.target.value || 0 },
                  }))}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Shuffle */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">打亂設定</h2>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={config.shuffle_questions}
                onChange={(e) => setConfig((c) => ({ ...c, shuffle_questions: e.target.checked }))} />
              打亂題序
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={config.shuffle_options}
                onChange={(e) => setConfig((c) => ({ ...c, shuffle_options: e.target.checked }))} />
              打亂選項
            </label>
            <label className="flex items-center gap-2 text-muted-foreground">
              <input type="checkbox" disabled />
              產生 A/B 卷（階段 6 提供）
            </label>
          </div>
        </section>

        {err && (
          <div className="rounded bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</div>
        )}

        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-xs text-muted-foreground">
            {poolStats && requested > poolStats.total && (
              <Badge variant="destructive">⚠️ 題庫池只有 {poolStats.total} 題，少於請求的 {requested} 題</Badge>
            )}
          </div>
          <Button onClick={handleCompose} disabled={busy} size="lg">
            {busy ? "抽題中…" : `🎲 開始組卷（${requested} 題）`}
          </Button>
        </div>
      </Card>
    </main>
  );
}

function groupCount<T extends Question>(items: T[], key: keyof T): Record<string, number> {
  const out: Record<string, number> = {};
  items.forEach((x) => {
    const k = String(x[key]);
    out[k] = (out[k] || 0) + 1;
  });
  return out;
}
