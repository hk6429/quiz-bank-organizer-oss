# KEYS 設定指南

把三組 key/URL 填到 `.env.local`，整個系統就活了。

> ⚠️ `.env.local` 已在 `.gitignore` 內，不會被 push。
> 完成後跟我說「**.env.local 填好了**」，我就接著做階段 2。

---

## 一覽表（先快速看哪些要填）

| # | 變數名 | 從哪拿 | 預估時間 |
|---|---|---|---|
| 1 | `GEMINI_API_KEY` | https://aistudio.google.com/apikey | 1 分鐘 |
| 2 | `SHEETS_API_SECRET` | `openssl rand -hex 32`（自己產） | 10 秒 |
| 3 | `SHEETS_API_URL` | 部署 Apps Script 後拿到 | 10 分鐘 |

---

## ① Gemini API key（最快）

1. 開 https://aistudio.google.com/apikey
2. 點「**Create API key**」
3. 選一個 Google Cloud 專案（沒有就讓它建新的）
4. 複製出來的 key（長得像 `AIzaSy...`）
5. 貼到 `.env.local` 的 `GEMINI_API_KEY=""` 引號中間

```env
GEMINI_API_KEY="YOUR_GEMINI_KEY_HERE_開頭應該是_AIzaSy"
```

✅ 免費額度：Gemini 2.5 Flash 每分鐘 15 次、每天 1500 次。開發測試夠用。

---

## ② SHEETS_API_SECRET（自己產）

打開終端機，跑：

```bash
openssl rand -hex 32
```

會吐出像這樣的一串：
```
a1b2c3d4e5f6...（64 個字元）
```

複製整串，**兩個地方都要貼同一個值**：

### a) 貼到 `.env.local`
```env
SHEETS_API_SECRET="a1b2c3d4e5f6..."
```

### b) 貼到 Apps Script
（在做下一步「③ 部署 Apps Script」時會用到）

---

## ③ SHEETS_API_URL（需要先部署 Apps Script）

### Step 3-1：建試算表

1. 開 https://sheets.google.com → 建立新空白試算表
2. 命名：`QuizBank_自我領導力_八年級`
3. 建三個工作表（左下角 `+` 新增），分別叫 `questions`、`papers`、`responses`
4. 把這三行標題分別貼到 A1（請保持 Tab 分隔）：

**Sheet `questions` 的 A1：**
```
id	subject	grade	unit	subconcept	type	stem	options	answer	explanation	difficulty	bloom	status	source	image_url	tags	usage_count	last_used_at	correct_rate	discrimination	created_at	updated_at	reviewer
```

**Sheet `papers` 的 A1：**
```
paper_id	name	subject	grade	units	question_ids	config_json	created_at	docs_url	pdf_url	form_url
```

**Sheet `responses` 的 A1：**
```
response_id	paper_id	student_id	question_id	answer	is_correct	answered_at
```

5. 從網址列複製試算表 ID（`/d/` 與 `/edit` 中間那一段）：
   ```
   https://docs.google.com/spreadsheets/d/【複製這一段】/edit
   ```

### Step 3-2：開 Apps Script 編輯器

1. 在同一個 Sheet 內：上方選單 **擴充功能 → Apps Script**
2. 預設會開個新分頁，左邊有 `Code.gs`
3. 把 `Code.gs` 裡的內容全部清掉，改貼 `apps-script/Code.gs` 全部內容
   - 在你本機路徑：`~/Developer/quiz-bank-organizer/apps-script/Code.gs`
4. 點 💾 儲存

### Step 3-3：設 Script Properties

1. Apps Script 編輯器左邊 → ⚙ **專案設定**
2. 滾到最下面「**指令碼屬性**」→ 點「**新增指令碼屬性**」
3. 新增兩個屬性（兩個都加）：

| 屬性 | 值 |
|---|---|
| `SHEET_ID` | 步驟 3-1 第 5 點複製的試算表 ID |
| `API_SECRET` | 步驟 ② 產的那串 64 字元，**要跟 `.env.local` 完全一樣** |

4. 點「**儲存指令碼屬性**」

### Step 3-4：部署成 Web App

1. Apps Script 編輯器右上角 → **部署 → 新增部署作業**
2. 點齒輪 ⚙ → 選「**網路應用程式**」
3. 設定如下：
   - 說明：`Quiz Bank API v1`
   - 執行身分：**我**
   - 誰可以存取：**所有人**（⚠️ 必選這個，否則前端會被擋）
4. 點「**部署**」
5. 跳出授權視窗 → 用你的 Google 帳號授權（會出現「未經驗證」警告，點「進階 → 仍要前往」）
6. 部署成功後會給你一個 **網路應用程式 URL**，長這樣：
   ```
   https://script.google.com/macros/s/<你的部署ID>/exec
   ```
7. 複製這個 URL，貼到 `.env.local`：
   ```env
   SHEETS_API_URL="https://script.google.com/macros/s/<你的部署ID>/exec"
   ```

---

## ④ 測試是否通了

在終端機跑：

```bash
curl -H "X-API-Secret: 你的SHEETS_API_SECRET" "你的SHEETS_API_URL?action=list"
```

✅ 預期回應：
```json
{"ok":true,"data":[],"meta":{...}}
```

❌ 如果出現：
- `{"ok":false,"error":"UNAUTHORIZED"}` → SECRET 對不上，檢查 `.env.local` 與 Apps Script Script Property
- `<html>...Page not found` → URL 錯了或部署沒成功
- 卡住沒回應 → Apps Script 部署時「誰可以存取」可能沒選「所有人」

---

## ⑤ 完成後

跟我說「**.env.local 填好了**」，我會：
1. 跑一次連線測試
2. 開始做階段 2（題庫 CRUD 列表頁、搜尋、編輯）

> 🔐 安全提醒：`.env.local` 與 Apps Script Web App URL 都不要貼到任何公開地方（GitHub issue、Slack、社群）。Gemini key 被偷會跑掉額度，Apps Script SECRET 被偷會被別人改你題庫。
