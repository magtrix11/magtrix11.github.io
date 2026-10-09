#!/usr/bin/env python3
"""A/B contact sheet: two renders side by side at matching timestamps.

    python3 scripts/make_ab_sheet.py <A frames dir> <B frames dir> <out.jpg> [labelA] [labelB]
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

FRAMES = [0, 24, 48, 66, 84, 96, 108, 120, 132, 144, 160, 176, 192, 204, 216, 228, 239]


def main(a, b, out, la="Revision 2", lb="Revision 3"):
    a, b = Path(a), Path(b)
    tw, th, pad, lab = 560, 315, 10, 22
    try:
        font = ImageFont.truetype("DejaVuSans.ttf", 15)
        big = ImageFont.truetype("DejaVuSans.ttf", 20)
    except OSError:
        font = big = ImageFont.load_default()
    W = 120 + 2 * (tw + pad) + pad
    H = 50 + len(FRAMES) * (th + pad) + pad
    sheet = Image.new("RGB", (W, H), (22, 20, 22))
    d = ImageDraw.Draw(sheet)
    d.text((120 + pad, 14), la, fill=(230, 225, 215), font=big)
    d.text((120 + 2 * pad + tw, 14), lb, fill=(240, 200, 120), font=big)
    for r, n in enumerate(FRAMES):
        y = 50 + r * (th + pad)
        d.text((12, y + th // 2 - 10), f"f{n:03d}\n{n / 24:5.2f}s", fill=(240, 200, 120), font=font)
        for c, src in enumerate((a, b)):
            f = src / f"f_{n:03d}.png"
            if f.exists():
                sheet.paste(Image.open(f).convert("RGB").resize((tw, th), Image.LANCZOS), (120 + pad + c * (tw + pad), y))
    sheet.save(out, quality=88)
    print("A/B sheet ->", out)


if __name__ == "__main__":
    main(*sys.argv[1:])
