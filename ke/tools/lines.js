// 课堂版通用：从一课的剧情（{课文夹}/data/story.js）取出要录的台词，输出 [{who, text, hash}] 给 record.py。
// 用法（仓库根目录）：node ke/tools/lines.js zuiweng-ke > /tmp/lines.json
// who 是“说话人键”：fan（或章节 guide.vkey）/ narr / x-名字 / me-b1…me-g4。朗读文字和编号与 ../app.js 的 voiceText / hashStr 相同。
// 读音修正用 data/text.js 的 voiceFix。带 {name} 的句子跳过（页面里这些句子不出声）。
const fs = require("fs"), vm = require("vm"), path = require("path");
const dir = process.argv[2]; if (!dir) { console.error("用法：node ke/tools/lines.js 课文文件夹"); process.exit(1); }
const ctx = { window: {} };
for (const f of ["conf.js", "data/text.js", "data/story.js"]) vm.runInNewContext(fs.readFileSync(path.join(dir, f), "utf8"), ctx);
const C = ctx.window.YK_CONF || {}, STORY = ctx.window.YK_STORY || [], FIX = (ctx.window.YK_TEXT && ctx.window.YK_TEXT.voiceFix) || [];
const ME_KEYS = ["me-b1", "me-b2", "me-b3", "me-b4", "me-g1", "me-g2", "me-g3", "me-g4"];
function voiceText(t) { t = String(t || "").replace(/（[^）]*）/g, ""); FIX.forEach(p => { t = t.split(p[0]).join(p[1]); }); return t.replace(/[“”‘’「」]/g, "").replace(/——/g, "，").replace(/……/g, "，"); }
function hash(s) { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return ("0000000" + h.toString(16)).slice(-8); }
function spoken(c) { if (typeof c.say === "string") return c.say; if (c.say === true) return c.t; const m = String(c.t || "").match(/“[^”]*”/g); return m ? m.map(s => s.slice(1, -1)).join("") : ""; }
const out = [], seen = new Set(); let skipped = 0;
function add(key, say) { if (!say) return; if (/\{name\}/.test(say)) { skipped++; return; } const text = voiceText(say), h = hash(key + "|" + text); if (!text.replace(/[，。！？、；：\s]/g, "") || seen.has(h)) return; seen.add(h); out.push({ who: key, text, hash: h }); }
function addWho(who, name, say, gk) { if (who === "me") ME_KEYS.forEach(k => add(k, say)); else if (who === "x") add("x-" + (name || ""), say); else if (who === "fan") add(gk, say); else add(who, say); }
ME_KEYS.forEach(k => add(k, C.vsample || "我准备好了。"));
if (C.rateSample) add("narr", C.rateSample);
STORY.forEach(ch => { const gk = (ch.guide && ch.guide.vkey) || (C.guide && C.guide.vkey) || "fan";
  Object.keys(ch.nodes || {}).forEach(k => { const n = ch.nodes[k];
    (n.lines || []).forEach(l => addWho(l.who, l.name, l.say, gk));
    if (n.quiz) { addWho(n.quiz.by || "fan", "", n.quiz.ok, gk); addWho(n.quiz.by || "fan", "", n.quiz.no, gk); }
    if (n.choices) { add("narr", n.ask); n.choices.forEach(c => addWho("me", "", spoken(c), gk)); }
  }); });
const by = {}; out.forEach(o => { const g = o.who.replace(/^me-.*/, "me（8种）"); by[g] = (by[g] || 0) + 1; });
process.stderr.write(`要录 ${out.length} 条：${JSON.stringify(by)}（带名字跳过 ${skipped} 处）\n`);
process.stdout.write(JSON.stringify(out));
