// 检查一课的剧情、字词、测验：跳转、原文卡的词、答案。用法：node ke/tools/check.js 课文夹
const fs=require("fs"),vm=require("vm"),path=require("path");const dir=process.argv[2];const c={window:{}};
["conf.js","data/text.js","data/story.js","data/words.js","data/tests.js"].forEach(f=>{const p=path.join(dir,f);if(fs.existsSync(p))vm.runInNewContext(fs.readFileSync(p,"utf8"),c);});
const W=c.window,T=W.YK_TEXT,S=W.YK_STORY||[],C=W.YK_CONF||{};let bad=0;const err=(...a)=>{console.log(...a);bad++};
const keys=new Set((C.scenes||[]).concat(Object.keys(C.img||{})));
S.forEach(ch=>{const N=ch.nodes;if(!N[ch.start])err("no start",ch.id);Object.keys(N).forEach(k=>{const n=N[k];
 if(n.next&&!N[n.next])err("bad next",ch.id,k,n.next);(n.choices||[]).forEach(x=>{if(!N[x.go])err("bad go",ch.id,k,x.go)});
 const shots=[n.shot].concat((n.lines||[]).map(l=>l.shot)).filter(Boolean);shots.forEach(s=>{if(s.bg&&!keys.has(s.bg))err("scene not in conf",ch.id,k,s.bg)});
 if(n.card&&n.card.para){const cd=n.card,P=T.paras[cd.para];if(!P)err("no para",ch.id,k);else{const gs=cd.groups||[{s:cd.s||[0,99]}];const txt=gs.map(g=>P.slice(g.s[0],g.s[1]+1).join("")).join("");
  [].concat(cd.red||[],Object.keys(cd.notes||{}),...Object.values(cd.cats||{})).forEach(w=>{if(txt.indexOf(w)<0)err("card word",ch.id,k,w)});}}
 if(n.card)(n.lines||[]).forEach(l=>{if(!l.hi)return;const cd=n.card,all=[].concat(cd.red||[],Object.keys(cd.notes||{}),...Object.values(cd.cats||{}),(cd.rows||[]).map(r=>r[0]),cd.foot?["foot"]:[]);[].concat(l.hi).forEach(h=>{if(all.indexOf(h)<0)err("hi",ch.id,k,h)})});
 if(n.quiz&&n.quiz.opts.indexOf(n.quiz.ans)<0)err("quiz ans",ch.id,k);(n.review||[]).forEach(r=>{if(r.opts&&r.opts.indexOf(r.ans)<0)err("rv ans",r.id)});
 if(n.quiz&&n.quiz.sent){const all=Object.values(T.paras).flat().join("");if(all.indexOf(n.quiz.sent.replace(/[【】]/g,""))<0)err("quiz sent",ch.id,k)}
});});
const sents=Object.values(T.paras).flat(),flat=sents.join("").replace(/[，。？！；“”：、]/g,"");
(W.YK_WORDS||[]).forEach(w=>{if(!sents.includes(w.sent.replace(/[【】]/g,"")))err("word sent",w.id);if(w.opts.indexOf(w.ans)<0||w.opts.length!==4)err("word opts",w.id)});
(W.YK_TESTS||[]).forEach(t=>{let p=0;t.items.forEach(i=>{p+=i.pts;if(i.type==="fill")i.ans.forEach(a=>{if(flat.indexOf(a.replace(/[，。？！]/g,""))<0)err("fill",i.id,a)});if(i.type==="choice"&&!(i.ans>=0&&i.ans<i.opts.length))err("ans idx",i.id)});if(p!==100)err("pts",t.id,p)});
console.log(dir,"chapters",S.length,"words",(W.YK_WORDS||[]).length,"tests",(W.YK_TESTS||[]).length,"problems",bad);
