# Visual Inventory — *We Only Get the Wings*

Source material: the 11 screen captures in `references/moodboard_raw/` and `references/moodboard_contact_sheet.jpg`, all inspected at full resolution. Some regions were enlarged 2–3× to read details: the bottom edge of `IMG_0857`, the top of `2C929C8D`, the find plate, and the stitched collages. I also ran a small palette extraction: k-means clustering, k=6, on each pin's bounding box. The hex values quoted below come from that extraction. They are approximate because the captures are compressed iPhone screenshots, which reads a little darker and less saturated than the originals.

How to read this document:

- **Visible** means what the pixels show.
- **Reading** means my interpretation.
- Pin positions follow the Pinterest two-column layout: **L** (left column) or **R** (right column), then **top / mid / bottom**. A **partial** pin is cut off by the screen edge or the Pinterest toolbar.

---

## 1. Reconciling the captures

### 1.1 Two capture sessions

The captures come from two sessions, and the board was re-flowed between them.

| Session | Files | Status-bar evidence | Order |
|---|---|---|---|
| **8:34–8:35** (newer pins, top of board at that time) | `2C929C8D…` → `BAC41C65…` → `1A660819…` → `574CDABA…` | Screen-recording countdown timer: 2:14 → 2:10 → 2:05 → 2:00 | Continuous scroll. Each capture repeats 2–3 pins from the one before. |
| **7:50** (earlier state of the board) | `IMG_0863` → `IMG_0862` → `IMG_0861` → `IMG_0860` → `IMG_0859` → `IMG_0858` → `IMG_0857` | `IMG_0863` shows the filter icon above the first pin row, so it is the top of the board. File numbers descend as the scroll goes down. | Continuous scroll. Each capture repeats 1–3 pins. |

The two sessions meet at three pins: the ochre cell cluster, the wire vessel and the chrysalis drawings. At 8:35 they appear at the bottom of `574CDABA`. At 7:50 they appear at the top of `IMG_0863`, in a different column arrangement. That confirms the Toni/textile pins were added above the older board between 7:50 and 8:34. **Column position is therefore not a stable identifier. I identified pins by content, not by slot.**

### 1.2 Pin ledger (P01–P39)

Every distinct pin gets one ID. The citations list every capture it appears in, so repeats are not counted twice.

| ID | Pin (short name) | Appearances (capture, position) |
|---|---|---|
| P01 | Stitched denim face on raw canvas | `2C929C8D` L-top (top cropped) |
| P02 | "Fragmented Animosity" — dark patchwork with embroidered sprigs and a painted mouth | `2C929C8D` R-top |
| P03 | Cut fabric masks laid on burlap | `2C929C8D` L-mid |
| P04 | Numbered archaeological find plate (Dutch captions, items 1–11) | `2C929C8D` R-mid |
| P05 | Photographs printed onto concrete/stone fragments | `2C929C8D` L-bottom (partial); `BAC41C65` L-top (partial) |
| P06 | Grid of thread-bound fabric bundles | `2C929C8D` R-bottom (partial); `BAC41C65` R-top (partial) |
| P07 | Vertical ladder of paper/denim/lace scraps, red cross-stitch, eye photo at top | `BAC41C65` L-mid |
| P08 | Layered sheer beige collage with red thread cascade | `BAC41C65` R-mid |
| P09 | **Mariantonia Gutierrez** — woven painted-strip hanging on a branch | `BAC41C65` L-bottom; `1A660819` L-top |
| P10 | **Mariantonia Gutierrez** — gestural painting, orange/red/pink/dark green (close crop, signature upper right) | `BAC41C65` R-bottom; `1A660819` R-top |
| P11 | **Mariantonia Gutierrez** — copper tubes bound with knotted painted-canvas scraps and orange yarn | `BAC41C65` R-bottom edge (partial); `1A660819` R-mid; `574CDABA` R-top |
| P12 | **Mariantonia Gutierrez** — painting, cobalt/red/acid green, outlined cell/leaf/eye shapes | `1A660819` L-mid; `574CDABA` L-top |
| P13 | **Mariantonia Gutierrez** — white ground, blue/teal scribble, torn and curled paper | `1A660819` R-bottom (partial); `574CDABA` R-mid |
| P14 | Ochre/orange cell cluster bound in white net (sculpture) | `1A660819` L-bottom (partial); `574CDABA` L-mid; `IMG_0863` L-top |
| P15 | Black wire vessel / trap form with two dark stone rings | `574CDABA` L-bottom (partial); `IMG_0863` R-top |
| P16 | Six hatched pen drawings of chrysalises | `574CDABA` R-bottom (partial); `IMG_0863` L-mid; `IMG_0862` L-top (partial) |
| P17 | "crisalida" — suspended pink translucent pleated membrane with dark veins | `IMG_0863` R-bottom (upper half); `IMG_0862` R-top (lower half + caption) |
| P18 | Voynich manuscript page: eye-like flower head, blue leaves, roots | `IMG_0863` L-bottom (partial); `IMG_0862` L-mid |
| P19 | "Voynich manuscript Midjourney style" — 4-panel AI pastiche | `IMG_0862` L-bottom |
| P20 | "Echinodermen, Fig. 287" — 19th-c. anatomical engraving | `IMG_0862` R-bottom |
| P21 | **Eleonora Pasti** — red/plum vascular tube installation in a room | `IMG_0862` L-bottom edge (partial); `IMG_0861` L-top |
| P22 | **Jackie Brown** (caption) — hanging polychrome assemblage with tendrils | `IMG_0862` R-bottom edge (partial); `IMG_0861` R-top |
| P23 | Fiber creature installation, dark room, wooden floor | `IMG_0861` L-mid; `IMG_0860` L-top (floor edge only) |
| P24 | Dense thread-wrapped rods with knotted tips, behind glass | `IMG_0861` R-bottom; `IMG_0860` R-top (tips only) |
| P25 | "Calima (Yotoco) artist — Earspool" — hammered gold | `IMG_0861` L-bottom (partial); `IMG_0860` L-top |
| P26 | "Pectoral Calima" — heart-shaped repoussé gold with a face | `IMG_0860` L-mid |
| P27 | Gold face ornament with horn-like extensions and side "wings" (caption "Centuries Past") | `IMG_0860` L-bottom; `IMG_0859` L-top (caption) |
| P28 | Flat gold anthropomorph with comb-toothed wing-arms and rib cut-outs (caption "Jacaranda Tribal Art Blog") | `IMG_0860` R-mid |
| P29 | Brown ceramic figure, incised chest, arms on hips, pierced headdress | `IMG_0860` R-bottom; `IMG_0859` R-top |
| P30 | Plate of dark bronze figurines with raised oversized hands ("Światowit t. XV", figs. 72–78) | `IMG_0860` L-bottom (partial); `IMG_0859` L-mid |
| P31 | Black weave with red plastic shreds and straw | `IMG_0859` R-mid; `IMG_0858` R-top (bottom edge only) |
| P32 | **Sagarika Sundaram** — yellow felt/fiber with a split red interior | `IMG_0859` L-bottom; `IMG_0858` L-top |
| P33 | **Olga de Amaral** — ochre over black weave, four red vertical lines ("Fabric of Impulse") | `IMG_0859` R-bottom (partial); `IMG_0858` R-mid |
| P34 | **Olga de Amaral** — pink/ochre/olive hanging woven strips | `IMG_0858` L-mid; `IMG_0857` L-top (caption) |
| P35 | Pink/rust sheer mesh cocoon on black wire armature | `IMG_0858` L-bottom (partial); `IMG_0857` L-mid |
| P36 | "creation myth" — appliqué quilt: black figure, red roots, green field, patterned border | `IMG_0858` R-bottom; `IMG_0857` R-top |
| P37 | Pink/grey stitched soft-sculpture creature with branching limbs | `IMG_0857` L-bottom |
| P38 | Blue soft-sculpture figures, joined heads, long dangling limbs | `IMG_0857` R-bottom |
| P39 | Plate of small figurines: red many-legged form, green-patina bronze figure, bone/ochre figure, painted fragment | `IMG_0857` R-bottom edge only (top ~15% visible below the toolbar) |

### 1.3 Count discrepancy

The captures contain **39 distinct pins**: 38 legible, plus P39, which is only a fragment. The brief says the board has **42**. I searched every capture edge for more, and none are visible. The most likely places for the missing three are:

- above P01/P02: the top of `2C929C8D` is cropped, and it is not provably the top of the 8:34 board;
- below P37–P39: `IMG_0857` is the last capture, and its toolbar hides the next row.

I have **not invented** content for them. If Toni can add one more capture from each end of the board, the ledger can be completed. Everything below cites only P01–P39.

---

## 2. Pin by pin

### Toni's own practice (P09–P13): the root authority inside the board

**P09 — woven painted strips** (`BAC41C65` L-bottom; `1A660819` L-top)

- *Visible:*
  - Cut strips of painted canvas woven into a loose, ragged lattice and hung from a crooked twig.
  - Colours: cobalt/navy, cadmium yellow, red, pale green, cream, with speckled paint on the reverse sides.
  - Horizontal strips poke out unevenly to both sides. A dark navy strip hangs longest at the bottom.
  - Photographed flat against white with a soft shadow.
- *Reading:* This is Toni's native move: a painting cut into strips, then re-woven into a body. A painting survives by becoming a textile. It is the clearest precedent for "metamorphosis without disappearance" on the board.

**P10 — gestural painting, warm** (`BAC41C65` R-bottom; `1A660819` R-top)

- *Visible:*
  - Broad loaded strokes of orange (`#d68146`), cadmium red (`#a34542`), pink, ochre-yellow (`#ddad6e`), and dark bottle green (`#42493f`), with cobalt and cream at the upper left.
  - Visible canvas tooth where paint is thin. Dark green contour lines wrap the warm masses.
  - Handwritten signature/text at upper right.
- *Reading:* The palette is not decorative. It is organ-coloured: flesh, blood, bile, leaf. The dark-green contour acts like a membrane or outline around each colour mass.

**P11 — copper tubes with knotted scraps** (`BAC41C65` R-edge; `1A660819` R-mid; `574CDABA` R-top)

- *Visible:*
  - Four vertical copper tubes (`#ba936f`, oxidised brown `#5d3422`), bound at top and bottom with rust-orange yarn wraps.
  - Dozens of small painted-canvas scraps are tied around them in overhand knots: teal, cobalt, orange, cream, speckled. Raw white canvas shows at the cut edges.
  - Hard cast shadows on a textured white wall.
- *Reading:* This is Toni's version of the cage and the rib. Rigid parallel rods (bone/pipe) are clothed by soft, frayed, knotted flags. It is the most direct model for "fragments migrate onto ribs."

**P12 — gestural painting, cool** (`1A660819` L-mid; `574CDABA` L-top)

- *Visible:*
  - Saturated cobalt/ultramarine, arterial red (`#96423d`), acid/leaf green (`#78975b`), teal (`#315761`), yellow, pink.
  - Several almond, leaf and cell shapes are outlined in cream/pale green and read as eyes or seeds (top left).
  - Heavy impasto. The canvas edge is visible, and the painting is signed "Mañé" (?) lower right.
- *Reading:* Almond shapes outlined with a pale contour are the board's first eyes, before any face appears. This is the source of the study's eye: it should grow out of a painted cell, not be drawn as an icon.

**P13 — torn paper on scribble** (`1A660819` R-bottom; `574CDABA` R-mid)

- *Visible:*
  - A white gesso ground covered in blue/teal/cobalt scribbled line (`#2c3c3b` strokes on `#bdbdb9` greys).
  - Torn and curled paper flakes cluster in the upper half, some with green and teal paint.
  - A blue-and-red blot at the lower right corner.
- *Reading:* An image of accumulated gesture: every pass of the hand is still recorded. This is the most exact precedent on the board for **path memory / frame persistence**. A screen that never clears is this painting.

### Stitched faces and fragment bodies (P01–P03, P07, P08)

**P01 — stitched denim face** (`2C929C8D` L-top)

- *Visible:*
  - Faded denim patches (light blue) on raw cotton canvas with frayed edges.
  - Black free-machine-stitched contour lines overrun the shapes.
  - Two buttons as eyes, one on a black felt patch. A small red French knot sits beside one button.
  - Loose red and black thread ends, black felt "hands" at the bottom.
- *Reading:* The face is assembled rather than drawn. The thread overshoots its forms like a drawing still searching. The eyes are objects (buttons) standing in for eyes.

**P02 — "Fragmented Animosity"** (`2C929C8D` R-top)

- *Visible:*
  - Patchwork of indigo, charcoal, slate and stained cream cloth (`#2f3136`–`#a19fa2`), each patch outlined in visible blanket stitch.
  - Two embroidered sprig/branch forms in white and ochre thread.
  - A single horizontal painted **mouth** in smoky red and black sits in a stained patch.
- *Reading:* Grey-blue restraint with a single organ-red event: the "living intrusion" logic of the treatment. The mouth is a fragment, not a face.

**P03 — fabric masks on burlap** (`2C929C8D` L-mid)

- *Visible:*
  - Several face-shaped cut-outs of stained muslin and one flesh-pink cloth, laid overlapping on coarse burlap (`#684929`).
  - Faces are drawn in black line with red lips and pink cheek.
  - One mask has a stitched dashed line across the cheek. Another is blank. Thread ends hang loose.
- *Reading:* Faces as laid-out specimens: multiplied, partial, some unfinished. Blankness sits beside expression.

**P07 — stitched vertical ladder** (`BAC41C65` L-mid)

- *Visible:*
  - A vertical stack of small rectangles on white: printed-text paper, a scrap reading "CHAPTER ONE", denim-blue fabric, and a crocheted lace edge at the bottom.
  - An eye photograph at the top.
  - Joined by red running stitch and cross-stitch, with long red and black thread tails radiating sideways.
- *Reading:* A spine or vertebral column made of text and cloth, with an eye at its crown and threads as nerves exiting the cord. Anatomy as manuscript.

**P08 — layered sheer collage** (`BAC41C65` R-mid)

- *Visible:*
  - Overlapping sheer and translucent beige fabrics with visible edge stitching, a solid oxblood-red square, a pink printed-text patch, and a small photograph.
  - A spiral-stitched rectangle.
  - A cascade of loose red thread falling from a stitched point at left centre.
- *Reading:* Translucency as layering. Earlier layers stay visible through later ones. The red thread spills like blood or root from a single puncture.

### Specimen, archive and stratum (P04, P05, P06, P30, P39)

**P04 — numbered find plate** (`2C929C8D` R-mid)

- *Visible:*
  - Eleven objects isolated on white, numbered in teal, with Dutch captions.
  - Legible items: an iron ship's nail, a small figure on horseback, film/rusted cylinder, granite ball, a hank of dark hair, a **1999 mobile phone**, leather sheet, torn **red woollen fragment**, a dark wood/metal piece, a round **radial woven/stitched disc**.
  - A spoon-like object with three holes reads as a **face** (two eyes, mouth).
- *Reading:* Likely from Amsterdam's *Below the Surface* archaeological catalogue (to be verified). The digital device is catalogued as a stratum next to hair and textile. This pin gives the film permission for **digital matter to be archaeological**, not futuristic chrome.

**P05 — photographs printed on concrete/stone** (`2C929C8D` L-bottom; `BAC41C65` L-top)

- *Visible:*
  - Rough grey stone/concrete fragments with black-and-white photographic images transferred onto flat faces.
  - Spanish caption list: "impresión digital sobre hormigón" (*digital print on concrete*).
- *Reading:* A digital image embedded in a mineral body. With P04 this sets the rule that **digital artefacts should sit inside matter**: printed, abraded, fragmentary.

**P06 — bound bundles grid** (`2C929C8D` R-bottom; `BAC41C65` R-top)

- *Visible:*
  - Small cushions of folded fabric (oxblood, ochre-yellow, cobalt/ultramarine, black) wrapped tightly with thread.
  - Arranged in a loose 3×n grid on white, each casting a crisp shadow.
- *Reading:* Cocoon, parcel, cell. Colour is compressed inside binding. A grid of specimens, but each one is irregular.

**P30 — bronze figurine plate** (`IMG_0860` L-bottom; `IMG_0859` L-mid)

- *Visible:*
  - A scanned, yellowed archaeological plate ("Światowit t. XV"). Seven dark cast figurines, numbered 72–78.
  - Several have huge splayed hands raised above the head. Bodies are thin and elongated with small heads.
- *Reading:* Oversized hands radiating above the body are a pre-wing gesture: limbs extending into fans. *(Not a Colombian source. Its role is formal: gesture, frontality, specimen numbering.)*

**P39 — figurine plate (fragment)** (`IMG_0857` R-bottom edge)

- *Visible:* Only the tops of four objects: a red form with many parallel legs, a green-patina bronze figure, a bone/ochre figure with incised bands, and a red/cream painted fragment with a diamond mark.
- *Reading:* Treat as unverified. It reinforces the specimen-plate grammar.

### Cells, cages and chrysalises (P14–P17, P35)

**P14 — ochre cell cluster** (`1A660819` L-bottom; `574CDABA` L-mid; `IMG_0863` L-top)

- *Visible:*
  - A standing sculpture of swollen spheres in ochre/orange/yellow (`#cb852b`, `#d9a257`, `#efc17b`), speckled like skin or rind.
  - A thick **white net** of irregular strands binds the spheres, and small ochre tendrils curl off the top.
  - Soft shadow on white.
- *Reading:* Cell division / roe / seed pod held by a net: soft matter restrained by a lattice. The pearls of the treatment, made biological and coloured.

**P15 — wire vessel** (`574CDABA` L-bottom; `IMG_0863` R-top)

- *Visible:*
  - A hand-bent black wire mesh in a flared-top, waisted, bulbous, conical-bottom form (like a fish trap or vase).
  - Two dark stone rings are threaded at the waist and the tip. The grid is irregular and hand-knotted.
  - Shadow on white.
- *Reading:* Body as cage and cage as vessel. The emptiness inside is structured. A wireframe that is *handmade*: the analog ancestor of mesh deformation.

**P16 — chrysalis drawings** (`574CDABA` R-bottom; `IMG_0863` L-mid; `IMG_0862` L-top)

- *Visible:*
  - Six pen-and-ink studies of pupae/chrysalises.
  - Each surface is mapped by directional hatching: chevrons, parallel bands, contour lines, with a cremaster stub at top.
  - Black on white, with varied line density.
- *Reading:* The only direct "metamorphosis" pin, and it shows the *casing*, never the butterfly. Hatching direction describes volume and is a candidate model for fiber-direction maps.

**P17 — "crisalida"** (`IMG_0863` R-bottom; `IMG_0862` R-top)

- *Visible:*
  - A suspended form of sheer **pink** pleated fabric (`#93686d`, highlights `#d0abbf`), veined with dark red/black lines like wire or thread.
  - Hangs by a thread against a cool grey ground (`#727671`).
  - Pleats run lengthwise, and the light passes through the fabric.
- *Reading:* Membrane, lung, wing-in-waiting. **The primary reference for the final moment of the study**: translucent tissue plus dark vein/rib lines.

**P35 — pink mesh cocoon on wire** (`IMG_0858` L-bottom; `IMG_0857` L-mid)

- *Visible:*
  - Sheer terracotta-pink mesh (`#68423c`–`#8c665f`) stretched over a black wire armature, forming lobed bulbous chambers.
  - A small cage-crown on top. The wire lines both press into and show through the mesh.
- *Reading:* Heart/lung/cocoon. Skin and skeleton are visible at once. The rib is legible *through* the membrane.

### Manuscript botany and anatomy (P18–P20)

**P18 — Voynich page** (`IMG_0863` L-bottom; `IMG_0862` L-mid)

- *Visible:*
  - An aged vellum page with brown script above.
  - A plant whose flower head is an **almond eye**: a blue-scalloped rim around a pale "iris" containing a small figure/face.
  - Two clusters of deep blue-green leaves with dotted edges. A tangle of brown **roots** at the base.
  - The book gutter and edge are visible.
- *Reading:* The single most compact statement of the film's botany: an eye that is also a flower, fed by roots. Colour is limited (blue-green, brown, vellum) and applied in flat washes.

**P19 — "Voynich manuscript Midjourney style"** (`IMG_0862` L-bottom)

- *Visible:* Four AI-generated pastiche pages: decorative symmetric flowers and trees in blue, teal, red and ochre on parchment, with clean even washes.
- *Reading:* **A cautionary reference.** Next to P18, it shows exactly what "AI aesthetic" means here:
  - symmetric specimens that are too tidy;
  - uniformly distributed decoration;
  - no gutter, stain, error or hand hesitation;
  - "Voynich-ness" reduced to palette.
  
  The film must be closer to P18 than P19.

**P20 — "Echinodermen, Fig. 287"** (`IMG_0862` R-bottom)

- *Visible:*
  - A 19th-c. German engraving of a dissected starfish/sea-star arm.
  - Rows of **ribbed tube-feet and ampullae** line a central channel with branching gonads.
  - Letter-labelled leader lines. Dense cross-hatching on cream paper (`#fdedb7`).
- *Reading:* Rib and vessel repetition: modular units along a spine. It is anatomical, but it reads as architecture and as textile (like a woven selvedge). *(The labels are useful to study but must not appear in-frame: no diagrams.)*

### Vascular and polychrome fiber bodies (P21–P24, P36–P38)

**P21 — Eleonora Pasti, vascular installation** (`IMG_0862` L-bottom; `IMG_0861` L-top)

- *Visible:*
  - Thick soft **red tubes** (`#9e484a`) branching like arteries from floor to ceiling in a domestic room with a radiator and window.
  - Plum/violet tubes run behind. Lace-like translucent pouches hang in the branches.
  - Mirror or glass fragments are strung in a net on the right wall.
  - Complex cast shadows.
- *Reading:* The body's interior at architectural scale. Branching (tree/nerve/artery) made soft and upholstered.

**P22 — Jackie Brown, hanging assemblage** (`IMG_0862` R-bottom; `IMG_0861` R-top)

- *Visible:*
  - A vertical cluster suspended from the ceiling: acid-green core, pink, cream and lilac knitted/crocheted lumps, yellow lace, orange beaded strands.
  - **Cobalt and turquoise tendrils** arc outward. A grey floor below.
- *Reading:* The board's clearest *suspended matter*. Density at the core loosens into line at the periphery. Hanging, not standing.

**P23 — fiber creature installation** (`IMG_0861` L-mid; `IMG_0860` L-top)

- *Visible:*
  - A dark theatrical room with a raking warm spotlight on a wooden floor.
  - Yarn-wrapped creatures on stilt legs: pink, orange, turquoise and red. One has hair-like hanging fiber.
  - An orange radial "sun" ring. Stalks topped with round pods.
- *Reading:* The only pin that is lit like a stage. It shows how saturated fiber reads against darkness with low, hard light. A risk too: it reads as a whimsical *creature* scene, and the film should borrow its lighting logic, not its characters.

**P24 — thread-wrapped rods behind glass** (`IMG_0861` R-bottom; `IMG_0860` R-top)

- *Visible:*
  - A dense bundle of rods tightly wrapped in red, orange, yellow, blue, green, pink and cream thread, with knotted or pom-pom tips.
  - Photographed through museum glass with reflections.
  - Tips hang like fringe.
- *Reading:* Colour as wound fiber: every colour is a *thread*, never a flat fill. Also note the glass reflection as a layer: a museum-vitrine distance.

**P36 — "creation myth" quilt** (`IMG_0858` R-bottom; `IMG_0857` R-top)

- *Visible:*
  - Appliqué textile. A black human figure, arms flung wide, stands on an olive/leaf-green field.
  - Dark red **roots** grow from its feet. Stylised red/yellow flowers and suns.
  - A pink fish/bird band at top, a zig-zag red/yellow border, eye motifs in the corners.
- *Reading:* The body as a root system, and the body opening its arms: the wing gesture made flat. *(Its border and flower motifs are the most "decorative" vocabulary on the board. Use the root/figure relation, not the ornament.)*

**P37 — pink soft creature** (`IMG_0857` L-bottom)

- *Visible:*
  - A stitched pink cloth body (`#c197a5`) with visible seams, standing on long legs that fade to grey.
  - Branching three-toed hands/feet, horn-like ear forms, and a coral head with a long beak.
- *Reading:* A seam-mapped soft body with ambiguous anatomy. The seam lines show construction, and tonal shift across the legs reads as dyed or aged cloth.

**P38 — blue soft figures** (`IMG_0857` R-bottom)

- *Visible:*
  - Four stuffed **cobalt/denim-blue** (`#4c6d8d`, `#3a506b`) cloth heads fused into one shoulder mass.
  - Many long dangling arms with small hands. Soft shadow on white.
- *Reading:* Multiplicity: one body with many selves (see treatment scene 13, "Multiplication"). Blue is here a body colour, not sky.

### Weave, fiber, fold (P31–P34)

**P31 — black weave with red plastic** (`IMG_0859` R-mid; `IMG_0858` R-top)

- *Visible:*
  - Charcoal/black tight weave (`#181517`).
  - Its central region is erupted with shredded glossy **red plastic** (`#9a1a19`) and interwoven dry straw/grass fibers, forming a torso-like, lung-like shape.
- *Reading:* A wound or organ breaking through cloth. The *only* glossy material on the board, and it is used as an event inside matte ground.

**P32 — Sagarika Sundaram** (`IMG_0859` L-bottom; `IMG_0858` L-top)

- *Visible:*
  - A thick felted block of saturated yellow (`#e5b612`, `#c59613`) crossed by white fiber lines that curve like contour lines or ribs.
  - The top splits open to reveal crimson/red interior layers (`#842c29`) and white fibrous tufts, like a split fruit or opened body.
- *Reading:* Metamorphosis as *opening*: the interior is a different colour but the same material. The contour ribs on the outside anticipate wing ribs.

**P33 — Olga de Amaral, red lines** (`IMG_0859` R-bottom; `IMG_0858` R-mid)

- *Visible:*
  - A rectangular weave: ochre/straw upper field (`#c6ad73`), black lower field (`#272324`).
  - Four red vertical warp lines run top to bottom through both fields without breaking.
- *Reading:* **A thread persisting through a change of state.** The field changes, the lines continue. This is the persistent thread, formally proven.

**P34 — Olga de Amaral, pink/ochre strips** (`IMG_0858` L-mid; `IMG_0857` L-top)

- *Visible:*
  - Long vertical woven strips of stacked short weft blocks in pink, ochre, olive and rust (`#bc853e`, `#c79789`, `#7b4e24`), overlapping in layers.
  - Frayed edges, with a horizontal band at the top from which they hang.
- *Reading:* Feathers, gills, scales, wing-coverts. Repeated hanging units that shift colour gradually along the length. A model for rib cladding.

### Gold, ceramic and ancestral face (P25–P29)

**P25 — earspool** (`IMG_0861` L-bottom; `IMG_0860` L-top)

- *Visible:*
  - Hammered gold sheet in a spool/trumpet form: two flared discs joined by a waist.
  - The disc face has repoussé scroll motifs, a pierced centre hole, and tiny perforations along the rim. Dull satin sheen on grey.
- *Reading:* The formal property is *hammered sheet with a hole*: light pooling on a slightly irregular disc. **Do not reproduce its motif.**

**P26 — Pectoral Calima** (`IMG_0860` L-mid)

- *Visible:*
  - A heart/bivalve-shaped gold sheet with a raised border of repoussé scrolls, on black.
  - A central **face**: nose ornament, two spiral/disc elements below, embedded in a larger surface.
- *Reading:* Face embedded inside a larger structure (the treatment's exact Calima note). Frontality, and conceal/reveal through ornament.

**P27 — gold face ornament, "Centuries Past"** (`IMG_0860` L-bottom; `IMG_0859` L-top)

- *Visible:*
  - Bright gold on black. A small face at the centre, flanked by lateral extensions with dotted rims and two tall curved horn/antenna forms rising.
  - Round discs sit at the sides of the face.
- *Reading:* The face as the *root of radiating extensions*. The head grows appendages. Culture and attribution are not given in the caption, so this needs research before any citation.

**P28 — winged gold anthropomorph, "Jacaranda Tribal Art Blog"** (`IMG_0860` R-mid)

- *Visible:*
  - Flat cast/cut gold figure on black. A small rectangular face with a radiating crown.
  - Arms extend as horizontal wings with **comb-teeth** along the lower edge. A body of stacked horizontal slots like **ribs**, ending in two outward spiral curls.
- *Reading:* Visually, the single strongest bridge between rib cage and wing: the torso *is* ribs, and the arms *are* wings. Form language resembles flat cast pendants often attributed to the Tolima region, **but the capture gives no attribution and the source is a blog: verify before referencing.** Learn only the *rib-slot/wing-comb relation*, never the silhouette.

**P29 — ceramic figure** (`IMG_0860` R-bottom; `IMG_0859` R-top)

- *Visible:*
  - Burnished brown clay (`#3b1e10`–`#806440`). A flat-topped head/headdress with two small pierced holes and a twisted-cord band.
  - Face with a strong nose. Chest covered in **incised diagonal hatch bands**. Arms loop to the hips, and there are short thick legs.
- *Reading:* Incision as writing on the body (treatment symbol grammar: incision → map/inheritance). Aligns with the Antioquian "incised surface" research lane, but provenance must be confirmed.

---

## 3. Cross-board analysis

### 3.1 Palette (measured and observed)

**Grounds.**
- About 60% of pins sit on **white or light-grey gallery walls or paper** (P05–P09, P11, P14–P16, P22, P24, P32–P38).
- Grey/vellum grounds: P17 grey, P18/P20 vellum and cream.
- Black is the ground **only for gold** (P26–P28) and the stage-lit P23.

So the board's colour is almost always *matter against a pale, shadowed ground*. It is not colour glowing out of darkness.

**Saturated families.** Colour appears concentrated in bodies, threads and fragments:

| Family | Sources | Measured hexes |
|---|---|---|
| **Cobalt / ultramarine / denim** | P12, P38, P09, P06, P22 tendrils, P01 | `#3456a7`, `#4c6d8d`, `#3a506b` |
| **Arterial / oxblood red** | P12, P21, P31, P33 lines, P08 square, P36, P02 mouth | `#96423d`, `#9e484a`, `#9a1a19`, `#8c2b24` |
| **Pink / coral / flesh** | P17, P35, P37, P34, P10 | `#93686d`, `#d0abbf`, `#c197a5`, `#c79789` |
| **Yellow / ochre / amber** | P32, P14, P33, P34, P10 | `#e5b612`, `#c59613`, `#cb852b`, `#efc17b`, `#bc853e` |
| **Green** | P12 acid/leaf, P22 acid, P36 olive, P10 bottle, P18 blue-green | `#78975b`, `#848040`, `#42493f` |
| **Plum / rust / orange** | P21 plum tubes, P11 rust yarn & copper, P10 orange, P23 | `#5d3422`, `#d68146`, `#8b442b` |
| **Gold** | P25–P28 | `#e0b265`, `#c39552`, `#9e7239` |

**Structure colours:** bone/cream (P03, P07, P08, P18), charcoal/black (P31, P33, P02, P15 wire), grey-blue (P02, P17 ground), clay brown (P29, P03 burlap).

**Relationship (interpretation).** Saturation is *earned by material*: wound thread (P24), felt (P32), paint (P10/P12), plastic (P31), dyed cloth (P38). The pure colours are always slightly broken: speckled (P14), tooth-showing (P10), weft-stepped (P34), or veined (P17). Mixed-colour areas are usually **adjacent** (patchwork, weave, strips), not blended gradients. Gradients occur only *along* a strip (P34) or across a stained cloth (P37 legs).

### 3.2 Form

- **Elongated soft bodies / tubes:** P21, P37, P38, P22 tendrils, P24.
- **Branching** (root, artery, nerve): P21, P36 roots, P18 roots, P08 red cascade, P07 thread tails, P20 channels.
- **Cells / spheres / nodes:** P14, P06 bundles, P04 granite ball, P22 lumps, P23 pods, P01 buttons.
- **Cages / armatures / lattices:** P15, P35, P14 net, P11 rods, P09 woven lattice.
- **Membranes:** P17, P35, P08 sheer layers.
- **Ribs / repeated transverse units:** P28 slots and comb, P20 tube-feet, P32 fiber contours, P34 weft blocks, P16 hatching bands, P33 warp lines.
- **Faces:** P01, P02 (mouth), P03, P04 (spoon-face), P07 (eye photo), P18 (eye-flower), P26, P27, P28, P29.

On this board a face is **always partial or embedded**: button eyes, a solitary mouth, an eye in a flower, a face at the centre of gold sheet.

- **Wing-adjacent forms** (never a butterfly): P28 arms, P27 lateral extensions, P30 raised hands, P36 flung arms, P17 membrane, P16 casings.

### 3.3 Texture and material

- Frayed cut edges (P01, P07, P09, P11, P34).
- Visible stitch: blanket (P02), running and cross (P07), free-machine (P01), spiral (P08).
- Knots (P11, P24).
- Felt and wool (P32, P24).
- Impasto with canvas tooth (P10, P12).
- Hatching (P16, P20, P29 incision).
- Speckle (P14, P09 reverse).
- Hammered/repoussé sheet (P25–P27).
- Burnished clay (P29).
- Sheer pleated fabric (P17, P35).
- Wire (P15, P35).
- Printed image on stone (P05).

**No surface on the board is smooth and untextured except the gold, and even the gold is dented.**

### 3.4 Composition

- Objects are **isolated and centred on neutral grounds** with space around them: the specimen/catalogue convention of P04, P06, P14, P15, P30.
- Or they **fill the frame edge to edge**: P10, P12, P13, P31, P33.
- Room-scale installations (P21, P23) are the exception, and add architectural context.
- Verticality dominates: hanging strips (P09, P34), suspended forms (P17, P22, P15), standing bodies (P37, P38).

Asymmetry is the rule even in frontal objects (P01, P03, P09, P22). Near-bilateral symmetry appears **only in the gold** (P26–P28) and in the AI pastiche (P19). That is a telling pairing: symmetry is either ancestral ceremonial or machine-generic. The film should reach toward bilateral suggestion without arriving.

### 3.5 Spatial depth

- Mostly **shallow relief**: objects a few centimetres off a wall, depth read through cast shadow (P09, P11, P14, P15, P32, P38) and layering (P08, P02, P09 weave-over-under).
- Real perspective depth appears only in P21 and P23.
- Translucency (P17, P35, P08) produces depth *inside* a plane.

**Reading:** the film should be 2.5D. Depth comes from overlap, shadow offset and translucency, not camera perspective.

### 3.6 Light

- Soft diffuse gallery light with short soft shadows down and to the right: P11, P14, P15, P32, P38.
- Transmitted light through membrane: P17, P35.
- A raking warm spotlight on a dark stage: P23.
- Black-ground museum lighting that makes gold glow: P26–P28.
- Direct scanner/flat light with no shadow: P04, P05, P16, P18, P20, P30. These are archival reproductions, flat and even.

**Two light regimes coexist:** *object in space* (shadowed) and *scan/document* (flat). The study can use both, and switching between them is itself a digital/archival event.

### 3.7 Scale

- Hand scale: P01, P03, P06, P07, P14, P25–P29.
- Body scale: P11, P32–P34, P37, P38.
- Room scale: P21, P23.
- Microscopic/diagrammatic: P20, P16, P18.

Scale is unstable across the board. A cell cluster (P14) and a room of arteries (P21) share a language. This matches the treatment's "scale becomes uncertain."

### 3.8 Bodily cues

- Eye (P01, P07, P12, P18).
- Mouth (P02, P03).
- Hands/fingers (P01, P30, P37, P38).
- Arteries (P21).
- Heart/lung lobes (P35, P31).
- Split body cavity (P32).
- Spine (P07, P20).
- Skin seams (P37).
- Hair (P04 item 6, P23).

**None of the bodies is whole and healthy-normative.** Bodies are multiplied (P38), assembled (P01, P03), opened (P32), exteriorised (P21), or held in cages (P15, P35). The board treats altered bodies with curiosity and material care, never pathos. That is consistent with the treatment's refusal of disability clichés.

### 3.9 Recurring relationships (the board's grammar)

1. **Soft within rigid / rigid within soft:** P11 (scraps on rods), P14 (cells in net), P35 (mesh on wire), P15 (stones in wire).
2. **Line persisting through a change of field:** P33 (red warp through ochre→black), P07 (red stitch through paper→denim→lace), P08 (red cascade across layers).
3. **Face embedded in a larger, non-face structure:** P18, P26, P27, P28, P04 (spoon).
4. **Painting becomes textile becomes body:** P09, P11 (Toni), P10/P12 → P09 as cut-and-rewoven.
5. **Branching from a single point:** P08, P21, P36, P18.
6. **Repetition of units along a spine:** P20, P28, P34, P07, P16.
7. **Colour concentrated as an event in a restrained field:** P02 (mouth), P31 (red erupting through black), P08 (red square), P33.
8. **Archive/specimen presentation of strange matter:** P04, P06, P16, P30, P20.

### 3.10 Cultural and art-historical signals

- **Colombian fiber lineage:** Olga de Amaral (P33, P34; Colombian, b. 1932, per the caption on `IMG_0858`/`IMG_0857`). Her grammar is weft blocks, suspended planes and continuous warp. This is the most legitimate "Colombian" inheritance on the board, because it is structural and Toni's own weaving (P09) already sits in this lineage.
- **Pre-Hispanic Colombian gold:** Calima/Yotoco earspool and pectoral (P25, P26, captioned). P27 and P28 are **unverified attribution**. Useful properties: hammered sheet, repoussé relief, perforation, frontal face embedded in a larger surface, lateral extension. Per the treatment and CLAUDE.md: translate structure only, with no motifs.
- **Ceramic incision** (P29): diagonal incised bands on a body. Useful for the Antioquia *incised surface* research lane. Provenance not visible in the capture.
- **Voynich manuscript** (P18, Beinecke MS 408): impossible botany. P19 is explicitly an AI imitation and marks the boundary.
- **Scientific engraving** (P20, a German zoological textbook) and **archaeological plates** (P30, Polish journal *Światowit*; P04 Dutch find catalogue): the documentary gaze and the numbered specimen.
- **Contemporary soft sculpture / fiber art:** Eleonora Pasti (P21), Jackie Brown (P22, caption), Sagarika Sundaram (P32), and uncaptioned makers (P17, P23, P35, P37, P38). These pins place the work in the lineage of post-2000s biomorphic fiber art (Louise Bourgeois, Eva Hesse, Sheila Hicks) *(interpretation, not on the board)*.
- **Contemporary textile collage** (P01–P03, P07, P08): slow-stitch, mixed-media, fragmented-portrait practice.

### 3.11 What the board does not contain (useful negatives)

- No screens, UI, neon, glowing particles, lens flares or chrome.
- No purple/cyan "digital" gradients.
- No clean vectors.
- No literal butterfly (the chrysalis is shown only as a casing: P16, P17).
- No smooth CGI surfaces.
- No text used as graphic design except found text (P07, P18, P20).

The only digital traces on the board are **P04's 1999 phone, P05's digital prints on concrete, and P19's AI pastiche**. The first two are digital *embedded in matter*. The last is the one to avoid.

---

## 4. Ten non-negotiable visual principles

1. **Colour lives in matter.** Every saturated colour (cobalt, arterial red, pink, ochre, acid green, plum, gold) must belong to a specific material: a painted strip, a wound thread, felt, a membrane, a cell. No free-floating light-colour, gradients or glows. (P10, P12, P24, P32)
2. **The ground is pale and shadowed, and it keeps a record.** The organism sits in shallow relief on a light, worked ground (gesso, canvas, grey wall) and casts soft real shadows. The ground accumulates evidence the way P13's scribbled gesso does. Darkness is reserved for brief light events, as in P23/P26–P28.
3. **One thread persists through every change of field.** Like P33's red warp and P07's stitch, the thread passes unbroken through body, face and wing, changing role but never identity.
4. **Soft is held by rigid, and rigid is clothed by soft.** Cells in nets, scraps knotted on rods, membrane on wire (P14, P11, P35, P15). Every structure shows both.
5. **The face is embedded and partial.** Eyes appear before faces, as cells or seams (P12, P18). Mouths appear alone (P02). The face sits inside a larger structure (P26, P27) and never resolves into a portrait.
6. **The wing is a rib system first.** Repetition along a spine (P20, P28, P34), membrane stretched between (P17, P35), extension from the body's centre (P27, P30). Never a butterfly silhouette, and never perfectly bilateral.
7. **Painting survives by being cut and re-used.** Painted surfaces appear as *fragments with frayed edges* that are woven, knotted and wrapped (Toni's P09, P11). Their colour identity follows them into each new function.
8. **Every surface is broken.** Tooth, weft steps, speckle, hatch, dent, fray, seam. There are no smooth fills anywhere (P10, P14, P16, P25, P34).
9. **Digitalness is archaeological, not futuristic.** Digital traces appear like P04's phone and P05's printed concrete: embedded, recorded, stratified, scanned. They are marks of process and memory, never a glossy surface.
10. **Asymmetry and hesitation over resolution.** Tend toward symmetry, frontality and order, then stop short (P01, P09, P22). Tidy, evenly distributed, symmetric specimens are the failure mode of this board (P19).
