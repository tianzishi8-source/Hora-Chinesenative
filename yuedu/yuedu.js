/* 弦歌 · 课外阅读（八年级）
 * 学生：读自己的纸书 / Kindle；这里按段做测验（每次随机 5 题，对 4 题算过）、写复述（60—100 字，不能粘贴，至少 2 个细节）。
 * 全班进度：所有同学按段数排；“阅读王”＝读完段数最多，“阅读新星”＝最近 7 天读完段数最多。
 * 老师：#teacher 进，用老师密码看每个人每段的成绩、次数、复述原文和用时。
 * 存在同一张表格：课文 id = YD_LESSON.id；进度数据里 passes 记每段完成时间，全班进度从这里算（表格脚本 board）。
 */
(function () {
  "use strict";
  var SITE = window.HORA_SITE || {}, L = window.YD_LESSON, BOOKS = window.YD_BOOKS;
  var HOME = SITE.home || "../";
  var COOL = 10 * 60 * 1000; /* 测验没过，10 分钟后才能再测 */
  var me = null, tpw = null, S = blank(), KEY = "", timer = null, saving = false, again = false;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  function el(t, a, kids) { var e = document.createElement(t); for (var k in (a || {})) { if (k === "text") e.textContent = a[k]; else if (k === "html") e.innerHTML = a[k]; else if (a[k] !== false && a[k] != null) e.setAttribute(k, a[k]); } (kids || []).forEach(function (c) { if (c) e.append(c); }); return e; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function blank() { return { tests: {}, retell: {}, passes: [], final: {} }; }
  function book(id) { return BOOKS.filter(function (b) { return b.id === id; })[0]; }
  function sk(b, n) { return b + "-" + n; }
  function fmt(t) { var d = new Date(t); return (d.getMonth() + 1) + "月" + d.getDate() + "日 " + d.getHours() + ":" + ("0" + d.getMinutes()).slice(-2); }
  function count(s) { return String(s || "").replace(/\s/g, "").length; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x; } return a; }

  /* ---------- 后台 ---------- */
  function api(action, body) {
    if (!SITE.sheetUrl) return Promise.reject(Object.assign(new Error("nosheet"), { code: "nosheet" }));
    return fetch(SITE.sheetUrl, { method: "POST", body: JSON.stringify(Object.assign({ action: action, lesson: L.id, lessonTitle: L.title }, body || {})) })
      .then(function (r) { return r.json(); })
      .then(function (j) { if (!j || !j.ok) { var e = new Error((j && j.err) || "server"); e.code = (j && j.err) || "server"; throw e; } return j; });
  }
  function cred() { return { cls: me.cls, name: me.name, pin: me.pin }; }
  function segDone(b, n) { var r = S.retell[sk(b, n)], t = S.tests[sk(b, n)]; return !!(t && t.pass && r && (r.text || r.paper)); }
  function doneCount(b) { var bk = book(b), c = 0; (bk.segs || []).forEach(function (s) { if (segDone(b, s.n)) c++; }); return c; }
  function progressText() { return BOOKS.filter(function (b) { return b.open; }).map(function (b) { return b.title + " " + doneCount(b.id) + "/" + b.segs.length + (S.final[b.id] && S.final[b.id].pass ? " 全书✓" : ""); }).join("；"); }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
    if (!me) return;
    clearTimeout(timer); timer = setTimeout(push, 800);
  }
  function push() {
    if (saving) { again = true; return; }
    saving = true; status("正在保存……");
    api("save", Object.assign(cred(), { payload: S, progress: progressText(), summary: progressText() }))
      .then(function () { status("已保存"); }).catch(function () { status("没连上，稍后自动再存", true); setTimeout(push, 20000); })
      .then(function () { saving = false; if (again) { again = false; push(); } });
  }
  function status(t, bad) { var s = $("#ydSave"); if (s) { s.textContent = t; s.classList.toggle("bad", !!bad); } }

  /* ---------- 进入 ---------- */
  function getSess() { try { var a = JSON.parse(sessionStorage.getItem("hora-session") || "null"); if (a && a.pin) return a; } catch (e) {} return null; }
  function start() {
    $("#ydHome").addEventListener("click", function () { location.href = HOME; });
    $("#ydT").addEventListener("click", teacherLogin);
    if (location.hash === "#teacher") { teacherLogin(); return; }
    var ss = getSess();
    if (!ss) { location.replace(HOME + "#login"); return; }
    me = { cls: String(ss.cls).replace(/\s+/g, "").toUpperCase(), name: String(ss.name).trim(), pin: String(ss.pin) };
    KEY = "hora-" + L.id + "-" + me.cls + "|" + me.name;
    try { var raw = localStorage.getItem(KEY); if (raw) S = Object.assign(blank(), JSON.parse(raw)); } catch (e) {}
    $("#ydWho").textContent = me.cls + " · " + me.name;
    status("正在连接……");
    api("login", cred()).then(function (j) { if (j.state) merge(j.state); status("已连上"); save(); showShelf(); })
      .catch(function (e) { if (e.code === "pin" || e.code === "roster" || e.code === "bad") { try { sessionStorage.removeItem("hora-session"); } catch (x) {} location.replace(HOME + "#login"); return; } status("没连上表格，先存在这台设备上", true); showShelf(); });
  }
  /* 合并：两边都有的，取做得多的那一份 */
  function merge(r) {
    r = Object.assign(blank(), r);
    for (var k in r.tests) { var a = S.tests[k], b = r.tests[k]; if (!a || (b.tries || []).length > (a.tries || []).length || (b.pass && !a.pass)) S.tests[k] = b; }
    for (var k2 in r.retell) if (!S.retell[k2] || (r.retell[k2].t || 0) > (S.retell[k2].t || 0)) S.retell[k2] = r.retell[k2];
    for (var k3 in r.final) if (!S.final[k3] || r.final[k3].pass) S.final[k3] = r.final[k3];
    var seen = {}; S.passes = S.passes.concat(r.passes || []).filter(function (p) { var id = p.b + "-" + p.s; if (seen[id]) return false; seen[id] = 1; return true; });
  }
  function view(node) { var m = $("#ydMain"); m.innerHTML = ""; m.append(node); window.scrollTo(0, 0); }

  /* ---------- 我的书 ---------- */
  function showShelf() {
    var wrap = el("div", {}, [tabs("shelf")]);
    BOOKS.forEach(function (b) {
      var d = b.open ? doneCount(b.id) : 0, tot = (b.segs || []).length;
      var card = el("section", { class: "card book" + (b.open ? "" : " shut") });
      card.innerHTML = '<h2>《' + esc(b.title) + '》<small>' + esc(b.author) + '</small></h2><p class="meta">' + esc(b.tr) + ' · ' + esc(b.words) + '</p><p>' + esc(b.intro) + '</p>' +
        (b.open ? '<div class="bar"><i style="width:' + (tot ? Math.round(d / tot * 100) : 0) + '%"></i></div><p class="meta">读完 ' + d + ' / ' + tot + ' 段' + (S.final[b.id] && S.final[b.id].pass ? ' · 全书测验已过 ✓' : '') + '</p>' : '<p class="meta">还没开始</p>');
      if (b.open) { var go = el("button", { class: "btn", type: "button", text: d ? "接着读" : "开始读" }); go.addEventListener("click", function () { showBook(b.id); }); card.append(go); }
      wrap.append(card);
    });
    wrap.append(el("p", { class: "note", html: "书不在网站上：读你自己的纸书或 Kindle。每读完一段，回到这里做测验、写复述。" }));
    view(wrap);
  }
  function tabs(on) {
    var t = el("nav", { class: "tabs" });
    [["shelf", "我的书"], ["board", "全班进度"]].forEach(function (x) { var b = el("button", { type: "button", class: on === x[0] ? "on" : "", text: x[1] }); b.addEventListener("click", function () { x[0] === "shelf" ? showShelf() : showBoard(); }); t.append(b); });
    return t;
  }

  /* ---------- 一本书：分段 ---------- */
  function showBook(id) {
    var b = book(id), wrap = el("div");
    var back = el("button", { class: "ghost", type: "button", text: "← 我的书" }); back.addEventListener("click", showShelf);
    wrap.append(back, el("h2", { class: "bt", text: "《" + b.title + "》" }), el("p", { class: "meta", text: b.tr + "。按顺序一段一段读：读完一段，做测验（随机 " + b.draw + " 题，对 " + b.pass + " 题算过），再写复述。" }));
    var open = true;
    b.segs.forEach(function (s) {
      var k = sk(id, s.n), t = S.tests[k], r = S.retell[k], done = segDone(id, s.n);
      var row = el("section", { class: "card seg" + (done ? " done" : "") + (open ? "" : " lock") });
      var st = done ? "完成 ✓" : (t && t.pass ? "测验已过，还要写复述" : (t && t.tries && t.tries.length ? "测验还没过（已测 " + t.tries.length + " 次）" : (open ? "还没测" : "先读完上一段")));
      row.innerHTML = '<h3><b>第' + s.n + '段</b> ' + esc(s.title) + '</h3><p class="meta">从“' + esc(s.from) + '”读到“' + esc(s.to) + '”· ' + esc(s.words) + '</p><p class="st">' + esc(st) + '</p>';
      if (open && !done) {
        if (!(t && t.pass)) { var bt = el("button", { class: "btn", type: "button", text: "这一段读完了，做测验" }); bt.addEventListener("click", function () { showTest(id, s.n); }); row.append(bt); }
        else { var br = el("button", { class: "btn", type: "button", text: "写复述" }); br.addEventListener("click", function () { showRetell(id, s.n); }); row.append(br); }
      }
      if (done && r) row.append(el("p", { class: "rt", text: r.paper ? "复述：写在纸上交给老师" : "复述：" + r.text }));
      wrap.append(row);
      if (!done) open = false;
    });
    var all = doneCount(id) === b.segs.length, f = S.final[id];
    var fin = el("section", { class: "card seg final" + (all ? "" : " lock") });
    fin.innerHTML = '<h3><b>全书测验</b> ' + b.finalDraw + ' 题，对 ' + b.finalPass + ' 题算过</h3><p class="st">' + (f && f.pass ? "已过 ✓（" + f.best + " / " + b.finalDraw + "）" : all ? (f && f.tries ? "还没过（已测 " + f.tries + " 次）" : "七段都读完了，可以做全书测验") : "七段都读完才能做") + '</p>';
    if (all && !(f && f.pass)) { var bf = el("button", { class: "btn", type: "button", text: "做全书测验" }); bf.addEventListener("click", function () { showTest(id, "f"); }); fin.append(bf); }
    wrap.append(fin);
    view(wrap);
  }

  /* ---------- 测验 ---------- */
  function showTest(id, n) {
    var b = book(id), isF = n === "f", k = isF ? null : sk(id, n), t = isF ? (S.final[id] || {}) : (S.tests[k] || { tries: [] });
    var last = isF ? t.lastFail : (t.tries.length ? t.tries[t.tries.length - 1] : null);
    var lastFailT = isF ? t.lastFail : (last && !last.pass ? last.t : 0);
    if (lastFailT && Date.now() - lastFailT < COOL) { var mins = Math.ceil((COOL - (Date.now() - lastFailT)) / 60000); alert0("上次没过。回书里再读一读这一段，" + mins + " 分钟后再来测。", function () { showBook(id); }); return; }
    var pool = [];
    if (isF) { b.segs.forEach(function (s) { s.q.forEach(function (q, i) { pool.push({ s: s.n, i: i, q: q }); }); }); }
    else book(id).segs[n - 1].q.forEach(function (q, i) { pool.push({ s: n, i: i, q: q }); });
    var draw = isF ? b.finalDraw : b.draw, need = isF ? b.finalPass : b.pass;
    var picked = isF ? spread(pool, draw, b.segs.length) : shuffle(pool).slice(0, draw);
    var wrap = el("div"), t0 = Date.now();
    var back = el("button", { class: "ghost", type: "button", text: "← 回到分段" }); back.addEventListener("click", function () { showBook(id); });
    wrap.append(back, el("h2", { class: "bt", text: isF ? "《" + b.title + "》全书测验" : "第" + n + "段测验：" + b.segs[n - 1].title }), el("p", { class: "meta", text: "一共 " + draw + " 题，对 " + need + " 题算过。凭你读到的回答，不要翻书。" }));
    var form = el("div");
    picked.forEach(function (p, qi) {
      var opts = shuffle(p.q.o.map(function (o, i) { return i; }));
      var box = el("fieldset", { class: "card q" }, [el("legend", { text: (qi + 1) + ". " + p.q.q })]);
      opts.forEach(function (oi) { var id2 = "q" + qi + "o" + oi; box.append(el("label", { class: "opt" }, [el("input", { type: "radio", name: "q" + qi, value: oi, id: id2 }), el("span", { text: p.q.o[oi] })])); });
      form.append(box);
    });
    var go = el("button", { class: "btn", type: "button", text: "交卷" }), msg = el("p", { class: "msg" });
    go.addEventListener("click", function () {
      var ans = picked.map(function (p, qi) { var c = form.querySelector('input[name="q' + qi + '"]:checked'); return c ? +c.value : -1; });
      var miss = ans.indexOf(-1); if (miss >= 0) { msg.textContent = "第 " + (miss + 1) + " 题还没选。"; return; }
      var score = 0; ans.forEach(function (a, i) { if (a === picked[i].q.a) score++; });
      var pass = score >= need, now = Date.now();
      if (isF) { var f = S.final[id] || { tries: 0, best: 0 }; f.tries = (f.tries || 0) + 1; f.best = Math.max(f.best || 0, score); f.last = now; if (pass) { f.pass = true; f.t = now; S.passes.push({ b: id, s: "f", t: now }); } else f.lastFail = now; S.final[id] = f; }
      else { var tt = S.tests[k] || { tries: [] }; tt.tries.push({ t: now, score: score, of: draw, ms: now - t0, qs: picked.map(function (p) { return p.i; }), ans: ans, pass: pass }); if (pass) tt.pass = true; S.tests[k] = tt; }
      save();
      showResult(id, n, picked, ans, score, draw, pass);
    });
    wrap.append(form, go, msg);
    view(wrap);
  }
  /* 全书测验：每段尽量平均抽 */
  function spread(pool, n, segs) { var by = {}; pool.forEach(function (p) { (by[p.s] = by[p.s] || []).push(p); }); var out = []; for (var s in by) by[s] = shuffle(by[s]); var i = 0; while (out.length < n) { var any = false; for (var s2 = 1; s2 <= segs && out.length < n; s2++) { if (by[s2] && by[s2][i]) { out.push(by[s2][i]); any = true; } } if (!any) break; i++; } return shuffle(out); }
  function showResult(id, n, picked, ans, score, draw, pass) {
    var isF = n === "f", wrap = el("div");
    wrap.append(el("h2", { class: "bt", text: (pass ? "过了！" : "还没过") + "　" + score + " / " + draw }));
    if (pass) {
      wrap.append(el("p", { class: "meta", text: isF ? "全书读完了，祝贺你。" : "下一步：写复述。" }));
      picked.forEach(function (p, i) { var ok = ans[i] === p.q.a; wrap.append(el("div", { class: "card r " + (ok ? "ok" : "no") }, [el("p", { text: (i + 1) + ". " + p.q.q }), el("p", { class: "meta", text: (ok ? "✓ " : "✗ 正确答案：") + (ok ? "" : p.q.o[p.q.a]) + "　" + p.q.why })])); });
      var go = el("button", { class: "btn", type: "button", text: isF ? "回到这本书" : "写复述" }); go.addEventListener("click", function () { isF ? showBook(id) : showRetell(id, n); }); wrap.append(go);
    } else {
      wrap.append(el("p", { class: "meta", text: "错了哪几题，下面标出来了（不给答案）。回书里把这一段再读一读，10 分钟后可以再测，再测会换题。" }));
      picked.forEach(function (p, i) { var ok = ans[i] === p.q.a; wrap.append(el("div", { class: "card r " + (ok ? "ok" : "no") }, [el("p", { text: (ok ? "✓ " : "✗ ") + (i + 1) + ". " + p.q.q })])); });
      var bk = el("button", { class: "btn", type: "button", text: "回到分段" }); bk.addEventListener("click", function () { showBook(id); }); wrap.append(bk);
    }
    view(wrap);
  }
  function alert0(text, then) { var w = el("div", { class: "card" }, [el("p", { text: text })]); var b = el("button", { class: "btn", type: "button", text: "好" }); b.addEventListener("click", then); w.append(b); view(w); }

  /* ---------- 复述（不能粘贴，60—100 字，至少写到 2 个细节） ---------- */
  function showRetell(id, n) {
    var b = book(id), s = b.segs[n - 1], k = sk(id, n), old = S.retell[k] || {};
    var wrap = el("div"), back = el("button", { class: "ghost", type: "button", text: "← 回到分段" }); back.addEventListener("click", function () { showBook(id); });
    var ta = el("textarea", { rows: 5, placeholder: "用自己的话写，60—100 字。不能粘贴，也不要用 AI。", autocomplete: "off", spellcheck: "false" }); ta.value = old.draft || "";
    var cnt = el("span", { class: "cnt" }), msg = el("p", { class: "msg" }), first = 0, typed = 0, jumps = 0, lastLen = count(ta.value);
    function upd() { var c = count(ta.value); cnt.textContent = c + " 字"; cnt.className = "cnt" + (c < 60 || c > 100 ? " bad" : ""); }
    ["paste", "drop"].forEach(function (ev) { ta.addEventListener(ev, function (e) { e.preventDefault(); msg.textContent = "这里不能粘贴，请自己一个字一个字写。"; }); });
    ta.addEventListener("beforeinput", function (e) { if (/insertFromPaste|insertFromDrop/.test(e.inputType || "")) { e.preventDefault(); msg.textContent = "这里不能粘贴，请自己一个字一个字写。"; } });
    ta.addEventListener("input", function () { if (!first) first = Date.now(); typed++; var c = count(ta.value); if (c - lastLen > 20) jumps++; lastLen = c; upd(); old.draft = ta.value; S.retell[k] = old; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} });
    var paper = el("input", { type: "checkbox", id: "ydPaper" });
    var go = el("button", { class: "btn", type: "button", text: "交复述" });
    go.addEventListener("click", function () {
      var now = Date.now();
      if (paper.checked) { S.retell[k] = { paper: true, t: now }; finish(); return; }
      var txt = ta.value.trim(), c = count(txt);
      if (c < 60) { msg.textContent = "还不到 60 字。再写一两件具体的事。"; return; }
      if (c > 100) { msg.textContent = "超过 100 字了。挑最重要的，删去一些。"; return; }
      var hits = s.retell.keys.filter(function (w) { return txt.indexOf(w) >= 0; });
      if (hits.length < 2) { msg.textContent = "再具体一点：写出书里的人做了什么、用了什么、看见了什么（比如一样东西、一个动作）。"; return; }
      S.retell[k] = { text: txt, t: now, ms: first ? now - first : 0, n: c, hits: hits.length, jumps: jumps };
      finish();
    });
    function finish() { S.passes = S.passes.filter(function (p) { return !(p.b === id && p.s === n); }); S.passes.push({ b: id, s: n, t: Date.now() }); save(); alert0("第" + n + "段完成了！" + (n < b.segs.length ? "接着读第" + (n + 1) + "段：" + b.segs[n].title + "。" : "七段都读完了，可以做全书测验。"), function () { showBook(id); }); }
    wrap.append(back, el("h2", { class: "bt", text: "第" + n + "段复述" }), el("p", { class: "prompt", text: s.retell.q }), ta, el("div", { class: "row" }, [cnt]), el("label", { class: "note row" }, [paper, el("span", { text: " 我写在纸上，交给老师（勾了就不用在这里写）" })]), go, msg);
    view(wrap); upd(); ta.focus();
  }

  /* ---------- 全班进度 ---------- */
  function showBoard() {
    var wrap = el("div", {}, [tabs("board"), el("p", { class: "meta", text: "正在读取全班进度……" })]);
    view(wrap);
    api("board", cred()).then(function (j) { paintBoard(wrap, j.rows || []); }).catch(function () { wrap.lastChild.textContent = "暂时读不到全班进度，稍后再试。"; });
  }
  function paintBoard(wrap, rows) {
    var week = Date.now() - 7 * 864e5, openB = BOOKS.filter(function (b) { return b.open; });
    rows.forEach(function (r) { var ps = (r.passes || []).filter(function (p) { return p.s !== "f"; }); r.total = ps.length; r.week = ps.filter(function (p) { return p.t >= week; }).length; r.byBook = {}; openB.forEach(function (b) { r.byBook[b.id] = ps.filter(function (p) { return p.b === b.id; }).length; }); r.fin = (r.passes || []).filter(function (p) { return p.s === "f"; }).length; });
    rows.sort(function (a, b) { return b.total - a.total || b.week - a.week || String(a.name).localeCompare(String(b.name)); });
    var maxT = Math.max.apply(null, [0].concat(rows.map(function (r) { return r.total; }))), maxW = Math.max.apply(null, [0].concat(rows.map(function (r) { return r.week; })));
    var kings = rows.filter(function (r) { return maxT > 0 && r.total === maxT; }).map(function (r) { return r.name; });
    var stars = rows.filter(function (r) { return maxW > 0 && r.week === maxW; }).map(function (r) { return r.name; });
    wrap.lastChild.remove();
    wrap.append(el("div", { class: "honor" }, [
      el("div", { class: "card hon" }, [el("b", { text: "阅读王" }), el("span", { text: kings.length ? kings.join("、") : "还没有人" }), el("small", { text: maxT ? "读完 " + maxT + " 段" : "读完一段就上榜" })]),
      el("div", { class: "card hon" }, [el("b", { text: "阅读新星" }), el("span", { text: stars.length ? stars.join("、") : "还没有人" }), el("small", { text: maxW ? "最近 7 天读完 " + maxW + " 段" : "最近 7 天读得最多的人" })])
    ]));
    var tb = el("table", { class: "brd" }), head = "<tr><th>同学</th>" + openB.map(function (b) { return "<th>《" + esc(b.title) + "》</th>"; }).join("") + "<th>7 天</th></tr>";
    tb.innerHTML = head + rows.map(function (r) { return "<tr" + (r.me ? ' class="me"' : "") + "><td>" + esc(r.name) + "</td>" + openB.map(function (b) { var d = r.byBook[b.id] || 0, n = b.segs.length, dots = ""; for (var i = 0; i < n; i++) dots += i < d ? "●" : "○"; return '<td class="dots">' + dots + (r.fin ? " ✓" : "") + "</td>"; }).join("") + "<td>" + (r.week || "") + "</td></tr>"; }).join("");
    wrap.append(tb, el("p", { class: "note", text: "● 是读完的段（测验过了，也交了复述）。同分的一起上榜。" }));
  }

  /* ---------- 老师 ---------- */
  function teacherLogin() {
    var saved = null; try { saved = sessionStorage.getItem("hora-tpw"); } catch (e) {}
    var w = el("div", { class: "card" }), pw = el("input", { type: "password", placeholder: "老师密码", autocomplete: "off" }), go = el("button", { class: "btn", type: "button", text: "进入" }), msg = el("p", { class: "msg" });
    function tryIt(p) { msg.textContent = "正在核对……"; api("t_all", { pw: p }).then(function (j) { tpw = p; try { sessionStorage.setItem("hora-tpw", p); } catch (e) {} teacherView(j.rows || []); }).catch(function (e) { msg.textContent = e.code === "pw" ? "密码不对。" : "连不上表格，稍后再试。"; }); }
    go.addEventListener("click", function () { tryIt(pw.value); }); pw.addEventListener("keydown", function (e) { if (e.key === "Enter") tryIt(pw.value); });
    w.append(el("h2", { class: "bt", text: "老师" }), pw, go, msg); view(w);
    if (saved) tryIt(saved);
  }
  function teacherView(rows) {
    $("#ydWho").textContent = "老师";
    var b = BOOKS.filter(function (x) { return x.open; })[0], wrap = el("div");
    var classes = {}; rows.forEach(function (r) { classes[r.cls] = 1; });
    wrap.append(el("h2", { class: "bt", text: "课外阅读 · 老师页：《" + b.title + "》" }), el("p", { class: "meta", text: "每格：测验最好成绩 / 测了几次；✓＝这一段完成（测验过＋复述交了）；纸＝复述交纸质。点名字看复述原文。用时短、字数一下子跳很多的复述，值得当面问问。" }));
    Object.keys(classes).sort().forEach(function (c) {
      var list = rows.filter(function (r) { return r.cls === c; }).sort(function (x, y) { return String(x.name).localeCompare(String(y.name)); });
      var tb = el("table", { class: "brd t" }); var h = "<tr><th>" + esc(c) + "</th>"; b.segs.forEach(function (s) { h += "<th>" + s.n + "</th>"; }); h += "<th>全书</th></tr>";
      tb.innerHTML = h + list.map(function (r, ri) { var p = Object.assign(blank(), r.payload || {}); return "<tr><td><a href='#' data-r='" + esc(c) + "|" + ri + "'>" + esc(r.name) + "</a></td>" + b.segs.map(function (s) { var t = p.tests[sk(b.id, s.n)], rt = p.retell[sk(b.id, s.n)]; if (!t) return "<td></td>"; var best = Math.max.apply(null, [0].concat((t.tries || []).map(function (x) { return x.score; }))); var done = t.pass && rt && (rt.text || rt.paper); return "<td class='" + (done ? "ok" : t.pass ? "half" : "no") + "'>" + best + "/" + (t.tries || []).length + (done ? (rt.paper ? " 纸" : " ✓") : "") + "</td>"; }).join("") + "<td>" + (p.final[b.id] ? (p.final[b.id].pass ? "✓ " : "") + (p.final[b.id].best || 0) + "/" + b.finalDraw : "") + "</td></tr>"; }).join("");
      tb.addEventListener("click", function (e) { var a = e.target.closest("a[data-r]"); if (!a) return; e.preventDefault(); var ri = +a.getAttribute("data-r").split("|")[1]; detail(list[ri], b); });
      wrap.append(tb);
    });
    if (!rows.length) wrap.append(el("p", { class: "note", text: "还没有同学打开过课外阅读。" }));
    var ref = el("button", { class: "ghost", type: "button", text: "刷新" }); ref.addEventListener("click", function () { api("t_all", { pw: tpw }).then(function (j) { teacherView(j.rows || []); }); });
    wrap.append(ref); view(wrap);
  }
  function detail(r, b) {
    var p = Object.assign(blank(), r.payload || {}), w = el("div"), back = el("button", { class: "ghost", type: "button", text: "← 全班" });
    back.addEventListener("click", function () { api("t_all", { pw: tpw }).then(function (j) { teacherView(j.rows || []); }); });
    w.append(back, el("h2", { class: "bt", text: r.cls + " · " + r.name }));
    b.segs.forEach(function (s) {
      var t = p.tests[sk(b.id, s.n)], rt = p.retell[sk(b.id, s.n)]; if (!t && !rt) return;
      var c = el("section", { class: "card seg" });
      c.innerHTML = "<h3><b>第" + s.n + "段</b> " + esc(s.title) + "</h3><p class='meta'>测验：" + ((t && t.tries) || []).map(function (x) { return x.score + "/" + x.of + "（" + fmt(x.t) + "，用了 " + Math.round(x.ms / 1000) + " 秒）"; }).join("；") + "</p>" +
        (rt ? (rt.paper ? "<p class='rt'>复述：交纸质（" + fmt(rt.t) + "）</p>" : rt.text ? "<p class='rt'>" + esc(rt.text) + "</p><p class='meta'>" + rt.n + " 字 · 打字用时 " + Math.round((rt.ms || 0) / 60000 * 10) / 10 + " 分钟 · 写到 " + rt.hits + " 个细节" + (rt.jumps ? " · <b class='warn'>字数突然跳多 " + rt.jumps + " 次</b>" : "") + " · " + fmt(rt.t) + "</p>" : "<p class='meta'>复述还没交</p>") : "<p class='meta'>复述还没交</p>");
      w.append(c);
    });
    view(w);
  }

  document.addEventListener("DOMContentLoaded", start);
})();
