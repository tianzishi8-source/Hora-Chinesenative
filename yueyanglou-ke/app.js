/* 《岳阳楼记》课堂版（课后单机，配合课堂 10 节）
 * 四个板块：沉浸体验《邓州的秋天》、背诵帮手＋练一练、字词卡＋练一练、模拟测验。不用 AI，所有回应都预先写好。
 * 内容在 data/：text.js（原文）、story.js（剧情）、words.js（字词）、tests.js（测验）。地址后加 ?sample=1 读 data/_sample/ 里的样例。
 * 签到：读首页的 sessionStorage hora-session（没签到就回首页签到）。进度存本机（按“班级|名字”分开），防抖同步到老师的表格（课文 id：g9-yueyanglou-ke）。
 * 录音：沉浸体验里范公、旁白、其他人物和“我”（学生选的声音，8 种）的台词，在 voice/index.js（tools/yk_record.py 生成的 window.PROJ_VOICE）里有录音就播放；没有就静音。
 *   语速：录音默认 1.2 倍速播放（playbackRate，保留音调），字幕逐字速度跟着变；章节页可选 正常／快／很快（1.0／1.2／1.4），存本机 yk-rate。
 * 沉浸体验每章（11-06 第三次改版，体会作者情感）：开场 → 剧情与分支 → 章末“这一章，你体会到的”卡（card，rows）→ 选写哪一种（A 我想对范公说 / B 联系自己的经历）→ 写一段话（write.kind 记进存档和作答摘要）。
 *   引擎仍支持 goal / sum / review / quiz / 原文卡，这一版剧情不用。
 * 画面：scene.js 画替代场景、道具和效果；有 img/scene-{名字}.webp 就用真图。 */
(function () {
"use strict";
var SITE = window.HORA_SITE || {}, HOME = SITE.home || "../";
var LID = "g9-yueyanglou-ke", LTITLE = "岳阳楼记 · 课堂版";
var QS = new URLSearchParams(location.search), SAMPLE = QS.get("sample") === "1";
/* 老师：首页点“我是老师”进来（sessionStorage hora-teacher，或地址 #teacher）。可以预览各板块（不存档），顶栏“全班作答”看全班（ke/teacher.js）。 */
var TEACH = /^#(teacher|class)/.test(location.hash); try { TEACH = TEACH || sessionStorage.getItem("hora-teacher") === "1"; } catch (e) {}
var DATA = SAMPLE ? "data/_sample/" : "data/", VER = "11081940";
var CHARS = HOME + "chars/";
var NUM = ["〇", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
var PNAME = { p1: "第1段", p2: "第2段", p3: "第3段", p4: "第4段", p5: "第5段", all: "全文" };
var app = document.getElementById("app");

/* ================= 小工具 ================= */
function $(s, r) { return (r || document).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
function lsGet(k, store) { try { return JSON.parse((store || localStorage).getItem(k) || "null"); } catch (e) { return null; } }
function lsPut(k, v, store) { try { (store || localStorage).setItem(k, JSON.stringify(v)); } catch (e) {} }
function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function today(d) { d = d || new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
function addDays(n) { var d = new Date(); d.setDate(d.getDate() + n); return today(d); }
function stamp(iso) { if (!iso) return ""; var d = new Date(iso); return (d.getMonth() + 1) + "-" + d.getDate() + " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2); }
function dur(s) { s = Math.round(s || 0); return s < 60 ? s + "秒" : Math.floor(s / 60) + "分" + (s % 60 ? (s % 60) + "秒" : ""); }
/* 比对用：去掉标点和空白（“标点不计”） */
function norm(s) { return String(s || "").replace(/[\s，。！？；：、“”‘’"'（）()《》〈〉【】——…·,.!?;:\-]/g, ""); }
function hlSent(s) { return esc(s).replace(/【(.*?)】/g, '<b class="hl">$1</b>'); }
function loadScript(src) { return new Promise(function (res) { var s = document.createElement("script"); s.src = src + (src.indexOf("?") < 0 ? "?v=" + VER : ""); s.onload = function () { res(true); }; s.onerror = function () { res(false); }; document.head.appendChild(s); }); }

/* ================= 人物立绘 =================
 * “我”＝学生在换装间（首页）选的发型（localStorage hora-avatar），这一课一律穿古代装 *_outfit_ancient。
 * 只有 g1、b1 有表情补丁（{发型}_ancient_face_{表情}.webp，叠在身体上）。g1 的底模是张嘴笑，平时叠 idle（闭嘴微笑）。 */
var HAIRS = ["g1", "g2", "g3", "g4", "b1", "b2", "b3", "b4"];
var FACES = { g1: { blink: 1, talk: 1, think: 1, idle: 1 }, b1: { blink: 1, talk: 1, think: 1, smile: 1 } };
var BUDDY = { qingxian: "清弦", changge: "长歌" };
var HEADC = { qingxian: [488, 346], changge: [493, 214], g: [480, 318], b: [470, 214] };
function myHair() { var a = lsGet("hora-avatar") || {}; return HAIRS.indexOf(a.hair) >= 0 ? a.hair : "g1"; }
function myBuddy() { var b = lsGet("hora-buddy") || {}; return { who: BUDDY[b.who] ? b.who : "qingxian", outfit: ["daily", "sport", "formal", "ancient"].indexOf(b.outfit) >= 0 ? b.outfit : "daily" }; }
function meSrc() { return CHARS + myHair() + "_outfit_ancient.webp"; }
function fanSrc() { return CHARS + "fanzhongyan_outfit_ancient.webp"; }
function faceSrc(kind) { var h = myHair(); return FACES[h] && FACES[h][kind] ? CHARS + h + "_ancient_face_" + kind + ".webp" : ""; }
function restFace() { return myHair() === "g1" ? "idle" : ""; }
function meFig(cls) { var r = restFace(); return '<div class="fig me ' + (cls || "") + '"><img class="b" src="' + meSrc() + '" alt="我（' + esc(ME ? ME.name : "") + '）的立绘" draggable="false"><img class="f" alt="" draggable="false"' + (r ? ' src="' + faceSrc(r) + '"' : " hidden") + '></div>'; }
function fanFig(cls) { return '<div class="fig fan ' + (cls || "") + '"><img class="b" src="' + fanSrc() + '" alt="范仲淹的立绘" draggable="false"></div>'; }
function buddyHead(box) { var b = myBuddy(), c = HEADC[b.who], sc = box / 316, st = "width:" + Math.round(1024 * sc) + "px;left:" + Math.round(box / 2 - c[0] * sc) + "px;top:" + Math.round(box / 2 - c[1] * sc) + "px";
  var rest = b.who === "qingxian" ? '<img src="' + CHARS + "qingxian_" + b.outfit + '_face_idle.webp" alt="" style="' + st + '">' : "";
  return '<span class="bhead" style="width:' + box + "px;height:" + box + 'px"><img src="' + CHARS + b.who + "_outfit_" + b.outfit + '.webp" alt="" style="' + st + '">' + rest + "</span>"; }
/* 伴学打气：一两句，预先写好 */
function cheer(score) {
  var n = BUDDY[myBuddy().who], L;
  if (score == null) L = ["今天也来二十分钟吧，我陪你。", "一点一点来，背过的句子会一直跟着你。", "先挑一个最短的开始，做完就有底气了。"];
  else if (score >= 90) L = ["太稳了！这一段你已经拿下了。", "这个分数，范公看了也要点头。", "漂亮！明天再来一遍，就忘不掉了。"];
  else if (score >= 70) L = ["不错！把错的那几处再看一眼，下次就满了。", "差一点点，错题看完再来一次？", "大部分都对了，剩下的我们再磨一磨。"];
  else L = ["没关系，先回去用遮字多读两遍，再来。", "错的地方正好告诉我们该练哪里。", "慢慢来，我们一起把它背熟。"];
  return '<div class="cheer">' + buddyHead(56) + '<p><b>' + n + "</b>" + esc(pick(L)) + "</p></div>";
}

/* ================= 状态（本机 + 表格） ================= */
var ME = null, KEY = "", S = null;
function blank() { return { v: 1, lessonAt: 1, story: {}, recite: {}, cards: {}, drills: [], tests: {}, done: {}, savedAt: "" }; }
function loadLocal() { S = blank(); var o = lsGet(KEY); if (o) for (var k in o) S[k] = o[k]; }
function save() { S.savedAt = new Date().toISOString(); lsPut(KEY, S); sync(); }
function payload() { var p = JSON.parse(JSON.stringify(S)); p.name = ME.name; p.cls = ME.cls; p.lesson = LID; return p; }
function mergeRemote(r) { if (r && r.savedAt && (!S.savedAt || r.savedAt > S.savedAt)) { var n = blank(); for (var k in r) if (k !== "name" && k !== "cls" && k !== "lesson") n[k] = r[k]; S = n; lsPut(KEY, S); return true; } return false; }
function api(action, body) {
  return fetch(SITE.sheetUrl, { method: "POST", body: JSON.stringify(Object.assign({ action: action, lesson: LID, lessonTitle: LTITLE }, body || {})) })
    .then(function (r) { return r.json(); }).then(function (j) { if (!j || !j.ok) { var e = new Error((j && j.err) || "server"); e.code = (j && j.err) || "server"; throw e; } return j; });
}
function cred() { return { cls: ME.cls, name: ME.name, pin: ME.pin }; }
var saveT = null, dirty = false, SV = 0, INFL = false, saveMsg = "", saveBad = false;
function setSaveSt(t, bad) { saveMsg = t; saveBad = !!bad; var s = $("#saveSt"); if (s) { s.textContent = t; s.classList.toggle("bad", !!bad); } }
function sync() { if (!SITE.sheetUrl || !ME || SAMPLE || TEACH) return; dirty = true; SV++; clearTimeout(saveT); saveT = setTimeout(sheetSave, 2500); }
function sheetSave() {
  if (INFL || !ME || !SITE.sheetUrl) return; INFL = true; var v = SV, p = payload(); setSaveSt("保存中…");
  api("save", Object.assign(cred(), { payload: p, summary: summary(p) })).then(function () { INFL = false; if (SV === v) { dirty = false; setSaveSt("已保存"); } else sheetSave(); })
    .catch(function (e) { INFL = false; setSaveSt(e.code === "pin" || e.code === "roster" ? "没保存：请重新签到" : "没连上，稍后自动再存", true); setTimeout(function () { if (dirty) sheetSave(); }, 15000); });
}
var leaving = false;
function leaveTo(url) {
  leaving = true; if (!SITE.sheetUrl || !dirty || !ME) { location.href = url; return; }
  clearTimeout(saveT); setSaveSt("保存中…"); var gone = false; function go() { if (!gone) { gone = true; location.href = url; } }
  api("save", Object.assign(cred(), { payload: payload(), summary: summary(payload()) })).then(function () { dirty = false; go(); }).catch(go); setTimeout(go, 4000);
}
addEventListener("beforeunload", function (e) { if (SITE.sheetUrl && dirty && !leaving) { e.preventDefault(); e.returnValue = ""; } });
addEventListener("pagehide", function () { if (SITE.sheetUrl && dirty && ME && navigator.sendBeacon) { try { navigator.sendBeacon(SITE.sheetUrl, JSON.stringify(Object.assign({ action: "save", lesson: LID, lessonTitle: LTITLE }, cred(), { payload: payload(), summary: summary(payload()) }))); } catch (e) {} } });

/* 作答摘要（老师在表格“作答摘要”一格里看） */
function summary(d) {
  var out = [(d.name || "") + "（" + (d.cls || "") + "）　自选：班上上到第 " + (d.lessonAt || 1) + " 节　最近保存 " + stamp(d.savedAt || new Date().toISOString())];
  out.push("【沉浸体验】");
  var chs = STORY.length ? STORY : Object.keys(d.story || {}).map(function (id) { return { id: id, title: id }; });
  if (!chs.length) out.push("  还没开始");
  chs.forEach(function (c, i) {
    var st = (d.story || {})[c.id];
    var line = "  " + (NUM[i + 1] || c.id) + "　" + c.title + "：" + (!st ? "没开始" : st.done ? "完成（" + stamp(st.doneAt) + "）" : "读到一半");
    if (st && st.review && st.review.last != null) line += "　回顾小测 最近" + st.review.last + "分（最高" + st.review.best + "，共" + st.review.tries + "次）";
    out.push(line);
    if (st && st.lastWrite) out.push("    最后写的话" + (st.lastWrite.kind ? "（" + st.lastWrite.kind + "）" : "") + "：" + st.lastWrite.text);
  });
  out.push("【背诵】" + ["p1", "p2", "p3", "p4", "p5", "all"].map(function (p) { var r = (d.recite || {})[p]; return PNAME[p] + (r && r.best != null ? " 最高" + r.best : " —"); }).join("｜"));
  var cards = d.cards || {}, mastered = Object.keys(cards).filter(function (k) { return cards[k].box >= 2; }).length;
  out.push("【字词卡】掌握 " + mastered + (WORDS.length ? " / " + WORDS.length : "") + " 张，练过 " + Object.keys(cards).length + " 张");
  var dr = d.drills || [];
  out.push("【练一练记录】" + (dr.length ? "" : "还没有"));
  dr.slice(-40).forEach(function (r) { out.push("  " + stamp(r.at) + "　" + (r.kind === "words" ? "字词" : r.kind === "story" ? "沉浸回顾" : "背诵") + "·" + (r.kind === "story" ? chName(r.scope) : PNAME[r.scope] || r.scope) + "　" + r.score + "分　用时" + dur(r.secs) + (r.wrong && r.wrong.length ? "　错" + r.wrong.length + "题" : "")); });
  out.push("【模拟测验】" + (Object.keys(d.tests || {}).length ? "" : "还没做"));
  Object.keys(d.tests || {}).forEach(function (id) {
    var t = d.tests[id], tt = TESTS.filter(function (x) { return x.id === id; })[0];
    out.push("  " + (tt ? tt.title : id) + "：最近 " + t.last.score + "分（" + stamp(t.last.at) + "，用时" + dur(t.last.secs) + "）　最高 " + t.best + "分　共做 " + t.tries + " 次");
    Object.keys(t.last.short || {}).forEach(function (q) { var s = t.last.short[q]; out.push("    简答 " + q + "（自评 " + s.got + "/" + s.pts + "）：" + (s.text || "（没写）")); });
  });
  return out.join("\n");
}

function chName(id) { var i = -1; STORY.forEach(function (c, k) { if (c.id === id) i = k; }); return i < 0 ? id : "第" + NUM[i + 1] + "章"; }
/* ================= 数据 ================= */
var TEXT = null, STORY = [], WORDS = [], TESTS = [], VOICE = {}, VOICE_V = "";
var PARAS = ["p1", "p2", "p3", "p4", "p5"];
function allSents() { var a = []; PARAS.forEach(function (p) { TEXT.paras[p].forEach(function (s, i) { a.push({ p: p, i: i, t: s }); }); }); return a; }

/* ================= 页面骨架 ================= */
function topBar(back) {
  return '<header class="top"><div class="top-in">' +
    (back ? '<a class="tb back" href="' + back[0] + '">← ' + esc(back[1]) + "</a>" : '<button class="tb back" type="button" data-leave="' + HOME + '#map">← 课文地图</button>') +
    '<a class="brand" href="' + (TEACH ? "#teacher" : "#home") + '"><span class="seal">课堂</span><b>岳阳楼记</b><small>课堂版</small></a><span class="sp"></span>' +
    '<span class="savest' + (saveBad ? " bad" : "") + '" id="saveSt">' + esc(saveMsg) + "</span>" +
    (TEACH ? '<a class="tb tq-btn" href="#class">全班作答</a><span class="who">老师预览</span><button class="tb" type="button" id="bOut">退出老师</button>'
      : ME ? '<span class="who">' + esc(ME.name) + '</span><button class="tb" type="button" id="bOut">换人</button>' : "") + "</div></header>";
}
function wireTop() {
  $$("[data-leave]").forEach(function (b) { b.addEventListener("click", function () { leaveTo(b.getAttribute("data-leave")); }); });
  var o = $("#bOut"); if (o) o.addEventListener("click", function () { try { sessionStorage.removeItem("hora-session"); if (TEACH) { sessionStorage.removeItem("hora-teacher"); sessionStorage.removeItem("hora-tpw"); } } catch (e) {} leaveTo(HOME); });
}
function page(html, back) { app.innerHTML = topBar(back) + '<main class="page">' + html + "</main>"; wireTop(); scrollTo(0, 0); }
function notReady(name, back) { page('<div class="card empty"><h2>' + esc(name) + '</h2><p>这一部分还在准备，过几天再来看看。</p><a class="btn" href="#home">回到首页</a></div>', back || ["#home", "首页"]); }

/* ================= 路由 =================
 * 页面内跳转不留浏览记录（replaceState）：site-ui.js 会挡住“返回上一页”（防 iPad 误划），留记录反而每次都弹提示。
 * 每个板块页面上都有自己的返回按钮。 */
var cleanup = null;
function go(h) { try { history.replaceState(history.state, "", location.pathname + location.search + h); } catch (e) { location.hash = h; return; } route(); }
document.addEventListener("click", function (e) {
  var a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
  e.preventDefault(); go(a.getAttribute("href"));
});
window.YK_go = go;
function route() {
  if (cleanup) { try { cleanup(); } catch (e) {} cleanup = null; }
  stopVoice();
  var h = (location.hash || "#home").slice(1).split("/");
  document.body.className = "";
  if (h[0] === "class") return TEACH ? classPage() : home();
  if (h[0] === "teacher") return TEACH ? teacherHome() : home();
  if (h[0] === "story" && h[1]) return playChapter(h[1]);
  if (h[0] === "story") return storyList();
  if (h[0] === "recite") return recitePage(h[1] || "p1");
  if (h[0] === "drill" && h[1] === "recite") return reciteDrill(h[2] || "p1");
  if (h[0] === "drill" && h[1] === "words") return wordsDrill();
  if (h[0] === "words") return wordsPage();
  if (h[0] === "test" && h[1]) return testRun(h[1]);
  if (h[0] === "test") return testList();
  return home();
}

var KETANG = { base: "../ketang/", list: [
  ["yyl-1", "第1节", "两个被贬的人；读懂第1、2段"], ["yyl-2", "第2节", "第1、2段补课；第3、4段逐句串讲"], ["yyl-3", "第3节", "第5段逐句串讲；全文结构"],
  ["yyl-4", "第4节", "这篇记写给谁；先忧后乐"], ["yyl-5", "第5节", "两个人，一片湖：读杜甫《登岳阳楼》"], ["yyl-6", "第6节", "方法1：借景物传达情绪"],
  ["yyl-7", "第7节", "方法2、方法5；《我的____楼》提纲和开头"], ["yyl-8", "第8节", "单元写作《我的____楼》：写两种样子"], ["yyl-9", "第9节", "写结尾、写完、自查、同桌互评"],
  ["yyl-10", "第10节", "背诵检查；修改、朗读分享"], ["yyl-11", "第11节", "单元总复习：字词与翻译总过关；单元小测"]],
  extra: [["yyl-1-sheet.pdf", "第1节作答单（PDF，A4 双面）"]] };
/* 老师首页（课堂版）：课堂投屏 ＋ 课后单机预览 ＋ 全班作答 */
function teacherHome() {
  var K = typeof KETANG !== "undefined" ? KETANG : (C.ketang || null), h = "";
  h += '<section class="card"><h2>' + esc(LTITLE) + ' · 老师</h2><p class="muted">课堂上用“课堂投屏”（一节一个，助教点“继续”）；课后学生在“课后单机”里做沉浸体验、背诵、字词、模拟测验，分数存到表格，在“全班作答”里看。</p>' +
    '<div class="trow"><a class="btn" href="#class">全班作答</a><a class="btn ghost" href="#home">预览课后单机（学生看到的）</a></div></section>';
  if (K && K.list && K.list.length) {
    h += '<section class="card"><h3>课堂投屏（' + K.list.length + ' 节）</h3><p class="muted">在教室电脑上打开，投到大屏幕；建议用 Chrome 或 Edge，按 F11 全屏。“剧本”可以打印。</p><div class="route">' +
      K.list.map(function (x) { return '<div class="ktrow"><a class="step" href="' + K.base + x[0] + '.html"><span class="no">' + esc(x[1].replace(/[^0-9]/g, "")) + '</span><span class="tx"><em>' + esc(x[1]) + "</em><b>" + esc(x[2]) + '</b></span><span class="min">打开投屏</span></a><a class="btn ghost" href="' + K.base + "script.html?l=" + x[0] + '">剧本</a></div>'; }).join("") + "</div>" +
      ((K.extra || []).length ? '<div class="trow">' + K.extra.map(function (x) { return '<a class="btn ghost" href="' + K.base + x[0] + '">' + esc(x[1]) + "</a>"; }).join("") + "</div>" : "") + "</section>";
  }
  page(h + '<style>.trow{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px}.ktrow{display:flex;gap:8px;align-items:stretch}.ktrow .step{flex:1}.ktrow .btn{min-height:auto}</style>');
}
/* ================= 老师：全班作答 ================= */
var GRADE = +((/^g(\d+)-/.exec(LID) || [])[1] || 0);
function otherLessons() {   // 同年级其他课文（自学版＋课堂版）的 id：用来补全“所有账号”
  var out = [];
  (window.HORA_LESSONS || []).forEach(function (l) { if (l.grade !== GRADE || /\.html?$/.test(l.folder)) return; [l.id].concat(l.choose ? [l.id + "-ke"] : []).forEach(function (id) { if (id !== LID && out.indexOf(id) < 0) out.push(id); }); });
  return out;
}
function classPage() {
  page('<div id="tqBox"></div>', ["#teacher", "老师首页"]);
  if (!window.YK_TEACHER) { $("#tqBox").innerHTML = '<p class="muted">老师页没有载入，请刷新。</p>'; return; }
  if (!SITE.sheetUrl) { $("#tqBox").innerHTML = '<div class="card">这个网站还没连老师的表格，看不到全班作答。</div>'; return; }
  window.YK_TEACHER({ el: $("#tqBox"), api: api, title: LTITLE, story: STORY, words: WORDS, tests: TESTS, text: TEXT, order: typeof PARAS !== "undefined" ? PARAS : null,
    pname: PNAME, summary: summary, esc: esc, stamp: stamp, dur: dur, grade: GRADE, otherLessons: otherLessons() });
}

/* ================= 首页 ================= */
function storyDone() { return STORY.filter(function (c) { var s = S.story[c.id]; return s && s.done; }).length; }
function mastered() { return Object.keys(S.cards).filter(function (k) { return S.cards[k].box >= 2; }).length; }
function dueCards() { var t = today(); return WORDS.filter(function (w) { var c = S.cards[w.id]; return c && c.due <= t && c.box < 4; }); }
function parasFor(n) { return n >= 3 ? PARAS : n >= 2 ? ["p1", "p2", "p3", "p4"] : ["p1", "p2"]; }
function plan() {
  var n = S.lessonAt || 1, out = [];
  var tst = TESTS.filter(function (t) { return (t.after || 0) <= n && !S.tests[t.id]; })[0];
  var ch = STORY.filter(function (c) { return (c.after || 0) <= n && !(S.story[c.id] && S.story[c.id].done); })[0];
  if (tst && !ch) return [{ href: "#test/" + tst.id, t: tst.title, d: "约 " + (tst.minutes || 20) + " 分钟，一次做完；客观题自动判分，简答题写完自己对照要点。", m: tst.minutes || 20, tag: "测验" }];
  if (ch) out.push({ href: "#story/" + ch.id, t: "沉浸体验 · " + ch.title, d: ch.blurb || "", m: ch.minutes || 9, tag: "沉浸" });
  var ps = parasFor(n), weak = ps.filter(function (p) { var r = S.recite[p]; return !r || r.best == null || r.best < 90; })[0];
  if (weak) out.push({ href: "#recite/" + weak, t: "背诵帮手 · " + PNAME[weak] + " → 练一练", d: "先用遮字读两三遍，再做练一练（机器打分）。" + (S.recite[weak] && S.recite[weak].best != null ? "你的最高分 " + S.recite[weak].best + "。" : ""), m: 6, tag: "背诵" });
  else out.push({ href: "#drill/recite/all", t: "背诵练一练 · 全文", d: "学过的几段都过了 90 分，来一套全文的。", m: 6, tag: "背诵" });
  if (WORDS.length) { var due = dueCards().length; out.push({ href: "#words", t: "字词卡一轮", d: due ? "有 " + due + " 张错过的卡今天该复习了。" : "学一轮新卡（约 15 张），再做字词练一练。", m: 5, tag: "字词" }); }
  var sum = 0; return out.filter(function (x) { sum += x.m; return sum <= 21 || x === out[0]; });
}
function home() {
  var n = S.lessonAt || 1, r = S.recite;
  var lessons = ""; for (var i = 1; i <= 10; i++) lessons += '<button type="button" class="ln' + (i === n ? " on" : "") + '" data-l="' + i + '" aria-pressed="' + (i === n) + '">' + i + "</button>";
  var route = plan().map(function (x, i) { return '<a class="step" href="' + x.href + '"><span class="no">' + (i + 1) + '</span><span class="tx"><em>' + x.tag + "</em><b>" + esc(x.t) + "</b><small>" + esc(x.d) + '</small></span><span class="min">约 ' + x.m + " 分</span></a>"; }).join("");
  var recRow = ["p1", "p2", "p3", "p4", "p5"].map(function (p) { var b = r[p] && r[p].best; return '<span class="chip' + (b >= 90 ? " good" : "") + '">' + p.slice(1) + "<i>" + (b != null ? b : "—") + "</i></span>"; }).join("") + '<span class="chip' + (r.all && r.all.best >= 90 ? " good" : "") + '">全<i>' + (r.all && r.all.best != null ? r.all.best : "—") + "</i></span>";
  var testRow = TESTS.length ? TESTS.map(function (t) { var s = S.tests[t.id]; return '<span class="chip' + (s && s.best >= 85 ? " good" : "") + '">' + esc(t.title.replace(/模拟测验/, "")) + "<i>" + (s ? s.best : "—") + "</i></span>"; }).join("") : '<span class="muted">还在准备</span>';
  page(
    '<section class="hero"><div class="hero-figs">' + fanFig() + meFig() + '</div><div class="hero-tx"><p class="kick">课后 · 每次 20 分钟以内</p><h1>岳阳楼记<small>课堂版</small></h1>' +
    '<p class="lead">庆历六年秋天，邓州。你是范公家隔壁的少年，' + esc(ME.name) + '。<br>这里有四样东西，帮你把课上学的读熟、背会、弄懂。</p>' +
    '<p class="fict">剧情里的“邻家少年”（由你扮演）是虚构人物；范仲淹、滕子京是真实的历史人物，对话是根据史料想象的。</p></div></section>' +
    '<section class="card"><h2>我们上到第几节了？</h2><p class="muted">选班上已经上完的那一节，下面的推荐会跟着变（只记在这台设备上）。</p><div class="lessons" role="group" aria-label="上到第几节">' + lessons + "</div>" +
    '<h3 class="rt">今天的 20 分钟</h3><div class="route">' + route + "</div>" + cheer() + "</section>" +
    '<section class="grid4">' +
    '<a class="sec" href="#story"><span class="sn">一</span><b>沉浸体验</b><small>《邓州的秋天》' + (STORY.length ? STORY.length + " 章" : "") + '</small><span class="pg">' + (STORY.length ? "完成 " + storyDone() + " / " + STORY.length + " 章" : "还在准备") + "</span></a>" +
    '<a class="sec" href="#recite"><span class="sn">二</span><b>背诵帮手</b><small>遮字、偷看、接龙，再练一练</small><span class="pg chips">' + recRow + "</span></a>" +
    '<a class="sec" href="#words"><span class="sn">三</span><b>字词卡</b><small>字词都在原句里</small><span class="pg">' + (WORDS.length ? "掌握 " + mastered() + " / " + WORDS.length + " 张" + (dueCards().length ? "　·　今天复习 " + dueCards().length + " 张" : "") : "还在准备") + "</span></a>" +
    '<a class="sec" href="#test"><span class="sn">四</span><b>模拟测验</b><small>每套约 20 分钟，100 分</small><span class="pg chips">' + testRow + "</span></a>" +
    "</section>" + (SAMPLE ? '<p class="muted center">（现在读的是样例数据 data/_sample/）</p>' : ""), null);
  $$(".ln").forEach(function (b) { b.addEventListener("click", function () { S.lessonAt = +b.getAttribute("data-l"); save(); home(); }); });
}

/* ================= 一、沉浸体验 ================= */
function storyList() {
  if (!STORY.length) return notReady("沉浸体验《邓州的秋天》");
  var h = '<h1 class="h1">沉浸体验 · 邓州的秋天</h1><p class="lead">庆历六年秋天，范公在邓州做知州。你是他家隔壁的少年。跟范公说说话，体会他写《岳阳楼记》时的心情。每章约 10 分钟，最后写一小段话（老师能看到）。</p><p class="fict">“邻家少年”是虚构人物。</p><div class="chs">';
  STORY.forEach(function (c, i) {
    var st = S.story[c.id] || {};
    h += '<a class="ch' + (st.done ? " done" : "") + '" href="#story/' + c.id + '"><span class="cn">' + NUM[i + 1] + '</span><span class="tx"><b>' + esc(c.title) + "</b><small>" + esc(c.blurb || "") + '</small><em>第 ' + (c.after || "?") + " 节后 · 约 " + (c.minutes || 9) + " 分钟</em></span>" +
      '<span class="st">' + (st.done ? "✓ 完成" : st.node ? "读到一半" : "") + "</span></a>";
  });
  h += '</div><div class="vrow"><span>“我”的声音：<b id="vNm">' + esc(myVoiceName()) + (pickedVoice() ? "" : "（还没选）") + '</b></span><button type="button" class="btn ghost" id="bVoice">换声音</button></div>';
  h += '<div class="vrow"><span>语速：</span><div class="rates" role="group" aria-label="语速">' + RATES.map(function (r) { return '<button type="button" class="rt' + (r[0] === RATE ? " on" : "") + '" data-r="' + r[0] + '" aria-pressed="' + (r[0] === RATE) + '">' + r[1] + (r[0] === 1.2 ? "（默认）" : "") + "</button>"; }).join("") + "</div></div>";
  page(h, ["#home", "首页"]);
  $$(".rt").forEach(function (b) { b.addEventListener("click", function () { setRate(+b.getAttribute("data-r")); $$(".rt").forEach(function (x) { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", x === b); }); playVoice("narr", "你慢慢睁开眼。这里是邓州，庆历六年的秋天。", true); }); });
  $("#bVoice").addEventListener("click", function () { voicePicker(function () { $("#vNm").textContent = myVoiceName(); }, "换一个“我”的声音"); });
}

/* ---------- 画面（shot） ----------
 * 节点或台词上的 shot：{ bg, tone, cam, fx, prop, pt, open, peek, fan, side, tr, dur, dream, cap }（详见 data/story.js 开头的说明）。
 * 每个 shot 是一整个画面，不继承上一个；bg 相同（道具、色调也相同）时只换镜头、效果、范公的位置，不切画面。
 * 场景图：有 img/scene-{bg}.webp 就用（启动时探一下），没有就用 scene.js 画的替代画面。 */
var IMG = { lake: "lake", "rain-lake": "rain", "spring-lake": "spring", "moon-lake": "moon", tower: "tower", map: "map", bi: "bi" };
var LEGACY = { rain: "rain-yard", sunny: "yard", spring: "spring-lake", moon: "moon-lake" };
var SCENE_KEYS = ["study", "study-rain", "yard", "rain-yard", "harvest", "night", "hill", "gate"], SCENE_IMG = {};
// 11-06：七张真图都已放进 img/，直接用（同时预载）；万一某张缺了，加载失败就退回画的场景
function probeScenes() { SCENE_KEYS.forEach(function (k) { var u = "img/scene-" + k + ".webp?v=" + VER, im = new Image(); SCENE_IMG[k] = u; im.onerror = function () { delete SCENE_IMG[k]; }; im.src = u; }); }
var CAM = { still: ["scale(1.05)", "scale(1.06)"], push: ["scale(1.02)", "scale(1.16)"], pull: ["scale(1.17)", "scale(1.03)"],
  panL: ["translateX(-4%) scale(1.12)", "translateX(4%) scale(1.12)"], panR: ["translateX(4%) scale(1.12)", "translateX(-4%) scale(1.12)"],
  up: ["translateY(-4.5%) scale(1.12)", "translateY(4.5%) scale(1.12)"], down: ["translateY(4.5%) scale(1.12)", "translateY(-4.5%) scale(1.12)"] };
function normShot(s) {
  if (!s) return null; if (typeof s === "string") s = { bg: s };
  var o = {}; for (var k in s) o[k] = s[k];
  o.bg = LEGACY[o.bg] || o.bg || "yard"; o.tone = o.tone || ""; o.cam = CAM[o.cam] ? o.cam : "push";
  o.fx = typeof o.fx === "string" ? o.fx.split(/\s+/).filter(Boolean) : (o.fx || []);
  // 11-06：书房那张图窗外是晴天，下雨的戏不能用它
  if (o.bg === "study" && o.tone === "rain") {
    o.fx = o.fx.filter(function (f) { return f !== "dust" && f !== "light"; });
    if (SCENE_IMG["study-rain"]) { o.bg = "study-rain"; o.tone = ""; }
    else { o.bg = "rain-yard"; o.tone = ""; if (o.fx.indexOf("rain") < 0) o.fx.push("rain"); }
  }
  o.fan = /^(near|mid|far)$/.test(o.fan) ? o.fan : "off"; o.side = /^[lcr]$/.test(o.side) ? o.side : "c";
  return o;
}
function nodeShot(n) { return n ? normShot(n.shot || (n.lines && n.lines[0] && n.lines[0].shot) || (n.bg ? { bg: n.bg, fan: "mid" } : null)) : null; }
function sceneHTML(s) {
  var inner;
  if (IMG[s.bg]) inner = '<img class="photo" src="../yueyanglou/img/' + IMG[s.bg] + '.webp" alt="" draggable="false">';
  else if (SCENE_IMG[s.bg]) inner = '<img class="photo" src="' + SCENE_IMG[s.bg] + '" alt="" draggable="false">' + (s.tone ? '<i class="tint t-' + s.tone + '"></i>' : "");
  else inner = window.YK_SCENE ? YK_SCENE.svg(s.bg, s.bg === "night" ? "night" : s.tone) : "";
  if (IMG[s.bg] && s.tone) inner += '<i class="tint t-' + s.tone + '"></i>';
  var prop = s.prop && window.YK_SCENE ? YK_SCENE.prop(s.prop, { t: s.pt, open: s.open, peek: s.peek }) : "";
  return '<div class="cam"><div class="scene">' + inner + "</div></div>" + (s.dream ? '<i class="dreamv"></i>' : "") + (prop ? '<div class="pwrap">' + prop + "</div>" : "");
}

/* ---------- 声音 ----------
 * 录音编号＝hash(说话人键 + "|" + 朗读文字)，和 ketang/proj.js、tools/yk_lines.js 一样。
 * 说话人键：fan / narr / x-名字 / me-b1…me-g4（学生选的“我的声音”）。没有录音的句子不出声（不用设备语音）。 */
var MYV = [
  { k: "me-b1", n: "云希·清朗", g: "b" }, { k: "me-b2", n: "云夏·少年", g: "b" }, { k: "me-b3", n: "云希·温和", g: "b" }, { k: "me-b4", n: "云健·爽朗", g: "b" },
  { k: "me-g1", n: "晓伊·活泼", g: "g" }, { k: "me-g2", n: "晓晓·温柔", g: "g" }, { k: "me-g3", n: "晓伊·清亮", g: "g" }, { k: "me-g4", n: "晓晓·柔和", g: "g" }];
var VSAMPLE = "范公，我来帮您晒书吧。";
function myvOK(k) { return MYV.some(function (v) { return v.k === k; }); }
function pickedVoice() { var k = (S && S.myVoice) || lsGet("yk-myvoice"); return myvOK(k) ? k : ""; }
function myVoice() { return pickedVoice() || (/^b/.test(myHair()) ? "me-b1" : "me-g1"); }
function myVoiceName() { var k = myVoice(); return MYV.filter(function (v) { return v.k === k; })[0].n; }
function vkey(who, name) { return who === "me" ? myVoice() : who === "x" ? "x-" + (name || "") : who; }
/* 选项里“我”说出口的话：say 是字符串就用它；say:true 用整句；否则取引号里的话（没有引号＝动作，不出声） */
function spoken(c) { if (typeof c.say === "string") return c.say; if (c.say === true) return c.t; var m = String(c.t || "").match(/“[^”]*”/g); return m ? m.map(function (s) { return s.slice(1, -1); }).join("") : ""; }

function hashStr(s) { var h = 0x811c9dc5; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return ("0000000" + h.toString(16)).slice(-8); }
function voiceText(t) { t = String(t || "").replace(/（[^）]*）/g, ""); ((TEXT && TEXT.voiceFix) || []).forEach(function (p) { t = t.split(p[0]).join(p[1]); }); return t.replace(/[“”‘’「」]/g, "").replace(/——/g, "，").replace(/……/g, "，"); }
var curAudio = null, soundOn = lsGet("yk-sound") !== false;
/* 语速：1.0 正常 / 1.2 快（默认）/ 1.4 很快；存本机 */
var RATES = [[1, "正常"], [1.2, "快"], [1.4, "很快"]];
var RATE = (function () { var r = lsGet("yk-rate"); return RATES.some(function (x) { return x[0] === r; }) ? r : 1.2; })();
function rateName() { return RATES.filter(function (x) { return x[0] === RATE; })[0][1]; }
function setRate(r) { RATE = r; lsPut("yk-rate", r); if (curAudio) try { curAudio.playbackRate = r; } catch (e) {} }
function stopVoice() { if (curAudio) { try { curAudio.pause(); } catch (e) {} curAudio = null; } }
/* 放一句录音；返回录音长度（秒），没有录音返回 0 */
function playVoice(key, say, force) {
  stopVoice(); if ((!soundOn && !force) || !say || /\{name\}/.test(say)) return 0;
  var h = hashStr(key + "|" + voiceText(say)); if (!VOICE[h]) return 0;
  try {
    var a = new Audio("voice/" + h + ".mp3" + (VOICE_V ? "?v=" + VOICE_V : "")); curAudio = a;
    a.preservesPitch = a.mozPreservesPitch = a.webkitPreservesPitch = true; a.defaultPlaybackRate = RATE; a.playbackRate = RATE;
    var p = a.play(); if (p && p.catch) p.catch(function () {});
  } catch (e) { return 0; }
  return VOICE[h] / RATE;
}
function fillName(s) { return String(s || "").replace(/\{name\}/g, ME.name); }

/* 选“我的声音”：两组按钮，点一下试听；选定存本机和存档 */
function voicePicker(then, title) {
  var cur = myVoice(), box = document.createElement("div"); box.className = "ov vpick"; document.body.appendChild(box);
  function grp(g, label) { return '<div class="vg"><b>' + label + "</b><div class=\"vbs\">" + MYV.filter(function (v) { return v.g === g; }).map(function (v) { return '<button type="button" class="vb' + (v.k === cur ? " on" : "") + '" data-k="' + v.k + '" aria-pressed="' + (v.k === cur) + '"><span class="ic" aria-hidden="true">▶</span>' + esc(v.n) + "</button>"; }).join("") + "</div></div>"; }
  box.innerHTML = '<div class="sheet"><h3>' + esc(title || "选一个“我”的声音") + '</h3><p class="muted small">故事里“我”说的话，会用这个声音读出来。点一下听听看，男孩、女孩的声音都可以选。</p>' + grp("b", "男孩的声音") + grp("g", "女孩的声音") +
    '<div class="row"><button type="button" class="btn" id="vOk">就用这个</button></div></div>';
  $$(".vb", box).forEach(function (b) { b.addEventListener("click", function () { cur = b.getAttribute("data-k"); $$(".vb", box).forEach(function (x) { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", x === b); }); playVoice(cur, VSAMPLE, true); }); });
  $("#vOk", box).addEventListener("click", function () { stopVoice(); S.myVoice = cur; lsPut("yk-myvoice", cur); save(); box.remove(); if (then) then(); });
}

function playChapter(id) {
  if (!STORY.length) return notReady("沉浸体验《邓州的秋天》");
  var ci = -1; STORY.forEach(function (c, i) { if (c.id === id) ci = i; }); if (ci < 0) { go("#story"); return; }
  var ch = STORY[ci], st = S.story[ch.id] || (S.story[ch.id] = {});
  st.choices = st.choices || {}; st.quiz = st.quiz || {}; st.writes = st.writes || {};
  document.body.className = "playing";
  app.innerHTML = '<div class="stage" id="stage" data-fan="off"><div class="scn" id="scn"></div>' +
    '<div class="fanL" id="fanL" data-pos="off" data-side="c"><div class="fw"><img src="' + fanSrc() + '" alt="范仲淹" draggable="false"></div></div>' +
    '<i class="fxl" aria-hidden="true"></i><i class="fxm" aria-hidden="true"></i><i class="fxk" aria-hidden="true"></i><canvas class="fxc" id="fxc" aria-hidden="true"></canvas>' +
    '<p class="cap" id="cap" hidden></p><span class="xtag" id="xtag" hidden></span>' +
    '<div class="eyes shut" id="eyes" aria-hidden="true"><i class="lid t"></i><i class="lid b"></i></div>' +
    '<div class="sbar"><a class="tb" href="#story">← 章节</a><span class="ct">' + NUM[ci + 1] + "　" + esc(ch.title) + '</span><span class="sp"></span><button type="button" class="tb" id="bRate" title="语速">语速 ' + rateName() + '</button><button type="button" class="tb" id="bLog">回看</button><button type="button" class="tb" id="bSnd" aria-pressed="' + soundOn + '">' + (soundOn ? "声音 开" : "声音 关") + "</button></div>" +
    '<div class="panel" id="panel" hidden></div><div class="choices" id="choices" hidden></div>' +
    '<div class="dlg off" id="dlg" role="button" tabindex="0" aria-live="polite"><span class="nm" id="nm" hidden></span><p class="say" id="say"></p><span class="more" id="more" aria-hidden="true">▼</span></div>' +
    '<div class="ov" id="ov" hidden></div></div>';
  var stage = $("#stage"), scn = $("#scn"), dlg = $("#dlg"), sayEl = $("#say"), nmEl = $("#nm"), panel = $("#panel"), chEl = $("#choices"), ov = $("#ov");
  var fanL = $("#fanL"), capEl = $("#cap"), xtag = $("#xtag"), eyes = $("#eyes");
  var fx = window.YK_SCENE ? new YK_SCENE.FX($("#fxc")) : null;
  var log = [], typing = null, onNext = null, alive = true, cur = null, curKey = "", timers = [];
  function later(f, ms) { var t = setTimeout(function () { if (alive) f(); }, ms); timers.push(t); return t; }
  cleanup = function () { alive = false; clearInterval(typing && typing.t); clearInterval(rvTick); timers.forEach(clearTimeout); stopVoice(); if (fx) fx.stop(); document.body.className = ""; var vp = $(".vpick"); if (vp) vp.remove(); };
  $("#bSnd").addEventListener("click", function () { soundOn = !soundOn; lsPut("yk-sound", soundOn); this.textContent = soundOn ? "声音 开" : "声音 关"; this.setAttribute("aria-pressed", soundOn); if (!soundOn) stopVoice(); });
  $("#bRate").addEventListener("click", function () { var i = 0; RATES.forEach(function (r, k) { if (r[0] === RATE) i = k; }); setRate(RATES[(i + 1) % RATES.length][0]); this.textContent = "语速 " + rateName(); });
  $("#bLog").addEventListener("click", function () {
    ov.hidden = false; ov.innerHTML = '<div class="sheet"><button type="button" class="x" aria-label="关上">×</button><h3>本章读过的话</h3><div class="log">' +
      (log.length ? log.map(function (l) { return "<p><b>" + esc(l.n) + "</b>" + esc(l.s) + "</p>"; }).join("") : '<p class="muted">还没有。</p>') + "</div></div>";
    $(".x", ov).addEventListener("click", function () { ov.hidden = true; }); ov.onclick = function (e) { if (e.target === ov) ov.hidden = true; };
    var lg = $(".log", ov); lg.scrollTop = lg.scrollHeight;
  });

  /* 换画面：bg/道具/色调变了就新开一层，旧层淡出或横移出去；只是镜头变了就在原层上接着动 */
  function shot(s) {
    s = normShot(s); if (!s) return;
    var key = [s.bg, s.tone, s.prop || "", s.pt || "", s.open ? 1 : 0, s.peek ? 1 : 0, s.dream ? 1 : 0].join("|"), layer, camEl, c = CAM[s.cam], dur = (s.dur || 18) + "s";
    if (key !== curKey) {
      var old = $$(".layer", scn), tr = s.tr === "slide" ? "slide" : s.tr === "cut" ? "cut" : "fade";
      old.forEach(function (o) { o.classList.add("out", "out-" + tr); setTimeout(function () { o.remove(); }, 1100); });
      layer = document.createElement("div"); layer.className = "layer in-" + tr + (s.prop ? " has-prop" : "") + (s.dream ? " dream" : "");
      layer.innerHTML = sceneHTML(s); scn.appendChild(layer); curKey = key;
      camEl = $(".cam", layer); camEl.style.transform = c[0]; void camEl.offsetWidth;
    } else { layer = $$(".layer:not(.out)", scn).pop(); camEl = layer && $(".cam", layer); }
    if (camEl) { camEl.style.transition = "transform " + dur + " cubic-bezier(.35,.1,.4,1)"; camEl.style.transform = c[1]; }
    fanL.setAttribute("data-pos", s.fan); fanL.setAttribute("data-side", s.side); stage.setAttribute("data-fan", s.fan);
    stage.setAttribute("data-tone", s.bg === "night" ? "night" : s.tone || "day");
    ["light", "mist", "candle"].forEach(function (k) { stage.classList.toggle("fx-" + k, s.fx.indexOf(k) >= 0); });
    if (fx) fx.set(s.fx.filter(function (k) { return /^(rain|leaves|dust|birds)$/.test(k); }));
    capEl.hidden = !s.cap; capEl.textContent = s.cap || "";
    cur = s; st.shot = s;
  }
  /* 睁眼：黑屏 → 眨两三下（从模糊到清楚）→ 画面展开；then 在最后一次睁开时开始（同时播第一句） */
  function wake(then) {
    eyes.className = "eyes blink"; scn.classList.remove("wake"); void scn.offsetWidth; scn.classList.add("wake");
    later(then, 1500); later(function () { eyes.className = "eyes"; scn.classList.remove("wake"); }, 2700);
  }
  function setTalk(who) { fanL.classList.toggle("talk", who === "fan" && cur && cur.fan !== "off"); }
  function nameOf(l) { return l.who === "fan" ? "范公" : l.who === "me" ? ME.name : l.who === "narr" ? "" : (l.name || ""); }
  function show(l, done, auto) {
    if (l.shot) shot(l.shot);
    var text = fillName(l.say), nm = nameOf(l); dlg.classList.remove("wait", "off");
    setTalk(l.who); stage.setAttribute("data-who", l.who);
    xtag.hidden = l.who !== "x" || !nm; xtag.textContent = nm;
    nmEl.hidden = !nm; nmEl.textContent = nm; nmEl.className = "nm " + (l.who === "fan" ? "fan" : l.who === "me" ? "me" : "x");
    dlg.classList.toggle("narr", l.who === "narr"); log.push({ n: nm ? nm + "：" : "", s: text });
    var secs = playVoice(vkey(l.who, l.name), l.say), n = Array.from(text).length, chars = Array.from(text);
    var step = secs ? clamp(secs * 1000 * .9 / Math.max(1, n), 30, 320) : Math.round(55 / RATE), i = 0, t0 = Date.now();
    if (l.hi) hiCard(l.hi);
    sayEl.textContent = ""; dlg.classList.add("typing");
    function fin() { if (!typing) return; clearInterval(typing.t); typing = null; sayEl.textContent = text; dlg.classList.remove("typing"); if (!secs) setTalk(""); else later(function () { if (onNext === done) setTalk(""); }, Math.max(0, secs * 1000 - (Date.now() - t0))); onNext = done; if (auto) later(function () { if (onNext === done) advance(); }, Math.max(600, (secs || 1.5) * 1000 - (Date.now() - t0) + 500)); }
    typing = { fin: fin, t: setInterval(function () { i = Math.min(n, Math.floor((Date.now() - t0) / step) + 1); sayEl.textContent = chars.slice(0, i).join(""); if (i >= n) fin(); }, 30) };
    onNext = null;
  }
  function advance() { if (!ov.hidden || $(".vpick")) return; if (typing) { typing.fin(); return; } if (onNext) { var f = onNext; onNext = null; f(); } }
  dlg.addEventListener("click", advance);
  stage.addEventListener("click", function (e) { if (e.target === stage || e.target.closest(".scn") || e.target.closest(".fanL")) advance(); });
  function key(e) { if ((e.key === " " || e.key === "Enter") && !/INPUT|TEXTAREA|BUTTON|A/.test(document.activeElement.tagName)) { e.preventDefault(); advance(); } }
  addEventListener("keydown", key); var c0 = cleanup; cleanup = function () { removeEventListener("keydown", key); c0(); };
  function lines(arr, then) { var k = 0; (function nx() { if (!alive) return; if (k >= arr.length) return then(); show(arr[k++], nx); })(); }
  function prompt(text, voice) { setTalk(""); xtag.hidden = true; nmEl.hidden = true; dlg.classList.remove("off", "typing"); dlg.classList.add("narr", "wait"); sayEl.textContent = fillName(text || ""); onNext = null; typing = null; if (voice) playVoice("narr", text); }
  function enter(nid) {
    var n = ch.nodes[nid]; if (!alive) return;
    if (!n) { prompt("（找不到这一段：" + nid + "）"); return; }
    st.node = nid; save();
    panel.hidden = true; chEl.hidden = true; clearInterval(rvTick);
    var ns = nodeShot(n); if (n.shot || n.bg) shot(ns);
    if (n.card) showCard(n.card);
    lines(n.lines || [], function () { after(nid, n); });
  }
  /* 卡片里的东西露出来：只滚 panel（scrollIntoView 会把 overflow:hidden 的舞台也滚歪） */
  function reveal(el) {
    var pr = panel.getBoundingClientRect(), r = el.getBoundingClientRect(), d = 0;
    if (r.top < pr.top + 8) d = r.top - pr.top - 8; else if (r.bottom > pr.bottom - 8) d = Math.min(r.bottom - pr.bottom + 8, r.top - pr.top - 8);
    if (d) try { panel.scrollBy({ top: d, behavior: "smooth" }); } catch (e) { panel.scrollTop += d; }
  }
  stage.addEventListener("scroll", function () { if (stage.scrollLeft || stage.scrollTop) { stage.scrollLeft = 0; stage.scrollTop = 0; } });
  /* ---------- 原文卡 / 讲解卡 ----------
   * 原文从 TEXT.paras 取（逐字一致）；red 标红，notes 可点看注释，cats 分类标色；台词上的 hi 点亮卡上的词或 rows 左栏。 */
  function cardHTML(c) {
    var keys = {}, catNames = Object.keys(c.cats || {});
    function key(k) { return keys[k] || (keys[k] = { red: false, note: "", cat: -1 }); }
    (c.red || []).forEach(function (k) { key(k).red = true; });
    Object.keys(c.notes || {}).forEach(function (k) { key(k).note = c.notes[k]; });
    catNames.forEach(function (cn, ci) { c.cats[cn].forEach(function (k) { key(k).cat = ci; }); });
    var ks = Object.keys(keys).sort(function (a, b) { return b.length - a.length; });
    function mark(str) {
      var out = "", i = 0;
      while (i < str.length) {
        var k = ks.filter(function (x) { return str.substr(i, x.length) === x; })[0];
        if (!k) { out += esc(str[i]); i++; continue; }
        var o = keys[k], cls = "k" + (o.red ? " red" : "") + (o.note ? " note" : "") + (o.cat >= 0 ? " cat" + o.cat : "");
        out += '<span class="' + cls + '" data-k="' + esc(k) + '"' + (o.note ? ' role="button" tabindex="0"' : "") + ">" + esc(k) + "</span>"; i += k.length;
      }
      return out;
    }
    function sents(r) { return TEXT && TEXT.paras[c.para] ? TEXT.paras[c.para].slice(r[0], r[1] + 1).join("") : ""; }
    var txt = "";
    if (c.para) {
      var gs = c.groups || [{ label: "", s: c.s || [0, 99], plain: c.plain }];
      txt = '<div class="ytext">' + gs.map(function (g) {
        return '<div class="yg' + (g.label ? "" : " solo") + '">' + (g.label ? '<span class="ylab">' + esc(g.label) + "</span>" : "") + '<div class="ygb"><p class="ytx">' + mark(sents(g.s)) + "</p>" + (g.plain ? '<p class="yplain"><span>白话</span>' + esc(g.plain) + "</p>" : "") + "</div></div>";
      }).join('<div class="yarr" aria-hidden="true">↓</div>') + (c.groups && c.plain ? '<p class="yplain"><span>白话</span>' + esc(c.plain) + "</p>" : "") + "</div>";
      if (catNames.length) txt += '<p class="ylegend">' + catNames.map(function (cn, ci) { return '<span class="lg cat' + ci + '">' + esc(cn) + "</span>"; }).join("") + (c.catNote ? '<span class="lgn">' + esc(c.catNote) + "</span>" : "") + "</p>";
      if (Object.keys(c.notes || {}).length) txt += '<p class="ynote" id="yNote">点带虚线的红字，看注释。</p>';
    }
    var rows = c.rows ? '<div class="yrows">' + c.rows.map(function (r) { return '<div class="yr" data-k="' + esc(r[0]) + '"><b>' + esc(r[0]) + "</b><span>" + esc(r[1]) + "</span></div>"; }).join("") + "</div>" : "";
    return '<div class="pcard ycard"><p class="tag">' + esc(c.tag || "原文") + "</p>" + (c.title ? '<h3 class="yt">' + esc(c.title) + "</h3>" : "") +
      (c.rowsFirst ? rows + txt : txt + rows) + (c.foot ? '<p class="yfoot" data-k="foot">' + esc(c.foot) + "</p>" : "") +
      '<div class="yrow"><span class="muted small" id="cWait">范公讲完，点“继续”收起卡片。</span><button type="button" class="btn" id="cGo" hidden>继续</button></div></div>';
  }
  function showCard(c) {
    panel.hidden = false; panel.innerHTML = cardHTML(c); panel.scrollTop = 0;
    log.push({ n: "（" + (c.tag || "原文卡") + "）", s: c.title || "" });
    $$(".k.note", panel).forEach(function (el) {
      function on() { var k = el.getAttribute("data-k"), nt = $("#yNote", panel); $$(".k.sel", panel).forEach(function (x) { x.classList.remove("sel"); }); el.classList.add("sel"); if (nt) { nt.innerHTML = "<b>" + esc(k) + "</b>：" + esc(c.notes[k]); nt.classList.add("on"); } }
      el.addEventListener("click", on); el.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); on(); } });
    });
  }
  function hiCard(h) {
    if (panel.hidden) return; var ks = [].concat(h), first = null;
    $$("[data-k]", panel).forEach(function (el) { var on = ks.indexOf(el.getAttribute("data-k")) >= 0; el.classList.toggle("on", on); if (on && !first) first = el; });
    if (first) reveal(first);
  }
  /* ---------- 开头目标卡、本章收获 ---------- */
  function listCard(tag, head, items, btn, then, cls) {
    panel.hidden = false; panel.scrollTop = 0;
    panel.innerHTML = '<div class="pcard lcard ' + (cls || "") + '"><p class="tag">' + esc(tag) + '</p><h3 class="yt">' + esc(head) + '</h3><ol class="ylist">' + items.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + '</ol><div class="yrow"><span></span><button type="button" class="btn" id="lGo">' + esc(btn) + "</button></div></div>";
    var b = $("#lGo", panel); b.addEventListener("click", function () { panel.hidden = true; then(); }); setTimeout(function () { try { b.focus({ preventScroll: true }); } catch (e) {} }, 60);
  }
  /* ---------- 回顾小测：复用练一练的出题、判分（renderItem / grade），每题倒计时 ---------- */
  var rvTick = null;
  function review(nid, n) {
    var items = n.review.map(function (it) {
      var o = { ref: it.id, sec: it.sec || 15, pts: 1, explain: it.explain || "" };
      if (it.type === "fill") { o.type = "fill"; o.qHtml = '<p class="qq">' + esc(it.q).replace(/（[\s　]*）/, "{{blank}}") + "</p>"; o.blanks = [{ ans: [].concat(it.ans) }]; }
      else { var op = shuffle(it.opts); o.type = "choice"; o.opts = op; o.ans = op.indexOf(it.ans); o.qHtml = (it.sent ? '<p class="sent">' + hlSent(it.sent) + "</p>" : "") + '<p class="qq">' + esc(it.q) + "</p>"; }
      return o;
    }), k = 0, res = [];
    log.push({ n: "（回顾小测）", s: items.length + " 题" });
    function one() {
      if (!alive) return; if (k >= items.length) return done();
      var it = items[k], answered = false, t0 = Date.now(), end = t0 + it.sec * 1000;
      prompt("回顾小测：第 " + (k + 1) + " / " + items.length + " 题，每题 " + it.sec + " 秒。");
      panel.hidden = false; panel.scrollTop = 0;
      panel.innerHTML = '<div class="pcard rvcard"><div class="rvh"><p class="tag">回顾小测</p><span class="muted small">第 ' + (k + 1) + " / " + items.length + ' 题</span></div><div class="timer" id="rvT"><div class="bar"><i></i></div><span></span></div><div class="rvb"></div><div class="rvf"></div></div>';
      var body = $(".rvb", panel), fb = $(".rvf", panel), tm = $("#rvT", panel), bar = $(".bar i", tm), sx = $("span", tm);
      var get = renderItem(it, body, function () { submit(false); });
      var sb = $("[data-submit]", body); if (sb) sb.addEventListener("click", function () { submit(false); });
      function upd() { var left = Math.max(0, (end - Date.now()) / 1000); bar.style.width = (left / it.sec * 100) + "%"; sx.textContent = Math.ceil(left) + " 秒"; tm.classList.toggle("hot", left <= 5); if (left <= 0) submit(true); }
      clearInterval(rvTick); upd(); rvTick = setInterval(upd, 100);
      function submit(timeout) {
        if (answered) return; answered = true; clearInterval(rvTick); tm.classList.add("off");
        var r = grade(it, get(), timeout); r.secs = Math.min(it.sec, (Date.now() - t0) / 1000); r.timeout = timeout; r.it = it; res.push(r);
        $$("button,input", body).forEach(function (x) { x.disabled = true; });
        fb.innerHTML = '<div class="fb ' + (r.got >= 1 ? "ok" : "no") + '"><b>' + (r.got >= 1 ? "对了！" : timeout ? "时间到。" : "不对。") + "</b>" + (r.got < 1 ? "<p>正确答案：" + r.rightHtml + "</p>" : "") + (it.explain ? '<p class="muted">' + esc(it.explain) + "</p>" : "") +
          '<button type="button" class="btn" id="rvN">' + (k + 1 < items.length ? "下一题" : "看成绩") + "</button></div>";
        var nb = $("#rvN", panel); nb.addEventListener("click", function () { k++; one(); }); try { nb.focus({ preventScroll: true }); } catch (e) {}
        reveal(fb);
      }
    }
    function done() {
      var got = 0, secs = 0; res.forEach(function (r) { got += r.got; secs += r.secs; });
      var score = Math.round(got / res.length * 100), at = new Date().toISOString(), wrong = res.filter(function (r) { return r.got < 1; });
      var rec = st.review || (st.review = { tries: 0, best: 0 }); rec.tries = (rec.tries || 0) + 1; rec.last = score; rec.best = Math.max(rec.best || 0, score); rec.at = at; rec.secs = Math.round(secs); rec.wrong = wrong.map(function (r) { return r.it.ref; });
      S.drills.push({ kind: "story", scope: ch.id, score: score, secs: Math.round(secs), wrong: rec.wrong, at: at, n: res.length }); if (S.drills.length > 80) S.drills = S.drills.slice(-80); save();
      log.push({ n: "（回顾小测）", s: score + " 分" });
      prompt("回顾小测做完了。看一看错题，再点“继续”。");
      panel.innerHTML = '<div class="pcard rvcard"><p class="tag">回顾小测</p><div class="rvs"><b>' + score + "</b><span>分</span></div><p class=\"muted small center\">共 " + res.length + " 题，答对 " + (res.length - wrong.length) + " 题，用时 " + dur(secs) + "</p>" +
        (wrong.length ? '<ol class="rvw">' + wrong.map(function (r) { return "<li><div>" + r.qHtml + '</div><p><span class="lb">正确答案</span>' + r.rightHtml + "</p>" + (r.it.explain ? '<p class="muted small">' + esc(r.it.explain) + "</p>" : "") + "</li>"; }).join("") + "</ol>" : '<p class="center">全对！</p>') +
        '<div class="yrow"><span></span><button type="button" class="btn" id="rvGo">继续</button></div></div>';
      $("#rvGo", panel).addEventListener("click", function () { panel.hidden = true; enter(n.next); });
    }
    one();
  }
  function after(nid, n) {
    if (n.end) return finish();
    if (n.card) {
      prompt("看好了，点卡片上的“继续”。");
      var cb = $("#cGo", panel), cw = $("#cWait", panel); if (cw) cw.textContent = "读一读，想一想，再点继续。"; hiCard([]);
      if (cb) { cb.hidden = false; cb.addEventListener("click", function () { panel.hidden = true; enter(n.next); }); try { cb.focus({ preventScroll: true }); } catch (e) {} }
      return;
    }
    if (n.goal) { prompt("先看看这一章要弄懂什么。"); listCard("本章目标", "这一章，你会弄懂：", n.goal, "开始", function () { enter(n.next); }, "goal"); return; }
    if (n.sum) {
      var nx = ch.nodes[n.next]; prompt("本章收获：把这几条抄下来，以后复习用。"); log.push({ n: "（本章收获）", s: n.sum.join(" ") });
      listCard("本章收获", "这一章，你学到了：", n.sum, nx && nx.review ? "记下了，做回顾小测" : "记下了", function () { enter(n.next); }, "sum"); return;
    }
    if (n.review) return review(nid, n);
    if (n.choices) {
      prompt(n.ask || "你怎么说？", true); chEl.hidden = false;
      chEl.innerHTML = n.choices.map(function (c, i) { return '<button type="button" class="opt" data-i="' + i + '" style="animation-delay:' + (.15 + i * .12).toFixed(2) + 's">' + esc(fillName(c.t)) + "</button>"; }).join("");
      $$(".opt", chEl).forEach(function (b) { b.addEventListener("click", function () {
        var c = n.choices[+b.getAttribute("data-i")], sp = spoken(c); st.choices[nid] = c.t; save(); chEl.hidden = true;
        if (sp) show({ who: "me", say: sp }, function () { enter(c.go); }, true); else { log.push({ n: "（你选了）", s: c.t }); enter(c.go); }
      }); });
      return;
    }
    if (n.quiz) {
      var q = n.quiz, opts = shuffle(q.opts), ans = typeof q.ans === "number" ? q.opts[q.ans] : q.ans;
      prompt("在上面选一个答案。");
      panel.hidden = false;
      panel.innerHTML = '<div class="pcard quiz"><p class="tag">字词小题</p>' + (q.sent ? '<p class="sent">' + hlSent(q.sent) + "</p>" : "") + (q.q ? '<p class="qq">' + esc(fillName(q.q)) + "</p>" : "") +
        '<div class="opts">' + opts.map(function (o, i) { return '<button type="button" class="opt" data-i="' + i + '">' + esc(o) + "</button>"; }).join("") + "</div></div>";
      $$(".opt", panel).forEach(function (b) {
        b.addEventListener("click", function () {
          var o = opts[+b.getAttribute("data-i")], ok = o === ans;
          $$(".opt", panel).forEach(function (x) { x.disabled = true; if (opts[+x.getAttribute("data-i")] === ans) x.classList.add("right"); }); if (!ok) b.classList.add("wrong");
          if (!st.quiz[nid]) st.quiz[nid] = { first: o, ok: ok }; save();
          var say = ok ? q.ok : q.no; if (say) show({ who: q.by || "fan", say: say }, function () { enter(n.next); }); else { dlg.classList.remove("wait"); onNext = function () { enter(n.next); }; }
        });
      });
      return;
    }
    if (n.write) {
      var w = n.write, min = w.min || 0, max = w.max || 300, old = (st.writes[nid] || {}).text || "";
      prompt("写好了，点“写好了”。");
      panel.hidden = false;
      panel.innerHTML = '<div class="pcard write"><p class="tag">写一小段话（会存给老师）</p><p class="qq">' + esc(fillName(w.prompt)) + "</p>" + (w.hint ? '<p class="hint">提示：' + esc(w.hint) + "</p>" : "") +
        '<textarea id="wTa" rows="5" maxlength="' + max + '" placeholder="在这里写……">' + esc(old) + '</textarea><div class="wrow"><span class="cnt" id="wCnt"></span><button type="button" class="btn" id="wGo">写好了</button></div></div>';
      var ta = $("#wTa"), cnt = $("#wCnt"), go = $("#wGo");
      function upd() { var L = norm(ta.value).length; cnt.textContent = L + " 字" + (min ? "（至少 " + min + " 字，最多 " + max + " 字）" : "（最多 " + max + " 字）"); go.disabled = L < min; cnt.classList.toggle("short", L < min); }
      ta.addEventListener("input", upd); upd(); setTimeout(function () { try { ta.focus({ preventScroll: true }); } catch (e) {} }, 50);
      go.addEventListener("click", function () { var t = ta.value.trim(); st.writes[nid] = { text: t, at: new Date().toISOString(), prompt: w.prompt, kind: w.kind || "" }; st.lastWrite = { text: t, at: st.writes[nid].at, node: nid, kind: w.kind || "" }; log.push({ n: "（你写的）", s: t }); save(); panel.hidden = true; enter(n.next || "end"); });
      return;
    }
    if (n.next) return enter(n.next);
    finish();
  }
  function finish() {
    st.done = true; st.doneAt = st.doneAt || new Date().toISOString(); st.lastDoneAt = new Date().toISOString(); delete st.node; S.done[ch.id] = 1; save();
    var nx = STORY[ci + 1];
    ov.hidden = false; ov.innerHTML = '<div class="sheet endc"><p class="seal big">完成</p><h3>第' + NUM[ci + 1] + "章　" + esc(ch.title) + "</h3><p>本章完成。" + (st.lastWrite ? "你写的那段话已经存好，老师能看到。" : "") + '</p><div class="row">' +
      (nx ? '<a class="btn" href="#story/' + nx.id + '">下一章：' + esc(nx.title) + "</a>" : "") + '<a class="btn ghost" href="#home">回到首页</a><button type="button" class="btn ghost" id="bAgain">再读一遍</button></div></div>';
    $("#bAgain").addEventListener("click", function () { ov.hidden = true; log = []; fresh(); });
  }
  /* 从头：先把第一个画面铺在合着的眼睛后面，再睁眼，睁开时开始播第一句 */
  function fresh() { dlg.classList.add("off"); shot(nodeShot(ch.nodes[ch.start])); wake(function () { enter(ch.start); }); }
  function begin() {
    if (st.node && ch.nodes[st.node] && !st.done) {
      shot(st.shot || nodeShot(ch.nodes[st.node]) || nodeShot(ch.nodes[ch.start]));
      ov.hidden = false; ov.innerHTML = '<div class="sheet"><h3>' + esc(ch.title) + '</h3><p>上次读到一半。</p><div class="row"><button type="button" class="btn" id="bRes">接着上次</button><button type="button" class="btn ghost" id="bNew">从头开始</button></div></div>';
      $("#bRes").addEventListener("click", function () { ov.hidden = true; wake(function () { enter(st.node); }); });
      $("#bNew").addEventListener("click", function () { ov.hidden = true; fresh(); });
    } else fresh();
  }
  if (!pickedVoice()) { shot(nodeShot(ch.nodes[ch.start])); voicePicker(begin, "睁开眼之前，先选一个“我”的声音"); }
  else begin();
}

/* ================= 计时题（练一练、测验共用） =================
 * 题：{type:"choice"|"fill"|"order"|"short", sec, pts, ref, ...}；每题倒计时（进度条＋秒数，最后 5 秒变红），超时自动交卷。
 * cfg.feedback：练一练每题后立刻显示对错；测验不显示，做完一起看。 */
function runner(cfg) {
  var items = cfg.items, idx = 0, res = [], t0 = 0, tick = null, alive = true, autoT = null;
  var c0 = cleanup; cleanup = function () { alive = false; clearInterval(tick); clearTimeout(autoT); if (c0) c0(); };
  page('<div class="runner"><div class="rhead"><b>' + esc(cfg.title) + '</b><span id="rNo"></span></div><div class="timer" id="timer"><div class="bar"><i id="tBar"></i></div><span id="tSec"></span></div><div id="rBody"></div><div id="rFb"></div></div>', cfg.back);
  var body = $("#rBody"), fb = $("#rFb");
  function timer(sec, onUp) {
    clearInterval(tick); var end = Date.now() + sec * 1000, bar = $("#tBar"), sx = $("#tSec"), tm = $("#timer"); tm.classList.remove("hot", "off");
    function upd() { var left = Math.max(0, (end - Date.now()) / 1000); bar.style.width = (left / sec * 100) + "%"; sx.textContent = Math.ceil(left) + " 秒"; tm.classList.toggle("hot", left <= 5); if (left <= 0) { clearInterval(tick); onUp(); } }
    upd(); tick = setInterval(upd, 100);
  }
  function stopTimer() { clearInterval(tick); $("#timer").classList.add("off"); }
  function show() {
    if (!alive) return; fb.innerHTML = "";
    if (idx >= items.length) return finish();
    var it = items[idx], answered = false; $("#rNo").textContent = "第 " + (idx + 1) + " / " + items.length + " 题";
    t0 = Date.now();
    var get = renderItem(it, body, function () { submit(false); });
    function submit(timeout) {
      if (answered) return; answered = true; stopTimer();
      var r = grade(it, get(), timeout); r.secs = Math.min(it.sec, (Date.now() - t0) / 1000); r.timeout = timeout; r.it = it; res.push(r);
      $$("button,input,textarea", body).forEach(function (x) { x.disabled = true; });
      if (it.type === "short") return selfCheck(it, r, function () { idx++; show(); });
      if (cfg.feedback) {
        fb.innerHTML = '<div class="fb ' + (r.got >= 1 ? "ok" : "no") + '"><b>' + (timeout ? "时间到。" : r.got >= 1 ? "对了！" : r.got > 0 ? "对了一部分。" : "不对。") + "</b>" +
          (r.got < 1 && r.yoursHtml ? '<p>你写的：' + r.yoursHtml + "</p>" : "") + (r.got < 1 ? '<p>正确答案：' + r.rightHtml + "</p>" : "") + (it.explain ? '<p class="muted">' + esc(it.explain) + "</p>" : "") + '<button type="button" class="btn" id="bNext">' + (idx + 1 < items.length ? "下一题" : "看结果") + "</button></div>";
        var nx = function () { clearTimeout(autoT); idx++; show(); }; $("#bNext").addEventListener("click", nx); $("#bNext").focus({ preventScroll: true });
        if (timeout) autoT = setTimeout(nx, 2500);
        fb.scrollIntoView({ block: "nearest", behavior: "smooth" });
      } else { idx++; show(); }
    }
    timer(it.sec, function () { submit(true); });
    var sb = $("[data-submit]", body); if (sb) sb.addEventListener("click", function () { submit(false); });
  }
  function selfCheck(it, r, then) {
    fb.innerHTML = '<div class="fb self"><b>对照参考要点，勾一勾你写到了哪几点</b>' + it.points.map(function (p, i) { return '<label class="pt"><input type="checkbox" data-i="' + i + '"><span>' + esc(p.t) + "<em>" + p.pts + " 分</em></span></label>"; }).join("") +
      (it.model ? '<p class="model"><b>参考答案</b>' + esc(it.model) + "</p>" : "") + '<button type="button" class="btn" id="bNext">勾好了，' + (idx + 1 < items.length ? "下一题" : "看结果") + "</button></div>";
    $("#bNext").addEventListener("click", function () {
      var ck = $$(".pt input", fb).filter(function (x) { return x.checked; }).map(function (x) { return +x.getAttribute("data-i"); });
      var pts = ck.reduce(function (a, i) { return a + (it.points[i].pts || 0); }, 0); r.checked = ck; r.got = it.pts ? Math.min(1, pts / it.pts) : 0; r.rightHtml = esc(it.model || "");
      then();
    });
    fb.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
  function finish() {
    clearInterval(tick);
    var tot = 0, got = 0, secs = 0; res.forEach(function (r) { var p = r.it.pts || 1; tot += p; got += r.got * p; secs += r.secs; });
    var score = tot ? Math.round(got / tot * 100) : 0;
    var out = { score: score, secs: Math.round(secs), res: res, at: new Date().toISOString() };
    cfg.onDone(out);
    var rows = res.map(function (r, i) {
      var p = r.it.pts || 1, full = r.got >= 1;
      if (cfg.listAll || !full) return '<li class="' + (full ? "ok" : "no") + '"><div class="q"><span class="qn">' + (i + 1) + "</span><div class=\"qc\">" + r.qHtml + "</div>" + (cfg.showPts ? '<em class="pts">' + Math.round(r.got * p * 10) / 10 + " / " + p + " 分</em>" : "") + "</div>" +
        '<p><span class="lb">你的答案</span>' + (r.timeout && !r.yours ? "（时间到，没答）" : r.yoursHtml || esc(r.yours || "（没答）")) + "</p>" + (full && r.it.type !== "short" ? "" : '<p><span class="lb">' + (r.it.type === "short" ? "参考答案" : "正确答案") + "</span>" + r.rightHtml + "</p>") +
        (r.it.type === "short" ? '<p><span class="lb">自评</span>勾了 ' + (r.checked || []).length + " / " + r.it.points.length + " 个要点</p>" : "") + (r.it.explain ? '<p class="muted">' + esc(r.it.explain) + "</p>" : "") + "</li>";
      return "";
    }).join("");
    page('<div class="result card"><p class="tag">' + esc(cfg.title) + '</p><div class="big"><b>' + score + '</b><span>分</span></div><p class="meta">用时 ' + dur(out.secs) + "　·　共 " + res.length + " 题" + (cfg.listAll ? "" : "，错 " + res.filter(function (r) { return r.got < 1; }).length + " 题") + "</p>" + cheer(score) +
      '<div class="row center">' + cfg.after.map(function (a) { return '<a class="btn' + (a[2] ? " ghost" : "") + '" href="' + a[0] + '"' + ">" + esc(a[1]) + "</a>"; }).join("") + "</div></div>" +
      (rows ? '<section class="card"><h2>' + (cfg.listAll ? "每一题" : "错题与正确答案") + '</h2><ol class="wrongs">' + rows + "</ol></section>" : '<section class="card"><p class="center">全对！没有错题。</p></section>'), cfg.back);
  }
  show();
}
function renderItem(it, body, enterGo) {
  if (it.type === "choice") {
    body.innerHTML = '<div class="qbox"><div class="qtext">' + it.qHtml + '</div><div class="opts">' + it.opts.map(function (o, i) { return '<button type="button" class="opt" data-i="' + i + '">' + esc(o) + "</button>"; }).join("") + "</div></div>";
    var chosen = null; $$(".opt", body).forEach(function (b) { b.addEventListener("click", function () { chosen = +b.getAttribute("data-i"); b.classList.add("picked"); enterGo(); }); });
    return function () { var bs = $$(".opt", body); if (chosen != null) bs.forEach(function (b, i) { if (i === it.ans) b.classList.add("right"); else if (i === chosen) b.classList.add("wrong"); }); return chosen; };
  }
  if (it.type === "fill") {
    var k = 0, html = it.qHtml.replace(/\{\{blank\}\}/g, function () { var b = it.blanks[k], w = Math.max(4, norm(b.ans[0]).length); return '<input class="blank" type="text" data-k="' + (k++) + '" style="width:' + (w * 1.15 + 1.2) + 'em" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="填空">'; });
    body.innerHTML = '<div class="qbox"><div class="qtext fill">' + html + '</div><p class="muted small">标点不用写，写错一个字这一空就不得分。</p><div class="row"><button type="button" class="btn" data-submit>交卷</button></div></div>';
    var ins = $$("input.blank", body); ins.forEach(function (x, i) { x.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); if (ins[i + 1]) ins[i + 1].focus(); else $("[data-submit]", body).click(); } }); });
    setTimeout(function () { if (ins[0]) try { ins[0].focus({ preventScroll: true }); } catch (e) {} }, 60);
    return function () { return ins.map(function (x) { return x.value; }); };
  }
  if (it.type === "order") {
    var seq = [], pool = shuffle(it.items.map(function (t, i) { return i; }));
    body.innerHTML = '<div class="qbox"><div class="qtext">' + it.qHtml + '</div><ol class="seq" id="seq"></ol><div class="pool" id="pool"></div><div class="row"><button type="button" class="btn ghost" id="oClr">重排</button><button type="button" class="btn" data-submit>交卷</button></div></div>';
    function paint() {
      $("#seq", body).innerHTML = seq.map(function (i, k) { return '<li><button type="button" class="opt on" data-s="' + k + '">' + esc(it.items[i]) + "</button></li>"; }).join("") || '<li class="ph">按顺序点下面的句子</li>';
      $("#pool", body).innerHTML = pool.filter(function (i) { return seq.indexOf(i) < 0; }).map(function (i) { return '<button type="button" class="opt" data-p="' + i + '">' + esc(it.items[i]) + "</button>"; }).join("");
      $$("[data-p]", body).forEach(function (b) { b.addEventListener("click", function () { seq.push(+b.getAttribute("data-p")); paint(); }); });
      $$("[data-s]", body).forEach(function (b) { b.addEventListener("click", function () { seq.splice(+b.getAttribute("data-s"), 1); paint(); }); });
    }
    paint(); $("#oClr", body).addEventListener("click", function () { seq = []; paint(); });
    return function () { return seq.slice(); };
  }
  if (it.type === "short") {
    body.innerHTML = '<div class="qbox"><div class="qtext">' + it.qHtml + '</div><textarea class="ans" rows="6" placeholder="在这里写……"></textarea><div class="row"><span class="muted small" id="sCnt">0 字</span><button type="button" class="btn" data-submit>写好了</button></div></div>';
    var ta = $("textarea", body); ta.addEventListener("input", function () { $("#sCnt", body).textContent = norm(ta.value).length + " 字"; });
    return function () { return ta.value.trim(); };
  }
}
/* 逐字比对：去掉标点后，每个字对上就绿，对不上就红 */
function diffHtml(you, right) {
  var a = norm(you), b = norm(right), h = "";
  for (var i = 0; i < Math.max(a.length, b.length); i++) { var c = a.charAt(i); if (!c) h += '<span class="miss">＿</span>'; else h += '<span class="' + (c === b.charAt(i) ? "ok" : "bad") + '">' + esc(c) + "</span>"; }
  return h;
}
function grade(it, v, timeout) {
  if (it.type === "choice") return { got: v === it.ans ? 1 : 0, yours: v == null ? "" : it.opts[v], rightHtml: esc(it.opts[it.ans]), qHtml: it.qHtml };
  if (it.type === "fill") {
    var ok = 0, yh = [], rh = [];
    it.blanks.forEach(function (b, i) { var y = (v || [])[i] || ""; var hit = b.ans.some(function (a) { return norm(a) === norm(y); }); if (hit) ok++; yh.push(y ? (hit ? '<span class="ok">' + esc(norm(y)) + "</span>" : diffHtml(y, b.ans[0])) : '<span class="miss">（空）</span>'); rh.push(esc(b.ans[0])); });
    return { got: ok / it.blanks.length, yours: (v || []).join(" / "), yoursHtml: yh.join("　/　"), rightHtml: rh.join("　/　"), qHtml: it.qHtml.replace(/\{\{blank\}\}/g, "（　　）") };
  }
  if (it.type === "order") {
    var n = it.items.length, pos = 0; (v || []).forEach(function (x, i) { if (x === i) pos++; });
    return { got: (v || []).length === n ? pos / n : pos / n, yours: (v || []).map(function (i) { return it.items[i]; }).join(""), yoursHtml: (v || []).length ? (v || []).map(function (x, i) { return '<span class="' + (x === i ? "ok" : "bad") + '">' + esc(it.items[x]) + "</span>"; }).join("") : "", rightHtml: esc(it.items.join("")), qHtml: it.qHtml };
  }
  if (it.type === "short") return { got: 0, yours: v || "", yoursHtml: esc(v || "（没写）"), rightHtml: esc(it.model || ""), qHtml: it.qHtml };
}

/* ================= 二、背诵帮手 ================= */
var LEVELS = ["全文", "留头两字", "留首字", "全空"];
function rubyHtml(s) {
  var R = TEXT.ruby || {}, keys = Object.keys(R).sort(function (a, b) { return b.length - a.length; }), out = "", i = 0;
  while (i < s.length) {
    var k = keys.filter(function (x) { return s.substr(i, x.length) === x; })[0];
    if (k) { var py = R[k].split(/\s+/); if (py.length === k.length) for (var j = 0; j < k.length; j++) out += "<ruby>" + esc(k[j]) + "<rt>" + esc(py[j]) + "</rt></ruby>"; else out += "<ruby>" + esc(k) + "<rt>" + esc(R[k]) + "</rt></ruby>"; i += k.length; }
    else { out += esc(s[i]); i++; }
  }
  return out;
}
function maskHtml(s, lv) {
  if (lv === 0) return rubyHtml(s);
  var keep = lv === 1 ? 2 : lv === 2 ? 1 : 0, n = 0, out = "";
  for (var i = 0; i < s.length; i++) { var c = s[i]; if (!norm(c)) { out += esc(c); continue; } out += n < keep ? esc(c) : '<span class="mk">' + esc(c) + "</span>"; n++; }
  return out;
}
function recitePage(p) {
  if (!TEXT) return notReady("背诵帮手");
  if (PARAS.indexOf(p) < 0) p = "p1";
  var lv = (lsGet("yk-level") || {})[p] || 0, sents = TEXT.paras[p], r = S.recite[p] || {};
  var tabs = PARAS.map(function (q) { var b = S.recite[q] && S.recite[q].best; return '<a class="tab' + (q === p ? " on" : "") + '" href="#recite/' + q + '">' + PNAME[q] + (b != null ? "<i>" + b + "</i>" : "") + "</a>"; }).join("");
  page('<h1 class="h1">背诵帮手</h1><div class="tabs">' + tabs + '</div><section class="card recite"><div class="lv" role="group" aria-label="遮字">' + LEVELS.map(function (t, i) { return '<button type="button" data-lv="' + i + '" class="' + (i === lv ? "on" : "") + '">' + (i ? "遮字 " + i + "：" : "") + t + "</button>"; }).join("") + "</div>" +
    '<p class="muted small">' + (lv ? "点一句可以偷看 3 秒。" : "从“全文”开始读，熟了就一级一级遮起来。") + '</p><div class="txt" id="txt">' + sents.map(function (s, i) { return '<span class="s" data-i="' + i + '">' + maskHtml(s, lv) + "</span>"; }).join("") + "</div>" +
    '<div class="row"><button type="button" class="btn ghost" id="bChain">句子接龙（不计分）</button><a class="btn" href="#drill/recite/' + p + '">练一练 · ' + PNAME[p] + "</a></div>" +
    '<p class="muted small">练一练：句子接龙、接下句填空、排句子，每题有倒计时，机器打分。' + (r.best != null ? "你的最高分 " + r.best + "，练过 " + (r.tries || 0) + " 次。" : "") + '</p><div id="chain"></div></section>' +
    '<section class="card"><h2>全文练一练</h2><p class="muted">五段都背过了，来一套全文的。' + (S.recite.all && S.recite.all.best != null ? "最高分 " + S.recite.all.best + "。" : "") + '</p><a class="btn" href="#drill/recite/all">练一练 · 全文</a></section>', ["#home", "首页"]);
  $$("[data-lv]").forEach(function (b) { b.addEventListener("click", function () { var m = lsGet("yk-level") || {}; m[p] = +b.getAttribute("data-lv"); lsPut("yk-level", m); recitePage(p); }); });
  $$("#txt .s").forEach(function (s) { s.addEventListener("click", function () { if (!lv) return; s.classList.add("peek"); clearTimeout(s._t); s._t = setTimeout(function () { s.classList.remove("peek"); }, 3000); }); });
  $("#bChain").addEventListener("click", function () { chainPractice(p); });
}
function chainOpts(all, idx) {
  var cur = all[idx], right = all[idx + 1], same = all.filter(function (x) { return x.p === cur.p && x !== right && x !== cur; }), other = all.filter(function (x) { return x.p !== cur.p && x !== right; });
  var d = shuffle(same).slice(0, 3); if (d.length < 3) d = d.concat(shuffle(other).slice(0, 3 - d.length));
  return shuffle([right].concat(d));
}
function chainPractice(p) {
  var all = TEXT.paras[p].map(function (t, i) { return { p: p, i: i, t: t }; }), whole = allSents(), k = 0, box = $("#chain");
  function step() {
    if (k >= all.length - 1) { box.innerHTML = '<div class="chainbox"><p><b>接完了！</b>这一段可以去“练一练”了。</p></div>'; return; }
    var cur = all[k], right = all[k + 1], pool = whole.filter(function (x) { return x.p === p; }), opts;
    var same = pool.filter(function (x) { return x.t !== right.t && x.t !== cur.t; }), other = whole.filter(function (x) { return x.p !== p; });
    var d = shuffle(same).slice(0, 2); d = d.concat(shuffle(other).slice(0, 3 - d.length)); opts = shuffle([right].concat(d));
    box.innerHTML = '<div class="chainbox"><p class="muted small">第 ' + (k + 1) + " / " + (all.length - 1) + ' 句　下一句是哪句？</p><p class="cur">' + esc(cur.t) + '</p><div class="opts">' + opts.map(function (o, i) { return '<button type="button" class="opt" data-i="' + i + '">' + esc(o.t) + "</button>"; }).join("") + "</div></div>";
    $$(".opt", box).forEach(function (b) { b.addEventListener("click", function () { var o = opts[+b.getAttribute("data-i")]; $$(".opt", box).forEach(function (x) { x.disabled = true; if (opts[+x.getAttribute("data-i")] === right) x.classList.add("right"); }); if (o !== right) b.classList.add("wrong"); setTimeout(function () { k++; step(); }, o === right ? 600 : 1600); }); });
    box.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
  step();
}
function fillItem(prevT, nextT, ref) {
  var parts = nextT.split(/([，；：、。！？])/), q = '<p class="ctx">' + esc(prevT) + '</p><p class="nx">', blanks = [];
  parts.forEach(function (x) { if (!x) return; if (/^[，；：、。！？]$/.test(x)) { q += esc(x); return; } if (!norm(x)) { q += esc(x); return; } blanks.push({ ans: [x] }); q += "{{blank}}"; });
  q += "</p>";
  var len = norm(nextT).length;
  return { type: "fill", qHtml: '<p class="qlead">接下句：写出后面一句</p>' + q, blanks: blanks, sec: clamp(Math.round(18 + len * 1.6), 30, 45), pts: 1, ref: ref };
}
function reciteDrill(scope) {
  if (!TEXT) return notReady("背诵练一练");
  var whole = allSents(), list = scope === "all" ? whole : whole.filter(function (x) { return x.p === scope; });
  if (!list.length) { go("#recite"); return; }
  var nChain = scope === "all" ? 4 : Math.min(3, list.length - 1), nFill = scope === "all" ? 4 : 2, items = [];
  var idxs = shuffle(list.slice(0, -1).map(function (x, i) { return i; }).filter(function (i) { return list[i].p === list[i + 1].p; }));
  idxs.slice(0, nChain).forEach(function (i) {
    var cur = list[i], right = list[i + 1], same = whole.filter(function (x) { return x.p === cur.p && x !== right && x !== cur; }), other = whole.filter(function (x) { return x.p !== cur.p; });
    var d = shuffle(same).slice(0, 3); d = d.concat(shuffle(other).slice(0, 3 - d.length)); var opts = shuffle([right].concat(d));
    items.push({ type: "choice", qHtml: '<p class="qlead">句子接龙：下一句是哪句？</p><p class="ctx">' + esc(cur.t) + "</p>", opts: opts.map(function (o) { return o.t; }), ans: opts.indexOf(right), sec: 15, pts: 1, ref: cur.p + "-" + cur.i + "-chain" });
  });
  shuffle(idxs.slice(nChain).concat(idxs.slice(0, nChain))).filter(function (v, k, a) { return a.indexOf(v) === k; }).slice(0, nFill).forEach(function (i) { items.push(fillItem(list[i].t, list[i + 1].t, list[i].p + "-" + (list[i].i + 1) + "-fill")); });
  var op = scope === "all" ? pick(PARAS) : scope, ps = TEXT.paras[op], k = Math.min(5, ps.length), st = Math.floor(Math.random() * (ps.length - k + 1));
  items.push({ type: "order", qHtml: '<p class="qlead">排句子：把下面 ' + k + " 句按原文顺序点一遍（" + PNAME[op] + "）</p>", items: ps.slice(st, st + k), sec: 60, pts: 1, ref: op + "-order" });
  runner({ title: "背诵练一练 · " + PNAME[scope], items: items, feedback: true, back: ["#recite/" + (scope === "all" ? "p1" : scope), "背诵帮手"],
    after: [[location.hash, "再练一次"], ["#recite/" + (scope === "all" ? "p1" : scope), "回到背诵帮手", 1], ["#home", "首页", 1]],
    onDone: function (o) {
      var r = S.recite[scope] || (S.recite[scope] = { tries: 0 }); r.tries = (r.tries || 0) + 1; r.last = o.score; r.best = Math.max(r.best == null ? 0 : r.best, o.score); r.at = o.at;
      S.drills.push({ kind: "recite", scope: scope, score: o.score, secs: o.secs, wrong: o.res.filter(function (x) { return x.got < 1; }).map(function (x) { return x.it.ref; }), at: o.at, n: o.res.length });
      if (S.drills.length > 80) S.drills = S.drills.slice(-80); save();
    } });
}

/* ================= 三、字词卡（本机间隔重复） =================
 * 每张卡 {box, due, right, wrong, seen}：答对 box+1，下次出现隔 1/3/7/14 天；答错 box 归 0，明天再出现。box≥2 算“掌握”。 */
var GAP = [1, 1, 3, 7, 14];
function markCard(id, ok) {
  var c = S.cards[id] || (S.cards[id] = { box: 0, right: 0, wrong: 0, seen: 0 });
  c.seen++; if (ok) { c.right++; c.box = Math.min(4, c.box + 1); c.due = addDays(GAP[c.box]); } else { c.wrong++; c.box = 0; c.due = addDays(1); }
  c.at = new Date().toISOString();
}
function roundCards() {
  var t = today(), n = S.lessonAt || 1;
  var due = shuffle(WORDS.filter(function (w) { var c = S.cards[w.id]; return c && c.due <= t; })).sort(function (a, b) { return S.cards[a.id].box - S.cards[b.id].box; });
  var fresh = WORDS.filter(function (w) { return !S.cards[w.id]; }), near = fresh.filter(function (w) { return !w.lesson || w.lesson <= n; }), far = fresh.filter(function (w) { return w.lesson && w.lesson > n; });
  var out = due.slice(0, 15); out = out.concat(near.slice(0, 15 - out.length)); out = out.concat(far.slice(0, 15 - out.length));
  if (out.length < 15) { var rest = shuffle(WORDS.filter(function (w) { return out.indexOf(w) < 0; })).sort(function (a, b) { return (S.cards[a.id] ? S.cards[a.id].box : 0) - (S.cards[b.id] ? S.cards[b.id].box : 0); }); out = out.concat(rest.slice(0, 15 - out.length)); }
  return out;
}
function wordsPage() {
  if (!WORDS.length) return notReady("字词卡");
  var cards = roundCards(), k = 0, ok = 0, wrongs = [];
  page('<h1 class="h1">字词卡</h1><p class="lead">字词都在原句里。选出【】里的意思。答错的卡明天会再出现。</p><p class="muted">掌握 ' + mastered() + " / " + WORDS.length + " 张" + (dueCards().length ? "　·　今天该复习 " + dueCards().length + " 张" : "") + '</p><div id="wc"></div><section class="card"><h2>字词练一练</h2><p class="muted">从字词库抽 10 题，每题 15 秒，机器打分。</p><a class="btn" href="#drill/words">练一练 · 字词</a></section>', ["#home", "首页"]);
  var box = $("#wc");
  function step() {
    if (k >= cards.length) {
      box.innerHTML = '<section class="card center"><h2>这一轮完成</h2><p>答对 ' + ok + " / " + cards.length + " 张。" + (wrongs.length ? "错的 " + wrongs.length + " 张明天再出现。" : "") + '</p><div class="row center"><a class="btn" href="#drill/words">去练一练</a><button type="button" class="btn ghost" id="bMore">再来一轮</button><a class="btn ghost" href="#home">首页</a></div></section>';
      $("#bMore").addEventListener("click", function () { wordsPage(); }); return;
    }
    var w = cards[k], opts = shuffle(w.opts);
    box.innerHTML = '<section class="card wcard"><div class="wtop"><span class="kind">' + esc(w.kind || "") + '</span><span class="muted small">' + (k + 1) + " / " + cards.length + '</span></div><p class="sent">' + hlSent(w.sent) + '</p><p class="qq">【' + esc(w.w) + '】的意思是：</p><div class="opts">' +
      opts.map(function (o, i) { return '<button type="button" class="opt" data-i="' + i + '">' + esc(o) + "</button>"; }).join("") + '</div><div id="wfb"></div></section>';
    $$(".opt", box).forEach(function (b) { b.addEventListener("click", function () {
      var o = opts[+b.getAttribute("data-i")], hit = o === w.ans; $$(".opt", box).forEach(function (x) { x.disabled = true; if (opts[+x.getAttribute("data-i")] === w.ans) x.classList.add("right"); }); if (!hit) { b.classList.add("wrong"); wrongs.push(w.id); } else ok++;
      markCard(w.id, hit); save();
      $("#wfb").innerHTML = '<div class="fb ' + (hit ? "ok" : "no") + '"><b>' + (hit ? "对了！" : "正确答案：" + esc(w.ans)) + "</b>" + (w.note ? "<p>" + esc(w.note) + "</p>" : "") + '<button type="button" class="btn" id="bN">' + (k + 1 < cards.length ? "下一张" : "完成") + "</button></div>";
      $("#bN").addEventListener("click", function () { k++; step(); }); $("#bN").focus({ preventScroll: true });
    }); });
  }
  step();
}
function wordsDrill() {
  if (!WORDS.length) return notReady("字词练一练");
  var n = S.lessonAt || 1, pool = WORDS.filter(function (w) { return !w.lesson || w.lesson <= n; }); if (pool.length < 10) pool = WORDS;
  var items = shuffle(pool).slice(0, 10).map(function (w) { var opts = shuffle(w.opts); return { type: "choice", qHtml: '<p class="sent">' + hlSent(w.sent) + '</p><p class="qq">【' + esc(w.w) + "】的意思是：</p>", opts: opts, ans: opts.indexOf(w.ans), sec: 15, pts: 1, explain: w.note, ref: w.id }; });
  runner({ title: "字词练一练", items: items, feedback: true, back: ["#words", "字词卡"], after: [[location.hash, "再练一次"], ["#words", "回到字词卡", 1], ["#home", "首页", 1]],
    onDone: function (o) {
      o.res.forEach(function (r) { if (r.got < 1) markCard(r.it.ref, false); });
      S.drills.push({ kind: "words", scope: "words", score: o.score, secs: o.secs, wrong: o.res.filter(function (x) { return x.got < 1; }).map(function (x) { return x.it.ref; }), at: o.at, n: o.res.length });
      if (S.drills.length > 80) S.drills = S.drills.slice(-80); save();
    } });
}
PNAME.words = "10题";

/* ================= 四、模拟测验 ================= */
function testList() {
  if (!TESTS.length) return notReady("模拟测验");
  page('<h1 class="h1">模拟测验</h1><p class="lead">每套 100 分，约 20 分钟，一次做完。每题有倒计时。客观题自动判分；简答题先写，再对照参考要点，自己勾写到了几点。</p><div class="chs">' +
    TESTS.map(function (t) { var s = S.tests[t.id]; return '<a class="ch' + (s ? " done" : "") + '" href="#test/' + t.id + '"><span class="cn">测</span><span class="tx"><b>' + esc(t.title) + "</b><small>" + t.items.length + " 题 · 约 " + (t.minutes || 20) + " 分钟</small><em>第 " + (t.after || "?") + ' 节后</em></span><span class="st">' + (s ? "最高 " + s.best + " 分" : "") + "</span></a>"; }).join("") + "</div>", ["#home", "首页"]);
}
function testRun(id) {
  var t = TESTS.filter(function (x) { return x.id === id; })[0]; if (!t) return notReady("模拟测验");
  var s = S.tests[t.id];
  page('<section class="card center"><p class="tag">模拟测验</p><h1 class="h1">' + esc(t.title) + "</h1><p>" + t.items.length + " 题，满分 100，约 " + (t.minutes || 20) + " 分钟。每题有倒计时，时间到自动交卷进入下一题。<br>做完一起看对错和讲解。</p>" + (s ? '<p class="muted">上次 ' + s.last.score + " 分，最高 " + s.best + " 分。</p>" : "") +
    '<div class="row center"><button type="button" class="btn" id="bGo">开始</button><a class="btn ghost" href="#test">返回</a></div></section>', ["#test", "模拟测验"]);
  $("#bGo").addEventListener("click", function () {
    var items = t.items.map(function (it) {
      var o = Object.assign({}, it), q = esc(it.q || "");
      if (it.type === "choice") o.qHtml = '<p class="qq">' + q + "</p>";
      if (it.type === "fill") { var did = false; o.qHtml = '<p class="qq">' + q.replace(/（\s*[　\s]*\s*）|\(\s*\)/, function () { did = true; return "{{blank}}"; }) + (did ? "" : " {{blank}}") + "</p>"; o.blanks = [{ ans: [].concat(it.ans) }]; }
      if (it.type === "short") o.qHtml = '<p class="qq">' + q + '</p><p class="muted small">' + it.pts + " 分</p>";
      o.sec = it.sec || (it.type === "short" ? 240 : 30); o.ref = it.id; return o;
    });
    runner({ title: t.title, items: items, feedback: false, listAll: true, showPts: true, back: ["#test", "模拟测验"], after: [["#test", "回到测验"], ["#home", "首页", 1]],
      onDone: function (o) {
        var rec = S.tests[t.id] || (S.tests[t.id] = { best: 0, tries: 0 }), ans = {}, short = {};
        o.res.forEach(function (r) { var it = r.it; if (it.type === "short") short[it.id] = { text: r.yours, checked: r.checked || [], got: Math.round(r.got * it.pts * 10) / 10, pts: it.pts }; else ans[it.id] = { a: r.yours, got: Math.round(r.got * (it.pts || 1) * 10) / 10 }; });
        rec.tries++; rec.best = Math.max(rec.best, o.score); rec.last = { score: o.score, secs: o.secs, at: o.at, ans: ans, short: short };
        S.done[t.id] = 1; save();
      } });
  });
}

/* ================= 启动 ================= */
function getSess() { try { var a = JSON.parse(sessionStorage.getItem("hora-session") || "null"); if (a && a.pin) return a; } catch (e) {} return null; }
function boot() {
  var ss = getSess();
  if (TEACH) ss = { cls: "老师", name: "老师预览", pin: "0000" };
  if (!ss) { location.replace(HOME + "#login"); return; }
  ME = { cls: String(ss.cls || "").replace(/\s+/g, "").toUpperCase(), name: String(ss.name || "").replace(/\s+/g, " ").trim(), pin: String(ss.pin) };
  KEY = "hora-" + LID + (SAMPLE ? "-sample" : "") + (TEACH ? "-teacher" : "") + "-" + ME.cls + "|" + ME.name; loadLocal();
  app.innerHTML = '<p class="loading">正在打开……</p>';
  Promise.all([loadScript("data/text.js"), loadScript(DATA + "story.js"), loadScript(DATA + "words.js"), loadScript(DATA + "tests.js"), loadScript("voice/index.js"), TEACH ? loadScript("../ke/teacher.js?v=11082040") : true, TEACH ? loadScript("../lessons.js?v=" + Date.now()) : true]).then(function () {
    TEXT = window.YK_TEXT || null; STORY = Array.isArray(window.YK_STORY) ? window.YK_STORY : []; WORDS = Array.isArray(window.YK_WORDS) ? window.YK_WORDS : []; TESTS = Array.isArray(window.YK_TESTS) ? window.YK_TESTS : [];
    VOICE = window.YK_VOICE || window.PROJ_VOICE || {}; VOICE_V = window.YK_VOICE_V || window.PROJ_VOICE_V || "";
    probeScenes(); addEventListener("hashchange", route); route();
    if (TEACH) { setSaveSt("老师预览，不存档"); return; }
    if (!SITE.sheetUrl) { setSaveSt("只存在这台设备上"); return; }
    setSaveSt("正在连接…");
    api("login", ME).then(function (j) { if (j.name) ME.name = j.name; if (mergeRemote(j.state)) route(); setSaveSt("已连上"); if (!j.state) save(); })
      .catch(function (e) { if (/^(pin|cls|bad|new|roster)$/.test(e.code)) { try { sessionStorage.removeItem("hora-session"); } catch (x) {} location.replace(HOME + "#login"); return; } setSaveSt("没连上，稍后自动再存", true); });
  });
}
boot();
})();
