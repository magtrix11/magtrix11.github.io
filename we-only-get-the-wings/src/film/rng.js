// Deterministic randomness. Everything visual derives from SEED.
// Stateful streams (mulberry32) are used only at construction time;
// per-step jitter uses the stateless hash so any frame can be rendered
// in isolation (scrubbing, parallel capture) and still match.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Stateless hash of up to four integers -> [0, 1).
export function hash(a = 0, b = 0, c = 0, d = 0) {
  let h = 2166136261 >>> 0;
  for (const v of [a, b, c, d]) {
    h ^= (v | 0) + 0x9e3779b9 + (h << 6) + (h >>> 2);
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
  }
  return (h >>> 0) / 4294967296;
}

export function makeRandom(seed) {
  const r = mulberry32(seed);
  const api = {
    next: r,
    range: (a, b) => a + (b - a) * r(),
    int: (a, b) => Math.floor(a + (b - a + 1) * r()),
    pick: (arr) => arr[Math.floor(r() * arr.length)],
    gauss: () => {
      let u = 0, v = 0;
      while (u === 0) u = r();
      while (v === 0) v = r();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    },
    weighted: (items) => {
      const total = items.reduce((s, it) => s + it[1], 0);
      let x = r() * total;
      for (const it of items) { x -= it[1]; if (x <= 0) return it[0]; }
      return items[items.length - 1][0];
    },
  };
  return api;
}

// 1D value noise with smooth interpolation, seeded. Used for shape
// irregularity (widths, edges), never as a motion field.
export function makeNoise1D(seed, size = 256) {
  const r = mulberry32(seed);
  const table = Array.from({ length: size }, () => r() * 2 - 1);
  return (x) => {
    const i = Math.floor(x);
    const f = x - i;
    const a = table[((i % size) + size) % size];
    const b = table[(((i + 1) % size) + size) % size];
    const s = f * f * (3 - 2 * f);
    return a + (b - a) * s;
  };
}
