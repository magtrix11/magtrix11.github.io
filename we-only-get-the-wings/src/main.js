// Entry point. The page shows only the film frame. Development controls
// are keyboard-only and never draw into the canvas:
//   space  pause / play        r  restart
//   ← / →  step one frame      s  save current frame as PNG
//   Status is reported in the console and the tab title, outside the frame.
//
// URL params: ?w=1920&h=1080&seed=1127&capture=1

import p5 from 'p5';
import { createFilm } from './film/film.js';
import { SEED_DEFAULT, DURATION, FPS, FRAMES } from './film/timeline.js';

const q = new URLSearchParams(location.search);
const W = parseInt(q.get('w') || '1920', 10);
const H = parseInt(q.get('h') || String(Math.round((W * 9) / 16)), 10);
const SEED = parseInt(q.get('seed') || String(SEED_DEFAULT), 10);
const CAPTURE = q.get('capture') === '1';

let resolveReady;
const ready = new Promise((r) => (resolveReady = r));

new p5((p) => {
  let film = null;
  let playing = !CAPTURE;
  let frame = 0;
  let t0 = 0;

  p.setup = async () => {
    p.pixelDensity(1);
    p.createCanvas(W, H);
    p.noLoop();
    p.background(0);
    film = await createFilm(p, { W, H, seed: SEED });
    window.__film = {
      ready,
      seed: SEED, W, H, fps: FPS, frames: FRAMES, duration: DURATION,
      info: film.info,
      renderFrame(n) { frame = n; film.renderAt(n / FPS); return true; },
    };
    console.log('[wings] ready', { seed: SEED, W, H, frames: FRAMES, scans: film.info.scans });
    resolveReady(true);
    film.renderAt(0);
    if (!CAPTURE) { t0 = p.millis(); p.loop(); }
  };

  p.draw = () => {
    if (!film || CAPTURE) return;
    if (playing) frame = Math.floor(((p.millis() - t0) / 1000) * FPS) % FRAMES;
    film.renderAt(frame / FPS);
    document.title = `wings ${String(frame).padStart(3, '0')}/${FRAMES}${playing ? '' : ' ▮▮'}`;
  };

  p.keyPressed = () => {
    if (!film || CAPTURE) return;
    if (p.key === ' ') { playing = !playing; if (playing) t0 = p.millis() - (frame / FPS) * 1000; }
    else if (p.key === 'r') { frame = 0; t0 = p.millis(); }
    else if (p.keyCode === p.RIGHT_ARROW) { playing = false; frame = Math.min(FRAMES - 1, frame + 1); }
    else if (p.keyCode === p.LEFT_ARROW) { playing = false; frame = Math.max(0, frame - 1); }
    else if (p.key === 's') p.saveCanvas(`wings_s${SEED}_f${String(frame).padStart(3, '0')}`, 'png');
    return false;
  };
});
