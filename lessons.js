/* 课文目录：网站首页（登录 → 选年级 → 山水长卷选课文）从这里读。
 * 每加一篇课文，在下面加一项，并把课文文件夹传到仓库里。
 *   id      课文配置里的 id（lesson-*.js 的 id），不要改
 *   folder  仓库里的文件夹名，学生点进去就打开 文件夹名/
 *   grade   年级 1–12
 *   title   课文名（长卷上竖着写）；author 作者
 *   blurb   一句话介绍
 *   open    已开放几天；total 一共几天
 */
window.HORA_LESSONS = [
  { id: "g8-rili-v3", folder: "rili", grade: 8, title: "日历", author: "冯骥才",
    blurb: "一页 1976 年 7 月 28 日的日历。作者为什么只用日历，不用月历？",
    open: 3, total: 11 }
];
