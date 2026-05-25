import { Question, QuestionDraft } from "./schemas";

type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; message: string };

async function call<T>(
  action: string,
  params: Record<string, string> = {},
  body?: unknown,
): Promise<T> {
  const url = new URL("/api/sheets", window.location.origin);
  url.searchParams.set("action", action);
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = (await res.json()) as ApiResponse<T>;
  if (!json.ok) throw new Error(`${json.error}: ${json.message}`);
  return json.data;
}

export const api = {
  list: (filter: Partial<{ subject: string; unit: string; status: string }> = {}) =>
    call<Question[]>("list", filter as Record<string, string>),
  get: (id: string) => call<Question>("get", { id }),
  create: (q: QuestionDraft) => call<Question>("create", {}, { action: "create", question: q }),
  update: (id: string, patch: Partial<Question>) =>
    call<Question>("update", {}, { action: "update", id, patch }),
  review: (id: string, status: Question["status"], reviewer: string) =>
    call<Question>("review", {}, { action: "review", id, status, reviewer }),
};
