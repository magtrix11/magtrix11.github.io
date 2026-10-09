# Study 01: Review against the mood board

## Revision 3 (Toni: make the eye closing more visible)

- **Longer study.** The study is now 11 s. Two clocks run: real time and story time. The story slows around the eye: the eye is held open for about 1 s, the lid closes over 1.5 s (at 8 fps), and it stays shut for 0.5 s before the rib begins (`timeline.js`, `warp`).
- **Camera.** The camera moves in on the eye (about 1.95×) while it is open and closing, then draws back as the rib grows. The ground and its memory are kept in world space so they stay put under the moving camera.
- **The eye itself:**
  - The eyelid is now the most pink/coral painted fragment, instead of the palest one.
  - The iris cell is pierced with a dark pupil and a small wet highlight, so the open eye looks back.
  - The lid's edge is a dark stitched seam with a crease shadow. Lash stitches appear across it as it comes down and remain once it is shut.

## Revision 2 (after Toni's feedback: "too cartoony")

**What changed:**

- **Real paint.** The paint is now Toni's own paintings (P10, P12), taken from the board screenshots as an interim stand-in for scans. The generated "painting" is gone.
- **Body.** The body is made of the painting ("pigment becomes skin"): painted canvas pieces re-sewn end to end, raw canvas showing in places, and wound yarn at the pinches. It is no longer a smooth pink tube.
- **Relief and light.** A pass reads surface relief from the image and lights it from the raking light. This replaces the painted-on highlight that made the body look plastic.
- **Edges.** Outline strokes were removed or softened.
- **Camera and photography.** The camera is about 1.2× closer, so the body is cropped by the frame. A lens falloff and heavier grain were added.
- **Cells and membrane.** The cells and membrane take their colour from passages of the same painting. The cells' white netting is quieter.
- **Ground.** The fake brush blot in the corner was removed.

**What still reads as made-by-computer:** the knotted strips on the ribs (still tag-like), the wire ribs' even curves, the cell cluster, and the procedural ground. The interim paint is low resolution (screenshot crops magnified about 3×). Real scans are still the biggest remaining step.

---

## Revision 1 review (original)

**Reviewed material:** `output/study01/contact_sheet.jpg`, the 9 key frames in `output/study01/keyframes/`, the movie `output/study01/study01_1080.mp4`, and all 240 frames. Pin IDs (P01–P39) and their capture filenames follow the ledger in `VISUAL_INVENTORY.md`.

**Summary.** The study proves the *continuity logic*: one thread, persistent strips and cells, a ground that remembers, and a face that is carried into the rib/membrane structure. It proves the *palette* partly. It does not yet prove the *material truth* of the board. Too much of the surface still reads as well-made digital illustration rather than photographed matter. The main cause is that the textures are procedural placeholders. Several specific failures below would remain even with scans, and they need decisions before any expansion.

---

## 1. What the study does

| Time | What happens | Frame |
|---|---|---|
| 0–2.4 s | A patchwork cloth body lies diagonally, with a netted ochre cell cluster at its tail. The thread enters from the lower-left edge (route), runs along the body as an uneven running stitch (seam), and exits the head as a branching root. | f000 |
| 2.5–3.1 s | The route snaps segment by segment to an orthogonal stepped trace (data path), in flickering held steps. | f066 |
| 3.3–4.9 s | The route is pulled taut, vibrates, then slackens into a new path with a loop. It does not snap. A scanner band sweeps down, lagging one step and out of register. The tail settles, and the front of the body rolls up from its tip. The ground keeps faint cobalt records of every position. | f084, f108 |
| 3.0 s | The rootlets detach and stay on the ground as loose fibres. | — |
| 4.4–6.7 s | An ochre cell travels into the loop and becomes the iris. The palest painted strip becomes the eyelid. A cobalt strip bends into a ring around the iris. The thread re-lays itself as the lower lid. The red "mouth" strip arrives, with a cobalt strip laid partly across it. A second, already-shut eye is stitched in red. Incisions accumulate on the body. The lid closes at 8 fps and lash stitches appear along the seam. | f150, f165 |
| 6.8–9.7 s | The lid seam grows past the eye's outer corner and becomes rib 0. Five wire ribs and two short opposite ribs grow in stepped pieces. Strips lift off the body, leaving pigment stains, and are knotted onto the ribs. Cells become joints. A pleated pink membrane grows partway between the ribs. The light swings, shadows lengthen, and one hammered-gold disc flashes around 8.9 s. | f190, f214 |
| 9.3–10 s | The ribs tremble at their tips. | f239 |

**The nothing-disappears rule was checked in code.** No object is created or removed after frame 0. Every strip, cell and rootlet is present in the final frame, either in place, on the ribs, or as a stain in the memory buffer.

## 2. Against the board: what is faithful

- **P11** (Toni's copper tubes with knotted scraps, `1A660819` R-mid) and **P09** (woven strips, `BAC41C65` L-bottom). Painted strips cut from *one* painting wrap the body and are later knotted onto rigid ribs. This is the closest the study comes to Toni's own logic, and it carries the continuity argument.
- **P33** (Olga de Amaral, red lines, `IMG_0858` R-mid). The thread passes unbroken through the change of state: route, seam, lid, rib. In f190–f239 the rib-0 thread visibly *is* the eyelid seam.
- **P13** (Toni's scribbled gesso, `574CDABA` R-mid). The memory buffer is the most successful digital mechanism. The larva's outline, the root's path and the stepped route remain as fine cobalt drawing on the ground. It reads as record, not effect (f108 onward).
- **P02 / P01 / P32 / P37** (patchwork, denim, felt, seams; `2C929C8D`, `IMG_0859`, `IMG_0857`). The body's patchwork gives some material specificity: denim twill, ochre felt with white fibre lines, oxblood wool, muslin with drawn marks, blanket-stitched seams, and wound-yarn bands that pinch the silhouette (P24, `IMG_0861` R-bottom).
- **P17 / P35** (crisalida, pink mesh on wire; `IMG_0862` R-top, `IMG_0857` L-mid). The final membrane is pink and sheer with dark veins, stretched on dark wire, and stops short of the rib tips. It reads as wing / fan / sail / ribcage, and **not as a butterfly**.
- **P12 / P18** (Toni's outlined almond cells, Voynich eye-flower; `1A660819` L-mid, `IMG_0862` L-mid). The eye is assembled from a cell, a bent painted strip and the thread, rather than drawn as an eye icon.
- **P25–P27** (gold). Reduced to one small hammered disc with a hole that flashes once and falls dark. No motif is copied.
- **Palette.** Cobalt, oxblood, pink/coral, ochre/yellow and green all sit *in* materials, on a cool pale ground with cast shadows. This matches the board's dominant presentation (matter on pale walls). No neon, no glow, no gradients without a material source.

## 3. What still feels generic, wrong or unfaithful

Ranked by how much each damages the language.

1. **The body reads as a smooth inflated tube, and in the coiled state as a pool float or torus** (f165–f239). The baked cylindrical shading is the main offender: it is the same across the whole length, with a clean highlight band. None of the board's soft bodies look like this. P37, P38 and P21 (`IMG_0857`, `IMG_0861`) all have lumpy stuffing, sagging seams, creases and uneven stuffing pressure. *Fix:* shading that varies per patch, crease lines at the pinches, flattened contact with the ground, and ultimately a scanned cloth texture with its own real light.
2. **The painted strips are too uniform in format.** They are all short rectangles with similar proportions. Knotted onto ribs, they still read somewhat as **tags or prayer flags** (f214, f239) rather than P11's dense, crumpled, overlapping knots. They are also too evenly spaced along each rib.
3. **The face is mostly an eye.** The closed eye reads clearly, but the mouth fragment and second eye are small and sit among strips at the loop's lower-right. A viewer will not reliably perceive a *face*, only an eye in a coil. That is defensible ("eyes appear before the full face"), but it under-delivers "a fragmented face becomes briefly perceptible."
4. **The coil is still a clean geometric spiral.** An earlier version read as the numeral "9". That is fixed by the low, horizontal tail, but the loop itself is too circular and too evenly thick to be a body.
5. **The ochre cell cluster and its white net read as a cartoon berry bunch or spider web** (f000–f108). P14 (`IMG_0863` L-top) has thick, irregular, partly melted netting with clusters of very different sizes. The broken net stubs left after cells depart read as little white sticks.
6. **The bottom-right ground blot reads as digital brush smears**, a "brush tool" look. It should be removed or replaced by a scan of P13's actual corner.
7. **The scanner band is too subtle** at 1080p (f084). It is visible in motion but barely registers in stills. The stepped route (f066) is legible but small, in the lower-left corner.
8. **The gold flash is tiny** (a 9.5 px disc). It is correct in principle (a brief wink, not a glow), but easy to miss.
9. **Motion.** The roll-up (3.4–4.9 s) is a large, fast gesture: the head travels about 900 px in roughly 1.5 s. Even on twos, this is closer to a smooth animation curve than to stop-motion repositioning. The settle overshoot is too uniform: every element "arrives" the same way.
10. **Missing from the board's vocabulary:**
    - vessels (P15);
    - archaeological incision at a legible scale (P29): the incisions exist but are small;
    - manuscript botany beyond the root;
    - suspended matter hanging (P17, P22): everything lies flat on the ground in this study.
    
    The top-down "table" view makes suspension impossible. A later study may need a frontal/hanging camera mode (treatment §6, "Presence").
11. **An "AI-made" risk remains** in the evenness of detail. Every strip has the same density of fray fibres, every fringe tuft is similar, and the density contrast between core and periphery is weaker than on the board (compare the dense core and loose tendrils of P22, `IMG_0861` R-top).

## 4. Technical notes

- **Deterministic.** Seed 1127. Frames re-rendered in isolation match the sequential run pixel for pixel (checked on frames 100 and 239).
- **4K path.** Verified. Textures are composed in a fixed design space, so the 3840×2160 render has the same composition and the same strip roles as 1080p. Mean difference after downscaling is about 5/255, from grain only.
- **Frame clean.** No controls or UI are inside the frame.
- **Placeholders.** All textures are `PLACEHOLDER` (`render.json` → `scans: false` for every slot). Replacing them is a file drop plus `prepare_assets.py` (see `README_RUN.md` §6).
- **Mood-board count.** 39 of the stated 42 pins were visible in the captures (`VISUAL_INVENTORY.md` §1.3). The study was built from those 39.

## 5. Questions for Toni before expanding

1. Does the **pale cool gesso ground** feel right, or should the organism sit in darker space (as in P23/P26–P28)?
2. Is the **top-down "table" camera** right for this organism, or should the next study test a frontal / suspended view (P17, P22)?
3. Is the **patchwork body** the right direction, or should the body itself be made of the painting (Toni's strips woven into a tube, P09), so the body and the strips are one material?
4. Which digital mechanism should lead? The **memory buffer** is the strongest here. The scanner band and stepped route may be too timid, or unnecessary.
5. Can we get **scans** of one or two paintings, a piece of dyed cloth, and a gesso ground? These would change the material read more than any further procedural work.
