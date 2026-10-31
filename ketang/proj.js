/* 课堂投屏引擎（方向一）
 * 一块屏幕＋一位助教：范公在左，长歌、清弦在右，画面在中间，对话在下面。
 * 助教只需要点“继续”（或空格键、翻页遥控器）；需要选择时，屏幕上会出现按钮。
 * 课文内容全部在课文配置（如 yyl-1.js）里，这个文件不放具体课文。
 */
(function () {
  "use strict";
  var L = window.PROJ_LESSON, A = L.assets, CAST = L.cast;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem("hora-proj-" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem("hora-proj-" + k, JSON.stringify(v)); } catch (e) {} }
  };

  /* ---------- 步骤展开 ---------- */
  var STEPS = [], SEGSTART = [], IDS = {};
  L.segments.forEach(function (sg, si) {
    SEGSTART.push(STEPS.length);
    sg.steps.forEach(function (st) { st._seg = si; if (st.id) IDS[st.id] = STEPS.length; STEPS.push(st); });
  });

  /* ---------- 画布与缩放 ---------- */
  var stage = $("#stage");
  stage.style.setProperty("--paper-img", "url(" + A.paper + ")");
  var vis = $(".vis");
  function fit() {
    var s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    stage.style.transform = "scale(" + s + ")";
  }
  window.addEventListener("resize", fit); fit();
  if (A.font) {
    try { var ff = new FontFace("WenKai", "url(" + A.font + ")"); ff.load().then(function (f) { document.fonts.add(f); }).catch(function () {}); } catch (e) {}
  }

  /* ---------- 顶栏 ---------- */
  $(".ttl").innerHTML = esc(L.title) + "<small>" + esc(L.short || L.sub) + "</small>";
  var segBox = $(".segs");
  L.segments.forEach(function (sg, si) {
    var b = document.createElement("button");
    b.textContent = (si + 1) + " " + (sg.s || sg.t);
    if (sg.ask) b.className = "ask";
    b.title = "跳到这个环节（约 " + sg.min + " 分钟）";
    b.onclick = function () { go(SEGSTART[si]); };
    segBox.appendChild(b);
  });

  /* ---------- 人物：三张全身立绘同一比例（原图都是 1024×1536、脚底同一条线），所以高矮自然 ---------- */
  var actors = {}, SC = 0.62, TOP = 1110 - 1536 * SC;
  var castBox = $(".cast");
  ["fan", "cg", "qx"].forEach(function (k) {
    var c = CAST[k], el = document.createElement("div");
    el.className = "actor " + k + (k === "fan" ? " away" : "");
    var body = document.createElement("div"); body.className = "body"; el.appendChild(body);
    var base = new Image(), face = new Image();
    base.src = A.chars + c.sprite + "_outfit_" + c.outfit + ".webp";
    [base, face].forEach(function (im) {
      im.style.width = Math.round(1024 * SC) + "px"; im.style.left = c.x + "px"; im.style.top = Math.round(TOP) + "px";
      im.alt = ""; body.appendChild(im);
    });
    castBox.appendChild(el);
    var fs = {};
    Object.keys(c.face || {}).forEach(function (f) {
      if (c.face[f]) { fs[f] = A.chars + c.sprite + "_" + c.outfit + "_face_" + c.face[f] + ".webp"; var p = new Image(); p.src = fs[f]; }
    });
    actors[k] = { el: el, face: face, fs: fs, mood: "idle", talking: false, blinkAt: 0 };
    setFace(k, "idle");
  });
  function setFace(k, f) {
    var a = actors[k]; if (!a) return;
    var src = a.fs[f] || (f === "idle" ? null : a.fs.idle) || null;
    if (src) { if (a.face.dataset.src !== src) { a.face.src = src; a.face.dataset.src = src; } a.face.style.visibility = "visible"; }
    else a.face.style.visibility = "hidden";
  }
  function moodFace(k) { var a = actors[k]; return a.mood === "think" ? "think" : a.mood === "happy" ? "happy" : "idle"; }
  // 眨眼和说话动嘴（有表情图的人物）
  setInterval(function () {
    var now = Date.now();
    Object.keys(actors).forEach(function (k) {
      var a = actors[k]; if (!Object.keys(a.fs).length) return;
      if (a.talking) { a.tick = !a.tick; setFace(k, a.tick ? "talk" : moodFace(k)); return; }
      if (!a.blinkAt) a.blinkAt = now + 2500 + Math.random() * 3500;
      if (now >= a.blinkAt && now < a.blinkAt + 160) setFace(k, "blink");
      else if (now >= a.blinkAt + 160) { a.blinkAt = now + 3000 + Math.random() * 3500; setFace(k, moodFace(k)); }
    });
  }, 150);

  function spotlight(who) {
    Object.keys(actors).forEach(function (k) { actors[k].el.classList.toggle("off", !!who && who !== k); });
  }
  function talking(who, on) {
    var a = actors[who]; if (!a) return;
    a.talking = on; a.el.classList.toggle("talk", on);
    if (!on) setFace(who, moodFace(who));
  }

  /* ---------- 声音 ---------- */
  var VOICE_IDX = window.PROJ_VOICE || {};   // 录好的 mp3：{哈希: 秒数}
  var soundOn = store.get("sound", true), speed = store.get("speed", 1);
  var zhVoices = [];
  function loadVoices() {
    if (!("speechSynthesis" in window)) return;
    zhVoices = speechSynthesis.getVoices().filter(function (v) {
      return /^(zh|cmn)/i.test(v.lang) && !/HK|TW|yue|Hant|粤|台/i.test(v.lang + v.name);
    });
  }
  if ("speechSynthesis" in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
  function pickVoice(who) {
    var saved = store.get("voice-" + who, "");
    if (saved) { var sv = zhVoices.filter(function (v) { return v.name === saved; })[0]; if (sv) return sv; }
    var pref = (CAST[who] && CAST[who].voice && CAST[who].voice.prefer) || [];
    for (var i = 0; i < pref.length; i++) {
      var p = pref[i].toLowerCase();
      var hit = zhVoices.filter(function (v) { return v.name.toLowerCase().indexOf(p) >= 0; });
      if (hit.length) { hit.sort(function (a, b) { return /natural|online/i.test(b.name) - /natural|online/i.test(a.name); }); return hit[0]; }
    }
    return zhVoices[0] || null;
  }
  function voiceText(st) {
    var t = (st.v || st.say || "").replace(/（[^）]*）/g, "");
    (L.voiceFix || []).forEach(function (p) { t = t.split(p[0]).join(p[1]); });
    return t.replace(/[“”‘’「」]/g, "").replace(/——/g, "，").replace(/……/g, "，");
  }
  function hash(s) { var h = 0x811c9dc5; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return ("0000000" + h.toString(16)).slice(-8); }
  var curAudio = null;
  function stopVoice() {
    if (curAudio) { try { curAudio.pause(); } catch (e) {} curAudio = null; }
    if ("speechSynthesis" in window) speechSynthesis.cancel();
  }
  // 说一句：返回 Promise，说完 resolve；token 变了（换了步骤）就停
  function say(who, text, token) {
    return new Promise(function (res) {
      var est = Math.max(1.2, text.length * 0.26) / speed;
      var done = false, fin = function () { if (!done) { done = true; res(); } };
      if (!soundOn || !text) { setTimeout(fin, est * 1000 * (soundOn ? 1 : 0.6)); return; }
      var h = hash(who + "|" + text);
      if (VOICE_IDX[h]) {
        var au = new Audio("voice/" + h + ".mp3"); curAudio = au; au.playbackRate = speed;
        au.onended = fin; au.onerror = function () { speakTTS(); };
        au.play().catch(function () { speakTTS(); });
        setTimeout(fin, (VOICE_IDX[h] / speed + 3) * 1000);
        return;
      }
      speakTTS();
      function speakTTS() {
        if (!("speechSynthesis" in window) || !zhVoices.length) { setTimeout(fin, est * 1000); return; }
        var v = pickVoice(who), cv = (CAST[who] && CAST[who].voice) || {};
        var parts = text.split(/(?<=[。！？；])/).filter(function (x) { return x.trim(); });
        var left = parts.length;
        parts.forEach(function (p) {
          var u = new SpeechSynthesisUtterance(p);
          if (v) u.voice = v; u.lang = (v && v.lang) || "zh-CN";
          u.rate = (cv.rate || 1) * speed; u.pitch = cv.pitch || 1;
          u.onend = u.onerror = function () { if (--left <= 0) fin(); };
          speechSynthesis.speak(u);
        });
        setTimeout(fin, (est * 1.6 + 3) * 1000);   // 有的浏览器不触发 onend
      }
    });
  }

  /* ---------- 提示音 ---------- */
  var actx = null;
  function chime(n) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var t = actx.currentTime;
      for (var i = 0; i < (n || 1); i++) {
        [659, 988].forEach(function (f, j) {
          var o = actx.createOscillator(), g = actx.createGain();
          o.type = "sine"; o.frequency.value = f; o.connect(g); g.connect(actx.destination);
          var t0 = t + i * 0.7 + j * 0.18;
          g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.2);
          o.start(t0); o.stop(t0 + 1.3);
        });
      }
    } catch (e) {}
  }

  /* ---------- 画面 ---------- */
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function rubyfy(s) {
    var h = esc(s);
    Object.keys(L.ruby || {}).sort(function (a, b) { return b.length - a.length; }).forEach(function (k) {
      h = h.split(k).join("\u0001" + k + "\u0002");
    });
    return h.replace(/\u0001([^\u0002]+)\u0002/g, function (m, k) { return "<ruby>" + k + "<rt>" + L.ruby[k] + "</rt></ruby>"; });
  }
  function markify(html, marks) {
    (marks || []).forEach(function (m) {
      var mm = esc(m);
      if (html.indexOf(mm) >= 0) html = html.split(mm).join('<span class="mk">' + mm + "</span>");
    });
    return html;
  }
  var curVisKey = "", curBoardKey = "", curScene = "";
  var sceneEl = $(".scene"), heroEl = $(".heroover"), picEl = $(".picover");
  function setScene(img, soft) {
    var key = img + (soft ? "|soft" : "");
    if (key === curScene) return; curScene = key;
    sceneEl.style.backgroundImage = "url(" + A.img + img + ")";
    sceneEl.classList.toggle("soft", !!soft);
  }
  function renderVis(v, board, corner, force) {
    var key = JSON.stringify(v) + "|" + (corner || "");
    var hasBoard = !!(board && board.length && v && /^(text|map)$/.test(v.type));
    var bkey = hasBoard ? JSON.stringify(board) : "";
    if (key === curVisKey && bkey === curBoardKey && !force) return;
    var prev = curVisKey ? JSON.parse(curVisKey.slice(0, curVisKey.lastIndexOf("|")) || "null") : null;
    curVisKey = key; curBoardKey = bkey;
    vis.innerHTML = ""; heroEl.innerHTML = ""; picEl.innerHTML = "";
    if (!v) return;
    if (v.type === "hero" || v.type === "end") {
      setScene(v.type === "end" ? "lake.webp" : "tower.webp", false);
      heroEl.innerHTML = v.type === "end" ? '<div class="bye">下次见</div>'
        : '<div class="vt">' + esc(L.title) + '</div><div class="vs">北宋　范仲淹</div><div class="seal">弦歌</div>';
      return;
    }
    if (v.type === "pic") {
      setScene(v.img, false);
      var h = '<div class="cap">' + esc((v.cap || "").replace(/（示意）/, "")) + (/示意/.test(v.cap || "") ? "<b>示意</b>" : "") + "</div>";
      if (v.big) h += '<div class="big">' + v.big.map(function (c) { return "<span>" + esc(c) + "</span>"; }).join("") + "</div>";
      if (v.line) { var ln = esc(v.line); (v.big || []).forEach(function (c) { ln = ln.split(c).join("<b>" + c + "</b>"); }); h += '<div class="line">' + ln + "</div>"; }
      picEl.innerHTML = h;
      return;
    }
    setScene(v.scene || (v.type === "map" ? "lake.webp" : "tower.webp"), true);
    vis.innerHTML = '<div class="rod"></div><div class="silk"><div class="paper' + (hasBoard ? " withboard" : "") + '"></div></div><div class="rod"></div>';
    var paper = vis.querySelector(".paper");
    var p = document.createElement("div"); p.className = "pane";
    if (prev && prev.type === v.type && v.type !== "task") p.classList.add("still");
    if (v.type === "text") {
      p.className += " textpane";
      v.paras.forEach(function (pk) {
        var d = document.createElement("div"); d.className = "para" + (v.paras.length > 1 ? " sm" : "");
        var lab = { p1: "第一段", p2: "第二段", p3: "第三段", p4: "第四段", p5: "第五段" }[pk] || "";
        var html = '<span class="pl">' + lab + (v.from ? "（后半）" : "") + "</span>";
        L.paras[pk].forEach(function (s, i) {
          if (v.from && i < v.from) return;
          var id = pk + "-" + i, cls = "sen";
          if (v.hi && v.hi.length) cls += v.hi.indexOf(id) >= 0 ? " hi" : " dim";
          html += '<span class="' + cls + '" data-s="' + id + '">' + markify(rubyfy(s), v.mark) + "</span>";
        });
        d.innerHTML = html; p.appendChild(d);
      });
    } else if (v.type === "map") {
      p.className += " mappane"; p.innerHTML = MAP.svg(v.layers || [], v.zoom, hasBoard ? 590 : 924) + (corner ? '<div class="corner">' + esc(corner) + "</div>" : "");
    } else {
      p.className += " taskpane";
      var head = v.type === "task" ? esc(v.n || "") + (v.pen ? ' <span class="pen ' + v.pen + '"><i></i>' + { black: "黑笔", blue: "蓝笔", red: "红笔" }[v.pen] + "</span>" : "")
               : v.type === "retell" ? "同桌复述" : '小测 <span class="pen black"><i></i>黑笔</span>';
      var items = v.q || v.items || [];
      p.innerHTML = '<div class="tn">' + head + "</div>" +
        (v.type === "quiz" ? '<div class="quiz">' + items.map(function (x) { return "<div>" + esc(x) + "</div>"; }).join("") + "</div>"
                           : "<ol>" + items.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ol>") +
        '<div class="big-clock" hidden><span class="num">0:00</span><span class="lab"></span><span class="bar"><i></i></span></div>';
    }
    paper.appendChild(p);
    if (hasBoard) {
      var b = document.createElement("div"); b.className = "board";
      b.innerHTML = '<div class="bt">黑板</div>' + board.map(function (x) {
        var i = x.indexOf("＝"); return "<p>" + (i > 0 ? "<b>" + esc(x.slice(0, i)) + "</b>" + esc(x.slice(i)) : esc(x)) + "</p>";
      }).join("");
      paper.appendChild(b);
    }
  }
  function highlight(id, cls) {
    vis.querySelectorAll(".sen").forEach(function (e) {
      e.classList.remove("hi", "echo", "dim");
      if (id) { if (e.dataset.s === id) e.classList.add(cls || "hi"); else e.classList.add("dim"); }
    });
  }

  /* ---------- 地图（示意，按经纬度画） ---------- */
  var MAP = (function () {
    var box = { n: 35.6, s: 25.6, w: 108.2, e: 116.2 }; // 全图
    var south = { n: 31.8, s: 25.8, w: 108.6, e: 115.4 }; // 洞庭湖附近
    var W = 910;
    function P(lon, lat, b) { var H = 564; var sx = W / (b.e - b.w), sy = H / (b.n - b.s); var k = Math.min(sx, sy);
      var ox = (W - (b.e - b.w) * k) / 2, oy = (H - (b.n - b.s) * k) / 2; return [ox + (lon - b.w) * k, oy + (b.n - lat) * k]; }
    // 平滑曲线（Catmull-Rom 转三次贝塞尔）
    function path(pts, b, closed) {
      var q = pts.map(function (x) { return P(x[0], x[1], b); }), n = q.length, d = "M" + q[0][0].toFixed(1) + " " + q[0][1].toFixed(1);
      var at = function (i) { return closed ? q[(i + n) % n] : q[Math.max(0, Math.min(n - 1, i))]; };
      for (var i = 0; i < (closed ? n : n - 1); i++) {
        var p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
        d += " C" + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + " " + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + " " +
             (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + " " + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + " " + p2[0].toFixed(1) + " " + p2[1].toFixed(1);
      }
      return d + (closed ? " Z" : "");
    }
    var yangtze = [[108.3, 30.55], [109.0, 30.85], [109.9, 31.07], [110.4, 30.9], [111.3, 30.7], [112.2, 30.33], [112.7, 29.95], [113.17, 29.45], [113.7, 29.9], [114.3, 30.6], [115.1, 30.2], [116.2, 29.75]];
    var huang = [[110.2, 34.6], [111.5, 34.8], [113.0, 34.9], [114.3, 34.95], [115.3, 35.3], [116.2, 35.6]];
    var xiang = [[111.0, 25.6], [111.6, 26.4], [112.6, 26.9], [112.95, 28.2], [112.85, 28.85]];
    var xiao = [[111.3, 25.6], [111.45, 26.0], [111.6, 26.4]];
    var lake = [[111.95, 29.05], [112.2, 29.38], [112.55, 29.5], [112.9, 29.47], [113.1, 29.3], [113.05, 29.05], [112.8, 28.86], [112.45, 28.76], [112.1, 28.82]];
    var C = { kaifeng: [114.35, 34.8], baling: [113.13, 29.36], dengzhou: [112.08, 32.68], wuxia: [109.9, 31.07] };
    function dot(c, b, label, sub, color, dx, dy) {
      var p = P(c[0], c[1], b); color = color || "#2a241b";
      return '<g><circle cx="' + p[0] + '" cy="' + p[1] + '" r="11" fill="' + color + '" stroke="#fff" stroke-width="3"/>' +
        '<text x="' + (p[0] + (dx || 18)) + '" y="' + (p[1] + (dy || 10)) + '" text-anchor="' + ((dx || 18) < 0 ? "end" : "start") + '" font-family="WenKai,KaiTi,serif" font-size="36" fill="' + color + '" stroke="#efe6d0" stroke-width="6" paint-order="stroke">' + label +
        (sub ? '<tspan font-size="22" font-family="Noto Sans SC,sans-serif" fill="#6f6455" dx="8">' + sub + "</tspan>" : "") + "</text></g>";
    }
    function svg(layers, zoom, width) {
      W = width || 910;
      var b = zoom === "south" ? south : box, has = function (k) { return layers.indexOf(k) >= 0; };
      var o = '<svg viewBox="0 0 ' + W + ' 564" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="示意地图">';
      o += '<rect width="' + W + '" height="564" fill="#f3ead6"/>';
      o += '<path d="' + path(huang, b) + '" fill="none" stroke="#c9b98f" stroke-width="7" stroke-linecap="round"/>';
      o += '<path d="' + path(yangtze, b) + '" fill="none" stroke="#7fa8b5" stroke-width="' + (zoom ? 12 : 8) + '" stroke-linecap="round" stroke-linejoin="round"/>';
      o += '<path d="' + path(xiang, b) + '" fill="none" stroke="#8fb3bd" stroke-width="' + (zoom ? 8 : 5) + '" stroke-linecap="round"/>';
      o += '<path d="' + path(xiao, b) + '" fill="none" stroke="#8fb3bd" stroke-width="' + (zoom ? 6 : 4) + '" stroke-linecap="round"/>';
      o += '<path d="' + path(lake, b, true) + '" fill="#9cc2cb" stroke="#6f9fab" stroke-width="2"/>';
      var lp = zoom ? P(111.85, 29.05, b) : P(112.4, 28.75, b);
      o += '<text x="' + lp[0] + '" y="' + (lp[1] + (zoom ? 12 : 30)) + '" text-anchor="' + (zoom ? "end" : "middle") + '" font-family="WenKai,KaiTi,serif" font-size="' + (zoom ? 34 : 26) + '" fill="#2e6a6c" stroke="#efe6d0" stroke-width="5" paint-order="stroke">洞庭湖</text>';
      var yp = P(zoom ? 111.0 : 115.2, zoom ? 31.0 : 30.75, b);
      o += '<text x="' + yp[0] + '" y="' + yp[1] + '" font-family="WenKai,KaiTi,serif" font-size="28" fill="#4f7f8b" stroke="#efe6d0" stroke-width="5" paint-order="stroke">长江</text>';
      if (!zoom) { var hp = P(110.6, 35.15, b); o += '<text x="' + hp[0] + '" y="' + hp[1] + '" font-family="WenKai,KaiTi,serif" font-size="24" fill="#a8956a">黄河</text>'; }
      if (has("lineB")) { var a = P(C.kaifeng[0], C.kaifeng[1], b), z = P(C.baling[0], C.baling[1], b); o += '<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + z[0] + '" y2="' + z[1] + '" stroke="#a3382a" stroke-width="5" stroke-dasharray="14 10"/>'; }
      if (has("lineD")) { var a2 = P(C.kaifeng[0], C.kaifeng[1], b), z2 = P(C.dengzhou[0], C.dengzhou[1], b); o += '<line x1="' + a2[0] + '" y1="' + a2[1] + '" x2="' + z2[0] + '" y2="' + z2[1] + '" stroke="#a3382a" stroke-width="5" stroke-dasharray="14 10"/>'; }
      if (has("kaifeng")) o += dot(C.kaifeng, b, "开封", "北宋京城", "#2a241b");
      if (has("baling")) o += dot(C.baling, b, "巴陵", "今湖南岳阳", "#a3382a");
      if (has("dengzhou")) o += dot(C.dengzhou, b, "邓州", "今河南邓州", "#a3382a", -20, 10);
      if (has("wuxia")) {
        o += dot(C.wuxia, b, "巫峡", "", "#a3382a", 10, -26);
        var seg = yangtze.slice(2, 8).reverse();
        o += '<path d="' + path(seg, b) + '" fill="none" stroke="#a3382a" stroke-width="6" stroke-dasharray="4 12" stroke-linecap="round" marker-end="url(#ar)"/>';
        var wp = P(110.2, 30.35, b); o += '<text x="' + wp[0] + '" y="' + wp[1] + '" font-family="Noto Sans SC,sans-serif" font-size="24" fill="#a3382a" stroke="#efe6d0" stroke-width="5" paint-order="stroke">北通：经长江西上</text>';
      }
      if (has("xiaoxiang")) {
        var xp = P(113.05, 27.4, b), sp = P(110.55, 25.95, b);
        o += '<text x="' + xp[0] + '" y="' + xp[1] + '" font-family="WenKai,KaiTi,serif" font-size="32" fill="#a3382a" stroke="#efe6d0" stroke-width="5" paint-order="stroke">湘水</text>';
        o += '<text x="' + sp[0] + '" y="' + sp[1] + '" font-family="WenKai,KaiTi,serif" font-size="32" fill="#a3382a" stroke="#efe6d0" stroke-width="5" paint-order="stroke">潇水</text>';
        o += '<path d="' + path(xiang.slice(1), b) + '" fill="none" stroke="#a3382a" stroke-width="6" stroke-dasharray="4 12" stroke-linecap="round" marker-end="url(#ar)"/>';
        var np = P(112.2, 26.55, b); o += '<text x="' + np[0] + '" y="' + np[1] + '" font-family="Noto Sans SC,sans-serif" font-size="24" fill="#a3382a" stroke="#efe6d0" stroke-width="5" paint-order="stroke" text-anchor="end">南极：从南面流进湖</text>';
      }
      o += '<defs><marker id="ar" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#a3382a"/></marker></defs>';
      // 指北针与说明
      o += '<g transform="translate(' + (W - 50) + ',60)"><path d="M0 -30 L10 6 L0 0 L-10 6 Z" fill="#2a241b"/><text y="34" text-anchor="middle" font-size="22" font-family="Noto Sans SC,sans-serif" fill="#2a241b">北</text></g>';
      o += '<text x="16" y="550" font-size="16" font-family="Noto Sans SC,sans-serif" fill="#8a7f6c">示意图，位置为近似</text>';
      return o + "</svg>";
    }
    return { svg: svg };
  })();

  /* ---------- 计时 ---------- */
  var timer = null;
  function startTimer(t, token) {
    stopTimer();
    var total = t.s, left = t.s, halfDone = false;
    var big = vis.querySelector(".big-clock"); if (big) { big.hidden = false; big.querySelector(".lab").textContent = t.label || ""; }
    var top = $(".tclock"); top.classList.add("run");
    function paint() {
      var m = Math.floor(left / 60), s = left % 60, txt = m + ":" + (s < 10 ? "0" : "") + s;
      top.textContent = txt;
      if (big) { big.querySelector(".num").textContent = txt; big.querySelector(".bar i").style.width = (100 * left / total) + "%"; big.classList.toggle("done", left <= 0); }
    }
    paint();
    timer = { paused: false, id: setInterval(function () {
      if (timer.paused || token !== TOKEN) return;
      left--; paint();
      if (t.half && !halfDone && left <= Math.floor(total / 2)) { halfDone = true; chime(1); toast(t.half); }
      if (left <= 0) { stopTimer(true); chime(2); setTip("时间到。点“继续”往下。"); $("#next").classList.add("pulse"); }
    }, 1000) };
  }
  function stopTimer(keep) {
    if (timer) { clearInterval(timer.id); timer = null; }
    var top = $(".tclock"); top.classList.remove("run"); if (!keep) top.textContent = "";
  }

  /* ---------- 对话框 ---------- */
  var txtEl = $(".dlg .txt"), whoEl = $(".dlg .who"), tipEl = $(".dlg .tip");
  var typing = null;
  function setTip(s) { tipEl.textContent = s || ""; }
  function showLine(who, text, isNote) {
    if (typing) { clearInterval(typing); typing = null; }
    whoEl.className = "who w-" + (isNote ? "note" : who || "none");
    whoEl.textContent = isNote ? "请大家" : (CAST[who] ? CAST[who].name : "");
    txtEl.className = "txt" + (isNote ? " note" : "");
    var html = esc(text).replace(/（([^）]*)）/g, '<span class="sd">（$1）</span>');
    if (isNote) { txtEl.innerHTML = html; return; }
    // 逐字出现
    var plain = text, i = 0;
    txtEl.innerHTML = "";
    typing = setInterval(function () {
      i += 2; if (i >= plain.length) { clearInterval(typing); typing = null; txtEl.innerHTML = html; return; }
      txtEl.textContent = plain.slice(0, i);
    }, 45 / speed);
  }
  function finishTyping() { if (typing) { clearInterval(typing); typing = null; var st = STEPS[cur]; if (st && st.say) txtEl.innerHTML = esc(st.say).replace(/（([^）]*)）/g, '<span class="sd">（$1）</span>'); } }

  /* ---------- 助教回应按钮 ---------- */
  var respEl = $(".resp");
  function showRespond(r, token) {
    respEl.hidden = false;
    respEl.innerHTML = "<h3>助教按钮</h3>";
    var box = document.createElement("div"); box.className = "opts";
    r.opts.forEach(function (o, i) {
      var b = document.createElement("button");
      b.innerHTML = "<b>【" + esc(o.k) + "】</b><span>" + esc(o.d) + '</span><span class="k">键盘 ' + (i + 1) + "</span>";
      b.onclick = function () { respond(o, b, token); };
      box.appendChild(b);
    });
    respEl.appendChild(box);
    setTip(r.tip);
  }
  function respond(o, b, token) {
    if (b.classList.contains("used")) { toast("这个回应已经播过，学生的发言已记下 ✓"); return; }
    b.classList.add("used");
    stopVoice(); spotlight(o.who); showLine(o.who, o.say); talking(o.who, true);
    say(o.who, voiceText(o), token).then(function () { talking(o.who, false); });
  }

  /* ---------- 主流程 ---------- */
  var cur = -1, TOKEN = 0, auto = store.get("auto", true), autoTimer = null;
  function stateAt(n) {
    var sg = STEPS[n]._seg, v = null, board = [], corner = "", fanIn = false;
    for (var i = 0; i <= n; i++) {
      var s = STEPS[i];
      if (s.who === "fan" || s.enter === "fan" || s.read) fanIn = true;
      if (s._seg !== sg) continue;
      if (s.vis) v = s.vis;
      if (s.board) board = s.board;
      if (s.corner !== undefined) corner = s.corner;
    }
    if (!v) for (var j = n; j >= 0; j--) if (STEPS[j].vis) { v = STEPS[j].vis; break; }
    return { v: v, board: board, corner: corner, fanIn: fanIn };
  }
  function go(n) {
    if (n < 0 || n >= STEPS.length) return;
    TOKEN++; var token = TOKEN;
    stopVoice(); stopTimer(); clearTimeout(autoTimer);
    ["cg", "qx", "fan"].forEach(function (k) { talking(k, false); });
    cur = n; var st = STEPS[n], S = stateAt(n);
    // 顶栏
    segBox.querySelectorAll("button").forEach(function (b, i) { b.classList.toggle("on", i === st._seg); b.classList.toggle("done", i < st._seg); });
    renderVis(S.v, S.board, S.corner);
    actors.fan.el.classList.toggle("away", !S.fanIn);
    respEl.hidden = true;
    $("#next").classList.remove("pulse");
    setTip(st.tip || "");
    // 人物表情
    ["cg", "qx"].forEach(function (k) { actors[k].mood = st.think ? "think" : (st.who === k && st.face) ? st.face : "idle"; setFace(k, moodFace(k)); });
    // 额外按钮
    var extra = $(".extra"); extra.innerHTML = "";
    (st.btns || []).forEach(function (b) {
      var e = document.createElement("button"); e.className = "btn gold"; e.textContent = b.label;
      e.onclick = function () { go(IDS[b.go]); }; extra.appendChild(e);
    });
    $("#prev").disabled = n === 0;
    var last = n === STEPS.length - 1;
    $("#next").textContent = last ? "完" : "继续 ▶";
    // 步骤本身
    var run;
    if (st.read) run = doRead(st, token);
    else if (st.say) { spotlight(st.who); showLine(st.who, st.say); talking(st.who, true); run = say(st.who, voiceText(st), token).then(function () { if (token === TOKEN) talking(st.who, false); }); }
    else if (st.note) { spotlight(null); showLine(null, st.note, true); run = Promise.resolve(); }
    else { spotlight(null); run = Promise.resolve(); }
    if (st.note && st.say) { /* 不会同时出现 */ }
    if (st.timer) { if (!st.say && !st.read) showLine(null, st.note || st.timer.label, true); startTimer(st.timer, token); }
    if (st.respond) { spotlight(null); showLine(null, "被点到的同学，请读一读你写的。", true); showRespond(st.respond, token); }
    run.then(function () {
      if (token !== TOKEN) return;
      var stop = st.hold || st.timer || st.respond || st.btns || last;
      var nextSeg = !last && STEPS[n + 1]._seg !== st._seg;
      if (nextSeg) { setTip("本环节结束。下一环节：" + L.segments[STEPS[n + 1]._seg].t + "。准备好了点“继续”。"); $("#next").classList.add("pulse"); return; }
      if (stop) { if (!st.timer) $("#next").classList.add("pulse"); return; }
      if (auto) autoTimer = setTimeout(function () { if (token === TOKEN) go(n + 1); }, st.note ? 2600 : 900);
      else $("#next").classList.add("pulse");
    });
    store.set("pos", n);
  }
  function doRead(st, token) {
    var r = st.read, list = [];
    r.paras.forEach(function (pk) { L.paras[pk].forEach(function (s, i) { list.push({ id: pk + "-" + i, s: s }); }); });
    spotlight("fan");
    if (st.note) showLine(null, st.note, true); else showLine("fan", r.mode === "echo" ? "（一句一句跟读）" : "（范读）");
    var i = 0;
    return new Promise(function (res) {
      (function next() {
        if (token !== TOKEN) return;
        if (i >= list.length) { highlight(null); talking("fan", false); res(); return; }
        var it = list[i++];
        highlight(it.id, "hi"); talking("fan", true);
        say("fan", voiceText({ say: it.s }), token).then(function () {
          if (token !== TOKEN) return; talking("fan", false);
          if (r.mode === "echo") {
            highlight(it.id, "echo");
            var wait = Math.max(1600, it.s.length * 330) / speed;
            setTimeout(next, wait);
          } else setTimeout(next, 250);
        });
      })();
    });
  }
  function next() {
    if (typing) { finishTyping(); return; }
    if (cur < STEPS.length - 1) go(cur + 1);
  }
  function prev() { if (cur > 0) go(cur - 1); }

  /* ---------- 控件 ---------- */
  $("#next").onclick = next; $("#prev").onclick = prev;
  txtEl.onclick = next;
  var autoBtn = $("#auto"), sndBtn = $("#snd");
  function paintToggles() { autoBtn.setAttribute("aria-pressed", auto); autoBtn.textContent = auto ? "自动播放：开" : "自动播放：关"; sndBtn.setAttribute("aria-pressed", soundOn); sndBtn.textContent = soundOn ? "声音：开" : "声音：关"; }
  autoBtn.onclick = function () { auto = !auto; store.set("auto", auto); paintToggles(); if (auto && !STEPS[cur].hold && !typing) {} };
  sndBtn.onclick = function () { soundOn = !soundOn; store.set("sound", soundOn); if (!soundOn) stopVoice(); paintToggles(); };
  paintToggles();
  $("#full").onclick = function () { var d = document.documentElement; if (!document.fullscreenElement) (d.requestFullscreen || d.webkitRequestFullscreen || function () {}).call(d); else document.exitFullscreen(); };
  $("#sheet").onclick = function () { window.open(A.sheet, "_blank"); };
  $("#set").onclick = openSettings;
  document.addEventListener("keydown", function (e) {
    if ($(".dialog") && !$(".dialog").hidden) { if (e.key === "Escape") $(".dialog").hidden = true; return; }
    var k = e.key;
    if (k === " " || k === "Enter" || k === "ArrowRight" || k === "PageDown" || k === "ArrowDown") { e.preventDefault(); if (!$(".cover").hidden) start(); else next(); }
    else if (k === "ArrowLeft" || k === "PageUp" || k === "ArrowUp") { e.preventDefault(); prev(); }
    else if (/^[1-9]$/.test(k) && !respEl.hidden) { var bs = respEl.querySelectorAll("button"); if (bs[+k - 1]) bs[+k - 1].click(); }
    else if (k === "f" || k === "F") $("#full").click();
    else if (k === "p" || k === "P") { if (timer) { timer.paused = !timer.paused; toast(timer.paused ? "计时暂停" : "计时继续"); } }
  });

  var toastT = null;
  function toast(s) { var t = $(".toast"); t.textContent = s; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(function () { t.hidden = true; }, 2200); }

  function openSettings() {
    loadVoices();
    var d = $(".dialog"); d.hidden = false;
    var h = "<h3>声音设置</h3>";
    h += '<div class="hint">没有录音的台词，用这台电脑自带的中文语音读。用 Microsoft Edge 浏览器打开，能用到更自然的“晓晓、云扬、云健”等声音。共找到 ' + zhVoices.length + " 种中文声音。</div>";
    ["fan", "cg", "qx"].forEach(function (k) {
      var cv = pickVoice(k);
      h += "<label><b>" + CAST[k].name + '</b><select data-k="' + k + '">' + zhVoices.map(function (v) {
        return '<option value="' + esc(v.name) + '"' + (cv && cv.name === v.name ? " selected" : "") + ">" + esc(v.name) + "</option>"; }).join("") +
        '</select><button class="btn ghost" data-try="' + k + '">试听</button></label>';
    });
    h += '<label><b>语速</b><select id="spd">' + [0.85, 0.9, 1, 1.1, 1.2].map(function (x) { return '<option value="' + x + '"' + (x === speed ? " selected" : "") + ">" + (x === 1 ? "正常" : x < 1 ? "慢一点（" + x + "）" : "快一点（" + x + "）") + "</option>"; }).join("") + "</select></label>";
    h += '<div class="hint">键盘：空格／→／翻页遥控器＝继续；←＝上一步；1–5＝助教回应按钮；P＝暂停计时；F＝全屏。</div>';
    h += '<div style="display:flex;justify-content:flex-end"><button class="btn" id="setok">好了</button></div>';
    d.querySelector(".box").innerHTML = h;
    d.querySelectorAll("select[data-k]").forEach(function (s) { s.onchange = function () { store.set("voice-" + s.dataset.k, s.value); }; });
    d.querySelectorAll("[data-try]").forEach(function (b) { b.onclick = function () { var k = b.dataset.try; stopVoice(); say(k, k === "fan" ? "诸位好。我姓范，名仲淹。" : k === "cg" ? "同学们好！我是长歌。" : "同学们好，我是清弦。", TOKEN); }; });
    $("#spd").onchange = function () { speed = +this.value; store.set("speed", speed); };
    $("#setok").onclick = function () { d.hidden = true; };
  }

  /* ---------- 开始 ---------- */
  function start() {
    $(".cover").hidden = true;
    chime(0); // 解锁声音
    loadVoices();
    go(Math.max(0, startAt));
  }
  setScene("tower.webp", false);
  var startAt = 0;
  var saved = store.get("pos", 0);
  var resumeBtn = $("#resume");
  if (saved > 0 && saved < STEPS.length) { resumeBtn.hidden = false; resumeBtn.textContent = "接着上次（第 " + (STEPS[saved]._seg + 1) + " 环节）"; resumeBtn.onclick = function () { startAt = saved; start(); }; }
  $("#begin").onclick = function () { startAt = 0; start(); };
  window.HORA_PROJ = { go: go, steps: STEPS, cur: function () { return cur; } };   // 方便检查
  $(".cover h1").textContent = L.title;
  $(".cover .sub").textContent = L.sub;
  document.title = L.title + " · 课堂投屏";
})();
