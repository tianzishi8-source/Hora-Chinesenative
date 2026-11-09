/* 课堂版（课后单机）· 老师看全班作答：yueyanglou-ke/app.js 和 ke/app.js 共用。
 * 版面照 G8《日历》老师看板：分页签 全班一览 / 按题看 / 每个学生 / 课后小结。
 * 老师从首页“我是老师”进课堂版（地址带 #teacher）：可以预览各板块（不存档）；顶栏“全班作答”进这一页。
 * 数据：表格 t_all（老师密码，存 sessionStorage hora-tpw，和自学版共用），每人一行 payload（就是学生端的存档 S）。
 * 用法：YK_TEACHER({ el, api, title, story, words, tests, text, order, pname, summary, esc, stamp, dur }) */
(function () {
"use strict";
window.YK_TEACHER = function (o) {
  var esc = o.esc, stamp = o.stamp, dur = o.dur, el = o.el, ROWS = null, CLS = "", err = "", TAB = "class", FOCUS = "", QF = "", loading = false;
  var STORY = o.story || [], WORDS = o.words || [], TESTS = o.tests || [], TEXT = o.text || null, SENTS = o.sents || [];
  var TP = SENTS.length ? ORDER0().filter(function (p) { return SENTS.some(function (x) { return "p" + x.p === p; }); }) : [];
  function ORDER0() { return o.order || (o.text && o.text.order) || ["p1", "p2", "p3", "p4", "p5"]; }
  function transOf(d, p) { var t = (d.trans || {})[p] || {}, sf = t.self || {}, ks = SENTS.filter(function (x) { return "p" + x.p === p; }); return { best: t.best, n: ks.length, seen: ks.filter(function (x) { return sf[x.id] != null; }).length, ok: ks.filter(function (x) { return sf[x.id] === 1; }).length, no: ks.filter(function (x) { return sf[x.id] === 0; }).length }; }
  var ORDER = o.order || (TEXT && TEXT.order) || ["p1", "p2", "p3", "p4", "p5"], PN = o.pname || {};
  var NUM = ["〇", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
  var RP = ORDER.concat(["all"]);
  css();

  function pw() { try { return sessionStorage.getItem("hora-tpw") || ""; } catch (e) { return ""; } }
  function load(p) {
    loading = true; if (ROWS) paint(); else el.innerHTML = '<p class="loading">正在读全班的作答……</p>';
    o.api("t_all", { pw: p }).then(function (j) {
      try { sessionStorage.setItem("hora-tpw", p); } catch (e) {}
      loading = false;
      ROWS = (j.rows || []).map(function (r) { var d = r.payload || {}; d._sid = r.sid; d.name = d.name || r.name; d.cls = d.cls || r.cls; return d; })
        .sort(function (a, b) { return String(a.cls || "").localeCompare(String(b.cls || "")) || String(a.name).localeCompare(String(b.name), "zh"); });
      loadAccts(p); paint();
    }).catch(function (e) {
      loading = false;
      if (e && e.code === "pw") { try { sessionStorage.removeItem("hora-tpw"); } catch (x) {} err = "老师密码不对。"; ROWS = null; return ask(); }
      err = "没连上表格，稍后再试。"; if (ROWS) paint(); else ask();
    });
  }
  /* 账号：这个年级所有学生（没打开过课堂版的也列出来）。来源：表格“名单”（t_roster，新版脚本才有），
     再加上本年级其他课文（自学版、别的课堂版）里出现过的账号。 */
  var ACCTS = [], acctT = null, acctAsked = false;
  function akey(c, n) { return String(c || "").replace(/\s+/g, "").toUpperCase() + "|" + String(n || "").replace(/\s+/g, " ").trim(); }
  function gradeOf(c) { var m = /(?:G|GRADE|Y)(\d{1,2})/i.exec(c || "") || /^(\d{1,2})/.exec(c || ""); return m ? +m[1] : 0; }
  function addAcct(c, n) {
    if (!n || (o.grade && gradeOf(c) !== o.grade)) return;
    var k = akey(c, n); if (ACCTS.some(function (a) { return a.k === k; })) return;
    ACCTS.push({ k: k, cls: String(c || "").replace(/\s+/g, "").toUpperCase(), name: String(n).trim() });
    clearTimeout(acctT); acctT = setTimeout(function () { if (ROWS) paint(); }, 300);
  }
  function loadAccts(p) {
    if (acctAsked) return; acctAsked = true;
    var RN = window.HORA_ROSTER_NAMES || {}; Object.keys(RN).forEach(function (c) { (RN[c] || []).forEach(function (n) { addAcct(c, n); }); });
    o.api("t_roster", { pw: p }).then(function (j) { (j.rows || []).forEach(function (r) { addAcct(r.cls, r.name); }); }).catch(function () {});
    (o.otherLessons || []).forEach(function (lid) { o.api("t_all", { pw: p, lesson: lid }).then(function (j) { (j.rows || []).forEach(function (r) { addAcct(r.cls, r.name); }); }).catch(function () {}); });
  }
  function ask() {
    el.innerHTML = '<div class="card tq-login"><h2>学生作答</h2><p class="note">输入老师密码（和自学版老师页的一样）。只有知道老师密码的人看得到这里，学生之间互相看不到。</p>' +
      '<input id="tqPw" type="password" autocomplete="off" placeholder="老师密码"><button class="btn" id="tqGo" type="button">查看</button><p class="tq-err">' + esc(err) + "</p></div>";
    err = "";
    var i = el.querySelector("#tqPw"), go = function () { if (i.value) load(i.value); };
    el.querySelector("#tqGo").onclick = go; i.onkeydown = function (e) { if (e.key === "Enter") go(); }; i.focus();
  }

  /* ---------- 算分的小工具 ---------- */
  function lv(ok, g) { if (!g) return ""; var p = ok / g; return p >= .8 ? "lv-good" : p >= .5 ? "lv-mid" : "lv-low"; }
  function lvS(s) { return s == null ? "" : lv(s, 100); }
  function rightOf(it) { return it.type === "choice" ? (it.opts || [])[it.ans] : it.type === "fill" ? [].concat(it.ans).join(" / ") : it.model || ""; }
  function strip(s) { return String(s || "").replace(/【|】/g, ""); }
  function sent(p, i) { return TEXT && TEXT.paras && TEXT.paras[p] ? TEXT.paras[p][i] || "" : ""; }
  function pname(p) { return p === "all" ? "全文" : PN[p] || (TEXT && TEXT.pname && TEXT.pname[p]) || p; }
  function chN(ci) { return "第" + (NUM[ci + 1] || ci + 1) + "章"; }
  function isOk(it, a) { return a && a.got >= (it.pts || 1) - 0.001; }
  function testLast(d, t) { var x = (d.tests || {})[t.id]; return x && x.last ? x : null; }
  function writesOf(d, c) { var s = (d.story || {})[c.id], out = []; if (s && s.writes) Object.keys(s.writes).forEach(function (k) { var w = s.writes[k]; if (w && w.text) out.push(w); }); return out; }
  function mastered(d) { var c = d.cards || {}; return Object.keys(c).filter(function (k) { return c[k].box >= 2; }).length; }
  function reciteMiss(d) {   // 背诵练一练里没接上 / 没默出的句子：{p-i: 次数}
    var m = {};
    (d.drills || []).forEach(function (r) { if (r.kind !== "recite") return; (r.wrong || []).forEach(function (ref) {
      var x = /^(\w+?)-(\d+)-(chain|fill)$/.exec(ref); if (!x) return; var k = x[1] + "-" + (+x[2] + (x[3] === "chain" ? 1 : 0)); m[k] = (m[k] || 0) + 1; }); });
    return m;
  }
  function wordWrong(d) { var m = {}; Object.keys(d.cards || {}).forEach(function (k) { if (d.cards[k].wrong) m[k] = d.cards[k].wrong; }); (d.drills || []).forEach(function (r) { if (r.kind === "words") (r.wrong || []).forEach(function (id) { m[id] = (m[id] || 0) + 1; }); }); return m; }
  /* 一个学生的总体：测验每道客观题答对率（最近一次）＋背诵最高分＋字词掌握，各算一份，取平均 */
  function tot(d) {
    var g = 0, ok = 0, parts = [];
    TESTS.forEach(function (t) { var x = testLast(d, t); if (!x) return; (t.items || []).forEach(function (it) { if (it.type === "short") return; var a = (x.last.ans || {})[it.id]; if (!a) return; g++; if (isOk(it, a)) ok++; }); });
    if (g) parts.push(ok / g);
    var rs = RP.map(function (p) { var r = (d.recite || {})[p]; return r && r.best != null ? r.best / 100 : null; }).filter(function (v) { return v != null; });
    if (rs.length) parts.push(rs.reduce(function (a, b) { return a + b; }, 0) / rs.length);
    var seen = Object.keys(d.cards || {}).length; if (seen) parts.push(mastered(d) / seen);
    var tb = TP.map(function (p) { return transOf(d, p).best; }).filter(function (v) { return v != null; }); if (tb.length) parts.push(tb.reduce(function (a, b) { return a + b; }, 0) / tb.length / 100);
    return { g: g, ok: ok, p: parts.length ? parts.reduce(function (a, b) { return a + b; }, 0) / parts.length : null };
  }
  function lvT(d) { var t = tot(d); return t.p == null ? "" : lv(t.p, 1); }

  /* ---------- 骨架 ---------- */
  function rows() {
    var have = {}, out = ROWS.slice();
    ROWS.forEach(function (r) { have[akey(r.cls, r.name)] = 1; });
    ACCTS.forEach(function (a) { if (!have[a.k]) out.push({ name: a.name, cls: a.cls, _sid: "acct:" + a.k, _empty: true }); });
    return out.filter(function (r) { return !CLS || r.cls === CLS; })
      .sort(function (a, b) { return String(a.cls || "").localeCompare(String(b.cls || "")) || String(a.name).localeCompare(String(b.name), "zh"); });
  }
  function NAME(d) { return (d.name || "未写名字") + (CLS || !d.cls ? "" : "（" + d.cls + "）"); }
  function paint() {
    var R = rows(), all = R, cls = all.map(function (r) { return r.cls; }).filter(function (c, i, a) { return c && a.indexOf(c) === i; }).sort();
    var h = '<div class="teach"><h3 class="tq-h">学生作答 · ' + esc(o.title) + '</h3><p class="note" style="margin:0">只有知道老师密码的人看得到这里，学生之间互相看不到。按账号列出 ' + R.length + " 人" + (R.filter(function (d) { return d._empty; }).length ? "，其中 " + R.filter(function (d) { return d._empty; }).length + " 人还没打开课堂版" : "") + "。</p>" +
      '<div class="tabs">' + [["class", "全班一览"], ["q", "按题看"], ["each", "每个学生"], ["write", "写的话"], ["sum", "课后小结"]].map(function (t) { return '<button type="button" data-tab="' + t[0] + '" aria-pressed="' + (TAB === t[0]) + '">' + t[1] + "</button>"; }).join("") + "</div>" +
      '<div class="row"><button class="ghost" type="button" id="tqRe">' + (loading ? "正在读表格…" : "刷新") + "</button>" +
      (cls.length > 1 ? '<select id="tqCls" aria-label="只看一个班"><option value="">全部班级</option>' + cls.map(function (c) { return "<option" + (c === CLS ? " selected" : "") + ">" + esc(c) + "</option>"; }).join("") + "</select>" : "") + "</div>" +
      (err ? '<p class="banner">' + esc(err) + "</p>" : "") + '<div class="tlist">';
    err = "";
    if (!R.length) h += '<p class="note">还没有学生的作答。学生从首页选“课堂版”开始做，点“刷新”就会出现。</p>';
    else h += TAB === "q" ? tabQ(R) : TAB === "each" ? tabEach(R) : TAB === "write" ? tabWrite(R) : TAB === "sum" ? tabSum(R) : tabClass(R);
    el.innerHTML = h + "</div></div>";
    wire();
  }
  function wire() {
    [].forEach.call(el.querySelectorAll("[data-tab]"), function (b) { b.onclick = function () { TAB = b.getAttribute("data-tab"); paint(); }; });
    var s = el.querySelector("#tqCls"); if (s) s.onchange = function () { CLS = s.value; paint(); };
    el.querySelector("#tqRe").onclick = function () { load(pw()); };
    [].forEach.call(el.querySelectorAll("[data-stu]"), function (b) { b.onclick = function () { TAB = "each"; FOCUS = b.getAttribute("data-stu"); paint(); scrollTo(0, 0); }; });
    [].forEach.call(el.querySelectorAll("[data-qf]"), function (b) { b.onclick = function () { TAB = "q"; QF = b.getAttribute("data-qf"); paint(); scrollTo(0, 0); }; });
    var q = el.querySelector("#tqQf"); if (q) q.onchange = function () { QF = q.value; paint(); };
    [].forEach.call(el.querySelectorAll("[data-copy]"), function (b) { b.onclick = function () { copy(b, COPY[b.getAttribute("data-copy")]); }; });
  }

  /* ---------- 全班一览 ---------- */
  function tabClass(R) {
    var h = '<p class="note">每格：沉浸体验 ✓ 读完这一章、“半”读到一半，下面是写了几段；翻译是“翻译练一练”最高分，下面是逐句自评“说对了”几句；背诵、测验是最高分（测验是最近一次，下面小字是最高）；字词是掌握几张 / 练过几张。颜色：绿 八成以上，黄 一半以上，红 不到一半。点名字看这个学生的全部作答。</p>';
    h += '<div class="tgridw"><table class="tgrid"><tr><th>学生</th>' +
      STORY.map(function (c, i) { return '<th title="' + esc(c.title) + '"><span>' + chN(i) + "</span><small>" + esc(c.title) + "</small></th>"; }).join("") +
      TP.map(function (p) { return "<th><span>翻译</span><small>" + esc(pname(p)) + "</small></th>"; }).join("") +
      RP.map(function (p) { return "<th><span>背诵</span><small>" + esc(pname(p)) + "</small></th>"; }).join("") +
      (WORDS.length ? "<th><span>字词</span><small>掌握 / 练过</small></th>" : "") +
      TESTS.map(function (t) { return '<th title="' + esc(t.title) + '"><span>' + esc(t.title.replace("模拟", "")) + "</span><small>" + esc(t.blurb ? "第" + (t.after || "") + "节后" : "") + "</small></th>"; }).join("") +
      "<th>总计</th><th>最近</th></tr>";
    R.forEach(function (d) {
      h += '<tr' + (d._empty ? ' class="tempty"' : "") + '><td><button type="button" class="tname" data-stu="' + esc(d._sid) + '">' + esc(NAME(d)) + "</button>" + (d._empty ? "<small>还没打开课堂版</small>" : "") + "</td>";
      STORY.forEach(function (c) { var s = (d.story || {})[c.id], w = writesOf(d, c).length; h += '<td class="tc' + (s && s.done ? " done" : s ? " part" : "") + '">' + (s ? "<b>" + (s.done ? "✓" : "半") + "</b>" + (w ? "<small>写 " + w + " 段</small>" : "") : "") + "</td>"; });
      TP.forEach(function (p) { var t = transOf(d, p); h += t.seen || t.best != null ? '<td class="tc ' + (t.best != null ? lvS(t.best) : lv(t.ok, t.n)) + '"><b>' + (t.best != null ? t.best : "—") + "</b><small>说对 " + t.ok + "/" + t.n + "</small></td>" : '<td class="tc"></td>'; });
      RP.map(function (p) { var r = (d.recite || {})[p]; h += r && r.best != null ? '<td class="tc ' + lvS(r.best) + '"><b>' + r.best + "</b></td>" : '<td class="tc"></td>'; });
      if (WORDS.length) { var seen = Object.keys(d.cards || {}).length, m = mastered(d); h += '<td class="tc ' + lv(m, seen) + '">' + (seen ? "<b>" + m + " / " + seen + "</b><small>共 " + WORDS.length + " 张</small>" : "") + "</td>"; }
      TESTS.forEach(function (t) { var x = testLast(d, t); h += x ? '<td class="tc ' + lvS(x.last.score) + '"><b>' + x.last.score + "</b><small>最高 " + x.best + (x.tries > 1 ? " · " + x.tries + "次" : "") + "</small></td>" : '<td class="tc"></td>'; });
      var T = tot(d);
      h += '<td class="tc ' + lvT(d) + '"><b>' + (T.p == null ? "—" : Math.round(T.p * 100) + "%") + "</b>" + (T.g ? "<small>测验对 " + T.ok + "/" + T.g + "</small>" : "") + '</td><td class="tc small">' + esc(stamp(d.savedAt)) + "</td></tr>";
    });
    // 全班
    h += '<tr class="tfoot"><td>全班</td>';
    STORY.forEach(function (c) { var n = R.filter(function (d) { var s = (d.story || {})[c.id]; return s && s.done; }).length; h += '<td class="tc"><b>' + n + "人读完</b></td>"; });
    TP.forEach(function (p) { var v = R.map(function (d) { return transOf(d, p).best; }).filter(function (x) { return x != null; }), sn = R.filter(function (d) { return transOf(d, p).seen; }).length, a = v.length ? Math.round(v.reduce(function (x, y) { return x + y; }, 0) / v.length) : null;
      h += '<td class="tc ' + lvS(a) + '">' + (sn || v.length ? "<b>" + (a != null ? "平均 " + a : "—") + "</b><small>" + sn + " 人过过</small>" : "") + "</td>"; });
    RP.forEach(function (p) { var v = R.map(function (d) { var r = (d.recite || {})[p]; return r && r.best != null ? r.best : null; }).filter(function (x) { return x != null; }); var a = v.length ? Math.round(v.reduce(function (x, y) { return x + y; }, 0) / v.length) : null;
      h += '<td class="tc ' + lvS(a) + '">' + (v.length ? "<b>平均 " + a + "</b><small>" + v.length + " 人练过</small>" : "") + "</td>"; });
    if (WORDS.length) { var sm = 0, ss = 0; R.forEach(function (d) { sm += mastered(d); ss += Object.keys(d.cards || {}).length; }); h += '<td class="tc ' + lv(sm, ss) + '">' + (ss ? "<b>掌握 " + Math.round(sm / ss * 100) + "%</b>" : "") + "</td>"; }
    TESTS.forEach(function (t) { var v = R.map(function (d) { var x = testLast(d, t); return x ? x.last.score : null; }).filter(function (x) { return x != null; }); var a = v.length ? Math.round(v.reduce(function (x, y) { return x + y; }, 0) / v.length) : null;
      h += '<td class="tc ' + lvS(a) + '">' + (v.length ? "<b>平均 " + a + "</b><small>" + v.length + " 人做过</small>" : "") + "</td>"; });
    h += "<td></td><td></td></tr></table></div>";
    // 最需要课上讲的
    var hard = qStats(R).filter(function (s) { return s.n >= 2 && s.ok / s.n < .7; }).sort(function (a, b) { return a.ok / a.n - b.ok / b.n; }).slice(0, 6);
    var ww = wordStats(R).filter(function (s) { return s.weak.length >= 2 || s.wrong >= 3; }).slice(0, 6);
    var rm = reciteStats(R).slice(0, 4);
    if (hard.length || ww.length || rm.length) {
      h += '<div class="thard"><h4>最需要课上讲的（答对的人最少）</h4><ol>';
      hard.forEach(function (s) { h += '<li><button type="button" class="tname" data-qf="' + esc(s.t.id) + '">' + esc(s.t.title) + " · 第" + s.no + "题</button>　" + esc(short(strip(s.it.q))) + '<span class="note">　答对 ' + s.ok + "/" + s.n + " 人</span></li>"; });
      ww.forEach(function (s) { h += '<li><button type="button" class="tname" data-qf="words">字词 · ' + esc(s.w.w) + "</button>　" + esc(short(strip(s.w.sent))) + '<span class="note">　' + s.weak.length + " 人还没掌握，全班错过 " + s.wrong + " 次</span></li>"; });
      rm.forEach(function (s) { h += '<li><button type="button" class="tname" data-qf="recite">背诵 · ' + esc(pname(s.p)) + "</button>　" + esc(short(sent(s.p, s.i))) + '<span class="note">　' + s.who.length + " 人接不上 / 默不出</span></li>"; });
      h += "</ol></div>";
    }
    return h;
  }
  function short(s) { s = String(s || ""); return s.length > 34 ? s.slice(0, 34) + "…" : s; }

  /* ---------- 统计 ---------- */
  function qStats(R) {
    var out = [];
    TESTS.forEach(function (t) {
      (t.items || []).forEach(function (it, i) {
        if (it.type === "short") return;
        var n = 0, ok = 0, by = {};
        R.forEach(function (d) { var x = testLast(d, t); if (!x) return; var a = (x.last.ans || {})[it.id]; if (!a) return; n++; if (isOk(it, a)) ok++; else { var k = a.a === "" || a.a == null ? "（没答 / 超时）" : String(a.a); (by[k] = by[k] || []).push(d.name); } });
        out.push({ t: t, it: it, no: i + 1, n: n, ok: ok, by: by });
      });
    });
    return out;
  }
  function wordStats(R) {
    return WORDS.map(function (w) {
      var seen = 0, weak = [], wrong = 0;
      R.forEach(function (d) { var c = (d.cards || {})[w.id], ww = wordWrong(d)[w.id] || 0; wrong += ww; if (!c) return; seen++; if (c.box < 2) weak.push(d.name); });
      return { w: w, seen: seen, weak: weak, wrong: wrong };
    }).filter(function (s) { return s.seen; }).sort(function (a, b) { return b.wrong - a.wrong || b.weak.length - a.weak.length; });
  }
  function reciteStats(R) {
    var m = {};
    R.forEach(function (d) { var x = reciteMiss(d); Object.keys(x).forEach(function (k) { var p = k.split("-"); m[k] = m[k] || { p: p[0], i: +p[1], n: 0, who: [] }; m[k].n += x[k]; m[k].who.push(d.name); }); });
    return Object.keys(m).map(function (k) { return m[k]; }).sort(function (a, b) { return b.who.length - a.who.length || b.n - a.n; });
  }

  /* ---------- 按题看 ---------- */
  function tabQ(R) {
    var opts = [["", "全部"]].concat(TESTS.map(function (t) { return [t.id, t.title]; }), WORDS.length ? [["words", "字词"]] : [], TEXT ? [["recite", "背诵"]] : [], SENTS.length ? [["trans", "逐句翻译"]] : []);
    var h = '<div class="row"><select id="tqQf" aria-label="看哪一部分">' + opts.map(function (x) { return '<option value="' + esc(x[0]) + '"' + (x[0] === QF ? " selected" : "") + ">" + esc(x[1]) + "</option>"; }).join("") + "</select></div>" +
      '<p class="note">每道题：多少人做了、多少人答对、错答了什么（谁答的）；简答题列出每个人的原话，方便比较水平。答对不到一半的题自动展开。测验按每人最近一次统计。</p>';
    var S = qStats(R);
    TESTS.forEach(function (t) {
      if (QF && QF !== t.id) return;
      var did = R.filter(function (d) { return testLast(d, t); }).length;
      h += '<h4 class="tday">' + esc(t.title) + "　<small>" + did + " / " + R.length + " 人做过</small></h4>";
      (t.items || []).forEach(function (it, i) {
        if (it.type === "short") {
          var got = R.map(function (d) { var x = testLast(d, t); return x && (x.last.short || {})[it.id] ? [d, x.last.short[it.id]] : null; }).filter(Boolean);
          var avg = got.length ? Math.round(got.reduce(function (a, g) { return a + g[1].got; }, 0) / got.length * 10) / 10 : 0;
          h += '<details class="tq"><summary><b>第' + (i + 1) + "题（简答）</b><small>做了 " + got.length + "/" + R.length + " 人</small>" + (got.length ? '<span class="pill ' + lv(avg, it.pts) + '">自评平均 ' + avg + "/" + it.pts + "</span>" : "") + "</summary>" +
            '<p class="note">题目：' + esc(strip(it.q)) + "</p>" + (it.model ? '<p class="note">参考要点：' + esc(it.model) + "</p>" : "") +
            '<ul class="tans">' + got.map(function (g) { return "<li><b>" + esc(g[0].name) + "（自评 " + g[1].got + "/" + g[1].pts + "）：</b><span>" + esc(g[1].text || "（没写）") + "</span></li>"; }).join("") + "</ul></details>";
          return;
        }
        var s = S.filter(function (x) { return x.it === it; })[0], ks = Object.keys(s.by).sort(function (a, b) { return s.by[b].length - s.by[a].length; });
        h += '<details class="tq"' + (s.n && s.ok / s.n < .5 ? " open" : "") + "><summary><b>第" + (i + 1) + "题　" + esc(short(strip(it.q))) + "</b><small>做了 " + s.n + "/" + R.length + " 人</small>" +
          '<span class="pill ' + lv(s.ok, s.n) + '">' + (s.n ? "答对 " + s.ok + "/" + s.n : "还没人做") + "</span></summary>" +
          '<p class="note">题目：' + esc(strip(it.q)) + "<br>正确答案：<b>" + esc(rightOf(it)) + "</b></p>" +
          (ks.length ? '<ul class="tmiss">' + ks.map(function (k) { return "<li><b>" + s.by[k].length + " 人 </b><span>答“" + esc(k) + "”：</span><span class=\"who\">" + esc(s.by[k].join("、")) + "</span></li>"; }).join("") + "</ul>"
            : s.n ? '<p class="note">做了的人都答对了。</p>' : "") + "</details>";
      });
    });
    if (WORDS.length && (!QF || QF === "words")) {
      var W = wordStats(R);
      h += '<h4 class="tday">字词卡　<small>按全班错的次数排（字词卡答错＋练一练答错）</small></h4>';
      if (!W.length) h += '<p class="note">还没有人练过字词卡。</p>';
      W.forEach(function (s) {
        h += '<details class="tq"' + (s.weak.length >= 2 ? " open" : "") + "><summary><b>" + esc(s.w.w) + "</b><small>" + esc(short(strip(s.w.sent))) + "　练过 " + s.seen + " 人</small>" +
          '<span class="pill ' + lv(s.seen - s.weak.length, s.seen) + '">掌握 ' + (s.seen - s.weak.length) + "/" + s.seen + "</span></summary>" +
          '<p class="note">例句：' + esc(strip(s.w.sent)) + "<br>意思：<b>" + esc(s.w.ans) + "</b>" + (s.wrong ? "　全班错过 " + s.wrong + " 次" : "") + "</p>" +
          (s.weak.length ? '<ul class="tmiss"><li><b>' + s.weak.length + ' 人 </b><span>还没掌握：</span><span class="who">' + esc(s.weak.join("、")) + "</span></li></ul>" : "") + "</details>";
      });
    }
    if (SENTS.length && (!QF || QF === "trans")) {
      h += '<h4 class="tday">逐句翻译　<small>学生自己先说意思、再看译文后的自评；“练一练错”是翻译练一练里这句做错的次数</small></h4>';
      var dw = {}; R.forEach(function (d) { (d.drills || []).forEach(function (r) { if (r.kind === "trans") (r.wrong || []).forEach(function (ref) { var id = ref.replace(/-(ch|fill)$/, ""); (dw[id] = dw[id] || []).push(d.name); }); }); });
      TP.forEach(function (p) {
        h += '<p class="note" style="margin:8px 0 2px"><b>' + esc(pname(p)) + "</b></p>";
        SENTS.filter(function (x) { return "p" + x.p === p; }).forEach(function (x) {
          var ok = [], half = [], no = [];
          R.forEach(function (d) { var v = (((d.trans || {})[p] || {}).self || {})[x.id]; if (v === 1) ok.push(d.name); else if (v === 0.5) half.push(d.name); else if (v === 0) no.push(d.name); });
          var seen = ok.length + half.length + no.length, wr = dw[x.id] || [];
          h += '<details class="tq"' + (no.length >= 2 || wr.length >= 2 ? " open" : "") + "><summary><b>" + (x.star ? "★ " : "") + esc(x.src) + "</b><small>过过 " + seen + "/" + R.length + " 人" + (wr.length ? "　练一练错 " + wr.length + " 次" : "") + "</small>" +
            (seen ? '<span class="pill ' + lv(ok.length, seen) + '">说对 ' + ok.length + "/" + seen + "</span>" : "") + "</summary>" +
            '<p class="note">译文：' + esc(x.tr) + "</p>" + '<ul class="tmiss">' +
            (no.length ? "<li><b>" + no.length + " 人 </b><span>没说出来：</span><span class=\"who\">" + esc(no.join("、")) + "</span></li>" : "") +
            (half.length ? "<li><b>" + half.length + " 人 </b><span>差一点：</span><span class=\"who\">" + esc(half.join("、")) + "</span></li>" : "") +
            (wr.length ? "<li><b>练一练做错：</b><span class=\"who\">" + esc(wr.join("、")) + "</span></li>" : "") + "</ul></details>";
        });
      });
    }
    if (TEXT && (!QF || QF === "recite")) {
      h += '<h4 class="tday">背诵　<small>每段的最高分；下面是练一练里接不上、默不出的句子</small></h4>';
      RP.forEach(function (p) {
        var did = R.filter(function (d) { return d.recite && d.recite[p] && d.recite[p].best != null; }), no = R.filter(function (d) { return did.indexOf(d) < 0; });
        var avg = did.length ? Math.round(did.reduce(function (a, d) { return a + d.recite[p].best; }, 0) / did.length) : null;
        var low = did.filter(function (d) { return d.recite[p].best < 60; });
        h += '<details class="tq"' + (low.length ? " open" : "") + "><summary><b>" + esc(pname(p)) + "</b><small>练过 " + did.length + "/" + R.length + " 人</small>" + (avg != null ? '<span class="pill ' + lvS(avg) + '">平均 ' + avg + "</span>" : "") + "</summary>" +
          '<ul class="tmiss">' + (did.length ? "<li><b>分数：</b>" + esc(did.map(function (d) { return d.name + " " + d.recite[p].best; }).join("、")) + "</li>" : "") +
          (no.length ? '<li><b>' + no.length + ' 人 </b><span>还没练：</span><span class="who">' + esc(no.map(function (d) { return d.name; }).join("、")) + "</span></li>" : "") + "</ul></details>";
      });
      var RS = reciteStats(R);
      if (RS.length) h += '<div class="thard"><h4>接不上、默不出的句子</h4><ol>' + RS.slice(0, 15).map(function (s) { return "<li>" + esc(sent(s.p, s.i)) + '<span class="note">　' + esc(pname(s.p)) + "　" + s.who.length + " 人：</span><span class=\"who\">" + esc(s.who.join("、")) + "</span></li>"; }).join("") + "</ol></div>";
    }
    return h;
  }

  /* ---------- 每个学生 ---------- */
  function tabEach(R) {
    var idx = 0; R.forEach(function (d, i) { if (d._sid === FOCUS) idx = i; }); var d = R[idx]; FOCUS = d._sid;
    var h = '<div class="tchips">' + R.map(function (x, i) { return '<button type="button" class="tchip ' + lvT(x) + (i === idx ? " on" : "") + '" data-stu="' + esc(x._sid) + '">' + esc(x.name || "未写名字") + "</button>"; }).join("") + "</div>";
    var nav = '<div class="row">' + (idx > 0 ? '<button class="ghost" type="button" data-stu="' + esc(R[idx - 1]._sid) + '">← 上一个</button>' : '<button class="ghost" type="button" disabled>← 上一个</button>') +
      '<b class="tcount">' + (idx + 1) + " / " + R.length + "</b>" +
      (idx < R.length - 1 ? '<button class="ghost" type="button" data-stu="' + esc(R[idx + 1]._sid) + '">下一个 →</button>' : '<button class="ghost" type="button" disabled>下一个 →</button>');
    COPY.one = STUDENT_PROMPT(d.name) + "\n\n" + tText(d);
    h += nav + '<button class="ghost" type="button" data-copy="one">复制这个学生，拿去 Claude 诊断</button></div>';
    if (d._empty) return h + '<div class="tst"><h4>' + esc(NAME(d)) + '</h4><p class="tsum lv-low">这位同学还没打开过课堂版，没有任何记录。</p></div>' + nav + "</div>";
    var T = tot(d);
    h += '<div class="tst"><h4>' + esc(NAME(d)) + "　· 自选上到第 " + esc(d.lessonAt || 1) + " 节　· 最近保存 " + esc(stamp(d.savedAt)) + "</h4>" +
      '<p class="tsum ' + lvT(d) + '">总计 ' + (T.p == null ? "—" : Math.round(T.p * 100) + "%") + (T.g ? "　· 测验客观题答对 " + T.ok + "/" + T.g : "") + (WORDS.length ? "　· 字词掌握 " + mastered(d) + "/" + WORDS.length : "") + "</p><dl>";
    // 沉浸体验
    if (STORY.length) {
      h += '<dt class="tdh">沉浸体验</dt><dd class="tdh">读完 ' + STORY.filter(function (c) { var s = (d.story || {})[c.id]; return s && s.done; }).length + " / " + STORY.length + " 章</dd>";
      STORY.forEach(function (c, i) {
        var s = (d.story || {})[c.id], ws = writesOf(d, c);
        h += "<dt>" + chN(i) + " " + esc(c.title) + "</dt><dd>" + (!s ? '<span class="note">没开始</span>' : s.done ? "✓ 读完" + (s.doneAt ? "（" + esc(stamp(s.doneAt)) + "）" : "") : "读到一半") +
          ws.map(function (w) { return '<span class="tw">' + (w.kind ? "【" + esc(w.kind) + "】" : "") + esc(w.text) + "</span>"; }).join("") + "</dd>";
      });
    }
    // 逐句翻译
    if (TP.length) {
      h += '<dt class="tdh">逐句翻译</dt><dd class="tdh">' + TP.map(function (p) { var t = transOf(d, p); return pname(p) + " " + (t.seen ? "说对 " + t.ok + "/" + t.n : "—") + (t.best != null ? "（练一练 " + t.best + "）" : ""); }).join("　") + "</dd>";
      var nos = SENTS.filter(function (x) { var v = (((d.trans || {})["p" + x.p] || {}).self || {})[x.id]; return v === 0 || v === 0.5; });
      if (nos.length) h += '<dt>没说出来 / 差一点</dt><dd class="bad">' + nos.map(function (x) { return esc(x.src); }).join("\n") + "</dd>";
    }
    // 背诵
    if (TEXT) {
      var rm = reciteMiss(d), rk = Object.keys(rm).sort(function (a, b) { return rm[b] - rm[a]; });
      h += '<dt class="tdh">背诵</dt><dd class="tdh">' + RP.map(function (p) { var r = (d.recite || {})[p]; return pname(p) + " " + (r && r.best != null ? r.best : "—"); }).join("　") + "</dd>";
      if (rk.length) h += "<dt>接不上 / 默不出</dt><dd class=\"bad\">" + rk.slice(0, 8).map(function (k) { var p = k.split("-"); return esc(sent(p[0], +p[1])) + "（" + rm[k] + " 次）"; }).join("\n") + "</dd>";
    }
    // 字词
    if (WORDS.length) {
      var wm = wordWrong(d), wk = Object.keys(wm).sort(function (a, b) { return wm[b] - wm[a]; }), byId = {}; WORDS.forEach(function (w) { byId[w.id] = w; });
      var weak = WORDS.filter(function (w) { var c = (d.cards || {})[w.id]; return c && c.box < 2; });
      h += '<dt class="tdh">字词卡</dt><dd class="tdh">掌握 ' + mastered(d) + " / " + WORDS.length + "，练过 " + Object.keys(d.cards || {}).length + " 张</dd>";
      if (wk.length) h += '<dt>错过的词</dt><dd class="bad">' + wk.filter(function (k) { return byId[k]; }).slice(0, 12).map(function (k) { return esc(byId[k].w) + "（" + esc(byId[k].ans) + "）×" + wm[k]; }).join("　") + "</dd>";
      if (weak.length) h += "<dt>还没掌握</dt><dd>" + esc(weak.map(function (w) { return w.w; }).join("、")) + "</dd>";
    }
    // 练一练
    var dr = d.drills || [];
    if (dr.length) {
      h += '<dt class="tdh">练一练</dt><dd class="tdh">' + dr.length + " 次</dd>";
      dr.slice(-12).reverse().forEach(function (r) { h += "<dt>" + esc(stamp(r.at)) + "</dt><dd>" + (r.kind === "words" ? "字词" : r.kind === "story" ? "沉浸回顾" : r.kind === "trans" ? "翻译 · " + esc(pname(r.scope)) : "背诵 · " + esc(pname(r.scope))) + '　<b class="' + lvS(r.score) + '">' + r.score + " 分</b>　用时 " + esc(dur(r.secs)) + (r.wrong && r.wrong.length ? "　错 " + r.wrong.length + " 题" : "") + "</dd>"; });
    }
    // 测验
    TESTS.forEach(function (t) {
      var x = testLast(d, t);
      h += '<dt class="tdh">' + esc(t.title) + '</dt><dd class="tdh">' + (x ? "最近 " + x.last.score + " 分（" + esc(stamp(x.last.at)) + "，用时 " + esc(dur(x.last.secs)) + "）　最高 " + x.best + "　共 " + x.tries + " 次" : "还没做") + "</dd>";
      if (!x) return;
      (t.items || []).forEach(function (it, i) {
        var lab = "第" + (i + 1) + "题　" + short(strip(it.q));
        if (it.type === "short") { var s = (x.last.short || {})[it.id]; h += "<dt>" + esc(lab) + "</dt><dd><span>" + esc(s ? s.text || "（没写）" : "（没写）") + '</span><small class="tmk">　简答，自评 ' + (s ? s.got + "/" + s.pts : "—") + "</small></dd>"; return; }
        var a = (x.last.ans || {})[it.id], ok = isOk(it, a);
        h += "<dt>" + esc(lab) + '</dt><dd class="' + (ok ? "ok" : "bad") + '"><span>' + esc(a && a.a ? a.a : "（没答）") + '</span><small class="tmk">　' + (ok ? "✓ 对" : "✗ 错　正确：" + esc(rightOf(it))) + "</small></dd>";
      });
    });
    return h + "</dl></div>" + nav + "</div>";
  }

  /* ---------- 写的话 ---------- */
  function tabWrite(R) {
    if (!STORY.length) return '<p class="note">这篇课文没有沉浸体验。</p>';
    var h = '<p class="note">沉浸体验每章最后写的一段话，按章、按题列出每个人的原话，方便比较。</p>';
    STORY.forEach(function (c, ci) {
      var by = {};
      R.forEach(function (d) { var s = (d.story || {})[c.id]; if (!s || !s.writes) return; Object.keys(s.writes).forEach(function (k) { var w = s.writes[k]; if (!w || !w.text) return; var key = w.prompt || k; (by[key] = by[key] || []).push([d, w]); }); });
      var done = R.filter(function (d) { var s = (d.story || {})[c.id]; return s && s.done; }), notYet = R.filter(function (d) { return done.indexOf(d) < 0; });
      h += '<h4 class="tday">' + chN(ci) + "　" + esc(c.title) + "　<small>" + done.length + " / " + R.length + " 人读完</small></h4>";
      if (!Object.keys(by).length) h += '<p class="note">还没有人写。</p>';
      Object.keys(by).forEach(function (k) {
        h += '<details class="tq" open><summary><b>' + esc(short(k)) + "</b><small>写了 " + by[k].length + " 人</small></summary>" + (k.length > 34 ? '<p class="note">' + esc(k) + "</p>" : "") +
          '<ul class="tans">' + by[k].map(function (x) { return "<li><b>" + esc(x[0].name) + (x[1].kind ? "　【" + esc(x[1].kind) + "】" : "") + "　<small>" + esc(stamp(x[1].at)) + "</small></b><span>" + esc(x[1].text) + "</span></li>"; }).join("") + "</ul></details>";
      });
      if (notYet.length && Object.keys(by).length) h += '<p class="note">还没读完这一章：' + esc(notYet.map(function (d) { return d.name; }).join("、")) + "</p>";
    });
    return h;
  }

  /* ---------- 课后小结（复制给 Claude，网页里没有 AI） ---------- */
  var COPY = {};
  function tText(d) {
    var out = ["【学生：" + (d.name || "未写名字") + (d.cls ? "（" + d.cls + "）" : "") + "】自选上到第 " + (d.lessonAt || 1) + " 节"];
    if (STORY.length) STORY.forEach(function (c, i) { var s = (d.story || {})[c.id]; out.push("— 沉浸体验" + chN(i) + "《" + c.title + "》：" + (!s ? "没开始" : s.done ? "读完" : "读到一半")); writesOf(d, c).forEach(function (w) { out.push("［自己写］" + (w.prompt ? "（题目：" + w.prompt + "）" : "") + (w.kind ? "【" + w.kind + "】" : "") + w.text); }); });
    if (TP.length) { out.push("— 逐句翻译（自己先说意思再看译文后的自评）：" + TP.map(function (p) { var t = transOf(d, p); return pname(p) + (t.seen ? " 说对" + t.ok + "/" + t.n : " 没过") + (t.best != null ? "，练一练" + t.best + "分" : ""); }).join("；"));
      var nos2 = SENTS.filter(function (x) { var v = (((d.trans || {})["p" + x.p] || {}).self || {})[x.id]; return v === 0; }); if (nos2.length) out.push("  自评没说出来的句子：" + nos2.map(function (x) { return x.src; }).join(" | ")); }
    if (TEXT) { out.push("— 背诵最高分：" + RP.map(function (p) { var r = (d.recite || {})[p]; return pname(p) + " " + (r && r.best != null ? r.best : "没练"); }).join("，")); var rm = reciteMiss(d); var ks = Object.keys(rm); if (ks.length) out.push("  接不上 / 默不出的句子：" + ks.map(function (k) { var p = k.split("-"); return sent(p[0], +p[1]); }).join(" | ")); }
    if (WORDS.length) { var wm = wordWrong(d), byId = {}; WORDS.forEach(function (w) { byId[w.id] = w; }); out.push("— 字词卡：掌握 " + mastered(d) + "/" + WORDS.length + "，练过 " + Object.keys(d.cards || {}).length + " 张" + (Object.keys(wm).length ? "；错过的词：" + Object.keys(wm).filter(function (k) { return byId[k]; }).map(function (k) { return byId[k].w + "（" + byId[k].ans + "）×" + wm[k]; }).join("、") : "")); }
    TESTS.forEach(function (t) {
      var x = testLast(d, t); if (!x) { out.push("— " + t.title + "：还没做"); return; }
      out.push("— " + t.title + "：最近 " + x.last.score + " 分，最高 " + x.best + "，共 " + x.tries + " 次");
      (t.items || []).forEach(function (it, i) {
        if (it.type === "short") { var s = (x.last.short || {})[it.id]; out.push("［简答·自己写］第" + (i + 1) + "题 " + strip(it.q) + "：" + (s ? (s.text || "（没写）") + "（自评 " + s.got + "/" + s.pts + "）" : "（没写）")); return; }
        var a = (x.last.ans || {})[it.id]; if (isOk(it, a)) return;
        out.push("［客观题·错］第" + (i + 1) + "题 " + strip(it.q) + "：答“" + (a && a.a ? a.a : "没答") + "”，正确“" + rightOf(it) + "”");
      });
    });
    return out.join("\n");
  }
  function STUDENT_PROMPT(nm) { return "你是一位初中语文老师的助手。下面是学生 " + nm + " 在课后单机版（" + o.title + "）上的全部记录：沉浸体验写的话、背诵、字词卡、模拟测验。［客观题·错］只列了答错的题，答对的没列；只有［自己写］和［简答·自己写］是学生自己的文字。\n请写一份只给老师看的个性化诊断，用简洁的中文，不用 Markdown 符号，500 字以内：一、总体水平（字词、翻译、背诵、理解作者情感各怎么样）；二、最突出的优点，引学生原话；三、最需要补的两三点，具体到哪一段、哪个字词、哪道题；四、下节课可以怎样帮他（一两条）。"; }
  function CLASS_PROMPT() { return "你是一位初中语文老师的助手。下面是一个班的学生在课后单机版（" + o.title + "）上的记录，每个学生之间用 ========== 隔开，名字写在每段开头。［客观题·错］只列了答错的题；只有［自己写］和［简答·自己写］是学生自己的文字。\n请先写全班小结（不超过 300 字：大多数已经做到的；普遍的卡点，具体到字词、句子、题目；下节课最值得讲的三件事），再按学生逐个写诊断，每人一段，开头写名字，写：水平（好 / 中 / 需要帮助）和一句理由；最突出的优点；最需要补的一点。用简洁的中文，不用 Markdown 符号。"; }
  function tabSum(R) {
    COPY.all = CLASS_PROMPT() + "\n\n" + R.map(function (d) { return d._empty ? "【学生：" + d.name + "】还没打开过课堂版，没有记录。" : tText(d); }).join("\n==========\n");
    return '<p class="note">这里没有 AI。按下面的按钮，会把全班的记录（带名字，按学生分开）连同诊断要求一起复制好；打开你自己的 Claude，粘贴进去就行。名字只在你自己的对话里出现。只想看一个学生：到“每个学生”里点“复制这个学生”。</p>' +
      '<div class="row"><button class="btn" type="button" data-copy="all">复制：全班小结＋逐人诊断</button></div><div class="sumout note" id="tqOut"></div>';
  }
  function copy(b, txt) {
    var old = b.textContent, out = el.querySelector("#tqOut");
    function done(m) { b.textContent = m; setTimeout(function () { b.textContent = old; }, 2500); if (out) out.textContent = m === "已复制" ? "已复制。打开你自己的 Claude，粘贴进去，发送。" : txt; }
    try { navigator.clipboard.writeText(txt).then(function () { done("已复制"); }, function () { done("复制不了，请手动选中下面的文字"); }); } catch (e) { done("复制不了，请手动选中下面的文字"); }
  }

  function css() {
    if (document.getElementById("tqCss")) return;
    var s = document.createElement("style"); s.id = "tqCss";
    s.textContent = ".teach{--line:rgba(60,45,30,.16);--page2:rgba(255,252,244,.92);--page:#fffdf7;--muted:#7a6f60;max-width:min(1180px,96vw);margin:0 auto}" +
      ".teach .note{color:var(--muted);font-size:.92rem}.teach .row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0}.tq-h{margin:4px 0}" +
      ".teach .ghost{font:inherit;font-size:.9rem;border:1px solid var(--line);border-radius:999px;padding:5px 14px;background:var(--page2);cursor:pointer}.teach .ghost:disabled{opacity:.4;cursor:default}" +
      ".teach select{font:inherit;font-size:.9rem;padding:5px 10px;border-radius:8px;border:1px solid var(--line);background:var(--page)}.teach .banner{background:#f6dcd6;padding:6px 12px;border-radius:8px}" +
      ".tabs{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0 4px}.tabs button{font:inherit;padding:5px 16px;border-radius:999px;border:0;background:var(--page2);font-size:.95rem;cursor:pointer;box-shadow:0 0 0 1px var(--line)}.tabs button[aria-pressed=\"true\"]{background:#2a241b;color:#fffdf7}" +
      ".tlist{display:grid;gap:10px;margin-top:8px}" +
      ".tgridw{overflow-x:auto;-webkit-overflow-scrolling:touch;border:1px solid var(--line);border-radius:10px;background:var(--page)}" +
      ".tgrid{border-collapse:collapse;width:100%;font-size:.86rem}.tgrid th,.tgrid td{border-bottom:1px solid var(--line);padding:6px 6px;text-align:center;vertical-align:middle;white-space:nowrap}" +
      ".tgrid th{position:sticky;top:0;background:#f4eddc;font-weight:700}.tgrid th small{display:block;font-weight:400;color:var(--muted);font-size:.72rem;max-width:7em;overflow:hidden;text-overflow:ellipsis;margin:0 auto}" +
      ".tgrid td:first-child,.tgrid th:first-child{text-align:left;position:sticky;left:0;background:#f4eddc;z-index:1}" +
      ".tname{font:inherit;font-weight:700;border:0;background:none;color:#2a241b;cursor:pointer;padding:0;text-decoration:underline dotted}" +
      ".tc b{display:block;font-size:.95rem}.tc small{display:block;color:var(--muted);font-size:.72rem}.tc.part b{color:var(--muted)}.tc.small{font-size:.78rem;color:var(--muted)}" +
      ".lv-good{background:#e4f1e2}.lv-mid{background:#f7edcf}.lv-low{background:#f6dcd6}.tfoot td{font-weight:700;background:#f4eddc}" +
      ".tq{border:1px solid var(--line);border-radius:10px;padding:8px 12px;background:var(--page2)}.tq summary{cursor:pointer;display:flex;flex-wrap:wrap;gap:6px 12px;align-items:baseline}.tq summary small{color:var(--muted)}" +
      ".pill{font-size:.78rem;font-weight:700;border-radius:999px;padding:2px 9px;margin-left:auto}" +
      ".tmiss,.tans{margin:6px 0 2px;padding-left:1.2em;font-size:.92rem}.tmiss li,.tans li{margin:3px 0;white-space:pre-wrap}.teach .who{color:#a8352a}" +
      ".tq .tans li{border:1px solid var(--line);border-radius:8px;padding:6px 10px;list-style:none;margin:6px 0 6px -1.2em;background:var(--page)}.tq .tans li>b{display:block;margin-bottom:2px}.tq .tans li>b small{font-weight:400;color:var(--muted)}" +
      ".tday{margin:12px 0 0;font-size:1rem;color:#4d473f}.tday small{font-weight:400;color:var(--muted)}" +
      ".thard{border:1px solid var(--line);border-radius:10px;padding:8px 14px;background:var(--page2)}.thard h4{margin:0 0 4px}.thard ol{margin:0;padding-left:1.4em}.thard li{margin:4px 0}" +
      ".tchips{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 2px}.tchip{font:inherit;font-size:.88rem;border:1px solid var(--line);border-radius:999px;padding:4px 12px;cursor:pointer;background:var(--page2)}.tchip.on{outline:2.5px solid #2a241b;font-weight:700}.tcount{align-self:center;color:var(--muted)}" +
      ".tst{border-radius:10px;padding:10px 14px;background:var(--page2);border:1px solid var(--line)}.tst h4{margin:0 0 4px;font-size:1.02rem}" +
      ".tst dl{margin:0;display:grid;grid-template-columns:auto minmax(0,1fr);gap:4px 12px;font-size:.92rem}.tst dt{color:var(--muted);max-width:22em}.tst dd{margin:0;white-space:pre-wrap}" +
      ".tst dt.tdh,.tst dd.tdh{margin-top:10px;font-weight:700;color:#2a241b;border-top:1px solid var(--line);padding-top:6px}" +
      ".tst dd.ok .tmk{color:#3d7a4a}.tst dd.bad .tmk,.tst dd.bad{color:#a8352a}.tst dd .tmk{display:inline;font-weight:700;font-size:.8rem}.tst dd b.lv-low,.tst dd b.lv-mid,.tst dd b.lv-good{padding:0 6px;border-radius:4px}" +
      ".tst .tw{display:block;margin:4px 0;padding:6px 10px;border-left:3px solid #c9b48a;background:var(--page);color:#2a241b}" +
      ".tsum{margin:2px 0 6px;padding:4px 10px;border-radius:8px;font-weight:700;font-size:.9rem;display:inline-block}" +
      ".sumout{white-space:pre-wrap;max-height:360px;overflow:auto}" +
      ".tgrid td:first-child small{display:block;color:#a8352a;font-size:.72rem;font-weight:400}.tempty td{color:#9a8f80}.tq-login{max-width:420px;margin:30px auto}.tq-login input{font-size:18px;padding:8px 10px;width:100%;box-sizing:border-box;margin:8px 0}.tq-err{color:#a3382a}";
    document.head.appendChild(s);
  }

  if (pw()) load(pw()); else ask();
};
})();
