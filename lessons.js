/* 课文目录：网站首页（开场 → 签到 → 十二册 → 册页）从这里读。
 * 每加一篇课文，在下面加一项，并把课文文件夹传到仓库里。
 *   id      课文配置里的 id（lesson-*.js 的 id），不要改
 *   folder  仓库里的文件夹名，学生点进去就打开 文件夹名/
 *   grade   年级 1–12
 *   title   课文名（长卷上竖着写）；author 作者
 *   blurb   一句话介绍
 *   open    已开放几天；total 一共几天；unit 单位（默认“天”，《岳阳楼记》是“课时”）
 *   choose  （可选）点开时让学生二选一：[{label, folder, desc}]，见《岳阳楼记》
 *   pic     册页上的小画（图片路径）；picAlt 图片的文字说明；picText 叠在日历图上的字（只有《日历》用）
 */
window.HORA_LESSONS = [
  { id: "g8-rili-v3", folder: "rili", grade: 8, title: "日历", author: "冯骥才",
    blurb: "一页 1976 年 7 月 28 日的日历。作者为什么只用日历，不用月历？后半单元同读周涛《每天诞生一次》。",
    open: 8, total: 8, hwReq: 7,
    pic: "rili/img/page1976-sm.webp", picAlt: "1976 年 7 月 28 日那一页日历：撕下来的，发黄，有水渍和折痕",
    picText: { top: "一九七六年　七月", day: "28", lunar: "丙辰年七月初二", week: "星期三" } },
  { id: "g78-xinzhuang", folder: "xinzhuang", grade: 7, title: "皇帝的新装", author: "安徒生",
    blurb: "先当一回老大臣，站进织布间。童话明明是假的，为什么能说出真话？同读哈谢克《黑信》，最后写一篇自己的童话。（七、八年级共用）",
    open: 6, total: 6,
    pic: "xinzhuang/img/cover.webp", picAlt: "一架空空的织布机，旁边椅子上放着王冠和一个空衣架" },
  { id: "g78-xinzhuang", folder: "xinzhuang", grade: 8, title: "皇帝的新装", author: "安徒生",
    blurb: "先当一回老大臣，站进织布间。童话明明是假的，为什么能说出真话？再同读哈谢克《黑信》，比一比两篇的写法。（八年级学三天）",
    open: 3, total: 3,
    pic: "xinzhuang/img/cover.webp", picAlt: "一架空空的织布机，旁边椅子上放着王冠和一个空衣架" },
  { id: "yuedu-g8", folder: "yuedu", grade: 8, title: "课外阅读", author: "老人与海",
    blurb: "读你自己的纸书或 Kindle。每读完一段，回来做一个小测验（随机 5 题，对 4 题算过），再写 60—100 字复述。全班进度一起看：阅读王、阅读新星。",
    open: 7, total: 7, unit: "段",
    pic: "yuedu/img/card.webp", picAlt: "示意画：清晨的海上，一位老渔夫坐在小帆船上，船边的水下有一条大鱼的影子" },
  { id: "g8-xiayutian", folder: "xiayu", grade: 8, title: "下雨天，真好", author: "琦君",
    blurb: "先把全文听一遍，再一颗一颗看她记得的下雨天：母亲、童年的小春、父亲的声音、西湖的笛声。题目说“真好”，为什么读完心里有点酸？每天的笔记卡抄到课本上。",
    open: 3, total: 3,
    pic: "xiayu/img/xy-window.webp", picAlt: "窗玻璃上的雨" },
  { id: "g8-yeyujibei", folder: "yeyu", grade: 8, title: "夜雨寄北", author: "李商隐",
    blurb: "穿过琦君的雨，回到一千多年前巴山的秋夜。李商隐自己讲：她问我哪天回家，我答不出……读懂、背下，再和《下雨天，真好》对读。",
    open: 2, total: 2,
    pic: "yeyu/img/yy-bashan.webp?v=2", picAlt: "示意画：巴山秋夜，雨中一盏烛光" },
  { id: "g8-xiaoshitan", folder: "xiaoshitan", grade: 8, title: "小石潭记", author: "柳宗元",
    blurb: "跟着柳先生，从小丘往西走一百二十步：先听见水声，再砍开竹子看见小潭、潭底的石头、空中游的鱼。第一天读懂、背第2段；后两天看他为什么越坐越冷。",
    open: 3, total: 3,
    pic: "xiaoshitan/img/xst-pond.webp?v=2", picAlt: "示意画：竹林环绕的一个清澈小潭" },
  { id: "g8-dushu", folder: "dushu", grade: 8, title: "读书的三种姿势", author: "孙绍振",
    blurb: "读书有三种姿势：躺着读、坐着读、站着读。读懂它，复述它，最后站起来，读孙先生自己。",
    open: 1, total: 1, unit: "课时",
    /* 11-23 老师定：八年级期末前按价值选篇，第四单元“读书妙语”先上这一篇，11/27 一节自学（《读书杂谈》不上，免得一节塞两篇） */
    pic: "dushu/img/scene-study.webp", picAlt: "示意画：一间书房" },
  { id: "g8-kongmeng", folder: "kongmeng", grade: 8, title: "孔孟论学习", author: "《论语》《孟子》",
    blurb: "两千多年前，孔子和孟子怎样谈学习：学的乐趣、学和思、不知为不知、专心和恒心、不尽信书。读懂九则，背下来。",
    open: 1, total: 1, unit: "课时",
    /* 11-23 老师定：12/7 一节，课本十三则课上读九则（都要背），其余四则课后读懂 */
    pic: "kongmeng/img/scene-yard.webp", picAlt: "示意画：院中设席读书" },
  { id: "g8-zhizhu", folder: "zhizhu", grade: 8, title: "蜘蛛", author: "哥尔斯密",
    blurb: "墙角的蜘蛛小八不服气：两百多年前那个英国人写的，哪句是看见的，哪句是猜的？你来当核查员。最后回头看上个单元的蚂蚁。",
    open: 3, total: 3,
    pic: "zhizhu/img/cover.webp", picAlt: "示意画：墙角一张平铺的蛛网，网中间的洞口趴着一只小蜘蛛" },
  { id: "g9-yueyanglou", folder: "yueyanglou", grade: 9, title: "岳阳楼记", author: "范仲淹",
    blurb: "《岳阳楼记》与杜甫《登岳阳楼》。一悲一喜之外，范仲淹想要的是哪一种？",
    open: 8, total: 8, unit: "课时", static: true,   // 独立页面（原课件），不走引擎、不连表格
    /* 点开时二选一（学生）：课堂版＝配合课堂 11 节的课后单机版；自学版＝原来 8 课时的旧课件（folder 不变）。老师点开也二选一：课堂版里能预览、看全班作答。 */
    choose: [
      { label: "课堂版", folder: "yueyanglou-ke", desc: "配合课堂上的 11 节课，课后每次 20 分钟：沉浸剧情、背诵、字词、模拟测验，分数存给老师。" },
      { label: "自学版", folder: "yueyanglou", desc: "原来的 8 课时课件，自己从头读一遍全文和讲解。" }
    ],
    pic: "yueyanglou/img/tower.webp", picAlt: "水墨岳阳楼，城墙上的三层楼阁，远处是洞庭湖与帆船" },
  { id: "g9-zuiweng-zx", folder: "zuiweng", grade: 9, title: "醉翁亭记", author: "欧阳修",
    blurb: "滁州四面是山。一个被贬的太守，为什么满篇都在写“乐”？他乐的到底是什么？",
    open: 4, total: 4, unit: "课时",
    /* 课堂版：课后单机（沉浸剧情《琅琊山的一年》、背诵、字词、测验），引擎 ke/；自学版（11-12 改版）：4 天，剧场式引擎（同《皇帝的新装》《蜘蛛》），山雀领读。id 跟自学版走（首页进度读它）。 */
    choose: [
      { label: "课堂版", folder: "zuiweng-ke", desc: "配合课堂上的 4 节课，课后每次 20 分钟：沉浸剧情、背诵、字词、模拟测验，分数存给老师。" },
      { label: "自学版", folder: "zuiweng", desc: "4 天，跟着一只山雀上琅琊山：镜头推近、一亭四季、逐句翻译、三层乐、找出 21 个“也”，还有仿写和背诵。" }
    ],
    pic: "zuiweng/img/cover.webp", picAlt: "示意画：秋天，琅琊山中泉水上的一座亭子，檐角高高翘起" },
  { id: "g9-dongting", folder: "dongting", grade: 9, title: "洞庭三诗", author: "杜甫 · 孟浩然 · 李白",
    blurb: "《登岳阳楼》与《诗两首》。同一片洞庭湖：一个哭了，一个想过湖没有船，一个要把君山铲平。",
    open: 3, total: 3, unit: "课时",
    choose: [
      { label: "课堂版", folder: "dongting-ke", desc: "配合课堂上的 3 节课，课后每次 20 分钟：沉浸剧情、背诵、字词、模拟测验，分数存给老师。" },
      { label: "自学版", folder: "dongting", desc: "3 个课时：杜甫、孟浩然、李白各一课时，最后三诗比较。" }
    ],
    pic: "dongting/img/cover.webp", picAlt: "示意画：夕阳下的洞庭湖，湖心有君山，远处有帆" },
  { id: "g9-youyyl", folder: "youyyl", grade: 9, title: "游岳阳楼记", author: "袁中道",
    blurb: "明朝人登岳阳楼：上午风平浪静，傍晚风浪大作，他扔下筷子哭了。哭滕子京，还是哭自己？含单元写作“感悟性游记”。",
    open: 4, total: 4, unit: "课时",
    choose: [
      { label: "课堂版", folder: "youyyl-ke", desc: "配合课堂上的 3 节课，课后每次 20 分钟：沉浸剧情、熟读、字词、模拟测验，分数存给老师。" },
      { label: "自学版", folder: "youyyl", desc: "4 个课时：读懂全文、比较《岳阳楼记》，最后写一篇有自己感悟的游记。" }
    ],
    pic: "youyyl/img/cover.webp", picAlt: "示意画：楼上的酒席，窗外洞庭湖风浪大作" },
  { id: "g8-jiangping", folder: "jp8zy", grade: 8, title: "考试讲评", author: "试卷 · 作文",
    blurb: "八年级第一、二单元检测：试卷逐题讲评（先亮答案、红笔批改，再讲怎样答完整）；作文讲评（最好的细节放对位置、结尾不说破、动作替人说话）。课堂投屏，助教点“继续”。",
    open: 4, total: 4, unit: "项", static: true, chooseLead: "选一个：",
    choose: [
      { label: "试卷讲评", folder: "ketang/jp-g8-1.html", desc: "课堂投屏，40 分钟：积累与运用、《绿》、《行是知之始》、仿写；每题先亮答案再讲。" },
      { label: "作文讲评", folder: "ketang/jp-g8-2.html", desc: "课堂投屏，40 分钟：三件事，每件都是看原句 → 回答 → 看示范 → 用铅笔改自己的。" },
      { label: "讲评（续）", folder: "ketang/jp-g8-3.html", desc: "课堂投屏，40 分钟：试卷第8—16题（只对答案、讲方法）＋作文三件事（当堂只改结尾）。" },
      { label: "交作业（学生）", folder: "jp8zy", desc: "课后自己做：抄笔记卡、练笔（扩写细节、拆动作、新结尾）、改作文二稿、练笔总结自查，拍照交作业。" }
    ] },
  { id: "g9-jiangping", folder: "ketang/jp-g9-1.html", grade: 9, title: "考试讲评", author: "试卷 · 作文",
    blurb: "九上第三单元考试：试卷逐题讲评（先看答案，再讲为什么）；作文讲评（结尾不说破、高潮写慢、别人替你说）。课堂投屏，助教点“继续”。",
    open: 2, total: 2, unit: "节", static: true, chooseLead: "讲哪一个：",
    choose: [
      { label: "试卷讲评", folder: "ketang/jp-g9-1.html", desc: "课堂投屏，40 分钟：先给答案，再逐题讲；现代文阅读讲细。剧本可以在投屏目录里打印。" },
      { label: "作文讲评", folder: "ketang/jp-g9-2.html", desc: "课堂投屏：用同学作文里的句子讲三招，当堂改写。" }
    ] },
  { id: "g9-kule", folder: "kule", grade: 9, title: "最苦与最乐 · 谈生命", author: "梁启超 · 冰心",
    blurb: "人生什么事最苦，什么事最乐？生命又像什么？两位先生，一个讲道理，一个打比方。一节课读完两篇。",
    open: 1, total: 1, unit: "课时",
    /* 11-23 老师定：期末前都上自学课，本篇一节；不再让学生在课堂版/自学版之间选（课堂版 kule-ke 仍在，老师可直接开网址） */
    pic: "kule/img/cover.webp", picAlt: "示意画：春天的江流，两岸桃花" },
  { id: "g9-huibian", folder: "huibian", grade: 9, title: "悔的边缘", author: "刘心武",
    blurb: "地铁站里，一位老人热心给问路的年轻人带路，不知道钱包早被他偷走了。跟着两个人的心一层一层走，停在“悔的边缘”：没有结局，好不好？",
    open: 1, total: 1, unit: "课时",
    pic: "huibian/img/hb-platform.webp", picAlt: "示意画：地铁站台像一只巨大的鱼缸" },
  { id: "g9-maiqi", folder: "maiqi", grade: 9, title: "麦琪的礼物", author: "欧·亨利",
    blurb: "一元八角七，第二天就是圣诞节。德拉卖了长发，吉姆推门进来，死死地盯着她……先听故事，再看两件礼物：作者为什么说这两个“傻孩子”最聪明？",
    open: 2, total: 2,
    pic: "maiqi/img/mq-cover.webp?v=2", picAlt: "示意画：圣诞前夜，煤气灯亮着的旧公寓小窗，篱笆上一只灰白色的猫" }
];
