#!/usr/bin/env python3
"""Select key frames from a render and build a contact sheet.

    python3 scripts/make_contact_sheet.py renders/study01_1080 output/study01

Writes:
    <dest>/keyframes/kf_<frame>_<seconds>s.jpg   full-resolution key frames (JPEG q93)
    <dest>/contact_sheet.jpg                    3-column sheet with frame/time labels
The labels are drawn only on the sheet (a review document), never on frames.
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

# frame -> what the frame is evidence of
KEYFRAMES = [
    (0, "organism at rest; thread as route, seam, root"),
    (66, "route snaps to an orthogonal data path"),
    (84, "scanner band; tail settling, route pulled taut"),
    (108, "front of the body rolls up from its tip"),
    (150, "eye from cell, cobalt ring, thread; lid descending"),
    (165, "eyelid closed along the thread's seam"),
    (190, "seam continues past the corner: first rib"),
    (214, "membrane between ribs; gold catches light"),
    (239, "final: rib/fan/membrane rooted in the eye"),
]


def main(src, dest):
    src, dest = Path(src), Path(dest)
    frames = src / "frames"
    meta = json.loads((src / "render.json").read_text()) if (src / "render.json").exists() else {}
    fps = meta.get("fps", 24)
    (dest / "keyframes").mkdir(parents=True, exist_ok=True)
    for old in (dest / "keyframes").glob("*.jpg"):
        old.unlink()

    thumbs = []
    for n, note in KEYFRAMES:
        f = frames / f"f_{n:03d}.png"
        if not f.exists():
            print("missing", f)
            continue
        im = Image.open(f).convert("RGB")
        im.save(dest / "keyframes" / f"kf_{n:03d}_{n / fps:05.2f}s.jpg", quality=93, subsampling=0)
        thumbs.append((n, note, im))

    cols, tw = 3, 640
    th = round(tw * 9 / 16)
    pad, label = 16, 44
    rows = (len(thumbs) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * tw + (cols + 1) * pad, rows * (th + label) + (rows + 1) * pad + 40), (22, 20, 22))
    d = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("DejaVuSans.ttf", 15)
        big = ImageFont.truetype("DejaVuSans.ttf", 18)
    except OSError:
        font = big = ImageFont.load_default()
    seed = meta.get("seed", "?")
    d.text((pad, 12), f"We Only Get the Wings - study 01 - seed {seed} - {meta.get('width', '?')}x{meta.get('height', '?')} @ {fps} fps",
           fill=(230, 225, 215), font=big)
    for i, (n, note, im) in enumerate(thumbs):
        x = pad + (i % cols) * (tw + pad)
        y = 40 + pad + (i // cols) * (th + label + pad)
        sheet.paste(im.resize((tw, th), Image.LANCZOS), (x, y))
        d.text((x, y + th + 6), f"f{n:03d}  {n / fps:5.2f}s", fill=(240, 200, 120), font=font)
        d.text((x, y + th + 24), note, fill=(200, 196, 188), font=font)
    sheet.save(dest / "contact_sheet.jpg", quality=92)
    print(f"{len(thumbs)} key frames + contact sheet -> {dest}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "renders/study01_1080",
         sys.argv[2] if len(sys.argv) > 2 else "output/study01")
