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

// ---- road-clearance check (added after the TT-1 incident: an exhibit was
// placed straddling the hub->reactor spur; roads are engine geometry, not
// manifest assets, so the SAT pass above cannot see them). Segments mirror
// the road() calls in viewer/main.js — update BOTH places if roads change.
const CX = -350, CZ = -100;                        // colony hub (main.js)
const roads = [
  { name: 'hub->pad',       a: [CX, CZ], b: [CX + 160, CZ - 45], w: 6 },
  { name: 'hub->solar',     a: [CX, CZ], b: [CX + 58, CZ + 92],  w: 4 },
  { name: 'hub->greenhouse',a: [CX, CZ], b: [CX + 64, CZ],       w: 4 },
  { name: 'hub->reactor',   a: [CX, CZ], b: [CX - 90, CZ - 70],  w: 4 },
  // densification spurs (mirrored from main.js SPURS)
  { name: 'east-trunk',     a: [-190, -145], b: [100, -125], w: 5 },
  { name: 'heli-spur',      a: [100, -125],  b: [148, -52],  w: 4 },
  { name: 'env-spur-1',     a: [100, -125],  b: [150, -190], w: 4 },
  { name: 'env-spur-2',     a: [150, -190],  b: [285, -278], w: 4 },
  { name: 'isru-link',      a: [62, 18],     b: [83, 10],    w: 4 },
  { name: 'dome-link',      a: [95, 20],     b: [95, 44],    w: 4 },
  { name: 'village-spur',   a: [-350, -100], b: [-290, -55], w: 4 },
  { name: 'launch-highway', a: [178, -40],   b: [705, 220],  w: 5 },
  // utility corridors: elevated pipe racks (mirrored from main.js pipeRack calls)
  { name: 'pipe-ch4',       a: [52, 32],     b: [725, 235],  w: 2 },
  { name: 'pipe-heat-1',    a: [-140, 58],   b: [-109, 70],  w: 2 },
  { name: 'pipe-heat-2',    a: [-109, 70],   b: [-109, 132], w: 2 },
  { name: 'pipe-heat-3',    a: [-109, 132],  b: [-84, 352],  w: 2 },
  { name: 'pipe-h2o',       a: [2, 106],     b: [80, 72],    w: 2 },
];
try {                                               // memorial highway to rover
  const m = JSON.parse(readFileSync(
    path.join(root, 'data', 'mission', 'mission.json'), 'utf8'));
  const wIn = m.waypoints.filter((w) => w.in);
  const rover = m.rover.in ? m.rover : wIn[wIn.length - 1];
  if (rover) roads.push({ name: 'memorial-highway',
    a: [CX, CZ], b: [rover.x, rover.z], w: 5 });
} catch { /* no mission data: skip the highway */ }

const ROAD_MARGIN = 2;                              // shoulder clearance, m
// exact test: inflate each road segment into a rotated rect and reuse the SAT
const roadRect = (rd) => {
  const [ax, az] = rd.a, [bx, bz] = rd.b;
  const dx = bx - ax, dz = bz - az, len = Math.hypot(dx, dz);
  // rects rotate as [x·cos+z·sin, -x·sin+z·cos]: rot = atan2(-dz,dx) puts the
  // local +x half-length axis along the segment
  return { id: 'road', x: (ax + bx) / 2, z: (az + bz) / 2,
    hw: len / 2, hd: rd.w / 2 + ROAD_MARGIN, rot: Math.atan2(-dz, dx) };
};
// roads legitimately terminate at a facility's doorstep — those pairs are
// deliberate, list them here (asset id -> road name)
const ROAD_EXEMPT = new Set([
  'hab-tunnel-01|hub->solar',       // solar spur skirts the gate plaza (original layout)
  'ops-printer-01|isru-link',       // link ends at the print-works doorstep
  'ops-spaceport-02|launch-highway',// highway ends at the launch-complex gate
  'veh-heli-01|heli-spur',          // spur ends at the helipad apron
  'veh-heli-01|launch-highway',     // highway departs from the same apron
  'hab-village-01|village-spur',    // spur ends at the village west mouth
  // pipe racks terminate at their facilities by design
  'res-isru-01|pipe-ch4', 'ops-spaceport-02|pipe-ch4', 'veh-rocket-02|pipe-ch4',
  'pwr-fusion-01|pipe-heat-1', 'pwr-radiator-01|pipe-heat-3',
  'res-rodwell-01|pipe-h2o', 'res-dome-01|pipe-h2o',
]);
for (const r of rects) {
  for (const rd of roads) {
    if (ROAD_EXEMPT.has(`${r.id}|${rd.name}`)) continue;
    if (overlapSAT(r, roadRect(rd))) {
      console.log(`ROAD CLASH: ${r.id} footprint crosses ${rd.name}` +
        ` (road w=${rd.w} m + ${ROAD_MARGIN} m shoulder)`);
      bad++;
    }
  }
}

console.log(bad ? `\n${bad} problem(s) found` : 'layout clean: no overlaps, roads clear');
process.exitCode = bad ? 1 : 0;
