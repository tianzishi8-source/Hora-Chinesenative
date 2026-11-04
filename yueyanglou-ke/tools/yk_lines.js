// 从课堂版剧情（data/story.js）里取出全部要录的台词，格式：[{who, text, hash}]，给 tools/yk_record.py 用。
// who 是“说话人键”：fan 范仲淹 / narr 旁白 / x-阿娘、x-周伯（其他虚构人物，x- 加名字）/ me-b1…me-b4、me-g1…me-g4（“我”的 8 种声音）。
// 朗读文字、编号与页面（app.js 的 voiceText / hashStr / spoken）完全相同：hash(说话人键 + "|" + 朗读文字)。读音修正用 data/text.js 的 voiceFix。
// 录哪些：
//   · 所有台词（lines）和字词小题的回应（quiz.ok / quiz.no，默认范公说）；
//   · 选项节点的提问（ask）按旁白录；
//   · 学生选的选项，引号里的话（或标了 say:true 的整句）按“我”录；
//   · “我”的每一句 × 8 种声音；每种声音再录一句试听句。
// 带 {name}（学生名字）的句子没法提前录，跳过（页面里这些句子不出声，只显示文字）。
// 用法（在仓库根目录）：
//   node yueyanglou-ke/tools/yk_lines.js > /tmp/yk_lines.json
//   python3 yueyanglou-ke/tools/yk_record.py /tmp/yk_lines.json yueyanglou-ke/voice
const fs = require("fs"), vm = require("vm"), path = require("path");
const file = process.argv[2] || path.join(__dirname, "..", "data", "story.js");
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(file, "utf8"), ctx);
try { vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", "data", "text.js"), "utf8"), ctx); } catch (e) {}
const STORY = ctx.window.YK_STORY || [], FIX = (ctx.window.YK_TEXT && ctx.window.YK_TEXT.voiceFix) || [];

// “我”的声音（键要和 app.js 的 MYV、yk_record.py 的 VOICES 一致）
const ME_KEYS = ["me-b1", "me-b2", "me-b3", "me-b4", "me-g1", "me-g2", "me-g3", "me-g4"];
const SAMPLE = "范公，我来帮您晒书吧。";

function voiceText(t) {
  t = String(t || "").replace(/（[^）]*）/g, "");
  FIX.forEach(p => { t = t.split(p[0]).join(p[1]); });
  return t.replace(/[“”‘’「」]/g, "").replace(/——/g, "，").replace(/……/g, "，");
}
function hash(s) { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return ("0000000" + h.toString(16)).slice(-8); }
// 选项里“我”说出口的话：say 是字符串就用它；say:true 用整句；否则取引号“……”里的话（没有引号＝动作，不出声）
function spoken(c) {
  if (typeof c.say === "string") return c.say;
  if (c.say === true) return c.t;
  const m = String(c.t || "").match(/“[^”]*”/g);
  return m ? m.map(s => s.slice(1, -1)).join("") : "";
}

const out = [], seen = new Set();
let skipped = 0;
function add(key, say) {
  if (!say) return;
  if (/\{name\}/.test(say)) { skipped++; return; }
  const text = voiceText(say), h = hash(key + "|" + text);
  if (!text.replace(/[，。！？、；：\s]/g, "") || seen.has(h)) return; seen.add(h);
  out.push({ who: key, text, hash: h });
}
function addWho(who, name, say) {
  if (who === "me") ME_KEYS.forEach(k => add(k, say));
  else if (who === "x") add("x-" + (name || ""), say);
  else add(who, say);
}
ME_KEYS.forEach(k => add(k, SAMPLE));
STORY.forEach(ch => Object.keys(ch.nodes || {}).forEach(k => {
  const n = ch.nodes[k];
  (n.lines || []).forEach(l => addWho(l.who, l.name, l.say));
  if (n.quiz) { addWho(n.quiz.by || "fan", "", n.quiz.ok); addWho(n.quiz.by || "fan", "", n.quiz.no); }
  if (n.choices) { add("narr", n.ask); n.choices.forEach(c => addWho("me", "", spoken(c))); }
}));
const by = {}; out.forEach(o => { const g = o.who.replace(/^me-.*/, "me（8种）"); by[g] = (by[g] || 0) + 1; });
process.stderr.write(`要录 ${out.length} 条：${JSON.stringify(by)}（带名字跳过 ${skipped} 处）\n`);
process.stdout.write(JSON.stringify(out, null, 1));
