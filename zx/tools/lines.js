// 自学版通用：取出一课要录的话，输出 [{who, text, hash}] 给 ke/tools/record.py。
// 用法（仓库根目录）：node zx/tools/lines.js zuiweng > /tmp/zx_lines.json && python3 ke/tools/record.py /tmp/zx_lines.json zuiweng
// 录：对话（bd 伴学按清弦 qx、长歌 cg 各录一遍；g 作者；hy 徽音老师；narr 旁白；me 不录）、原文每一句（read）、字音题的字（read）。编号与 ../zx.js 相同。
const fs = require("fs"), vm = require("vm"), path = require("path");
const dir = process.argv[2]; const ctx = { window: {} };
for (const f of ["data/text.js", "data/lesson.js"]) vm.runInNewContext(fs.readFileSync(path.join(dir, f), "utf8"), ctx);
const Z = ctx.window.ZX, T = ctx.window.ZX_TEXT, FIX = T.voiceFix || [];
function voiceText(t) { t = String(t || "").replace(/（[^）]*）/g, ""); FIX.forEach(p => { t = t.split(p[0]).join(p[1]); }); return t.replace(/[“”‘’「」]/g, "").replace(/——/g, "，").replace(/……/g, "，"); }
function hash(s) { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return ("0000000" + h.toString(16)).slice(-8); }
const out = [], seen = new Set(); let skipped = 0;
function add(key, say) { if (!say) return; if (/\{name\}/.test(say)) { skipped++; return; } const text = voiceText(say), h = hash(key + "|" + text); if (!text.replace(/[，。！？、；：\s]/g, "") || seen.has(h)) return; seen.add(h); out.push({ who: key, text, hash: h }); }
const GK = (Z.guide && Z.guide.vkey) || "g";
Object.keys(T.paras).forEach(p => T.paras[p].forEach(x => add("read", typeof x === "string" ? x : x.t)));
Z.lessons.forEach(l => l.stages.forEach(s => s.blocks.forEach(b => {
  if (b.type === "talk") b.lines.forEach(x => { if (x.who === "bd") { add("qx", x.say); add("cg", x.say); } else if (x.who === "g") add(GK, x.say); else if (x.who === "hy" || x.who === "narr") add(x.who, x.say); });
  if (b.type === "py") b.items.forEach(it => add("read", it.say || it.w));
})));
const by = {}; out.forEach(o => { by[o.who] = (by[o.who] || 0) + 1; });
process.stderr.write(`要录 ${out.length} 条：${JSON.stringify(by)}（带名字跳过 ${skipped} 处）\n`);
process.stdout.write(JSON.stringify(out));
