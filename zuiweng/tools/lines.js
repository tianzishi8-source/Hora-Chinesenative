// 《醉翁亭记》自学课录音清单：从 lesson-zuiweng.js 收集所有要录的台词，按引擎规则判断谁说，输出录音清单和页面用的 lesson-voice.js。
// 用法（zuiweng 目录）：node tools/lines.js lesson-zuiweng.js /tmp/zw-items.json  → 清单 + lesson-voice.js
//         python3 tools/record.py /tmp/zw-items.json voice
// 来源：项目 claude/课文引擎/tools/voice-lines.js。本课加了：trans 步骤（原句、译文、回应都读）；sayFix 按词组替换多音字（录音专用，屏幕上不变）。
const fs=require('fs'),vm=require('vm'),path=require('path');
const ctx={window:{}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(process.argv[2],'utf8'),ctx);
const L=ctx.window.LESSON,C=L.cast,lead=C.lead,coach=C.coach||C.lead;
const people=Object.assign({},C.people);
for(const w in people){const p=people[w];if(p.voicesBy){people[w]=Object.assign({},p,{voices:[].concat(...Object.values(p.voicesBy))});}}
function vhash(w,v,t){let h=0x811c9dc5;const s=w+"|"+v+"|"+t;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0;}return h.toString(16).padStart(8,"0");}
function voiceText(t){return String(t).replace(/\{([\w.]+)(?:\|([^}]*))?\}/g,(m,p,fb)=>fb||"").replace(/^[，、,\s]+/,"").replace(/([，。！？])[，、\s]+/g,"$1").replace(/\s{2,}/g," ").trim();}
function fix(t){let s=(L.voiceFix||{})[t];if(s)return s;let o=t;(L.sayFix||[]).forEach(([a,b])=>{o=o.split(a).join(b);});return o!==t?o:null;}
const lines=[];const BUDDY=["清弦","长歌"];const add=(w,t)=>{if(!t||w==="me"||!people[w])return;if(/\{buddy/.test(t)){BUDDY.forEach(n=>add(w,t.replace(/\{buddy(?:\|[^}]*)?\}/g,n)));return;}if(/\{/.test(t))t=voiceText(t);if(!t||/\{/.test(t))return;lines.push([w,t]);};
const PXT=g=>{const a=g.days[0],b=g.days[g.days.length-1];return "第"+(a===b?a:a+"–"+b)+"天练习";};
const PXDAY=L.practice?[{beats:[{steps:(L.practice.core||[]).concat(Object.values(L.practice.variants||{}).filter(Boolean)).concat([{t:"say",text:"下面是你自己错过的题。先把原题再做一次，再做一道相似的新题。"}]).concat((L.practice.groups||[]).flatMap(g=>{const w=g.days.length>1?"两":"一";return [{t:"say",text:"这是"+PXT(g)+"。先做基础检测，人人都要做；再做你在这"+w+"天错过的题，每道后面跟一道相似的新题。"},{t:"say",text:"这"+w+"天你没有错过的题。基础检测做完，这一组练习就完成了。"}];})).concat([{t:"say",text:"这一组练习做完了。"}])}]}]:[];
for(const d of L.days.concat(L.reviews||[]).concat(PXDAY)){add(d.endWho||lead,d.end);
 for(const b of d.beats)for(const s of b.steps){const w=s.who||lead,fb=s.feedbackWho||coach,mfb=s.feedbackWho||lead;
  switch(s.t){
   case"say":add(w,s.text);break;
   case"mc":add(w,s.ask);(s.options||[]).forEach(o=>add(o.who||mfb,o.reply));break;
   case"trans":if(s.read!==false){add(w,s.src);add(w,s.tr);}if(s.replies)Object.values(s.replies).forEach(r=>add(s.who||coach,r));break;
   case"ask":add(w,s.say);(s.hints||[]).forEach(h=>add(mfb,h));(s.choices||[]).forEach(c=>{if(!c.ok)add(mfb,c.reply||"再回到原句读一读。");});add(s.who||mfb,s.reply||(s.ans?"对。"+s.ans:"对。"));add(mfb,"不着急，从这几个里选一选。");break;
   case"author":(s.qs||[]).forEach(it=>it.a.forEach(l=>add(it.who||w,l)));break;
   case"frame":if(s.nudge)add(s.nudge.who||lead,s.nudge.text);(s.replies||[]).forEach(r=>add(r.who||w,r.text));(s.parts||[]).forEach(pt=>add(coach,pt.short||"这一空再多写几个字。"));break;
   case"listen":add(s.who||lead,s.ask);add(s.a.who,s.a.text);add(s.b.who,s.b.text);break;
   case"name":add(w,s.ask);add(w,s.greet);add(w,s.back);break;
   case"pick":add(w,s.ask);(s.misses||[]).forEach(m=>add(fb,m.text));(s.fallback||[]).forEach(t=>add(fb,t));add(s.okWho||w,s.okText);break;
   case"input":add(s.who||coach,s.short||"再多写一些。");(s.replies||[]).forEach(r=>add(r.who||w,r.text));break;
   case"scene":Object.values(s.lines||{}).forEach(l=>add(l.who,l.text));break;
   case"gallery":add(w,s.sentReal);(s.virtual||[]).forEach(v=>{const id="v_"+v.id;people[id]={voices:v.voice?[v.voice]:[]};add(id,v.reply);});break;
  }}}
for(const w in C.people){const p=C.people[w];if(!p.sample)continue;if(w==="me"){lines.push(["me",p.sample]);continue;}add(w,p.sample);}
const items=[],keys={},seen=new Set();
for(const [w,t] of lines){for(const v of (people[w].voices||[])){const id=vhash(w,v.id,t);if(seen.has(id))continue;seen.add(id);keys[id]=1;
  const say=fix(t);
  items.push(Object.assign({id,engine:"edge",voice:v.tts,rate:v.rate||"+0%",pitch:v.pitch||"+0Hz",text:t},say?{say}:{}));}}
if(L.narration){const n=L.narration.voice;L.paras.forEach((p,i)=>{const say=fix(p);items.push(Object.assign({id:"n"+i,engine:"edge",voice:n.tts,rate:n.rate||"+0%",pitch:n.pitch||"+0Hz",text:p},say?{say}:{}));});}
fs.writeFileSync(process.argv[3],JSON.stringify(items,null,1));
fs.writeFileSync(path.join(path.dirname(process.argv[2]),'lesson-voice.js'),'/* 自动生成（tools/lines.js）：预录台词清单（文件名＝人物|音色|台词 的哈希） */\nwindow.LESSON_VOICE={dir:"voice/",keys:'+JSON.stringify(keys)+'};\n');
console.log('lines',lines.length,'clips',items.length,'fixed',items.filter(i=>i.say).length);
