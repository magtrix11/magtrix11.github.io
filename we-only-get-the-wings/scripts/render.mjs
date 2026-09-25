// Frame-exact capture of the study through headless Chromium.
//
//   node scripts/render.mjs                         # all 240 frames, 1920x1080
//   node scripts/render.mjs --w 3840 --h 2160 --out renders/study01_4k
//   node scripts/render.mjs --frames 0,60,120       # selected frames only
//   node scripts/render.mjs --seed 1127
//
// Frames are written as PNG to <out>/frames/f_000.png ... and a
// render.json with seed, size and timing is written next to them.

import { createServer } from 'vite';
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => {
  if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
  return acc;
}, []));
const W = parseInt(args.w || '1920', 10);
const H = parseInt(args.h || String(Math.round((W * 9) / 16)), 10);
const SEED = parseInt(args.seed || '1127', 10);
const OUT = path.resolve(root, args.out || 'renders/study01_1080');
const FR = path.join(OUT, 'frames');
fs.mkdirSync(FR, { recursive: true });

const server = await createServer({ root, logLevel: 'error', server: { port: 0 } });
await server.listen();
const port = server.httpServer.address().port;

let browser;
const launchOpts = { args: ['--enable-unsafe-swiftshader', '--disable-gpu-vsync'] };
try { browser = await chromium.launch(launchOpts); }
catch { browser = await chromium.launch({ ...launchOpts, executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' }); }

const page = await browser.newPage({ viewport: { width: Math.min(W, 1920), height: Math.min(H, 1080) } });
page.on('console', (m) => { if (m.type() === 'error' || m.text().startsWith('[wings]')) console.log('  page:', m.text()); });
page.on('pageerror', (e) => console.error('  page error:', e.message));
await page.goto(`http://localhost:${port}/?capture=1&w=${W}&h=${H}&seed=${SEED}`);
await page.waitForFunction(() => window.__film && window.__film.ready, null, { timeout: 180000 });
await page.evaluate(() => window.__film.ready);
const total = await page.evaluate(() => window.__film.frames);
const list = args.frames ? String(args.frames).split(',').map((x) => parseInt(x, 10)) : Array.from({ length: total }, (_, i) => i);

const t0 = Date.now();
for (const n of list) {
  const data = await page.evaluate((n) => {
    window.__film.renderFrame(n);
    return document.querySelector('canvas').toDataURL('image/png');
  }, n);
  fs.writeFileSync(path.join(FR, `f_${String(n).padStart(3, '0')}.png`), Buffer.from(data.split(',')[1], 'base64'));
  if (n % 24 === 0 || list.length < 30) process.stdout.write(`  frame ${n} (${((Date.now() - t0) / 1000).toFixed(1)}s)\n`);
}
const info = await page.evaluate(() => window.__film.info);
fs.writeFileSync(path.join(OUT, 'render.json'), JSON.stringify({ seed: SEED, width: W, height: H, fps: 24, frames: list.length, info, renderedAt: new Date().toISOString() }, null, 2));
await browser.close();
await server.close();
console.log(`done: ${list.length} frames -> ${path.relative(root, FR)}`);
