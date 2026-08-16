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
  { name: 'mine-spur',      a: [100, -125],  b: [138, -122], w: 5 },
  { name: 'industry-link',  a: [100, -125],  b: [100, -14],  w: 5 },
  { name: 'crawlerway',     a: [600, 300],   b: [750, 250],  w: 12 },
  { name: 'crawler-park',   a: [600, 300],   b: [700, 370],  w: 12 },
  { name: 'payload-link',   a: [480, 320],   b: [600, 300],  w: 6 },
  { name: 'campus-tie',     a: [636, 190],   b: [600, 300],  w: 5 },
  // utility corridors: elevated pipe racks (mirrored from main.js pipeRack calls)
  { name: 'pipe-ch4',       a: [52, 32],     b: [725, 235],  w: 2 },
  { name: 'pipe-heat-1',    a: [-140, 58],   b: [-109, 70],  w: 2 },
  { name: 'pipe-heat-2',    a: [-109, 70],   b: [-109, 132], w: 2 },
  { name: 'pipe-heat-3',    a: [-109, 132],  b: [-84, 352],  w: 2 },
  { name: 'pipe-h2o',       a: [2, 106],     b: [80, 72],    w: 2 },
  { name: 'pipe-lox',       a: [55, 22],     b: [728, 225],  w: 2 },
  { name: 'pipe-h2o-isru',  a: [63, 79],     b: [44, 45],    w: 2 },
  { name: 'pipe-roast',     a: [68, -50],    b: [50, -2],    w: 2 },
  { name: 'pipe-o2-sulfur-1', a: [70, -70],  b: [0, 20],     w: 2 },
  { name: 'pipe-o2-sulfur-2', a: [0, 20],    b: [5, 60],     w: 2 },
  { name: 'pipe-o2-city-1', a: [5, 60],      b: [-105, -25], w: 2 },
  { name: 'pipe-o2-city-2', a: [-105, -25],  b: [-250, -105], w: 2 },
  { name: 'pipe-o2-city-3', a: [-250, -105], b: [-330, -70], w: 2 },
  { name: 'pipe-o2-city-4', a: [-330, -70],  b: [-330, -38], w: 2 },
  { name: 'pipe-co2-sab',   a: [5, 60],      b: [40, 25],    w: 2 },
  { name: 'pipe-sew',       a: [-330, -30],  b: [-300, 40],  w: 2 },
  // buried cable trenches (mirrored from the cableTrench calls; G-Q vertical
  // riser has no surface footprint and is deliberately absent)
  { name: 'G-A',  a: [-140, 40],   b: [-205, 10],   w: 2 },
  { name: 'G-B',  a: [-205, 10],   b: [-230, 90],   w: 1 },
  { name: 'G-C1', a: [-205, 10],   b: [-160, -5],   w: 1 },
  { name: 'G-C2', a: [-160, -5],   b: [-100, -5],   w: 1 },
  { name: 'G-C3', a: [-100, -5],   b: [-90, 120],   w: 1 },
  { name: 'G-D1', a: [-205, 10],   b: [-300, 10],   w: 1 },
  { name: 'G-D2', a: [-300, 10],   b: [-350, -100], w: 1 },
  { name: 'G-E',  a: [-205, 10],   b: [45, 15],     w: 1 },
  { name: 'G-F',  a: [45, 15],     b: [150, -120],  w: 1 },
  { name: 'G-G',  a: [150, -120],  b: [750, 250],   w: 1 },
  { name: 'G-H',  a: [150, -120],  b: [500, 700],   w: 1 },
  { name: 'G-J',  a: [-350, -100], b: [-350, -280], w: 1 },
  { name: 'G-K1', a: [-350, -100], b: [-684, -220], w: 1 },
  { name: 'G-K2', a: [-684, -220], b: [-700, -520], w: 1 },
  { name: 'G-L',  a: [-350, -100], b: [-250, -46],  w: 1 },
  { name: 'G-M',  a: [-350, -100], b: [-372, -18],  w: 1 },
  { name: 'G-N',  a: [-350, -100], b: [-560, -220], w: 1 },
  { name: 'G-P',  a: [150, -120],  b: [300, -300],  w: 1 },
  { name: 'G-R1', a: [-140, -780], b: [-200, -120], w: 1 },
  { name: 'G-R2', a: [-200, -120], b: [-205, 10],   w: 1 },
  { name: 'G-S1', a: [-140, -780], b: [-345, -110], w: 1 },
  { name: 'G-S2', a: [-345, -110], b: [-330, -30],  w: 1 },
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
  'res-isru-01|pipe-lox', 'ops-spaceport-02|pipe-lox', 'veh-rocket-02|pipe-lox',
  'res-isru-01|pipe-h2o-isru',      // the Sabatier's water inlet, by design
  'res-mine-01|mine-spur',          // spur ends at the pit load-out apron
  // launch campus roads terminate at their buildings by design
  'ops-vab-01|crawlerway', 'ops-spaceport-02|crawlerway', 'veh-rocket-02|crawlerway',
  'ops-vab-01|crawler-park', 'veh-ground-01|crawler-park',
  'ops-vab-01|payload-link', 'ops-payload-01|payload-link',
  'ops-vab-01|campus-tie',
  'res-sulfur-01|pipe-roast', 'res-isru-01|pipe-roast',   // kiln <-> electrolyser
  // life-support corridors terminate at their facilities by design
  'res-sulfur-01|pipe-o2-sulfur-1', 'res-eclss-01|pipe-o2-sulfur-2',
  'res-eclss-01|pipe-o2-city-1', 'hab-tunnel-01|pipe-o2-city-4',
  'res-eclss-01|pipe-co2-sab', 'res-isru-01|pipe-co2-sab',
  'hab-tunnel-01|pipe-sew', 'res-recycle-01|pipe-sew',
  // grid corridors terminate at (or feed) these facilities by design
  'pwr-fusion-01|G-A', 'pwr-grid-01|G-A', 'pwr-grid-01|G-B', 'pwr-storage-01|G-B',
  'pwr-grid-01|G-C1', 'ops-compute-01|G-C3', 'pwr-grid-01|G-D1', 'pwr-grid-01|G-E',
  'hab-tunnel-01|G-D2',   // buried run through the gate-berm toe, deliberate
  'res-mine-01|G-P',      // node-S sits at the mine junction with G-F/G-G/G-H
  'res-isru-01|G-E', 'res-isru-01|G-F', 'res-mine-01|G-F', 'res-mine-01|G-G',
  'ops-spaceport-02|G-G', 'veh-rocket-02|G-G', 'res-mine-01|G-H',
  'ops-spaceport-01|G-H', 'veh-rocket-01|G-H', 'com-station-01|G-J',
  'sci-seis-01|G-K2', 'hab-village-01|G-L', 'hab-lift-01|G-M', 'hab-tunnel-01|G-M',
  'sci-obs-01|G-N', 'sci-weather-01|G-P',
  'pwr-fission-01|G-R1', 'pwr-grid-01|G-R2',      // fission tie doorsteps
  'pwr-fission-01|G-S1', 'hab-tunnel-01|G-S2',    // survival bypass doorsteps
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
