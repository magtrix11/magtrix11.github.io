# Running and exporting Study 01

This is a 10-second study (240 frames, 24 fps), animated on twos at 12 held steps per second. It is deterministic from its seed.

| | |
|---|---|
| Seed | **1127** (default; override with `?seed=` or `--seed`) |
| Review size | 1920 × 1080 |
| Final size | 3840 × 2160 |

## 1. Requirements

- Node 18+ (tested with Node 22) and npm.
- Python 3.9+ with Pillow and NumPy (`pip install pillow numpy`). These are used only for the contact sheet, asset preparation and palette work.
- FFmpeg for the movie. Either a system `ffmpeg`, or `pip install imageio-ffmpeg`, which ships a binary that `scripts/assemble_video.sh` finds automatically.
- A Chromium for headless capture. Playwright's own browser works (`npx playwright install chromium`). If it is missing, set `CHROMIUM_PATH=/path/to/chrome`.

## 2. Install

```bash
cd we-only-get-the-wings
npm install
```

## 3. Preview (live, in the browser)

```bash
npm run dev
# open http://localhost:5173/
# optional: http://localhost:5173/?seed=1127&w=1920&h=1080
```

The page shows only the film frame, letterboxed on black, with the cursor hidden. There are no on-screen controls. Development keys are keyboard-only and never draw into the canvas:

| Key | Action |
|---|---|
| `space` | pause / play |
| `r` | restart |
| `←` / `→` | step one frame (pauses) |
| `s` | save the current frame as PNG |

The current frame number is shown in the browser tab title, outside the frame. Live preview may drop below 24 fps on slow machines. The capture path below is frame-exact regardless.

## 4. Render frames (frame-exact, headless)

```bash
npm run render                        # 240 PNGs at 1920x1080 -> renders/study01_1080/frames/f_000.png …
npm run render:4k                     # 240 PNGs at 3840x2160 -> renders/study01_4k/frames/
node scripts/render.mjs --frames 0,120,239 --out renders/check   # selected frames only
node scripts/render.mjs --seed 42 --out renders/seed42           # a different seed
```

Each render also writes `render.json`, recording the seed, size, frame count and the painted-strip role assignment.

Rendering takes about 0.35 s per frame at 1080p and about 1–2 s per frame at 4K on the cloud container.

**How capture works:** `scripts/render.mjs` starts Vite and opens the page with `?capture=1`. It then calls `window.__film.renderFrame(n)` for each frame and saves the canvas.

**Determinism:** any single frame rendered on its own is pixel-identical to the same frame in a full sequential run. The ground's memory buffer is rebuilt by replaying every earlier held step. The one exception is the scanner band, which shows the *previous* frame. Inside the three scan windows (3.35–3.9 s, 6.85–7.4 s, 8.35–8.9 s), render sequentially.

## 5. Key frames, contact sheet, movie

```bash
python3 scripts/make_contact_sheet.py renders/study01_1080 output/study01
bash scripts/assemble_video.sh renders/study01_1080 output/study01/study01_1080.mp4
PRORES=1 bash scripts/assemble_video.sh renders/study01_4k output/study01/study01_4k.mp4   # + ProRes 4444 master
```

Outputs:

- `output/study01/keyframes/kf_<frame>_<seconds>s.jpg`: 9 full-resolution key frames.
- `output/study01/contact_sheet.jpg`: labelled review sheet. The labels appear only on the sheet, never on frames.
- `output/study01/study01_1080.mp4`: H.264, CRF 16, BT.709.

## 6. Replacing placeholders with Toni's scans

1. Put originals in `assets/artwork/` named after the material slot: `painting.*`, `bodyCloth.*`, `ground.*` (`.tif`, `.png` or `.jpg`).
2. Run `python3 scripts/prepare_assets.py`. It writes runtime copies to `public/artwork/` and a `palette.json` of each scan's dominant colours.
3. Re-render. `src/film/materials.js` uses a prepared scan when present and otherwise falls back to the seeded **PLACEHOLDER** generator. The render log's `scans:` line shows which slots came from scans.

## 7. Where things are

```
src/main.js                 p5 instance, URL params, hidden keyboard controls, capture hook
src/film/timeline.js        clock, held-step cadence, key moments (seconds)
src/film/organism.js        body spine (curvature-driven), strips, cells, face layout, ribs
src/film/thread-system.js   the persistent thread: route / data path / seam / root / eyelid / rib
src/film/materials.js       palette + PLACEHOLDER textures + scan loading
src/film/render.js          drawing of every material (textured meshes, membrane, wire, gold)
src/film/post-process.js    shadows, scanner band, grain + exposure flicker
src/film/film.js            per-step composition and the ground's memory buffer
scripts/                    render.mjs, make_contact_sheet.py, assemble_video.sh, prepare_assets.py
```
