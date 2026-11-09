// 从课堂配置里取出所有要录的台词（和 proj.js 用同样的朗读文字和编号）
// 用法：node tools/proj_lines.js yyl-1.js > lines.json
const fs = require("fs"), vm = require("vm");
const file = process.argv[2];
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(file, "utf8"), ctx);
const L = ctx.window.PROJ_LESSON;
// 逐句翻译库（步骤里 sent:"p1-1" 的台词取自这里，和 proj.js 一样）
let SENTS = [];
try { const sc = { window: {} }; vm.runInNewContext(fs.readFileSync(require("path").join(require("path").dirname(file), "../yueyanglou-ke/data/sents.js"), "utf8"), sc); SENTS = sc.window.YK_SENTS || []; } catch (e) {}
function resolveSent(st) {
  if (!st.sent) return st;
  const x = SENTS.find(y => y.id === st.sent);
  return Object.assign({}, st, { say: (st.pre || "") + (x ? (st.part === "src" ? x.src : x.tr) : "（缺句子 " + st.sent + "）") + (st.post || "") });
}

function voiceText(st) {
  let t = (st.v || st.say || "").replace(/（[^）]*）/g, "");
  (L.voiceFix || []).forEach(p => { t = t.split(p[0]).join(p[1]); });
  return t.replace(/[“”‘’「」]/g, "").replace(/——/g, "，").replace(/……/g, "，");
}
function hash(s) { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return ("0000000" + h.toString(16)).slice(-8); }

const out = [], seen = new Set();
function add(who, text) {
  if (!text) return;
  const h = hash(who + "|" + text);
  if (seen.has(h)) return; seen.add(h);
  out.push({ who, text, hash: h });
}
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
// 三级台阶提问（ladder.js）：和 proj.js 一样先展开
const lc = { window: {} }; vm.runInNewContext(fs.readFileSync(require("path").join(require("path").dirname(file), "ladder.js"), "utf8"), lc);
const LAD = lc.window.PROJ_LADDER;
L.segments.forEach(sg => sg.steps.flatMap(s => s.ladder ? LAD(s, L.lead) : [s]).forEach(st0 => splitLong(resolveSent(st0)).forEach(st => {
  if (st.say) add(st.who, voiceText(st));
  if (st.read) st.read.paras.forEach(pk => L.paras[pk].forEach(s => add(st.read.who || L.reader || L.lead || "fan", voiceText({ say: s }))));
  if (st.respond) st.respond.opts.forEach(o => add(o.who, voiceText(o)));
  // 屏幕提示的朗读（和 proj.js 的 promptOf 一致）
  if (!st.say && !st.quiet) {
    if (st.respond) add(st.respond.by || "qx", voiceText({ say: st.respond.ask || "被点到的同学，请读一读你写的。" }));
    else if (st.ask || st.note) add(st.by || "qx", voiceText({ say: st.ask || st.note }));
  }
})));
// 计时中的提醒
// （和 proj.js 的 NUDGE_SETS 一致：写的时候 / 讨论的时候 / 没有计时的时候）
const NUDGE_WRITE = L.nudges || [{ who: "qx", say: "嘿，你在认真写吗？" }, { who: "cg", say: "别走神，时间有限！" }, { who: "qx", say: "安静一点，大家都在写呢。" }, { who: "cg", say: "笔动起来！光看着，可写不出来。" }];
const NUDGE_TALK = L.nudgesTalk || [{ who: "qx", say: "说正事哦，只聊这道题。" }, { who: "cg", say: "声音小一点，同桌听见就够了。" }, { who: "qx", say: "两个人轮流说，别让一个人包场。" }, { who: "cg", say: "抓紧时间！说到好的，记得写下来。" }];
const NUDGE_LOOK = L.nudgesLook || [{ who: "cg", say: "眼睛看屏幕，跟上！" }, { who: "qx", say: "别走神，这里是重点。" }, { who: "cg", say: "嘿，回到课堂上来。" }];
NUDGE_WRITE.concat(NUDGE_TALK, NUDGE_LOOK).forEach(n => add(n.who, voiceText(n)));
// 点名：roster.js 里这个班的名字 × 点名句式（由主讲读）
try {
  const rc = { window: {} };
  vm.runInNewContext(fs.readFileSync(require("path").join(require("path").dirname(file), "roster.js"), "utf8"), rc);
  const names = (rc.window.PROJ_ROSTER || {})[L.klass || "default"] || [];
  const calls = L.callLines || ["{n}，你来说说。", "请{n}回答。", "{n}，说说你的想法。", "{n}，你来试试。"];
  names.forEach(nm => calls.forEach(c => add(L.lead || "fan", voiceText({ say: c.replace("{n}", nm) }))));
} catch (e) {}
process.stdout.write(JSON.stringify(out, null, 1));
