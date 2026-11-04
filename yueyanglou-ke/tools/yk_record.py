"""把《岳阳楼记》课堂版（yueyanglou-ke）沉浸体验的台词录成 mp3（Edge 声音），并合并进 voice/index.js。
复用 ketang/tools/proj_record.py 的录音（Edge TTS，经代理）和响度标准化（loudnorm -14 LUFS），只是换成这一课自己的声音表，并且几条同时录。
用法（在仓库根目录）：
    node yueyanglou-ke/tools/yk_lines.js > /tmp/yk_lines.json
    python3 yueyanglou-ke/tools/yk_record.py /tmp/yk_lines.json yueyanglou-ke/voice
可选：第三个参数是同时录几条（默认 6）；只想先录一部分，可加环境变量 YK_ONLY=me-b1,narr（按说话人键筛）。
已录过的不重录；台词一改，编号就变，旧录音自动不再使用。voice/index.js 里旧的条目保留（合并，不冲掉）。
"""
import asyncio, json, os, re, sys, time

# 复用 proj_record.py：执行它的代码（去掉最后一行 asyncio.run(main())），拿到 rec / norm / 代理与证书设置
_P = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "ketang", "tools", "proj_record.py")
_src = open(_P, encoding="utf-8").read().replace("asyncio.run(main())", "")
_ns = {"__name__": "proj_record", "__file__": _P}
exec(compile(_src, _P, "exec"), _ns)
MP3 = _ns["MP3"]

# 这一课的声音表：说话人键 → (声音, 语速, 音调)。键和 tools/yk_lines.js、app.js（MYV）一致。
VOICES = {
    "fan":   _ns["VOICES"]["fan"],                       # 范仲淹：沿用课堂投屏的云扬·沉稳
    "narr":  ("zh-CN-XiaoxiaoNeural", "-12%", "-8Hz"),   # 旁白：像在耳边讲故事
    "x-阿娘": ("zh-CN-XiaoxiaoNeural", "-6%", "-10Hz"),
    "x-周伯": ("zh-CN-YunjianNeural", "-12%", "-14Hz"),   # 范家老仆
    "x-阿青": ("zh-CN-YunxiaNeural", "+6%", "+4Hz"),     # 备用：少年的好朋友（现在剧情里只在话里提到）
    # “我”：男孩
    "me-b1": ("zh-CN-YunxiNeural", "+4%", "+6Hz"),       # 云希·清朗
    "me-b2": ("zh-CN-YunxiaNeural", "+0%", "+0Hz"),      # 云夏·少年
    "me-b3": ("zh-CN-YunxiNeural", "-6%", "-4Hz"),       # 云希·温和
    "me-b4": ("zh-CN-YunjianNeural", "-4%", "+6Hz"),     # 云健·爽朗
    # “我”：女孩
    "me-g1": ("zh-CN-XiaoyiNeural", "+4%", "+8Hz"),      # 晓伊·活泼
    "me-g2": ("zh-CN-XiaoxiaoNeural", "-4%", "+6Hz"),    # 晓晓·温柔
    "me-g3": ("zh-CN-XiaoyiNeural", "-4%", "+16Hz"),     # 晓伊·清亮
    "me-g4": ("zh-CN-XiaoxiaoNeural", "-8%", "+0Hz"),    # 晓晓·柔和
}
_ns["VOICES"].clear(); _ns["VOICES"].update(VOICES)   # proj_record.rec() 按 who 查这张表
rec = _ns["rec"]

def write_index(out, idx):
    tmp = os.path.join(out, "index.js.tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        f.write("window.PROJ_VOICE = " + json.dumps(idx) + ";\nwindow.PROJ_VOICE_V = \"" + time.strftime("%m%d%H%M") + "\";\n")
    os.replace(tmp, os.path.join(out, "index.js"))

async def main():
    lines = json.load(open(sys.argv[1], encoding="utf-8"))
    out = sys.argv[2]; os.makedirs(out, exist_ok=True)
    par = int(sys.argv[3]) if len(sys.argv) > 3 else 6
    only = [s for s in os.environ.get("YK_ONLY", "").split(",") if s]
    if only: lines = [l for l in lines if l["who"] in only]
    bad = [l for l in lines if l["who"] not in VOICES]
    if bad: sys.exit("声音表里没有这些说话人：" + ", ".join(sorted(set(l["who"] for l in bad))))
    idx = {}
    ip = os.path.join(out, "index.js")
    if os.path.exists(ip):
        m = re.search(r"=\s*(\{.*?\})\s*;", open(ip, encoding="utf-8").read(), re.S)
        if m: idx = json.loads(m.group(1))
    sem = asyncio.Semaphore(par); done = [0]; fails = []
    async def one(it):
        async with sem:
            try:
                h, d = await rec(it, out)
                if d <= 0.2: raise RuntimeError("录音太短")
                idx[h] = d
            except Exception as e:
                fails.append(it); print("失败", it["who"], it["hash"], e, flush=True)
                p = os.path.join(out, it["hash"] + ".mp3")
                if os.path.exists(p) and os.path.getsize(p) == 0: os.remove(p)
                return
            done[0] += 1
            print(f"{done[0]}/{len(lines)} {it['who']} {idx[h]}s {it['text'][:24]}", flush=True)
            if done[0] % 40 == 0: write_index(out, idx)
    await asyncio.gather(*[one(it) for it in lines])
    write_index(out, idx)
    print(f"完成：{done[0]} 条，失败 {len(fails)} 条；index.js 共 {len(idx)} 条", flush=True)

asyncio.run(main())
