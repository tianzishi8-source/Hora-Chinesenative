/* 《岳阳楼记》课堂版 · 沉浸体验的画面：画出来的替代场景（SVG）、道具特写、环境效果（Canvas / CSS）。
 * 有真图时（img/scene-{名字}.webp）引擎用真图，这里画的只是替代。
 * 场景（bg）：yard 院子 / study 书房 / night 夜里书房烛光 / rain-yard 雨中的院子（从窗里往外看）/ harvest 田野打谷 / hill 城外土岗远望 / gate 邓州城门
 * 色调（tone）：day（默认）/ dusk 傍晚 / night 夜 / rain 雨天 / bare 收空了的田
 * 道具（prop）：box 木匣 / letter 旧信 / scroll 画轴（里面是 ../yueyanglou/img/lake.webp，当作《洞庭晚秋图》）/ draft 草稿纸上的字 / brush 毛笔砚台 / kite 纸鸢
 * 效果（fx）：rain 雨丝 / leaves 落叶 / dust 灰尘浮动 / birds 飞鸟 / light 阳光光柱 / candle 烛光摇曳 / mist 薄雾 / drip 檐下滴水 */
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
var LAKE = "../yueyanglou/img/lake.webp";
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

window.YK_SCENE = { svg: sceneSVG, prop: propHTML, FX: FX, names: Object.keys(S) };
})();
