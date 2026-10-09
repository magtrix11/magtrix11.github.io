// Revision 3 drawing: the body in overlapping layers, its creases, seams
// and cavities; irregular ribs; membranes stretched between attachments.
// Design-space coordinates; the caller sets the view transform.

import { hash } from './rng.js';
import { clamp, lerp } from './timeline.js';
import { texRibbon, ribbonPath, polyline, truncate, tangentAt } from './draw.js';
import { strokeThread, drawFringe } from './render.js';

const TAU = Math.PI * 2;
const THREAD = '#3a1618';

// ---------------------------------------------------------------- body
// One layer of the body. Its shadow falls on the ground and on any earlier
// (lower) layer it overlaps, but not on its immediate neighbours along the
// body, so the body does not shade itself into bands.
export function drawBodyChunk(ctx, cloth, sp, i0, i1, clothMeans, light, px) {
  const n = sp.pts.length;
  const left = sp.left.slice(i0, i1 + 1), right = sp.right.slice(i0, i1 + 1);
  ctx.save();
  ctx.beginPath();
  ctx.rect(-2000, -2000, 6000, 6000);
  const a = Math.max(0, i0 - 9), b = Math.min(n - 1, i1 + 9);
  const nl = sp.left.slice(a, b + 1), nr = sp.right.slice(a, b + 1);
  ctx.moveTo(nl[0][0], nl[0][1]);
  for (const q of nl) ctx.lineTo(q[0], q[1]);
  for (let i = nr.length - 1; i >= 0; i--) ctx.lineTo(nr[i][0], nr[i][1]);
  ctx.closePath();
  ctx.clip('evenodd');
  ctx.shadowColor = 'rgba(26,12,18,0.55)';
  ctx.shadowBlur = 18 * px;
  ctx.shadowOffsetX = Math.cos(light.dir) * 10 * px;
  ctx.shadowOffsetY = Math.sin(light.dir) * 10 * px;
  ctx.fillStyle = 'rgb(110,70,72)';
  ribbonPath(ctx, left, right);
  ctx.fill();
  ctx.restore();
  drawFringe(ctx, sp, clothMeans, i0, i1);
  const W = cloth.width, H = cloth.height;
  const uvs = [];
  for (let i = i0; i <= i1; i++) uvs.push([(i / (n - 1)) * (W - 1), 0, H - 1]);
  texRibbon(ctx, cloth, left, right, uvs);
  // lifted edge: a thin lit rim where the edge faces the light, a dark
  // underside where it faces away
  const lx = -Math.cos(light.dir), ly = -Math.sin(light.dir);
  ctx.save();
  ctx.lineWidth = 1.3;
  for (const [edge, sign] of [[left, 1], [right, -1]]) {
    for (let i = 1; i < edge.length; i++) {
      const gi = i0 + i;
      const nrm = [-Math.sin(sp.ths[gi]) * sign, Math.cos(sp.ths[gi]) * sign];
      const f = nrm[0] * lx + nrm[1] * ly;
      ctx.strokeStyle = f > 0 ? `rgba(255,244,232,${0.35 * f})` : `rgba(30,10,16,${-0.45 * f})`;
      ctx.beginPath(); ctx.moveTo(edge[i - 1][0], edge[i - 1][1]); ctx.lineTo(edge[i][0], edge[i][1]); ctx.stroke();
    }
  }
  ctx.restore();
}

// Creases: deeper where the body is bent or compressed.
export function drawCreases(ctx, org, sp, i0, i1, light) {
  const n = sp.pts.length - 1;
  ctx.save();
  ctx.lineCap = 'round';
  for (const c of org.creases) {
    const i = Math.round(c.u * n);
    if (i < i0 || i > i1 || i < 2 || i > n - 2) continue;
    const bendHere = Math.abs(sp.ths[i + 2] - sp.ths[i - 2]);
    const a = clamp(c.base * (0.35 + bendHere * 3) * sp.compression);
    if (a < 0.04) continue;
    const L = org.bodyPoint(sp, c.u, c.side * c.span), R = org.bodyPoint(sp, c.u, -c.side * 0.9);
    const tg = [Math.cos(sp.ths[i]), Math.sin(sp.ths[i])];
    const w = sp.ws[i];
    const m = [(L[0] + R[0]) / 2 + tg[0] * c.bend * w, (L[1] + R[1]) / 2 + tg[1] * c.bend * w];
    ctx.strokeStyle = `rgba(28,8,14,${0.55 * a})`; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(L[0], L[1]); ctx.quadraticCurveTo(m[0], m[1], R[0], R[1]); ctx.stroke();
    const o = [-Math.cos(light.dir) * 1.6, -Math.sin(light.dir) * 1.6];
    ctx.strokeStyle = `rgba(255,240,228,${0.4 * a})`; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(L[0] + o[0], L[1] + o[1]); ctx.quadraticCurveTo(m[0] + o[0], m[1] + o[1], R[0] + o[0], R[1] + o[1]); ctx.stroke();
  }
  ctx.restore();
}

// Exposed seams: a dark gap along the body crossed by stitches.
export function drawExposedSeams(ctx, org, sp, i0, i1) {
  const n = sp.pts.length - 1;
  for (const s of org.seams) {
    const a = Math.round(s.u0 * n), b = Math.round(s.u1 * n);
    if (b < i0 || a > i1) continue;
    const pts = [];
    for (let i = Math.max(a, i0); i <= Math.min(b, i1); i++) pts.push(org.bodyPoint(sp, i / n, s.v));
    if (pts.length < 2) continue;
    ctx.save();
    ctx.strokeStyle = 'rgba(24,8,12,0.75)'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
    polyline(ctx, pts); ctx.stroke();
    ctx.strokeStyle = THREAD; ctx.lineWidth = 1.4;
    for (let j = 0; j < pts.length; j += 1) {
      const tg = tangentAt(pts, j), nn = [-tg[1], tg[0]];
      const sk = (hash(j, 41, a) - 0.5) * 3;
      ctx.beginPath(); ctx.moveTo(pts[j][0] - nn[0] * 6 + tg[0] * sk, pts[j][1] - nn[1] * 6 + tg[1] * sk);
      ctx.lineTo(pts[j][0] + nn[0] * 6 - tg[0] * sk, pts[j][1] + nn[1] * 6 - tg[1] * sk); ctx.stroke();
    }
    ctx.restore();
  }
}

// Needle holes where the thread has been drawn out.
export function drawHoles(ctx, holes, i0, i1) {
  ctx.save();
  for (const [x, y, th, i] of holes) {
    if (i < i0 || i > i1 || i % 3) continue;
    const tg = [Math.cos(th), Math.sin(th)];
    for (const s of [-1, 1]) {
      const px = x + tg[0] * s * 3, py = y + tg[1] * s * 3;
      ctx.fillStyle = 'rgba(245,235,222,0.35)';
      ctx.beginPath(); ctx.arc(px - 0.6, py - 0.6, 1.8, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(28,8,12,0.8)';
      ctx.beginPath(); ctx.arc(px, py, 1.2, 0, TAU); ctx.fill();
    }
  }
  ctx.restore();
}

// ---------------------------------------------------------------- cavities
export function cavityShape(cav, org, sp, nseg = 16) {
  const upper = [], lower = [], centre = [], ths = [];
  for (let j = 0; j <= nseg; j++) {
    const f = j / nseg;
    const u = cav.u + (f - 0.5) * cav.len / sp.L;
    const c = org.bodyPoint(sp, u, cav.v);
    const a = org.spineAt(sp, u);
    const n = [-Math.sin(a.th), Math.cos(a.th)];
    const jag = 1 + (hash(j, 17, Math.round(cav.u * 1000)) - 0.5) * 0.35;
    const h = (cav.wid / 2) * Math.max(0, cav.open) * Math.pow(Math.sin(Math.PI * f), 0.75) * jag;
    const sk = (f - 0.5) * cav.wid * 0.15;
    upper.push([c[0] + n[0] * (h + sk * 0.2), c[1] + n[1] * (h + sk * 0.2)]);
    lower.push([c[0] - n[0] * h * 0.85, c[1] - n[1] * h * 0.85]);
    centre.push(c); ths.push(a.th);
  }
  return { upper, lower, centre, ths };
}

export function drawCavity(ctx, cav, org, sp, interiors, opts = {}) {
  const g = cavityShape(cav, org, sp);
  const mid = Math.floor(g.centre.length / 2);
  const c = g.centre[mid], th = g.ths[mid];
  const open = cav.open;
  ctx.save();
  if (open > 0.03) {
    const poly = [...g.upper, ...g.lower.slice().reverse()];
    ctx.save();
    polyline(ctx, poly); ctx.closePath(); ctx.clip();
    // the other material beneath the painted skin
    const tex = interiors[cav.interior] || interiors.dark;
    ctx.save();
    ctx.translate(c[0], c[1]); ctx.rotate(th);
    ctx.drawImage(tex, -cav.len * 0.65, -cav.wid * 0.8, cav.len * 1.3, cav.wid * 1.6);
    ctx.restore();
    // depth: dark under the upper lip, falling off toward the lower
    const n = [-Math.sin(th), Math.cos(th)];
    const gr = ctx.createLinearGradient(c[0] + n[0] * cav.wid * 0.5, c[1] + n[1] * cav.wid * 0.5, c[0] - n[0] * cav.wid * 0.5, c[1] - n[1] * cav.wid * 0.5);
    gr.addColorStop(0, 'rgba(14,4,8,0.85)'); gr.addColorStop(0.55, 'rgba(14,4,8,0.35)'); gr.addColorStop(1, 'rgba(14,4,8,0.15)');
    ctx.fillStyle = gr; ctx.fillRect(c[0] - cav.len, c[1] - cav.len, cav.len * 2, cav.len * 2);
    if (opts.inside) opts.inside();
    ctx.restore();
    // lips: a thick cut edge throwing shadow into the opening
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(16,4,8,0.55)'; ctx.lineWidth = 4;
    polyline(ctx, g.upper.map((q, j) => [q[0] - Math.sin(g.ths[j]) * -2, q[1] + Math.cos(g.ths[j]) * -2])); ctx.stroke();
    ctx.strokeStyle = `rgba(246,236,222,${0.55 * cav.lip})`; ctx.lineWidth = 1.5;
    polyline(ctx, g.upper); ctx.stroke();
    ctx.strokeStyle = `rgba(246,236,222,${0.35 * cav.lip})`; ctx.lineWidth = 1.1;
    polyline(ctx, g.lower); ctx.stroke();
    // a few fibres at the torn lips
    for (let j = 1; j < g.upper.length - 1; j += 2) {
      const h = hash(j, 23, Math.round(cav.u * 997));
      if (h > 0.6) continue;
      const q = h < 0.3 ? g.upper[j] : g.lower[j];
      ctx.strokeStyle = 'rgba(240,228,210,0.6)'; ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(q[0] + (h - 0.3) * 18, q[1] + (hash(j, 24) - 0.5) * 10); ctx.stroke();
    }
  }
  // a peeled flap of skin, lifted and folded back off the tear
  if (cav.flap) {
    const j0 = mid - 3, j1 = mid + 3;
    const n = [-Math.sin(th) * cav.flap, Math.cos(th) * cav.flap];
    const base0 = cav.flap > 0 ? g.upper[j0] : g.lower[j0], base1 = cav.flap > 0 ? g.upper[j1] : g.lower[j1];
    const tip = [c[0] + n[0] * cav.wid * 1.4 + Math.cos(th) * 14, c[1] + n[1] * cav.wid * 1.4 + Math.sin(th) * 14];
    ctx.save();
    ctx.shadowColor = 'rgba(20,8,12,0.45)'; ctx.shadowBlur = 8 * (opts.px || 1);
    ctx.shadowOffsetX = 3 * (opts.px || 1); ctx.shadowOffsetY = 4 * (opts.px || 1);
    ctx.fillStyle = 'rgb(214,196,182)';
    ctx.beginPath(); ctx.moveTo(base0[0], base0[1]); ctx.quadraticCurveTo(tip[0] - 6, tip[1] + 4, tip[0], tip[1]); ctx.lineTo(base1[0], base1[1]); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(120,90,80,0.6)'; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(base0[0], base0[1]); ctx.quadraticCurveTo(tip[0] - 6, tip[1] + 4, tip[0], tip[1]); ctx.lineTo(base1[0], base1[1]); ctx.stroke();
  }
  // the eye: stitched shut from the inner end outward, the stitches are
  // the thread; once shut it is a seam
  if (cav.id === 'eye' && opts.lidClose > 0) {
    const nst = 11;
    const shown = Math.ceil(opts.lidClose * nst);
    const pts = g.centre;
    for (let s = 0; s < shown; s++) {
      const j = Math.round(1 + (s / (nst - 1)) * (pts.length - 3));
      const tg = [Math.cos(g.ths[j]), Math.sin(g.ths[j])], nn = [-tg[1], tg[0]];
      const span = 7 + cav.wid * 0.5 * Math.max(0.15, open);
      const sk = 3 + (hash(s, 61) - 0.5) * 2;
      strokeThread(ctx, [[pts[j][0] + nn[0] * span - tg[0] * sk, pts[j][1] + nn[1] * span - tg[1] * sk], [pts[j][0] - nn[0] * span + tg[0] * sk, pts[j][1] - nn[1] * span + tg[1] * sk]], 1.8);
    }
    if (opts.lidClose > 0.85) strokeThread(ctx, pts.slice(1, -1), 1.5);
  }
  ctx.restore();
  return g;
}

// ---------------------------------------------------------------- ribs
// Weight tapers irregularly; the tip trembles under tension at the end.
export function ribPolyline(rib, g, step, tremble) {
  let pts = truncate(rib.pts, g);
  if (tremble > 0) {
    pts = pts.map((q, i) => {
      const u = i / (rib.pts.length - 1);
      const j = (hash(step, rib.id, 5) - 0.5) * 3.2 * tremble * u * u;
      return [q[0] + j, q[1] - j * 0.7];
    });
  }
  return pts;
}

export function drawRib(ctx, rib, g, step, tremble) {
  const pts = ribPolyline(rib, g, step, tremble);
  if (pts.length < 2) return pts;
  if (rib.thread) { strokeThread(ctx, pts, rib.w); }
  else {
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 1; i < pts.length; i++) {
      const u = i / (rib.pts.length - 1);
      const w = rib.w * (1 - 0.5 * u) * (0.85 + 0.3 * hash(rib.id, i, 9));
      ctx.strokeStyle = '#2a2524'; ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(pts[i - 1][0], pts[i - 1][1]); ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(235,225,215,0.45)'; ctx.lineWidth = 0.6;
    ctx.translate(-0.7, -0.7);
    polyline(ctx, pts); ctx.stroke();
    ctx.restore();
    // a few dense yarn wraps at irregular places
    ctx.save();
    ctx.strokeStyle = '#a3342b'; ctx.lineWidth = 1.2;
    for (const f of [0.18, 0.47, 0.71]) {
      if (hash(rib.id, f * 100) < 0.35) continue;
      const i = Math.round(f * (rib.pts.length - 1));
      if (i >= pts.length - 1) continue;
      const tg = tangentAt(pts, i), n = [-tg[1], tg[0]];
      const nw = 6 + Math.floor(hash(rib.id, i, 2) * 7);
      for (let k = 0; k < nw; k++) {
        const o = (k - nw / 2) * 1.4;
        const c = [pts[i][0] + tg[0] * o, pts[i][1] + tg[1] * o];
        ctx.beginPath(); ctx.moveTo(c[0] - n[0] * 3.6 + tg[0], c[1] - n[1] * 3.6 + tg[1]); ctx.lineTo(c[0] + n[0] * 3.6 - tg[0], c[1] + n[1] * 3.6 - tg[1]); ctx.stroke();
      }
    }
    ctx.restore();
  }
  // split tine
  if (rib.tine && g > rib.tine.u) {
    const f = clamp((g - rib.tine.u) / Math.max(0.05, rib.max - rib.tine.u));
    const tp = truncate(rib.tine.pts, f);
    ctx.save(); ctx.strokeStyle = '#2a2524'; ctx.lineWidth = rib.w * 0.55; ctx.lineCap = 'round';
    polyline(ctx, tp); ctx.stroke(); ctx.restore();
  }
  return pts;
}

// ---------------------------------------------------------------- membrane
let MEM_TEX = null;
export function setMembraneTexture(t) { MEM_TEX = t; }

const quadPoint = (A0, A1, B1, B0, fx, fy) => {
  const top = [lerp(A0[0], A1[0], fx), lerp(A0[1], A1[1], fx)];
  const bot = [lerp(B0[0], B1[0], fx), lerp(B0[1], B1[1], fx)];
  return [lerp(top[0], bot[0], fy), lerp(top[1], bot[1], fy)];
};

// side points along a rib (or the body edge) between attachment u's
function sidePath(m, which, org, sp, ribState, step, tremble) {
  const us = which === 'a' ? m.ua : m.ub;
  const src = which === 'a' ? m.a : m.b;
  const n = us.length;
  // attachments appear one after another as the membrane grows
  const shown = Math.max(1, Math.min(n, Math.ceil(m.g * n + 0.001)));
  const lastF = m.g * n - (shown - 1);
  const att = [];
  if (src === 'body') {
    for (let i = 0; i < shown; i++) att.push(org.bodyPoint(sp, us[i], -0.95));
    const path = [];
    for (let u = us[0]; u <= us[shown - 1] + 1e-6; u += 0.005) path.push(org.bodyPoint(sp, u, -0.95));
    return { att, path };
  }
  const rib = org.ribs[src];
  const g = ribState[src].g;
  const pts = ribPolyline(rib, Math.max(g, 0.001), step, tremble);
  const at = (u) => pts[Math.min(pts.length - 1, Math.round(clamp(u) * (rib.pts.length - 1)))];
  for (let i = 0; i < shown; i++) {
    let u = Math.min(us[i], g);
    if (i === shown - 1 && i > 0) u = lerp(us[i - 1], u, clamp(lastF));
    att.push(at(u));
  }
  const path = [];
  const i0 = Math.round(Math.min(us[0], g) * (rib.pts.length - 1));
  const i1 = Math.round(Math.min(us[shown - 1], g) * (rib.pts.length - 1));
  for (let i = i0; i <= Math.min(i1, pts.length - 1); i++) path.push(pts[i]);
  return { att, path: path.length ? path : [att[0]] };
}

export function drawMembrane3(ctx, painting, m, idx, org, sp, ribState, step, tremble) {
  if (m.g <= 0.02) return null;
  const A = sidePath(m, 'a', org, sp, ribState, step, tremble);
  const B = sidePath(m, 'b', org, sp, ribState, step, tremble);
  if (A.path.length < 2 && B.path.length < 2) return null;
  const a0 = A.path[0], a1 = A.path[A.path.length - 1], b0 = B.path[0], b1 = B.path[B.path.length - 1];
  const cen = [(a0[0] + a1[0] + b0[0] + b1[0]) / 4, (a0[1] + a1[1] + b0[1] + b1[1]) / 4];
  // free edges sag toward the middle: stretched cloth, not a filled shape
  const freeEdge = (p, q, sagMul, seed) => {
    const out = [];
    const chord = Math.hypot(q[0] - p[0], q[1] - p[1]);
    for (let i = 1; i < 12; i++) {
      const f = i / 12;
      const x = lerp(p[0], q[0], f), y = lerp(p[1], q[1], f);
      const dx = cen[0] - x, dy = cen[1] - y, l = Math.hypot(dx, dy) || 1;
      const s = Math.sin(Math.PI * f) * chord * m.sag * sagMul * (0.75 + 0.5 * hash(seed, i, idx + 3)) + (hash(seed, i, idx) - 0.5) * 9 * tremble + (hash(seed, i, idx + 7) - 0.5) * 22;
      out.push([x + dx / l * s, y + dy / l * s]);
    }
    return out;
  };
  const e1 = freeEdge(a1, b1, 1, 11), e0 = freeEdge(b0, a0, 0.5, 12);
  const poly = [...A.path, ...e1, ...B.path.slice().reverse(), ...e0];
  ctx.save();
  // outline with holes (even-odd), so the ground shows through
  ctx.beginPath();
  poly.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])));
  ctx.closePath();
  const holes = [];
  if (m.g > 0.7) {
    for (const [fx, fy, r] of m.holes) {
      const c = quadPoint(a0, a1, b1, b0, fx, fy);
      const hole = [];
      for (let k = 0; k < 11; k++) {
        const a = (k / 11) * TAU, rr = r * (0.55 + 0.7 * hash(idx, k, Math.round(fx * 100)));
        hole.push([c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr * 0.75]);
      }
      holes.push(hole);
      hole.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])));
      ctx.closePath();
    }
  }
  ctx.save();
  ctx.clip('evenodd');
  ctx.globalCompositeOperation = 'multiply';
  const [r, gg, b] = m.tint;
  ctx.fillStyle = `rgba(${r},${gg},${b},${m.alpha})`;
  ctx.fillRect(cen[0] - 1200, cen[1] - 1200, 2400, 2400);
  // stains: uneven pigment soaked into the membrane
  // thinner (paler) toward the free edge, denser near the ribs
  {
    const lg = ctx.createLinearGradient((a0[0] + b0[0]) / 2, (a0[1] + b0[1]) / 2, (a1[0] + b1[0]) / 2, (a1[1] + b1[1]) / 2);
    lg.addColorStop(0, `rgba(${r},${gg},${b},0.35)`); lg.addColorStop(1, `rgba(${r},${gg},${b},0)`);
    ctx.fillStyle = lg; ctx.fillRect(cen[0] - 1200, cen[1] - 1200, 2400, 2400);
  }
  for (let k = 0; k < 11; k++) {
    const c = quadPoint(a0, a1, b1, b0, hash(idx, k, 31), hash(idx, k, 32));
    const rr = 12 + 55 * hash(idx, k, 33);
    const sg = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], rr);
    sg.addColorStop(0, `rgba(${hash(idx, k, 34) < 0.5 ? '150,40,70' : '120,70,140'},${0.18 + 0.2 * hash(idx, k, 35)})`);
    sg.addColorStop(1, 'rgba(150,40,70,0)');
    ctx.fillStyle = sg; ctx.fillRect(c[0] - rr, c[1] - rr, 2 * rr, 2 * rr);
  }
  if (MEM_TEX) {
    const xs = poly.map((q) => q[0]), ys = poly.map((q) => q[1]);
    const x0 = Math.min(...xs), y0 = Math.min(...ys);
    ctx.globalAlpha = 0.18;
    ctx.drawImage(MEM_TEX.img, MEM_TEX.x + (idx * 0.13 % 0.4) * MEM_TEX.w, MEM_TEX.y, MEM_TEX.w * 0.6, MEM_TEX.h * 0.6, x0, y0, Math.max(...xs) - x0, Math.max(...ys) - y0);
    ctx.globalAlpha = 1;
  }
  ctx.globalCompositeOperation = 'source-over';
  // open gauze weave: two families of slightly wandering threads, sparser
  // toward the free edge, so the membrane reads as cloth, not a fill
  for (let fam = 0; fam < 2; fam++) {
    for (let j = 0; j < 26; j++) {
      const f = (j + hash(idx, j, fam + 70)) / 26;
      const pts = [];
      for (let q = 0; q <= 10; q++) {
        const g2 = q / 10;
        const fx = fam ? f : g2, fy = fam ? g2 : f;
        const pnt = quadPoint(a0, a1, b1, b0, fx, fy);
        pts.push([pnt[0] + (hash(idx, j, q + fam * 20) - 0.5) * 3, pnt[1] + (hash(idx, q, j + fam * 20) - 0.5) * 3]);
      }
      ctx.strokeStyle = `rgba(150,50,75,${0.1 + 0.12 * hash(idx, j, fam)})`; ctx.lineWidth = 0.6;
      polyline(ctx, pts); ctx.stroke();
    }
  }
  // tension lines: each attachment pulls toward the attachments opposite
  for (let i = 0; i < A.att.length; i++) for (let j = 0; j < B.att.length; j++) {
    const p = A.att[i], q = B.att[j];
    const diag = Math.abs(i / Math.max(1, A.att.length - 1) - j / Math.max(1, B.att.length - 1));
    if (diag > 0.55) continue;
    const mid = [lerp(p[0], q[0], 0.5) + (cen[0] - lerp(p[0], q[0], 0.5)) * 0.22, lerp(p[1], q[1], 0.5) + (cen[1] - lerp(p[1], q[1], 0.5)) * 0.22];
    ctx.strokeStyle = `rgba(120,30,55,${0.32 - diag * 0.35})`; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.quadraticCurveTo(mid[0], mid[1], q[0], q[1]); ctx.stroke();
    ctx.strokeStyle = `rgba(255,236,240,${0.22 - diag * 0.25})`; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(p[0] + 2, p[1] + 1.5); ctx.quadraticCurveTo(mid[0] + 2, mid[1] + 1.5, q[0] + 2, q[1] + 1.5); ctx.stroke();
  }
  // fine pleats radiating from each attachment
  for (const p of [...A.att, ...B.att]) {
    for (let k = 0; k < 5; k++) {
      const a = Math.atan2(cen[1] - p[1], cen[0] - p[0]) + (k - 2) * 0.16;
      const l = 30 + 50 * hash(Math.round(p[0]), k);
      ctx.strokeStyle = 'rgba(130,35,62,0.2)'; ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] + Math.cos(a) * l, p[1] + Math.sin(a) * l); ctx.stroke();
    }
  }
  ctx.restore();
  // frayed free edges and hole rims
  ctx.strokeStyle = 'rgba(165,58,88,0.55)'; ctx.lineWidth = 1;
  for (const e of [e1, e0]) { polyline(ctx, e); ctx.stroke(); }
  for (const h of holes) { ctx.strokeStyle = 'rgba(165,58,88,0.45)'; polyline(ctx, [...h, h[0]]); ctx.stroke(); }
  for (const e of [e1, e0]) for (let i = 0; i < e.length; i++) for (let f = 0; f < 3; f++) {
    const h = hash(idx, i, f + 50);
    ctx.strokeStyle = `rgba(200,90,120,${0.3 + h * 0.35})`; ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.moveTo(e[i][0], e[i][1]); ctx.lineTo(e[i][0] + (h - 0.5) * 16, e[i][1] + (hash(idx, i, f + 60) - 0.3) * 14); ctx.stroke();
  }
  // stitched attachments: the membrane is sewn to the ribs
  for (const p of [...A.att, ...B.att]) {
    for (let k = 0; k < 3; k++) {
      const a = k * 1.1 + hash(Math.round(p[1]), k);
      strokeThread(ctx, [[p[0] - Math.cos(a) * 5, p[1] - Math.sin(a) * 5], [p[0] + Math.cos(a) * 5, p[1] + Math.sin(a) * 5]], 1.2);
    }
  }
  ctx.restore();
  return poly;
}
