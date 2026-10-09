// Composes one held step of the study: ground -> memory (temporal anatomy)
// -> shadows -> organism -> relief light -> scanner band -> grain.
// Owns the stateful memory buffer.

import { buildMaterials, meanColor, makeInteriors } from './materials.js';
import { createOrganism } from './organism.js';
import { createThread } from './thread-system.js';
import { K, FRAMES, FPS, stepTime, stepIndex, win, stressAt } from './timeline.js';
import { hash } from './rng.js';
import { polyline } from './draw.js';
import {
  lightAt, drawStrip, drawGold, drawIncisions, drawRoute, drawSeam, drawRootlets,
  drawCell, drawNet, silhouette, stripGeometry, setSurfaceTextures, strokeThread,
} from './render.js';
import {
  drawBodyChunk, drawCreases, drawExposedSeams, drawHoles, drawCavity, cavityShape,
  drawRib, ribPolyline, drawMembrane3, setMembraneTexture,
} from './render3.js';
import { compositeShadows, scanBand, grainAndFlicker, reliefAndLight } from './post-process.js';

export async function createFilm(p, { W, H, seed }) {
  const k = W / 1920;
  // Locked overhead camera, closer than the full organism: the body is
  // cropped by the frame at its extremes, like a macro photograph of a table.
  const Z = 1.42, CX = 900, CY = 640;
  const VIEW = [k * Z, 0, 0, k * Z, k * CX * (1 - Z), k * CY * (1 - Z)];
  const PX = k * Z; // design units -> screen pixels (for shadowBlur etc.)
  const mats = await buildMaterials(seed, W, H, k);
  const org = createOrganism(seed, { pinches: mats.bodyCloth.pinches || [] });
  const pw = mats.painting.width, ph = mats.painting.height;
  const meanOf = (uv) => meanColor(mats.painting, uv.x * pw, uv.y * ph, uv.w * pw, Math.max(2, uv.h * ph));
  const roles = org.assignRoles(meanOf);
  const means = org.strips.map((s) => meanOf(s.uv));
  const thread = createThread(seed, org);
  const interiors = makeInteriors(seed);
  // windows of the painting closest to a target colour (for cells, membrane)
  const findWindow = (target) => {
    let best = null;
    const ww = pw / 12, wh = ph / 6;
    for (let gx = 0; gx < 11; gx++) for (let gy = 0; gy < 5; gy++) {
      const m = meanColor(mats.painting, gx * ww, gy * wh, ww * 2, wh * 2);
      const d = Math.hypot(m[0] - target[0], m[1] - target[1], m[2] - target[2]);
      if (!best || d < best.d) best = { d, img: mats.painting, x: gx * ww, y: gy * wh, w: ww * 2, h: wh * 2 };
    }
    return best;
  };
  const memTex = findWindow([228, 130, 150]);
  setSurfaceTextures(findWindow([222, 160, 70]), memTex);
  setMembraneTexture(memTex);
  const cw = mats.bodyCloth.width, chh = mats.bodyCloth.height;
  const clothMeans = Array.from({ length: 48 }, (_, i) => meanColor(mats.bodyCloth, (i / 48) * cw, chh * 0.3, cw / 48, chh * 0.4));

  const buf = () => { const g = p.createGraphics(W, H); g.pixelDensity(1); g.elt.style.display = 'none'; return g.elt; };
  const memory = buf(), shadowLow = buf(), shadowLift = buf(), prev = buf(), tmp = buf(), band = buf(), tint = buf();
  const mctx = memory.getContext('2d');
  const main = p.drawingContext;

  // Every distinct held step in the study, in order (for memory replay).
  const steps = [...new Set(Array.from({ length: FRAMES }, (_, n) => stepTime(n / FPS)))];
  let memTs = -1;
  let prevPhases = null;
  let lastTs = null;

  // ---------------------------------------------------------------- memory
  // The ground keeps the organism's temporal anatomy: every contour the
  // body has had, every path the thread has taken, the face's cavities
  // while they were aligned, stains where strips lifted away, each stage
  // of the ribs' growth.
  const MEM = 'rgba(34,56,128,';
  function stamp(ts) {
    const st = org.state(ts);
    const step = stepIndex(ts);
    const th = thread.state(ts, step, st);
    mctx.save();
    mctx.setTransform(...VIEW);
    mctx.lineJoin = 'round'; mctx.lineCap = 'round';
    mctx.strokeStyle = MEM + '0.075)';
    mctx.lineWidth = 1.1;
    polyline(mctx, th.route.stepped ? th.route.steppedPts : th.route.pts); mctx.stroke();
    polyline(mctx, th.full.slice(th.route.pts.length)); mctx.stroke();
    if (step % 2 === 0) {
      // contour residue: the body's edges, every other step
      mctx.strokeStyle = MEM + '0.07)';
      mctx.lineWidth = 1;
      polyline(mctx, st.sp.left); mctx.stroke();
      polyline(mctx, st.sp.right); mctx.stroke();
    }
    if (ts >= K.faceArrive[0] && ts <= K.reorg[0] + 0.6) {
      // the face, while it is perceptible, is burned into the ground
      mctx.strokeStyle = MEM + '0.16)';
      mctx.lineWidth = 1.3;
      for (const c of st.cav) {
        if (!['eye', 'socket', 'mouth'].includes(c.id)) continue;
        const g = cavityShape(c, org, st.sp, 12);
        polyline(mctx, [...g.upper, ...g.lower.slice().reverse(), g.upper[0]]); mctx.stroke();
      }
    }
    for (const r of st.ribState) {
      if (r.g <= 0 || step % 2) continue;
      mctx.strokeStyle = MEM + '0.06)';
      polyline(mctx, ribPolyline(r, r.g, step, 0)); mctx.stroke();
    }
    // pigment offset: a strip that lifts away leaves a stain of itself
    if (prevPhases) {
      st.stripState.forEach((s, i) => {
        if (s.pose.phase === 'transit' && prevPhases.strip[i].phase !== 'transit') {
          drawStrip(mctx, mats.painting, s.strip, prevPhases.strip[i].pose, means[i], { alpha: 0.26, flat: true });
          // and the outline of where it was: a fragment of prior geometry
          const g = stripGeometry(s.strip, prevPhases.strip[i].pose);
          mctx.strokeStyle = MEM + '0.3)'; mctx.lineWidth = 0.9;
          polyline(mctx, [...g.left, ...g.right.slice().reverse(), g.left[0]]); mctx.stroke();
        }
      });
      st.cellState.forEach((c, i) => {
        if (c.phase === 'transit' && prevPhases.cell[i] === 'home') {
          mctx.strokeStyle = 'rgba(180,110,30,0.3)'; mctx.lineWidth = 2;
          mctx.beginPath(); mctx.arc(c.home[0], c.home[1], c.r * 0.95, 0, Math.PI * 2); mctx.stroke();
        }
      });
    }
    prevPhases = {
      strip: st.stripState.map((s) => ({ phase: s.pose.phase, pose: s.pose })),
      cell: st.cellState.map((c) => c.phase),
    };
    mctx.restore();
  }

  function updateMemory(ts) {
    if (ts < memTs) {
      mctx.setTransform(1, 0, 0, 1, 0, 0);
      mctx.clearRect(0, 0, W, H);
      memTs = -1; prevPhases = null;
    }
    for (const s of steps) {
      if (s <= memTs) continue;
      if (s > ts) break;
      stamp(s);
      memTs = s;
    }
  }

  // Memory composite. Under material stress the record separates: a red
  // copy of the temporal anatomy slips out of register with the cobalt one.
  function compositeMemory(stress) {
    main.save();
    main.setTransform(1, 0, 0, 1, 0, 0);
    main.globalCompositeOperation = 'multiply';
    main.drawImage(memory, 0, 0);
    if (stress > 0.02) {
      const tc = tint.getContext('2d');
      tc.setTransform(1, 0, 0, 1, 0, 0);
      tc.globalCompositeOperation = 'source-over';
      tc.clearRect(0, 0, W, H);
      tc.drawImage(memory, 0, 0);
      tc.globalCompositeOperation = 'source-in';
      tc.fillStyle = 'rgb(190,40,50)';
      tc.fillRect(0, 0, W, H);
      main.globalAlpha = 0.9 * stress;
      main.drawImage(tint, 7 * k * stress, -3 * k * stress);
      main.globalAlpha = 0.6 * stress;
      main.drawImage(memory, -5 * k * stress, 4 * k * stress);
    }
    main.restore();
  }

  function renderAt(t) {
    const ts = stepTime(Math.min(t, 10 - 1e-6));
    if (ts === lastTs) return;
    lastTs = ts;
    const step = stepIndex(ts);
    updateMemory(ts);

    const st = org.state(ts);
    const th = thread.state(ts, step, st);
    const light = lightAt(ts);
    const stress = stressAt(ts);
    const tremble = win(ts, K.tremble[0], K.tremble[0] + 0.3);
    const sp = st.sp;
    const N = sp.pts.length - 1;
    const strips = st.stripState;
    const cells = st.cellState;
    const byPhase = (ph) => strips.filter((s) => s.pose.phase === ph);

    // ---------------- shadows (ground contact)
    const sl = shadowLow.getContext('2d'), sh = shadowLift.getContext('2d');
    for (const c of [sl, sh]) { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H); c.setTransform(...VIEW); c.lineCap = 'round'; }
    silhouette(sl, { ribbon: [sp.left, sp.right] });
    silhouette(sl, { line: th.route.pts, w: 2.2 });
    for (const s of strips) {
      const g = stripGeometry(s.strip, s.pose);
      silhouette(s.pose.lift > 0.05 ? sh : sl, { ribbon: [g.left, g.right] });
    }
    for (const c of cells) silhouette(c.lift > 0.05 ? sh : sl, { circle: [c.pos[0], c.pos[1], c.r] });
    for (const r of st.ribState) if (r.g > 0) silhouette(sl, { line: ribPolyline(r, r.g, step, tremble), w: r.w + 1 });

    // ---------------- ground, temporal anatomy, shadows
    main.save();
    main.setTransform(1, 0, 0, 1, 0, 0);
    main.globalCompositeOperation = 'source-over';
    main.drawImage(mats.ground, 0, 0, W, H);
    main.restore();
    compositeMemory(stress);
    compositeShadows(main, shadowLow, shadowLift, light, PX);

    main.save();
    main.setTransform(...VIEW);

    // the thread's delayed path: where it was half a second ago
    if (ts > 0.5) {
      const tsD = stepTime(ts - 0.5);
      const stD = org.state(tsD);
      const thD = thread.state(tsD, stepIndex(tsD), stD);
      main.save();
      main.strokeStyle = `rgba(40,70,165,${0.32 + 0.3 * stress})`; main.lineWidth = 1.3;
      main.translate(2 + 4 * stress, 1.5);
      polyline(main, thD.full); main.stroke();
      main.restore();
    }

    drawRoute(main, th.route);
    if (th.looseRootlets) drawRootlets(main, th.looseRootlets, true);

    // ribs that start under the cloth are laid first
    for (const r of st.ribState) if (r.under && r.g > 0) drawRib(main, r, r.g, step, tremble);

    const home = cells.filter((c) => c.phase === 'home');
    for (const c of home) drawCell(main, c, c.pos);
    drawNet(main, st.net, cells);

    // ---------------- the body, layer by layer along its length
    const iris = cells.find((c) => c.role && c.role.kind === 'iris');
    const chunk = 10;
    const jitter = [(hash(step, 11) - 0.5) * 0.9, (hash(step, 12) - 0.5) * 0.9];
    main.save();
    main.translate(jitter[0], jitter[1]); // re-placed by hand each step
    for (let i0 = 0; i0 < N; i0 += chunk) {
      const i1 = Math.min(N, i0 + chunk);
      const u0 = i0 / N, u1 = i1 / N;
      drawBodyChunk(main, mats.bodyCloth, sp, i0, i1, clothMeans, light, PX);
      drawCreases(main, org, sp, i0, i1, light);
      drawExposedSeams(main, org, sp, i0, i1);
      drawIncisions(main, org, sp, ts, st.incisions.filter((g) => g.u >= u0 && g.u < u1));
      for (const c of st.cav) {
        if (c.u < u0 || c.u >= u1) continue;
        drawCavity(main, c, org, sp, interiors, {
          px: PX, lidClose: st.lidClose,
          inside: c.id === 'eye' && iris && iris.phase === 'placed' ? () => drawCell(main, iris, iris.pos, 0.82) : null,
        });
      }
      // running stitch for this stretch of seam
      const s0 = Math.max(0, i0 - 2), s1 = Math.min(th.seam.length, i1 - 1);
      if (s1 - s0 > 1) drawSeam(main, th.seam.slice(s0, s1));
      drawHoles(main, th.holes, i0, i1);
      for (const s of byPhase('body')) if (s.strip.s >= u0 && s.strip.s < u1) drawStrip(main, mats.painting, s.strip, s.pose, means[s.strip.id]);
    }
    main.restore();

    // root (until the thread is drawn back) and its rootlets
    if (th.root) strokeThread(main, th.root, 2);
    if (th.attachedRootlets) drawRootlets(main, th.attachedRootlets, false);

    // ---------------- membranes, ribs, cladding
    st.membranes.forEach((m, i) => drawMembrane3(main, mats.painting, m, i, org, sp, st.ribState, step, tremble));
    for (const r of st.ribState) if (!r.under && r.g > 0) {
      if (r.thread) { if (th.rib0) strokeThread(main, th.rib0, r.w); }
      else drawRib(main, r, r.g, step, tremble);
    }
    for (const s of byPhase('rib')) drawStrip(main, mats.painting, s.strip, s.pose, means[s.strip.id]);
    for (const c of cells) if (c.phase === 'placed' && c.role.kind === 'joint') drawCell(main, c, c.pos, 0.62);
    for (const s of strips) if (s.strip.gold && s.pose.phase !== 'transit') drawGold(main, s.strip.gold, s.pose, ts);

    // in transit: lifted above everything
    const moving = [
      ...byPhase('transit').map((s) => ({ lift: s.pose.lift, draw: () => { drawStrip(main, mats.painting, s.strip, s.pose, means[s.strip.id]); if (s.strip.gold) drawGold(main, s.strip.gold, s.pose, ts); } })),
      ...cells.filter((c) => c.phase === 'transit').map((c) => ({ lift: c.lift, draw: () => drawCell(main, c, c.pos, 1 + 0.05 * c.lift) })),
    ].sort((a, b) => a.lift - b.lift);
    moving.forEach((m) => m.draw());
    main.restore();

    // ---------------- post
    reliefAndLight(main, shadowLow, tmp, light, W, H, k);
    scanBand(main, prev, ts, W, H, k, tmp, band);
    grainAndFlicker(main, mats.grain, step, W, H, k);

    const pctx = prev.getContext('2d');
    pctx.setTransform(1, 0, 0, 1, 0, 0);
    pctx.drawImage(p.canvas, 0, 0);
    prev.hasFrame = true;
  }

  return { renderAt, info: { seed, W, H, scans: mats.scans, roles, face: org.faceUs } };
}
