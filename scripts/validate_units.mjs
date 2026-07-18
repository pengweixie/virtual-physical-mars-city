// Validate code-asset modules against MODELS.md §4: build(THREE) returns a
// Group, real-metric bbox matches meta.size_m, tri budget <= 50k, origin at
// ground (minY ~ 0), nightMats/lights/beams present.
import * as THREE from 'three';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

// derive the unit list from the manifest (single source of truth) so newly
// registered code assets can never silently escape validation again
import { readFileSync } from 'node:fs';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');
const manifest = JSON.parse(readFileSync(path.join(root, 'models', 'manifest.json'), 'utf8'));
const UNITS = manifest.assets
  .filter((a) => a.type === 'code' && a.kind !== 'scatter' && a.kind !== 'interior')
  .map((a) => a.id);
const dir = path.join(root, 'viewer', 'units');

for (const id of UNITS) {
  let mod, g;
  try {
    mod = await import(pathToFileURL(path.join(dir, id + '.js')).href);
    g = mod.build(THREE);
  } catch (e) {
    if (/document is not defined|window is not defined/.test(e.message)) {
      console.log(`\n=== ${id} ===\n  SKIP: DOM-dependent (canvas screen etc.) — validate in browser`);
      continue;
    }
    console.log(`\n=== ${id} ===\n  XX  build failed: ${e.message}`);
    process.exitCode = 1;
    continue;
  }
  const { meta } = mod;
  g.updateMatrixWorld(true);

  let tris = 0, meshes = 0;
  g.traverse((o) => {
    if (o.isMesh) {
      meshes++;
      const idx = o.geometry.index;
      tris += (idx ? idx.count : o.geometry.attributes.position.count) / 3;
    }
  });
  const bb = new THREE.Box3().setFromObject(g);
  const sz = new THREE.Vector3(); bb.getSize(sz);
  const axis = meta.size_axis === 'height' ? sz.y : Math.max(sz.x, sz.z);

  const ok = [];
  ok.push(['returns Group', g.isGroup]);
  ok.push(['meta.id matches', meta.id === id]);
  ok.push([`tris <= 50k (${(tris | 0).toLocaleString()})`, tris <= 50000]);
  ok.push([`bbox ${meta.size_axis} ${axis.toFixed(1)}m vs size_m ${meta.size_m}`,
    Math.abs(axis - meta.size_m) / meta.size_m < 0.25]);
  ok.push([`minY ${bb.min.y.toFixed(2)} ~ ground`, bb.min.y > -1.6 && bb.min.y < 0.3]);
  // nightMats/lights/beams/sensors are OPTIONAL per MODELS.md §4 — valid when
  // absent, but must be arrays when present
  const optArr = (v) => v === undefined || Array.isArray(v);
  ok.push(['nightMats absent-or-array', optArr(g.userData.nightMats)]);
  ok.push(['lights absent-or-array', optArr(g.userData.lights)]);
  ok.push(['beams absent-or-array', optArr(g.userData.beams)]);
  ok.push(['sensors absent-or-array', optArr(g.userData.sensors)]);

  console.log(`\n=== ${id}  "${meta.name}" ===`);
  console.log(`  size ${sz.x.toFixed(1)} x ${sz.y.toFixed(1)} x ${sz.z.toFixed(1)} m` +
    `  |  ${meshes} meshes, ${(tris | 0).toLocaleString()} tris` +
    `  |  nightMats ${g.userData.nightMats?.length ?? 0}, ` +
    `lights ${g.userData.lights?.length ?? 0}, ` +
    `sensors ${g.userData.sensors?.length ?? 0}`);
  for (const [label, pass] of ok) console.log(`  ${pass ? 'OK ' : 'XX '} ${label}`);
  if (ok.some(([, p]) => !p)) process.exitCode = 1;
}
