// The organism (Revision 3): one continuous textile body that compresses
// and folds into a dense chamber, briefly lets a face be found in its
// cavities, reorganises, and sends irregular ribs out from a stitched seam.
//
// Identity rule: every strip, cell, cavity and crease is created once and
// attached to the body (by its position u along the body) or to a rib.
// Only pose and role change. Nothing is created from nothing or removed.
//
// The body's spine is driven by control points with four keyframes:
//   A  extended, asymmetrical, sagging          (0 – 1.5 s, alive)
//   B  compressed, folded chamber; face aligned (reached ~3.6 s)
//   C  reorganised: the alignment breaks        (5.5 – 7.2 s)
//   D  pulled slightly by the growing ribs      (7.2 – 10 s)
// Each control point travels on its own schedule (see timeline.move), so
// different regions of the body move at different times.
//
// All geometry is a pure function of (held) time. Design space 1920x1080.

import { makeRandom, makeNoise1D, hash } from './rng.js';
import { K, clamp, lerp, smooth, easeInOut, win, move } from './timeline.js';
import { resample, tangentAt, polyLength } from './draw.js';

const TAU = Math.PI * 2;
const add = (p, q) => [p[0] + q[0], p[1] + q[1]];

export const BODY = { N: 160 };

// Control points, tail (u = 0) to head (u = 1).
const KA = [
  [170, 965], [300, 912], [430, 868], [545, 790], [665, 740], [810, 722], [950, 680], [1080, 612],
  [1205, 565], [1345, 568], [1475, 528], [1595, 452], [1700, 386], [1785, 344],
];
const KB = [
  [230, 930], [360, 880], [480, 820], [590, 760], [660, 680], [740, 600], [850, 565], [975, 560],
  [1065, 625], [1040, 712], [945, 738], [820, 742], [690, 728], [612, 680],
];
const KC = [
  [226, 934], [356, 884], [476, 826], [584, 768], [652, 690], [734, 616], [860, 595], [990, 545],
  [1105, 612], [1080, 712], [988, 752], [852, 762], [716, 750], [585, 655],
];
const KD = [
  [226, 934], [356, 884], [476, 826], [584, 770], [650, 694], [732, 620], [862, 598], [1005, 540],
  [1125, 607], [1098, 714], [994, 758], [858, 766], [720, 754], [582, 658],
];

function catmull(ctrl, per = 18) {
  const out = [];
  for (let i = 0; i < ctrl.length - 1; i++) {
    const p0 = ctrl[Math.max(0, i - 1)], p1 = ctrl[i], p2 = ctrl[i + 1], p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((d) => 0.5 * ((2 * p1[d]) + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3)));
    }
  }
  out.push(ctrl[ctrl.length - 1].slice());
  return out;
}

export function createOrganism(seed, opts = {}) {
  const pinches = opts.pinches || [];
  const rnd = makeRandom(seed);
  const N = BODY.N;
  const nz = [1, 2, 3, 4, 5, 6].map((i) => makeNoise1D(seed + i * 7));
  const LA = polyLength(catmull(KA));

  // ------------------------------------------------------------ spine
  // The keyframes are converted to chains (start point, segment angles,
  // segment lengths). Each segment turns on its own schedule, so regions
  // fold at different times while the body keeps its length — it folds,
  // it does not stretch or morph.
  const toChain = (P) => {
    const th = [], len = [];
    for (let i = 0; i < P.length - 1; i++) {
      let a = Math.atan2(P[i + 1][1] - P[i][1], P[i + 1][0] - P[i][0]);
      if (i > 0) { while (a - th[i - 1] > Math.PI) a -= TAU; while (a - th[i - 1] < -Math.PI) a += TAU; }
      th.push(a); len.push(Math.hypot(P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1]));
    }
    return { p0: P[0], th, len };
  };
  const chains = [KA, KB, KC, KD].map(toChain);
  for (let c = 1; c < chains.length; c++) {
    // unwrap each keyframe against the previous one, segment by segment
    const prev = chains[c - 1].th, cur = chains[c].th;
    for (let i = 0; i < cur.length; i++) {
      while (cur[i] - prev[i] > Math.PI) cur[i] -= TAU;
      while (cur[i] - prev[i] < -Math.PI) cur[i] += TAU;
    }
  }
  const nseg = KA.length - 1;
  // Per-segment schedules: the fold travels irregularly (not tail-to-head).
  const sched = Array.from({ length: nseg }, (_, i) => ({
    b: [K.fold[0] + hash(seed, i, 1) * 1.05, 0.75 + hash(seed, i, 2) * 0.7],
    c: [K.reorg[0] + hash(seed, i, 3) * 0.75, 0.7 + hash(seed, i, 4) * 0.5],
    d: [K.ribs[0] + hash(seed, i, 5) * 1.0, 0.9 + hash(seed, i, 6) * 0.8],
    ph: hash(seed, i, 7) * TAU, w: 1.6 + hash(seed, i, 8) * 2.2, amp: 0.02 + hash(seed, i, 9) * 0.04,
  }));
  function controls(t) {
    const [A, B, C, D] = chains;
    const p0b = move(t, sched[0].b[0], sched[0].b[1], seed * 29);
    const p0c = move(t, sched[0].c[0], sched[0].c[1], seed * 30);
    let p = [A.p0[0] + (B.p0[0] - A.p0[0]) * p0b + (C.p0[0] - B.p0[0]) * p0c, A.p0[1] + (B.p0[1] - A.p0[1]) * p0b + (C.p0[1] - B.p0[1]) * p0c];
    const out = [p.slice()];
    for (let i = 0; i < nseg; i++) {
      const s = sched[i];
      const pb = move(t, s.b[0], s.b[1], seed * 31 + i);
      const pc = move(t, s.c[0], s.c[1], seed * 37 + i);
      const pd = move(t, s.d[0], s.d[1], seed * 41 + i);
      // living pressure: small uneven turning, strongest before the fold
      const life = (t < K.fold[0] + 0.6 ? 1 : 0.4) * s.amp * Math.sin(t * s.w + s.ph);
      const th = A.th[i] + (B.th[i] - A.th[i]) * pb + (C.th[i] - B.th[i]) * pc + (D.th[i] - C.th[i]) * pd + life;
      const len = A.len[i] + (B.len[i] - A.len[i]) * pb + (C.len[i] - B.len[i]) * pc + (D.len[i] - C.len[i]) * pd;
      p = [p[0] + Math.cos(th) * len, p[1] + Math.sin(th) * len];
      out.push(p.slice());
    }
    return out;
  }

  const pinchAt = (u) => {
    let m = 0;
    for (const p of pinches) {
      const c = (p.u0 + p.u1) / 2, hw = (p.u1 - p.u0) / 2 + 0.004;
      m = Math.max(m, smooth(1 - Math.abs(u - c) / hw));
    }
    return m;
  };
  // Flattened planes (the face plane and the cheek) and one-sided bites.
  const flats = [[0.44, 0.62, 1.75], [0.63, 0.72, 1.45], [0.2, 0.26, 1.25]];
  const bites = [[0.13, 1, 0.5], [0.36, -1, 0.45], [0.79, 1, 0.55], [0.9, -1, 0.5]];
  const flatAt = (u) => flats.reduce((m, [a, b, f]) => m * lerp(1, f, smooth(win(u, a - 0.02, a + 0.02)) * (1 - smooth(win(u, b - 0.02, b + 0.02)))), 1);
  const biteAt = (u, side) => bites.reduce((m, [c, s, f]) => (s === side ? m * lerp(1, f, smooth(1 - Math.abs(u - c) / 0.014)) : m), 1);

  function halfWidths(u, t, compression) {
    const ends = (0.55 + 0.45 * smooth(u / 0.05)) * (0.62 + 0.38 * smooth((1 - u) / 0.04));
    // uneven pressure travelling irregularly along the body
    const pulse = 1 + (0.035 + 0.05 * (1 + nz[5](u * 3)) / 2) * Math.sin(TAU * (t * 0.55 + u * 2.3) + nz[4](u * 2) * 3);
    const base = ends * flatAt(u) * (1 - 0.32 * pinchAt(u)) * pulse * compression;
    const hl = 52 * (1 + 0.32 * nz[0](u * 4.3) + 0.14 * nz[1](u * 13)) * base * biteAt(u, 1);
    const hr = 44 * (1 + 0.38 * nz[2](u * 3.7) + 0.16 * nz[3](u * 11)) * base * biteAt(u, -1);
    return [Math.max(6, hl), Math.max(6, hr)];
  }

  function spine(t) {
    const dense = catmull(controls(t));
    const Lt = polyLength(dense);
    const compression = clamp(Math.sqrt(LA / Lt), 1, 1.18);
    const pts = resample(dense, N + 1);
    const ths = pts.map((_, i) => { const tg = tangentAt(pts, i); return Math.atan2(tg[1], tg[0]); });
    const hls = [], hrs = [], left = [], right = [];
    for (let i = 0; i <= N; i++) {
      const [hl, hr] = halfWidths(i / N, t, compression);
      hls.push(hl); hrs.push(hr);
      const n = [-Math.sin(ths[i]), Math.cos(ths[i])];
      left.push([pts[i][0] + n[0] * hl, pts[i][1] + n[1] * hl]);
      right.push([pts[i][0] - n[0] * hr, pts[i][1] - n[1] * hr]);
    }
    const ws = hls.map((h, i) => h + hrs[i]);
    return { pts, ths, ws, hls, hrs, left, right, compression, L: Lt };
  }
  const spineAt = (sp, u) => {
    const f = clamp(u) * N, i = Math.min(N - 1, Math.floor(f)), r = f - i;
    const th = sp.ths[i] + (((sp.ths[i + 1] - sp.ths[i] + Math.PI) % TAU + TAU) % TAU - Math.PI) * r;
    return {
      p: [lerp(sp.pts[i][0], sp.pts[i + 1][0], r), lerp(sp.pts[i][1], sp.pts[i + 1][1], r)],
      th, w: lerp(sp.ws[i], sp.ws[i + 1], r), hl: lerp(sp.hls[i], sp.hls[i + 1], r), hr: lerp(sp.hrs[i], sp.hrs[i + 1], r),
    };
  };
  // point on the body at (u, v); v in [-1, 1] across (left +, right -)
  const bodyPoint = (sp, u, v) => {
    const a = spineAt(sp, u);
    const n = [-Math.sin(a.th), Math.cos(a.th)];
    const h = v >= 0 ? a.hl : a.hr;
    return [a.p[0] + n[0] * h * v, a.p[1] + n[1] * h * v];
  };
  // nearest u on the spine to a world point (used once, to place the face
  // where the fold actually brings matter together)
  const nearestU = (sp, q, lo = 0, hi = 1) => {
    let best = lo, bd = 1e9;
    for (let i = Math.round(lo * N); i <= Math.round(hi * N); i++) {
      const d = Math.hypot(sp.pts[i][0] - q[0], sp.pts[i][1] - q[1]);
      if (d < bd) { bd = d; best = i / N; }
    }
    return best;
  };

  // ------------------------------------------------------------ face
  // The face is not drawn: it is where the chamber (keyframe B) brings two
  // cavities side by side on the flattened upper plane and a red slit on the
  // lower fold. These cavities exist on the body from frame 0 as tears.
  const spB = spine(4.8);
  const uEye = nearestU(spB, [945, 562], 0.4, 0.66);
  const uSocket = nearestU(spB, [800, 572], 0.36, 0.62);
  const uMouth = nearestU(spB, [860, 742], 0.62, 0.86);
  const eyeLen = 128;
  const cavities = [
    { id: 'eye', u: uEye, v: 0.32, len: eyeLen, wid: 54, interior: 'cobalt', open0: 0.5, lip: 1 },
    { id: 'socket', u: uSocket, v: 0.28, len: 92, wid: 48, interior: 'dark', open0: 0.7, lip: 0.6 },
    { id: 'mouth', u: uMouth, v: 0.3, len: 118, wid: 24, interior: 'red', open0: 0.65, lip: 0.4 },
    { id: 'tear1', u: 0.17, v: -0.2, len: 70, wid: 26, interior: 'yarn', open0: 1, lip: 0.8, flap: 1 },
    { id: 'tear2', u: 0.31, v: 0.25, len: 54, wid: 22, interior: 'muslin', open0: 1, lip: 0.7, flap: -1 },
    { id: 'tear3', u: 0.86, v: -0.1, len: 64, wid: 24, interior: 'red', open0: 1, lip: 0.7, flap: 1 },
  ];
  const cavityOpen = (c, t) => {
    const breathe = 1 + 0.12 * Math.sin(t * 1.9 + c.u * 40);
    if (c.id === 'eye') {
      // opens wider as the face aligns, then is stitched shut
      const wake = lerp(c.open0, 1, easeInOut(win(t, K.faceArrive[0], K.faceArrive[1])));
      return wake * (1 - easeInOut(win(t, K.lidClose[0], K.lidClose[1]))) * breathe;
    }
    if (c.id === 'socket') return c.open0 * (1 + 0.25 * easeInOut(win(t, 3.6, 4.4))) * breathe;
    return c.open0 * breathe;
  };
  // the eye's ends: the outer end is where the closed seam continues as rib 0
  const eyeEnds = (sp) => {
    const du = (eyeLen / 2) / sp.L;
    return { inner: bodyPoint(sp, uEye - du, 0.32), outer: bodyPoint(sp, uEye + du, 0.32), du };
  };

  // ------------------------------------------------------------ creases
  const creases = Array.from({ length: 26 }, (_, i) => ({
    u: 0.04 + 0.92 * hash(seed, i, 61), bend: (hash(seed, i, 62) - 0.5) * 0.5,
    span: 0.5 + hash(seed, i, 63) * 0.5, side: hash(seed, i, 64) < 0.5 ? 1 : -1, base: 0.15 + hash(seed, i, 65) * 0.35,
  }));
  const seams = [{ u0: 0.22, u1: 0.3, v: 0.55 }, { u0: 0.66, u1: 0.74, v: -0.5 }];

  // ------------------------------------------------------------ ribs
  // Every rib differs: origin, heading, curvature profile, kinks, splits,
  // weight, growth rhythm, and whether it is ever finished.
  const RIBS = [
    { id: 0, from: 'eyeOuter', h0: -0.3, len: 660, w: 2.3, thread: true, kinks: [[0.38, 0.42], [0.7, -0.2]], k: (u) => -0.0012 + 0.003 * Math.pow(u, 1.4), start: 7.2, dur: 1.5, max: 1 },
    { id: 1, from: [0.63, 0.9], h0: -0.62, len: 520, w: 3.1, kinks: [[0.36, -0.22]], k: (u) => (u < 0.35 ? -0.0011 : 0.0019), split: [0.66, 0.6, 150], start: 7.45, dur: 1.4, max: 1 },
    { id: 2, from: [0.5, -0.2], h0: -0.95, len: 250, w: 2.0, under: true, kinks: [[0.5, -0.7], [0.74, 0.35]], k: () => 0.0004, start: 8.0, dur: 1.1, max: 0.74 },
    { id: 3, from: [0.75, 0.4], h0: 0.55, len: 420, w: 3.7, kinks: [], k: (u) => 0.0006 + 0.0034 * u * u, start: 7.6, dur: 1.5, max: 1 },
    { id: 4, from: [0.97, 0.0], h0: 0.95, len: 220, w: 1.8, under: true, kinks: [[0.3, 0.4]], k: () => -0.0008, split: [0.58, -0.85, 80], start: 8.3, dur: 0.9, max: 1 },
    { id: 5, from: [0.69, -0.85], h0: 0.22, len: 640, w: 1.6, kinks: [[0.3, -0.25], [0.62, 0.3]], k: (u) => (u < 0.5 ? -0.0016 : 0.0014), start: 7.8, dur: 1.6, max: 0.93 },
    { id: 6, from: [0.4, 0.7], h0: -2.35, len: 190, w: 2.2, kinks: [[0.45, -0.4]], k: () => 0.0018, start: 8.6, dur: 0.8, max: 0.8 },
  ];
  // Rib geometry is laid against the final body (keyframe D).
  const spD = spine(9.6);
  function buildRib(spec) {
    const root = spec.from === 'eyeOuter' ? eyeEnds(spD).outer : bodyPoint(spD, spec.from[0], spec.from[1]);
    const n = 60, step = spec.len / n;
    const pts = [root.slice()];
    let p = root.slice(), h = spec.h0;
    const rn = makeNoise1D(seed + 300 + spec.id);
    for (let i = 0; i < n; i++) {
      const u = i / n;
      for (const [ku, kd] of spec.kinks) if (Math.abs(u - ku) < 0.5 / n) h += kd;
      h += (spec.k(u) + 0.0011 * rn(u * 5)) * step;
      p = [p[0] + Math.cos(h) * step, p[1] + Math.sin(h) * step];
      pts.push(p);
    }
    let tine = null;
    if (spec.split) {
      const [su, dh, tl] = spec.split;
      const i0 = Math.round(su * n);
      const tg = tangentAt(pts, i0);
      let th = Math.atan2(tg[1], tg[0]) + dh, q = pts[i0].slice();
      tine = { u: su, pts: [q.slice()] };
      for (let j = 0; j < 24; j++) { th += 0.004 * (tl / 24) * (dh > 0 ? 1 : -1); q = [q[0] + Math.cos(th) * tl / 24, q[1] + Math.sin(th) * tl / 24]; tine.pts.push(q); }
    }
    return { ...spec, pts, tine, root };
  }
  const ribs = RIBS.map(buildRib);
  // growth: stepped pieces, with the rib's own hesitations; some never finish
  const ribGrowth = (rib, t) => {
    const m = move(t, rib.start, rib.dur, seed * 53 + rib.id);
    const q = m >= 1 ? 1 : Math.floor(clamp(m) * 9) / 9;
    return q * rib.max;
  };
  const ribPoint = (r, u) => {
    const rib = ribs[r];
    const i = Math.round(clamp(u) * (rib.pts.length - 1));
    const tg = tangentAt(rib.pts, i);
    return { p: rib.pts[i], a: Math.atan2(tg[1], tg[0]) };
  };

  // Membranes: stretched between attachment points, not filled shapes.
  // Each has its own attachments, tension (sag), holes and growth.
  const MEMBRANES = [
    // the main lateral membrane, between the thread-rib and the low rib
    { a: 0, b: 5, ua: [0.05, 0.22, 0.42, 0.6], ub: [0.04, 0.2, 0.38, 0.52], sag: 0.42, alpha: 0.24, holes: [[0.62, 0.45, 26], [0.3, 0.7, 14], [0.8, 0.25, 18]], start: 8.0, dur: 1.5, tint: [226, 112, 140] },
    // a partial upper web, slack
    { a: 1, b: 0, ua: [0.1, 0.3], ub: [0.1, 0.32], sag: 0.36, alpha: 0.3, holes: [], start: 8.5, dur: 1.0, tint: [214, 120, 150] },
    // a small taut web low down
    { a: 5, b: 3, ua: [0.08, 0.26], ub: [0.1, 0.38], sag: 0.14, alpha: 0.36, holes: [[0.5, 0.5, 8]], start: 8.3, dur: 1.1, tint: [200, 90, 110] },
    // tissue still attached to the body's cheek
    { a: 'body', b: 5, ua: [0.66, 0.7], ub: [0.03, 0.12], sag: 0.3, alpha: 0.3, holes: [], start: 8.9, dur: 0.8, tint: [190, 120, 170] },
  ];

  // ------------------------------------------------------------ cells
  const cells = [];
  const radii = [26, 22, 20, 19, 17, 16, 24, 15, 14, 12, 18, 11, 10, 13, 9];
  for (let i = 0; i < radii.length; i++) {
    const r = radii[i];
    let best = null;
    for (let tries = 0; tries < 400; tries++) {
      const ang = rnd.range(0, TAU), d = i === 0 ? 0 : rnd.range(10, 72);
      const q = [Math.cos(ang) * d * 1.25, Math.sin(ang) * d * 0.85];
      if (cells.every((c) => Math.hypot(c.off[0] - q[0], c.off[1] - q[1]) > (c.r + r) * 0.82)) { best = q; break; }
    }
    cells.push({ id: i, r, off: best || [rnd.range(-60, 60), rnd.range(-40, 40)], seed: rnd.int(1, 1e6) });
  }
  const net = [];
  for (let i = 0; i < cells.length; i++) for (let j = i + 1; j < cells.length; j++) {
    const d = Math.hypot(cells[i].off[0] - cells[j].off[0], cells[i].off[1] - cells[j].off[1]);
    if (d < (cells[i].r + cells[j].r) * 1.12) net.push({ i, j, w: rnd.range(1.2, 2.6), sag: rnd.range(-0.3, 0.3) });
  }
  cells[0].role = { kind: 'iris', start: K.faceArrive[0], dur: 0.75 };
  [[1, 1, 0.3], [2, 1, 0.24], [3, 3, 0.5], [4, 0, 0.8]].forEach(([ci, r, u], k) => {
    const rib = ribs[r];
    cells[ci].role = { kind: 'joint', rib: r, u, start: Math.max(K.joints[0] + k * 0.27, rib.start + rib.dur * u * 0.9 + 0.15), dur: 0.6 };
  });
  const clusterAnchor = (sp) => {
    const a = spineAt(sp, 0.2);
    const n = [-Math.sin(a.th), Math.cos(a.th)];
    return { c: add(a.p, [n[0] * -(a.hr + 40), n[1] * -(a.hr + 40)]), th: a.th };
  };

  // ------------------------------------------------------------ strips
  // Unevenly concentrated: dense clusters, bare stretches, lengthwise
  // pieces, and scraps hanging off one edge onto the ground.
  const strips = [];
  const clusters = [[0.1, 5], [0.25, 6], [0.34, 4], [0.66, 5], [0.73, 3], [0.92, 5]];
  for (const [cu, n] of clusters) {
    for (let j = 0; j < n; j++) {
      const i = strips.length;
      const kind = hash(seed, i, 71) < 0.2 ? 'hang' : hash(seed, i, 72) < 0.22 ? 'lengthwise' : hash(seed, i, 73) < 0.25 ? 'folded' : 'across';
      const wpx = rnd.range(14, 40);
      strips.push({
        id: i, s: clamp(cu + rnd.gauss() * 0.014, 0.03, 0.97), wpx, kind,
        over: [rnd.range(2, 14), rnd.range(2, 14)],
        tilt: kind === 'lengthwise' ? Math.PI / 2 + rnd.range(-0.35, 0.35) : rnd.range(-0.75, 0.75),
        off: kind === 'hang' ? (rnd.next() < 0.5 ? 1 : -1) : rnd.range(-0.4, 0.4),
        bend: rnd.range(-0.006, 0.006),
        uv: { x: rnd.range(0.02, 0.86), y: rnd.range(0.03, 0.9), w: rnd.range(0.07, 0.12), h: (wpx / 1024) * rnd.range(0.9, 1.4) },
        knot: kind === 'folded' || rnd.next() < 0.2, fraySeed: rnd.int(1, 1e6), gold: null, role: { kind: 'stay' },
      });
    }
  }

  function assignRoles() {
    const order = strips.map((s) => s.id).filter((i) => {
      const u = strips[i].s;
      // strips lying over the face cavities never leave, nor cover them
      return Math.abs(u - uEye) > 0.03 && Math.abs(u - uSocket) > 0.025 && Math.abs(u - uMouth) > 0.025;
    }).sort((a, b) => hash(seed, a, 81) - hash(seed, b, 81));
    // bunches: [rib, u, count, spread] — deliberately uneven
    const bunches = [[1, 0.24, 6, 0.045], [0, 0.46, 4, 0.03], [3, 0.38, 3, 0.05], [5, 0.2, 3, 0.03], [0, 0.82, 1, 0]];
    let k = 0, b = 0;
    for (const [r, u, count, spread] of bunches) {
      for (let j = 0; j < count; j++) {
        const i = order[k++];
        if (i === undefined) break;
        const rib = ribs[r];
        const uu = clamp(u + (hash(seed, i, 82) - 0.5) * 2 * spread, 0.05, rib.max - 0.02);
        const hang = hash(seed, i, 83) < 0.2;
        strips[i].role = {
          kind: 'rib', rib: r, u: uu, hang, bunch: b,
          a: (hash(seed, i, 84) - 0.5) * 1.9, fold: 0.45 + hash(seed, i, 85) * 0.5,
          start: Math.max(K.cladding[0] + k * 0.11 + hash(seed, i, 86) * 0.2, rib.start + rib.dur * uu * 0.9 + 0.1), dur: 0.5 + hash(seed, i, 87) * 0.35,
        };
      }
      b++;
    }
    // one hammered-gold disc in the first bunch catches the light once
    const goldStrip = strips.find((s) => s.role.kind === 'rib' && s.role.bunch === 0);
    if (goldStrip) goldStrip.gold = { r: 9, psi: 0.58, off: 0.1 };
    return { bunches: bunches.length, migrating: k };
  }

  // Poses: {x, y, a, len, k, lift, wrap, knotted}
  function bodyPose(st, sp) {
    const a = spineAt(sp, st.s);
    const n = [-Math.sin(a.th), Math.cos(a.th)];
    const across = a.th + Math.PI / 2;
    if (st.kind === 'hang') {
      // half on the body, half lying off its edge on the ground
      const h = st.off > 0 ? a.hl : a.hr;
      const c = [a.p[0] + n[0] * h * st.off * 0.85, a.p[1] + n[1] * h * st.off * 0.85];
      return { x: c[0], y: c[1], a: across + (st.tilt >= 0 ? 0.9 : -0.9) + st.tilt * 0.3, len: a.w * 0.55 + 26, k: st.bend * 2, lift: 0, wrap: 0.4 };
    }
    const v = st.off;
    const h = v >= 0 ? a.hl : a.hr;
    const c = [a.p[0] + n[0] * h * v * 0.6, a.p[1] + n[1] * h * v * 0.6];
    if (st.kind === 'lengthwise') return { x: c[0], y: c[1], a: across + st.tilt, len: a.w * 1.05 + st.over[0], k: st.bend, lift: 0, wrap: 0.3 };
    if (st.kind === 'folded') return { x: c[0], y: c[1], a: across + st.tilt, len: a.w * 0.55, k: st.bend * 3, lift: 0, wrap: 0.6, knotted: 1 };
    return { x: c[0], y: c[1], a: across + st.tilt, len: a.w / Math.max(0.55, Math.cos(st.tilt * 0.8)) + st.over[0] + st.over[1], k: st.bend, lift: 0, wrap: 1 };
  }
  function ribPose(st) {
    const r = st.role;
    const { p, a } = ribPoint(r.rib, r.u);
    if (r.hang) {
      // snagged by one end, the rest hanging and lying on the ground
      const ha = a + Math.PI / 2 + (hash(st.id, 88) - 0.5) * 0.5;
      const len = st.wpx * 1.4 + 70;
      return { x: p[0] + Math.cos(ha) * len * 0.42, y: p[1] + Math.sin(ha) * len * 0.42, a: ha, len, k: (hash(st.id, 89) - 0.5) * 0.008, lift: 0, wrap: 0.3, knotted: 0.6 };
    }
    return { x: p[0], y: p[1], a: a + Math.PI / 2 + r.a, len: (st.wpx * 1.2 + 52) * r.fold, k: (hash(st.id, 90) - 0.5) * 0.02, lift: 0, wrap: 0.7, knotted: 1 };
  }
  const angLerp = (a, b, t) => a + ((((b - a + Math.PI) % TAU) + TAU) % TAU - Math.PI) * t;
  const transit = (A, B, p, strip) => {
    const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 1;
    const bow = Math.sin(Math.PI * clamp(p)) * Math.min(90, d * 0.18) * (hash(strip.id, 7) < 0.5 ? -1 : 1);
    return {
      x: lerp(A.x, B.x, p) + (-dy / d) * bow, y: lerp(A.y, B.y, p) + (dx / d) * bow,
      a: angLerp(A.a, B.a, p), len: lerp(A.len, B.len, p), k: lerp(A.k, B.k, p),
      lift: Math.sin(Math.PI * clamp(p)), wrap: lerp(A.wrap, B.wrap, p), knotted: lerp(A.knotted || 0, B.knotted || 0, clamp(p)),
    };
  };
  function stripPose(st, t, sp) {
    const B = bodyPose(st, sp);
    if (st.role.kind !== 'rib') return { ...B, phase: 'body' };
    const p = move(t, st.role.start, st.role.dur, seed * 59 + st.id);
    if (p <= 0) return { ...B, phase: 'body' };
    const R = ribPose(st);
    return { ...transit(B, R, p, st), phase: p >= 1 ? 'rib' : 'transit', p };
  }

  // ------------------------------------------------------------ incisions
  const incisions = Array.from({ length: 8 }, (_, g) => ({
    u: 0.4 + 0.07 * g + rnd.range(-0.02, 0.02),
    off: rnd.range(-0.3, 0.3), ang: rnd.range(0.5, 0.9) * (rnd.next() < 0.5 ? 1 : -1),
    n: rnd.int(4, 7), len: rnd.range(9, 17), t: lerp(K.incise[0], K.incise[1], g / 7) + rnd.range(-0.1, 0.1),
  }));

  // ------------------------------------------------------------ state(t)
  function state(t) {
    const sp = spine(t);
    const cl = clusterAnchor(sp);
    const cellState = cells.map((c) => {
      const ca = Math.cos(cl.th + 0.3), sa = Math.sin(cl.th + 0.3);
      const home = add(cl.c, [c.off[0] * ca - c.off[1] * sa, c.off[0] * sa + c.off[1] * ca]);
      let pos = home, lift = 0, phase = 'home';
      if (c.role) {
        const target = c.role.kind === 'iris' ? bodyPoint(sp, uEye + 8 / sp.L, 0.34) : ribPoint(c.role.rib, c.role.u).p;
        const p = move(t, c.role.start, c.role.dur, seed * 61 + c.id);
        if (p > 0) {
          pos = p >= 1 ? target : [lerp(home[0], target[0], p), lerp(home[1], target[1], p) - Math.sin(Math.PI * clamp(p)) * 30];
          lift = Math.sin(Math.PI * clamp(p)); phase = p >= 1 ? 'placed' : 'transit';
        }
      }
      return { ...c, pos, home, lift, phase };
    });
    const stripState = strips.map((s) => ({ strip: s, pose: stripPose(s, t, sp) }));
    const ribState = ribs.map((r) => ({ ...r, g: ribGrowth(r, t) }));
    const cav = cavities.map((c) => ({ ...c, open: cavityOpen(c, t) }));
    const lidClose = easeInOut(win(t, K.lidClose[0], K.lidClose[1]));
    const membranes = MEMBRANES.map((m, i) => ({ ...m, g: move(t, m.start, m.dur, seed * 67 + i) }));
    return { t, sp, cellState, stripState, ribState, cav, lidClose, net, incisions, membranes, eye: eyeEnds(sp) };
  }

  return {
    state, spine, spineAt, bodyPoint, cavities, creases, seams, ribs, ribPoint, cells, strips, assignRoles,
    uEye, eyeEnds, faceUs: { uEye, uSocket, uMouth },
  };
}
