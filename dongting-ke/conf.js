/* 《洞庭三诗》课堂版 · 设置（window.YK_CONF）。字段说明见 ../ke/app.js 开头。三位诗人在不同年代，每章的 guide 在 data/story.js 里换。 */
window.YK_CONF = {
  id: "g9-dongting-ke", title: "洞庭三诗", short: "洞庭三诗", lessons: 3, ver: "11051800",
  guide: { name: "杜公", alt: "杜甫", fig: "", figKind: "dufu", vkey: "du" },
  storyTitle: "湖上三船客",
  storyLead: "你是岳州湖边船家的孩子。三章三个年代，你的船上先后来了三位诗人。",
  hero: {
    lead: "洞庭湖边，岳州。你是船家的孩子，{name}。\n一千多年里，有三位诗人坐过“你”的船：杜甫、孟浩然、李白。这里有四样东西，帮你把三首诗读熟、背会、弄懂。",
    fict: "剧情里的“船家孩子”（由你扮演）和船家阿爹、阿娘是虚构人物；三章发生在不同年代，每一章的你是那个年代的船家孩子。杜甫、孟浩然、李白是真实的历史人物，对话是根据诗作和史料想象的。",
    fictShort: "“船家孩子”和阿爹、阿娘是虚构人物；三章在不同年代。"
  },
  rateSample: "你慢慢睁开眼。这里是洞庭湖边，岳州。",
  vsample: "老先生，船备好了，您慢点儿上。",
  recite: { 1: ["d"], 2: ["d", "m"], 3: ["d", "m", "l"] },
  reciteAllNote: "三首都背过了，来一套全部的。",
  voices: {
    du: ["zh-CN-YunyangNeural", "-20%", "-16Hz"],     // 杜甫：老、病、慢
    meng: ["zh-CN-YunxiNeural", "-10%", "-10Hz"],     // 孟浩然：温和
    li: ["zh-CN-YunjianNeural", "+2%", "-2Hz"],       // 李白：豪放
    "x-阿爹": ["zh-CN-YunxiNeural", "-10%", "-18Hz"],
    "x-阿娘": ["zh-CN-XiaoxiaoNeural", "-6%", "-10Hz"],
    "x-杜夫人": ["zh-CN-XiaoxiaoNeural", "-14%", "-14Hz"]
  },
  scenes: ["lakeview", "boat", "rail", "wharf", "tavern"],
  img: { tower: "../yueyanglou/img/tower.webp", lake: "../yueyanglou/img/lake.webp", moon: "../yueyanglou/img/moon.webp", spring: "../yueyanglou/img/spring.webp", rainlake: "../yueyanglou/img/rain.webp", map: "../yueyanglou/img/map.webp" }
};
