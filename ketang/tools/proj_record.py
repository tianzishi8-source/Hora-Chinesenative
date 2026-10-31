"""把课堂投屏的台词录成 mp3（Edge 声音），并生成 voice/index.js。
用法（在 ketang 文件夹里）：
    node tools/proj_lines.js yyl-1.js > lines.json
    python3 tools/proj_record.py lines.json voice
需要：pip install edge-tts mutagen ；能连上 Edge 朗读服务（这个服务用 WebSocket，有的网络环境连不上）。
已录过的不重录；台词一改，编号就变，旧录音自动不再使用。
"""
import asyncio, json, os, ssl, sys
import edge_tts, edge_tts.communicate as _C
from mutagen.mp3 import MP3

# 经过有证书的代理时（如 Claude 的工作环境）：用代理的证书和代理地址
CA = os.environ.get("SSL_CERT_FILE") or ("/root/.ccr/ca-bundle.crt" if os.path.exists("/root/.ccr/ca-bundle.crt") else None)
if CA:
    for _n in dir(_C):
        if isinstance(getattr(_C, _n), ssl.SSLContext): setattr(_C, _n, ssl.create_default_context(cafile=CA))
PROXY = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")

# 声音按人物分配（参数取自声音库）
VOICES = {
    "fan": ("zh-CN-YunyangNeural", "-14%", "-6Hz"),   # 范仲淹：云扬·沉稳
    "cg":  ("zh-CN-YunxiNeural", "-6%", "-8Hz"),      # 长歌：云希·温和（原网站长歌的声音之一）
    "qx":  ("zh-CN-XiaoxiaoNeural", "-4%", "+14Hz"),  # 清弦：晓晓·清亮
}

async def rec(item, out):
    path = os.path.join(out, item["hash"] + ".mp3")
    if not os.path.exists(path) or os.path.getsize(path) == 0:
        v, rate, pitch = VOICES[item["who"]]
        for t in range(3):
            try:
                await edge_tts.Communicate(item["text"], v, rate=rate, pitch=pitch, proxy=PROXY).save(path); break
            except Exception as e:
                print("重试", item["hash"], e); await asyncio.sleep(2)
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
