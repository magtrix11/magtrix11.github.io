# Technical Brief

## Goal of the first build

Produce one polished 8–12 second, fullscreen moving-image study that proves the film's visual language. It must be easy to run locally, deterministic, exportable, and structured so that original artwork scans can replace procedural placeholders later.

## Recommended architecture

- **Vite + p5.js** for the project shell and animation loop.
- **Canvas 2D or p5 WebGL** for layered image surfaces, soft bodies, paths, and compositing.
- **Optional GLSL shaders** only where they materially improve mesh displacement, feedback, chromatic registration, surface warping, or scan behavior.
- **JavaScript** for timeline, scene state, persistent object identity, deterministic random seeds, asset management, interaction-free playback, and frame capture.
- **Python** for offline image preparation, segmentation/masks, palette extraction, texture processing, contact sheets, frame assembly, and export support. Python should not become the primary aesthetic generator.
- **FFmpeg** for compiling numbered frames and final delivery encodes.

Do not add React or an application framework unless it solves a real production need. This is a film-frame renderer, not a product UI.

## Suggested project structure to create

```text
src/
  main.js
  film/
    timeline.js
    organism.js
    thread-system.js
    materials.js
    post-process.js
  shaders/
  utils/
public/
  artwork/
scripts/
  prepare_assets.py
  make_contact_sheet.py
  assemble_video.sh
captures/
renders/
```

Adapt this if a simpler structure is better, but keep timeline, material logic, and export tooling separate.

## Timeline and motion

- Study duration: 8–12 seconds.
- Master playback/export rate: 24 or 30 fps.
- A 12 or 15 fps tactile cadence may be created through held frames or stepped updates while still exporting at the master rate.
- Use a normalized timeline so the study is deterministic and scrubbable during development.
- Seed all randomness and record the seed in the output metadata or README.

## Resolution

- Draft and review: 1920 × 1080.
- Final-quality path: 3840 × 2160.
- The composition should survive both without relying on browser UI or responsive web layout.
- A vertical or installation variant can be considered later; do not dilute the first study by solving every format now.

## Asset strategy

- `assets/artwork/` is the source location for Toni's future high-resolution scans and photographs.
- Copy or process runtime-ready assets into `public/artwork/` while preserving originals.
- Use alpha masks, displacement maps, edge maps, palette sampling, and fiber-direction maps where useful.
- Any temporary generated texture must be labeled as a placeholder and isolated for replacement.

## Development controls

Keyboard shortcuts or a hidden development panel are acceptable for pause, restart, seed, scrub, debug layers, and frame capture. No controls, labels, stats, cursor, or interface chrome may appear in captured frames.

## Required outputs from the first build

- A working local project with reproducible install/run commands.
- `README_RUN.md` with exact setup, preview, render, and export instructions.
- Deterministic playback from a documented seed.
- Numbered frame capture or an equivalent reliable export path.
- At least six key-frame stills across the 8–12 second study.
- A contact sheet of those key frames.
- `STUDY_REVIEW.md`, comparing the result to named mood-board references and candidly identifying what remains generic or unresolved.

## Future scope

The treatment anticipates a complete film of approximately 3:30–5:00. Do not architect every sequence now. Prove the organism, material continuity, digital/textile relationship, palette, and motion grammar first.
