// Digital mechanisms that act on whole frames:
//   - the ground's memory (frame persistence / path memory)
//   - cast shadows (blurred silhouette buffers)
//   - the scanner band (temporal lag + channel misregistration)
//   - grain and per-step exposure flicker (held-step cadence)

import { hash } from './rng.js';
import { K, win, lerp } from './timeline.js';

export function compositeShadows(ctx, low, lifted, light, k) {
  const dx = Math.cos(light.dir) * light.dist * k, dy = Math.sin(light.dir) * light.dist * k;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'multiply';
  ctx.filter = `blur(${(light.blur * k).toFixed(1)}px)`;
  ctx.globalAlpha = 0.34;
  ctx.drawImage(low, dx, dy);
  ctx.filter = `blur(${(light.blur * 2.4 * k).toFixed(1)}px)`;
  ctx.globalAlpha = 0.24;
  ctx.drawImage(lifted, dx * 2.8, dy * 2.8);
  ctx.restore();
}

// A flatbed-scanner bar sweeps down the frame. Inside it the image lags
// one held step behind (the scanner caught the specimen moving) and the
// R and B channels are out of register.
export function scanBand(ctx, prev, t, W, H, k, tmp, band) {
  let active = null;
  for (const s of K.scans) { const f = win(t, s, s + 0.55); if (f > 0 && f < 1) active = f; }
  if (active === null || !prev.hasFrame) return;
  const bh = Math.round(150 * k);
  const y = Math.round(lerp(-bh, H, active));
  const y0 = Math.max(0, y), y1 = Math.min(H, y + bh);
  if (y1 <= y0) return;
  const h = y1 - y0;
  const bctx = band.getContext('2d'), tctx = tmp.getContext('2d');
  bctx.setTransform(1, 0, 0, 1, 0, 0);
  bctx.globalCompositeOperation = 'source-over';
  bctx.fillStyle = '#000';
  bctx.fillRect(0, 0, W, h);
  const shift = Math.round(6 * k);
  const chans = [['#ff0000', -shift], ['#00ff00', 0], ['#0000ff', shift]];
  for (const [col, dx] of chans) {
    tctx.globalCompositeOperation = 'source-over';
    tctx.clearRect(0, 0, W, h);
    tctx.drawImage(prev, 0, y0, W, h, dx, 0, W, h);
    tctx.globalCompositeOperation = 'multiply';
    tctx.fillStyle = col;
    tctx.fillRect(0, 0, W, h);
    bctx.globalCompositeOperation = 'lighter';
    bctx.drawImage(tmp, 0, 0, W, h, 0, 0, W, h);
  }
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(band, 0, 0, W, h, 0, y0, W, h);
  // sensor striation and the lamp's leading edge
  ctx.fillStyle = 'rgba(20,20,30,0.07)';
  for (let yy = y0; yy < y1; yy += Math.max(2, Math.round(3 * k))) ctx.fillRect(0, yy, W, Math.max(1, Math.round(k)));
  ctx.fillStyle = 'rgba(255,255,250,0.28)';
  if (y + bh <= H) ctx.fillRect(0, y + bh - Math.round(2 * k), W, Math.round(2 * k));
  ctx.restore();
}

export function grainAndFlicker(ctx, grain, step, W, H, k) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const pat = ctx.createPattern(grain, 'repeat');
  const ox = Math.floor(hash(step, 1) * grain.width), oy = Math.floor(hash(step, 2) * grain.height);
  ctx.translate(-ox, -oy);
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.085;
  ctx.fillStyle = pat;
  ctx.fillRect(0, 0, W + grain.width, H + grain.height);
  ctx.restore();
  // exposure flicker, per held step (stop-motion lamp variance)
  const e = (hash(step, 99) - 0.5) * 0.028;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = e > 0 ? `rgba(255,250,240,${e})` : `rgba(18,14,22,${-e})`;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}
