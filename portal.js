/* 弦歌 · 网站首页
 * 开场（拨琴弦，墨晕开成山，题字浮现）→ 签到（班级码＋名字＋4位数字，向 Google 表格核对）→ 十二册（选年级）→ 册页（选课文）→ 进入课文。
 * 登录后身份存进 sessionStorage；勾“记住我”再存进 localStorage。课文页（engine.js）读到身份就直接进课。
 * 进度写成一本字帖：在这台设备上每读完一天，帖上就多写好一个字。 */
(function () {
  "use strict";
  var SITE = window.HORA_SITE || {}, LESSONS = window.HORA_LESSONS || [];
  var NUM = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"];
  var TIE = "当用各样的智慧把基督的道理丰丰富富地存在心里用诗章颂词灵歌彼此教导互相劝戒心被恩感歌颂神";   /* 字帖帖文：歌罗西书 3:16（和合本），43 字 */
  var app = document.getElementById("app"), sheet = document.getElementById("sheet");
  var me = null, teacher = false;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

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
  function allDone() { return LESSONS.reduce(function (a, l) { return a + doneDays(l); }, 0); }
  function toast(t) { var o = document.createElement("div"); o.className = "toast"; o.textContent = t; sheet.append(o); setTimeout(function () { o.remove(); }, 2600); }
  function go(l) {
    put("hora-lastLesson", l.id);
    if (SITE.preview) return toast("这是预览：上线后，这里会打开《" + l.title + "》");
    location.href = l.folder.replace(/\/?$/, "/") + (teacher ? "#teacher" : "");
  }

  /* ---------- 声音：古琴的拨弦（Karplus–Strong）加一点泛音 ---------- */
  var AC = null, sndOn = get("hora-snd") !== false, cache = {};
  function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (AC && AC.state === "suspended") AC.resume(); return AC; }
  function pluckBuf(f) {
    var c = ac(); if (!c) return null; var key = Math.round(f); if (cache[key]) return cache[key];
    var sr = c.sampleRate, len = Math.floor(sr * 3.2), b = c.createBuffer(1, len, sr), d = b.getChannelData(0), N = Math.max(2, Math.round(sr / f)), ring = new Float32Array(N);
    for (var i = 0; i < N; i++) ring[i] = (Math.random() * 2 - 1) * (1 - i / N * .5);
    var p = 0, decay = f < 150 ? .9985 : .997, prev = 0;
    for (i = 0; i < len; i++) { var nx = (p + 1) % N, v = decay * .5 * (ring[p] + ring[nx]); prev = prev * .35 + v * .65; ring[p] = v; d[i] = prev; p = nx; }
    return (cache[key] = b);
  }
  function pluck(f, vol) {
    if (!sndOn) return; var c = ac(); if (!c) return; var b = pluckBuf(f); if (!b) return;
    var s = c.createBufferSource(), g = c.createGain(), lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2400;
    s.buffer = b; g.gain.value = (vol || .5); s.connect(lp); lp.connect(g); g.connect(c.destination); s.start();
    var o = c.createOscillator(), og = c.createGain(), t = c.currentTime;  /* 泛音：一声清亮的高音 */
    o.type = "sine"; o.frequency.value = f * 4; og.gain.setValueAtTime(0, t); og.gain.linearRampToValueAtTime((vol || .5) * .12, t + .01); og.gain.exponentialRampToValueAtTime(.0001, t + 2.2);
    o.connect(og); og.connect(c.destination); o.start(t); o.stop(t + 2.3);
  }
  var SCALE = [196, 220, 246.94, 293.66, 329.63, 392, 440, 493.88, 587.33, 659.25, 783.99, 880];   /* 五声音阶，一年级最低，十二年级最高 */

  /* ---------- 琴弦：画一根会振动的弦 ---------- */
  function makeString(svg, opts) {
    opts = opts || {}; var W = 1000, H = +svg.getAttribute("data-h") || 36, y = H / 2, path = svg.querySelector(".s"), amp = 0, at = .5, t0 = 0, raf = 0;
    function draw(now) {
      var t = (now - t0) / 1000, a = amp * Math.exp(-t * 2.6), d = "M0 " + y;
      for (var x = 0; x <= W; x += 10) { var u = x / W, shape = u < at ? u / at : (1 - u) / (1 - at); d += " L" + x + " " + (y + a * shape * Math.sin(t * 46) * Math.sin(Math.PI * u * 2 + t * 3) * .5 + a * shape * Math.sin(t * 52)).toFixed(2); }
      path.setAttribute("d", d);
      if (a > .05) raf = requestAnimationFrame(draw); else { path.setAttribute("d", "M0 " + y + " L" + W + " " + y); raf = 0; }
    }
    return { pluck: function (u, strength) { at = Math.min(.92, Math.max(.08, u)); amp = (strength || 1) * (opts.amp || 10); t0 = performance.now(); if (reduce) return; if (!raf) raf = requestAnimationFrame(draw); } };
  }
  function stringSVG(h, cls) {
    return '<svg class="' + (cls || "string") + '" viewBox="0 0 1000 ' + h + '" preserveAspectRatio="none" data-h="' + h + '" aria-hidden="true">' +
      '<path class="s" d="M0 ' + h / 2 + ' L1000 ' + h / 2 + '" stroke="#2b2620" stroke-width="1.4" fill="none" vector-effect="non-scaling-stroke"/>' +
      '<path d="M0 ' + (h / 2 + 1.2) + ' L1000 ' + (h / 2 + 1.2) + '" stroke="rgba(255,255,255,.6)" stroke-width=".8" vector-effect="non-scaling-stroke"/></svg>';
  }

  /* ---------- 墨：从拨弦处晕开的墨圈 ---------- */
  function inkRings(canvas, x, y) {
    var r = canvas.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1), ctx = canvas.getContext("2d");
    canvas.width = r.width * dpr; canvas.height = r.height * dpr; ctx.scale(dpr, dpr);
    var rings = [], start = performance.now();
    for (var i = 0; i < 7; i++) rings.push({ d: i * 140, s: 1 + Math.random() * .6, w: 6 + Math.random() * 14, a: .16 + Math.random() * .1, ox: (Math.random() - .5) * 30, oy: (Math.random() - .5) * 10 });
    var blots = []; for (i = 0; i < 26; i++) { var ang = Math.random() * Math.PI * 2, dist = 20 + Math.random() * 120; blots.push({ x: x + Math.cos(ang) * dist * 1.8, y: y + Math.sin(ang) * dist * .6, r: 4 + Math.random() * 26, d: 200 + Math.random() * 600 }); }
    function frame(now) {
      var t = now - start; ctx.clearRect(0, 0, r.width, r.height); var alive = false;
      rings.forEach(function (g) {
        var k = (t - g.d) / 2600; if (k < 0) { alive = true; return; } if (k > 1) return; alive = true;
        var rad = 10 + k * Math.max(r.width, r.height) * .55 * g.s, al = g.a * (1 - k) * (1 - k);
        ctx.save(); ctx.translate(x + g.ox, y + g.oy); ctx.scale(1.8, .55); ctx.beginPath(); ctx.arc(0, 0, rad, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(28,26,23," + al.toFixed(3) + ")"; ctx.lineWidth = g.w * (1 - k * .6); ctx.filter = "blur(" + (2 + k * 8).toFixed(1) + "px)"; ctx.stroke(); ctx.restore();
      });
      blots.forEach(function (b) {
        var k = (t - b.d) / 2200; if (k < 0) { alive = true; return; } if (k > 1) return; alive = true;
        var gr = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r * (1 + k * 2.5));
        gr.addColorStop(0, "rgba(28,26,23," + (.22 * (1 - k)).toFixed(3) + ")"); gr.addColorStop(1, "rgba(28,26,23,0)");
        ctx.fillStyle = gr; ctx.filter = "none"; ctx.beginPath(); ctx.arc(b.x, b.y, b.r * (1 + k * 2.5), 0, Math.PI * 2); ctx.fill();
      });
      if (alive) requestAnimationFrame(frame); else ctx.clearRect(0, 0, r.width, r.height);
    }
    if (!reduce) requestAnimationFrame(frame);
  }

  /* ---------- 远山：墨分五色，层层淡下去 ---------- */
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function f1(n) { return Math.round(n * 10) / 10; }
  function mountain(cx, base, w, h, R) {
    var l = cx - w / 2, r = cx + w / 2, tx = cx + (R() - .5) * w * .2, ty = base - h;
    return "M" + f1(l) + " " + base + " C" + f1(l + w * .24) + " " + f1(base - h * .3) + " " + f1(tx - w * .17) + " " + f1(ty + h * .14) + " " + f1(tx) + " " + f1(ty) +
      " C" + f1(tx + w * .13) + " " + f1(ty + h * .1) + " " + f1(r - w * .22) + " " + f1(base - h * .42) + " " + f1(r) + " " + base + "Z";
  }
  function ridge(W, base, amp, rough, R, segs) {   /* 中点位移法画一道山脊，再用二次曲线磨圆 */
    var n = segs || 64, h = new Array(n + 1), step = n, sc = amp;
    h[0] = R() * amp; h[n] = R() * amp;
    while (step > 1) { var half = step / 2; for (var i = half; i < n; i += step) h[i] = (h[i - half] + h[i + half]) / 2 + (R() - .45) * sc; sc *= rough; step = half; }
    var pts = h.map(function (v, i) { return [i / n * W, base - Math.max(0, v)]; }), d = "M0 " + (base + 200) + " L" + f1(pts[0][0]) + " " + f1(pts[0][1]);
    for (i = 1; i < pts.length - 1; i++) { var mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2; d += " Q" + f1(pts[i][0]) + " " + f1(pts[i][1]) + " " + f1(mx) + " " + f1(my); }
    return { d: d + " L" + W + " " + f1(pts[n][1]) + " L" + W + " " + (base + 200) + "Z", pts: pts };
  }
  function hillsSVG() {
    var R = rng(20261028), W = 1600, H = 520, s = '<svg class="hills" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><defs>' +
      '<linearGradient id="m0" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7d8a8b" stop-opacity=".22"/><stop offset=".55" stop-color="#7d8a8b" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="m1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#55615f" stop-opacity=".42"/><stop offset=".5" stop-color="#55615f" stop-opacity=".06"/><stop offset="1" stop-color="#55615f" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="m2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c3332" stop-opacity=".62"/><stop offset=".45" stop-color="#2c3332" stop-opacity=".12"/><stop offset="1" stop-color="#2c3332" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="m3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#171b1a" stop-opacity=".7"/><stop offset=".7" stop-color="#171b1a" stop-opacity=".2"/><stop offset="1" stop-color="#171b1a" stop-opacity=".05"/></linearGradient>' +
      '<filter id="rough" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".022 .05" numOctaves="3" seed="11"/><feDisplacementMap in="SourceGraphic" scale="12"/></filter>' +
      '<filter id="haze"><feGaussianBlur stdDeviation="2.4"/></filter><filter id="soft"><feGaussianBlur stdDeviation="12"/></filter></defs>';
    s += '<circle cx="1330" cy="70" r="24" fill="#b9473a" opacity=".28"/>';
    var r0 = ridge(W, 300, 200, .55, R, 32), r1 = ridge(W, 360, 190, .58, R, 64), r2 = ridge(W, 440, 150, .6, R, 64), r3 = ridge(W, 540, 90, .62, R, 64);
    s += '<path d="' + r0.d + '" fill="url(#m0)" filter="url(#haze)"/>';
    s += '<g filter="url(#rough)"><path d="' + r1.d + '" fill="url(#m1)"/></g><rect x="-20" y="318" width="' + (W + 40) + '" height="70" fill="#f3ecdc" opacity=".8" filter="url(#soft)"/>';
    var cun = "";   /* 皴：从山脊往下的细笔 */
    r2.pts.forEach(function (p, i) { if (i % 3 || p[1] > 410) return; for (var k = 0; k < 2; k++) { var sx = p[0] + (R() - .5) * 20, sy = p[1] + 6, ex = sx + (R() - .5) * 60, ey = sy + 30 + R() * 50; cun += "M" + f1(sx) + " " + f1(sy) + " Q" + f1((sx + ex) / 2 + (R() - .5) * 18) + " " + f1((sy + ey) / 2) + " " + f1(ex) + " " + f1(ey) + " "; } });
    s += '<g filter="url(#rough)"><path d="' + r2.d + '" fill="url(#m2)"/><path d="' + cun + '" stroke="#262b2a" stroke-opacity=".28" stroke-width="1.4" fill="none" stroke-linecap="round"/></g>';
    s += '<rect x="-20" y="420" width="' + (W + 40) + '" height="46" fill="#f3ecdc" opacity=".85" filter="url(#soft)"/>';
    s += '<g filter="url(#rough)"><path d="' + r3.d + '" fill="url(#m3)" opacity=".75"/></g>';
    var tree = "";   /* 近岸几株点叶树 */
    r3.pts.forEach(function (p, i) { if (i % 9 !== 4) return; var x = p[0], y = p[1] + 4; tree += '<path d="M' + f1(x) + ' ' + f1(y) + ' L' + f1(x + 2) + ' ' + f1(y - 34) + '" stroke="#1d201f" stroke-width="2"/>';
      for (var k = 0; k < 9; k++) tree += '<circle cx="' + f1(x + (R() - .5) * 26) + '" cy="' + f1(y - 30 - R() * 22) + '" r="' + f1(2 + R() * 3.5) + '" fill="#1d201f" opacity="' + f1(.35 + R() * .4) + '"/>'; });
    for (var i = 0; i < 3; i++) { var bx = 180 + i * 46 + R() * 30, by = 70 + R() * 40; s += '<path d="M' + f1(bx - 6) + ' ' + f1(by) + ' q6 -5 6 0 q0 -5 6 0" stroke="#2a2724" stroke-width="1.4" fill="none" opacity=".55"/>'; }
    return s + '</svg>';
  }

  /* ---------- 第一幕：开场 ---------- */
  function showOpen() {
    app.scrollTop = 0;
    app.className = "screen open";
    app.innerHTML = '<div class="scene" id="scene" aria-hidden="true"><img src="img/open-paper-clean.webp" alt=""><img class="mt" id="mt" src="img/open-paper.webp" alt=""><div class="beam"></div>' +
      '<div class="mist"></div><div class="mist m2"></div><canvas id="dust"></canvas>' + birdsSVG() + '</div><canvas id="ink" aria-hidden="true"></canvas>' +
      '<div class="stage"><div class="title" id="ttl">' + titleSVG() + '<span class="seal">HORA</span></div>' +
      '<div class="sub" id="sub">HORA 语文</div>' +
      '<svg class="qin" id="qin" viewBox="0 0 1000 120" role="button" tabindex="0" aria-label="拨一下琴弦">' +
      '<rect x="0" y="0" width="1000" height="120" fill="transparent"/>' + huiDots() +
      '<rect x="40" y="52" width="8" height="16" rx="2" fill="#3b2a1d"/><rect x="952" y="54" width="8" height="12" rx="2" fill="#3b2a1d"/>' +
      '<path class="s" d="M44 60 L956 60" stroke="#2b2620" stroke-width="1.6" fill="none" vector-effect="non-scaling-stroke"/>' +
      '<path d="M44 61.4 L956 61.4" stroke="rgba(255,255,255,.7)" stroke-width=".8" vector-effect="non-scaling-stroke"/></svg>' +
      '<div class="hint" id="hint">轻 拨 琴 弦</div>' +
      '<p class="quote" id="quote">我在世寄居，素来以你的律例为诗歌。<small>诗篇 119:54</small></p>' +
      '<button class="scrollbtn" id="bIn" type="button">入　卷</button></div>';
    var qin = document.getElementById("qin"), path = qin.querySelector(".s"), done = false, amp = 0, at = .5, t0 = 0, raf = 0;
    function vib(now) {
      var t = (now - t0) / 1000, a = amp * Math.exp(-t * 1.9), d = "M44 60";
      for (var x = 44; x <= 956; x += 8) { var u = (x - 44) / 912, sh = u < at ? u / at : (1 - u) / (1 - at); d += " L" + x + " " + (60 + a * sh * Math.sin(t * 40) + a * .3 * sh * Math.sin(t * 61 + u * 9)).toFixed(2); }
      path.setAttribute("d", d); if (a > .05) raf = requestAnimationFrame(vib); else { path.setAttribute("d", "M44 60 L956 60"); raf = 0; }
    }
    function play(ev) {
      var r = qin.getBoundingClientRect(), u = ev && ev.clientX ? (ev.clientX - r.left) / r.width : .5;
      at = Math.min(.9, Math.max(.1, u)); amp = 26; t0 = performance.now(); if (!reduce && !raf) raf = requestAnimationFrame(vib);
      pluck(done ? SCALE[Math.floor(u * 11.99)] : 98, .6);
      if (!done) {
        done = true; document.getElementById("hint").hidden = true;
        var cv = document.getElementById("ink"), sr = sheet.getBoundingClientRect();
        inkRings(cv, r.left - sr.left + r.width * at, r.top - sr.top + r.height / 2);
        var mt = document.getElementById("mt"); mt.style.setProperty("--mx", (at * 100).toFixed(1) + "%"); mt.classList.add("on"); document.getElementById("scene").classList.add("awake");
        inkTitle(at);
        ["ttl", "sub", "quote", "bIn"].forEach(function (id) { document.getElementById(id).classList.add("show"); });
      }
    }
    qin.addEventListener("pointerdown", play);
    qin.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); play(); } });
    document.getElementById("bIn").addEventListener("click", function () { ac(); if (me || teacher) showShelf(); else showLogin(); });
    dust(document.getElementById("dust"));
    if (reduce) play();
  }
  /* 光里的浮尘：在窗格光那几条斜带里慢慢往上飘 */
  function dust(cv) {
    if (!cv || reduce) return; var ctx = cv.getContext("2d"), dpr = Math.min(2, devicePixelRatio || 1), W, H, P = [];
    function size() { var r = cv.getBoundingClientRect(); W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    size(); addEventListener("resize", size);
    for (var i = 0; i < 70; i++) P.push({ x: Math.random(), y: Math.random(), r: .6 + Math.random() * 1.6, v: .00004 + Math.random() * .00012, ph: Math.random() * 6.28 });
    (function f(t) { if (!document.body.contains(cv)) return; ctx.clearRect(0, 0, W, H);
      P.forEach(function (p) { p.y -= p.v * 16; p.x += Math.sin(t / 2400 + p.ph) * .00012; if (p.y < -.02) { p.y = 1.02; p.x = Math.random(); }
        var band = Math.sin((p.x * 1.6 + p.y * .85) * 9) , a = Math.max(0, band) * .55 * (1 - p.x * .6);
        if (a < .04) return; ctx.fillStyle = "rgba(255,246,222," + a.toFixed(3) + ")"; ctx.beginPath(); ctx.arc(p.x * W, p.y * H, p.r, 0, 6.3); ctx.fill(); });
      requestAnimationFrame(f); })(0);
  }
  function birdsSVG() {
    var b = ""; [[0, 0, 1], [26, 10, .8], [48, -4, .9], [70, 14, .7], [90, 4, .75]].forEach(function (q, i) {
      b += '<g transform="translate(' + q[0] + ' ' + q[1] + ') scale(' + q[2] + ')"><path class="bird" style="animation-delay:' + (i * .17) + 's;transform-origin:7px 0" d="M0 0 q7 -7 7 0 q0 -7 7 0"/></g>'; });
    return '<svg class="birds" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice"><g transform="translate(1500 330)"><g class="flock">' + b + '</g></g></svg>';
  }
  /* 题字：墨点落在纸上，一团团洇开，洇满笔画就成了“弦歌”两个字 */
  function titleSVG() {
    return '<svg id="tsvg" viewBox="0 0 420 170" role="img" aria-label="弦歌"><defs>' +
      '<filter id="inkEdge" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency=".06" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="14"/><feGaussianBlur stdDeviation="1.2"/></filter>' +
      '<filter id="halo" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4"/></filter>' +
      '<mask id="inkMask" maskUnits="userSpaceOnUse" x="-40" y="-40" width="500" height="250"><g id="blots" filter="url(#inkEdge)"></g></mask>' +
      '<mask id="haloMask" maskUnits="userSpaceOnUse" x="-40" y="-40" width="500" height="250"><g id="blots2" filter="url(#inkEdge)"></g></mask></defs>' +
      '<g id="tHalo" mask="url(#haloMask)" filter="url(#halo)" opacity=".45"><text x="10" y="140" fill="#1c1a17">弦</text><text x="215" y="140" fill="#1c1a17">歌</text></g>' +
      '<g id="tInk" mask="url(#inkMask)"><text x="10" y="140" fill="#1c1a17">弦</text><text x="215" y="140" fill="#1c1a17">歌</text></g></svg>';
  }
  function inkTitle(at) {
    var ns = "http://www.w3.org/2000/svg", g1 = document.getElementById("blots"), g2 = document.getElementById("blots2"), halo = document.getElementById("tHalo");
    if (!g1) return;
    var R = Math.random, ox = 20 + at * 380, seeds = [];
    for (var gx = 6; gx < 416; gx += 22) for (var gy = 8; gy < 168; gy += 22) {   /* 墨点铺成网格（保证最后洇满），先落在靠近拨弦的一侧，再往两边洇 */
      var x = gx + (R() - .5) * 14, y = gy + (R() - .5) * 14, dist = Math.abs(x - ox) / 400;
      seeds.push({ x: x, y: y, r: 16 + R() * 8, t0: 200 + dist * 1700 + R() * 900, dur: 900 + R() * 700 });
    }
    seeds.forEach(function (sd) {
      [g1, g2].forEach(function (g, k) { var c = document.createElementNS(ns, "circle"); c.setAttribute("cx", sd.x); c.setAttribute("cy", sd.y); c.setAttribute("r", 0); c.setAttribute("fill", "#fff"); g.appendChild(c); (sd.el || (sd.el = []))[k] = c; });
    });
    function fill() { seeds.forEach(function (sd) { sd.el[0].setAttribute("r", sd.r * 1.6); sd.el[1].setAttribute("r", sd.r * 1.9); }); halo.setAttribute("opacity", ".12"); }
    if (reduce) return fill();
    var start = performance.now();
    (function frame(now) {
      var t = now - start, live = false;
      seeds.forEach(function (sd) {
        var k = Math.min(1, Math.max(0, (t - sd.t0) / sd.dur)), e = 1 - Math.pow(1 - k, 3); if (k < 1) live = true;
        sd.el[0].setAttribute("r", (sd.r * 1.6 * e).toFixed(1)); sd.el[1].setAttribute("r", (sd.r * 1.9 * e).toFixed(1));
      });
      halo.setAttribute("opacity", (.45 - Math.min(1, t / 3600) * .33).toFixed(3));
      if (live || t < 3600) requestAnimationFrame(frame); else fill();
    })(start);
  }
  function huiDots() {   /* 琴徽：十三个，中间最大 */
    var pos = [1 / 8, 1 / 6, 1 / 5, 1 / 4, 1 / 3, 2 / 5, 1 / 2, 3 / 5, 2 / 3, 3 / 4, 4 / 5, 5 / 6, 7 / 8], s = "";
    pos.forEach(function (p, i) { var x = 44 + 912 * p, r = i === 6 ? 5 : (i === 5 || i === 7 ? 4 : 3.2);
      s += '<circle cx="' + x.toFixed(1) + '" cy="40" r="' + r + '" fill="#efe6d2" stroke="#b9a785" stroke-width=".8"/><circle cx="' + (x - r * .3).toFixed(1) + '" cy="' + (40 - r * .3).toFixed(1) + '" r="' + (r * .35).toFixed(1) + '" fill="#fffaf0"/>'; });
    return s;
  }

  /* ---------- 顶栏 ---------- */
  function top(back) {
    var who = teacher ? "老师" : (me ? esc(me.cls) + " · " + esc(me.name) : "");
    return '<header class="top">' + (back ? '<button class="back" id="bBack" type="button">← ' + back + '</button>' : "") +
      '<button class="brand" id="bHome" type="button" aria-label="回到开场"><span class="seal">弦歌</span><b>弦歌</b><small>HORA 语文</small></button><span class="sp"></span>' +
      (!teacher && me ? '<button class="chip" id="bWd" type="button">换装间</button><button class="chip" id="bTie" type="button">我的字帖</button>' : "") +
      '<button class="chip" id="bSnd" type="button" aria-pressed="' + sndOn + '">' + (sndOn ? "琴声 开" : "琴声 关") + '</button>' +
      (who ? '<span class="who">' + who + '</span><button class="chip" id="bOut" type="button">换人</button>' : "") + '</header>';
  }
  function wireTop(onBack) {
    var b;
    if ((b = document.getElementById("bBack"))) b.addEventListener("click", onBack);
    document.getElementById("bHome").addEventListener("click", showOpen);
    document.getElementById("bSnd").addEventListener("click", function () { sndOn = !sndOn; put("hora-snd", sndOn); this.setAttribute("aria-pressed", sndOn); this.textContent = sndOn ? "琴声 开" : "琴声 关"; if (sndOn) pluck(392, .4); });
    if ((b = document.getElementById("bTie"))) b.addEventListener("click", showTie);
    if ((b = document.getElementById("bWd"))) b.addEventListener("click", function () { showWardrobe(1); });
    if ((b = document.getElementById("bOut"))) b.addEventListener("click", function () {
      try { sessionStorage.removeItem("hora-session"); sessionStorage.removeItem("hora-teacher"); } catch (e) {}
      var l = get("hora-last"); if (l) { delete l.pin; put("hora-last", l); }
      me = null; teacher = false; showLogin();
    });
  }

  /* ---------- 签到 ---------- */
  function showLogin() {
    app.scrollTop = 0;
    app.className = "screen login"; history.replaceState(null, "", location.pathname);
    var last = get("hora-last") || {};
    app.innerHTML = '<form class="jian" id="lg" novalidate><h2><span class="seal">弦歌</span>签到</h2><p>班级码、名字、4 位数字都照老师发给你的写。换电脑、换手机时写同样的三项，就从上次读到的地方接着读。</p>' +
      '<label class="field"><span class="lab">班级码（老师给的）</span><input id="lg-cls" autocomplete="off" autocapitalize="characters" placeholder="比如 G8A"></label>' +
      '<label class="field"><span class="lab">名字（照老师给的写）</span><input id="lg-name" autocomplete="off" maxlength="12" placeholder="比如 王小明"></label>' +
      '<label class="field"><span class="lab">4 位数字（老师发的）</span><input id="lg-pin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" placeholder="••••"></label>' +
      '<label class="keep"><input type="checkbox" id="lg-keep" checked> 在这台设备上记住我（公用电脑请不要勾）</label>' +
      '<label class="field" id="lg-p2f" hidden><span class="lab">再输一遍 4 位数字（确认）</span><input id="lg-pin2" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" placeholder="••••"></label>' +
      '<button class="scrollbtn" id="lg-go" type="submit">入　学</button><p class="msg" id="lg-msg"></p>' +
      '<button class="tlink" id="lg-t" type="button">我是老师</button></form>';
    var c = document.getElementById("lg-cls"), n = document.getElementById("lg-name"), p = document.getElementById("lg-pin"),
      btn = document.getElementById("lg-go"), msg = document.getElementById("lg-msg"), keep = document.getElementById("lg-keep"),
      p2f = document.getElementById("lg-p2f"), p2 = document.getElementById("lg-pin2"), newFor = "";
    /* 改了班级码或名字，就收起“确认数字”那一栏 */
    [c, n].forEach(function (x) { x.addEventListener("input", function () { if (newFor) { newFor = ""; p2f.hidden = true; p2.value = ""; btn.textContent = "入　学"; say(""); } }); });
    c.value = last.cls || ""; n.value = last.name || ""; (c.value ? (n.value ? p : n) : c).focus();
    function say(t, err) { msg.textContent = t; msg.className = "msg" + (err ? " err" : ""); }
    document.getElementById("lg").addEventListener("submit", function (e) {
      e.preventDefault();
      var m = { cls: normCls(c.value), name: normName(n.value), pin: p.value.trim() };
      if (!m.cls) { c.focus(); return say("请写班级码。", 1); }
      if (!m.name) { n.focus(); return say("请写名字或昵称。", 1); }
      if (!/^\d{4}$/.test(m.pin)) { p.focus(); return say("请写 4 位数字。", 1); }
      function ok() { me = m; put("hora-session", m, sessionStorage); put("hora-last", keep.checked ? m : { cls: m.cls, name: m.name }); pluck(392, .4); if (get("hora-avatar") && get("hora-buddy")) showShelf(); else showWardrobe(1, showShelf); }
      if (!SITE.sheetUrl) return ok();
      var who = m.cls + "|" + m.name, isNew = newFor === who;
      if (isNew && p2.value.trim() !== m.pin) { p2.focus(); return say("两次输入的数字不一样，请再输一遍。", 1); }
      btn.disabled = true; say("正在核对……");
      if (isNew) m.isNew = true;
      api("login", m).then(function (j) { delete m.isNew; if (j && j.name) m.name = j.name; ok(); }).catch(function (er) {
        btn.disabled = false; delete m.isNew;
        if (er.code === "new") {
          newFor = who; p2f.hidden = false; p2.value = ""; p2.focus(); btn.textContent = "确认入学";
          say("没有找到“" + m.cls + " · " + m.name + "”的签到记录。\n第一次来：请在上面再输一遍你定的 4 位数字，点“确认入学”。\n来过的同学：请检查班级码和名字，要和第一次写的一模一样。", 1);
        }
        else if (er.code === "roster") say("班级码、名字或数字不对。请照老师发给你的三项，一字不差地写；还是不行，请问老师。", 1);
        else if (er.code === "pin") say("数字不对。请想想你第一次签到时定的 4 位数字；实在想不起来，请找老师帮你重置。", 1);
        else if (er.code === "cls") say("没有这个班级码，请问一下老师。", 1);
        else say("连不上老师的表格，可能是网络问题，请稍后再试。", 1);
      });
    });
    document.getElementById("lg-t").addEventListener("click", function () { teacher = true; me = null; try { sessionStorage.setItem("hora-teacher", "1"); } catch (e) {} showShelf(); });
  }

  /* ---------- 换装间：先给“我”选发型和衣服，再选伴学（清弦或长歌）和伴学的衣服 ---------- */
  var HAIR = { g1: "齐肩短发", g2: "长直发", g3: "低马尾", g4: "戴眼镜的中长发", b1: "自然短发", b2: "侧分短发", b3: "微刘海短发", b4: "戴细框眼镜的短发" };
  var OPEN_HAIR = { g1: 1, b1: 1 };   /* 第一阶段只有 G1、B1 有表情，其余发型待开放 */
  var OUTFIT = { daily: ["日常装", "外套、连帽卫衣、球鞋，背着双肩包。"], sport: ["运动装", "白色和深蓝拼色的运动外套、运动裤。"], formal: ["正式装", "学校制服：藏蓝西装外套、白衬衫、领带。"], ancient: ["古代装", "宋代学子穿的襕衫：交领宽袖，长及脚面。"] };
  var LOCKED = { ancient: "学完《岳阳楼记》解锁" };
  var BUDDY = {
    qingxian: { name: "清弦", look: "瓜子脸，棕褐色自然卷发扎高马尾，棕色眼睛。", mood: "细心、温暖、善于倾听", trait: "喜欢阅读和观察；关注细节，喜欢分析人物情感；乐于分享，也会给你鼓励。", motto: "慢慢来，我们一起把书读懂。", talk: "常说“我注意到……”“你是怎么想的？”" },
    changge: { name: "长歌", look: "偏长脸，棕褐色微卷发，棕色眼睛，圆框眼镜。", mood: "理性、开朗、擅长分析", trait: "逻辑思维强，善于分析；喜欢讨论和思考不同观点；鼓励你从不同角度看问题。", motto: "不同的角度，会看到更完整的世界。", talk: "常说“我觉得……”“等等，那……”" }
  };
  var FACE = { qingxian: { blink: 1 }, changge: { blink: 1 }, g1: { blink: 1 }, b1: { blink: 1 } };
  var HEADC = { qingxian: [488, 346], changge: [493, 214], g: [480, 318], b: [470, 214] };
  function look() { var a = get("hora-avatar") || {}; return { hair: OPEN_HAIR[a.hair] ? a.hair : "g1", outfit: OUTFIT[a.outfit] && !LOCKED[a.outfit] ? a.outfit : "daily" }; }
  function buddy() { var b = get("hora-buddy") || {}; return { who: BUDDY[b.who] ? b.who : "qingxian", outfit: OUTFIT[b.outfit] && !LOCKED[b.outfit] ? b.outfit : "daily" }; }
  /* 清弦、G1 的底模是张嘴笑；平时叠上“闭嘴微笑”的表情补丁 */
  function rest(h) { return h === "qingxian" || h === "g1" ? "idle" : ""; }
  function restImg(h, style, outfit) { return rest(h) ? '<img class="rf" src="chars/' + h + '_' + (outfit || "daily") + '_face_idle.webp" alt=""' + (style ? ' style="' + style + '"' : "") + '>' : ""; }
  function headImg(h, outfit, box) { var c = HEADC[h] || HEADC[h.charAt(0)], sc = box / 316, st = 'width:' + Math.round(1024 * sc) + 'px;left:' + Math.round(box / 2 - c[0] * sc) + 'px;top:' + Math.round(box / 2 - c[1] * sc) + 'px';
    return '<span class="hd" style="width:' + box + 'px;height:' + box + 'px"><img src="chars/' + h + '_outfit_' + outfit + '.webp" alt="" style="' + st + '">' + restImg(h, st, outfit) + '</span>'; }
  function showWardrobe(step, done) {
    app.className = "screen"; app.scrollTop = 0; location.hash = "wardrobe";
    var L1 = look(), B1 = buddy(), isMe = step !== 2;
    var cur = isMe ? L1 : B1, hair = isMe ? L1.hair : B1.who;
    var h = top() + '<div class="page wd"><h1 class="h1">换装间</h1><p class="lead">' + (isMe ? "第一步：选“我”的样子和衣服。在课文里，“我”就是你。" : "第二步：选一位伴学和他的衣服。伴学陪你读完所有课文。") + '</p>' +
      '<div class="wd-grid"><div class="wd-stage"><div class="wd-fig" id="wdFig"><img class="b" src="chars/' + hair + '_outfit_' + cur.outfit + '.webp" alt=""><img class="f" alt="" hidden></div><div class="wd-card" id="wdCard"></div></div><div class="wd-opts">';
    if (isMe) {
      [["女生", "g"], ["男生", "b"]].forEach(function (grp) {
        h += '<div class="wd-h">' + grp[0] + '</div><div class="wd-row">';
        for (var i = 1; i <= 4; i++) { var id = grp[1] + i, open = OPEN_HAIR[id];
          h += '<button type="button" class="opt hair' + (id === hair ? " on" : "") + (open ? "" : " locked") + '" data-h="' + id + '"' + (open ? "" : ' aria-disabled="true"') + ' aria-label="' + grp[0] + ' ' + HAIR[id] + (open ? "" : "，待开放") + '">' + headImg(id, "daily", 92) + '<span>' + HAIR[id] + '</span>' + (open ? "" : '<em>待开放</em>') + '</button>'; }
        h += '</div>';
      });
    } else {
      h += '<div class="wd-h">伴学</div><div class="wd-row two">';
      ["qingxian", "changge"].forEach(function (id) { h += '<button type="button" class="opt buddy' + (id === hair ? " on" : "") + '" data-b="' + id + '">' + headImg(id, cur.outfit, 110) + '<span>' + BUDDY[id].name + '</span><small>' + BUDDY[id].mood + '</small></button>'; });
      h += '</div>';
    }
    h += '<div class="wd-h">衣服</div><div class="wd-row">';
    ["daily", "sport", "formal", "ancient"].forEach(function (o) { var lk = o === "ancient" && get("hora-unlock-ancient") ? "" : LOCKED[o];
      h += '<button type="button" class="opt cloth' + (o === cur.outfit ? " on" : "") + (lk ? " locked" : "") + '" data-o="' + o + '"' + (lk ? ' aria-disabled="true"' : "") + ' aria-label="' + OUTFIT[o][0] + (lk ? "，" + lk : "") + '"><span class="th"><img class="tb" src="chars/' + hair + '_outfit_' + o + '.webp" alt="">' + restImg(hair, "", o) + '</span><span>' + OUTFIT[o][0] + '</span>' + (lk ? '<em>' + lk + '</em>' : "") + '</button>'; });
    h += '</div></div></div><div class="wd-act">' + (isMe ? '<span class="wd-step"><b>一　我</b>　·　二　伴学</span><button class="scrollbtn" id="wdNext" type="button">下一步：选伴学</button>' : '<button class="back" id="wdPrev" type="button">← 上一步</button><span class="wd-step">一　我　·　<b>二　伴学</b></span><button class="scrollbtn" id="wdDone" type="button">完　成</button>') + '</div></div>';
    app.innerHTML = h; wireTop();
    var fig = document.getElementById("wdFig"), bimg = fig.querySelector(".b"), fimg = fig.querySelector(".f"), card = document.getElementById("wdCard");
    /* 表情图先在后台加载好再换上；还没加载好时不显示，免得把上一位的五官闪在新人物身上 */
    var faceWant = "";
    function setFace(src) { faceWant = src || ""; if (!src) { fimg.hidden = true; return; }
      var pre = new Image(); pre.onload = function () { if (faceWant !== src) return; fimg.src = src; fimg.hidden = false; }; pre.src = src; }
    function paint() {
      var who = isMe ? cur.hair : cur.who;
      bimg.src = "chars/" + who + "_outfit_" + cur.outfit + ".webp";
      if (isMe) { var girl = who.charAt(0) === "g";
        card.innerHTML = '<h3>我 <small>' + esc(me ? me.name : "") + '</small></h3><p>' + HAIR[who] + ' · ' + OUTFIT[cur.outfit][0] + '</p><p class="d">' + (girl ? "独立、好奇、爱思考，自然随和、有亲和力。" : "独立、沉稳、喜欢探索，好奇心强。") + '</p><p class="d">' + OUTFIT[cur.outfit][1] + '</p>';
      } else { var B = BUDDY[who];
        card.innerHTML = '<h3>' + B.name + ' <small>伴学 · 和你同龄</small></h3><p class="d">' + B.look + '</p><dl><dt>性格</dt><dd>' + B.mood + '</dd><dt>特点</dt><dd>' + B.trait + '</dd><dt>说话</dt><dd>' + B.talk + '</dd></dl><p class="motto">“' + B.motto + '”</p>'; }
      [].forEach.call(app.querySelectorAll(".opt.cloth"), function (b) { var o = b.getAttribute("data-o"), th = b.querySelector(".th"); b.classList.toggle("on", o === cur.outfit); th.innerHTML = '<img class="tb" src="chars/' + who + '_outfit_' + o + '.webp" alt="">' + restImg(who, "", o); });
      /* 新的身体图加载好了再叠表情，避免一瞬间新脸叠在旧身体上 */
      setFace(""); var rw = rest(who);
      function showFace() { if (rw) setFace("chars/" + who + "_" + cur.outfit + "_face_idle.webp"); }
      if (bimg.complete && bimg.naturalWidth && bimg.getAttribute("src") === "chars/" + who + "_outfit_" + cur.outfit + ".webp") showFace(); else bimg.onload = showFace;
      [].forEach.call(app.querySelectorAll(".opt.hair,.opt.buddy"), function (b) { b.classList.toggle("on", (b.getAttribute("data-h") || b.getAttribute("data-b")) === who); });
      fig.classList.remove("swap"); void fig.offsetWidth; fig.classList.add("swap");
      if (isMe) put("hora-avatar", { hair: cur.hair, outfit: cur.outfit }); else put("hora-buddy", { who: cur.who, outfit: cur.outfit });
    }
    function lockedTip(b, t) { var e = b.querySelector("em"); if (e) { e.textContent = t; b.classList.remove("shake"); void b.offsetWidth; b.classList.add("shake"); } }
    [].forEach.call(app.querySelectorAll(".opt"), function (b, i) {
      b.addEventListener("click", function () {
        if (b.classList.contains("locked")) return lockedTip(b, b.classList.contains("cloth") ? LOCKED[b.getAttribute("data-o")] : "以后开放");
        if (b.getAttribute("data-h")) cur.hair = b.getAttribute("data-h");
        if (b.getAttribute("data-b")) cur.who = b.getAttribute("data-b");
        if (b.getAttribute("data-o")) cur.outfit = b.getAttribute("data-o");
        pluck(SCALE[(i + 3) % 12], .35); paint();
      });
    });
    var blinkT = setInterval(function () { if (!document.body.contains(fig)) return clearInterval(blinkT); var who = isMe ? cur.hair : cur.who; if (!FACE[who] || reduce) return;
      if (!bimg.complete || bimg.getAttribute("src") !== "chars/" + who + "_outfit_" + cur.outfit + ".webp") return;
      var wb = who, ob = cur.outfit; setFace("chars/" + wb + "_" + ob + "_face_blink.webp");
      setTimeout(function () { if ((isMe ? cur.hair : cur.who) !== wb || cur.outfit !== ob) return; setFace(rest(wb) ? "chars/" + wb + "_" + ob + "_face_idle.webp" : ""); }, 160); }, 3200);
    var nx = document.getElementById("wdNext"), pv = document.getElementById("wdPrev"), dn = document.getElementById("wdDone");
    if (nx) nx.addEventListener("click", function () { showWardrobe(2, done); });
    if (pv) pv.addEventListener("click", function () { showWardrobe(1, done); });
    if (dn) dn.addEventListener("click", function () {
      var back = null; try { back = sessionStorage.getItem("hora-return"); sessionStorage.removeItem("hora-return"); } catch (e) {}
      if (back) { location.href = back; return; } (done || showShelf)();
    });
    paint();
  }

  /* ---------- 十二册 ---------- */
  function showShelf() {
    app.scrollTop = 0;
    app.className = "screen"; history.replaceState(null, "", location.pathname);
    var mine = me ? guessGrade(me.cls) : 0;
    var tiers = [["小学", "一至六年级", 1, 6, "green"], ["初中", "七至九年级", 7, 9, "indigo"], ["高中", "十至十二年级", 10, 12, "ochre"]];
    var h = top() + '<div class="page"><h1 class="h1">十二册</h1><p class="lead">' + (teacher ? "老师：选一册，再选课文；进课文后输老师密码，就能看全班的作答。" : "一个年级一册。手指或鼠标划过书脊，听听琴弦。") + '</p><div class="shelf">';
    var rows = [[tiers[0]], [tiers[1], tiers[2]]];
    rows.forEach(function (row, ri) {
      h += '<div class="tier" data-row="' + ri + '"><div class="tier-h">' + row.map(function (t) { return '<div style="grid-column:span ' + (t[3] - t[2] + 1) + '"><b>' + t[0] + '</b><span>' + t[1] + '</span></div>'; }).join("") + '</div><div class="books">';
      row.forEach(function (t) {
        for (var g = t[2]; g <= t[3]; g++) {
          var n = byGrade(g).length;
          h += '<button type="button" class="book' + (n ? "" : " none") + (g === mine && n ? " mine" : "") + '" data-g="' + g + '" style="--cover:url(img/cover-' + t[4] + '.webp)"' +
            (n ? ' aria-label="' + NUM[g] + '年级，' + n + ' 篇课文"' : ' aria-label="' + NUM[g] + '年级，待开放"') + '>' +
            '<span class="slip">' + NUM[g] + '年级</span>' + (n ? '<span class="seal">弦歌</span>' : "") + '<span class="count">' + (n ? n + " 篇" : "待开放") + '</span></button>';
        }
      });
      h += '</div>' + stringSVG(36) + '</div>';
    });
    app.innerHTML = h + '</div><p class="lead" style="margin-top:22px">还没有课文的年级，老师做好后会在这里开放。</p></div>';
    wireTop();
    [].forEach.call(app.querySelectorAll(".tier"), function (tier) {
      var str = makeString(tier.querySelector(".string"), { amp: 9 }), last = 0;
      [].forEach.call(tier.querySelectorAll(".book"), function (b) {
        var g = +b.getAttribute("data-g");
        function sound() { var br = b.getBoundingClientRect(), tr = tier.getBoundingClientRect(); str.pluck((br.left + br.width / 2 - tr.left) / tr.width, byGrade(g).length ? 1 : .4); var now = Date.now(); if (now - last > 90) { last = now; pluck(SCALE[g - 1], byGrade(g).length ? .45 : .2); } }
        b.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") sound(); });
        b.addEventListener("focus", sound);
        b.addEventListener("click", function () { if (!byGrade(g).length) { b.querySelector(".count").textContent = "还没有课文"; sound(); return; } put("hora-grade", g); showAlbum(g); });
      });
    });
  }

  /* ---------- 册页 ---------- */
  function showAlbum(g) {
    app.scrollTop = 0;
    app.className = "screen"; location.hash = "album";
    var list = byGrade(g), lastId = get("hora-lastLesson");
    var h = top("十二册") + '<div class="page"><h1 class="h1">' + NUM[g] + '年级 · 册页</h1><p class="lead">左右翻页，一页一篇课文。</p><div class="album" id="album">';
    h += '<section class="leaf front"><div class="leaf-in"><div class="row2"><div class="big">' + NUM[g] + '年级</div><div class="yin"><div>一句话说得合宜，<br>就如金苹果<br>在银网子里。<small>箴言 25:11</small></div><div>愿我口中的言语、<br>心里的意念<br>在你面前蒙悦纳。<small>诗篇 19:14</small></div></div></div></div></section>';
    list.forEach(function (l, i) {
      var dd = teacher ? 0 : doneDays(l), pt = l.picText, pic = l.pic ? '<figure class="photo"><img src="' + esc(l.pic) + '" alt="' + esc(l.picAlt || "《" + l.title + "》") + '" loading="lazy">' +
        (pt ? '<div class="pp-top">' + esc(pt.top) + '</div><div class="pp-day">' + esc(pt.day) + '</div><div class="pp-lunar">' + esc(pt.lunar) + '</div><div class="pp-week">' + esc(pt.week) + '</div>' : "") + '</figure>' : '<span style="font-family:var(--f-brush);font-size:3rem">' + esc(l.title) + '</span>';
      h += '<section class="leaf" data-i="' + i + '"><div class="leaf-in"><div class="pic"><div class="wash"></div>' + pic + '</div>' +
        '<div class="colo"><h3>' + esc(l.title) + '</h3><span class="au">' + esc(l.author) + '</span><p>' + esc(l.blurb || "") + '</p>' + (dd ? '<span class="seal">' + (l.unit === "课时" ? "第" + NUM[Math.min(dd, 12)] + "课时" : "已读" + NUM[Math.min(dd, 12)] + "日") + '</span>' : "") + '</div></div>' +
        '<div class="act"><button class="scrollbtn" type="button" data-go="' + i + '">' + (teacher ? "开　卷（老师）" : dd ? "接着读" : "开　卷") + '</button><span class="prog">' + (l.open >= l.total ? "共 " + l.total + " " + (l.unit || "天") : "已开放 " + (l.open || "?") + " / " + (l.total || "?") + " " + (l.unit || "天")) + (dd ? (l.unit === "课时" ? "　·　你学到了第 " + dd + " 课时" : "　·　你读完了 " + dd + " 天") : "") + '</span></div></section>';
    });
    for (var k = 0; k < 2; k++) h += '<section class="leaf blank"><div class="leaf-in"><div class="pic"><span>待　续</span></div></div></section>';
    app.innerHTML = h + '</div><p class="swipe">← 翻　页 →</p></div>';
    wireTop(showShelf);
    var album = document.getElementById("album");
    [].forEach.call(album.querySelectorAll("[data-go]"), function (b) { b.addEventListener("click", function () { go(list[+b.getAttribute("data-go")]); }); });
    if (!reduce && "IntersectionObserver" in window) {   /* 翻到哪一页，那页的画像墨一样晕开 */
      var seen = {}, idx = 0, io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting && !seen[e.target.dataset.k]) { seen[e.target.dataset.k] = 1; e.target.classList.add("ink"); pluck(SCALE[(idx++ + g) % 12], .25); } }); }, { root: album, threshold: .6 });
      [].forEach.call(album.querySelectorAll(".leaf:not(.front)"), function (l, i) { l.dataset.k = i; io.observe(l); });
    }
    var cur = 0; list.forEach(function (l, i) { if (l.id === lastId) cur = i; });
    requestAnimationFrame(function () { var t = album.querySelector('.leaf[data-i="' + cur + '"]'); if (t && list.length) album.scrollLeft = t.offsetLeft - (album.clientWidth - t.clientWidth) / 2; });
    album.addEventListener("wheel", function (e) { if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { album.scrollLeft += e.deltaY; e.preventDefault(); } }, { passive: false });
  }

  /* ---------- 我的字帖 ---------- */
  function showTie() {
    var n = Math.min(allDone(), TIE.length), seenN = get("hora-tie-seen") || 0, o = document.createElement("div");
    o.className = "ov"; o.innerHTML = '<div class="tie" role="dialog" aria-label="我的字帖"><button class="x" type="button" aria-label="关上">×</button><h3>我的字帖</h3>' +
      '<p>' + (n ? "每读完一天，帖上就写好一个字。你已经写了 " + n + " 个字。" : "每读完一天，帖上就写好一个字。读完第一天，这里会写下第一个字。") + '（记在这台设备上）</p><div class="grid9">' +
      TIE.split("").map(function (ch, i) { return '<div class="cell' + (i < n ? " done" : "") + (i < n && i >= seenN ? " new" : "") + '" style="animation-delay:' + ((i - seenN) * .25) + 's"><span>' + ch + '</span></div>'; }).join("") +
      new Array((7 - TIE.length % 7) % 7 + 1).join('<div class="cell"></div>') + '</div><p style="margin-top:12px;font-size:.82rem">帖文：歌罗西书 3:16（和合本）。</p></div>';
    sheet.append(o); put("hora-tie-seen", n);
    [].forEach.call(o.querySelectorAll(".cell.new span"), function (s, i) { s.style.animationDelay = (i * .3) + "s"; });
    function close() { o.remove(); }
    o.querySelector(".x").addEventListener("click", close); o.addEventListener("click", function (e) { if (e.target === o) close(); });
    addEventListener("keydown", function k(e) { if (e.key === "Escape") { close(); removeEventListener("keydown", k); } });
  }

  /* ---------- 开始 ---------- */
  try { teacher = sessionStorage.getItem("hora-teacher") === "1"; } catch (e) {}
  me = teacher ? null : sess();
  if (me) put("hora-session", me, sessionStorage);
  var g0 = get("hora-grade");
  if (me && location.hash === "#wardrobe") showWardrobe(1);
  else if ((me || teacher) && /^#(album|map)$/.test(location.hash) && g0 && byGrade(g0).length) showAlbum(g0);
  else showOpen();
  try { document.fonts.load('150px "Ma Shan Zheng"', "弦歌"); } catch (e) {}
})();
