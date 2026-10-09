// The study's clock. One continuous 10 s transformation, master 24 fps,
// animated on "twos" (12 held steps per second) like stop motion; the
// eyelid closure drops to 8 steps per second.
//
// Revision 3 choreography:
//   0.0–1.5  material tension already active (pressure, fibres, thread)
//   1.5–3.6  the body compresses and folds; areas move at different times
//   3.5–5.5  fragments and cavities align into a face (~1 s perceptible)
//   5.5–7.2  the face reorganises; the lid cavity is stitched into a seam
//   7.2–10   the seam extends into ribs; material catches; membrane

import { hash } from './rng.js';

export const SEED_DEFAULT = 1127;
export const DURATION = 10;
export const FPS = 24;
export const FRAMES = DURATION * FPS; // 240

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
export const easeInOut = (x) => {
  x = clamp(x);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
// Hand-placed: arrives slightly past the mark and is nudged back.
export const settle = (x, over = 0.06) => {
  x = clamp(x);
  const e = easeInOut(x);
  return e + over * Math.sin(Math.PI * clamp((x - 0.55) / 0.45));
};
export const win = (t, a, b) => clamp((t - a) / (b - a));

// A hand-animated move with its own character, seeded per element: some
// elements hesitate part-way (a plateau), each overshoots by its own amount,
// and the easing exponent differs, so nothing shares one universal curve.
export function move(t, start, dur, id) {
  const x = win(t, start, start + dur);
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const h = hash(id, 901);
  let y = x;
  if (h < 0.45) {
    // hesitation: progress stalls between a and b
    const a = 0.25 + hash(id, 902) * 0.3, len = 0.12 + hash(id, 903) * 0.18;
    if (y > a) y = y < a + len ? a : a + (y - a - len) / (1 - a - len) * (1 - a);
  }
  const p = 1.6 + hash(id, 904) * 1.8;
  const e = y < 0.5 ? Math.pow(2 * y, p) / 2 : 1 - Math.pow(2 - 2 * y, p) / 2;
  const over = hash(id, 905) * 0.13;
  return e + over * Math.sin(Math.PI * clamp((x - 0.6) / 0.4));
}

// Key moments (seconds). Kept in one place so the arc is legible.
export const K = {
  life: [0, 1.5],
  fold: [1.5, 3.6],            // control points travel A -> B, staggered
  routeStepOn: [1.6, 2.2],     // thread route quantises (data path)
  taut: [2.3, 2.7],            // route pulled straight by the folding body
  tautHold: [2.7, 3.0],        // vibration at the limit
  reroute: [3.0, 3.7],         // slack, new looping route
  rootDetach: 2.2,             // rootlets left behind as loose fibres
  faceArrive: [3.5, 4.3],      // iris cell slides into the lid cavity
  faceHold: [4.3, 5.4],        // the face is perceptible
  reorg: [5.5, 7.2],           // control points travel B -> C
  lidClose: [5.6, 6.6],        // the lid cavity is stitched shut (8 fps)
  pull: [5.9, 7.0],            // thread drawn out of the body back to the eye
  incise: [3.0, 5.0],
  ribs: [7.2, 9.4],
  cladding: [7.6, 9.5],
  joints: [7.8, 9.3],
  membrane: [8.0, 9.7],
  light: [7.8, 10.0],
  tremble: [9.3, 10.0],
  scans: [2.65, 5.55, 8.45],   // scanner-band events at moments of stress
  stress: [[2.45, 3.25], [5.45, 6.15], [8.25, 8.95]],
};

export function stressAt(t) {
  let s = 0;
  for (const [a, b] of K.stress) s = Math.max(s, Math.sin(Math.PI * win(t, a, b)));
  return s;
}

// Quantise continuous time to the held-step grid.
export function stepTime(t) {
  const rate = t >= K.lidClose[0] && t < K.lidClose[1] ? 8 : 12;
  return Math.floor(t * rate + 1e-6) / rate;
}
// Integer step index (unique per held image) for hashing jitter.
export function stepIndex(t) {
  return Math.round(stepTime(t) * 24);
}
export function frameToTime(n) { return n / FPS; }
