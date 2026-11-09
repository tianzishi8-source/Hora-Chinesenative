/* 《皇帝的新装》《黑信》互动场景（11-09）。
 * 课文配置里写 {t:"scene",id:"loom"…}，引擎打开一个全屏小舞台，调这里的函数。
 * 台词都在课文配置的 lines／groups 里（录音清单从那里收），这里只管画面和玩法。
 * 画面坐标一律按图片的百分比（图都是 16:9）。 */
(function(){
var SC=window.HORA_SCENES=window.HORA_SCENES||{};
function rnd(a,b){return a+Math.random()*(b-a);}
function alive(A){return document.body.contains(A.frame);}
function d2(x1,y1,x2,y2){var dx=x1-x2,dy=(y1-y2)*9/16;return Math.sqrt(dx*dx+dy*dy);}
/* 一个接一个地说（点得快也不会抢话） */
function queue(){var q=Promise.resolve();return function(fn){q=q.then(fn,fn);return q;};}
function sparkAt(A,x,y,n){for(var i=0;i<(n||1);i++){var d=A.box(x+rnd(-2.5,2.5),y+rnd(-3,3),null,null,"spark");var c=Math.random()<.55?"#ffd75e":"#2ec4c9";d.style.background=c;d.style.boxShadow="0 0 10px 2px "+c;d.style.setProperty("--dx",rnd(-50,50)+"px");d.style.setProperty("--dy",rnd(-80,-15)+"px");(function(d){setTimeout(function(){d.remove();},1900);})(d);}}

/* ---------- 1 织布间：拿放大镜找布 ---------- */
SC.loom=function(A){
  A.img("img/loom.webp");
  var hands=[[36,12],[40,57],[29,15],[34,60],[38,55]],power=1;
  var tm=setInterval(function(){if(!alive(A))return clearInterval(tm);var h=hands[Math.floor(Math.random()*hands.length)];sparkAt(A,h[0],h[1],power);},420);
  function sweat(n){for(var i=0;i<n;i++)setTimeout(function(){if(!alive(A))return;var d=A.box(rnd(75,82),rnd(25,31),null,null,"sweat");setTimeout(function(){d.remove();},1700);},i*380);}
  var dots=A.box(80,3,null,null,"stg-dots",[document.createTextNode("找过 ")]);dots.style.left="auto";
  var Z=[[46,20],[63,22],[52,46],[66,48],[57,72]],got={},n=0,need=4;
  var marks=Z.map(function(z,i){var b=A.el("button",{type:"button",class:"zone","data-auto":"1","aria-label":"织布机的第"+(i+1)+"处"});b.style.left=z[0]+"%";b.style.top=z[1]+"%";b.addEventListener("click",function(){move(z[0],z[1]);});A.frame.append(b);return b;});
  for(var i=0;i<need;i++)dots.append(A.el("i"));
  var lens=A.box(30,82,null,null,"lens");lens.style.backgroundImage="url(img/loom.webp)";var note=A.el("span",{class:"lens-note",text:"什么也没有"});lens.append(note);
  var MAG=2.2;
  function paint(x,y){var W=A.frame.clientWidth,H=A.frame.clientHeight,D=lens.offsetWidth||W*.24;lens.style.backgroundSize=(W*MAG)+"px "+(H*MAG)+"px";lens.style.backgroundPosition=(D/2-x/100*W*MAG)+"px "+(D/2-y/100*H*MAG)+"px";}
  var LX=30,LY=82,say=queue(),done=null,finished=new Promise(function(r){done=r;});
  var talk=["z1","z2","z3","z4"];
  function move(x,y){LX=x;LY=y;lens.style.left=x+"%";lens.style.top=y+"%";paint(x,y);
    Z.forEach(function(z,i){if(got[i]||n>=need)return;if(d2(x,y,z[0],z[1])<5.5){got[i]=1;var k=talk[n];n++;marks[i].classList.add("got");marks[i].removeAttribute("data-auto");dots.querySelectorAll("i")[n-1].classList.add("on");
      note.classList.add("on");setTimeout(function(){note.classList.remove("on");},1300);A.sfx("page");power=Math.min(5,power+1);sweat(n+1);
      var h=hands[n%hands.length];sparkAt(A,h[0],h[1],8);
      say(function(){return A.line(k);});if(n>=need)say(function(){return done();});}});}
  A.drag(A.frame,move);move(LX,LY);window.addEventListener("resize",function(){if(alive(A))paint(LX,LY);});
  return A.line("intro").then(function(){A.hint("拖动放大镜（或点织布机上的小圈），找一找那块布。");return finished;}).then(function(){
    A.hint("");marks.forEach(function(m){m.remove();});lens.style.opacity=".0";sweat(4);
    var b=A.bubble(70,20,A.text("think"),"think");b.style.maxWidth="34%";
    return A.line("think");}).then(function(){return A.line("end");}).then(function(){clearInterval(tm);return A.button("开口说话");});
};

/* ---------- 2 游行：说的、想的，和一个孩子 ---------- */
SC.parade=function(A){
  A.img("img/parade.webp");
  var P=[{k:"emp",x:63,y:8,w:22,h:60,l:30,t:5,name:"皇帝"},
         {k:"sw",x:24,y:20,w:31,h:50,l:61,t:5,name:"两个骗子"},
         {k:"min",x:16.5,y:17,w:9,h:22,l:28,t:4,name:"老大臣"},
         {k:"bear",x:53,y:12,w:10,h:56,l:9,t:6,name:"托后裙的内臣"},
         {k:"wom",x:15,y:62,w:22,h:38,l:42,t:52,name:"街上的人"}];
  var seen={},cnt=0,busy=false,pair=null,cur=null,unlocked=null,un=new Promise(function(r){unlocked=r;});
  function clearPair(){if(pair){pair.remove();pair=null;}if(cur)cur.classList.remove("on");}
  P.forEach(function(p){var h=A.hot(p.x,p.y,p.w,p.h,p.name,function(){if(busy)return;busy=true;clearPair();cur=h;h.classList.add("on");
      pair=A.box(p.l,p.t,null,null,"stg-pair");var s1=A.el("div",{class:"stg-bub say",text:A.text(p.k+"_s")}),s2=A.el("div",{class:"stg-bub think",text:A.text(p.k+"_t")});pair.append(s1,s2);
      requestAnimationFrame(function(){s1.classList.add("on");});
      A.line(p.k+"_s").then(function(){s2.classList.add("on");return A.line(p.k+"_t");}).then(function(){busy=false;if(!seen[p.k]){seen[p.k]=1;cnt++;h.classList.add("done");h.removeAttribute("data-auto");}if(cnt>=4)unlocked();},function(){busy=false;});});
    h.setAttribute("data-auto","1");});
  var kid=null,kidTap=null,kidP=new Promise(function(r){kidTap=r;});
  return A.line("intro").then(function(){A.hint("点街上的人：白色是嘴上说的，灰色是心里想的。看四个人。");return un;}).then(function(){
    A.hint("");return A.line("find");}).then(function(){
    A.hint("找到那个一直没开口的人，点他。");
    kid=A.hot(7,27,12,22,"骑在爸爸肩上的孩子",function(){kid.disabled=true;kid.classList.remove("glow");kid.removeAttribute("data-auto");kidTap();});kid.classList.add("glow");kid.setAttribute("data-auto","1");
    return kidP;}).then(function(){
    A.hint("");clearPair();$all(A.frame,".stg-hot").forEach(function(h){if(h!==kid)h.disabled=true;});
    var b=A.bubble(25,24,A.text("kid"),"say");b.classList.add("big");
    for(var i=0;i<3;i++)(function(i){setTimeout(function(){A.box(14,38,null,null,"wave");},i*450);})(i);
    return A.line("kid");}).then(function(){
    var b=A.bubble(31,53,A.text("dad"),"say");return A.line("dad");}).then(function(){
    $all(A.frame,".stg-bub").forEach(function(b){b.classList.add("fade");});
    var W=[[9,18,"有一个小孩子说……"],[30,22,"他并没有穿什么衣服！"],[47,26,"嘘……小孩子说的……"],[73,33,"有一个小孩子说……"],[92,28,"他并没有穿……"],[56,58,"小孩子说的呀……"]];
    W.forEach(function(w,i){setTimeout(function(){if(!alive(A))return;var b=A.bubble(w[0],w[1],w[2],"say");b.classList.add("small","plain");A.box(w[0],w[1]+6,null,null,"wave");},300+i*420);});
    return A.line("whisper");}).then(function(){return A.wait(600);}).then(function(){
    $all(A.frame,".stg-bub").forEach(function(b){b.classList.add("fade");});
    var B=[[20,19],[44,27],[80,22],[52,63],[74,44]];B.forEach(function(p,i){setTimeout(function(){if(!alive(A))return;var b=A.bubble(p[0],p[1],A.text("all"),"say");b.classList.add("big","plain");b.style.whiteSpace="nowrap";b.style.maxWidth="none";},i*260);});
    return A.line("all");}).then(function(){return A.wait(500);}).then(function(){
    $all(A.frame,".stg-bub").forEach(function(b){b.classList.add("fade");});return A.line("shake");}).then(function(){
    var t=A.bubble(62,8,A.text("emp_end"),"think");t.classList.add("below");return A.line("emp_end");}).then(function(){return A.line("proud");}).then(function(){return A.button("继续");});
};
function $all(r,sel){return Array.prototype.slice.call(r.querySelectorAll(sel));}

/* ---------- 3 黑信：一封信 → 五十来遍 → 国务会议 → 贴满全城 ---------- */
SC.blackletter=function(A){
  var bg=A.img("img/carriage.webp");var chip=A.box(2,90,null,null,"chip");chip.textContent="一　收到黑信";chip.style.top="auto";
  var tapP;
  function tapOnce(x,y,w,h,label){return new Promise(function(r){var hh=A.hot(x,y,w,h,label,function(){hh.disabled=true;hh.classList.remove("glow");hh.removeAttribute("data-auto");r(hh);});hh.classList.add("glow");hh.setAttribute("data-auto","1");});}
  function swap(src){var n=A.img(src,"hide");requestAnimationFrame(function(){requestAnimationFrame(function(){n.classList.remove("hide");});});var old=bg;bg=n;setTimeout(function(){old.remove();},1300);return A.wait(900);}
  return A.line("c1").then(function(){A.hint("飘下来的是什么？点一点它。");return tapOnce(51,26,13,20,"飘下来的信");}).then(function(h){
    A.hint("");h.remove();var p=A.box(50,50,null,null,"paper");p.innerHTML="陛下，您是世界上最傻的傻瓜，傻瓜中的傻瓜！<small>（没有署名）</small>";requestAnimationFrame(function(){p.classList.add("on");});A.sfx("page");
    return A.line("read").then(function(){return A.line("c2");}).then(function(){p.classList.remove("on");return A.wait(400);}).then(function(){p.remove();});}).then(function(){
    return swap("img/letter.webp");}).then(function(){return A.line("c3");}).then(function(){
    var cnt=A.box(2,3,null,null,"stg-count");cnt.innerHTML="念了 <b>1</b> 遍";var k=1,steps=[6,15,31,50];var dn,doneP=new Promise(function(r){dn=r;});
    A.hint("他念了多少遍？点国王，让他再念。");
    var king=A.hot(38,10,38,85,"国王",function(){if(king._b)return;king._b=1;var to=steps.shift();A.sfx("page");
      for(var i=0;i<6;i++){var f=A.box(rnd(48,62),rnd(30,45),null,null,"flying");f.style.setProperty("--dx",rnd(-300,300)+"px");f.style.setProperty("--dy",rnd(80,260)+"px");(function(f){setTimeout(function(){f.remove();},1200);})(f);}
      var t=setInterval(function(){k++;cnt.innerHTML="念了 <b>"+k+"</b> 遍";if(k>=to){clearInterval(t);if(!steps.length){king.disabled=true;king.removeAttribute("data-auto");king.classList.remove("glow");dn();}}},40);
      A.line("mutter").then(function(){king._b=0;},function(){});});
    king.classList.add("glow");king.setAttribute("data-auto","1");
    return doneP.then(function(){A.hint("");cnt.innerHTML="念了 <b>五十来</b> 遍";return A.line("noname");}).then(function(){king.remove();return A.wait(500);}).then(function(){cnt.remove();});}).then(function(){
    /* 国务会议 */
    chip.textContent="二　开会议处";return swap("img/council.webp");}).then(function(){return A.line("c4");}).then(function(){
    A.hint("点会上的人，听他们说什么。（国王、男爵卡尔、首相、警察局长）");
    var who=[{k:"k1",x:37,y:20,w:25,h:48,name:"国王",bx:50,by:22},{k:"karl",x:16,y:33,w:14,h:35,name:"男爵卡尔",bx:24,by:33},{k:"pm",x:66,y:7,w:13,h:42,name:"首相",bx:73,by:8},{k:"chief",x:11,y:4,w:16,h:34,name:"警察局长",bx:22,by:6,below:true}];
    var seen=0,busy=false,dn,doneP=new Promise(function(r){dn=r;});
    who.forEach(function(p){var h=A.hot(p.x,p.y,p.w,p.h,p.name,function(){if(busy||h._d)return;busy=true;h.classList.add("on");
        $all(A.frame,".stg-bub").forEach(function(b){b.remove();});
        var b=A.bubble(p.bx,p.by,A.text(p.k),"say",p.below?"below":"");
        var go=A.line(p.k);if(p.k==="karl")go=go.then(function(){$all(A.frame,".stg-bub").forEach(function(b){b.remove();});var b2=A.bubble(50,22,A.text("k2"),"say");return A.line("k2");});
        if(p.k==="k1")go=go.then(function(){return A.line("pale");});
        go.then(function(){busy=false;h._d=1;h.classList.remove("on");h.classList.add("done");h.removeAttribute("data-auto");if(++seen>=who.length)dn();},function(){busy=false;});});
      h.setAttribute("data-auto","1");});
    return doneP;}).then(function(){
    A.hint("");$all(A.frame,".stg-hot,.stg-bub").forEach(function(x){x.remove();});
    /* 贴告示 */
    chip.textContent="三　贴出告示";return swap("img/street-calm.webp");}).then(function(){return A.line("c5");}).then(function(){
    var R=[[28,23,7,15],[52,19,5,13],[0,9,5.5,15],[6.5,7,9,17],[47.5,22,4.5,12],[60,11,6,16],[50,37,7,16],[69,8,6,17],[59,34,6,18],[86,33,9,17],[78,5,5,15],[85,0,10,18],[2,26,10,13],[39,31,4,9],[35,29,4,10],[51,57,4.5,15],[96.5,7,3.5,15],[44.5,27,3.5,11],[15.5,8,2.5,16]];
    var batches=[2,5,6,R.length-13],labels=["贴告示","再贴一批","贴满全城","贴满全国"],people=["2 个人","200 个人","5000 个人","全国的人"],shown=0;
    var cnt=A.box(2,3,null,null,"stg-count");cnt.innerHTML="知道“国王是傻瓜”的：<b>国王一个人</b>";
    A.hint("点下面的按钮，帮警察局长贴告示。");
    var chain=Promise.resolve();
    labels.forEach(function(lb,i){chain=chain.then(function(){return A.button(lb,{plain:true});}).then(function(){
      for(var j=0;j<batches[i]&&shown<R.length;j++,shown++)(function(r,j){setTimeout(function(){if(!alive(A))return;var p=A.box(r[0],r[1],r[2],r[3],"poster");requestAnimationFrame(function(){p.classList.add("on");});},j*140);})(R[shown],j);
      A.sfx("page");cnt.innerHTML="知道“国王是傻瓜”的：<b>"+people[i]+"</b>";
      if(i===0)return A.line("notice");if(i===3)return A.wait(1200);return A.wait(900);});});
    return chain.then(function(){A.hint("");return swap("img/posters.webp");}).then(function(){$all(A.frame,".poster").forEach(function(p){p.style.transition="opacity 1s";p.style.opacity="0";});return A.line("c6");}).then(function(){cnt.innerHTML="知道“国王是傻瓜”的：<b>全国的人</b>";return A.line("c7");});}).then(function(){
    return A.button("继续");});
};

/* ---------- 4 放大镜：笑脸后面藏着什么 ---------- */
SC.lens=function(A){
  A.img("img/clap.webp");var inner=A.img("img/clap-worry.webp","lensclip");
  var ring=A.box(50,72,null,null,"ring");
  var S=[{k:"min",x:[[28,22]],name:"老大臣"},{k:"emp",x:[[88,21]],name:"皇帝"},{k:"sw",x:[[16,42],[23,63]],name:"两个骗子"},{k:"ct",x:[[8,20],[13,14],[36,21],[74,25]],name:"随员们"}];
  var got={},n=0,say=queue(),dn,doneP=new Promise(function(r){dn=r;});
  var dots=A.box(80,3,null,null,"stg-dots",[document.createTextNode("找到 ")]);dots.style.left="auto";S.forEach(function(){dots.append(A.el("i"));});
  var LX=50,LY=72;
  function clip(x,y){var W=A.frame.clientWidth,R=W*.13;inner.style.clipPath="circle("+R+"px at "+(x/100*W)+"px "+(y/100*A.frame.clientHeight)+"px)";inner.style.webkitClipPath=inner.style.clipPath;}
  function move(x,y){LX=x;LY=y;var W0=A.frame.clientWidth*.26;ring.style.width=ring.style.height=W0+"px";ring.style.left=x+"%";ring.style.top=y+"%";clip(x,y);
    S.forEach(function(s,i){if(got[s.k])return;s.x.forEach(function(p){if(got[s.k])return;if(d2(x,y,p[0],p[1])<6){got[s.k]=1;n++;dots.querySelectorAll("i")[n-1].classList.add("on");A.sfx("page");
      var b=A.bubble(Math.min(80,Math.max(20,p[0])),Math.max(4,p[1]+12),A.text(s.k),"think","below");b.style.maxWidth="28%";
      $all(A.frame,'[data-k="'+s.k+'"]').forEach(function(h){h.removeAttribute("data-auto");});
      say(function(){return A.line(s.k).then(function(){return A.wait(700);}).then(function(){b.classList.add("fade");});});if(n>=S.length)say(function(){dn();});}});});}
  S.forEach(function(s){var p=s.x[0];var h=A.hot(p[0]-3,p[1]-5,6,10,s.name,function(){move(p[0],p[1]);});h.setAttribute("data-auto","1");h.setAttribute("data-k",s.k);h.style.boxShadow="none";});
  A.drag(A.frame,move);move(LX,LY);window.addEventListener("resize",function(){if(alive(A))clip(LX,LY);});
  return A.line("intro").then(function(){A.hint("拖动放大镜，照一照每一张笑脸。找到四处。");return doneP;}).then(function(){
    A.hint("");inner.style.transition="clip-path 1.6s ease";var W=A.frame.clientWidth;inner.style.clipPath="circle("+(W*1.2)+"px at "+(LX/100*W)+"px "+(LY/100*A.frame.clientHeight)+"px)";ring.style.opacity="0";
    return A.wait(1200);}).then(function(){return A.line("end");}).then(function(){return A.button("继续");});
};

/* ---------- 5 小剧场：点角色，听示范 ---------- */
SC.theater=function(A,s){
  var G=s.groups,bg=null,dim=A.box(0,0,100,100,"stg-dim");
  A.box(0,0,null,null,"curtain l");var r=A.box(0,0,null,null,"curtain r");r.style.left="auto";A.box(0,0,100,null,"valance");
  var tabs=A.box(50,9,null,null,"tabs"),roles=A.box(10,0,null,null,"roles");roles.style.top="auto";roles.style.left="";
  var card=A.box(19,21,null,null,"hintcard");
  var played=0,busy=0,cur=0,dn,doneP=new Promise(function(r){dn=r;});
  function show(gi){cur=gi;$all(tabs,"button").forEach(function(b,i){b.setAttribute("aria-pressed",String(i===gi));});
    var n=A.img(G[gi].bg,"hide");n.style.zIndex=1;A.frame.insertBefore(n,dim);requestAnimationFrame(function(){requestAnimationFrame(function(){n.classList.remove("hide");});});if(bg){var o=bg;setTimeout(function(){o.remove();},1300);}bg=n;
    card.classList.remove("on");roles.innerHTML="";
    G[gi].roles.forEach(function(ro,ri){var b=A.el("button",{type:"button",class:"role","aria-label":ro.name},[A.el("span",{class:"av"}),A.el("span",{text:ro.name})]);
      var av=b.firstChild;if(ro.av)av.style.backgroundImage="url("+ro.av+")";else av.textContent="书";
      if(gi===0&&ri===0)b.setAttribute("data-auto","1");
      b.addEventListener("click",function(){if(busy)return;play(ro,b);});roles.append(b);});}
  function play(ro,b){busy=1;$all(roles,".role").forEach(function(x){x.classList.remove("on");});b.classList.add("on");b.removeAttribute("data-auto");
    card.innerHTML="";card.append(A.el("span",{class:"hd",text:G[cur].name+"　·　"+ro.name}));
    var ps=ro.lines.map(function(l){var p=A.el("p",{},[A.el("span",{class:"note",text:l[1]?l[1]+" ":""}),document.createTextNode(l[2])]);card.append(p);return p;});card.classList.add("on");
    var ch=Promise.resolve();ro.lines.forEach(function(l,i){ch=ch.then(function(){ps.forEach(function(p,j){p.classList.toggle("cur",i===j);});return A.speak(l[0],l[2],{min:900});});});
    ch.then(function(){busy=0;b.classList.add("done");ps.forEach(function(p){p.classList.remove("cur");});if(++played===1){A.hint("换一个角色，或者换一组。听够了就点“排练完了”。");A.button("排练完了").then(dn);}},function(){busy=0;});}
  G.forEach(function(g,i){var b=A.el("button",{type:"button",text:g.name});b.addEventListener("click",function(){if(!busy)show(i);});tabs.append(b);});
  show(0);
  return A.line("intro").then(function(){A.hint("先点你演的角色，听一遍示范；括号里是动作和心理，不念出来。");return doneP;});
};
})();
