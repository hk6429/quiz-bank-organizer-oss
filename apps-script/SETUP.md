# Apps Script 後端部署 SOP

## 0. 準備

- 一個 Google 帳號（建議用學校或專用帳號）
- 一份 Google Sheet（試算表 ID 在網址中：`/d/<這一段>/edit`）

## 1. 建立試算表 schema

新增三個 sheet（首列為標題列）：

### Sheet `questions`
複製這一行到 A1：

```
id	subject	grade	unit	subconcept	type	stem	options	answer	explanation	difficulty	bloom	status	source	image_url	tags	usage_count	last_used_at	correct_rate	discrimination	created_at	updated_at	reviewer
```

### Sheet `papers`
```
paper_id	name	subject	grade	units	question_ids	config_json	created_at	docs_url	pdf_url	form_url
```

### Sheet `responses`
```
response_id	paper_id	student_id	question_id	answer	is_correct	answered_at
```

## 2. 安裝 Apps Script

1. 在 Sheet 內：**擴充功能 → Apps Script**
2. 刪掉預設的 `Code.gs`，把本資料夾 `Code.gs` 內容貼進去
3. 點右上角「⚙ 專案設定」→「指令碼屬性」→ 新增兩個屬性：
   - `SHEET_ID` = `<你的試算表 ID>`
   - `API_SECRET` = `<隨便產一個 64 字元的字串，與 Next.js .env 相同>`

## 3. 部署成 Web App

1. 右上角「部署 → 新增部署作業」
2. 類型：**網路應用程式**
3. 執行身分：**我**
4. 存取權：**所有人**（重要：才能讓 Next.js 從外部呼叫）
5. 點「部署」→ 授權帳號 → 複製 Web App URL

## 4. 設定 Next.js

在 `quiz-bank-organizer/.env.local` 加入：

```env
SHEETS_API_URL=https://script.google.com/macros/s/.../exec
SHEETS_API_SECRET=<與 Apps Script 同值>
```

## 5. 測試

```bash
curl -H "X-API-Secret: <secret>" "https://script.google.com/.../exec?action=list"
# 預期：{"ok":true,"data":[]}
```

## 6. 種子題目（自我領導力 demo）

從 Next.js 端執行 `/questions/new` → 貼入「七習慣示範題目原文」→ 用 Gemini 解析 → 一鍵匯入 20 題種子。

或直接在 Sheet 內手動 paste（記得 options 欄填 JSON 字串如 `["A","B","C","D"]`）。

## 故障排除

- **CORS 報錯**：Apps Script Web App 必須部署成 "Anyone" access；如果改成 "Anyone with Google account" 會被瀏覽器擋
- **401 Unauthorized**：檢查 `X-API-Secret` header 是否正確
- **6 分鐘 timeout**：批次匯入 > 50 題請拆 batch
- **改 Code.gs 後沒生效**：必須「**管理部署作業 → 編輯 → 新版本**」才會更新；不是 Save 就好
