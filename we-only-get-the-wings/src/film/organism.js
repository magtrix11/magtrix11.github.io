// The organism: one soft body, its painted strips, its ochre cells, the
// face they briefly make, and the ribs/membrane they become.
//
// Identity rule: every strip and cell is created once, with a fixed
// texture window and fixed attributes. Only its pose and role change.
// Nothing is created from nothing and nothing is removed.
//
// All geometry is a pure function of (held) time, so any frame can be
// rendered in isolation. Coordinates are in a 1920x1080 design space.

import { makeRandom, makeNoise1D, hash } from './rng.js';
import { K, clamp, lerp, smooth, easeInOut, settle, win } from './timeline.js';
import { quadPts, resample, truncate, tangentAt } from './draw.js';

const TAU = Math.PI * 2;
const angLerp = (a, b, t) => {
  let d = ((b - a + Math.PI) % TAU + TAU) % TAU - Math.PI;
  return a + d * t;
};
const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
const rot = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];

export const BODY = { L: 1900, N: 140, P0: [110, 868], theta0: -0.34, theta0B: -0.1, R: 180, u0: 0.4 };

export function createOrganism(seed, opts = {}) {
  const pinches = opts.pinches || [];
  const rnd = makeRandom(seed);
  const nzA = makeNoise1D(seed + 1);
  const nzB = makeNoise1D(seed + 2);
  const nzW = makeNoise1D(seed + 3);
  const { L, N } = BODY;
  const ds = L / N;

  // ------------------------------------------------------------ spine
  // Curvature, not position, is animated: the body curls instead of morphing.
  const kappaA = (u) => -0.0023 * Math.sin(TAU * u * 1.2 + 0.5) + 0.0011 * nzA(u * 5);
  const kappaB = (u) => {
    const loop = -(1 / BODY.R) * (1 + 0.34 * nzB(u * 5) + 0.12 * nzB(u * 13 + 40)) - (u > 0.93 ? 0.006 * smooth((u - 0.93) / 0.07) : 0);
    // the tail also reorganises: it settles into a long, low, nearly straight line
    const tailK = -0.00035 + 0.0007 * nzB(u * 6 + 11);
    const m = smooth((u - 0.3) / (BODY.u0 - 0.3));
    return lerp(tailK, loop, m);
  };
  // Reorganisation order: the tail settles first, then the front of the
  // body rolls up from its tip toward the neck (a carpet rolled from the
  // end), which keeps the moving mass inside the frame.
  const coilAt = (u, t) => {
    if (u < BODY.u0) return settle(win(t, K.coil[0], K.coil[0] + 1.1), 0.04);
    const f = (1 - u) / (1 - BODY.u0);
    const a = K.coil[0] + 0.45 + f * 1.15;
    return settle(win(t, a, a + 1.05), 0.05);
  };
  const nzW2 = makeNoise1D(seed + 4);
  const pinchAt = (u) => {
    let m = 0;
    for (const p of pinches) {
      const c = (p.u0 + p.u1) / 2, hw = (p.u1 - p.u0) / 2 + 0.006;
      m = Math.max(m, smooth(1 - Math.abs(u - c) / hw));
    }
    return m;
  };
  const widthAt = (u, t) => {
    // Blunt, frayed ends rather than a tapered (caterpillar) head and tail.
    const taper = (0.5 + 0.5 * smooth(u / 0.06)) * (0.62 + 0.38 * smooth((1 - u) / 0.05)) * (0.86 + 0.14 * u);
    const lumps = 1 + 0.2 * nzW(u * 7) + 0.11 * nzW2(u * 23);
    const breath = 1 + (t < 5.6 ? 0.05 : 0.018) * Math.sin(TAU * t / 1.8 + u * 3);
    return 98 * taper * lumps * (1 - 0.3 * pinchAt(u)) * breath;
  };

  function spine(t) {
    const pts = [], ths = [], ws = [];
    let p = BODY.P0.slice(), th = lerp(BODY.theta0, BODY.theta0B, coilAt(0, t));
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      pts.push(p.slice()); ths.push(th); ws.push(widthAt(u, t));
      const um = (i + 0.5) / N;
      const c = coilAt(um, t);
      th += lerp(kappaA(um), kappaB(um), c) * ds;
      p = [p[0] + Math.cos(th) * ds, p[1] + Math.sin(th) * ds];
    }
    const left = [], right = [];
    for (let i = 0; i <= N; i++) {
      const n = [-Math.sin(ths[i]), Math.cos(ths[i])];
      left.push([pts[i][0] + n[0] * ws[i] / 2, pts[i][1] + n[1] * ws[i] / 2]);
      right.push([pts[i][0] - n[0] * ws[i] / 2, pts[i][1] - n[1] * ws[i] / 2]);
    }
    return { pts, ths, ws, left, right };
  }
  const spineAt = (sp, u) => {
    const f = clamp(u) * N, i = Math.min(N - 1, Math.floor(f)), r = f - i;
    return {
      p: [lerp(sp.pts[i][0], sp.pts[i + 1][0], r), lerp(sp.pts[i][1], sp.pts[i + 1][1], r)],
      th: angLerp(sp.ths[i], sp.ths[i + 1], r),
      w: lerp(sp.ws[i], sp.ws[i + 1], r),
    };
  };

  // ------------------------------------------------------------ face layout
  const finalSp = spine(10);
  // Interior centre of the loop: bbox centre of the looped part of the spine.
  const loopPts = finalSp.pts.slice(Math.round(0.4 * N));
  const lx = loopPts.map((q) => q[0]), ly = loopPts.map((q) => q[1]);
  let C = [(Math.min(...lx) + Math.max(...lx)) / 2, (Math.min(...ly) + Math.max(...ly)) / 2];
  const tilt = -0.1;
  const E1 = add(C, [4, -34]);
  const at1 = (x, y) => add(E1, rot([x, y], tilt));
  const eye = {
    E1, tilt,
    I: at1(-104, 10), O: at1(102, -6),
    U: at1(-4, -84), Lc: at1(10, 64),
    irisR: 34,
  };
  eye.upper = quadPts(eye.I, eye.U, eye.O, 28);
  eye.lower = quadPts(eye.I, eye.Lc, eye.O, 28);
  const E2 = add(C, [-78, 58]);
  const eye2 = { E2, arc: quadPts(add(E2, [-26, -3]), add(E2, [-1, 15]), add(E2, [23, -8]), 12) };
  const mouth = { M: add(C, [18, 66]) };

  // ------------------------------------------------------------ ribs
  // Rib 0 is the thread itself, continuing past the outer corner of the eye.
  const lowerTan = tangentAt(eye.lower, eye.lower.length - 1);
  const a0 = eye.tilt + 0.02 + 0 * lowerTan[0];
  const ribSpec = [
    { da: 0.0, len: 820, root: 1.0 },
    { da: -0.31, len: 860, root: 0.93 },
    { da: -0.6, len: 730, root: 0.86 },
    { da: -0.86, len: 470, root: 0.8 },
    { da: -1.1, len: 330, root: 0.74 },
    { da: -1.36, len: 235, root: 0.69 },
  ];
  const ribs = ribSpec.map((rs, r) => {
    const rootPt = r === 0 ? eye.O : eye.upper[Math.round(rs.root * (eye.upper.length - 1))];
    let h = a0 + rs.da + rnd.range(-0.05, 0.05);
    const len = rs.len * rnd.range(0.94, 1.06);
    const n = 44, step = len / n;
    const pts = [rootPt.slice()];
    let p = rootPt.slice();
    const nz = makeNoise1D(seed + 50 + r);
    for (let i = 0; i < n; i++) {
      const u = i / n;
      h += (0.00045 + 0.0026 * Math.pow(u, 2.2) + 0.0009 * nz(u * 4)) * step;
      p = [p[0] + Math.cos(h) * step, p[1] + Math.sin(h) * step];
      pts.push(p);
    }
    return { pts, len, start: K.ribs[0] + r * 0.2 + (r === 0 ? -0.15 : 0), dur: 1.25 };
  });
  // Two short, hesitant ribs on the other side: bilateral suggestion only.
  const ribsOpp = [
    { a: -2.55, len: 175 }, { a: -2.95, len: 118 },
  ].map((o, j) => {
    const pts = [eye.I.slice()];
    let p = eye.I.slice(), h = o.a;
    const n = 20, step = o.len / n;
    for (let i = 0; i < n; i++) { h -= (0.0012 + 0.003 * (i / n)) * step; p = [p[0] + Math.cos(h) * step, p[1] + Math.sin(h) * step]; pts.push(p); }
    return { pts, len: o.len, start: K.ribs[0] + 1.1 + j * 0.35, dur: 0.9 };
  });
  const ribGrowth = (rib, t) => {
    const raw = easeInOut(win(t, rib.start, rib.start + rib.dur));
    const q = raw >= 1 ? 1 : Math.floor(raw * 7) / 7;
    return q;
  };
  // Cross wires (cage) between neighbouring ribs, late and sparse.
  const crossWires = [[1, 0.46, 0.5], [2, 0.62, 0.58], [3, 0.38, 0.44], [0, 0.7, 0.66]].map(([r, ua, ub], j) => ({
    r, ua, ub, start: K.ribs[1] - 0.2 + j * 0.18,
  }));

  // ------------------------------------------------------------ cells
  const cells = [];
  const radii = [30, 13, 22, 20, 19, 17, 16, 24, 15, 14, 12, 18, 11, 10, 13, 9];
  for (let i = 0; i < radii.length; i++) {
    const r = radii[i];
    let best = null;
    for (let tries = 0; tries < 400; tries++) {
      const ang = rnd.range(0, TAU), d = i === 0 ? 0 : rnd.range(10, 72);
      const q = [Math.cos(ang) * d * 1.25, Math.sin(ang) * d * 0.85];
      const ok = cells.every((c) => Math.hypot(c.off[0] - q[0], c.off[1] - q[1]) > (c.r + r) * 0.82);
      if (ok) { best = q; break; }
    }
    cells.push({ id: i, r, off: best || [rnd.range(-60, 60), rnd.range(-40, 40)], seed: rnd.int(1, 1e6) });
  }
  const net = [];
  for (let i = 0; i < cells.length; i++) for (let j = i + 1; j < cells.length; j++) {
    const d = Math.hypot(cells[i].off[0] - cells[j].off[0], cells[i].off[1] - cells[j].off[1]);
    if (d < (cells[i].r + cells[j].r) * 1.12) net.push({ i, j, w: rnd.range(1.2, 2.6), sag: rnd.range(-0.3, 0.3) });
  }
  // Roles: 0 -> iris, 1 -> second eye, 2..6 -> rib joints, rest stay.
  cells[0].role = { kind: 'iris', start: 4.45, dur: 0.75 };
  cells[1].role = { kind: 'eye2', start: 4.75, dur: 0.6 };
  [2, 3, 4, 5, 6].forEach((ci, k) => {
    const r = k + 1;
    cells[ci].role = { kind: 'joint', rib: r, u: [0.34, 0.46, 0.3, 0.52, 0.4][k], start: 0, dur: 0.65 };
    const rib = ribs[r];
    cells[ci].role.start = Math.max(K.joints[0] + k * 0.3, rib.start + rib.dur * cells[ci].role.u + 0.1);
  });
  const clusterAnchor = (sp) => {
    const a = spineAt(sp, 0.1);
    const n = [-Math.sin(a.th), Math.cos(a.th)];
    return { c: add(a.p, [n[0] * -(a.w / 2 + 40), n[1] * -(a.w / 2 + 40)]), th: a.th };
  };

  // ------------------------------------------------------------ strips
  const NS = 28;
  const strips = [];
  // Strips gather in irregular clusters with bare stretches between them,
  // overlap, and sometimes run lengthwise (not evenly spaced bands).
  const centres = [0.07, 0.19, 0.29, 0.44, 0.57, 0.69, 0.81, 0.93];
  for (let i = 0; i < NS; i++) {
    const c = centres[i % centres.length];
    const u = clamp(c + rnd.gauss() * 0.016, 0.04, 0.97);
    const wpx = rnd.range(16, 42);
    const lengthwise = rnd.next() < 0.18;
    const long = rnd.next() < 0.3;
    strips.push({
      id: i, s: u, wpx,
      over: [rnd.range(2, 16) + (long ? rnd.range(20, 55) : 0), rnd.range(2, 16)],
      tilt: lengthwise ? Math.PI / 2 + rnd.range(-0.25, 0.25) : rnd.range(-0.5, 0.5),
      lengthwise, off: rnd.range(-12, 12),
      bend: rnd.range(-0.005, 0.005),
      uv: { x: rnd.range(0.02, 0.86), y: rnd.range(0.03, 0.9), w: rnd.range(0.07, 0.12), h: (wpx / 1024) * rnd.range(0.9, 1.4) },
      knot: rnd.next() < 0.4, knotSide: rnd.next() < 0.5 ? 0 : 1,
      fraySeed: rnd.int(1, 1e6), gold: null, role: { kind: 'stay' },
    });
  }

  function assignRoles(meanOf) {
    // Choose face roles by the strip's actual painted colour, so the eyelid
    // is the palest-pink fragment, the mouth the reddest, etc.
    const col = strips.map((st) => meanOf(st.uv));
    const score = (f) => strips.map((st, i) => [i, f(col[i])]).sort((a, b) => b[1] - a[1]).map((x) => x[0]);
    const used = new Set();
    const take = (order, avoidHead = false) => {
      for (const i of order) {
        if (used.has(i)) continue;
        if (avoidHead && strips[i].s > 0.9) continue;
        used.add(i); return i;
      }
    };
    // the eyelid: the most pink/coral fragment, so the closing reads clearly
    const lid = take(score(([r, g, b]) => r - g * 1.1 + b * 0.35 + (r + g + b) / 12));
    const mouth = take(score(([r, g, b]) => r - (g + b) * 0.6));
    const ring = take(score(([r, g, b]) => b - (r + g) * 0.5));
    const cover = take(score(([r, g, b]) => b - r * 0.7));
    const cheek = take(score(([r, g, b]) => (r + g) * 0.5 - b));
    strips[lid].role = { kind: 'lid', start: 4.95, dur: 0.7 };
    strips[mouth].role = { kind: 'mouth', start: 4.6, dur: 0.7 };
    strips[ring].role = { kind: 'ring', start: 4.8, dur: 0.75 };
    strips[cover].role = { kind: 'cover', start: 5.25, dur: 0.6, rib: 2, u: 0.66, start2: 7.95, dur2: 0.7 };
    strips[cheek].role = { kind: 'cheek', start: 4.85, dur: 0.6, rib: 4, u: 0.5, start2: 8.3, dur2: 0.6 };
    // About half of the rest migrate onto ribs; the others keep the body clothed.
    const rest = strips.map((_, i) => i).filter((i) => !used.has(i));
    const ribSlots = [
      [0, 0.1], [0, 0.2], [0, 0.34], [1, 0.08], [1, 0.16], [1, 0.3], [1, 0.52], [2, 0.12], [2, 0.24],
      [2, 0.44], [3, 0.14], [3, 0.3], [4, 0.2], [5, 0.26], [0, 0.6], [3, 0.62],
    ];
    const order = rest.slice().sort((a, b) => hash(seed, a) - hash(seed, b));
    ribSlots.forEach(([r, u], k) => {
      const i = order[k];
      if (i === undefined) return;
      const rib = ribs[r];
      const ready = rib.start + rib.dur * u;
      strips[i].role = { kind: 'rib', rib: r, u, start: Math.max(K.cladding[0] + k * 0.13, ready), dur: 0.6 };
    });
    // Hammered gold discs sewn onto three strips (one will catch the light).
    const golds = order.slice(0, 3);
    golds.forEach((i, k) => { strips[i].gold = { r: [9.5, 6, 5.5][k], psi: [0.58, 1.25, -0.15][k], off: rnd.range(-0.25, 0.25) }; });
    return { lid, mouth, ring, cover, cheek };
  }

  // Poses: {x, y, a, len, k, lift, wrap}
  function bodyPose(st, sp) {
    const a = spineAt(sp, st.s);
    const n = [-Math.sin(a.th), Math.cos(a.th)];
    return {
      x: a.p[0] + n[0] * st.off, y: a.p[1] + n[1] * st.off,
      a: a.th + Math.PI / 2 + st.tilt, len: st.lengthwise ? a.w * 1.1 + st.over[0] : a.w / Math.cos(st.tilt * 0.8) + st.over[0] + st.over[1],
      k: st.bend, lift: 0, wrap: 1,
    };
  }
  function ribPoint(r, u) {
    const rib = ribs[r];
    const i = Math.round(u * (rib.pts.length - 1));
    const tg = tangentAt(rib.pts, i);
    return { p: rib.pts[i], a: Math.atan2(tg[1], tg[0]) };
  }
  function ribPose(st, r, u) {
    const { p, a } = ribPoint(r, u);
    return { x: p[0], y: p[1], a: a + Math.PI / 2 + st.tilt * 0.5, len: (st.wpx * 1.3 + 38), k: 0, lift: 0, wrap: 0.8, knotted: 1 };
  }
  function facePose(st) {
    const E1 = eye.E1;
    switch (st.role.kind) {
      case 'lid': {
        const mid = eye.upper[14];
        return { x: mid[0], y: mid[1] + st.wpx * 0.35, a: eye.tilt, len: 190, k: 1 / 150, lift: 0, wrap: 0.2 };
      }
      case 'ring': {
        const mid = add(E1, rot([0, eye.irisR + 8], eye.tilt));
        return { x: mid[0], y: mid[1], a: eye.tilt, len: TAU * (eye.irisR + 8) * 0.8, k: -1 / (eye.irisR + 8), lift: 0, wrap: 0.1 };
      }
      case 'mouth': return { x: mouth.M[0], y: mouth.M[1], a: -0.08, len: 92, k: 0.006, lift: 0, wrap: 0.2 };
      case 'cover': return { x: mouth.M[0] + 30, y: mouth.M[1] + 6, a: 0.3, len: 84, k: -0.003, lift: 0, wrap: 0.3 };
      case 'cheek': return { x: eye2.E2[0] + 2, y: eye2.E2[1] + 12, a: 0.2, len: 64, k: 0.006, lift: 0, wrap: 0.2 };
      default: return null;
    }
  }
  const transit = (A, B, p, strip) => {
    // Lifted, bowed path between two placements (hand-carried, not morphed).
    const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 1;
    const bow = Math.sin(Math.PI * p) * Math.min(90, d * 0.18) * (hash(strip.id, 7) < 0.5 ? -1 : 1);
    return {
      x: lerp(A.x, B.x, p) + (-dy / d) * bow, y: lerp(A.y, B.y, p) + (dx / d) * bow,
      a: angLerp(A.a, B.a, p), len: lerp(A.len, B.len, p), k: lerp(A.k, B.k, p),
      lift: Math.sin(Math.PI * clamp(p)), wrap: lerp(A.wrap, B.wrap, p), knotted: lerp(A.knotted || 0, B.knotted || 0, p),
    };
  };
  function stripPose(st, t, sp) {
    const role = st.role;
    const B = bodyPose(st, sp);
    if (role.kind === 'stay') return { ...B, phase: 'body' };
    if (role.kind === 'rib') {
      const p = settle(win(t, role.start, role.start + role.dur));
      if (p <= 0) return { ...B, phase: 'body' };
      const R = ribPose(st, role.rib, role.u);
      return { ...transit(B, R, p, st), phase: p >= 1 ? 'rib' : 'transit', p };
    }
    const F = facePose(st);
    const p1 = settle(win(t, role.start, role.start + role.dur));
    if (p1 <= 0) return { ...B, phase: 'body' };
    if (p1 < 1) return { ...transit(B, F, p1, st), phase: 'transit', p: p1 };
    if (role.start2 !== undefined) {
      const p2 = settle(win(t, role.start2, role.start2 + role.dur2));
      if (p2 > 0) {
        const R = ribPose(st, role.rib, role.u);
        return { ...transit(F, R, p2, st), phase: p2 >= 1 ? 'rib' : 'transit', p: p2 };
      }
    }
    return { ...F, phase: 'face' };
  }

  // ------------------------------------------------------------ incisions
  const incisions = Array.from({ length: 9 }, (_, g) => ({
    u: 0.44 + 0.055 * g + rnd.range(-0.02, 0.02),
    off: rnd.range(-0.28, 0.28), ang: rnd.range(0.5, 0.9) * (rnd.next() < 0.5 ? 1 : -1),
    n: rnd.int(4, 7), len: rnd.range(9, 17), t: lerp(K.incise[0], K.incise[1], g / 8) + rnd.range(-0.1, 0.1),
  }));

  // ------------------------------------------------------------ state(t)
  function state(t) {
    const sp = spine(t);
    const cl = clusterAnchor(sp);
    const cellState = cells.map((c) => {
      const home = add(cl.c, rot(c.off, cl.th + 0.3));
      let pos = home, lift = 0, phase = 'home';
      if (c.role) {
        let target;
        if (c.role.kind === 'iris') target = eye.E1;
        else if (c.role.kind === 'eye2') target = add(eye2.E2, [0, -4]);
        else target = ribPoint(c.role.rib, c.role.u).p;
        const p = settle(win(t, c.role.start, c.role.start + c.role.dur));
        if (p > 0) {
          pos = [lerp(home[0], target[0], p), lerp(home[1], target[1], p) - Math.sin(Math.PI * p) * 30];
          lift = Math.sin(Math.PI * p); phase = p >= 1 ? 'placed' : 'transit';
        }
      }
      return { ...c, pos, home, lift, phase };
    });
    const stripState = strips.map((s) => ({ strip: s, pose: stripPose(s, t, sp) }));
    const ribState = ribs.map((r) => ({ ...r, g: ribGrowth(r, t) }));
    const ribOppState = ribsOpp.map((r) => ({ ...r, g: ribGrowth(r, t) }));
    const lidClose = easeInOut(win(t, K.lidClose[0], K.lidClose[1]));
    const eyeVis = win(t, 3.9, 4.6); // thread outline arriving
    return { t, sp, cellState, stripState, ribState, ribOppState, lidClose, eyeVis, net, incisions, crossWires };
  }

  return {
    state, spine, spineAt, eye, eye2, mouth, ribs, ribsOpp, cells, strips, assignRoles, C,
  };
}
