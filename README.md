# 試卷題庫整理器（OSS 開源版）

> 給老師用的「出題 → 整理 → AI 審題 → 組卷 → 線上測驗 → 分析」一站式工作流。
> Self-host 版本：你 fork 一份，用你自己的 Google Sheets + Gemini key，部署到你自己的 Vercel。

---

## 靈感來源

這個專案的構想出自彭智標老師的[「試卷題庫整理器」原始構想](https://www.facebook.com/share/p/1BGWXQi9Qt/)。
我（[大乃老師](https://naicheng-tw.vercel.app/)）用 Claude Code 三天試做了一個可運作的開源版本，分享給有興趣的老師、技術同好。

## 核心理念

- **老師看得懂、改得動、帶得走** — 後端用 Google Sheets，老師打開試算表就看得到題庫
- **AI 輔助、人做最後決定** — Gemini 拆題、判 Bloom 認知層次、診斷迷思，但審題權永遠在老師手上
- **零鎖定** — 全部資料活在你自己的 Google Drive，工具收掉資料還在

## 功能列表

| 階段 | 功能 |
|---|---|
| 1 | 題庫 CRUD（新增、編輯、刪除、搜尋、篩選）|
| 2 | AI 批次匯入 — 貼上原文 → Gemini 解析 → 待審佇列 |
| 3 | 審題佇列 — 批次審核 AI 標註結果 |
| 4 | 組卷引擎 — 條件抽題（難度分配、近期排除、使用次數追蹤）+ A/B 卷 |
| 5 | 一鍵輸出 — Google Docs 試卷 / 答案卷 / PDF |
| 6 | 一鍵生成 Google Forms 線上測驗 |
| 7 | 分析儀表板 — 答對率 / 鑑別度 / 易錯選項分布 / Gemini 迷思概念診斷 |

## 技術棧

- **前端**：Next.js 16 (App Router) · TypeScript · Tailwind · shadcn/ui
- **後端**：Google Apps Script Web App（API 層）
- **資料庫**：Google Sheets（3 張表）
- **AI**：Gemini 2.5 Flash / Pro
- **部署**：Vercel

## 快速開始

1. **Fork 這個 repo**
2. **建立 Google Sheets**（看 [`apps-script/SETUP.md`](apps-script/SETUP.md)）
3. **部署 Apps Script Web App**（拿到 `SHEETS_API_URL`）
4. **取得 Gemini API key**（看 [`KEYS-SETUP.md`](KEYS-SETUP.md)）
5. **本地測試**：

   ```bash
   cp .env.example .env.local
   # 編輯 .env.local 填入三個值
   npm install
   npm run dev
   ```

6. **部署到 Vercel**：

   ```bash
   npx vercel
   # 把 .env.local 的三個變數設到 Vercel env vars
   ```

## 環境變數

| 變數 | 說明 |
|---|---|
| `SHEETS_API_URL` | 你部署的 Apps Script Web App URL |
| `SHEETS_API_SECRET` | 你自己用 `openssl rand -hex 32` 產的隨機字串，要跟 Apps Script Script Property 一致 |
| `GEMINI_API_KEY` | 你的 Gemini API key（[aistudio.google.com/apikey](https://aistudio.google.com/apikey)）|
| `GEMINI_MODEL_FAST` | 預設 `gemini-2.5-flash` |
| `GEMINI_MODEL_PRO` | 預設 `gemini-2.5-pro` |

詳見 [`KEYS-SETUP.md`](KEYS-SETUP.md)。

## 範例資料

`scripts/seed-demo.py` 提供 10 題通用範例（國中國文 / 數學 / 自然 各 3-4 題）。第一次跑起來可以匯入測試。

```bash
python3 scripts/seed-demo.py
```

## 安全須知

- **這個版本沒有任何密碼門禁**。部署後任何拿到 URL 的人都能讀寫你的 Sheets。
- 如果需要對外開放、又怕被亂用，建議：
  - 部署到只給特定 email 看的 Vercel（Vercel Deployment Protection）
  - 或自己加 NextAuth.js / Clerk 等認證層

## 授權

MIT

## 致謝

- 原始構想：[彭智標老師](https://www.facebook.com/share/p/1BGWXQi9Qt/)
- 三天試做：[大乃老師](https://naicheng-tw.vercel.app/) × [Claude Code](https://claude.ai/code)
