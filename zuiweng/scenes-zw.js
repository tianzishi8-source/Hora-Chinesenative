/* 《醉翁亭记》自学课的互动场景（11-12）。课文配置里写 {t:"scene",id:"zoom"…}，引擎打开全屏小舞台，调这里的函数。
 * 台词都在课文配置的 lines 里（录音清单从那里收），这里只管画面和玩法。
 * 画面：先用 ../ke/scene.js 画的 SVG 场景；课堂版文件夹里有真图（../zuiweng-ke/img/scene-名字[-色调].webp）就自动换成真图。 */
(function(){
var SC=window.HORA_SCENES=window.HORA_SCENES||{};
var IMG="../zuiweng-ke/img/scene-";
(function(){var st=document.createElement("style");st.textContent=[
".zw-pic{position:absolute;inset:0;overflow:hidden;transition:opacity .9s ease}.zw-pic svg,.zw-pic img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}",
".zw-pic.kb svg,.zw-pic.kb img{transition:transform 2.6s cubic-bezier(.3,.1,.2,1)}",
".zw-chips{position:absolute;left:0;right:0;bottom:4%;display:flex;flex-wrap:wrap;gap:1.2cqw;justify-content:center;z-index:8;padding:0 3%}",
".zw-chip{font:inherit;font-family:var(--f-text);font-size:clamp(12px,1.9cqw,22px);padding:.45em 1em;border-radius:999px;border:2px solid rgba(255,240,200,.85);background:rgba(30,22,12,.72);color:#fff6e0;cursor:pointer;transition:transform .2s,background .2s}",
".zw-chip:hover{transform:translateY(-2px);background:rgba(60,44,20,.85)}.zw-chip.no{opacity:.45;border-color:#a55}.zw-chip.ok{background:#5b7a3d;border-color:#d9f0b0}.zw-chip.done{opacity:.55}",
".zw-card{font-family:var(--f-text)}",
".zw-tag{position:absolute;z-index:6;transform:translate(-50%,-50%);font-family:var(--f-text);font-size:clamp(11px,1.6cqw,19px);padding:.35em .8em;border-radius:.6em;background:rgba(255,250,236,.92);color:#2a2118;border:2px solid #c9a24a;cursor:pointer;box-shadow:0 6px 16px -6px rgba(0,0,0,.6)}",
".zw-tag.done{background:#e8f0da;border-color:#5b7a3d;cursor:default}",
".zw-cap{position:absolute;left:50%;top:6%;transform:translateX(-50%);max-width:86%;z-index:7;font-family:var(--f-text);font-size:clamp(13px,2.1cqw,26px);line-height:1.5;color:#fff8e6;text-shadow:0 2px 8px rgba(0,0,0,.85);text-align:center;opacity:0;transition:opacity .6s}.zw-cap.on{opacity:1}",
".zw-tiers{position:absolute;left:18%;right:18%;top:8%;bottom:8%;display:flex;flex-direction:column-reverse;gap:2.2cqw;z-index:6}",
".zw-tier{flex:1;border:2px dashed rgba(255,240,200,.6);border-radius:1.2cqw;background:rgba(20,14,8,.55);color:#e9dcc0;font-family:var(--f-text);font-size:clamp(12px,1.9cqw,22px);cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.4em;padding:0 3%;transition:all .5s}",
".zw-tier b{font-size:1.15em;letter-spacing:.1em}.zw-tier small{font-size:.78em;opacity:.85}",
".zw-tier.on{border-style:solid;background:rgba(255,246,220,.94);color:#2a2118;box-shadow:0 0 30px 4px rgba(255,214,120,.55)}.zw-tier.on.t3{background:#fff2c4}",
".zw-text{position:absolute;inset:3% 3% 3% 3%;overflow:auto;z-index:6;background:rgba(251,247,238,.97);border-radius:1.2cqw;padding:2.2cqw 3cqw;font-family:var(--f-text);font-size:clamp(13px,1.9cqw,22px);line-height:2;color:#1f1b17}",
".zw-text p{margin:0 0 .6em;text-indent:2em}",
".zw-ye{font:inherit;background:none;border:0;padding:0 .05em;cursor:pointer;color:inherit;border-radius:.25em}.zw-ye.on{background:#b8342a;color:#fff}",
".zw-cnt{position:sticky;top:0;float:right;background:#5b7a3d;color:#fff;border-radius:999px;padding:.1em .8em;font-size:.8em;font-family:var(--f-ui)}",
".zw-hid{border-bottom:2px solid #9a8a6a;color:transparent;cursor:pointer;border-radius:.2em;background:rgba(160,140,100,.15)}.zw-hid.show{color:#93261e;background:none}",
".zw-hid::first-letter{color:#1f1b17}",
".zw-pick{position:absolute;inset:0;z-index:6;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.4cqw;background:rgba(20,14,8,.45)}",
".zw-pick .zw-chip{min-width:40%}",
".zw-pick .zw-chip.done::after{content:\"  ✓ 背过了\";font-size:.75em}"
].join("\n");document.head.appendChild(st);})();

function svg(name,tone){return window.YK_SCENE?window.YK_SCENE.svg(name,tone||"day"):"";}
/* 一幅画：先放 SVG，有真图再换真图 */
function pic(A,name,tone,cls){var d=A.box(0,0,100,100,"zw-pic "+(cls||""));d.innerHTML=svg(name,tone);
  var src=IMG+name+(tone&&tone!=="day"?"-"+tone:"")+".webp",im=new Image();im.onload=function(){if(!document.body.contains(d))return;d.innerHTML="";d.append(A.el("img",{src:src,alt:"",draggable:"false"}));};im.src=src;return d;}
function swapPic(A,old,name,tone,cls){var n=pic(A,name,tone,cls);n.style.opacity="0";requestAnimationFrame(function(){requestAnimationFrame(function(){n.style.opacity="1";});});if(old)setTimeout(function(){old.remove();},950);return n;}
function cap(A,text){var c=A.box(0,0,null,null,"zw-cap");c.style.left="";c.style.top="";c.textContent=text;requestAnimationFrame(function(){c.classList.add("on");});return c;}
/* 一排选项：只有对的那个往下走；点错说 wrong */
function chips(A,list,okIdx,wrongKey){return new Promise(function(res){var row=A.box(0,0,null,null,"zw-chips");row.style.left="";row.style.top="";
  list.forEach(function(t,i){var b=A.el("button",{type:"button",class:"zw-chip",text:t});b.addEventListener("click",function(){if(!document.body.contains(row))return;
    if(i===okIdx){A.sfx("ok");b.classList.add("ok");setTimeout(function(){row.remove();res();},350);}else{A.sfx("no");b.classList.add("no");b.disabled=true;if(wrongKey)A.line(wrongKey).catch(function(){});}});row.append(b);});});}

/* ---------- 第1天 跟着镜头上山 ---------- */
SC.zoom=function(A){
  var p=pic(A,"mount","day","kb"),c;
  function zoom(sc,ox,oy){var n=p.firstChild;if(n){n.style.transformOrigin=ox+"% "+oy+"%";n.style.transform="scale("+sc+")";}}
  A.hint("按山雀说的，点下面的选项");
  return A.line("intro")
  .then(function(){return chips(A,["天上的云","四面的山","城里的屋顶"],1,"wrong");})
  .then(function(){c=cap(A,"环滁皆山也");return A.line("s1");})
  .then(function(){c.remove();return A.line("a2");})
  .then(function(){return chips(A,["北面的山","东面的山","西南的山峰"],2,"wrong");})
  .then(function(){zoom(1.8,75,58);c=cap(A,"其西南诸峰，林壑尤美……琅琊也");return A.line("s2");})
  .then(function(){c.remove();p=swapPic(A,p,"path","day","kb");return A.line("a3");})
  .then(function(){return chips(A,["👀 看一看","👂 听一听"],1,"wrong");})
  .then(function(){A.sfx("page");c=cap(A,"山行六七里，渐闻水声潺潺");return A.line("s3");})
  .then(function(){c.remove();return A.line("a4");})
  .then(function(){return chips(A,["从两座山峰之间","从天上下下来","从山下的井里"],0,"wrong");})
  .then(function(){p=swapPic(A,p,"stream","day","kb");c=cap(A,"而泻出于两峰之间者，酿泉也");return A.line("s4");})
  .then(function(){c.remove();return A.line("a5");})
  .then(function(){return chips(A,["一座桥","一座塔","一座亭"],2,"wrong");})
  .then(function(){p=swapPic(A,p,"pavilion","day","kb");c=cap(A,"峰回路转，有亭翼然临于泉上者，醉翁亭也");return A.line("s5");})
  .then(function(){return A.line("end");})
  .then(function(){A.log("山 → 琅琊 → 酿泉 → 醉翁亭");return A.button("回到课文");});
};

/* ---------- 第2天 一亭四季：点卡片，亭子换样子 ---------- */
SC.seasons=function(A){
  var p=pic(A,"pavilion","day"),c=null,seen={};
  var cards=[["dawn","日出而林霏开","dawn"],["dusk","云归而岩穴暝","dusk"],["spring","野芳发而幽香","spring"],["summer","佳木秀而繁阴","summer"],["autumn","风霜高洁","autumn"],["winter","水落而石出","winter"]];
  A.hint("点一张卡片");
  return A.line("intro").then(function(){return new Promise(function(res){var row=A.box(0,0,null,null,"zw-chips");row.style.left="";row.style.top="";var busy=false;
    cards.forEach(function(cd){var b=A.el("button",{type:"button",class:"zw-chip zw-card",text:cd[1]});b.addEventListener("click",function(){if(busy||!document.body.contains(row))return;busy=true;A.sfx("page");
      $all(row).forEach(function(x){x.disabled=true;});p=swapPic(A,p,"pavilion",cd[2]);if(c)c.remove();c=cap(A,cd[1]);
      A.line(cd[0]).then(function(){seen[cd[0]]=1;b.classList.add("done");busy=false;$all(row).forEach(function(x){x.disabled=false;});if(Object.keys(seen).length>=cards.length){row.remove();res();}},function(){});});row.append(b);});});})
  .then(function(){if(c)c.remove();p=swapPic(A,p,"pavilion","day");return A.line("end");})
  .then(function(){A.log("六张卡片都看过了");return A.button("回到课文");});
};
function $all(row){return Array.prototype.slice.call(row.querySelectorAll("button"));}

/* ---------- 第3天 游、宴、欢、醉：点四群人 ---------- */
SC.feast=function(A){
  pic(A,"feast","day");var c=null,seen={};
  var tags=[["g1",14,30,"山路上的行人"],["g2",58,44,"溪边、席上的酒菜"],["g3",80,70,"投壶下棋的宾客"],["g4",40,72,"白发的太守"]];
  A.hint("点画面上的标签，一群一群看");
  return A.line("intro").then(function(){return new Promise(function(res){var busy=false;
    tags.forEach(function(tg){var b=A.el("button",{type:"button",class:"zw-tag",text:tg[3]});b.style.left=tg[1]+"%";b.style.top=tg[2]+"%";A.frame.append(b);
      b.addEventListener("click",function(){if(busy||seen[tg[0]])return;busy=true;A.sfx("page");if(c)c.remove();
        var key={g1:"滁人游也",g2:"太守宴也",g3:"众宾欢也",g4:"太守醉也"}[tg[0]];c=cap(A,"……者，"+key);
        A.line(tg[0]).then(function(){seen[tg[0]]=1;b.classList.add("done");b.textContent=key.replace("也","");busy=false;if(Object.keys(seen).length>=4)res();},function(){});});});});})
  .then(function(){if(c)c.remove();var hold=A.box(40,60,26,null,"stg-pair");var bb=A.el("div",{class:"stg-bub think",text:A.text("think")});hold.append(bb);requestAnimationFrame(function(){bb.classList.add("on");});return A.line("think");})
  .then(function(){return A.line("end");})
  .then(function(){A.log("游、宴、欢、醉");return A.button("回到课文");});
};

/* ---------- 第4天 三层乐：从下往上点亮 ---------- */
SC.joys=function(A){
  pic(A,"pavilion","dusk");var box=A.box(0,0,null,null,"zw-tiers");box.style.left="";box.style.top="";
  var T=[["t1","禽鸟之乐","知山林之乐，而不知人之乐"],["t2","游人之乐","知从太守游而乐，而不知太守之乐其乐"],["t3","太守之乐","乐其乐：以众人之乐为乐"]],nx=0;
  A.hint("从最下面一层开始点");
  var els=T.map(function(t,i){var d=A.el("button",{type:"button",class:"zw-tier "+t[0]},[A.el("b",{text:"？"}),A.el("small",{text:"第"+"一二三"[i]+"层"})]);box.append(d);return d;});
  return A.line("intro").then(function(){return new Promise(function(res){var busy=false;
    els.forEach(function(d,i){d.addEventListener("click",function(){if(busy||d.classList.contains("on"))return;
      if(i!==nx){A.sfx("no");A.line("wrong").catch(function(){});return;}busy=true;A.sfx("ok");d.classList.add("on");d.querySelector("b").textContent=T[i][1];d.querySelector("small").textContent=T[i][2];
      A.line(T[i][0]).then(function(){nx++;busy=false;if(nx>=3)res();},function(){});});});});})
  .then(function(){return A.line("end");})
  .then(function(){A.log("禽鸟之乐 → 游人之乐 → 太守之乐");return A.button("回到课文");});
};

/* ---------- 第4天 找出二十一个“也” ---------- */
SC.ye=function(A){
  var P=(window.LESSON&&window.LESSON.paras)||[];var box=A.box(0,0,null,null,"zw-text");box.style.left="";box.style.top="";
  var cnt=A.el("span",{class:"zw-cnt",text:"0 / 21"});box.append(cnt);var total=0,got=0,said=false;
  P.forEach(function(t){var p=A.el("p");t.split("也").forEach(function(seg,i,arr){p.append(document.createTextNode(seg));if(i<arr.length-1){total++;var b=A.el("button",{type:"button",class:"zw-ye",text:"也"});p.append(b);
      b.addEventListener("click",function(){if(b.classList.contains("on"))return;b.classList.add("on");A.sfx("ok");got++;cnt.textContent=got+" / "+total;if(!said&&got>=Math.ceil(total/2)){said=true;A.line("half").catch(function(){});}if(got>=total)fin();});}});box.append(p);});
  cnt.textContent="0 / "+total;A.hint("看见“也”就点一下");var fin;
  return A.line("intro").then(function(){return new Promise(function(res){fin=res;if(got>=total)res();});})
  .then(function(){return A.line("end");})
  .then(function(){A.log("找齐了 "+total+" 个“也”");return A.button("回到课文");});
};

/* ---------- 第4天 背一背：三轮，字一点点藏起来 ---------- */
function phrases(t){var out=[],buf="";for(var i=0;i<t.length;i++){buf+=t[i];if("，。；？！：".indexOf(t[i])>=0){out.push(buf);buf="";}}if(buf)out.push(buf);return out;}
SC.beisong=function(A){
  var P=(window.LESSON&&window.LESSON.paras)||[];var done=A.get("zw4.recite")||{};pic(A,"pavilion","day");
  function menu(){return new Promise(function(res){var m=A.box(0,0,null,null,"zw-pick");m.style.left="";m.style.top="";
    P.forEach(function(t,i){var b=A.el("button",{type:"button",class:"zw-chip"+(done[i]?" done":""),text:"第"+(i+1)+"段　"+t.slice(0,8)+"……"});b.addEventListener("click",function(){A.sfx("page");m.remove();res(i);});m.append(b);});
    var fin=A.el("button",{type:"button",class:"zw-chip ok",text:"今天背到这里"});fin.addEventListener("click",function(){m.remove();res(-1);});m.append(fin);});}
  function show(i,round){var box=A.box(0,0,null,null,"zw-text");box.style.left="";box.style.top="";var p=A.el("p");
    phrases(P[i]).forEach(function(ph,k){var body=ph.replace(/[，。；？！：]$/,""),pun=ph.slice(body.length);
      var hide=round===3||(round===2&&k%2===1);
      if(!hide){p.append(document.createTextNode(ph));return;}
      p.append(document.createTextNode(body.slice(0,1)));var h=A.el("span",{class:"zw-hid",text:body.slice(1)});h.addEventListener("click",function(){h.classList.toggle("show");});p.append(h,document.createTextNode(pun));});
    box.append(p);return box;}
  function run(i){var b=show(i,1);return A.button("读熟了，藏一半").then(function(){b.remove();b=show(i,2);return A.line("r2");})
    .then(function(){return A.button("藏起全部");}).then(function(){b.remove();b=show(i,3);return A.line("r3");})
    .then(function(){return A.button("背下来了",{plain:true});}).then(function(){b.remove();done[i]=1;A.set("zw4.recite",done);A.sfx("ok");return A.line("done");});}
  function loop(){return menu().then(function(i){if(i<0)return;return run(i).then(loop);});}
  return A.line("intro").then(loop).then(function(){var n=Object.keys(done).length;A.log(n?("背过第"+Object.keys(done).map(function(k){return +k+1;}).join("、")+"段"):"没有背");return A.line("end");})
  .then(function(){return A.button("回到课文");});
};
})();
