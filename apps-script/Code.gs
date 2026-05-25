/**
 * 試卷題庫整理器 — Apps Script Web App API
 *
 * 部署步驟：
 * 1. 在 Google Sheet 內：Extensions → Apps Script
 * 2. 把這份檔案內容貼入 Code.gs
 * 3. Project Settings → Script Properties 加入：
 *    - SHEET_ID = <試算表 ID>
 *    - API_SECRET = <與 Next.js .env 同值>
 * 4. Deploy → New deployment → Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. 把 Web app URL 填入 Next.js 的 SHEETS_API_URL
 *
 * 試算表必須含以下 sheet（首列為標題）：
 *   - questions: id, subject, grade, unit, subconcept, type, stem,
 *                options, answer, explanation, difficulty, bloom, status,
 *                source, image_url, tags, usage_count, last_used_at,
 *                correct_rate, discrimination, created_at, updated_at, reviewer
 *   - papers:    paper_id, name, subject, grade, units, question_ids,
 *                config_json, created_at, docs_url, pdf_url, form_url
 *   - responses: response_id, paper_id, student_id, question_id, answer,
 *                is_correct, answered_at
 */

const SHEET_ID = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
const API_SECRET = PropertiesService.getScriptProperties().getProperty('API_SECRET');

/**
 * Run once from the editor to grant Drive + Docs scopes to the Web App.
 * No params needed — touches DriveApp + DocumentApp to trigger the auth dialog.
 */
function testAuth() {
  const it = DriveApp.getFolders();
  let n = 0;
  while (it.hasNext() && n < 1) { it.next(); n++; }
  const doc = DocumentApp.create('QuizBank Auth Test');
  DriveApp.getFileById(doc.getId()).setTrashed(true);
  const form = FormApp.create('QuizBank Auth Test Form');
  DriveApp.getFileById(form.getId()).setTrashed(true);
  Logger.log('✅ Drive + Docs + Forms auth OK');
  return 'OK';
}

function doGet(e) {
  return handle(e, null);
}

function doPost(e) {
  let body = {};
  try {
    body = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
  } catch (err) {
    return jsonResponse({ ok: false, error: 'BAD_JSON', message: err.message }, 400);
  }
  return handle(e, body);
}

function handle(e, body) {
  const t0 = Date.now();

  // Auth
  const secret = (e.parameter && e.parameter.secret)
    || (e.headers && e.headers['X-API-Secret']);
  if (secret !== API_SECRET) {
    return jsonResponse({ ok: false, error: 'UNAUTHORIZED', message: 'Bad secret' }, 401);
  }

  const action = (e.parameter && e.parameter.action) || (body && body.action);

  try {
    let data;
    switch (action) {
      case 'list':         data = listQuestions(e.parameter); break;
      case 'get':          data = getQuestion(e.parameter.id); break;
      case 'create':       data = createQuestion(body.question); break;
      case 'update':       data = updateQuestion(body.id, body.patch); break;
      case 'batch_import': data = batchImport(body.questions); break;
      case 'review':       data = review(body.id, body.status, body.reviewer, body.comment); break;
      case 'compose':      data = compose(body.config); break;
      case 'list_papers':  data = listPapers(); break;
      case 'get_paper':    data = getPaper(e.parameter.paper_id); break;
      case 'export_doc':   data = exportDoc(body.paper_id, body.versions || ['student','answer','explanation']); break;
      case 'create_form':  data = createForm(body.paper_id); break;
      case 'analytics':    data = analytics(e.parameter); break;
      default:
        return jsonResponse({ ok: false, error: 'UNKNOWN_ACTION', message: String(action) }, 400);
    }
    return jsonResponse({ ok: true, data, meta: { ts: new Date().toISOString(), exec_ms: Date.now() - t0 } });
  } catch (err) {
    return jsonResponse({ ok: false, error: 'SERVER_ERROR', message: err.message, details: err.stack }, 500);
  }
}

function jsonResponse(obj, status) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function sheet(name) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const s = ss.getSheetByName(name);
  if (!s) throw new Error('Sheet not found: ' + name);
  return s;
}

function rowsToObjects(s) {
  const values = s.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  return values.slice(1).map(row => {
    const o = {};
    headers.forEach((h, i) => { o[h] = row[i]; });
    if (o.options && typeof o.options === 'string') {
      try { o.options = JSON.parse(o.options); } catch (e) {}
    }
    if (o.tags && typeof o.tags === 'string') {
      o.tags = o.tags ? o.tags.split(',').map(s => s.trim()) : [];
    }
    return o;
  });
}

function listQuestions(p) {
  const all = rowsToObjects(sheet('questions'));
  return all.filter(q => {
    if (p.subject && q.subject !== p.subject) return false;
    if (p.unit && q.unit !== p.unit) return false;
    if (p.status && q.status !== p.status) return false;
    return true;
  });
}

function getQuestion(id) {
  const all = rowsToObjects(sheet('questions'));
  const q = all.find(x => x.id === id);
  if (!q) throw new Error('Question not found: ' + id);
  return q;
}

function nextId(subject, grade) {
  const code = {
    '自我領導力': 'LDR', '國文': 'CHI', '自然': 'SCI',
    '社會': 'SOC', '數學': 'MAT', '英語': 'ENG'
  }[subject] || 'GEN';
  const cn = { '一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十':10,'十一':11,'十二':12 };
  let gradeNum = String(grade).replace(/[^\d]/g, '');
  if (!gradeNum) {
    const m = String(grade).match(/[一二三四五六七八九十]+/);
    gradeNum = m ? String(cn[m[0]] || 0) : '0';
  }
  const all = rowsToObjects(sheet('questions'));
  const prefix = `${code}-G${gradeNum}-`;
  const nums = all
    .filter(q => String(q.id).indexOf(prefix) === 0)
    .map(q => parseInt(String(q.id).slice(prefix.length), 10) || 0);
  const next = (nums.length ? Math.max.apply(null, nums) : 0) + 1;
  return prefix + String(next).padStart(4, '0');
}

function createQuestion(q) {
  const s = sheet('questions');
  const now = new Date().toISOString();
  const id = q.id || nextId(q.subject, q.grade);
  const headers = s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0];
  const row = headers.map(h => {
    if (h === 'id') return id;
    if (h === 'options' && Array.isArray(q.options)) return JSON.stringify(q.options);
    if (h === 'tags' && Array.isArray(q.tags)) return q.tags.join(',');
    if (h === 'status') return q.status || '草稿';
    if (h === 'usage_count') return q.usage_count || 0;
    if (h === 'created_at') return q.created_at || now;
    if (h === 'updated_at') return now;
    return q[h] !== undefined ? q[h] : '';
  });
  s.appendRow(row);
  return Object.assign({}, q, { id, created_at: now, updated_at: now });
}

function updateQuestion(id, patch) {
  const s = sheet('questions');
  const values = s.getDataRange().getValues();
  const headers = values[0];
  const idCol = headers.indexOf('id');
  const updatedAtCol = headers.indexOf('updated_at');
  for (let i = 1; i < values.length; i++) {
    if (values[i][idCol] === id) {
      Object.keys(patch).forEach(k => {
        const col = headers.indexOf(k);
        if (col < 0) return;
        let v = patch[k];
        if (k === 'options' && Array.isArray(v)) v = JSON.stringify(v);
        if (k === 'tags' && Array.isArray(v)) v = v.join(',');
        s.getRange(i + 1, col + 1).setValue(v);
      });
      if (updatedAtCol >= 0) s.getRange(i + 1, updatedAtCol + 1).setValue(new Date().toISOString());
      return getQuestion(id);
    }
  }
  throw new Error('Question not found: ' + id);
}

function batchImport(questions) {
  const created = [];
  questions.forEach(q => {
    const r = createQuestion(q);
    created.push(r.id);
  });
  return { created: created.length, ids: created };
}

function review(id, status, reviewer, comment) {
  const patch = { status, reviewer };
  if (comment) patch.tags = comment;
  return updateQuestion(id, patch);
}

function compose(config) {
  const all = rowsToObjects(sheet('questions'));
  const now = Date.now();
  const cutoff = config.exclude_recent_days
    ? now - config.exclude_recent_days * 86400000 : 0;

  const pool = all.filter(q => {
    if (q.status !== '已審') return false;
    if (config.subject && q.subject !== config.subject) return false;
    if (config.grade && q.grade !== config.grade) return false;
    if (config.units && config.units.length && config.units.indexOf(q.unit) < 0) return false;
    if (cutoff && q.last_used_at) {
      const t = new Date(q.last_used_at).getTime();
      if (t && t > cutoff) return false;
    }
    return true;
  });

  const picked = [];
  const layout = config.layout || {};
  const ratio = config.difficulty_ratio || {};

  Object.keys(layout).forEach(type => {
    const n = layout[type];
    if (!n) return;
    const subPool = pool.filter(q => q.type === type && picked.indexOf(q) < 0);

    // Distribute by difficulty ratio
    const targets = {
      '易': Math.round(n * (ratio['易'] || 0)),
      '中': Math.round(n * (ratio['中'] || 0)),
      '難': Math.round(n * (ratio['難'] || 0))
    };
    let total = targets['易'] + targets['中'] + targets['難'];
    if (total === 0) targets['中'] = n;  // fallback: all medium
    else if (total < n) targets['中'] += (n - total);
    else if (total > n) targets['中'] -= (total - n);

    ['易', '中', '難'].forEach(diff => {
      const sub = subPool.filter(q => q.difficulty === diff && picked.indexOf(q) < 0);
      shuffle(sub);
      picked.push.apply(picked, sub.slice(0, targets[diff]));
    });

    // If short on a difficulty, top up from remaining of any difficulty
    const stillNeed = n - picked.filter(q => q.type === type).length;
    if (stillNeed > 0) {
      const remaining = subPool.filter(q => picked.indexOf(q) < 0);
      shuffle(remaining);
      picked.push.apply(picked, remaining.slice(0, stillNeed));
    }
  });

  if (config.shuffle_questions) shuffle(picked);

  // Bump usage_count + last_used_at on picked questions
  const qSheet = sheet('questions');
  const values = qSheet.getDataRange().getValues();
  const headers = values[0];
  const idCol = headers.indexOf('id');
  const ucCol = headers.indexOf('usage_count');
  const luCol = headers.indexOf('last_used_at');
  const pickedIds = picked.map(q => q.id);
  const nowIso = new Date().toISOString();
  for (let i = 1; i < values.length; i++) {
    if (pickedIds.indexOf(values[i][idCol]) >= 0) {
      if (ucCol >= 0) qSheet.getRange(i + 1, ucCol + 1).setValue((+values[i][ucCol] || 0) + 1);
      if (luCol >= 0) qSheet.getRange(i + 1, luCol + 1).setValue(nowIso);
    }
  }

  const paper_id = 'P-' + Utilities.getUuid().slice(0, 8);
  sheet('papers').appendRow([
    paper_id,
    config.name,
    config.subject,
    config.grade,
    (config.units || []).join(','),
    picked.map(q => q.id).join(','),
    JSON.stringify(config),
    nowIso,
    '', '', ''
  ]);

  return {
    paper_id,
    question_ids: picked.map(q => q.id),
    questions: picked,
    pool_size: pool.length,
    requested: Object.keys(layout).reduce((a, k) => a + (layout[k] || 0), 0)
  };
}

function listPapers() {
  return rowsToObjects(sheet('papers'));
}

function getPaper(paper_id) {
  const all = rowsToObjects(sheet('papers'));
  const p = all.find(x => x.paper_id === paper_id);
  if (!p) throw new Error('Paper not found: ' + paper_id);
  const ids = String(p.question_ids || '').split(',').filter(Boolean);
  const allQ = rowsToObjects(sheet('questions'));
  p.questions = ids.map(id => allQ.find(q => q.id === id)).filter(Boolean);
  return p;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function exportDoc(paper_id, versions) {
  const paper = getPaper(paper_id);
  const out = {};

  // Build/ensure folder
  const folderName = 'QuizBank Papers';
  let folder;
  const it = DriveApp.getFoldersByName(folderName);
  folder = it.hasNext() ? it.next() : DriveApp.createFolder(folderName);

  versions.forEach(function(version) {
    const suffix = { student: '學生版', answer: '答案版', explanation: '解析版' }[version] || version;
    const docName = paper.name + ' - ' + suffix + ' (' + paper.paper_id + ')';
    const doc = DocumentApp.create(docName);
    const body = doc.getBody();

    // Header
    const header = body.appendParagraph(paper.name);
    header.setHeading(DocumentApp.ParagraphHeading.HEADING1);
    header.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

    const meta = body.appendParagraph(
      paper.subject + ' ｜ ' + paper.grade + ' ｜ 共 ' + paper.questions.length + ' 題'
    );
    meta.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

    if (version === 'student') {
      body.appendParagraph('班級：　　　　座號：　　　　姓名：　　　　　　')
        .setAlignment(DocumentApp.HorizontalAlignment.LEFT);
    }
    body.appendHorizontalRule();

    // Questions
    paper.questions.forEach(function(q, i) {
      const stem = body.appendParagraph((i + 1) + '. ' + q.stem);
      stem.setSpacingBefore(8).setSpacingAfter(4);

      if (q.options && q.options.length) {
        q.options.forEach(function(opt, idx) {
          const letter = String.fromCharCode(65 + idx);
          const optStr = '  (' + letter + ') ' + String(opt).replace(/^[A-D]\.\s*/, '');
          const isAnswer = q.answer === letter
            || q.answer === opt
            || (q.type === '是非' && idx === 0 && q.answer === '是')
            || (q.type === '是非' && idx === 1 && q.answer === '否');
          const p = body.appendParagraph(optStr);
          if (version !== 'student' && isAnswer) {
            p.editAsText().setBold(true).setForegroundColor('#16a34a');
          }
        });
      }

      if (version === 'student') {
        if (q.type === '問答') {
          body.appendParagraph('').setSpacingAfter(40);  // blank space
        } else if (q.type === '填充') {
          body.appendParagraph('答：______________________').setSpacingAfter(8);
        }
      } else {
        // answer / explanation
        const ans = body.appendParagraph('  ✓ 答案：' + (q.answer || ''));
        ans.editAsText().setBold(true).setForegroundColor('#16a34a');
        if (version === 'explanation' && q.explanation) {
          const ex = body.appendParagraph('  📖 解析：' + q.explanation);
          ex.editAsText().setForegroundColor('#525252');
        }
      }
    });

    doc.saveAndClose();

    // Move to folder + share
    const file = DriveApp.getFileById(doc.getId());
    file.moveTo(folder);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // PDF
    const pdfBlob = doc.getAs('application/pdf');
    const pdfFile = folder.createFile(pdfBlob).setName(docName + '.pdf');
    pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    out[version] = { doc_url: doc.getUrl(), pdf_url: pdfFile.getUrl() };
  });

  // Write back to papers sheet (docs_url = student doc, pdf_url = student pdf)
  const s = sheet('papers');
  const values = s.getDataRange().getValues();
  const headers = values[0];
  const idCol = headers.indexOf('paper_id');
  const docCol = headers.indexOf('docs_url');
  const pdfCol = headers.indexOf('pdf_url');
  for (let i = 1; i < values.length; i++) {
    if (values[i][idCol] === paper_id) {
      const studentLinks = out.student || out.answer || out.explanation;
      if (studentLinks) {
        if (docCol >= 0) s.getRange(i + 1, docCol + 1).setValue(studentLinks.doc_url);
        if (pdfCol >= 0) s.getRange(i + 1, pdfCol + 1).setValue(studentLinks.pdf_url);
      }
      break;
    }
  }

  return out;
}

function createForm(paper_id) {
  const paper = getPaper(paper_id);
  const formTitle = paper.name + ' (' + paper.paper_id + ')';

  // Move form to QuizBank Papers folder
  const folderName = 'QuizBank Papers';
  const it = DriveApp.getFoldersByName(folderName);
  const folder = it.hasNext() ? it.next() : DriveApp.createFolder(folderName);

  const form = FormApp.create(formTitle);
  form.setDescription(paper.subject + ' ｜ ' + paper.grade + ' ｜ 共 ' + paper.questions.length + ' 題')
    .setIsQuiz(true)
    .setCollectEmail(true)
    .setShuffleQuestions(false)
    .setShowLinkToRespondAgain(false)
    .setConfirmationMessage('作答完成！等待老師批改後可看到結果。');

  paper.questions.forEach(function(q, i) {
    const title = (i + 1) + '. ' + q.stem;
    if (q.type === '選擇') {
      const item = form.addMultipleChoiceItem();
      item.setTitle(title).setRequired(true).setPoints(5);
      const choices = (q.options || []).map(function(opt, idx) {
        const letter = String.fromCharCode(65 + idx);
        const clean = String(opt).replace(/^[A-D]\.\s*/, '');
        const display = '(' + letter + ') ' + clean;
        const isAnswer = q.answer === letter || q.answer === opt;
        return item.createChoice(display, isAnswer);
      });
      item.setChoices(choices);
      if (q.explanation) item.setFeedbackForCorrect(FormApp.createFeedback().setText(q.explanation).build());

    } else if (q.type === '是非') {
      const item = form.addMultipleChoiceItem();
      item.setTitle(title).setRequired(true).setPoints(3);
      item.setChoices([
        item.createChoice('是', q.answer === '是'),
        item.createChoice('否', q.answer === '否'),
      ]);
      if (q.explanation) item.setFeedbackForCorrect(FormApp.createFeedback().setText(q.explanation).build());

    } else if (q.type === '填充') {
      const item = form.addTextItem();
      item.setTitle(title).setRequired(true).setPoints(5);
      // Accept multiple correct answers separated by ; or ；
      const accepted = String(q.answer || '').split(/[;；]/).map(function(s){return s.trim();}).filter(Boolean);
      if (accepted.length) {
        const v = FormApp.createTextValidation()
          .setHelpText('請填寫答案')
          .requireTextMatchesPattern(accepted.map(escapeRegex).join('|'))
          .build();
        item.setValidation(v);
      }

    } else if (q.type === '問答') {
      const item = form.addParagraphTextItem();
      item.setTitle(title).setRequired(true).setPoints(10);
      if (q.explanation) {
        item.setHelpText('參考答案（提交後可看）：' + q.explanation.substring(0, 200));
      }
    }
  });

  // Save form to folder
  const file = DriveApp.getFileById(form.getId());
  file.moveTo(folder);

  // Link responses to our spreadsheet (creates a responses sheet)
  try {
    form.setDestination(FormApp.DestinationType.SPREADSHEET, SHEET_ID);
  } catch (e) {
    // If already set or fails, ignore
  }

  // Write back form_url to papers sheet
  const s = sheet('papers');
  const values = s.getDataRange().getValues();
  const headers = values[0];
  const idCol = headers.indexOf('paper_id');
  const formCol = headers.indexOf('form_url');
  for (let i = 1; i < values.length; i++) {
    if (values[i][idCol] === paper_id) {
      if (formCol >= 0) s.getRange(i + 1, formCol + 1).setValue(form.getPublishedUrl());
      break;
    }
  }

  return {
    form_url: form.getPublishedUrl(),
    edit_url: form.getEditUrl(),
    responses_sheet: 'Form Responses (linked to ' + SHEET_ID + ')',
  };
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function analytics(p) {
  if (!p.paper_id) return {};
  const paper = getPaper(p.paper_id);
  const ss = SpreadsheetApp.openById(SHEET_ID);

  // Find the form responses sheet associated with this paper
  // Google Forms creates sheets named "表單回應 1", "Form Responses 1", or similar
  // Match by checking if title contains a question stem
  const sheets = ss.getSheets();
  let respSheet = null;
  for (let s = 0; s < sheets.length; s++) {
    const name = sheets[s].getName();
    if (['questions', 'papers', 'responses', 'analytics_cache'].indexOf(name) >= 0) continue;
    const headerRow = sheets[s].getRange(1, 1, 1, sheets[s].getLastColumn()).getValues()[0];
    // Match by finding any question stem in the header titles
    const firstStem = paper.questions[0] && paper.questions[0].stem;
    if (firstStem) {
      const hit = headerRow.some(h => String(h).indexOf(firstStem.substring(0, 20)) >= 0);
      if (hit) { respSheet = sheets[s]; break; }
    }
  }

  if (!respSheet) {
    return { paper, has_responses: false, message: '尚未找到表單回應（學生還沒作答？）' };
  }

  const all = respSheet.getDataRange().getValues();
  if (all.length < 2) {
    return { paper, has_responses: false, total_responses: 0, message: '尚無作答資料' };
  }

  const headers = all[0].map(String);
  const rows = all.slice(1);

  // Map question_id → column index by matching stem
  const qColMap = paper.questions.map(q => {
    const idx = headers.findIndex(h => {
      const clean = String(h).replace(/^\d+\.\s*/, '').trim();
      return clean.indexOf(q.stem.substring(0, 30)) >= 0 || q.stem.indexOf(clean.substring(0, 30)) >= 0;
    });
    return { q, col: idx };
  });

  // Per-question stats
  const total_n = rows.length;
  const perQ = qColMap.map(item => {
    const q = item.q;
    if (item.col < 0) return { question_id: q.id, error: 'column_not_matched' };

    const answers = rows.map(r => String(r[item.col] || '').trim());
    const correctAnswers = answers.map(a => isCorrect(a, q));
    const correctCount = correctAnswers.filter(Boolean).length;

    // Distractor distribution (for 選擇 and 是非)
    const dist = {};
    if (q.type === '選擇' || q.type === '是非') {
      answers.forEach(a => {
        if (!a) return;
        const key = a.length > 50 ? a.substring(0, 50) + '…' : a;
        dist[key] = (dist[key] || 0) + 1;
      });
    }

    // Discrimination: top 27% vs bottom 27% scorers on this question
    // Score per respondent = total correct across all questions
    let discrim = null;
    if (total_n >= 5) {
      const scores = rows.map((r, i) => {
        let s = 0;
        qColMap.forEach(it => {
          if (it.col < 0) return;
          if (isCorrect(String(r[it.col] || '').trim(), it.q)) s++;
        });
        return { idx: i, score: s };
      });
      scores.sort((a, b) => b.score - a.score);
      const k = Math.max(1, Math.floor(total_n * 0.27));
      const high = scores.slice(0, k).map(x => x.idx);
      const low = scores.slice(-k).map(x => x.idx);
      const hCorrect = high.filter(i => correctAnswers[i]).length / k;
      const lCorrect = low.filter(i => correctAnswers[i]).length / k;
      discrim = hCorrect - lCorrect;
    }

    return {
      question_id: q.id,
      type: q.type,
      stem: q.stem,
      correct_answer: q.answer,
      total_responses: total_n,
      correct_count: correctCount,
      correct_rate: total_n ? correctCount / total_n : null,
      discrimination: discrim,
      distractor_dist: dist,
    };
  });

  // Cache back into questions sheet
  const qSheet = sheet('questions');
  const qVals = qSheet.getDataRange().getValues();
  const qHeaders = qVals[0];
  const idCol = qHeaders.indexOf('id');
  const crCol = qHeaders.indexOf('correct_rate');
  const dCol = qHeaders.indexOf('discrimination');
  perQ.forEach(stat => {
    if (stat.correct_rate == null) return;
    for (let i = 1; i < qVals.length; i++) {
      if (qVals[i][idCol] === stat.question_id) {
        if (crCol >= 0) qSheet.getRange(i + 1, crCol + 1).setValue(stat.correct_rate);
        if (dCol >= 0 && stat.discrimination != null) qSheet.getRange(i + 1, dCol + 1).setValue(stat.discrimination);
        break;
      }
    }
  });

  return {
    paper,
    has_responses: true,
    total_responses: total_n,
    per_question: perQ,
    paper_avg: perQ.filter(x => x.correct_rate != null).reduce((a, x) => a + x.correct_rate, 0)
      / Math.max(1, perQ.filter(x => x.correct_rate != null).length),
  };
}

function isCorrect(answer, q) {
  if (!answer) return false;
  if (q.type === '選擇') {
    // Answer in form may be "(B) 為下週段考預作複習計畫" or "B" — match either
    const m = answer.match(/\(([A-D])\)/);
    if (m && q.answer === m[1]) return true;
    if (q.answer && answer.indexOf(q.answer) === 0) return true;
    // Match by option text
    if (q.options) {
      const idx = q.options.findIndex(o => String(o).replace(/^[A-D]\.\s*/, '') === answer.replace(/^\([A-D]\)\s*/, ''));
      if (idx >= 0 && q.answer === String.fromCharCode(65 + idx)) return true;
    }
    return false;
  }
  if (q.type === '是非') return answer === q.answer;
  if (q.type === '填充') {
    const accepted = String(q.answer || '').split(/[;；]/).map(s => s.trim());
    return accepted.indexOf(answer.trim()) >= 0;
  }
  // 問答 needs manual grading; cannot auto-score
  return null;
}
