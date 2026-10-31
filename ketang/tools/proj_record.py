"""把课堂投屏的台词录成 mp3（Edge 声音），并生成 voice/index.js。
用法（在 ketang 文件夹里）：
    node tools/proj_lines.js yyl-1.js > lines.json
    python3 tools/proj_record.py lines.json voice
需要：pip install edge-tts mutagen ；能连上 Edge 朗读服务（这个服务用 WebSocket，有的网络环境连不上）。
已录过的不重录；台词一改，编号就变，旧录音自动不再使用。
"""
import asyncio, json, os, sys
import edge_tts
from mutagen.mp3 import MP3

# 声音按人物分配（参数取自声音库）
VOICES = {
    "fan": ("zh-CN-YunyangNeural", "-14%", "-6Hz"),   # 范仲淹：云扬·沉稳
    "cg":  ("zh-CN-YunjianNeural", "-2%", "+10Hz"),   # 长歌：云健·清朗（新人设，更明亮）
    "qx":  ("zh-CN-XiaoxiaoNeural", "-4%", "+14Hz"),  # 清弦：晓晓·清亮
}

async def rec(item, out):
    path = os.path.join(out, item["hash"] + ".mp3")
    if not os.path.exists(path) or os.path.getsize(path) == 0:
        v, rate, pitch = VOICES[item["who"]]
        await edge_tts.Communicate(item["text"], v, rate=rate, pitch=pitch).save(path)
    return item["hash"], round(MP3(path).info.length, 2)

async def main():
    lines = json.load(open(sys.argv[1], encoding="utf-8"))
    out = sys.argv[2]; os.makedirs(out, exist_ok=True)
    idx = {}
    for i, it in enumerate(lines):
        h, d = await rec(it, out); idx[h] = d
        print(f"{i+1}/{len(lines)} {it['who']} {d}s {it['text'][:24]}")
    with open(os.path.join(out, "index.js"), "w", encoding="utf-8") as f:
        f.write("window.PROJ_VOICE = " + json.dumps(idx) + ";\n")

asyncio.run(main())
