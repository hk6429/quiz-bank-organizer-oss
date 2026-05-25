"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { QuestionForm } from "@/components/quiz/QuestionForm";
import { api } from "@/lib/client-sheets";
import { Card } from "@/components/ui/card";

export default function NewQuestionPage() {
  const router = useRouter();

  return (
    <main className="container mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6">
        <Link href="/questions" className="text-sm text-muted-foreground hover:underline">← 回題庫</Link>
        <h1 className="mt-1 text-2xl font-bold">新增題目</h1>
        <p className="text-sm text-muted-foreground">填完按儲存，系統會自動產生題目 ID（例：LDR-G8-0001）</p>
      </div>

      <Card className="p-6">
        <QuestionForm
          submitLabel="儲存題目"
          onSubmit={async (q) => {
            const created = await api.create(q);
            router.push(`/questions/${created.id}`);
          }}
        />
      </Card>
    </main>
  );
}
