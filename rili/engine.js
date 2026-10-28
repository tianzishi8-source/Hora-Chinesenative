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
var MSG=Object.assign({keyOut:"这一句不在这一层里，在这一层的那几段里找。",ladderEmpty:"还有一级空着，先把它写完。"},L.msgs||{});
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
 '<div class="main"><section class="reader" id="reader" aria-label="原文"><div class="rhead"><h2>'+esc(L.textTitle)+'</h2><small>'+esc(L.author)+'</small><span class="sp"></span><button class="ghost closer" id="bClose" type="button">收起</button></div><div class="rmode" id="rmode" hidden></div><div class="rbody" id="rbody"></div></section>'+
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
function get(path,D){var v=D||S.data;String(path).split(".").forEach(function(p){v=(v==null)?undefined:v[p];});return v;}
function set(path,val){var ps=String(path).split("."),o=S.data;for(var i=0;i<ps.length-1;i++){if(o[ps[i]]==null||typeof o[ps[i]]!=="object")o[ps[i]]={};o=o[ps[i]];}o[ps[ps.length-1]]=val;}
function del(path){var ps=String(path).split("."),o=S.data;for(var i=0;i<ps.length-1;i++){o=o&&o[ps[i]];}if(o)delete o[ps[ps.length-1]];}
var TPL={};
/* 录音用的“中性版”：去掉名字等占位（有备用词就用备用词），清掉多余的标点 */
function voiceText(t){return String(t).replace(/\{([\w.]+)(?:\|([^}]*))?\}/g,function(m,p,fb){return fb||"";}).replace(/^[，、,\s]+/,"").replace(/([，。！？])[，、\s]+/g,"$1").replace(/\s{2,}/g," ").trim();}
function fill(str,extra){var out=String(str==null?"":str).replace(/\{([\w.]+)(?:\|([^}]*))?\}/g,function(m,p,fb){var v=extra&&extra[p]!=null?extra[p]:get(p);if(Array.isArray(v))v=v.filter(Boolean).join("；");v=(v==null?"":String(v)).trim();return v||(fb||"");});if(/\{/.test(String(str)))TPL[out]=String(str);return out;}

/* ---- 学情 ---- */
var OBS={},OBSORDER=[];
function regObs(step,day){var o=step.obs;if(!o||OBS[o.id])return;var ml={};(step.misses||[]).forEach(function(m){if(m.id)ml[m.id]=m.label||m.text;});if(step.requireEnd)ml.noEnd=step.requireEnd.label||"没有按要求收尾";if(step.fallback)ml.other="点了其他不相关的句子";if(step.t==="layering"){ml.few="层分得太少";ml.many="层分得太密";ml.keyOut="关键句不在这一层";}OBS[o.id]={id:o.id,label:o.label,skill:o.skill||"",day:day,misses:ml};OBSORDER.push(o.id);}
function logStep(obs,patch){if(!obs)return;var r=S.log[obs.id]||{tries:0,misses:{}};if(patch.try)r.tries++;if(patch.miss){r.misses[patch.miss]=(r.misses[patch.miss]||0)+1;}if(patch.answer!=null){r.answer=patch.answer;r.at=new Date().toISOString();}if(patch.ai!=null)r.ai=patch.ai;S.log[obs.id]=r;}

/* ---- 作答存哪里：BK（后台）有三种
   sheet：老师的 Google 表格（网站版，学生不用任何账号，用“班级码＋名字＋4位数字”进入）
   claude：claude.ai 页面自带的数据库（学生要有 Claude 账号）
   local：哪里都不存，只在这台设备上 ---- */
var SITE=window.HORA_SITE||{};
var RESTORED=false,DB=null,UID=null,syncOK=null,writing=false,pending=false,CANEDIT=false;
function payload(){return {name:S.data.name||"",data:S.data,log:S.log,done:S.done,day:S.day,beat:S.beat,savedAt:S.savedAt||"",chats:(S.chats||[]).slice(-30),updatedAt:new Date().toISOString()};}
function mergeRemote(r){if(r&&r.savedAt&&(!S.savedAt||r.savedAt>S.savedAt)){["data","log","done","beat","chats"].forEach(function(k){if(r[k]!=null)S[k]=r[k];});if(r.day)S.day=r.day;try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}return true;}return false;}
var BK={mode:SITE.sheetUrl?"sheet":"claude",me:null,tpw:null};
function online(){return BK.mode==="sheet"?!!BK.me:!!(DB&&UID);}
/* 表格后台：一律用 POST、正文是 JSON 文本（不设 Content-Type，浏览器就不会先发预检请求） */
function api(action,body){return fetch(SITE.sheetUrl,{method:"POST",body:JSON.stringify(Object.assign({action:action,lesson:L.id,lessonTitle:L.title},body||{}))}).then(function(r){return r.json();}).then(function(j){if(!j||!j.ok){var e=new Error((j&&j.err)||"server");e.code=(j&&j.err)||"server";throw e;}return j;});}
function cred(){var m=BK.me||{};return {cls:m.cls,name:m.name,pin:m.pin};}
var saveT=null,dirty=false,saveSt=null;
function setSaveSt(t,bad){if(!saveSt){saveSt=el("span",{class:"savest",id:"saveSt"});$(".tools").prepend(saveSt);}saveSt.textContent=t;saveSt.classList.toggle("bad",!!bad);}
function sync(){
  if(BK.mode==="sheet"){if(!BK.me)return;dirty=true;clearTimeout(saveT);saveT=setTimeout(function(){var p=JSON.parse(JSON.stringify(payload()));setSaveSt("保存中…");
      api("save",Object.assign(cred(),{payload:p,summary:studentText(p)})).then(function(){dirty=false;setSaveSt("已保存");}).catch(function(e){setSaveSt(e.code==="pin"?"没保存：数字不对":"没连上，稍后自动再存",true);setTimeout(function(){if(dirty)sync();},20000);});},1200);return;}
  if(!DB||!UID||syncOK===false)return;if(writing){pending=true;return;}writing=true;DB.doc("answers/"+UID).set(JSON.parse(JSON.stringify(payload()))).then(function(){syncOK=true;}).catch(function(e){if(e&&e.code==="invalid_argument")syncOK=false;}).then(function(){writing=false;if(pending){pending=false;sync();}});}
function commit(){save();sync();}
var leaving=false;
function leaveTo(url){leaving=true;if(BK.mode!=="sheet"||!dirty||!BK.me){location.href=url;return;}clearTimeout(saveT);setSaveSt("保存中…");var done=false;function go(){if(!done){done=true;location.href=url;}}
  var p=JSON.parse(JSON.stringify(payload()));api("save",Object.assign(cred(),{payload:p,summary:studentText(p)})).then(function(){dirty=false;go();}).catch(go);setTimeout(go,4000);}
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
BK.teacherLoad=function(){if(BK.mode==="sheet")return api("t_all",{pw:BK.tpw}).then(function(j){var sh={};var docs=(j.rows||[]).map(function(r){var v=r.payload||{};v._id=r.sid;v.name=v.name||r.name;v._cls=r.cls;if(r.shared)sh[r.sid]=1;return v;});return {docs:docs,shares:sh};});
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
  PARAS.forEach(function(p,pi){var pe=el("p",{class:CENTER[pi]?"center":""});
    PSENT[pi].forEach(function(id){var t=SENT[id].t,sp=el("span",{class:"s","data-id":String(id),tabindex:"-1"});var i=0;
      while(i<t.length){var hit=null;for(var g=0;g<GKEYS.length;g++){if(t.substr(i,GKEYS[g].length)===GKEYS[g]){hit=GKEYS[g];break;}}
        if(hit){sp.append(el("span",{class:"g","data-g":hit,text:hit}));i+=hit.length;}else{sp.append(document.createTextNode(t[i]));i++;}}
      pe.append(sp);});
    rbody.append(pe);
    if(pi<PARAS.length-1){var gp=el("span",{class:"gap","data-after":String(pi)});gp.append(el("button",{type:"button","aria-label":"在第"+(pi+1)+"段后面分层"},["在这里分层"]));rbody.append(gp);}});
  if(L.source)rbody.append(el("p",{class:"src",text:L.source}));paintMarks();}
function paintMarks(){$$(".s",rbody).forEach(function(s){var id=s.getAttribute("data-id");s.classList.toggle("hl-mark",!!R.marks[id]);s.classList.toggle("hl-pick",!!R.picks[id]);s.classList.toggle("hl-key",!!R.keys[id]);});$$(".gap",rbody).forEach(function(g){g.classList.toggle("on",!!R.cuts[g.getAttribute("data-after")]);});}
function setMode(m,label){R.mode=m;reader.classList.toggle("picking",m==="pick"||m==="mark");reader.classList.toggle("cutting",m==="cut");rmode.hidden=!label;rmode.className="rmode"+(m==="mark"?" mark":m==="cut"?" cut":"");rmode.textContent=label||"";if(label&&isNarrow())openReader();}
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
function chOf(w){var p=PEOPLE[w];if(w!=="me")return p.glyph||p.ch;var n=(S.data.name||"").trim();if(!n)return p.glyph||p.ch;var cj=n.match(/[\u3400-\u9fff]/g);return cj?cj[cj.length-1]:n.charAt(0).toUpperCase();}
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
function buildCast(){[["l",C.left],["r",C.right]].forEach(function(side){var host=$(".actors."+side[0]);side[1].forEach(function(w){var d=el("button",{class:"actor",type:"button","data-who":w,"aria-label":w==="me"?"我":"和"+PEOPLE[w].name+"聊一聊"});d.innerHTML='<canvas width="220" height="220" aria-hidden="true"></canvas><span class="nm"></span>';$(".nm",d).textContent=nameOf(w);host.append(d);CV[w]=$("canvas",d);if(w!=="me")d.addEventListener("click",function(){if(!bChat.hidden&&!bChat.disabled)openChat(w);});});});}
buildCast();
function castLoop(){for(var w in CV){var on=SPEAKER===w;CV[w].parentElement.classList.toggle("on",on);drawActor(CV[w],w);}requestAnimationFrame(castLoop);}
requestAnimationFrame(castLoop);
function refreshMe(){var b=$('.actor[data-who="me"] .nm');if(b)b.textContent=nameOf("me");}

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
    a.onended=function(){if(cur===a){cur=null;SOUND.duck(false);}};a.onerror=function(){if(my===seq){cur=null;SOUND.duck(false);if(V.fb||force)device(w,text);}};
    var p=a.play();if(p&&p.catch)p.catch(function(){if(my===seq){SOUND.duck(false);}});}
  function say(w,text,kind,force){stop();if(!text||!(V.on||force))return;if(w==="me"&&!V.me&&!force)return;
    if(kind==="ai"){if(V.ai||force)device(w,text);return;}
    var k=w==="me"?null:(clip(w,text)||(TPL[text]?clip(w,voiceText(TPL[text])):null));if(k){play(k,w,text,force);return;}(window.HORA.voiceMiss=window.HORA.voiceMiss||[]).push(w+"："+text);if(V.fb||force)device(w,text);}
  /* 设置面板 */
  var panelEl=null;
  function openPanel(){if(panelEl&&!panelEl.hidden){panelEl.hidden=true;return;}if(!panelEl){panelEl=el("div",{class:"chat vpanel",role:"dialog","aria-label":"配音设置"});document.body.append(panelEl);}load();
    var who=Object.keys(PEOPLE).filter(function(w){return w!=="me";});
    var h='<div class="chat-h"><b>配音设置</b><span class="sp"></span><button type="button" class="dbtn" data-x>关上</button></div><div class="chat-b vb">'+
      '<label class="row"><input type="checkbox" id="vOn"'+(V.on?" checked":"")+'> <b>开启配音</b></label>'+
      '<label class="vrow"><span class="vn">语速</span><input type="range" min="0.8" max="1.25" step="0.05" value="'+V.rate+'" id="vRate" aria-label="语速"><span class="vv" id="vRateV"></span></label>'+
      who.map(function(w){var r=rec(w);return '<div class="vrow"><span class="vn">'+esc(PEOPLE[w].name)+'</span>'+(r.length?'<span class="seg" role="group" aria-label="'+esc(PEOPLE[w].name)+'的音色">'+r.map(function(c){return '<button type="button" data-w="'+w+'" data-v="'+c.id+'" aria-pressed="'+(choice(w).id===c.id)+'">'+esc(c.name)+'</button>';}).join("")+'</span>':'<span class="note">设备语音</span>')+'<button type="button" class="dbtn" data-t="'+w+'">试听</button></div>';}).join("")+
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
    $$("[data-v]",panelEl).forEach(function(b){b.addEventListener("click",function(){var w=b.getAttribute("data-w");V.pick[w]=b.getAttribute("data-v");sv();$$('[data-w="'+w+'"]',panelEl).forEach(function(x){x.setAttribute("aria-pressed",String(x===b));});say(w,PEOPLE[w].sample||"你好。",null,true);});});
    $$("[data-t]",panelEl).forEach(function(b){b.addEventListener("click",function(){var w=b.getAttribute("data-t");say(w,PEOPLE[w].sample||"你好。",null,true);});});
    ["Fb","Ai","Me"].forEach(function(k){var x=$("#v"+k,panelEl);if(x)x.addEventListener("change",function(e){V[k.toLowerCase()]=e.target.checked;sv();});});
    $$("select[data-d]",panelEl).forEach(function(x){x.addEventListener("change",function(){V.dev[x.getAttribute("data-d")]=x.value;sv();});});
    $$("[data-dt]",panelEl).forEach(function(b){b.addEventListener("click",function(){stop();device(b.getAttribute("data-dt"),"这是设备自带的语音，用来读带名字的话和 AI 的回复。");});});}
  function paintBtn(){if(btnV){btnV.setAttribute("aria-pressed",String(!!V.on));btnV.textContent=V.on?"配音":"配音（关）";}}
  if(btnV){paintBtn();btnV.addEventListener("click",openPanel);}
  return{say:say,stop:stop};})();

/* ================= 对话框 ================= */
var RUN={token:0};var CANCEL={};
var DLOG=[];
function say(txt,who,tok){who=who||lead();return new Promise(function(res,rej){if(tok!==RUN.token)return rej(CANCEL);
  SPEAKER=who;NOD[who]=performance.now()/1000;dWho.textContent=nameOf(who);dWho.style.background=inkOf(who);DLOG.push({who:who,text:txt});VOICE.say(who,txt);
  if(reduce){dTxt.textContent=txt;return res();}
  var i=0,skip=false;TALK=true;var k=function(){skip=true;};dTxt.addEventListener("click",k,{once:true});
  (function step(){if(tok!==RUN.token){TALK=false;return rej(CANCEL);}if(skip||i>=txt.length){dTxt.textContent=txt;dTxt.removeEventListener("click",k);TALK=false;return res();}i++;dTxt.textContent=txt.slice(0,i);setTimeout(step,/[。！？]/.test(txt[i-1])?320:/[，；：、]/.test(txt[i-1])?200:62);})();});}
function sayQ(txt,who,tok){say(txt,who,tok).catch(function(){});}
/* 一段话说完，等学生点“继续”再往下（下一步本来就是“继续”按钮时不重复） */
var NEXT="end";
function line(txt,who,tok){return say(txt,who,tok).then(function(){if(NEXT==="next")return;return next("继续",tok,true);});}
function logMe(txt){DLOG.push({who:"me",text:txt});}
function clearTask(){task.innerHTML="";task.classList.remove("plain");}
function btn(label){return el("button",{class:"btn",type:"button",text:label});}
var contKey=null;
function next(label,tok,keep){return new Promise(function(res,rej){bCont.hidden=false;bCont.textContent=(label||"继续")+" ▸";bCont.focus({preventScroll:true});
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
function q(text){return el("div",{class:"task-q",text:fill(text)});}

/* ================= 步骤类型 ================= */
var H={};
var NOWAIT={next:1,input:1,choose:1,independent:1,markHeard:1,layering:1,clear:1};
H.say=function(s,tok){var nx=NEXT;return say(fill(s.text),s.who,tok).then(function(){if(s.wait===false||NOWAIT[nx])return;return next(s.next||"继续",tok,true);});};
H.me=function(s,tok){return line(fill(s.text),"me",tok);};
H.next=function(s,tok){return next(fill(s.label),tok,s.keep);};
H.sleep=function(s){return sleepTick(s.ms||500);};
H.clear=function(){clearTask();return Promise.resolve();};
H.quote=function(s){clearTask();task.append(el("blockquote",{class:"quote",text:s.para!=null?PARAS[s.para]:fill(s.text)}));return Promise.resolve();};

H.name=function(s,tok){if(S.data.name){if(S.data.greeted)return say(fill(s.back),s.who,tok);S.data.greeted=1;save();return line(fill(s.greet),s.who,tok);}
  return say(s.ask,s.who,tok).then(function(){return new Promise(function(res,rej){clearTask();var inp=el("input",{type:"text",id:"in-name",placeholder:"写你的名字或昵称",autocomplete:"off"});var b=btn("说出来");task.append(q(s.ask),el("div",{class:"field"},[inp]),el("div",{class:"row"},[b]));inp.focus();function go(){if(tok!==RUN.token)return rej(CANCEL);var v=inp.value.trim();if(!v){inp.focus();return;}S.data.name=v;S.data.greeted=1;commit();refreshMe();clearTask();res();}b.addEventListener("click",go);inp.addEventListener("keydown",function(e){if(e.key==="Enter")go();});});})
  .then(function(){logMe(fill("我叫{name}。"));return line(fill(s.greet),s.who,tok);});};

H.input=function(s,tok){return new Promise(function(res,rej){clearTask();if(s.q)task.append(q(s.q));if(s.banner)task.append(el("div",{class:"banner",html:fill(s.banner)}));var ta=textBox("in-"+s.key.replace(/\./g,"-"),s.rows,fill(s.ph),get(s.key));var b=btn(s.button||"写好了");task.append(el("div",{class:"field"},[ta]),el("div",{class:"row"},[b]));ta.focus();var nudged=false;
  b.addEventListener("click",function(){if(tok!==RUN.token)return rej(CANCEL);var v=ta.value.trim();if(!v){ta.focus();return;}
    if(s.requireEnd&&!new RegExp(s.requireEnd.re).test(v)&&!nudged){nudged=true;logStep(s.obs,{miss:"noEnd"});sayQ(s.requireEnd.text,s.requireEnd.who||coach(),tok);return;}
    set(s.key,v);logStep(s.obs,{try:1,answer:v});commit();res(v);});})
  .then(function(v){if(s.echo!==false)logMe(v);if(!s.replies)return;for(var i=0;i<s.replies.length;i++){var r=s.replies[i];if(!r.re||new RegExp(r.re).test(v))return line(fill(r.text),r.who||s.who,tok);}});};

H.quoteOrPick=function(s,tok){var v=get(s.from)||"";var hits=findQuotedAll(v);
  return say(hits.length?s.hitText:s.askText,s.who,tok).then(function(){clearTask();task.append(q(s.task||s.pickLabel),el("p",{class:"note",text:"在左边原文里点句子；点错了再点一下就取消。选好了按原文上方的按钮。"}));return pickMulti(s.pickLabel,tok,hits,s.okLabel);})
  .then(function(ids){var t=joinSents(ids);clearTask();R.keys={};ids.forEach(function(i){R.keys[i]=1;});R.picks={};paintMarks();set(s.key,t);logStep(s.obs,{try:1,answer:(ids.length>1?"（"+ids.length+"句）":"")+t});commit();return line(s.doneText,s.who,tok);});};

H.pick=function(s,tok){var other=0;var fbWho=s.feedbackWho||coach();return say(fill(s.ask),s.who,tok).then(function(){clearTask();task.append(q(s.task||s.label),el("p",{class:"note",text:"在左边原文里点一句。"}));return pickSent(s.label,tok,function(id){logStep(s.obs,{try:1});
    if(inPara(id,s.accept.paras)){SOUND.sfx("ok");return true;}
    var t=SENT[id].t,ms=s.misses||[];for(var i=0;i<ms.length;i++){var m=ms[i];if((m.has&&t.indexOf(m.has)>=0)||(m.paras&&m.paras.indexOf(SENT[id].p)>=0)){return function(){SOUND.sfx("no");logStep(s.obs,{miss:m.id});sayQ(m.text,fbWho,tok);};}}
    return function(){SOUND.sfx("no");logStep(s.obs,{miss:"other"});var fb=s.fallback||["不是这一句，再找找。"];sayQ(fb[Math.min(other,fb.length-1)],fbWho,tok);other++;};});})
  .then(function(id){clearTask();logStep(s.obs,{answer:SENT[id].t});commit();if(s.light!==false){if(!s.keepKeys)R.keys={};s.accept.paras.forEach(function(p){PSENT[p].forEach(function(i){R.keys[i]=1;});});paintMarks();}if(s.quote)task.append(el("blockquote",{class:"quote",text:PARAS[s.accept.paras[0]]}));if(s.okText)return line(fill(s.okText),s.okWho||s.who,tok);});};

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
  var stairs=el("div",{class:"stairs"});var keyMode=null;var doneB=btn(s.button||"我分好了");var tries=0;
  task.append(q(s.q),stairs,el("div",{class:"row"},[doneB]));var cutLabel=s.cutLabel||"在两段之间点“在这里分层”；再点一次就合上";setMode("cut",cutLabel);
  function LS(){return layersFrom(R.cuts);}
  function render(){var ls=LS();while(info.length<ls.length)info.push({sum:"",key:""});info.length=ls.length;stairs.innerHTML="";
    ls.forEach(function(r,i){var st=el("div",{class:"step"+(i===active?" act-on":""),style:"--i:"+i});var inp=el("input",{type:"text",id:"in-layer-"+i,placeholder:"第 "+(i+1)+" 层说了什么？一句话",value:info[i].sum||""});
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
    if(ls.length<s.min&&tries<2){logStep(s.obs,{miss:"few"});sayQ(fill(s.few,{n:ls.length}),who,tok);return;}
    if(ls.length>s.max&&tries<2){logStep(s.obs,{miss:"many"});sayQ(s.many,who,tok);return;}
    if(empty&&tries<3){sayQ(fill(s.empty,{n:empty}),who,tok);return;}
    keep();set(s.key+".at",new Date().toISOString());logStep(s.obs,{answer:info.map(function(x,i){return (i+1)+"．"+rng(ls[i])+" "+(x.sum||"")+(x.key?"（关键句："+x.key+"）":"");}).join("\n")});commit();R.onCut=null;R.onPick=null;setMode("none");
    doneB.parentNode.remove();if(s.topQuote)task.append(el("blockquote",{class:"quote",text:s.topQuote}));
    SOUND.sfx("ok");line(fill(s.done,{n:ls.length}),s.who||lead(),tok).then(function(){res();}).catch(function(){});});});};

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
function narrate(btnN){var n=L.narration;if(!n)return;if(NARR){stopNarr();return;}var i=0,a=null,alive=true;btnN.textContent="停止朗读";VOICE.stop();
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
    task.append(q(s.q||"先把全文读一遍"),el("p",{class:"note",text:fill(s.note||"左边是全文。慢慢读，读满 1 分钟才能往下。")}),el("div",{class:"readrow"},[ring,el("div",{class:"row"},[go,L.narration?btnN:null])]));
    function upd(){var left=Math.max(0,Math.ceil(need-sec)),full=done||left<=0;$(".rg-fg",ring).setAttribute("stroke-dashoffset",String(full?0:100-Math.min(100,sec/need*100)));ring.classList.toggle("full",full);
      $(".rg-t b",ring).textContent=full?"✓":String(left);$(".rg-t small",ring).textContent=full?(done?"读过了":"可以往下"):"秒";go.disabled=!full;ring.setAttribute("aria-label",full?"可以往下了":"还要读 "+left+" 秒");}
    upd();var iv=setInterval(function(){if(tok!==RUN.token){clearInterval(iv);stopNarr();return;}if(document.visibilityState==="visible"&&document.hasFocus()){sec+=.25;}upd();},250);
    go.addEventListener("click",function(){if(tok!==RUN.token)return rej(CANCEL);if(go.disabled)return;clearInterval(iv);stopNarr();set("read."+s.id,{sec:Math.round(sec),at:new Date().toISOString()});logStep(s.obs,{answer:(done?"以前读过；这次":"读了")+" "+Math.round(sec)+" 秒"});commit();clearTask();closeReaderIfNarrow();res();});});};

/* 画面：课文配置提供的插图或实物（不是任务） */
H.vis=function(s){clearTask();task.classList.add("plain");task.append(L.visuals[s.name](el,fill));return Promise.resolve();};

H.openBook=function(){openBook();return Promise.resolve();};

function runSteps(steps,tok){return steps.reduce(function(p,s,i){return p.then(function(){if(tok!==RUN.token)throw CANCEL;var h=H[s.t];if(!h)throw new Error("未知步骤类型："+s.t);NEXT=steps[i+1]?steps[i+1].t:"end";return h(s,tok);});},Promise.resolve());}

/* ================= 天、环节、老师模式 ================= */
var DAYS=L.days;
DAYS.forEach(function(d,di){d.beats.forEach(function(b){b.steps.forEach(function(s){regObs(s,di+1);});});});
var TMODE=false;
function paintDays(){var nav=$("#days");nav.innerHTML="";DAYS.forEach(function(d,i){var n=i+1;var b=el("button",{class:"dpad"+(S.done[n]?" done":""),type:"button","aria-current":String(n===S.day),title:d.title},[el("small",{text:"第"}),el("b",{text:String(n)}),el("small",{text:"天"}),el("span",{text:S.done[n]?"读完":d.short||""})]);b.addEventListener("click",function(){startDay(n,false);});nav.append(b);});
  if(L.totalDays&&L.totalDays>DAYS.length)nav.append(el("span",{class:"more",text:"共 "+L.totalDays+" 天，已开放 "+DAYS.length+" 天"}));}
function paintStages(n,cur){var nav=$("#stages");nav.innerHTML="";DAYS[n-1].beats.forEach(function(b,i){var c=el("button",{class:"st"+(i===cur?" on":"")+(i<cur||S.done[n]?" done":""),type:"button","aria-current":String(i===cur)},[el("i",{"aria-hidden":"true"}),b.title]);c.addEventListener("click",function(){if(TMODE)runFrom(n,i);});nav.append(c);});
  var b=DAYS[n-1].beats[cur];$("#stTitle").textContent=b?b.title:(DAYS[n-1].title);$("#stWhen").textContent="第 "+n+" 天 · "+DAYS[n-1].title+(b?" · 环节 "+(cur+1)+"/"+DAYS[n-1].beats.length:"");}
function setTMode(on){TMODE=on;app.classList.toggle("tmode",on);$("#bTMode").setAttribute("aria-pressed",String(on));bSkip.hidden=!on;}
$("#bTMode").addEventListener("click",function(){setTMode(!TMODE);});
bSkip.addEventListener("click",function(){var n=S.day,i=(S.beat[n]||0)+1;runFrom(n,i);});
function startDay(n,resume){S.day=n;if(!resume)S.beat[n]=0;save();paintDays();runFrom(n,S.beat[n]||0);}
function resetUI(){VOICE.stop();stopNarr();R.onPick=null;R.onMark=null;R.onCut=null;R.picks={};R.keys={};R.marks={};R.cuts={};setMode("none");clearTask();closePop();paintMarks();bCont.hidden=true;app.classList.remove("hush");bChat.disabled=false;TALK=false;}
function runFrom(n,b){RUN.token++;var tok=RUN.token;resetUI();
  var beats=DAYS[n-1].beats;(function loop(i){if(tok!==RUN.token)return;if(i>=beats.length){S.done[n]=1;S.beat[n]=beats.length;commit();paintDays();paintStages(n,beats.length);endOfDay(n,tok);return;}S.beat[n]=i;save();paintStages(n,i);var bt=beats[i];SOUND.mood(bt.mood||(L.sound&&L.sound.mood)||"calm");
    if(bt.skipIf&&get(bt.skipIf)&&!TMODE){loop(i+1);return;}
    runSteps(bt.steps,tok).then(function(){loop(i+1);}).catch(function(e){if(e!==CANCEL)console.error(e);});})(b);}
function endOfDay(n,tok){clearTask();var d=DAYS[n-1],last=n===DAYS.length;$("#stTitle").textContent=last?"读完了":"今天读完了";
  say(fill(d.end||(last?"读完了。":"第"+n+"天读完了。下次见。")),d.endWho||lead(),tok).then(function(){if(d.after)task.append(el("div",{class:"banner",text:d.after}));var r=el("div",{class:"row"});var b1=btn("打开"+L.notebook.button);b1.addEventListener("click",openBook);r.append(b1);
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
$("#bLog").addEventListener("click",function(){var sh=$("#logSheet");sh.innerHTML="";var x=el("button",{class:"ghost x",type:"button",text:"关上"});x.addEventListener("click",closeOv);sh.append(x,el("h3",{text:"刚才说过的话"}));DLOG.slice(-60).forEach(function(m){sh.append(el("p",{},[el("b",{text:nameOf(m.who)}),m.text]));});$("#ovLog").hidden=false;x.focus();});
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
var tUnsub=null,tDocs=[],tTab="stuck",tSum="";
var tShares={};
function openTeacher(){$("#ovTeacher").hidden=false;
  if(BK.mode==="sheet"){tLoading=true;paintT();BK.teacherLoad().then(function(r){tDocs=r.docs;tShares=r.shares;tLoading=false;paintT();}).catch(function(e){tLoading=false;tErr=e.code==="pw"?"老师密码不对。":"没连上表格，稍后再试。";paintT();});return;}
  if(!tUnsub&&DB){tUnsub=DB.collection("answers").onSnapshot(function(snap){tDocs=snap.docs.map(function(d){var v=d.data();v._id=d.id;return v;});paintT();},function(){});DB.collection("shares").onSnapshot(function(snap){tShares={};snap.docs.forEach(function(d){tShares[d.id]=1;});paintT();},function(){});}paintT();}
var tLoading=false,tErr="",tCls="";
$("#bTeacher").addEventListener("click",openTeacher);
function SUMMARY_PROMPT(){return "你是一位初中语文老师的助手。下面是一个班的学生在网页上读"+L.author+"《"+L.textTitle+"》时的作答（已去掉姓名）。请用简洁的现代汉语，给老师写一份课后小结，分三部分：一、大多数学生已经做到的；二、普遍的卡点和误解，各举一两句学生原话；三、下节课值得拿出来讨论的两三个说法。不评价个人、不排名、不打分，不超过400字，不用Markdown符号。";}
function studentText(d){var lines=[(d.name||"未写名字")];OBSORDER.forEach(function(id){var r=(d.log||{})[id];if(!r||r.answer==null)return;lines.push("【"+OBS[id].label+"】"+r.answer+(r.ai?"\n  （AI 的点评："+r.ai+"）":""));});return lines.join("\n");}
function paintT(){var sh=$("#teacherSheet");sh.innerHTML="";var x=el("button",{class:"ghost x",type:"button",text:"关上"});x.addEventListener("click",closeOv);
  sh.append(x,el("h3",{text:"学生作答"}),el("p",{class:"note",style:"margin:0",text:(BK.mode==="sheet"?"只有知道老师密码的人看得到这里":"只有老师（编辑者）看得到这里")+"，学生之间互相看不到。现在 "+tDocs.length+" 人。"}));
  var tabs=el("div",{class:"tabs"});[["stuck","卡在哪里"],["each","每人作答"],["sum","课后小结"]].forEach(function(t){var b=el("button",{type:"button","aria-pressed":String(tTab===t[0]),text:t[1]});b.addEventListener("click",function(){tTab=t[0];paintT();});tabs.append(b);});sh.append(tabs);
  if(BK.mode==="sheet"){var rf=el("button",{class:"ghost",type:"button",text:tLoading?"正在读表格…":"刷新"});rf.addEventListener("click",openTeacher);var bar=el("div",{class:"row",style:"margin-top:6px"},[rf]);
    var clss=[];tDocs.forEach(function(d){if(d._cls&&clss.indexOf(d._cls)<0)clss.push(d._cls);});if(clss.length>1){var sel=el("select",{id:"in-tcls","aria-label":"只看一个班"});sel.append(el("option",{value:"",text:"全部班级"}));clss.sort().forEach(function(c2){var o=el("option",{value:c2,text:c2});if(c2===tCls)o.selected=true;sel.append(o);});sel.addEventListener("change",function(){tCls=sel.value;paintT();});bar.append(sel);}
    sh.append(bar);if(tErr){sh.append(el("p",{class:"banner",text:tErr}));tErr="";}}
  var list=el("div",{class:"tlist"});sh.append(list);
  var allDocs=tDocs;tDocs=tCls?allDocs.filter(function(d){return d._cls===tCls;}):allDocs;try{
  if(!tDocs.length){list.append(el("p",{class:"note",text:BK.mode==="sheet"?(tLoading?"正在读表格……":"还没有学生的作答。学生打开网站、输入班级码和名字开始做，点“刷新”就会出现。"):"还没有学生的作答。学生用自己的账号打开这个页面并开始做，这里就会出现。"}));return;}
  if(tTab==="stuck"){var curDay=0;OBSORDER.forEach(function(id){var o=OBS[id];if(o.day!==curDay){curDay=o.day;list.append(el("h4",{style:"margin:6px 0 0;font-size:.95rem;color:var(--muted)",text:"第 "+curDay+" 天"}));}
      var rs=tDocs.map(function(d){return (d.log||{})[id];}).filter(Boolean);var doneN=rs.filter(function(r){return r.answer!=null;}).length;var tr=rs.filter(function(r){return r.tries;});var avg=tr.length?(tr.reduce(function(a,r){return a+r.tries;},0)/tr.length):0;
      var mc={};rs.forEach(function(r){for(var k in (r.misses||{}))mc[k]=(mc[k]||0)+(r.misses[k]>0?1:0);});var mk=Object.keys(mc).sort(function(a,b){return mc[b]-mc[a];});
      var hot=mk.length&&mc[mk[0]]>=Math.max(2,tDocs.length*.3);
      var c=el("div",{class:"stat"+(hot?" hot2":"")});c.append(el("h4",{},[o.label,el("small",{text:o.skill})]));
      c.append(el("div",{class:"bar2"},[el("i",{style:"width:"+Math.round(doneN/tDocs.length*100)+"%"})]),el("p",{class:"note",style:"margin:0",text:"完成 "+doneN+" / "+tDocs.length+(avg?"　· 平均试 "+avg.toFixed(1)+" 次":"")}));
      if(mk.length){var m=el("div",{class:"miss"});mk.forEach(function(k){m.append(el("div",{},[el("b",{text:mc[k]+"人"}),el("span",{text:o.misses[k]||k})]));});c.append(m);}
      list.append(c);});
    var asked=tDocs.filter(function(d){return (d.chats||[]).length;});list.append(el("p",{class:"note",text:"用过“聊一聊”的学生："+asked.length+" 人，共 "+tDocs.reduce(function(a,d){return a+(d.chats||[]).length;},0)+" 次。问了什么见“每人作答”。"}));}
  else if(tTab==="each"){var cp=el("button",{class:"ghost",type:"button",text:"复制全部"});list.append(cp);var all=[];
    tDocs.slice().sort(function(a,b){return String(a.name).localeCompare(String(b.name),"zh");}).forEach(function(d){var c=el("div",{class:"tst"});c.append(el("h4",{text:(d.name||"未写名字")+"　· 读完 "+Object.keys(d.done||{}).length+" 天"}));var dl=el("dl");
      OBSORDER.forEach(function(id){var r=(d.log||{})[id];if(!r||r.answer==null)return;dl.append(el("dt",{text:OBS[id].label}),el("dd",{text:r.answer+(r.tries>1?"　（试了 "+r.tries+" 次）":"")+(r.ai?"\nAI 点评："+r.ai:"")}));});
      if((d.chats||[]).length)dl.append(el("dt",{text:"聊一聊"}),el("dd",{text:d.chats.map(function(m){return "问"+(PEOPLE[m.who]?PEOPLE[m.who].name:"")+"："+m.q;}).join("\n")}));
      c.append(dl);if(d._id&&tShares[d._id]){var down=el("button",{class:"ghost",type:"button",text:"从同学互看中撤下TA的作答"});down.addEventListener("click",function(){BK.teacherHide(d._id).then(function(){down.textContent="已撤下";down.disabled=true;}).catch(function(){down.textContent="没撤下，请再试";});});c.append(el("div",{class:"row",style:"margin-top:6px"},[down]));}list.append(c);all.push(studentText(d));});
    cp.addEventListener("click",function(){var txt=all.join("\n\n");try{navigator.clipboard.writeText(txt).then(function(){cp.textContent="已复制";},function(){cp.textContent="复制不了，请手动选中";});}catch(e){cp.textContent="复制不了，请手动选中";}});}
  else{var go=btn(tSum?"重新生成":(BK.mode==="sheet"?"复制作答，拿去 Claude 生成小结":"生成全班小结"));var out=el("div",{class:"sumout",text:tSum||"根据全班作答，写一份只给老师看的小结：大家普遍读懂了什么、卡在哪里、有哪些值得在下节课拿出来讨论的说法。不点名评价，不排名。"});list.append(el("div",{class:"row"},[go]),out);
    go.addEventListener("click",function(){getSample().then(function(sm){if(!sm){var body0=tDocs.map(function(d,i){return studentText(d).replace(/^[^\n]*/,"学生"+(i+1));}).join("\n\n");var txt0=SUMMARY_PROMPT()+"\n\n"+body0;try{navigator.clipboard.writeText(txt0).then(function(){out.textContent="这里没有 AI。已经把全班作答（去掉姓名）和写小结的要求复制好了：打开你自己的 Claude，粘贴进去就能生成小结。";},function(){out.textContent=txt0;});}catch(e){out.textContent=txt0;}return;}go.disabled=true;out.textContent="正在读全班的作答……";
      var body=tDocs.map(function(d,i){return studentText(d).replace(/^[^\n]*/,"学生"+(i+1));}).join("\n\n");
      var p=SUMMARY_PROMPT()+"\n\n"+body;if(0)p="你是一位初中语文老师的助手。下面是一个班的学生在网页上读"+L.author+"《"+L.textTitle+"》时的作答（已去掉姓名）。请用简洁的现代汉语，给老师写一份课后小结，分三部分：一、大多数学生已经做到的；二、普遍的卡点和误解，各举一两句学生原话；三、下节课值得拿出来讨论的两三个说法。不评价个人、不排名、不打分，不超过400字，不用Markdown符号。\n\n"+body;
      sm(p,{modelTier:"default",cache:false,onText:function(o){out.textContent=o.text;}}).then(function(r){tSum=r.text;out.textContent=tSum;}).catch(function(e){out.textContent=e&&e.code==="rate_limited"?"现在用的人太多，等一会儿再试。":"这次没生成成功，可以再试一次。";}).then(function(){go.disabled=false;go.textContent="重新生成";});});});}}finally{tDocs=allDocs;}}

/* 测试与演示用：预览老师端、打开老师模式 */
window.HORA.previewTeacher=function(docs){tDocs=docs;$("#ovTeacher").hidden=false;paintT();};
window.HORA.teacherMode=function(on){setTMode(on!==false);};

function restart(){refreshMe();paintDays();if(S.day>DAYS.length)S.day=1;runFrom(S.day,Math.min(S.beat[S.day]||0,DAYS[S.day-1].beats.length));}
renderText();paintDays();
if(BK.mode==="sheet")sheetStart();
else{if(S.day>DAYS.length)S.day=1;runFrom(S.day,Math.min(S.beat[S.day]||0,DAYS[S.day-1].beats.length));}

/* ================= 网站版：登录（班级码＋名字＋4位数字）、换人、老师 ================= */
function normCls(v){return String(v||"").replace(/\s+/g,"").toUpperCase();}
function normName(v){return String(v||"").replace(/\s+/g," ").trim();}
var HOME;
function getSess(){try{var a=JSON.parse(sessionStorage.getItem("hora-session")||"null");if(a&&a.pin)return a;}catch(e){}try{var b=JSON.parse(localStorage.getItem("hora-last")||"{}");if(b.pin)return b;}catch(e){}return null;}
function dropSess(){try{sessionStorage.removeItem("hora-session");}catch(e){}try{var lm=JSON.parse(localStorage.getItem("hora-last")||"{}");delete lm.pin;localStorage.setItem("hora-last",JSON.stringify(lm));}catch(e){}}
function sheetStart(){
  HOME=SITE.home||"";var tools=$(".tools");
  if(HOME){var bMap=el("button",{class:"tbtn",type:"button",id:"bMap",text:"课文地图"});bMap.addEventListener("click",function(){leaveTo(HOME+"#map");});tools.prepend(bMap);}
  var bWho=el("button",{class:"tbtn",type:"button",id:"bWho",hidden:"",text:"换人"});bWho.addEventListener("click",function(){if(dirty&&!confirmLeave())return;if(HOME){dropSess();leaveTo(HOME);return;}BK.me=null;dropSess();RUN.token++;resetUI();showLogin();});
  var bT=el("button",{class:"tbtn",type:"button",id:"bTLogin",text:"老师"});bT.addEventListener("click",function(){if(BK.tpw){openTeacher();return;}showTeacherLogin();});
  tools.append(bWho,bT);
  if(location.hash==="#teacher")showTeacherLogin(true);
  else{var ss=getSess();if(ss)autoLogin(ss);else if(HOME)location.replace(HOME);else showLogin();}
  addEventListener("hashchange",function(){if(location.hash==="#teacher"&&!BK.tpw)showTeacherLogin(!BK.me);});}
function autoLogin(ss){var me={cls:normCls(ss.cls),name:normName(ss.name),pin:String(ss.pin)};var keep=false;try{keep=!!JSON.parse(localStorage.getItem("hora-last")||"{}").pin;}catch(e){}
  setSaveSt("正在连接……");var dt=$("#dTxt");if(dt)dt.textContent="正在打开你上次读到的地方，稍等几秒……";
  api("login",me).then(function(j){enter(me,j.state,keep);}).catch(function(e){if(e.code==="pin"||e.code==="cls"||e.code==="bad"){dropSess();if(HOME){location.replace(HOME);return;}showLogin();return;}enter(me,null,keep);setSaveSt("没连上，稍后自动再存",true);});}
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
function enter(me,state,keep){BK.me=me;try{localStorage.setItem("hora-last",JSON.stringify(keep?me:{cls:me.cls,name:me.name}));}catch(e){}try{sessionStorage.setItem("hora-session",JSON.stringify(me));}catch(e){}
  KEY="hora-"+L.id+"-"+me.cls+"|"+me.name;S={day:1,beat:{},done:{},data:{},log:{},chats:[]};try{var raw=localStorage.getItem(KEY);if(raw){var o=JSON.parse(raw);for(var k in o)S[k]=o[k];}}catch(e){}
  mergeRemote(state);S.data.name=me.name;save();if($("#ovLogin"))$("#ovLogin").hidden=true;$("#bWho").hidden=false;if(state!==null)setSaveSt("已连上");restart();}
function showTeacherLogin(fromHash){var sh=overlay("ovTLogin");
  sh.innerHTML='<h3>老师</h3><label class="field"><span class="lab">老师密码</span><input type="password" id="tl-pw" autocomplete="off"></label><div class="row"><button type="button" class="btn" id="tl-go">进入</button><button type="button" class="ghost" id="tl-x">'+(fromHash?"我是学生":"取消")+'</button></div><p class="note" id="tl-msg">密码是部署表格时你自己设的。</p>';
  var pw=$("#tl-pw",sh),msg=$("#tl-msg",sh);pw.focus();
  $("#tl-x",sh).addEventListener("click",function(){$("#ovTLogin").hidden=true;if(fromHash&&!BK.me){var ss=getSess();if(ss)autoLogin(ss);else if(HOME)location.href=HOME;else showLogin();}});
  function go(){msg.textContent="正在核对……";BK.tpw=pw.value;api("t_all",{pw:pw.value}).then(function(j){$("#ovTLogin").hidden=true;$("#bTMode").hidden=false;$("#bTeacher").hidden=false;$("#bTLogin").hidden=true;
      if(!BK.me){$("#ovLogin")&&($("#ovLogin").hidden=true);BK.me=null;KEY="hora-"+L.id+"-teacher-preview";setSaveSt("老师预览：不保存");restart();}
      tDocs=[];openTeacher();}).catch(function(e){BK.tpw=null;msg.textContent=e.code==="pw"?"密码不对。":"连不上表格，稍后再试。";});}
  $("#tl-go",sh).addEventListener("click",go);pw.addEventListener("keydown",function(e){if(e.key==="Enter")go();});}

}
})();
