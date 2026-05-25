import { Question, QuestionDraft, ComposeConfig } from "./schemas";

const SHEETS_API_URL = process.env.SHEETS_API_URL!;
const SHEETS_API_SECRET = process.env.SHEETS_API_SECRET!;

type ApiResponse<T> =
  | { ok: true; data: T; meta?: { ts: string; exec_ms: number } }
  | { ok: false; error: string; message: string; details?: unknown };

async function call<T>(
  action: string,
  params: Record<string, string> = {},
  body?: unknown,
): Promise<T> {
  if (!SHEETS_API_URL) throw new Error("SHEETS_API_URL not configured");

  const url = new URL(SHEETS_API_URL);
  url.searchParams.set("action", action);
  url.searchParams.set("secret", SHEETS_API_SECRET);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const init: RequestInit = {
    method: body ? "POST" : "GET",
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };

  const res = await fetch(url.toString(), init);
  const json = (await res.json()) as ApiResponse<T>;
  if (!json.ok) throw new Error(`${json.error}: ${json.message}`);
  return json.data;
}

export const sheets = {
  list: (filter: Partial<{ subject: string; unit: string; status: string }>) =>
    call<Question[]>("list", filter as Record<string, string>),
  get: (id: string) => call<Question>("get", { id }),
  create: (q: QuestionDraft) => call<Question>("create", {}, { question: q }),
  update: (id: string, patch: Partial<Question>) =>
    call<Question>("update", {}, { id, patch }),
  batchImport: (qs: QuestionDraft[]) =>
    call<{ created: number; ids: string[] }>("batch_import", {}, { questions: qs }),
  aiTag: (id: string) => call<Question>("ai_tag", {}, { id }),
  review: (id: string, status: Question["status"], reviewer: string, comment?: string) =>
    call<Question>("review", {}, { id, status, reviewer, comment }),
  compose: (config: ComposeConfig) =>
    call<{ paper_id: string; question_ids: string[] }>("compose", {}, { config }),
  exportDoc: (paper_id: string, versions: Array<"student" | "answer" | "explanation">) =>
    call<{ docs_url: string; pdf_url: string }>("export_doc", {}, { paper_id, versions }),
  createForm: (paper_id: string) =>
    call<{ form_url: string; responses_sheet: string }>("create_form", {}, { paper_id }),
  analytics: (params: { paper_id?: string; question_id?: string }) =>
    call<{
      correct_rate?: number;
      discrimination?: number;
      distractor_dist?: Record<string, number>;
      misconception_note?: string;
    }>("analytics", params as Record<string, string>),
};
