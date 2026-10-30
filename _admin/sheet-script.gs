/**
 * HORA 课文网站 · 学生作答表格（Google Apps Script）
 * 一张表格、一个脚本，所有课文共用：每篇课文的作答分开存，学生用同一个班级码＋名字＋4位数字登录所有课文。
 *
 * 用法（详见《部署说明》）：
 *   1. 新建一个 Google 表格 → 扩展程序 → Apps Script，把这整段粘贴进去，替换原来的内容。
 *   2. 改下面两行：老师密码；班级码（可以不填）。
 *   3. 部署 → 新建部署 → 类型选“网页应用” → 执行身份“我”、谁可以访问“任何人” → 部署。
 *   4. 把得到的网址（以 /exec 结尾）发给 Claude，或者自己填进网站的 site-config.js。
 *
 * 表格里会自动出现四张表：
 *   学生：每个学生一行（班级、名字、数字指纹），所有课文共用。
 *   作答：每个学生每篇课文一行（课文、最近保存、读完几天、作答摘要、进度数据）。
 *   分享、回应：同学互看用。
 *   名单：老师填“班级、名字、密码（4 位数字）”。名单里有人时，只有班级、名字、密码三项都和名单一致才能签到；
 *         改密码直接改这一格，马上生效。名单是空的，学生自己定数字（第一次签到要把数字输两遍确认）。
 * 不要改表头；可以排序、筛选、查看。
 * 学生的 4 位数字不存原数，只存一个“指纹”。学生忘了数字：在“学生”表里删掉他那一行，他就能用新数字登录，
 * 之前各篇课文的作答还在“作答”表里，但会接不上；先把他的“作答摘要”复制出来。
 */

const TEACHER_PASSWORD = '在这里改成你的老师密码';
const CLASS_CODES = [];   // 例：['G8A','G8B']。留空 [] 表示任何班级码都可以。

/* ---------- 下面不用改 ---------- */
const HEAD = {
  学生: ['编号', '班级', '名字', '数字指纹', '第一次'],
  作答: ['键', '编号', '课文', '课文名', '班级', '名字', '最近保存', '读完几天', '作答摘要', '进度数据1', '进度数据2', '进度数据3', '进度数据4', '进度数据5'],
  分享: ['编号', '课文', '班级', '题目', '分享内容', '时间', '撤下'],
  回应: ['来自', '给', '课文', '班级', '题目', '内容', '时间'],
  名单: ['班级', '名字', '密码', '备注']
};
const CHUNK = 45000; // 一个格子最多 5 万字，进度数据分几格存

function doGet() {
  return ContentService.createTextOutput('HORA 表格后台正常运行。');
}

function doPost(e) {
  let out;
  try {
    out = handle(JSON.parse(e.postData.contents));
  } catch (err) {
    out = { ok: false, err: (err && err.code) || 'server', msg: String(err && err.message || err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function fail(code) { const e = new Error(code); e.code = code; throw e; }

function handle(q) {
  const a = q.action;
  const lesson = String(q.lesson || '').slice(0, 60);
  if (!lesson) fail('bad');
  if (a === 't_all' || a === 't_hide') {
    if (String(q.pw || '') !== TEACHER_PASSWORD) fail('pw');
    return a === 't_all' ? teacherAll(lesson) : teacherHide(lesson, q.sid);
  }
  const cls = String(q.cls || '').replace(/\s+/g, '').toUpperCase();
  let name = String(q.name || '').replace(/\s+/g, ' ').trim().slice(0, 12);
  const pin = String(q.pin || '');
  if (!cls || !name || !/^\d{4}$/.test(pin)) fail('bad');
  if (CLASS_CODES.length && CLASS_CODES.map(c => c.toUpperCase()).indexOf(cls) < 0) fail('cls');
  const roster = rosterCheck(cls, name, pin);   // 有名单：三项都对才行，否则报错（名单为空时不检查）
  if (roster) name = roster.name;               // 名字大小写不同也认，统一用名单上的写法
  const sid = hash('sid|' + cls + '|' + name).slice(0, 16);
  student(sid, cls, name, pin, !!q.isNew, roster);   // 第一次签到要带 isNew（数字输两遍确认过）；数字不对就报错
  const me = { sid: sid, cls: cls, name: name, lesson: lesson, title: String(q.lessonTitle || '').slice(0, 60) };
  if (a === 'login') return { ok: true, sid: sid, name: name, state: readState(me) };
  if (a === 'save') return save(me, q);
  if (a === 'share') return share(me, q);
  if (a === 'gallery') return gallery(me, q);
  if (a === 'reply') return reply(me, q);
  fail('bad');
}

/* 只有“新加一行”时才排队（避免两个请求同时给同一个人加两行）；平时读写各自那一行，不用排队，二三十人同时用也不会互相等 */
function withLock(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { return fn(); } finally { lock.releaseLock(); }
}

function sheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(HEAD[name]);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEAD[name].length).setFontWeight('bold');
  }
  return sh;
}

function hash(s) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8)
    .map(b => ('0' + (b & 255).toString(16)).slice(-2)).join('');
}

function findRow(sh, value) {
  if (sh.getLastRow() < 2) return 0;
  const f = sh.getRange(2, 1, sh.getLastRow() - 1, 1).createTextFinder(value).matchEntireCell(true).findNext();
  return f ? f.getRow() : 0;
}

function rosterCheck(cls, name, pin) {
  const sh = sheet('名单');
  if (sh.getLastRow() < 2) return false;
  const rows = sh.getRange(2, 1, sh.getLastRow() - 1, 3).getDisplayValues()
    .map(r => [String(r[0]).replace(/\s+/g, '').toUpperCase(), String(r[1]).replace(/\s+/g, ' ').trim(), String(r[2]).trim()])
    .filter(r => r[0] && r[1]);
  if (!rows.length) return false;
  // 数字格里写 0123 有时会变成 123：补足 4 位再比
  const hit = rows.filter(r => r[0] === cls && r[1].toLowerCase() === name.toLowerCase() && ('0000' + r[2]).slice(-4) === pin)[0];
  if (!hit) fail('roster');
  return { name: hit[1] };
}

function student(sid, cls, name, pin, isNew, roster) {
  const sh = sheet('学生');
  const fp = hash('pin|' + sid + '|' + pin).slice(0, 24);
  const r = findRow(sh, sid);
  if (roster) {   // 有名单时以名单为准：没有就记一行，有就更新数字指纹（老师改了密码也接得上）
    if (!r) withLock(() => { if (!findRow(sh, sid)) sh.appendRow([sid, cls, name, fp, new Date()]); });
    else if (sh.getRange(r, 4).getValue() !== fp) sh.getRange(r, 4).setValue(fp);
    return;
  }
  if (!r && !isNew) fail('new');
  if (!r) withLock(() => { if (!findRow(sh, sid)) sh.appendRow([sid, cls, name, fp, new Date()]); });
  else if (sh.getRange(r, 4).getValue() !== fp) fail('pin');
}

function answerRow(me, create) {
  const sh = sheet('作答');
  const key = me.sid + '|' + me.lesson;
  let r = findRow(sh, key);
  if (!r && create) {
    r = withLock(() => {
      const again = findRow(sh, key);
      if (again) return again;
      sh.appendRow([key, me.sid, me.lesson, me.title, me.cls, me.name, new Date(), 0, '', '', '', '', '', '']);
      return sh.getLastRow();
    });
  }
  return { sh: sh, r: r };
}

function readState(me) {
  const row = answerRow(me, false);
  if (!row.r) return null;
  const parts = row.sh.getRange(row.r, 10, 1, 5).getValues()[0].join('');
  if (!parts) return null;
  try { return JSON.parse(parts); } catch (e) { return null; }
}

function save(me, q) {
  const json = JSON.stringify(q.payload || {});
  if (json.length > CHUNK * 5) fail('big');
  const cells = [];
  for (let i = 0; i < 5; i++) cells.push(json.slice(i * CHUNK, (i + 1) * CHUNK));
  const done = Object.keys((q.payload && q.payload.done) || {}).length;
  const row = answerRow(me, true);
  row.sh.getRange(row.r, 7, 1, 8).setValues([[new Date(), done, String(q.summary || '').slice(0, CHUNK)].concat(cells)]);
  return { ok: true };
}

function share(me, q) {
  const sh = sheet('分享');
  const key = String(q.key || '');
  const items = JSON.stringify(q.items || []).slice(0, CHUNK);
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === me.sid && data[i][1] === me.lesson && data[i][3] === key) {
      sh.getRange(i + 1, 5, 1, 2).setValues([[items, new Date()]]);
      return { ok: true };
    }
  }
  withLock(() => sh.appendRow([me.sid, me.lesson, me.cls, key, items, new Date(), false]));
  return { ok: true };
}

function gallery(me, q) {
  const key = String(q.key || '');
  const shares = [], got = [];
  const s = sheet('分享').getDataRange().getValues();
  for (let i = 1; i < s.length; i++) {
    const [id, lesson, c, k, items, , hidden] = s[i];
    if (id !== me.sid && lesson === me.lesson && c === me.cls && k === key && hidden !== true) {
      try { shares.push({ id: id, items: JSON.parse(items) }); } catch (e) {}
    }
  }
  const rp = sheet('回应').getDataRange().getValues();
  for (let i = 1; i < rp.length; i++) {
    const [from, to, lesson, c, k, text] = rp[i];
    if (to === me.sid && lesson === me.lesson && k === key) got.push(String(text));
  }
  return { ok: true, shares: shares, got: got };
}

function reply(me, q) {
  const text = String(q.text || '').slice(0, 500);
  if (!text || !q.to) fail('bad');
  sheet('回应').appendRow([me.sid, String(q.to), me.lesson, me.cls, String(q.key || ''), text, new Date()]);
  return { ok: true };
}

function teacherAll(lesson) {
  const shared = {};
  const s = sheet('分享').getDataRange().getValues();
  for (let i = 1; i < s.length; i++) if (s[i][1] === lesson && s[i][6] !== true) shared[s[i][0]] = true;
  const rows = [];
  const an = sheet('作答').getDataRange().getValues();
  for (let i = 1; i < an.length; i++) {
    const [, sid, l, , cls, name] = an[i];
    if (l !== lesson) continue;
    let payload = null;
    try { payload = JSON.parse(an[i].slice(9, 14).join('')); } catch (e) {}
    rows.push({ sid: sid, cls: cls, name: name, payload: payload || { name: name }, shared: !!shared[sid] });
  }
  return { ok: true, rows: rows };
}

function teacherHide(lesson, sid) {
  const sh = sheet('分享');
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) if (data[i][0] === sid && data[i][1] === lesson) sh.getRange(i + 1, 7).setValue(true);
  return { ok: true };
}
