/* 单栏页面的专属外观（11-20），给没有改引擎的页面用（如《岳阳楼记》）：
   页面里写 window.PAGE_THEME={name,bg,acc,accInk,glass,bgc}，再引入本文件。
   底色先用 bg；之后页面上出现的大幅场景图（宽 ≥ 800 像素）加载好、又正在显示时，底色就换成那一张。 */
(function () {
  var T = window.PAGE_THEME; if (!T) return;
  function boot() {
    var b = document.body; b.classList.add("thz", "thz-" + T.name);
    [["--thz-acc", T.acc], ["--thz-acc-ink", T.accInk], ["--thz-glass", T.glass], ["--thz-bgc", T.bgc]].forEach(function (v) { if (v[1]) b.style.setProperty(v[0], v[1]); });
    var box = document.createElement("div"); box.id = "zxbg"; box.setAttribute("aria-hidden", "true"); box.innerHTML = "<i></i><i></i>"; b.prepend(box);
    var cur = 0, src0 = "";
    function set(src) { if (!src || src === src0) return; src0 = src; var im = new Image(); im.onload = function () { if (src0 !== src) return; var ls = box.querySelectorAll("i"), nx = 1 - cur; ls[nx].style.backgroundImage = 'url("' + src + '")'; ls[nx].classList.add("on"); ls[cur].classList.remove("on"); cur = nx; }; im.src = src; }
    set(T.bg);
    function scan() { var imgs = document.querySelectorAll("main img, .stage img"); for (var i = 0; i < imgs.length; i++) { var m = imgs[i]; if (m.naturalWidth >= 800 && m.offsetParent) { var r = m.getBoundingClientRect(); if (r.bottom > 0 && r.top < innerHeight) { set(m.currentSrc || m.src); return; } } } }
    setInterval(scan, 900); addEventListener("scroll", function () { clearTimeout(scan.t); scan.t = setTimeout(scan, 200); }, { passive: true });
  }
  if (document.body) boot(); else document.addEventListener("DOMContentLoaded", boot);
})();
