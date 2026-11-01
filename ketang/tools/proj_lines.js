// 从课堂配置里取出所有要录的台词（和 proj.js 用同样的朗读文字和编号）
// 用法：node tools/proj_lines.js yyl-1.js > lines.json
const fs = require("fs"), vm = require("vm");
const file = process.argv[2];
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(file, "utf8"), ctx);
const L = ctx.window.PROJ_LESSON;

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
  var parts = st.say.split(/(?<=[。！？；])/), chunks = [], cur = "";
  parts.forEach(function (p) { if (cur && (cur + p).length > MAX) { chunks.push(cur); cur = p; } else cur += p; });
  if (cur) chunks.push(cur);
  if (chunks.length < 2) return [st];
  var tail = ["hold", "btns", "timer", "tip", "respond", "id"];
  return chunks.map(function (c, i) {
    var o = {};
    if (i === 0) Object.keys(st).forEach(function (k) { if (tail.indexOf(k) < 0) o[k] = st[k]; });
    else { o.who = st.who; if (st.face) o.face = st.face; }
    if (i === chunks.length - 1) tail.forEach(function (k) { if (st[k] !== undefined) o[k] = st[k]; });
    o.say = c; return o;
  });
}
L.segments.forEach(sg => sg.steps.forEach(st0 => splitLong(st0).forEach(st => {
  if (st.say) add(st.who, voiceText(st));
  if (st.read) st.read.paras.forEach(pk => L.paras[pk].forEach(s => add("fan", voiceText({ say: s }))));
  if (st.respond) st.respond.opts.forEach(o => add(o.who, voiceText(o)));
  // 屏幕提示的朗读（和 proj.js 的 promptOf 一致）
  if (!st.say && !st.quiet) {
    if (st.respond) add(st.respond.by || "qx", voiceText({ say: st.respond.ask || "被点到的同学，请读一读你写的。" }));
    else if (st.ask || st.note) add(st.by || "qx", voiceText({ say: st.ask || st.note }));
  }
})));
process.stdout.write(JSON.stringify(out, null, 1));
