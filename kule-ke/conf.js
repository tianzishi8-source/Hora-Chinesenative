/* 《最苦与最乐 · 谈生命》课堂版 · 设置（window.YK_CONF）。字段说明见 ../ke/app.js 开头。前两章是梁启超，后两章是冰心（章节 guide）。 */
window.YK_CONF = {
  id: "g9-kule-ke", title: "最苦与最乐 · 谈生命", short: "最苦与最乐·谈生命", lessons: 3, ver: "11052100",
  guide: { name: "梁先生", alt: "梁启超", fig: "", figKind: "liang", vkey: "liang" },
  board: "最苦与最乐",
  storyTitle: "两位先生",
  storyLead: "民国时候。前两章，你是坐在讲堂里听梁启超先生讲演的中学生；后两章，你给冰心先生写了信，她回信了。",
  hero: {
    lead: "民国时候，{name}，你是一个中学生。\n你听过梁启超先生讲“最苦与最乐”，也收到过冰心先生谈“生命”的回信。这里有四样东西，帮你把两篇文章读懂、背下喜欢的段落。",
    fict: "剧情里的“中学生”（由你扮演）和同学是虚构人物；梁启超、冰心是真实的历史人物。讲演的场面和回信是根据两篇文章想象的，信里的话大多直接取自课文。",
    fictShort: "“中学生”和同学是虚构人物；讲演场面和回信是想象的。"
  },
  rateSample: "你慢慢睁开眼。讲堂里坐满了人。",
  vsample: "先生，我有一个问题。",
  reciteParas: ["k3", "k5", "s4"],
  recite: { 1: ["k3", "k5"], 2: ["k3", "k5", "s4"] },
  reciteAllNote: "课本要求背诵你喜欢的句段。这三段适合背，背熟了来一套。",
  voices: {
    liang: ["zh-CN-YunyangNeural", "-6%", "-8Hz"],    // 梁启超：讲演，中气足
    bx: ["zh-CN-XiaoxiaoNeural", "-12%", "-6Hz"],     // 冰心：温和
    "x-同学": ["zh-CN-YunxiaNeural", "+4%", "+0Hz"]
  },
  sceneVariants: { riverbank: ["storm", "dusk", "winter"], lonetree: ["summer", "autumn", "winter"], lakeview: ["dusk"] },   // 同一场景不同季节/天气的真图：img/scene-键-色调.webp
  scenes: ["hall", "stream", "riverbank", "lonetree", "study", "night", "yard", "lakeview", "mount"],
  img: { moon: "../yueyanglou/img/moon.webp" }
};
