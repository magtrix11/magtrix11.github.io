// Composes one held step of the study: ground -> memory -> shadows ->
// organism -> scanner band -> grain. Owns the stateful memory buffer.

import { buildMaterials, meanColor } from './materials.js';
import { createOrganism } from './organism.js';
import { createThread } from './thread-system.js';
import { K, FRAMES, FPS, DURATION, EYE, warp, stepTime, stepIndex, easeInOut, win, clamp, lerp } from './timeline.js';
import { hash } from './rng.js';
import { truncate, quadPts, polyline } from './draw.js';
import {
  lightAt, drawStrip, drawGold, drawBody, drawIncisions, drawRoute, drawSeam, drawRootlets,
  drawTail, drawLashes, drawLid, drawCell, drawNet, drawWire, membranePanel, drawMembrane,
  silhouette, stripGeometry, setSurfaceTextures,
} from './render.js';
import { compositeShadows, scanBand, grainAndFlicker, reliefAndLight } from './post-process.js';

export async function createFilm(p, { W, H, seed }) {
  const k = W / 1920;
  // Camera: closer than the full organism (the body is cropped by the frame,
  // like a macro photograph of a table). It moves in on the eye while the
  // eye is open and closing, holds, then draws back as the rib grows.
  // The world point `c` is placed at screen point `S`, scaled by `Z`.
  let Z = 1.22, VIEW = null, WORLD = null;
  function setCamera(rt, eyeAt) {
    const zin = easeInOut(win(rt, EYE.camIn[0], EYE.camIn[1]));
    const zout = easeInOut(win(rt, EYE.camOut[0], EYE.camOut[1]));
    const f = zin * (1 - zout);
    Z = lerp(1.22, 1.95, f);
    const c = [lerp(880, eyeAt[0], f), lerp(535, eyeAt[1] + 8, f)];
    const S = [lerp(880, 960, f), lerp(535, 540, f)];
    const ex = k * (S[0] - c[0] * Z), ey = k * (S[1] - c[1] * Z);
    VIEW = [k * Z, 0, 0, k * Z, ex, ey];   // design units -> screen pixels
    WORLD = [Z, 0, 0, Z, ex, ey];          // world-pixel buffers -> screen pixels
  }
  const mats = await buildMaterials(seed, W, H, k);
  const org = createOrganism(seed, { pinches: mats.bodyCloth.pinches || [] });
  const pw = mats.painting.width, ph = mats.painting.height;
  const meanOf = (uv) => meanColor(mats.painting, uv.x * pw, uv.y * ph, uv.w * pw, Math.max(2, uv.h * ph));
  const roles = org.assignRoles(meanOf);
  const means = org.strips.map((s) => meanOf(s.uv));
  const thread = createThread(seed, org);
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
  setSurfaceTextures(findWindow([222, 160, 70]), findWindow([228, 130, 150]));
  const cw = mats.bodyCloth.width, chh = mats.bodyCloth.height;
  const clothMeans = Array.from({ length: 48 }, (_, i) => meanColor(mats.bodyCloth, (i / 48) * cw, chh * 0.3, cw / 48, chh * 0.4));

  const buf = () => { const g = p.createGraphics(W, H); g.pixelDensity(1); g.elt.style.display = 'none'; return g.elt; };
  const memory = buf(), shadowLow = buf(), shadowLift = buf(), prev = buf(), tmp = buf(), band = buf();
  const mctx = memory.getContext('2d');
  const main = p.drawingContext;

  // Every distinct held step in the study, in order (for memory replay).
  const steps = [...new Set(Array.from({ length: FRAMES }, (_, n) => stepTime(n / FPS)))];
  let memTs = -1;
  let prevPhases = null;
  let lastTs = null;

  const MEM = 'rgba(34,56,128,';

  // The memory buffer lives in world space (it is the table's surface), so it
  // stays put under the moving camera.
  function stamp(rt) {
    const ts = warp(rt);
    const st = org.state(ts);
    const th = thread.state(ts, stepIndex(rt), st);
    mctx.save();
    mctx.setTransform(k, 0, 0, k, 0, 0);
    mctx.lineJoin = 'round';
    mctx.strokeStyle = MEM + "0.06)";
    mctx.lineWidth = 1.1;
    polyline(mctx, th.route.stepped ? th.route.steppedPts : th.route.pts); mctx.stroke();
    polyline(mctx, th.tail.pts); mctx.stroke();
    mctx.strokeStyle = MEM + '0.035)';
    polyline(mctx, th.seam); mctx.stroke();
    if (stepIndex(rt) % 4 === 0) {
      mctx.strokeStyle = MEM + '0.045)';
      mctx.lineWidth = 0.9;
      polyline(mctx, st.sp.left); mctx.stroke();
      polyline(mctx, st.sp.right); mctx.stroke();
    }
    // Pigment offset: a strip that lifts away leaves a stain of itself.
    const phases = st.stripState.map((s) => s.pose.phase);
    if (prevPhases) {
      st.stripState.forEach((s, i) => {
        if (s.pose.phase === 'transit' && prevPhases.strip[i].phase !== 'transit') {
          drawStrip(mctx, mats.painting, s.strip, prevPhases.strip[i].pose, means[i], { alpha: 0.22, flat: true });
        }
      });
      st.cellState.forEach((c, i) => {
        if (c.phase === 'transit' && prevPhases.cell[i] === 'home') {
          mctx.strokeStyle = 'rgba(180,110,30,0.28)'; mctx.lineWidth = 2;
          mctx.beginPath(); mctx.arc(c.home[0], c.home[1], c.r * 0.95, 0, Math.PI * 2); mctx.stroke();
        }
      });
    }
    prevPhases = {
      strip: st.stripState.map((s) => ({ phase: s.pose.phase, pose: s.pose })),
      cell: st.cellState.map((c) => c.phase),
    };
    void phases;
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

  const ribPts = (rib, r, g, step, t) => {
    let pts = truncate(rib.pts, g);
    if (t > 9.3) {
      // the finished structure trembles by a pixel at the tips
      pts = pts.map((q, i) => {
        const u = i / (rib.pts.length - 1);
        const j = (hash(step, r, 5) - 0.5) * 2.4 * u * u;
        return [q[0] + j, q[1] - j * 0.6];
      });
    }
    return pts;
  };

  function renderAt(t) {
    const rt = stepTime(Math.min(t, DURATION - 1e-6));
    if (rt === lastTs) return;
    lastTs = rt;
    const step = stepIndex(rt);
    updateMemory(rt);
    const ts = warp(rt);
    setCamera(rt, org.eye.E1);

    const st = org.state(ts);
    const th = thread.state(ts, step, st);
    const light = lightAt(ts);
    const eye = org.eye;

    // Rib and membrane geometry for this step.
    const ribs = st.ribState.map((r, i) => ({ r: i, pts: r.g > 0 ? ribPts(r, i, r.g, step, ts) : [], g: r.g, full: r.pts }));
    const opp = st.ribOppState.map((r, i) => ({ pts: r.g > 0 ? truncate(r.pts, r.g) : [] }));
    const exts = [0.8, 0.72, 0.64, 0.74, 0.56];
    const panels = [];
    for (let r = 0; r < 5; r++) {
      const e0 = easeInOut(win(ts, K.membrane[0] + 0.24 * r, K.membrane[0] + 0.24 * r + 1.2));
      const e = e0 >= 1 ? 1 : Math.floor(e0 * 6) / 6;
      const mA = Math.min(ribs[r].g, e * exts[r]), mB = Math.min(ribs[r + 1].g, e * exts[r] * 0.9);
      if (mA > 0.03 && mB > 0.03) panels.push({ r, panel: membranePanel(ribs[r].full, ribs[r + 1].full, mA, mB, seed + r) });
    }
    const crosses = st.crossWires.map((cw) => {
      const f = clamp((ts - cw.start) / 0.35);
      if (f <= 0 || ribs[cw.r].g < cw.ua || ribs[cw.r + 1].g < cw.ub) return null;
      const pa = ribs[cw.r].full[Math.round(cw.ua * 44)], pb = ribs[cw.r + 1].full[Math.round(cw.ub * 44)];
      const mid = [(pa[0] + pb[0]) / 2 + 6, (pa[1] + pb[1]) / 2 + 10];
      return truncate(quadPts(pa, mid, pb, 12), f >= 1 ? 1 : Math.floor(f * 4) / 4);
    }).filter(Boolean);

    const strips = st.stripState;
    const byPhase = (ph) => strips.filter((s) => s.pose.phase === ph);
    const lidS = strips[roles.lid];
    const cells = st.cellState;

    // ---------------- shadows
    const sl = shadowLow.getContext('2d'), sh = shadowLift.getContext('2d');
    for (const c of [sl, sh]) { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H); c.setTransform(...VIEW); c.lineCap = 'round'; }
    silhouette(sl, { ribbon: [st.sp.left, st.sp.right] });
    silhouette(sl, { line: th.route.pts, w: 2.2 });
    silhouette(sl, { line: th.tail.pts, w: 2.4 });
    for (const s of strips) {
      const g = stripGeometry(s.strip, s.pose);
      silhouette(s.pose.lift > 0.05 ? sh : sl, { ribbon: [g.left, g.right] });
    }
    for (const c of cells) silhouette(c.lift > 0.05 ? sh : sl, { circle: [c.pos[0], c.pos[1], c.r] });
    for (const r of ribs) if (r.pts.length > 1) silhouette(sl, { line: r.pts, w: 3 });
    for (const r of opp) if (r.pts.length > 1) silhouette(sl, { line: r.pts, w: 3 });
    sl.globalAlpha = 0.3;
    for (const pn of panels) silhouette(sl, { poly: pn.panel.poly });
    sl.globalAlpha = 1;

    // ---------------- ground, memory, shadows
    main.save();
    main.setTransform(1, 0, 0, 1, 0, 0);
    main.globalCompositeOperation = 'source-over';
    main.setTransform(...WORLD);
    main.drawImage(mats.ground, 0, 0, W, H);
    main.globalCompositeOperation = 'multiply';
    main.drawImage(memory, 0, 0);
    main.restore();
    compositeShadows(main, shadowLow, shadowLift, light, k * Z);

    // ---------------- organism
    main.save();
    main.setTransform(...VIEW);
    const jitter = [(hash(step, 11) - 0.5) * 0.9, (hash(step, 12) - 0.5) * 0.9];

    drawRoute(main, th.route);
    if (th.looseRootlets) drawRootlets(main, th.looseRootlets, true);

    main.save();
    main.translate(jitter[0], jitter[1]); // re-placed by hand each step
    drawBody(main, mats.bodyCloth, st.sp, clothMeans);
    drawIncisions(main, org, st.sp, ts, st.incisions);
    drawSeam(main, th.seam);
    for (const s of byPhase('body')) drawStrip(main, mats.painting, s.strip, s.pose, means[s.strip.id]);
    main.restore();

    const home = cells.filter((c) => c.phase === 'home');
    for (const c of home) drawCell(main, c, c.pos);
    drawNet(main, st.net, cells);

    // face parts
    for (const c of cells) if (c.phase === 'placed' && c.role.kind !== 'joint') {
      drawCell(main, c, c.pos);
      if (c.role.kind === 'iris') {
        // the iris cell is pierced (P25's hammered disc with a hole): a dark
        // pupil with a wet rim, so the open eye looks back
        const [x, y] = c.pos;
        main.save();
        main.fillStyle = 'rgba(28,12,14,0.92)';
        main.beginPath(); main.ellipse(x + 1, y + 1, c.r * 0.36, c.r * 0.4, 0.2, 0, Math.PI * 2); main.fill();
        main.fillStyle = 'rgba(255,245,225,0.75)';
        main.beginPath(); main.arc(x - c.r * 0.12, y - c.r * 0.16, c.r * 0.08, 0, Math.PI * 2); main.fill();
        main.restore();
      }
    }
    const faceOrder = ['mouth', 'cover', 'cheek', 'ring'];
    for (const kind of faceOrder) {
      const s = strips.find((x) => x.strip.role.kind === kind && x.pose.phase === 'face');
      if (s) drawStrip(main, mats.painting, s.strip, s.pose, means[s.strip.id]);
    }
    if (ts >= 5.2) {
      // the second eye is already shut: a short red running stitch over it
      main.save();
      main.strokeStyle = '#a3342b'; main.lineWidth = 1.8; main.lineCap = 'round';
      main.setLineDash([6, 4]);
      polyline(main, org.eye2.arc); main.stroke();
      main.restore();
    }
    let lidEdge = null;
    if (lidS.pose.phase === 'face') lidEdge = drawLid(main, mats.painting, lidS.strip, eye, st.lidClose, means[lidS.strip.id]);
    drawTail(main, th.tail);
    if (th.attachedRootlets) drawRootlets(main, th.attachedRootlets, false);
    drawLashes(main, lidEdge, st.lidClose);

    // wing
    for (const pn of panels) drawMembrane(main, mats.painting, pn.panel, pn.r);
    ribs.forEach((r, i) => { if (r.pts.length > 1 && i > 0) drawWire(main, r.pts, false, seed + i); });
    opp.forEach((r, i) => { if (r.pts.length > 1) drawWire(main, r.pts, false, seed + 40 + i); });
    crosses.forEach((c, i) => drawWire(main, c, false, seed + 60 + i));
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

  return { renderAt, info: { seed, W, H, scans: mats.scans, roles } };
}
