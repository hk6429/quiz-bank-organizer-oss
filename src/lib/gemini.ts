import { GoogleGenAI, Type } from "@google/genai";
import { Question, QuestionDraft } from "./schemas";

const apiKey = process.env.GEMINI_API_KEY;
const FAST = process.env.GEMINI_MODEL_FAST || "gemini-2.5-flash";
const PRO = process.env.GEMINI_MODEL_PRO || "gemini-2.5-pro";

let _client: GoogleGenAI | null = null;
function client() {
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");
  if (!_client) _client = new GoogleGenAI({ apiKey });
  return _client;
}

const QuestionSchema = {
  type: Type.OBJECT,
  properties: {
    unit: { type: Type.STRING },
    subconcept: { type: Type.STRING },
    type: { type: Type.STRING, enum: ["選擇", "填充", "問答", "是非"] },
    stem: { type: Type.STRING },
    options: { type: Type.ARRAY, items: { type: Type.STRING } },
    answer: { type: Type.STRING },
    explanation: { type: Type.STRING },
    difficulty: { type: Type.STRING, enum: ["易", "中", "難"] },
    bloom: {
      type: Type.STRING,
      enum: ["記憶", "理解", "應用", "分析", "評鑑", "創造"],
    },
    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["type", "stem", "answer", "difficulty", "bloom"],
};

export async function parseRawText(
  rawText: string,
  context: { subject: string; grade: string; units: string[] },
): Promise<Partial<QuestionDraft>[]> {
  const prompt = `你是國中題庫整理助理。將下列原文拆解成題目，每題一個 JSON 物件，整體回傳為 JSON 陣列。

【脈絡】
- 學科：${context.subject}
- 年級：${context.grade}
- 單元清單：${context.units.join(" / ")}

【欄位說明】
- unit 必須從上述單元清單選一個最貼近的
- type：選擇/填充/問答/是非
- 選擇與是非題 options 填，問答與填充題 options 可空
- difficulty：易/中/難，bloom：記憶/理解/應用/分析/評鑑/創造

【原文】
${rawText}

回傳純 JSON 陣列。`;

  const res = await client().models.generateContent({
    model: FAST,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: { type: Type.ARRAY, items: QuestionSchema },
    },
  });
  const text = res.text ?? "[]";
  return JSON.parse(text) as Partial<QuestionDraft>[];
}

export async function autoTag(
  question: Pick<Question, "stem" | "options" | "answer" | "subject" | "grade">,
  unitTree: string[],
): Promise<Partial<Pick<Question, "unit" | "subconcept" | "difficulty" | "bloom" | "tags">>> {
  const prompt = `判斷以下題目應該屬於哪個單元、子概念、難度、認知層次、標籤。

【題目】
${JSON.stringify(question, null, 2)}

【可選單元】
${unitTree.join("\n")}

回傳 JSON。`;

  const res = await client().models.generateContent({
    model: FAST,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: QuestionSchema,
    },
  });
  return JSON.parse(res.text ?? "{}");
}

export async function detectMisconception(args: {
  question: Pick<Question, "stem" | "options" | "answer">;
  correct_rate: number;
  distractor_dist: Record<string, number>;
}): Promise<string> {
  const prompt = `這題答對率 ${(args.correct_rate * 100).toFixed(1)}%，錯誤選項分布：
${JSON.stringify(args.distractor_dist, null, 2)}

題目：
${JSON.stringify(args.question, null, 2)}

請用 3-5 行繁體中文（台灣用語）說明：
1. 學生最可能的迷思概念
2. 建議補強教學切入點`;

  const res = await client().models.generateContent({
    model: PRO,
    contents: prompt,
  });
  return res.text ?? "";
}
