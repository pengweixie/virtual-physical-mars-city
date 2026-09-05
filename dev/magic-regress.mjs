// Magic-city layer regression (viewer/magic/magic-city.js). Headless Edge over
// raw CDP against a running local server; no dependencies.
//
//   node dev/magic-regress.mjs [--port 8130] [--update]
//
// Checks, in the live viewer with ?magic=1&debug=1:
//   - the layer builds with zero console errors (the favicon 404 is ignored)
//   - triangle checksum: the layer is deterministic (mulberry32 + hashes), so
//     the total must equal EXPECT.tris exactly. A silent change here usually
//     means a new rnd() call was inserted mid-stream and every later jitter
//     moved - that is allowed for a deliberate art change, never by accident
//   - crystal merge counts (static crystals merged / moving crystals kept)
//   - point-light budget (whole-scene cost: every lit material loops them)
//   - X toggle round trip, growth replay (uGrow 0 -> 1), the portal event,
//     C-key coexistence with the colony
// --update rewrites EXPECT in this file from the measured values.
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const EXPECT = { tris: 109721, merged: 204, kept: 46, wards: 7 };

const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const port = arg('port', '8130');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const DBG = 9400 + Math.floor(Math.random() * 100);
const work = mkdtempSync(path.join(tmpdir(), 'magicreg-'));
const edge = spawn(EDGE, ['--headless=new', '--disable-gpu-sandbox', '--enable-unsafe-swiftshader',
  '--no-first-run', `--remote-debugging-port=${DBG}`, `--user-data-dir=${path.join(work, 'p')}`,
  '--window-size=1280,720', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function getWs() {
  for (let i = 0; i < 40; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${DBG}/json`)).json();
      const p = list.find((t) => t.type === 'page');
      if (p) return p.webSocketDebuggerUrl;
    } catch {}
    await sleep(400);
  }
  throw new Error('no debug target');
}
let id = 0;
const pending = new Map();
const errors = [];
const ws = new WebSocket(await getWs());
await new Promise((r) => { ws.onopen = r; });
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return; }
  if (m.method === 'Runtime.exceptionThrown') {
    errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  }
  if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error'
      && !/favicon/.test((m.params.entry.url || '') + m.params.entry.text)) {
    errors.push(m.params.entry.text);
  }
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
    errors.push(m.params.args.map((a) => a.value ?? a.description).join(' '));
  }
};
const send = (method, params = {}) => new Promise((res) => {
  const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params }));
});
await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
await send('Page.navigate', { url: `http://localhost:${port}/viewer/index.html`
  + '?magic=1&t=1&x=-60&z=-400&y=75&yaw=0.6435&pitch=-0.15&fly=1&debug=1' });
await sleep(25000);

const battery = `(async () => {
  const K = (c) => dispatchEvent(new KeyboardEvent('keydown', { code: c }));
  const mg = __mars.scene.getObjectByName('magicCity');
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const growOf = () => { let u = null;
    mg.traverse((o) => { if (u === null && o.material?.uniforms?.uGrow) u = o.material.uniforms.uGrow.value; });
    return u; };
  const tris = () => { let n = 0; mg.traverse((o) => {
    if (!o.isMesh || !o.geometry?.attributes?.position) return;
    const c = o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count;
    n += c / 3 * (o.isInstancedMesh ? o.count : 1); }); return Math.round(n); };
  const r = { tris: tris(), wards: mg.children.filter((o) => /magicWard/.test(o.name)).length,
    ...(mg.userData.cryMerge || {}) };
  r.lights = 0; mg.traverse((o) => { if (o.isLight) r.lights++; });
  K('KeyX'); await sleep(2200); r.hiddenOk = mg.visible === false;
  K('KeyX'); await sleep(150); r.regrow0 = +growOf().toFixed(3);
  await sleep(5200); r.regrow1 = +growOf().toFixed(3);
  mg.userData.magic.firePortal(); await sleep(300); r.portalOk = mg.userData.magic.lastPortal > 0;
  K('KeyC'); await sleep(1800); r.colonyOk = __mars.colonyGroup.visible && mg.visible;
  r.calls = __mars.renderer.info.render.calls;
  return JSON.stringify(r);
})()`;
const res = await send('Runtime.evaluate', { expression: battery, returnByValue: true, awaitPromise: true });
ws.close();
edge.kill();
try { rmSync(work, { recursive: true, force: true }); } catch {}

if (res.result?.exceptionDetails || typeof res.result?.result?.value !== 'string') {
  const ex = res.result?.exceptionDetails;
  console.log('FAIL: battery threw:', ex?.exception?.description || ex?.text || 'no result');
  if (errors.length) console.log('page errors:', errors.join(' | '));
  process.exit(1);
}
const r = JSON.parse(res.result.result.value);
const checks = [
  ['console clean', errors.length === 0, errors.join(' | ')],
  ['triangle checksum', r.tris === EXPECT.tris, `${r.tris} vs ${EXPECT.tris}`],
  ['crystal merge', r.merged === EXPECT.merged && r.kept === EXPECT.kept,
    `${r.merged}/${r.kept} vs ${EXPECT.merged}/${EXPECT.kept}`],
  ['wards present', r.wards === EXPECT.wards, `${r.wards}`],
  ['point lights <= 5', r.lights <= 5, `${r.lights}`],
  ['X hides', r.hiddenOk, ''],
  ['growth replays', r.regrow0 < 0.2 && r.regrow1 === 1, `${r.regrow0} -> ${r.regrow1}`],
  ['portal fires', r.portalOk, ''],
  ['colony coexists', r.colonyOk, ''],
];
let fail = 0;
for (const [name, ok, info] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  (' + info + ')' : ''}`);
  if (!ok) fail++;
}
console.log(`draw calls with colony: ${r.calls}`);
if (process.argv.includes('--update')) {
  const me = new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
  const src = readFileSync(me, 'utf8').replace(/const EXPECT = \{[^}]*\};/,
    `const EXPECT = { tris: ${r.tris}, merged: ${r.merged}, kept: ${r.kept}, wards: ${r.wards} };`);
  writeFileSync(me, src);
  console.log('EXPECT updated');
}
process.exit(fail ? 1 : 0);
