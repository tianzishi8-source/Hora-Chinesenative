"""统一录音：按句录、再按标点接上合适的停顿。来源：项目 claude/课文引擎/tools/record.py（本课只用 Edge）。
用法（zuiweng 目录）：python3 tools/record.py /tmp/zw-items.json voice [--redo]
清单条目：{id, engine:"edge", voice, rate, pitch, text, say?}；say＝录音专用文字（多音字换同音字），可用“｜”手动标停顿。"""
import asyncio, json, os, re, ssl, subprocess, sys, tempfile
import numpy as np, soundfile as sf

SR = 24000
PAUSE = {"。": .42, "！": .42, "？": .42, "；": .28, "：": .28, "｜": .22}
CLEAN = [("……", "，"), ("…", "，"), ("——", "，"), ("“", ""), ("”", ""), ("「", ""), ("」", ""), ("《", ""), ("》", ""), ("（", "，"), ("）", "，"), ("→", "，")]

def segments(text):
    out, buf, depth = [], "", 0
    for ch in text:
        if ch in "“「": depth += 1
        if ch in "”」": depth = max(0, depth - 1)
        if ch == "｜":
            if buf.strip(): out.append([buf, PAUSE["｜"]])
            buf = ""; continue
        buf += ch
        if ch in PAUSE and depth == 0:
            out.append([buf, PAUSE[ch]]); buf = ""
    if buf.strip(): out.append([buf, 0])
    for s in out:
        t = s[0].rstrip()
        if s[1] == 0 and t and t[-1] in "”」" and len(t) > 1 and t[-2] in PAUSE: s[1] = PAUSE[t[-2]]
    if out: out[-1][1] = 0
    return [(s, p) for s, p in out if re.search(r"[\w一-鿿]", s)]

def clean(t):
    for a, b in CLEAN: t = t.replace(a, b)
    return re.sub(r"[，、\s]+$", "", re.sub(r"^[，、\s]+", "", t)) or t

def to_wav_array(mp3):
    r = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", mp3, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True, check=True)
    a = np.frombuffer(r.stdout, dtype=np.float32)
    nz = np.where(np.abs(a) > 0.008)[0]
    return a[max(0, nz[0] - 240): nz[-1] + 1200] if len(nz) else a

async def edge_seg(text, it, sem):
    import edge_tts.communicate as C
    C._SSL_CTX = ssl.create_default_context(cafile="/root/.ccr/ca-bundle.crt")
    import edge_tts
    err = None
    async with sem:
        for k in range(4):
            try:
                with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f: p = f.name
                await edge_tts.Communicate(text, it["voice"], rate=it.get("rate", "+0%"), pitch=it.get("pitch", "+0Hz")).save(p)
                a = to_wav_array(p); os.unlink(p)
                if len(a): return a
            except Exception as e:
                err = e
            await asyncio.sleep(1.5)
        raise RuntimeError(f"edge failed: {text[:20]} {err}")

async def record(it, out, sem):
    p = os.path.join(out, it["id"] + ".mp3")
    parts = []
    for s, pause in segments(it.get("say") or it["text"]):
        a = await edge_seg(clean(s), it, sem)
        parts += [a, np.zeros(int(SR * pause), dtype=np.float32)]
    audio = np.concatenate(parts) if parts else np.zeros(1, dtype=np.float32)
    audio = np.concatenate([np.zeros(int(SR * .05), dtype=np.float32), audio, np.zeros(int(SR * .15), dtype=np.float32)])
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        sf.write(f.name, audio, SR)
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", f.name, "-ac", "1", "-b:a", "64k", p], check=True)
        os.unlink(f.name)

async def main():
    items = json.load(open(sys.argv[1])); out = sys.argv[2]; redo = "--redo" in sys.argv
    os.makedirs(out, exist_ok=True)
    todo = [i for i in items if redo or not os.path.exists(os.path.join(out, i["id"] + ".mp3"))]
    sem = asyncio.Semaphore(6)
    async def run(i):
        try: await record(i, out, sem)
        except Exception as e: print("FAIL", i["id"], e)
    await asyncio.gather(*[run(i) for i in todo])
    print("done", len(todo))

if __name__ == "__main__":
    asyncio.run(main())
