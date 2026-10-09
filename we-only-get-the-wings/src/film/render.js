// Draws one held step of the study into a 2D context (design space
// 1920x1080, already scaled by the caller).

import { hash } from './rng.js';
import { K, clamp, lerp, easeInOut, win } from './timeline.js';
import { texRibbon, ribbonPath, polyline, resample, truncate, tangentAt, quadPts } from './draw.js';
import { PAL, rgba } from './materials.js';

const TAU = Math.PI * 2;
const THREAD = '#3a1618';

// ---------------------------------------------------------------- light
export function lightAt(t) {
  const e = easeInOut(win(t, K.light[0], K.light[1]));
  return { dir: lerp(0.85, 0.3, e), dist: lerp(10, 20, e), blur: lerp(7.5, 4.2, e), e };
}

// ---------------------------------------------------------------- strips
export function stripGeometry(strip, pose, nseg = 8) {
  const { x, y, a, len, k } = pose;
  const T = [Math.cos(a), Math.sin(a)], Nn = [-Math.sin(a), Math.cos(a)];
  const hw = (strip.wpx / 2) * (1 + 0.06 * (pose.lift || 0));
  const left = [], right = [], centre = [];
  for (let i = 0; i <= nseg; i++) {
    const s = (i / nseg - 0.5) * len;
    let px, py, ta;
    if (Math.abs(k) < 1e-5) { px = x + T[0] * s; py = y + T[1] * s; ta = a; }
    else {
      const sx = Math.sin(k * s) / k, sy = (1 - Math.cos(k * s)) / k;
      px = x + T[0] * sx + Nn[0] * sy; py = y + T[1] * sx + Nn[1] * sy; ta = a + k * s;
    }
    const n = [-Math.sin(ta), Math.cos(ta)];
    const jl = (hash(strip.id, i, 1) - 0.5) * 2.6, jr = (hash(strip.id, i, 2) - 0.5) * 2.6;
    centre.push([px, py]);
    left.push([px + n[0] * (hw + jl), py + n[1] * (hw + jl)]);
    right.push([px - n[0] * (hw + jr), py - n[1] * (hw + jr)]);
  }
  return { left, right, centre };
}

export function drawStrip(ctx, img, strip, pose, mean, opts = {}) {
  const g = stripGeometry(strip, pose);
  const W = img.width, H = img.height;
  const ux0 = strip.uv.x * W, ux1 = (strip.uv.x + strip.uv.w) * W;
  const vy0 = strip.uv.y * H, vy1 = Math.min(H - 1, vy0 + strip.uv.h * H);
  const uvs = g.centre.map((_, i) => [lerp(ux0, ux1, i / (g.centre.length - 1)), vy0, vy1]);
  ctx.save();
  if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;
  texRibbon(ctx, img, g.left, g.right, uvs);
  // Wrap shading: the strip turns down over the body's sides.
  const wrap = pose.wrap ?? 1;
  if (wrap > 0.01 && !opts.flat) {
    ribbonPath(ctx, g.left, g.right);
    ctx.save();
    ctx.clip();
    const a = g.centre[0], b = g.centre[g.centre.length - 1];
    const gr = ctx.createLinearGradient(a[0], a[1], b[0], b[1]);
    gr.addColorStop(0, `rgba(35,12,18,${0.5 * wrap})`);
    gr.addColorStop(0.2, 'rgba(35,12,18,0)');
    gr.addColorStop(0.45, `rgba(255,245,235,${0.08 * wrap})`);
    gr.addColorStop(0.8, 'rgba(35,12,18,0)');
    gr.addColorStop(1, `rgba(35,12,18,${0.55 * wrap})`);
    ctx.fillStyle = gr;
    ctx.fill();
    ctx.restore();
  }
  if (!opts.flat) {
    // Raw canvas showing at the cut edges.
    ctx.lineWidth = 0.9;
    ctx.strokeStyle = 'rgba(246,240,228,0.22)';
    polyline(ctx, g.left); ctx.stroke();
    polyline(ctx, g.right); ctx.stroke();
    // Fray at both ends.
    const fc = `rgba(${mean[0] | 0},${mean[1] | 0},${mean[2] | 0},0.8)`;
    for (const end of [0, 1]) {
      const i = end ? g.centre.length - 1 : 0;
      const tg = tangentAt(g.centre, i);
      const dir = end ? 1 : -1;
      const nf = 4 + Math.floor(hash(strip.fraySeed, end) * 6);
      for (let f = 0; f < nf; f++) {
        const r = hash(strip.fraySeed, end, f);
        const s = lerp(-0.5, 0.5, r) * strip.wpx;
        const n = [-tg[1], tg[0]];
        const x0 = g.centre[i][0] + n[0] * s, y0 = g.centre[i][1] + n[1] * s;
        const l = 4 + 16 * hash(strip.fraySeed, f, 9);
        const bend = (hash(strip.fraySeed, f, 3) - 0.5) * 0.9;
        ctx.strokeStyle = f % 3 === 0 ? 'rgba(240,232,215,0.75)' : fc;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.quadraticCurveTo(x0 + dir * tg[0] * l * 0.6 + n[0] * l * bend, y0 + dir * tg[1] * l * 0.6 + n[1] * l * bend,
          x0 + dir * tg[0] * l + n[0] * l * bend * 1.6, y0 + dir * tg[1] * l + n[1] * l * bend * 1.6);
        ctx.stroke();
      }
    }
    // Knot tuft (P11): on knot-strips, or when tied onto a rib.
    const knot = Math.max(strip.knot ? 1 : 0, pose.knotted || 0);
    if (knot > 0.3) {
      // tied: the strip is pinched in the middle — a dark crease band and
      // a few radiating folds, no added shapes
      const mi = Math.round(g.centre.length / 2);
      const c = g.centre[mi];
      const tg = tangentAt(g.centre, mi), nn = [-tg[1], tg[0]];
      const hw = strip.wpx * 0.55;
      ctx.save();
      ribbonPath(ctx, g.left, g.right); ctx.clip();
      const cg = ctx.createLinearGradient(c[0] - tg[0] * 9, c[1] - tg[1] * 9, c[0] + tg[0] * 9, c[1] + tg[1] * 9);
      cg.addColorStop(0, 'rgba(30,10,12,0)'); cg.addColorStop(0.5, `rgba(30,10,12,${0.55 * knot})`); cg.addColorStop(1, 'rgba(30,10,12,0)');
      ctx.fillStyle = cg;
      ctx.fillRect(c[0] - 30, c[1] - 30, 60, 60);
      ctx.strokeStyle = `rgba(30,10,12,${0.35 * knot})`; ctx.lineWidth = 0.8;
      for (let f = 0; f < 4; f++) {
        const s = (f / 3 - 0.5) * 2 * hw;
        const o = (hash(strip.id, f, 31) - 0.5) * 14;
        ctx.beginPath();
        ctx.moveTo(c[0] + nn[0] * s * 0.3, c[1] + nn[1] * s * 0.3);
        ctx.lineTo(c[0] + nn[0] * s + tg[0] * o, c[1] + nn[1] * s + tg[1] * o);
        ctx.stroke();
      }
      ctx.restore();
      // the binding thread wraps twice around the pinch
      ctx.strokeStyle = 'rgba(58,22,24,0.9)'; ctx.lineWidth = 1.2;
      for (const d of [-2, 2]) {
        ctx.beginPath();
        ctx.moveTo(c[0] + nn[0] * hw + tg[0] * d, c[1] + nn[1] * hw + tg[1] * d);
        ctx.lineTo(c[0] - nn[0] * hw + tg[0] * (d + 1), c[1] - nn[1] * hw + tg[1] * (d + 1));
        ctx.stroke();
      }
    }
  }
  ctx.restore();
  return g;
}

export function drawGold(ctx, gold, pose, t) {
  const r = gold.r;
  const cx = pose.x + Math.cos(pose.a) * gold.off * 20, cy = pose.y + Math.sin(pose.a) * gold.off * 20;
  const L = lightAt(t);
  // Each disc faces one light direction (psi); as the light swings past it,
  // the disc flashes once and falls dark again.
  const facing = Math.max(0, Math.cos(L.dir - gold.psi));
  const flash = L.e > 0 && L.e < 1 ? Math.pow(facing, 110) : 0;
  ctx.save();
  const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, 0, cx, cy, r);
  g.addColorStop(0, '#d6b36c');
  g.addColorStop(0.55, PAL.gold);
  g.addColorStop(1, '#7d5a2a');
  ctx.fillStyle = g;
  ctx.beginPath();
  for (let i = 0; i <= 18; i++) {
    const a = (i / 18) * TAU, rr = r * (1 + (hash(gold.psi * 100 | 0, i) - 0.5) * 0.12);
    const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.fill();
  // hammer dents
  ctx.strokeStyle = 'rgba(80,50,20,0.35)';
  ctx.lineWidth = 0.6;
  for (let i = 0; i < 5; i++) {
    const a = hash(i, 3) * TAU, d = r * 0.55 * hash(i, 4);
    ctx.beginPath(); ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, r * 0.25, a, a + 1.6); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(30,18,10,0.85)';
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.22, 0, TAU); ctx.fill();
  if (flash > 0.01) {
    // Reflection only on the metal itself — no glow beyond its rim.
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.clip();
    const h = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.3, 0, cx, cy, r * 1.1);
    h.addColorStop(0, `rgba(255,248,222,${0.95 * flash})`);
    h.addColorStop(0.5, `rgba(255,226,150,${0.6 * flash})`);
    h.addColorStop(1, `rgba(255,210,120,${0.15 * flash})`);
    ctx.fillStyle = h;
    ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
    ctx.restore();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- body
export function drawBody(ctx, cloth, sp, clothMeans) {
  const W = cloth.width, H = cloth.height;
  const n = sp.pts.length;
  const uvs = sp.pts.map((_, i) => [(i / (n - 1)) * (W - 1), 0, H - 1]);
  // fibre fringe first so its roots tuck under the body edge
  drawFringe(ctx, sp, clothMeans);
  texRibbon(ctx, cloth, sp.left, sp.right, uvs);
}

// Loose fibres along the silhouette (P23, P24) and a frayed tuft at each
// open end. Each fibre has a fixed identity (hash of its index), so it moves
// with the body rather than flickering.
export function drawFringe(ctx, sp, clothMeans, i0 = 0, i1 = Infinity) {
  const n = sp.pts.length;
  const yarn = ['#e2b020', '#c8302b', '#2c4fb0', '#e8742c', '#f1ede3'];
  ctx.save();
  ctx.lineCap = 'round';
  for (const side of [0, 1]) {
    const edge = side ? sp.right : sp.left;
    for (let i = Math.max(2, i0); i < Math.min(n - 2, i1); i++) {
      if (hash(i, side, 501) > 0.62) continue;
      const u = i / (n - 1);
      const m = clothMeans[Math.min(clothMeans.length - 1, Math.floor(u * clothMeans.length))];
      const th = sp.ths[i] + (side ? -Math.PI / 2 : Math.PI / 2);
      const nf = 2 + Math.floor(hash(i, side, 502) * 6);
      const long = hash(i, side, 503) < 0.15 ? 2.2 : 1;
      for (let f = 0; f < nf; f++) {
        const h1 = hash(i, side, f), h2 = hash(i, side, f + 40), h3 = hash(i, side, f + 80);
        const a = th + (h1 - 0.5) * 1.3;
        const l = (4 + 14 * h2) * long;
        const along = (h3 - 0.5) * 12;
        const x0 = edge[i][0] + Math.cos(sp.ths[i]) * along - Math.cos(a) * 3;
        const y0 = edge[i][1] + Math.sin(sp.ths[i]) * along - Math.sin(a) * 3;
        const cu = (h1 - 0.5) * 0.9;
        const x1 = x0 + Math.cos(a + cu) * l, y1 = y0 + Math.sin(a + cu) * l;
        const dl = (h3 - 0.5) * 70;
        ctx.strokeStyle = `rgba(${Math.min(255, m[0] + dl) | 0},${Math.min(255, m[1] + dl) | 0},${Math.min(255, m[2] + dl) | 0},0.85)`;
        ctx.lineWidth = 0.6 + h2 * 0.7;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.quadraticCurveTo(x0 + Math.cos(a) * l * 0.6, y0 + Math.sin(a) * l * 0.6, x1, y1);
        ctx.stroke();
        if (long > 1 && f === 0) {
          ctx.fillStyle = yarn[Math.floor(h3 * yarn.length)];
          ctx.beginPath(); ctx.arc(x1, y1, 1.8, 0, TAU); ctx.fill();
        }
      }
    }
  }
  // frayed open ends
  for (const end of [0, 1]) {
    const i = end ? n - 1 : 0;
    if (i < i0 || i > i1) continue;
    const th = sp.ths[i] + (end ? 0 : Math.PI);
    const m = clothMeans[end ? clothMeans.length - 1 : 0];
    const w = sp.ws[i];
    for (let f = 0; f < 34; f++) {
      const h1 = hash(end, f, 601), h2 = hash(end, f, 602);
      const off = (h1 - 0.5) * w * 0.9;
      const nrm = [-Math.sin(sp.ths[i]), Math.cos(sp.ths[i])];
      const x0 = sp.pts[i][0] + nrm[0] * off, y0 = sp.pts[i][1] + nrm[1] * off;
      const a = th + (h2 - 0.5) * 1.4 + off * 0.01;
      const l = 8 + 26 * hash(end, f, 603);
      const dl = (h2 - 0.5) * 80;
      ctx.strokeStyle = f % 5 === 0 ? 'rgba(245,238,225,0.8)' : `rgba(${Math.min(255, m[0] + dl) | 0},${Math.min(255, m[1] + dl) | 0},${Math.min(255, m[2] + dl) | 0},0.85)`;
      ctx.lineWidth = 0.7 + h1 * 0.8;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(x0 + Math.cos(a) * l * 0.5, y0 + Math.sin(a) * l * 0.5, x0 + Math.cos(a + (h1 - 0.5)) * l, y0 + Math.sin(a + (h1 - 0.5)) * l);
      ctx.stroke();
    }
  }
  ctx.restore();
}

export function drawIncisions(ctx, org, sp, t, incisions) {
  ctx.save();
  for (const g of incisions) {
    if (t < g.t) continue;
    const a = org.spineAt(sp, g.u);
    const n = [-Math.sin(a.th), Math.cos(a.th)];
    const c = [a.p[0] + n[0] * a.w * g.off, a.p[1] + n[1] * a.w * g.off];
    const ang = a.th + g.ang;
    const shown = Math.min(g.n, 1 + Math.floor((t - g.t) * 12));
    for (let i = 0; i < shown; i++) {
      const o = (i - g.n / 2) * 4.2;
      const px = c[0] + Math.cos(a.th) * o, py = c[1] + Math.sin(a.th) * o;
      const dx = Math.cos(ang) * g.len / 2, dy = Math.sin(ang) * g.len / 2;
      ctx.lineWidth = 1.1;
      ctx.strokeStyle = 'rgba(60,15,25,0.6)';
      ctx.beginPath(); ctx.moveTo(px - dx + 0.8, py - dy + 0.8); ctx.lineTo(px + dx + 0.8, py + dy + 0.8); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,232,220,0.5)';
      ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.moveTo(px - dx, py - dy); ctx.lineTo(px + dx, py + dy); ctx.stroke();
    }
  }
  ctx.restore();
}

// ---------------------------------------------------------------- thread
export function strokeThread(ctx, pts, w = 2) {
  if (pts.length < 2) return;
  ctx.save();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.strokeStyle = THREAD;
  ctx.lineWidth = w;
  polyline(ctx, pts); ctx.stroke();
  ctx.strokeStyle = 'rgba(200,120,110,0.32)';
  ctx.lineWidth = w * 0.35;
  ctx.translate(-w * 0.28, -w * 0.28);
  polyline(ctx, pts); ctx.stroke();
  ctx.restore();
}

export function drawRoute(ctx, route) {
  if (route.stepped) {
    ctx.save();
    ctx.lineJoin = 'miter'; ctx.lineCap = 'square';
    ctx.strokeStyle = THREAD; ctx.lineWidth = 2;
    polyline(ctx, route.steppedPts); ctx.stroke();
    ctx.restore();
  } else strokeThread(ctx, route.pts, 1.9);
}

export function drawSeam(ctx, seam) {
  // Running stitch: visible "over" stitches of uneven length, "under" gaps.
  const pts = resample(seam, Math.max(2, Math.round(polyLengthOf(seam) / 2)));
  const runs = [];
  let i = 0, k = 0;
  while (i < pts.length - 1) {
    const over = 4 + Math.floor(hash(k, 71) * 4), under = 2 + Math.floor(hash(k, 72) * 3);
    runs.push(pts.slice(i, Math.min(pts.length, i + over + 1)));
    i += over + under; k++;
  }
  for (const r of runs) strokeThread(ctx, r, 2.1);
}

function polyLengthOf(pts) {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return l;
}

export function drawRootlets(ctx, list, loose) {
  ctx.save();
  ctx.lineCap = 'round';
  for (const r of list) {
    ctx.strokeStyle = loose ? 'rgba(70,32,34,0.75)' : THREAD;
    ctx.lineWidth = loose ? 0.9 : 1.2;
    polyline(ctx, r); ctx.stroke();
  }
  ctx.restore();
}

export function drawTail(ctx, tail) { strokeThread(ctx, tail.pts, 2.1); }

// Lashes: the thread stitching the closed lid to the lower lid.
export function drawLashes(ctx, eye, close) {
  if (close < 0.85) return;
  const n = Math.floor((close - 0.85) / 0.15 * 13);
  const pts = resample(eye.lower, 15);
  ctx.save();
  ctx.strokeStyle = THREAD; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
  for (let i = 1; i <= Math.min(n, 13); i++) {
    const tg = tangentAt(pts, i);
    const nn = [-tg[1], tg[0]];
    const p = pts[i], sk = (hash(i, 77) - 0.5) * 0.5;
    ctx.beginPath();
    ctx.moveTo(p[0] - nn[0] * 6 - tg[0] * sk * 6, p[1] - nn[1] * 6 - tg[1] * sk * 6);
    ctx.lineTo(p[0] + nn[0] * 5 + tg[0] * sk * 6, p[1] + nn[1] * 5 + tg[1] * sk * 6);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- eyelid
export function drawLid(ctx, img, strip, eye, close, mean) {
  const top = eye.upper;
  const n = top.length;
  const bw = strip.wpx * 0.95;
  const bottom = top.map((p, i) => {
    const f = i / (n - 1);
    const band = [p[0], p[1] + bw * Math.sin(Math.PI * f)];
    return [lerp(band[0], eye.lower[i][0], close), lerp(band[1], eye.lower[i][1], close)];
  });
  const W = img.width, H = img.height;
  const ux0 = strip.uv.x * W, ux1 = (strip.uv.x + strip.uv.w) * W;
  const vy0 = strip.uv.y * H, vy1 = Math.min(H - 1, vy0 + strip.uv.h * H);
  const uvs = top.map((_, i) => [lerp(ux0, ux1, i / (n - 1)), vy0, vy1]);
  texRibbon(ctx, img, top, bottom, uvs);
  ctx.save();
  ribbonPath(ctx, top, bottom);
  ctx.clip();
  const c0 = top[Math.floor(n / 2)], c1 = bottom[Math.floor(n / 2)];
  const g = ctx.createLinearGradient(c0[0], c0[1] - 4, c1[0], c1[1]);
  g.addColorStop(0, 'rgba(40,12,20,0.35)');
  g.addColorStop(0.35, 'rgba(255,240,230,0.1)');
  g.addColorStop(1, 'rgba(40,12,20,0.4)');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = 'rgba(246,240,228,0.25)'; ctx.lineWidth = 0.9;
  polyline(ctx, top); ctx.stroke();
  // lid shadow onto the eye
  if (close < 0.97) {
    ctx.strokeStyle = 'rgba(50,15,25,0.35)'; ctx.lineWidth = 3;
    polyline(ctx, bottom.map((p) => [p[0] + 1, p[1] + 2.5])); ctx.stroke();
  }
  ctx.restore();
  return bottom;
}

// ---------------------------------------------------------------- cells
// Optional painted surface for cells and membrane: windows of the painting
// chosen by colour (set once by film.js).
let CELL_TEX = null, MEMBRANE_TEX = null;
export function setSurfaceTextures(cell, membrane) { CELL_TEX = cell; MEMBRANE_TEX = membrane; }

export function drawCell(ctx, c, pos, scale = 1) {
  const r = c.r * scale;
  const [x, y] = pos;
  ctx.save();
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.05, x, y, r);
  g.addColorStop(0, '#e2ad5c');
  g.addColorStop(0.5, '#c98a36');
  g.addColorStop(0.85, '#9c5a18');
  g.addColorStop(1, '#6a3810');
  ctx.fillStyle = g;
  ctx.beginPath();
  for (let i = 0; i <= 22; i++) {
    const a = (i / 22) * TAU, rr = r * (1 + 0.16 * Math.sin(a * 3 + c.seed) + (hash(c.seed, i % 22) - 0.5) * 0.12);
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  if (CELL_TEX) {
    ctx.save();
    ctx.clip();
    ctx.globalAlpha = 0.6;
    const t = CELL_TEX, o = hash(c.seed, 5) * 0.5;
    ctx.drawImage(t.img, t.x + o * t.w, t.y + o * t.h, t.w * 0.5, t.h * 0.5, x - r, y - r, 2 * r, 2 * r);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'multiply';
    const sh = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r * 1.05);
    sh.addColorStop(0, 'rgba(255,240,220,1)'); sh.addColorStop(0.7, 'rgba(200,140,90,1)'); sh.addColorStop(1, 'rgba(90,45,20,1)');
    ctx.fillStyle = sh;
    ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
    ctx.restore();
  }
  // rind speckle (P14)
  for (let i = 0; i < 10 + r; i++) {
    const a = hash(c.seed, i, 1) * TAU, d = Math.sqrt(hash(c.seed, i, 2)) * r * 0.9;
    ctx.fillStyle = hash(c.seed, i, 3) < 0.75 ? 'rgba(110,50,10,0.35)' : 'rgba(240,200,130,0.25)';
    ctx.beginPath(); ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, 0.6 + hash(c.seed, i, 4) * 1.1, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

export function drawNet(ctx, net, cellState) {
  ctx.save();
  ctx.lineCap = 'round';
  const kept = new Set();
  for (const e of net) {
    const a = cellState[e.i], b = cellState[e.j];
    const moved = [a, b].filter((c) => c.phase !== 'home');
    let p0 = a.pos, p1 = b.pos, w = e.w, stub = false;
    // a strand to a cell that has left breaks, but its ends remain as stubs
    if (moved.length) stub = true;
    if (stub) {
      for (const [c, o] of [[a, b], [b, a]]) {
        const src = c.phase === 'home' ? c.pos : c.pos;
        const dst = o.phase === 'home' ? o.pos : o.home;
        const dx = dst[0] - src[0], dy = dst[1] - src[1], l = Math.hypot(dx, dy) || 1;
        const q = [src[0] + dx / l * (c.r + 4) + dy / l * 2, src[1] + dy / l * (c.r + 4) - dx / l * 2];
        ctx.strokeStyle = 'rgba(232,226,212,0.6)'; ctx.lineWidth = e.w * 0.5;
        ctx.beginPath(); ctx.moveTo(src[0] + dx / l * c.r * 0.7, src[1] + dy / l * c.r * 0.7); ctx.lineTo(q[0], q[1]); ctx.stroke();
      }
      continue;
    }
    const dx = p1[0] - p0[0], dy = p1[1] - p0[1], l = Math.hypot(dx, dy) || 1;
    w = e.w * Math.min(1, 55 / l) + (l > 55 ? 0.7 : 0);
    const sag = e.sag * 1.6;
    const mid = [(p0[0] + p1[0]) / 2 - dy * sag, (p0[1] + p1[1]) / 2 + dx * sag];
    w = w * 1.35;
    ctx.strokeStyle = 'rgba(110,80,60,0.3)'; ctx.lineWidth = w + 1.2;
    ctx.beginPath(); ctx.moveTo(p0[0] + 1, p0[1] + 1.2); ctx.quadraticCurveTo(mid[0] + 1, mid[1] + 1.2, p1[0] + 1, p1[1] + 1.2); ctx.stroke();
    ctx.strokeStyle = l > 55 ? 'rgba(236,230,215,0.7)' : 'rgba(236,228,210,0.85)'; ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.quadraticCurveTo(mid[0], mid[1], p1[0], p1[1]); ctx.stroke();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- ribs
export function drawWire(ctx, pts, isThread, seed) {
  if (pts.length < 2) return;
  if (isThread) { strokeThread(ctx, pts, 2.4); return; }
  ctx.save();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.strokeStyle = '#2a2524'; ctx.lineWidth = 2.9;
  polyline(ctx, pts); ctx.stroke();
  ctx.strokeStyle = 'rgba(235,225,215,0.5)'; ctx.lineWidth = 0.7;
  ctx.translate(-0.8, -0.8);
  polyline(ctx, pts); ctx.stroke();
  ctx.restore();
  // red yarn wraps (P11 bands, P15 wire)
  ctx.save();
  ctx.strokeStyle = '#a3342b'; ctx.lineWidth = 1.3;
  let acc = 0, next = 30 + hash(seed, 1) * 40;
  for (let i = 1; i < pts.length; i++) {
    acc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (acc > next) {
      next += 120 + hash(seed, i) * 140;
      const tg = tangentAt(pts, i), n = [-tg[1], tg[0]];
      const nw = 5 + Math.floor(hash(seed, i, 2) * 6);
      for (let k = 0; k < nw; k++) {
        const o = (k - nw / 2) * 1.5;
        const c = [pts[i][0] + tg[0] * o, pts[i][1] + tg[1] * o];
        ctx.beginPath(); ctx.moveTo(c[0] - n[0] * 3.4 + tg[0], c[1] - n[1] * 3.4 + tg[1]); ctx.lineTo(c[0] + n[0] * 3.4 - tg[0], c[1] + n[1] * 3.4 - tg[1]); ctx.stroke();
      }
    }
  }
  ctx.restore();
}

export function membranePanel(A, B, mA, mB, seed) {
  const a = truncate(A, mA), b = truncate(B, mB);
  const ea = a[a.length - 1], eb = b[b.length - 1];
  const root = A[0];
  const edge = [];
  const n = 12;
  const chord = Math.hypot(eb[0] - ea[0], eb[1] - ea[1]);
  for (let i = 1; i < n; i++) {
    const f = i / n;
    const p = [lerp(ea[0], eb[0], f), lerp(ea[1], eb[1], f)];
    const dx = root[0] - p[0], dy = root[1] - p[1], l = Math.hypot(dx, dy) || 1;
    const sag = Math.sin(Math.PI * f) * chord * 0.16 + (hash(seed, i) - 0.5) * 12;
    edge.push([p[0] + dx / l * sag, p[1] + dy / l * sag]);
  }
  return { a, b, edge, poly: [...a, ...edge, ...b.slice().reverse()] };
}

// Sheer membrane (P17, P35, P08): overlapping translucent layers, pleats
// that catch light, long veins running outward from the root, frayed edge.
export function drawMembrane(ctx, painting, panel, idx) {
  const { a, b, edge, poly } = panel;
  if (poly.length < 4) return;
  const ra = resample(a, 30), rb = resample(b, 30);
  const band = (f0, f1, m0, m1) => {
    const L = ra.map((p, i) => [lerp(p[0], rb[i][0], f0), lerp(p[1], rb[i][1], f0)]);
    const R = ra.map((p, i) => [lerp(p[0], rb[i][0], f1), lerp(p[1], rb[i][1], f1)]);
    return [...truncate(L, m0), ...truncate(R, m1).reverse()];
  };
  ctx.save();
  polyline(ctx, poly); ctx.closePath();
  ctx.save();
  ctx.clip();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = 'rgba(232,128,158,0.3)';
  ctx.fill();
  // overlapping sheer layers
  const tints = ['rgba(226,110,140,0.22)', 'rgba(240,150,170,0.2)', idx === 2 ? 'rgba(90,120,200,0.2)' : 'rgba(210,90,110,0.18)'];
  [[0, 0.55, 1, 0.92], [0.35, 1, 0.9, 1], [0.15, 0.7, 0.8, 0.75]].forEach(([f0, f1, m0, m1], j) => {
    ctx.fillStyle = tints[j];
    polyline(ctx, band(f0, f1, m0, m1)); ctx.closePath(); ctx.fill();
  });
  {
    // painted membrane: the pinkest passage of the painting, stained through
    const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]);
    const x0 = Math.min(...xs), y0 = Math.min(...ys), w = Math.max(...xs) - x0, h = Math.max(...ys) - y0;
    const t = MEMBRANE_TEX || { img: painting, x: 0.1 * painting.width, y: 0.2 * painting.height, w: 0.2 * painting.width, h: 0.3 * painting.height };
    ctx.globalAlpha = 0.2;
    const o = (idx * 0.17) % 0.5;
    ctx.drawImage(t.img, t.x + o * t.w, t.y, t.w * 0.6, t.h * 0.6, x0, y0, w, h);
    ctx.globalAlpha = 1;
  }
  ctx.globalCompositeOperation = 'source-over';
  // pleats: alternating lit and shadowed folds
  let f = 0;
  for (let j = 0; j < 40 && f < 1; j++) {
    f += 0.02 + hash(idx, j, 5) * 0.07;
    const lit = hash(idx, j, 6) < 0.35;
    ctx.strokeStyle = lit ? `rgba(255,236,242,${0.12 + hash(idx, j, 7) * 0.2})` : `rgba(135,35,65,${0.1 + hash(idx, j, 8) * 0.22})`;
    ctx.lineWidth = 0.5 + hash(idx, j, 9) * 1.3;
    const wob = hash(idx, j, 10) * 6;
    polyline(ctx, ra.map((p, i) => {
      const ff = Math.min(1, f + Math.sin(i * 0.35 + wob) * 0.012);
      return [lerp(p[0], rb[i][0], ff), lerp(p[1], rb[i][1], ff)];
    }));
    ctx.stroke();
  }
  // veins running outward, tapering, with side branches
  for (const f of [0.3, 0.68]) {
    const v = ra.map((p, i) => [lerp(p[0], rb[i][0], f + Math.sin(i * 0.25 + idx) * 0.06), lerp(p[1], rb[i][1], f + Math.sin(i * 0.25 + idx) * 0.06)]);
    for (let i = 1; i < v.length; i++) {
      ctx.strokeStyle = 'rgba(95,15,35,0.6)';
      ctx.lineWidth = 1.8 * (1 - i / v.length) + 0.4;
      ctx.beginPath(); ctx.moveTo(v[i - 1][0], v[i - 1][1]); ctx.lineTo(v[i][0], v[i][1]); ctx.stroke();
      if (i % 7 === 3) {
        const tg = tangentAt(v, i), side = i % 2 ? 1 : -1;
        ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.moveTo(v[i][0], v[i][1]);
        ctx.quadraticCurveTo(v[i][0] + tg[0] * 12 - tg[1] * 10 * side, v[i][1] + tg[1] * 12 + tg[0] * 10 * side, v[i][0] + tg[0] * 22 - tg[1] * 22 * side, v[i][1] + tg[1] * 22 + tg[0] * 22 * side);
        ctx.stroke();
      }
    }
  }
  ctx.restore();
  // frayed free edge
  ctx.strokeStyle = 'rgba(170,60,90,0.6)'; ctx.lineWidth = 1;
  polyline(ctx, edge); ctx.stroke();
  for (let i = 0; i < edge.length; i++) {
    for (let f = 0; f < 3; f++) {
      const h = hash(idx, i, f);
      ctx.strokeStyle = `rgba(200,90,120,${0.35 + h * 0.3})`; ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.moveTo(edge[i][0], edge[i][1]);
      ctx.lineTo(edge[i][0] + (h - 0.5) * 14, edge[i][1] + (hash(idx, i, f + 9) - 0.2) * 12); ctx.stroke();
    }
  }
  ctx.restore();
}

// Silhouettes for the cast-shadow pass.
export function silhouette(ctx, shape) {
  ctx.fillStyle = '#000';
  ctx.strokeStyle = '#000';
  if (shape.poly) { polyline(ctx, shape.poly); ctx.closePath(); ctx.fill(); }
  if (shape.ribbon) { ribbonPath(ctx, shape.ribbon[0], shape.ribbon[1]); ctx.fill(); }
  if (shape.line) { ctx.lineWidth = shape.w || 2; polyline(ctx, shape.line); ctx.stroke(); }
  if (shape.circle) { ctx.beginPath(); ctx.arc(shape.circle[0], shape.circle[1], shape.circle[2], 0, TAU); ctx.fill(); }
}
