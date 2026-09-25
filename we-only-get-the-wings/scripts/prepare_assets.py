#!/usr/bin/env python3
"""Prepare Toni's original scans for the runtime, leaving originals untouched.

    python3 scripts/prepare_assets.py

Looks in assets/artwork/ for files named after the material slots (any of
.tif/.tiff/.png/.jpg/.jpeg), e.g.

    assets/artwork/painting.tif     -> public/artwork/painting.jpg   (long edge 4096)
    assets/artwork/bodyCloth.tif    -> public/artwork/bodyCloth.jpg  (4096 x 512 strip)
    assets/artwork/ground.tif       -> public/artwork/ground.jpg     (3840 x 2160 cover crop)

and writes a palette report (public/artwork/palette.json) with the dominant
colours of each scan, so the procedural parts (cells, membrane, thread) can
be retuned to the real material. When a prepared file exists the film uses it;
otherwise it falls back to the seeded PLACEHOLDER in src/film/materials.js.
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "artwork"
DST = ROOT / "public" / "artwork"
SLOTS = {
    "painting": ("fit", 4096, None),
    "bodyCloth": ("strip", 4096, 512),
    "ground": ("cover", 3840, 2160),
}
EXTS = [".tif", ".tiff", ".png", ".jpg", ".jpeg"]


def dominant(im, k=6, seed=1):
    a = np.asarray(im.convert("RGB").resize((256, 256))).reshape(-1, 3).astype(float)
    rng = np.random.default_rng(seed)
    c = a[rng.choice(len(a), k, replace=False)]
    for _ in range(15):
        lab = ((a[:, None] - c[None]) ** 2).sum(-1).argmin(1)
        c = np.array([a[lab == i].mean(0) if (lab == i).any() else c[i] for i in range(k)])
    w = np.bincount(lab, minlength=k) / len(lab)
    return [{"hex": "#%02x%02x%02x" % tuple(int(v) for v in c[i]), "share": round(float(w[i]), 3)} for i in np.argsort(-w)]


def main():
    DST.mkdir(parents=True, exist_ok=True)
    report = {}
    for slot, (mode, w, h) in SLOTS.items():
        src = next((SRC / f"{slot}{e}" for e in EXTS if (SRC / f"{slot}{e}").exists()), None)
        if not src:
            print(f"{slot:10s} no scan in assets/artwork -> placeholder stays in use")
            continue
        im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
        if mode == "fit":
            im.thumbnail((w, w), Image.LANCZOS)
        elif mode == "strip":
            im = ImageOps.fit(im, (w, h), Image.LANCZOS)
        else:
            im = ImageOps.fit(im, (w, h), Image.LANCZOS)
        out = DST / f"{slot}.jpg"
        im.save(out, quality=94, subsampling=0)
        report[slot] = {"source": str(src.relative_to(ROOT)), "size": im.size, "palette": dominant(im)}
        print(f"{slot:10s} {src.name} -> {out.relative_to(ROOT)} {im.size}")
    (DST / "palette.json").write_text(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
