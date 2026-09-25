# Technique Map — *We Only Get the Wings*

This document turns `VISUAL_INVENTORY.md` into production methods. The pin IDs (P01–P39) refer to that inventory's ledger.

Each quality is tagged with its source:

- **[SCAN]** will eventually come from Toni's original scans and photographs in `assets/artwork/`.
- **[PROC]** is procedural by design; the mechanism *is* the image.
- **[PLACEHOLDER]** is generated now only so the study can run, and must be swapped for scans.

## 0. Stack decision

| Layer | Choice | Why |
|---|---|---|
| Shell / dev server / build | **Vite** | Zero-config ES modules, static `dist/` build, and a headless browser can drive it for capture. |
| Draw loop, buffers, seeded random | **p5.js** (instance mode, 2D renderer) | Provides the loop, `createGraphics` off-screen buffers and pixel access. We drop to the native `drawingContext` (Canvas 2D) for triangle-mapped textures, `filter: blur()`, composite modes and clipping. p5 has no default look that we use. |
| Mesh deformation of painted/textile surfaces | **Canvas 2D affine-mapped triangles**, rendered through p5 buffers | The textures must stick to the moving body so a painted fragment keeps its identity. 2D triangle mapping gives true mesh deformation while keeping 2D compositing (multiply, blur, clipping). |
| GLSL | **Not in the first study.** Reserved for the 4K pass. | Everything the study needs can be done in Canvas 2D at 1080p offline. If 4K render time becomes a problem, candidates to move into shaders are the grain, the scan band and the shadow blur. |
| Timeline, identity, state, export | **Plain JavaScript modules** | Deterministic `t → state` functions, seeded hashing, and `window.__film.renderFrame(n)` for capture. |
| Offline tooling | **Python** (Pillow/NumPy) plus **FFmpeg** | Asset preparation for scans, palette extraction from references, contact sheets, video assembly. Python never generates the image. |
| Frame capture | **Playwright** (pre-installed Chromium) driving the page frame by frame | Frame-exact and deterministic, and independent of realtime performance. |

---

## 1. Quality → technique

### 1.1 Colour lives in matter (Principle 1)

| Quality | Technique | Source |
|---|---|---|
| Painted-canvas colour: cobalt, arterial red, orange, pink, ochre, acid/bottle green, cream contour (P10, P12) | A **painting atlas**: one large texture from which every strip and fragment is cut by a UV rectangle, so each fragment carries a unique piece of one painting. For now, a JS generator paints seeded bristle strokes (each stroke is 6–14 parallel sub-strokes with per-bristle alpha and dry-brush dropout) over a gesso base, then multiplies a canvas-weave tooth on top. | **[PLACEHOLDER]** → **[SCAN]** of Toni's paintings (P09–P12). This is the most important swap. |
| Felt/cloth body colour: coral, pink, flesh, grey fading along the length (P37, P17) | A **body texture strip** (long, 2048 × 256): a hue ramp along *u* (coral → pink → grey-plum) with thousands of short fiber flecks and a baked cylindrical shade across *v*. It is mapped along the body spine. | **[PLACEHOLDER]** → **[SCAN]** of dyed muslin/felt. |
| Ochre cells (P14) | Procedural lumpy discs: radial gradient ochre `#efc17b → #cb852b → #954c11`, noise-perturbed radius, speckle dots, and a white net drawn as sagging Bézier strands. | **[PROC]** with a palette taken from the P14 measurement. Could later use a photographed bead/wax fragment as a stamp. |
| Pink sheer membrane (P17, P35) | Multiply-blended translucent fill (`#d98ba0` α≈0.35) plus pleat lines along the rib direction and vein lines interpolated between ribs. A low-alpha painting-atlas slice is multiplied on top ("painted membrane"). | **[PROC]**. Later: **[SCAN]** of sheer fabric, backlit. |
| Gold (P25–P28) | Tiny hammered discs: dented radial gradient (dull `#9e7239` → `#e0b265`), a pierced centre, and a **specular response to a moving light angle** so they flash briefly and fall dark. | **[PROC]**. Later: **[SCAN]** of Toni's foil/metal. |
| Avoid gradients without a material source | Any gradient must be *baked into a texture of a material*. Screen-space gradients are forbidden except the ground's own staining. | Rule |

### 1.2 Pale shadowed ground that remembers (Principle 2, P13)

| Quality | Technique | Source |
|---|---|---|
| Worked gesso ground with cobalt scribble | Ground buffer generated once: grey-white gesso (`#dcdcd6`-ish, **cool**, not beige), soft mottling, fine canvas tooth, a few ultramarine dry-brush blots near one corner (P13), and sparse cobalt/teal scribble loops. | **[PLACEHOLDER]** → **[SCAN]** of P13-type ground or raw canvas. |
| Cast shadows (P11, P14, P15, P32, P38) | Every object draws its silhouette into a **shadow buffer**. The buffer is blurred with `ctx.filter = blur()`, offset along the light direction, and multiplied onto the ground. Lifted objects (strips in transit) get a **larger offset and softer blur**, so lifting reads physically. | **[PROC]** |
| Ground as memory (**frame persistence / path memory**) | A **memory buffer that is never cleared**. At each animation step, the thread's current path is stamped into it in thin, low-alpha cobalt-charcoal, and the body contour very faintly. Departing strips leave a **pigment offset**, a faint multiply stamp of their own texture, where they lay. The buffer is composited between ground and shadow. When scrubbing, it is rebuilt by replaying the steps. | **[PROC]**. This is digital mechanism #1. |

### 1.3 The persistent thread (Principle 3, P33, P07, P08)

The thread is one object with one identity for the whole study. Its geometry is a function of time, assembled from segments that are never removed:

| Role | How it appears | Technique |
|---|---|---|
| **Route** | Enters from the frame edge and meanders across the ground to the body. | A seeded fixed polyline. During reorganisation it becomes **quantised**: snapped to an 8 px lattice as orthogonal stair steps, like a routed trace. It relaxes back to organic afterwards, but the memory buffer keeps the stepped traces. *(Digital mechanism #2: the data path is literally drawn as a routing path.)* |
| **Seam** | Runs along the body as a running stitch (over and under). | Dashes along the spine centreline: "over" segments drawn after the body, "under" segments hidden. Red cross-stitches bind the strips (P07). |
| **Root / nerve** | In the larval phase, the thread tip splits into rootlets (P18 roots, P21 branching). | Recursive branching from the tip with seeded angles. When the thread is later pulled into the eye, the rootlets **detach and stay on the ground as loose fibers**: nothing is deleted. |
| **Eyelid** | The tip outlines the almond eye and becomes the lid seam with lash stitches. | Two quadratic arcs. The closing lid interpolates the upper arc toward the lower arc in **stepped** increments. |
| **Rib / vein** | The lid seam extends laterally past the outer corner and becomes the first rib. | The rib-0 curve is simply the thread's continuation, growing by arc length. |

Rendering: 1.6–2.4 px dark oxblood-charcoal (`#3a1618`) with a thin warm highlight on one side, per-vertex width wobble, and a slight tension-dependent straightening (lerp toward a chord) when taut.

### 1.4 Soft within rigid, rigid clothed by soft (Principle 4, P11, P14, P15, P35)

| Quality | Technique | Source |
|---|---|---|
| Soft body | A **spine-driven ribbon mesh**. The spine is *integrated from curvature* κ(s,t). Coiling is therefore a change of curvature, and the body *curls* instead of point-morphing. Width profile w(s) is irregular and breathes in held steps. The texture is mapped with affine triangles, so it deforms with the body. *(Mesh deformation: digital mechanism #3.)* | **[PROC]** geometry + **[PLACEHOLDER]** texture |
| Strips wrapping the body, then knotted onto ribs | Each strip is a short textured ribbon: 6 segments, jittered edges, raw-canvas cut-edge line, frayed fibers at the ends, and an optional overhand-knot tuft. Its *placement frame* (position, angle, bend) is interpolated between anchors: body at s → face role → rib r at u. Transit is **staggered and stepped**, and the strip is lifted while moving. | Geometry **[PROC]**; surface = painting atlas **[PLACEHOLDER→SCAN]** |
| Cells in a net | Cell cluster (P14) with a white net. Cells travel individually: some stay as the tail's cluster, one becomes the iris, others become rib joints. The net strands stretch to follow and remain as white fibers. | **[PROC]** |
| Wire ribs | Double-stroke dark wire with occasional red thread wraps (P11 yarn bands, P15 wire). They grow by arc length from the root, and the tip searches slightly. | **[PROC]** |

### 1.5 Embedded, partial face (Principle 5, P12, P18, P02, P26)

| Element | Technique |
|---|---|
| Eye | The almond formed by the thread's arcs around a migrated ochre cell (iris), with a dry-brush cobalt ring built from multiple jittered arcs (P18's blue rim, P12's outlined cells). The eyelid is one of the body strips (pink/cream painted fragment) that slides down over the iris. The lid seam carries lash stitches. |
| Second eye | Already closed: a smaller cell with a short stitched arc, asymmetrically placed, never matching the first eye. |
| Mouth | A red painted strip lands low in the loop (P02), and a cobalt strip crosses it diagonally (conceal/reveal, treatment scene 17). |
| Incision | Short parallel diagonal hatch groups scratched into the body skin near the face (P29): a light line with a dark offset line. They accumulate and never disappear. |
| Face perceptibility | The face exists only when these fragments coincide inside the body's loop. It is not a separate drawing. When strips migrate onward, the face decomposes back into parts, and the eye and mouth fragment remain as evidence. |

### 1.6 Wing as rib system (Principle 6, P17, P20, P28, P34, P35)

| Element | Technique |
|---|---|
| Ribs | 5–6 curves radiating from the eye's outer corner on one side (spread about 80°, lengths 280–640 px, slight finger-like curl), plus 2 short hesitant ribs on the opposite side. Growth is **procedural and stepped**, one rib after another. |
| Membrane | Polygon strips between consecutive ribs, filled only to a *ragged, lagging* edge (not to the rib tips). Pink multiply, pleat lines and vein lines. Grows after the ribs. |
| Cladding | Strips arrive and knot onto ribs (P11 logic, P34 repetition). |
| Joints | Ochre cells sit at rib bases (pearls as joints). |
| Light event | The light angle rotates in the last seconds. Shadows lengthen, and gold discs on the strips flash once (treatment scene 24). |

### 1.7 Painting survives by being cut (Principle 7, P09, P11)

- The painting atlas is **one image**. Every strip is a UV window into it, so the viewer's eye can link fragments back to one painting.
- Strip IDs are persistent. Identity (UV rectangle, width, knot, gold disc) never changes, only position and role.
- Pigment offset: a departing strip leaves a faint stain of its own texture in the memory buffer.

### 1.8 Every surface is broken (Principle 8)

| Break | Technique |
|---|---|
| Canvas tooth | A weave micro-texture multiplied into every painted texture and the ground. |
| Fray | Loose fiber polylines at strip ends and at cut edges. |
| Speckle | Seeded dots in cells and strip reverse sides. |
| Hatch | Incision groups; chrysalis-style directional hatching on the body is available as a later option (P16). |
| Grain / exposure flicker | A precomputed grain tile, offset per *held step* (so grain changes at 12 fps with the animation, like film/stop-motion), plus ±1.5% exposure flicker per step. |

### 1.9 Digital as archaeological (Principle 9, P04, P05)

The whole study uses a **small, coherent set of five digital mechanisms**, each tied to material logic:

| # | Mechanism | Material/meaning justification |
|---|---|---|
| 1 | **Path memory / frame persistence** on the ground | P13's scribble, and "earlier states remain present." |
| 2 | **Quantised routing** of the thread | The thread's *data-path* role, visible as an orthogonal stepped trace, remembered in the ground. |
| 3 | **Mesh deformation** of painted/textile textures | The painting stays attached to the body as it curls, so identity survives. |
| 4 | **Stepped interpolation** (12 fps held steps, slower 8 fps for the eyelid, holds) | Stop-motion grammar: repositioning, not morphing. |
| 5 | **Scan-band misregistration** at transformation peaks | A horizontal band that shows the *previous* step with R/B channel offset, like a flatbed scanner catching a moving specimen (P04/P05 archival scan). Used 2–3 times only, at the moments of reorganisation. |

Explicitly **not** used: particles, flow fields, bloom, glow, noise-displacement "liquid", pixel-sort, glitch datamosh, dithering *everywhere*.

### 1.10 Asymmetry and hesitation (Principle 10)

- All placements are seeded but hand-tuned. Nothing is mirrored by code except the two short opposite ribs, which are deliberately shorter, fewer and differently angled.
- Motion eases with **settle** (a small overshoot and return), as if placed by hand, and different elements move on different steps. Nothing moves in perfect unison.
- Composition is diagonal, from lower-left tail to upper-right wing, off-centre. The face sits left of centre.

---

## 2. Procedural vs. scanned: replacement plan

| Asset slot (in `src/film/materials.js`) | Now | Replace with (`assets/artwork/` → `public/artwork/`) |
|---|---|---|
| `painting` atlas | [PLACEHOLDER] seeded bristle-stroke painting | Flat, colour-true scans of 2–4 of Toni's paintings (P10, P12-type), ≥ 6000 px long edge |
| `bodyCloth` | [PLACEHOLDER] fiber-fleck coral/pink felt | Scans of dyed muslin/felt/linen in pink/coral, plus one grey |
| `ground` | [PLACEHOLDER] gesso + cobalt scribble | Scan of a gessoed board with scribble (P13-type) or raw canvas |
| `membrane` | [PROC] tint + atlas multiply | Backlit photo of sheer pink fabric |
| `gold` | [PROC] | Macro photo of hammered foil, used as a sprite |
| `thread` | [PROC] | Stays procedural. Optionally sample colour/width from a macro scan of the real thread. |

`scripts/prepare_assets.py` converts anything placed in `assets/artwork/` into runtime textures (resized, sRGB, optional alpha from a mask) in `public/artwork/`. The runtime loads a real file when present and falls back to the placeholder otherwise.

---

## 3. Risks, and how each would show up

| Risk | What it would look like | Guard |
|---|---|---|
| **Generic generative art** | Smooth noise-driven motion, everything wobbling continuously, perfect easing | Stepped cadence, holds, settle; noise used only for *shape irregularity*, not motion |
| **Glossy / CGI** | Specular highlights on the body, smooth shading, bloom | Only gold gets specularity, and only as brief flashes. The body's shading is baked into a matte texture. No bloom. |
| **Flat / vector** | Clean fills, uniform stroke widths, hard perfect edges | Every fill is a texture. Strokes vary in width. Edges are jittered and frayed. Shadows are blurred. |
| **Decorative / ornamental** | Symmetric radial wings, evenly spaced ribs, flower-like arrangements, border patterns (P36/P19 failure mode) | Uneven rib spacing and length, one-sided extension, membrane stops short |
| **"AI-made"** | Tidy, evenly distributed detail; plausible-but-meaningless ornament; soft dreamy glow; everything equally in focus; symmetrical specimens (P19) | Density contrast (a dense core and sparse periphery). Evidence of process (memory, stains, stepped traces). Hesitation. |
| **Neon / digital clichés** | Glowing thread, dark background with saturated light | Pale ground; the thread is dark matter; colour only in materials |
| **Beige craft minimalism** | Neutral palette, empty space, "tasteful" restraint | Saturated painting atlas is dominant; cobalt/red/ochre in every frame |
| **Cultural misuse** | Gold figure silhouettes, repoussé scroll motifs, "tribal" pattern bands | Gold reduced to *hammered disc with hole* and *flash*. No motifs are copied. Rib/wing relation learned from P28 structurally, and attribution flagged as unverified. |
| **Butterfly** | Two symmetric lobes, antennae, body in the middle | One-sided ribs, an eye at the root, and an end state that reads equally as ribcage/hand/fan |
| **Morphing** | Shapes cross-dissolving or points sliding into new silhouettes | Only rigid moves (translate/rotate/bend) of persistent objects, and curvature-driven coiling |
| **Too busy / mush** | Memory buffer turning to grey fog | Very low alpha, only the thread and sparse contour; checked in the key-frame review |

---

## 4. Visual hypothesis for the first study (10 seconds)

On a cool, worked gesso ground that keeps a record of everything that happens on it, a soft coral-and-plum cloth body lies diagonally, bound with knotted strips cut from one saturated painting and anchored by a netted cluster of ochre cells. A single dark thread enters from the frame edge as a route, runs through the body as a seam, and branches out of its head as roots. In stepped, hand-placed increments the body curls from its head into a loop, while the thread snaps into an orthogonal routed trace and relaxes again, a scanner-like band catches the movement out of register, and the ground keeps every path the thread has taken. Inside the loop, strips and cells arrive as a partial face: a cobalt-ringed ochre eye outlined by the thread, a red mouth fragment crossed by a cobalt strip, and a second eye already shut. The painted eyelid closes along the thread's seam, and that seam keeps going past the corner of the eye to become the first wire rib, followed by others on one side only. The same strips re-knot onto the ribs, the cells become joints, and a pink veined membrane stretches partway between them as the light turns and a hammered gold disc flashes once. The last frame should read at once as rib cage, fan, hand and the first wing, never as a butterfly, with every earlier material still visibly present in it or on the ground beneath it.
