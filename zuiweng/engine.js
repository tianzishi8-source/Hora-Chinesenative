/* HORA 课文引擎 v0.3 · 剧场式
 * 课文内容在配置文件里（如 lesson-rili.js），本文件不含课文内容。用法：HORA.start(LESSON)
 * 画面：顶部课程条（天、环节）→ 左原文、右任务卡 → 底部人物与对话框（与《岳阳楼记》课件同一种形式）。
 * 技术：主线一律写死的脚本；扣原文的判断由规则完成；AI 只用在三处——
 *   1) 对话框“聊一聊”（独立作答时关闭）；2) t:"ai" 开放写作点评；3) 老师端课后小结。拿不到 AI 时自动隐藏或降级。
 * 学情：带 obs 的步骤记录 试了几次 / 触发哪条误区 / 作答原文，老师端汇总。
 */
(function(){
"use strict";
window.HORA={start:start};

function start(L){
if(!document.body){document.addEventListener("DOMContentLoaded",function(){start(L);});return;}
var reduce=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
function $(s,r){return (r||document).querySelector(s);}
function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));}
function el(t,a,k){var e=document.createElement(t);if(a)for(var n in a){if(n==="class")e.className=a[n];else if(n==="text")e.textContent=a[n];else if(n==="html")e.innerHTML=a[n];else e.setAttribute(n,a[n]);}(k||[]).forEach(function(c){if(c!=null)e.append(typeof c==="string"?document.createTextNode(c):c);});return e;}
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c];});}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}

var C=L.cast,PEOPLE=C.people;
var MSG=Object.assign({keyOut:"这一句不在这一层的段落里。关键句要在这一层的几段里找。",ladderEmpty:"还有一级空着，先把它写完。"},L.msgs||{});
function lead(){return C.lead;}
function coach(){return C.coach||C.lead;}

/* ================= 页面骨架 ================= */
document.title=L.title;
var app=el("div",{class:"app",id:"app"});
app.innerHTML=
 '<header class="bar"><div class="bar-in"><div class="brand">'+esc(L.title)+'<small>'+esc(L.sub||"")+'</small></div>'+
 '<nav class="days" id="days" aria-label="第几天"></nav>'+
 '<div class="tools"><button class="tbtn only-narrow" id="bText" type="button">原文</button><button class="tbtn" id="bSnd" type="button" aria-pressed="false" title="背景声">声音</button><button class="tbtn" id="bVoice" type="button" aria-pressed="true" title="把台词读出来">配音</button><button class="tbtn" id="bBook" type="button">'+esc(L.notebook.button)+'</button><button class="tbtn" id="bTMode" type="button" aria-pressed="false" hidden>老师</button><button class="tbtn" id="bTeacher" type="button" hidden>看作答</button></div></div>'+
 '<nav class="stages" id="stages" aria-label="环节"></nav></header>'+
 '<div class="main"><section class="reader" id="reader" aria-label="原文"><div class="rhead"><h2 id="rTitle">'+esc(L.textTitle)+'</h2><small id="rAuthor">'+esc(L.author)+'</small><span class="rtabs" id="rTabs"></span><span class="sp"></span><button class="ghost closer" id="bClose" type="button">收起</button></div><div class="rmode" id="rmode" hidden></div><div class="rbody" id="rbody"></div></section>'+
 '<section class="work" aria-live="polite"><div class="head"><h2 id="stTitle"></h2><span class="when" id="stWhen"></span></div><div class="th-task" id="task"></div></section></div>'+
 '<div class="th-cast" id="cast"><div class="actors l"></div><div class="dlg"><div class="dlg-who" id="dWho"></div><div class="dlg-txt" id="dTxt"></div><div class="dlg-ctl"><button type="button" class="dbtn" id="bLog">回看</button><button type="button" class="dbtn" id="bChat" hidden>聊一聊</button><span class="sp"></span><button type="button" class="tskip" id="bSkip" hidden>老师：跳过这一环节</button><button type="button" class="cont" id="bCont" hidden>继续 ▸</button></div></div><div class="actors r"></div></div>';
document.body.append(app,
 el("div",{class:"ov",id:"ovBook",hidden:""},[el("div",{class:"sheet",role:"dialog","aria-label":L.notebook.button,id:"bookSheet"})]),
 el("div",{class:"ov",id:"ovTeacher",hidden:""},[el("div",{class:"sheet",role:"dialog","aria-label":"看作答",id:"teacherSheet"})]),
 el("div",{class:"ov",id:"ovLog",hidden:""},[el("div",{class:"sheet log",role:"dialog","aria-label":"对话回看",id:"logSheet"})]));
var task=$("#task"),dWho=$("#dWho"),dTxt=$("#dTxt"),bCont=$("#bCont"),bSkip=$("#bSkip"),bChat=$("#bChat");

/* ================= 原文 ================= */
var PARAS=L.paras,CENTER=L.center||{},GLOSS=L.gloss||{};
var GKEYS=Object.keys(GLOSS).sort(function(a,b){return b.length-a.length;});
var SENT=[],PSENT=[];
PARAS.forEach(function(p,pi){var parts=p.match(/[^。！？]+[。！？]+[”’]?|[^。！？]+$/g)||[p];PSENT[pi]=[];parts.forEach(function(t){var id=SENT.length;SENT.push({id:id,p:pi,t:t});PSENT[pi].push(id);});});
var FULL=PARAS.join("");
/* 一个单元里有几篇课文（L.texts）：左边原文栏可以切换；第几天默认显示哪篇看 day.text */
var TEXTS={main:{title:L.textTitle,author:L.author,source:L.source,paras:L.paras,center:L.center,gloss:L.gloss,narration:L.narration}};if(L.texts)Object.keys(L.texts).forEach(function(k){TEXTS[k]=L.texts[k];});var CURTEXT="main";function PTXT(d){if(L.practiceText)return L.practiceText(d)||"main";return d>=6&&TEXTS.mt?"mt":"main";}
function useText(id){var T=TEXTS[id];if(!T)return;CURTEXT=id;PARAS=T.paras;CENTER=T.center||{};GLOSS=T.gloss||{};GKEYS=Object.keys(GLOSS).sort(function(a,b){return b.length-a.length;});SENT=[];PSENT=[];
  PARAS.forEach(function(p,pi){var parts=p.match(/[^。！？]+[。！？]+[”’]?|[^。！？]+$/g)||[p];PSENT[pi]=[];parts.forEach(function(t){var id2=SENT.length;SENT.push({id:id2,p:pi,t:t});PSENT[pi].push(id2);});});FULL=PARAS.join("");
  var h=document.getElementById("rTitle"),a=document.getElementById("rAuthor");if(h)h.textContent=T.title;if(a)a.textContent=T.author;paintTabs();if(typeof rbody!=="undefined"&&rbody){R.keys={};R.picks={};R.marks={};renderText();rbody.scrollTop=0;}}
function paintTabs(){var box=document.getElementById("rTabs");if(!box||!L.texts)return;box.innerHTML="";Object.keys(TEXTS).forEach(function(k){var b=el("button",{type:"button",class:"rtab"+(k===CURTEXT?" on":""),text:"《"+TEXTS[k].title+"》"});b.addEventListener("click",function(){if(k!==CURTEXT&&R.mode==="none")useText(k);});box.append(b);});}
function norm(s){return String(s).replace(/[\s，。！？；：、“”‘’"'（）()——…·,.!?;:]/g,"");}
var FULLN=norm(FULL);
function findQuoted(txt){var n=norm(txt);if(n.length<6)return null;for(var Lg=Math.min(n.length,30);Lg>=6;Lg--){for(var i=0;i+Lg<=n.length;i++){var w=n.slice(i,i+Lg);if(FULLN.indexOf(w)>=0){for(var k=0;k<SENT.length;k++){if(norm(SENT[k].t).indexOf(w)>=0)return k;}return -1;}}}return null;}
function findQuotedAll(txt){var out=[];String(txt).split(/[“”"「」『』\n]|[，。！？；：,.!?;:]/).forEach(function(ch){var k=findQuoted(ch);if(k!=null&&k>=0&&out.indexOf(k)<0)out.push(k);});var k0=findQuoted(txt);if(k0!=null&&k0>=0&&out.indexOf(k0)<0)out.push(k0);return out.sort(function(a,b){return a-b;});}
function joinSents(ids){return ids.slice().sort(function(a,b){return a-b;}).map(function(i){return SENT[i].t;}).join("");}

/* ================= 状态与路径 ================= */
var KEY="hora-"+L.id;
var S={day:1,beat:{},done:{},data:{},log:{},chats:[]};
try{var raw=localStorage.getItem(KEY);if(raw){var o=JSON.parse(raw);for(var k in o)S[k]=o[k];}}catch(e){}
function save(){S.savedAt=new Date().toISOString();try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}if(typeof BK!=="undefined"&&BK.mode==="sheet"&&BK.me)sync();}
function get(path,D){if(path==="buddy"&&!D&&typeof BUDDYNAME!=="undefined")return BUDDYNAME;var v=D||S.data;String(path).split(".").forEach(function(p){v=(v==null)?undefined:v[p];});return v;}
function set(path,val){var ps=String(path).split("."),o=S.data;for(var i=0;i<ps.length-1;i++){if(o[ps[i]]==null||typeof o[ps[i]]!=="object")o[ps[i]]={};o=o[ps[i]];}o[ps[ps.length-1]]=val;}
function del(path){var ps=String(path).split("."),o=S.data;for(var i=0;i<ps.length-1;i++){o=o&&o[ps[i]];}if(o)delete o[ps[ps.length-1]];}
var TPL={};
/* 录音用的“中性版”：去掉名字等占位（有备用词就用备用词），清掉多余的标点 */
function voiceText(t){return String(t).replace(/\{buddy(?:\|[^}]*)?\}/g,function(){return typeof BUDDYNAME!=="undefined"?BUDDYNAME:"清弦";}).replace(/\{([\w.]+)(?:\|([^}]*))?\}/g,function(m,p,fb){return fb||"";}).replace(/^[，、,\s]+/,"").replace(/([，。！？])[，、\s]+/g,"$1").replace(/\s{2,}/g," ").trim();}
function fill(str,extra){var out=String(str==null?"":str).replace(/\{([\w.]+)(?:\|([^}]*))?\}/g,function(m,p,fb){var v=extra&&extra[p]!=null?extra[p]:get(p);if(Array.isArray(v))v=v.filter(Boolean).join("；");v=(v==null?"":String(v)).trim();return v||(fb||"");});out=out.replace(/^[，、,\s]+/,"");if(/\{/.test(String(str)))TPL[out]=String(str);return out;}

/* ---- 学情 ---- */
var OBS={},OBSORDER=[];
function regObs(step,day){var o=step.obs;if(!o||OBS[o.id])return;var ml={};(step.misses||[]).forEach(function(m){if(m.id)ml[m.id]=m.label||m.text;});if(step.requireEnd)ml.noEnd=step.requireEnd.label||"没有按要求收尾";if(step.fallback)ml.other="点了其他不相关的句子";if(step.t==="layering"){ml.few="层分得太少";ml.many="层分得太密";ml.keyOut="关键句不在这一层";}if(step.t==="ask"){ml.h0="第一次没说对";ml.h1="提示后还没说对";ml.h2="要看选项";(step.choices||[]).forEach(function(c,i){if(!c.ok)ml["c"+i]="选了“"+String(c.text).slice(0,30)+"”";});}if(step.options&&step.t==="mc")step.options.forEach(function(op,i){if(op.ok!==true&&!ml["o"+i])ml["o"+i]="选了“"+String(op.text||"").replace(/\{[a-z]+\}/g,"…").slice(0,40)+"”";});OBS[o.id]={id:o.id,label:o.label,skill:o.skill||"",day:day,misses:ml,kind:step.t,stance:!!step.stance,q:String(step.q||"").replace(/\{[^}|]*\|([^}]*)\}/g,"$1").replace(/\{[^}]*\}/g,"…").slice(0,80)};OBSORDER.push(o.id);}
function logStep(obs,patch){if(!obs)return;if(patch&&patch.answer!=null&&S.data._dr&&typeof task!=="undefined"){try{delete S.data._dr[draftSig()];}catch(e){}}var r=S.log[obs.id]||{tries:0,misses:{}};if(patch.try)r.tries++;if(patch.miss){r.misses[patch.miss]=(r.misses[patch.miss]||0)+1;}if(patch.answer!=null){r.answer=patch.answer;r.at=new Date().toISOString();}if(patch.ai!=null)r.ai=patch.ai;S.log[obs.id]=r;}

/* ---- 作答存哪里：BK（后台）有三种
   sheet：老师的 Google 表格（网站版，学生不用任何账号，用“班级码＋名字＋4位数字”进入）
   claude：claude.ai 页面自带的数据库（学生要有 Claude 账号）
   local：哪里都不存，只在这台设备上 ---- */
var SITE=window.HORA_SITE||{};
var RESTORED=false,DB=null,UID=null,syncOK=null,writing=false,pending=false,CANEDIT=false;
function payload(){return {name:S.data.name||"",data:S.data,log:S.log,done:S.done,day:S.day,beat:S.beat,reach:S.reach||{},savedAt:S.savedAt||"",chats:(S.chats||[]).slice(-30),updatedAt:new Date().toISOString()};}
function mergeRemote(r){if(r&&r.savedAt&&(!S.savedAt||r.savedAt>S.savedAt)){["data","log","done","beat","reach","chats"].forEach(function(k){if(r[k]!=null)S[k]=r[k];});if(r.day)S.day=r.day;try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}return true;}return false;}
var BK={mode:SITE.sheetUrl?"sheet":"claude",me:null,tpw:null};
function online(){return BK.mode==="sheet"?!!BK.me:!!(DB&&UID);}
/* 表格后台：一律用 POST、正文是 JSON 文本（不设 Content-Type，浏览器就不会先发预检请求） */
function api(action,body){return fetch(SITE.sheetUrl,{method:"POST",body:JSON.stringify(Object.assign({action:action,lesson:L.id,lessonTitle:L.title},body||{}))}).then(function(r){return r.json();}).then(function(j){if(!j||!j.ok){var e=new Error((j&&j.err)||"server");e.code=(j&&j.err)||"server";throw e;}return j;});}
function cred(){var m=BK.me||{};return {cls:m.cls,name:m.name,pin:m.pin};}
var saveT=null,dirty=false,saveSt=null;
function setSaveSt(t,bad){if(!saveSt){saveSt=el("span",{class:"savest",id:"saveSt"});$(".tools").prepend(saveSt);}saveSt.textContent=t;saveSt.classList.toggle("bad",!!bad);}
function sync(){
  if(BK.mode==="sheet"){if(!BK.me)return;dirty=true;SV++;clearTimeout(saveT);saveT=setTimeout(sheetSave,2500);return;}
  if(!DB||!UID||syncOK===false)return;if(writing){pending=true;return;}writing=true;DB.doc("answers/"+UID).set(JSON.parse(JSON.stringify(payload()))).then(function(){syncOK=true;}).catch(function(e){if(e&&e.code==="invalid_argument")syncOK=false;}).then(function(){writing=false;if(pending){pending=false;sync();}});}
/* 存表格：同一时间只发一个请求；发送期间又有改动，回来后再存一次（全班同时用时不挤） */
var SV=0,INFL=false;
function sheetSave(){if(INFL||!BK.me)return;INFL=true;var v=SV,p=JSON.parse(JSON.stringify(payload()));setSaveSt("保存中…");
  api("save",Object.assign(cred(),{payload:p,summary:studentText(p),progress:progressText(p)})).then(function(){INFL=false;if(SV===v){dirty=false;setSaveSt("已保存");}else sheetSave();})
    .catch(function(e){INFL=false;setSaveSt(e.code==="pin"||e.code==="roster"?"没保存：请重新签到":"没连上，稍后自动再存",true);setTimeout(function(){if(dirty)sheetSave();},15000);});}
function commit(){save();sync();}
/* 随时保存：作答框里每打几个字就存一份草稿（存本机，同时存表格）；换页、关页、切到别的应用时立刻存一次。
   草稿按“第几天｜第几个环节｜题目｜第几个框”记；回到这道题时，空着的框自动填回草稿。 */
var DRT=null;
function draftFields(){return [].filter.call(task.querySelectorAll("textarea,input[type=text],input:not([type])"),function(f){return !f.disabled&&f.offsetParent!==null;});}
function draftSig(){var qe=task.querySelector(".task-q");return S.day+"|"+((S.beat||{})[S.day]||0)+"|"+(qe?qe.textContent.slice(0,60):"");}
task.addEventListener("input",function(e){var f=e.target;if(!f||!/^(TEXTAREA|INPUT)$/.test(f.tagName)||(f.type&&!/^(text|search)$/.test(f.type)))return;
  var fs=draftFields(),i=fs.indexOf(f);if(i<0)return;var dr=S.data._dr||(S.data._dr={}),k=draftSig(),o=dr[k]||(dr[k]={v:[]});o.v[i]=f.value;o.q=k.split("|").slice(2).join("|");o.at=new Date().toISOString();
  clearTimeout(DRT);DRT=setTimeout(save,700);});
new MutationObserver(function(){var dr=S.data&&S.data._dr;if(!dr)return;var o=dr[draftSig()];if(!o||!o.v)return;draftFields().forEach(function(f,i){if(!f.value&&o.v[i]&&!f.dataset.drOk){f.dataset.drOk=1;f.value=o.v[i];try{f.dispatchEvent(new Event("input",{bubbles:true}));}catch(e){}}});}).observe(task,{childList:true,subtree:true});
function flushSave(){
  if(BK.mode!=="sheet"||!BK.me||!dirty)return;clearTimeout(saveT);var p=JSON.parse(JSON.stringify(payload()));var body=JSON.stringify(Object.assign({action:"save",lesson:L.id,lessonTitle:L.title},cred(),{payload:p,summary:studentText(p),progress:progressText(p)}));
  try{fetch(SITE.sheetUrl,{method:"POST",body:body,keepalive:body.length<60000}).catch(function(){});}catch(e){}}
document.addEventListener("visibilitychange",function(){if(document.visibilityState==="hidden"){if(DRT){clearTimeout(DRT);save();}flushSave();}});
addEventListener("pagehide",function(){if(DRT){clearTimeout(DRT);save();}flushSave();});
var leaving=false;
function leaveTo(url){leaving=true;if(BK.mode!=="sheet"||!dirty||!BK.me){location.href=url;return;}clearTimeout(saveT);setSaveSt("保存中…");var done=false;function go(){if(!done){done=true;location.href=url;}}
  var p=JSON.parse(JSON.stringify(payload()));api("save",Object.assign(cred(),{payload:p,summary:studentText(p),progress:progressText(p)})).then(function(){dirty=false;go();}).catch(go);setTimeout(go,4000);}
addEventListener("beforeunload",function(e){if(BK.mode==="sheet"&&dirty&&!leaving){e.preventDefault();e.returnValue="";}});
BK.share=function(key,items){if(BK.mode==="sheet"){if(BK.me)api("share",Object.assign(cred(),{key:key,items:items})).catch(function(){});return;}if(DB&&UID)DB.doc("shares/"+UID).set({key:key,items:items,at:new Date().toISOString()}).catch(function(){});};
BK.gallery=function(key,maxReal){
  if(BK.mode==="sheet"){if(!BK.me)return Promise.resolve({real:[],got:[]});return api("gallery",Object.assign(cred(),{key:key})).then(function(j){return {real:shuffle(j.shares||[]).slice(0,maxReal),got:j.got||[]};}).catch(function(){return {real:[],got:[]};});}
  if(!DB||!UID)return Promise.resolve({real:[],got:[]});
  return Promise.all([DB.collection("shares").get().catch(function(){return null;}),DB.collection("replies").get().catch(function(){return null;})]).then(function(r){
    var real=[],got=[];if(r[0])r[0].docs.forEach(function(d){if(d.id===UID)return;var v=d.data();if(v&&v.key===key&&v.items&&v.items.length)real.push({id:d.id,items:v.items});});
    if(r[1])r[1].docs.forEach(function(d){if(d.id===UID)return;((d.data()||{}).items||[]).forEach(function(it){if(it.to===UID&&it.key===key)got.push(it.text);});});
    return {real:shuffle(real).slice(0,maxReal),got:got};});};
BK.reply=function(to,key,text,all){if(BK.mode==="sheet"){if(BK.me)api("reply",Object.assign(cred(),{key:key,to:to,text:text})).catch(function(){});return;}if(DB&&UID)DB.doc("replies/"+UID).set({items:all}).catch(function(){});};
BK.teacherLoad=function(){if(BK.mode==="sheet")return api("t_all",{pw:BK.tpw}).then(function(j){var sh={};tHw={};(j.hw||[]).forEach(function(h){tHw[h.sid+"|"+h.day]=h;});var docs=(j.rows||[]).map(function(r){var v=r.payload||{};v._id=r.sid;v.name=v.name||r.name;v._cls=r.cls;if(r.shared)sh[r.sid]=1;return v;});return {docs:docs,shares:sh};});
  return Promise.resolve(null);};
BK.teacherHide=function(id){if(BK.mode==="sheet")return api("t_hide",{pw:BK.tpw,sid:id});return DB.doc("shares/"+id).delete();};
var SAMPLE=null,sampleP=null;
function getSample(){if(!sampleP)sampleP=BK.mode!=="sheet"&&window.claude&&window.claude.use?Promise.resolve(window.claude.use("sample")).then(function(s){SAMPLE=s;return s;},function(){return null;}):Promise.resolve(null);return sampleP;}
getSample().then(function(s){if(s&&C.chat!==false)bChat.hidden=false;});
(function boot(){if(BK.mode==="sheet"||!window.claude||!window.claude.use)return;Promise.all([window.claude.use("db"),window.claude.use("user")]).then(function(r){DB=r[0];var U=r[1];if(!U)return null;return Promise.resolve(U.id()).then(function(id){UID=id;if(!DB||!UID)return U.canEdit?U.canEdit():false;
      /* 换了设备：先取回这个账号存在老师那边的进度和作答，比本机新就用它，再开始同步 */
      return DB.doc("answers/"+UID).get().then(function(snap){var r=snap&&snap.exists?snap.data():null;if(mergeRemote(r))RESTORED=true;
      }).catch(function(){}).then(function(){sync();if(RESTORED)restart();return U.canEdit?U.canEdit():false;});});}).then(function(edit){if(edit){CANEDIT=true;$("#bTMode").hidden=false;if(DB)$("#bTeacher").hidden=false;}}).catch(function(){});})();

/* ================= 原文栏 ================= */
var rbody=$("#rbody"),reader=$("#reader"),rmode=$("#rmode");
var R={mode:"none",onPick:null,onCut:null,onMark:null,marks:{},picks:{},keys:{},cuts:{}};
function renderText(){rbody.innerHTML="";
  PARAS.forEach(function(p,pi){var pe=el("p",{class:CENTER[pi]?"center":"","data-p":String(pi)});
    PSENT[pi].forEach(function(id){var t=SENT[id].t,sp=el("span",{class:"s","data-id":String(id),tabindex:"-1"});var i=0;
      while(i<t.length){var hit=null;for(var g=0;g<GKEYS.length;g++){if(t.substr(i,GKEYS[g].length)===GKEYS[g]){hit=GKEYS[g];break;}}
        if(hit){sp.append(el("span",{class:"g","data-g":hit,text:hit}));i+=hit.length;}else{sp.append(document.createTextNode(t[i]));i++;}}
      sp.normalize();pe.append(sp);});
    rbody.append(pe);
    if(pi<PARAS.length-1){var gp=el("span",{class:"gap","data-after":String(pi)});gp.append(el("button",{type:"button","aria-label":"在第"+(pi+1)+"段后面分层"},["在这里分层"]));rbody.append(gp);}});
  var src=(TEXTS[CURTEXT]||{}).source;if(src)rbody.append(el("p",{class:"src",text:src}));paintMarks();}
function paintMarks(){$$(".s",rbody).forEach(function(s){var id=s.getAttribute("data-id");s.classList.toggle("hl-mark",!!R.marks[id]);s.classList.toggle("hl-pick",!!R.picks[id]);s.classList.toggle("hl-key",!!R.keys[id]);});$$(".gap",rbody).forEach(function(g){g.classList.toggle("on",!!R.cuts[g.getAttribute("data-after")]);});}
function setMode(m,label){R.mode=m;if(m==="pick"||m==="mark"||m==="cut")unmaskParas();reader.classList.toggle("picking",m==="pick"||m==="mark");reader.classList.toggle("cutting",m==="cut");rmode.hidden=!label;rmode.className="rmode"+(m==="mark"?" mark":m==="cut"?" cut":"");rmode.textContent=label||"";if(label&&isNarrow())openReader();}
function flashSent(id){var s=$('.s[data-id="'+id+'"]',rbody);if(!s)return;s.scrollIntoView({block:"center",behavior:reduce?"auto":"smooth"});s.classList.remove("flash");void s.offsetWidth;s.classList.add("flash");}
var gpop=null;function closePop(){if(gpop){gpop.remove();gpop=null;}}
rbody.addEventListener("click",function(e){
  var gapb=e.target.closest(".gap button");if(gapb&&R.mode==="cut"){var a=gapb.parentNode.getAttribute("data-after");if(R.cuts[a])delete R.cuts[a];else R.cuts[a]=1;paintMarks();if(R.onCut)R.onCut();return;}
  var s=e.target.closest(".s");
  if((R.mode==="pick"||R.mode==="mark")&&s){var id=+s.getAttribute("data-id");if(R.mode==="mark"){if(R.marks[id])delete R.marks[id];else R.marks[id]=1;paintMarks();if(R.onMark)R.onMark();}else if(R.onPick){R.onPick(id);}return;}
  var g=e.target.closest(".g");if(g){closePop();var w=g.getAttribute("data-g");var r1=rbody.getBoundingClientRect(),r2=g.getBoundingClientRect();gpop=el("div",{class:"gpop"},[el("b",{text:w}),GLOSS[w],el("button",{type:"button","aria-label":"关上",text:"×"})]);gpop.style.left=clamp(r2.left-r1.left,8,Math.max(8,r1.width-300))+"px";gpop.style.top=(r2.bottom-r1.top+rbody.scrollTop+6)+"px";rbody.style.position="relative";rbody.append(gpop);gpop.querySelector("button").addEventListener("click",function(ev){ev.stopPropagation();closePop();});return;}
  closePop();});
function isNarrow(){return matchMedia("(max-width:860px)").matches;}
function openReader(){reader.classList.add("open");}
function closeReaderIfNarrow(){if(isNarrow())reader.classList.remove("open");}
$("#bText").addEventListener("click",openReader);$("#bClose").addEventListener("click",function(){reader.classList.remove("open");});

/* ================= 人物（印章式头像，与《岳阳楼记》同款） ================= */
var CV={},SPEAKER=null,TALK=false,NOD={};
function tok2(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim();}
var COL={};function readCols(){COL={page:tok2("--page")||"#fbf8f1",page2:tok2("--page2")||"#f1ebdf",bg:tok2("--bg")||"#ebe5d8",ink:tok2("--ink")||"#1f1b17",muted:tok2("--muted")||"#6f675b",line:tok2("--line")||"#ddd4c3"};}readCols();
if(window.matchMedia)matchMedia("(prefers-color-scheme: dark)").addEventListener("change",readCols);
new MutationObserver(readCols).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});
function inkOf(w){var c=PEOPLE[w].ink;if(c.indexOf("--")===0){var v=tok2(c);return v||"#25211b";}return c;}
function nameOf(w){var p=PEOPLE[w];return w==="me"?(S.data.name||p.name):p.name;}
function chOf(w){var p=PEOPLE[w];if(w!=="me")return p.glyph||p.ch||"";var n=(S.data.name||"").trim();if(!n)return p.glyph||p.ch;var cj=n.match(/[\u3400-\u9fff]/g);return cj?cj[cj.length-1]:n.charAt(0).toUpperCase();}
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();}
/* 人物有两种画法：shape:"seal" 圆形（毛笔字＋两字朱印，同《岳阳楼记》）；shape:"torn" 一张撕下来的旧日历页。
   人物配置里给了 img（图片路径）时，直接画图片。说话的那个会轻轻动。 */
var IMGS={};function imgOf(src){if(!IMGS[src]){var im=new Image();im.src=src;IMGS[src]=im;}var m=IMGS[src];return m.complete&&m.naturalWidth?m:null;}
function hexA(h,a){h=String(h).replace("#","");if(h.length===3)h=h.split("").map(function(c){return c+c;}).join("");var n=parseInt(h,16);if(isNaN(n))return "rgba(0,0,0,"+a+")";return "rgba("+(n>>16&255)+","+(n>>8&255)+","+(n&255)+","+a+")";}
var TORN=null;function tornShape(){if(TORN)return TORN;var r=[],x=0;while(x<1){r.push([x,.02+Math.random()*.05]);x+=.03+Math.random()*.05;}r.push([1,.03]);TORN=r;return r;}
function drawActor(cv,who){var c=cv.getContext("2d"),W=cv.width,H=cv.height,P=PEOPLE[who],t=performance.now()/1000,ink=inkOf(who);c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,W,H);
  var talking=SPEAKER===who&&TALK&&!reduce,nod=NOD[who]||-9,bump=reduce?0:Math.max(0,1-(t-nod)*1.8)*Math.sin((t-nod)*10)*5,br=reduce?0:Math.sin(t*1.6+who.length)*1.4;
  if(P.img){var im=imgOf(P.img);if(im){c.save();c.translate(W/2,H/2+bump);c.rotate(-.05+(talking?Math.sin(t*4.5)*.03:0));var sc=Math.min(W/im.naturalWidth,H/im.naturalHeight)*.86;var iw=im.naturalWidth*sc,ih=im.naturalHeight*sc;c.drawImage(im,-iw/2,-ih/2,iw,ih);
    /* 图上叠字（图本身不带字，文字由代码印上去，保证准确） */
    if(P.glyph){c.textAlign="center";c.textBaseline="middle";c.globalAlpha=.88;c.fillStyle="#1f1b17";c.font="900 "+Math.round(ih*.36)+"px 'Noto Serif SC',serif";c.fillText(P.glyph,0,ih*.05);
      if(P.top){c.fillStyle="#a8352a";c.font="700 "+Math.round(ih*.075)+"px 'Noto Serif SC',serif";c.fillText(P.top,0,-ih*.3);}c.globalAlpha=1;}
    if(talking){c.fillStyle=ink;for(var k3=0;k3<3;k3++){c.globalAlpha=.3+.7*Math.max(0,Math.sin(t*6-k3*.9));c.beginPath();c.arc((k3-1)*W*.06,ih/2+H*.04,W*.013,0,7);c.fill();}c.globalAlpha=1;}
    c.restore();return;}}
  if(P.shape==="torn"){var w=W*.6,h=H*.8,x0=-w/2,y0=-h/2;c.save();c.translate(W/2,H/2+4+bump);c.rotate(-.06+(talking?Math.sin(t*4.5)*.03:0));
    c.beginPath();var tp=tornShape();c.moveTo(x0,y0+h*tp[0][1]);tp.forEach(function(p){c.lineTo(x0+w*p[0],y0+h*p[1]);});c.lineTo(x0+w,y0+h-h*.16);c.lineTo(x0+w-w*.2,y0+h);c.lineTo(x0+6,y0+h);c.quadraticCurveTo(x0,y0+h,x0,y0+h-6);c.closePath();
    c.save();c.shadowColor="rgba(50,35,15,.35)";c.shadowBlur=12;c.shadowOffsetY=5;c.fillStyle="#efe4cc";c.fill();c.restore();
    c.save();c.clip();var g=c.createRadialGradient(x0+w*.3,y0+h*.25,2,x0+w*.4,y0+h*.4,w*.95);g.addColorStop(0,"rgba(255,250,236,.55)");g.addColorStop(1,"rgba(120,92,52,.32)");c.fillStyle=g;c.fillRect(x0,y0,w,h);
      c.fillStyle="rgba(110,84,48,.13)";[[.75,.7,.22],[.2,.82,.14],[.62,.18,.1]].forEach(function(d){c.beginPath();c.ellipse(x0+w*d[0],y0+h*d[1],w*d[2],w*d[2]*.7,.4,0,7);c.fill();});
      c.strokeStyle="rgba(178,58,44,.75)";c.lineWidth=W*.008;c.beginPath();c.moveTo(x0+w*.12,y0+h*.24);c.lineTo(x0+w*.88,y0+h*.24);c.stroke();
      c.fillStyle="rgba(150,50,38,.85)";c.font="700 "+Math.round(W*.05)+"px 'Noto Serif SC',serif";c.textAlign="center";c.textBaseline="middle";c.fillText(P.top||"",0,y0+h*.17);
      c.fillStyle="rgba(28,24,20,.86)";c.font="900 "+Math.round(W*.27)+"px 'Noto Serif SC',serif";c.fillText(P.glyph||"",0,y0+h*.55);
      c.fillStyle="rgba(150,50,38,.7)";c.font="500 "+Math.round(W*.045)+"px 'Noto Serif SC',serif";c.fillText(P.foot||"",0,y0+h*.83);
      c.strokeStyle="rgba(90,70,40,.18)";c.lineWidth=1;c.beginPath();c.moveTo(x0+w*.05,y0+h*.62);c.lineTo(x0+w,y0+h*.48);c.stroke();
    c.restore();
    c.fillStyle="#dccba8";c.beginPath();c.moveTo(x0+w,y0+h-h*.16);c.lineTo(x0+w-w*.2,y0+h);c.lineTo(x0+w-w*.17,y0+h-h*.14);c.closePath();c.fill();
    c.restore();
    if(talking){c.fillStyle=ink;for(var k=0;k<3;k++){c.globalAlpha=.3+.7*Math.max(0,Math.sin(t*6-k*.9));c.beginPath();c.arc(W/2+(k-1)*W*.06,H*.97,W*.013,0,7);c.fill();}c.globalAlpha=1;}
    return;}
  /* 圆形 */
  c.translate(W/2,H/2+bump);var Rr=Math.min(W,H)/2-8;
  var g2=c.createRadialGradient(0,0,Rr*.2,0,0,Rr);g2.addColorStop(0,COL.page);g2.addColorStop(.78,COL.page2);g2.addColorStop(1,hexA(COL.page2,0));c.fillStyle=g2;c.beginPath();c.arc(0,0,Rr,0,7);c.fill();
  var rot=reduce?0:t*.25+who.length;for(var k2=0;k2<3;k2++){c.strokeStyle=hexA(ink,.6-k2*.15);c.lineWidth=Rr*(.07-k2*.018);c.beginPath();c.arc(0,0,Rr*.83+k2*Rr*.045+br,rot+k2*1.9,rot+k2*1.9+4.4);c.stroke();}
  if(talking){for(var q2=0;q2<2;q2++){var q=(t*1.8+q2/2)%1;c.strokeStyle=hexA(ink,.5*(1-q));c.lineWidth=2;c.beginPath();c.arc(0,0,Rr*.86+q*Rr*.14,0,7);c.stroke();}}
  var gl=chOf(who);c.fillStyle=ink;c.font="700 "+Math.round(Rr*(gl.length>1?.7:.95))+"px 'Noto Serif SC',serif";c.textAlign="center";c.textBaseline="middle";c.fillText(gl,0,Rr*.04+br*.5);
  if(P.seal){var sz=Rr*.34;c.fillStyle="#b23a2c";c.fillRect(Rr*.36,Rr*.4,sz,sz);c.fillStyle="#f6ead8";c.font="700 "+(sz*.42)+"px 'Noto Serif SC',serif";c.fillText(P.seal.slice(0,1),Rr*.36+sz/2,Rr*.4+sz*.3);c.fillText(P.seal.slice(1,2),Rr*.36+sz/2,Rr*.4+sz*.74);}}
/* 立绘（纸娃娃）：人物配置里写 sprite:"me"（我＝学生在换装间选的样子）或 sprite:"buddy"（伴学＝学生选的清弦或长歌）。
   图在网站根目录 chars/：{发型}_outfit_{衣服}.webp 是身体，{发型}_{衣服}_face_{表情}.webp 是只有眼睛和嘴的表情补丁（每套衣服一份，tools/mask_face_patches.py 生成），叠在身体上。
   说话时嘴在 talk 补丁和底模之间切换；隔几秒眨一次眼；“我”在作答时换成思考的表情。
   两种摆法，按页面空白自动切换：任务下面空白多，人物在右下角站成半身或全身的大图；空白少，就在底栏里把头像圈在圆里。
   课文配置可写 L.outfit（如 "ancient"）让“我”和伴学这一课都穿这套。 */
var CHARS=(SITE.home||"")+"chars/",SPR={},FIGS=null,FIGMODE="";
var FACES={qingxian:{blink:1,talk:1,think:1,idle:1},changge:{blink:1,talk:1,think:1,smile:1},g1:{blink:1,talk:1,think:1,idle:1},b1:{blink:1,talk:1,think:1,smile:1}};
var HAIRS=["g1","g2","g3","g4","b1","b2","b3","b4"],OUTFITS=["daily","sport","formal","ancient"];
var BUDDIES={qingxian:{name:"清弦",voice:"k1"},changge:{name:"长歌",voice:"k2"}};
/* 头像圈：每个人头的中心（原图坐标），圈的直径对应原图 316 像素，头正好在圈中间 */
var HEAD={qingxian:[488,346],changge:[493,214],g:[480,318],b:[470,214]};
function lsGet(k){try{return JSON.parse(localStorage.getItem(k)||"null");}catch(e){return null;}}
function myLook(){var a=lsGet("hora-avatar")||{};return {hair:HAIRS.indexOf(a.hair)>=0?a.hair:"g1",outfit:OUTFITS.indexOf(a.outfit)>=0?a.outfit:"daily"};}
function myBuddy(){var b=lsGet("hora-buddy")||{};return {who:BUDDIES[b.who]?b.who:"qingxian",outfit:OUTFITS.indexOf(b.outfit)>=0?b.outfit:"daily"};}
var BUDDYNAME=BUDDIES[myBuddy().who].name;
/* 伴学的名字、声音跟着学生选的伴学；“我”的声音跟着学生选的样子（女生 g / 男生 b） */
for(var pw in PEOPLE){var pp=PEOPLE[pw];
  if(pp.sprite==="buddy"){pp.name=BUDDYNAME;if(pp.voicesBy)pp.voices=pp.voicesBy[myBuddy().who]||[];pp.voice=Object.assign({},pp.voice,{gender:myBuddy().who==="changge"?"male":"female",pitch:myBuddy().who==="changge"?.9:1.15});}
  if(pp.sprite==="me"&&pp.voicesBy){var mg=myLook().hair.charAt(0);pp.voices=pp.voicesBy[mg]||[];pp.voice=Object.assign({},pp.voice,{gender:mg==="b"?"male":"female",pitch:mg==="b"?1.1:.95});pp.label=mg==="b"?"我（男）":"我（女）";}}
function spriteHair(w){var P=PEOPLE[w];return P.sprite==="me"?myLook().hair:P.sprite==="buddy"?myBuddy().who:P.sprite;}
function spriteOutfit(w){var P=PEOPLE[w];return L.outfit||P.outfit||(P.sprite==="me"?myLook().outfit:P.sprite==="buddy"?myBuddy().outfit:"daily");}
function spriteSrc(w,kind){return CHARS+spriteHair(w)+(kind?"_"+spriteOutfit(w)+"_face_"+kind:"_outfit_"+spriteOutfit(w))+".webp";}
/* 来客：小满（或别的配了 fig 的同学）说话时，借“我”的位置站出来；“我”开口、或别人连说两句，就换回“我”。
   fig:{a:平常图,b:认输图,head:[头中心x,y]}，图和立绘一样是 1024×1536 透明底。认输的话（好吧/行吧……）换 b。 */
var GUEST={who:"",pose:"a",quiet:0};
function guestFig(){return GUEST.who&&PEOPLE[GUEST.who]&&PEOPLE[GUEST.who].fig;}
function guestNote(who,txt){var P=PEOPLE[who];if(P&&P.fig){GUEST.who=who;GUEST.quiet=0;GUEST.pose=/^(好吧|行吧|行，)|你两边都说通了/.test(txt)?"b":"a";}else if(who==="me")GUEST.who="";else if(GUEST.who&&++GUEST.quiet>=2)GUEST.who="";}
function headPos(w,box){var h=spriteHair(w),gf=w==="me"&&guestFig(),c=gf?gf.head:HEAD[h]||HEAD[h.charAt(0)]||[480,300],sc=box/316;return {w:Math.round(1024*sc),l:Math.round(box/2-c[0]*sc),t:Math.round(box/2-c[1]*sc)};}
function applyHead(o,w){var box=o.circle.clientWidth||76,p=headPos(w,box);[o.cb,o.cf].forEach(function(im){im.style.width=p.w+"px";im.style.left=p.l+"px";im.style.top=p.t+"px";});}
function buildCast(){[["l",C.left],["r",C.right]].forEach(function(side){var host=$(".actors."+side[0]);side[1].forEach(function(w){var P=PEOPLE[w],spr=!!P.sprite;
  var d=el("button",{class:"actor"+(spr?" sprite":""),type:"button","data-who":w,"aria-label":w==="me"?"我":"和"+P.name+"聊一聊"});
  d.innerHTML=spr?'<span class="circ"><img class="cb" alt="" draggable="false"><img class="cf" alt="" hidden draggable="false"></span><span class="nm"></span>':'<canvas width="220" height="220" aria-hidden="true"></canvas><span class="nm"></span>';
  $(".nm",d).textContent=nameOf(w);host.append(d);
  if(spr){if(!FIGS){FIGS=el("div",{class:"figs",id:"figs","aria-hidden":"true"});document.body.append(FIGS);}
    var fig=el("div",{class:"fig","data-who":w});fig.innerHTML='<div class="fbox"><img class="fb" alt="" draggable="false"><img class="ff" alt="" hidden draggable="false"></div><span class="fnm"></span>';$(".fnm",fig).textContent=nameOf(w);FIGS.append(fig);
    
    var o={el:d,fig:fig,circle:$(".circ",d),cb:$(".cb",d),cf:$(".cf",d),fb:$(".fb",fig),ff:$(".ff",fig),cur:"",blinkAt:performance.now()/1000+2+Math.random()*3};SPR[w]=o;
    o.cb.onerror=function(){d.classList.remove("sprite");d.innerHTML='<canvas width="220" height="220" aria-hidden="true"></canvas><span class="nm"></span>';$(".nm",d).textContent=nameOf(w);CV[w]=$("canvas",d);fig.remove();delete SPR[w];};
    o.cb.src=o.fb.src=spriteSrc(w);applyHead(o,w);var ff=FACES[spriteHair(w)]||{};for(var fk in ff)loadFace(spriteSrc(w,fk));}
  else CV[w]=$("canvas",d);
  if(w!=="me")d.addEventListener("click",function(){if(!bChat.hidden&&!bChat.disabled)openChat(w);});});});
  if(FIGS){addEventListener("resize",layoutFigs);setInterval(layoutFigs,400);requestAnimationFrame(layoutFigs);}}
/* 摆法：量一下任务卡下面到底栏之间还有多高 */
function layoutFigs(){if(!FIGS)return;var work=$(".work"),cast=$("#cast"),task=$("#task");if(!work||!cast)return;
  var wr=work.getBoundingClientRect(),cr=cast.getBoundingClientRect(),bottom=($(".work .head")||work).getBoundingClientRect().bottom;
  /* 任务卡里所有看得见的内容的最下沿（藏起来的元素量出来是 0，不能只看最后一个） */
  [].forEach.call(document.querySelectorAll("#task *,#cal5 *"),function(e){var r=e.getBoundingClientRect();if(r.height>0&&r.bottom>bottom)bottom=r.bottom;});
  var free=cr.top-bottom-14,wide=innerWidth>860&&wr.width>=380,mode;
  /* 内容已经要往下滑才看得完：不放大图，只用头像圈，免得挡字 */
  if(work.scrollHeight>work.clientHeight+4)free=0;
  if(!wide||free<280)mode="circle";else if(free<320&&FIGMODE==="circle")mode="circle";else mode=free>=470?"full":"half";
  var h=Math.min(free,mode==="full"?600:420);
  /* 并排的几个人加起来不能比右栏宽，不然会伸到左边原文上 */
  var nf=0;for(var wk in SPR)nf++;nf=Math.max(1,nf);
  function capH(md){var RR=md==="full"?[20,30,1004,1530]:[130,20,880,900];return (wr.width-8)/(nf*.94*(RR[2]-RR[0])/(RR[3]-RR[1]));}
  if(mode==="full"&&capH("full")<Math.min(h,470)){mode="half";h=Math.min(free,420);}
  if(mode!=="circle"){h=Math.min(h,capH(mode));if(h<250)mode="circle";}
  if(mode!==FIGMODE){FIGMODE=mode;document.body.classList.toggle("figs-on",mode!=="circle");FIGS.className="figs "+mode;}
  if(mode==="circle"){for(var w in SPR)applyHead(SPR[w],w);return;}
  FIGS.style.right=Math.max(16,innerWidth-wr.right)+"px";var SINK=mode==="half"?Math.min(70,Math.round(h*.16)):14;FIGS.style.bottom=Math.round(innerHeight-cr.top-SINK)+"px";FIGS.style.setProperty("--sink",SINK+"px");FIGS.style.maxWidth=Math.round(wr.width)+"px";
  /* 全身：原图 x20–1004、y30–1530；半身：x130–880、y20–900（四周留出发光的位置） */
  var R=mode==="full"?[20,30,1004,1530]:[130,20,880,900],sc=h/(R[3]-R[1]),bw=Math.round((R[2]-R[0])*sc);
  for(var w2 in SPR){var o=SPR[w2];o.fig.querySelector(".fbox").style.cssText="width:"+bw+"px;height:"+Math.round(h)+"px";[o.fb,o.ff].forEach(function(im){im.style.width=Math.round(1024*sc)+"px";im.style.left=Math.round(-R[0]*sc)+"px";im.style.top=Math.round(-R[1]*sc)+"px";});}}
function spriteFrame(t){var thinking=!SPEAKER&&!!document.querySelector("#task input:not([type=checkbox]):not([type=radio]),#task textarea");
  var gf=guestFig();
  for(var w in SPR){var o=SPR[w],f=FACES[spriteHair(w)]||{},on=SPEAKER===w,want="",talking=on&&(TALK||VOICE.busy())&&!reduce;
    if(w==="me"){var base=gf?gf[GUEST.pose]||gf.a:spriteSrc(w);if(o.base!==base){if(!o.base||!gf||imgOf(base)){o.base=base;o.cb.src=o.fb.src=base;applyHead(o,w);var nm=gf?PEOPLE[GUEST.who].short||nameOf(GUEST.who):nameOf("me");$(".nm",o.el).textContent=nm;$(".fnm",o.fig).textContent=nm;o.cur="?";o.el.classList.toggle("guest",!!gf);o.fig.classList.toggle("guest",!!gf);}}
      if(gf){on=SPEAKER===GUEST.who;talking=on&&(TALK||VOICE.busy())&&!reduce;o.el.classList.toggle("on",on);o.fig.classList.toggle("on",on);o.fig.classList.toggle("talking",talking);if(o.cur!==""){o.cur="";o.cf.hidden=o.ff.hidden=true;}continue;}}
    o.el.classList.toggle("on",on);o.fig.classList.toggle("on",on);o.fig.classList.toggle("talking",talking&&!f.talk);
    /* 不说话时：闭嘴微笑（有 idle 补丁的用 idle；长歌、B1 的底模本身就是闭嘴的）＋眨眼 */
    var rest=f.idle?"idle":"";
    if(talking&&f.talk)want=Math.floor(t*6.5)%2?"talk":rest;
    else if(f.blink&&t>o.blinkAt){want="blink";if(t>o.blinkAt+.14)o.blinkAt=t+2.5+Math.random()*3.5;}
    else if(w==="me"&&thinking&&f.think)want="think";
    else want=rest;
    if(want!==o.cur){o.cur=want;var src=want?spriteSrc(w,want):"";if(!src||FACEOK[src])[o.cf,o.ff].forEach(function(im){if(src){im.src=src;im.hidden=false;}else im.hidden=true;});else{loadFace(src);o.cur="";}}}}
/* 表情图先预加载，加载好之前不换（避免闪出别的五官） */
var FACEOK={},FACEING={};function loadFace(src){if(FACEING[src])return;FACEING[src]=1;var im=new Image();im.onload=function(){FACEOK[src]=1;};im.src=src;}
/* 换装间在首页（所有课文共用）；没有首页（claude.ai 版）时就地提示 */
function goWardrobe(){if(guestFig())return;if(HOME){try{sessionStorage.setItem("hora-return",location.pathname+location.search);}catch(e){}leaveTo(HOME+"#wardrobe");}}
buildCast();
function castLoop(){for(var w in CV){var on=SPEAKER===w;CV[w].parentElement.classList.toggle("on",on);drawActor(CV[w],w);}spriteFrame(performance.now()/1000);requestAnimationFrame(castLoop);}
requestAnimationFrame(castLoop);
function refreshMe(){var b=$('.actor[data-who="me"] .nm');if(b)b.textContent=nameOf("me");var f=$('.fig[data-who="me"] .fnm');if(f)f.textContent=nameOf("me");}

/* ================= 声音：背景声与配音（照《岳阳楼记》的做法：现场合成，说话时背景压低） ================= */
var PREF={snd:true,voice:true};try{var pr=JSON.parse(localStorage.getItem("hora-prefs")||"{}");for(var pk in pr)PREF[pk]=pr[pk];}catch(e){}
function savePref(){try{localStorage.setItem("hora-prefs",JSON.stringify(PREF));}catch(e){}}
var SOUND=(function(){var cfg=L.sound||{},ctx=null,master,rev,on=false,mood=cfg.mood||"calm",timer=null,tickT=null,ducked=false,tickOn=0,musicOn=1,tk=0;var VOL=cfg.vol||.5,DUCK=.16;var btnS=document.getElementById("bSnd");
  var NOTES=cfg.notes||[523.25,587.33,659.25,783.99,880,1046.5,1174.66,1318.5];
  function init(){ctx=new (window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);
    rev=ctx.createConvolver();var sr=ctx.sampleRate,ir=ctx.createBuffer(2,sr*2.4,sr);for(var c2=0;c2<2;c2++){var d=ir.getChannelData(c2);for(var i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,3);}rev.buffer=ir;var rg=ctx.createGain();rg.gain.value=.45;rev.connect(rg);rg.connect(master);}
  function bell(f,when,vel,len){len=len||2.2;[[1,1],[2.01,.28],[3.98,.08]].forEach(function(p){var o=ctx.createOscillator(),g=ctx.createGain();o.type="sine";o.frequency.value=f*p[0];g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(vel*p[1],when+.006);g.gain.exponentialRampToValueAtTime(.0001,when+len/p[0]);o.connect(g);g.connect(master);g.connect(rev);o.start(when);o.stop(when+len+.1);});}
  function click(when,f,vel){var sr=ctx.sampleRate,b=ctx.createBuffer(1,Math.floor(sr*.03),sr),d=b.getChannelData(0);for(var i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,6);var s2=ctx.createBufferSource();s2.buffer=b;var bp=ctx.createBiquadFilter();bp.type="bandpass";bp.frequency.value=f;bp.Q.value=6;var g=ctx.createGain();g.gain.value=vel;s2.connect(bp);bp.connect(g);g.connect(master);s2.start(when);}
  function rustle(when,len,vel){var sr=ctx.sampleRate,b=ctx.createBuffer(1,Math.floor(sr*len),sr),d=b.getChannelData(0);for(var i=0;i<d.length;i++){var e=Math.sin(Math.PI*i/d.length);d[i]=(Math.random()*2-1)*e*(.6+.4*Math.random());}var s2=ctx.createBufferSource();s2.buffer=b;var bp=ctx.createBiquadFilter();bp.type="bandpass";bp.Q.value=.9;bp.frequency.setValueAtTime(1800,when);bp.frequency.linearRampToValueAtTime(4200,when+len);var g=ctx.createGain();g.gain.value=vel;s2.connect(bp);bp.connect(g);g.connect(master);s2.start(when);}
  var idx=3;function phrase(){if(!on||!ctx)return;if(musicOn>0){var t=ctx.currentTime+.05,n=1+Math.floor(Math.random()*3);for(var k=0;k<n;k++){idx=Math.max(0,Math.min(NOTES.length-1,idx+[-2,-1,-1,1,1,2][Math.floor(Math.random()*6)]));bell(NOTES[idx],t+k*(.38+Math.random()*.3),.055*musicOn-k*.008);}if(Math.random()<.25)bell(NOTES[0]/2,t,.04*musicOn,3);}
    timer=setTimeout(phrase,3200+Math.random()*2600);}
  function tick(){if(!on||!ctx)return;if(tickOn>0){click(ctx.currentTime+.02,tk%2?2300:1700,.05*tickOn);tk++;}tickT=setTimeout(tick,1000);}
  function applyMood(){var m=(cfg.moods||{})[mood]||{music:1,tick:.5};musicOn=m.music;tickOn=m.tick;}
  function lvl(){return ducked?DUCK:VOL;}
  function setOn(v){on=v;PREF.snd=v;savePref();if(btnS)btnS.setAttribute("aria-pressed",String(v));
    if(v){if(!ctx)init();ctx.resume();master.gain.setTargetAtTime(lvl(),ctx.currentTime,.5);applyMood();clearTimeout(timer);clearTimeout(tickT);phrase();tick();}
    else if(ctx){master.gain.setTargetAtTime(0,ctx.currentTime,.3);clearTimeout(timer);clearTimeout(tickT);}}
  if(btnS){btnS.addEventListener("click",function(){setOn(!on);});btnS.setAttribute("aria-pressed",String(!!PREF.snd));}
  if(PREF.snd){var once=function(){removeEventListener("pointerdown",once,true);removeEventListener("keydown",once,true);if(!on)setOn(true);};addEventListener("pointerdown",once,true);addEventListener("keydown",once,true);}
  return{duck:function(v){ducked=!!v;if(on&&ctx)master.gain.setTargetAtTime(lvl(),ctx.currentTime,v?.08:.6);},
    mood:function(m){if(!m)return;mood=m;applyMood();},
    sfx:function(type){if(!on||!ctx)return;var t=ctx.currentTime+.01;
      if(type==="page")rustle(t,.28,.22);
      else if(type==="ok"){bell(NOTES[4],t,.09,1.6);bell(NOTES[6],t+.11,.08,1.8);}
      else if(type==="no"){var o=ctx.createOscillator(),g=ctx.createGain();o.frequency.setValueAtTime(220,t);o.frequency.exponentialRampToValueAtTime(140,t+.14);g.gain.setValueAtTime(.08,t);g.gain.exponentialRampToValueAtTime(.0001,t+.2);o.connect(g);g.connect(master);o.start(t);o.stop(t+.22);}}};})();
/* 配音：固定台词用预先录好的自然人声（voice/*.mp3，每个人物可选两种音色）；
   带名字、带学生作答的台词和 AI 的回复没法预录，用设备自带语音兜底。设置面板照《岳阳楼记》。 */
function vhash(w,v,t){var h=0x811c9dc5,s2=w+"|"+v+"|"+t;for(var i=0;i<s2.length;i++){h^=s2.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0;}return ("0000000"+h.toString(16)).slice(-8);}
var VOICE=(function(){var tts=!!(window.speechSynthesis&&window.SpeechSynthesisUtterance),voices=[],btnV=document.getElementById("bVoice"),CL=(window.LESSON_VOICE||{keys:{}}),cur=null,seq=0;
  var V=Object.assign({on:true,rate:1,pick:{},dev:{},fb:true,ai:false,me:false},PREF.v||{});PREF.v=V;
  function sv(){PREF.v=V;savePref();}
  var MALE=/kangkang|yunxi|yunyang|yunjian|yunfeng|yunhao|yunze|li-?mu|male|男/i,FEMALE=/xiaoxiao|xiaoyi|xiaohan|xiaomo|huihui|yaoyao|tingting|meijia|lili|female|女/i;
  function load(){if(!tts)return;voices=speechSynthesis.getVoices().filter(function(v){return /^zh/i.test(v.lang);}).sort(function(a,b){return ((/natural|online/i.test(b.name))-(/natural|online/i.test(a.name)))||((/CN/i.test(b.lang))-(/CN/i.test(a.lang)));});}
  if(tts){load();if(speechSynthesis.addEventListener)speechSynthesis.addEventListener("voiceschanged",load);else speechSynthesis.onvoiceschanged=load;}
  function rec(w){var p=PEOPLE[w];return p.voices||[];}
  function choice(w){var r=rec(w);if(!r.length)return null;var id=V.pick[w];for(var i=0;i<r.length;i++)if(r[i].id===id)return r[i];return r[0];}
  function devPick(w){var name=V.dev[w];for(var i=0;i<voices.length;i++)if(voices[i].name===name)return voices[i];var c=choice(w),g=(c&&c.gender)||(PEOPLE[w].voice||{}).gender,re=g==="male"?MALE:FEMALE;for(var j=0;j<voices.length;j++)if(re.test(voices[j].name)&&/CN/i.test(voices[j].lang))return voices[j];for(var k=0;k<voices.length;k++)if(re.test(voices[k].name))return voices[k];return voices[0]||null;}
  var FIX=[[/……|…/g,"，"],[/——/g,"，"],[/[“”「」‘’《》（）()]/g," "]];
  function stop(){seq++;if(cur){try{cur.pause();}catch(e){}cur=null;}if(tts)speechSynthesis.cancel();SOUND.duck(false);}
  function device(w,text){if(!tts)return;load();var v=devPick(w);var t=String(text);FIX.forEach(function(f){t=t.replace(f[0],f[1]);});var u=new SpeechSynthesisUtterance(t),c=PEOPLE[w].voice||{};u.lang="zh-CN";if(v){u.voice=v;u.lang=v.lang;}u.pitch=c.pitch||1;u.rate=(c.rate||1)*V.rate;var my=seq;u.onstart=function(){SOUND.duck(true);};u.onend=u.onerror=function(){if(my===seq)SOUND.duck(false);};setTimeout(function(){if(my===seq)try{speechSynthesis.speak(u);}catch(e){}},60);}
  function clip(w,text){var c=choice(w);if(!c)return null;var k=vhash(w,c.id,text);return CL.keys[k]?k:null;}
  function play(key,w,text,force){var my=seq,a=new Audio((CL.dir||"voice/")+key+".mp3");a.playbackRate=V.rate;try{a.preservesPitch=true;}catch(e){}cur=a;SOUND.duck(true);
    a.onended=function(){a._done=true;if(cur===a){cur=null;SOUND.duck(false);}};a.onerror=function(){a._done=true;if(my===seq){cur=null;SOUND.duck(false);if(V.fb||force)device(w,text);}};
    var p=a.play();if(p&&p.catch)p.catch(function(){a._done=true;if(my===seq){SOUND.duck(false);}});}
  function say(w,text,kind,force){stop();if(!text||!(V.on||force))return;if(w==="me"&&!V.me&&!force)return;
    if(kind==="ai"){if(V.ai||force)device(w,text);return;}
    var k=clip(w,text)||(TPL[text]?clip(w,voiceText(TPL[text])):null);if(k){play(k,w,text,force);return;}(window.HORA.voiceMiss=window.HORA.voiceMiss||[]).push(w+"："+text);if(V.fb||force)device(w,text);}
  /* 设置面板 */
  var panelEl=null;
  function openPanel(){if(panelEl&&!panelEl.hidden){panelEl.hidden=true;return;}if(!panelEl){panelEl=el("div",{class:"chat vpanel",role:"dialog","aria-label":"配音设置"});document.body.append(panelEl);}load();
    var who=Object.keys(PEOPLE).filter(function(w){return !PEOPLE[w].extra&&(w!=="me"||rec("me").length);});function lbl(w){return PEOPLE[w].label||PEOPLE[w].name;}
    var h='<div class="chat-h"><b>配音设置</b><span class="sp"></span><button type="button" class="dbtn" data-x>关上</button></div><div class="chat-b vb">'+
      '<label class="row"><input type="checkbox" id="vOn"'+(V.on?" checked":"")+'> <b>开启配音</b></label>'+
      '<label class="vrow"><span class="vn">语速</span><input type="range" min="0.8" max="1.25" step="0.05" value="'+V.rate+'" id="vRate" aria-label="语速"><span class="vv" id="vRateV"></span></label>'+
      who.map(function(w){var r=rec(w);return '<div class="vrow"><span class="vn">'+esc(lbl(w))+'</span>'+(r.length?'<span class="seg" role="group" aria-label="'+esc(lbl(w))+'的音色">'+r.map(function(c){return '<button type="button" data-w="'+w+'" data-v="'+c.id+'" aria-pressed="'+(choice(w).id===c.id)+'">'+esc(c.name)+'</button>';}).join("")+'</span>':'<span class="note">设备语音</span>')+'<button type="button" class="dbtn" data-t="'+w+'">试听</button></div>';}).join("")+
      '<details class="vmore"><summary>设备语音（读带名字的话、AI 的回复）</summary><p class="note">课文里的台词是提前录好的。带你名字、带你作答的台词，还有 AI 现场的回复，没法提前录，只能用这台设备自带的语音读，会生硬一些。</p>'+
      '<label class="row"><input type="checkbox" id="vFb"'+(V.fb?" checked":"")+'> 读带名字、带作答的台词</label>'+
      '<label class="row"><input type="checkbox" id="vAi"'+(V.ai?" checked":"")+'> 也读 AI 的回复</label>'+
      '<label class="row"><input type="checkbox" id="vMe"'+(V.me?" checked":"")+'> 也读“我”的话</label>'+
      (tts&&voices.length?who.concat(["me"]).map(function(w){var dv=devPick(w);return '<div class="vrow"><span class="vn">'+esc(nameOf(w))+'</span><select data-d="'+w+'" aria-label="'+esc(nameOf(w))+'的设备音色">'+voices.map(function(v){return '<option value="'+esc(v.name)+'"'+(dv===v?" selected":"")+'>'+esc(v.name.replace(/Microsoft |Google |\(.*?\)/g,"").trim())+'</option>';}).join("")+'</select><button type="button" class="dbtn" data-dt="'+w+'">试听</button></div>';}).join("")+'<p class="note">名字里带 Natural 或 Online 的音色最自然（比如 Edge 浏览器里的晓晓、云希）。</p>':'<p class="note">这台设备上没有找到中文语音。</p>')+
      '</details></div>';
    panelEl.innerHTML=h;panelEl.hidden=false;
    function rv(){$("#vRateV",panelEl).textContent=(+V.rate).toFixed(2)+"×";}rv();
    $("[data-x]",panelEl).addEventListener("click",function(){panelEl.hidden=true;});
    $("#vOn",panelEl).addEventListener("change",function(e){V.on=e.target.checked;sv();paintBtn();if(!V.on)stop();});
    $("#vRate",panelEl).addEventListener("input",function(e){V.rate=+e.target.value;sv();rv();if(cur)cur.playbackRate=V.rate;});
    $$("[data-v]",panelEl).forEach(function(b){b.addEventListener("click",function(){var w=b.getAttribute("data-w");V.pick[w]=b.getAttribute("data-v");sv();$$('[data-w="'+w+'"]',panelEl).forEach(function(x){x.setAttribute("aria-pressed",String(x===b));});say(w,fill(PEOPLE[w].sample||"你好。"),null,true);});});
    $$("[data-t]",panelEl).forEach(function(b){b.addEventListener("click",function(){var w=b.getAttribute("data-t");say(w,fill(PEOPLE[w].sample||"你好。"),null,true);});});
    ["Fb","Ai","Me"].forEach(function(k){var x=$("#v"+k,panelEl);if(x)x.addEventListener("change",function(e){V[k.toLowerCase()]=e.target.checked;sv();});});
    $$("select[data-d]",panelEl).forEach(function(x){x.addEventListener("change",function(){V.dev[x.getAttribute("data-d")]=x.value;sv();});});
    $$("[data-dt]",panelEl).forEach(function(b){b.addEventListener("click",function(){stop();device(b.getAttribute("data-dt"),"这是设备自带的语音，用来读带名字的话和 AI 的回复。");});});}
  function paintBtn(){if(btnV){btnV.setAttribute("aria-pressed",String(!!V.on));btnV.textContent=V.on?"配音":"配音（关）";}}
  if(btnV){paintBtn();btnV.addEventListener("click",openPanel);}
  var WARM={};function warm(list){var ws=Object.keys(PEOPLE);list.forEach(function(t){if(!t||typeof t!=="string"||t.length<2)return;var tt=fill(t);ws.forEach(function(w){var k=clip(w,tt)||(TPL[tt]?clip(w,voiceText(TPL[tt])):null);if(k&&!WARM[k]){WARM[k]=1;try{fetch((CL.dir||"voice/")+k+".mp3").catch(function(){});}catch(e){}}});});}
  /* 等这句录音放完（还没开始播的也算在等）；最长 25 秒 */
  function wait(){var t0=Date.now();return new Promise(function(res){(function chk(){var b=(cur&&!cur.ended&&!cur._done)||(tts&&(speechSynthesis.speaking||speechSynthesis.pending));if(!b||Date.now()-t0>25000)return res();setTimeout(chk,120);})();});}
  return{say:say,stop:stop,wait:wait,warm:warm,dur:function(){return cur&&isFinite(cur.duration)&&cur.duration>0?cur.duration/(cur.playbackRate||1):0;},busy:function(){return !!(cur&&!cur.paused&&!cur.ended)||(tts&&speechSynthesis.speaking);}};})();

/* ================= 对话框 ================= */
var RUN={token:0};var CANCEL={};
var DLOG=[];
var SAYSEQ=0;var FULL=false;/* 11-08：字快速打完、“继续”马上出来，配音接着读；对听（FULL）仍等读完 */
/* 新的一句开始，上一句还没打完的字就停下（不然两句会在同一个框里来回闪） */
function say(txt,who,tok){who=who||lead();var full=FULL;FULL=false;return new Promise(function(res,rej){if(tok!==RUN.token)return rej(CANCEL);var my=++SAYSEQ;
  SPEAKER=who;guestNote(who,txt);NOD[who]=performance.now()/1000;dWho.textContent=nameOf(who);dWho.style.background=inkOf(who);DLOG.push({who:who,text:txt});VOICE.say(who,txt);
  paraMention(txt);if(reduce){dTxt.textContent=txt;return VOICE.wait().then(function(){res();});}
  var i=0,skip=false;TALK=true;var k=function(){skip=true;};dTxt.addEventListener("click",k,{once:true});
  (function step(){if(tok!==RUN.token){TALK=false;return rej(CANCEL);}if(my!==SAYSEQ){dTxt.removeEventListener("click",k);return res();}if(skip||i>=txt.length){dTxt.textContent=txt;dTxt.removeEventListener("click",k);if(skip){TALK=false;return res();}var k2=function(){skip=true;};dTxt.addEventListener("click",k2,{once:true});var wv=full?VOICE.wait():new Promise(function(r){setTimeout(r,350);});var gone=setInterval(function(){if(skip||my!==SAYSEQ||tok!==RUN.token){clearInterval(gone);if(skip&&my===SAYSEQ)VOICE.stop();fin();}},100);function fin(){if(fin.d)return;fin.d=1;clearInterval(gone);dTxt.removeEventListener("click",k2);TALK=false;if(tok!==RUN.token)return rej(CANCEL);res();}wv.then(fin);return;}i++;dTxt.textContent=txt.slice(0,i);var vd=VOICE.dur();
    setTimeout(step,full&&vd?Math.min(24,Math.max(12,vd*1000*.5/txt.length)):/[。！？]/.test(txt[i-1])?70:/[，；：、]/.test(txt[i-1])?35:14);})();});}
/* 讲到“第几段”：原文里那几段加框，其余变淡；连着两句不再提段落就撤掉 */
var PMASK=0;function paraNums(t){var out=[];String(t).replace(/第([0-9０-９、和到至\-–~]+)段/g,function(m,g){var a=g.replace(/[０-９]/g,function(c){return String.fromCharCode(c.charCodeAt(0)-65248);});var r=a.match(/^(\d+)[到至\-–~](\d+)$/);if(r){for(var x=+r[1];x<=+r[2]&&x-r[1]<20;x++)out.push(x);}else a.split(/[、和]/).forEach(function(x){if(/^\d+$/.test(x))out.push(+x);});});return out;}
function unmaskParas(){PMASK=0;rbody.classList.remove("pmask");$$("p.pfocus",rbody).forEach(function(p){p.classList.remove("pfocus");});}
function maskParas(ns){var ps=ns.map(function(n){return $('p[data-p="'+(n-1)+'"]',rbody);}).filter(Boolean);if(!ps.length)return false;$$("p.pfocus",rbody).forEach(function(p){p.classList.remove("pfocus");});ps.forEach(function(p){p.classList.add("pfocus");if(p.classList.contains("struck")){var k=+p.dataset.p,x;for(var d=-1;d<=1;d+=2){var j=k+d;while((x=$('p[data-p="'+j+'"]',rbody))&&x.classList.contains("struck"))j+=d;if(x)x.classList.add("pfocus");}}});rbody.classList.add("pmask");PMASK=1;if(!rbody.querySelector("mark.qflag,mark.wd.hot"))ps[0].scrollIntoView({block:"center",behavior:reduce?"auto":"smooth"});return true;}
function quoteParas(t){var out=[];(String(t).match(/“([^”]{4,})”/g)||[]).forEach(function(q){q=q.slice(1,-1).replace(/^[…\.]+/,"");var parts=q.split(/[：:，。；！？]/).filter(function(x){return x.length>=4;});parts.forEach(function(seg){$$("p[data-p]",rbody).forEach(function(pe){if(pe.textContent.indexOf(seg)>=0){var n=+pe.dataset.p+1;if(out.indexOf(n)<0)out.push(n);}});});});return out;}
function mentionNums(t){var ns=paraNums(t);if(ns.length)quoteParas(t).forEach(function(n){if(ns.indexOf(n)<0)ns.push(n);});else{var qs=quoteParas(t);if(qs.length&&qs.length<=3)ns=qs;}return ns;}
function paraMention(t){if(R.mode==="pick"||R.mode==="mark")return;var ns=mentionNums(t);if(ns.length&&maskParas(ns))return;if(PMASK&&++PMASK>2)unmaskParas();}
function sayQ(txt,who,tok){say(txt,who,tok).catch(function(){});}
/* 一段话说完，等学生点“继续”再往下（下一步本来就是“继续”按钮时不重复） */
var NEXT="end";
function line(txt,who,tok){return say(txt,who,tok).then(function(){if(NEXT==="next")return;return next("继续",tok,true);});}
function logMe(txt){DLOG.push({who:"me",text:txt});}
function clearTask(){task.innerHTML="";task.classList.remove("plain","ask");}
function btn(label){return el("button",{class:"btn",type:"button",text:label});}
var contKey=null;
function next(label,tok,keep){return new Promise(function(res,rej){task.classList.remove("ask");bCont.hidden=false;bCont.textContent=(label||"继续")+" ▸";bCont.focus({preventScroll:true});
  function go(){if(tok!==RUN.token)return rej(CANCEL);SOUND.sfx("page");VOICE.stop();bCont.hidden=true;bCont.onclick=null;removeEventListener("keydown",contKey);contKey=null;if(!keep)clearTask();res();}
  if(contKey)removeEventListener("keydown",contKey);
  contKey=function(e){if((e.key==="Enter"||e.key===" ")&&!/TEXTAREA|INPUT|SELECT|BUTTON/.test(document.activeElement.tagName)){e.preventDefault();go();}};
  bCont.onclick=go;addEventListener("keydown",contKey);});}
function pickSent(label,tok,check){return new Promise(function(res,rej){setMode("pick",label);R.onPick=function(id){if(tok!==RUN.token){R.onPick=null;return rej(CANCEL);}flashSent(id);var ok=check?check(id):true;if(ok===true){R.onPick=null;setMode("none");closeReaderIfNarrow();res(id);}else if(typeof ok==="function"){ok(id);}};});}
function pickMulti(label,tok,preset,okLabel){return new Promise(function(res,rej){var sel=(preset||[]).slice();R.picks={};sel.forEach(function(i){R.picks[i]=1;});paintMarks();setMode("pick",label);
  var ok=el("button",{type:"button"});rmode.append(ok);
  function upd(){ok.textContent=(okLabel||"就是这些")+(sel.length?"（已选 "+sel.length+" 句）":"");ok.disabled=!sel.length;}upd();
  R.onPick=function(id){if(tok!==RUN.token){R.onPick=null;return rej(CANCEL);}var k=sel.indexOf(id);if(k>=0)sel.splice(k,1);else{sel.push(id);flashSent(id);}R.picks={};sel.forEach(function(i){R.picks[i]=1;});paintMarks();upd();};
  ok.addEventListener("click",function(){if(tok!==RUN.token)return rej(CANCEL);if(!sel.length)return;R.onPick=null;setMode("none");closeReaderIfNarrow();res(sel.sort(function(a,b){return a-b;}));});});}
function sleepTick(ms){return new Promise(function(r){setTimeout(r,reduce?10:ms);});}
function textBox(id,rows,ph,val){var ta=el("textarea",{id:id,rows:String(rows||3),placeholder:ph||""});ta.value=val||"";return ta;}
function inPara(id,paras){return paras.indexOf(SENT[id].p)>=0;}
var QP=null,LOC=null,LOCK={};
/* 11-10 定位：题目写 paras:[段落号…] 亮出这几段，hl:["词或句"…] 把含这些词的句子标出来、词加底色。
   换到下一道题（mc/input/frame/pick/focus/read/layering/text）时清掉。pick 只标不遮（找句子要自己找）。 */
var LOCNEW={mc:1,ask:1,trans:1,author:1,input:1,frame:1,pick:1,focus:1,read:1,layering:1,text:1,listen:1};
function clearLoc(){$$("mark.loc",rbody).forEach(function(m){m.replaceWith(document.createTextNode(m.textContent));});rbody.normalize();Object.keys(LOCK).forEach(function(k){delete R.keys[k];});LOCK={};paintMarks();}
function markWords(ws,ns){var ps=$$("p[data-p]",rbody).filter(function(p){return !ns||!ns.length||ns.indexOf(+p.dataset.p+1)>=0;});
  ws.forEach(function(w){ps.forEach(function(p){var walk=document.createTreeWalker(p,NodeFilter.SHOW_TEXT),n,hits=[];while((n=walk.nextNode())){if(n.parentNode.closest&&n.parentNode.closest("mark.loc"))continue;var i=n.nodeValue.indexOf(w);if(i>=0)hits.push([n,i]);}
    hits.forEach(function(h){var r=document.createRange();r.setStart(h[0],h[1]);r.setEnd(h[0],h[1]+w.length);var m=el("mark",{class:"loc"});try{r.surroundContents(m);}catch(e){}});});
    SENT.forEach(function(x){if(x.t.indexOf(w)>=0&&(!ns||!ns.length||ns.indexOf(x.p+1)>=0)&&!R.keys[x.id]){R.keys[x.id]=1;LOCK[x.id]=1;}});});
  paintMarks();var f=rbody.querySelector("mark.loc");if(f)try{f.scrollIntoView({block:"center",behavior:reduce?"auto":"smooth"});}catch(e){}}
function locStep(s){if(LOCNEW[s.t]&&(LOC||Object.keys(LOCK).length))clearLoc();LOC=null;if(!s.paras&&!s.hl)return;LOC={paras:s.paras||null,hl:s.hl?(Array.isArray(s.hl)?s.hl:[s.ctx&&s.t==="ask"?s.ctx:s.hl]):null};
  if(s.t==="pick")return;
  if(s.paras)maskParas(s.paras);if(isNarrow())openReader();}
function showLoc(){if(LOC&&LOC.hl&&!rbody.querySelector("mark.loc"))markWords(LOC.hl,LOC.paras);}
function q(text){var t=fill(text),qp=QP||(LOC&&LOC.paras);QP=null;setTimeout(function(){task.classList.add("ask");var ns=qp||(LOC&&LOC.hl?[]:mentionNums(t));if(ns.length)maskParas(ns);(function(){var sp=task;while(sp&&sp!==document.body){var cs=getComputedStyle(sp);if(/(auto|scroll)/.test(cs.overflowY)&&sp.scrollHeight>sp.clientHeight){sp.scrollTop=0;break;}sp=sp.parentElement;}})();try{task.scrollIntoView({block:"nearest",behavior:reduce?"auto":"smooth"});}catch(e){}},0);return el("div",{class:"task-q",text:t});}

/* ================= 步骤类型 ================= */
var H={};
/* 一句台词的几个版本：textBy＝按学生选的伴学（qingxian／changge）；textIf＝按之前某一题的选择 {key, map:{值:台词}, other} */
function variant(s,f){var by=s[f+"By"];if(by&&by[myBuddy().who])return by[myBuddy().who];var ci=s[f+"If"];if(ci){var v=get(ci.key);if(v!=null&&ci.map[v]!=null)return ci.map[v];if(ci.other!=null)return ci.other;}return s[f];}
var NOWAIT={next:1,input:1,choose:1,independent:1,markHeard:1,layering:1,clear:1,mc:1,findWord:1,frame:1};
H.say=function(s,tok){var nx=NEXT;return say(fill(variant(s,"text")),s.who,tok).then(function(){if(s.wait===false||NOWAIT[nx])return;return next(s.next||"继续",tok,true);});};
H.me=function(s,tok){return line(fill(s.text),"me",tok);};
H.next=function(s,tok){return next(fill(s.label),tok,s.keep);};
H.sleep=function(s){return sleepTick(s.ms||500);};
H.clear=function(){clearTask();return Promise.resolve();};
/* 引一段（同学的作文等）：下一道题清屏后还留着，放在题目上面 */
var KEEPQ=null;function keepQ(){if(KEEPQ){task.append(KEEPQ);KEEPQ=null;}}
H.quote=function(s){clearTask();var qb=el("blockquote",{class:"quote",text:s.para!=null?PARAS[s.para]:fill(s.text)});KEEPQ=s.keep===false?null:qb;task.append(qb);return Promise.resolve();};

H.name=function(s,tok){if(!S.data.name&&BK.mode==="sheet"&&(BK.me||BK.tpw))S.data.name=BK.me?BK.me.name:"老师";if(S.data.name){if(S.data.greeted)return say(fill(s.back),s.who,tok);S.data.greeted=1;save();return line(fill(s.greet),s.who,tok);}
  return say(s.ask,s.who,tok).then(function(){return new Promise(function(res,rej){clearTask();var inp=el("input",{type:"text",id:"in-name",placeholder:"写你的名字或昵称",autocomplete:"off"});var b=btn("说出来");task.append(q(s.ask),el("div",{class:"field"},[inp]),el("div",{class:"row"},[b]));inp.focus();function go(){if(tok!==RUN.token)return rej(CANCEL);var v=inp.value.trim();if(!v){inp.focus();return;}S.data.name=v;S.data.greeted=1;commit();refreshMe();clearTask();res();}b.addEventListener("click",go);inp.addEventListener("keydown",function(e){if(e.key==="Enter")go();});});})
  .then(function(){logMe(fill("我叫{name}。"));return line(fill(s.greet),s.who,tok);});};

H.input=function(s,tok){return new Promise(function(res,rej){clearTask();if(s.q)task.append(q(s.q));if(s.banner)task.append(el("div",{class:"banner",html:fill(s.banner)}));var ta=textBox("in-"+s.key.replace(/\./g,"-"),s.rows,fill(s.ph),get(s.key)||(s.init?get(s.init):null));var b=btn(s.button||"写好了");task.append(el("div",{class:"field"},[ta]),el("div",{class:"row"},[b]));ta.focus();var nudged=false;
  b.addEventListener("click",function(){if(tok!==RUN.token)return rej(CANCEL);var v=ta.value.trim();if(!v){ta.focus();return;}if(s.min&&v.replace(/\s/g,"").length<s.min&&!nudged){nudged=true;sayQ(fill(s.short||"再多写一些。"),s.who||coach(),tok);return;}
    if(s.requireEnd&&!new RegExp(s.requireEnd.re).test(v)&&!nudged){nudged=true;logStep(s.obs,{miss:"noEnd"});sayQ(s.requireEnd.text,s.requireEnd.who||coach(),tok);return;}
    set(s.key,v);logStep(s.obs,{try:1,answer:v});commit();res(v);});})
  .then(function(v){if(s.echo!==false)logMe(v);if(!s.replies)return;for(var i=0;i<s.replies.length;i++){var r=s.replies[i];if(!r.re||new RegExp(r.re).test(v))return line(fill(r.text),r.who||s.who,tok);}});};

/* 11-12 文言逐句翻译（《岳阳楼记》逐句翻译的做法）：{t:"trans",who,src:"原句",pairs:[[原文片段,译文片段,"留|换|补|调"]...],tr:"参考译文",key,paras:[段落号],hint,obs}
 * 先看原句（自己先说一说，可写几个字，不判分）→ 点“看译文”：原文和译文同色对应、标出翻译方法 → 自评“说对了／差一点／没说出来”。 */
var TRMETH={"留":"留：人名地名等照抄","换":"换：古义换今义、单音词换双音词","补":"补：补出省略的成分","调":"调：调整语序"};
H.trans=function(s,tok){return new Promise(function(res,rej){clearTask();if(s.paras)QP=s.paras;task.append(q(s.q||"先自己说说这一句的意思，再看译文。"));
  var src=el("div",{class:"tr-src"});(s.pairs||[]).forEach(function(pr,i){src.append(el("span",{class:"tr-seg c"+(i%6),text:pr[0]}));});if(!s.pairs||!s.pairs.length)src.textContent=s.src;
  var MIN=s.min||Math.min(8,Math.max(4,Math.round((s.src||"").replace(/[，。；？！、：“”]/g,"").length*.6)));
  var mine=textBox("in-"+(s.key||"tr").replace(/\./g,"-"),2,"先写下你的翻译（至少 "+MIN+" 个字），写完才能看译文",get(s.key+".mine")||"");
  var show=btn("看译文");var cnt=el("span",{class:"note"});var upd=function(){var n=mine.value.replace(/\s/g,"").length;show.disabled=n<MIN;cnt.textContent=n<MIN?"还差 "+(MIN-n)+" 个字":"";};mine.addEventListener("input",upd);upd();
  task.append(src,el("div",{class:"field"},[mine]),el("div",{class:"row"},[show,cnt]));
  if(s.hint)task.append(el("p",{class:"note",text:"提示："+fill(s.hint)}));
  if(s.read!==false)sayQ(s.src,s.who||lead(),tok);
  show.addEventListener("click",function(){if(tok!==RUN.token)return rej(CANCEL);if(mine.value.replace(/\s/g,"").length<MIN){mine.focus();return;}show.disabled=true;mine.disabled=true;cnt.textContent="";SOUND.sfx("page");if(s.read!==false&&s.tr)sayQ(s.tr,s.who||lead(),tok);
    var tr=el("div",{class:"tr-out"});(s.pairs||[]).forEach(function(pr,i){var seg=el("span",{class:"tr-seg c"+(i%6)+(pr[2]?" m":""),text:pr[1]});if(pr[2])seg.setAttribute("data-m",pr[2]);tr.append(seg);});if(!s.pairs||!s.pairs.length)tr.textContent=s.tr;
    var ms={};(s.pairs||[]).forEach(function(pr){if(pr[2])ms[pr[2]]=1;});var leg=el("div",{class:"tr-leg"});Object.keys(ms).forEach(function(m){leg.append(el("span",{class:"tr-m",text:TRMETH[m]||m}));});
    var self=el("div",{class:"row tr-self"},[el("span",{class:"note",text:"和你说的比一比："})]);
    [["ok","说对了"],["half","差一点"],["no","没说出来"]].forEach(function(o){var b=btn(o[1]);b.classList.add("ghost");b.addEventListener("click",function(){if(tok!==RUN.token)return;$$("button",self).forEach(function(x){x.disabled=true;});b.classList.add("on");
      if(s.key){set(s.key+".self",o[0]);set(s.key+".mine",mine.value.trim());}logStep(s.obs,{try:1,answer:o[1]+(mine.value.trim()?"（"+mine.value.trim()+"）":"")});if(o[0]!=="ok")logStep(s.obs,{miss:o[0]});commit();showLoc();res(o[0]);});self.append(b);});
    task.append(el("div",{class:"tr-lab",text:"译文"}),tr);if(leg.childNodes.length)task.append(leg);task.append(self);});
}).then(function(v){var r=s.replies&&(s.replies[v]||s.replies.all);return (r?say(fill(r),s.who||coach(),tok):Promise.resolve()).then(function(){return next(s.next||"下一句",tok);});});};


/* 11-12 自己说出答案（字词意思、写法名称）：{t:"ask",who,q,ctx:"原句",hl:"要标出的字",accept:["可接受的说法"...],hints:["第一次错的提示","第二次错的提示"],choices:[{text,ok,reply}],ans:"标准答案",reply:"答对后说的话",obs,key,paras}
 * 先自己写 → 错了只给提示（不给答案）→ 提示用完还不对，给几个选项选 → 选对了才讲明白。 */
H.ask=function(s,tok){var fbWho=s.feedbackWho||lead();var pre=s.say?say(fill(s.say),s.who,tok):Promise.resolve();
  return pre.then(function(){return new Promise(function(res,rej){clearTask();keepQ();if(s.paras)QP=s.paras;task.append(q(s.q));
    if(s.ctx){var cx=el("div",{class:"ask-ctx"});var parts=s.hl?String(s.ctx).split(s.hl):[s.ctx];parts.forEach(function(pt,i){cx.append(document.createTextNode(pt));if(i<parts.length-1)cx.append(el("mark",{text:s.hl}));});task.append(cx);}
    var inp=el("input",{type:"text",class:"ask-in",autocomplete:"off",placeholder:s.ph||"写下你的答案",id:"in-ask-"+(s.obs?s.obs.id:"x")});var go=btn("确定");var row=el("div",{class:"orow"},[inp,go]);task.append(row);
    var miss=0,done=false,chBox=null;
    function norm(v){return String(v).replace(/[\s，。、；：！？“”‘’"'（）()……\.,!?]/g,"");}
    function finish(v,how){if(done)return;done=true;inp.disabled=true;go.disabled=true;if(chBox)$$("button",chBox).forEach(function(x){x.disabled=true;});task.classList.remove("ask");SOUND.sfx("ok");
      logStep(s.obs,{answer:v+(how?"（"+how+"）":"")});logMe(v);if(s.key)set(s.key,v);commit();showLoc();
      if(s.note!==false&&(s.paras||s.hl))task.append(typeof s.hl==="string"&&!s.note?noteChip({note:"在“"+s.hl+"”旁边写："+(s.ans||v)},{}):noteChip(s,{text:s.ans||v}));
      var r=s.reply||(s.ans?"对。"+s.ans:"对。");say(fill(r),s.who||fbWho,tok).then(function(){res();},function(){});}
    function showChoices(){if(chBox||!s.choices)return false;chBox=el("div",{class:"mc"});var ord=s.choices.map(function(c,i){return i;});for(var z=ord.length-1;z>0;z--){var r=Math.floor(Math.random()*(z+1)),tz=ord[z];ord[z]=ord[r];ord[r]=tz;}
      ord.forEach(function(i){var c=s.choices[i];var b=el("button",{class:"mco",type:"button",text:fill(c.text)});b.addEventListener("click",function(){if(tok!==RUN.token||done)return;logStep(s.obs,{try:1});
        if(c.ok){b.classList.add("ok");finish(fill(c.text),"选的");}else{b.classList.add("no");b.disabled=true;SOUND.sfx("no");logStep(s.obs,{miss:"c"+i});sayQ(fill(c.reply||"再回到原句读一读。"),fbWho,tok);}});chBox.append(b);});
      task.append(el("p",{class:"note",text:"从下面选一个："}),chBox);return true;}
    function check(){if(tok!==RUN.token)return rej(CANCEL);if(done)return;var v=inp.value.trim();if(norm(v).length<1){inp.focus();return;}logStep(s.obs,{try:1});
      var nv=norm(v);if(!(s.reject||[]).some(function(a){return nv.indexOf(norm(a))>=0;})&&(s.accept||[]).some(function(a){return nv.indexOf(norm(a))>=0;})){finish(v);return;}
      logStep(s.obs,{miss:"h"+Math.min(miss,2)});SOUND.sfx("no");var h=(s.hints||[])[miss];miss++;
      if(h){sayQ(fill(h),fbWho,tok);inp.select();return;}
      if(showChoices()){sayQ("不着急，从这几个里选一选。",fbWho,tok);return;}
      finish(s.ans||v,"看了答案");}
    go.addEventListener("click",check);inp.addEventListener("keydown",function(e){if(e.key==="Enter"&&!e.isComposing){e.preventDefault();check();}});setTimeout(function(){try{inp.focus({preventScroll:true});}catch(e){}},60);
  });}).then(function(){if(s.wait===false)return;return next(s.next||"继续",tok);});};

/* 11-12 问作者：{t:"author",who:"ou",q,qs:[{q:"学生问的话",a:["作者答的话",...]}],min:1,note}
 * 学生挑问题问，作者用第一人称回答（根据课文和史料；想象的部分在 note 里说明）。至少问 min 个，可以都问。 */
H.author=function(s,tok){return new Promise(function(res,rej){clearTask();task.append(q(s.q||"你想问他什么？点一个问题。"));if(s.note)task.append(el("p",{class:"note",text:fill(s.note)}));
  var box=el("div",{class:"mc author-qs"}),asked=0,busy=false,MIN=s.min||1,fin=btn(s.done||"问完了");fin.hidden=true;
  s.qs.forEach(function(it){var b=el("button",{class:"mco",type:"button",text:fill(it.q)});b.addEventListener("click",function(){if(tok!==RUN.token)return rej(CANCEL);if(busy||b.disabled)return;busy=true;b.disabled=true;b.classList.add("ok");$$("button",box).forEach(function(x){x.classList.add("wait");});
      logMe(fill(it.q));var chain=Promise.resolve();it.a.forEach(function(line){chain=chain.then(function(){return say(fill(line),it.who||s.who,tok);});});
      chain.then(function(){busy=false;asked++;$$("button",box).forEach(function(x){x.classList.remove("wait");});logStep(s.obs,{try:1,answer:"问了"+asked+"个"});commit();if(asked>=s.qs.length){res();return;}if(asked>=MIN)fin.hidden=false;},function(){});});box.append(b);});
  fin.addEventListener("click",function(){if(tok!==RUN.token)return rej(CANCEL);if(busy)return;res();});
  task.append(box,el("div",{class:"row"},[fin]));}).then(function(){return next(s.next||"继续",tok);});};

H.quoteOrPick=function(s,tok){var v=get(s.from)||"";var hits=findQuotedAll(v);
  return say(hits.length?s.hitText:s.askText,s.who,tok).then(function(){clearTask();task.append(q(s.task||s.pickLabel),el("p",{class:"note",text:"在左边原文里点句子；点错了再点一下就取消。选好了按原文上方的按钮。"}));return pickMulti(s.pickLabel,tok,hits,s.okLabel);})
  .then(function(ids){var t=joinSents(ids);clearTask();R.keys={};ids.forEach(function(i){R.keys[i]=1;});R.picks={};paintMarks();set(s.key,t);logStep(s.obs,{try:1,answer:(ids.length>1?"（"+ids.length+"句）":"")+t});commit();return line(s.doneText,s.who,tok);});};

H.pick=function(s,tok){var other=0;var fbWho=s.feedbackWho||coach();return say(fill(s.ask),s.who,tok).then(function(){clearTask();task.append(q(s.task||s.label),el("p",{class:"note",text:"在左边原文里点一句。"}));return pickSent(s.label,tok,function(id){logStep(s.obs,{try:1});
    if(inPara(id,s.accept.paras)&&(!s.accept.has||[].concat(s.accept.has).some(function(h){return SENT[id].t.indexOf(h)>=0;}))){SOUND.sfx("ok");return true;}
    var t=SENT[id].t,ms=s.misses||[];for(var i=0;i<ms.length;i++){var m=ms[i];if((m.has&&t.indexOf(m.has)>=0)||(m.paras&&m.paras.indexOf(SENT[id].p)>=0)){return function(){SOUND.sfx("no");logStep(s.obs,{miss:m.id});sayQ(m.text,fbWho,tok);};}}
    return function(){SOUND.sfx("no");logStep(s.obs,{miss:"other"});var fb=s.fallback||["不是这一句，再找找。"];sayQ(fb[Math.min(other,fb.length-1)],fbWho,tok);other++;};});})
  .then(function(id){clearTask();logStep(s.obs,{answer:SENT[id].t});commit();if(s.light!==false){if(!s.keepKeys)R.keys={};s.accept.paras.forEach(function(p){PSENT[p].forEach(function(i){if(!s.accept.has||[].concat(s.accept.has).some(function(h){return SENT[i].t.indexOf(h)>=0;}))R.keys[i]=1;});});paintMarks();}if(s.quote)task.append(el("blockquote",{class:"quote",text:PARAS[s.accept.paras[0]]}));if(s.okText)return line(fill(s.okText),s.okWho||s.who,tok);});};

H.choose=function(s,tok){return new Promise(function(res,rej){clearTask();if(s.q)task.append(q(s.q));var row=el("div",{class:"objs"});var cur=get(s.key)||"";var inp=el("input",{type:"text",id:"in-"+s.key.replace(/\./g,"-"),placeholder:s.ph||"也可以自己写一样",autocomplete:"off"});inp.value=s.options.indexOf(cur)<0?cur:"";var chosen=cur;
  s.options.forEach(function(o){var b=el("button",{class:"obj",type:"button","aria-pressed":String(o===chosen),text:o});b.addEventListener("click",function(){chosen=o;inp.value="";$$(".obj",row).forEach(function(x){x.setAttribute("aria-pressed",String(x===b));});});row.append(b);});
  inp.addEventListener("input",function(){if(inp.value.trim()){chosen=inp.value.trim();$$(".obj",row).forEach(function(x){x.setAttribute("aria-pressed","false");});}});
  var g=btn(s.button||"就它了");task.append(row,el("div",{class:"field"},[inp]),el("div",{class:"row"},[g]));
  g.addEventListener("click",function(){if(tok!==RUN.token)return rej(CANCEL);if(!chosen){inp.focus();return;}set(s.key,chosen);logStep(s.obs,{answer:chosen});commit();clearTask();res();});})
  .then(function(){logMe(fill(s.echo||"就选{"+s.key+"}吧。"));});};

/* 课上独立作答：不提示、不能聊、交了不能改；可填多处，点句子加进格子、再点拿掉 */
H.independent=function(s,tok){app.classList.add("hush");bChat.disabled=true;bChat.title="独立作答时不能聊";
  return new Promise(function(res,rej){clearTask();setMode("pick",s.pickHint);
  var card=el("div",{},[el("span",{class:"tag",text:s.tag}),q(s.task)]);
  var groupsBox=el("div",{class:"groups"});var G=[];var focus=null;var maxG=s.max||1;
  var dr=get(s.key+".draft");var saved=(dr&&dr.items)||[{}];
  function keep(){set(s.key+".draft",{items:G.map(function(g){var o={};g.F.forEach(function(x){o[x.f.k]=x.ta.value;o[x.f.k+"_ids"]=x.ids;});return o;})});save();}
  function paintSel(){R.picks={};if(focus)focus.ids.forEach(function(i){R.picks[i]=1;});paintMarks();}
  function label(n){return fill(s.groupLabel||"第 {n} 处",{n:n});}
  function addGroup(val){var gi=G.length;var g={F:[]};var box=el("div",{class:"grp"});var h=el("div",{class:"grp-h"},[el("b",{text:label(gi+1)})]);
    if(gi>0){var rm=el("button",{class:"ghost",type:"button",text:"删掉这一处"});rm.addEventListener("click",function(){G.splice(G.indexOf(g),1);box.remove();if(focus&&g.F.indexOf(focus)>=0)focus=null;$$(".grp-h b",groupsBox).forEach(function(b,k){b.textContent=label(k+1);});keep();paintSel();addB.hidden=G.length>=maxG;});h.append(rm);}
    box.append(h);
    s.fields.forEach(function(f){var ta=textBox("in-"+s.key+"-"+gi+"-"+f.k,f.rows||2,f.ph,(val||{})[f.k]);var x={f:f,ta:ta,ids:((val||{})[f.k+"_ids"]||[]).slice(),edited:false};
      ta.addEventListener("focus",function(){focus=f.pickable?x:null;paintSel();});
      ta.addEventListener("input",function(){if(f.pickable&&ta.value!==joinSents(x.ids))x.edited=true;keep();});
      if(f.pickable&&ta.value&&ta.value!==joinSents(x.ids))x.edited=true;
      g.F.push(x);box.append(el("div",{class:"field"},[el("span",{class:"lab",text:f.label}),ta]));});
    G.push(g);groupsBox.append(box);return g;}
  saved.forEach(function(v){addGroup(v);});
  var addB=el("button",{class:"ghost",type:"button",text:s.addLabel||"再找一处"});addB.hidden=G.length>=maxG;
  addB.addEventListener("click",function(){var g=addGroup({});addB.hidden=G.length>=maxG;keep();g.F[0].ta.focus();});
  R.onPick=function(id){if(tok!==RUN.token)return;
    var x=focus;if(!x){var last=G[G.length-1];x=last.F.filter(function(y){return y.f.pickable&&!y.ta.value.trim();})[0]||last.F.filter(function(y){return y.f.pickable;}).pop();focus=x;}
    var k=x.ids.indexOf(id);if(k>=0)x.ids.splice(k,1);else{x.ids.push(id);flashSent(id);}
    if(x.edited&&k<0){x.ta.value=(x.ta.value.trim()+SENT[id].t);}else{x.ta.value=joinSents(x.ids);x.edited=false;}
    keep();paintSel();};
  var sub=btn("交卷");var box=el("div",{class:"row"},[sub,addB]);task.append(card,groupsBox,box);
  if(!online())task.append(el("p",{class:"note",text:"这台设备没有连上老师那边，作答只存在这台设备上。交卷后，打开“"+L.notebook.button+"”给老师看。"}));
  var nudged=false;
  sub.addEventListener("click",function(){if(tok!==RUN.token)return rej(CANCEL);
    for(var a=0;a<G.length;a++){var e=G[a].F.filter(function(x){return !x.ta.value.trim();})[0];if(e){e.ta.focus();return;}}
    if(s.fewNote&&G.length<(s.want||1)&&!nudged&&G.length<maxG){nudged=true;task.insertBefore(el("p",{class:"banner",text:s.fewNote}),box);return;}
    var cf=el("div",{class:"row"});box.replaceWith(cf);var y=btn("确定交"),n=el("button",{class:"ghost",type:"button",text:"再看看"});var shareBox=null;if(s.share){shareBox=el("input",{type:"checkbox",id:"in-share"});shareBox.checked=true;}
    cf.append(el("div",{class:"confirm"},[el("span",{text:"一共 "+G.length+" 处。交了就不能再改了。确定交吗？"}),shareBox?el("label",{class:"row note",style:"gap:6px"},[shareBox,s.share]):null,el("div",{class:"row"},[y,n])]));
    n.addEventListener("click",function(){cf.replaceWith(box);});
    y.addEventListener("click",function(){if(tok!==RUN.token)return rej(CANCEL);var items=G.map(function(g){var o={};g.F.forEach(function(x){o[x.f.k]=x.ta.value.trim();});return o;});
      set(s.key+".items",items);set(s.key+".at",new Date().toISOString());del(s.key+".draft");set(s.key+".shared",!!(shareBox&&shareBox.checked));
      if(shareBox&&shareBox.checked)BK.share(s.key,items);
      logStep(s.obs,{try:1,answer:items.map(function(o,k){return label(k+1)+"\n"+s.fields.map(function(f){return "  "+f.label+"："+o[f.k];}).join("\n");}).join("\n")});
      commit();R.onPick=null;R.picks={};paintMarks();setMode("none");clearTask();res();});});})
  .then(function(){app.classList.remove("hush");bChat.disabled=false;bChat.title="";},function(e){app.classList.remove("hush");bChat.disabled=false;throw e;});};

H.markHeard=function(s,tok){return new Promise(function(res,rej){clearTask();R.marks={};(get(s.key)||[]).forEach(function(i){R.marks[i]=1;});paintMarks();setMode("mark",s.label);var cnt=el("p",{class:"note"});
  function upd(){var n=Object.keys(R.marks).length;cnt.textContent=n?"你点亮了 "+n+" 句。":"还没有点亮。";}upd();
  R.onMark=function(){set(s.key,Object.keys(R.marks).map(Number));save();upd();};
  var b=btn(s.button||"听完了");task.append(q(s.q||s.label),cnt,el("div",{class:"row"},[b]));
  b.addEventListener("click",function(){if(tok!==RUN.token)return rej(CANCEL);R.onMark=null;setMode("none");logStep(s.obs,{answer:"点亮了 "+Object.keys(R.marks).length+" 句"});commit();clearTask();res();});});};

function layersFrom(cuts){var arr=Object.keys(cuts).map(Number).sort(function(a,b){return a-b;});var Ls=[],st=0;arr.forEach(function(c){Ls.push([st,c]);st=c+1;});Ls.push([st,PARAS.length-1]);return Ls;}
function rng(r){return "第 "+(r[0]+1)+(r[1]>r[0]?"–"+(r[1]+1):"")+" 段";}
H.layering=function(s,tok){var who=s.feedbackWho||coach();return new Promise(function(res,rej){clearTask();R.cuts={};(get(s.key+".cuts")||[]).forEach(function(c){R.cuts[c]=1;});var info=get(s.key+".layers")||[];var active=0,pi=0;
  var stairs=el("div",{class:"stairs"+(s.flat?" flat":"")});var keyMode=null;var doneB=btn(s.button||"我分好了");var tries=0;
  task.append(q(s.q),stairs,el("div",{class:"row"},[doneB]));var cutLabel=s.cutLabel||"在两段之间点“在这里分层”；再点一次就合上";setMode("cut",cutLabel);if(s.flat){$$(".gap button",rbody).forEach(function(b){b.textContent="在这里分开";});rbody.scrollTop=0;}
  function LS(){return layersFrom(R.cuts);}
  function render(){var ls=LS();while(info.length<ls.length)info.push({sum:"",key:""});info.length=ls.length;stairs.innerHTML="";
    ls.forEach(function(r,i){var st=el("div",{class:"step"+(i===active?" act-on":""),style:"--i:"+i});var inp=el("input",{type:"text",id:"in-layer-"+i,placeholder:s.flat?"第 "+(i+1)+" 部分：谁＋做了什么？写一句完整的话":"第 "+(i+1)+" 层说了什么？一句话",value:info[i].sum||""});
      inp.addEventListener("focus",function(){if(active!==i){active=i;$$(".step",stairs).forEach(function(x,k){x.classList.toggle("act-on",k===i);});if(s.prompts)sayQ(s.prompts[pi++%s.prompts.length],who,tok);}});
      inp.addEventListener("input",function(){info[i].sum=inp.value;keep();});
      var kids=[el("b",{text:String(i+1)}),el("div",{class:"field"},[el("span",{class:"rng",text:rng(r)}),inp])];
      if(s.keySentence!==false){var kb=el("button",{class:"ghost",type:"button",text:info[i].key?"换一句":(s.keyOptional?"关键句（可选）":"点原文选关键句")});kb.addEventListener("click",function(){active=i;keyMode=i;setMode("pick","在"+rng(r)+"里点一句关键句");});kids.push(el("div",{class:"key"},[info[i].key?el("span",{text:"关键句："+info[i].key}):null,kb]));}
      kids.forEach(function(k2){st.append(k2);});stairs.append(st);});
    keep();R.keys={};info.forEach(function(x){if(x.key){var k=SENT.findIndex(function(z){return z.t===x.key;});if(k>=0)R.keys[k]=1;}});paintMarks();}
  function keep(){set(s.key+".cuts",Object.keys(R.cuts).map(Number));set(s.key+".layers",info.map(function(x,i){return {sum:x.sum,key:x.key,range:LS()[i]};}));save();}
  R.onCut=function(){var n=LS().length;active=Math.min(active,n-1);render();if(n===2&&s.firstCut)sayQ(s.firstCut,who,tok);};
  R.onPick=function(id){if(keyMode==null)return;var r=LS()[keyMode];if(SENT[id].p<r[0]||SENT[id].p>r[1]){logStep(s.obs,{miss:"keyOut"});sayQ(MSG.keyOut,who,tok);return;}info[keyMode].key=SENT[id].t;keyMode=null;setMode("cut",cutLabel);render();closeReaderIfNarrow();};
  render();
  doneB.addEventListener("click",function(){if(tok!==RUN.token)return rej(CANCEL);var ls=LS();var empty=info.filter(function(x){return !x.sum.trim();}).length;tries++;logStep(s.obs,{try:1});
    /* 一层都没分：不能交（这一步就是分层）；层数偏少、偏多：提醒一次，再按就算数；有层没写：一定要写完 */
    if(ls.length<2){logStep(s.obs,{miss:"none"});sayQ(s.none||"还没有分层。在左边原文两段之间点一下，就分出一层。",who,tok);return;}
    if(ls.length<s.min&&tries<2){logStep(s.obs,{miss:"few"});sayQ(fill(s.few,{n:ls.length}),who,tok);return;}
    if(ls.length>s.max&&tries<2){logStep(s.obs,{miss:"many"});sayQ(s.many,who,tok);return;}
    if(empty){logStep(s.obs,{miss:"empty"});sayQ(fill(s.empty,{n:empty}),who,tok);var fi=info.findIndex(function(x){return !x.sum.trim();});var fe=$("#in-layer-"+fi);if(fe)fe.focus();return;}
    keep();set(s.key+".at",new Date().toISOString());logStep(s.obs,{answer:info.map(function(x,i){return (i+1)+"．"+rng(ls[i])+" "+(x.sum||"")+(x.key?"（关键句："+x.key+"）":"");}).join("\n")});commit();R.onCut=null;R.onPick=null;setMode("none");
    doneB.parentNode.remove();if(s.ref&&s.flat){var stp=strips(LS(),s.ref,info);task.append(stp);setTimeout(function(){try{stp.scrollIntoView({block:"center",behavior:reduce?"auto":"smooth"});}catch(e){}},300);}if(s.topQuote)task.append(el("div",{class:"topq"},[el("span",{class:"topl",text:s.topLabel||"台阶的顶"}),el("blockquote",{class:"quote",text:s.topQuote})]));
    SOUND.sfx("ok");var cmpT=null;if(s.ref&&s.cmp){var mine=Object.keys(R.cuts).map(Number),refc=s.ref.slice(0,-1).map(function(r){return r[r.length-1]-1;}),hit=refc.filter(function(c){return mine.indexOf(c)>=0;}).length;cmpT=hit===refc.length&&mine.length===refc.length?s.cmp.all:hit>=Math.ceil(refc.length/2)?s.cmp.some:s.cmp.none;logStep(s.obs,{answer:"和参考分法相同的分界："+hit+"/"+refc.length});}
    line(fill(s.done),s.who||lead(),tok).then(function(){return cmpT?line(cmpT,s.who||lead(),tok):null;}).then(function(){res();}).catch(function(){});});});};

H.ladder=function(s,tok){var who=s.feedbackWho||coach();return say(fill(s.ask),s.who,tok).then(function(){return new Promise(function(res,rej){clearTask();if(s.q)task.append(q(s.q));var st=get(s.key)||[];var box=el("div",{class:"stairs"});var tas=[];var hinted={};
  s.labels.forEach(function(lb,i){var t=textBox("in-"+s.key.replace(/\./g,"-")+"-"+i,2,"",st[i]);tas.push(t);var row=el("div",{class:"step",style:"--i:"+i});row.append(el("b",{text:String(i+1)}),el("div",{class:"field"},[el("span",{class:"lab",text:lb}),t]));box.append(row);
    t.addEventListener("focus",function(){if(hinted[i]||!s.hints)return;hinted[i]=1;sayQ(fill(s.hints[i]),who,tok);});});
  var b=btn(s.button||"写好了");task.append(box,el("div",{class:"row"},[b]));
  b.addEventListener("click",function(){if(tok!==RUN.token)return rej(CANCEL);var v=tas.map(function(t){return t.value.trim();});var e=v.findIndex(function(x){return !x;});if(e>=0){tas[e].focus();sayQ(MSG.ladderEmpty,who,tok);return;}
    set(s.key,v);logStep(s.obs,{try:1,answer:v.map(function(x,i){return (i+1)+"．"+x;}).join("\n")});commit();res();});});});};

/* AI 点评（可选）：回答出现在对话框里，也留在任务卡上；拿不到 AI 就换成一句替代提示 */
H.ai=function(s,tok){var who=s.who||lead();return getSample().then(function(sm){
  if(!sm){if(s.offText)return say(s.offText,who,tok).then(function(){return next("继续",tok,true);});return;}
  return say(fill(s.intro),who,tok).then(function(){return new Promise(function(res,rej){var out=el("div",{class:"quote",hidden:""});var ask=btn(s.button||"请你看看");var skip=el("button",{class:"ghost",type:"button",text:s.skipLabel||"不用了，往下"});var row=el("div",{class:"row"},[ask,skip]);task.append(out,row);var used=0;var ctl=null;
    skip.addEventListener("click",function(){if(ctl)ctl.abort();if(tok!==RUN.token)return rej(CANCEL);res();});
    ask.addEventListener("click",function(){if(tok!==RUN.token)return rej(CANCEL);if(used>=(s.max||2))return;used++;ask.disabled=true;SPEAKER=who;TALK=true;dWho.textContent=nameOf(who);dWho.style.background=inkOf(who);dTxt.textContent="我看看……";ctl=new AbortController();
      var prompt=(L.ai&&L.ai.pre?L.ai.pre+"\n\n":"")+fill(s.prompt);
      sm(prompt,{signal:ctl.signal,modelTier:"quick",cache:false,onText:function(o){dTxt.textContent=o.text;}}).then(function(r){var txt=(r&&r.text||"").trim();dTxt.textContent=txt;DLOG.push({who:who,text:txt});VOICE.say(who,txt,"ai");out.hidden=false;out.textContent=txt;set(s.key,txt);logStep(s.obs,{ai:txt,answer:"请AI看过"});commit();
        skip.textContent=s.doneLabel||"看完了，往下";ask.textContent="再看一次";ask.disabled=used>=(s.max||2);})
      .catch(function(e){var c=e&&e.code;dTxt.textContent=c==="rate_limited"?"现在问的人太多，等一会儿再试，或者直接往下。":c==="cancelled"?"已停止。":(["not_granted","sampling_disabled","not_declared","capability_disabled"].indexOf(c)>=0?"这里用不了 AI，可以请同桌或老师看。":"这次没看成，可以再点一次，或者直接往下。");ask.disabled=used>=(s.max||2);})
      .then(function(){TALK=false;ctl=null;});});});});});};

/* 看看别人怎么找：不需要全班同步。读匿名同学和虚拟同学的作答，私下做个反应，回应其中一位。
   回应虚拟同学时，AI 扮演他回一两句（拿不到AI就用写好的回话）；回应真同学，TA下次打开时能看到。 */
function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;}return a;}
H.gallery=function(s,tok){var who=s.who||lead();var mine=get(s.from+".items")||[];
  function loadReal(){return BK.gallery(s.from,s.maxReal||3);}
  return loadReal().then(function(R2){return new Promise(function(res,rej){clearTask();
    var cards=[],letters="甲乙丙丁戊";
    R2.real.forEach(function(r,k){cards.push({id:"r"+k,real:true,target:r.id,name:"同学"+letters[k]+"（匿名）",items:r.items});});
    (s.virtual||[]).forEach(function(v){cards.push({id:"v_"+v.id,virtual:v,name:"虚拟同学 · "+v.name,items:v.items});PEOPLE["v_"+v.id]={name:v.name,glyph:v.name.slice(0,1),ink:"--cool",voices:v.voice?[v.voice]:[],voice:{gender:(v.voice||{}).gender}};});
    var react=get(s.key+".react")||{};var chosen=null;
    task.append(q(s.q));
    if(R2.got.length){var gb=el("div",{class:"banner"},[el("b",{text:"有 "+R2.got.length+" 位同学回应了你上次的作答："})]);R2.got.forEach(function(t){gb.append(el("p",{style:"margin:.3em 0 0;font-family:var(--f-text)",text:"“"+t+"”"}));});task.append(gb);}
    if(!R2.real.length)task.append(el("p",{class:"note",text:online()?"还没有别的同学分享，先看看三位虚拟同学的。":"这台设备没有连上全班，先看看三位虚拟同学的。"}));
    var list=el("div",{class:"gal"});task.append(list);
    cards.forEach(function(c){var card=el("article",{class:"gcard"+(c.virtual?" virt":"")});card.append(el("h4",{text:c.name}));
      c.items.forEach(function(it,ii){var blk=el("div",{class:"gitem"});s.fields.forEach(function(f){if(!it[f.k])return;var p=el("p",{},[el("span",{class:"lab",text:f.label}),el("span",{class:f.quote?"gq":"",text:it[f.k]})]);if(f.quote){p.title="点一下，在原文里找到它";p.addEventListener("click",function(){var ids=findQuotedAll(it[f.k]);R.keys={};ids.forEach(function(i){R.keys[i]=1;});paintMarks();if(ids[0]!=null){if(isNarrow())openReader();flashSent(ids[0]);}});}blk.append(p);});card.append(blk);});
      var rb=el("div",{class:"reacts"});(s.reacts||[]).forEach(function(t){var b=el("button",{type:"button",class:"obj","aria-pressed":String(react[c.id]===t),text:t});b.addEventListener("click",function(){react[c.id]=react[c.id]===t?null:t;set(s.key+".react",react);save();$$("button",rb).forEach(function(x){x.setAttribute("aria-pressed",String(react[c.id]===x.textContent));});});rb.append(b);});
      var pickB=el("button",{type:"button",class:"ghost",text:"回应TA"});pickB.addEventListener("click",function(){chosen=c;$$(".gcard",list).forEach(function(x){x.classList.toggle("sel",x===card);});resp.hidden=false;respTo.textContent="回应"+c.name.replace("（匿名）","")+"：";ta.focus();});
      card.append(el("div",{class:"row",style:"justify-content:space-between"},[rb,pickB]));list.append(card);});
    var resp=el("div",{class:"field",hidden:""});var respTo=el("span",{class:"lab"});var ta=textBox("in-"+s.key.replace(/\./g,"-")+"-resp",3,s.respPh||"你同意吗？为什么？用原文里的话说说你的理由。");var send=btn(s.sendLabel||"发出去");
    resp.append(respTo,ta,el("div",{class:"row"},[send]));task.append(el("p",{class:"note",text:s.respHint||"挑一位，点“回应TA”，回应一两句。"}),resp);
    var fin=el("div",{class:"row",hidden:""});var synthB=el("button",{type:"button",class:"ghost",text:s.synthLabel||"请"+nameOf(who)+"把这几种读法放在一起看看"});var doneB=btn(s.doneLabel||"看完了");fin.append(doneB);task.append(fin);
    var sent=false;
    send.addEventListener("click",function(){if(tok!==RUN.token)return rej(CANCEL);var v=ta.value.trim();if(!v||!chosen){ta.focus();return;}send.disabled=true;var c=chosen;
      var rs=get(s.key+".resp")||[];rs.push({to:c.name,text:v,at:new Date().toISOString()});set(s.key+".resp",rs);
      logStep(s.obs,{try:1,answer:rs.map(function(r){return "回应"+r.to+"："+r.text;}).join("\n")+(Object.keys(react).length?"\n反应："+Object.keys(react).filter(function(k){return react[k];}).map(function(k){var cc=cards.filter(function(x){return x.id===k;})[0];return (cc?cc.name:k)+"—"+react[k];}).join("；"):"")});commit();logMe(v);
      var p;
      if(c.real){var mineR=get(s.key+".sentReplies")||[];mineR.push({to:c.target,key:s.from,text:v,at:new Date().toISOString()});set(s.key+".sentReplies",mineR);save();BK.reply(c.target,s.from,v,mineR);
        p=line(s.sentReal||"已经匿名送给TA了。TA下次打开这一课，就能看到你的回应。",who,tok);}
      else{var vw="v_"+c.virtual.id;p=getSample().then(function(sm){if(!sm)return line(c.virtual.reply,vw,tok);
          SPEAKER=vw;TALK=true;dWho.textContent=c.virtual.name;dWho.style.background=inkOf(vw);dTxt.textContent="……";
          var pr=(L.ai&&L.ai.peer?L.ai.peer+"\n\n":"")+"你扮演虚拟同学"+c.virtual.name+"。"+(c.virtual.persona||"")+"\n你交上去的作答是：\n"+c.items.map(function(it){return s.fields.map(function(f){return f.label+"："+it[f.k];}).join("\n");}).join("\n\n")+"\n\n一位同学回应你：“"+v+"”\n\n请用同学的口吻回他一两句（不超过60字）：认真接住他的理由，可以坚持自己的看法，也可以被说服，但都要说出你在原文里的依据；不要像老师那样讲解，不要打分。";
          return sm(pr,{modelTier:"quick",cache:false,onText:function(o){dTxt.textContent=o.text;}}).then(function(r){TALK=false;var t=(r.text||"").trim();DLOG.push({who:vw,text:t});VOICE.say(vw,t,"ai");rs[rs.length-1].reply=t;set(s.key+".resp",rs);commit();},function(){TALK=false;return line(c.virtual.reply,vw,tok);});});}
      p.then(function(){sent=true;send.disabled=false;ta.value="";resp.hidden=true;$$(".gcard",list).forEach(function(x){x.classList.remove("sel");});chosen=null;fin.hidden=false;
        getSample().then(function(sm){if(sm&&s.synth&&!fin.contains(synthB))fin.insertBefore(synthB,doneB);});}).catch(function(){});});
    synthB.addEventListener("click",function(){getSample().then(function(sm){if(!sm)return;synthB.disabled=true;SPEAKER=who;TALK=true;dWho.textContent=nameOf(who);dWho.style.background=inkOf(who);dTxt.textContent="我看看……";
      var all=[{name:"你自己",items:mine}].concat(cards).map(function(c){return c.name+"：\n"+(c.items||[]).map(function(it){return s.fields.map(function(f){return f.label+"："+it[f.k];}).join("；");}).join("\n");}).join("\n\n");
      var pr=(L.ai&&L.ai.pre?L.ai.pre+"\n\n":"")+fill(s.synth)+"\n\n大家的作答：\n"+all;
      sm(pr,{modelTier:"quick",cache:false,onText:function(o){dTxt.textContent=o.text;}}).then(function(r){TALK=false;var t=(r.text||"").trim();DLOG.push({who:who,text:t});VOICE.say(who,t,"ai");set(s.key+".synth",t);logStep(s.obs,{ai:t});commit();}).catch(function(){TALK=false;dTxt.textContent="这次没看成，可以直接往下。";});});});
    doneB.addEventListener("click",function(){if(tok!==RUN.token)return rej(CANCEL);R.keys={};paintMarks();clearTask();res();});
  });});};

/* 读全文：至少读满 min 秒（只在页面开着、在前台时计时）才能往下；
   这个账号以前读完过（任何设备上），可以直接往下。可选听朗读，读到哪段亮哪段。 */
var NARR=null;
function stopNarr(){if(NARR){NARR.stop();NARR=null;}}
function narrate(btnN){var n=(TEXTS[CURTEXT]||{}).narration;if(!n)return;if(NARR){stopNarr();return;}var i=0,a=null,alive=true;btnN.textContent="停止朗读";VOICE.stop();
  function mark(k){$$("p",rbody).forEach(function(p,pi){p.classList.toggle("reading",pi===k);});var p=$$("p",rbody)[k];if(p)p.scrollIntoView({block:"center",behavior:reduce?"auto":"smooth"});}
  function nx(){if(!alive)return;if(i>=PARAS.length){end();return;}mark(i);a=new Audio(n.prefix+i+".mp3");a.playbackRate=(PREF.v&&PREF.v.rate)||1;SOUND.duck(true);a.onended=function(){i++;nx();};a.onerror=function(){i++;nx();};var p=a.play();if(p&&p.catch)p.catch(function(){end();});}
  function end(){alive=false;if(a){try{a.pause();}catch(e){}}SOUND.duck(false);mark(-1);btnN.textContent="听朗读";NARR=null;}
  NARR={stop:end};nx();}
H.read=function(s,tok){var done=!!get("read."+s.id);var need=s.min||60,sec=0;
  return new Promise(function(res,rej){clearTask();if(isNarrow())openReader();rbody.scrollTop=0;
    /* 圆圈倒计时：圈慢慢走满，中间是剩下的秒数 */
    var ring=el("div",{class:"ring",role:"timer","aria-live":"off"});ring.innerHTML='<svg viewBox="0 0 120 120" aria-hidden="true"><circle class="rg-bg" cx="60" cy="60" r="52"/><circle class="rg-fg" cx="60" cy="60" r="52" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"/></svg><div class="rg-t"><b></b><small></small></div>';
    var go=btn(done?(s.againLabel||"我读过了，往下"):(s.button||"读完了"));
    var btnN=el("button",{type:"button",class:"ghost",text:"听朗读"});btnN.addEventListener("click",function(){narrate(btnN);});
    task.append(q(s.q||"先把全文读一遍"),el("p",{class:"note",text:fill(s.note||"左边是全文。慢慢读，读满 1 分钟才能往下。")}),el("div",{class:"readrow"},[ring,el("div",{class:"row"},[go,(TEXTS[CURTEXT]||{}).narration?btnN:null])]));
    function upd(){var left=Math.max(0,Math.ceil(need-sec)),full=done||left<=0;$(".rg-fg",ring).setAttribute("stroke-dashoffset",String(full?0:100-Math.min(100,sec/need*100)));ring.classList.toggle("full",full);
      $(".rg-t b",ring).textContent=full?"✓":String(left);$(".rg-t small",ring).textContent=full?(done?"读过了":"可以往下"):"秒";go.disabled=!full;ring.setAttribute("aria-label",full?"可以往下了":"还要读 "+left+" 秒");}
    upd();var iv=setInterval(function(){if(tok!==RUN.token){clearInterval(iv);stopNarr();return;}if(document.visibilityState==="visible"&&document.hasFocus()){sec+=.25;}upd();},250);
    go.addEventListener("click",function(){if(tok!==RUN.token)return rej(CANCEL);if(go.disabled)return;clearInterval(iv);stopNarr();set("read."+s.id,{sec:Math.round(sec),at:new Date().toISOString()});logStep(s.obs,{answer:(done?"以前读过；这次":"读了")+" "+Math.round(sec)+" 秒"});commit();clearTask();closeReaderIfNarrow();res();});});};

/* 画面：课文配置提供的插图或实物（不是任务） */
H.vis=function(s){clearTask();task.classList.add("plain");task.append(L.visuals[s.name](el,fill));return Promise.resolve();};

H.openBook=function(){openBook();return Promise.resolve();};

/* ================= 第3天新增的步骤类型（以后别的课文也能用） ================= */
/* 单选：每个选项各有回应；ok:true 对、"half" 半对、false 错；对了才往下（stance:true 时任何一项都算，用来表态）。
   {t:"mc",who,ask,q,key,options:[{text,ok,reply,who,value}],obs,feedbackWho,wait} */
H.text=function(s){if(s.id!==CURTEXT)useText(s.id);return Promise.resolve();};
/* 11-09 互动场景：{t:"scene",id,title,lines:{键:{who,text}},obs}。画面和玩法在 scenes.js（window.HORA_SCENES[id]）。
   台词都写在 lines 里（录音清单从这里收）。场景里只能点、拖，做完出“继续”。 */
H.pic=function(s){clearTask();task.classList.add("plain");stepImg(s);if(s.cap)task.append(el("p",{class:"note",text:fill(s.cap)}));return Promise.resolve();};
H.scene=function(s,tok){var fn=window.HORA_SCENES&&window.HORA_SCENES[s.id];if(!fn)return Promise.resolve();
  clearTask();VOICE.stop();var ov=el("div",{id:"stage",class:"stage",role:"dialog","aria-label":fill(s.title||"场景")});
  var top=el("div",{class:"stg-top"},[el("b",{text:fill(s.title||"")}),el("span",{class:"stg-hint"})]);
  var frame=el("div",{class:"stg-frame"});var cap=el("div",{class:"stg-cap"},[el("span",{class:"stg-who"}),el("span",{class:"stg-txt"})]);var bar=el("div",{class:"stg-bar"});
  ov.append(top,frame,el("div",{class:"stg-bottom"},[cap,bar]));document.body.append(ov);document.body.classList.add("staged");
  function live(){if(tok!==RUN.token)throw CANCEL;}
  function pct(v){return v+"%";}
  var api={frame:frame,el:el,reduce:reduce,
    hint:function(t){$(".stg-hint",top).textContent=t?fill(t):"";},
    img:function(src,cls){var i=el("img",{src:src,class:"stg-img "+(cls||""),alt:"",draggable:"false"});frame.append(i);return i;},
    box:function(x,y,w,h,cls,kids){var d=el("div",{class:cls||""},kids);d.style.left=pct(x);d.style.top=pct(y);if(w!=null)d.style.width=pct(w);if(h!=null)d.style.height=pct(h);frame.append(d);return d;},
    /* 能点的人／物：x,y,w,h 按画面百分比 */
    hot:function(x,y,w,h,label,onTap){var b=el("button",{type:"button",class:"stg-hot","aria-label":label});b.style.left=pct(x);b.style.top=pct(y);b.style.width=pct(w);b.style.height=pct(h);b.addEventListener("click",function(e){e.stopPropagation();if(tok!==RUN.token)return;onTap(b);});frame.append(b);return b;},
    /* 说的话（白）／想的话（灰）气泡 */
    bubble:function(x,y,text,kind,side){var b=el("div",{class:"stg-bub "+(kind||"say")+(side?" "+side:""),text:fill(text)});b.style.left=pct(x);b.style.top=pct(y);frame.append(b);requestAnimationFrame(function(){b.classList.add("on");});return b;},
    /* 说一句台词：底下字幕＋配音；等读完（关了配音就按字数等） */
    line:function(key,o){var L0=s.lines[key];if(!L0)return Promise.resolve();return api.speak(L0.who,L0.text,o);},
    speak:function(w,t,o){live();t=fill(t);o=o||{};
      $(".stg-who",cap).textContent=w==="narr"?"":nameOf(w);$(".stg-who",cap).style.background=w==="narr"?"transparent":inkOf(w);$(".stg-txt",cap).textContent=t;cap.classList.toggle("narr",w==="narr");cap.classList.remove("in");void cap.offsetWidth;cap.classList.add("in");
      VOICE.say(w,t);var t0=Date.now(),min=o.min!=null?o.min:Math.min(2600,400+t.length*60);
      return new Promise(function(r){setTimeout(r,250);}).then(function(){return VOICE.wait();}).then(function(){var left=min-(Date.now()-t0);return left>0?new Promise(function(r){setTimeout(r,reduce?10:left);}):null;}).then(function(){live();});},
    say:function(key){return api.line(key);},
    text:function(key){var L0=s.lines[key];return L0?fill(L0.text):"";},
    wait:function(ms){return new Promise(function(r){setTimeout(r,reduce?10:ms);}).then(live);},
    button:function(label,o){o=o||{};return new Promise(function(res,rej){var b=el("button",{type:"button",class:"btn stg-go","data-auto":"1",text:fill(label)+(o.plain?"":" ▸")});bar.innerHTML="";bar.append(b);b.focus({preventScroll:true});b.addEventListener("click",function(){if(tok!==RUN.token)return rej(CANCEL);SOUND.sfx("page");bar.innerHTML="";res();});});},
    clearBar:function(){bar.innerHTML="";},
    sfx:function(t){SOUND.sfx(t);},
    get:get,set:function(k,v){set(k,v);save();},
    log:function(answer){if(s.obs){logStep(s.obs,{try:1});logStep(s.obs,{answer:answer});commit();}},
    /* 拖动：把一个元素在画面里拖来拖去；回调给出中心点（百分比） */
    drag:function(node,onMove){var on=false;function at(e){var r=frame.getBoundingClientRect();var x=(e.clientX-r.left)/r.width*100,y=(e.clientY-r.top)/r.height*100;x=Math.max(0,Math.min(100,x));y=Math.max(0,Math.min(100,y));onMove(x,y);}
      frame.addEventListener("pointerdown",function(e){if(e.target.closest(".stg-hot"))return;on=true;try{frame.setPointerCapture(e.pointerId);}catch(x){}at(e);e.preventDefault();});
      frame.addEventListener("pointermove",function(e){if(on)at(e);});["pointerup","pointercancel","pointerleave"].forEach(function(t){frame.addEventListener(t,function(){on=false;});});}
  };
  return Promise.resolve().then(function(){return fn(api,s);}).then(function(){if(s.obs&&!(S.log[s.obs.id]&&S.log[s.obs.id].answer))api.log("看完了");},function(e){throw e;}).then(function(){VOICE.stop();ov.remove();document.body.classList.remove("staged");},function(e){VOICE.stop();ov.remove();document.body.classList.remove("staged");throw e;});};
H.mc=function(s,tok){var fbWho=s.feedbackWho||lead();var pre=s.ask?say(fill(variant(s,"ask")),s.who,tok):Promise.resolve();
  return pre.then(function(){return new Promise(function(res,rej){clearTask();if(s.feedbackWho==="xiaoman")closeReaderIfNarrow();keepQ();stepImg(s);var VB=s.vis?visBox(s.vis):null;if(s.q){QP=s.paras||null;task.append(q(s.q));}var box=el("div",{class:"mc"});
    var ord=s.options.map(function(o,i){return i;});if(!s.stance&&!s.fixed)for(var z=ord.length-1;z>0;z--){var r=Math.floor(Math.random()*(z+1)),tz=ord[z];ord[z]=ord[r];ord[r]=tz;}ord.forEach(function(i){var o=s.options[i];var b=el("button",{class:"mco",type:"button",text:fill(o.text)});b.addEventListener("click",function(){if(tok!==RUN.token)return rej(CANCEL);
        logStep(s.obs,{try:1});var ok=s.stance||o.ok===true;showLoc();if(VB)VB.pick(i,ok);
        if(ok){task.classList.remove("ask");$$(".mco",box).forEach(function(x){x.disabled=true;});b.classList.add("ok");SOUND.sfx(s.stance?"page":"ok");if(VB)VB.post();if(s.key)set(s.key,o.value!=null?o.value:i);logStep(s.obs,{answer:fill(o.text)});logMe(fill(o.text));commit();
          if(!s.stance&&s.note!==false&&(s.note||s.paras||s.hl))task.append(noteChip(s,o));
          var r=o.reply?say(fill(o.reply),o.who||fbWho,tok):Promise.resolve();r.then(function(){res();},function(){});}
        else{b.classList.add(o.ok==="half"?"half":"no");b.disabled=true;SOUND.sfx("no");if(s.wrongFlag)addFlag(s.wrongFlag);logStep(s.obs,{miss:"o"+i});if(o.reply)sayQ(fill(o.reply),o.who||fbWho,tok);}});box.append(b);});
    if(s.other){var ob=el("button",{class:"mco other",type:"button",text:(s.other===true?"其他":s.other)+"：________"});ob.addEventListener("click",function(){if(tok!==RUN.token)return rej(CANCEL);
      var inp=el("input",{type:"text",placeholder:s.otherPh||"写下你自己的想法",autocomplete:"off",id:"in-other-"+(s.key||"x").replace(/\./g,"-")}),okb=btn("就是这个");var row=el("div",{class:"orow"},[inp,okb]);ob.replaceWith(row);inp.focus();
      okb.addEventListener("click",function(){var v=inp.value.trim();if(v.length<2){inp.focus();return;}$$(".mco",box).forEach(function(x){x.disabled=true;});inp.disabled=true;okb.disabled=true;SOUND.sfx("page");
        if(s.key)set(s.key,"其他："+v);logStep(s.obs,{try:1,answer:"其他："+v});logMe("其他："+v);commit();var r=s.otherReply?say(fill(s.otherReply),fbWho,tok):Promise.resolve();r.then(function(){res();},function(){});});});box.append(ob);}
    task.append(box);});}).then(function(){if(s.wait===false)return;return next(s.next||"继续",tok,!!s.keep);});};
/* 11-10 答对后提醒：把答案批注在课本上。s.note 可自写；否则用段落号 + 正确选项 */
function noteChip(s,o){var ns=s.paras||[];var where=ns.length?("第"+(ns.length>1&&ns[ns.length-1]!==ns[0]?ns[0]+"—"+ns[ns.length-1]:ns[0])+"段旁边"):"相关句子旁边";
  return el("div",{class:"notechip"},[el("b",{text:"✎ 批注到课本"}),el("span",{text:s.note?fill(s.note):("在"+where+"写："+fill(o.text))})]);}

/* 在原文里找一个字：每段算一处，找齐为止。{t:"findWord",who,ask,task,word,paras:[段号(0起)],misses:[{paras,text}],other,hint,hintAfter,found,doneText,key,obs} */
function wrapWord(id,word){var sp=$('.s[data-id="'+id+'"]',rbody);if(!sp||sp.getAttribute("data-w"))return;sp.setAttribute("data-w","1");
  var walk=document.createTreeWalker(sp,NodeFilter.SHOW_TEXT),n,list=[];while((n=walk.nextNode()))list.push(n);
  list.forEach(function(tn){var t=tn.nodeValue,i=t.indexOf(word);if(i<0)return;var frag=document.createDocumentFragment(),last=0;while(i>=0){frag.append(document.createTextNode(t.slice(last,i)),el("mark",{class:"wd",text:word}));last=i+word.length;i=t.indexOf(word,last);}frag.append(document.createTextNode(t.slice(last)));tn.parentNode.replaceChild(frag,tn);});}
H.findWord=function(s,tok){var fbWho=s.feedbackWho||lead(),got={},n=s.paras.length;
  function light(p){PSENT[p].forEach(function(i){if(SENT[i].t.indexOf(s.word)>=0){R.keys[i]=1;wrapWord(i,s.word);}});paintMarks();}
  (get(s.key)||[]).forEach(function(p){got[p]=1;light(p);});
  return say(fill(variant(s,"ask")),s.who,tok).then(function(){return new Promise(function(res,rej){clearTask();var cnt=el("div",{class:"wcount"});task.append(q(s.task),cnt,el("p",{class:"note",text:"在左边原文里点句子。"}));
    function upd(){var k=Object.keys(got).length;cnt.textContent="找到 "+k+" / "+n+" 处";}upd();
    var hintT=setTimeout(function(){if(tok===RUN.token&&Object.keys(got).length<n&&s.hint)sayQ(fill(s.hint),fbWho,tok);},(s.hintAfter||60)*1000);
    var first=true;
    function check(id){var p=SENT[id].p,t=SENT[id].t;logStep(s.obs,{try:1});
      if(s.paras.indexOf(p)>=0&&t.indexOf(s.word)>=0){if(got[p]){sayQ("这一处找过了。",fbWho,tok);return function(){};}got[p]=1;light(p);SOUND.sfx("page");upd();set(s.key,Object.keys(got).map(Number));commit();
        if(Object.keys(got).length>=n){clearTimeout(hintT);return true;}
        if(first&&s.found){first=false;sayQ(fill(s.found),s.who||fbWho,tok);}return function(){};}
      var ms=s.misses||[];for(var i=0;i<ms.length;i++){if(ms[i].paras.indexOf(p)>=0)return function(m){return function(){SOUND.sfx("no");logStep(s.obs,{miss:"p"+p});sayQ(fill(m.text),fbWho,tok);};}(ms[i]);}
      return function(){SOUND.sfx("no");logStep(s.obs,{miss:"other"});sayQ(fill(s.other||"这一句里没有要找的字。"),fbWho,tok);};}
    if(Object.keys(got).length>=n){clearTimeout(hintT);res();return;}
    pickSent(s.label||("点出“"+s.word+"”在的句子"),tok,check).then(function(){res();},rej);});})
  .then(function(){logStep(s.obs,{answer:"找齐"});if(s.doneText)return line(fill(s.doneText),s.who,tok);});};

/* 让原文某段亮起来、滚到眼前（可只亮含某个字的句子）。{t:"focus",para,has,clear} */
H.focus=function(s){if(s.clear!==false)R.keys={};PSENT[s.para].forEach(function(i){if(!s.has||SENT[i].t.indexOf(s.has)>=0)R.keys[i]=1;});paintMarks();var ids=PSENT[s.para].filter(function(i){return R.keys[i];});if(ids.length)flashSent(ids[0]);if(isNarrow())openReader();return Promise.resolve();};

/* 删除试验：把一段划掉、淡出，再把出问题的那个词标红打问号。{t:"strike",para,flag:{para,text,tag}}；{t:"unstrike"} */
function unstrike(){$$("p.struck",rbody).forEach(function(p){p.classList.remove("struck");});$$("mark.qflag",rbody).forEach(function(m){m.replaceWith(document.createTextNode(m.textContent));});}
function addFlag(f){var fp=$('p[data-p="'+f.para+'"]',rbody);if(!fp||fp.querySelector("mark.qflag"))return;var walk=document.createTreeWalker(fp,NodeFilter.SHOW_TEXT),n;while((n=walk.nextNode())){var i=n.nodeValue.indexOf(f.text);if(i>=0){var r=document.createRange();r.setStart(n,i);r.setEnd(n,i+f.text.length);var m=el("mark",{class:"qflag","data-tag":f.tag||"？"});r.surroundContents(m);m.scrollIntoView({block:"center",behavior:reduce?"auto":"smooth"});break;}}}
H.strike=function(s){var pe=$('p[data-p="'+s.para+'"]',rbody);if(pe)pe.classList.add("struck");if(isNarrow())openReader();
  if(s.flag)addFlag(s.flag);else if(pe)pe.scrollIntoView({block:"center",behavior:reduce?"auto":"smooth"});
  return Promise.resolve();};
H.unstrike=function(){unstrike();return Promise.resolve();};

/* 换词试验：在任务区显示换过词的句子，换上的词标红。{t:"swap",text,marks:[...],label} */
H.swap=function(s){clearTask();var bq=el("blockquote",{class:"quote swap"});var t=fill(s.text),parts=[t];(s.marks||[]).forEach(function(m){var out=[];parts.forEach(function(x){if(typeof x!=="string"){out.push(x);return;}var seg=x.split(m);seg.forEach(function(y,k){if(k)out.push({m:m});out.push(y);});});parts=out;});
  parts.forEach(function(x){bq.append(typeof x==="string"?document.createTextNode(x):el("mark",{class:"swapw",text:x.m}));});
  task.append(el("div",{class:"swaptag",text:s.label||"换一换"}),bq);return Promise.resolve();};

/* 对听：两版并排，各配音读一遍，可以再点着听。{t:"listen",ask,who,q,a:{who,label,text,marks},b:{…},next} */
function markedText(t,marks){var parts=[t];(marks||[]).forEach(function(m){var out=[];parts.forEach(function(x){if(typeof x!=="string"){out.push(x);return;}x.split(m).forEach(function(y,k){if(k)out.push({m:m});out.push(y);});});parts=out;});
  var d=el("div",{class:"ltext"});parts.forEach(function(x){d.append(typeof x==="string"?document.createTextNode(x):el("mark",{class:"swapw",text:x.m}));});return d;}
/* 配图：mc / listen 步骤写 img:"img/xx.webp"（可加 alt），图放在题目上面；点一下放大看 */
/* 11-10 八年级动画画面 vis：{img,zoom:[cx,cy,倍数],items:[{k:say|think|tag|stamp|card|doc|rung,x,y,w,text,post,at:"post",who,img,glyph,lines,hi,part,opt}],kind:"mountain",...}
   图慢慢推近到题目说的地方，气泡一个个冒出来；答对后 post（揭晓）：at:"post" 的出现，有 post 文字的翻面。
   opt:i ＝ 和第 i 个选项对应（答错时那个东西抖一下、变灰）。part:i ＝ frame 第 i 格写好才点亮。 */
function visBox(v){var f=el("div",{class:"vis"+(v.kind?" vis-"+v.kind:"")}),pan=el("div",{class:"vis-pan"}),lay=el("div",{class:"vis-lay"});
  if(v.img)pan.style.backgroundImage="url("+v.img+")";f.append(pan,lay);task.append(f);
  var z=v.zoom||[50,50,1],ox=z[0],oy=z[1],sc=z[2];
  function map(x,y){return [ox+sc*(x-ox),oy+sc*(y-oy)];}
  var nodes=[],k0=0;
  if(v.kind==="mountain")mountain(v,lay,nodes);
  (v.items||[]).forEach(function(it,i){var n;var P=[it.x,it.y];
    if(it.k==="card"){n=el("div",{class:"v-card"},[it.img?el("img",{src:it.img,alt:""}):el("b",{class:"v-glyph",text:it.glyph||""}),el("span",{class:"v-front",text:it.text}),it.post?el("span",{class:"v-back",text:it.post}):null]);}
    else if(it.k==="doc"){n=el("div",{class:"v-doc"},[it.title?el("b",{text:it.title}):null].concat((it.lines||[]).map(function(t,j){return el("span",{class:"v-ln"+(j===it.hi?" v-hi":""),text:t});})));}
    else if(it.k==="pic"){n=el("img",{class:"v-pic",src:it.img,alt:""});}
    else if(it.k==="rung"){n=el("div",{class:"v-rung"},[it.img?el("img",{src:it.img,alt:""}):el("b",{class:"v-glyph",text:it.glyph||""}),el("span",{text:it.text})]);}
    else{n=el("div",{class:"v-"+it.k+(it.k==="say"||it.k==="think"?" v-bub":""),text:it.text});if(it.post)n.dataset.post=it.post;}
    n.style.left=P[0]+"%";n.style.top=P[1]+"%";if(it.w)n.style.width=it.w+"%";if(it.side==="r")n.classList.add("r");
    n.classList.add("v-it");if(it.part!=null)n.classList.add("v-dim");lay.append(n);nodes.push({n:n,it:it});
    if(it.at!=="post"){var d=(v.zoom?1100:250)+(k0++)*(it.gap||650);setTimeout(function(){n.classList.add("in");},reduce?0:d);}});
  requestAnimationFrame(function(){requestAnimationFrame(function(){if(v.zoom){pan.style.transformOrigin=ox+"% "+oy+"%";pan.style.transform="scale("+sc+")";}f.classList.add("go");});});
  var done=false;
  return {post:function(){if(done)return;done=true;f.classList.add("post");nodes.forEach(function(o,j){var it=o.it;if(it.at==="post")setTimeout(function(){o.n.classList.add("in");},reduce?0:250+j*120);if(it.post){setTimeout(function(){o.n.classList.add("flip");if(o.n.dataset.post!=null)o.n.textContent=o.n.dataset.post;},reduce?0:300+j*260);}});},
    pick:function(i,ok){nodes.forEach(function(o){if(o.it.opt===i){o.n.classList.remove("shake");void o.n.offsetWidth;o.n.classList.add(ok?"hit":"shake");if(!ok)o.n.classList.add("miss");}});},
    lit:function(i,on){nodes.forEach(function(o){if(o.it.part===i){o.n.classList.toggle("v-dim",!on);if(on)o.n.classList.add("in");}});var all=nodes.filter(function(o){return o.it.part!=null;});if(all.length&&all.every(function(o){return !o.n.classList.contains("v-dim");}))this.post();}};}
/* 情节山：横轴是段落，纵轴是“推得多高”；每部分一级台阶往上，转折后落下 */
function mountain(v,lay,nodes){var N=v.n||37,parts=v.parts||[],W=100,Hh=100;function X(p){return 4+92*(p-1)/(N-1);}
  var pts=[];parts.forEach(function(pt){pts.push([X(pt.a),pt.h]);pts.push([X(pt.b),pt.h]);});
  var d="M"+pts.map(function(q){return q[0].toFixed(1)+" "+(92-q[1]*0.8).toFixed(1);}).join(" L");
  var svg='<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path class="mt-line" d="'+d+'" pathLength="100"/>'+(v.after?'<path class="mt-after" d="M'+X(v.after.a).toFixed(1)+' '+(92-v.after.h0*0.8).toFixed(1)+' L'+X(v.after.b).toFixed(1)+' '+(92-v.after.h1*0.8).toFixed(1)+'" pathLength="100"/>':'')+'</svg>';
  var box=el("div",{class:"mt",html:svg});lay.append(box);
  parts.forEach(function(pt,i){var lb=el("div",{class:"v-it mt-lb",text:pt.label});lb.style.left=X((pt.a+pt.b)/2)+"%";lb.style.top=(92-pt.h*0.8+3)+"%";lay.append(lb);setTimeout(function(){lb.classList.add("in");},reduce?0:400+i*380);});
  (v.flags||[]).forEach(function(fl){var n=el("div",{class:"v-it mt-flag",text:fl.text});var hh=fl.h!=null?fl.h:50;n.style.left=X(fl.p)+"%";n.style.top=(92-hh*0.8-14)+"%";lay.append(n);nodes.push({n:n,it:{opt:fl.opt,at:"pre"}});setTimeout(function(){n.classList.add("in");},reduce?0:2700);});}
/* 分层做完：我的 / 参考 两条色带 */
function strips(mine,ref,info){var N=PARAS.length,wrap=el("div",{class:"strips"});
  function row(label,rs,names){var r=el("div",{class:"strip"},[el("span",{class:"sl",text:label})]),bar=el("div",{class:"sb"});rs.forEach(function(x,i){var a=x[0],b=x[x.length-1];var c=el("i",{title:names[i]||"",text:names[i]||""});c.style.flex=(b-a+1)+" 1 0";c.style.setProperty("--d",(i*0.18)+"s");c.style.setProperty("--h",(i*47%360));bar.append(c);});r.append(bar);return r;}
  var m=mine.map(function(x){return [x[0]+1,x[1]+1];}),mc=m.slice(0,-1).map(function(x){return x[1];}),rc=ref.slice(0,-1).map(function(x){return x[x.length-1];});
  wrap.append(row("我的",m,info.map(function(x){return x.sum;})),row("参考",ref,[]));
  var marks=el("div",{class:"sb sm"});rc.forEach(function(c){var t=el("b",{class:mc.indexOf(c)>=0?"same":"diff",text:mc.indexOf(c)>=0?"✓":""});t.style.left=(c/N*100)+"%";marks.append(t);});wrap.append(el("div",{class:"strip"},[el("span",{class:"sl",text:""}),marks]));return wrap;}
function stepImg(s){if(!s.img)return;var f=el("figure",{class:"simg"});var im=el("img",{src:s.img,alt:s.alt||"",draggable:"false"});f.append(im);f.addEventListener("click",function(){var ov=el("div",{class:"simg-big"});ov.append(el("img",{src:s.img,alt:s.alt||""}));ov.addEventListener("click",function(){ov.remove();});document.body.append(ov);});task.append(f);}
H.listen=function(s,tok){var pre=s.ask?say(fill(s.ask),s.who||lead(),tok):Promise.resolve();
  return pre.then(function(){clearTask();closeReaderIfNarrow();var box=el("div",{class:"listen"}),cards=[];
    [s.a,s.b].forEach(function(x,i){var c=el("div",{class:"lcard"+(i?" lb":" la")});var pb=el("button",{class:"lplay",type:"button",text:"▶ 再听一遍"});pb.disabled=true;
      pb.addEventListener("click",function(){if(tok!==RUN.token)return;cards.forEach(function(k){k.classList.remove("on");});c.classList.add("on");sayQ(fill(x.text),x.who,tok);});
      c.append(el("div",{class:"ltag",text:x.label||(i?"改过的":"原文")}),markedText(fill(x.text),x.marks),pb);cards.push(c);box.append(c);});
    keepQ();stepImg(s);task.append(el("div",{class:"task-q",text:fill(s.q||"听一听：两版读起来有什么不一样？")}),box);
    function play(i){cards.forEach(function(k){k.classList.remove("on");});cards[i].classList.add("on");var x=i?s.b:s.a;return (FULL=true,say)(fill(x.text),x.who,tok);}
    return play(0).then(function(){return play(1);}).then(function(){cards.forEach(function(k){k.classList.remove("on");$(".lplay",k).disabled=false;});return next(s.next||"听好了",tok,true);});});};

/* 五页日历条：做完一处盖一枚心情章、写上比喻；最后变成结构图。{t:"cal5",op:"show"|"stamp"|"map",page,mood,fig}  页上的内容存在 S.data.d3.cal */
function cal5El(){var c=$("#cal5");if(!c){c=el("div",{class:"cal5",id:"cal5"});task.parentNode.insertBefore(c,task);}return c;}
function paintCal5(){var c=cal5El(),st=get("d3.cal")||{},P=L.cal5||{pages:[]};c.innerHTML="";
  if(st.map&&P.map){var ol=el("ol",{class:"c5map"});P.map.forEach(function(m){ol.append(el("li",{class:m.k?"k-"+m.k:""},[el("b",{text:m.t}),el("span",{text:m.s})]));});c.append(el("div",{class:"c5h",text:"全文结构"}),ol);return;}
  var row=el("div",{class:"c5row"});P.pages.forEach(function(pg,i){var d=st[i+1];row.append(el("div",{class:"c5p"+(d?" on":"")},[el("small",{text:pg.label}),el("b",{class:"c5m",text:d?d.mood:"？"}),el("span",{class:"c5f",text:d?d.fig:""})]));});c.append(row);}
H.cal5=function(s){var st=get("d3.cal")||{};if(s.op==="stamp"){st[s.page]={mood:s.mood,fig:s.fig||""};set("d3.cal",st);commit();SOUND.sfx("ok");}else if(s.op==="map"){st.map=1;set("d3.cal",st);commit();}else if(s.op==="hide"){var c=$("#cal5");if(c)c.remove();return Promise.resolve();}paintCal5();return Promise.resolve();};

/* 句框写作：几个空连成一句话。{t:"frame",key,q,example,parts:[{label,ph,min}],nudge:{field,re,text,who},replies:[{field,re,text,who}],button,obs} */
H.frame=function(s,tok){return new Promise(function(res,rej){clearTask();var VB=s.vis?visBox(s.vis):null;if(s.q)task.append(q(s.q));if(s.example)task.append(el("div",{class:"banner",html:fill(s.example)}));
  var old=get(s.key)||{},ins=[];s.parts.forEach(function(pt,i){var inp=el("input",{type:"text",id:"in-"+s.key.replace(/\./g,"-")+"-"+i,placeholder:fill(pt.ph||""),autocomplete:"off"});inp.value=old["p"+i]||"";ins.push(inp);if(VB){var lt=function(){VB.lit(i,inp.value.trim().length>=(pt.min||1));};inp.addEventListener("input",lt);setTimeout(lt,0);}task.append(el("label",{class:"fr"},[el("span",{class:"frl",text:fill(pt.label)}),inp]));});
  var b=btn(s.button||"写好了");task.append(el("div",{class:"row"},[b]));ins[0].focus();var nudged=false;
  b.addEventListener("click",function(){if(tok!==RUN.token)return rej(CANCEL);var v={};for(var i=0;i<ins.length;i++){var x=ins[i].value.trim();if(x.replace(/[，。！？、\s]/g,"").length<(s.parts[i].min||1)){ins[i].focus();sayQ(s.parts[i].short||"这一空再多写几个字。",coach(),tok);return;}v["p"+i]=x;}
    var nd=s.nudge;if(nd&&!nudged&&!new RegExp(nd.re).test(v["p"+nd.field])){nudged=true;logStep(s.obs,{miss:"nudge"});sayQ(fill(nd.text),nd.who||lead(),tok);return;}
    var whole=s.join==="plain"?s.parts.map(function(pt,i){return v["p"+i].trim();}).join(""):s.parts.map(function(pt,i){var t=v["p"+i].replace(/[，,。.！!？?；;]+$/,"");return fill(pt.label).replace(/[:：]\s*$/,"：")+t;}).join("。")+"。";v.text=whole;set(s.key,v);logStep(s.obs,{try:1,answer:whole});commit();res(v);});})
  .then(function(v){logMe(v.text);var rs=s.replies||[];for(var i=0;i<rs.length;i++){var r=rs[i];if(!r.re||new RegExp(r.re).test(v["p"+(r.field||0)]))return line(fill(r.text),r.who||s.who,tok);}});};

function runSteps(steps,tok){return steps.reduce(function(p,s,i){return p.then(function(){if(tok!==RUN.token)throw CANCEL;if(s.when){var wv=get(s.when.key);if(s.when.is!=null?wv!==s.when.is:!wv)return;}var h=H[s.t];locStep(s);if(!h)throw new Error("未知步骤类型："+s.t);NEXT=steps[i+1]?steps[i+1].t:"end";return h(s,tok);});},Promise.resolve());}

/* ================= 天、环节、老师模式 ================= */
var DAYS=L.days;
/* 作业讲评：lesson 的 reviews 接在天数后面，不在“第几天”条里出现；交了那一天的作业才能打开 */
(L.reviews||[]).forEach(function(r){if(!DAYS.some(function(d){return d.reviewOf===r.reviewOf;}))DAYS.push(Object.assign({hidden:true},r));});
var PG=L.practice?(L.practice.groups||[{days:L.days.map(function(d,i){return i+1;})}]):[];
function pgTitle(gi){var g=PG[gi]||{days:[]},a=g.days[0],b=g.days[g.days.length-1];return "第"+(a===b?a:a+"–"+b)+"天练习";}
if(L.practice&&!DAYS.some(function(d){return d.practice;}))PG.forEach(function(g,gi){DAYS.push({hidden:true,practice:true,pg:gi,title:pgTitle(gi),short:"练习",end:"这一组练习做完了。",beats:[{title:"基础检测",steps:[]}]});});
var NVIS=DAYS.filter(function(d){return !d.hidden;}).length;
/* 练习：每两天一组（lesson 的 practice.groups）。基础检测 ＋ 这一组里自己错过的原题再做 ＋ 每道错题一道相似的新题。每次打开按当下的作答记录重新挑 */
var STEPOF={};
function practiceIdx(gi){for(var i=0;i<DAYS.length;i++)if(DAYS[i].practice&&(gi==null||DAYS[i].pg===gi))return i+1;return 0;}
function pgOf(day){for(var i=0;i<PG.length;i++)if(PG[i].days.indexOf(day)>=0)return i;return -1;}
function dayReached(n){var d=DAYS[n-1];return !!(S.done[n]||(d&&((S.reach||{})[n]||0)>=d.beats.length-1));}
/* 一组练习：读完这一组的最后一天（或者已经读完后面的天）就开放 */
function pgOpen(gi){var g=PG[gi];if(!g)return false;if(TMODE)return true;if(!L.practiceOpen)return false;var last=g.days[g.days.length-1];for(var n=last;n<=NVIS;n++)if(dayReached(n))return true;return false;}
function pgCur(){var base=S.day<=NVIS?S.day:S.retDay;if(!base||base>NVIS){base=1;for(var k=1;k<=NVIS;k++)if(dayReached(k)||(S.beat&&S.beat[k]!=null))base=k;}var gi=pgOf(base);if(gi<0)gi=0;for(var k=gi;k>=0;k--)if(pgOpen(k))return k;return gi;}
function cloneStep(st,obs){var c=JSON.parse(JSON.stringify(st));delete c.day;delete c.wait;delete c.feedbackWho;delete c.wrongFlag;delete c.ask;delete c.who;delete c.key;(c.options||[]).forEach(function(o){delete o.who;});c.obs=obs;return c;}
function buildPractice(gi){var P=L.practice||{},g=PG[gi]||{days:[]},inG=function(n){return g.days.indexOf(n)>=0;},two=g.days.length>1;
  var cur="main",tx=function(arr,day){var w=PTXT(day);if(w!==cur){arr.push({t:"text",id:w});cur=w;}};var core=[{t:"text",id:PTXT(g.days[0])}];cur=core[0].id;(P.core||[]).filter(function(c){return inG(c.day);}).forEach(function(c){tx(core,c.day);core.push(cloneStep(c,c.obs));});
  var mine=[],n=0;cur="?";OBSORDER.forEach(function(id){if(n>=10)return;var o=OBS[id],r=S.log[id];if(!o||!tGrad(o)||!inG(o.src||o.day)||!r||!tMiss(r))return;var V=(P.variants||{})[id];if(!V)return;if(tFirst(S.log["pv-"+id]))return;n++;
    tx(mine,o.src||o.day);var st=STEPOF[id];if(st&&(st.t==="mc"||st.t==="ask")&&!/db/.test(id)){var cs=cloneStep(st,{id:"px-"+id,label:"重做："+o.label,skill:o.skill});delete cs.say;cs.q="（"+(o.src?"第"+o.src+"天基础检测":"第"+o.day+"天原题")+" · "+o.label+"）"+fill(cs.q||"");mine.push(cs);}
    mine.push(cloneStep(V,{id:"pv-"+id,label:"新题："+o.label,skill:o.skill}));});
  var beats=[{title:"基础检测",mood:"focus",steps:[{t:"say",who:L.cast.lead,text:"这是"+pgTitle(gi)+"。先做基础检测，人人都要做；再做你在这"+(two?"两":"一")+"天错过的题，每道后面跟一道相似的新题。"}].concat(core)}];
  beats.push({title:"旧题和新题",mood:"focus",steps:mine.length?[{t:"say",who:L.cast.lead,text:"下面是你自己错过的题。先把原题再做一次，再做一道相似的新题。"}].concat(mine):[{t:"say",who:L.cast.lead,text:"这"+(two?"两":"一")+"天你没有错过的题。基础检测做完，这一组练习就完成了。"}]});
  var idx=practiceIdx(gi);beats.forEach(function(b){b.steps.forEach(function(st){regObs(st,idx);});});return beats;}
function openPractice(gi){if(typeof gi!=="number")gi=pgCur();var n=practiceIdx(gi);if(!n||!pgOpen(gi))return;closeOv();if(S.day<=NVIS)S.retDay=S.day;DAYS[n-1].beats=buildPractice(gi);DAYS[n-1]._built=1;S.done[n]=0;startDay(n,false);}
/* 练习目录：每一组一行，开放的可以点 */
function pxStat(gi){var n=practiceIdx(gi),ok=0,g=0;OBSORDER.forEach(function(id){var o=OBS[id],r=S.log[id];if(o.day!==n||!r||r.answer==null)return;g++;if(!tMiss(r))ok++;});return {done:!!S.done[n],ok:ok,g:g};}
function openPxMenu(){var o=hwOv(),sh=$("#hwSheet");sh.innerHTML="";var x=el("button",{class:"ghost x",type:"button",text:"关上"});x.addEventListener("click",closeOv);sh.append(x,el("h3",{text:"练习"}),el("p",{class:"hwnote",text:"每两天一组。读完这一组的最后一天，这组练习就开放：基础检测人人都做，再加你自己错过的旧题和相似的新题。"}));
  var cur=pgCur(),ul=el("div",{class:"pxlist"});PG.forEach(function(g,gi){var open=pgOpen(gi),st=pxStat(gi),last=g.days[g.days.length-1];var b=el("button",{class:"pxrow"+(open?"":" lock")+(gi===cur?" cur":""),type:"button"},[el("b",{text:pgTitle(gi)}),el("span",{text:!open?"读完第"+last+"天后开放":st.done?"做完了 · 对 "+st.ok+"/"+st.g+" · 可以再练":st.g?"做了一半":"可以做了"})]);if(open)b.addEventListener("click",function(){openPractice(gi);});else b.disabled=true;ul.append(b);});sh.append(ul);o.hidden=false;}
function reviewIdx(day){for(var i=0;i<DAYS.length;i++)if(DAYS[i].reviewOf===day)return i+1;return 0;}
function openReview(day){var n=reviewIdx(day);if(!n)return;if(!hwOf(day)){openHw(day);return;}closeOv();S.retDay=S.day>NVIS?(S.retDay||1):S.day;startDay(n,false);}
DAYS.forEach(function(d,di){d.beats.forEach(function(b){b.steps.forEach(function(s){if(s.obs)STEPOF[s.obs.id]=s;regObs(s,di+1);});});});
(function(){var P=L.practice||{};if(!practiceIdx())return;PG.forEach(function(g,gi){var idx=practiceIdx(gi),inG=function(d){return g.days.indexOf(d)>=0;};(P.core||[]).forEach(function(c){if(inG(c.day)){regObs(c,idx);if(c.obs){STEPOF[c.obs.id]=c;if(OBS[c.obs.id])OBS[c.obs.id].src=c.day;}}});Object.keys(P.variants||{}).forEach(function(id){var o=STEPOF[id]&&STEPOF[id].obs,od=OBS[id]&&(OBS[id].src||OBS[id].day);if(P.variants[id]&&o&&inG(od)){regObs({t:STEPOF[id].t,obs:{id:"px-"+id,label:"重做："+o.label,skill:o.skill||""},options:STEPOF[id].options},idx);regObs({t:P.variants[id].t||"mc",obs:{id:"pv-"+id,label:"新题："+o.label,skill:o.skill||""},options:P.variants[id].options},idx);}});});})();
var TMODE=false;
function paintDays(){var nav=$("#days");nav.innerHTML="";setTimeout(paintPx,0);DAYS.forEach(function(d,i){var n=i+1;if(d.hidden)return;var b=el("button",{class:"dpad"+(S.done[n]?" done":""),type:"button","aria-current":String(n===S.day),title:d.title},[el("small",{text:"第"}),el("b",{text:String(n)}),el("small",{text:"天"}),el("span",{text:S.done[n]?"读完":d.short||""})]);b.addEventListener("click",function(){startDay(n,false);});nav.append(b);});
  if(L.totalDays&&L.totalDays>NVIS)nav.append(el("span",{class:"more",text:"共 "+L.totalDays+" 天，已开放 "+NVIS+" 天"}));}
/* 环节条：做到过的环节（红色）都能点回去重看、重做；还没做到的要按顺序来（老师模式都能点） */
function paintStages(n,cur){var nav=$("#stages");nav.innerHTML="";var reach=Math.max((S.reach||{})[n]||0,cur||0);DAYS[n-1].beats.forEach(function(b,i){var open=TMODE||S.done[n]||i<=reach;var c=el("button",{class:"st"+(i===cur?" on":"")+(i<cur||S.done[n]||i<reach?" done":"")+(open?"":" lock"),type:"button","aria-current":String(i===cur),title:open?"点一下到这个环节":"先做完前面的环节"},[el("i",{"aria-hidden":"true"}),b.title]);c.addEventListener("click",function(){if(open&&i!==cur)runFrom(n,i);});nav.append(c);});
  var b=DAYS[n-1].beats[cur];$("#stTitle").textContent=b?b.title:(DAYS[n-1].title);$("#stWhen").textContent=(DAYS[n-1].hidden?"":"第 "+n+" 天 · ")+DAYS[n-1].title+(b?" · 环节 "+(cur+1)+"/"+DAYS[n-1].beats.length:"");}
function setTMode(on){setTimeout(paintPx,0);TMODE=on;app.classList.toggle("tmode",on);$("#bTMode").setAttribute("aria-pressed",String(on));bSkip.hidden=!on;}
$("#bTMode").addEventListener("click",function(){setTMode(!TMODE);});
bSkip.addEventListener("click",function(){var n=S.day,i=(S.beat[n]||0)+1;runFrom(n,i);});
function startDay(n,resume){var dd=DAYS[n-1];if(dd&&dd.reviewOf&&!hwOf(dd.reviewOf)&&!TMODE){openHw(dd.reviewOf);return;}S.day=n;if(!resume)S.beat[n]=0;save();paintDays();runFrom(n,S.beat[n]||0);}
function resetUI(){KEEPQ=null;unstrike();unmaskParas();var c5=$("#cal5");if(c5)c5.remove();VOICE.stop();stopNarr();R.onPick=null;R.onMark=null;R.onCut=null;R.picks={};R.keys={};R.marks={};R.cuts={};setMode("none");clearTask();closePop();paintMarks();bCont.hidden=true;app.classList.remove("hush");bChat.disabled=false;TALK=false;}
/* 背景画：lesson 写 bg（默认），某天 / 某个环节也可以写 bg；淡淡铺在整个页面后面，换环节时渐变 */
function setBg(src){var d=$("#scenebg");if(!d){d=el("div",{id:"scenebg","aria-hidden":"true"});document.body.prepend(d);}if(!src){d.classList.remove("on");d.dataset.src="";return;}if(d.dataset.src===src)return;d.dataset.src=src;var im=new Image();im.onload=function(){if(d.dataset.src!==src)return;d.classList.remove("on");setTimeout(function(){d.style.backgroundImage='url("'+src+'")';d.classList.add("on");},d.style.backgroundImage?450:0);};im.src=src;}
function runFrom(n,b){var dP=DAYS[n-1];if(dP&&dP.practice&&!dP._built){if(!pgOpen(dP.pg)&&!TMODE){n=Math.min(S.retDay||1,NVIS);b=S.beat[n]||0;S.day=n;dP=null;}else{dP.beats=buildPractice(dP.pg);dP._built=1;if(b>=dP.beats.length)b=0;}}RUN.token++;var tok=RUN.token;resetUI();GUEST.who="";if(!S.data.name&&BK.tpw&&!BK.me)S.data.name="老师";var wantT=DAYS[n-1].text||"main";if(wantT!==CURTEXT)useText(wantT);
  var beats=DAYS[n-1].beats;(function loop(i){if(tok!==RUN.token)return;if(i>=beats.length){S.done[n]=1;setTimeout(paintHw,0);S.beat[n]=beats.length;commit();paintDays();paintStages(n,beats.length);endOfDay(n,tok);return;}S.beat[n]=i;S.reach=S.reach||{};if(!(S.reach[n]>=i))S.reach[n]=i;save();paintStages(n,i);clearTask();bCont.hidden=true;unmaskParas();var bt=beats[i];GUEST.who="";setBg(bt.bg||DAYS[n-1].bg||L.bg);try{var strs=[];JSON.stringify(bt.steps,function(k,v){if(typeof v==="string")strs.push(v);return v;});if(beats[i+1])JSON.stringify(beats[i+1].steps,function(k,v){if(typeof v==="string")strs.push(v);return v;});VOICE.warm(strs);}catch(e){}SOUND.mood(bt.mood||(L.sound&&L.sound.mood)||"calm");
    if(bt.skipIf&&get(bt.skipIf)&&!TMODE){loop(i+1);return;}
    runSteps(bt.steps,tok).then(function(){loop(i+1);}).catch(function(e){if(e!==CANCEL)console.error(e);});})(b);}
function endOfDay(n,tok){clearTask();var d=DAYS[n-1],last=n===NVIS;
  if(d.practice){$("#stTitle").textContent="练习做完了";say(fill(d.end||"练习做完了。"),lead(),tok).then(function(){var r=el("div",{class:"row"}),b1=btn("再练一次");b1.addEventListener("click",function(){openPractice(d.pg);});var bb=el("button",{class:"ghost",type:"button",text:"回到第"+(S.retDay||1)+"天"});bb.addEventListener("click",function(){startDay(Math.min(S.retDay||1,NVIS),true);});r.append(b1,bb);task.append(r);}).catch(function(){});return;}
  if(d.hidden){$("#stTitle").textContent="讲评完了";say(fill(d.end||"讲评完了。"),d.endWho||lead(),tok).then(function(){var r=el("div",{class:"row"}),bh=btn("补交第"+d.reviewOf+"天的作业");bh.addEventListener("click",function(){openHw(d.reviewOf);});var bb=el("button",{class:"ghost",type:"button",text:"回到第"+(S.retDay||d.reviewOf+1)+"天"});bb.addEventListener("click",function(){startDay(Math.min(S.retDay||d.reviewOf+1,NVIS),true);});r.append(bh,bb);task.append(r);}).catch(function(){});return;}$("#stTitle").textContent=last?"读完了":"今天读完了";
  say(fill(d.end||(last?"读完了。":"第"+n+"天读完了。下次见。")),d.endWho||lead(),tok).then(function(){if(d.after)task.append(el("div",{class:"banner",html:fill(d.after)}));var r=el("div",{class:"row"});if(hwList().some(function(h){return h.day===n;})){var bh=btn("交第"+n+"天的作业");bh.addEventListener("click",function(){openHw(n);});r.append(bh);}var pgi=pgOf(n);if(pgi>=0&&PG[pgi].days[PG[pgi].days.length-1]===n&&pgOpen(pgi)){var bx=btn("做"+pgTitle(pgi));bx.addEventListener("click",function(){openPractice(pgi);});r.append(bx);}var b1=btn("打开"+L.notebook.button);b1.addEventListener("click",openBook);r.append(b1);
    if(!last){var b2=el("button",{class:"ghost",type:"button",text:"去第"+(n+1)+"天"});b2.addEventListener("click",function(){startDay(n+1,false);});r.append(b2);}
    var b3=el("button",{class:"ghost",type:"button",text:"这一天从头再来"});b3.addEventListener("click",function(){startDay(n,false);});r.append(b3);task.append(r);}).catch(function(){});}

/* ================= 聊一聊（AI，可选） ================= */
var chatEl=null,CH={},chatWho=null,chatCtl=null;
function chatWhoList(){return C.left.concat(C.right).filter(function(w){return w!=="me"&&L.cast.sys&&L.cast.sys[w];});}
function openChat(who){if(bChat.disabled)return;who=who||(SPEAKER&&SPEAKER!=="me"&&L.cast.sys[SPEAKER]?SPEAKER:chatWhoList()[0]);
  if(!chatEl){chatEl=el("div",{class:"chat",role:"dialog","aria-label":"聊一聊"});chatEl.innerHTML='<div class="chat-h"><div class="seg" role="group" aria-label="和谁聊"></div><span class="sp"></span><button type="button" class="dbtn" data-x>关上</button></div><div class="chat-b" aria-live="polite"></div><div class="chat-f"><textarea id="in-chat" rows="2" placeholder="想问什么就问"></textarea><button type="button" class="btn">问</button></div>';document.body.append(chatEl);
    chatWhoList().forEach(function(w){var b=el("button",{type:"button","data-w":w,text:PEOPLE[w].name});b.addEventListener("click",function(){chatWho=w;paintChat();});$(".seg",chatEl).append(b);});
    $("[data-x]",chatEl).addEventListener("click",function(){if(chatCtl)chatCtl.abort();chatEl.hidden=true;});
    var ta=$("textarea",chatEl);$(".chat-f .btn",chatEl).addEventListener("click",sendChat);ta.addEventListener("keydown",function(e){if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendChat();}});}
  chatWho=who;chatEl.hidden=false;paintChat();$("textarea",chatEl).focus();}
function paintChat(){$$(".seg button",chatEl).forEach(function(b){b.setAttribute("aria-pressed",String(b.getAttribute("data-w")===chatWho));});var body=$(".chat-b",chatEl);body.innerHTML="";var h=CH[chatWho]||[];
  if(!h.length)body.append(el("div",{class:"cm sys",text:L.cast.hello&&L.cast.hello[chatWho]||("和"+PEOPLE[chatWho].name+"聊聊这篇文章。")}));
  h.forEach(function(m){body.append(el("div",{class:"cm "+(m.role==="user"?"u":"a"),text:m.content}));});body.scrollTop=body.scrollHeight;}
function sendChat(){var ta=$("textarea",chatEl),v=ta.value.trim();if(!v||chatCtl||!SAMPLE)return;var who=chatWho;CH[who]=CH[who]||[];CH[who].push({role:"user",content:v});ta.value="";paintChat();
  var body=$(".chat-b",chatEl),out=el("div",{class:"cm a",text:"……"});body.append(out);body.scrollTop=body.scrollHeight;
  var beat=(DAYS[S.day-1].beats[S.beat[S.day]||0]||{}).title||"";
  var rules=L.cast.sys[who]+"\n\n课文全文：\n"+PARAS.join("\n")+"\n\n学生现在在做：第"+S.day+"天「"+DAYS[S.day-1].title+"」的环节「"+beat+"」。学生的名字是"+(S.data.name||"（没写）")+"。";
  chatCtl=new AbortController();
  SAMPLE([{role:"user",content:rules}].concat(CH[who].slice(-10)),{signal:chatCtl.signal,modelTier:"quick",cache:false,onText:function(o){out.textContent=o.text;body.scrollTop=body.scrollHeight;}})
  .then(function(r){var a=(r.text||"").trim();out.textContent=a;CH[who].push({role:"assistant",content:a});S.chats=(S.chats||[]);S.chats.push({who:who,q:v,a:a,day:S.day,beat:beat,at:new Date().toISOString()});commit();})
  .catch(function(e){CH[who].pop();out.className="cm sys";out.textContent=e&&e.code==="rate_limited"?"现在问的人太多，等一会儿再问。":e&&e.code==="cancelled"?"已停止。":"这次没问成，可以再问一次，或者举手问老师。";})
  .then(function(){chatCtl=null;});}
bChat.addEventListener("click",function(){openChat();});

/* ================= 回看、学生的本子 ================= */
function closeOv(){$$(".ov").forEach(function(o){o.hidden=true;});}
$$(".ov").forEach(function(o){o.addEventListener("click",function(e){if(e.target===o)closeOv();});});
addEventListener("keydown",function(e){if(e.key==="Escape"){closeOv();if(chatEl)chatEl.hidden=true;}});
(function(){var t=$(".tools");if(!t||$("#bHw"))return;var b=el("button",{class:"tbtn",type:"button",id:"bHw",text:"作业"});b.addEventListener("click",function(){openHw();});var bk=$("#bBook");if(bk&&bk.parentNode===t)t.insertBefore(b,bk);else t.append(b);
  if(L.practice){var bp=el("button",{class:"tbtn",type:"button",id:"bPx",text:"练习"});bp.addEventListener("click",openPxMenu);t.insertBefore(bp,b);}})();
$("#bLog").addEventListener("click",function(){var sh=$("#logSheet");sh.innerHTML="";var x=el("button",{class:"ghost x",type:"button",text:"关上"});x.addEventListener("click",closeOv);sh.append(x,el("h3",{text:"刚才说过的话"}));DLOG.slice(-60).forEach(function(m){sh.append(el("p",{},[el("b",{text:nameOf(m.who)}),m.text]));});$("#ovLog").hidden=false;x.focus();});
/* ================= 作业：清单、提醒、交作业（打字或拍照） =================
   每天的 after 里写着“课后作业”；读完那一天就算布置了。交了的存在 S.data.hw[天]={text,photos,at}；
   照片先在本机压小，再一张张传到老师的云端硬盘（表格程序 hw_photo），最后整份交到表格的“作业”页（hw）。 */
function hwList(){var out=[];DAYS.forEach(function(d,i){if(!d.after||!/课后作业/.test(d.after))return;var parts=String(d.after).replace(/<b>课后作业<\/b>(<br>)?/,"").split(/<br\s*\/?>/).map(function(x){return x.replace(/<[^>]+>/g,"").trim();}).filter(Boolean);out.push({day:i+1,title:d.title,items:parts});});return out;}
var HWST={};
function hwFlag(n){var o=HWST[n];return o&&o.status?o:null;}
function loadHwSt(){if(BK.mode!=="sheet"||!BK.me)return;api("hw_status",cred()).then(function(j){HWST={};(j.rows||[]).forEach(function(r){HWST[r.day]=r;});paintHw();}).catch(function(){});}
function hwOf(n){return ((S.data&&S.data.hw)||{})[n]||null;}
function hwDue(){return hwList().filter(function(h){return S.done[h.day]&&!hwOf(h.day);});}
function paintPx(){var b=$("#bPx");if(!b)return;b.hidden=!(L.practiceOpen||TMODE);var gi=pgCur(),fresh=pgOpen(gi)&&!S.done[practiceIdx(gi)];b.textContent=pgTitle(gi)+(PG.length>1?" ▾":"");b.classList.toggle("due",!!fresh);}
function paintHw(){paintPx();var b=$("#bHw");var n=hwDue().length,fl=Object.keys(HWST).filter(function(k){return hwFlag(k);});if(b){b.textContent=(fl.length?"⚠️ ":"")+(n?"作业（"+n+" 份没交）":"作业");b.classList.toggle("due",n>0);b.classList.toggle("warn",fl.length>0);b.title=fl.length?"AI 辅助作答警告：第"+fl.join("、")+"天的作业":"";}try{if(KEY)localStorage.setItem("hora-hwdue-"+KEY.replace(/^hora-/,""),JSON.stringify({due:n,days:hwDue().map(function(h){return h.day;}),at:Date.now()}));}catch(e){}}
function shrinkImg(file){return new Promise(function(res,rej){var fr=new FileReader();fr.onerror=rej;fr.onload=function(){var im=new Image();im.onerror=rej;im.onload=function(){var M=1600,sc=Math.min(1,M/Math.max(im.width,im.height)),c=document.createElement("canvas");c.width=Math.round(im.width*sc);c.height=Math.round(im.height*sc);c.getContext("2d").drawImage(im,0,0,c.width,c.height);res(c.toDataURL("image/jpeg",.8));};im.src=fr.result;};fr.readAsDataURL(file);});}
function hwOv(){var o=$("#ovHw");if(!o){o=el("div",{class:"ov",id:"ovHw",hidden:""},[el("div",{class:"sheet hw",role:"dialog","aria-label":"作业",id:"hwSheet"})]);o.addEventListener("click",function(e){if(e.target===o)closeOv();});document.body.append(o);}return o;}
function openHw(focusDay){var o=hwOv(),sh=$("#hwSheet");sh.innerHTML="";var x=el("button",{class:"ghost x",type:"button",text:"关上"});x.addEventListener("click",closeOv);
  sh.append(x,el("h3",{text:"作业"}),el("p",{class:"note",style:"margin:0 0 6px",text:"读完一天，那一天的作业就布置下来了。写在课本、作文本上的，拍照交；也可以直接打字交。交了还能再交，会换成新的。"}));
  var list=hwList(),cards={};
  list.forEach(function(h){var given=S.done[h.day]||(S.beat&&S.beat[h.day]!=null),got=hwOf(h.day);
    var card=el("section",{class:"hwc"+(got?" got":S.done[h.day]?" due":"")+(given?"":" later")});cards[h.day]=card;
    var st=got?"已交 · "+new Date(got.at).toLocaleString("zh-CN",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"}):S.done[h.day]?"没交":"读完第"+h.day+"天后布置";
    card.append(el("div",{class:"hwh"},[el("b",{text:"第"+h.day+"天 · "+h.title}),el("span",{class:"hws",text:st})]));
    var ol=el("ol");h.items.forEach(function(t){if(/^\d+[.．、]/.test(t))ol.append(el("li",{text:t.replace(/^\d+[.．、]\s*/,"")}));else card.append(el("p",{class:"note",text:t}));});if(ol.children.length)card.insertBefore(ol,card.children[1]||null);else if(h.items.length===1){card.append(el("p",{text:h.items[0]}));}
    if(!given){sh.append(card);return;}
    var fg=hwFlag(h.day);if(fg){var wb=el("div",{class:"hwwarn"});wb.append(el("b",{text:"⚠️ AI 辅助作答警告"}),el("p",{text:"老师认为这份作业可能不是你自己写的（借助了 AI 或参考答案）。"+(fg.note?"老师的话："+fg.note:"")+" 你可以申诉，也可以重新写一份补交。补交以后，这个提醒就会消失。"}));
      if(fg.appeal)wb.append(el("p",{class:"note",text:"你已经申诉："+fg.appeal+"（等老师看）"}));
      var ap=el("button",{type:"button",class:"ghost",text:fg.appeal?"再写一次申诉":"申诉"}),re=el("button",{type:"button",class:"ghost",text:"补交新作业"});
      ap.addEventListener("click",function(){if(wb.querySelector("textarea"))return;var at=el("textarea",{rows:"3",placeholder:"说说这份作业是怎么写的：自己想的、参考了什么。老师会看。"}),go=btn("提交申诉"),m=el("p",{class:"note"});go.addEventListener("click",function(){var t=at.value.trim();if(t.length<5){m.textContent="多写几句。";return;}go.disabled=true;m.textContent="正在提交……";var p=(BK.mode==="sheet"&&BK.me)?api("hw_appeal",Object.assign(cred(),{day:h.day,text:t})):Promise.resolve();p.then(function(){HWST[h.day]=Object.assign({},HWST[h.day],{appeal:t});openHw(h.day);}).catch(function(){go.disabled=false;m.textContent="没提交上，等一下再试。";});});wb.append(at,el("div",{class:"row"},[go]),m);at.focus();});
      re.addEventListener("click",function(){ta.value="";ta.focus();bGo.textContent="交新作业";msg.textContent="重新写一份。原来那份老师那里还留着。";});
      wb.append(el("div",{class:"row"},[ap,re]));card.append(wb);}
    var ta=el("textarea",{rows:"3",placeholder:"可以在这里打字交（比如写的理由、一段话）；写在本子上的，就拍照。"});ta.value=(got&&got.text)||((S.data.hwDraft||{})[h.day])||"";
    ta.addEventListener("input",function(){S.data.hwDraft=S.data.hwDraft||{};S.data.hwDraft[h.day]=ta.value;clearTimeout(DRT);DRT=setTimeout(save,700);});
    var pick=[],thumbs=el("div",{class:"hwt"});
    function paintThumbs(){thumbs.innerHTML="";if(got&&got.photos&&got.photos.length)thumbs.append(el("span",{class:"note",text:"已经交了 "+got.photos.length+" 张照片"+(pick.length?"，这次再加：":"")}));pick.forEach(function(pk,i){var f=el("figure",{},[el("img",{src:pk.url,alt:"要交的照片"+(i+1)})]);var del=el("button",{type:"button",class:"ghost",text:"去掉"});del.addEventListener("click",function(){pick.splice(i,1);paintThumbs();});f.append(del);thumbs.append(f);});}
    var fi=el("input",{type:"file",accept:"image/*",multiple:"",hidden:""});fi.addEventListener("change",function(){[].forEach.call(fi.files,function(f){pick.push({file:f,url:URL.createObjectURL(f)});});fi.value="";paintThumbs();});
    var bPic=el("button",{type:"button",class:"ghost",text:"拍照 / 选照片"});bPic.addEventListener("click",function(){fi.click();});
    var bGo=btn(got?"再交一次":"交作业"),msg=el("p",{class:"note hwm"});
    if(reviewIdx(h.day)){var bRv=el("button",{type:"button",class:got?"btn rv":"ghost",text:got?"看第"+h.day+"天作业讲评":"交了作业才能看讲评"});bRv.disabled=!got;bRv.addEventListener("click",function(){openReview(h.day);});setTimeout(function(){card.querySelector(".row")&&card.querySelector(".row").append(bRv);},0);}
    bGo.addEventListener("click",function(){var text=ta.value.trim();if(!text&&!pick.length){msg.textContent="打几个字，或者拍一张照片，再交。";return;}
      bGo.disabled=true;bPic.disabled=true;var photos=((got&&got.photos)||[]).slice(),i=0;
      function up(){if(i>=pick.length)return Promise.resolve();msg.textContent="正在传第 "+(i+1)+" / "+pick.length+" 张照片……";var pk=pick[i];return shrinkImg(pk.file).then(function(d){
          if(BK.mode!=="sheet"||!BK.me){photos.push({url:"",local:1});return;}
          return api("hw_photo",Object.assign(cred(),{day:h.day,mime:"image/jpeg",n:photos.length+1,data:d.split(",")[1]})).then(function(j){photos.push({url:j.url,id:j.id});});}).then(function(){i++;return up();});}
      up().then(function(){msg.textContent="正在交……";var rec={text:text,photos:photos,at:new Date().toISOString()};
        var p=(BK.mode==="sheet"&&BK.me)?api("hw",Object.assign(cred(),{day:h.day,task:h.items.join("\n"),text:text,photos:photos})):Promise.resolve();
        return p.then(function(){S.data.hw=S.data.hw||{};S.data.hw[h.day]=rec;if(HWST[h.day])HWST[h.day].status="";if(S.data.hwDraft)delete S.data.hwDraft[h.day];commit();paintHw();SOUND.sfx&&SOUND.sfx("ok");openHw(h.day);});})
      .catch(function(e){bGo.disabled=false;bPic.disabled=false;msg.textContent=e&&e.code==="pin"||e&&e.code==="roster"?"没交上：请重新签到。":"没交上：网络没连上，或者照片太大。等一下再按一次“交作业”。";});});
    card.append(ta,el("div",{class:"row"},[bPic,bGo]),thumbs,fi,msg);paintThumbs();sh.append(card);});
  if(!list.length)sh.append(el("p",{text:"这篇课文没有布置课后作业。"}));
  o.hidden=false;var fc=focusDay&&cards[focusDay];if(fc)setTimeout(function(){fc.scrollIntoView({block:"start",behavior:"smooth"});},50);else x.focus();}
/* 进课时提醒一次：有读完的天还没交作业 */
function hwRemind(){if(TMODE||(BK.mode==="sheet"&&!BK.me))return;try{if(sessionStorage.getItem("hora-openhw")===L.id){sessionStorage.removeItem("hora-openhw");sessionStorage.setItem("hora-hwseen-"+L.id,"1");openHw((hwDue()[0]||{}).day);return;}}catch(e){}var due=hwDue();if(!due.length)return;var fk="hora-hwseen-"+L.id;try{if(sessionStorage.getItem(fk))return;sessionStorage.setItem(fk,"1");}catch(e){}
  var sh=overlay("ovHwR");sh.innerHTML="";sh.append(el("h3",{text:"作业还没交"}),el("p",{text:due.map(function(h){return "第"+h.day+"天（"+h.title+"）";}).join("、")+" 的作业还没交。"}));
  var go=btn("去交作业"),later=el("button",{type:"button",class:"ghost",text:"待会儿再说"});go.addEventListener("click",function(){$("#ovHwR").hidden=true;openHw(due[0].day);});later.addEventListener("click",function(){$("#ovHwR").hidden=true;});sh.append(el("div",{class:"row"},[go,later]));}
function openBook(){var NB=L.notebook,D=S.data,sh=$("#bookSheet");sh.innerHTML="";var x=el("button",{class:"ghost x",type:"button",text:"关上"});x.addEventListener("click",closeOv);
  sh.append(x,el("h3",{text:fill(NB.title)}),el("p",{class:"note",style:"margin:0",text:fill(NB.note)}));
  function pg(n,title,txt){var e=el("div",{class:"nbp"},[el("b",{text:String(n)}),el("h4",{text:title})]);e.append(el("p",{class:txt?"":"empty",text:txt||"还没写"}));return e;}
  var g=el("div",{class:"nbpages"});NB.pages.forEach(function(p){g.append(pg(p.n,p.title,p.get(D)));});
  var dt=NB.draft&&NB.draft(D);if(dt){var dr=el("div",{class:"nbp draft"},[el("h4",{text:NB.draftTitle||"我的小草稿"})]);dr.append(el("p",{text:dt}));if(NB.draftNote)dr.append(el("p",{class:"note",style:"margin-top:8px;font-family:var(--f-ui)",text:NB.draftNote}));g.append(dr);}
  sh.append(g);
  if(NB.records){var rec=el("div",{class:"nbpages"});NB.records.forEach(function(p){rec.append(pg(p.n,p.title,p.get(D)));});sh.append(el("h3",{style:"font-size:1.3rem;margin-top:18px",text:"课上的作答"}),rec);}
  sh.append(el("p",{class:"note",style:"margin-top:12px",text:syncOK?"已经交到老师那边。":"这些只存在这台设备上；需要时，把这一屏给老师看。"}));
  $("#ovBook").hidden=false;x.focus();}
$("#bBook").addEventListener("click",openBook);

/* ================= 老师端：卡在哪里 / 每人作答 / 课后小结 ================= */
var tUnsub=null,tDocs=[],tTab="class",tSum="",tFocus="",tHw={};
var tShares={};
function openTeacher(){$("#ovTeacher").hidden=false;
  if(BK.mode==="sheet"){tLoading=true;paintT();BK.teacherLoad().then(function(r){tDocs=r.docs;tShares=r.shares;tLoading=false;paintT();}).catch(function(e){tLoading=false;tErr=e.code==="pw"?"老师密码不对。":"没连上表格，稍后再试。";paintT();});return;}
  if(!tUnsub&&DB){tUnsub=DB.collection("answers").onSnapshot(function(snap){tDocs=snap.docs.map(function(d){var v=d.data();v._id=d.id;return v;});paintT();},function(){});DB.collection("shares").onSnapshot(function(snap){tShares={};snap.docs.forEach(function(d){tShares[d.id]=1;});paintT();},function(){});}paintT();}
var tLoading=false,tErr="",tCls="";
$("#bTeacher").addEventListener("click",openTeacher);
function SUMMARY_PROMPT(){return "你是一位初中语文老师的助手。下面是一个班的学生在网页上读"+L.author+"《"+L.textTitle+"》时的作答（已去掉姓名）。请用简洁的现代汉语，给老师写一份课后小结，分三部分：一、大多数学生已经做到的；二、普遍的卡点和误解，各举一两句学生原话；三、下节课值得拿出来讨论的两三个说法。不评价个人、不排名、不打分，不超过400字，不用Markdown符号。";}
/* 进度：每一天读完打 ✓；开始了没读完写“做到第几个环节/共几个”；没开始的不写 */
function progressText(d){d=d||S;var out=[];(L.days||[]).forEach(function(dy,i){var n=i+1;if(dy.hidden){if(d.done&&d.done[n])out.push(dy.practice?"练"+((PG[dy.pg]||{days:[]}).days.join("-"))+"✓":"讲评"+dy.reviewOf+"✓");return;}if(d.done&&d.done[n])out.push(n+"✓");else if(d.beat&&d.beat[n]!=null){var rb=Math.max(d.beat[n],(d.reach||{})[n]||0);out.push(n+"("+Math.min(rb+1,dy.beats.length)+"/"+dy.beats.length+")");}});return (out.join(" ")||"还没开始")+(d.day?(DAYS[d.day-1]&&DAYS[d.day-1].hidden?"　现在在做"+DAYS[d.day-1].title:"　现在第"+d.day+"天"):"");}
function studentText(d){var lines=[(d.name||"未写名字")+"　进度："+progressText(d)];OBSORDER.forEach(function(id){var r=(d.log||{})[id];if(!r||r.answer==null)return;lines.push("【"+OBS[id].label+"】"+r.answer+(r.ai?"\n  （AI 的点评："+r.ai+"）":""));});var hw=(d.data||{}).hw||{};Object.keys(hw).forEach(function(k){var o=hw[k];lines.push("【作业·第"+k+"天】"+(o.text||"")+((o.photos||[]).length?"（照片 "+o.photos.length+" 张："+o.photos.map(function(p){return p.url;}).filter(Boolean).join(" ")+"）":""));});var dr=(d.data||{})._dr||{};Object.keys(dr).forEach(function(k){var o=dr[k],v=(o.v||[]).filter(function(x){return x&&String(x).trim();});if(!v.length)return;var ks=k.split("|");lines.push("【草稿·第"+ks[0]+"天】"+(o.q||"")+"："+v.join(" / "));});return lines.join("\n");}
/* ---------- 老师看板的小工具 ---------- */
function DNAME(n){var d=DAYS[n-1]||{};return d.hidden?d.title:"第 "+n+" 天";}
function tGrad(o){return o&&((o.kind==="mc"&&!o.stance)||o.kind==="ask"||o.kind==="pick"||o.kind==="layering"||o.kind==="order"||o.kind==="match"||o.kind==="cloze");}
function tMiss(r){var n=0;for(var k in (r&&r.misses)||{})n+=r.misses[k];return n;}
function tFirst(r){return r&&r.answer!=null&&!tMiss(r);}
function tDayStat(d,n){var g=0,ok=0,w=0,wl=0;OBSORDER.forEach(function(id){var o=OBS[id];if(o.day!==n)return;var r=(d.log||{})[id];if(!r)return;if(tGrad(o)){if(r.answer!=null||tMiss(r)){g++;if(tFirst(r))ok++;}}else if(r.answer!=null){w++;wl+=String(r.answer).length;}});return {g:g,ok:ok,w:w,wl:wl};}
function tLevel(ok,g){if(!g)return "";var p=ok/g;return p>=.8?"lv-good":p>=.5?"lv-mid":"lv-low";}
function tDayCell(d,n){var dy=DAYS[n-1],done=d.done&&d.done[n],b=d.beat&&d.beat[n]!=null?Math.max(d.beat[n],(d.reach||{})[n]||0):null;return done?"✓":b!=null?(Math.min(b+1,dy.beats.length)+"/"+dy.beats.length):"";}
function tMissText(o,r){return Object.keys((r&&r.misses)||{}).map(function(k){return (o.misses&&o.misses[k])||k;}).join("；");}
function tTot(d){var t={g:0,ok:0,w:0,wl:0};DAYS.forEach(function(dy,i){var st=tDayStat(d,i+1);t.g+=st.g;t.ok+=st.ok;t.w+=st.w;t.wl+=st.wl;});return t;}
function tCopy(b,txt,out){var old=b.textContent;function done(m){b.textContent=m;setTimeout(function(){b.textContent=old;},2500);if(out)out.textContent=m==="已复制"?"已复制。打开你自己的 Claude，粘贴进去，发送。":txt;}try{navigator.clipboard.writeText(txt).then(function(){done("已复制");},function(){done("复制不了，请手动选中下面的文字");});}catch(e){done("复制不了，请手动选中下面的文字");}}
/* 给 Claude 看的一个学生的全部作答：按天，标明哪些是选择题（网页给的选项）、哪些是自己写的，最后是课后作业 */
function tText(d){var out=["【学生："+(d.name||"未写名字")+(d._cls?"（"+d._cls+"）":"")+"】进度："+progressText(d)],tot=tTot(d);out.push("选择题一次答对 "+tot.ok+"/"+tot.g+"；自己写了 "+tot.w+" 段");var lastDay=0;
  OBSORDER.forEach(function(id){var o=OBS[id],r=(d.log||{})[id];if(!r||(r.answer==null&&!tMiss(r)))return;if(o.day!==lastDay){lastDay=o.day;out.push((DAYS[o.day-1]||{}).hidden?"— "+DAYS[o.day-1].title+"（学生交了作业后做的讲评自查）":"— 第"+o.day+"天 课上（"+((DAYS[o.day-1]||{}).title||"")+"）");}
    if(tGrad(o))out.push("［选择题］"+o.label+"："+(tFirst(r)?"一次答对":"答错过（"+tMissText(o,r)+"）"+(r.answer==null?"，还没做对":"")));
    else if(o.kind==="mc")out.push("［表态，选项是网页给的］"+o.label+"：选了“"+r.answer+"”");
    else out.push("［自己写］"+o.label+(o.q?"（题目："+o.q+"）":"")+"："+r.answer);});
  var hw=(d.data||{}).hw||{};Object.keys(hw).forEach(function(k){var o=hw[k];out.push("— 第"+k+"天 课后作业（在家写，交上来的）："+(o.text||"（只交了照片）")+((o.photos||[]).length?"［另有照片 "+o.photos.length+" 张］":""));});
  var dr=(d.data||{})._dr||{};Object.keys(dr).forEach(function(k){var o=dr[k],v=(o.v||[]).filter(function(x){return x&&String(x).trim();});if(v.length)out.push("［写了一半没交的草稿］"+(o.q||"")+"："+v.join(" / "));});
  return out.join("\n");}
function STUDENT_PROMPT(nm){return "你是一位初中语文老师的助手。下面是学生 "+nm+" 在网页上学"+L.author+"《"+L.textTitle+"》这个单元的全部记录：课上作答（标了［选择题］［表态］［自己写］）和课后作业。［选择题］［表态］里的文字是网页给的选项，不是学生自己写的；只有［自己写］和课后作业是学生的文字。\n请写一份只给老师看的个性化诊断，用简洁的中文，不用 Markdown 符号，600 字以内：\n一、总体水平：阅读理解、把握结构、理解修辞（比喻）、写作表达四方面，各用一两句判断，并引学生原话做依据；\n二、强项；\n三、主要问题和误解（具体到哪一天哪一题）；\n四、课上自己写的和课后作业，文风和水平是否一致；如果落差很大或有明显借助工具、抄参考答案的迹象，只列出迹象和依据，不下结论，并给一个可以当面问他、一问就能核实的问题；\n五、给这个学生的下一步建议两三条，要具体可做。";}
function CLASS_PROMPT(){return "你是一位初中语文老师的助手。下面是一个班的学生在网页上学"+L.author+"《"+L.textTitle+"》这个单元的记录，每个学生之间用 ========== 隔开，名字写在每段开头。［选择题］［表态］里的文字是网页给的选项，不是学生写的；只有［自己写］和课后作业是学生的文字。\n请按学生逐个写诊断，每人一段，开头写名字，再写：水平（好 / 中 / 需要帮助）和一句理由；最突出的优点；最需要补的一点（具体到哪一天哪一题）；课上自己写的和课后作业文风水平是否一致，有落差就列出依据（不下结论）。每人 120 字以内。\n全部写完后，再写全班部分：大多数人已经掌握的；普遍的卡点和误解（举一两句原话，说是谁的）；下节课最值得讲的两三点。不用 Markdown 符号。";}
function paintT(){var sh=$("#teacherSheet");sh.innerHTML="";sh.classList.add("teach");var x=el("button",{class:"ghost x",type:"button",text:"关上"});x.addEventListener("click",closeOv);
  sh.append(x,el("h3",{text:"学生作答"}),el("p",{class:"note",style:"margin:0",text:(BK.mode==="sheet"?"只有知道老师密码的人看得到这里":"只有老师（编辑者）看得到这里")+"，学生之间互相看不到。现在 "+tDocs.length+" 人。"}));
  var tabs=el("div",{class:"tabs"});[["class","全班一览"],["q","按题看"],["each","每个学生"],["hw","作业"],["sum","课后小结"]].forEach(function(t){var b=el("button",{type:"button","aria-pressed":String(tTab===t[0]),text:t[1]});b.addEventListener("click",function(){tTab=t[0];paintT();});tabs.append(b);});sh.append(tabs);
  if(BK.mode==="sheet"){var rf=el("button",{class:"ghost",type:"button",text:tLoading?"正在读表格…":"刷新"});rf.addEventListener("click",openTeacher);var bar=el("div",{class:"row",style:"margin-top:6px"},[rf]);
    var clss=[];tDocs.forEach(function(d){if(d._cls&&clss.indexOf(d._cls)<0)clss.push(d._cls);});if(clss.length>1){var sel=el("select",{id:"in-tcls","aria-label":"只看一个班"});sel.append(el("option",{value:"",text:"全部班级"}));clss.sort().forEach(function(c2){var o=el("option",{value:c2,text:c2});if(c2===tCls)o.selected=true;sel.append(o);});sel.addEventListener("change",function(){tCls=sel.value;paintT();});bar.append(sel);}
    sh.append(bar);if(tErr){sh.append(el("p",{class:"banner",text:tErr}));tErr="";}}
  var list=el("div",{class:"tlist"});sh.append(list);
  var allDocs=tDocs;tDocs=tCls?allDocs.filter(function(d){return d._cls===tCls;}):allDocs;try{
  if(!tDocs.length){list.append(el("p",{class:"note",text:BK.mode==="sheet"?(tLoading?"正在读表格……":"还没有学生的作答。学生打开网站、输入班级码和名字开始做，点“刷新”就会出现。"):"还没有学生的作答。学生用自己的账号打开这个页面并开始做，这里就会出现。"}));return;}
  var NAME=function(d){return (d.name||"未写名字")+(tCls||!d._cls?"":"（"+d._cls+"）");};
  var sorted=tDocs.slice().sort(function(a,b){return String(a._cls||"").localeCompare(String(b._cls||""))||String(a.name).localeCompare(String(b.name),"zh");});
  if(tTab==="class"){
    list.append(el("p",{class:"note",text:"每格：✓ 读完这一天；3/5 做到第 3 个环节（共 5 个）；下面是这一天的选择题一次答对几道 / 做了几道，和写了几段。颜色：绿 八成以上一次答对，黄 一半以上，红 不到一半。点名字看这个学生的全部作答。"}));
    var wrap=el("div",{class:"tgridw"}),tb=el("table",{class:"tgrid"}),hr=el("tr");hr.append(el("th",{text:"学生"}));DAYS.forEach(function(dy,i){if(dy.hidden)return;hr.append(el("th",{title:dy.title},[el("span",{text:"第"+(i+1)+"天"}),el("small",{text:dy.short||dy.title})]));});hr.append(el("th",{text:"总计"}),el("th",{text:"作业"}),el("th",{text:"最近"}));tb.append(hr);
    var hws=hwList();
    sorted.forEach(function(d){var tr=el("tr"),nb=el("button",{type:"button",class:"tname",text:NAME(d)});nb.addEventListener("click",function(){tTab="each";tFocus=d._id||d.name;paintT();});tr.append(el("td",{},[nb]));
      DAYS.forEach(function(dy,i){if(dy.hidden)return;var n=i+1,c=tDayCell(d,n),st=tDayStat(d,n),td=el("td",{class:"tc "+tLevel(st.ok,st.g)+(c==="✓"?" done":c?" part":"")});if(c||st.g||st.w){td.append(el("b",{text:c||"·"}));if(st.g)td.append(el("small",{text:"对 "+st.ok+"/"+st.g}));if(st.w)td.append(el("small",{text:"写 "+st.w+" 段"}));}tr.append(td);});
      var tot={g:0,ok:0,w:0};DAYS.forEach(function(dy,i){var st=tDayStat(d,i+1);tot.g+=st.g;tot.ok+=st.ok;tot.w+=st.w;});tr.append(el("td",{class:"tc "+tLevel(tot.ok,tot.g)},[el("b",{text:tot.g?Math.round(tot.ok/tot.g*100)+"%":"—"}),el("small",{text:"一次对 "+tot.ok+"/"+tot.g}),el("small",{text:"写 "+tot.w+" 段"})]));
      var hg=(d.data||{}).hw||{},due=hws.filter(function(h){return d.done&&d.done[h.day];}),got=due.filter(function(h){return hg[h.day];}).length;tr.append(el("td",{class:"tc"+(due.length&&got<due.length?" lv-low":due.length?" lv-good":"")},[el("b",{text:due.length?got+"/"+due.length:"—"})]));
      var at=d._at||d.savedAt;tr.append(el("td",{class:"tc small",text:at?new Date(at).toLocaleString("zh-CN",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"}):""}));tb.append(tr);});
    var fr=el("tr",{class:"tfoot"});fr.append(el("td",{text:"全班"}));DAYS.forEach(function(dy,i){if(dy.hidden)return;var n=i+1,dn=0,g=0,ok=0;tDocs.forEach(function(d){if(d.done&&d.done[n])dn++;var st=tDayStat(d,n);g+=st.g;ok+=st.ok;});fr.append(el("td",{class:"tc "+tLevel(ok,g)},[el("b",{text:dn+"人读完"}),g?el("small",{text:"一次对 "+Math.round(ok/g*100)+"%"}):""]));});fr.append(el("td"),el("td"),el("td"));tb.append(fr);
    wrap.append(tb);list.append(wrap);
    /* 最需要讲的题：至少 3 人做过、一次答对率最低的 6 道 */
    var hard=[];OBSORDER.forEach(function(id){var o=OBS[id];if(!tGrad(o))return;var rs=tDocs.map(function(d){return (d.log||{})[id];}).filter(function(r){return r&&(r.answer!=null||tMiss(r));});if(rs.length<3)return;var ok=rs.filter(tFirst).length;hard.push({o:o,n:rs.length,ok:ok,p:ok/rs.length});});hard.sort(function(a,b){return a.p-b.p;});hard=hard.filter(function(h){return h.p<.7;}).slice(0,6);
    if(hard.length){var hb=el("div",{class:"thard"});hb.append(el("h4",{text:"最需要课上讲的题（一次答对的人最少）"}));var ol=el("ol");hard.forEach(function(h){var li=el("li");var a=el("button",{type:"button",class:"tname",text:"第"+h.o.day+"天 · "+h.o.label});a.addEventListener("click",function(){tTab="q";tFocus=String(h.o.day);paintT();});li.append(a,el("span",{text:"　一次对 "+h.ok+"/"+h.n+" 人"}));ol.append(li);});hb.append(ol);list.append(hb);}}
  else if(tTab==="q"){var curD=0,dsel=el("select",{"aria-label":"看哪一天"});dsel.append(el("option",{value:"",text:"全部天数"}));DAYS.forEach(function(dy,i){var o2=el("option",{value:String(i+1),text:"第"+(i+1)+"天 · "+dy.title});if(String(i+1)===String(tFocus))o2.selected=true;dsel.append(o2);});dsel.addEventListener("change",function(){tFocus=dsel.value;paintT();});list.append(el("div",{class:"row"},[dsel]),el("p",{class:"note",text:"每道题：多少人做了、多少人一次就对、错选了什么（谁选的）；写的题列出每个人的原话，方便比较水平。"}));
    var onlyDay=+tFocus||0;
    OBSORDER.forEach(function(id){var o=OBS[id];if(onlyDay&&o.day!==onlyDay)return;if(o.day!==curD){curD=o.day;list.append(el("h4",{class:"tday",text:DNAME(curD)+((DAYS[curD-1]||{}).hidden?"":" · "+(DAYS[curD-1]||{}).title)}));}
      var rs=sorted.map(function(d){return [d,(d.log||{})[id]];}).filter(function(x){return x[1]&&(x[1].answer!=null||tMiss(x[1]));});var c=el("details",{class:"tq"});
      var head=el("summary");head.append(el("b",{text:o.label}),el("small",{text:(o.skill?o.skill+"　":"")+"做了 "+rs.length+"/"+tDocs.length+" 人"}));
      if(tGrad(o)){var ok=rs.filter(function(x){return tFirst(x[1]);}).length;head.append(el("span",{class:"pill "+tLevel(ok,rs.length),text:rs.length?"一次对 "+ok+"/"+rs.length:"还没人做"}));}c.append(head);
      if(o.q)c.append(el("p",{class:"note",text:"题目："+o.q}));
      if(tGrad(o)){var by={};rs.forEach(function(x){for(var k in (x[1].misses||{})){(by[k]=by[k]||[]).push(x[0].name);}});var ks=Object.keys(by).sort(function(a,b){return by[b].length-by[a].length;});if(ks.length){var ul=el("ul",{class:"tmiss"});ks.forEach(function(k){ul.append(el("li",{},[el("b",{text:by[k].length+" 人 "}),el("span",{text:(o.misses[k]||k)+"："}),el("span",{class:"who",text:by[k].join("、")})]));});c.append(ul);}else if(rs.length)c.append(el("p",{class:"note",text:"做了的人都一次就对。"}));}
      else{var ul2=el("ul",{class:"tans"});rs.forEach(function(x){if(x[1].answer==null)return;ul2.append(el("li",{},[el("b",{text:x[0].name+"："}),el("span",{text:String(x[1].answer)})]));});c.append(ul2);}
      if(tGrad(o)&&rs.length&&rs.filter(function(x){return tFirst(x[1]);}).length/rs.length<.5)c.open=true;list.append(c);});}
  else if(tTab==="hw"){var hl=hwList();if(!hl.length){list.append(el("p",{class:"note",text:"这篇课文没有课后作业。"}));}
    hl.forEach(function(h){var c=el("details",{class:"tq"}),got=sorted.filter(function(d){return ((d.data||{}).hw||{})[h.day];});Object.keys(tHw).forEach(function(k){var x=tHw[k];if(x.day!==h.day||!x.name||(tCls&&x.cls!==tCls)||got.some(function(d){return d._id===x.sid;}))return;var hw={};hw[h.day]={text:x.text||"",photos:(x.photos||"").split("\n").filter(Boolean).map(function(u){return {url:u};}),at:x.at||new Date().toISOString()};got.push({name:x.name,_id:x.sid,_cls:x.cls,data:{hw:hw}});});var due=sorted.filter(function(d){return d.done&&d.done[h.day];});var sm=el("summary");sm.append(el("b",{text:"第"+h.day+"天作业 · "+h.title}),el("span",{class:"pill "+(due.length&&got.length<due.length?"lv-low":"lv-good"),text:"交了 "+got.length+" / 该交 "+due.length}));c.append(sm);
      c.append(el("p",{class:"note",text:h.items.join("　")}));var miss=due.filter(function(d){return got.indexOf(d)<0;});if(miss.length)c.append(el("p",{class:"banner",text:"读完了还没交："+miss.map(function(d){return d.name;}).join("、")}));
      var ul=el("ul",{class:"tans"});got.forEach(function(d){var o=d.data.hw[h.day],li=el("li");li.append(el("b",{text:d.name+"："}),el("span",{text:(o.text||"")+" "}));(o.photos||[]).forEach(function(ph,i){if(ph.url){var a=el("a",{href:ph.url,target:"_blank",rel:"noopener",text:"照片"+(i+1)});li.append(a," ");}});li.append(el("small",{text:new Date(o.at).toLocaleString("zh-CN",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"})}));
        var hr2=tHw[d._id+"|"+h.day]||{};if(hr2.status)li.append(el("p",{class:"hwwarn",text:"⚠️ "+hr2.status+(hr2.appeal?"　· 学生申诉："+hr2.appeal:"　· 学生还没申诉、也没补交")}));else if(hr2.appeal)li.append(el("p",{class:"note",text:"学生申诉过："+hr2.appeal}));
        if(hr2.history){var dt2=el("details");dt2.append(el("summary",{text:"以前交的版本"}),el("p",{style:"white-space:pre-wrap",text:hr2.history}));li.append(dt2);}
        if(BK.mode==="sheet"&&d._id){var fb=el("button",{type:"button",class:"ghost",text:hr2.status?"取消警告":"⚠️ 标为 AI 辅助"});fb.addEventListener("click",function(){var st=hr2.status?"":"AI辅助";fb.disabled=true;fb.textContent="正在改……";api("t_hwflag",{pw:BK.tpw,sid:d._id,day:h.day,status:st,name:d.name,cls:d._cls,title:L.title,text:o.text||"",photos:(o.photos||[]).map(function(p){return p.url;}).join("\n"),at:o.at}).then(function(){tHw[d._id+"|"+h.day]=Object.assign({},hr2,{status:st,appeal:st?hr2.appeal:""});paintT();}).catch(function(){fb.disabled=false;fb.textContent="没改成，再试一次";});});li.append(el("div",{class:"row"},[fb]));}
        ul.append(li);});c.append(ul);if(got.length)c.open=true;list.append(c);});}
  else if(tTab==="stuck"){var curDay=0;OBSORDER.forEach(function(id){var o=OBS[id];if(o.day!==curDay){curDay=o.day;list.append(el("h4",{style:"margin:6px 0 0;font-size:.95rem;color:var(--muted)",text:"第 "+curDay+" 天"}));}
      var rs=tDocs.map(function(d){return (d.log||{})[id];}).filter(Boolean);var doneN=rs.filter(function(r){return r.answer!=null;}).length;var tr=rs.filter(function(r){return r.tries;});var avg=tr.length?(tr.reduce(function(a,r){return a+r.tries;},0)/tr.length):0;
      var mc={};rs.forEach(function(r){for(var k in (r.misses||{}))mc[k]=(mc[k]||0)+(r.misses[k]>0?1:0);});var mk=Object.keys(mc).sort(function(a,b){return mc[b]-mc[a];});
      var hot=mk.length&&mc[mk[0]]>=Math.max(2,tDocs.length*.3);
      var c=el("div",{class:"stat"+(hot?" hot2":"")});c.append(el("h4",{},[o.label,el("small",{text:o.skill})]));
      c.append(el("div",{class:"bar2"},[el("i",{style:"width:"+Math.round(doneN/tDocs.length*100)+"%"})]),el("p",{class:"note",style:"margin:0",text:"完成 "+doneN+" / "+tDocs.length+(avg?"　· 平均试 "+avg.toFixed(1)+" 次":"")}));
      if(mk.length){var m=el("div",{class:"miss"});mk.forEach(function(k){m.append(el("div",{},[el("b",{text:mc[k]+"人"}),el("span",{text:o.misses[k]||k})]));});c.append(m);}
      list.append(c);});
    var asked=tDocs.filter(function(d){return (d.chats||[]).length;});list.append(el("p",{class:"note",text:"用过“聊一聊”的学生："+asked.length+" 人，共 "+tDocs.reduce(function(a,d){return a+(d.chats||[]).length;},0)+" 次。问了什么见“每人作答”。"}));}
  else if(tTab==="each"){
    /* 一次只看一个学生：上面一排名字，点谁看谁；上一个 / 下一个 */
    var idx=0;sorted.forEach(function(d,i){if((d._id||d.name)===tFocus)idx=i;});var d=sorted[idx];tFocus=d._id||d.name;
    var chips=el("div",{class:"tchips"});sorted.forEach(function(x,i){var tot=tTot(x);var c2=el("button",{type:"button",class:"tchip "+tLevel(tot.ok,tot.g)+(i===idx?" on":""),text:x.name||"未写名字"});c2.addEventListener("click",function(){tFocus=x._id||x.name;paintT();});chips.append(c2);});list.append(chips);
    var prev=el("button",{class:"ghost",type:"button",text:"← 上一个"}),next=el("button",{class:"ghost",type:"button",text:"下一个 →"});prev.disabled=idx===0;next.disabled=idx===sorted.length-1;prev.addEventListener("click",function(){tFocus=sorted[idx-1]._id||sorted[idx-1].name;paintT();});next.addEventListener("click",function(){tFocus=sorted[idx+1]._id||sorted[idx+1].name;paintT();});
    var cp1=el("button",{class:"ghost",type:"button",text:"复制这个学生，拿去 Claude 诊断"});cp1.addEventListener("click",function(){tCopy(cp1,STUDENT_PROMPT(d.name)+"\n\n"+tText(d));});
    list.append(el("div",{class:"row"},[prev,el("b",{class:"tcount",text:(idx+1)+" / "+sorted.length}),next,cp1]));
    var c=el("div",{class:"tst"});c.append(el("h4",{text:NAME(d)+"　· 进度："+progressText(d)}));var tot=tTot(d);
      c.append(el("p",{class:"tsum "+tLevel(tot.ok,tot.g),text:"选择题一次答对 "+tot.ok+"/"+tot.g+(tot.g?"（"+Math.round(tot.ok/tot.g*100)+"%）":"")+"　· 写了 "+tot.w+" 段，平均每段 "+(tot.w?Math.round(tot.wl/tot.w):0)+" 字"}));var dl=el("dl"),lastDay=0;
      OBSORDER.forEach(function(id){var o=OBS[id],r=(d.log||{})[id];if(!r||(r.answer==null&&!tMiss(r)))return;if(o.day!==lastDay){lastDay=o.day;var st=tDayStat(d,o.day);dl.append(el("dt",{class:"tdh",text:DNAME(o.day)}),el("dd",{class:"tdh",text:(DAYS[o.day-1]||{}).title+(st.g?"　· 选择题一次对 "+st.ok+"/"+st.g:"")+(st.w?"　· 写了 "+st.w+" 段":"")}));}
        var mark=tGrad(o)?(tFirst(r)?"✓ 一次对":"✗ 错过（"+tMissText(o,r)+"）"+(r.answer==null?"，还没做对":"")):"";
        dl.append(el("dt",{text:o.label}),el("dd",{class:tGrad(o)?(tFirst(r)?"ok":"bad"):""},[el("span",{text:r.answer!=null?String(r.answer):""}),mark?el("small",{class:"mk",text:"　"+mark}):""]));});
      var hw=(d.data||{}).hw||{};if(Object.keys(hw).length)dl.append(el("dt",{class:"tdh",text:"课后作业"}),el("dd",{class:"tdh",text:"交了 "+Object.keys(hw).length+" 份"}));Object.keys(hw).forEach(function(k){var o=hw[k],dd=el("dd",{text:(o.text||"")+" "});(o.photos||[]).forEach(function(ph,i){if(ph.url)dd.append(el("a",{href:ph.url,target:"_blank",rel:"noopener",text:"照片"+(i+1)})," ");});dl.append(el("dt",{text:"第"+k+"天作业"}),dd);});
      if((d.chats||[]).length)dl.append(el("dt",{text:"聊一聊"}),el("dd",{text:d.chats.map(function(m){return "问"+(PEOPLE[m.who]?PEOPLE[m.who].name:"")+"："+m.q;}).join("\n")}));
      c.append(dl);if(d._id&&tShares[d._id]){var down=el("button",{class:"ghost",type:"button",text:"从同学互看中撤下TA的作答"});down.addEventListener("click",function(){BK.teacherHide(d._id).then(function(){down.textContent="已撤下";down.disabled=true;}).catch(function(){down.textContent="没撤下，请再试";});});c.append(el("div",{class:"row",style:"margin-top:6px"},[down]));}list.append(c);
    var bot=el("div",{class:"row"},[prev.cloneNode(true),next.cloneNode(true)]);bot.children[0].disabled=prev.disabled;bot.children[1].disabled=next.disabled;bot.children[0].addEventListener("click",function(){prev.click();});bot.children[1].addEventListener("click",function(){next.click();});list.append(bot);}
  else{
    list.append(el("p",{class:"note",text:"这里没有 AI。按下面的按钮，会把作答（带名字，按学生分开，课上作答和课后作业都在）连同诊断要求一起复制好；打开你自己的 Claude，粘贴进去就行。名字只在你自己的对话里出现。"}));
    var cpAll=btn("复制：全班逐人诊断"),out=el("div",{class:"sumout"});
    cpAll.addEventListener("click",function(){var body=sorted.map(tText).join("\n\n==========\n\n");tCopy(cpAll,CLASS_PROMPT()+"\n\n"+body,out);});
    var cpOne=el("button",{class:"ghost",type:"button",text:"只诊断一个学生：去“每个学生”页"});cpOne.addEventListener("click",function(){tTab="each";paintT();});
    list.append(el("div",{class:"row"},[cpAll,cpOne]),out);}}finally{tDocs=allDocs;}}

/* 测试与演示用：预览老师端、打开老师模式 */
window.HORA.previewTeacher=function(docs){tDocs=docs;$("#ovTeacher").hidden=false;paintT();};
window.HORA.teacherMode=function(on){setTMode(on!==false);};
window.HORA.pxCount=function(){var f=function(x){return x.steps.filter(function(s){return s.obs;}).length;};return PG.map(function(g,gi){var b=buildPractice(gi);return (pgOpen(gi)?"":"🔒")+f(b[0])+"+"+f(b[1]);});};
window.HORA.setHwSt=function(o){HWST=o||{};paintHw();};

function restart(){refreshMe();paintDays();paintHw();loadHwSt();setTimeout(hwRemind,1200);if(S.day>DAYS.length)S.day=1;runFrom(S.day,Math.min(S.beat[S.day]||0,DAYS[S.day-1].beats.length));}
renderText();paintTabs();paintDays();
if(BK.mode==="sheet")sheetStart();
else{paintHw();loadHwSt();setTimeout(hwRemind,1200);if(S.day>DAYS.length)S.day=1;runFrom(S.day,Math.min(S.beat[S.day]||0,DAYS[S.day-1].beats.length));}

/* ================= 网站版：登录（班级码＋名字＋4位数字）、换人、老师 ================= */
function normCls(v){return String(v||"").replace(/\s+/g,"").toUpperCase();}
function normName(v){return String(v||"").replace(/\s+/g," ").trim();}
var HOME;
function getSess(){try{var a=JSON.parse(sessionStorage.getItem("hora-session")||"null");if(a&&a.pin)return a;}catch(e){}return null;}
function dropSess(){try{sessionStorage.removeItem("hora-session");}catch(e){}try{var lm=JSON.parse(localStorage.getItem("hora-last")||"{}");delete lm.pin;localStorage.setItem("hora-last",JSON.stringify(lm));}catch(e){}}
function sheetStart(){
  HOME=SITE.home||"";var tools=$(".tools");
  if(HOME){var bMap=el("button",{class:"tbtn",type:"button",id:"bMap",text:"课文地图"});bMap.addEventListener("click",function(){leaveTo(HOME+"#map");});tools.prepend(bMap);}
  var bWho=el("button",{class:"tbtn",type:"button",id:"bWho",hidden:"",text:"换人"});bWho.addEventListener("click",function(){if(dirty&&!confirmLeave())return;if(HOME){dropSess();leaveTo(HOME);return;}BK.me=null;dropSess();RUN.token++;resetUI();showLogin();});
  var bT=el("button",{class:"tbtn",type:"button",id:"bTLogin",text:"老师"});bT.addEventListener("click",function(){if(BK.tpw){openTeacher();return;}showTeacherLogin();});
  tools.append(bWho,bT);
  if(location.hash==="#teacher")showTeacherLogin(true);
  else{var ss=getSess();if(ss)autoLogin(ss);else if(HOME)location.replace(HOME+"#login");else showLogin();}
  addEventListener("hashchange",function(){if(location.hash==="#teacher"&&!BK.tpw)showTeacherLogin(!BK.me);});}
function autoLogin(ss){var me={cls:normCls(ss.cls),name:normName(ss.name),pin:String(ss.pin)};var keep=false;try{keep=!!JSON.parse(localStorage.getItem("hora-last")||"{}").pin;}catch(e){}
  setSaveSt("正在连接……");var dt=$("#dTxt");if(dt)dt.textContent="正在打开你上次读到的地方，稍等几秒……";
  api("login",me).then(function(j){enter(me,j.state,keep);}).catch(function(e){if(e.code==="pin"||e.code==="cls"||e.code==="bad"||e.code==="new"||e.code==="roster"){dropSess();if(HOME){location.replace(HOME+"#login");return;}showLogin();return;}enter(me,null,keep);setSaveSt("没连上，稍后自动再存",true);});}
function confirmLeave(){return true;}
function overlay(id){var o=$("#"+id);if(!o){o=el("div",{class:"ov login",id:id},[el("div",{class:"sheet login-s",role:"dialog"})]);document.body.append(o);}o.hidden=false;return $(".sheet",o);}
function showLogin(){var sh=overlay("ovLogin");var last={};try{last=JSON.parse(localStorage.getItem("hora-last")||"{}");}catch(e){}
  sh.innerHTML='<h3>'+esc(L.title)+'</h3><p class="note">'+esc(L.sub||"")+'</p>'+
    '<label class="field"><span class="lab">班级码（老师给的）</span><input type="text" id="lg-cls" autocomplete="off" autocapitalize="characters" placeholder="比如 G8A"></label>'+
    '<label class="field"><span class="lab">名字或昵称</span><input type="text" id="lg-name" autocomplete="off" maxlength="12" placeholder="同学和老师认得出就行"></label>'+
    '<label class="field"><span class="lab">4 位数字（自己定，记住它）</span><input type="password" id="lg-pin" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" placeholder="••••"></label>'+
    '<label class="row note"><input type="checkbox" id="lg-keep" checked> 在这台设备上记住我（公用电脑请不要勾）</label>'+
    '<div class="row"><button type="button" class="btn" id="lg-go">开始</button></div><p class="note" id="lg-msg">第一次用：自己定一个 4 位数字。换电脑、换手机时，输入同样的班级码、名字和数字，就能从上次的地方接着做。</p>';
  var c=$("#lg-cls",sh),n=$("#lg-name",sh),p=$("#lg-pin",sh),msg=$("#lg-msg",sh),go=$("#lg-go",sh),keep=$("#lg-keep",sh);
  c.value=last.cls||"";n.value=last.name||"";p.value=last.pin||"";(c.value?(n.value?p:n):c).focus();
  [c,n,p].forEach(function(x){x.addEventListener("keydown",function(e){if(e.key==="Enter")go.click();});});
  go.addEventListener("click",function(){var me={cls:normCls(c.value),name:normName(n.value),pin:p.value.trim()};
    if(!me.cls){c.focus();msg.textContent="请写班级码。";return;}if(!me.name){n.focus();msg.textContent="请写名字或昵称。";return;}if(!/^\d{4}$/.test(me.pin)){p.focus();msg.textContent="请写 4 位数字。";return;}
    go.disabled=true;msg.textContent="正在连接……";
    api("login",me).then(function(j){enter(me,j.state,keep.checked);}).catch(function(e){go.disabled=false;
      if(e.code==="pin")msg.textContent="这个班里已经有人用了这个名字，数字对不上。是你的话，再想想当初定的数字；不是你，就换个名字（比如加上姓）。";
      else if(e.code==="cls")msg.textContent="没有这个班级码，请问一下老师。";
      else{msg.innerHTML="";msg.append("连不上老师的表格（可能是网络问题）。 ");var off=el("button",{type:"button",class:"ghost",text:"先在这台设备上做"});off.addEventListener("click",function(){enter(me,null,keep.checked);setSaveSt("没连上，稍后自动再存",true);});msg.append(off);}});});}
function enter(me,state,keep){BK.me=me;if(!HOME)try{localStorage.setItem("hora-last",JSON.stringify(keep?me:{cls:me.cls,name:me.name}));}catch(e){}try{sessionStorage.setItem("hora-session",JSON.stringify(me));}catch(e){}
  KEY="hora-"+L.id+"-"+me.cls+"|"+me.name;S={day:1,beat:{},done:{},data:{},log:{},chats:[]};try{var raw=localStorage.getItem(KEY);if(raw){var o=JSON.parse(raw);for(var k in o)S[k]=o[k];}}catch(e){}
  mergeRemote(state);S.data.name=me.name;save();if($("#ovLogin"))$("#ovLogin").hidden=true;$("#bWho").hidden=false;if(state!==null)setSaveSt("已连上");restart();}
function showTeacherLogin(fromHash){var sh=overlay("ovTLogin");
  sh.innerHTML='<h3>老师</h3><label class="field"><span class="lab">老师密码</span><input type="password" id="tl-pw" autocomplete="off"></label><div class="row"><button type="button" class="btn" id="tl-go">进入</button><button type="button" class="ghost" id="tl-x">'+(fromHash?"我是学生":"取消")+'</button></div><p class="note" id="tl-msg">密码是部署表格时你自己设的。</p>';
  var pw=$("#tl-pw",sh),msg=$("#tl-msg",sh);pw.focus();
  $("#tl-x",sh).addEventListener("click",function(){$("#ovTLogin").hidden=true;if(fromHash&&!BK.me){var ss=getSess();if(ss)autoLogin(ss);else if(HOME)location.href=HOME;else showLogin();}});
  function go(){msg.textContent="正在核对……";BK.tpw=pw.value;api("t_all",{pw:pw.value}).then(function(j){try{sessionStorage.setItem("hora-tpw",pw.value);}catch(e){}$("#ovTLogin").hidden=true;$("#bTMode").hidden=false;$("#bTeacher").hidden=false;$("#bTLogin").hidden=true;
      if(!BK.me){$("#ovLogin")&&($("#ovLogin").hidden=true);BK.me=null;KEY="hora-"+L.id+"-teacher-preview";setSaveSt("老师预览：不保存");restart();}
      tDocs=[];openTeacher();}).catch(function(e){BK.tpw=null;if(e.code==="pw"){try{sessionStorage.removeItem("hora-tpw");}catch(e2){}}msg.textContent=e.code==="pw"?"密码不对。":"连不上表格，稍后再试。";});}
  $("#tl-go",sh).addEventListener("click",go);pw.addEventListener("keydown",function(e){if(e.key==="Enter")go();});
  /* 同一个标签页里输过一次密码，换课文时自动填上（关掉标签页就忘） */
  var saved=null;try{saved=sessionStorage.getItem("hora-tpw");}catch(e){}if(saved){pw.value=saved;go();}}

}
})();
