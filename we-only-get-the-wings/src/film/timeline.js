// The study's clock. One continuous 10 s transformation, master 24 fps,
// animated on "twos" (12 held steps per second) like stop motion; the
// eyelid closure drops to 8 steps per second.

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
  return e + over * Math.sin(Math.PI * clamp((x - 0.55) / 0.45)) ;
};
export const win = (t, a, b) => clamp((t - a) / (b - a));

// Key moments (seconds). Kept in one place so the arc is legible.
export const K = {
  breathEnd: 2.4,
  routeStepOn: [2.5, 3.1],     // thread route quantises (data path)
  coil: [2.4, 5.0],            // body curls head-first into a loop
  taut: [3.3, 3.8],            // route pulled straight
  tautHold: [3.8, 4.15],       // vibration at the limit
  reroute: [4.15, 4.9],        // slack, new looping route
  rootDetach: 3.0,             // rootlets left behind as loose fibres
  tailToEye: [3.6, 5.1],       // thread tip re-laid into eye outline
  faceArrive: [4.4, 5.8],      // strips and cells arrive as face parts
  lidClose: [5.7, 6.7],        // eyelid closes (8 fps cadence)
  incise: [5.0, 6.6],
  ribs: [6.9, 8.9],            // procedural rib growth
  cladding: [7.3, 9.4],        // strips migrate onto ribs
  joints: [7.6, 9.2],          // cells become rib joints
  membrane: [7.8, 9.7],
  light: [7.8, 10.0],          // light swings toward grazing
  scans: [3.35, 6.85, 8.35],   // scanner-band events (start times)
};

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
