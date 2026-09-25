// Material surfaces.
//
// Every texture here is a PLACEHOLDER standing in for Toni's scans.
// To replace one, put a prepared file at public/artwork/<slot>.jpg|png
// (see scripts/prepare_assets.py). If the file exists it is used as-is;
// otherwise the procedural placeholder below is generated from the seed.
//
//   slot        placeholder                       replace with
//   painting    seeded bristle-stroke painting     scans of Toni's paintings (P10, P12)
//   bodyCloth   fibre-fleck coral/pink cloth       scan of dyed muslin / felt (P37, P17)
//   ground      cool gesso + cobalt scribble       scan of a P13-type gesso ground
//
// Palette values were measured from the mood-board pins (VISUAL_INVENTORY §3.1)
// and pushed back toward the originals' saturation (screenshots read dull).

import { makeRandom, makeNoise1D } from './rng.js';

export const PAL = {
  cobalt: '#2c4fb0', ultramarine: '#1f2f86', denim: '#4c6d8d',
  red: '#c8302b', oxblood: '#8c2b24', coral: '#e0655a', orange: '#e8742c',
  pink: '#ec8fa6', flesh: '#e7b3a4', yellow: '#f0c32e', ochre: '#c98a2b',
  leaf: '#72b33c', acid: '#a8cf45', bottle: '#1f4d34', turquoise: '#2e9a92',
  plum: '#6e2a4c', rust: '#8b442b', cream: '#efe7d3', bone: '#e6dfcf',
  charcoal: '#272324', gold: '#c39552',
};

export function hexToRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function rgba(h, a = 1, dl = 0) {
  const [r, g, b] = hexToRgb(h);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v + dl)));
  return `rgba(${f(r)},${f(g)},${f(b)},${a})`;
}

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function loadArtwork(slot) {
  for (const ext of ['png', 'jpg']) {
    const img = await loadImage(`${import.meta.env.BASE_URL}artwork/${slot}.${ext}`);
    if (img) {
      const c = canvas(img.naturalWidth, img.naturalHeight);
      c.getContext('2d').drawImage(img, 0, 0);
      c.fromScan = true;
      return c;
    }
  }
  return null;
}

// ---------------------------------------------------------------- brushwork

// A loaded brush: parallel bristles with per-bristle tone and dry-brush
// dropout near the end of the stroke. Returns nothing; paints into ctx.
function bristleStroke(ctx, rnd, pts, width, color, alpha = 0.9) {
  const n = Math.max(5, Math.min(22, Math.round(width / 2.2)));
  const dryStart = rnd.range(0.45, 0.85);
  for (let b = 0; b < n; b++) {
    const o = (b / (n - 1) - 0.5) * width;
    const dl = rnd.range(-22, 18);
    const a = alpha * rnd.range(0.45, 1);
    ctx.strokeStyle = rgba(color, a, dl);
    ctx.lineWidth = (width / n) * rnd.range(1.3, 2.3);
    ctx.lineCap = 'round';
    ctx.beginPath();
    let pen = false;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const q = pts[Math.min(i + 1, pts.length - 1)];
      const r0 = pts[Math.max(i - 1, 0)];
      let tx = q[0] - r0[0], ty = q[1] - r0[1];
      const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      const x = p[0] - ty * o, y = p[1] + tx * o;
      const u = i / (pts.length - 1);
      const dry = u > dryStart && rnd.next() < (u - dryStart) * 2.2;
      if (dry) { pen = false; continue; }
      if (!pen) { ctx.moveTo(x, y); pen = true; } else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

function gesturePath(rnd, x, y, len, ang, curl) {
  const pts = [];
  const steps = Math.max(6, Math.round(len / 8));
  let a = ang;
  for (let i = 0; i <= steps; i++) {
    pts.push([x, y]);
    a += curl * rnd.range(0.4, 1.6) / steps * 6;
    x += Math.cos(a) * (len / steps);
    y += Math.sin(a) * (len / steps);
  }
  return pts;
}

function weaveTooth(ctx, w, h, rnd, strength = 0.07, pitch = 3) {
  // Canvas tooth: faint warp/weft lines plus per-pixel grain.
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  for (let y = 0; y < h; y += pitch) {
    ctx.fillStyle = `rgba(90,80,70,${strength * rnd.range(0.3, 1)})`;
    ctx.fillRect(0, y, w, 1);
  }
  for (let x = 0; x < w; x += pitch) {
    ctx.fillStyle = `rgba(90,80,70,${strength * 0.7 * rnd.range(0.3, 1)})`;
    ctx.fillRect(x, 0, 1, h);
  }
  ctx.restore();
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const g = (rnd.next() - 0.5) * 18;
    d[i] += g; d[i + 1] += g; d[i + 2] += g;
  }
  ctx.putImageData(img, 0, 0);
}

// ------------------------------------------------------------ PLACEHOLDERS

// PLACEHOLDER — one saturated painting from which every strip is cut.
function makePainting(seed, S) {
  // Composed in a fixed 2048x1024 design space and scaled, so every output
  // resolution gets the same painting (and the same strip colours).
  const W = 2048, H = 1024, s = 1;
  const c = canvas(W * S, H * S);
  const ctx = c.getContext('2d');
  ctx.scale(S, S);
  const rnd = makeRandom(seed ^ 0x51a7);
  ctx.fillStyle = PAL.cream;
  ctx.fillRect(0, 0, W, H);

  const hues = [
    [PAL.cobalt, 16], [PAL.ultramarine, 6], [PAL.red, 13], [PAL.oxblood, 5],
    [PAL.orange, 10], [PAL.pink, 11], [PAL.coral, 5], [PAL.yellow, 10],
    [PAL.ochre, 5], [PAL.leaf, 9], [PAL.acid, 5], [PAL.bottle, 6],
    [PAL.turquoise, 5], [PAL.plum, 5],
  ];
  // Layer 1: broad masses (P10/P12 — colour fields laid edge to edge).
  for (let i = 0; i < 260; i++) {
    const w = rnd.range(40, 110) * s;
    bristleStroke(ctx, rnd,
      gesturePath(rnd, rnd.range(-100, W + 100), rnd.range(-60, H + 60),
        rnd.range(160, 520) * s, rnd.range(0, Math.PI * 2), rnd.range(-1.2, 1.2)),
      w, rnd.weighted(hues), rnd.range(0.75, 1));
  }
  // Layer 2: smaller loaded strokes.
  for (let i = 0; i < 520; i++) {
    bristleStroke(ctx, rnd,
      gesturePath(rnd, rnd.range(0, W), rnd.range(0, H),
        rnd.range(40, 200) * s, rnd.range(0, Math.PI * 2), rnd.range(-2, 2)),
      rnd.range(10, 40) * s, rnd.weighted(hues), rnd.range(0.7, 1));
  }
  // Layer 3: pale contour almonds (P12's outlined cells / eyes).
  for (let i = 0; i < 38; i++) {
    const cx = rnd.range(0, W), cy = rnd.range(0, H);
    const rx = rnd.range(26, 70) * s, ry = rx * rnd.range(0.45, 0.8);
    const a = rnd.range(0, Math.PI);
    const pts = [];
    for (let k = 0; k <= 26; k++) {
      const th = (k / 26) * Math.PI * 2.15;
      pts.push([cx + Math.cos(a) * Math.cos(th) * rx - Math.sin(a) * Math.sin(th) * ry,
        cy + Math.sin(a) * Math.cos(th) * rx + Math.cos(a) * Math.sin(th) * ry]);
    }
    bristleStroke(ctx, rnd, pts, rnd.range(5, 11) * s,
      rnd.pick([PAL.cream, PAL.cream, '#d7ecc0', PAL.bone]), 0.9);
  }
  // Layer 4: dark bottle-green / plum contours wrapping the masses (P10).
  for (let i = 0; i < 70; i++) {
    bristleStroke(ctx, rnd,
      gesturePath(rnd, rnd.range(0, W), rnd.range(0, H),
        rnd.range(120, 380) * s, rnd.range(0, Math.PI * 2), rnd.range(-2.4, 2.4)),
      rnd.range(5, 14) * s, rnd.pick([PAL.bottle, PAL.bottle, PAL.plum, PAL.ultramarine]), 0.85);
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  weaveTooth(ctx, c.width, c.height, rnd, 0.06, Math.max(2, Math.round(3 * S)));
  return c;
}

// PLACEHOLDER — the soft body's cloth: a patchwork of different cloths
// stitched end to end (P02 patchwork, P01 denim, P32 felt, P37 seams),
// interrupted by bands of tightly wound yarn (P11, P24). Mapped along the
// spine (u) and across the width (v). Shading across v is baked so the
// body stays matte. Returns the canvas plus `pinches` (u positions of the
// wound bands) so the body's silhouette can tighten there.
function clothPatch(ctx, rnd, kind, x0, x1, H, s) {
  const w = x1 - x0;
  const fill = (c) => { ctx.fillStyle = c; ctx.fillRect(x0, 0, w, H); };
  const flecks = (n, light, dark, ang = 0, spread = 0.5) => {
    for (let i = 0; i < n; i++) {
      const x = x0 + rnd.next() * w, y = rnd.next() * H;
      const a = ang + rnd.gauss() * spread, l = rnd.range(2, 9) * s;
      ctx.strokeStyle = rnd.next() < 0.5 ? light(rnd.range(0.05, 0.25)) : dark(rnd.range(0.05, 0.22));
      ctx.lineWidth = rnd.range(0.4, 1.1) * s;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke();
    }
  };
  const area = (w * H) / (64 * s * s);
  switch (kind) {
    case 'coral':
      fill(rnd.pick(['#d4675f', '#dc7a70', '#c95a57']));
      flecks(area * 2.2, (a) => `rgba(255,225,215,${a})`, (a) => `rgba(90,20,30,${a})`);
      break;
    case 'pink':
      fill(rnd.pick(['#e29aa6', '#e8a7b0', '#d98c9c']));
      flecks(area * 2, (a) => `rgba(255,240,240,${a})`, (a) => `rgba(120,40,70,${a})`, 0, 0.3);
      for (let y = rnd.range(2, 6) * s; y < H; y += rnd.range(5, 9) * s) {
        ctx.strokeStyle = `rgba(150,50,80,${rnd.range(0.1, 0.25)})`; ctx.lineWidth = 0.8 * s;
        ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y + rnd.range(-3, 3) * s); ctx.stroke();
      }
      break;
    case 'denim': {
      fill(rnd.pick(['#3f5f96', '#4c6d9d', '#35528a']));
      for (let d = -H; d < w; d += 3 * s) {
        ctx.strokeStyle = rnd.next() < 0.5 ? 'rgba(210,225,245,0.18)' : 'rgba(20,30,60,0.25)';
        ctx.lineWidth = 1.1 * s;
        ctx.beginPath(); ctx.moveTo(x0 + d, 0); ctx.lineTo(x0 + d + H, H); ctx.stroke();
      }
      for (let i = 0; i < 6; i++) {
        const rg = ctx.createRadialGradient(x0 + rnd.next() * w, rnd.next() * H, 0, x0 + rnd.next() * w, rnd.next() * H, rnd.range(20, 60) * s);
        rg.addColorStop(0, 'rgba(220,230,245,0.3)'); rg.addColorStop(1, 'rgba(220,230,245,0)');
        ctx.fillStyle = rg; ctx.fillRect(x0, 0, w, H);
      }
      break;
    }
    case 'ochre': {
      fill(rnd.pick(['#e2b020', '#d9a318', '#e8b92a']));
      flecks(area * 1.5, (a) => `rgba(255,245,200,${a})`, (a) => `rgba(140,90,10,${a})`);
      // white fibre contour lines (P32)
      for (let k = 0; k < 7; k++) {
        const y0 = rnd.range(0.05, 0.95) * H, amp = rnd.range(4, 14) * s, fr = rnd.range(0.01, 0.03) / s;
        ctx.strokeStyle = `rgba(250,246,235,${rnd.range(0.55, 0.85)})`; ctx.lineWidth = rnd.range(1.2, 2.4) * s;
        ctx.beginPath();
        for (let x = x0; x <= x1; x += 4 * s) { const y = y0 + Math.sin((x - x0) * fr + k) * amp; x === x0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
        ctx.stroke();
      }
      break;
    }
    case 'oxblood':
      fill(rnd.pick(['#8c2b24', '#7a2222', '#962f2a']));
      flecks(area * 2.5, (a) => `rgba(230,120,110,${a})`, (a) => `rgba(40,5,10,${a})`, 0, 1.2);
      break;
    case 'muslin':
      fill(rnd.pick(['#e8dfcc', '#ede5d4']));
      for (let y = 0; y < H; y += 2 * s) { ctx.fillStyle = `rgba(120,100,80,${rnd.range(0.02, 0.08)})`; ctx.fillRect(x0, y, w, s * 0.8); }
      for (let i = 0; i < 4; i++) {
        const rg = ctx.createRadialGradient(x0 + rnd.next() * w, rnd.next() * H, 0, x0 + rnd.next() * w, rnd.next() * H, rnd.range(15, 45) * s);
        const c = rnd.pick(['180,90,70', '150,110,60', '120,60,90']);
        rg.addColorStop(0, `rgba(${c},0.25)`); rg.addColorStop(1, `rgba(${c},0)`);
        ctx.fillStyle = rg; ctx.fillRect(x0, 0, w, H);
      }
      // drawn marks on muslin (P03)
      ctx.strokeStyle = 'rgba(30,20,20,0.55)'; ctx.lineWidth = 1.2 * s;
      ctx.beginPath(); ctx.moveTo(x0 + w * 0.2, H * rnd.range(0.3, 0.7));
      ctx.bezierCurveTo(x0 + w * 0.4, H * rnd.range(0.1, 0.9), x0 + w * 0.6, H * rnd.range(0.1, 0.9), x0 + w * 0.8, H * rnd.range(0.3, 0.7));
      ctx.stroke();
      break;
    case 'plum':
      fill(rnd.pick(['#6e2a4c', '#5d2442', '#7b3458']));
      flecks(area * 2, (a) => `rgba(220,150,190,${a})`, (a) => `rgba(20,5,15,${a})`, 0, 0.2);
      break;
    case 'wound': {
      // tightly wound yarn: many passes across the body
      fill('#5a2a1a');
      const cols = ['#b5452a', '#d9732f', '#e2b020', '#a3342b', '#2c4fb0', '#e8dfcc', '#c9582f'];
      let col = rnd.pick(cols);
      for (let x = x0; x < x1; x += rnd.range(1.4, 2.6) * s) {
        if (rnd.next() < 0.08) col = rnd.pick(cols);
        ctx.strokeStyle = rgba(col, rnd.range(0.75, 1), rnd.range(-25, 20));
        ctx.lineWidth = rnd.range(1.4, 2.6) * s;
        const sk = rnd.range(-6, 6) * s;
        ctx.beginPath(); ctx.moveTo(x, -2); ctx.quadraticCurveTo(x + sk, H / 2, x + rnd.range(-3, 3) * s, H + 2); ctx.stroke();
      }
      break;
    }
  }
}

function makeBodyCloth(seed, S) {
  const W = 2048, H = 256, s = 1;
  const c = canvas(W * S, H * S);
  const ctx = c.getContext('2d');
  ctx.scale(S, S);
  const rnd = makeRandom(seed ^ 0xb0d7);
  const seq = ['plum', 'coral', 'denim', 'wound', 'pink', 'muslin', 'coral', 'ochre', 'wound', 'oxblood',
    'pink', 'denim', 'coral', 'wound', 'pink', 'ochre', 'muslin', 'coral', 'wound', 'pink', 'oxblood', 'coral'];
  const pinches = [];
  const seams = [];
  let x = 0, i = 0;
  while (x < W) {
    const kind = seq[i % seq.length];
    const len = (kind === 'wound' ? rnd.range(34, 70) : rnd.range(70, 170)) * s;
    const x1 = Math.min(W, x + len);
    // irregular cut: each patch is clipped by a wavy left edge overlapping the previous
    ctx.save();
    ctx.beginPath();
    const ov = kind === 'wound' ? 0 : 10 * s;
    ctx.moveTo(x - ov, 0);
    for (let y = 0; y <= H; y += 16 * s) ctx.lineTo(x - ov + rnd.range(-7, 7) * s, y);
    ctx.lineTo(x1 + 2, H); ctx.lineTo(x1 + 2, 0); ctx.closePath();
    ctx.clip();
    clothPatch(ctx, rnd, kind, x - ov - 10 * s, x1 + 2, H, s);
    ctx.restore();
    if (kind === 'wound') pinches.push({ u0: x / W, u1: x1 / W });
    else seams.push(x - ov);
    x = x1; i++;
  }
  // blanket stitch along patch seams (P02)
  for (const sx of seams) {
    const col = rnd.pick(['rgba(245,238,225,0.85)', 'rgba(35,20,20,0.8)', 'rgba(160,40,35,0.85)']);
    ctx.strokeStyle = col; ctx.lineWidth = 1.3 * s;
    for (let y = rnd.range(3, 9) * s; y < H; y += rnd.range(9, 14) * s) {
      const jx = sx + rnd.range(-3, 3) * s;
      ctx.beginPath(); ctx.moveTo(jx - 6 * s, y); ctx.lineTo(jx + 5 * s, y + rnd.range(-2, 2) * s); ctx.stroke();
    }
  }
  // Baked cylindrical shading across v (light from the upper-left).
  const sh = ctx.createLinearGradient(0, 0, 0, H);
  sh.addColorStop(0.0, 'rgba(40,10,20,0.6)');
  sh.addColorStop(0.1, 'rgba(40,10,20,0.2)');
  sh.addColorStop(0.3, 'rgba(255,240,235,0.14)');
  sh.addColorStop(0.55, 'rgba(40,10,20,0.0)');
  sh.addColorStop(0.85, 'rgba(40,10,20,0.3)');
  sh.addColorStop(1.0, 'rgba(30,5,15,0.7)');
  ctx.fillStyle = sh;
  ctx.fillRect(0, 0, W, H);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  weaveTooth(ctx, c.width, c.height, rnd, 0.035, Math.max(2, Math.round(2 * S)));
  c.pinches = pinches;
  return c;
}

// PLACEHOLDER — cool worked gesso ground with cobalt scribble (P13).
// Deliberately grey-white, not beige.
function makeGround(seed, PW, PH, K) {
  const W = 1920, H = 1080, k = 1;
  const c = canvas(PW, PH);
  const ctx = c.getContext('2d');
  ctx.scale(PW / W, PH / H);
  const rnd = makeRandom(seed ^ 0x9e0d);
  ctx.fillStyle = '#d9d9d2';
  ctx.fillRect(0, 0, W, H);
  // Uneven gesso: big soft mottles.
  for (let i = 0; i < 140; i++) {
    const x = rnd.range(0, W), y = rnd.range(0, H), r = rnd.range(80, 420) * k;
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    const col = rnd.pick(['#f1f0ea', '#f4f3ee', '#c9ccc8', '#cfd3d4', '#d8d3c8']);
    rg.addColorStop(0, rgba(col, rnd.range(0.12, 0.4)));
    rg.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = rg;
    ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  // Brushed gesso ridges.
  for (let i = 0; i < 160; i++) {
    bristleStroke(ctx, rnd,
      gesturePath(rnd, rnd.range(0, W), rnd.range(0, H), rnd.range(200, 700) * k,
        rnd.range(-0.4, 0.4) + (rnd.next() < 0.5 ? 0 : Math.PI / 2), rnd.range(-0.3, 0.3)),
      rnd.range(40, 120) * k, rnd.pick(['#f3f2ec', '#c8cac6', '#e4e3dc']), 0.18);
  }
  // Cobalt / teal scribble (P13): fast cycloidal hand loops drifting across
  // the gesso, concentrated toward edges and corners, faint in the centre.
  const scribCols = ['#2c4b8a', '#2c3c3b', '#35608c', '#2d6f73'];
  for (let i = 0; i < 6; i++) {
    const edge = rnd.next();
    let x = edge < 0.5 ? rnd.range(0, W * 0.22) + (edge < 0.25 ? 0 : W * 0.78) : rnd.range(0, W);
    let y = edge < 0.5 ? rnd.range(0, H) : (edge < 0.75 ? rnd.range(0, H * 0.16) : rnd.range(H * 0.84, H));
    const col = rnd.pick(scribCols);
    ctx.strokeStyle = rgba(col, rnd.range(0.06, 0.15));
    ctx.lineWidth = rnd.range(0.6, 1.4) * k;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    let da = rnd.range(0, Math.PI * 2);
    const speed = rnd.range(2.5, 5) * k;
    let r = rnd.range(10, 36) * k;
    let ph = 0;
    const n = rnd.int(90, 220);
    const w = rnd.range(0.35, 0.7);
    for (let j = 0; j < n; j++) {
      ph += w + rnd.gauss() * 0.05;
      da += rnd.gauss() * 0.04;
      r = Math.max(6 * k, r + rnd.gauss() * 2.4 * k);
      x += Math.cos(da) * speed; y += Math.sin(da) * speed;
      const px = x + Math.cos(ph) * r, py = y + Math.sin(ph) * r * rnd.range(0.5, 0.9);
      j ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.stroke();
  }
  // Ultramarine dry-brush blot, lower right (P13's corner).
  for (let i = 0; i < 14; i++) {
    bristleStroke(ctx, rnd,
      gesturePath(rnd, W * rnd.range(0.84, 0.98), H * rnd.range(0.86, 1.0),
        rnd.range(120, 260) * k, rnd.range(-0.5, 0.2), rnd.range(-0.15, 0.15)),
      rnd.range(20, 48) * k, rnd.pick([PAL.ultramarine, PAL.cobalt, PAL.cobalt, PAL.oxblood]), rnd.range(0.12, 0.3));
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  weaveTooth(ctx, c.width, c.height, rnd, 0.035, Math.max(2, Math.round(3 * K)));
  return c;
}

function makeGrain(seed, size) {
  const c = canvas(size, size);
  const ctx = c.getContext('2d');
  const rnd = makeRandom(seed ^ 0x6a1);
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 128 + rnd.gauss() * 38;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

// Mean colour of an atlas window, for fibres that fray off a strip.
export function meanColor(src, x, y, w, h) {
  const ctx = src.getContext('2d');
  const d = ctx.getImageData(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))).data;
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < d.length; i += 16) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
  return [r / n, g / n, b / n];
}

export async function buildMaterials(seed, W, H, k) {
  const s = Math.max(1, k);
  const [painting, bodyCloth, ground] = await Promise.all(
    ['painting', 'bodyCloth', 'ground'].map(loadArtwork));
  return {
    painting: painting || makePainting(seed, s),
    bodyCloth: bodyCloth || makeBodyCloth(seed, s),
    ground: ground ? scaleTo(ground, W, H) : makeGround(seed, W, H, k),
    grain: makeGrain(seed, 384),
    scans: { painting: !!painting, bodyCloth: !!bodyCloth, ground: !!ground },
  };
}

function scaleTo(src, W, H) {
  const c = canvas(W, H);
  const ctx = c.getContext('2d');
  const r = Math.max(W / src.width, H / src.height);
  ctx.drawImage(src, (W - src.width * r) / 2, (H - src.height * r) / 2, src.width * r, src.height * r);
  return c;
}
