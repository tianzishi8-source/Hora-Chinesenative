/* 《岳阳楼记》第12节（剧场版）· 收尾：楼上的最后一夜 —— 约 20 分钟，和 zw-1（《醉翁亭记》开头）合成今天的一节课。
 * 11-18 老师：剩下的课时不多，今天把《岳阳楼记》收尾、《醉翁亭记》开头。
 * 剧场：全班仍是范公在邓州的邻家少年“我”（虚构）。第5段第3、4节已学过（写给谁、先忧后乐），这里不重讲，只在情境里让范公“说出答案”，
 *   全班替“我”把问题问出来；然后五幅画面串起全文背诵；范公告别时提到被贬到滁州的朋友欧阳修，引向《醉翁亭记》。
 * 铁律：伴学不揭晓答案、不评价对错；范公不用现代词、不说教、不提杜甫；“跟范公登楼”是范公写记时心里看到的岳阳楼（想象）。
 * 口径：译文同 ../yueyanglou-ke/data/sents.js 的 tr；“写给滕子京、有规劝之意”是常见解读（同 yyl-4.js）。
 * 史实：欧阳修庆历五年（1045）因支持范仲淹的革新被贬知滁州；庆历六年（1046）范仲淹作《岳阳楼记》，一般认为写于邓州。
 * 环节：回到楼上3、范公的答案7、串镜头背8、告别2，共 20 分钟。
 */
function yylHint(s) { return (s.match(/[^，。！；？]+[，。！；？]?/g) || [s]).map(function (x) { return x.split("").join("⁠"); }).join(""); }
/* 背诵提示：每个分句只留开头两个字（分句不超过 3 个字就整句留着），“登斯楼也”整句留着 */
function head2(s) {
  return yylHint((s.match(/[^，。！；？]+[，。！；？]?/g) || [s]).map(function (x) {
    var body = x.replace(/[，。！；？]$/, ""), p = x.slice(body.length);
    return (body.length <= 3 || body === "登斯楼也") ? x : body.slice(0, 2) + "……" + p;
  }).join(""));
}
window.PROJ_LESSON = {
  id: "g9-yueyanglou-k12",
  title: "岳阳楼记",
  sub: "收尾（剧场版）· 楼上的最后一夜",
  short: "收尾 剧场版",
  lead: "fan", leadEnters: false, layout: "exam",
  klass: "g9",
  scene: "5b-tower.webp", sceneSoft: false,
  assets: {
    chars: "../chars/",
    img: "../yueyanglou/img/",
    font: "../yueyanglou/font/wenkai.woff2",
    paper: "../img/paper.webp",
    sheet: ""
  },
  nudges: [{ who: "qx", say: "嘿，眼睛看画面，跟上！" }, { who: "cg", say: "别走神，范公在等我们呢！" }, { who: "hy", say: "声音跟上，每个人都要开口。" }],
  nudgesLook: [{ who: "cg", say: "眼睛看画面，跟上！" }, { who: "qx", say: "别走神，这里是重点。" }, { who: "hy", say: "回到楼上来，最后一夜了。" }],
  cast: {
    hy:  { name: "徽音老师", sprite: "teacher", outfit: "daily", x: -183,
           face: { idle: null, talk: "talk", blink: "blink", think: "think", happy: "smile" },
           voice: { prefer: ["Xiaoxiao", "女"], rate: 0.94, pitch: 0.97 } },
    fan: { name: "范仲淹", sprite: "fanzhongyan", outfit: "ancient", x: 150,
           voice: { prefer: ["Yunyang", "Kangkang", "Yunjian", "Yunxi", "男"], rate: 0.88, pitch: 0.8 } },
    cg:  { name: "长歌", sprite: "changge", outfit: "ancient", x: 1218, face: { idle: null, talk: "talk", blink: "blink", think: "think", happy: "smile" },
           voice: { prefer: ["Yunxi", "Yunjian", "男"], rate: 1.0, pitch: 1.0 } },
    qx:  { name: "清弦", sprite: "qingxian", outfit: "ancient", x: 1470, face: { idle: "idle", talk: "talk", blink: "blink", think: "think", happy: null },
           voice: { prefer: ["Xiaoyi", "Xiaoxiao", "女"], rate: 0.98, pitch: 1.06 } }
  },
  paras: {},
  ruby: {},
  voiceFix: [["嗟夫", "嗟扶"], ["予尝", "余尝"], ["何时而乐耶", "何时而勒耶"], ["之乐而乐", "之勒而勒"], ["欤", "鱼"],
    ["处江湖", "楚江湖"], ["二者之为", "二者之维"], ["浩浩汤汤", "浩浩商商"], ["朝晖", "招晖"],
    ["若夫", "若扶"], ["属予", "嘱余"], ["予观夫", "余观扶"], ["噫", "衣"]],
  segments: [
    { t: "回到楼上", s: "回到楼上", min: 3, steps: [
      { vis: { type: "pic", img: "5b-tower.webp", cap: "想象：范公心里的岳阳楼（示意）" },
        who: "hy", say: "又回到邓州了。你还是范公的邻家少年。范公写记时，心里登上了岳阳楼；今晚，是我们跟着他的想象登楼的最后一夜。" },
      { who: "hy", say: "三趟楼，我们走过了。阴雨天，登楼的人就悲；晴天、月夜，登楼的人就喜。" },
      { cue: { k: "say", t: "阴雨——悲！　晴明——喜！" }, note: "全班一起说！",
        ask: "全班一起，大声说：阴雨，悲！晴明，喜！", by: "cg", hold: true,
        tip: "全班说一遍。声音小，就再来一遍。" },
      { who: "cg", say: "那天我问：那范公自己呢？他站在楼上，是什么心情？今天，我一定要问到！", face: "think" },
      { who: "qx", say: "长歌，你别急。范公要开口了。", face: "happy" }
    ]},
    { t: "范公的答案", s: "答案", min: 7, steps: [
      { vis: { type: "pic", img: "5b-xiantun2.webp", cap: "想象：楼上远眺，夕阳（示意）", line: yylHint("嗟夫！予尝求古仁人之心，或异二者之为，何哉？") },
        who: "fan", say: "嗟夫！予尝求古仁人之心，或异二者之为，何哉？", face: "think" },
      { who: "fan", say: "唉！我曾经探求古时品德高尚的人的心思，他们或许不同于以上两种人的心理表现，为什么呢？" },
      { vis: { type: "pic", img: "5b-xiantun2.webp", cap: "想象：楼上远眺，夕阳（示意）", big: ["物", "己"], line: yylHint("不以物喜，不以己悲，") },
        cue: { k: "catch", t: "回忆：“不以物喜，不以己悲”是什么意思？" }, note: "全班抢着说！我们学过的！",
        ask: "这句我们学过。不以物喜，不以己悲，是什么意思？全班抢着说！", by: "hy", hold: true,
        tip: "听到“不因为外物、不因为自己的得失就喜或悲”这类说法，就点“继续”。如果只说成“不因外物而喜，不因自己而悲”，也点“继续”，范公会把两句合起来说。" },
      { who: "fan", say: "不因外物好坏和自己得失而或喜或悲。下雨也好，天晴也好，我的心，不跟着它走。", sfx: "qing" },
      { who: "hy", say: "“不以物喜，不以己悲”，两句要合起来理解，这叫互文。翻译时别拆成两半。" },
      { vis: { type: "pic", img: "5b-tower.webp", cap: "想象：范公心里的岳阳楼（示意）", line: yylHint("居庙堂之高，则忧其民，处江湖之远，则忧其君。是进亦忧，退亦忧。") },
        cue: { k: "gesture", t: "庙堂：手举高　江湖：手伸远" }, note: "全班一起做！",
        ask: "全班一起做！范公读到庙堂之高，手举高；读到江湖之远，手往远处伸。", by: "qx", hold: true,
        tip: "做好准备动作，点“继续”，范公读，全班跟着做。" },
      { who: "fan", say: "居庙堂之高，则忧其民，处江湖之远，则忧其君。是进亦忧，退亦忧。" },
      { who: "fan", say: "在朝廷上做高官，就担忧他的百姓；处在远离朝廷的偏远地方，就担忧他的国君。这样在朝廷做官也担忧，远离朝廷也担忧。" },
      { who: "cg", say: "（挠挠头）进也忧，退也忧……那他什么时候才高兴啊？", face: "think" },
      { vis: { type: "pic", img: "5b-tower.webp", cap: "想象：范公心里的岳阳楼（示意）", big: ["乐"], line: yylHint("然则何时而乐耶？") },
        cue: { k: "say", t: "全班替“我”问范公：然则何时而乐耶？（然则：那么）" }, note: "全班一起，大声问！",
        ask: "长歌问出了大家心里的话：那么，什么时候才快乐呢？全班替少年，用文言大声问范公：然则何时而乐耶？", by: "hy", hold: true,
        tip: "声音要大，像真的在问。小声就再问一遍。" },
      { vis: { type: "pic", img: "5b-moon.webp", cap: "想象：月夜的洞庭湖（示意）", line: yylHint("其必曰“先天下之忧而忧，后天下之乐而乐”欤！") },
        who: "fan", say: "其必曰“先天下之忧而忧，后天下之乐而乐”欤！", sfx: "qing" },
      { who: "fan", say: "他们大概一定会说：在天下人担忧之前先担忧，在天下人快乐之后才快乐吧！" },
      { cue: { k: "say", t: "全班齐读：先天下之忧而忧，后天下之乐而乐" }, note: "全班一起读，读两遍！",
        ask: "这是全文最重要的一句。全班一起，读两遍：先天下之忧而忧，后天下之乐而乐！", by: "hy", hold: true,
        tip: "读两遍，点“继续”。" },
      { vis: { type: "pic", img: "5b-moon.webp", cap: "想象：月夜的洞庭湖（示意）", line: yylHint("噫！微斯人，吾谁与归？") },
        who: "fan", say: "噫！微斯人，吾谁与归？唉！如果没有这样的人，我同谁一道呢？", face: "think" },
      { cue: { k: "call", t: "替“我”对范公说一句话", n: 1 }, note: "点到名的同学，站起来，大声说！",
        who: "fan", say: "孩子，这句话，我也想说给老朋友子京听。你呢？听完了，想对我说一句什么？站起来，大声说。", hold: true,
        tip: "点 1 位同学站起来说。说完点“继续”。" },
      { who: "fan", say: "（点点头）孩子，你的话，我记下了。", face: "happy" },
      { who: "qx", say: "原来范公自己的心情，不跟着阴晴走，跟着天下人走。", face: "think" }
    ]},
    { t: "串镜头背全文", s: "背", min: 8, steps: [
      /* 每幅画面全班背一段；卡住了，伴学只说“那一刻是什么样子”，不念原句。时间紧就只背第5段（最后一幅）。 */
      { vis: { type: "pic", img: "5b-tower.webp", cap: "第1段：重修岳阳楼（示意）", line: head2("庆历四年春，滕子京谪守巴陵郡。越明年，政通人和，百废具兴，乃重修岳阳楼，增其旧制，刻唐贤今人诗赋于其上，属予作文以记之。") },
        who: "hy", say: "最后，跟着五幅画面，把全文背一遍，每句只留开头两个字。第1段：子京来了，修好了楼，请范公写记。全班一起！", hold: true,
        tip: "全班背第1段。时间不够，就一直点“继续”，点到画面标着“第5段”的那一幅，只背第5段。" },
      { vis: { type: "pic", img: "5b-xiantun.webp", cap: "第2段：洞庭大观（示意）", line: head2("予观夫巴陵胜状，在洞庭一湖。衔远山，吞长江，浩浩汤汤，横无际涯；朝晖夕阴，气象万千。此则岳阳楼之大观也，前人之述备矣。然则北通巫峡，南极潇湘，迁客骚人，多会于此，览物之情，得无异乎？") },
        who: "cg", say: "第2段！站在楼上，先看洞庭湖的大景，再想想：哪些人常到这里来？声音开阔一点！", hold: true,
        tip: "全班背第2段，背完点“继续”。" },
      { vis: { type: "pic", img: "5b-storm.webp", cap: "第3段：阴雨（示意）", line: head2("若夫淫雨霏霏，连月不开，阴风怒号，浊浪排空，日星隐曜，山岳潜形，商旅不行，樯倾楫摧，薄暮冥冥，虎啸猿啼。登斯楼也，则有去国怀乡，忧谗畏讥，满目萧然，感极而悲者矣。") },
        who: "qx", say: "第3段，雨下了几个月。声音压低。", hold: true,
        tip: "全班背第3段，背完点“继续”。" },
      { vis: { type: "pic", img: "5b-moon.webp", cap: "第4段：春晴与月夜（示意）", line: head2("至若春和景明，波澜不惊，上下天光，一碧万顷，沙鸥翔集，锦鳞游泳，岸芷汀兰，郁郁青青。而或长烟一空，皓月千里，浮光跃金，静影沉璧，渔歌互答，此乐何极！登斯楼也，则有心旷神怡，宠辱偕忘，把酒临风，其喜洋洋者矣。") },
        who: "cg", say: "第4段，雨停了，春天来了，月亮出来了。声音亮起来！", hold: true,
        tip: "全班背第4段，背完点“继续”。" },
      { vis: { type: "pic", img: "5b-tower.webp", cap: "第5段：范公的答案（示意）", line: head2("嗟夫！予尝求古仁人之心，或异二者之为，何哉？不以物喜，不以己悲，居庙堂之高，则忧其民，处江湖之远，则忧其君。是进亦忧，退亦忧。然则何时而乐耶？其必曰“先天下之忧而忧，后天下之乐而乐”欤！噫！微斯人，吾谁与归？") },
        who: "hy", say: "第5段，范公的答案。全班一起，背得慢一点、稳一点。", hold: true,
        tip: "全班背第5段，背完点“继续”。" }
    ]},
    { t: "告别", s: "告别", min: 2, steps: [
      { vis: { type: "pic", img: "5b-xiantun2.webp", cap: "想象：楼上远眺，夕阳（示意）" },
        who: "fan", say: "孩子，这篇记写完了。你跟着我，雨也看了，晴也看了。" },
      { who: "fan", say: "我还有一位朋友，欧阳永叔，就是欧阳修。他去年也被贬了，到了滁州。不知道，他在那里过得怎样。", face: "think" },
      { who: "hy", say: "欧阳修过得怎样？换一出戏，你就知道了。范公，再见！", face: "happy" },
      { vis: { type: "card", title: "《岳阳楼记》作业", scene: "5b-tower.webp", q: ["1　背熟全文，下次课抽查", "2　课后单机：第5段的“逐句翻译”和“练一练”", "", "背不出来时，先闭上眼想画面：楼、湖、雨、月，最后是范公的答案"] },
        who: "hy", say: "《岳阳楼记》的作业：背熟全文，下次课我要抽查；课后单机里，做第5段的逐句翻译和练一练。" }
    ]}
  ]
};
