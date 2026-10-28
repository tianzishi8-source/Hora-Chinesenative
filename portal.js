/* 网站首页：登录 → 选年级 → 山水长卷选课文 → 进入课文。
 * 登录用的是同一张 Google 表格（site-config.js 里的 sheetUrl），核对班级码＋名字＋4位数字。
 * 登录后把身份存进 sessionStorage（这个标签页关掉就没了）；勾了“记住我”再存进 localStorage。
 * 课文页（engine.js）读到这份身份就直接进课，不再要求登录。 */
(function () {
  "use strict";
  var SITE = window.HORA_SITE || {}, LESSONS = window.HORA_LESSONS || [];
  var NUM = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"];
  var app = document.getElementById("app");
  var me = null, teacher = false;

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function get(k, store) { try { return JSON.parse((store || localStorage).getItem(k) || "null"); } catch (e) { return null; } }
  function put(k, v, store) { try { (store || localStorage).setItem(k, JSON.stringify(v)); } catch (e) {} }
  function normCls(v) { return String(v || "").replace(/\s+/g, "").toUpperCase(); }
  function normName(v) { return String(v || "").replace(/\s+/g, " ").trim(); }
  function sess() { var a = get("hora-session", sessionStorage); if (a && a.pin) return a; var b = get("hora-last"); if (b && b.pin) return b; return null; }
  function api(action, body) {
    var q = { action: action, lesson: "_home", lessonTitle: "首页" }; for (var k in body) q[k] = body[k];
    return fetch(SITE.sheetUrl, { method: "POST", body: JSON.stringify(q) }).then(function (r) { return r.json(); })
      .then(function (j) { if (!j || !j.ok) { var e = new Error((j && j.err) || "server"); e.code = (j && j.err) || "server"; throw e; } return j; });
  }
  function byGrade(g) { return LESSONS.filter(function (l) { return l.grade === g; }); }
  function guessGrade(cls) { var m = /(?:G|GRADE|Y)(\d{1,2})/.exec(cls || "") || /^(\d{1,2})/.exec(cls || ""); var g = m ? +m[1] : 0; return g >= 1 && g <= 12 ? g : 0; }
  function doneDays(l) { if (!me) return 0; var s = get("hora-" + l.id + "-" + me.cls + "|" + me.name); return s && s.done ? Object.keys(s.done).length : 0; }
  function lessonUrl(l) { return l.folder.replace(/\/?$/, "/") + (teacher ? "#teacher" : ""); }

  /* ---------- 顶栏 ---------- */
  function top(extra) {
    var who = teacher ? "老师" : (me ? esc(me.cls) + " · " + esc(me.name) : "");
    return '<div class="wrap"><header class="top">' + (extra || "") + '<div class="mark"><span class="seal">语</span>HORA 语文</div><span class="sp"></span>' +
      (who ? '<span class="who">' + who + '</span><button class="tbtn" id="bOut" type="button">换人</button>' : "") + '</header></div>';
  }
  function wireTop() {
    var b = document.getElementById("bOut"); if (!b) return;
    b.addEventListener("click", function () {
      try { sessionStorage.removeItem("hora-session"); sessionStorage.removeItem("hora-teacher"); } catch (e) {}
      var l = get("hora-last"); if (l) { delete l.pin; put("hora-last", l); }
      me = null; teacher = false; history.replaceState(null, "", location.pathname); showLogin();
    });
  }

  /* ---------- 第一屏：登录 ---------- */
  function showLogin() {
    var last = get("hora-last") || {};
    app.innerHTML = '<section class="login"><div class="lcard"><div class="lhead"><span class="seal">语</span><h1>HORA 语文</h1><p>读课文，从这里出发</p></div>' +
      '<label class="field"><span class="lab">班级码（老师给的）</span><input id="lg-cls" autocomplete="off" autocapitalize="characters" placeholder="比如 G8A"></label>' +
      '<label class="field"><span class="lab">名字或昵称</span><input id="lg-name" autocomplete="off" maxlength="12" placeholder="同学和老师认得出就行"></label>' +
      '<label class="field"><span class="lab">4 位数字（自己定，记住它）</span><input id="lg-pin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" placeholder="••••"></label>' +
      '<label class="keep"><input type="checkbox" id="lg-keep" checked> 在这台设备上记住我（公用电脑请不要勾）</label>' +
      '<button class="btn wide" id="lg-go" type="button">进入</button>' +
      '<p class="msg" id="lg-msg">第一次来：自己定一个 4 位数字。换电脑、换手机时，输同样的三项，就能接着上次做。</p>' +
      '<button class="tlink" id="lg-t" type="button">我是老师</button></div></section>';
    var c = document.getElementById("lg-cls"), n = document.getElementById("lg-name"), p = document.getElementById("lg-pin"),
      go = document.getElementById("lg-go"), msg = document.getElementById("lg-msg"), keep = document.getElementById("lg-keep");
    c.value = last.cls || ""; n.value = last.name || ""; (c.value ? (n.value ? p : n) : c).focus();
    [c, n, p].forEach(function (x) { x.addEventListener("keydown", function (e) { if (e.key === "Enter") go.click(); }); });
    function say(t, err) { msg.textContent = t; msg.className = "msg" + (err ? " err" : ""); }
    go.addEventListener("click", function () {
      var m = { cls: normCls(c.value), name: normName(n.value), pin: p.value.trim() };
      if (!m.cls) { c.focus(); return say("请写班级码。", 1); }
      if (!m.name) { n.focus(); return say("请写名字或昵称。", 1); }
      if (!/^\d{4}$/.test(m.pin)) { p.focus(); return say("请写 4 位数字。", 1); }
      function ok() {
        me = m; put("hora-session", m, sessionStorage); put("hora-last", keep.checked ? m : { cls: m.cls, name: m.name });
        var g = guessGrade(m.cls); if (g && byGrade(g).length) { put("hora-grade", g); }
        showGrades();
      }
      if (!SITE.sheetUrl) return ok();
      go.disabled = true; say("正在核对……");
      api("login", m).then(ok).catch(function (e) {
        go.disabled = false;
        if (e.code === "pin") say("这个班里已经有人用了这个名字，数字对不上。是你的话，再想想当初定的数字；不是你，就换个名字（比如加上姓）。", 1);
        else if (e.code === "cls") say("没有这个班级码，请问一下老师。", 1);
        else say("连不上老师的表格，可能是网络问题，请稍后再试。", 1);
      });
    });
    document.getElementById("lg-t").addEventListener("click", function () {
      teacher = true; me = null; try { sessionStorage.setItem("hora-teacher", "1"); } catch (e) {} showGrades();
    });
  }

  /* ---------- 第二屏：选年级 ---------- */
  function showGrades() {
    history.replaceState(null, "", location.pathname);
    var mine = me ? guessGrade(me.cls) : 0;
    var groups = [["小　学", 1, 6], ["初　中", 7, 9], ["高　中", 10, 12]];
    var h = top() + '<div class="wrap"><h2 class="h">选年级</h2><p class="hint">' + (teacher ? "老师：选一个年级，再选课文，进去后输老师密码就能看全班作答。" : "选你所在的年级。") + '</p>';
    groups.forEach(function (gr) {
      h += '<div class="stage">' + gr[0] + '</div><div class="grades">';
      for (var g = gr[1]; g <= gr[2]; g++) {
        var n = byGrade(g).length;
        h += '<button type="button" class="gcard ' + (n ? "has" : "none") + (g === mine ? " mine" : "") + '" data-g="' + g + '"' + (n ? "" : ' aria-disabled="true"') + '>' +
          '<div class="num">' + NUM[g] + '</div><div class="nm">' + NUM[g] + '年级</div><span class="st">' + (n ? n + " 篇课文" : "待开放") + '</span></button>';
      }
      h += '</div>';
    });
    app.innerHTML = h + '<p class="hint" style="margin-top:20px">还没有课文的年级，老师做好后会在这里开放。</p></div>';
    wireTop();
    [].forEach.call(app.querySelectorAll(".gcard"), function (b) {
      b.addEventListener("click", function () {
        var g = +b.getAttribute("data-g");
        if (!byGrade(g).length) { b.querySelector(".st").textContent = "还没有课文，待开放"; return; }
        put("hora-grade", g); showMap(g);
      });
    });
  }

  /* ---------- 第三屏：山水长卷 ---------- */
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function f(n) { return Math.round(n * 10) / 10; }

  function mountain(cx, base, w, h, R) {
    var l = cx - w / 2, r = cx + w / 2, tx = cx + (R() - .5) * w * .18, ty = base - h;
    return "M" + f(l) + " " + base + " C" + f(l + w * .22) + " " + f(base - h * .35) + " " + f(tx - w * .16) + " " + f(ty + h * .12) + " " + f(tx) + " " + f(ty) +
      " C" + f(tx + w * .12) + " " + f(ty + h * .08) + " " + f(r - w * .2) + " " + f(base - h * .4) + " " + f(r) + " " + base + "Z";
  }
  function cun(cx, base, w, h, R, n) { /* 皴笔：从山顶往下的几道细墨线 */
    var d = "", ty = base - h;
    for (var i = 0; i < n; i++) {
      var sx = cx + (R() - .5) * w * .3, sy = ty + h * (.08 + R() * .25), ex = sx + (R() - .5) * w * .45, ey = sy + h * (.25 + R() * .35);
      d += "M" + f(sx) + " " + f(sy) + " Q" + f((sx + ex) / 2 + (R() - .5) * 30) + " " + f((sy + ey) / 2) + " " + f(ex) + " " + f(ey) + " ";
    }
    return d;
  }
  function pine(x, y, s) {
    return '<g transform="translate(' + f(x) + ' ' + f(y) + ') scale(' + f(s) + ')"><path d="M0 0 L0 -34" stroke="#2c302d" stroke-width="2"/>' +
      '<path d="M-12 -10 L0 -20 L12 -10 Z M-10 -20 L0 -30 L10 -20 Z M-7 -29 L0 -38 L7 -29 Z" fill="#2c302d" opacity=".82"/></g>';
  }
  function pavilion(x, y, on) {
    var c = on ? "#2a2724" : "#9a9184";
    return '<g transform="translate(' + f(x) + ' ' + f(y) + ')">' +
      '<path d="M-34 -40 Q-16 -46 0 -60 Q16 -46 34 -40 Q20 -42 0 -44 Q-20 -42 -34 -40Z" fill="' + c + '"/>' +
      '<path d="M-36 -40 Q-40 -43 -42 -48 M36 -40 Q40 -43 42 -48" stroke="' + c + '" stroke-width="2" fill="none"/>' +
      '<path d="M-22 -42 V-6 M22 -42 V-6 M-6 -43 V-6 M6 -43 V-6" stroke="' + c + '" stroke-width="2.2"/>' +
      '<path d="M-30 -6 H30 M-34 0 H34" stroke="' + c + '" stroke-width="3"/>' +
      '<path d="M0 -60 V-68" stroke="' + c + '" stroke-width="2"/></g>';
  }
  function vtext(x, y, s, size, fill, family) {
    var o = "";
    for (var i = 0; i < s.length; i++) o += '<text x="' + f(x) + '" y="' + f(y + i * size * 1.1) + '" font-size="' + size + '" fill="' + fill + '" text-anchor="middle" font-family="' + family + '">' + esc(s[i]) + '</text>';
    return o;
  }

  function drawScroll(g, stops, cur) {
    var R = rng(g * 7919 + 13), H = 560, gap = 380, x0 = 470, W = x0 + (stops.length - 1) * gap + 520;
    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="' + NUM[g] + '年级课文长卷">' +
      '<defs>' +
      '<linearGradient id="wash1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6f8087" stop-opacity=".55"/><stop offset="1" stop-color="#6f8087" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="wash2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f4b4c" stop-opacity=".82"/><stop offset=".75" stop-color="#3f4b4c" stop-opacity=".12"/><stop offset="1" stop-color="#3f4b4c" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="wash3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#262b2a" stop-opacity=".9"/><stop offset="1" stop-color="#262b2a" stop-opacity=".1"/></linearGradient>' +
      '<linearGradient id="silk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3ead6"/><stop offset=".6" stop-color="#eee3cb"/><stop offset="1" stop-color="#e6d8bc"/></linearGradient>' +
      '<filter id="blur"><feGaussianBlur stdDeviation="9"/></filter>' +
      '<filter id="rough"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="' + g + '"/><feDisplacementMap in="SourceGraphic" scale="9"/></filter>' +
      '</defs><rect width="' + W + '" height="' + H + '" fill="url(#silk)"/>';
    /* 太阳 */
    s += '<circle cx="' + f(W * .62) + '" cy="96" r="30" fill="#c7553f" opacity=".55"/>';
    /* 远山、中山 */
    var far = "", mid = "", cfar = "", cmid = "";
    for (var x = -80; x < W + 120; x += 150 + R() * 140) { var w1 = 260 + R() * 220, h1 = 120 + R() * 130; far += mountain(x, 330, w1, h1, R); }
    for (x = -60; x < W + 120; x += 210 + R() * 200) { var w2 = 240 + R() * 200, h2 = 120 + R() * 120; mid += mountain(x, 405, w2, h2, R); cmid += cun(x, 405, w2, h2, R, 4); }
    s += '<g filter="url(#rough)"><path d="' + far + '" fill="url(#wash1)"/></g>';
    s += '<rect x="0" y="290" width="' + W + '" height="70" fill="#f6efdf" opacity=".85" filter="url(#blur)"/>';
    s += '<g filter="url(#rough)"><path d="' + mid + '" fill="url(#wash2)"/><path d="' + cmid + '" stroke="#2e3434" stroke-opacity=".35" stroke-width="1.6" fill="none"/></g>';
    s += '<rect x="0" y="372" width="' + W + '" height="52" fill="#f4ecda" opacity=".9" filter="url(#blur)"/>';
    /* 江水：从左到右穿过每一站 */
    var pts = stops.map(function (st, i) { return [x0 + i * gap, 452 + (i % 2 ? -14 : 12)]; });
    var d = "M-20 " + (pts[0][1] + 20), px = -20, py = pts[0][1] + 20;
    pts.concat([[W + 40, 470]]).forEach(function (p) { var mx = (px + p[0]) / 2; d += " C" + f(mx) + " " + f(py) + " " + f(mx) + " " + f(p[1]) + " " + f(p[0]) + " " + f(p[1]); px = p[0]; py = p[1]; });
    s += '<path d="' + d + '" stroke="#a9bbb9" stroke-width="46" fill="none" opacity=".45" stroke-linecap="round"/>' +
      '<path d="' + d + '" stroke="#f7f1e2" stroke-width="2" fill="none" stroke-dasharray="14 22" opacity=".9"/>';
    /* 近岸小山与松 */
    var near = "";
    for (x = -40; x < W + 80; x += 160 + R() * 160) {
      var w3 = 150 + R() * 120, h3 = 40 + R() * 50; near += mountain(x, H + 4, w3, h3 + 40, R);
      if (R() < .65) s += pine(x + (R() - .5) * 40, H - h3 - 6, .8 + R() * .5);
    }
    s += '<g filter="url(#rough)"><path d="' + near + '" fill="url(#wash3)" opacity=".75"/></g>';
    /* 飞鸟 */
    for (var b = 0; b < 5; b++) { var bx = 200 + R() * (W - 400), by = 70 + R() * 90; s += '<path d="M' + f(bx - 7) + ' ' + f(by) + ' q7 -6 7 0 q0 -6 7 0" stroke="#2a2724" stroke-width="1.6" fill="none" opacity=".7"/>'; }
    /* 卷首题字 */
    s += vtext(120, 120, NUM[g] + "年级", 46, "#1f1b17", "ZCOOL XiaoWei, Noto Serif SC, serif");
    s += '<rect x="96" y="' + (120 + (NUM[g].length + 3) * 50 - 18) + '" width="48" height="48" rx="4" fill="#b8342a"/>' + vtext(120, 120 + (NUM[g].length + 3) * 50 + 2, "课文", 18, "#fbefe6", "ZCOOL XiaoWei, serif");
    s += vtext(190, 140, "左右拖动长卷点一座亭子", 15, "#6f675b", "Noto Serif SC, serif");
    /* 每一站 */
    stops.forEach(function (st, i) {
      var p = pts[i], on = !!st.folder, label = on ? st.title : "待开放";
      var tx = p[0] + 58, ty = p[1] - 250, len = label.length, hh = len * 30 + 22;
      s += '<g class="stop' + (on ? "" : " off") + '" data-i="' + i + '"' + (on ? ' tabindex="0" role="button" aria-label="' + esc("《" + st.title + "》" + st.author) + '"' : "") + '>' +
        '<ellipse class="ring" cx="' + p[0] + '" cy="' + (p[1] - 40) + '" rx="70" ry="64" fill="none" stroke="#b8342a" stroke-width="2" stroke-dasharray="4 6"/>' +
        '<rect x="' + (p[0] - 70) + '" y="' + (ty - 10) + '" width="190" height="' + (p[1] - ty + 30) + '" fill="transparent"/>' +
        pavilion(p[0], p[1] - 8, on) +
        '<path d="M' + p[0] + ' ' + (p[1] - 76) + ' L' + tx + ' ' + (ty + hh) + '" stroke="' + (on ? "#b8342a" : "#9a9184") + '" stroke-width="1" stroke-dasharray="2 4"/>' +
        '<rect x="' + (tx - 19) + '" y="' + ty + '" width="38" height="' + hh + '" rx="3" fill="' + (on ? "#b8342a" : "#d9cfbd") + '"/>' +
        vtext(tx, ty + 32, label, 24, on ? "#fbefe6" : "#7d7466", "ZCOOL XiaoWei, Noto Serif SC, serif") +
        (on ? vtext(tx + 34, ty + 12, st.author, 13, "#3b3631", "Noto Serif SC, serif") : "") + '</g>';
    });
    /* 小舟：停在当前这一站 */
    var bp = pts[cur] || pts[0];
    s += '<g transform="translate(' + (bp[0] - 92) + ' ' + (bp[1] + 6) + ')"><path d="M-30 0 Q0 14 34 0 Q4 6 -30 0Z" fill="#2a2724"/><path d="M2 2 V-30 L18 -6Z" fill="#f3ead6" stroke="#2a2724" stroke-width="1.4"/>' +
      '<circle cx="-16" cy="-12" r="11" fill="#35607c"/><text x="-16" y="-7.5" font-size="13" fill="#fbf7ee" text-anchor="middle" font-family="ZCOOL XiaoWei, serif">舟</text></g>';
    return s + "</svg>";
  }

  function showMap(g) {
    location.hash = "map";
    var list = byGrade(g), stops = list.slice();
    for (var k = list.length; k < Math.max(list.length + 2, 4); k++) stops.push({});
    var cur = 0, best = -1;
    list.forEach(function (l, i) { var d = doneDays(l); if (d > 0 && d < (l.open || 99) && best < 0) best = i; });
    var lastId = get("hora-lastLesson"); list.forEach(function (l, i) { if (l.id === lastId) cur = i; }); if (best >= 0 && !lastId) cur = best;
    app.innerHTML = top('<button class="back" id="bBack" type="button">← 选年级</button>') +
      '<div class="wrap"><div class="maphead"><h2 class="h">' + NUM[g] + '年级 · 课文长卷</h2><span class="hint">' + list.length + ' 篇已开放</span></div></div>' +
      '<div class="wrap"><div class="scroll"><div class="roller"></div><div class="paper" id="paper">' + drawScroll(g, stops, cur) + '</div><div class="roller"></div></div>' +
      '<div class="panel" id="panel"></div></div>';
    wireTop();
    document.getElementById("bBack").addEventListener("click", showGrades);
    var paper = document.getElementById("paper"), panel = document.getElementById("panel");
    function pick(i) {
      var l = list[i]; if (!l) return;
      [].forEach.call(paper.querySelectorAll(".stop"), function (e) { e.classList.toggle("on", +e.getAttribute("data-i") === i); });
      var dd = doneDays(l);
      panel.innerHTML = '<div class="body"><h3>《' + esc(l.title) + '》<small>' + esc(l.author) + '</small></h3><p>' + esc(l.blurb || "") + '</p>' +
        '<p class="prog">已开放 ' + (l.open || "?") + ' / ' + (l.total || "?") + ' 天' + (dd && !teacher ? "　·　你在这台设备上读完了 " + dd + " 天" : "") + '</p></div>' +
        '<button class="btn" id="bGo" type="button">' + (teacher ? "进入（老师）" : dd ? "接着读" : "进入") + '</button>';
      document.getElementById("bGo").addEventListener("click", function () { put("hora-lastLesson", l.id); location.href = lessonUrl(l); });
    }
    [].forEach.call(paper.querySelectorAll(".stop:not(.off)"), function (e) {
      var i = +e.getAttribute("data-i");
      e.addEventListener("click", function () { if (!moved) pick(i); });
      e.addEventListener("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); pick(i); } });
    });
    pick(cur);
    /* 鼠标拖动、滚轮横向滚动 */
    var down = false, sx = 0, sl = 0, moved = false;
    paper.addEventListener("pointerdown", function (e) { if (e.pointerType !== "mouse") return; down = true; moved = false; sx = e.clientX; sl = paper.scrollLeft; });
    addEventListener("pointermove", function (e) { if (!down) return; var dx = e.clientX - sx; if (Math.abs(dx) > 4) { moved = true; paper.classList.add("drag"); } paper.scrollLeft = sl - dx; });
    addEventListener("pointerup", function () { down = false; paper.classList.remove("drag"); setTimeout(function () { moved = false; }, 0); });
    paper.addEventListener("wheel", function (e) { if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { paper.scrollLeft += e.deltaY; e.preventDefault(); } }, { passive: false });
    /* 长卷按高度等比缩放，再把当前这一站移到中间 */
    var svg = paper.querySelector("svg"), VW = +svg.getAttribute("width");
    function fit() { var h = paper.clientHeight || svg.getBoundingClientRect().height, sc = h / 560; svg.style.width = Math.round(VW * sc) + "px"; return sc; }
    function center() { var sc = fit(); paper.scrollLeft = Math.max(0, (470 + cur * 380) * sc - paper.clientWidth / 2); }
    requestAnimationFrame(center); setTimeout(center, 120);
    addEventListener("resize", fit);
  }

  /* ---------- 开始 ---------- */
  try { teacher = sessionStorage.getItem("hora-teacher") === "1"; } catch (e) {}
  me = teacher ? null : sess();
  if (me) put("hora-session", me, sessionStorage);
  var g0 = get("hora-grade");
  if (!me && !teacher) showLogin();
  else if (location.hash === "#map" && g0 && byGrade(g0).length) showMap(g0);
  else showGrades();
})();
