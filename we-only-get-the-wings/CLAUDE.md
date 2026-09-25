# Permanent Project Instructions for Claude Code

You are helping create **We Only Get the Wings**, an experimental moving-image work. This is not a website, interface, dashboard, infographic, title sequence, screensaver, or generic generative-art demonstration. Treat the canvas as a film frame.

## Authority and required reading

Before proposing or writing visual code, read all of the following:

1. `TREATMENT.md` in full.
2. `PROJECT_CONTEXT.md`.
3. `VISUAL_RULES.md`.
4. `TECHNICAL_BRIEF.md`.
5. Every screen capture in `references/moodboard_raw/`, analyzing every one of the 42 individual pin references visible across those captures—not merely treating each screenshot as one image.
6. `references/moodboard_contact_sheet.jpg`.

The treatment is the authority for concept and narrative. The 42 mood-board pins are the authority for visual language. The board is archived as 11 overlapping screen captures, so identify duplicates and partial repeats while ensuring every distinct pin is considered. Do not invent a visual system before looking carefully at both.

Do not depend on being able to crawl Pinterest. `references/PINTEREST_BOARD.md` contains the board URL for optional human verification, but the local captures are the required source.

## Non-negotiable thesis

The work is **metamorphosis without disappearance**. Earlier states remain materially present inside later states. Nothing should simply dissolve and be replaced by a new symbol. Transformation must retain evidence: thread, seams, pigment, knots, fragments, scars, paths, ribs, membranes, faces, or repeated curves.

The target is **a digital organism with textile memory**.

## Required workflow

Do not begin animation code immediately.

1. Inspect the full treatment and every reference image.
2. Create `VISUAL_INVENTORY.md`: a precise inventory of recurring color, form, texture, material, spatial composition, light, scale, bodily cues, and cultural/art-historical signals visible in the supplied board. Cite image filenames throughout.
3. Create `TECHNIQUE_MAP.md`: map each important visual property to a concrete p5.js, Canvas, WebGL/GLSL, JavaScript, or Python technique. Explain which properties need source scans versus procedural construction.
4. State a single visual hypothesis for the first study in 5–8 sentences.
5. Only after those files exist, scaffold and build one 8–12 second fullscreen motion study.
6. Render representative frames, make a contact sheet, and compare the result against the supplied mood board in `STUDY_REVIEW.md`.
7. Stop and request visual review before expanding into more scenes or the full film.

## First motion study

Create one continuous transformation, not a montage and not a storyboard. Begin with a materially rich, irregular textile/pigment organism. A persistent thread behaves at once like nerve, root, route, seam, and data path. The body reorganizes without disappearing. A fragmented face or closed eye becomes briefly perceptible, then is carried into the structure. End at the first suggestion of rib, membrane, or wing—ambiguous and bodily, never a literal butterfly.

The visual field should inherit the board's saturated, complex palette and its mixture of paintings, fiber, soft sculpture, vessels, masks, botanical/anatomical systems, suspended matter, gold objects, wire enclosures, and archaeological surfaces. Digital behavior should be visible through deliberately chosen mechanisms such as generative paths, mesh deformation, vertex displacement, stepped interpolation, frame persistence, buffer trails, scan artifacts, chromatic separation, dithering, procedural growth, or structured noise. Each digital mechanism must support the organism's material logic.

## Avoid completely

- Flat polygonal abstractions or geometric storyboard icons.
- Default particle systems, flow fields, Perlin-noise blobs, or neon generative-art clichés used without transformation.
- Sterile interfaces, grids, cards, labels, diagrams, visible controls, or explanatory UI inside the film frame.
- Literal butterflies, wings pasted onto a body, caterpillar-to-butterfly illustration, or clean before/after morphs.
- Inspirational disability clichés, cure narratives, transcendence narratives, or suffering-as-beauty shorthand.
- Fake Indigenous, “tribal,” shamanic, or generic mystical motifs.
- Copying specific pre-Hispanic objects as decoration. Cultural references must operate through material logic, conceal/reveal, layering, movement, scale, and carefully documented research.
- Broad beige minimalism, cottagecore craft styling, tasteful neutral palettes, or desaturated museum-display emptiness.
- Glossy CGI perfection, plastic surfaces, stock 3D, fantasy concept art, or a recognizable “AI aesthetic.”
- Treating the mood board as a bag of isolated motifs. Its relationships, density, asymmetry, color, and material intelligence matter more than quotation.

## Implementation principles

- p5.js, JavaScript, Canvas 2D, WebGL, GLSL shaders, and Python are all available. Use the smallest combination that creates the visual result.
- Favor reproducible systems and deterministic random seeds.
- Preserve high resolution and an export path from the beginning.
- Keep development controls hidden or outside the capture canvas. The captured image must look like a film, not a creative-coding tool.
- Build custom visual logic from the provided sources. Do not settle for library defaults.
- Use actual original artwork scans from `assets/artwork/` when they become available. Until then, procedural placeholders must be clearly marked and easy to replace.
- Never use the rejected earlier storyboard or attempt to recreate it. It is not an authority for this project.

## Scope guard

Do not attempt the complete 3:30–5:00 film in the first pass. The goal is one visually convincing study that proves the language. Quality and specificity matter more than scene count.
