/* 样例（引擎自测用，正式内容在 ../story.js）。打开 ../../?sample=1 就读这里。 */
window.YK_STORY = [
  { id: "c1", title: "一幅旧画", after: 1, minutes: 9, blurb: "庆历六年秋，邓州。范公从箱子里取出一封旧信、一幅旧画。", start: "s1",
    nodes: {
      s1: { bg: "study", lines: [
        { who: "narr", say: "庆历六年，秋天。邓州城里刚收完谷子，晒场上还堆着豆秸。" },
        { who: "x", name: "阿娘", say: "{name}，把这篮枣子给隔壁范公送去，别跑，当心洒了。" },
        { who: "me", say: "知道啦！" },
        { who: "fan", say: "是{name}啊，进来坐。正好，我在翻一只旧箱子。", face: "smile" },
        { who: "fan", say: "这是两年前老朋友滕子京寄来的信，还有这一卷画——《洞庭晚秋图》。" }
      ], next: "s2" },
      s2: { ask: "范公把画卷推到你面前。你先说什么？", choices: [
        { t: "“这画上画的是哪里？”", go: "s3a" },
        { t: "“滕子京是谁呀？”", go: "s3b" }
      ] },
      s3a: { bg: "lake", lines: [
        { who: "fan", say: "画的是洞庭湖，湖边就是岳阳楼。滕子京在那里做官，把楼重修了。" }
      ], next: "q1" },
      s3b: { lines: [
        { who: "fan", say: "他是我同一年考中进士的朋友。庆历四年春天，他被贬到巴陵郡做官。" }
      ], next: "q1" },
      q1: { quiz: { q: "信上写着：“属予作文以记之。”【属】是什么意思？", sent: "【属】予作文以记之。", opts: ["嘱托", "属于", "连接", "下属"], ans: "嘱托",
        ok: "对，“属”同“嘱”，是嘱托。他托我写一篇记。", no: "这里的“属”同“嘱”，是嘱托的意思。他托我写一篇记。" }, next: "w1" },
      w1: { write: { prompt: "如果你是范公，收到老朋友这样的托付，心里会想些什么？写一小段话。", hint: "可以从“老朋友”“被贬”“重修楼”里挑一个想。", min: 20, max: 150 }, next: "end" },
      end: { end: true, lines: [
        { who: "fan", say: "天晚了，回家吧。明天再来，我念几句给你听。" },
        { who: "narr", say: "你抱着空篮子走出院门，月亮已经上来了。" }
      ] }
    } },
  { id: "c2", title: "雨天和晴天", after: 2, minutes: 8, blurb: "（样例）一场连阴雨之后。", start: "a",
    nodes: {
      a: { bg: "rain", lines: [ { who: "narr", say: "连着下了好几天雨。" }, { who: "fan", say: "这样的天，人站在高处，会想到什么呢？" } ], next: "end" },
      end: { end: true, lines: [ { who: "narr", say: "（样例结束）" } ] }
    } }
];
