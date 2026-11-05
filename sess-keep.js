/* 签到保持：签到信息平时存在本标签页（sessionStorage）。有些平板上的 App 内置浏览器（如豆包）
 * 会在后台把页面重新加载、清掉 sessionStorage，学生就被“退回”弦歌首页重新签到。
 * 这里把签到在本机多存一份，4 小时内页面被重新加载时自动接上；退出签到就一起清掉。
 * 必须在每个页面最先加载（放在 <head> 里第一个脚本）。 */
(function () {
  var K = "hora-session", B = "hora-session-keep", TTL = 4 * 3600 * 1000;
  try {
    if (!sessionStorage.getItem(K)) {
      var b = JSON.parse(localStorage.getItem(B) || "null");
      if (b && b.s && Date.now() - b.t < TTL) sessionStorage.setItem(K, b.s);
      else if (b) localStorage.removeItem(B);
    }
  } catch (e) {}
  function mirror() {
    try {
      var s = sessionStorage.getItem(K);
      if (s) localStorage.setItem(B, JSON.stringify({ s: s, t: Date.now() }));
      else localStorage.removeItem(B);
    } catch (e) {}
  }
  setInterval(mirror, 4000);
  addEventListener("pagehide", mirror);
  addEventListener("visibilitychange", mirror);
  addEventListener("click", function () { setTimeout(mirror, 300); }, true);
})();
