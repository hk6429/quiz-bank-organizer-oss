import { z } from "zod";

export const SubjectCode = z.enum(["LDR", "CHI", "SCI", "SOC", "MAT", "ENG"]);
export type SubjectCode = z.infer<typeof SubjectCode>;

export const SubjectMap: Record<SubjectCode, string> = {
  LDR: "自我領導力",
  CHI: "國文",
  SCI: "自然",
  SOC: "社會",
  MAT: "數學",
  ENG: "英語",
};

export const QuestionType = z.enum(["選擇", "填充", "問答", "是非"]);
export const Difficulty = z.enum(["易", "中", "難"]);
export const Bloom = z.enum(["記憶", "理解", "應用", "分析", "評鑑", "創造"]);
export const Status = z.enum(["草稿", "待審", "已審", "需修改", "停用"]);
export const Source = z.enum(["自編", "AI生成", "出版社", "舊考卷"]);

export const Question = z.object({
  id: z.string().regex(/^[A-Z]{3}-G\d{1,2}-\d{4}$/, "格式：LDR-G8-0001"),
  subject: z.string(),
  grade: z.string(),
  unit: z.string(),
  subconcept: z.string().optional(),
  type: QuestionType,
  stem: z.string().min(1),
  options: z.array(z.string()).optional(),
  answer: z.string().min(1),
  explanation: z.string().optional(),
  difficulty: Difficulty,
  bloom: Bloom,
  status: Status,
  source: Source,
  image_url: z.string().url().optional().or(z.literal("")),
  tags: z.array(z.string()).default([]),
  usage_count: z.number().int().default(0),
  last_used_at: z.string().optional(),
  correct_rate: z.number().min(0).max(1).optional(),
  discrimination: z.number().min(-1).max(1).optional(),
  created_at: z.string(),
  updated_at: z.string(),
  reviewer: z.string().email().optional().or(z.literal("")),
});
export type Question = z.infer<typeof Question>;

export const QuestionDraft = Question.partial({
  id: true,
  status: true,
  usage_count: true,
  created_at: true,
  updated_at: true,
});
export type QuestionDraft = z.infer<typeof QuestionDraft>;

export const ComposeConfig = z.object({
  name: z.string().min(1),
  subject: z.string(),
  grade: z.string(),
  units: z.array(z.string()),
  layout: z.object({
    選擇: z.number().int().default(0),
    填充: z.number().int().default(0),
    問答: z.number().int().default(0),
    是非: z.number().int().default(0),
  }),
  difficulty_ratio: z.object({
    易: z.number().min(0).max(1),
    中: z.number().min(0).max(1),
    難: z.number().min(0).max(1),
  }),
  exclude_recent_days: z.number().int().default(30),
  shuffle_questions: z.boolean().default(true),
  shuffle_options: z.boolean().default(true),
  generate_ab: z.boolean().default(false),
});
export type ComposeConfig = z.infer<typeof ComposeConfig>;
