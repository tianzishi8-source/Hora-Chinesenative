/* 自学版通用引擎（课文自学，按课时走）
 * 表现形式沿用《岳阳楼记》自学版：顶栏课时按钮＋环节计时；每个环节一页，画面在上，人物对话、原文、练习依次往下排。
 * 每课一个文件夹（如 zuiweng/）：index.html 引用 ../zx/zx.css、../zx/zx.js、../ke/scene.js（画面），data/text.js（window.ZX_TEXT）、data/lesson.js（window.ZX），voice/index.js（录音）。
 * ZX：{ id, title, author, dynasty, guide:{name, kind 剪影样式, fig 立绘（可空）, vkey 录音键}, voices（录音工具读）, lessons:[{ title, guide（可选：这一课时换一位作者）, stages:[{ t, min, h, lead, blocks:[…] }] }] }
 * 块（block，type）：
 *   pic   画面：scene（../ke/scene.js 的场景键）＋tone，或 img；vt 竖排大字，sub 小字，cap 角注
 *   talk  人物对话：lines:[{who:"bd" 伴学（学生在首页选的清弦或长歌）/ "g" 作者 / "hy" 徽音老师 / "me" 我 / "narr" 旁白, say}]，逐句打字＋录音；读完才算完成
 *   read  原文：paras:[段落 id]，可点句听朗读；开关：注音、注释（红字可点）、白话；listen:1 显示“从头朗读”
 *   py    字音：items:[{w, opts, ans}]
 *   choice 单选：q, sent（【】标重点）, opts, ans（正确选项文字）, explain
 *   flip  翻卡：cards:[{f, b, tag}]
 *   match 配对：pairs:[[左, 右]]（右边打乱，点左再点右）
 *   pick  找句子：para, q, ans:[句子序号]，explain
 *   order 排序：q, items（正确顺序）
 *   qa    想一想：q, hint, ref（参考答案，点开看）；可写在框里（存档）
 *   write 练笔：id, prompt, hint, min, max, check:[自查清单]（存档，交给老师）
 *   recite 背诵：para（遮字四级，点句偷看）
 *   rows  对照表：title, head:[…], rows:[[…]]
 *   note  知识卡：title, html（受信任的内容）或 items:[…]
 *   method 方法卡：title, points:[…], ex（例子）
 * 存档：本机 hora-{id}-{班级|名字}；有表格网址时同步（课文 id 就是 ZX.id）；done[课时]=1 让首页长卷知道读完了几课时。 */
(function () {
"use strict";
var SITE = window.HORA_SITE || {}, HOME = SITE.home || "../", Z = window.ZX || {}, T = window.ZX_TEXT || {};
var VER = Z.ver || "1";
var app = document.getElementById("app"), CHARS = HOME + "chars/";
var QS = new URLSearchParams(location.search);
function $(s, r) { return (r || document).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
function lsGet(k, st) { try { return JSON.parse((st || localStorage).getItem(k) || "null"); } catch (e) { return null; } }
function lsPut(k, v, st) { try { (st || localStorage).setItem(k, JSON.stringify(v)); } catch (e) {} }
function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function norm(s) { return String(s || "").replace(/[\s，。！？；：、“”‘’"'（）()《》〈〉【】——…·,.!?;:\-]/g, ""); }
function hl(s) { return esc(s).replace(/【(.*?)】/g, "<b>$1</b>"); }
function toast(t) { var o = document.createElement("div"); o.className = "toast"; o.textContent = t; document.body.appendChild(o); setTimeout(function () { o.remove(); }, 2400); }
function stamp(iso) { if (!iso) return ""; var d = new Date(iso); return (d.getMonth() + 1) + "-" + d.getDate() + " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2); }

/* ---------- 人物 ---------- */
var BUD = { qingxian: { name: "清弦", c: [488, 346], v: "qx" }, changge: { name: "长歌", c: [493, 214], v: "cg" } };
function buddy() { var b = lsGet("hora-buddy") || {}; var w = BUD[b.who] ? b.who : "qingxian"; return { who: w, outfit: ["daily", "sport", "formal", "ancient"].indexOf(b.outfit) >= 0 ? b.outfit : "ancient" }; }
function myHair() { var a = lsGet("hora-avatar") || {}; return /^[gb][1-4]$/.test(a.hair) ? a.hair : "g1"; }
function GD() { return (Z.lessons && Z.lessons[L - 1] && Z.lessons[L - 1].guide) || Z.guide || {}; }
var FIGFILE = { ouyang: "ouyangxiu_outfit_ancient.webp", dufu: "dufu_outfit_ancient.webp", meng: "menghaoran_outfit_ancient.webp", libai: "libai_outfit_ancient.webp", yuan: "yuanzhongdao_outfit_ancient.webp", liang: "liangqichao_outfit_formal.webp", bingxin: "bingxin_outfit_formal.webp" };   // 11-12 立绘到了：没写 fig 时按剪影样式找 chars/ 里的立绘
function guideSrc() { var g = GD(); if (!g.fig && FIGFILE[g.kind]) return CHARS + FIGFILE[g.kind]; return g.fig ? (/^(\.|\/|http|data:)/.test(g.fig) ? g.fig : CHARS + g.fig) : (window.YK_SCENE && YK_SCENE.figure ? YK_SCENE.figure(g.kind || "scholar") : ""); }
/* 头像：把 1024×1536 的立绘按头部中心放大裁进圆框 */
function avatar(src, c, box, scale) { var sc = (scale || 1) * box / 316; return '<img src="' + src + '" alt="" style="width:' + Math.round(1024 * sc) + "px;left:" + Math.round(box / 2 - c[0] * sc) + "px;top:" + Math.round(box / 2 - c[1] * sc) + 'px" draggable="false">'; }
function who(w) {
  var b = buddy();
  if (w === "bd") return { nm: BUD[b.who].name, cls: "bd", src: CHARS + b.who + "_outfit_" + b.outfit + ".webp", c: BUD[b.who].c, v: BUD[b.who].v };
  if (w === "g") return { nm: GD().name || Z.author, cls: "g", src: guideSrc(), c: [512, 250], v: GD().vkey || "g", sc: .95 };
  if (w === "hy") return { nm: "徽音老师", cls: "hy", src: CHARS + "teacher_outfit_daily.webp", c: [505, 110], v: "hy" };
  if (w === "me") return { nm: ME ? ME.name : "我", cls: "me", src: CHARS + myHair() + "_outfit_ancient.webp", c: /^b/.test(myHair()) ? [470, 214] : [480, 318], v: "" };
  return { nm: "", cls: "narr", v: "narr" };
}

/* ---------- 声音 ---------- */
var VOICE = {}, VOICE_V = "", soundOn = lsGet("zx-sound") !== false, cur = null;
function hashStr(s) { var h = 0x811c9dc5; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return ("0000000" + h.toString(16)).slice(-8); }
function voiceText(t) { t = String(t || "").replace(/（[^）]*）/g, ""); (T.voiceFix || []).forEach(function (p) { t = t.split(p[0]).join(p[1]); }); return t.replace(/[“”‘’「」]/g, "").replace(/——/g, "，").replace(/……/g, "，"); }
function stopVoice() { if (cur) { try { cur.pause(); } catch (e) {} cur = null; } }
function play(key, say, onend, force) {
  stopVoice(); if ((!soundOn && !force) || !key || !say || /\{name\}/.test(say)) return 0;
  var h = hashStr(key + "|" + voiceText(say)); if (!VOICE[h]) return 0;
  try { var a = new Audio("voice/" + h + ".mp3" + (VOICE_V ? "?v=" + VOICE_V : "")); cur = a; a.playbackRate = RATE; a.preservesPitch = true; if (onend) a.onended = onend; var p = a.play(); if (p && p.catch) p.catch(function () {}); } catch (e) { return 0; }
  return VOICE[h] / RATE;
}
var RATE = lsGet("zx-rate") || 1.1;
function fillName(s) { return String(s || "").replace(/\{name\}/g, ME ? ME.name : ""); }

/* ---------- 状态 ---------- */
var ME = null, KEY = "", S = null, TEACH = location.hash === "#teacher";
function blank() { return { v: 1, L: 1, stage: {}, reach: {}, ok: {}, ans: {}, writes: {}, done: {}, savedAt: "" }; }
function load() { S = blank(); var o = lsGet(KEY); if (o) for (var k in o) S[k] = o[k]; }
var saveT = null, dirty = false, saveMsg = "";
function save() { S.savedAt = new Date().toISOString(); lsPut(KEY, S); if (SITE.sheetUrl && ME && !TEACH) { dirty = true; clearTimeout(saveT); saveT = setTimeout(sheetSave, 2500); } }
function api(action, body) {
  return fetch(SITE.sheetUrl, { method: "POST", body: JSON.stringify(Object.assign({ action: action, lesson: Z.id, lessonTitle: Z.title + " · 自学版" }, body || {})) })
    .then(function (r) { return r.json(); }).then(function (j) { if (!j || !j.ok) { var e = new Error((j && j.err) || "server"); e.code = (j && j.err) || "server"; throw e; } return j; });
}
function cred() { return { cls: ME.cls, name: ME.name, pin: ME.pin }; }
function payload() { var p = JSON.parse(JSON.stringify(S)); p.name = ME.name; p.cls = ME.cls; p.lesson = Z.id; return p; }
function summary() {
  var out = [ME.name + "（" + ME.cls + "）　自学版　读完 " + Object.keys(S.done).length + " / " + Z.lessons.length + " 课时　最近保存 " + stamp(S.savedAt)];
  Z.lessons.forEach(function (l, i) { out.push("第" + (i + 1) + "课时 " + l.title + "：" + (S.done[i + 1] ? "读完" : S.reach[i + 1] != null ? "读到第 " + (S.reach[i + 1] + 1) + " 环节" : "没开始")); });
  var ws = Object.keys(S.writes); if (ws.length) { out.push("【写的】"); ws.forEach(function (k) { var w = S.writes[k]; out.push("  " + (w.title || k) + "（" + stamp(w.at) + "）：" + w.text); }); }
  var q = Object.keys(S.ok).length; out.push("【练习】做对 " + Object.keys(S.ok).filter(function (k) { return S.ok[k] === 1; }).length + " / 做过 " + q);
  return out.join("\n");
}
function setSt(t) { saveMsg = t; var e = $("#saveSt"); if (e) e.textContent = t; }
function sheetSave() { if (!dirty) return; setSt("保存中…"); api("save", Object.assign(cred(), { payload: payload(), summary: summary() })).then(function () { dirty = false; setSt("已保存"); }).catch(function () { setSt("没连上，稍后再存"); setTimeout(sheetSave, 15000); }); }
addEventListener("pagehide", function () { if (SITE.sheetUrl && dirty && ME && navigator.sendBeacon) { try { navigator.sendBeacon(SITE.sheetUrl, JSON.stringify(Object.assign({ action: "save", lesson: Z.id, lessonTitle: Z.title + " · 自学版" }, cred(), { payload: payload(), summary: summary() }))); } catch (e) {} } });

/* ---------- 页面 ---------- */
var L = 1, SI = 0, clockT = null, left = 0, running = false, cleanups = [];
function lesson() { return Z.lessons[L - 1]; }
function stg() { return lesson().stages[SI]; }
function reached(l) { return S.reach[l] == null ? 0 : S.reach[l]; }
function bar() {
  var ls = Z.lessons.map(function (x, i) { var n = i + 1; return '<button type="button" data-l="' + n + '" class="' + (n === L ? "on" : "") + (S.done[n] ? " done" : "") + '" title="' + esc(x.title) + '">' + n + "</button>"; }).join("");
  var acc = 0, st = lesson().stages.map(function (s, i) { var a = acc; acc += s.min || 5; var can = TEACH || i <= reached(L) + (S.ok["st-" + L + "-" + (i - 1)] ? 1 : 0); return '<button type="button" class="st' + (i === SI ? " on" : "") + (i < reached(L) || S.done[L] ? " done" : "") + '" data-s="' + i + '"' + (can ? "" : " disabled") + "><span>" + a + "–" + acc + "′</span>" + esc(s.t) + "</button>"; }).join("");
  return '<header class="bar"><div class="bar-in"><div class="brand">' + esc(Z.title) + '<small>第' + L + "课时 · " + esc(lesson().title) + '</small></div><div class="lessons"><span class="lab">课时</span>' + ls + "</div>" +
    '<div class="tools"><button type="button" class="tbtn" id="bMap">课文地图</button><span class="clock" id="clock"></span><button type="button" class="tbtn" id="bClk">开始</button><button type="button" class="tbtn" id="bText">原文</button><button type="button" class="tbtn" id="bSnd" aria-pressed="' + soundOn + '">声音' + (soundOn ? "开" : "关") + '</button><span class="muted small" id="saveSt">' + esc(saveMsg) + "</span></div></div>" +
    '<nav class="stages" aria-label="环节">' + st + "</nav></header>";
}
function render() {
  cleanups.forEach(function (f) { try { f(); } catch (e) {} }); cleanups = []; stopVoice();
  var s = stg(); S.L = L; S.stage[L] = SI; if (SI > reached(L)) S.reach[L] = SI; save();
  var acc = 0; lesson().stages.slice(0, SI).forEach(function (x) { acc += x.min || 5; });
  app.innerHTML = bar() + '<main><section class="stage"><div class="head"><h2>' + esc(s.h || s.t) + '</h2><span class="when">第' + acc + "–" + (acc + (s.min || 5)) + "分钟 · " + (s.min || 5) + "分钟</span></div>" + (s.lead ? '<p class="lead">' + esc(fillName(s.lead)) + "</p>" : "") +
    '<div id="blocks"></div></section><div class="nav"><button type="button" class="btn ghost" id="bPrev">' + (SI > 0 ? "← 上一环节" : L > 1 ? "← 上一课时" : "← 课文地图") + '</button><span class="hint" id="navHint"></span><button type="button" class="btn" id="bNext">' + (SI < lesson().stages.length - 1 ? "下一环节 →" : L < Z.lessons.length ? "本课时完成，下一课时 →" : "全部完成") + "</button></div></main>";
  var host = $("#blocks"), need = [];
  s.blocks.forEach(function (b, i) { var el = document.createElement("div"); host.appendChild(el); var id = L + "-" + SI + "-" + i; var r = (BLOCK[b.type] || BLOCK.note)(el, b, id); if (r && r.gate) need.push(r); });
  function check() { var miss = need.filter(function (r) { return !r.ok(); }).length; $("#bNext").disabled = !!miss && !TEACH; $("#navHint").textContent = miss ? "还有 " + miss + " 项没完成" : ""; if (!miss) S.ok["st-" + L + "-" + SI] = 1; }
  need.forEach(function (r) { r.onok = check; }); check(); GATE = check;
  wire(); setClock(s.min || 5); scrollTo(0, 0);
}
var GATE = function () {};
function wire() {
  $$("[data-l]").forEach(function (b) { b.addEventListener("click", function () { L = +b.getAttribute("data-l"); SI = S.stage[L] || 0; render(); }); });
  $$(".st[data-s]").forEach(function (b) { b.addEventListener("click", function () { SI = +b.getAttribute("data-s"); render(); }); });
  $("#bMap").addEventListener("click", leave);
  $("#bSnd").addEventListener("click", function () { soundOn = !soundOn; lsPut("zx-sound", soundOn); this.textContent = "声音" + (soundOn ? "开" : "关"); this.setAttribute("aria-pressed", soundOn); if (!soundOn) stopVoice(); });
  $("#bText").addEventListener("click", fullText);
  $("#bClk").addEventListener("click", function () { running = !running; this.textContent = running ? "暂停" : "开始"; });
  $("#bPrev").addEventListener("click", function () { if (SI > 0) { SI--; render(); } else if (L > 1) { L--; SI = lesson().stages.length - 1; render(); } else leave(); });
  $("#bNext").addEventListener("click", function () {
    S.ok["st-" + L + "-" + SI] = 1;
    if (SI < lesson().stages.length - 1) { SI++; render(); return; }
    S.done[L] = 1; save();
    if (L < Z.lessons.length) { toast("第" + L + "课时完成！"); L++; SI = 0; render(); } else { toast("全部课时完成！"); render(); }
  });
}
function leave() { stopVoice(); if (SITE.sheetUrl && dirty && ME) { clearTimeout(saveT); api("save", Object.assign(cred(), { payload: payload(), summary: summary() })).then(go, go); setTimeout(go, 3000); } else go(); function go() { location.href = HOME + "#map"; } }
function setClock(min) { left = min * 60; running = false; clearInterval(clockT); paint(); clockT = setInterval(function () { if (running && left > 0) { left--; paint(); } }, 1000); function paint() { var c = $("#clock"); if (c) { c.textContent = Math.floor(left / 60) + ":" + ("0" + left % 60).slice(-2); c.classList.toggle("low", left < 60); } } }

/* ---------- 原文渲染 ---------- */
function rubyHtml(s, on) {
  var R = on ? (T.ruby || {}) : {}, keys = Object.keys(R).sort(function (a, b) { return b.length - a.length; }), out = "", i = 0;
  while (i < s.length) { var k = keys.filter(function (x) { return s.substr(i, x.length) === x; })[0];
    if (k) { var py = R[k].split(/\s+/); if (py.length === k.length) for (var j = 0; j < k.length; j++) out += "<ruby>" + esc(k[j]) + "<rt>" + esc(py[j]) + "</rt></ruby>"; else out += "<ruby>" + esc(k) + "<rt>" + esc(R[k]) + "</rt></ruby>"; i += k.length; }
    else { out += esc(s[i]); i++; } }
  return out;
}
function noteHtml(s, notes, rubyOn) {
  var ks = Object.keys(notes || {}).sort(function (a, b) { return b.length - a.length; }); if (!ks.length) return rubyHtml(s, rubyOn);
  var out = "", i = 0, buf = "";
  while (i < s.length) { var k = ks.filter(function (x) { return s.substr(i, x.length) === x; })[0];
    if (k) { out += rubyHtml(buf, rubyOn); buf = ""; out += '<span class="k" data-n="' + esc(k + "：" + notes[k]) + '" tabindex="0">' + rubyHtml(k, rubyOn) + "</span>"; i += k.length; } else { buf += s[i]; i++; } }
  return out + rubyHtml(buf, rubyOn);
}
function sentObj(x) { return typeof x === "string" ? { t: x } : x; }
function paraHtml(p, o) {
  var arr = (T.paras[p] || []).map(sentObj);
  return '<div class="p" data-p="' + p + '">' + arr.map(function (x, i) { return '<span class="s" data-p="' + p + '" data-i="' + i + '">' + (o.notes ? noteHtml(x.t, x.notes, o.ruby) : rubyHtml(x.t, o.ruby)) + "</span>" + (o.plain && x.plain ? '<span class="pl">' + esc(x.plain) + "</span>" : ""); }).join("") + "</div>";
}
function fullText() {
  var o = document.createElement("div"); o.className = "ov";
  o.innerHTML = '<div class="sheet"><button type="button" class="x" aria-label="关上">×</button><h3 style="font-family:var(--f-disp);font-size:1.8rem;margin:0">' + esc(T.title || Z.title) + '</h3><p class="muted small">' + esc(T.byline || "") + '</p><div class="txt' + (T.poem ? " poem" : "") + '">' + (T.order || []).map(function (p) { return (T.heads && T.heads[p] ? '<p class="muted small" style="text-indent:0;margin-top:.6em">' + esc(T.heads[p]) + "</p>" : "") + paraHtml(p, { ruby: true, notes: true }); }).join("") + '</div><p class="notebar" id="fnb"></p></div>';
  document.body.appendChild(o);
  function close() { o.remove(); } $(".x", o).addEventListener("click", close); o.addEventListener("click", function (e) { if (e.target === o) close(); });
  $$(".k", o).forEach(function (k) { k.addEventListener("click", function (e) { e.stopPropagation(); $("#fnb", o).textContent = k.getAttribute("data-n"); }); });
}

/* ---------- 块 ---------- */
var BLOCK = {};
function gate(id, el) { var r = { gate: true, ok: function () { return TEACH || S.ok[id] != null; }, onok: null }; r.done = function (v) { if (S.ok[id] == null) { S.ok[id] = v; save(); } if (r.onok) r.onok(); }; return r; }
BLOCK.pic = function (el, b) {
  /* 有课堂版的场景真图（Z.sceneDir，如 "../zuiweng-ke/img/"）时先试 scene-键-色调.webp，再试 scene-键.webp，都没有才用画的 */
  if (!b.img && Z.sceneDir && b.scene) {
    var cands = (b.tone ? [Z.sceneDir + "scene-" + b.scene + "-" + b.tone + ".webp"] : []).concat([Z.sceneDir + "scene-" + b.scene + ".webp"]);
    (function tryOne(i) { if (i >= cands.length) return; var im = new Image(); im.onload = function () { var pic = el.querySelector(".pic"); if (pic && im.naturalWidth) { var sv = pic.querySelector("svg"); var ni = document.createElement("img"); ni.src = cands[i]; ni.alt = b.alt || ""; if (sv) sv.replaceWith(ni); } }; im.onerror = function () { tryOne(i + 1); }; im.src = cands[i]; })(0);
  }
  var inner = b.img ? '<img src="' + esc(b.img) + '" alt="' + esc(b.alt || "") + '">' : window.YK_SCENE ? YK_SCENE.svg(b.scene || "mount", b.tone || "day").replace("<svg ", '<svg role="img" aria-label="' + esc(b.alt || "") + '" ') : "";
  el.innerHTML = '<div class="pic">' + inner + (b.vt ? '<div class="vt">' + esc(b.vt) + (b.sub ? "<small>" + esc(b.sub) + "</small>" : "") + "</div>" : "") + (b.cap ? '<span class="cap">' + esc(b.cap) + "</span>" : "") + "</div>";
};
BLOCK.talk = function (el, b, id) {
  var r = gate(id), lines = b.lines, k = 0, typing = null, timer = null, alive = true;
  var g = who("g"), bd = who("bd"), me = who("me"), hy = who("hy");
  var cast = {}; lines.forEach(function (l) { cast[l.who] = 1; });
  var leftWho = cast.g ? g : cast.hy ? hy : null;
  el.innerHTML = '<div class="talk">' + (leftWho ? '<div class="avs l"><div class="av" data-w="' + (cast.g ? "g" : "hy") + '">' + avatar(leftWho.src, leftWho.c, 84, leftWho.sc) + "</div>" + esc(leftWho.nm) + "</div>" : "<div></div>") +
    '<div class="bubble"><span class="nm" id="nm' + id + '"></span><p class="say" id="say' + id + '"></p><div class="row"><span class="prog" id="pg' + id + '"></span><span class="row"><button type="button" class="btn ghost sm" data-log>回看</button><button type="button" class="btn sm" data-go>继续</button></span></div></div>' +
    '<div class="avr">' + (cast.hy && cast.g ? '<div class="avs"><div class="av" data-w="hy">' + avatar(hy.src, hy.c, 70) + "</div>徽音老师</div>" : "") + '<div class="avs"><div class="av" data-w="me">' + avatar(me.src, me.c, 70) + "</div>我</div>" + (cast.bd ? '<div class="avs"><div class="av" data-w="bd">' + avatar(bd.src, bd.c, 84) + "</div>" + esc(bd.nm) + "</div>" : "") + "</div></div>";
  var bub = $(".bubble", el), nm = $("#nm" + CSS.escape(id), el), say = $("#say" + CSS.escape(id), el), pg = $("#pg" + CSS.escape(id), el), goB = $("[data-go]", el);
  cleanups.push(function () { alive = false; clearInterval(typing); clearTimeout(timer); });
  function show() {
    if (k >= lines.length) { goB.textContent = "再听一遍"; pg.textContent = "读完了"; r.done(1); $$(".av", el).forEach(function (a) { a.classList.remove("on"); }); return; }
    var l = lines[k], w = who(l.who), text = fillName(l.say), chars = Array.from(text);
    nm.textContent = w.nm; nm.className = "nm " + w.cls; bub.classList.toggle("narr", w.cls === "narr");
    $$(".av", el).forEach(function (a) { a.classList.toggle("on", a.getAttribute("data-w") === l.who); });
    pg.textContent = (k + 1) + " / " + lines.length;
    var secs = w.v ? play(w.v, l.say) : 0, step = secs ? Math.max(30, Math.min(260, secs * 900 / Math.max(1, chars.length))) : 45, i = 0, t0 = Date.now();
    clearInterval(typing); typing = setInterval(function () { i = Math.min(chars.length, Math.floor((Date.now() - t0) / step) + 1); say.textContent = chars.slice(0, i).join(""); if (i >= chars.length) { clearInterval(typing); typing = null; } }, 30);
    goB.textContent = k + 1 < lines.length ? "继续" : "读完了";
  }
  goB.addEventListener("click", function () { if (typing) { clearInterval(typing); typing = null; say.textContent = fillName(lines[k].say); return; } if (k >= lines.length) { k = 0; goB.textContent = "继续"; show(); return; } k++; show(); });
  $("[data-log]", el).addEventListener("click", function () {
    var o = document.createElement("div"); o.className = "ov"; o.innerHTML = '<div class="sheet"><button type="button" class="x">×</button><h3>这一段说过的话</h3>' + lines.slice(0, Math.min(lines.length, k + 1)).map(function (l) { var w = who(l.who); return "<p>" + (w.nm ? "<b>" + esc(w.nm) + "：</b>" : "") + esc(fillName(l.say)) + "</p>"; }).join("") + "</div>";
    document.body.appendChild(o); $(".x", o).addEventListener("click", function () { o.remove(); }); o.addEventListener("click", function (e) { if (e.target === o) o.remove(); });
  });
  show();
  return r;
};
BLOCK.read = function (el, b, id) {
  var o = lsGet("zx-read") || { ruby: true, notes: true, plain: false };
  function draw() {
    el.innerHTML = '<div class="box">' + (b.title ? '<p class="kicker">' + esc(b.title) + "</p>" : "") + '<div class="row" style="margin-bottom:8px">' +
      (b.listen ? '<button type="button" class="btn sm" data-all>▶ 从头朗读</button>' : "") +
      '<button type="button" class="tbtn" data-o="ruby" aria-pressed="' + !!o.ruby + '">注音</button><button type="button" class="tbtn" data-o="notes" aria-pressed="' + !!o.notes + '">注释</button><button type="button" class="tbtn" data-o="plain" aria-pressed="' + !!o.plain + '">白话</button>' +
      '<span class="muted small">点一句，听这一句；点红字，看注释。</span></div><div class="txt' + (T.poem ? " poem" : "") + '">' + b.paras.map(function (p) { return (T.heads && T.heads[p] && b.heads !== false ? '<p class="muted small" style="text-indent:0">' + esc(T.heads[p]) + "</p>" : "") + paraHtml(p, o); }).join("") + '</div><p class="notebar" id="nb' + id + '"></p></div>';
    $$("[data-o]", el).forEach(function (x) { x.addEventListener("click", function () { var k = x.getAttribute("data-o"); o[k] = !o[k]; lsPut("zx-read", o); draw(); }); });
    $$(".k", el).forEach(function (k) { k.addEventListener("click", function (e) { e.stopPropagation(); $("#nb" + CSS.escape(id), el).textContent = k.getAttribute("data-n"); }); });
    $$(".s", el).forEach(function (s) { s.addEventListener("click", function () { one(s); }); });
    var all = $("[data-all]", el); if (all) all.addEventListener("click", function () { var ss = $$(".s", el), i = 0; stopAll = false; (function nx() { if (stopAll || i >= ss.length) { ss.forEach(function (x) { x.classList.remove("on"); }); return; } one(ss[i], function () { i++; setTimeout(nx, 250); }); })(); });
  }
  var stopAll = false; cleanups.push(function () { stopAll = true; });
  function one(s, then) {
    $$(".s.on", el).forEach(function (x) { x.classList.remove("on"); }); s.classList.add("on");
    var x = sentObj(T.paras[s.getAttribute("data-p")][+s.getAttribute("data-i")]), d = play("read", x.t, function () { s.classList.remove("on"); if (then) then(); }, true);
    if (!d) setTimeout(function () { s.classList.remove("on"); if (then) then(); }, 900 + x.t.length * 160);
  }
  draw();
};
BLOCK.py = function (el, b, id) {
  var r = gate(id), got = {}, right = 0;
  el.innerHTML = '<div class="box"><p class="kicker">' + esc(b.title || "读准字音") + "</p>" + (b.q ? '<p class="q">' + esc(b.q) + "</p>" : "") + b.items.map(function (it, i) { return '<div class="pyrow" data-i="' + i + '"><b>' + esc(it.w) + "</b>" + shuffle(it.opts).map(function (op) { return '<button type="button" class="opt" data-v="' + esc(op) + '">' + esc(op) + "</button>"; }).join("") + '<span class="muted small" data-x></span></div>'; }).join("") + '<p class="fb info" hidden data-sum></p></div>';
  $$(".pyrow", el).forEach(function (row) { var it = b.items[+row.getAttribute("data-i")];
    $$(".opt", row).forEach(function (bt) { bt.addEventListener("click", function () { if (got[row.getAttribute("data-i")] != null) return; var ok = bt.getAttribute("data-v") === it.ans; got[row.getAttribute("data-i")] = ok; if (ok) right++;
      $$(".opt", row).forEach(function (x) { x.disabled = true; if (x.getAttribute("data-v") === it.ans) x.classList.add("right"); }); if (!ok) bt.classList.add("wrong");
      $("[data-x]", row).textContent = it.note || ""; play("read", it.say || it.w, null, true);
      if (Object.keys(got).length === b.items.length) { var sm = $("[data-sum]", el); sm.hidden = false; sm.textContent = "读对 " + right + " / " + b.items.length + "。" + (right < b.items.length ? "读错的那几个，大声再念三遍。" : "全对！"); r.done(right === b.items.length ? 1 : 0); } }); }); });
  return r;
};
BLOCK.choice = function (el, b, id) {
  var r = gate(id), opts = shuffle(b.opts);
  el.innerHTML = '<div class="box"><p class="kicker">' + esc(b.title || "想一想，选一选") + "</p>" + (b.sent ? '<p class="sent">' + hl(b.sent) + "</p>" : "") + '<p class="q">' + esc(fillName(b.q)) + '</p><div class="opts">' + opts.map(function (o, i) { return '<button type="button" class="opt" data-i="' + i + '">' + esc(o) + "</button>"; }).join("") + "</div><div data-fb></div></div>";
  $$(".opt", el).forEach(function (bt) { bt.addEventListener("click", function () {
    var o = opts[+bt.getAttribute("data-i")], ok = o === b.ans; $$(".opt", el).forEach(function (x) { x.disabled = true; if (opts[+x.getAttribute("data-i")] === b.ans) x.classList.add("right"); }); if (!ok) bt.classList.add("wrong");
    $("[data-fb]", el).innerHTML = '<div class="fb ' + (ok ? "ok" : "no") + '"><b>' + (ok ? "对了！" : "正确答案：" + esc(b.ans)) + "</b>" + (b.explain ? "<p>" + esc(b.explain) + "</p>" : "") + "</div>"; r.done(ok ? 1 : 0);
  }); });
  return r;
};
BLOCK.flip = function (el, b, id) {
  var r = gate(id), seen = {};
  el.innerHTML = '<div class="box"><p class="kicker">' + esc(b.title || "翻卡片") + '</p><p class="muted small" style="margin-bottom:8px">' + esc(b.q || "先想一想，再点卡片翻过来对答案。每张都要翻。") + '</p><div class="flips">' + b.cards.map(function (c, i) { return '<button type="button" class="flip" data-i="' + i + '"><div class="in"><div class="f"><span>' + hl(c.f) + "</span>" + (c.tag ? "<small>" + esc(c.tag) + "</small>" : "") + '</div><div class="b"><span>' + esc(c.b) + "</span></div></div></button>"; }).join("") + "</div></div>";
  $$(".flip", el).forEach(function (f) { f.addEventListener("click", function () { f.classList.toggle("on"); seen[f.getAttribute("data-i")] = 1; if (Object.keys(seen).length === b.cards.length) r.done(1); }); });
  return r;
};
BLOCK.match = function (el, b, id) {
  var r = gate(id), rights = shuffle(b.pairs.map(function (p, i) { return i; })), sel = null, done = {}, wrong = 0;
  el.innerHTML = '<div class="box"><p class="kicker">' + esc(b.title || "连一连") + '</p><p class="muted small" style="margin-bottom:8px">' + esc(b.q || "先点左边，再点右边和它对应的一项。") + '</p><div class="match">' + b.pairs.map(function (p, i) { return '<button type="button" class="l" data-l="' + i + '">' + esc(p[0]) + '</button><button type="button" class="r" data-r="' + rights[i] + '">' + esc(b.pairs[rights[i]][1]) + "</button>"; }).join("") + "</div><div data-fb></div></div>";
  $$(".l", el).forEach(function (x) { x.addEventListener("click", function () { if (done[x.getAttribute("data-l")]) return; $$(".l", el).forEach(function (y) { y.classList.remove("sel"); }); x.classList.add("sel"); sel = x.getAttribute("data-l"); }); });
  $$(".r", el).forEach(function (x) { x.addEventListener("click", function () {
    if (sel == null || x.classList.contains("ok")) return; var lx = $('.l[data-l="' + sel + '"]', el);
    if (x.getAttribute("data-r") === sel) { lx.classList.remove("sel"); lx.classList.add("ok"); x.classList.add("ok"); done[sel] = 1; sel = null; if (Object.keys(done).length === b.pairs.length) { $("[data-fb]", el).innerHTML = '<div class="fb ok"><b>全部连对了。</b>' + (wrong ? "中途错了 " + wrong + " 次。" : "一次都没错！") + (b.explain ? "<p>" + esc(b.explain) + "</p>" : "") + "</div>"; r.done(wrong ? 0 : 1); } }
    else { wrong++; x.classList.add("no"); setTimeout(function () { x.classList.remove("no"); }, 600); }
  }); });
  return r;
};
BLOCK.pick = function (el, b, id) {
  var r = gate(id), pk = {};
  el.innerHTML = '<div class="box"><p class="kicker">' + esc(b.title || "找一找") + '</p><p class="q">' + esc(b.q) + '</p><div class="txt">' + paraHtml(b.para, { ruby: false }) + '</div><div class="row"><button type="button" class="btn sm" data-ck>选好了</button><span class="muted small">点句子选中，再点一次取消。</span></div><div data-fb></div></div>';
  $$(".s", el).forEach(function (s) { s.addEventListener("click", function () { if (r.ok()) return; var i = s.getAttribute("data-i"); pk[i] = !pk[i]; s.classList.toggle("pk", !!pk[i]); }); });
  $("[data-ck]", el).addEventListener("click", function () {
    var mine = Object.keys(pk).filter(function (k) { return pk[k]; }).map(Number), ok = mine.length === b.ans.length && b.ans.every(function (a) { return mine.indexOf(a) >= 0; });
    $$(".s", el).forEach(function (s) { var i = +s.getAttribute("data-i"), want = b.ans.indexOf(i) >= 0; s.classList.remove("pk"); if (want) s.classList.add("ok"); else if (pk[i]) s.classList.add("bad"); });
    $("[data-fb]", el).innerHTML = '<div class="fb ' + (ok ? "ok" : "no") + '"><b>' + (ok ? "找对了！" : "绿色的是要找的句子。") + "</b>" + (b.explain ? "<p>" + esc(b.explain) + "</p>" : "") + "</div>"; this.disabled = true; r.done(ok ? 1 : 0);
  });
  return r;
};
BLOCK.order = function (el, b, id) {
  var r = gate(id), seq = [], pool = shuffle(b.items.map(function (t, i) { return i; }));
  el.innerHTML = '<div class="box"><p class="kicker">' + esc(b.title || "排一排") + '</p><p class="q">' + esc(b.q) + '</p><ol class="seq"></ol><div class="pool"></div><div class="row" style="margin-top:8px"><button type="button" class="btn ghost sm" data-clr>重排</button><button type="button" class="btn sm" data-ck>排好了</button></div><div data-fb></div></div>';
  function paint() {
    $(".seq", el).innerHTML = seq.map(function (i, k) { return '<li><button type="button" class="opt sel" data-s="' + k + '">' + (k + 1) + "　" + esc(b.items[i]) + "</button></li>"; }).join("") || '<li class="ph">按顺序点下面的项</li>';
    $(".pool", el).innerHTML = pool.filter(function (i) { return seq.indexOf(i) < 0; }).map(function (i) { return '<button type="button" class="opt" data-p="' + i + '">' + esc(b.items[i]) + "</button>"; }).join("");
    $$("[data-p]", el).forEach(function (x) { x.addEventListener("click", function () { seq.push(+x.getAttribute("data-p")); paint(); }); });
    $$("[data-s]", el).forEach(function (x) { x.addEventListener("click", function () { if (!r.ok()) { seq.splice(+x.getAttribute("data-s"), 1); paint(); } }); });
  }
  paint();
  $("[data-clr]", el).addEventListener("click", function () { seq = []; paint(); });
  $("[data-ck]", el).addEventListener("click", function () { if (seq.length < b.items.length) { toast("还没排完"); return; } var ok = seq.every(function (x, i) { return x === i; });
    $("[data-fb]", el).innerHTML = '<div class="fb ' + (ok ? "ok" : "no") + '"><b>' + (ok ? "顺序对了！" : "正确顺序：") + "</b>" + (ok ? "" : "<ol>" + b.items.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ol>") + (b.explain ? "<p>" + esc(b.explain) + "</p>" : "") + "</div>"; r.done(ok ? 1 : 0); });
  return r;
};
BLOCK.qa = function (el, b, id) {
  var r = gate(id), old = (S.ans[id] || "");
  el.innerHTML = '<div class="box"><p class="kicker">' + esc(b.title || "想一想") + '</p><p class="q">' + esc(fillName(b.q)) + "</p>" + (b.hint ? '<p class="muted small">提示：' + esc(b.hint) + "</p>" : "") + '<textarea rows="3" placeholder="先想一想，可以写几句（会存下来）……">' + esc(old) + '</textarea><div class="row" style="margin-top:6px"><button type="button" class="btn sm" data-rv>看参考</button></div><div class="fb info" hidden data-ref><b>参考：</b>' + esc(b.ref) + "</div></div>";
  var ta = $("textarea", el); ta.addEventListener("input", function () { S.ans[id] = ta.value; save(); });
  $("[data-rv]", el).addEventListener("click", function () { $("[data-ref]", el).hidden = false; r.done(1); });
  if (S.ok[id] != null) $("[data-ref]", el).hidden = false;
  return r;
};
BLOCK.write = function (el, b, id) {
  var r = gate(b.id || id), w = S.writes[b.id || id] || {}, min = b.min || 0, max = b.max || 600;
  el.innerHTML = '<div class="box"><p class="kicker">' + esc(b.title || "练笔（会交给老师）") + '</p><p class="q">' + esc(fillName(b.prompt)) + "</p>" + (b.hint ? '<p class="muted small" style="margin-bottom:6px">提示：' + esc(b.hint) + "</p>" : "") +
    '<textarea rows="' + (b.rows || 6) + '" maxlength="' + max + '" placeholder="在这里写……">' + esc(w.text || "") + "</textarea>" +
    (b.check ? '<div style="margin-top:6px"><p class="muted small">写完对照检查：</p>' + b.check.map(function (c, i) { return '<label class="chk"><input type="checkbox" data-c="' + i + '"' + ((w.checks || [])[i] ? " checked" : "") + "><span>" + esc(c) + "</span></label>"; }).join("") + "</div>" : "") +
    '<div class="row" style="margin-top:6px;justify-content:space-between"><span class="cnt"></span><span class="row"><span class="saved" data-sv>' + (w.at ? "已交 " + stamp(w.at) : "") + '</span><button type="button" class="btn sm" data-go>交给老师</button></span></div>' + (b.model ? '<div class="fb info" hidden data-ref><b>参考：</b>' + esc(b.model) + "</div>" : "") + "</div>";
  var ta = $("textarea", el), cnt = $(".cnt", el), go = $("[data-go]", el);
  function upd() { var n = norm(ta.value).length; cnt.textContent = n + " 字" + (min ? "（至少 " + min + " 字）" : ""); cnt.classList.toggle("short", n < min); go.disabled = n < min; }
  ta.addEventListener("input", upd); upd();
  go.addEventListener("click", function () { S.writes[b.id || id] = { text: ta.value.trim(), at: new Date().toISOString(), title: b.title || b.prompt.slice(0, 20), checks: $$("[data-c]", el).map(function (c) { return c.checked; }) }; save(); $("[data-sv]", el).textContent = "已交 " + stamp(S.writes[b.id || id].at); var rf = $("[data-ref]", el); if (rf) rf.hidden = false; toast("交好了，老师能看到。"); r.done(1); });
  if (w.at && $("[data-ref]", el)) $("[data-ref]", el).hidden = false;
  return r;
};
BLOCK.recite = function (el, b, id) {
  var LV = ["全文", "留头两字", "留首字", "全空"], lv = 0;
  function mask(s) { if (!lv) return rubyHtml(s, true); var keep = lv === 1 ? 2 : lv === 2 ? 1 : 0, n = 0, out = ""; for (var i = 0; i < s.length; i++) { var c = s[i]; if (!norm(c)) { out += esc(c); continue; } out += n < keep ? esc(c) : '<span class="mk">' + esc(c) + "</span>"; n++; } return out; }
  function draw() {
    var ps = [].concat(b.para);
    el.innerHTML = '<div class="box"><p class="kicker">' + esc(b.title || "背一背") + '</p><div class="lv">' + LV.map(function (t, i) { return '<button type="button" data-lv="' + i + '" class="' + (i === lv ? "on" : "") + '">' + (i ? "遮字 " + i + "：" : "") + t + "</button>"; }).join("") + '</div><p class="muted small">' + (lv ? "点一句可以偷看 3 秒。" : "先读熟，再一级一级遮起来。") + '</p><div class="txt' + (T.poem ? " poem" : "") + '">' + ps.map(function (p) { return '<div class="p">' + (T.paras[p] || []).map(sentObj).map(function (x, i) { return '<span class="s" data-i="' + i + '">' + mask(x.t) + "</span>"; }).join("") + "</div>"; }).join("") + "</div></div>";
    $$("[data-lv]", el).forEach(function (x) { x.addEventListener("click", function () { lv = +x.getAttribute("data-lv"); draw(); }); });
    $$(".s", el).forEach(function (s) { s.addEventListener("click", function () { if (!lv) return; s.classList.add("peek"); setTimeout(function () { s.classList.remove("peek"); }, 3000); }); });
  }
  draw();
};
BLOCK.rows = function (el, b) {
  el.innerHTML = '<div class="box">' + (b.title ? '<p class="kicker">' + esc(b.title) + "</p>" : "") + '<div class="rows' + (b.head && b.head.length === 3 ? " c3" : "") + '">' + (b.head ? '<div class="r2 hd">' + b.head.map(function (h) { return "<span>" + esc(h) + "</span>"; }).join("") + "</div>" : "") + b.rows.map(function (r) { return '<div class="r2"><b>' + esc(r[0]) + "</b>" + r.slice(1).map(function (c) { return "<span>" + esc(c) + "</span>"; }).join("") + "</div>"; }).join("") + "</div>" + (b.foot ? '<p class="muted small" style="margin-top:8px">' + esc(b.foot) + "</p>" : "") + "</div>";
};
BLOCK.note = function (el, b) {
  el.innerHTML = '<div class="box">' + (b.title ? '<p class="kicker">' + esc(b.title) + "</p>" : "") + (b.html || "") + (b.items ? "<ul>" + b.items.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" : "") + "</div>" + (b.teacher ? '<p class="teacher"><b>给老师：</b>' + esc(b.teacher) + "</p>" : "");
};
BLOCK.method = function (el, b) {
  el.innerHTML = '<div class="box method"><p class="kicker">写作方法</p><h3>' + esc(b.title) + "</h3><ol>" + b.points.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ol>" + (b.ex ? '<div class="ex">' + esc(b.ex) + "</div>" : "") + "</div>";
};

/* ---------- 启动 ---------- */
function sess() { try { var a = JSON.parse(sessionStorage.getItem("hora-session") || "null"); if (a && a.pin) return a; } catch (e) {} return null; }
function boot() {
  if (TEACH) { document.documentElement.classList.add("tmode"); ME = { cls: "T", name: "老师", pin: "" }; }
  else { var ss = sess(); if (!ss) { location.replace(HOME + "#login"); return; } ME = { cls: String(ss.cls || "").replace(/\s+/g, "").toUpperCase(), name: String(ss.name || "").trim(), pin: String(ss.pin) }; }
  KEY = "hora-" + Z.id + "-" + ME.cls + "|" + ME.name; load();
  L = Math.min(Z.lessons.length, Math.max(1, +QS.get("l") || S.L || 1)); SI = Math.min(lesson().stages.length - 1, S.stage[L] || 0);
  var s = document.createElement("script"); s.src = "voice/index.js?v=" + VER; s.onload = s.onerror = function () { VOICE = window.PROJ_VOICE || {}; VOICE_V = window.PROJ_VOICE_V || ""; render(); }; document.head.appendChild(s);
  if (SITE.sheetUrl && !TEACH) api("login", ME).then(function (j) { if (j.state && j.state.savedAt && (!S.savedAt || j.state.savedAt > S.savedAt)) { var n = blank(); for (var k in j.state) if (!/^(name|cls|lesson)$/.test(k)) n[k] = j.state[k]; S = n; lsPut(KEY, S); render(); } setSt("已连上"); }).catch(function (e) { if (/^(pin|cls|bad|new|roster)$/.test(e.code)) { try { sessionStorage.removeItem("hora-session"); } catch (x) {} location.replace(HOME + "#login"); } else setSt("没连上，只存在这台设备上"); });
  else setSt(TEACH ? "老师预览（不存档）" : "只存在这台设备上");
}
boot();
})();
