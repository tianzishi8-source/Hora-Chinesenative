/* 课堂投屏引擎（方向一）
 * 一块屏幕＋一位助教：范公在左，长歌、清弦在右，画面在中间，对话在下面。
 * 助教只需要点“继续”（或空格键、翻页遥控器）；需要选择时，屏幕上会出现按钮。
 * 课文内容全部在课文配置（如 yyl-1.js）里，这个文件不放具体课文。
 */
(function () {
  "use strict";
  var L = window.PROJ_LESSON, A = L.assets, CAST = L.cast;
  if (L.layout) document.documentElement.classList.add("lay-" + L.layout);
  var UA = navigator.userAgent;
  if (/Safari/.test(UA) && !/Chrome|Chromium|CriOS|FxiOS|Edg|Android/.test(UA)) document.documentElement.classList.add("is-safari");
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem("hora-proj-" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem("hora-proj-" + k, JSON.stringify(v)); } catch (e) {} }
  };

  /* ---------- 步骤展开 ---------- */
  var STEPS = [], SEGSTART = [], IDS = {};
  function splitLong(st) {   // 太长的台词拆成几步（每步不超过约 56 字），对话框放得下；录音也按拆开后的句子录
    var MAX = 56;
    if (!st.say || st.v || st.say.length <= MAX) return [st];
    var parts = st.say.match(/[^。！？；]+[。！？；]*|[。！？；]+/g) || [st.say], chunks = [], cur = "";
    parts.forEach(function (p) { if (cur && (cur + p).length > MAX) { chunks.push(cur); cur = p; } else cur += p; });
    if (cur) chunks.push(cur);
    if (chunks.length < 2) return [st];
    var tail = ["hold", "copy", "btns", "timer", "tip", "respond", "id"];
    return chunks.map(function (c, i) {
      var o = {};
      if (i === 0) Object.keys(st).forEach(function (k) { if (tail.indexOf(k) < 0) o[k] = st[k]; });
      else { o.who = st.who; if (st.face) o.face = st.face; }
      if (i === chunks.length - 1) tail.forEach(function (k) { if (st[k] !== undefined) o[k] = st[k]; });
      o.say = c; return o;
    });
  }
  // 读逐句翻译库里的句子：步骤写 sent:"p1-1", part:"src"|"tr"（默认 tr），pre/post 可在前后加话；台词就是库里的原文或译文，库改了台词跟着改
  function resolveSent(st) {
    if (!st.sent) return st;
    var x = (window.YK_SENTS || []).filter(function (y) { return y.id === st.sent; })[0];
    var o = {}; Object.keys(st).forEach(function (k) { o[k] = st[k]; });
    o.say = (st.pre || "") + (x ? (st.part === "src" ? x.src : x.tr) : "（缺句子 " + st.sent + "）") + (st.post || "");
    return o;
  }
  L.segments.forEach(function (sg, si) {
    SEGSTART.push(STEPS.length);
    sg.steps.forEach(function (st00) { (st00.ladder && window.PROJ_LADDER ? window.PROJ_LADDER(st00, L.lead) : [st00]).forEach(function (st0) { splitLong(resolveSent(st0)).forEach(function (st) { st._seg = si; if (st.id) IDS[st.id] = STEPS.length; STEPS.push(st); }); }); });
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
  var castBox = $(".cast"), LEAD = L.lead || "fan", LEAD_ENTERS = L.leadEnters !== false;
  Object.keys(CAST).forEach(function (k) {
    var c = CAST[k], el = document.createElement("div");
    el.className = "actor " + k + (k === LEAD && LEAD_ENTERS ? " away" : "");
    var body = document.createElement("div"); body.className = "body"; el.appendChild(body);
    var place = function (im) { im.style.width = Math.round(1024 * SC) + "px"; im.style.left = c.x + "px"; im.style.top = Math.round(TOP) + "px"; im.alt = ""; im.decoding = "sync"; body.appendChild(im); return im; };
    var base = place(new Image()); base.src = A.chars + c.sprite + "_outfit_" + c.outfit + ".webp";
    var fs = {}, layers = {};
    Object.keys(c.face || {}).forEach(function (f) {
      if (!c.face[f] || f === "talk") return;
      fs[f] = A.chars + c.sprite + "_" + c.outfit + "_face_" + c.face[f] + ".webp";
      var im = place(new Image()); im.className = "fc"; im.style.visibility = "hidden"; im.src = fs[f]; layers[f] = im;
    });
    var mouth = place(new Image()); mouth.className = "mouth";
    if (c.face && c.face.talk) { fs.talk = A.chars + c.sprite + "_" + c.outfit + "_face_" + c.face.talk + ".webp"; mouth.src = fs.talk; } else mouth.style.display = "none";
    castBox.appendChild(el);
    actors[k] = { el: el, layers: layers, shown: null, mouth: mouth, fs: fs, mood: "idle", talking: false, blinkAt: 0, open: 0, holdTo: 0 };
    setFace(k, "idle");
  });
  function setFace(k, f) {
    var a = actors[k]; if (!a) return;
    var want = a.layers[f] ? f : null;
    if (want === a.shown) return;
    if (want) a.layers[want].style.visibility = "visible";    // 先显新的，再藏旧的：中间不会有一帧没有脸
    if (a.shown && a.layers[a.shown]) a.layers[a.shown].style.visibility = "hidden";
    a.shown = want;
  }
  // 不说话时才用心情表情（思考、开心）；说话时用平常的脸，嘴巴另外一层慢慢开合
  function restFace(k) { var a = actors[k]; return a.talking ? "idle" : a.mood === "think" ? "think" : a.mood === "happy" ? "happy" : "idle"; }
  function setMouth(a, open) { if (a.open !== open) { a.open = open; a.mouth.style.opacity = open ? 1 : 0; } }
  // 嘴型：有录音时跟着声音大小开合（停顿时闭嘴）；没有录音时慢慢地开合
  var analyser = null, abuf = null;
  function level() {
    if (!analyser) return -1;
    analyser.getByteTimeDomainData(abuf);
    var sum = 0; for (var i = 0; i < abuf.length; i++) { var v = (abuf[i] - 128) / 128; sum += v * v; }
    return Math.sqrt(sum / abuf.length);
  }
  var lipUsesAudio = false;
  setInterval(function () {
    var now = Date.now(), lv = lipUsesAudio ? level() : -1;
    Object.keys(actors).forEach(function (k) {
      var a = actors[k]; if (!a.fs.talk) return;
      if (a.talking) {
        if (now < a.holdTo) return;
        var open = lv >= 0 ? lv > 0.035 : !a.open;
        setMouth(a, open);
        a.holdTo = now + (lv >= 0 ? (open ? 170 : 120) : (open ? 200 + Math.random() * 120 : 160 + Math.random() * 220));
        return;
      }
      setMouth(a, false);
      if (!a.blinkAt) a.blinkAt = now + 2500 + Math.random() * 3500;
      if (now >= a.blinkAt && now < a.blinkAt + 160) setFace(k, "blink");
      else if (now >= a.blinkAt + 160) { a.blinkAt = now + 3000 + Math.random() * 3500; setFace(k, restFace(k)); }
    });
  }, 60);

  function spotlight(who) {
    Object.keys(actors).forEach(function (k) { actors[k].el.classList.toggle("off", !!who && who !== k); });
  }
  function talking(who, on) {
    var a = actors[who]; if (!a) return;
    a.talking = on; a.el.classList.toggle("talk", on); a.holdTo = 0;
    if (!on) setMouth(a, false);
    setFace(who, restFace(who));
  }

  /* ---------- 声音 ---------- */
  var VOICE_IDX = window.PROJ_VOICE || {};   // 录好的 mp3：{哈希: 秒数}
  var soundOn = store.get("sound", true), speed = store.get("speed", 1), boost = store.get("boost", 2), boostNode = null;
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
  var curAudio = null, curSrc = null;
  function stopVoice() {
    if (curAudio) { try { curAudio.pause(); } catch (e) {} curAudio = null; }
    if (curSrc) { try { curSrc.onended = null; curSrc.stop(); } catch (e) {} curSrc = null; }
    sayOwner = null;
    if ("speechSynthesis" in window) speechSynthesis.cancel();
  }
  function getCtx() { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); return actx; }
  function outNode() {   // 增益＋压缩＋口型分析，所有录音都走这一条
    var c = getCtx();
    if (!analyser) {
      analyser = c.createAnalyser(); analyser.fftSize = 512; abuf = new Uint8Array(analyser.fftSize);
      boostNode = c.createGain(); boostNode.gain.value = boost;
      var comp = c.createDynamicsCompressor(); comp.threshold.value = -20; comp.knee.value = 8; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
      boostNode.connect(comp); comp.connect(analyser); analyser.connect(c.destination);
    }
    return boostNode;
  }
  function clipURL(h) { return "voice/" + h + ".mp3?v=" + (window.PROJ_VOICE_V || ""); }
  // 下载（原始 mp3 全留在内存里，一节课几 MB）＋解码（解码后的只留最近 40 句）
  var RAW = {}, DEC = {}, DEC_ORDER = [];
  function fetchRaw(h, tries) {
    if (RAW[h]) return RAW[h];
    var p = fetch(clipURL(h)).then(function (r) { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .catch(function () { delete RAW[h]; if ((tries || 0) < 2) return new Promise(function (ok) { setTimeout(ok, 600); }).then(function () { return fetchRaw(h, (tries || 0) + 1); }); return null; });
    RAW[h] = p; return p;
  }
  function loadClip(h) {
    if (DEC[h]) return DEC[h];
    var p = fetchRaw(h).then(function (ab) {
      if (!ab) return null;
      return new Promise(function (ok) {
        try { var r = getCtx().decodeAudioData(ab.slice(0), ok, function () { ok(null); }); if (r && r.then) r.then(ok, function () { ok(null); }); } catch (e) { ok(null); }
      });
    });
    DEC[h] = p; DEC_ORDER.push(h);
    while (DEC_ORDER.length > 40) delete DEC[DEC_ORDER.shift()];
    p.then(function (b) { if (!b) { delete DEC[h]; } });
    return p;
  }
  function wake() { try { var c = getCtx(); if (c.state !== "running") c.resume(); } catch (e) {} }
  ["pointerdown", "keydown", "touchend"].forEach(function (ev) { document.addEventListener(ev, wake, true); });
  // 说一句：返回 Promise，说完 resolve；token 变了（换了步骤）就停
  var sayOwner = null;
  function say(who, text, token) {
    return new Promise(function (res) {
      var est = Math.max(1.2, text.length * 0.26) / speed;
      var done = false, fin = function () { if (!done) { done = true; res(); } };
      if (!soundOn || !text) { setTimeout(fin, est * 1000 * (soundOn ? 1 : 0.6)); return; }
      var h = hash(who + "|" + text);
      if (VOICE_IDX[h]) {
        var mine = {}; sayOwner = mine;
        var dur = VOICE_IDX[h] / speed;
        // 下载太慢（超过 8 秒还没开始）就不出声往下走，不换成电脑语音
        var slow = setTimeout(function () { if (sayOwner === mine && !mine.started) { mine.dead = true; fin(); } }, 8000);
        loadClip(h).then(function (buf) {
          if (sayOwner !== mine || mine.dead || done) return;
          clearTimeout(slow); mine.started = true;
          if (buf) {
            try {
              wake();
              var c = getCtx(), src = c.createBufferSource(); src.buffer = buf; src.playbackRate.value = speed;
              src.connect(outNode()); lipUsesAudio = true; curSrc = src;
              src.onended = function () { if (curSrc === src) curSrc = null; fin(); };
              src.start(c.currentTime + 0.04);
              setTimeout(fin, (buf.duration / speed + 1.5) * 1000);   // 保险：从真正开始放算起
              return;
            } catch (e) {}
          }
          // 解码不了：用普通播放器放同一个录音；也放不了就静音按时长走
          var au = new Audio(clipURL(h)); curAudio = au; lipUsesAudio = false;
          au.preservesPitch = au.webkitPreservesPitch = true; au.playbackRate = speed;
          au.onended = fin; au.onerror = function () { setTimeout(fin, dur * 1000); };
          var pp = au.play(); if (pp && pp.catch) pp.catch(function () { setTimeout(fin, dur * 1000); });
          setTimeout(fin, (dur + 8) * 1000);
        });
        return;
      }
      speakTTS();
      function speakTTS() {
        lipUsesAudio = false;
        if (!("speechSynthesis" in window) || !zhVoices.length) { setTimeout(fin, est * 1000); return; }
        var v = pickVoice(who), cv = (CAST[who] && CAST[who].voice) || {};
        var parts = (text.match(/[^。！？；]+[。！？；]*|[。！？；]+/g) || [text]).filter(function (x) { return x.trim(); });
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

  /* ---------- 音效（全部现场合成，不用文件）：古琴、翻纸、磬、木鱼 ---------- */
  function ac() { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === "suspended") actx.resume(); return actx; }
  function pluck(c, f, t0, gain, dur) {   // Karplus-Strong 拨弦
    var sr = c.sampleRate, n = Math.floor(sr * dur), buf = c.createBuffer(1, n, sr), d = buf.getChannelData(0), N = Math.round(sr / f);
    for (var i = 0; i < N; i++) d[i] = Math.random() * 2 - 1;
    for (var j = N; j < n; j++) d[j] = 0.4985 * (d[j - N] + d[j - N + 1 < j ? j - N + 1 : j - N]);
    var s = c.createBufferSource(), g = c.createGain(), lp = c.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 2200; s.buffer = buf; s.connect(lp); lp.connect(g); g.connect(c.destination);
    g.gain.setValueAtTime(gain, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); s.start(t0);
  }
  function sfx(kind) {
    if (!soundOn) return;
    try {
      var c = ac(), t = c.currentTime + 0.02;
      if (kind === "qin") { pluck(c, 196, t, 0.5, 2.6); pluck(c, 293.7, t + 0.22, 0.38, 2.4); pluck(c, 392, t + 0.5, 0.3, 2.2); }
      else if (kind === "page" || kind === "roll") {
        var n = Math.floor(c.sampleRate * 0.45), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
        for (var i = 0; i < n; i++) { var e = i / n; d[i] = (Math.random() * 2 - 1) * Math.pow(Math.sin(Math.PI * e), 2) * (0.6 + 0.4 * Math.sin(e * 40)); }
        var s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
        f.type = "bandpass"; f.frequency.value = kind === "page" ? 3200 : 1400; f.Q.value = 0.7;
        s.buffer = b; s.connect(f); f.connect(g); g.connect(c.destination); g.gain.value = kind === "page" ? 0.22 : 0.15; s.start(t);
      } else if (kind === "qing") {
        [[1046, 0.22], [1568 * 1.01, 0.12], [2637, 0.06]].forEach(function (q) {
          var o = c.createOscillator(), g = c.createGain(); o.type = "sine"; o.frequency.value = q[0];
          o.connect(g); g.connect(c.destination); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(q[1], t + 0.01);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6); o.start(t); o.stop(t + 2.7);
        });
      } else if (kind === "block") {
        var o = c.createOscillator(), g = c.createGain(); o.type = "triangle"; o.frequency.setValueAtTime(820, t); o.frequency.exponentialRampToValueAtTime(520, t + 0.08);
        o.connect(g); g.connect(c.destination); g.gain.setValueAtTime(0.35, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18); o.start(t); o.stop(t + 0.2);
        var o2 = c.createOscillator(), g2 = c.createGain(); o2.type = "triangle"; o2.frequency.value = 660; o2.connect(g2); g2.connect(c.destination);
        g2.gain.setValueAtTime(0.25, t + 0.16); g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.32); o2.start(t + 0.16); o2.stop(t + 0.34);
      }
    } catch (e) {}
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
    var url = /\//.test(img) ? img : A.img + img, my = key;
    sceneEl.classList.toggle("soft", !!soft);
    var put = function () {
      if (curScene !== my) return;
      var lay = document.createElement("div"); lay.className = "sl"; lay.style.backgroundImage = "url(" + url + ")";
      sceneEl.appendChild(lay);
      requestAnimationFrame(function () { requestAnimationFrame(function () { lay.classList.add("on"); }); });
      var olds = [].slice.call(sceneEl.querySelectorAll(".sl")).filter(function (x) { return x !== lay; });
      setTimeout(function () { olds.forEach(function (x) { if (x.parentNode) x.parentNode.removeChild(x); }); }, 900);
    };
    var pre = new Image(), went = false, once = function () { if (!went) { went = true; put(); } };
    pre.onload = pre.onerror = once; setTimeout(once, 1500); pre.src = url;
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
    if (v.type === "tease") {
      setScene("lake.webp", true);
      picEl.innerHTML = '<div class="tease"><div style="background-image:url(' + A.img + 'rain.webp)"><span>下雨的日子</span></div>' +
        '<div style="background-image:url(' + A.img + 'spring.webp)"><span>天晴的日子</span></div><b>下节课</b></div>';
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
    setScene(v.scene || L.scene || (v.type === "map" ? "lake.webp" : "tower.webp"), v.scene || L.scene ? !!L.sceneSoft : true);
    vis.classList.toggle("tall", v.type === "map");
    vis.innerHTML = '<div class="rod"></div><div class="silk"><div class="paper' + (hasBoard ? " withboard" : "") + '"></div></div><div class="rod"></div>';
    var paper = vis.querySelector(".paper");
    var p = document.createElement("div"); p.className = "pane";
    if (prev && prev.type === v.type && v.type !== "task") p.classList.add("still");
    if (v.type === "card") {
      p.className += " cardpane" + (v.cols ? " two" : "");
      var MK = function (t) {
        return esc(t).replace(/\*\*(.+?)\*\*/g, '<b class="mk">$1</b>').replace(/~~(.+?)~~/g, '<s class="no">$1</s>')
          .replace(/__(.+?)__/g, '<u class="ok">$1</u>').replace(/\[\[(.+?)\]\]/g, '<span class="hl">$1</span>')
          .replace(/（(\d+分[^）]*)）/g, '<span class="pt">（$1）</span>');
      };
      var block = function (lines, cls) { return '<div class="' + cls + '">' + lines.map(function (x) { if (x === "") return '<div class="gap"></div>';
        var m = /^(原|译|改)：/.exec(x); return m ? '<p class="' + ({ 原: "yw", 译: "yi", 改: "gai" })[m[1]] + '">' + MK(x.slice(2)) + "</p>" : "<p>" + MK(x) + "</p>"; }).join("") + "</div>"; };
      var h = '<div class="ch">' + (v.n ? '<span class="qn">' + esc(v.n) + "</span>" : "") + '<span class="qt">' + MK(v.title || "") + "</span>" + (v.score ? '<span class="sc">' + esc(v.score) + "</span>" : "") + "</div>";
      if (v.cols) h += '<div class="cols">' + v.cols.map(function (c) { return '<div class="col ' + (c.tone || "") + '"><div class="colh">' + esc(c.h) + "</div>" + block(c.lines, "cl") + "</div>"; }).join("") + "</div>";
      if (v.q) h += block(v.q, "cq");
      if (v.ans) h += '<div class="ca"><span class="tag">' + esc(v.tag || "答案") + "</span>" + block(v.ans, "cb") + "</div>";
      p.innerHTML = h + '<div class="big-clock" hidden><span class="num">0:00</span><span class="lab"></span><span class="bar"><i></i></span></div>';
    } else if (v.type === "pair") {
      // 逐句对译卡：句子来自 ../yueyanglou-ke/data/sents.js（window.YK_SENTS）。
      // v.ids：句子 id；v.mode："learn"（原文＋译文同色对应，默认）／"test"（只出原文，学生写译文）／"check"（原文＋译文＋翻译方法）
      p.className += " cardpane pairpane";
      var SS = {}; (window.YK_SENTS || []).forEach(function (x) { SS[x.id] = x; });
      var mode = v.mode || "learn";
      var hh = '<div class="ch">' + (v.n ? '<span class="qn">' + esc(v.n) + "</span>" : "") + '<span class="qt">' + esc(v.title || (mode === "test" ? "翻译过关" : "逐句对译")) + "</span>" + (v.score ? '<span class="sc">' + esc(v.score) + "</span>" : "") + "</div>";
      (v.ids || []).forEach(function (id, k) {
        var x = SS[id]; if (!x) { hh += '<p class="pr-miss">（缺句子 ' + esc(id) + "）</p>"; return; }
        var ci = 0, srcH = "", trH = "";
        (x.pairs || [[x.src, x.tr]]).forEach(function (pr) {
          var same = pr[0].replace(/[，。；！？、“”]/g, "") === pr[1].replace(/[，。；！？、“”]/g, "");
          var cls = same ? "pk" : "pc" + (ci++ % 5);
          srcH += '<span class="' + cls + '">' + esc(pr[0]) + "</span>";
          trH += '<span class="' + cls + '">' + esc(pr[1]) + "</span>";
        });
        if (!x.pairs) { srcH = esc(x.src); trH = esc(x.tr); }
        var num = (v.ids.length > 1 ? '<span class="pn">' + (k + 1) + "</span>" : "");
        hh += '<div class="pr">' + '<p class="psrc">' + num + srcH + "</p>";
        if (mode === "test") hh += '<p class="ptr blank">写在作答纸上</p>';
        else hh += '<p class="ptr">' + trH + "</p>";
        if (mode === "check" && x.how && x.how.length) hh += '<p class="phow">' + x.how.map(function (t) { return '<span class="hw">' + esc(t) + "</span>"; }).join("") + "</p>";
        hh += "</div>";
      });
      if (v.foot) hh += '<p class="pfoot">' + esc(v.foot) + "</p>";
      p.innerHTML = hh + '<div class="big-clock" hidden><span class="num">0:00</span><span class="lab"></span><span class="bar"><i></i></span></div>';
    } else if (v.type === "text") {
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
      var fresh = (v.layers || []).filter(function (k) { return !(prev && prev.type === "map" && prev.zoom === v.zoom && (prev.layers || []).indexOf(k) >= 0); });
      var mk = v.map || (v.zoom === "south" ? "dongting" : "song");
      p.className += " mappane"; p.innerHTML = (L.maps && L.maps[mk] ? PICMAP(L.maps[mk], v.layers || [], fresh) : MAP.svg(v.layers || [], v.zoom, hasBoard ? 590 : 924, fresh)) + (corner ? '<div class="corner">' + esc(corner) + "</div>" : "");
    } else if (v.type === "task" && v.pen) {
      // 三色笔：一眼看出现在第几步、用哪支笔、写在哪里
      p.className += " taskpane pens3";
      var PEN = { black: ["黑笔", "自己写"], blue: ["蓝笔", "同桌补充"], red: ["红笔", "听完订正"] }, order = ["black", "blue", "red"], at = order.indexOf(v.pen);
      var strip = '<div class="strip">' + order.map(function (k, i) {
        return '<div class="st ' + k + (i === at ? " now" : i < at ? " done" : "") + '"><span class="dot"></span><b>' + PEN[k][0] + "</b><small>" + PEN[k][1] + "</small></div>" + (i < 2 ? '<i class="arr"></i>' : "");
      }).join("") + "</div>";
      var sheet = SHEET(v.pen);
      p.innerHTML = strip +
        '<div class="now-row"><div class="now-txt ' + v.pen + '"><div class="do">' + esc(v.do || "") + '</div><div class="where">' + esc(v.where || "") + "</div>" +
        '<ol class="qs">' + (v.q || []).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ol></div>" + sheet + "</div>" +
        '<div class="big-clock" hidden><span class="num">0:00</span><span class="lab"></span><span class="bar"><i></i></span></div>';
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
    if (!p.classList.contains("still")) sfx(v.type === "text" ? "page" : "roll");
    if (hasBoard) {
      var b = document.createElement("div"); b.className = "board";
      b.innerHTML = '<div class="bt">黑板</div>' + board.map(function (x) {
        var i = x.indexOf("＝"); return "<p>" + (i > 0 ? "<b>" + esc(x.slice(0, i)) + "</b>" + esc(x.slice(i)) : esc(x)) + "</p>";
      }).join("");
      paper.appendChild(b);
    }
  }
  // 作答单正面的示意小图：把要写的地方用笔的颜色框出来
  function SHEET(pen) {
    var col = { black: "#26221c", blue: "#2457a6", red: "#b8382b" }[pen];
    var o = '<svg class="sheet" viewBox="0 0 210 297" aria-label="作答单示意">';
    o += '<rect x="1" y="1" width="208" height="295" fill="#fff" stroke="#b9ad97" stroke-width="2"/>';
    o += '<rect x="8" y="8" width="10" height="10" fill="#26221c"/><rect x="192" y="8" width="10" height="10" fill="none" stroke="#26221c" stroke-width="2.5"/>';
    o += '<rect x="8" y="279" width="10" height="10" fill="#26221c"/><rect x="192" y="279" width="10" height="10" fill="#26221c"/>';
    o += '<text x="22" y="30" font-size="13" font-family="WenKai,KaiTi,serif" fill="#26221c">岳阳楼记·第1节</text>';
    o += '<text x="20" y="62" font-size="10" font-weight="700" font-family="Noto Sans SC,sans-serif" fill="#26221c">第1题</text>';
    for (var i = 0; i < 6; i++) o += '<line x1="20" x2="190" y1="' + (78 + i * 13) + '" y2="' + (78 + i * 13) + '" stroke="#c8bfae" stroke-dasharray="3 2"/>';
    o += '<rect x="20" y="152" width="170" height="26" fill="none" stroke="#9a8f7c"/>';
    o += '<text x="20" y="200" font-size="10" font-weight="700" font-family="Noto Sans SC,sans-serif" fill="#26221c">小测</text>';
    for (var j = 0; j < 4; j++) o += '<line x1="20" x2="190" y1="' + (214 + j * 14) + '" y2="' + (214 + j * 14) + '" stroke="#c8bfae"/>';
    var box = pen === "red" ? [16, 148, 178, 34] : [16, 66, 178, 80];
    o += '<rect x="' + box[0] + '" y="' + box[1] + '" width="' + box[2] + '" height="' + box[3] + '" fill="' + col + '" fill-opacity=".12" stroke="' + col + '" stroke-width="4" rx="3"><animate attributeName="stroke-opacity" values="1;.35;1" dur="1.6s" repeatCount="indefinite"/></rect>';
    o += '<text x="105" y="' + (box[1] + box[3] + 15) + '" text-anchor="middle" font-size="12" font-weight="700" font-family="Noto Sans SC,sans-serif" fill="' + col + '">写在这里</text>';
    return o + "</svg>";
  }
  function highlight(id, cls) {
    vis.querySelectorAll(".sen").forEach(function (e) {
      e.classList.remove("hi", "echo", "dim");
      if (id) { if (e.dataset.s === id) e.classList.add(cls || "hi"); else e.classList.add("dim"); }
    });
  }

  /* ---------- 地图（示意，按经纬度画） ---------- */
  function PICMAP(m, layers, fresh) {
    var has = function (k) { return layers.indexOf(k) >= 0; }, isNew = function (k) { return fresh.indexOf(k) >= 0; };
    var o = '<svg viewBox="0 0 ' + m.w + " " + m.h + '" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="示意地图">';
    o += '<defs><marker id="arp" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#b23a2a"/></marker></defs>';
    o += '<image href="' + m.img + '" x="0" y="0" width="' + m.w + '" height="' + m.h + '"/>';
    var T = function (x, y, txt, size, col, anchor, cls) {
      return '<text x="' + x + '" y="' + y + '" text-anchor="' + (anchor || "start") + '" font-family="WenKai,KaiTi,serif" font-size="' + size + '" fill="' + col +
        '" stroke="#f6f1e3" stroke-width="' + Math.round(size / 5) + '" stroke-linejoin="round" paint-order="stroke"' + (cls ? ' class="' + cls + '"' : "") + ">" + txt + "</text>";
    };
    (m.fixed || []).forEach(function (f) { o += T(f.at[0], f.at[1], f.label, f.size || 46, f.color || "#3c6f7a", f.anchor); });
    Object.keys(m.items).forEach(function (k) {
      if (!has(k)) return;
      var it = m.items[k], dl = it.delay && isNew(k) ? ' style="animation-delay:' + it.delay + 's"' : "";
      if (it.route) {
        var q = it.route, d = "M" + q[0][0] + " " + q[0][1];
        for (var i = 1; i < q.length; i++) {   // 平滑
          var p0 = q[i - 2] || q[i - 1], p1 = q[i - 1], p2 = q[i], p3 = q[i + 1] || q[i];
          d += " C" + (p1[0] + (p2[0] - p0[0]) / 6) + " " + (p1[1] + (p2[1] - p0[1]) / 6) + " " + (p2[0] - (p3[0] - p1[0]) / 6) + " " + (p2[1] - (p3[1] - p1[1]) / 6) + " " + p2[0] + " " + p2[1];
        }
        o += '<path d="' + d + '" fill="none" stroke="#f6f1e3" stroke-width="20" stroke-linecap="round" opacity=".7" pathLength="1"' + (isNew(k) ? ' class="draw"' + dl : "") + "/>";
        o += '<path d="' + d + '" fill="none" stroke="#b23a2a" stroke-width="10" stroke-linecap="round" pathLength="1" marker-end="url(#arp)"' + (isNew(k) ? ' class="draw"' + dl : "") + "/>";
        if (it.label) o += '<g' + (isNew(k) ? ' class="popin late"' + (it.delay ? ' style="animation-delay:' + (it.delay + 1.6) + 's"' : "") : "") + ">" + T(it.label.at[0], it.label.at[1], it.label.text, 40, "#b23a2a", it.label.anchor) + "</g>";
      } else {
        var x = it.at[0], y = it.at[1], col = it.color || "#b23a2a", lx = x + (it.dx || 0), ly = y + (it.dy || 0);
        o += '<g' + (isNew(k) ? ' class="popin"' + dl : "") + ">";
        o += '<circle cx="' + x + '" cy="' + y + '" r="16" fill="' + col + '" stroke="#fff" stroke-width="5"/>';
        if (isNew(k)) o += '<circle cx="' + x + '" cy="' + y + '" r="16" fill="none" stroke="' + col + '" stroke-width="5" class="ring"/>';
        o += T(lx, ly, it.label, 64, col, it.anchor);
        if (it.sub) o += T(lx, ly + 46, it.sub, 32, "#5b5244", it.anchor);
        o += "</g>";
      }
    });
    return o + "</svg>";
  }
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
    function svg(layers, zoom, width, fresh) {
      W = width || 910; fresh = fresh || [];
      var nw = function (k) { return fresh.indexOf(k) >= 0 ? ' class="draw"' : ""; };
      var np2 = function (k) { return fresh.indexOf(k) >= 0 ? ' class="popin"' : ""; };
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
      if (has("lineB")) { var a = P(C.kaifeng[0], C.kaifeng[1], b), z = P(C.baling[0], C.baling[1], b); o += '<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + z[0] + '" y2="' + z[1] + '" stroke="#a3382a" stroke-width="5" stroke-linecap="round" pathLength="1"' + nw("lineB") + '/>'; }
      if (has("lineD")) { var a2 = P(C.kaifeng[0], C.kaifeng[1], b), z2 = P(C.dengzhou[0], C.dengzhou[1], b); o += '<line x1="' + a2[0] + '" y1="' + a2[1] + '" x2="' + z2[0] + '" y2="' + z2[1] + '" stroke="#a3382a" stroke-width="5" stroke-dasharray="14 10"/>'; }
      if (has("kaifeng")) o += dot(C.kaifeng, b, "开封", "北宋京城", "#2a241b").replace("<g>", "<g" + np2("kaifeng") + ">");
      if (has("baling")) o += dot(C.baling, b, "巴陵", "今湖南岳阳", "#a3382a").replace("<g>", "<g" + np2("baling") + ">");
      if (has("dengzhou")) o += dot(C.dengzhou, b, "邓州", "今河南邓州", "#a3382a", -20, 10).replace("<g>", "<g" + np2("dengzhou") + ">");
      if (has("wuxia")) {
        o += dot(C.wuxia, b, "巫峡", "", "#a3382a", 10, -26);
        var seg = yangtze.slice(2, 8).reverse();
        o += '<path d="' + path(seg, b) + '" fill="none" stroke="#a3382a" stroke-width="5" stroke-linecap="round" pathLength="1" marker-end="url(#ar)"' + nw("wuxia") + '/>';
        var wp = P(110.2, 30.35, b); o += '<text x="' + wp[0] + '" y="' + wp[1] + '" font-family="Noto Sans SC,sans-serif" font-size="24" fill="#a3382a" stroke="#efe6d0" stroke-width="5" paint-order="stroke">北通：经长江西上</text>';
      }
      if (has("xiaoxiang")) {
        var xp = P(113.05, 27.4, b), sp = P(110.55, 25.95, b);
        o += '<text x="' + xp[0] + '" y="' + xp[1] + '" font-family="WenKai,KaiTi,serif" font-size="32" fill="#a3382a" stroke="#efe6d0" stroke-width="5" paint-order="stroke">湘水</text>';
        o += '<text x="' + sp[0] + '" y="' + sp[1] + '" font-family="WenKai,KaiTi,serif" font-size="32" fill="#a3382a" stroke="#efe6d0" stroke-width="5" paint-order="stroke">潇水</text>';
        o += '<path d="' + path(xiang.slice(1), b) + '" fill="none" stroke="#a3382a" stroke-width="5" stroke-linecap="round" pathLength="1" marker-end="url(#ar)"' + nw("xiaoxiang") + '/>';
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

  function fitCards() {
    var p = vis.querySelector(".cardpane"); if (!p) return;
    p.style.fontSize = "";
    var fs = parseFloat(getComputedStyle(p).fontSize), min = fs * 0.72;
    var over = function () {
      if (p.scrollHeight > p.clientHeight + 2) return true;
      var cs = p.querySelectorAll(".col"); for (var i = 0; i < cs.length; i++) if (cs[i].scrollHeight > cs[i].clientHeight + 2) return true;
      return false;
    };
    while (over() && fs > min) { fs -= 1.5; p.style.fontSize = fs + "px"; }
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitCards);

  /* ---------- 计时 ---------- */
  var timer = null;
  function startTimer(t, token) {
    stopTimer();
    var total = t.s, left = t.s, halfDone = false;
    var nudgeAt = total >= 60 && t.nudge !== false ? [Math.round(total * 0.62), Math.round(total * 0.3)] : [];
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
      if (nudgeAt.indexOf(left) >= 0) nudge(token);
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
    whoEl.className = "who w-" + (CAST[who] ? who : isNote ? "note" : "none");
    whoEl.textContent = CAST[who] ? CAST[who].name : isNote ? "请大家" : "";
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

  /* ---------- 点名 ---------- */
  // 名单：先用助教在页面上输入的（存在这台电脑），没有就用 roster.js 里给这个班的
  var KLASS = L.klass || "default";
  function rkey(k) { return "hora-roster-" + k + "-" + KLASS; }
  function lsGet(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function roster() {
    var own = lsGet(rkey("list"), null);
    if (own && own.length) return own;
    return ((window.PROJ_ROSTER || {})[KLASS] || []).slice();
  }
  var CALLS = L.callLines || ["{n}，你来说说。", "请{n}回答。", "{n}，说说你的想法。", "{n}，你来试试。"];
  var callNo = 0, curName = "", group = [], gi = 0;
  // 每个问题点 2～3 人（L.callCount，默认 [2,3] 随机），一次先排好，屏幕上看得到谁在后面
  function pickName(avoid) {
    var all = roster(); if (!all.length) return "";
    var done = lsGet(rkey("called"), []);
    var pool = all.filter(function (n) { return done.indexOf(n) < 0 && avoid.indexOf(n) < 0; });
    if (!pool.length) { lsSet(rkey("called"), []); pool = all.filter(function (n) { return avoid.indexOf(n) < 0; }); if (!pool.length) pool = all; }
    var n = pool[Math.floor(Math.random() * pool.length)];
    lsSet(rkey("called"), lsGet(rkey("called"), []).concat([n]));
    return n;
  }
  function paintCall() {
    var box = $(".cue .callbox"); if (!box) return;
    var nm = box.querySelector(".nm"); nm.textContent = curName; nm.classList.remove("pop"); void nm.offsetWidth; nm.classList.add("pop");
    box.querySelector(".queue").innerHTML = group.map(function (n, i) { return '<span class="' + (i < gi ? "done" : i === gi ? "now" : "") + '">' + "①②③④⑤⑥"[i] + esc(n) + "</span>"; }).join("");
  }
  function voiceCall(token) {
    var line = CALLS[callNo++ % CALLS.length].replace("{n}", curName);
    stopVoice(); spotlight(LEAD); talking(LEAD, true);
    say(LEAD, voiceText({ say: line }), token).then(function () { if (token === TOKEN) talking(LEAD, false); });
  }
  function startCall(c, token) {
    var cnt = c.n || L.callCount || [2, 3];
    if (cnt.length) cnt = cnt[Math.floor(Math.random() * cnt.length)];
    group = []; for (var i = 0; i < cnt; i++) { var n = pickName(group); if (n) group.push(n); }
    gi = 0; curName = group[0] || ""; if (!curName) return;
    paintCall(); voiceCall(token);
  }
  // 下一位：排好的人点完了，就再加一位
  function nextCall(token) {
    if (!group.length) return;
    gi++; if (gi >= group.length) group.push(pickName(group));
    curName = group[gi]; paintCall(); voiceCall(token);
  }
  // 换一个：这位同学不在，不算点过
  function swapCall(token) {
    if (!group.length) return;
    lsSet(rkey("called"), lsGet(rkey("called"), []).filter(function (x) { return x !== curName; }));
    var n = pickName(group); group[gi] = n; curName = n; paintCall(); voiceCall(token);
  }
  function openRoster() {
    var d = $(".dialog"); d.hidden = false;
    var h = "<h3>点名单</h3>";
    h += '<div class="hint">每行一个名字（也可以用空格、顿号、逗号隔开）。名单存在这台电脑的浏览器里，换电脑要重新输入。把名单发给课件制作人，可以录成老师的声音点名。</div>';
    h += '<textarea id="rlist" rows="8" style="font-size:24px;padding:10px;font-family:inherit">' + esc(roster().join("\n")) + "</textarea>";
    h += '<div class="hint">已点过：' + esc(lsGet(rkey("called"), []).join("、") || "（还没有）") + "</div>";
    h += '<div style="display:flex;gap:12px;justify-content:flex-end"><button class="btn ghost" id="rreset">清空“已点过”</button><button class="btn" id="rok">保存</button></div>';
    d.querySelector(".box").innerHTML = h;
    $("#rreset").onclick = function () { lsSet(rkey("called"), []); toast("已清空，重新从头点"); d.hidden = true; };
    $("#rok").onclick = function () {
      var list = $("#rlist").value.split(/[\s,，、;；]+/).map(function (x) { return x.trim(); }).filter(Boolean);
      lsSet(rkey("list"), list); d.hidden = true; toast("名单已保存：" + list.length + " 人");
      var st = STEPS[cur]; if (st && st.cue && st.cue.k === "call") showCue(st.cue);
    };
  }

  /* ---------- 提醒专心（计时中自动，也可以随时点“提醒”） ---------- */
  var NUDGE_SETS = {
    write: L.nudges || [{ who: "qx", say: "嘿，你在认真写吗？" }, { who: "cg", say: "别走神，时间有限！" }, { who: "qx", say: "安静一点，大家都在写呢。" }, { who: "cg", say: "笔动起来！光看着，可写不出来。" }],
    talk: L.nudgesTalk || [{ who: "qx", say: "说正事哦，只聊这道题。" }, { who: "cg", say: "声音小一点，同桌听见就够了。" }, { who: "qx", say: "两个人轮流说，别让一个人包场。" }, { who: "cg", say: "抓紧时间！说到好的，记得写下来。" }],
    look: L.nudgesLook || [{ who: "cg", say: "眼睛看屏幕，跟上！" }, { who: "qx", say: "别走神，这里是重点。" }, { who: "cg", say: "嘿，回到课堂上来。" }]
  };
  var NUDGES = NUDGE_SETS.write, nudgeNo = { write: 0, talk: 0, look: 0 };
  function allNudges() { return NUDGE_SETS.write.concat(NUDGE_SETS.talk, NUDGE_SETS.look); }
  // 计时里是写还是说：timer.nudge 可以直接指定 "write"/"talk"；不写就看计时的标签
  function nudgeKind(st) {
    if (!st || !st.timer) return "look";
    if (NUDGE_SETS[st.timer.nudge]) return st.timer.nudge;
    var lb = st.timer.label || "";
    if (/比划|看图|听/.test(lb) && !/写|订正/.test(lb)) return "look";
    return /同桌补充|同桌猜|互讲|复述|说给|讨论|小组|交流|商量|口头|说一说|互相说/.test(lb) ? "talk" : "write";
  }
  function nudge(token) {
    var st = STEPS[cur], kind = nudgeKind(st), set = NUDGE_SETS[kind];
    if (!set || !set.length) return;
    var n = set[nudgeNo[kind]++ % set.length];
    stopVoice(); spotlight(n.who); showLine(n.who, n.say); talking(n.who, true);
    say(n.who, voiceText(n), token).then(function () {
      if (token !== TOKEN) return; talking(n.who, false);
      if (st && st.timer) showLine(null, st.note || st.timer.label, true);
    });
  }

  /* ---------- 全班互动大提示 ---------- */
  var CUE = { call: ["点", "点名回答"], say: ["说", "全班一起说"], hand: ["举", "举手"], stand: ["站", "站队"], gesture: ["比", "比划"], catch: ["错", "抓错"], race: ["赛", "比赛读"] };
  function showCue(c) {
    var el = $(".cue");
    stage.classList.toggle("cueing", !!c);
    if (!c) { el.hidden = true; return; }
    var k = CUE[c.k] || ["！", ""];
    el.innerHTML = '<div class="seal">' + k[0] + '</div><div class="ct"><small>' + k[1] + "</small>" + esc(c.t) + "</div>";
    var st = STEPS[cur]; if (st && st.note) el.querySelector(".ct").insertAdjacentHTML("beforeend", '<span class="cn">' + esc(st.note) + "</span>");
    if (c.k === "call") {
      el.insertAdjacentHTML("beforeend", '<div class="callbox"><div class="nm">' + (roster().length ? "……" : "请老师点一位同学") + '</div><div class="queue"></div><div class="cb2">' +
        (roster().length ? '<button class="btn gold" data-call="more">下一位</button><button class="btn ghost" data-call="skip">换一个</button>' : '<button class="btn ghost" data-call="list">输入名单</button>') + "</div></div>");
      el.querySelectorAll("[data-call]").forEach(function (b) { b.onclick = function () { var a = b.dataset.call; if (a === "list") openRoster(); else if (a === "skip") swapCall(TOKEN); else nextCall(TOKEN); }; });
    }
    el.hidden = false; el.classList.remove("in"); void el.offsetWidth; el.classList.add("in");
    sfx("block");
  }

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
      if (!LEAD_ENTERS || s.who === LEAD || s.enter === LEAD || s.read) fanIn = true;
      if (s._seg !== sg) continue;
      if (s.vis) v = s.vis;
      if (s.board) board = s.board;
      if (s.corner !== undefined) corner = s.corner;
    }
    if (!v) for (var j = n; j >= 0; j--) if (STEPS[j].vis) { v = STEPS[j].vis; break; }
    return { v: v, board: board, corner: corner, fanIn: fanIn };
  }
  function linesOf(st) {   // 这一步会说的所有话（和 tools/proj_lines.js 一致）
    var o = [], pr = promptOf(st), RD;
    if (pr) o.push([pr.who, voiceText({ say: pr.text })]);
    if (st.say) o.push([st.who, voiceText(st)]);
    if (st.read) { RD = st.read.who || L.reader || LEAD; st.read.paras.forEach(function (pk) { L.paras[pk].forEach(function (s) { o.push([RD, voiceText({ say: s })]); }); }); }
    if (st.respond) st.respond.opts.forEach(function (x) { o.push([x.who, voiceText(x)]); });
    return o;
  }
  function prefetch(n) {
    if (!soundOn) return;
    for (var i = n; i < Math.min(STEPS.length, n + 4); i++) linesOf(STEPS[i]).forEach(function (x, j) {
      var h = hash(x[0] + "|" + x[1]); if (!VOICE_IDX[h]) return;
      if (i === n || j < 3) loadClip(h); else fetchRaw(h);
    });
  }
  var warmed = false;
  function warmAll() {   // 开课后在后台把整节课的录音按顺序下载好（每次 3 个），网慢时不卡
    if (warmed) return; warmed = true;
    var list = [];
    STEPS.forEach(function (st) { linesOf(st).forEach(function (x) { list.push(hash(x[0] + "|" + x[1])); }); });
    allNudges().forEach(function (x) { list.push(hash(x.who + "|" + voiceText(x))); });
    list = list.filter(function (h, i) { return VOICE_IDX[h] && list.indexOf(h) === i; });
    var k = Math.max(0, cur);
    var start = 0; for (var i = 0; i < k; i++) start += linesOf(STEPS[i]).length;
    list = list.slice(Math.min(start, list.length)).concat(list.slice(0, Math.min(start, list.length)));
    var at = 0;
    function one() { if (at >= list.length) return; var h = list[at++]; fetchRaw(h).then(one, one); }
    one(); one(); one();
  }
  function go(n) {
    if (n < 0 || n >= STEPS.length) return;
    prefetch(n);
    TOKEN++; var token = TOKEN;
    stopVoice(); stopTimer(); clearTimeout(autoTimer);
    Object.keys(actors).forEach(function (k) { talking(k, false); });
    var prevSeg = cur >= 0 ? STEPS[cur]._seg : -1;
    cur = n; var st = STEPS[n], S = stateAt(n);
    if (st._seg !== prevSeg && n === SEGSTART[st._seg]) sfx("qin");
    if (st.sfx) sfx(st.sfx);
    showCue(st.cue);
    if (st.hop && actors[st.hop]) { var he = actors[st.hop].el; he.classList.remove("hop"); void he.offsetWidth; he.classList.add("hop"); }
    // 顶栏
    segBox.querySelectorAll("button").forEach(function (b, i) { b.classList.toggle("on", i === st._seg); b.classList.toggle("done", i < st._seg); });
    renderVis(S.v, S.board, S.corner);
    if (!st.timer) { var bcl = vis.querySelector(".big-clock"); if (bcl) bcl.hidden = true; }   // 同一张卡留着时，上一步的计时钟藏起来
    fitCards();
    var ob = vis.querySelector(".copyb"); if (ob) ob.remove();
    if (st.copy) vis.insertAdjacentHTML("beforeend", '<div class="copyb">✎ ' + esc(typeof st.copy === "string" ? st.copy : "抄下来") + "</div>");
    actors[LEAD].el.classList.toggle("away", !S.fanIn);
    respEl.hidden = true;
    $("#next").classList.remove("pulse");
    setTip(st.tip || (st.copy ? "抄好了，再点“继续”。" : ""));
    // 人物表情
    Object.keys(actors).forEach(function (k) { actors[k].mood = (st.think && k !== LEAD) ? "think" : (st.who === k && st.face) ? st.face : "idle"; setFace(k, restFace(k)); });
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
    var pr = promptOf(st);
    var sayPrompt = function () {
      spotlight(pr.who); showLine(pr.who, pr.text, true); talking(pr.who, true);
      return say(pr.who, voiceText({ say: pr.text }), token).then(function () { if (token === TOKEN) talking(pr.who, false); });
    };
    if (st.read) run = (pr ? sayPrompt() : Promise.resolve()).then(function () { return token === TOKEN ? doRead(st, token) : null; });
    else if (pr) run = sayPrompt();
    if (!run && st.say) { spotlight(st.who); showLine(st.who, st.say); talking(st.who, true); run = say(st.who, voiceText(st), token).then(function () { if (token === TOKEN) talking(st.who, false); }); }
    else if (!run && st.note) { spotlight(null); showLine(null, st.note, true); run = Promise.resolve(); }
    else if (!run) { spotlight(null); run = Promise.resolve(); }
    // 点名：先把这一步的话说完（提问），再开始点名（11-09：三级台阶提问的步骤既有话又有点名）
    if (st.cue && st.cue.k === "call" && roster().length) { group = []; curName = ""; run = run.then(function () { if (token === TOKEN) startCall(st.cue, token); }); }
    if (st.note && st.say) { /* 不会同时出现 */ }
    if (st.timer) { if (!st.say && !st.read && !pr) showLine(null, st.note || st.timer.label, true); startTimer(st.timer, token); }
    if (st.respond) showRespond(st.respond, token);
    run.then(function () {
      if (token !== TOKEN) return;
      var stop = st.hold || st.copy || st.timer || st.respond || st.btns || last;
      var nextSeg = !last && STEPS[n + 1]._seg !== st._seg;
      if (nextSeg) { setTip((st.copy ? "抄好了再点“继续”。" : "本环节结束。") + "下一环节：" + L.segments[STEPS[n + 1]._seg].t + "。准备好了点“继续”。"); $("#next").classList.add("pulse"); return; }
      if (stop) { if (!st.timer) $("#next").classList.add("pulse"); return; }
      if (auto) autoTimer = setTimeout(function () { if (token === TOKEN) go(n + 1); }, st.note ? 2600 : 900);
      else $("#next").classList.add("pulse");
    });
    store.set("pos", n);
  }
  // 屏幕提示由伴学读出来（不用老师读）：ask 是读出来的话（不写就读 note），by 是谁读（默认清弦），quiet 不读
  function promptOf(st) {
    if (st.say || st.quiet) return null;
    if (st.respond) return { who: st.respond.by || "qx", text: st.respond.ask || "被点到的同学，请读一读你写的。" };
    var t = st.ask || st.note; if (!t) return null;
    return { who: st.by || "qx", text: t };
  }
  function doRead(st, token) {
    var r = st.read, list = [], RD = r.who || L.reader || LEAD;
    r.paras.forEach(function (pk) { L.paras[pk].forEach(function (s, i) { list.push({ id: pk + "-" + i, s: s }); }); });
    spotlight(RD);
    if (st.note) showLine(null, st.note, true); else showLine(RD, r.mode === "echo" ? "（一句一句跟读）" : "（范读）");
    var i = 0;
    return new Promise(function (res) {
      (function next() {
        if (token !== TOKEN) return;
        if (i >= list.length) { highlight(null); talking(RD, false); res(); return; }
        var it = list[i++];
        highlight(it.id, "hi"); talking(RD, true);
        say(RD, voiceText({ say: it.s }), token).then(function () {
          if (token !== TOKEN) return; talking(RD, false);
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
  if (A.sheet) $("#sheet").onclick = function () { window.open(A.sheet, "_blank"); }; else $("#sheet").hidden = true;
  $("#set").onclick = openSettings;
  if ($("#roll")) $("#roll").onclick = openRoster;
  if ($("#nudge")) { if (NUDGES.length) $("#nudge").onclick = function () { nudge(TOKEN); }; else $("#nudge").hidden = true; }
  document.addEventListener("keydown", function (e) {
    if ($(".dialog") && !$(".dialog").hidden) { if (e.key === "Escape") $(".dialog").hidden = true; return; }
    var k = e.key;
    if (k === " " || k === "Enter" || k === "ArrowRight" || k === "PageDown" || k === "ArrowDown") { e.preventDefault(); if (!$(".cover").hidden) start(); else next(); }
    else if (k === "ArrowLeft" || k === "PageUp" || k === "ArrowUp") { e.preventDefault(); prev(); }
    else if (/^[1-9]$/.test(k) && !respEl.hidden) { var bs = respEl.querySelectorAll("button"); if (bs[+k - 1]) bs[+k - 1].click(); }
    else if (k === "f" || k === "F") $("#full").click();
    else if (k === "n" || k === "N") { if ($(".cue [data-call=more]")) nextCall(TOKEN); }
    else if (k === "r" || k === "R") nudge(TOKEN);
    else if (k === "p" || k === "P") { if (timer) { timer.paused = !timer.paused; toast(timer.paused ? "计时暂停" : "计时继续"); } }
  });

  var toastT = null;
  function toast(s) { var t = $(".toast"); t.textContent = s; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(function () { t.hidden = true; }, 2200); }

  function openSettings() {
    loadVoices();
    var d = $(".dialog"); d.hidden = false;
    var h = "<h3>声音设置</h3>";
    h += '<div class="hint">没有录音的台词，用这台电脑自带的中文语音读。用 Microsoft Edge 浏览器打开，能用到更自然的“晓晓、云扬、云健”等声音。共找到 ' + zhVoices.length + " 种中文声音。</div>";
    Object.keys(CAST).forEach(function (k) {
      var cv = pickVoice(k);
      h += "<label><b>" + CAST[k].name + '</b><select data-k="' + k + '">' + zhVoices.map(function (v) {
        return '<option value="' + esc(v.name) + '"' + (cv && cv.name === v.name ? " selected" : "") + ">" + esc(v.name) + "</option>"; }).join("") +
        '</select><button class="btn ghost" data-try="' + k + '">试听</button></label>';
    });
    h += '<label><b>语速</b><select id="spd">' + [0.85, 0.9, 1, 1.1, 1.2].map(function (x) { return '<option value="' + x + '"' + (x === speed ? " selected" : "") + ">" + (x === 1 ? "正常" : x < 1 ? "慢一点（" + x + "）" : "快一点（" + x + "）") + "</option>"; }).join("") + "</select></label>";
    h += '<label><b>音量增强</b><select id="bst">' + [[1, "不增强"], [1.5, "大一点"], [2, "大（默认）"], [2.6, "很大（大教室）"]].map(function (x) { return '<option value="' + x[0] + '"' + (x[0] === boost ? " selected" : "") + ">" + x[1] + "</option>"; }).join("") + "</select></label>";
    h += '<div class="hint">键盘：空格／→／翻页遥控器＝继续；←＝上一步；1–5＝助教回应按钮；P＝暂停计时；F＝全屏；N＝下一位；R＝提醒专心。</div>';
    h += '<div style="display:flex;justify-content:flex-end"><button class="btn" id="setok">好了</button></div>';
    d.querySelector(".box").innerHTML = h;
    d.querySelectorAll("select[data-k]").forEach(function (s) { s.onchange = function () { store.set("voice-" + s.dataset.k, s.value); }; });
    d.querySelectorAll("[data-try]").forEach(function (b) { b.onclick = function () { var k = b.dataset.try; stopVoice(); say(k, "同学们好，我是" + CAST[k].name + "。", TOKEN); }; });
    $("#spd").onchange = function () { speed = +this.value; store.set("speed", speed); };
    $("#bst").onchange = function () { boost = +this.value; store.set("boost", boost); if (boostNode) boostNode.gain.value = boost; };
    $("#setok").onclick = function () { d.hidden = true; };
  }

  /* ---------- 开始 ---------- */
  function start() {
    $(".cover").hidden = true;
    chime(0); // 解锁声音
    try { if (actx && actx.state === "suspended") actx.resume(); } catch (e) {}
    loadVoices();
    go(Math.max(0, startAt));
    setTimeout(warmAll, 1500);
  }
  setScene(L.scene || "tower.webp", false);
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
