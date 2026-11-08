/* 课堂版（课后单机）· 老师看全班作答：yueyanglou-ke/app.js 和 ke/app.js 共用。
 * 老师从首页“我是老师”进课堂版（地址带 #teacher）：可以像学生一样预览每个板块（不存档）；顶栏“全班作答”进这一页。
 * 数据：表格 t_all（老师密码，存 sessionStorage hora-tpw，和自学版共用），每人一行 payload（就是学生端的存档 S）。
 * 页面：概况表 → 诊断（测验逐题正确率与常见错答、字词薄弱、背诵段落与易错句）→ 沉浸体验写的话 → 每人明细（点名字展开）。
 * 用法：YK_TEACHER({ el, api, title, story, words, tests, text, order, pname, summary, esc, stamp, dur }) */
(function () {
"use strict";
window.YK_TEACHER = function (o) {
  var esc = o.esc, stamp = o.stamp, dur = o.dur, el = o.el, ROWS = null, CLS = "", err = "";
  var STORY = o.story || [], WORDS = o.words || [], TESTS = o.tests || [], TEXT = o.text || null;
  var ORDER = o.order || (TEXT && TEXT.order) || ["p1", "p2", "p3", "p4", "p5"], PN = o.pname || {};
  var NUM = ["〇", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
  css();

  function pw() { try { return sessionStorage.getItem("hora-tpw") || ""; } catch (e) { return ""; } }
  function load(p) {
    el.innerHTML = '<p class="loading">正在读全班的作答……</p>';
    o.api("t_all", { pw: p }).then(function (j) {
      try { sessionStorage.setItem("hora-tpw", p); } catch (e) {}
      ROWS = (j.rows || []).map(function (r) { var d = r.payload || {}; d._sid = r.sid; d.name = d.name || r.name; d.cls = d.cls || r.cls; return d; })
        .sort(function (a, b) { return (a.cls + a.name).localeCompare(b.cls + b.name, "zh"); });
      draw();
    }).catch(function (e) {
      if (e && e.code === "pw") { try { sessionStorage.removeItem("hora-tpw"); } catch (x) {} err = "密码不对。"; }
      else err = "连不上老师的表格，请稍后再试。";
      ask();
    });
  }
  function ask() {
    el.innerHTML = '<div class="card tq-login"><h2>全班作答</h2><p>输入老师密码（和自学版老师页的一样）。</p>' +
      '<input id="tqPw" type="password" autocomplete="off" placeholder="老师密码"><button class="btn" id="tqGo" type="button">查看</button><p class="tq-err">' + esc(err) + "</p></div>";
    var i = el.querySelector("#tqPw"), go = function () { if (i.value) load(i.value); };
    el.querySelector("#tqGo").onclick = go; i.onkeydown = function (e) { if (e.key === "Enter") go(); }; i.focus();
  }

  /* ---------- 小工具 ---------- */
  function rows() { return ROWS.filter(function (r) { return !CLS || r.cls === CLS; }); }
  function pct(a, b) { return b ? Math.round(a / b * 100) : 0; }
  function tone(v) { return v == null ? "" : v >= 85 ? "ok" : v >= 60 ? "mid" : "low"; }
  function cell(v, t) { return '<td class="' + tone(v) + '">' + (v == null ? "—" : esc(t == null ? v : t)) + "</td>"; }
  function names(list) { return list.length ? '<span class="tq-names">' + list.map(esc).join("、") + "</span>" : ""; }
  function sent(p, i) { return TEXT && TEXT.paras && TEXT.paras[p] ? TEXT.paras[p][i] || "" : ""; }
  function pname(p) { return PN[p] || (TEXT && TEXT.pname && TEXT.pname[p]) || p; }
  function rightOf(it) { return it.type === "choice" ? (it.opts || [])[it.ans] : it.type === "fill" ? [].concat(it.ans)[0] : it.model || ""; }
  function strip(s) { return String(s || "").replace(/【|】/g, ""); }

  /* ---------- 页面 ---------- */
  function draw() {
    var all = ROWS, cls = all.map(function (r) { return r.cls; }).filter(function (c, i, a) { return c && a.indexOf(c) === i; });
    var R = rows();
    var h = '<div class="tq"><div class="tq-head"><h2>全班作答 · ' + esc(o.title) + "</h2>" +
      (cls.length > 1 ? '<select id="tqCls"><option value="">全部班级</option>' + cls.map(function (c) { return '<option' + (c === CLS ? " selected" : "") + ">" + esc(c) + "</option>"; }).join("") + "</select>" : "") +
      '<button class="btn ghost" id="tqRe" type="button">刷新</button></div>' +
      '<p class="muted">' + R.length + " 位同学打开过课堂版（没打开过的不在表里）。颜色：绿 ≥85，黄 60–84，红 &lt;60。点名字看这位同学的全部记录。</p>";
    if (!R.length) { el.innerHTML = h + '<div class="card">还没有同学的记录。</div></div>'; wire(); return; }
    h += overview(R) + diagTests(R) + diagWords(R) + diagRecite(R) + writes(R) + "</div>";
    el.innerHTML = h; wire();
  }
  function wire() {
    var s = el.querySelector("#tqCls"); if (s) s.onchange = function () { CLS = s.value; draw(); };
    var r = el.querySelector("#tqRe"); if (r) r.onclick = function () { load(pw()); };
    [].forEach.call(el.querySelectorAll("[data-stu]"), function (b) { b.onclick = function () { detail(b.getAttribute("data-stu")); }; });
  }

  /* 一、概况 */
  function overview(R) {
    var paras = ORDER.concat(["all"]);
    var h = '<section class="card"><h3>一、概况</h3><div class="tq-scroll"><table class="tq-t"><thead><tr><th>名字</th><th>最近保存</th><th>自选上到</th><th>沉浸体验</th>' +
      paras.map(function (p) { return "<th>背" + esc(p === "all" ? "全文" : pname(p)) + "</th>"; }).join("") + "<th>字词掌握</th><th>练一练</th>" +
      TESTS.map(function (t) { return "<th>" + esc(t.title.replace("模拟测验", "测验")) + "<br><small>最近/最高</small></th>"; }).join("") + "</tr></thead><tbody>";
    R.forEach(function (d) {
      var sd = STORY.map(function (c) { var s = (d.story || {})[c.id]; return s && s.done ? "✓" : s ? "半" : "·"; }).join(" ");
      var cards = d.cards || {}, m = Object.keys(cards).filter(function (k) { return cards[k].box >= 2; }).length;
      h += '<tr><td><button class="tq-n" type="button" data-stu="' + esc(d._sid) + '">' + esc(d.name) + "</button>" + (CLS || !d.cls ? "" : "<small> " + esc(d.cls) + "</small>") + "</td><td>" + esc(stamp(d.savedAt)) + "</td><td>第 " + esc(d.lessonAt || 1) + " 节</td><td class=\"tq-mono\">" + sd + "</td>" +
        paras.map(function (p) { var r = (d.recite || {})[p]; return cell(r && r.best != null ? r.best : null); }).join("") +
        cell(WORDS.length ? pct(m, WORDS.length) : null, m + (WORDS.length ? "/" + WORDS.length : "")) + "<td>" + (d.drills || []).length + " 次</td>" +
        TESTS.map(function (t) { var x = (d.tests || {})[t.id]; return x && x.last ? cell(x.last.score, x.last.score + " / " + x.best + (x.tries > 1 ? "（" + x.tries + "次）" : "")) : cell(null); }).join("") + "</tr>";
    });
    return h + "</tbody></table></div><p class=\"muted small\">沉浸体验：✓ 读完　半 读到一半　· 没开始（按章顺序）。背诵和测验是分数（满分 100）。</p></section>";
  }

  /* 二、测验逐题（每人最近一次） */
  function diagTests(R) {
    var h = '<section class="card"><h3>二、模拟测验逐题诊断</h3><p class="muted">按每位同学最近一次作答统计，正确率从低到高排。错答相同的合在一起，看全班卡在哪儿。</p>';
    var any = false;
    TESTS.forEach(function (t) {
      var did = R.filter(function (d) { return d.tests && d.tests[t.id] && d.tests[t.id].last; });
      if (!did.length) { h += "<h4>" + esc(t.title) + "</h4><p class=\"muted\">还没有人做。</p>"; return; }
      any = true;
      var avg = Math.round(did.reduce(function (a, d) { return a + d.tests[t.id].last.score; }, 0) / did.length);
      var stats = (t.items || []).filter(function (it) { return it.type !== "short"; }).map(function (it) {
        var right = 0, n = 0, wrongA = {}, wrongN = [];
        did.forEach(function (d) {
          var a = (d.tests[t.id].last.ans || {})[it.id]; if (!a) return; n++;
          if (a.got >= (it.pts || 1) - 0.001) right++;
          else { var k = a.a === "" || a.a == null ? "（没答／超时）" : String(a.a); wrongA[k] = (wrongA[k] || 0) + 1; wrongN.push(d.name); }
        });
        return { it: it, n: n, rate: n ? pct(right, n) : null, wrongA: wrongA, wrongN: wrongN };
      }).filter(function (s) { return s.n; }).sort(function (a, b) { return a.rate - b.rate; });
      h += "<h4>" + esc(t.title) + "　<small>" + did.length + " 人做过，平均 " + avg + " 分</small></h4><div class=\"tq-scroll\"><table class=\"tq-t tq-q\"><thead><tr><th>正确率</th><th>题目</th><th>正确答案</th><th>常见错答</th><th>错的同学</th></tr></thead><tbody>";
      stats.forEach(function (s) {
        var wa = Object.keys(s.wrongA).sort(function (a, b) { return s.wrongA[b] - s.wrongA[a]; }).slice(0, 3).map(function (k) { return esc(k) + " ×" + s.wrongA[k]; }).join("<br>");
        h += "<tr>" + cell(s.rate, s.rate + "%（" + (s.n - s.wrongN.length) + "/" + s.n + "）") + "<td>" + esc(strip(s.it.q)) + "</td><td>" + esc(rightOf(s.it)) + "</td><td>" + (wa || "—") + "</td><td>" + names(s.wrongN) + "</td></tr>";
      });
      h += "</tbody></table></div>";
      (t.items || []).filter(function (it) { return it.type === "short"; }).forEach(function (it) {
        var got = [], tot = 0;
        did.forEach(function (d) { var s = (d.tests[t.id].last.short || {})[it.id]; if (s) { got.push({ n: d.name, s: s }); tot += s.got; } });
        if (!got.length) return;
        h += '<details class="tq-d"><summary>简答：' + esc(strip(it.q)) + "　<small>自评平均 " + (Math.round(tot / got.length * 10) / 10) + " / " + it.pts + " 分，" + got.length + " 人</small></summary>" +
          (it.model ? '<p class="tq-model">参考：' + esc(it.model) + "</p>" : "") +
          got.map(function (g) { return '<p class="tq-w"><b>' + esc(g.n) + "</b>（自评 " + g.s.got + "）" + esc(g.s.text || "（没写）") + "</p>"; }).join("") + "</details>";
      });
    });
    return any || TESTS.length ? h + "</section>" : "";
  }

  /* 三、字词 */
  function diagWords(R) {
    if (!WORDS.length) return "";
    var drillWrong = {};
    R.forEach(function (d) { (d.drills || []).forEach(function (r) { if (r.kind === "words") (r.wrong || []).forEach(function (id) { drillWrong[id] = (drillWrong[id] || 0) + 1; }); }); });
    var st = WORDS.map(function (w) {
      var seen = 0, weak = [], wrong = 0;
      R.forEach(function (d) { var c = (d.cards || {})[w.id]; if (!c) return; seen++; wrong += c.wrong || 0; if (c.box < 2) weak.push(d.name); });
      return { w: w, seen: seen, weak: weak, wrong: wrong + (drillWrong[w.id] || 0) };
    }).filter(function (s) { return s.seen; }).sort(function (a, b) { return b.wrong - a.wrong || b.weak.length - a.weak.length; });
    var h = '<section class="card"><h3>三、字词：最容易错的</h3><p class="muted">“错的次数”＝字词卡答错＋练一练答错，全班加起来。“还没掌握”＝这张卡还在前两格。</p>';
    if (!st.length) return h + '<p class="muted">还没有人练过字词卡。</p></section>';
    h += '<div class="tq-scroll"><table class="tq-t"><thead><tr><th>字词</th><th>例句</th><th>意思</th><th>错的次数</th><th>还没掌握 / 练过</th></tr></thead><tbody>';
    st.slice(0, 20).forEach(function (s) {
      h += "<tr><td><b>" + esc(s.w.w) + "</b></td><td>" + esc(strip(s.w.sent)) + "</td><td>" + esc(s.w.ans) + "</td><td>" + s.wrong + "</td><td>" + s.weak.length + " / " + s.seen + " " + names(s.weak) + "</td></tr>";
    });
    return h + "</tbody></table></div>" + (st.length > 20 ? '<p class="muted small">只列前 20 个。</p>' : "") + "</section>";
  }

  /* 四、背诵 */
  function diagRecite(R) {
    if (!TEXT) return "";
    var h = '<section class="card"><h3>四、背诵</h3><div class="tq-scroll"><table class="tq-t"><thead><tr><th>段落</th><th>练过的人</th><th>平均最高分</th><th>没练过的同学</th></tr></thead><tbody>';
    ORDER.concat(["all"]).forEach(function (p) {
      var did = R.filter(function (d) { return d.recite && d.recite[p] && d.recite[p].best != null; }), no = R.filter(function (d) { return did.indexOf(d) < 0; }).map(function (d) { return d.name; });
      var avg = did.length ? Math.round(did.reduce(function (a, d) { return a + d.recite[p].best; }, 0) / did.length) : null;
      h += "<tr><td>" + esc(p === "all" ? "全文" : pname(p)) + "</td><td>" + did.length + "</td>" + cell(avg) + "<td>" + names(no) + "</td></tr>";
    });
    h += "</tbody></table></div>";
    var miss = {};
    R.forEach(function (d) { (d.drills || []).forEach(function (r) { if (r.kind !== "recite") return; (r.wrong || []).forEach(function (ref) {
      var m = /^(\w+?)-(\d+)-(chain|fill)$/.exec(ref); if (!m) return;
      var i = +m[2] + (m[3] === "chain" ? 1 : 0), key = m[1] + "-" + i; miss[key] = miss[key] || { p: m[1], i: i, n: 0, who: {} }; miss[key].n++; miss[key].who[d.name] = 1;
    }); }); });
    var ms = Object.keys(miss).map(function (k) { return miss[k]; }).sort(function (a, b) { return b.n - a.n; }).slice(0, 12);
    if (ms.length) {
      h += '<h4>最容易接不上、默不出的句子</h4><div class="tq-scroll"><table class="tq-t"><thead><tr><th>句子</th><th>段</th><th>错的次数</th><th>同学</th></tr></thead><tbody>';
      ms.forEach(function (m) { h += "<tr><td>" + esc(sent(m.p, m.i)) + "</td><td>" + esc(pname(m.p)) + "</td><td>" + m.n + "</td><td>" + names(Object.keys(m.who)) + "</td></tr>"; });
      h += "</tbody></table></div>";
    }
    return h + "</section>";
  }

  /* 五、沉浸体验写的话 */
  function writes(R) {
    if (!STORY.length) return "";
    var h = '<section class="card"><h3>五、沉浸体验：同学写的话</h3>';
    STORY.forEach(function (c, ci) {
      var list = [];
      R.forEach(function (d) { var s = (d.story || {})[c.id]; if (!s || !s.writes) return; Object.keys(s.writes).forEach(function (k) { var w = s.writes[k]; if (w && w.text) list.push({ n: d.name, w: w }); }); });
      var done = R.filter(function (d) { var s = (d.story || {})[c.id]; return s && s.done; }).length;
      h += '<details class="tq-d"' + (list.length ? "" : "") + "><summary>第" + (NUM[ci + 1] || ci + 1) + "章　" + esc(c.title) + "　<small>" + done + " 人读完，" + list.length + " 段话</small></summary>" +
        (list.length ? list.map(function (x) { return '<div class="tq-w"><b>' + esc(x.n) + "</b>" + (x.w.kind ? '<span class="tq-tag">' + esc(x.w.kind) + "</span>" : "") + "<small>" + esc(stamp(x.w.at)) + "</small>" +
          (x.w.prompt ? '<p class="muted small">' + esc(x.w.prompt) + "</p>" : "") + "<p>" + esc(x.w.text) + "</p></div>"; }).join("") : '<p class="muted">还没有人写。</p>') + "</details>";
    });
    return h + "</section>";
  }

  /* 每人明细 */
  function detail(sid) {
    var d = ROWS.filter(function (r) { return r._sid === sid; })[0]; if (!d) return;
    var ov = document.createElement("div"); ov.className = "tq-ov";
    var h = '<div class="tq-sheet"><button class="tq-x" type="button" aria-label="关上">×</button><h3>' + esc(d.name) + "<small> " + esc(d.cls || "") + "</small></h3>";
    TESTS.forEach(function (t) {
      var x = (d.tests || {})[t.id]; if (!x || !x.last) return;
      h += "<h4>" + esc(t.title) + "　最近 " + x.last.score + " 分（" + esc(stamp(x.last.at)) + "，用时 " + esc(dur(x.last.secs)) + "）　最高 " + x.best + "　共 " + x.tries + " 次</h4><ol class=\"tq-ans\">";
      (t.items || []).forEach(function (it) {
        if (it.type === "short") { var s = (x.last.short || {})[it.id]; h += '<li><span class="mid">简答</span> ' + esc(strip(it.q)) + "<br><b>写的：</b>" + esc(s ? s.text || "（没写）" : "（没写）") + (s ? "（自评 " + s.got + "/" + s.pts + "）" : "") + "</li>"; return; }
        var a = (x.last.ans || {})[it.id], ok = a && a.got >= (it.pts || 1) - 0.001;
        h += '<li class="' + (ok ? "ok" : "low") + '">' + (ok ? "✓ " : "✗ ") + esc(strip(it.q)) + (ok ? "" : "<br><b>答的：</b>" + esc(a ? a.a || "（没答）" : "（没答）") + "　<b>正确：</b>" + esc(rightOf(it))) + "</li>";
      });
      h += "</ol>";
    });
    h += '<h4>全部记录（和表格里“作答摘要”一样）</h4><pre class="tq-pre">' + esc(o.summary(d)) + "</pre></div>";
    ov.innerHTML = h; document.body.appendChild(ov);
    var close = function () { ov.remove(); }; ov.querySelector(".tq-x").onclick = close; ov.onclick = function (e) { if (e.target === ov) close(); };
  }

  function css() {
    if (document.getElementById("tqCss")) return;
    var s = document.createElement("style"); s.id = "tqCss";
    s.textContent = ".tq{max-width:1180px;margin:0 auto}.tq-head{display:flex;gap:12px;align-items:center;flex-wrap:wrap}.tq-head h2{margin:0;flex:1}" +
      ".tq .card{margin:14px 0}.tq h3{margin:0 0 8px}.tq h4{margin:16px 0 6px}.tq h4 small{font-weight:400;color:#7a6f60}" +
      ".tq-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}.tq-t{border-collapse:collapse;width:100%;font-size:14px}.tq-t th,.tq-t td{border:1px solid rgba(60,45,30,.15);padding:5px 8px;text-align:left;vertical-align:top}" +
      ".tq-t th{background:rgba(60,45,30,.06);font-weight:600;white-space:nowrap}.tq-t td.ok{background:#e4f1e1}.tq-t td.mid{background:#f8edcf}.tq-t td.low{background:#f6d9d2}" +
      ".tq-q td:nth-child(2){min-width:260px}.tq-mono{font-family:ui-monospace,monospace;white-space:nowrap}.tq-names{color:#7a6f60;font-size:13px}" +
      ".tq-n{border:0;background:none;color:#a3382a;font:inherit;font-weight:700;cursor:pointer;padding:0;text-decoration:underline}" +
      ".tq-d{border-top:1px solid rgba(60,45,30,.12);padding:6px 0}.tq-d summary{cursor:pointer;font-weight:600}.tq-d summary small{font-weight:400;color:#7a6f60}" +
      ".tq-w{margin:8px 0;padding:8px 10px;background:rgba(255,252,244,.8);border-left:3px solid #c9b48a}.tq-w p{margin:4px 0 0;white-space:pre-wrap}.tq-w small{color:#7a6f60;margin-left:8px}" +
      ".tq-tag{font-size:12px;background:#3c6f7a;color:#fff;border-radius:3px;padding:0 6px;margin-left:6px}.tq-model{color:#3c6f7a}" +
      ".tq-login{max-width:420px;margin:30px auto}.tq-login input{font-size:18px;padding:8px 10px;width:100%;box-sizing:border-box;margin:8px 0}.tq-err{color:#a3382a}" +
      ".tq-ov{position:fixed;inset:0;background:rgba(20,15,10,.45);z-index:50;overflow:auto;padding:24px 12px}.tq-sheet{position:relative;max-width:860px;margin:0 auto;background:#fbf7ec;border-radius:12px;padding:20px 22px}" +
      ".tq-x{position:absolute;right:12px;top:8px;border:0;background:none;font-size:30px;cursor:pointer}.tq-ans li{margin:5px 0}.tq-ans li.low{color:#8a2a1f}.tq-ans .mid{background:#f8edcf;padding:0 4px}" +
      ".tq-pre{white-space:pre-wrap;font-size:13px;background:rgba(60,45,30,.05);padding:10px;border-radius:6px}";
    document.head.appendChild(s);
  }

  if (pw()) load(pw()); else ask();
};
})();
