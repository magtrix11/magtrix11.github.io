// The thread: one object for the whole study. It is simultaneously
//   route     — enters from the frame edge and crosses the ground
//   data path — during reorganisation the route snaps to an orthogonal lattice
//   seam      — runs through the body as a running stitch
//   root/nerve— branches out of the head, then leaves its rootlets behind
//   eyelid    — stitches the lid cavity shut (drawn with the cavity)
//   rib       — is drawn back out of the body to the closed eye and keeps
//               going past its outer end as rib 0; the stitch holes it
//               leaves along the body remain
// Geometry is a pure function of held time.

import { makeRandom, makeNoise1D, hash } from './rng.js';
import { K, clamp, lerp, easeInOut, settle, win, move } from './timeline.js';
import { resample, lerpPts, quadPts, truncate, polyLength, tangentAt } from './draw.js';

const NR = 120; // route resolution
const NT = 90;  // tail resolution

export function createThread(seed, org) {
  const rnd = makeRandom(seed ^ 0x7e4d);
  const nz = makeNoise1D(seed + 91);
  const entry = [-40, 1010];

  // Meandering route across the ground from the frame edge to the tail.
  function meander(to, seedOff, loop) {
    const r = makeRandom(seed + seedOff);
    const ctrl = [entry];
    const n = 6;
    for (let i = 1; i < n; i++) {
      const f = i / n;
      ctrl.push([lerp(entry[0], to[0], f) + r.range(-60, 60), lerp(entry[1], to[1], f) + r.range(-30, 70) + Math.sin(f * Math.PI) * 60]);
    }
    ctrl.push(to);
    // Catmull-Rom through the controls.
    const pts = [];
    for (let i = 0; i < ctrl.length - 1; i++) {
      const p0 = ctrl[Math.max(0, i - 1)], p1 = ctrl[i], p2 = ctrl[i + 1], p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
      for (let k = 0; k < 16; k++) {
        const t = k / 16, t2 = t * t, t3 = t2 * t;
        pts.push([0, 1].map((d) => 0.5 * ((2 * p1[d]) + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3)));
      }
    }
    pts.push(to);
    if (loop) {
      // The thread does not snap: it slackens, loops once, changes direction.
      const k = Math.round(pts.length * 0.55);
      const c = pts[k], tg = tangentAt(pts, k);
      const R = 24, loopPts = [];
      const nrm = [-tg[1], tg[0]];
      const centre = [c[0] + nrm[0] * R, c[1] + nrm[1] * R];
      const a0 = Math.atan2(c[1] - centre[1], c[0] - centre[0]);
      for (let j = 1; j <= 22; j++) {
        const a = a0 + (j / 22) * Math.PI * 2 * 1.05;
        loopPts.push([centre[0] + Math.cos(a) * R * (1 + 0.12 * Math.sin(j)), centre[1] + Math.sin(a) * R]);
      }
      pts.splice(k + 1, 0, ...loopPts);
    }
    return resample(pts, NR);
  }

  // Tail end of the seam (neck of the thread at the body's tail).
  const sp0 = org.spine(0);
  const routeEnd = sp0.pts[2];
  const routeA = meander(routeEnd, 11, false);
  const routeB = meander(routeEnd, 12, true);
  const straight = resample([entry, routeEnd], NR);

  function quantise(pts, grid, seedStep) {
    const out = [];
    let prev = null;
    for (let i = 0; i < pts.length; i += 3) {
      const q = [Math.round(pts[i][0] / grid) * grid, Math.round(pts[i][1] / grid) * grid];
      if (prev) {
        // orthogonal routing: horizontal first or vertical first, per segment
        if (hash(seedStep, i) < 0.5) out.push([q[0], prev[1]]); else out.push([prev[0], q[1]]);
      }
      out.push(q); prev = q;
    }
    out.push(pts[pts.length - 1]);
    return out;
  }

  function route(t, step) {
    let pts;
    const tau = easeInOut(win(t, K.taut[0], K.taut[1]));
    const re = settle(win(t, K.reroute[0], K.reroute[1]));
    if (t < K.taut[0]) pts = routeA;
    else if (t < K.reroute[0]) {
      pts = lerpPts(routeA, straight, tau);
      if (t >= K.tautHold[0]) {
        // Vibration at the limit: tiny, held-step jitter across the chord.
        const amp = 2.2;
        pts = pts.map((p, i) => {
          const s = Math.sin((i / (NR - 1)) * Math.PI);
          const j = (hash(step, 3) - 0.5) * 2 * amp * s;
          return [p[0] + j * 0.45, p[1] + j];
        });
      }
    } else pts = lerpPts(straight, routeB, re);

    // Data-path phase: the route snaps to an orthogonal lattice, segment by
    // segment, flickering on at held steps before settling fully stepped.
    const qOn = win(t, K.routeStepOn[0], K.routeStepOn[1]);
    const qOff = t >= K.taut[0];
    let stepped = false;
    if (qOn > 0 && !qOff) stepped = hash(step, 17) < 0.25 + qOn * 0.9;
    return { pts, stepped, steppedPts: stepped ? quantise(pts, 10, step) : null };
  }

  // Seam along the body centreline with a small wander, up to uEnd.
  function seam(sp, uEnd) {
    const out = [];
    const N = sp.pts.length - 1;
    const iEnd = Math.min(N - 2, Math.round(uEnd * N));
    for (let i = 2; i <= iEnd; i++) {
      const n = [-Math.sin(sp.ths[i]), Math.cos(sp.ths[i])];
      const w = nz(i * 0.21) * sp.ws[i] * 0.07;
      out.push([sp.pts[i][0] + n[0] * w, sp.pts[i][1] + n[1] * w]);
    }
    return out;
  }
  // Where the thread has been pulled out, its stitch holes stay.
  function holes(sp, uEnd) {
    const out = [];
    const N = sp.pts.length - 1;
    for (let i = Math.round(uEnd * N) + 1; i <= N - 2; i++) {
      const n = [-Math.sin(sp.ths[i]), Math.cos(sp.ths[i])];
      const w = nz(i * 0.21) * sp.ws[i] * 0.07;
      out.push([sp.pts[i][0] + n[0] * w, sp.pts[i][1] + n[1] * w, sp.ths[i], i]);
    }
    return out;
  }

  // Root: beyond the head, curling, with rootlets (P18, P21, P36).
  function rootPath(sp) {
    const head = sp.pts[sp.pts.length - 1];
    let th = sp.ths[sp.ths.length - 1];
    const pts = [head.slice()];
    let p = head.slice();
    const n = 40, len = 230;
    for (let i = 0; i < n; i++) {
      th += 0.05 * Math.sin(i * 0.3) + 0.02;
      p = [p[0] + Math.cos(th) * (len / n), p[1] + Math.sin(th) * (len / n)];
      pts.push(p);
    }
    return pts;
  }
  const rootletSpec = [0.3, 0.48, 0.66, 0.8, 0.93].map((f, k) => ({
    f, side: k % 2 ? 1 : -1, len: rnd.range(40, 120), seed: rnd.int(1, 1e6),
  }));
  function rootlets(root) {
    const out = [];
    for (const r of rootletSpec) {
      const i = Math.round(r.f * (root.length - 1));
      const tg = tangentAt(root, i);
      let th = Math.atan2(tg[1], tg[0]) + r.side * 0.7;
      let p = root[i].slice();
      const rr = makeRandom(r.seed);
      const main = [p.slice()];
      for (let j = 0; j < 14; j++) {
        th += rr.range(-0.3, 0.3);
        p = [p[0] + Math.cos(th) * r.len / 14, p[1] + Math.sin(th) * r.len / 14];
        main.push(p);
      }
      out.push(main);
      const bi = rr.int(4, 9);
      let q = main[bi].slice(), bth = th - r.side * 0.9;
      const sub = [q.slice()];
      for (let j = 0; j < 7; j++) { bth += rr.range(-0.35, 0.35); q = [q[0] + Math.cos(bth) * 6, q[1] + Math.sin(bth) * 6]; sub.push(q); }
      out.push(sub);
    }
    return out;
  }
  const frozenRootlets = rootlets(rootPath(org.spine(K.rootDetach)));

  function state(t, step, orgState) {
    const sp = orgState.sp;
    const r = route(t, step);
    // the route's far end follows the tail as the body shifts
    const end = sp.pts[2], d = [end[0] - routeEnd[0], end[1] - routeEnd[1]];
    const shift = (pts) => pts && pts.map((q, i) => [q[0] + d[0] * (i / (pts.length - 1)), q[1] + d[1] * (i / (pts.length - 1))]);
    r.pts = shift(r.pts);
    if (r.steppedPts) r.steppedPts = shift(r.steppedPts);
    // pulling the thread back to the eye: first the root, then the seam
    const pull = clamp(move(t, K.pull[0], K.pull[1], seed * 71));
    const eyeOutU = org.uEye + orgState.eye.du;
    const uEnd = pull < 0.3 ? 0.985 : lerp(0.985, eyeOutU, (pull - 0.3) / 0.7);
    const sm = seam(sp, uEnd);
    let root = null, attached = null;
    if (pull < 0.3) {
      root = rootPath(sp);
      if (pull > 0) root = truncate(root, 1 - pull / 0.3);
      if (t < K.rootDetach) attached = rootlets(rootPath(sp));
    }
    let rib0 = null;
    if (pull >= 1 && orgState.ribState[0].g > 0) {
      const ribPts = truncate(org.ribs[0].pts, orgState.ribState[0].g);
      rib0 = [orgState.eye.outer, ...ribPts.slice(1)];
    }
    const full = [...r.pts, ...sm, ...(root || []), ...(rib0 || [])];
    return {
      route: r, seam: sm, holes: holes(sp, uEnd), root, rib0, full,
      looseRootlets: t >= K.rootDetach ? frozenRootlets : null, attachedRootlets: attached, uEnd, pull,
    };
  }

  return { state, entry };
}
