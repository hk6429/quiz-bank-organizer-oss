"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { api } from "@/lib/client-sheets";
import { Question } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const STATUS_COLORS: Record<string, string> = {
  草稿: "bg-zinc-200 text-zinc-700",
  待審: "bg-amber-100 text-amber-800",
  已審: "bg-emerald-100 text-emerald-800",
  需修改: "bg-orange-100 text-orange-800",
  停用: "bg-zinc-300 text-zinc-500 line-through",
};

const DIFF_COLORS: Record<string, string> = {
  易: "bg-green-100 text-green-800",
  中: "bg-yellow-100 text-yellow-800",
  難: "bg-red-100 text-red-800",
};

export default function QuestionsPage() {
  const [filter, setFilter] = useState({ subject: "", unit: "", status: "" });
  const [q, setQ] = useState("");

  const { data, error, isLoading, mutate } = useSWR(
    ["questions", filter],
    () => api.list(filter),
  );

  useEffect(() => { void mutate(); }, [filter, mutate]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const kw = q.trim();
    if (!kw) return data;
    return data.filter((x) =>
      [x.stem, x.unit, x.subconcept, x.tags?.join(","), x.id]
        .filter(Boolean).join(" ").toLowerCase().includes(kw.toLowerCase()),
    );
  }, [data, q]);

  return (
    <main className="container mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <Link href="/" className="text-sm text-muted-foreground hover:underline">← 回首頁</Link>
          <h1 className="mt-1 text-2xl font-bold">題庫</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "載入中…" : `共 ${data?.length ?? 0} 題，目前顯示 ${filtered.length}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/questions/import">
            <Button variant="outline">🤖 AI 批次匯入</Button>
          </Link>
          <Link href="/questions/new">
            <Button>+ 新增題目</Button>
          </Link>
        </div>
      </div>

      <Card className="mb-4 p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <Input placeholder="關鍵字搜尋題幹/單元/標籤" value={q} onChange={(e) => setQ(e.target.value)} className="md:col-span-2" />
          <FilterSelect value={filter.subject} onChange={(v) => setFilter((f) => ({ ...f, subject: v }))} placeholder="所有學科" opts={["自我領導力", "國文", "自然", "社會", "數學", "英語"]} />
          <Input placeholder="單元（精確）" value={filter.unit} onChange={(e) => setFilter((f) => ({ ...f, unit: e.target.value }))} />
          <FilterSelect value={filter.status} onChange={(v) => setFilter((f) => ({ ...f, status: v }))} placeholder="所有狀態" opts={["草稿", "待審", "已審", "需修改", "停用"]} />
        </div>
      </Card>

      {error && (
        <Card className="mb-4 border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          載入失敗：{error.message}
        </Card>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">ID</TableHead>
              <TableHead className="w-24">單元</TableHead>
              <TableHead className="w-16">題型</TableHead>
              <TableHead>題幹</TableHead>
              <TableHead className="w-16">難度</TableHead>
              <TableHead className="w-20">狀態</TableHead>
              <TableHead className="w-16">使用</TableHead>
              <TableHead className="w-16 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                  目前沒有題目。{" "}
                  <Link href="/questions/new" className="text-primary hover:underline">新增第一題 →</Link>
                </TableCell>
              </TableRow>
            )}
            {filtered.map((q) => (
              <Row key={q.id} q={q} />
            ))}
          </TableBody>
        </Table>
      </Card>
    </main>
  );
}

function Row({ q }: { q: Question }) {
  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{q.id}</TableCell>
      <TableCell className="text-xs">{q.unit}</TableCell>
      <TableCell className="text-xs">{q.type}</TableCell>
      <TableCell className="max-w-md truncate">{q.stem}</TableCell>
      <TableCell>
        <Badge className={DIFF_COLORS[q.difficulty]} variant="secondary">{q.difficulty}</Badge>
      </TableCell>
      <TableCell>
        <Badge className={STATUS_COLORS[q.status]} variant="secondary">{q.status}</Badge>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">{q.usage_count ?? 0}</TableCell>
      <TableCell className="text-right">
        <Link href={`/questions/${q.id}`}>
          <Button variant="ghost" size="sm">編輯</Button>
        </Link>
      </TableCell>
    </TableRow>
  );
}

function FilterSelect({ value, onChange, placeholder, opts }: {
  value: string; onChange: (v: string) => void; placeholder: string; opts: string[];
}) {
  return (
    <Select value={value || "__all__"} onValueChange={(v) => onChange(!v || v === "__all__" ? "" : v)}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__">{placeholder}</SelectItem>
        {opts.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
