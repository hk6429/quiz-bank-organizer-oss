/**
 * 一鍵建立試卷題庫 Google Sheets
 *
 * 使用方式（給訪客看的）：
 * 1. 開 https://script.google.com/home → 點「新增專案」
 * 2. 把這整份貼進 Code.gs（取代預設內容）
 * 3. 上方選單按執行（▶）→ 跳出授權對話框 → 「進階」→「仍要前往」
 * 4. 看「執行紀錄」會印出新建 Sheets 的 URL 與 ID
 * 5. 打開那個 Sheets，三張表都建好了
 * 6. 接著回 GitHub README 的「部署 Apps Script Web App」步驟
 */

function bootstrapQuizBankSheets() {
  const ss = SpreadsheetApp.create('試卷題庫 ' + new Date().toLocaleDateString('zh-TW'));

  // 1) questions
  const q = ss.getActiveSheet();
  q.setName('questions');
  const qHeaders = [
    'id','subject','grade','unit','subconcept','type','difficulty','bloom',
    'stem','options','answer','explanation',
    'status','reviewer','comment',
    'used_in_papers','created_at','updated_at','tags'
  ];
  q.getRange(1, 1, 1, qHeaders.length).setValues([qHeaders]).setFontWeight('bold');
  q.setFrozenRows(1);

  // 2) papers
  const p = ss.insertSheet('papers');
  const pHeaders = [
    'paper_id','name','subject','grade','units','total',
    'layout','difficulty_ratio','question_ids',
    'version_a_order','version_b_order','created_at','exported_at'
  ];
  p.getRange(1, 1, 1, pHeaders.length).setValues([pHeaders]).setFontWeight('bold');
  p.setFrozenRows(1);

  // 3) responses
  const r = ss.insertSheet('responses');
  const rHeaders = [
    'response_id','paper_id','student_id','question_id','answer','is_correct','submitted_at'
  ];
  r.getRange(1, 1, 1, rHeaders.length).setValues([rHeaders]).setFontWeight('bold');
  r.setFrozenRows(1);

  const id = ss.getId();
  const url = ss.getUrl();

  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  Logger.log('✓ 建立完成');
  Logger.log('Sheets URL：' + url);
  Logger.log('Sheets ID（之後要貼到 Script Property SHEET_ID）：');
  Logger.log(id);
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return { id: id, url: url };
}
