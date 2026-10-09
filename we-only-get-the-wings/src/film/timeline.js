// The study's clock. One continuous 11 s transformation, master 24 fps,
// animated on "twos" (12 held steps per second) like stop motion; the
// eyelid closure drops to 8 steps per second.
//
// Two clocks: real time t (frames) and story time τ (what the organism is
// doing). warp(t) slows the story around the eye so it is seen open, then
// closes slowly, then holds shut before the wing begins.

export const SEED_DEFAULT = 1127;
export const DURATION = 11;
export const FPS = 24;
export const FRAMES = DURATION * FPS; // 264

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

// Real-time windows around the eye.
export const EYE = {
  openHold: [5.3, 6.3],   // eye open, story slowed to 0.4x
  closing: [6.3, 7.8],    // lid closes (story 5.7 -> 6.7)
  closedHold: [7.8, 8.3], // held shut
  camIn: [4.7, 6.0],      // camera moves in on the eye
  camOut: [8.2, 9.3],     // and back out as the rib grows
};
const WARP = [[0, 0], [5.3, 5.3], [6.3, 5.7], [7.8, 6.7], [8.3, 6.75], [11, 10]];
export function warp(t) {
  for (let i = 1; i < WARP.length; i++) {
    const [t0, s0] = WARP[i - 1], [t1, s1] = WARP[i];
    if (t <= t1) return s0 + (s1 - s0) * ((t - t0) / (t1 - t0));
  }
  return 10;
}

// Quantise continuous (real) time to the held-step grid.
export function stepTime(t) {
  const rate = t >= EYE.closing[0] && t < EYE.closing[1] ? 8 : 12;
  return Math.floor(t * rate + 1e-6) / rate;
}
// Integer step index (unique per held image) for hashing jitter.
export function stepIndex(t) {
  return Math.round(stepTime(t) * 24);
}
export function frameToTime(n) { return n / FPS; }
