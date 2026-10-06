#!/usr/bin/env python3
"""INTERIM material from Toni's own works as they appear in the mood-board
screenshots (low resolution). Used until real scans exist in assets/artwork/.

    python3 scripts/build_interim_artwork.py

  painting.jpg  <- P10 (BAC41C65 R-bottom) + P12 (574CDABA L-top), Toni's paintings

Only Mariantonia Gutierrez's own pins are used; no other artist's image is
used as texture. Real scans placed in assets/artwork/ and processed with
prepare_assets.py overwrite these files.
"""
from pathlib import Path

from PIL import Image, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "references" / "moodboard_raw"
DST = ROOT / "public" / "artwork"


def up(im, size):
    im = im.resize(size, Image.LANCZOS)
    return im.filter(ImageFilter.UnsharpMask(radius=2, percent=70, threshold=2))


def main():
    DST.mkdir(parents=True, exist_ok=True)
    p10 = Image.open(RAW / "BAC41C65-F997-44B2-A174-7AEF7ED24D11.jpeg").convert("RGB").crop((368, 980, 688, 1345))
    p12 = Image.open(RAW / "574CDABA-EC2C-4391-B8B4-095A8B3D4BA1.jpeg").convert("RGB").crop((37, 362, 318, 700))
    p13 = Image.open(RAW / "574CDABA-EC2C-4391-B8B4-095A8B3D4BA1.jpeg").convert("RGB").crop((370, 770, 685, 1195))

    H = 1024
    a = up(p10, (round(p10.width * H / p10.height), H))
    b = up(p12, (round(p12.width * H / p12.height), H))
    atlas = Image.new("RGB", (2048, H))
    atlas.paste(a, (0, 0))
    atlas.paste(b, (a.width, 0))
    rest = 2048 - a.width - b.width
    if rest > 0:
        atlas.paste(ImageOps.mirror(a).crop((0, 0, rest, H)), (a.width + b.width, 0))
    atlas.save(DST / "painting.jpg", quality=94, subsampling=0)

    # ground: landscape slice of P13, soft (reads as the out-of-focus table)
    # ground: P13 is too small to magnify to a full frame without looking
    # pixelated or (when tiled) kaleidoscopic, so the ground stays the
    # procedural gesso placeholder until a real scan of it exists.
    (DST / "ground.jpg").unlink(missing_ok=True)
    print("interim artwork ->", DST)


if __name__ == "__main__":
    main()
