/* 弦歌网站：所有页面共用的两样小东西（首页、每篇课文都引用）
   1. 全屏：左边的“全屏”小签。点一下进入全屏；换页后，第一次点页面会自动回到全屏。
      iPad 上更稳的办法：Safari“分享 → 添加到主屏幕”，从主屏幕图标打开就一直是全屏。
   2. 往下滑提示：内容超出屏幕、下面还有东西时，在那一块的右边出现竖排的“往下滑查看完整界面”，滑到底就消失。 */
(function () {
  var D = document, R = D.documentElement;
  var css = D.createElement("style");
  css.textContent =
    ".xg-fs{position:fixed;left:0;top:42%;z-index:80;writing-mode:vertical-rl;letter-spacing:.3em;font:600 13px/1 'Noto Sans SC',system-ui,sans-serif;" +
    "padding:12px 6px;border:0;border-radius:0 10px 10px 0;background:rgba(21,35,42,.72);color:#f3ecdc;cursor:pointer;box-shadow:0 6px 16px -8px rgba(0,0,0,.5)}" +
    ".xg-fs:hover{background:rgba(21,35,42,.9)}" +
    ".xg-hint{position:fixed;z-index:79;width:34px;display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 0 10px;border-radius:17px;" +
    "background:linear-gradient(rgba(250,245,235,.55),rgba(250,245,235,.92));-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);" +
    "box-shadow:0 6px 18px -8px rgba(40,30,20,.45);color:#5b4a35;font:600 13px/1.15 'Noto Serif SC',serif;cursor:pointer;transition:opacity .3s;pointer-events:auto}" +
    ".xg-hint span{writing-mode:vertical-rl;letter-spacing:.18em}" +
    ".xg-hint b{font-size:15px;animation:xghb 1.4s ease-in-out infinite}@keyframes xghb{50%{transform:translateY(4px)}}" +
    ".xg-hint[hidden]{display:none}"+
    "html,body{overscroll-behavior-x:none}";
  D.head.appendChild(css);

  /* ---------- 全屏 ---------- */
  function fsEl() { return D.fullscreenElement || D.webkitFullscreenElement; }
  function canFs() { return !!(R.requestFullscreen || R.webkitRequestFullscreen); }
  var standalone = (window.matchMedia && matchMedia("(display-mode: standalone), (display-mode: fullscreen)").matches) || navigator.standalone;
  function goFs() { try { var p = (R.requestFullscreen || R.webkitRequestFullscreen).call(R); if (p && p.catch) p.catch(function () {}); } catch (e) {} }
  function want(v) { try { if (v === undefined) return sessionStorage.getItem("xg-fs") === "1"; sessionStorage.setItem("xg-fs", v ? "1" : "0"); } catch (e) {} }
  if (canFs() && !standalone) {
    var b = D.createElement("button"); b.type = "button"; b.className = "xg-fs"; b.textContent = "全屏";
    b.addEventListener("click", function (e) { e.stopPropagation(); if (fsEl()) { want(false); (D.exitFullscreen || D.webkitExitFullscreen).call(D); } else { want(true); goFs(); } });
    function paint() { b.textContent = fsEl() ? "退出全屏" : "全屏"; }
    D.addEventListener("fullscreenchange", paint); D.addEventListener("webkitfullscreenchange", paint);
    /* 换页后浏览器会退出全屏；学生第一次点页面时自动回到全屏（浏览器规定必须由点击触发） */
    /* 只在打开新页面后的第一次点击时回到全屏。之后如果全屏被系统退出（比如 iPad 弹出键盘），不再自动反复进出，学生要全屏就点“全屏”。 */
    var reFs = false;
    D.addEventListener("pointerup", function (e) {
      if (reFs) return; reFs = true;
      var t = e.target; if (t && (t.closest && t.closest("input,textarea,select,[contenteditable]"))) return;
      if (want() && !fsEl()) goFs();
    }, true);
    (D.body ? Promise.resolve() : new Promise(function (r) { D.addEventListener("DOMContentLoaded", r); })).then(function () { D.body.appendChild(b); });
    /* iPad / 平板：全屏时打字，拼音的候选字框可能出不来。点进输入框时先退出全屏（不改“想要全屏”的设置，换页后照常回到全屏） */
    var touch = (navigator.maxTouchPoints || 0) > 1;
    D.addEventListener("focusin", function (e) {
      var t = e.target; if (!touch || !fsEl() || !t || !t.matches) return;
      if (t.matches("textarea,input:not([type]),input[type=text],input[type=search],[contenteditable],[contenteditable=true]")) { try { (D.exitFullscreen || D.webkitExitFullscreen).call(D); } catch (er) {} }
    }, true);
  }

  /* ---------- 课文页：防止误划“返回” ----------
     iPad 上从屏幕左边缘往右一划，浏览器会退回首页（开场动画），学生就得从头选。
     课文页（引用 ../site-ui.js 的页面）第一次点击后放一个“挡板”；误划返回时留在本页，并提示用页面上的按钮。 */
  var me = D.currentScript && D.currentScript.getAttribute("src") || "";
  if (/^\.\.\//.test(me) && window.history && history.pushState) {
    var armed = false, tip = null, tipT = 0;
    function arm() { if (armed) return; armed = true; try { history.pushState({ xgStay: 1 }, "", location.href); } catch (e) {} }
    D.addEventListener("pointerup", arm, true);
    addEventListener("popstate", function () {
      if (!armed) return;
      try { history.pushState({ xgStay: 1 }, "", location.href); } catch (e) {}
      if (!tip) { tip = D.createElement("div"); tip.style.cssText = "position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:200;max-width:86vw;padding:10px 16px;border-radius:12px;background:rgba(21,35,42,.9);color:#f3ecdc;font:600 15px/1.5 'Noto Sans SC',system-ui,sans-serif;box-shadow:0 8px 20px -8px rgba(0,0,0,.5);text-align:center"; D.body.appendChild(tip); }
      tip.textContent = "刚才触发了“返回上一页”（多半是触控板左右划了一下），已经帮你留在这一页。要换课文，请点页面上方的“课文地图”。"; tip.hidden = false;
      clearTimeout(tipT); tipT = setTimeout(function () { tip.hidden = true; }, 3500);
    });
  }

  /* ---------- 往下滑提示 ---------- */
  var SEL = ".work,.rbody,.th-work,.screen,#app,.sheet,.dock-b,.chat-b";
  var pool = [];
  function hint(i) {
    if (!pool[i]) {
      var h = D.createElement("div"); h.className = "xg-hint"; h.hidden = true; h.setAttribute("role", "button");
      h.innerHTML = "<span>往下滑查看完整界面</span><b>↓</b>";
      h.addEventListener("click", function () { var s = h._s; if (!s) return; var by = (s === D.scrollingElement ? innerHeight : s.clientHeight) * .7; (s === D.scrollingElement ? window : s).scrollBy({ top: by, behavior: "smooth" }); });
      D.body.appendChild(h); pool[i] = h;
    }
    return pool[i];
  }
  function scrollers() {
    var out = [], se = D.scrollingElement || R;
    /* 有弹窗（老师密码、签到等）开着时，只提示弹窗里面的，不去提示被挡住的原文 */
    var ov = [].filter.call(D.querySelectorAll(".ov"), function (o) { return !o.hidden && o.offsetParent !== null; })[0];
    if (ov) { [].forEach.call(ov.querySelectorAll(SEL), function (e) { var oy = getComputedStyle(e).overflowY; if ((oy === "auto" || oy === "scroll") && e.scrollHeight - e.clientHeight - e.scrollTop > 40) { var r = e.getBoundingClientRect(); out.push([e, { top: Math.max(0, r.top), bottom: Math.min(innerHeight, r.bottom), right: Math.min(innerWidth, r.right) }]); } }); return out.slice(0, 1); }
    if (se.scrollHeight - innerHeight - se.scrollTop > 40) out.push([se, { top: 0, bottom: innerHeight, right: innerWidth }]);
    [].forEach.call(D.querySelectorAll(SEL), function (e) {
      if (e.clientHeight < 160 || e.offsetParent === null) return;
      var oy = getComputedStyle(e).overflowY; if (oy !== "auto" && oy !== "scroll") return;
      if (e.scrollHeight - e.clientHeight - e.scrollTop <= 40) return;
      var r = e.getBoundingClientRect(); if (r.bottom < 80 || r.top > innerHeight - 80) return;
      out.push([e, { top: Math.max(0, r.top), bottom: Math.min(innerHeight, r.bottom), right: Math.min(innerWidth, r.right) }]);
    });
    return out.slice(0, 3);
  }
  function tick() {
    if (!D.body) return;
    var list = scrollers();
    for (var i = 0; i < Math.max(pool.length, list.length); i++) {
      var h = hint(i), it = list[i];
      if (!it) { h.hidden = true; h._s = null; continue; }
      var box = it[1], top = Math.max(box.top + 10, (box.top + box.bottom) / 2 - 100);
      h._s = it[0]; h.hidden = false;
      h.style.left = Math.max(4, box.right - 42) + "px"; h.style.top = top + "px";
    }
  }
  setInterval(tick, 700); addEventListener("scroll", tick, true); addEventListener("resize", tick);
})();
