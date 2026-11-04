// 从课堂版剧情（data/story.js）里取出范公（fan）要录的台词，格式和 ketang/tools/proj_lines.js 一样：[{who, text, hash}]
// 朗读文字、编号与页面（app.js 的 voiceText / hashStr）相同：hash("fan|" + 朗读文字)。读音修正用 data/text.js 的 voiceFix。
// 用法（在仓库根目录）：
//   node yueyanglou-ke/tools/yk_lines.js yueyanglou-ke/data/story.js > /tmp/yk_lines.json
//   python3 ketang/tools/proj_record.py /tmp/yk_lines.json yueyanglou-ke/voice
// 带 {name}（学生名字）的台词没法提前录，跳过（页面里这些句子不出声）。
const fs = require("fs"), vm = require("vm"), path = require("path");
const file = process.argv[2] || path.join(__dirname, "..", "data", "story.js");
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(file, "utf8"), ctx);
try { vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", "data", "text.js"), "utf8"), ctx); } catch (e) {}
const STORY = ctx.window.YK_STORY || [], FIX = (ctx.window.YK_TEXT && ctx.window.YK_TEXT.voiceFix) || [];

function voiceText(t) {
  t = String(t || "").replace(/（[^）]*）/g, "");
  FIX.forEach(p => { t = t.split(p[0]).join(p[1]); });
  return t.replace(/[“”‘’「」]/g, "").replace(/——/g, "，").replace(/……/g, "，");
}
function hash(s) { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return ("0000000" + h.toString(16)).slice(-8); }

const out = [], seen = new Set();
let skipped = 0;
function add(who, say) {
  if (who !== "fan" || !say) return;
  if (/\{name\}/.test(say)) { skipped++; return; }
  const text = voiceText(say), h = hash("fan|" + text);
  if (seen.has(h)) return; seen.add(h);
  out.push({ who: "fan", text, hash: h });
}
STORY.forEach(ch => Object.keys(ch.nodes || {}).forEach(k => {
  const n = ch.nodes[k];
  (n.lines || []).forEach(l => add(l.who, l.say));
  if (n.quiz) { add(n.quiz.by || "fan", n.quiz.ok); add(n.quiz.by || "fan", n.quiz.no); }
}));
process.stderr.write(`范公台词 ${out.length} 句（带名字跳过 ${skipped} 句）\n`);
process.stdout.write(JSON.stringify(out, null, 1));
