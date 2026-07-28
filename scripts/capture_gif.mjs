// Animated-capture tool for asset GIFs (MODELS.md §7).
// Records the live viewer through headless Edge CDP, then assembles a GIF
// with ffmpeg (two-pass palette). Real elapsed time drives the encoder
// framerate, so motion speed is preserved regardless of capture cost.
//
//   node scripts/capture_gif.mjs --url "?inspect=res-mine-01&colony=1&t=15" \
//        --out snaps/anim/res-mine-01.gif [--seconds 10] [--width 960] \
//        [--wait 15000] [--eval "js run before recording"] [--keepui]
//
// Defaults: 10 s, 960 px wide (16:9), UI hidden + label sprites killed,
// debug=1 auto-appended (so --eval can use window.__mars).
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, statSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const arg = (name, dflt) => {
  const i = process.argv.indexOf('--' + name);
  return i > 0 ? process.argv[i + 1] : dflt;
};
const has = (name) => process.argv.includes('--' + name);

const url0 = arg('url', null);
const out = arg('out', null);
if (!url0 || !out) {
  console.error('usage: capture_gif.mjs --url "?..." --out snaps/anim/x.gif');
  process.exit(1);
}
const seconds = Number(arg('seconds', 10));
const W = Number(arg('width', 960));
const H = Number(arg('height', Math.round(W * 9 / 16)));
const wait = Number(arg('wait', 15000));
const outFps = Number(arg('fps', 12));
const preEval = arg('eval', '');

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PORT = 9260 + Math.floor(Math.random() * 100);
const work = mkdtempSync(path.join(tmpdir(), 'marsgif-'));
const url = url0.includes('debug=') ? url0 : url0 + (url0.includes('?') ? '&' : '?') + 'debug=1';

const edge = spawn(EDGE, [
  '--headless=new', '--disable-gpu-sandbox', '--enable-unsafe-swiftshader',
  '--no-first-run', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${path.join(work, 'profile')}`,
  `--window-size=${W},${H + 90}`, 'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function getWs() {
  for (let i = 0; i < 30; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
      const page = list.find((t) => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(500);
  }
  throw new Error('no debug target');
}

let msgId = 0;
const pending = new Map();
const ws = new WebSocket(await getWs());
await new Promise((r) => { ws.onopen = r; });
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
};
const send = (method, params = {}) => new Promise((res) => {
  const id = ++msgId;
  pending.set(id, res);
  ws.send(JSON.stringify({ id, method, params }));
});
const evalJs = async (expr) => (await send('Runtime.evaluate',
  { expression: expr, returnByValue: true, awaitPromise: true })).result?.result?.value;

await send('Page.enable');
await send('Runtime.enable');
await send('Network.enable');
await send('Network.setCacheDisabled', { cacheDisabled: true });
await send('Emulation.setDeviceMetricsOverride',
  { width: W, height: H, deviceScaleFactor: 1, mobile: false });

console.log('loading', url);
await send('Page.navigate', { url: 'http://localhost:8123/viewer/' + url });
await sleep(wait);
if (!has('keepui')) {
  await evalJs("[...document.body.children].forEach(el=>{if(el.tagName!=='CANVAS')el.style.visibility='hidden'});1");
  await evalJs("(()=>{try{__mars.scene.traverse(o=>{if(o.isSprite)o.material.opacity=0})}catch(e){};1})()");
}
if (preEval) { console.log('pre-eval ->', await evalJs(preEval)); }
await sleep(600);

console.log(`recording ${seconds}s ...`);
let n = 0;
const t0 = Date.now();
while ((Date.now() - t0) / 1000 < seconds) {
  const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 88 });
  writeFileSync(path.join(work, `f${String(n++).padStart(4, '0')}.jpg`),
    Buffer.from(shot.result.data, 'base64'));
}
const elapsed = (Date.now() - t0) / 1000;
const capFps = n / elapsed;
console.log(`${n} frames in ${elapsed.toFixed(1)}s (${capFps.toFixed(1)} fps)`);
ws.close();
edge.kill();

mkdirSync(path.dirname(out), { recursive: true });
execFileSync('ffmpeg', ['-y', '-framerate', capFps.toFixed(3),
  '-i', path.join(work, 'f%04d.jpg'),
  '-vf', `fps=${outFps},scale=${W}:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4`,
  out], { stdio: 'pipe' });
rmSync(work, { recursive: true, force: true });
console.log(`saved ${out} (${(statSync(out).size / 1048576).toFixed(1)} MB)`);
