/* 课堂版通用引擎 · 沉浸体验的画面：画出来的替代场景（SVG）、道具特写、环境效果（Canvas / CSS）、人物剪影。
 * 由《岳阳楼记》课堂版的 scene.js 扩充而来（原有场景不变）。有真图时（课文文件夹 img/scene-{名字}.webp）引擎用真图，这里画的只是替代。
 * 原有场景：yard 院子 / study 书房 / night 夜里书房 / rain-yard 雨中院子 / harvest 田野 / hill 土岗远望 / gate 城门
 * 新增场景见文件后半“新场景”；人物剪影 figure(kind) 见最后（没有立绘的人物先用它）。
 * 色调（tone）：day（默认）/ dusk / night / rain / bare，新场景另有 dawn / spring / summer / autumn / winter / storm / snow
 * 道具（prop）：box / letter（pt＝信封字）/ scroll（画轴，图片取 YK_CONF.scrollPic）/ draft（pt＝纸上的字）/ brush / kite / wine 酒壶酒杯 / jar 投壶 / poem 竖写的诗笺（pt）
 * 效果（fx）：rain / leaves / dust / birds / light / candle / mist / snow / petals / ripple */
(function () {
"use strict";
var uid = 0;
function R(seed) { var s = seed || 1; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
function f(n) { return Math.round(n * 10) / 10; }

/* ---------- 零件 ---------- */
function grad(id, stops, x2, y2) { return '<linearGradient id="' + id + '" x1="0" y1="0" x2="' + (x2 || 0) + '" y2="' + (y2 == null ? 1 : y2) + '">' + stops.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] != null ? ' stop-opacity="' + s[2] + '"' : "") + "/>"; }).join("") + "</linearGradient>"; }
function rgrad(id, stops, cx, cy, r) { return '<radialGradient id="' + id + '" cx="' + (cx || .5) + '" cy="' + (cy || .5) + '" r="' + (r || .5) + '">' + stops.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '" stop-opacity="' + (s[2] == null ? 1 : s[2]) + '"/>'; }).join("") + "</radialGradient>"; }
/* 远山：一条起伏的山脊线，下面填满 */
function hills(y, amp, col, op, seed, w) {
  var r = R(seed), x = -40, d = "M-40 900 L-40 " + y, py = y; w = w || 1640;
  while (x < w) { var nx = x + 90 + r() * 170, ny = y - r() * amp, cx = (x + nx) / 2; d += " Q" + f(cx) + " " + f(Math.min(py, ny) - amp * .35 * r()) + " " + f(nx) + " " + f(ny); x = nx; py = ny; }
  return '<path d="' + d + ' L' + f(x) + ' 900 Z" fill="' + col + '" opacity="' + op + '"/>';
}
/* 屋顶：两头起翘的飞檐 */
function roof(x, y, w, h, col, ridge) {
  var d = "M" + f(x + .16 * w) + " " + y + " L" + f(x + .84 * w) + " " + y + " Q" + f(x + .93 * w) + " " + f(y + .62 * h) + " " + f(x + 1.07 * w) + " " + f(y + .66 * h) +
    " Q" + f(x + .8 * w) + " " + f(y + 1.06 * h) + " " + f(x + .5 * w) + " " + f(y + h) + " Q" + f(x + .2 * w) + " " + f(y + 1.06 * h) + " " + f(x - .07 * w) + " " + f(y + .66 * h) + " Q" + f(x + .07 * w) + " " + f(y + .62 * h) + " " + f(x + .16 * w) + " " + y + " Z";
  var lines = ""; for (var i = 1; i < 18; i++) { var t = i / 18, xx = x + .02 * w + t * .96 * w; lines += '<line x1="' + f(x + .16 * w + t * .68 * w) + '" y1="' + (y + 4) + '" x2="' + f(xx) + '" y2="' + f(y + h * .95) + '" stroke="#000" stroke-opacity=".13" stroke-width="2"/>'; }
  return '<g><path d="' + d + '" fill="' + col + '"/>' + lines + '<rect x="' + f(x + .13 * w) + '" y="' + (y - 7) + '" width="' + f(.74 * w) + '" height="11" rx="3" fill="' + (ridge || col) + '"/></g>';
}
/* 树：树干＋几团叶子（叶色可给秋色） */
function tree(x, gy, s, cols, seed, trunk) {
  var r = R(seed), t = '<path d="M' + f(x - 10 * s) + " " + gy + " C" + f(x - 6 * s) + " " + f(gy - 120 * s) + " " + f(x - 26 * s) + " " + f(gy - 200 * s) + " " + f(x - 8 * s) + " " + f(gy - 300 * s) + " L" + f(x + 10 * s) + " " + f(gy - 300 * s) + " C" + f(x + 4 * s) + " " + f(gy - 200 * s) + " " + f(x + 18 * s) + " " + f(gy - 110 * s) + " " + f(x + 14 * s) + " " + gy + 'Z" fill="' + (trunk || "#5a4532") + '"/>';
  t += '<path d="M' + f(x - 4 * s) + " " + f(gy - 190 * s) + " Q" + f(x - 70 * s) + " " + f(gy - 240 * s) + " " + f(x - 110 * s) + " " + f(gy - 300 * s) + '" stroke="' + (trunk || "#5a4532") + '" stroke-width="' + f(8 * s) + '" fill="none" stroke-linecap="round"/>';
  t += '<path d="M' + f(x + 6 * s) + " " + f(gy - 220 * s) + " Q" + f(x + 70 * s) + " " + f(gy - 260 * s) + " " + f(x + 100 * s) + " " + f(gy - 330 * s) + '" stroke="' + (trunk || "#5a4532") + '" stroke-width="' + f(7 * s) + '" fill="none" stroke-linecap="round"/>';
  for (var i = 0; i < 16; i++) { var a = r() * Math.PI * 2, d = r() * 130 * s, cx = x + Math.cos(a) * d * 1.25, cy = gy - 330 * s + Math.sin(a) * d * .7, rr = (50 + r() * 50) * s; t += '<circle cx="' + f(cx) + '" cy="' + f(cy) + '" r="' + f(rr) + '" fill="' + cols[i % cols.length] + '" opacity="' + f(.55 + r() * .35) + '"/>'; }
  return "<g>" + t + "</g>";
}
function cloud(x, y, s, op) { return '<g opacity="' + (op || .8) + '" fill="#fff"><ellipse cx="' + x + '" cy="' + y + '" rx="' + 120 * s + '" ry="' + 26 * s + '"/><ellipse cx="' + (x - 40 * s) + '" cy="' + (y - 18 * s) + '" rx="' + 60 * s + '" ry="' + 30 * s + '"/><ellipse cx="' + (x + 36 * s) + '" cy="' + (y - 24 * s) + '" rx="' + 70 * s + '" ry="' + 36 * s + '"/></g>'; }
/* 田埂透视：从消失点放射的线 */
function furrows(vx, vy, y0, n, col, op) { var s = ""; for (var i = 0; i <= n; i++) { var x = -600 + i * (2800 / n); s += '<line x1="' + vx + '" y1="' + vy + '" x2="' + f(x) + '" y2="900" stroke="' + col + '" stroke-opacity="' + op + '" stroke-width="2"/>'; } return '<g clip-path="inset(0 0 0 0)">' + s + "</g>"; }
function person(x, y, s, col, bend) { // 远处干活的人：斗笠＋身子
  return '<g transform="translate(' + x + " " + y + ") scale(" + s + ")" + (bend ? " rotate(18)" : "") + '" fill="' + col + '"><path d="M-14 -46 L14 -46 L0 -58 Z"/><circle cx="0" cy="-42" r="6"/><path d="M-9 -36 L9 -36 L12 0 L-12 0 Z"/><rect x="-8" y="0" width="5" height="14"/><rect x="3" y="0" width="5" height="14"/></g>';
}
function sky(id, tone) {
  var t = { day: [[0, "#a9cfe0"], [.6, "#dfeaea"], [1, "#f4ecd9"]], dusk: [[0, "#7f84a8"], [.45, "#e9a983"], [.8, "#f6cf9c"], [1, "#f8e3c0"]], night: [[0, "#121c33"], [.7, "#2b3a5c"], [1, "#46557a"]], rain: [[0, "#7e8a93"], [.7, "#aab3b6"], [1, "#c6cbc8"]], bare: [[0, "#b8cfdc"], [.7, "#e4e7df"], [1, "#efe8d6"]] }[tone] || null;
  return grad(id, t || [[0, "#a9cfe0"], [1, "#f4ecd9"]]);
}

/* ---------- 场景 ---------- */
var S = {};
S.yard = function (tone, k) {
  var g = "y" + k, night = tone === "night", dusk = tone === "dusk";
  var leaf = night ? ["#3a4256", "#2f3749", "#454d63"] : dusk ? ["#c9873e", "#b56a33", "#d8a04f", "#9c5a2c"] : ["#d9a441", "#c8873a", "#e3bb5a", "#a9a548", "#bf9a3e"];
  var s = "<defs>" + sky(g + "s", tone) + grad(g + "g", night ? [[0, "#3c4152"], [1, "#2a2e3b"]] : [[0, "#dccaa0"], [1, "#c2a979"]]) + grad(g + "w", night ? [[0, "#5a6075"], [1, "#4b5064"]] : [[0, "#f1ebde"], [1, "#e2d8c4"]]) +
    '<pattern id="' + g + 'm" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(8)"><rect width="14" height="14" fill="' + (night ? "#4a4a50" : "#cfae6c") + '"/><line x1="0" y1="0" x2="0" y2="14" stroke="#000" stroke-opacity=".14" stroke-width="3"/></pattern></defs>';
  s += '<rect width="1600" height="900" fill="url(#' + g + 's)"/>';
  if (night) s += '<circle cx="1180" cy="150" r="46" fill="#f6f0d8"/><circle cx="1180" cy="150" r="110" fill="#f6f0d8" opacity=".12"/>';
  else s += '<circle cx="' + (dusk ? 1260 : 300) + '" cy="' + (dusk ? 330 : 120) + '" r="' + (dusk ? 60 : 70) + '" fill="' + (dusk ? "#f7b874" : "#fff8e3") + '" opacity=".9"/><circle cx="' + (dusk ? 1260 : 300) + '" cy="' + (dusk ? 330 : 120) + '" r="200" fill="#fff4d6" opacity=".25"/>';
  s += hills(370, 70, night ? "#2c3550" : "#7f8f98", night ? .9 : .28, 3) + hills(400, 50, night ? "#262d43" : "#6c7a80", night ? .9 : .3, 7);
  s += roof(80, 250, 520, 120, night ? "#20242e" : "#4a4f57") + '<rect x="120" y="360" width="440" height="80" fill="' + (night ? "#3a3f50" : "#d9cfbb") + '"/>';
  s += roof(980, 280, 420, 100, night ? "#1d2029" : "#545a62");
  s += '<rect x="-20" y="430" width="1640" height="190" fill="url(#' + g + 'w)"/>' + '<path d="M-30 438 L1630 438 L1610 414 L-10 414 Z" fill="' + (night ? "#1f232c" : "#4b5058") + '"/>';
  // 院门（开着）
  s += '<rect x="660" y="455" width="190" height="165" fill="' + (night ? "#13161d" : "#3d3328") + '"/><path d="M660 455 L700 470 L700 620 L660 620 Z" fill="' + (night ? "#33281f" : "#7a4f2e") + '"/><path d="M850 455 L810 470 L810 620 L850 620 Z" fill="' + (night ? "#33281f" : "#7a4f2e") + '"/>' + roof(630, 400, 250, 50, night ? "#1d2029" : "#4b5058");
  s += '<rect x="680" y="470" width="150" height="150" fill="' + (night ? "#1c2131" : dusk ? "#e9b98a" : "#cfe0d8") + '" opacity=".55"/>';
  // 花窗
  s += '<g transform="translate(1020 480)"><rect width="150" height="96" fill="' + (night ? "#2b2f3c" : "#cdbf9f") + '"/>';
  for (var i = 1; i < 6; i++) s += '<line x1="' + i * 25 + '" y1="0" x2="' + i * 25 + '" y2="96" stroke="#6b4b30" stroke-width="4"/>';
  s += '<line x1="0" y1="48" x2="150" y2="48" stroke="#6b4b30" stroke-width="4"/><rect width="150" height="96" fill="none" stroke="#5a3e28" stroke-width="8"/></g>';
  s += '<rect x="0" y="620" width="1600" height="280" fill="url(#' + g + 'g)"/>';
  s += tree(1370, 640, 1.25, leaf, 11);
  // 竹席和书
  if (tone !== "night") {
    s += '<path d="M210 700 L620 690 L700 820 L150 840 Z" fill="url(#' + g + 'm)" opacity=".95"/><path d="M760 690 L1160 700 L1250 830 L740 830 Z" fill="url(#' + g + 'm)" opacity=".95"/>';
    var bk = ["#3f5570", "#8a5a33", "#e8dcc0", "#5d6f4a", "#a5432f", "#efe4c9"], r = R(5);
    [[260, 760], [380, 740], [500, 770], [820, 740], [950, 770], [1080, 745]].forEach(function (p, j) {
      for (var q = 0; q < 3 + (j % 3); q++) s += '<rect x="' + f(p[0] - 40 + r() * 6) + '" y="' + f(p[1] - q * 13) + '" width="' + f(84 + r() * 10) + '" height="12" rx="2" fill="' + bk[(j + q) % bk.length] + '" stroke="#000" stroke-opacity=".15"/>';
    });
  }
  s += '<rect x="0" y="620" width="1600" height="4" fill="#000" opacity=".08"/>';
  if (dusk) s += '<rect width="1600" height="900" fill="#e07a3a" opacity=".13"/>';
  if (night) s += '<rect width="1600" height="900" fill="#0d1428" opacity=".25"/>';
  return s;
};
S.study = function (tone, k) {
  var g = "st" + k, night = tone === "night", rain = tone === "rain";
  var wall = night ? [[0, "#3a3240"], [1, "#2a2430"]] : rain ? [[0, "#d9cdb5"], [1, "#c9bb9f"]] : [[0, "#eee2c8"], [1, "#e0cfac"]];
  var s = "<defs>" + grad(g + "w", wall) + grad(g + "o", night ? [[0, "#0f1830"], [1, "#24345a"]] : rain ? [[0, "#8996a0"], [1, "#b6bdbd"]] : [[0, "#cfe4ea"], [1, "#f6f1e0"]]) +
    grad(g + "d", night ? [[0, "#3a2618"], [1, "#24170f"]] : [[0, "#7a5233"], [1, "#5b3b24"]]) + grad(g + "b", [[0, "#fff6da", night ? 0 : .5], [1, "#fff6da", 0]]) + "</defs>";
  s += '<rect width="1600" height="900" fill="url(#' + g + 'w)"/>';
  // 窗外
  s += '<rect x="560" y="140" width="480" height="380" fill="url(#' + g + 'o)"/>';
  if (night) s += '<circle cx="900" cy="250" r="44" fill="#f8f2d8"/><circle cx="900" cy="250" r="110" fill="#f8f2d8" opacity=".15"/>';
  else s += tree(640, 560, .8, rain ? ["#6d7a6a", "#5d6a5c", "#7c8775"] : ["#9cb36a", "#c7b45a", "#86a05c", "#d6a94b"], 21) + hills(470, 40, rain ? "#7e8a90" : "#9aa9a8", .5, 9, 1100);
  if (rain) { for (var i = 0; i < 40; i++) s += '<line x1="' + (570 + i * 12) + '" y1="' + (140 + (i * 37) % 300) + '" x2="' + (562 + i * 12) + '" y2="' + (190 + (i * 37) % 300) + '" stroke="#e8eef0" stroke-opacity=".6" stroke-width="1.5"/>'; }
  // 窗格
  s += '<g stroke="#5a3b25" fill="none"><rect x="560" y="140" width="480" height="380" stroke-width="18"/>';
  for (i = 1; i < 8; i++) s += '<line x1="' + (560 + i * 60) + '" y1="140" x2="' + (560 + i * 60) + '" y2="520" stroke-width="6"/>';
  for (i = 1; i < 6; i++) s += '<line x1="560" y1="' + (140 + i * 63) + '" x2="1040" y2="' + (140 + i * 63) + '" stroke-width="6"/>';
  s += '</g><rect x="540" y="515" width="520" height="22" fill="#5a3b25"/>';
  // 柱子和梁
  s += '<rect x="80" y="0" width="56" height="900" fill="#5b3b24"/><rect x="1464" y="0" width="56" height="900" fill="#5b3b24"/><rect x="0" y="40" width="1600" height="46" fill="#4d311e"/>';
  // 书架
  s += '<g transform="translate(170 170)"><rect width="300" height="520" fill="#6e4a2d"/><rect x="12" y="12" width="276" height="496" fill="#3f2a19"/>';
  var cols = ["#d9c8a0", "#3f5570", "#8a5a33", "#efe4c9", "#5d6f4a", "#a5432f"], r = R(4);
  for (var sh = 0; sh < 4; sh++) { var yy = 20 + sh * 124; s += '<rect x="12" y="' + (yy + 104) + '" width="276" height="10" fill="#6e4a2d"/>';
    for (var b = 0; b < 4; b++) { var bh = 14; for (var q = 0; q < 2 + Math.floor(r() * 4); q++) s += '<rect x="' + (22 + b * 66) + '" y="' + (yy + 92 - q * bh) + '" width="58" height="' + (bh - 2) + '" fill="' + cols[(b + q + sh) % 6] + '"/>'; }
    if (sh % 2) for (var c = 0; c < 5; c++) s += '<circle cx="' + (40 + c * 50) + '" cy="' + (yy + 40) + '" r="14" fill="#efe2c2" stroke="#8a6a40" stroke-width="3"/>'; }
  s += "</g>";
  // 挂轴
  s += '<g transform="translate(1180 120)"><rect x="-8" y="0" width="186" height="14" rx="6" fill="#5a3b25"/><rect y="12" width="170" height="440" fill="#d8c9a6"/><rect x="18" y="40" width="134" height="360" fill="#f3ead2"/>' + '<g transform="translate(18 40) scale(.0838 .4)">' + hills(600, 260, "#6d7472", .55, 31) + hills(720, 160, "#4d5553", .5, 33) + '</g><rect x="-8" y="450" width="186" height="16" rx="7" fill="#5a3b25"/></g>';
  // 光
  if (!night) s += '<path d="M560 140 L1040 140 L1300 900 L380 900 Z" fill="url(#' + g + 'b)" opacity="' + (rain ? .25 : .55) + '"/>';
  // 书桌
  s += '<path d="M-20 700 L1620 700 L1620 900 L-20 900 Z" fill="url(#' + g + 'd)"/><rect x="-20" y="694" width="1640" height="14" fill="#8a5e3a" opacity="' + (night ? .4 : .9) + '"/>';
  s += '<path d="M520 760 L1010 750 L1060 900 L470 900 Z" fill="#f6efdc" opacity="' + (night ? .75 : 1) + '"/>';
  for (i = 0; i < 6; i++) s += '<line x1="' + (930 - i * 70) + '" y1="770" x2="' + (950 - i * 74) + '" y2="890" stroke="#2b2420" stroke-width="5" stroke-opacity=".55" stroke-dasharray="14 9"/>';
  s += '<ellipse cx="300" cy="790" rx="120" ry="44" fill="#26221f"/><ellipse cx="290" cy="784" rx="80" ry="26" fill="#3b3632"/><ellipse cx="270" cy="782" rx="34" ry="12" fill="#121010"/>';
  s += '<g transform="translate(1130 760) rotate(-12)"><rect x="0" y="-6" width="250" height="12" rx="6" fill="#8b5a2b"/><path d="M250 -8 L300 0 L250 8 Z" fill="#1d1a18"/></g>';
  if (night) { s += '<rect x="1300" y="610" width="34" height="100" rx="4" fill="#efe6d0"/><path d="M1317 560 Q1302 590 1317 612 Q1332 590 1317 560Z" fill="#ffd27a"/><rect x="1270" y="704" width="94" height="14" rx="6" fill="#6b4b30"/>' + '<rect width="1600" height="900" fill="#0b0f22" opacity=".18"/>'; }
  if (rain) s += '<rect width="1600" height="900" fill="#36404a" opacity=".12"/>';
  return s;
};
S.night = function (tone, k) { return S.study("night", k); };
S["rain-yard"] = function (tone, k) {
  var g = "ry" + k, s = "<defs>" + sky(g + "s", "rain") + grad(g + "g", [[0, "#7c8382"], [1, "#5c6261"]]) + "</defs>";
  s += '<rect width="1600" height="900" fill="url(#' + g + 's)"/>' + hills(380, 60, "#7a858b", .5, 3) + roof(160, 300, 500, 110, "#555c63") + roof(950, 320, 420, 90, "#5c636a");
  s += '<rect x="-20" y="440" width="1640" height="160" fill="#c9c8bf"/><path d="M-30 448 L1630 448 L1610 424 L-10 424 Z" fill="#4b5058"/>';
  s += tree(1240, 610, 1.05, ["#6a7766", "#5b685a", "#7a8573", "#8d8c62"], 15, "#3d342b");
  s += '<rect x="0" y="600" width="1600" height="300" fill="url(#' + g + 'g)"/>';
  [[380, 720, 170, 18], [900, 780, 230, 22], [1300, 700, 120, 12], [620, 840, 150, 14]].forEach(function (p) { s += '<ellipse cx="' + p[0] + '" cy="' + p[1] + '" rx="' + p[2] + '" ry="' + p[3] + '" fill="#a7b0b2" opacity=".75"/><ellipse cx="' + p[0] + '" cy="' + p[1] + '" rx="' + p[2] * .6 + '" ry="' + p[3] * .45 + '" fill="none" stroke="#dfe4e3" stroke-opacity=".6" stroke-width="2"/>'; });
  // 屋檐（从屋里往外看）
  s += '<path d="M-20 0 L1620 0 L1620 70 Q800 110 -20 70 Z" fill="#33363c"/>';
  for (var i = 0; i < 17; i++) { var x = 30 + i * 96, y = 80 + Math.round(Math.sin(i / 16 * Math.PI) * 18); s += '<circle cx="' + x + '" cy="' + y + '" r="15" fill="#2a2c31"/><circle cx="' + x + '" cy="' + y + '" r="8" fill="#3c4048"/>'; }
  // 窗框和窗台
  s += '<rect x="0" y="0" width="90" height="900" fill="#3f2a1a"/><rect x="1510" y="0" width="90" height="900" fill="#3f2a1a"/><rect x="0" y="820" width="1600" height="80" fill="#4a3220"/><rect x="0" y="812" width="1600" height="12" fill="#6b4b30"/>';
  return s;
};
S.harvest = function (tone, k) {
  var g = "h" + k, rain = tone === "rain", bare = tone === "bare", dusk = tone === "dusk";
  var s = "<defs>" + sky(g + "s", rain ? "rain" : dusk ? "dusk" : bare ? "bare" : "day") + "</defs>";
  s += '<rect width="1600" height="900" fill="url(#' + g + 's)"/>';
  if (!rain) s += cloud(360, 140, 1.2, .75) + cloud(1180, 90, 1, .6) + cloud(820, 200, .7, .5);
  if (dusk) s += '<circle cx="1250" cy="420" r="58" fill="#f6b56f"/>';
  s += hills(420, 60, rain ? "#78838a" : "#8fa0a6", .45, 13) + hills(450, 30, rain ? "#6d777c" : "#7d8f87", .5, 17);
  var r = R(8); for (var i = 0; i < 26; i++) s += '<circle cx="' + f(i * 64 + r() * 30) + '" cy="' + f(470 - r() * 10) + '" r="' + f(24 + r() * 22) + '" fill="' + (rain ? "#56615a" : "#5f7a52") + '" opacity=".9"/>';
  s += roof(240, 420, 160, 40, "#4b5058") + roof(1320, 425, 140, 36, "#4b5058");
  var bands = rain ? ["#8f8a64", "#7c7756", "#9b9470", "#6f6a4c"] : bare ? ["#cdb98a", "#bfa877", "#d8c79c", "#b19a6c"] : ["#e3bf62", "#d4a947", "#c4b05c", "#e8cb79"];
  var ys = [470, 520, 585, 670, 780, 900];
  for (i = 0; i < 5; i++) s += '<path d="M-40 ' + ys[i] + " Q800 " + (ys[i] - 8) + " 1640 " + ys[i] + " L1640 " + ys[i + 1] + " L-40 " + ys[i + 1] + 'Z" fill="' + bands[i % 4] + '"/>';
  s += furrows(800, 470, 470, 28, rain ? "#4b4a38" : "#7a5a2a", bare ? .22 : .16);
  if (bare) { for (i = 0; i < 260; i++) { var x = r() * 1600, y = 600 + r() * 300; s += '<line x1="' + f(x) + '" y1="' + f(y) + '" x2="' + f(x + 1) + '" y2="' + f(y - 6 - (y - 600) / 30) + '" stroke="#8a7650" stroke-width="2" opacity=".6"/>'; } }
  else {
    // 场院：谷堆、草垛、干活的人
    s += '<path d="M500 900 Q560 700 900 690 Q1240 700 1300 900 Z" fill="' + (rain ? "#8a856f" : "#e6d7ae") + '"/>';
    [[700, 760, 90], [1010, 740, 70], [860, 820, 110]].forEach(function (p) { s += '<path d="M' + (p[0] - p[2]) + " " + p[1] + " Q" + p[0] + " " + (p[1] - p[2] * .9) + " " + (p[0] + p[2]) + " " + p[1] + 'Z" fill="' + (rain ? "#8f7d4b" : "#d9a640") + '"/>'; });
    s += '<path d="M1360 640 Q1400 520 1440 640 Z" fill="#c89a4a"/><path d="M160 660 Q210 540 260 660 Z" fill="#c89a4a"/>';
    if (!rain) { s += person(560, 560, 1.3, "#4a4a44", 1) + person(640, 548, 1.1, "#3f4f5c") + person(1080, 556, 1.2, "#5a4636", 1) + person(1180, 540, 1, "#4a4a44") + person(930, 700, 1.6, "#3f4f5c", 1) + person(780, 690, 1.5, "#5a4636"); }
  }
  if (rain) s += '<rect width="1600" height="900" fill="#3e4850" opacity=".18"/>';
  if (dusk) s += '<rect width="1600" height="900" fill="#e07a3a" opacity=".14"/>';
  return s;
};
S.hill = function (tone, k) {
  var g = "hl" + k, dusk = tone === "dusk";
  var s = "<defs>" + grad(g + "s", dusk ? [[0, "#4e5579"], [.45, "#c9767a"], [.7, "#ee9b62"], [1, "#f6c78e"]] : [[0, "#9db4c9"], [.5, "#ecdcbc"], [.75, "#f4cf9c"], [1, "#f2dcb4"]]) +
    grad(g + "r", dusk ? [[0, "#f3b07a"], [1, "#a8708a"]] : [[0, "#f6e2b8"], [1, "#9fb5bf"]], 1, 0) + grad(g + "e", [[0, dusk ? "#5a4434" : "#8a6c48"], [1, dusk ? "#2e2219" : "#5a4430"]]) + "</defs>";
  s += '<rect width="1600" height="900" fill="url(#' + g + 's)"/>';
  s += '<circle cx="1160" cy="' + (dusk ? 470 : 380) + '" r="' + (dusk ? 54 : 44) + '" fill="' + (dusk ? "#f46a3c" : "#fff1cf") + '"/><circle cx="1160" cy="' + (dusk ? 470 : 380) + '" r="160" fill="' + (dusk ? "#f4914f" : "#fff6dc") + '" opacity=".25"/>';
  s += hills(420, 110, dusk ? "#5e5470" : "#8798a4", .55, 41) + hills(460, 70, dusk ? "#4d4560" : "#76878f", .6, 43) + hills(495, 40, dusk ? "#43405a" : "#6c7c78", .65, 47);
  // 平原和收空的田
  var cols = dusk ? ["#8b6d5c", "#7a5f50", "#957664", "#6f5649"] : ["#c9b184", "#bba274", "#d4bf92", "#b39a6a"], r = R(12);
  s += '<rect x="0" y="500" width="1600" height="400" fill="' + cols[1] + '"/>';
  for (var row = 0; row < 7; row++) { var y0 = 500 + Math.pow(row / 7, 1.6) * 400, y1 = 500 + Math.pow((row + 1) / 7, 1.6) * 400, n = 5 + row;
    for (var c = 0; c < n; c++) { var x0 = c * 1600 / n + (r() - .5) * 40, x1 = (c + 1) * 1600 / n; s += '<path d="M' + f(x0) + " " + f(y0) + " L" + f(x1) + " " + f(y0 + 2) + " L" + f(x1 + 10) + " " + f(y1) + " L" + f(x0 - 10) + " " + f(y1) + 'Z" fill="' + cols[(row + c) % 4] + '" stroke="#5a4632" stroke-opacity=".25" stroke-width="2"/>'; } }
  // 河
  s += '<path d="M-40 640 C300 600 520 560 760 540 C960 524 1120 516 1640 506 L1640 520 C1160 532 980 548 780 566 C560 588 330 640 -40 700 Z" fill="url(#' + g + 'r)" opacity=".95"/>';
  for (var i = 0; i < 14; i++) s += '<line x1="' + (1000 + i * 30) + '" y1="' + (522 + (i % 3) * 5) + '" x2="' + (1030 + i * 30) + '" y2="' + (522 + (i % 3) * 5) + '" stroke="#fff3d0" stroke-width="3" opacity=".7"/>';
  // 远处的邓州城
  s += '<g opacity=".7"><rect x="150" y="470" width="300" height="34" fill="' + (dusk ? "#4a3f4a" : "#7d7466") + '"/>' + roof(260, 440, 90, 26, dusk ? "#3a3240" : "#5c5650") + "</g>";
  // 土岗
  s += '<path d="M-40 900 L-40 760 Q200 700 520 730 Q820 760 1000 800 Q1200 840 1640 820 L1640 900 Z" fill="url(#' + g + 'e)"/>';
  for (i = 0; i < 70; i++) { var x = r() * 1600, y = 780 + r() * 110; s += '<path d="M' + f(x) + " " + f(y) + " q-6 -22 -14 -30 M" + f(x) + " " + f(y) + " q2 -26 6 -34 M" + f(x) + " " + f(y) + ' q10 -18 20 -24" stroke="' + (dusk ? "#7a6a48" : "#a89a5a") + '" stroke-width="3" fill="none" opacity=".7"/>'; }
  s += '<path d="M130 800 C120 700 150 640 120 560 M126 660 Q80 620 50 560 M136 610 Q190 570 210 520" stroke="#3a2c20" stroke-width="10" fill="none" stroke-linecap="round"/>';
  if (dusk) s += '<rect width="1600" height="900" fill="#3b1e40" opacity=".12"/>';
  return s;
};
S.gate = function (tone, k) {
  var g = "gt" + k, dusk = tone === "dusk";
  var s = "<defs>" + sky(g + "s", dusk ? "dusk" : "day") + grad(g + "w", dusk ? [[0, "#7c6658"], [1, "#5e4c42"]] : [[0, "#a89880"], [1, "#8c7c66"]]) + grad(g + "r", [[0, dusk ? "#8a6a52" : "#c9b08a"], [1, dusk ? "#5f4838" : "#a88d66"]]) + "</defs>";
  s += '<rect width="1600" height="900" fill="url(#' + g + 's)"/>' + cloud(1200, 130, 1, .5) + hills(440, 60, dusk ? "#5e5470" : "#8a9aa2", .4, 51);
  s += '<rect x="-20" y="380" width="1640" height="240" fill="url(#' + g + 'w)"/>';
  for (var i = 0; i < 40; i++) s += '<rect x="' + (i * 42 - 10) + '" y="356" width="26" height="28" fill="url(#' + g + 'w)"/>';
  for (i = 0; i < 9; i++) s += '<line x1="0" y1="' + (400 + i * 26) + '" x2="1600" y2="' + (400 + i * 26) + '" stroke="#000" stroke-opacity=".08" stroke-width="2"/>';
  // 城门洞
  s += '<path d="M690 620 L690 500 Q800 420 910 500 L910 620 Z" fill="#2a221c"/><path d="M712 620 L712 506 Q800 444 888 506 L888 620 Z" fill="' + (dusk ? "#e7a877" : "#d8e2d2") + '" opacity=".6"/>';
  // 城楼
  s += '<rect x="620" y="268" width="360" height="92" fill="' + (dusk ? "#6a3e30" : "#8a4a32") + '"/>';
  for (i = 0; i < 6; i++) s += '<rect x="' + (640 + i * 58) + '" y="282" width="36" height="66" fill="' + (dusk ? "#3a2a24" : "#5a3a26") + '"/>';
  s += roof(580, 196, 440, 84, "#3f444c") + roof(640, 120, 320, 70, "#3f444c");
  // 路和树
  s += '<path d="M700 620 L900 620 L1300 900 L300 900 Z" fill="url(#' + g + 'r)"/><path d="M-20 620 L700 620 L300 900 L-20 900 Z" fill="' + (dusk ? "#6e6a4a" : "#b3a36c") + '"/><path d="M900 620 L1620 620 L1620 900 L1300 900 Z" fill="' + (dusk ? "#6e6a4a" : "#b3a36c") + '"/>';
  [[180, 700, 1.3], [420, 640, .8], [1180, 640, .8], [1420, 700, 1.3]].forEach(function (p, j) { s += '<rect x="' + (p[0] - 6 * p[2]) + '" y="' + (p[1] - 260 * p[2]) + '" width="' + 12 * p[2] + '" height="' + 260 * p[2] + '" fill="#4a3a2a"/><ellipse cx="' + p[0] + '" cy="' + (p[1] - 300 * p[2]) + '" rx="' + 46 * p[2] + '" ry="' + 140 * p[2] + '" fill="' + (dusk ? "#7a5a34" : "#c9a24a") + '" opacity=".9"/><ellipse cx="' + (p[0] + 10) + '" cy="' + (p[1] - 280 * p[2]) + '" rx="' + 30 * p[2] + '" ry="' + 100 * p[2] + '" fill="' + (dusk ? "#8f6a3c" : "#ddb95c") + '" opacity=".8"/>'; });
  if (dusk) s += '<rect width="1600" height="900" fill="#e07a3a" opacity=".12"/>';
  return s;
};
function sceneSVG(name, tone) {
  var fn = S[name]; if (!fn) return "";
  uid++; return '<svg class="draw" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + fn(tone || "day", uid) + "</svg>";
}

/* ---------- 道具特写 ---------- */
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
var LAKE = (window.YK_CONF && YK_CONF.scrollPic) || "../yueyanglou/img/lake.webp";
function propHTML(name, o) {
  o = o || {};
  if (name === "box") return '<div class="prop p-box' + (o.open ? " open" : "") + '"><svg viewBox="0 0 600 380" aria-hidden="true"><defs><linearGradient id="bxw" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a5a34"/><stop offset="1" stop-color="#5a361e"/></linearGradient></defs>' +
    '<path d="M60 150 L540 150 L560 330 L40 330 Z" fill="url(#bxw)"/><path d="M40 330 L560 330 L560 352 L40 352 Z" fill="#3e2514"/>' +
    '<g class="inside"><path d="M80 160 L520 160 L536 316 L64 316 Z" fill="#2a190d"/><rect x="120" y="190" width="200" height="110" fill="#eadbb8" transform="rotate(-4 220 245)"/><rect x="205" y="196" width="26" height="100" fill="#b23a2a" transform="rotate(-4 220 245)"/><rect x="330" y="220" width="190" height="42" rx="20" fill="#d8c69a"/><circle cx="512" cy="241" r="24" fill="#6b4224"/></g>' +
    '<g class="lid"><path d="M50 96 L550 96 L540 150 L60 150 Z" fill="#9a6a40"/><path d="M50 96 L550 96 L550 110 L50 110 Z" fill="#b7875a"/><rect x="270" y="122" width="60" height="16" rx="4" fill="#c9a24a"/></g></svg></div>';
  if (name === "letter") return '<div class="prop p-letter"><div class="env"><span class="strip">' + esc(o.t == null ? "范经略" : o.t) + '</span></div><div class="sheet-l"></div></div>';
  if (name === "scroll") return '<div class="prop p-scroll' + (o.peek ? " peek" : "") + '"><div class="rod l"></div><div class="paper"><div class="pic" style="background-image:url(' + LAKE + ')"></div></div><div class="rod r"></div></div>';
  if (name === "draft") { var t = String(o.t || ""), cs = Array.from(t), step = Math.min(.12, 2.4 / Math.max(1, cs.length));
    return '<div class="prop p-draft"><div class="pp"><p>' + cs.map(function (c, i) { return '<i style="animation-delay:' + (.3 + i * step).toFixed(2) + 's">' + esc(c) + "</i>"; }).join("") + '</p></div><div class="brush"></div></div>'; }
  if (name === "brush") return '<div class="prop p-brush"><svg viewBox="0 0 600 360" aria-hidden="true"><rect x="20" y="40" width="560" height="300" rx="8" fill="#f4ecd8"/><ellipse cx="210" cy="210" rx="150" ry="100" fill="#26221f"/><ellipse cx="200" cy="200" rx="104" ry="64" fill="#3b3632"/><ellipse cx="180" cy="196" rx="46" ry="22" fill="#0d0c0b"/><g transform="rotate(-20 450 190)"><rect x="330" y="182" width="260" height="16" rx="8" fill="#8b5a2b"/><path d="M330 178 L280 190 L330 202 Z" fill="#1a1715"/></g></svg></div>';
  if (name === "kite") return '<div class="prop p-kite"><svg viewBox="0 0 400 400" aria-hidden="true"><path d="M200 60 L330 170 L200 230 L70 170 Z" fill="#f2e6c8" stroke="#5a3b25" stroke-width="5"/><path d="M200 60 L200 330 M70 170 L330 170" stroke="#5a3b25" stroke-width="4"/>' +
    '<path d="M130 160 Q200 110 270 160 Q230 150 200 175 Q170 150 130 160Z" fill="#6a4a30"/><circle cx="200" cy="140" r="9" fill="#a3382a"/><path d="M190 228 L200 300 L210 228" fill="#a3382a"/><path d="M200 230 C210 290 170 330 210 390" stroke="#7a6a50" stroke-width="2" fill="none" stroke-dasharray="6 6"/></svg></div>';
  return "";
}

/* ---------- 环境效果：一张 Canvas 画雨、叶、尘、鸟；光柱、烛光、薄雾、滴水用 CSS ---------- */
function FX(canvas) {
  this.c = canvas; this.x = canvas.getContext("2d"); this.on = {}; this.p = []; this.raf = 0; this.t0 = 0;
  this.reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var me = this; this.rs = function () { me.size(); }; addEventListener("resize", this.rs); this.size();
}
FX.prototype.size = function () { var d = Math.min(2, window.devicePixelRatio || 1), r = this.c.getBoundingClientRect(); this.w = r.width; this.h = r.height; this.c.width = Math.round(r.width * d); this.c.height = Math.round(r.height * d); this.x.setTransform(d, 0, 0, d, 0, 0); };
FX.prototype.set = function (list) {
  var on = {}; (list || []).forEach(function (k) { on[k] = 1; }); this.on = on;
  var w = this.w, h = this.h, area = w * h / (1024 * 768), P = [], i;
  if (on.rain) for (i = 0; i < Math.round(170 * area + 40); i++) P.push({ k: "rain", x: Math.random() * w * 1.2, y: Math.random() * h, v: 900 + Math.random() * 500, l: 14 + Math.random() * 22, a: .25 + Math.random() * .35 });
  if (on.leaves) for (i = 0; i < Math.round(14 * Math.sqrt(area) + 6); i++) P.push({ k: "leaf", x: Math.random() * w, y: Math.random() * h - h, v: 40 + Math.random() * 50, s: 6 + Math.random() * 8, r: Math.random() * 6, vr: (Math.random() - .5) * 3, ph: Math.random() * 6, c: ["#d9a441", "#c8742f", "#e3bb5a", "#a85a2a"][i % 4] });
  if (on.dust) for (i = 0; i < Math.round(50 * area + 14); i++) P.push({ k: "dust", x: Math.random() * w, y: Math.random() * h, s: .8 + Math.random() * 2, ph: Math.random() * 6, v: 4 + Math.random() * 10 });
  if (on.birds) for (i = 0; i < 5; i++) P.push({ k: "bird", x: -60 - i * 46 - Math.random() * 30, y: h * (.16 + .03 * (i % 3)) + i * 9, v: 34 + Math.random() * 6, s: 9 - i * .6, ph: Math.random() * 6 });
  this.p = P; this.x.clearRect(0, 0, w, h);
  if (P.length && !this.raf) { var me = this; this.last = 0; this.raf = requestAnimationFrame(function (t) { me.tick(t); }); }
};
FX.prototype.tick = function (t) {
  var me = this, x = this.x, w = this.w, h = this.h, dt = this.last ? Math.min(.05, (t - this.last) / 1000) : 0; this.last = t;
  if (this.reduce) dt *= .3;
  x.clearRect(0, 0, w, h);
  for (var i = 0; i < this.p.length; i++) { var p = this.p[i];
    if (p.k === "rain") { p.y += p.v * dt; p.x -= p.v * .18 * dt; if (p.y > h) { p.y = -p.l; p.x = Math.random() * w * 1.2; } x.strokeStyle = "rgba(230,236,240," + p.a + ")"; x.lineWidth = 1.2; x.beginPath(); x.moveTo(p.x, p.y); x.lineTo(p.x + p.l * .18, p.y - p.l); x.stroke(); }
    else if (p.k === "leaf") { p.y += p.v * dt; p.ph += dt * 1.6; p.x += Math.sin(p.ph) * 30 * dt - 12 * dt; p.r += p.vr * dt; if (p.y > h + 20) { p.y = -20; p.x = Math.random() * w * 1.1; }
      x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.scale(1, Math.abs(Math.cos(p.ph)) * .7 + .3); x.fillStyle = p.c; x.globalAlpha = .9; x.beginPath(); x.ellipse(0, 0, p.s, p.s * .45, 0, 0, 7); x.fill(); x.restore(); }
    else if (p.k === "dust") { p.ph += dt * .7; p.y -= p.v * dt * .4; p.x += Math.sin(p.ph) * 6 * dt; if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; } x.fillStyle = "rgba(255,246,214," + (.35 + .3 * Math.sin(p.ph * 2)) + ")"; x.beginPath(); x.arc(p.x, p.y, p.s, 0, 7); x.fill(); }
    else if (p.k === "bird") { p.x += p.v * dt; p.ph += dt * 7; if (p.x > w + 80) { p.x = -80; } var fl = Math.sin(p.ph) * p.s * .55; x.strokeStyle = "rgba(40,36,34,.75)"; x.lineWidth = 2; x.beginPath(); x.moveTo(p.x - p.s, p.y - fl); x.quadraticCurveTo(p.x - p.s * .4, p.y - fl * .3, p.x, p.y); x.quadraticCurveTo(p.x + p.s * .4, p.y - fl * .3, p.x + p.s, p.y - fl); x.stroke(); }
  }
  if (this.p.length) this.raf = requestAnimationFrame(function (t) { me.tick(t); }); else this.raf = 0;
};
FX.prototype.stop = function () { cancelAnimationFrame(this.raf); this.raf = 0; this.p = []; removeEventListener("resize", this.rs); };

/* ================= 新场景 =================
 * 山水：mount 群山环抱（远处一座小城）/ stream 两峰之间的山泉 / pavilion 泉上的亭子 / path 山路（峰回路转）/ feast 亭前宴饮 / road 山路上的行人
 * 湖：lakeview 洞庭湖面（君山、帆）/ boat 从小船船舱往外看 / rail 楼上凭栏望湖 / wharf 岸边码头和城 / tavern 楼上酒席（窗外是湖）
 * 现代：hall 讲堂（黑板、长桌）/ riverbank 江边（夹岸桃花）/ lonetree 原野上一棵树（四季）
 * 季节色调：spring 春 / summer 夏 / autumn 秋 / winter 冬；天气：dawn 清晨薄雾 / dusk / night / storm 风浪 / snow 雪 */
function seasonLeaves(tone) {
  return { spring: ["#9cc26a", "#b9d27e", "#f0b8c4", "#86b05a"], summer: ["#4f7f3e", "#3f6e35", "#5f8f45", "#2f5a2c"], autumn: ["#c9873e", "#b5532f", "#d8a04f", "#9c3f2c", "#e0b45a"],
    winter: ["#8d8f84", "#7a7d72", "#a5a79c"], dusk: ["#5f6a45", "#4d5a3a", "#6b6a40"], night: ["#2e3a40", "#26313a", "#34404a"] }[tone] || ["#6f9a4f", "#5d8a45", "#86a85a", "#4f7a3e"];
}
function skyT(id, tone) {
  var t = { dawn: [[0, "#b9c7d6"], [.6, "#e8e2d6"], [1, "#f1e6d2"]], spring: [[0, "#a9cfe0"], [.6, "#e6efe8"], [1, "#f6efdc"]], summer: [[0, "#7fb6d8"], [.6, "#cfe4ec"], [1, "#eef0e0"]],
    autumn: [[0, "#9fbfd6"], [.6, "#e9e4d2"], [1, "#f3e3c2"]], winter: [[0, "#b4bcc4"], [.7, "#dcdedb"], [1, "#ecebe4"]], storm: [[0, "#4a5560"], [.6, "#6f7a80"], [1, "#8d9596"]], snow: [[0, "#aeb6bd"], [1, "#e4e6e4"]] }[tone];
  return t ? grad(id, t) : sky(id, tone);
}
function veil(tone) {
  if (tone === "dusk") return '<rect width="1600" height="900" fill="#e07a3a" opacity=".14"/>';
  if (tone === "night") return '<rect width="1600" height="900" fill="#0d1428" opacity=".42"/>';
  if (tone === "dawn") return '<rect width="1600" height="900" fill="#e8eef2" opacity=".18"/>';
  if (tone === "storm" || tone === "rain") return '<rect width="1600" height="900" fill="#2e3840" opacity=".2"/>';
  if (tone === "winter" || tone === "snow") return '<rect width="1600" height="900" fill="#e6ecf0" opacity=".12"/>';
  return "";
}
function sunMoon(tone, x, y) {
  if (tone === "night") return '<circle cx="' + x + '" cy="' + y + '" r="40" fill="#f6f0d8"/><circle cx="' + x + '" cy="' + y + '" r="110" fill="#f6f0d8" opacity=".12"/>';
  if (tone === "dusk") return '<circle cx="' + x + '" cy="' + (y + 200) + '" r="56" fill="#f39a5a"/><circle cx="' + x + '" cy="' + (y + 200) + '" r="170" fill="#f6b06a" opacity=".22"/>';
  if (tone === "storm" || tone === "rain" || tone === "snow" || tone === "dawn") return "";
  return '<circle cx="' + x + '" cy="' + y + '" r="52" fill="#fff6dc" opacity=".95"/><circle cx="' + x + '" cy="' + y + '" r="160" fill="#fff6dc" opacity=".22"/>';
}
/* 一座峰：尖顶山，左右两坡，带几道皴线 */
function peak(x, base, w, h, col, op, seed) {
  var r = R(seed || 3), d = "M" + f(x - w / 2) + " " + base + " Q" + f(x - w * .3) + " " + f(base - h * .55) + " " + f(x - w * .08) + " " + f(base - h * .9) + " Q" + f(x) + " " + f(base - h * 1.04) + " " + f(x + w * .1) + " " + f(base - h * .88) + " Q" + f(x + w * .32) + " " + f(base - h * .5) + " " + f(x + w / 2) + " " + base + " Z";
  var lines = ""; for (var i = 0; i < 5; i++) { var sx = x - w * .2 + r() * w * .4, sy = base - h * (.2 + r() * .55); lines += '<path d="M' + f(sx) + " " + f(sy) + " q" + f(-20 - r() * 30) + " " + f(40 + r() * 40) + " " + f(-10 - r() * 40) + " " + f(90 + r() * 60) + '" stroke="#000" stroke-opacity=".1" stroke-width="4" fill="none"/>'; }
  return '<g opacity="' + (op == null ? 1 : op) + '"><path d="' + d + '" fill="' + col + '"/>' + lines + "</g>";
}
/* 松树（一层层的松针） */
function pine(x, gy, s, col, trunk) {
  var t = '<rect x="' + f(x - 6 * s) + '" y="' + f(gy - 160 * s) + '" width="' + f(12 * s) + '" height="' + f(160 * s) + '" fill="' + (trunk || "#4a3726") + '"/>';
  for (var i = 0; i < 4; i++) { var y = gy - 60 * s - i * 42 * s, w = (110 - i * 22) * s; t += '<path d="M' + f(x - w) + " " + f(y) + " Q" + f(x) + " " + f(y - 70 * s) + " " + f(x + w) + " " + f(y) + " Q" + f(x) + " " + f(y - 22 * s) + " " + f(x - w) + " " + f(y) + 'Z" fill="' + col + '"/>'; }
  return "<g>" + t + "</g>";
}
/* 亭子：四柱、宝顶、檐角高高翘起（翼然） */
function pavilionG(x, gy, s, tone) {
  var night = tone === "night", col = night ? "#262a33" : "#3f444c", wood = night ? "#3a2a22" : "#7a3e28";
  var w = 300 * s, h = 230 * s, top = gy - h;
  var t = '<rect x="' + f(x - w * .55) + '" y="' + f(gy - 6 * s) + '" width="' + f(w * 1.1) + '" height="' + f(26 * s) + '" fill="' + (night ? "#3a3d44" : "#b9b0a0") + '"/>';
  [-.42, -.14, .14, .42].forEach(function (k) { t += '<rect x="' + f(x + k * w - 8 * s) + '" y="' + f(top + 40 * s) + '" width="' + f(16 * s) + '" height="' + f(h - 40 * s) + '" fill="' + wood + '"/>'; });
  t += '<rect x="' + f(x - w * .45) + '" y="' + f(top + 34 * s) + '" width="' + f(w * .9) + '" height="' + f(18 * s) + '" fill="' + wood + '"/>';
  t += '<rect x="' + f(x - w * .45) + '" y="' + f(gy - 70 * s) + '" width="' + f(w * .9) + '" height="' + f(8 * s) + '" fill="' + wood + '" opacity=".8"/>';
  // 檐：两层，角翘得很高
  var ew = w * .78, ey = top + 36 * s;
  t += '<path d="M' + f(x - ew) + " " + f(ey - 46 * s) + " Q" + f(x - ew * .78) + " " + f(ey + 6 * s) + " " + f(x - ew * .45) + " " + f(ey + 4 * s) + " L" + f(x + ew * .45) + " " + f(ey + 4 * s) + " Q" + f(x + ew * .78) + " " + f(ey + 6 * s) + " " + f(x + ew) + " " + f(ey - 46 * s) +
    " Q" + f(x + ew * .7) + " " + f(ey - 28 * s) + " " + f(x + ew * .42) + " " + f(ey - 40 * s) + " L" + f(x + 26 * s) + " " + f(ey - 128 * s) + " L" + f(x - 26 * s) + " " + f(ey - 128 * s) + " L" + f(x - ew * .42) + " " + f(ey - 40 * s) + " Q" + f(x - ew * .7) + " " + f(ey - 28 * s) + " " + f(x - ew) + " " + f(ey - 46 * s) + 'Z" fill="' + col + '"/>';
  for (var i = 1; i < 12; i++) { var k = i / 12 - .5; t += '<line x1="' + f(x + k * 50 * s) + '" y1="' + f(ey - 124 * s) + '" x2="' + f(x + k * ew * 1.6) + '" y2="' + f(ey - 6 * s) + '" stroke="#000" stroke-opacity=".14" stroke-width="' + f(3 * s) + '"/>'; }
  t += '<path d="M' + f(x - 10 * s) + " " + f(ey - 128 * s) + " Q" + f(x) + " " + f(ey - 175 * s) + " " + f(x + 10 * s) + " " + f(ey - 128 * s) + 'Z" fill="' + col + '"/><circle cx="' + f(x) + '" cy="' + f(ey - 170 * s) + '" r="' + f(9 * s) + '" fill="' + (night ? "#5a5040" : "#b08a3a") + '"/>';
  return "<g>" + t + "</g>";
}
/* 远处的人（站、走、背东西、拄杖、小孩） */
function walker(x, y, s, col, kind) {
  var g = '<g transform="translate(' + f(x) + " " + f(y) + ") scale(" + s + ')" fill="' + col + '">';
  g += '<circle cx="0" cy="-74" r="10"/><path d="M-13 -62 L13 -62 L18 -10 L-18 -10 Z"/><path d="M-12 -10 L-4 -10 L-6 12 L-14 12Z M4 -10 L12 -10 L14 12 L6 12Z"/>';
  if (kind === "load") g += '<rect x="-30" y="-58" width="60" height="5" rx="2"/><path d="M-34 -54 L-24 -54 L-22 -30 L-36 -30Z M24 -54 L34 -54 L36 -30 L22 -30Z"/>';
  if (kind === "old") g += '<path d="M14 -50 L24 12" stroke="' + col + '" stroke-width="3"/>';
  if (kind === "kid") g = '<g transform="translate(' + f(x) + " " + f(y) + ") scale(" + (s * .7) + ')" fill="' + col + '"><circle cx="0" cy="-74" r="12"/><path d="M-13 -60 L13 -60 L18 -10 L-18 -10 Z"/><path d="M-12 -10 L-4 -10 L-6 12 L-14 12Z M4 -10 L12 -10 L14 12 L6 12Z"/>';
  return g + "</g>";
}
/* 水面：渐变＋横向波纹 */
function water(y0, y1, cols, seed, glint) {
  var r = R(seed || 5), s = '<rect x="-20" y="' + y0 + '" width="1640" height="' + (y1 - y0) + '" fill="' + cols[0] + '"/>';
  for (var i = 0; i < 60; i++) { var y = y0 + Math.pow(r(), 1.6) * (y1 - y0), x = r() * 1600, w = 30 + (y - y0) / (y1 - y0) * 160 * r(); s += '<line x1="' + f(x) + '" y1="' + f(y) + '" x2="' + f(x + w) + '" y2="' + f(y) + '" stroke="' + (glint || "#fff") + '" stroke-opacity="' + f(.12 + r() * .25) + '" stroke-width="' + f(1.5 + (y - y0) / (y1 - y0) * 3) + '" stroke-linecap="round"/>'; }
  return s;
}
function sail(x, y, s, col) { return '<g transform="translate(' + f(x) + " " + f(y) + ") scale(" + s + ')"><path d="M-40 0 L40 0 L30 14 L-30 14 Z" fill="#3a3028"/><path d="M0 -4 L0 -90 L36 -10 Z" fill="' + (col || "#efe6d0") + '"/><path d="M-2 -4 L-2 -70 L-26 -8 Z" fill="' + (col || "#e2d6bc") + '" opacity=".85"/></g>'; }

S.mount = function (tone, k) {
  var g = "mo" + k, s = "<defs>" + skyT(g + "s", tone) + "</defs><rect width=\"1600\" height=\"900\" fill=\"url(#" + g + 's)"/>' + sunMoon(tone, 1240, 150);
  var far = tone === "night" ? "#2c3550" : tone === "dusk" ? "#6d6080" : "#93a6ae", mid = tone === "night" ? "#232c43" : tone === "dusk" ? "#5a5070" : "#6f8a86", near = tone === "night" ? "#1b2233" : tone === "dusk" ? "#4a4260" : tone === "autumn" ? "#7a6a46" : tone === "winter" ? "#7f857c" : "#4f6e52";
  // 四面都是山：两边高、中间低，远处一圈
  s += hills(360, 90, far, .55, 61) + peak(220, 520, 520, 340, mid, .9, 2) + peak(1380, 520, 560, 380, mid, .9, 4) + peak(560, 520, 360, 220, far, .7, 6) + peak(1080, 520, 420, 260, far, .7, 8);
  s += peak(1180, 560, 300, 300, near, .95, 9);   // 西南那一座（琅琊）更深更秀
  // 谷地里的小城
  s += '<g opacity=".85"><rect x="640" y="520" width="320" height="40" fill="' + (tone === "night" ? "#3a3f50" : "#9a8e78") + '"/>';
  for (var i = 0; i < 16; i++) s += '<rect x="' + (642 + i * 20) + '" y="510" width="12" height="12" fill="' + (tone === "night" ? "#3a3f50" : "#9a8e78") + '"/>';
  s += roof(760, 480, 90, 30, tone === "night" ? "#22262e" : "#5a5a5c") + roof(680, 500, 60, 20, tone === "night" ? "#22262e" : "#62625f") + roof(880, 498, 60, 20, tone === "night" ? "#22262e" : "#62625f") + "</g>";
  s += '<rect x="-20" y="555" width="1640" height="345" fill="' + (tone === "night" ? "#1d2430" : tone === "autumn" ? "#a99a6a" : tone === "winter" ? "#c9c8bd" : "#8aa070") + '"/>';
  s += hills(600, 50, near, .9, 63);
  var lc = seasonLeaves(tone); [[60, 1], [250, .7], [1350, .75], [1540, 1.05]].forEach(function (q, i) { s += tree(q[0], 900, q[1], lc, 70 + i); });
  if (tone === "dawn") s += '<rect x="0" y="420" width="1600" height="160" fill="#fff" opacity=".35"/>';
  return s + veil(tone);
};
S.stream = function (tone, k) {
  var g = "sm" + k, s = "<defs>" + skyT(g + "s", tone) + grad(g + "w", [[0, "#d9ecf0"], [1, "#9cc0c6"]]) + "</defs><rect width=\"1600\" height=\"900\" fill=\"url(#" + g + 's)"/>';
  var rock = tone === "night" ? "#2a303c" : tone === "autumn" ? "#7d7062" : "#6b7470", rock2 = tone === "night" ? "#20252f" : "#59615e";
  // 两座峰夹着一道缝
  s += peak(380, 760, 820, 720, rock, 1, 11) + peak(1240, 760, 860, 760, rock2, 1, 13);
  s += '<path d="M760 120 Q780 300 770 460 Q760 600 800 760 L860 760 Q830 600 840 450 Q850 300 830 120 Z" fill="' + (tone === "night" ? "#2a3240" : "#c6dde0") + '" opacity=".85"/>';
  // 泉水泻下
  for (var i = 0; i < 8; i++) s += '<path d="M' + (775 + i * 8) + ' 140 Q' + (790 + i * 6) + ' 420 ' + (790 + i * 9) + ' 760" stroke="#fff" stroke-opacity="' + (.25 + (i % 3) * .15) + '" stroke-width="' + (3 + i % 3) + '" fill="none"/>';
  // 潭和溪
  s += '<path d="M-20 760 Q500 720 800 740 Q1100 760 1640 730 L1640 900 L-20 900 Z" fill="url(#' + g + 'w)"/>' + water(750, 900, ["transparent"], 17);
  [[520, 790, 70], [1060, 800, 90], [300, 860, 120], [1320, 850, 110], [860, 870, 60]].forEach(function (p) { s += '<ellipse cx="' + p[0] + '" cy="' + p[1] + '" rx="' + p[2] + '" ry="' + p[2] * .42 + '" fill="' + rock + '"/><ellipse cx="' + (p[0] - p[2] * .2) + '" cy="' + (p[1] - p[2] * .15) + '" rx="' + p[2] * .6 + '" ry="' + p[2] * .2 + '" fill="#fff" opacity=".12"/>'; });
  var lc = seasonLeaves(tone); s += tree(140, 760, .9, lc, 31) + tree(1480, 740, 1, lc, 33) + pine(620, 520, .6, tone === "night" ? "#1f2a2a" : "#3d5a40") + pine(1000, 470, .55, tone === "night" ? "#1f2a2a" : "#3d5a40");
  return s + veil(tone);
};
S.pavilion = function (tone, k) {
  var g = "pv" + k, s = "<defs>" + skyT(g + "s", tone) + grad(g + "w", [[0, "#cfe3e4"], [1, "#8fb3b6"]]) + "</defs><rect width=\"1600\" height=\"900\" fill=\"url(#" + g + 's)"/>' + sunMoon(tone, 1300, 140);
  var far = tone === "night" ? "#2c3550" : "#8a9ea4", rock = tone === "night" ? "#2a303c" : tone === "winter" ? "#8a8c86" : "#6f6a5e";
  s += peak(300, 560, 700, 420, far, .6, 21) + peak(1250, 560, 760, 460, far, .55, 23);
  var lc = seasonLeaves(tone); for (var i = 0; i < 7; i++) s += tree(60 + i * 250, 600, .8, lc, 40 + i);
  // 石台
  s += '<path d="M380 640 Q520 560 820 560 Q1120 560 1240 650 L1240 700 L380 700 Z" fill="' + rock + '"/>';
  s += pavilionG(810, 580, 1.25, tone);
  // 泉从亭下流过
  s += '<path d="M-20 720 Q600 680 900 700 Q1200 720 1640 690 L1640 900 L-20 900 Z" fill="url(#' + g + 'w)"/>' + water(705, 900, ["transparent"], 19);
  if (tone === "winter" || tone === "autumn") [[300, 800, 60], [700, 830, 80], [1150, 810, 70], [1420, 850, 90]].forEach(function (p) { s += '<ellipse cx="' + p[0] + '" cy="' + p[1] + '" rx="' + p[2] + '" ry="' + p[2] * .4 + '" fill="' + rock + '"/>'; });
  if (tone === "spring") for (i = 0; i < 40; i++) s += '<circle cx="' + (40 + (i * 97) % 1560) + '" cy="' + (612 + (i * 53) % 70) + '" r="5" fill="' + (i % 2 ? "#f3b8c6" : "#fff2a8") + '"/>';
  if (tone === "winter" || tone === "snow") s += '<path d="M380 640 Q520 560 820 560 Q1120 560 1240 650 L1240 655 Q1120 575 820 575 Q520 575 380 655Z" fill="#fff" opacity=".7"/>';
  return s + veil(tone);
};
S.path = function (tone, k) {
  var g = "pa" + k, s = "<defs>" + skyT(g + "s", tone) + "</defs><rect width=\"1600\" height=\"900\" fill=\"url(#" + g + 's)"/>' + sunMoon(tone, 300, 130);
  var mid = tone === "night" ? "#2a3248" : "#7a8f8a", gr = tone === "autumn" ? "#a8925a" : tone === "winter" ? "#b9b8ae" : tone === "night" ? "#232a33" : "#7e9a5c";
  s += peak(1100, 600, 900, 520, mid, .75, 31) + peak(300, 600, 700, 380, mid, .6, 33);
  s += '<rect x="-20" y="560" width="1640" height="340" fill="' + gr + '"/>';
  // 弯弯的山路，绕到山后
  s += '<path d="M640 900 Q700 760 900 700 Q1120 640 1040 580 Q980 540 1120 500" stroke="' + (tone === "night" ? "#4a4a50" : "#d9c79e") + '" stroke-width="120" fill="none" stroke-linecap="round" opacity=".95"/><path d="M640 900 Q700 760 900 700 Q1120 640 1040 580 Q980 540 1120 500" stroke="#000" stroke-opacity=".06" stroke-width="40" fill="none"/>';
  var lc = seasonLeaves(tone); s += tree(260, 900, 1.5, lc, 51) + tree(1420, 880, 1.3, lc, 53) + tree(520, 640, .7, lc, 55) + tree(1240, 600, .6, lc, 57) + pine(160, 600, .7, tone === "night" ? "#1f2a2a" : "#3d5a40");
  return s + veil(tone);
};
S.feast = function (tone, k) {
  var g = "fs" + k, s = "<defs>" + skyT(g + "s", tone) + "</defs><rect width=\"1600\" height=\"900\" fill=\"url(#" + g + 's)"/>' + sunMoon(tone, 1300, 130);
  var lc = seasonLeaves(tone === "dusk" ? "autumn" : tone);
  s += peak(1200, 520, 800, 420, tone === "dusk" ? "#6d6080" : "#8a9ea4", .6, 41) + pavilionG(380, 520, .8, tone);
  for (var i = 0; i < 5; i++) s += tree(700 + i * 220, 540, .7, lc, 60 + i);
  s += '<rect x="-20" y="520" width="1640" height="380" fill="' + (tone === "dusk" ? "#9a7a5a" : "#a59a72") + '"/>';
  // 席子、矮桌、菜、酒坛、投壶、棋盘
  s += '<path d="M260 640 L1340 640 L1460 860 L140 860 Z" fill="#c9ae74"/><path d="M260 640 L1340 640 L1460 860 L140 860 Z" fill="none" stroke="#8a6a3a" stroke-width="4"/>';
  s += '<rect x="560" y="660" width="480" height="40" rx="6" fill="#6b4224"/><rect x="580" y="700" width="20" height="60" fill="#4a2c18"/><rect x="1000" y="700" width="20" height="60" fill="#4a2c18"/>';
  [[620, "#e8dcc0"], [700, "#8a5a33"], [780, "#e8dcc0"], [860, "#5d6f4a"], [940, "#e8dcc0"]].forEach(function (p) { s += '<ellipse cx="' + p[0] + '" cy="660" rx="32" ry="10" fill="' + p[1] + '"/><ellipse cx="' + p[0] + '" cy="654" rx="20" ry="7" fill="#b9562f" opacity=".7"/>'; });
  s += '<path d="M1140 720 Q1110 640 1150 600 L1190 600 Q1230 640 1200 720 Z" fill="#7a4a2a"/><rect x="1150" y="590" width="40" height="14" fill="#5a3a20"/>';   // 酒坛
  s += '<path d="M330 760 Q320 700 345 680 L345 650 L375 650 L375 680 Q400 700 390 760 Z" fill="#6a6a62"/><line x1="350" y1="660" x2="335" y2="590" stroke="#4a3a2a" stroke-width="4"/><line x1="368" y1="660" x2="385" y2="595" stroke="#4a3a2a" stroke-width="4"/>';   // 投壶
  s += '<rect x="1240" y="760" width="120" height="70" fill="#d6c08a" stroke="#6b4b30" stroke-width="3"/>';
  for (i = 1; i < 6; i++) s += '<line x1="' + (1240 + i * 20) + '" y1="760" x2="' + (1240 + i * 20) + '" y2="830" stroke="#6b4b30" stroke-width="1.5"/><line x1="1240" y1="' + (760 + i * 12) + '" x2="1360" y2="' + (760 + i * 12) + '" stroke="#6b4b30" stroke-width="1.5"/>';
  // 客人们（远处的剪影）
  [[480, 760, 1.6, "#4a3f36"], [640, 780, 1.7, "#3f4f5c"], [1080, 780, 1.7, "#5a4636"], [1260, 740, 1.5, "#4a4a44"], [880, 790, 1.8, "#4f3f3a"]].forEach(function (p) { s += walker(p[0], p[1], p[2], p[3]); });
  return s + veil(tone);
};
S.road = function (tone, k) {
  var g = "rd" + k, s = "<defs>" + skyT(g + "s", tone) + "</defs><rect width=\"1600\" height=\"900\" fill=\"url(#" + g + 's)"/>' + sunMoon(tone, 1200, 120);
  var lc = seasonLeaves(tone);
  s += peak(400, 560, 900, 420, "#8a9ea4", .55, 51) + peak(1300, 560, 800, 380, "#7f949a", .55, 53);
  s += '<rect x="-20" y="540" width="1640" height="360" fill="' + (tone === "autumn" ? "#a8925a" : "#86a062") + '"/>';
  s += '<path d="M-20 820 Q400 700 800 650 Q1200 600 1640 560 L1640 620 Q1200 660 820 710 Q420 770 -20 900 Z" fill="#d9c79e"/>';
  for (var i = 0; i < 6; i++) s += tree(120 + i * 290, 600 - (i % 2) * 20, .65, lc, 80 + i);
  // 背东西唱歌的、歇在树下的、老老少少
  s += walker(260, 800, 1.6, "#4a3f36", "load") + walker(520, 728, 1.3, "#5a4636") + walker(600, 722, 1.3, "#3f4f5c", "old") + walker(640, 724, 1.2, "#6a4a3a", "kid") + walker(880, 676, 1.1, "#4a4a44") + walker(1120, 640, 1, "#4f3f3a", "load") + walker(1360, 610, .9, "#3f4f5c");
  s += walker(200, 600, 1.1, "#4a3f36");   // 树下歇着的
  return s + veil(tone);
};
S.lakeview = function (tone, k) {
  var g = "lv" + k, storm = tone === "storm", s = "<defs>" + skyT(g + "s", tone) + "</defs><rect width=\"1600\" height=\"900\" fill=\"url(#" + g + 's)"/>' + sunMoon(tone, 1240, 160);
  if (!storm && tone !== "night") s += cloud(380, 150, 1.1, .6) + cloud(980, 110, .8, .5);
  if (storm) for (var c = 0; c < 6; c++) s += '<ellipse cx="' + (120 + c * 280) + '" cy="' + (90 + (c % 2) * 50) + '" rx="260" ry="70" fill="#3a434c" opacity=".7"/>';
  var wc = tone === "night" ? "#24324a" : storm ? "#5d6a6e" : tone === "dusk" ? "#c9967a" : tone === "winter" || tone === "snow" ? "#9fb0b4" : "#9fc2c6";
  s += water(470, 900, [wc], 23, tone === "night" ? "#f6f0d8" : "#fff");
  s += hills(470, 30, tone === "night" ? "#1e2638" : "#6f8288", .55, 25);
  // 君山：湖心一座小山
  s += '<path d="M1040 480 Q1090 430 1150 440 Q1220 430 1270 480 Z" fill="' + (tone === "night" ? "#1c2434" : "#4f6a58") + '"/>';
  if (storm) for (var i = 0; i < 14; i++) s += '<path d="M' + (i * 120 - 40) + " " + (620 + (i % 3) * 70) + " q60 -60 120 0 q-40 -20 -70 10" + '" fill="#e8eef0" opacity=".55"/>';
  else s += sail(420, 560, .9) + sail(760, 620, 1.2) + sail(1380, 540, .6);
  return s + veil(tone);
};
S.boat = function (tone, k) {
  var g = "bt" + k, s = "<defs>" + skyT(g + "s", tone) + "</defs><rect width=\"1600\" height=\"900\" fill=\"url(#" + g + 's)"/>' + sunMoon(tone, 1100, 260);
  var wc = tone === "night" ? "#24324a" : tone === "dusk" ? "#b98a74" : tone === "winter" || tone === "snow" ? "#98a8ac" : "#9fc2c6";
  s += water(460, 900, [wc], 27) + hills(460, 26, tone === "night" ? "#1e2638" : "#728286", .5, 29);
  // 船篷（拱形）框住画面
  s += '<path d="M-20 -20 L1620 -20 L1620 900 L1500 900 Q1480 320 800 140 Q120 320 100 900 L-20 900 Z" fill="' + (tone === "night" ? "#1a1612" : "#4a3624") + '"/>';
  for (var i = 0; i < 9; i++) s += '<path d="M' + (100 + i * 4) + " 900 Q" + (120 + i * 3) + " " + (320 + i * 6) + " 800 " + (140 + i * 10) + '" stroke="#000" stroke-opacity=".12" stroke-width="3" fill="none"/>';
  s += '<path d="M60 820 L1540 820 L1600 900 L0 900 Z" fill="' + (tone === "night" ? "#2a2018" : "#6b4b30") + '"/>';
  // 一张矮几、一盏灯/一本书
  s += '<rect x="1180" y="760" width="200" height="22" rx="4" fill="#5a3a22"/><rect x="1220" y="730" width="70" height="30" fill="#e8dcc0"/>';
  if (tone === "night") s += '<rect x="1320" y="700" width="16" height="60" fill="#efe6d0"/><path d="M1328 670 Q1318 690 1328 704 Q1338 690 1328 670Z" fill="#ffd27a"/>';
  return s + veil(tone);
};
S.rail = function (tone, k) {
  var g = "rl" + k, s = S.lakeview(tone, k + "r");
  // 楼上的栏杆和柱子
  s += '<rect x="0" y="0" width="70" height="900" fill="#6a2e22"/><rect x="1530" y="0" width="70" height="900" fill="#6a2e22"/><rect x="0" y="0" width="1600" height="54" fill="#4a2a1e"/>';
  s += '<path d="M0 54 Q800 110 1600 54 L1600 70 Q800 128 0 70Z" fill="#3a2018"/>';
  s += '<rect x="0" y="700" width="1600" height="24" fill="#7a3a28"/><rect x="0" y="840" width="1600" height="60" fill="#5a2a1e"/>';
  for (var i = 0; i < 22; i++) s += '<rect x="' + (20 + i * 74) + '" y="724" width="14" height="116" fill="#7a3a28"/>';
  for (i = 0; i < 21; i++) s += '<path d="M' + (34 + i * 74) + " 760 l30 30 l30 -30" + '" stroke="#7a3a28" stroke-width="6" fill="none"/>';
  return s;
};
S.wharf = function (tone, k) {
  var g = "wf" + k, s = "<defs>" + skyT(g + "s", tone) + "</defs><rect width=\"1600\" height=\"900\" fill=\"url(#" + g + 's)"/>' + sunMoon(tone, 1300, 150);
  s += water(520, 900, [tone === "night" ? "#24324a" : "#9fc2c6"], 33);
  // 岸上的城：城墙、一座高楼
  s += '<rect x="-20" y="380" width="900" height="150" fill="' + (tone === "night" ? "#3a3f50" : "#a59a86") + '"/>';
  for (var i = 0; i < 22; i++) s += '<rect x="' + (i * 42 - 10) + '" y="364" width="24" height="20" fill="' + (tone === "night" ? "#3a3f50" : "#a59a86") + '"/>';
  s += '<rect x="420" y="250" width="160" height="130" fill="#7a3e28"/>' + roof(380, 190, 240, 70, "#3f444c") + roof(410, 120, 180, 60, "#3f444c");
  // 码头木板、拴着的船
  s += '<path d="M600 540 L1000 540 L1100 640 L560 640 Z" fill="#8a6a46"/>';
  for (i = 0; i < 8; i++) s += '<line x1="' + (600 + i * 55) + '" y1="540" x2="' + (560 + i * 70) + '" y2="640" stroke="#5a4028" stroke-width="3"/>';
  s += '<g transform="translate(1180 640)"><path d="M-160 0 L160 0 L120 40 L-120 40 Z" fill="#4a3624"/><path d="M-90 0 Q0 -90 90 0 Z" fill="#6b5236"/></g>' + sail(1450, 600, .8);
  s += walker(700, 560, 1.1, "#4a3f36", "load") + walker(860, 560, 1.1, "#3f4f5c");
  return s + veil(tone);
};
S.tavern = function (tone, k) {
  var g = "tv" + k, s = "<defs>" + grad(g + "w", tone === "night" ? [[0, "#3a3240"], [1, "#2a2430"]] : [[0, "#e6d6b6"], [1, "#d4c09a"]]) + "</defs><rect width=\"1600\" height=\"900\" fill=\"url(#" + g + 'w)"/>';
  // 大窗外是湖
  s += '<svg x="220" y="90" width="1160" height="460" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">' + S.lakeview(tone, k + "t") + "</svg>";
  s += '<g stroke="#5a3b25" fill="none"><rect x="220" y="90" width="1160" height="460" stroke-width="20"/><line x1="800" y1="90" x2="800" y2="550" stroke-width="12"/></g>';
  s += '<rect x="0" y="0" width="90" height="900" fill="#5b3b24"/><rect x="1510" y="0" width="90" height="900" fill="#5b3b24"/>';
  // 酒桌
  s += '<path d="M-20 660 L1620 660 L1620 900 L-20 900 Z" fill="#6b4224"/><rect x="-20" y="654" width="1640" height="12" fill="#8a5e3a"/>';
  s += '<ellipse cx="520" cy="720" rx="90" ry="22" fill="#e8dcc0"/><ellipse cx="520" cy="712" rx="60" ry="12" fill="#a8562f" opacity=".7"/><ellipse cx="800" cy="740" rx="110" ry="26" fill="#e8dcc0"/><ellipse cx="800" cy="732" rx="70" ry="14" fill="#5d6f4a" opacity=".7"/>';
  s += '<path d="M1080 760 Q1060 700 1090 670 L1090 650 L1120 650 L1120 670 Q1150 700 1130 760 Z" fill="#7a4a2a"/><ellipse cx="1210" cy="740" rx="22" ry="8" fill="#d8cfb8"/>';
  s += '<line x1="620" y1="780" x2="700" y2="800" stroke="#2a1a10" stroke-width="5"/><line x1="626" y1="792" x2="708" y2="806" stroke="#2a1a10" stroke-width="5"/>';
  return s + (tone === "night" ? '<rect width="1600" height="900" fill="#0b0f22" opacity=".2"/>' : "");
};
S.hall = function (tone, k) {
  var g = "hl" + k, s = "<defs>" + grad(g + "w", [[0, "#ece4d2"], [1, "#d8ccb2"]]) + "</defs><rect width=\"1600\" height=\"900\" fill=\"url(#" + g + 'w)"/>';
  // 高窗、黑板、讲桌、一排排长凳
  for (var i = 0; i < 3; i++) s += '<rect x="' + (140 + i * 520) + '" y="60" width="260" height="200" fill="#cfe2e6"/><g stroke="#6b4b30" stroke-width="8" fill="none"><rect x="' + (140 + i * 520) + '" y="60" width="260" height="200"/><line x1="' + (270 + i * 520) + '" y1="60" x2="' + (270 + i * 520) + '" y2="260"/></g>';
  s += '<rect x="420" y="290" width="760" height="300" fill="#2f3d36"/><rect x="410" y="280" width="780" height="320" fill="none" stroke="#6b4b30" stroke-width="16"/>';
  s += '<text x="800" y="420" text-anchor="middle" font-family="KaiTi,STKaiti,serif" font-size="74" fill="#e8ece6" opacity=".9">' + esc((window.YK_CONF && YK_CONF.board) || "") + "</text>";
  s += '<rect x="660" y="600" width="280" height="110" fill="#6b4224"/><rect x="640" y="590" width="320" height="18" fill="#8a5e3a"/>';
  for (i = 0; i < 3; i++) { var y = 740 + i * 60; s += '<rect x="' + (60 - i * 40) + '" y="' + y + '" width="' + (1480 + i * 80) + '" height="22" fill="#5a3a22"/><rect x="' + (60 - i * 40) + '" y="' + (y + 22) + '" width="' + (1480 + i * 80) + '" height="8" fill="#000" opacity=".15"/>'; }
  if (tone === "dusk") s += '<rect width="1600" height="900" fill="#e07a3a" opacity=".1"/>';
  return s;
};
S.riverbank = function (tone, k) {
  var g = "rb" + k, s = "<defs>" + skyT(g + "s", tone) + "</defs><rect width=\"1600\" height=\"900\" fill=\"url(#" + g + 's)"/>' + sunMoon(tone, 1260, 200);
  s += peak(300, 480, 800, 360, "#9fb2b8", .55, 61) + peak(1250, 480, 900, 300, "#9fb2b8", .45, 63);
  s += '<rect x="-20" y="470" width="1640" height="430" fill="' + (tone === "autumn" ? "#a8925a" : "#8aa868") + '"/>';
  // 江水从远处流来
  s += '<path d="M700 470 L900 470 Q1100 620 1640 700 L1640 900 L-20 900 L-20 800 Q500 640 700 470 Z" fill="' + (tone === "night" ? "#24324a" : tone === "storm" ? "#6f7a7e" : tone === "dusk" ? "#c9967a" : "#9cc6cc") + '"/>' + water(560, 900, ["transparent"], 37);
  var blos = tone === "spring" || !tone || tone === "day" ? ["#f3b8c6", "#f7c9d3", "#e99aab", "#fbe3e8"] : seasonLeaves(tone);
  s += tree(160, 760, 1.1, blos, 71) + tree(420, 600, .7, blos, 73) + tree(1300, 640, .9, blos, 75) + tree(1500, 800, 1.2, blos, 77);
  return s + veil(tone);
};
S.lonetree = function (tone, k) {
  var g = "lt" + k, s = "<defs>" + skyT(g + "s", tone) + "</defs><rect width=\"1600\" height=\"900\" fill=\"url(#" + g + 's)"/>' + sunMoon(tone, 1250, 160);
  s += hills(560, 50, "#8fa0a6", .45, 81);
  s += '<path d="M-20 640 Q800 560 1640 640 L1640 900 L-20 900 Z" fill="' + (tone === "autumn" ? "#b39a5a" : tone === "winter" ? "#d6d6cc" : tone === "summer" ? "#5f8a46" : "#8fb06a") + '"/>';
  var lc = tone === "spring" ? ["#f3b8c6", "#9cc26a", "#f7d0d8", "#b9d27e"] : seasonLeaves(tone);
  if (tone === "winter") s += '<path d="M790 620 C780 520 820 440 790 330 M800 470 Q700 420 650 330 M806 430 Q900 380 950 300 M795 380 Q760 320 770 260" stroke="#4a3a2c" stroke-width="16" fill="none" stroke-linecap="round"/>';
  else s += tree(800, 640, 1.6, lc, 85);
  if (tone === "autumn") for (var i = 0; i < 30; i++) s += '<ellipse cx="' + (600 + (i * 47) % 420) + '" cy="' + (650 + (i * 31) % 60) + '" rx="8" ry="4" fill="' + lc[i % lc.length] + '"/>';
  return s + veil(tone);
};

/* ---------- 新道具 ---------- */
var propOld = propHTML;
propHTML = function (name, o) {
  o = o || {};
  if (name === "wine") return '<div class="prop p-brush"><svg viewBox="0 0 600 360" aria-hidden="true"><rect x="20" y="40" width="560" height="300" rx="8" fill="#6b4224"/><path d="M200 300 Q150 220 190 170 L190 120 Q170 110 190 96 L250 96 Q270 110 250 120 L250 170 Q290 220 240 300 Z" fill="#d8cfb8" stroke="#7a6a50" stroke-width="4"/><path d="M200 170 L240 170" stroke="#3f5570" stroke-width="6"/><path d="M360 300 L380 250 L460 250 L480 300 Z" fill="#e8dcc0" stroke="#7a6a50" stroke-width="4"/><ellipse cx="420" cy="252" rx="40" ry="8" fill="#a8562f" opacity=".7"/></svg></div>';
  if (name === "jar") return '<div class="prop p-brush"><svg viewBox="0 0 600 360" aria-hidden="true"><rect x="20" y="40" width="560" height="300" rx="8" fill="#c9ae74"/><path d="M260 320 Q230 240 270 210 L270 140 L330 140 L330 210 Q370 240 340 320 Z" fill="#6a6a62" stroke="#3a3a34" stroke-width="4"/><line x1="290" y1="160" x2="250" y2="60" stroke="#4a3a2a" stroke-width="6"/><line x1="310" y1="160" x2="350" y2="64" stroke="#4a3a2a" stroke-width="6"/><line x1="450" y1="330" x2="560" y2="200" stroke="#4a3a2a" stroke-width="6"/></svg></div>';
  if (name === "poem") { var cs = Array.from(String(o.t || "")), cols = [], col = "";
    cs.forEach(function (c) { if (/[，。！？；]/.test(c)) { cols.push(col + c); col = ""; } else col += c; }); if (col) cols.push(col);
    return '<div class="prop p-draft"><div class="pp poem"><p>' + cols.map(function (cl, i) { return '<span class="pc" style="animation-delay:' + (.3 + i * .35).toFixed(2) + 's">' + esc(cl) + "</span>"; }).join("") + "</p></div></div>"; }
  return propOld(name, o);
};

/* ---------- 人物剪影（没有立绘时先用）----------
 * 1024×1536，和立绘图片同样大小，引擎当成一张图片用（data URL）。
 * kind：scholar 宋代官员（幞头）/ ouyang 欧阳修（幞头、白发、苍颜）/ dufu 杜甫（头巾、清瘦、灰白须）/ meng 孟浩然（头巾、布衣）/ libai 李白（白衣、发冠）/
 *       yuan 袁中道（明代方巾）/ liang 梁启超（长衫）/ bingxin 冰心（短发、旗袍）/ monk 僧人 */
var FIG = {
  scholar: { robe: "#4a5f7a", robe2: "#3b4e66", hat: "song", beard: "long", hair: "#2a2622", skin: "#efd2b4", trim: "#efe6d4" },
  ouyang: { robe: "#5e6b4a", robe2: "#4c583b", hat: "song", beard: "long", hair: "#d8d4cc", skin: "#e9cdb0", trim: "#efe6d4", beardCol: "#d8d4cc" },
  dufu: { robe: "#7a6a56", robe2: "#655746", hat: "kerchief", beard: "long", hair: "#b8b2a8", skin: "#e2c4a4", trim: "#d8ccb4", beardCol: "#c8c2b6", thin: 1 },
  meng: { robe: "#6f8a92", robe2: "#5c747c", hat: "kerchief", beard: "short", hair: "#2a2622", skin: "#efd2b4", trim: "#ece4d0" },
  libai: { robe: "#ecebe4", robe2: "#d4d2c8", hat: "crown", beard: "short", hair: "#2a2622", skin: "#efd2b4", trim: "#7a8fa8", belt: "#7a8fa8" },
  yuan: { robe: "#3f5570", robe2: "#33465e", hat: "fangjin", beard: "long", hair: "#2a2622", skin: "#efd2b4", trim: "#ece4d0" },
  liang: { robe: "#4a4a50", robe2: "#3a3a40", hat: "none", beard: "mous", hair: "#2a2622", skin: "#efd2b4", modern: "gown" },
  bingxin: { robe: "#5f7fa0", robe2: "#4e6c8c", hat: "bob", beard: "", hair: "#1e1c1a", skin: "#f2d6bc", modern: "qipao" },
  monk: { robe: "#9a7a4a", robe2: "#83663c", hat: "bald", beard: "", hair: "#2a2622", skin: "#e9cdb0", trim: "#5a4632" }
};
var figCache = {};
function figure(kind) {
  if (figCache[kind]) return figCache[kind];
  var o = FIG[kind] || FIG.scholar, L = "#2b2420", sw = 7, x = 512, modern = o.modern, thin = o.thin ? .9 : 1;
  var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1536">';
  s += '<defs><linearGradient id="rb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + o.robe2 + '"/><stop offset=".45" stop-color="' + o.robe + '"/><stop offset="1" stop-color="' + o.robe2 + '"/></linearGradient></defs>';
  // 鞋
  s += '<path d="M392 1470 Q380 1430 420 1420 L490 1420 L496 1478 Z M534 1478 L540 1420 L610 1420 Q650 1430 636 1470 Z" fill="#2a2622" stroke="' + L + '" stroke-width="' + sw + '"/>';
  if (modern === "qipao") {
    // 旗袍：贴身、开衩、短袖，外搭一件开衫
    s += '<path d="M420 1430 L450 760 Q470 640 430 520 L420 430 Q512 400 604 430 L594 520 Q554 640 574 760 L604 1430 Z" fill="url(#rb)" stroke="' + L + '" stroke-width="' + sw + '"/>';
    s += '<path d="M540 1100 L560 1430" stroke="' + L + '" stroke-width="4"/>';
    s += '<path d="M410 430 Q360 450 350 560 L330 900 L390 910 L420 600 Z M614 430 Q664 450 674 560 L694 900 L634 910 L604 600 Z" fill="#e8e0d0" stroke="' + L + '" stroke-width="' + sw + '"/>';
    s += '<path d="M330 900 Q336 950 372 950 Q396 940 390 910 Z M694 900 Q688 950 652 950 Q628 940 634 910 Z" fill="' + o.skin + '" stroke="' + L + '" stroke-width="5"/>';
    s += '<path d="M476 412 L512 450 L548 412" fill="none" stroke="' + L + '" stroke-width="6"/>';
  } else if (modern === "gown") {
    // 长衫：立领、窄袖、直身
    s += '<path d="M372 1430 L392 520 Q400 440 452 420 L572 420 Q624 440 632 520 L652 1430 Z" fill="url(#rb)" stroke="' + L + '" stroke-width="' + sw + '"/>';
    s += '<path d="M392 520 Q340 560 330 760 L318 980 L388 990 L410 700 Z M632 520 Q684 560 694 760 L706 980 L636 990 L614 700 Z" fill="' + o.robe2 + '" stroke="' + L + '" stroke-width="' + sw + '"/>';
    s += '<path d="M318 980 Q324 1036 360 1036 Q392 1028 388 990 Z M706 980 Q700 1036 664 1036 Q632 1028 636 990 Z" fill="' + o.skin + '" stroke="' + L + '" stroke-width="5"/>';
    s += '<rect x="470" y="404" width="84" height="34" rx="6" fill="' + o.robe2 + '" stroke="' + L + '" stroke-width="6"/><path d="M512 440 L512 1430" stroke="#000" stroke-opacity=".18" stroke-width="5"/>';
  } else {
    // 汉服：交领、宽袍大袖、束带，双手拢在袖里
    s += '<path d="M' + f(x - 180 * thin) + ' 1440 Q' + f(x - 210 * thin) + ' 1100 ' + f(x - 150 * thin) + ' 700 L' + f(x - 140 * thin) + ' 470 Q' + x + ' 410 ' + f(x + 140 * thin) + ' 470 L' + f(x + 150 * thin) + ' 700 Q' + f(x + 210 * thin) + ' 1100 ' + f(x + 180 * thin) + ' 1440 Z" fill="url(#rb)" stroke="' + L + '" stroke-width="' + sw + '"/>';
    s += '<path d="M' + f(x - 120 * thin) + ' 470 L' + f(x + 60) + ' 860 M' + f(x + 120 * thin) + ' 470 L' + (x - 10) + ' 600" stroke="' + (o.trim || "#eee") + '" stroke-width="22" fill="none" stroke-linecap="round"/>';
    s += '<path d="M' + f(x - 120 * thin) + ' 470 L' + f(x + 60) + ' 860" stroke="' + L + '" stroke-width="4" fill="none"/>';
    s += '<rect x="' + f(x - 150 * thin) + '" y="760" width="' + f(300 * thin) + '" height="40" rx="8" fill="' + (o.belt || "#3a2a20") + '" stroke="' + L + '" stroke-width="5"/>';
    // 大袖
    s += '<path d="M' + f(x - 140 * thin) + ' 480 Q' + f(x - 260 * thin) + ' 520 ' + f(x - 290 * thin) + ' 760 Q' + f(x - 300 * thin) + ' 960 ' + f(x - 250 * thin) + ' 1040 Q' + f(x - 150) + ' 1060 ' + (x - 40) + ' 1000 L' + (x - 20) + ' 900 Q' + f(x - 120 * thin) + ' 860 ' + f(x - 120 * thin) + ' 700 Z" fill="' + o.robe2 + '" stroke="' + L + '" stroke-width="' + sw + '"/>';
    s += '<path d="M' + f(x + 140 * thin) + ' 480 Q' + f(x + 260 * thin) + ' 520 ' + f(x + 290 * thin) + ' 760 Q' + f(x + 300 * thin) + ' 960 ' + f(x + 250 * thin) + ' 1040 Q' + f(x + 150) + ' 1060 ' + (x + 40) + ' 1000 L' + (x + 20) + ' 900 Q' + f(x + 120 * thin) + ' 860 ' + f(x + 120 * thin) + ' 700 Z" fill="' + o.robe2 + '" stroke="' + L + '" stroke-width="' + sw + '"/>';
    s += '<path d="M' + (x - 40) + ' 1000 Q' + x + ' 1020 ' + (x + 40) + ' 1000 L' + (x + 20) + ' 900 Q' + x + ' 890 ' + (x - 20) + ' 900 Z" fill="' + (o.trim || "#eee") + '" stroke="' + L + '" stroke-width="5"/>';
    s += '<path d="M' + f(x - 250 * thin) + ' 1040 Q' + f(x - 150) + ' 1060 ' + (x - 40) + ' 1000 M' + f(x + 250 * thin) + ' 1040 Q' + f(x + 150) + ' 1060 ' + (x + 40) + ' 1000" stroke="' + (o.trim || "#eee") + '" stroke-width="14" fill="none"/>';
  }
  // 脖子、头
  s += '<path d="M482 330 L482 420 L542 420 L542 330 Z" fill="' + o.skin + '" stroke="' + L + '" stroke-width="5"/>';
  var hy = 250;
  if (o.hat === "bob") s += '<path d="M420 260 Q410 140 512 128 Q614 140 604 260 L612 350 Q560 330 512 332 Q464 330 412 350 Z" fill="' + o.hair + '"/>';
  s += '<ellipse cx="512" cy="' + hy + '" rx="' + (o.thin ? 70 : 76) + '" ry="96" fill="' + o.skin + '" stroke="' + L + '" stroke-width="' + sw + '"/>';
  s += '<ellipse cx="' + (o.thin ? 440 : 434) + '" cy="262" rx="14" ry="22" fill="' + o.skin + '" stroke="' + L + '" stroke-width="5"/><ellipse cx="' + (o.thin ? 584 : 590) + '" cy="262" rx="14" ry="22" fill="' + o.skin + '" stroke="' + L + '" stroke-width="5"/>';
  // 眉眼口
  s += '<path d="M466 226 q16 -10 32 -2 M526 224 q16 -8 32 2" stroke="' + (o.beardCol || L) + '" stroke-width="6" fill="none" stroke-linecap="round"/>';
  s += '<path d="M470 250 q12 6 24 0 M530 250 q12 6 24 0" stroke="' + L + '" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M512 262 q-6 22 4 30" stroke="' + L + '" stroke-opacity=".5" stroke-width="4" fill="none"/>';
  if (o.hat === "bob") s += '<path d="M494 314 q18 8 36 0" stroke="#b0564a" stroke-width="6" fill="none" stroke-linecap="round"/>';
  else if (!o.beard) s += '<path d="M494 312 q18 6 36 0" stroke="' + L + '" stroke-width="5" fill="none" stroke-linecap="round"/>';
  if (o.thin) s += '<path d="M462 286 q-4 14 4 26 M562 286 q4 14 -4 26" stroke="' + L + '" stroke-opacity=".3" stroke-width="4" fill="none"/>';
  // 胡须
  var bc = o.beardCol || "#2a2622";
  if (o.beard === "long") s += '<path d="M480 304 Q512 296 544 304 Q560 330 540 380 Q526 430 512 470 Q498 430 484 380 Q464 330 480 304 Z" fill="' + bc + '"/><path d="M470 300 Q440 300 446 340 M554 300 Q584 300 578 340" stroke="' + bc + '" stroke-width="7" fill="none" stroke-linecap="round"/>';
  if (o.beard === "short") s += '<path d="M490 314 Q512 308 534 314 Q530 350 512 360 Q494 350 490 314 Z" fill="' + bc + '"/><path d="M478 302 Q500 296 512 304 Q524 296 546 302" stroke="' + bc + '" stroke-width="7" fill="none" stroke-linecap="round"/>';
  if (o.beard === "mous") s += '<path d="M478 300 Q500 290 512 300 Q524 290 546 300 Q530 310 512 306 Q494 310 478 300 Z" fill="' + bc + '"/>';
  // 发和帽
  if (o.hat === "song") {
    s += '<path d="M440 210 Q440 130 512 124 Q584 130 584 210 Z" fill="' + o.hair + '" stroke="' + L + '" stroke-width="5"/>';
    s += '<path d="M436 190 L436 120 Q512 100 588 120 L588 190 Z" fill="#1e1c1a" stroke="' + L + '" stroke-width="5"/><path d="M462 120 L462 70 Q512 54 562 70 L562 120 Z" fill="#1e1c1a" stroke="' + L + '" stroke-width="5"/>';
    s += '<rect x="240" y="150" width="200" height="14" rx="4" fill="#1e1c1a"/><rect x="584" y="150" width="200" height="14" rx="4" fill="#1e1c1a"/>';
  } else if (o.hat === "kerchief") {
    s += '<path d="M436 220 Q430 120 512 112 Q594 120 588 220 Q560 180 512 180 Q464 180 436 220 Z" fill="#3a3430" stroke="' + L + '" stroke-width="5"/><path d="M500 116 Q512 70 540 84 Q530 110 524 120" fill="#3a3430" stroke="' + L + '" stroke-width="5"/>';
    s += '<path d="M586 200 Q640 260 620 360 M582 210 Q620 290 600 380" stroke="#3a3430" stroke-width="10" fill="none" stroke-linecap="round"/>';
    if (o.hair !== "#2a2622") s += '<path d="M440 220 Q436 260 442 300 M584 220 Q588 260 582 300" stroke="' + o.hair + '" stroke-width="10" fill="none"/>';
  } else if (o.hat === "crown") {
    s += '<path d="M438 220 Q432 130 512 120 Q592 130 586 220 Q560 170 512 168 Q464 170 438 220 Z" fill="' + o.hair + '" stroke="' + L + '" stroke-width="5"/>';
    s += '<path d="M484 128 L484 84 Q512 70 540 84 L540 128 Z" fill="#c9a24a" stroke="' + L + '" stroke-width="5"/><line x1="440" y1="104" x2="584" y2="104" stroke="#c9a24a" stroke-width="7" stroke-linecap="round"/>';
    s += '<path d="M440 210 Q420 300 450 360 M584 210 Q604 300 574 360" stroke="#2a2622" stroke-width="8" fill="none" opacity=".7"/>';
  } else if (o.hat === "fangjin") {
    s += '<path d="M440 220 Q440 150 512 146 Q584 150 584 220 Z" fill="' + o.hair + '"/><path d="M432 196 L444 76 L580 76 L592 196 Q512 176 432 196 Z" fill="#1e1c1a" stroke="' + L + '" stroke-width="5"/><path d="M444 76 L512 92 L580 76" stroke="#3a3a3a" stroke-width="4" fill="none"/>';
  } else if (o.hat === "none") {
    s += '<path d="M440 210 Q436 160 470 150 Q512 170 560 150 Q590 160 584 210 Q580 190 560 186 Q512 196 464 186 Q444 190 440 210 Z" fill="' + o.hair + '" stroke="' + L + '" stroke-width="4"/>';
  } else if (o.hat === "bob") {
    s += '<path d="M436 230 Q430 150 512 146 Q594 150 588 230 Q560 180 520 182 Q470 186 436 230 Z" fill="' + o.hair + '"/>';
  } else if (o.hat === "bald") {
    s += '<path d="M450 180 Q470 150 512 148 Q554 150 574 180" stroke="' + L + '" stroke-opacity=".25" stroke-width="5" fill="none"/>';
    for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) s += '<circle cx="' + (492 + j * 20) + '" cy="' + (176 + i * 16) + '" r="3" fill="' + L + '" opacity=".4"/>';
  }
  s += "</svg>";
  return (figCache[kind] = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s));
}

/* ---------- 新效果：雪、花瓣、水纹（Canvas），和原有的一起 ---------- */
var setOld = FX.prototype.set, tickOld = FX.prototype.tick;
FX.prototype.set = function (list) {
  setOld.call(this, list); var on = this.on, w = this.w, h = this.h, area = w * h / (1024 * 768), i;
  if (on.snow) for (i = 0; i < Math.round(90 * area + 20); i++) this.p.push({ k: "snow", x: Math.random() * w, y: Math.random() * h, v: 26 + Math.random() * 40, s: 1.5 + Math.random() * 3, ph: Math.random() * 6 });
  if (on.petals) for (i = 0; i < Math.round(16 * Math.sqrt(area) + 8); i++) this.p.push({ k: "petal", x: Math.random() * w, y: Math.random() * h - h, v: 30 + Math.random() * 40, s: 4 + Math.random() * 4, r: Math.random() * 6, vr: (Math.random() - .5) * 3, ph: Math.random() * 6 });
  if (on.ripple) for (i = 0; i < 6; i++) this.p.push({ k: "ripple", x: Math.random() * w, y: h * (.62 + Math.random() * .3), t: Math.random() * 3 });
  if (this.p.length && !this.raf) { var me = this; this.last = 0; this.raf = requestAnimationFrame(function (t) { me.tick(t); }); }
};
FX.prototype.tick = function (t) {
  var x = this.x, w = this.w, h = this.h, dt = this.last ? Math.min(.05, (t - this.last) / 1000) : 0;
  tickOld.call(this, t);
  for (var i = 0; i < this.p.length; i++) { var p = this.p[i];
    if (p.k === "snow") { p.y += p.v * dt; p.ph += dt; p.x += Math.sin(p.ph) * 12 * dt; if (p.y > h + 5) { p.y = -5; p.x = Math.random() * w; } x.fillStyle = "rgba(255,255,255,.85)"; x.beginPath(); x.arc(p.x, p.y, p.s, 0, 7); x.fill(); }
    else if (p.k === "petal") { p.y += p.v * dt; p.ph += dt * 1.4; p.x += Math.sin(p.ph) * 26 * dt + 10 * dt; p.r += p.vr * dt; if (p.y > h + 20) { p.y = -20; p.x = Math.random() * w; }
      x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = "rgba(243,184,198,.9)"; x.beginPath(); x.ellipse(0, 0, p.s, p.s * .55, 0, 0, 7); x.fill(); x.restore(); }
    else if (p.k === "ripple") { p.t += dt; if (p.t > 3) { p.t = 0; p.x = Math.random() * w; p.y = h * (.62 + Math.random() * .3); } var r = p.t * 26; x.strokeStyle = "rgba(255,255,255," + (.4 * (1 - p.t / 3)) + ")"; x.lineWidth = 1.5; x.beginPath(); x.ellipse(p.x, p.y, r, r * .3, 0, 0, 7); x.stroke(); }
  }
};

window.YK_SCENE = { svg: sceneSVG, prop: propHTML, FX: FX, names: Object.keys(S), figure: figure };
})();
