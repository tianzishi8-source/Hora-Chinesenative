/* 《醉翁亭记》课堂版 · 设置（window.YK_CONF，引擎 ../ke/app.js 读）。字段说明见 ../ke/app.js 开头。 */
window.YK_CONF = {
  id: "g9-zuiweng-ke", title: "醉翁亭记", short: "醉翁亭记", lessons: 4, ver: "11051600",
  guide: { name: "欧阳公", alt: "欧阳修", fig: "", figKind: "ouyang" },   // 有立绘后把 fig 改成 "ouyangxiu_outfit_ancient.webp"（放进 chars/）
  storyTitle: "琅琊山的一年",
  storyLead: "庆历六年，滁州。你是琅琊山脚下樵夫家的孩子，给新来的太守带路上山。",
  hero: {
    lead: "庆历六年，滁州。你是琅琊山脚下樵夫家的孩子，{name}。\n新来的太守要上山，你给他带路。这里有四样东西，帮你把课上学的读熟、背会、弄懂。",
    fict: "剧情里的“樵夫家的孩子”（由你扮演）和阿爹是虚构人物；欧阳修、僧人智仙是真实的历史人物，对话是根据史料和课文想象的。",
    fictShort: "“樵夫家的孩子”和阿爹是虚构人物。"
  },
  rateSample: "你慢慢睁开眼。这里是滁州，庆历六年的春天。",
  vsample: "欧阳公，山路我熟，跟我来吧！",
  recite: { 1: ["p1"], 2: ["p1", "p2"], 3: ["p1", "p2", "p3"], 4: ["p1", "p2", "p3", "p4"] },
  reciteAllNote: "四段都背过了，来一套全文的。",
  voices: {   // 录音声音表（ke/tools/record.py 读）：说话人键 → [Edge 声音, 语速, 音调]
    fan: ["zh-CN-YunjianNeural", "-10%", "-8Hz"],     // 欧阳公：爽朗、带点醉意的从容
    "x-阿爹": ["zh-CN-YunxiNeural", "-10%", "-18Hz"],
    "x-智仙": ["zh-CN-YunyangNeural", "-18%", "-16Hz"],
    "x-客人": ["zh-CN-YunxiaNeural", "+6%", "-6Hz"]
  },
  scenes: ["mount", "stream", "pavilion", "path", "feast", "road", "yard", "study", "night", "gate"],
  img: {}
};
