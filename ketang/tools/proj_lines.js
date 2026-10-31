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
L.segments.forEach(sg => sg.steps.forEach(st => {
  if (st.say) add(st.who, voiceText(st));
  if (st.read) st.read.paras.forEach(pk => L.paras[pk].forEach(s => add("fan", voiceText({ say: s }))));
  if (st.respond) st.respond.opts.forEach(o => add(o.who, voiceText(o)));
}));
process.stdout.write(JSON.stringify(out, null, 1));
