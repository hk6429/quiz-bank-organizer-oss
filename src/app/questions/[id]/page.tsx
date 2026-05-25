"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { QuestionForm } from "@/components/quiz/QuestionForm";
import { api } from "@/lib/client-sheets";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { data, error, isLoading, mutate } = useSWR(["question", id], () => api.get(id));

  if (isLoading) return <Centered>載入中…</Centered>;
  if (error) return <Centered className="text-destructive">載入失敗：{error.message}</Centered>;
  if (!data) return <Centered>找不到這題</Centered>;

  return (
    <main className="container mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Link href="/questions" className="text-sm text-muted-foreground hover:underline">← 回題庫</Link>
          <h1 className="mt-1 text-2xl font-bold">編輯題目</h1>
          <p className="mt-1 flex items-center gap-2 text-xs">
            <span className="font-mono">{data.id}</span>
            <Badge variant="outline">{data.status}</Badge>
            <span className="text-muted-foreground">建立：{fmt(data.created_at)}　更新：{fmt(data.updated_at)}</span>
          </p>
        </div>
        <div className="flex gap-2">
          {data.status !== "停用" && (
            <Button
              variant="outline"
              onClick={async () => {
                if (!confirm("確定停用這題？停用後不會出現在組卷池。")) return;
                await api.update(id, { status: "停用" });
                void mutate();
              }}
            >
              停用
            </Button>
          )}
          {data.status === "草稿" && (
            <Button
              variant="default"
              onClick={async () => {
                await api.update(id, { status: "待審" });
                void mutate();
              }}
            >
              送審
            </Button>
          )}
        </div>
      </div>

      <Card className="p-6">
        <QuestionForm
          initial={data}
          submitLabel="儲存變更"
          onSubmit={async (patch) => {
            await api.update(id, patch);
            void mutate();
            router.push("/questions");
          }}
        />
      </Card>
    </main>
  );
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
