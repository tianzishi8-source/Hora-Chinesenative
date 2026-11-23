// 《悔的边缘》录音清单（本课专用补充版，不改 zuiweng/tools/lines.js 本体）。
// 按本目录 engine.js 的实际取音规则收齐本课所有会被朗读的话：文件名＝vhash(人物|音色id|屏幕上的那句话)，放在 voice/ 下；
// 全文朗读 n0.mp3—n6.mp3（engine 的 narrClip：narration.prefix + 段号 + ".mp3"）。
// 比 zuiweng/tools/lines.js 多收：order（ask、选错提示 miss，feedbackWho||伴学）、sides（选错提示 miss，feedbackWho||主讲）、
//   note（s.text）、todo（s.text）、input 的 needWords/requireEnd 提示、mc 的 ask/otherReply、todoSay（批注、作业提醒）、
//   练习组与错题本的引擎固定台词（错题本“这一轮有 n 道”按 1—10 全收）、伴学按所选伴学（清弦/长歌）分音色、
//   voiceSub（多音字换同音字，只进录音的 say，屏幕上不变）。
// 用法（huibian 目录）：
//   node tools/lines-huibian.js lesson-huibian.js /tmp/hb-items.json      → 录音清单；lesson-voice.js 只登记 voice/ 里已有的文件
//   python3 ../zuiweng/tools/record.py /tmp/hb-items.json voice            → 录音（record.py 认 say 字段）
//   node tools/lines-huibian.js lesson-huibian.js --check voice            → 对照 voice/ 目录，列出缺的文件（0 缺失才算录齐）
// 录完以后：再跑一次第一条命令（把录好的登记进 lesson-voice.js），再跑 --check 确认 0 缺失；然后把 lesson-huibian.js 里 narration 的 ready:false 去掉，全文朗读才会改用 voice/n*.mp3。
const fs=require('fs'),vm=require('vm'),path=require('path');
const lessonPath=process.argv[2],arg3=process.argv[3];
if(!lessonPath||!arg3){console.error('用法：node tools/lines-huibian.js lesson-huibian.js <清单.json> | --check <voice目录>');process.exit(1);}
const ctx={window:{},encodeURIComponent,console};vm.createContext(ctx);vm.runInContext(fs.readFileSync(lessonPath,'utf8'),ctx);
const L=ctx.window.LESSON,C=L.cast,lead=C.lead,coach=C.coach||C.lead;
const BUDDIES={qingxian:"清弦",changge:"长歌"};/* 同 engine.js 的 BUDDIES */

function vhash(w,v,t){let h=0x811c9dc5;const s=w+"|"+v+"|"+t;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0;}return h.toString(16).padStart(8,"0");}
/* engine.js 的 fill() 在没有作答数据时：{key|备用} → 备用；{buddy|…} → 伴学名字；再去掉开头的逗号 */
function filled(t,buddyName){return String(t).replace(/\{buddy(?:\|[^}]*)?\}/g,buddyName||"清弦").replace(/\{([\w.]+)(?:\|([^}]*))?\}/g,(m,p,fb)=>fb||"").replace(/^[，、,\s]+/,"");}
function sayText(t){let o=(L.voiceFix||{})[t]||t;(L.voiceSub||[]).concat(L.sayFix||[]).forEach(([a,b])=>{o=o.split(a).join(b);});return o!==t?o:null;}

/* 每个人物的音色：伴学（sprite:"buddy"）按所选伴学分组；“我”按发型分组 */
function voiceSets(w){const p=C.people[w];if(!p)return [];
  if(p.sprite==="buddy"&&p.voicesBy)return Object.keys(p.voicesBy).map(b=>({buddy:BUDDIES[b]||"清弦",voices:p.voicesBy[b]}));
  if(p.voicesBy)return [{voices:[].concat(...Object.values(p.voicesBy))}];
  return [{voices:p.voices||[]}];}

const lines=[];const skipped=[];
function add(w,t,why){if(!t)return;w=w||lead;if(!C.people[w]){skipped.push(w+"："+t);return;}if(w==="me"&&why!=="sample")return;lines.push([w,String(t)]);}

/* ---- 课上每一天 ---- */
function walk(steps){for(const s of steps){const w=s.who||lead;
  switch(s.t){
   case"say":["text"].forEach(f=>{add(w,s[f]);const by=s[f+"By"];if(by)Object.values(by).forEach(x=>add(w,x));const ci=s[f+"If"];if(ci){Object.values(ci.map||{}).forEach(x=>add(w,x));if(ci.other!=null)add(w,ci.other);}});break;
   case"mc":{const fb=s.feedbackWho||lead;add(w,s.ask);(s.options||[]).forEach(o=>add(o.who||fb,o.reply));if(s.otherReply)add(fb,s.otherReply);
     const NC=!s.stance&&s.note!==false&&(s.note||s.paras||s.hl);if(NC)((L.todoSay||{}).note||[]).forEach(x=>add(lead,x));break;}
   case"order":add(w,s.ask);if(s.miss)add(s.feedbackWho||coach,s.miss);break;
   case"sides":if(s.miss)add(s.feedbackWho||lead,s.miss);break;
   case"note":add(w,s.text);break;
   case"todo":add(w,s.text);break;
   case"input":{const iw=s.who||coach;if(s.min)add(iw,s.short||"再多写一些。");if(s.needWords)add(iw,s.needWords.text);if(s.requireEnd)add(s.requireEnd.who||coach,s.requireEnd.text);(s.replies||[]).forEach(r=>add(r.who||s.who,r.text));break;}
   case"pick":{const fb=s.feedbackWho||coach;add(w,s.ask);(s.misses||[]).forEach(m=>add(fb,m.text));(s.fallback||[]).forEach(t=>add(fb,t));add(s.okWho||w,s.okText);break;}
   case"ask":{const fb=s.feedbackWho||lead;add(w,s.say);(s.hints||[]).forEach(h=>add(fb,h));(s.choices||[]).forEach(c=>{if(!c.ok)add(fb,c.reply||"再回到原句读一读。");});add(s.who||fb,s.reply||(s.ans?"对。"+s.ans:"对。"));break;}
   case"listen":add(s.who||lead,s.ask);if(s.a)add(s.a.who,s.a.text);if(s.b)add(s.b.who,s.b.text);break;
   /* listenAll：全文朗读另收（n*）；lines / openBook / text / pic 不出声 */
  }}}
L.days.forEach((d,i)=>{d.beats.forEach(b=>walk(b.steps));const last=i===L.days.length-1;add(d.endWho||lead,d.end||(last?"读完了。":"第"+(i+1)+"天读完了。下次见。"));
  if(d.after&&/课后作业/.test(d.after))((L.todoSay||{}).hw||[]).forEach(x=>add(lead,x));});

/* ---- 练习（engine.js buildPractice / endOfDay 的固定台词；重做原题的回应就是课上那道题的回应，上面已收） ---- */
if(L.practice){const P=L.practice,PG=P.groups||[{days:L.days.map((d,i)=>i+1)}];
  walk((P.core||[]).concat(Object.values(P.variants||{}).filter(Boolean)));
  PG.forEach(g=>{const a=g.days[0],b=g.days[g.days.length-1],t="第"+(a===b?a:a+"–"+b)+"天练习",two=g.days.length>1?"两":"一";
    add(lead,"这是"+t+"。先做基础检测，人人都要做；再做你在这"+two+"天错过的题，每道后面跟一道相似的新题。");
    add(lead,"这"+two+"天你没有错过的题。基础检测做完，这一组练习就完成了。");});
  add(lead,"下面是你自己错过的题。先把原题再做一次，再做一道相似的新题。");
  add(lead,"这一组练习做完了。");
  /* 错题本（buildCuoti）：一轮最多 10 道 */
  for(let n=1;n<=10;n++)add(lead,"这是你的错题本：没有一次做对的题，还有课文里新加、你还没做过的题，都在这里。先重做原题，再做一道相似的新题；做对了，这道题就从错题本里划掉。这一轮有 "+n+" 道。");
  add(lead,"错题本里没有要重做的题了。");}
/* ---- 配音设置里的试听 ---- */
for(const w in C.people){const p=C.people[w];if(p.sample)add(w,p.sample,"sample");}

/* ---- 展开成录音条目 ---- */
const items=[],keys={},seen=new Set();
for(const [w,t] of lines){for(const set of voiceSets(w)){const text=filled(t,set.buddy);if(!text||/\{/.test(text))continue;
  for(const v of set.voices){const id=vhash(w,v.id,text);if(seen.has(id))continue;seen.add(id);keys[id]=1;const say=sayText(text);
    items.push(Object.assign({id,who:w,engine:"edge",voice:v.tts,rate:v.rate||"+0%",pitch:v.pitch||"+0Hz",text},say?{say}:{}));}}}
const narr=[];if(L.narration){const n=L.narration.voice||{},pre=String(L.narration.prefix||"voice/n").replace(/^voice\//,"");
  L.paras.forEach((p,i)=>{const say=sayText(p);narr.push(Object.assign({id:pre+i,who:"narration",engine:"edge",voice:n.tts,rate:n.rate||"+0%",pitch:n.pitch||"+0Hz",text:p},say?{say}:{}));});}
const all=items.concat(narr);

if(arg3==="--check"){const dir=process.argv[4]||path.join(path.dirname(lessonPath),"voice");const miss=all.filter(it=>!fs.existsSync(path.join(dir,it.id+".mp3")));
  console.log("应有",all.length,"个文件（台词",items.length,"＋全文",narr.length,"），缺",miss.length);miss.slice(0,60).forEach(it=>console.log("  缺",it.id,it.who,it.text.slice(0,30)));
  const lv=fs.readFileSync(path.join(path.dirname(lessonPath),"lesson-voice.js"),"utf8");const notK=items.filter(it=>lv.indexOf('"'+it.id+'"')<0);if(notK.length)console.log("lesson-voice.js 里没登记的",notK.length,"条：先不带 --check 跑一次");
  if(L.narration&&L.narration.ready===false&&!narr.some(it=>miss.includes(it)))console.log("全文朗读已录齐：记得去掉 lesson-huibian.js 里 narration 的 ready:false");
  process.exit(miss.length?2:0);}
fs.writeFileSync(arg3,JSON.stringify(all,null,1));
/* lesson-voice.js 只登记 voice/ 里已经有的文件：没录之前 keys 是空的，页面不会去请求不存在的 mp3（不出 404）；录完再跑一次就登记全了 */
const vdir=path.join(path.dirname(lessonPath),"voice"),have={};Object.keys(keys).forEach(k=>{if(fs.existsSync(path.join(vdir,k+".mp3")))have[k]=1;});
fs.writeFileSync(path.join(path.dirname(lessonPath),'lesson-voice.js'),'/* 自动生成（tools/lines-huibian.js）：预录台词清单（文件名＝人物|音色|台词 的哈希）。只登记 voice/ 里已有的文件 */\nwindow.LESSON_VOICE={dir:"voice/",keys:'+JSON.stringify(have)+'};\n');
console.log("lesson-voice.js 登记",Object.keys(have).length,"/",Object.keys(keys).length,"条",Object.keys(have).length<Object.keys(keys).length?"（录完以后再跑一次本命令）":"");
console.log("台词",lines.length,"句 → 录音",items.length,"条；全文",narr.length,"段；换读音",all.filter(i=>i.say).length,"条；共",all.length,"条");
if(skipped.length)console.log("没有这个人物、跳过：\n  "+skipped.join("\n  "));
