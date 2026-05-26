"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";

const BOOTSTRAP_SNIPPET = `function bootstrapQuizBankSheets() {
  const ss = SpreadsheetApp.create('試卷題庫 ' + new Date().toLocaleDateString('zh-TW'));

  const q = ss.getActiveSheet();
  q.setName('questions');
  q.getRange(1, 1, 1, 19).setValues([[
    'id','subject','grade','unit','subconcept','type','difficulty','bloom',
    'stem','options','answer','explanation',
    'status','reviewer','comment',
    'used_in_papers','created_at','updated_at','tags'
  ]]).setFontWeight('bold');
  q.setFrozenRows(1);

  const p = ss.insertSheet('papers');
  p.getRange(1, 1, 1, 13).setValues([[
    'paper_id','name','subject','grade','units','total',
    'layout','difficulty_ratio','question_ids',
    'version_a_order','version_b_order','created_at','exported_at'
  ]]).setFontWeight('bold');
  p.setFrozenRows(1);

  const r = ss.insertSheet('responses');
  r.getRange(1, 1, 1, 7).setValues([[
    'response_id','paper_id','student_id','question_id','answer','is_correct','submitted_at'
  ]]).setFontWeight('bold');
  r.setFrozenRows(1);

  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  Logger.log('✓ Sheets URL：' + ss.getUrl());
  Logger.log('✓ Sheets ID：' + ss.getId());
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}`;

export default function HowToPage() {
  return (
    <main className="container mx-auto max-w-3xl px-6 py-12">
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-primary">
        <span className="inline-block size-1.5 rounded-full bg-primary" />
        setup guide · 15-20 min
      </div>

      <h1 className="text-4xl font-bold tracking-tight text-gradient-tech">
        如何取得三把 API Keys
      </h1>
      <p className="mt-2 text-muted-foreground">
        老實說：要 10–15 分鐘，需要 Google 帳號。但跑完一次以後你就有完整的雲端題庫系統。
      </p>

      {/* 概覽 */}
      <Card className="card-tech mt-8 p-6">
        <h2 className="text-lg font-bold">你會拿到三把 key</h2>
        <ol className="mt-3 space-y-2 font-mono text-sm">
          <li>
            <span className="text-primary">①</span> Gemini API Key — 給 AI 拆題、判層次、迷思診斷用（1 分鐘）
          </li>
          <li>
            <span className="text-primary">②</span> Sheets API URL — 你部署的 Apps Script Web App（10 分鐘）
          </li>
          <li>
            <span className="text-primary">③</span> Sheets API Secret — 你自己產的隨機字串（30 秒）
          </li>
        </ol>
      </Card>

      {/* Step 1 */}
      <Step n="1" title="拿 Gemini API Key（1 分鐘）" mins="1 min">
        <ol className="space-y-2 text-sm">
          <li>
            開{" "}
            <ExternalLink href="https://aistudio.google.com/apikey">
              aistudio.google.com/apikey
            </ExternalLink>
          </li>
          <li>登入你的 Google 帳號</li>
          <li>
            點「<strong>Create API key</strong>」→ 選一個 Google Cloud 專案（沒有就讓它自動建）
          </li>
          <li>
            複製出來的字串（長得像 <code className="rounded bg-muted/40 px-1.5 py-0.5 font-mono text-xs">AIzaSy...</code>）
          </li>
          <li>
            <strong>先放著</strong>，等等貼到 <Link href="/setup" className="text-primary underline">⚙ 設定</Link> 第 ③ 格
          </li>
        </ol>
        <Callout>
          ✅ 免費額度：Gemini 2.5 Flash 每分鐘 15 次、每天 1500 次。一個老師備課完全夠用。
        </Callout>
      </Step>

      {/* Step 2: Sheets */}
      <Step n="2" title="建立 Google Sheets 題庫（5 分鐘 · 用 bootstrap 腳本自動生）" mins="5 min">
        <p className="text-sm">
          這個工具需要一個有<strong>三張固定 tab</strong>（questions / papers / responses）的 Google Sheets。
          手動建很煩，所以我們幫你寫了一個 30 秒就跑完的 bootstrap 腳本：
        </p>

        <ol className="mt-4 space-y-2 text-sm">
          <li>
            打開{" "}
            <ExternalLink href="https://script.google.com/home">
              script.google.com/home
            </ExternalLink>{" "}
            → 點「<strong>新增專案</strong>」
          </li>
          <li>
            把預設的 <code className="rounded bg-muted/40 px-1.5 py-0.5 font-mono text-xs">function myFunction(){'{}'}</code>{" "}
            整個刪掉，貼下面這段：
          </li>
        </ol>

        <CopyBlock code={BOOTSTRAP_SNIPPET} />

        <ol start={3} className="mt-4 space-y-2 text-sm">
          <li>
            上方選單按「<strong>儲存</strong>」（或 Cmd+S）→ 取名隨意
          </li>
          <li>
            點上方「<strong>▶ 執行</strong>」按鈕（函式選 <code>bootstrapQuizBankSheets</code>）
          </li>
          <li>
            跳出授權對話框 → 點「<strong>檢閱權限</strong>」→ 用你的 Google 帳號登入
          </li>
          <li>
            出現「Google 尚未驗證這個應用程式」是正常的（這是你自己寫的） → 點「<strong>進階</strong>」→「
            <strong>前往「[專案名]」（不安全）</strong>」→「<strong>允許</strong>」
          </li>
          <li>
            執行完看下方「<strong>執行紀錄</strong>」，會印出新 Sheets 的 URL 和 ID
          </li>
          <li>
            點開那個 URL，你會看到一個全新的 Sheets，裡面已經有三張表 + 欄位 headers ✓
          </li>
          <li>
            <strong>把 Sheets ID 記下來</strong>，下一步要用
          </li>
        </ol>

        <Callout>
          💡 Sheets ID 就是 URL 中間那串：
          <code className="ml-2 rounded bg-muted/40 px-1.5 py-0.5 font-mono text-xs">
            https://docs.google.com/spreadsheets/d/<span className="text-primary">這串就是 ID</span>/edit
          </code>
        </Callout>
      </Step>

      {/* Step 3: Apps Script Code */}
      <Step n="3" title="部署 Apps Script Web App（5–8 分鐘）" mins="5-8 min">
        <ol className="space-y-2 text-sm">
          <li>
            在剛剛那個 Apps Script 專案，<strong>把 bootstrap 那段刪掉</strong>，貼上完整的{" "}
            <ExternalLink href="https://github.com/hk6429/quiz-bank-organizer-oss/blob/main/apps-script/Code.gs">
              Code.gs（GitHub 上）
            </ExternalLink>
          </li>
          <li>
            左側齒輪「<strong>專案設定</strong>」→ 滑到下方「<strong>指令碼屬性</strong>」→ 加兩個：
            <ul className="ml-5 mt-1 list-disc space-y-1">
              <li>
                <code className="rounded bg-muted/40 px-1.5 py-0.5 font-mono text-xs">SHEET_ID</code> = 剛剛的 Sheets ID
              </li>
              <li>
                <code className="rounded bg-muted/40 px-1.5 py-0.5 font-mono text-xs">SHEETS_API_SECRET</code> = 任意 64 字元隨機字串（下一步教怎麼產）
              </li>
            </ul>
          </li>
          <li>
            右上「<strong>部署</strong>」→「<strong>新增部署作業</strong>」
          </li>
          <li>
            類型選「<strong>網路應用程式</strong>」
          </li>
          <li>
            執行身分：「<strong>我</strong>」；存取權：「<strong>所有人</strong>」（一定要選這個）
          </li>
          <li>
            按「<strong>部署</strong>」→ 第一次會跳授權，「進階 → 仍要前往」
          </li>
          <li>
            複製給你的「<strong>網路應用程式 URL</strong>」（長得像{" "}
            <code className="rounded bg-muted/40 px-1.5 py-0.5 font-mono text-xs">
              https://script.google.com/macros/s/.../exec
            </code>
            ）
          </li>
          <li>
            這就是 <Link href="/setup" className="text-primary underline">⚙ 設定</Link> 的第 ① 格
          </li>
        </ol>
        <Callout>
          ⚠️ 之後修改 Code.gs 都要記得「<strong>新增部署作業</strong>」或「管理部署作業 → 編輯 → 版本選新版」，不會自動更新。
        </Callout>
      </Step>

      {/* Step 4: Secret */}
      <Step n="4" title="產 Sheets API Secret（30 秒）" mins="30 sec">
        <p className="text-sm">
          這是給訪客（也就是你自己）跟 Apps Script 之間驗證身分用的隨機字串。要做兩件事：
        </p>
        <ol className="mt-3 space-y-2 text-sm">
          <li>
            打開 macOS Terminal（或 Linux shell），跑：
          </li>
        </ol>
        <CopyBlock code="openssl rand -hex 32" />

        <ol start={2} className="mt-4 space-y-2 text-sm">
          <li>
            複製出來的 64 字元字串
          </li>
          <li>
            <strong>同時貼到兩個地方</strong>，必須一字不差：
            <ul className="ml-5 mt-1 list-disc space-y-1">
              <li>
                Apps Script 專案設定 → 指令碼屬性 →{" "}
                <code className="rounded bg-muted/40 px-1.5 py-0.5 font-mono text-xs">SHEETS_API_SECRET</code>
              </li>
              <li>
                這個 demo 的 <Link href="/setup" className="text-primary underline">⚙ 設定</Link> 第 ② 格
              </li>
            </ul>
          </li>
        </ol>

        <Callout>
          🔑 沒裝 openssl？任何隨機字串產生器都行（&gt; 32 字、含英數即可）。或直接到{" "}
          <ExternalLink href="https://www.uuidgenerator.net/">uuidgenerator.net</ExternalLink>{" "}
          拿一個 UUID 也可以。
        </Callout>
      </Step>

      {/* Final */}
      <Card className="card-tech mt-8 border-primary/40 p-6">
        <h2 className="text-lg font-bold text-primary">✅ 三把都拿到了？</h2>
        <p className="mt-2 text-sm">
          回到{" "}
          <Link href="/setup" className="text-primary underline font-medium">
            ⚙ Setup 頁
          </Link>
          ，把三把 key 貼進對應欄位。NavBar 右上角的指示燈會從紅色（缺）變綠色（ready），就可以開始用所有功能了。
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          記得：所有 key 只存在這個瀏覽器分頁的 sessionStorage，<strong>關掉分頁立刻消失</strong>。
          想長期用 → fork repo + 在你自己的 Vercel 設 env vars。
        </p>
      </Card>
    </main>
  );
}

function Step({
  n,
  title,
  mins,
  children,
}: {
  n: string;
  title: string;
  mins: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="card-tech mt-6 p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg border border-primary/40 bg-primary/10 font-mono text-base font-bold text-primary">
            {n}
          </span>
          <h2 className="text-xl font-bold tracking-tight">{title.split("（")[0]}</h2>
        </div>
        <span className="rounded-md border border-border bg-background/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          ⏱ {mins}
        </span>
      </div>
      <div className="mt-4">{children}</div>
    </Card>
  );
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline underline-offset-2 hover:text-primary/80"
    >
      {children} ↗
    </a>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-md border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">
      {children}
    </div>
  );
}

function CopyBlock({ code }: { code: string }) {
  return (
    <div className="relative mt-3">
      <pre className="overflow-x-auto rounded-md border border-border/60 bg-background/60 p-3 font-mono text-xs leading-relaxed text-foreground">
        {code}
      </pre>
      <button
        onClick={() => {
          if (typeof navigator !== "undefined" && navigator.clipboard) {
            navigator.clipboard.writeText(code);
          }
        }}
        className="absolute right-2 top-2 rounded border border-border/60 bg-background px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
      >
        ⧉ copy
      </button>
    </div>
  );
}
