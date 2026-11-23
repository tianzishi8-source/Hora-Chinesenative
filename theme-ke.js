/* 课堂版（课后单机，ke 引擎和《岳阳楼记》课堂版）的专属外观（11-22，老师：参考自学版沉浸版的界面，改善课堂版）。
   conf.js 里写 window.KE_THEME={name, bg, byRoute:{recite:图, words:图, test:图, trans:图}, acc, accInk, glass, bgc}，再引入本文件。
   页面底色换成本课的场景画（虚化、压暗），按当前页面（首页、背诵、字词、测验……）换图；剧情页本来就是整屏场景，不受影响。 */
(function () {
  var T = window.KE_THEME; if (!T) return;
  function boot() {
    var b = document.body, H = document.documentElement; H.classList.add("thk", "thk-" + T.name);   /* 标记放在 <html> 上：引擎启动时会重设 body 的 class */
    [["--thk-acc", T.acc], ["--thk-acc-ink", T.accInk], ["--thk-glass", T.glass], ["--thk-bgc", T.bgc]].forEach(function (v) { if (v[1]) H.style.setProperty(v[0], v[1]); });
    var box = document.createElement("div"); box.id = "kebg"; box.setAttribute("aria-hidden", "true"); box.innerHTML = "<i></i><i></i>"; b.prepend(box);
    var cur = 0, src0 = "";
    /* 11-23 为流畅：先用事先虚化、压暗好的 xxx.bg.webp；没有这张图时退回原图，由浏览器虚化（class raw） */
    function set(src) { if (!src || src === src0) return; src0 = src; var soft = String(src).replace(/\.webp(\?.*)?$/, ".bg.webp"), raw = false;
      function show(u) { if (src0 !== src) return; var ls = box.querySelectorAll("i"), nx = 1 - cur; ls[nx].style.backgroundImage = 'url("' + u + '")'; ls[nx].classList.toggle("raw", raw); ls[nx].classList.add("on"); ls[cur].classList.remove("on"); cur = nx; }
      var im = new Image(); im.onload = function () { show(im.src); }; im.onerror = function () { if (raw) return; raw = true; im.src = src; }; im.src = soft === src ? (raw = true, src) : soft; }
    /* 老师看全班作答（#class）是密密的数据表，保持原来的纸色，不铺画 */
    var PLAIN = { "class": 1 };
    function route() { var r = (location.hash || "#home").slice(1).split("/")[0] || "home"; H.dataset.route = r; var on = !PLAIN[r]; H.classList.toggle("thk", on); box.style.display = on ? "" : "none"; if (on) set((T.byRoute && T.byRoute[r]) || T.bg); }
    addEventListener("hashchange", route); route();
  }
  if (document.body) boot(); else document.addEventListener("DOMContentLoaded", boot);
})();
