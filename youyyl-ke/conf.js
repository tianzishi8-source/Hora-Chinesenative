/* 《游岳阳楼记》课堂版 · 设置（window.YK_CONF）。字段说明见 ../ke/app.js 开头。 */
window.YK_CONF = {
  id: "g9-youyyl-ke", title: "游岳阳楼记", short: "游岳阳楼记", lessons: 3, ver: "11052000",
  guide: { name: "袁先生", alt: "袁中道", fig: "", figKind: "yuan", vkey: "yuan" },
  storyTitle: "楼上的一天",
  storyLead: "明朝万历年间，岳州。你是岳阳楼下茶酒铺的孩子，给楼上的客人送酒菜。",
  hero: {
    lead: "明朝万历年间，岳州。你是岳阳楼下茶酒铺的孩子，{name}。\n今天楼上来了一位从湖北公安来的客人，袁中道。这里有四样东西，帮你把课上学的读熟、弄懂。",
    fict: "剧情里的“茶酒铺的孩子”（由你扮演）、阿爹和同游的朋友是虚构人物；袁中道是真实的历史人物，对话是根据课文和史料想象的。",
    fictShort: "“茶酒铺的孩子”、阿爹和同游的朋友是虚构人物。"
  },
  rateSample: "你慢慢睁开眼。这里是岳州，岳阳楼下。",
  vsample: "客官，酒菜来啦！",
  recite: { 1: ["p1", "p2"], 2: ["p1", "p2", "p3"], 3: ["p1", "p2", "p3", "p4"] },
  reciteAllNote: "这篇不要求全文背诵；熟读之后，挑最喜欢的一段背下来。",
  voices: {
    yuan: ["zh-CN-YunyangNeural", "-12%", "-6Hz"],
    "x-阿爹": ["zh-CN-YunxiNeural", "-10%", "-18Hz"],
    "x-友人": ["zh-CN-YunxiaNeural", "-4%", "-8Hz"]
  },
  sceneVariants: { tavern: ["storm"], lakeview: ["storm", "winter"] },   // 同一场景不同季节/天气的真图：img/scene-键-色调.webp
  scenes: ["tavern", "rail", "lakeview", "wharf", "study", "night"],
  img: { tower: "../yueyanglou/img/tower.webp", lake: "../yueyanglou/img/lake.webp", map: "../yueyanglou/img/map.webp", rainlake: "../yueyanglou/img/rain.webp" }
};
