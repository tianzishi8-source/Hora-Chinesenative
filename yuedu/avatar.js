/* 弦歌 · Q 版头像（自己捏脸，或者上传一张卡通头像）
 * HoraAvatar.render(av, px)：返回头像的 HTML（圆形）。av = {k:"svg", c:{…}, t} 或 {k:"img", d:"data:image/…", t}；没有就画一个默认的。
 * HoraAvatar.maker(box, av, onSave, onCancel)：在 box 里打开“装扮头像”。
 * 捏脸的设置很小（几个数字），存进作答数据；上传的图片压成 128×128 的 webp（几 KB）。
 */
(function () {
  "use strict";
  var SKIN = ["#fde3cf", "#f6d2b5", "#e9b98f", "#c98e62", "#8d5a3b"];
  var HAIRC = ["#1f1a17", "#4a2f22", "#7a4a2b", "#a8642f", "#d9a65b", "#9b3b2f", "#6d6f7a", "#3a4f8a"];
  var BG = ["#cfe3f7", "#f9d7e0", "#dcefd2", "#fbe7b8", "#e2d7f5", "#f6d8c6", "#d3ecec", "#eeeeee"];
  var SHIRT = ["#3a5a8c", "#b3412e", "#3f7a4a", "#e0a43a", "#7b5aa6", "#2b2b2b", "#e8e2d6", "#e57aa0"];
  var OPTS = {
    hair: ["短发", "齐耳短发", "长直发", "马尾", "丸子头", "卷发", "刺猬头", "侧分", "双马尾", "光头"],
    eyes: ["圆眼睛", "笑眯眯", "眨眼", "亮晶晶", "认真脸"],
    brow: ["自然", "挑眉", "皱眉"],
    mouth: ["微笑", "大笑", "张嘴", "抿嘴", "吐舌头"],
    glass: ["不戴", "圆框", "方框", "墨镜"],
    hat: ["不戴", "毛线帽", "棒球帽", "发箍", "蝴蝶结", "耳机"],
    extra: ["没有", "雀斑", "脸红", "痣"]
  };
  var DEF = { skin: 1, hair: 0, hc: 0, eyes: 0, brow: 0, mouth: 0, glass: 0, hat: 0, extra: 0, bg: 0, shirt: 0, hatc: 1 };

  function clamp(c) { var o = {}; for (var k in DEF) { var v = c && c[k] != null ? +c[k] : DEF[k]; o[k] = isFinite(v) ? Math.max(0, Math.floor(v)) : DEF[k]; } return o; }
  function pick(a, i) { return a[i % a.length]; }

  /* 头发：back＝脑后（被脸挡住），front＝刘海（盖在脸上） */
  function hairParts(h, col) {
    var B = "", F = "";
    var cap = 'M22,54 C20,30 34,19 50,19 C66,19 80,30 78,54 C76,44 72,37 66,34 C58,39 42,40 33,35 C27,39 24,46 22,54Z';
    switch (h) {
      case 0: F = cap; break;
      case 1: B = 'M20,40 C20,24 34,17 50,17 C66,17 80,24 80,40 L81,70 C78,74 72,74 70,70 L30,70 C28,74 22,74 19,70Z'; F = 'M22,56 C20,30 34,19 50,19 C66,19 80,30 78,56 C77,44 73,36 64,33 C56,38 44,38 37,34 C30,37 24,44 22,56Z'; break;
      case 2: B = 'M19,42 C19,23 34,16 50,16 C66,16 81,23 81,42 L84,92 C76,96 66,94 62,88 L38,88 C34,94 24,96 16,92Z'; F = 'M22,58 C20,30 34,18 50,18 C66,18 80,30 78,58 C77,44 72,35 62,31 C54,36 44,36 38,31 C29,35 24,45 22,58Z'; break;
      case 3: B = 'M74,30 C92,30 96,56 86,80 C84,70 82,52 74,44Z'; F = 'M22,54 C20,29 34,18 50,18 C66,18 80,29 78,54 C77,42 72,34 63,31 C55,35 43,35 36,31 C28,35 24,44 22,54Z'; break;
      case 4: B = 'M50,4 a11,11 0 1,1 -0.1,0Z'; F = 'M22,54 C20,29 34,18 50,18 C66,18 80,29 78,54 C77,42 72,34 63,31 C55,35 43,35 36,31 C28,35 24,44 22,54Z'; break;
      case 5: { var c = ""; [[26,36],[33,26],[43,21],[54,20],[65,24],[73,32],[78,42],[22,46],[79,52],[21,56]].forEach(function (p) { c += 'M' + (p[0] - 8) + ',' + p[1] + ' a8,8 0 1,0 16,0 a8,8 0 1,0 -16,0Z'; }); B = 'M18,50 C16,26 34,14 50,14 C66,14 84,26 82,50 L82,64 L18,64Z'; F = c; break; }
      case 6: F = 'M22,54 C20,36 26,28 30,26 L28,14 L38,22 L42,10 L49,20 L56,9 L60,21 L68,12 L69,25 L78,20 L75,32 C79,38 79,46 78,54 C75,44 70,38 63,36 C55,39 43,39 35,36 C28,40 24,46 22,54Z'; break;
      case 7: F = 'M22,56 C20,30 34,18 52,18 C68,18 80,30 78,52 C74,40 66,32 54,30 C48,34 36,44 30,42 C26,45 23,50 22,56Z'; break;
      case 8: B = 'M14,40 C4,50 6,72 12,84 C16,74 20,60 24,52Z M86,40 C96,50 94,72 88,84 C84,74 80,60 76,52Z'; F = 'M22,54 C20,29 34,18 50,18 C66,18 80,29 78,54 C77,42 72,34 63,31 C55,35 43,35 36,31 C28,35 24,44 22,54Z'; break;
      case 9: F = ''; break;
    }
    return { b: B ? '<path d="' + B + '" fill="' + col + '"/>' : "", f: F ? '<path d="' + F + '" fill="' + col + '"/>' + (h === 8 ? '<circle cx="18" cy="44" r="3.5" fill="#e57aa0"/><circle cx="82" cy="44" r="3.5" fill="#e57aa0"/>' : "") + (h === 3 ? '<circle cx="76" cy="36" r="3" fill="#e57aa0"/>' : "") : "" };
  }
  function eyes(e) {
    function one(x, wink) {
      if (e === 1 || wink) return '<path d="M' + (x - 5) + ',57 Q' + x + ',52 ' + (x + 5) + ',57" stroke="#2b2420" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
      var r = e === 3 ? 5.2 : e === 4 ? 4 : 4.8;
      return '<ellipse cx="' + x + '" cy="57" rx="' + (r * 0.85) + '" ry="' + r + '" fill="#2b2420"/><circle cx="' + (x + 1.6) + '" cy="' + (55) + '" r="' + (e === 3 ? 2 : 1.5) + '" fill="#fff"/>' + (e === 3 ? '<circle cx="' + (x - 1.6) + '" cy="59.5" r="0.9" fill="#fff"/>' : "");
    }
    return one(39, false) + one(61, e === 2);
  }
  function brows(b, col) {
    var y1 = b === 1 ? 46 : 49, t = b === 2 ? ' transform="rotate(8 39 49)"' : "", t2 = b === 2 ? ' transform="rotate(-8 61 49)"' : "";
    return '<path d="M34,' + y1 + ' Q39,' + (y1 - 2.5) + ' 44,' + y1 + '" stroke="' + col + '" stroke-width="2.2" fill="none" stroke-linecap="round"' + t + '/><path d="M56,' + y1 + ' Q61,' + (y1 - 2.5) + ' 66,' + y1 + '" stroke="' + col + '" stroke-width="2.2" fill="none" stroke-linecap="round"' + t2 + '/>';
  }
  function mouth(m) {
    switch (m) {
      case 1: return '<path d="M42,68 Q50,78 58,68 Z" fill="#7a2b26"/><path d="M44,68.5 L56,68.5 L55,70.5 L45,70.5Z" fill="#fff"/>';
      case 2: return '<ellipse cx="50" cy="70" rx="4" ry="5" fill="#7a2b26"/>';
      case 3: return '<path d="M45,69 L55,69" stroke="#7a3b30" stroke-width="2.2" stroke-linecap="round"/>';
      case 4: return '<path d="M43,68 Q50,74 57,68" stroke="#7a3b30" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M48,71 Q50,77 53,71Z" fill="#e8737a"/>';
      default: return '<path d="M43,67 Q50,74 57,67" stroke="#7a3b30" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
    }
  }
  function glasses(g) {
    if (!g) return "";
    var st = 'stroke="#2b2b2b" stroke-width="2" fill="' + (g === 3 ? "#1d1d24" : "rgba(255,255,255,.15)") + '"';
    if (g === 1) return '<circle cx="39" cy="57" r="8" ' + st + '/><circle cx="61" cy="57" r="8" ' + st + '/><path d="M47,56 Q50,54 53,56" stroke="#2b2b2b" stroke-width="2" fill="none"/>';
    return '<rect x="29.5" y="50" width="19" height="14" rx="' + (g === 3 ? 6 : 3) + '" ' + st + '/><rect x="51.5" y="50" width="19" height="14" rx="' + (g === 3 ? 6 : 3) + '" ' + st + '/><path d="M48.5,55 L51.5,55" stroke="#2b2b2b" stroke-width="2"/>' + (g === 3 ? '<path d="M33,53 L38,53" stroke="#fff" stroke-width="1.4" opacity=".6"/><path d="M55,53 L60,53" stroke="#fff" stroke-width="1.4" opacity=".6"/>' : "");
  }
  function extra(x) {
    if (x === 1) return '<g fill="#b0703f" opacity=".7"><circle cx="34" cy="65" r=".9"/><circle cx="37" cy="67" r=".9"/><circle cx="31" cy="67" r=".9"/><circle cx="66" cy="65" r=".9"/><circle cx="63" cy="67" r=".9"/><circle cx="69" cy="67" r=".9"/></g>';
    if (x === 3) return '<circle cx="64" cy="66" r="1" fill="#3a2a22"/>';
    return "";
  }
  function hat(h, col) {
    switch (h) {
      case 1: return '<path d="M20,40 C20,18 36,10 50,10 C64,10 80,18 80,40Z" fill="' + col + '"/><rect x="18" y="36" width="64" height="9" rx="4.5" fill="' + col + '" opacity=".85"/><circle cx="50" cy="8" r="5" fill="#fff"/>';
      case 2: return '<path d="M22,38 C22,18 36,13 50,13 C64,13 78,18 78,38Z" fill="' + col + '"/><path d="M50,36 L92,38 C92,43 70,44 50,42Z" fill="' + col + '" opacity=".9"/><circle cx="50" cy="15" r="2" fill="#fff" opacity=".7"/>';
      case 3: return '<path d="M22,42 C24,22 38,17 50,17 C62,17 76,22 78,42" stroke="' + col + '" stroke-width="5" fill="none" stroke-linecap="round"/>';
      case 4: return '<path d="M64,22 L54,15 L54,29Z M64,22 L74,15 L74,29Z" fill="' + col + '"/><circle cx="64" cy="22" r="3" fill="' + col + '" stroke="#fff" stroke-width="1"/>';
      case 5: return '<path d="M20,52 C20,22 34,13 50,13 C66,13 80,22 80,52" stroke="#2b2b2b" stroke-width="3.5" fill="none"/><rect x="13" y="46" width="11" height="17" rx="5" fill="' + col + '"/><rect x="76" y="46" width="11" height="17" rx="5" fill="' + col + '"/>';
    }
    return "";
  }
  function svg(c, crown) {
    c = clamp(c);
    var skin = pick(SKIN, c.skin), hc = pick(HAIRC, c.hc), hp = hairParts(c.hair % OPTS.hair.length, hc), hatc = pick(SHIRT, c.hatc);
    var blush = c.extra === 2 ? 0.55 : 0.25;
    return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="头像"><defs><clipPath id="hc' + '"><circle cx="50" cy="50" r="50"/></clipPath></defs><g clip-path="url(#hc)">' +
      '<rect width="100" height="100" fill="' + pick(BG, c.bg) + '"/>' + hp.b +
      '<path d="M18,100 C20,84 34,80 50,80 C66,80 80,84 82,100Z" fill="' + pick(SHIRT, c.shirt) + '"/><rect x="44" y="74" width="12" height="10" fill="' + skin + '"/>' +
      '<circle cx="23" cy="58" r="5.5" fill="' + skin + '"/><circle cx="77" cy="58" r="5.5" fill="' + skin + '"/>' +
      '<ellipse cx="50" cy="55" rx="27" ry="27" fill="' + skin + '"/>' +
      '<ellipse cx="33" cy="65" rx="5" ry="3" fill="#f08a8a" opacity="' + blush + '"/><ellipse cx="67" cy="65" rx="5" ry="3" fill="#f08a8a" opacity="' + blush + '"/>' +
      hp.f + brows(c.brow % 3, hc === "#d9a65b" ? "#a8742f" : hc) + eyes(c.eyes % 5) + '<path d="M49,62 Q50,64 51,62" stroke="#c98a6a" stroke-width="1.4" fill="none" stroke-linecap="round"/>' + mouth(c.mouth % 5) + extra(c.extra % 4) + glasses(c.glass % 4) + hat(c.hat % 6, hatc) +
      (crown ? '<path d="M34,16 L38,4 L44,12 L50,2 L56,12 L62,4 L66,16Z" fill="#f2c230" stroke="#b0852c" stroke-width="1.2"/>' : "") +
      '</g></svg>';
  }
  function render(av, px, crown) {
    px = px || 40;
    var inner = av && av.k === "img" && /^data:image\/(webp|jpeg|png);base64,/.test(av.d || "") ? '<img src="' + av.d + '" alt="头像">' + (crown ? '<span class="av-crown">👑</span>' : "") : svg(av && av.k === "svg" ? av.c : null, crown);
    return '<span class="hav" style="width:' + px + 'px;height:' + px + 'px">' + inner + '</span>';
  }

  /* 上传：取中间的正方形，压成 128×128 */
  function shrink(file) {
    return new Promise(function (ok, no) {
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () { var s = Math.min(im.width, im.height), cv = document.createElement("canvas"); cv.width = cv.height = 128; var cx = cv.getContext("2d"); cx.fillStyle = "#fff"; cx.fillRect(0, 0, 128, 128); cx.drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, 128, 128); URL.revokeObjectURL(url); var d = cv.toDataURL("image/webp", 0.82); if (!/^data:image\/webp/.test(d)) d = cv.toDataURL("image/jpeg", 0.82); ok(d); };
      im.onerror = function () { no(new Error("img")); }; im.src = url;
    });
  }

  function maker(box, av, onSave, onCancel) {
    var mode = av && av.k === "img" ? "img" : "svg", cfg = clamp(av && av.k === "svg" ? av.c : null), img = av && av.k === "img" ? av.d : "";
    var rows = [["hair", "发型"], ["hc", "发色", HAIRC], ["skin", "肤色", SKIN], ["eyes", "眼睛"], ["brow", "眉毛"], ["mouth", "表情"], ["glass", "眼镜"], ["hat", "帽子和发饰"], ["hatc", "帽子颜色", SHIRT], ["extra", "脸上"], ["shirt", "衣服颜色", SHIRT], ["bg", "底色", BG]];
    box.innerHTML = '<div class="avm"><div class="avm-side"><div class="avm-big" id="avBig"></div><div class="avm-mode"><button type="button" data-m="svg">自己捏</button><button type="button" data-m="img">上传图片</button></div><button type="button" class="ghost" id="avRand">🎲 随机一个</button></div><div class="avm-opts" id="avOpts"></div></div><div class="avm-act"><button type="button" class="ghost" id="avNo">取消</button><button type="button" class="btn" id="avOk">就用这个</button></div>';
    var big = box.querySelector("#avBig"), opts = box.querySelector("#avOpts");
    function cur() { return mode === "img" && img ? { k: "img", d: img, t: Date.now() } : { k: "svg", c: cfg, t: Date.now() }; }
    function paint() {
      big.innerHTML = render(cur(), 160);
      [].forEach.call(box.querySelectorAll(".avm-mode button"), function (b) { b.classList.toggle("on", b.getAttribute("data-m") === mode); });
      box.querySelector("#avRand").hidden = mode !== "svg";
      if (mode === "img") {
        opts.innerHTML = '<p class="note">可以上传一张<b>卡通头像</b>：比如手机里做好的 Memoji、拟我表情，或者你自己画的画。<b>不要用真人照片</b>。图片会裁成正方形，全班同学都能看到。</p><input type="file" accept="image/*" id="avFile"><p class="msg" id="avMsg"></p>';
        var f = opts.querySelector("#avFile");
        f.addEventListener("change", function () { var file = f.files[0]; if (!file) return; if (!/^image\//.test(file.type)) { opts.querySelector("#avMsg").textContent = "请选一张图片。"; return; } shrink(file).then(function (d) { img = d; paint(); }).catch(function () { opts.querySelector("#avMsg").textContent = "这张图片打不开，换一张试试。"; }); });
        return;
      }
      var h = "";
      rows.forEach(function (r) {
        var k = r[0], list = r[2] || OPTS[k];
        h += '<div class="avm-row"><b>' + r[1] + '</b><div class="avm-ch">';
        list.forEach(function (v, i) {
          var on = cfg[k] === i ? " on" : "";
          if (r[2]) h += '<button type="button" class="sw' + on + '" data-k="' + k + '" data-i="' + i + '" style="background:' + v + '" aria-label="' + r[1] + (i + 1) + '"></button>';
          else { var c2 = Object.assign({}, cfg); c2[k] = i; h += '<button type="button" class="pv' + on + '" data-k="' + k + '" data-i="' + i + '" title="' + v + '">' + render({ k: "svg", c: c2 }, 46) + '<small>' + v + '</small></button>'; }
        });
        h += '</div></div>';
      });
      opts.innerHTML = h;
    }
    box.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b || !box.contains(b)) return;
      if (b.hasAttribute("data-k")) { cfg[b.getAttribute("data-k")] = +b.getAttribute("data-i"); var sc = opts.scrollTop; paint(); opts.scrollTop = sc; return; }
      if (b.hasAttribute("data-m")) { mode = b.getAttribute("data-m"); paint(); return; }
      if (b.id === "avRand") { var n = { hair: OPTS.hair.length, hc: HAIRC.length, skin: SKIN.length, eyes: 5, brow: 3, mouth: 5, glass: 4, hat: 6, hatc: SHIRT.length, extra: 4, shirt: SHIRT.length, bg: BG.length }; for (var k in n) cfg[k] = Math.floor(Math.random() * n[k]); if (Math.random() < .6) cfg.hat = 0; if (Math.random() < .6) cfg.glass = 0; paint(); return; }
      if (b.id === "avNo") { onCancel && onCancel(); return; }
      if (b.id === "avOk") { if (mode === "img" && !img) { var m = box.querySelector("#avMsg"); if (m) m.textContent = "先选一张图片。"; return; } onSave(cur()); }
    });
    paint();
  }

  window.HoraAvatar = { render: render, maker: maker };
})();
