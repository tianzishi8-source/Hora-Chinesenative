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
    open: 11, total: 11,
    pic: "rili/img/page1976-sm.webp", picAlt: "1976 年 7 月 28 日那一页日历：撕下来的，发黄，有水渍和折痕",
    picText: { top: "一九七六年　七月", day: "28", lunar: "丙辰年七月初二", week: "星期三" } },
  { id: "g8-zhizhu", folder: "zhizhu", grade: 8, title: "蜘蛛", author: "哥尔斯密",
    blurb: "墙角的蜘蛛小八不服气：两百多年前那个英国人写的，哪句是看见的，哪句是猜的？你来当核查员。最后回头看上个单元的蚂蚁。",
    open: 3, total: 3,
    pic: "zhizhu/img/cover.webp", picAlt: "示意画：墙角一张平铺的蛛网，网中间的洞口趴着一只小蜘蛛" },
  { id: "g9-yueyanglou", folder: "yueyanglou", grade: 9, title: "岳阳楼记", author: "范仲淹",
    blurb: "《岳阳楼记》与杜甫《登岳阳楼》。一悲一喜之外，范仲淹想要的是哪一种？",
    open: 8, total: 8, unit: "课时", static: true,   // 独立页面（原课件），不走引擎、不连表格
    /* 点开时二选一（学生）：课堂版＝配合课堂 10 节的课后单机版；自学版＝原来 8 课时的旧课件（folder 不变）。老师点开仍直接进自学版。 */
    choose: [
      { label: "课堂版", folder: "yueyanglou-ke", desc: "配合课堂上的 10 节课，课后每次 20 分钟：沉浸剧情、背诵、字词、模拟测验，分数存给老师。" },
      { label: "自学版", folder: "yueyanglou", desc: "原来的 8 课时课件，自己从头读一遍全文和讲解。" }
    ],
    pic: "yueyanglou/img/tower.webp", picAlt: "水墨岳阳楼，城墙上的三层楼阁，远处是洞庭湖与帆船" },
  { id: "g9-zuiweng", folder: "zuiweng", grade: 9, title: "醉翁亭记", author: "欧阳修",
    blurb: "滁州四面是山。一个被贬的太守，为什么满篇都在写“乐”？他乐的到底是什么？",
    open: 4, total: 4, unit: "课时",
    /* 课堂版：课后单机（沉浸剧情《琅琊山的一年》、背诵、字词、测验），引擎 ke/；自学版：4 课时，引擎 zx/。老师点开进自学版（老师预览）。 */
    choose: [
      { label: "课堂版", folder: "zuiweng-ke", desc: "配合课堂上的 4 节课，课后每次 20 分钟：沉浸剧情、背诵、字词、模拟测验，分数存给老师。" },
      { label: "自学版", folder: "zuiweng", desc: "4 个课时，自己从头读：听朗读、正音、逐段读懂、练笔、背诵。" }
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
  { id: "g9-kule", folder: "kule", grade: 9, title: "最苦与最乐 · 谈生命", author: "梁启超 · 冰心",
    blurb: "人生什么事最苦，什么事最乐？生命又像什么？两位先生，一个讲道理，一个打比方。含语文趣谈“知足常乐”。",
    open: 3, total: 3, unit: "课时",
    choose: [
      { label: "课堂版", folder: "kule-ke", desc: "配合课堂上的 3 节课，课后每次 20 分钟：沉浸剧情、背诵喜欢的句段、词语、模拟测验，分数存给老师。" },
      { label: "自学版", folder: "kule", desc: "3 个课时：梁启超、冰心各一课时，最后两篇比较，用它们读本单元的人物。" }
    ],
    pic: "kule/img/cover.webp", picAlt: "示意画：春天的江流，两岸桃花" }
];
