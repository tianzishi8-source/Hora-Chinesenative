"""课堂版通用：把一课沉浸体验的台词录成 mp3（Edge 声音），合并进 {课文夹}/voice/index.js。
复用 ketang/tools/proj_record.py 的录音（Edge TTS，经代理）和响度标准化。声音表：下面 BASE（“我”的 8 种声音、旁白）＋ 这一课 conf.js 里的 voices（人物）。
用法（仓库根目录）：
    node ke/tools/lines.js zuiweng-ke > /tmp/lines.json
    python3 ke/tools/record.py /tmp/lines.json zuiweng-ke
可选第三个参数：同时录几条（默认 6）。已录过的不重录；台词一改编号就变，旧录音不再使用。
"""
import asyncio, json, os, re, subprocess, sys, time
_P = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "ketang", "tools", "proj_record.py")
_src = open(_P, encoding="utf-8").read().replace("asyncio.run(main())", "")
_ns = {"__name__": "proj_record", "__file__": _P}
exec(compile(_src, _P, "exec"), _ns)
PROJ = dict(_ns["VOICES"])   # 课堂投屏的声音：fan 范仲淹、cg 长歌、qx 清弦、hy 徽音老师（自学版的伴学和老师用它们）

BASE = {
    "narr":  ("zh-CN-XiaoxiaoNeural", "-12%", "-8Hz"),
    "me-b1": ("zh-CN-YunxiNeural", "+4%", "+6Hz"), "me-b2": ("zh-CN-YunxiaNeural", "+0%", "+0Hz"),
    "me-b3": ("zh-CN-YunxiNeural", "-6%", "-4Hz"), "me-b4": ("zh-CN-YunjianNeural", "-4%", "+6Hz"),
    "me-g1": ("zh-CN-XiaoyiNeural", "+4%", "+8Hz"), "me-g2": ("zh-CN-XiaoxiaoNeural", "-4%", "+6Hz"),
    "me-g3": ("zh-CN-XiaoyiNeural", "-4%", "+16Hz"), "me-g4": ("zh-CN-XiaoxiaoNeural", "-8%", "+0Hz"),
}

def conf_voices(lesson):
    # 课堂版：conf.js 里的 YK_CONF.voices；自学版：data/lesson.js 里的 ZX.voices
    f = os.path.join(lesson, "conf.js")
    if not os.path.exists(f): f = os.path.join(lesson, "data", "lesson.js")
    js = "const vm=require('vm'),fs=require('fs');const c={window:{}};vm.runInNewContext(fs.readFileSync(process.argv[1],'utf8'),c);process.stdout.write(JSON.stringify((c.window.YK_CONF||c.window.ZX||{}).voices||{}))"
    return {k: tuple(v) for k, v in json.loads(subprocess.check_output(["node", "-e", js, f])).items()}

def write_index(out, idx):
    tmp = os.path.join(out, "index.js.tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        f.write("window.PROJ_VOICE = " + json.dumps(idx) + ";\nwindow.PROJ_VOICE_V = \"" + time.strftime("%m%d%H%M") + "\";\n")
    os.replace(tmp, os.path.join(out, "index.js"))

async def main():
    lines = json.load(open(sys.argv[1], encoding="utf-8"))
    lesson = sys.argv[2]; out = os.path.join(lesson, "voice"); os.makedirs(out, exist_ok=True)
    par = int(sys.argv[3]) if len(sys.argv) > 3 else 6
    V = dict(PROJ); V.update(BASE); V.update(conf_voices(lesson))
    _ns["VOICES"].clear(); _ns["VOICES"].update(V); rec = _ns["rec"]
    bad = sorted(set(l["who"] for l in lines if l["who"] not in V))
    if bad: sys.exit("声音表里没有这些说话人：" + ", ".join(bad))
    idx = {}
    ip = os.path.join(out, "index.js")
    if os.path.exists(ip):
        m = re.search(r"=\s*(\{.*?\})\s*;", open(ip, encoding="utf-8").read(), re.S)
        if m: idx = json.loads(m.group(1))
    sem = asyncio.Semaphore(par); done = [0]; fails = []
    async def one(it):
        async with sem:
            try:
                h, d = await rec(it, out); idx[h] = d
            except Exception as e:
                fails.append(it["hash"]); print("失败", it["hash"], e)
            done[0] += 1
            if done[0] % 50 == 0: print(done[0], "/", len(lines)); write_index(out, idx)
    await asyncio.gather(*[one(it) for it in lines])
    write_index(out, idx)
    print("完成", len(lines), "条，失败", len(fails))

asyncio.run(main())
