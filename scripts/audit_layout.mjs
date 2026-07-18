// Layout overlap audit: rotated-rectangle (SAT) test between all placed
// assets' footprints. Code assets get true bbox from their module; GLB and
// DOM-dependent modules fall back to a size_m square. Warns on any overlap.
import * as THREE from 'three';
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname)
  .replace(/^\/([A-Za-z]:)/, '$1'), '..');
const manifest = JSON.parse(
  readFileSync(path.join(root, 'models', 'manifest.json'), 'utf8'));

const rects = [];
for (const a of manifest.assets) {
  if (!a.pos || a.kind === 'scatter') continue;
  let w = a.size_m || 20, d = a.size_m || 20;      // fallback: square
  if (a.type === 'code') {
    try {
      const mod = await import(pathToFileURL(
        path.join(root, 'viewer', a.module)).href);
      const g = mod.build(THREE);
      const bb = new THREE.Box3().setFromObject(g);
      const sz = new THREE.Vector3(); bb.getSize(sz);
      w = sz.x; d = sz.z;
    } catch { /* DOM-dependent: keep square fallback */ }
  }
  rects.push({ id: a.id, x: a.pos[0], z: a.pos[1], mate: a.mate,
    hw: w / 2, hd: d / 2, rot: (a.rotation_deg || 0) * Math.PI / 180 });
}

function corners(r) {
  const c = Math.cos(r.rot), s = Math.sin(r.rot), out = [];
  for (const [lx, lz] of [[r.hw, r.hd], [r.hw, -r.hd], [-r.hw, -r.hd], [-r.hw, r.hd]])
    out.push([r.x + lx * c + lz * s, r.z - lx * s + lz * c]);
  return out;
}
function overlapSAT(A, B) {                        // separating axis on 2 rects
  const ca = corners(A), cb = corners(B);
  for (const poly of [ca, cb]) {
    for (let i = 0; i < 4; i++) {
      const [x1, z1] = poly[i], [x2, z2] = poly[(i + 1) % 4];
      const ax = z2 - z1, az = x1 - x2;            // edge normal
      const proj = (pts) => {
        let mn = Infinity, mx = -Infinity;
        for (const [px, pz] of pts) {
          const p = px * ax + pz * az;
          mn = Math.min(mn, p); mx = Math.max(mx, p);
        }
        return [mn, mx];
      };
      const [a1, a2] = proj(ca), [b1, b2] = proj(cb);
      if (a2 < b1 || b2 < a1) return false;        // gap found
    }
  }
  return true;
}

let bad = 0;
for (let i = 0; i < rects.length; i++)
  for (let j = i + 1; j < rects.length; j++) {
    const A = rects[i], B = rects[j];
    // deliberate co-location (rocket on its pad): either side declares
    // mate:<id> in the manifest and the pair is exempt
    if (A.mate === B.id || B.mate === A.id) continue;
    if (overlapSAT(A, B)) {
      console.log(`OVERLAP: ${A.id}  <->  ${B.id}`);
      bad++;
    }
  }
console.log(bad ? `\n${bad} overlap(s) found` : 'layout clean: no overlaps');
process.exitCode = bad ? 1 : 0;
