/* 《岳阳楼记》课堂版 · 沉浸体验《邓州的秋天》（四章）——第三次改版（11-06）：体会作者的情感
 * 定位（老师 11-06）：这一块帮学生体会范仲淹写《岳阳楼记》时的心情，不讲字词（字词另有字词卡、逐句翻译、背诵）。
 *   学生扮演范公在邓州的邻家少年（14岁，虚构），和学生一样青涩；他和范公说话，由不懂到懂一点。
 * 每章：开场（眨眼＋旁白：时间、地点、我是谁、面前是谁）→ 少年自己的小事 → 和范公说话（2–3 处分支）→ 少年由不懂到懂一点
 *       →（1 处“你觉得此刻范公心里是什么”，没有标准答案，不计分）→ “这一章，你体会到的”卡（3 条，以体会范公为主）
 *       → pick 选写哪一种（A 我想对范公说……〔推荐〕/ B 联系自己的经历）→ w1a / w1b 写一段（write.kind 存进存档，作答摘要里注明）→ 结束。
 *   老师 11-06 补充：不硬把范公的情感关联到学生生活；少年的联想只在真的贴切时出现（第二章雨天、第四章土岗），目标是“懂／开始懂范公”。
 * 原文只作“情感的落点”：范公念一句，画面上的草稿纸（prop:"draft", pt）出现那一句，不讲字词。pt 里的原文必须和 data/text.js 一致（chk.js 会查）。
 * {name} 由引擎替换成学生的名字。
 * who：fan 范仲淹 / me 我（学生）/ narr 旁白 / x 其他虚构人物（只出 name：阿娘、周伯＝范家老仆；阿青＝少年的好朋友、王婆＝邻居，只在话里提到）
 * 节点：lines+next / ask+choices / card+lines+next / write+next（write.kind：写作类型名）/ end
 *   card+lines+next  这里只用作章末“这一章，你体会到的”卡：{ tag, title, rows:[[关键词, 一句话]×3], foot }，卡片先出来，旁白接着说一句，学生点“继续”收起。
 *   （引擎还支持 goal / sum / review / quiz 和带原文的 card，这一版不用。）
 * 画面 shot（加在节点上＝进这个节点时换；加在某一句台词上＝读到这句时换；每个 shot 是一整个画面，不继承上一个）：
 *   bg    场景：yard 院子 / study 书房 / night 夜里书房烛光 / rain-yard 雨中的院子（从窗里往外看）/ harvest 田野打谷 / hill 城外土岗远望 / gate 邓州城门
 *         （有 img/scene-{bg}.webp 就用真图，没有就用 scene.js 画的）；想象画面用现成图：lake 洞庭湖（画）/ rain-lake / spring-lake / moon-lake / tower / map
 *   tone  色调：dusk 傍晚 / night 夜 / rain 雨天 / bare 收空的田（不写＝白天）
 *   cam   镜头：push 慢推 / pull 慢拉 / panL、panR 左右平移 / up、down 上下摇 / still；dur 镜头秒数（默认 18）
 *   fx    效果（空格分开）：rain 雨丝 / leaves 落叶 / dust 灰尘 / birds 飞鸟 / light 阳光光柱 / candle 烛光 / mist 薄雾
 *   prop  道具特写：box 木匣（open:1 打开）/ letter 旧信（pt＝信封上的字，默认“范经略”）/ scroll 画轴（peek:1 只展开一点）/ draft 草稿纸（pt＝纸上的字）/ brush 笔砚 / kite 纸鸢
 *   fan   范公（面前的人）：near 近（半身）/ mid 中（大半身）/ far 远 / 不写＝不在画面里；side：l 偏左 / c 居中 / r 偏右
 *   tr    转场：fade 淡入（默认）/ slide 横移 / cut；dream:1 想象画面（旧色晕边），cap＝画面上方的小字说明
 * “我”不出立绘（第一人称：画面就是“我”眼里看到的）；其他人物不出立绘，只出名签。
 * 选项里“我”说出口的话（引号里的，或标了 say:true 的整句）会用学生选的“我的声音”读出来。
 * 史实口径见设计约定（scratchpad/yk_spec.md）：信和画是范公在西边任上收到、一路带在身边的旧物；不提杜甫；不写眼睛不好；秋收是谷子、豆子；
 *   “规劝老友”用“很多人读出”“范公心里想对老友说”的分寸。本版新增史实另列 scratchpad/story_v4_facts.md。
 */
window.YK_STORY = [
  /* ───────────────────────── 第一章 ───────────────────────── */
  { id: "c1", title: "一幅旧画", after: 1, minutes: 10,
    blurb: "你以为“被贬”就是做错了事。帮范公晒书时，木匣里滑出一封旧信、一幅旧画——原来大人也会失落，也会替朋友不平。",
    start: "s1",
    nodes: {
      s1: { shot: { bg: "yard", cam: "pull", fx: "light leaves", fan: "far", dur: 22 }, bg: "yard", lines: [
        { who: "narr", say: "你慢慢睁开眼。这里是邓州，庆历六年的秋天。" },
        { who: "narr", say: "你是范公家隔壁的少年，今年十四岁。（这个少年是虚构的。）" },
        { who: "narr", say: "隔壁院门开着。院子里那位，就是范公——范仲淹，如今在邓州做知州。" }
      ], next: "s1b" },

      s1b: { shot: { bg: "gate", cam: "push", fx: "leaves" }, lines: [
        { who: "narr", say: "来之前，阿青在巷口跟你咬耳朵：隔壁那位大官，是从京城被贬下来的。" },
        { who: "me", say: "被贬……那不就是做错了事，被罚到我们这儿来了？" },
        { who: "x", name: "周伯", say: "{name}，来得正好！老爷要晒书，你帮着搬一搬。", shot: { bg: "yard", fan: "far", side: "r", cam: "push", fx: "light" } },
        { who: "narr", say: "院子里铺开几张竹席，书一摞一摞摊在日头底下。", shot: { bg: "yard", cam: "down", fx: "light dust" } },
        { who: "narr", say: "书堆底下压着一只旧木匣。你一抱，匣盖滑开了：里面是一封折得整整齐齐的信，还有一卷画。", shot: { bg: "yard", prop: "box", open: 1, cam: "push", fx: "dust" } }
      ], next: "s2" },

      s2: { shot: { bg: "yard", prop: "letter", cam: "push", fx: "dust" }, ask: "信封上写着“范经略”三个字。你——", choices: [
        { t: "先把匣盖合上，双手递还给范公。", go: "s3a" },
        { t: "问范公：“范经略是谁？您不是知州吗？”", go: "s3b" },
        { t: "忍不住把画轴展开一点点，看看画的是什么。", go: "s3c" }
      ] },
      s3a: { shot: { bg: "yard", fan: "near", cam: "push", fx: "light" }, lines: [
        { who: "fan", say: "你倒懂规矩。不妨，这两样不是什么秘密。", face: "smile" }
      ], next: "s4" },
      s3b: { shot: { bg: "yard", fan: "near", side: "r", cam: "push", fx: "light" }, lines: [
        { who: "fan", say: "问得细。“经略”，是我从前在西边边上管军务时的官名。", face: "smile" },
        { who: "fan", say: "这封信，是一年多以前寄来的。来，把画也打开看看。" }
      ], next: "s4" },
      s3c: { shot: { bg: "yard", prop: "scroll", peek: 1, cam: "push", fx: "dust" }, lines: [
        { who: "narr", say: "画轴才展开一掌宽，就露出一片水。" },
        { who: "fan", say: "（笑）手比嘴快。也罢，展开吧，慢一些，这画经不起扯。", face: "smile", shot: { bg: "yard", fan: "near", cam: "push", fx: "light" } }
      ], next: "s4" },

      s4: { shot: { bg: "yard", prop: "scroll", cam: "push", fx: "dust" }, lines: [
        { who: "narr", say: "画慢慢展开：一片望不到边的水，远处是淡淡的山，岸边有一座楼。" },
        { who: "me", say: "好大的水……这是哪里？", shot: { bg: "lake", cam: "panR", fx: "mist birds", dream: 1, cap: "画上的洞庭湖" } },
        { who: "fan", say: "洞庭湖。湖边这座楼，叫岳阳楼，在巴陵郡。", shot: { bg: "tower", cam: "push", fx: "mist", dream: 1, cap: "想象：巴陵的岳阳楼" } },
        { who: "fan", say: "信和画，都是我的老朋友滕子京寄来的。那时我还在西边任上，所以信上写的是“范经略”。", shot: { bg: "yard", fan: "near", cam: "push", fx: "light" } },
        { who: "fan", say: "后来我到了邓州，这只匣子，就一路跟着我过来了。", shot: { bg: "yard", prop: "box", open: 1, cam: "pull" } },
        { who: "fan", say: "我和他，是同一年考中进士的。算起来，相识三十多年了。", face: "smile", shot: { bg: "yard", fan: "near", side: "l", cam: "push", fx: "light leaves" } },
        { who: "fan", say: "庆历四年春天，他被人弹劾，贬到了巴陵。", face: "think", shot: { bg: "yard", prop: "draft", pt: "庆历四年春，滕子京谪守巴陵郡。", cam: "push" } }
      ], next: "s5" },

      s5: { shot: { bg: "yard", fan: "near", cam: "push", fx: "leaves" }, ask: "听到“被贬”两个字，你脱口而出——", choices: [
        { t: "“那他一定是做错什么事了吧？”", go: "s6a" },
        { t: "“被贬……是不是挺丢人的？”", go: "s6b" },
        { t: "“大人被贬了，也会难过吗？”", go: "s6c" }
      ] },
      s6a: { shot: { bg: "yard", fan: "near", side: "r", cam: "push", fx: "light" }, lines: [
        { who: "fan", say: "（不恼，反倒笑了）巷子里的孩子，也是这么说我的吧？", face: "smile" },
        { who: "me", say: "……您怎么知道？" },
        { who: "fan", say: "我像你这么大的时候，也这么以为。被贬的人，不一定是做错了事。" }
      ], next: "s7" },
      s6b: { shot: { bg: "yard", fan: "near", side: "l", cam: "push", fx: "light" }, lines: [
        { who: "fan", say: "丢人？……有人是这么看的。", face: "think" },
        { who: "fan", say: "可我那时听到消息，没觉得他丢人，只觉得替他不平。" }
      ], next: "s7" },
      s6c: { shot: { bg: "yard", fan: "near", cam: "push", fx: "light" }, lines: [
        { who: "fan", say: "（愣了一下）你以为大人不会？", face: "think" },
        { who: "me", say: "大人……不都是板着脸的吗？" },
        { who: "fan", say: "板着脸，是不让人看见罢了。" }
      ], next: "s7" },

      s7: { shot: { bg: "yard", fan: "near", side: "l", cam: "pull", fx: "leaves" }, lines: [
        { who: "fan", say: "子京被贬，心里有委屈，也不平。", face: "think" },
        { who: "fan", say: "早几年，西边打仗。他在泾州做知州，官军在定川吃了大败仗，泾州城里人心惶惶。", shot: { bg: "gate", tone: "dusk", cam: "push", fx: "mist", dream: 1, cap: "想象：多年前，西边的泾州城" } },
        { who: "fan", say: "他招集百姓穿上军装上城守着；又拿公家的钱犒劳赶来援救的将士，祭奠、抚恤战死的人家，人心才慢慢安定下来。那年我领兵赶去援救，是亲眼见过的。" },
        { who: "fan", say: "后来有人上书，说他在泾州乱用公家的钱。账目上的事，一时说不清，他就被贬了。", shot: { bg: "yard", fan: "near", cam: "push", fx: "leaves" } },
        { who: "fan", say: "我替他说过话，可到底没能让他免于被贬。", face: "think" },
        { who: "fan", say: "子京才大，性子也傲。到了巴陵，心里那口气，一直没有咽下去。听说，脸上都带出来了。" },
        { who: "me", say: "那……阿青说您也是被贬下来的。您呢？" },
        { who: "fan", say: "（看了你一会儿）我？前年，我离开了京城；去年，参知政事的官也罢了。参知政事，就是朝廷里的副宰相。", shot: { bg: "yard", fan: "mid", side: "r", cam: "still", fx: "light dust" } },
        { who: "fan", say: "在朝廷里想做的几件事，没做成。一起做事的朋友，也散到了各处。" },
        { who: "fan", say: "说一点不难过，那是假话。", face: "think", shot: { bg: "yard", fan: "near", side: "r", cam: "push", fx: "leaves" } },
        { who: "me", say: "……原来，大人也会难过。" },
        { who: "fan", say: "大人也是人。只是大人难过的时候，常常不说。" }
      ], next: "s8" },

      s8: { shot: { bg: "yard", fan: "mid", side: "l", cam: "panL", fx: "light leaves" }, lines: [
        { who: "fan", say: "可子京没有撒手不干。到了巴陵第二年，政事顺当，百姓和乐，荒废了的事，一件一件全都办了起来。" },
        { who: "fan", say: "我一想起他，心里就是这几个字：越明年，政通人和，百废具兴……", shot: { bg: "yard", prop: "draft", pt: "越明年，政通人和，百废具兴……", cam: "push" } },
        { who: "fan", say: "他还把岳阳楼重修了，修得比原来更大。", shot: { bg: "tower", cam: "up", fx: "mist birds", dream: 1, cap: "想象：重修的岳阳楼" } },
        { who: "me", say: "心里憋着气，还干得这么好？换了我，早就什么都不想干了。", shot: { bg: "yard", fan: "near", cam: "push", fx: "light" } },
        { who: "fan", say: "不平是不平，手上的事，他一件也没落下。所以我敬重他。", face: "smile" },
        { who: "fan", say: "他在信里托我写一篇记。说楼台要是没有文章记它，就传不久。" },
        { who: "fan", say: "这一拖，就是一年多。有些话，那时候还写不出来。", face: "think" },
        { who: "narr", say: "范公低头看着画，半天没有说话。", shot: { bg: "yard", prop: "scroll", cam: "still", fx: "dust" } }
      ], next: "s9" },

      s9: { shot: { bg: "yard", fan: "mid", side: "c", cam: "still", fx: "dust leaves" }, ask: "你猜，范公这会儿心里——（没有标准答案，选你觉得的）", choices: [
        { t: "在想念滕大人。", go: "s10a" },
        { t: "还在替滕大人不平。", go: "s10b" },
        { t: "在想这篇文章该怎么写。", go: "s10c" }
      ] },
      s10a: { shot: { bg: "yard", fan: "near", cam: "push", fx: "leaves" }, lines: [
        { who: "fan", say: "（抬起头）三十多年的朋友，隔着这么远……是想他了。", face: "smile" }
      ], next: "s11" },
      s10b: { shot: { bg: "yard", fan: "near", side: "l", cam: "push", fx: "leaves" }, lines: [
        { who: "fan", say: "不平还在。只是光替他不平，帮不了他。", face: "think" }
      ], next: "s11" },
      s10c: { shot: { bg: "yard", fan: "near", side: "r", cam: "push", fx: "leaves" }, lines: [
        { who: "fan", say: "（笑）你猜着了一半。我在想，写些什么，他读了，心里能宽一点。", face: "smile" }
      ], next: "s11" },

      s11: { shot: { bg: "yard", fan: "near", cam: "pull", fx: "leaves" }, lines: [
        { who: "fan", say: "其实，想他、替他不平、想怎么写，三样都有。人心里，哪会只有一样。" },
        { who: "fan", say: "子京读到我写的东西，要是能把那口气放下一点，我就算没白写。", face: "think" }
      ], next: "s14" },

      s14: { shot: { bg: "yard", tone: "dusk", fan: "mid", cam: "pull", fx: "leaves" }, lines: [
        { who: "narr", say: "日头偏西了。周伯过来收书。" },
        { who: "me", say: "范公……我原先以为，被贬就是丢人。现在，好像不这么想了。" },
        { who: "fan", say: "子京等这篇记，等得够久了。我也该动笔了。", shot: { bg: "yard", tone: "dusk", fan: "near", cam: "push", fx: "leaves" } },
        { who: "x", name: "阿娘", say: "{name}——回家吃饭啦！", shot: { bg: "yard", tone: "dusk", cam: "panR", fx: "leaves", tr: "slide" } }
      ], next: "f1" },

      f1: { shot: { bg: "lake", tone: "dusk", cam: "pull", fx: "mist", dream: 1, cap: "画上的洞庭湖" }, card: {
        tag: "这一章，你体会到的", title: "一幅旧画里的心事",
        rows: [
          ["不平", "被贬，不一定是做错了事。子京在泾州做的事，范公亲眼见过，所以替他不平。"],
          ["失落", "了不起的大人也会失落：范公离开京城、罢去了参知政事，想做的事没做成，心里也难过，只是不常说。"],
          ["敬重", "子京心里有气，手上的事一件没落下。范公敬重他、牵挂他——这份心，后来写进了《岳阳楼记》。"]
        ],
        foot: "这三条没有对错，只是一个提醒。你对范公的体会，也可以不一样。" }, lines: [
        { who: "narr", say: "回家的路上，你把今天听到的话，又在心里过了一遍。" }
      ], next: "pick" },

      pick: { ask: "最后写一段话（会存给老师）。你想写哪一种？", choices: [
        { t: "A　我想对范公说……（推荐）", go: "w1a" },
        { t: "B　联系我自己的经历，写一段", go: "w1b" }
      ] },
      w1a: { write: { kind: "A 我想对范公说", prompt: "今天，范公跟你说起了被贬的老朋友，也说起了他自己的失落。你想对范公说些什么？可以是安慰，可以是敬佩，可以是你原先想错了的地方，也可以是一个想问他的问题。",
        hint: "开头可以写“范公：”。想一想今天哪一句话最让你意外，比如“大人也是人，只是难过的时候常常不说”，从那里写起。",
        min: 60, max: 150 }, next: "end" },
      w1b: { write: { kind: "B 联系自己的经历", prompt: "范公隔着千里，替老朋友不平，又帮不上忙。你有没有为一个朋友（或家里人）不平、着急，却又帮不上忙的时候？写一写：那是什么事，你当时心里是什么滋味。",
        hint: "照实写就好，不用讲大道理。可以从“那一次……”写起。",
        min: 60, max: 150 }, next: "end" },

      end: { shot: { bg: "yard", tone: "night", cam: "pull" }, end: true, lines: [
        { who: "x", name: "阿娘", say: "今天怎么这么安静？在范公家挨说了？" },
        { who: "narr", say: "那天夜里，你梦见一片很大很大的水，水边，有一座楼。", shot: { bg: "lake", cam: "push", fx: "mist", dream: 1, dur: 24 } }
      ] }
    } },

  /* ───────────────────────── 第二章 ───────────────────────── */
  { id: "c2", title: "雨天和晴天", after: 2, minutes: 10,
    blurb: "连下五天雨，你闷得发慌；天一放晴，又乐得不行。范公说起他见过的登楼人，也说起自己——人的心，常常跟着天气走。",
    start: "s1",
    nodes: {
      s1: { shot: { bg: "rain-yard", cam: "push", fx: "rain mist", dur: 22 }, bg: "rain", lines: [
        { who: "narr", say: "你又睁开眼。还是邓州，庆历六年，九月初。" },
        { who: "narr", say: "你还是范公家隔壁那个十四岁的少年。" },
        { who: "narr", say: "这会儿，你面前只有窗外的雨。隔壁，就是范公——范仲淹的家。" },
        { who: "narr", say: "九月初，邓州下起了雨。一下，就是五天。" }
      ], next: "s1b" },

      s1b: { shot: { bg: "harvest", tone: "rain", cam: "panR", fx: "rain mist" }, lines: [
        { who: "narr", say: "地里的谷子豆子还没收完，田埂上全是泥。" },
        { who: "me", say: "又下！说好了跟阿青去河边捉鱼的……", shot: { bg: "rain-yard", cam: "push", fx: "rain mist" } },
        { who: "x", name: "阿娘", say: "{name}，别在屋里转来转去，转得我心慌。" },
        { who: "me", say: "这雨再下，我人都要发霉了！" },
        { who: "narr", say: "傍晚，周伯打着伞来敲门：老爷请你过去，帮着磨墨。", shot: { bg: "rain-yard", cam: "pull", fx: "rain mist" } }
      ], next: "s2" },

      s2: { shot: { bg: "study", tone: "rain", fan: "near", cam: "push", fx: "dust", tr: "slide" }, bg: "study", lines: [
        { who: "fan", say: "{name}，来了。你这张脸，怎么跟外头的天一个样？", face: "smile" }
      ], next: "s3" },

      s3: { ask: "范公问你为什么闷闷不乐。你说——", choices: [
        { t: "“这雨下得人心里发霉，哪儿都去不了。”", go: "s4a" },
        { t: "“地里的谷子还没收完，阿娘一天要叹好几回气。”", go: "s4b" },
        { t: "“其实我不讨厌下雨。只是一连下这么多天，就闷了。”", go: "s4c" }
      ] },
      s4a: { shot: { bg: "study", tone: "rain", fan: "near", side: "l", cam: "push" }, lines: [
        { who: "me", say: "本来说好，跟阿青去河边捉鱼的……" },
        { who: "fan", say: "原来，是一件盼着的事落空了。", face: "smile" }
      ], next: "s5" },
      s4b: { shot: { bg: "study", tone: "rain", fan: "near", side: "l", cam: "push" }, lines: [
        { who: "fan", say: "秋雨连绵，种地的人家最怕的就是这个。", face: "think" },
        { who: "fan", say: "你闷，不全是为自己，也为家里的收成。这份心，难得。" }
      ], next: "s5" },
      s4c: { shot: { bg: "study", tone: "rain", fan: "near", side: "r", cam: "push" }, lines: [
        { who: "fan", say: "说得实在。下一天雨，雨声是好听的；下五天，就叫人心烦了。", face: "smile" },
        { who: "fan", say: "雨还是那场雨，下得久了，人心就变了。" }
      ], next: "s5" },

      s5: { shot: { bg: "study", tone: "rain", fan: "near", cam: "push" }, lines: [
        { who: "fan", say: "巧得很，我这几天写的，也是雨。" },
        { who: "narr", say: "范公把一张纸推过来，上面的墨还没干透。", shot: { bg: "study", tone: "rain", prop: "draft", pt: "若夫淫雨霏霏，连月不开……", cam: "push" } },
        { who: "fan", say: "我写一个人，在阴雨天登上岳阳楼：雨几个月不停，风吼着，浪头打到天上，桅杆倒了，船桨断了，傍晚天昏沉沉的。", shot: { bg: "rain-lake", cam: "push", fx: "rain mist", dream: 1, cap: "想象：范公笔下的雨天洞庭湖" } },
        { who: "fan", say: "这个人，本来就是被贬到远处来的。看着这样的天，想起京城，想起家乡，又怕别人说他坏话……", shot: { bg: "study", tone: "rain", prop: "draft", pt: "登斯楼也，则有去国怀乡，忧谗畏讥……", cam: "push" } },
        { who: "fan", say: "越看越凄凉，越想越悲。", face: "think", shot: { bg: "study", tone: "rain", fan: "near", cam: "push" } },
        { who: "me", say: "那个人……跟我今天一样闷。" },
        { who: "fan", say: "只怕比你还闷。这样的人，我见过很多。", face: "smile" },
        { who: "me", say: "很多？" },
        { who: "fan", say: "被贬到远地的官，我认识的不少。下一场雨，他们就觉得，连天都在欺负自己。" },
        { who: "me", say: "那您呢？您也被贬过吧？阿青说的。" },
        { who: "fan", say: "（笑了笑）不止一回。", face: "smile", shot: { bg: "study", tone: "rain", fan: "mid", side: "r", cam: "pull", fx: "dust" } },
        { who: "fan", say: "早些年，我在朝廷里说了几回直话，惹得上头不高兴，就被打发到外地去了。" },
        { who: "fan", say: "那时候，我心里也委屈，也憋闷。一碰上阴雨天，心就格外沉，好像天也跟着欺负人。", face: "think" },
        { who: "narr", say: "范公不说话了，转过头去看窗外的雨。", shot: { bg: "rain-yard", cam: "still", fx: "rain mist" } }
      ], next: "s6" },

      s6: { shot: { bg: "study", tone: "rain", fan: "mid", side: "l", cam: "still" }, ask: "你猜，范公这会儿心里——（没有标准答案，选你觉得的）", choices: [
        { t: "在想年轻时候受过的委屈。", go: "s7a" },
        { t: "在替那些被贬的朋友难过。", go: "s7b" },
        { t: "什么都没想，就是有点累了。", go: "s7c" }
      ] },
      s7a: { shot: { bg: "study", tone: "rain", fan: "near", cam: "push" }, lines: [
        { who: "fan", say: "（笑笑）委屈早就淡了。只是那滋味，还记得。", face: "smile" }
      ], next: "s8" },
      s7b: { shot: { bg: "study", tone: "rain", fan: "near", side: "l", cam: "push" }, lines: [
        { who: "fan", say: "有一点。子京在巴陵，这几天，不知道是不是也在下雨。", face: "think" }
      ], next: "s8" },
      s7c: { shot: { bg: "study", tone: "rain", fan: "near", side: "r", cam: "push" }, lines: [
        { who: "fan", say: "（揉了揉额头）也是真的。快六十的人了，连下几天雨，骨头也跟着酸。", face: "smile" }
      ], next: "s8" },

      s8: { shot: { bg: "study", tone: "rain", fan: "near", cam: "pull" }, lines: [
        { who: "fan", say: "你先回去吧。明天，看看天。" }
      ], next: "s9" },

      s9: { shot: { bg: "yard", cam: "up", fx: "light dust", tr: "slide" }, bg: "sunny", lines: [
        { who: "narr", say: "第二天一早，你是被太阳晒醒的。" },
        { who: "narr", say: "天蓝得发亮，院子里的水洼映着天。田里的人全出来了，割谷子的，收豆子的，有说有笑。", shot: { bg: "harvest", cam: "panR", fx: "birds light" } },
        { who: "narr", say: "你一路跑到范公家。范公正站在院子里，看天。", shot: { bg: "yard", fan: "far", cam: "push", fx: "light" } },
        { who: "fan", say: "{name}，你这张脸，今天可是放晴了。", face: "smile", shot: { bg: "yard", fan: "near", cam: "push", fx: "light" } },
        { who: "me", say: "范公，田里都在抢收呢！阿娘一早就笑了。我昨天还觉得天要塌了呢！" },
        { who: "fan", say: "昨天夜里，我也写到了晴天。" },
        { who: "fan", say: "晴天登楼的人，看着湖光、鸥鸟、月亮，听着渔歌，什么荣辱都忘了，端起酒来，迎着风，乐得不得了。", shot: { bg: "spring-lake", cam: "pull", fx: "light birds", dream: 1, cap: "想象：范公笔下的晴天洞庭湖" } },
        { who: "fan", say: "心旷神怡，宠辱偕忘……", shot: { bg: "yard", prop: "draft", pt: "登斯楼也，则有心旷神怡，宠辱偕忘……", cam: "push", fx: "light" } },
        { who: "me", say: "那我今天，就是那个人！", shot: { bg: "yard", fan: "near", side: "l", cam: "push", fx: "light" } },
        { who: "fan", say: "（笑）是有点像。", face: "smile" }
      ], next: "s10" },

      s10: { shot: { bg: "yard", fan: "near", side: "r", cam: "push", fx: "light" }, ask: "范公又问：“那要是明天，又下雨了呢？”你说——", choices: [
        { t: "“那我就又闷了呗。”", go: "s11a" },
        { t: "“不会的！今天这么晴！”", go: "s11b" },
        { t: "“下雨也没什么，我在家编草鞋。”", go: "s11c" }
      ] },
      s11a: { shot: { bg: "yard", fan: "near", cam: "push", fx: "light" }, lines: [
        { who: "fan", say: "你说得老实。", face: "smile" },
        { who: "fan", say: "你看，你的心，像不像挂在天上？天一阴，它就往下沉；天一晴，它就飘起来。" }
      ], next: "s12" },
      s11b: { shot: { bg: "yard", fan: "near", side: "l", cam: "push", fx: "light" }, lines: [
        { who: "fan", say: "（哈哈一笑）昨天，你也以为这雨不会停。", face: "smile" },
        { who: "me", say: "……" },
        { who: "fan", say: "天是说变就变的。心要是全跟着它走，一天就得变好几回。" }
      ], next: "s12" },
      s11c: { shot: { bg: "yard", fan: "near", side: "r", cam: "push", fx: "light" }, lines: [
        { who: "fan", say: "这话，你今天说得轻巧，是因为太阳正晒着你。", face: "smile" },
        { who: "me", say: "……那倒也是。昨天我可说不出这话。" }
      ], next: "s12" },

      s12: { shot: { bg: "yard", fan: "near", cam: "pull", fx: "light dust" }, lines: [
        { who: "me", say: "原来……我的心，是跟着天气走的。" },
        { who: "fan", say: "我写的那两种登楼的人，一个悲，一个喜，看着不一样，其实是一样的：心都让外头的东西牵着走。" },
        { who: "fan", say: "这不丢人。人人都是这样，我年轻时也是。" },
        { who: "fan", say: "只是要一辈子这样，天阴一回，心就苦一回，太累了。", face: "think" },
        { who: "me", say: "那怎么才能不被它牵着走？" },
        { who: "fan", say: "这个，我也还在想。等我写到最后一段，再说给你听。", face: "smile" }
      ], next: "s15" },

      s15: { shot: { bg: "yard", fan: "mid", cam: "pull", fx: "light leaves" }, lines: [
        { who: "fan", say: "能看出自己的心是跟着天气走的，就比只会跟着走，多走了一步。" },
        { who: "x", name: "阿娘", say: "{name}，下地啦！趁着天好，把豆子收了！", shot: { bg: "harvest", cam: "panR", fx: "birds light", tr: "slide" } }
      ], next: "f1" },

      f1: { shot: { bg: "harvest", tone: "dusk", cam: "pull", fx: "birds" }, card: {
        tag: "这一章，你体会到的", title: "心跟着天气走",
        rows: [
          ["见过", "范公见过很多被贬到远地的人：阴雨天登楼就悲，晴天登楼就喜，心让外头的东西牵着走。"],
          ["懂得", "范公早些年也因为说直话被贬出京城，受过委屈，所以他懂那些阴雨天登楼的人，并不笑话他们。"],
          ["还在想", "范公觉得，天阴一回心就苦一回，一辈子这样太累了。怎样才能不被牵着走，他还在想，要写进最后一段。"]
        ],
        foot: "这三条没有对错，只是一个提醒。你对范公的体会，也可以不一样。" }, lines: [
        { who: "narr", say: "那天收豆子的时候，你抬头看了好几回天。" }
      ], next: "pick" },

      pick: { ask: "最后写一段话（会存给老师）。你想写哪一种？", choices: [
        { t: "A　我想对范公说……（推荐）", go: "w1a" },
        { t: "B　联系我自己的经历，写一段", go: "w1b" }
      ] },
      w1a: { write: { kind: "A 我想对范公说", prompt: "范公说，他年轻时也被贬过、委屈过，阴雨天心就格外沉。听了他的话，你想对范公说些什么？",
        hint: "可以说说你听到“不止一回”时的感觉，也可以问问他：后来是怎么不让天气牵着心走的。开头可以写“范公：”。",
        min: 60, max: 150 }, next: "end" },
      w1b: { write: { kind: "B 联系自己的经历", prompt: "你的心情，有没有被什么“天气”牵着走过？可以是真的天气，也可以是一句话、一次成绩、一件盼着的事。写一写：那是什么，你的心怎样跟着它变。",
        hint: "可以这样写：“那几天……我就……；后来……我又……”写真实的就好，不用写得很懂事。",
        min: 60, max: 150 }, next: "end" },

      end: { shot: { bg: "harvest", tone: "dusk", cam: "panR", fx: "birds" }, end: true, lines: [
        { who: "narr", say: "那天傍晚，田里的谷子，收进来一大半。" },
        { who: "narr", say: "你想：明天要是又下雨，我还会闷吗？好像……会。可大概，不会闷得那么厉害了。" }
      ] }
    } },

  /* ───────────────────────── 第三章 ───────────────────────── */
  { id: "c3", title: "写给谁", after: 4, minutes: 10,
    blurb: "九月十五夜，《岳阳楼记》写成。你读到“先天下之忧而忧，后天下之乐而乐”，头一个念头是：这也太累了吧？范公没讲道理，讲起了他自己。",
    start: "s1",
    nodes: {
      s1: { shot: { bg: "night", fan: "far", cam: "push", fx: "candle", dur: 22 }, bg: "study", lines: [
        { who: "narr", say: "你睁开眼。邓州，庆历六年九月十五，夜里。" },
        { who: "narr", say: "你是范公家隔壁的少年，十四岁。这一回，你站在范公的书房门口。" },
        { who: "narr", say: "门半掩着。灯下坐着的，就是范公——范仲淹。" }
      ], next: "s1b" },

      s1b: { shot: { bg: "yard", tone: "dusk", cam: "push", fx: "leaves" }, lines: [
        { who: "narr", say: "白天，阿娘蒸了一锅枣糕。还没等你吃，先切了一半，给巷尾病着的王婆送去了。" },
        { who: "me", say: "（小声嘀咕）我还一口没吃呢……凭什么先给别人。" },
        { who: "narr", say: "你憋着这口气，晚上来找范公。进门的时候，范公正好搁下笔。", shot: { bg: "night", prop: "draft", pt: "岳阳楼记", cam: "push", fx: "candle" } },
        { who: "fan", say: "{name}，来得巧。写完了。", face: "smile", shot: { bg: "night", fan: "near", cam: "push", fx: "candle" } },
        { who: "me", say: "写完了！我能看吗？" },
        { who: "narr", say: "你从头读起。读到“嗟夫”，范公靠在椅背上，轻轻叹了一口气。", shot: { bg: "night", prop: "draft", pt: "嗟夫！予尝求古仁人之心……", cam: "push", fx: "candle" } },
        { who: "narr", say: "读到这一句，你停住了。", shot: { bg: "night", prop: "draft", pt: "先天下之忧而忧，后天下之乐而乐", cam: "push", fx: "candle" } }
      ], next: "s2" },

      s2: { shot: { bg: "night", fan: "near", cam: "push", fx: "candle" }, ask: "你抬起头，头一句话是——", choices: [
        { t: "“这也太累了吧？为什么不能先乐？”", go: "s3a" },
        { t: "“先忧后乐……那要等到什么时候才能乐呀？”", go: "s3b" },
        { t: "“这是写给滕大人的吗？”", go: "s3c" }
      ] },
      s3a: { shot: { bg: "night", fan: "near", side: "l", cam: "push", fx: "candle" }, lines: [
        { who: "fan", say: "（笑出了声）你倒是说了实话。", face: "smile" },
        { who: "fan", say: "很多大人心里也这么想，只是不说。" }
      ], next: "s4" },
      s3b: { shot: { bg: "night", fan: "near", cam: "push", fx: "candle" }, lines: [
        { who: "fan", say: "问得好。我写着写着，也这么问过自己。", face: "think", shot: { bg: "night", prop: "draft", pt: "然则何时而乐耶？", cam: "push", fx: "candle" } },
        { who: "fan", say: "什么时候才乐呢？……", shot: { bg: "night", fan: "near", cam: "push", fx: "candle" } }
      ], next: "s4" },
      s3c: { shot: { bg: "night", fan: "near", side: "r", cam: "push", fx: "candle" }, lines: [
        { who: "fan", say: "这篇记，是写给子京的。", face: "smile" },
        { who: "fan", say: "可这一句，我也是写给自己的。" }
      ], next: "s4" },

      s4: { shot: { bg: "night", fan: "mid", side: "r", cam: "pull", fx: "candle" }, lines: [
        { who: "fan", say: "{name}，我不跟你讲道理。给你讲讲我自己吧。" },
        { who: "fan", say: "我两岁的时候，父亲就去世了。母亲带着我改嫁到朱家，我也跟着姓了朱。", face: "think" },
        { who: "me", say: "您……姓过朱？" },
        { who: "fan", say: "姓了好些年。长大些，才知道自己的身世，心里一下子空了。", shot: { bg: "night", fan: "near", side: "r", cam: "push", fx: "candle" } },
        { who: "fan", say: "我辞别母亲，一个人去应天府的书院读书。日子很苦，可心里有一口气。" },
        { who: "fan", say: "后来考中进士，做了官，才把母亲接来奉养，也改回了姓范。" },
        { who: "fan", say: "做了官，我在朝廷里说直话，被贬出京城；过些年又被叫回去，又说直话，又被贬。", shot: { bg: "night", fan: "mid", side: "l", cam: "still", fx: "candle" } },
        { who: "me", say: "那您……为什么不少说几句？" },
        { who: "fan", say: "也有人这么劝过我。可看见百姓日子难过，朝廷有做得不对的地方，我闭不上嘴。", face: "think" },
        { who: "fan", say: "这大概就是忧吧。不是我爱发愁，是放不下。" },
        { who: "fan", say: "乐，我也不是不要。只是天下还有那么多人日子难过，我先乐了，心里不踏实。等大家都好了，我再乐，那才乐得安稳。" },
        { who: "me", say: "那您……不累吗？", shot: { bg: "night", fan: "near", cam: "push", fx: "candle" } },
        { who: "fan", say: "（停了好一会儿）累。也难过过。被贬出京的路上，我也想过：何苦呢。", face: "think" },
        { who: "fan", say: "我写“不以物喜，不以己悲”，不是说人就没了喜怒。", shot: { bg: "night", prop: "draft", pt: "不以物喜，不以己悲", cam: "push", fx: "candle" } },
        { who: "fan", say: "是说，不让外头的好坏、自己一时的得失，把心带走。", shot: { bg: "night", fan: "near", cam: "push", fx: "candle" } },
        { who: "narr", say: "范公说完，看着灯花，不出声了。", shot: { bg: "night", fan: "mid", cam: "still", fx: "candle" } }
      ], next: "s5" },

      s5: { shot: { bg: "night", fan: "mid", cam: "still", fx: "candle" }, ask: "你猜，范公这会儿心里——（没有标准答案，选你觉得的）", choices: [
        { t: "有点累，也有点安心。", go: "s6a" },
        { t: "在想远在巴陵的滕大人。", go: "s6b" },
        { t: "在想他的母亲。", go: "s6c" }
      ] },
      s6a: { shot: { bg: "night", fan: "near", cam: "push", fx: "candle" }, lines: [
        { who: "fan", say: "（笑）你看得准。写完了，心里落了地。", face: "smile" }
      ], next: "s7" },
      s6b: { shot: { bg: "night", fan: "near", side: "l", cam: "push", fx: "candle" }, lines: [
        { who: "fan", say: "子京读到这篇，不知道会怎么想。他读得出来的。", face: "think" }
      ], next: "s7" },
      s6c: { shot: { bg: "night", fan: "near", side: "r", cam: "push", fx: "candle" }, lines: [
        { who: "fan", say: "（半晌）母亲要是还在，读到这篇，不知会说些什么。", face: "think" }
      ], next: "s7" },

      s7: { shot: { bg: "night", fan: "near", cam: "push", fx: "candle" }, lines: [
        { who: "fan", say: "{name}，“先天下之忧而忧，后天下之乐而乐”，你现在怎么想？说真话就好，不必顺着我。", face: "smile" }
      ], next: "s8" },

      s8: { ask: "你想了想，说——", choices: [
        { t: "“我同意。我想做您这样的人。”", go: "s9a" },
        { t: "“我不完全同意。忧可以先忧，乐为什么一定要排在最后？”", go: "s9b" },
        { t: "“我还不太懂。我觉得我做不到。”", go: "s9c" }
      ] },
      s9a: { shot: { bg: "night", fan: "near", side: "r", cam: "push", fx: "candle" }, lines: [
        { who: "fan", say: "（摆摆手）先别急着学我。这话说出来容易，做一辈子难。", face: "smile" },
        { who: "fan", say: "从一件小事做起就好。" }
      ], next: "s10" },
      s9b: { shot: { bg: "night", fan: "near", cam: "push", fx: "candle" }, lines: [
        { who: "fan", say: "你肯把忧和乐分开来想，这很好。", face: "think" },
        { who: "fan", say: "我不是说不许乐。是说别人还在受苦的时候，我没法先安心享乐。" },
        { who: "fan", say: "你要是还这么想，也行。往后你自己走一段路，再回来看这一句。", face: "smile" }
      ], next: "s10" },
      s9c: { shot: { bg: "night", fan: "near", side: "l", cam: "push", fx: "candle" }, lines: [
        { who: "fan", say: "做不到，就先别勉强。我五十多岁了，也不敢说自己做到了。", face: "smile" },
        { who: "fan", say: "古仁人的心，我也只是在“求”。想不通，就留着慢慢想，这比随口说一声“同意”好。" }
      ], next: "s10" },

      s10: { shot: { bg: "night", fan: "mid", side: "l", cam: "pull", fx: "candle" }, lines: [
        { who: "me", say: "范公……白天阿娘把枣糕先送了一半给王婆，我还嘀咕了半天。" },
        { who: "fan", say: "那现在呢？" },
        { who: "me", say: "……王婆病着，家里又没人。换了我躺在那儿，也盼着有人来敲门。" },
        { who: "fan", say: "你阿娘，就是先替别人操心的人。不写文章，这份心也是真的。", face: "smile", shot: { bg: "night", fan: "near", cam: "push", fx: "candle" } },
        { who: "fan", say: "我写的那一句，装的是天下，比送一块枣糕难得多；可那份心，说近也近。你不必今天就懂。" },
        { who: "me", say: "那滕大人读了，会懂吗？" },
        { who: "fan", say: "子京性子傲，当面劝，他未必听得进。我心里有些话，想对他说，就放进了文章里。", face: "think" },
        { who: "fan", say: "他读到最后这一句，会懂的。", shot: { bg: "night", prop: "draft", pt: "噫！微斯人，吾谁与归？", cam: "push", fx: "candle" } },
        { who: "me", say: "“吾谁与归”……是说，您盼着有人跟您一道走？" },
        { who: "fan", say: "是。这条路，一个人走，太孤单了。", face: "smile", shot: { bg: "night", fan: "near", cam: "push", fx: "candle" } },
        { who: "fan", say: "这篇记，过几天我就封好，托人带去巴陵。", shot: { bg: "night", prop: "letter", pt: "", cam: "push", fx: "candle" } }
      ], next: "f1" },

      f1: { shot: { bg: "tower", tone: "night", cam: "pull", fx: "mist", dream: 1, cap: "想象：巴陵的岳阳楼" }, card: {
        tag: "这一章，你体会到的", title: "放不下的人",
        rows: [
          ["放不下", "“先忧后乐”不是范公天生爱发愁：他从小没了父亲，吃过苦；做官后一次次因为说直话被贬，还是放不下百姓。"],
          ["也会累", "范公也会累、会难过；“不以物喜，不以己悲”不是没有感情，是不让外头的好坏、自己一时的得失把心带走。"],
          ["不强求", "范公不要人马上同意。他自己也说，古仁人的心，他只是在“求”，不敢说做到了。"]
        ],
        foot: "这三条没有对错，只是一个提醒。你对范公的体会，也可以不一样。" }, lines: [
        { who: "narr", say: "很多人读这篇记，也读出了范公心里想对老友说的话：敬他，劝他，也盼着和他同路。" }
      ], next: "pick" },

      pick: { ask: "最后写一段话（会存给老师）。你想写哪一种？", choices: [
        { t: "A　我想对范公说……（推荐）", go: "w1a" },
        { t: "B　联系我自己的经历，写一段", go: "w1b" }
      ] },
      w1a: { write: { kind: "A 我想对范公说", prompt: "范公跟你讲了他的来路：两岁没了父亲，苦读，一次次因为说直话被贬，也会累、会难过。读完《岳阳楼记》、听完他的话，你想对范公说些什么？",
        hint: "同意、不完全同意、还不懂，都可以照实说。也可以写你最想问他的一个问题。开头可以写“范公：”。",
        min: 60, max: 150 }, next: "end" },
      w1b: { write: { kind: "B 联系自己的经历", prompt: "有没有一件事，你先替别人操心，把自己的高兴往后放了？或者你觉得自己做不到，为什么？写一写那件事，和你当时的心情。",
        hint: "可以是很小的事。不用写成“好人好事”，把不情愿的心情也写出来，就很真。",
        min: 60, max: 150 }, next: "end" },

      end: { shot: { bg: "yard", tone: "night", cam: "up", tr: "slide" }, end: true, lines: [
        { who: "narr", say: "那晚月亮很亮。回家的路上，你一直在想范公说的那三个字：放不下。" }
      ] }
    } },

  /* ───────────────────────── 第四章 ───────────────────────── */
  { id: "c4", title: "你的一座楼", after: 6, minutes: 10,
    blurb: "你心里堵着一件事。范公不劝你，只带你到城外土岗上看秋天，听你慢慢说出来。子京有他的楼，范公有他的土岗，你也会有你的楼。",
    start: "s1",
    nodes: {
      s1: { shot: { bg: "harvest", tone: "bare", cam: "panR", fx: "leaves", dur: 22 }, bg: "yard", lines: [
        { who: "narr", say: "你睁开眼。邓州，庆历六年，九月底。" },
        { who: "narr", say: "你是范公家隔壁的少年，十四岁。这几天，你心里有事。" },
        { who: "narr", say: "你面前，是范公家的院门。院子里等着你的，是范公——范仲淹。" }
      ], next: "s1b" },

      s1b: { shot: { bg: "yard", cam: "push", fx: "leaves" }, lines: [
        { who: "x", name: "周伯", say: "{name}，老爷问你，这几天怎么不过来了？" },
        { who: "fan", say: "{name}，几天不见了。", shot: { bg: "yard", fan: "mid", cam: "push", fx: "leaves" } },
        { who: "me", say: "……没什么。" },
        { who: "fan", say: "“没什么”，是有什么。", face: "smile", shot: { bg: "yard", fan: "near", cam: "push", fx: "leaves" } }
      ], next: "s2" },

      s2: { shot: { bg: "yard", fan: "near", cam: "push", fx: "leaves" }, ask: "你心里堵着一件事。是——", choices: [
        { t: "先生让背书，我背到一半，脑子一下全空了，在全塾的人面前站了好久。", say: true, go: "s3a" },
        { t: "我跟阿青闹翻了，已经三天没说话。", say: true, go: "s3b" },
        { t: "阿爹给我扎的纸鸢，前天线断了，飞过河去，再也找不着了。", say: true, go: "s3c" }
      ] },
      s3a: { lines: [
        { who: "fan", say: "背到一半，忘了。" },
        { who: "me", say: "我明明在家背熟了的。先生说，背不出来，就是没用心。" },
        { who: "me", say: "我用心了……他们都在笑。我再也不想去塾里了。" }
      ], next: "s4" },
      s3b: { lines: [
        { who: "fan", say: "三天了。" },
        { who: "me", say: "是阿青先说我的。可……我也说了很难听的话。" },
        { who: "me", say: "现在在塾里碰见，两个人都把脸扭开。我才不先开口。" }
      ], next: "s4" },
      s3c: { lines: [
        { who: "fan", say: "飞过河去了。" },
        { who: "me", say: "那是阿爹熬了两个晚上扎的，上面还画了一只鹞子。", shot: { bg: "hill", prop: "kite", cam: "panL", fx: "birds" } },
        { who: "me", say: "我顺着河找了一下午，什么都没找着。都怪我，非要在风大的时候放。" }
      ], next: "s4" },

      s4: { shot: { bg: "yard", fan: "mid", side: "l", cam: "pull", fx: "leaves" }, lines: [
        { who: "narr", say: "范公没有多说。他站起来，拿起一根竹杖。" },
        { who: "fan", say: "走，陪我出城走走。", shot: { bg: "yard", fan: "near", cam: "push", fx: "leaves" } },
        { who: "me", say: "出城做什么……我不想动。" },
        { who: "fan", say: "就当陪我这个老头子走走。", face: "smile" }
      ], next: "s5" },

      s5: { shot: { bg: "gate", cam: "push", fx: "leaves", tr: "slide" }, bg: "hill", lines: [
        { who: "narr", say: "出了城，路越走越高。你们爬上城外一处土岗。" },
        { who: "narr", say: "风很大。四下里的田都收空了，只剩一茬一茬的谷茬。", shot: { bg: "hill", cam: "down", fx: "leaves", tr: "slide" } },
        { who: "narr", say: "远处，一条河弯弯地流过去。几只雁从头顶飞过，往南去了。", shot: { bg: "hill", cam: "panR", fx: "birds" } },
        { who: "fan", say: "{name}，你看看四周。先不用说心里怎么样，只说你看见了什么。", shot: { bg: "hill", fan: "mid", side: "l", cam: "pull", fx: "birds" } }
      ], next: "s6" },

      s6: { shot: { bg: "hill", cam: "pull", fx: "birds leaves" }, ask: "你看了一圈，先说——", choices: [
        { t: "“田都空了，只剩下谷茬子。”", go: "s7a" },
        { t: "“雁往南飞了……后面那一只，落得好远。”", go: "s7b" },
        { t: "“河那边，太阳照着，水一闪一闪的。”", go: "s7c" }
      ] },
      s7a: { shot: { bg: "hill", cam: "down", fx: "leaves" }, lines: [
        { who: "fan", say: "空了。还看见什么？" },
        { who: "me", say: "地是灰黄的，一块连着一块。一个人也没有。" }
      ], next: "s8" },
      s7b: { shot: { bg: "hill", cam: "up", fx: "birds" }, lines: [
        { who: "fan", say: "落在后头的那一只，你看得最久。" },
        { who: "me", say: "它飞得慢，前面的，也不等它。" }
      ], next: "s8" },
      s7c: { shot: { bg: "hill", cam: "panR", fx: "light" }, lines: [
        { who: "fan", say: "你看的，是亮的那一处。" },
        { who: "me", say: "可太阳就要下去了。一会儿，就不亮了。" }
      ], next: "s8" },

      s8: { shot: { bg: "hill", fan: "near", side: "l", cam: "push", fx: "leaves" }, lines: [
        { who: "fan", say: "那，心里呢？现在可以说了。" },
        { who: "me", say: "……空落落的。好像谁都往前走了，就我一个人站在这儿。" },
        { who: "fan", say: "嗯。", face: "think" },
        { who: "me", say: "阿娘说，别想了，过几天就好了。可我就是过不去。" },
        { who: "fan", say: "过几天，大概真会好。可是现在，你心里就是不好受。这是真的。" },
        { who: "fan", say: "我不劝你别难过。" },
        { who: "me", say: "您……也有过不去的时候吗？", shot: { bg: "hill", fan: "mid", side: "l", cam: "pull", fx: "birds" } },
        { who: "fan", say: "有。前年离开京城，去年参知政事的官也罢了。想做的事没做成，一起做事的朋友，也散到了各处。", face: "think" },
        { who: "fan", say: "那阵子，我也常常一个人，不想说话。" },
        { who: "fan", say: "到了邓州，我就常一个人上这土岗来，站一站。", shot: { bg: "hill", cam: "panL", fx: "birds leaves" } },
        { who: "narr", say: "风把范公的胡子吹乱了。他望着远处，很久没有说话。", shot: { bg: "hill", fan: "mid", side: "c", cam: "still", fx: "leaves" } }
      ], next: "s9" },

      s9: { shot: { bg: "hill", fan: "mid", side: "c", cam: "still", fx: "leaves" }, ask: "你猜，范公这会儿心里——（没有标准答案，选你觉得的）", choices: [
        { t: "也在想他过不去的那件事。", go: "s10a" },
        { t: "在想远方的朋友。", go: "s10b" },
        { t: "很平静。", go: "s10c" }
      ] },
      s10a: { shot: { bg: "hill", fan: "near", cam: "push", fx: "leaves" }, lines: [
        { who: "fan", say: "（笑了笑）想起来，还会疼一下。只是不像从前那样，把整片天都遮住了。", face: "smile" }
      ], next: "s11" },
      s10b: { shot: { bg: "hill", fan: "near", side: "l", cam: "push", fx: "birds" }, lines: [
        { who: "fan", say: "子京在巴陵，这会儿大概也在楼上看湖吧。", face: "smile" }
      ], next: "s11" },
      s10c: { shot: { bg: "hill", fan: "near", side: "r", cam: "push", fx: "leaves" }, lines: [
        { who: "fan", say: "平静，是站久了才有的。刚来的时候，可不平静。", face: "think" }
      ], next: "s11" },

      s11: { shot: { bg: "tower", tone: "dusk", cam: "pull", fx: "mist", dream: 1, cap: "想象：巴陵的岳阳楼" }, lines: [
        { who: "fan", say: "子京在巴陵，有他的楼；我在邓州，有这个土岗。" },
        { who: "fan", say: "{name}，你也会有你的一座楼。", shot: { bg: "hill", tone: "dusk", fan: "near", cam: "push" } },
        { who: "me", say: "我的楼？我们这儿可没有楼。" },
        { who: "fan", say: "（笑）不一定是楼。一棵树，一段河堤，一处能让你站高一点、看远一点的地方。", face: "smile" },
        { who: "me", say: "那您站在这儿的时候，都想些什么？" },
        { who: "fan", say: "想京城里没做成的事，想散在各处的朋友，也想邓州今年的收成。想着想着，心就宽了些。", shot: { bg: "hill", tone: "dusk", fan: "mid", side: "l", cam: "pull", fx: "birds" } }
      ], next: "s12" },

      s12: { shot: { bg: "hill", tone: "dusk", cam: "pull", fx: "birds" }, ask: "你又看了看远处。这回你想说——", choices: [
        { t: "“天地这么大……我那件事，好像也没那么大了。”", go: "s13a" },
        { t: "“我还是难过。看得再远，也还是难过。”", go: "s13b" },
        { t: "“我想把今天看见的，记下来。”", go: "s13c" }
      ] },
      s13a: { shot: { bg: "hill", tone: "dusk", fan: "near", cam: "push" }, lines: [
        { who: "fan", say: "事还是那件事。只是你站的地方，高了。", face: "smile" },
        { who: "fan", say: "这不是把它忘了，是不让它把整片天都遮住。" }
      ], next: "s14" },
      s13b: { shot: { bg: "hill", tone: "dusk", fan: "near", side: "l", cam: "push" }, lines: [
        { who: "fan", say: "那也好。你说的是实话。", face: "smile" },
        { who: "fan", say: "难过不丢人。明天，该做的事，照常去做。慢慢来。" }
      ], next: "s14" },
      s13c: { shot: { bg: "hill", tone: "dusk", fan: "near", side: "r", cam: "push" }, lines: [
        { who: "fan", say: "好。那就写下来。", face: "smile" },
        { who: "fan", say: "写你看见的，也写你心里的。写完了，你自己也会看得清楚一些。" }
      ], next: "s14" },

      s14: { shot: { bg: "hill", tone: "dusk", fan: "mid", cam: "pull", fx: "birds" }, lines: [
        { who: "me", say: "难过……好像没那么快就没了。可站在这儿，好像能喘口气。" },
        { who: "fan", say: "这就够了。难过不会因为一句道理就没了。可人能站高一点，看远一点。" },
        { who: "narr", say: "下土岗的时候，天边只剩下一抹红。", shot: { bg: "hill", tone: "dusk", cam: "pull", fx: "birds", dur: 22 } }
      ], next: "f1" },

      f1: { shot: { bg: "hill", tone: "dusk", cam: "still", fx: "birds" }, card: {
        tag: "这一章，你体会到的", title: "站高一点，看远一点",
        rows: [
          ["不劝", "范公不劝人“别难过”。他知道，难过不会因为一句道理就没了。"],
          ["也有过", "范公也有过不去的时候：离开京城、罢去参知政事、朋友四散。子京在巴陵有一座楼，范公在邓州有一个土岗。"],
          ["站高", "范公在土岗上站久了，心才慢慢平静：事还是那件事，人可以站高一点、看远一点，不让它把整片天都遮住。"]
        ],
        foot: "这三条没有对错，只是一个提醒。你对范公的体会，也可以不一样。" }, lines: [
        { who: "narr", say: "回家的路上，你把那件事，又在心里想了一遍。" }
      ], next: "pick" },

      pick: { ask: "最后写一段话（会存给老师）。你想写哪一种？", choices: [
        { t: "A　我想对范公说……（推荐）", go: "w1a" },
        { t: "B　联系我自己的经历，写一段", go: "w1b" }
      ] },
      w1a: { write: { kind: "A 我想对范公说", prompt: "范公没有劝你，只带你上土岗，还告诉你他也有过不去的时候。下了土岗，你想对范公说些什么？",
        hint: "可以谢谢他，可以说说你看他望着远处时的感觉，也可以问他：站在土岗上的时候，他心里在想什么。开头可以写“范公：”。",
        min: 60, max: 150 }, next: "end" },
      w1b: { write: { kind: "B 联系自己的经历", prompt: "你的“楼”在哪里？（可以是一棵树、一段河堤、楼顶、窗口、球场边……）心里堵的时候，站在那里，你看见了什么，心里又是什么？",
        hint: "可以先写看见的，再写心里的；也可以只写看见的，让读的人自己感觉到。重在说出你自己。",
        min: 60, max: 150 }, next: "end" },

      end: { shot: { bg: "gate", tone: "dusk", cam: "push", fx: "leaves" }, end: true, lines: [
        { who: "narr", say: "进城门的时候，你回头看了一眼那个土岗。" },
        { who: "narr", say: "那件事，好像没有那么重了。" }
      ] }
    } }
];
