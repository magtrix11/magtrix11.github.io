// Low-level drawing: affine texture mapping onto triangles (mesh
// deformation in Canvas 2D), textured ribbons, polylines.

// Map texture triangle (u0,v0)(u1,v1)(u2,v2) onto screen triangle
// (x0,y0)(x1,y1)(x2,y2). The clip is pushed out by `grow` px to hide
// antialiasing seams between neighbouring triangles.
export function texTri(ctx, img, x0, y0, x1, y1, x2, y2, u0, v0, u1, v1, u2, v2, grow = 0.6) {
  const det = (u1 - u0) * (v2 - v0) - (u2 - u0) * (v1 - v0);
  if (Math.abs(det) < 1e-6) return;
  const a = ((x1 - x0) * (v2 - v0) - (x2 - x0) * (v1 - v0)) / det;
  const b = ((y1 - y0) * (v2 - v0) - (y2 - y0) * (v1 - v0)) / det;
  const c = ((x2 - x0) * (u1 - u0) - (x1 - x0) * (u2 - u0)) / det;
  const d = ((y2 - y0) * (u1 - u0) - (y1 - y0) * (u2 - u0)) / det;
  const e = x0 - a * u0 - c * v0;
  const f = y0 - b * u0 - d * v0;

  const cx = (x0 + x1 + x2) / 3, cy = (y0 + y1 + y2) / 3;
  const g = (x, y) => {
    const dx = x - cx, dy = y - cy, l = Math.hypot(dx, dy) || 1;
    return [x + (dx / l) * grow, y + (dy / l) * grow];
  };
  const [X0, Y0] = g(x0, y0), [X1, Y1] = g(x1, y1), [X2, Y2] = g(x2, y2);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(X0, Y0); ctx.lineTo(X1, Y1); ctx.lineTo(X2, Y2);
  ctx.closePath();
  ctx.clip();
  ctx.transform(a, b, c, d, e, f);
  const umin = Math.max(0, Math.floor(Math.min(u0, u1, u2)) - 2);
  const vmin = Math.max(0, Math.floor(Math.min(v0, v1, v2)) - 2);
  const umax = Math.min(img.width, Math.ceil(Math.max(u0, u1, u2)) + 2);
  const vmax = Math.min(img.height, Math.ceil(Math.max(v0, v1, v2)) + 2);
  if (umax > umin && vmax > vmin) {
    ctx.drawImage(img, umin, vmin, umax - umin, vmax - vmin, umin, vmin, umax - umin, vmax - vmin);
  }
  ctx.restore();
}

// A ribbon: arrays of left/right edge points and matching texture coords.
// uvs[i] = [u, vLeft, vRight] in texture pixels.
export function texRibbon(ctx, img, left, right, uvs) {
  for (let i = 0; i < left.length - 1; i++) {
    const [ua, va0, va1] = uvs[i];
    const [ub, vb0, vb1] = uvs[i + 1];
    const L0 = left[i], L1 = left[i + 1], R0 = right[i], R1 = right[i + 1];
    texTri(ctx, img, L0[0], L0[1], L1[0], L1[1], R0[0], R0[1], ua, va0, ub, vb0, ua, va1);
    texTri(ctx, img, L1[0], L1[1], R1[0], R1[1], R0[0], R0[1], ub, vb0, ub, vb1, ua, va1);
  }
}

export function ribbonPath(ctx, left, right) {
  ctx.beginPath();
  ctx.moveTo(left[0][0], left[0][1]);
  for (let i = 1; i < left.length; i++) ctx.lineTo(left[i][0], left[i][1]);
  for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
  ctx.closePath();
}

export function polyline(ctx, pts) {
  if (!pts.length) return;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
}

// Resample a polyline to n points evenly by arc length.
export function resample(pts, n) {
  const d = [0];
  for (let i = 1; i < pts.length; i++) d.push(d[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = d[d.length - 1] || 1;
  const out = [];
  let j = 0;
  for (let k = 0; k < n; k++) {
    const s = (k / (n - 1)) * total;
    while (j < d.length - 2 && d[j + 1] < s) j++;
    const seg = d[j + 1] - d[j] || 1;
    const f = (s - d[j]) / seg;
    out.push([pts[j][0] + (pts[j + 1][0] - pts[j][0]) * f, pts[j][1] + (pts[j + 1][1] - pts[j][1]) * f]);
  }
  return out;
}

export function lerpPts(a, b, t) {
  return a.map((p, i) => [p[0] + (b[i][0] - p[0]) * t, p[1] + (b[i][1] - p[1]) * t]);
}

export function quadPts(p0, c, p1, n = 24) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, m = 1 - t;
    out.push([m * m * p0[0] + 2 * m * t * c[0] + t * t * p1[0], m * m * p0[1] + 2 * m * t * c[1] + t * t * p1[1]]);
  }
  return out;
}

export function polyLength(pts) {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return l;
}

// Portion of a polyline from arc-length fraction 0..f.
export function truncate(pts, f) {
  if (f >= 1) return pts.slice();
  if (f <= 0) return [pts[0]];
  const total = polyLength(pts);
  const target = total * f;
  const out = [pts[0]];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (acc + seg >= target) {
      const r = (target - acc) / (seg || 1);
      out.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * r, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * r]);
      return out;
    }
    acc += seg;
    out.push(pts[i]);
  }
  return out;
}

export function tangentAt(pts, i) {
  const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
  return [dx / l, dy / l];
}
