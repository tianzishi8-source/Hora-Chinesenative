/* 课文目录：网站首页（开场 → 签到 → 十二册 → 册页）从这里读。
 * 每加一篇课文，在下面加一项，并把课文文件夹传到仓库里。
 *   id      课文配置里的 id（lesson-*.js 的 id），不要改
 *   folder  仓库里的文件夹名，学生点进去就打开 文件夹名/
 *   grade   年级 1–12
 *   title   课文名（长卷上竖着写）；author 作者
 *   blurb   一句话介绍
 *   open    已开放几天；total 一共几天；unit 单位（默认“天”，《岳阳楼记》是“课时”）
 *   pic     册页上的小画（图片路径）；picAlt 图片的文字说明；picText 叠在日历图上的字（只有《日历》用）
 */
window.HORA_LESSONS = [
  { id: "g8-rili-v3", folder: "rili", grade: 8, title: "日历", author: "冯骥才",
    blurb: "一页 1976 年 7 月 28 日的日历。作者为什么只用日历，不用月历？",
    open: 3, total: 11,
    pic: "rili/img/page1976-sm.webp", picAlt: "1976 年 7 月 28 日那一页日历：撕下来的，发黄，有水渍和折痕",
    picText: { top: "一九七六年　七月", day: "28", lunar: "丙辰年七月初二", week: "星期三" } },
  { id: "g9-yueyanglou", folder: "yueyanglou", grade: 9, title: "岳阳楼记", author: "范仲淹",
    blurb: "《岳阳楼记》与杜甫《登岳阳楼》。一悲一喜之外，范仲淹想要的是哪一种？",
    open: 8, total: 8, unit: "课时", static: true,   // 独立页面（原课件），不走引擎、不连表格
    pic: "yueyanglou/img/tower.webp", picAlt: "水墨岳阳楼，城墙上的三层楼阁，远处是洞庭湖与帆船" }
];
