/* 三级台阶提问（11-09 课堂反馈：学生跟着听，一被点名就答不出，对文本意思太生）。
 * 课堂配置里写一个步骤 { ladder: {...} }，这里把它展开成几步普通步骤：
 *   0 找一找：屏幕亮出相关句子（原文＋译文对译卡），全班看 20 秒，找答案在哪一句；
 *   1 在哪一句：点 1 人读出那一句原文；
 *   2 什么意思：点 1–2 人用自己的话说意思（可省）；
 *   3 说不上来就看选项：屏幕出选择题，全班齐说选几 → 揭晓（可省）；
 *   4 为什么：点 2 人（可省）→ 揭晓要点。
 * 字段：who 主讲（默认课的 lead）；sents 相关句 id（sents.js）；find 一级问题；mean 二级问题；
 *       opts 选项（2–4 个）＋ ans 正确项序号（从 0 起）；why 四级问题；whyAns 要点（数组或字符串）；
 *       n 题号；pre 开头一句（可省，默认“先别急着答。”）；think 找一找秒数（默认 20）。
 * proj.js、tools/proj_lines.js、script.html 都用它，所以三处台词和录音完全一致。 */
(function (root) {
  var ABC = ["A", "B", "C", "D"];
  function expand(st, lead) {
    var d = st.ladder, who = d.who || st.who || lead || "fan", out = [];
    var pv = { type: "pair", ids: d.sents || [], mode: "learn", title: "找一找：答案在哪一句？", n: d.n };
    out.push({ who: who, say: (d.pre || "先别急着答。") + "看屏幕上的原文和译文，找一找：" + d.find, vis: pv, timer: { s: d.think || 20, label: "找一找" }, _lad: 0 });
    out.push({ who: who, say: "答案在哪一句？请读出原文。", vis: pv, cue: { k: "call", t: "读出答案所在的那一句原文", n: 1 }, _lad: 1 });
    if (d.mean) out.push({ who: who, say: d.mean, vis: pv, cue: { k: "call", t: "用自己的话说说意思", n: [1, 2] }, _lad: 2 });
    if (d.opts && d.opts.length) {
      var q = d.opts.map(function (o, i) { return ABC[i] + ". " + o; });
      var cv = { type: "card", n: d.n, title: d.mean || d.find, q: q };
      out.push({ who: who, say: "说不上来没关系，看选项。全班一起说：选哪一个？", vis: cv, cue: { k: "say", t: "全班一起说：选几？" }, hold: true, _lad: 3 });
      out.push({ who: who, say: "答案是" + ABC[d.ans] + "。", vis: { type: "card", n: d.n, title: d.mean || d.find, q: q, ans: [ABC[d.ans] + ". " + d.opts[d.ans]] }, sfx: "qing", _lad: 3 });
    }
    if (d.why) {
      out.push({ who: who, say: d.why, vis: pv, cue: { k: "call", t: "说说为什么", n: 2 }, _lad: 4 });
      if (d.whyAns) {
        var wa = [].concat(d.whyAns);
        out.push({ who: who, say: wa.join(""), vis: { type: "card", n: d.n, title: d.why, ans: wa, tag: "要点" }, _lad: 4 });
      }
    }
    if (st.id) out[0].id = st.id;
    return out;
  }
  root.PROJ_LADDER = expand;
})(typeof window !== "undefined" ? window : this);
