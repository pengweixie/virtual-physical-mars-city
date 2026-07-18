// Builds the Mars ISRU propellant plant (Sabatier methane plant) as a single
// GLB asset in E:\Claude\mars_buildings. Run from anywhere:
//   node scripts/build_isru_plant.mjs
// Geometry is procedural three.js primitives; the rust dust film on upward
// surfaces is baked into vertex colors so the GLB needs no textures.

import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// GLTFExporter's binary path uses FileReader, which Node lacks.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((r) => { this.result = r; if (this.onloadend) this.onloadend(); });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((r) => {
      this.result = 'data:application/octet-stream;base64,' + Buffer.from(r).toString('base64');
      if (this.onloadend) this.onloadend();
    });
  }
};

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'mars_buildings', 'isru_plant.glb');

// ---------------------------------------------------------------- palette
const C = {
  regolith: 0x9c5a3c,
  regolithDark: 0x7d4630,
  pad: 0x9aa0a4,
  white: 0xe9e7e2,
  lightGray: 0xb9bdc1,
  midGray: 0x8b9094,
  darkGray: 0x54585c,
  black: 0x232527,
  orange: 0xe4661c,
  cream: 0xd9cfb6,    // insulation cross-section on cutaway faces
  copper: 0xa5643e,   // cooling coil
  catalyst: 0x50423a, // Ru/Al2O3 pellet bed
  gold: 0xc9a227,     // MLI foil on cryo inner vessels
};
const DUST = new THREE.Color(0xa9603c);

const root = new THREE.Group();
root.name = 'ISRU_Plant';

// Every mesh shares one vertex-colored material; per-part color and dust
// strength live in userData until the bake pass.
const sharedMat = new THREE.MeshStandardMaterial({
  color: 0xffffff, vertexColors: true, roughness: 0.88, metalness: 0.05,
  side: THREE.DoubleSide, // cutaway shells are open surfaces
});

function mesh(geo, color, { dust = 0.5, grain = 0 } = {}) {
  const m = new THREE.Mesh(geo, sharedMat);
  m.userData.color = new THREE.Color(color);
  m.userData.dust = dust;
  m.userData.grain = grain;
  return m;
}
function box(parent, w, h, d, x, y, z, color, opts = {}) {
  const m = mesh(new THREE.BoxGeometry(w, h, d), color, opts);
  m.position.set(x, y, z);
  if (opts.ry) m.rotation.y = opts.ry;
  if (opts.rx) m.rotation.x = opts.rx;
  if (opts.rz) m.rotation.z = opts.rz;
  parent.add(m);
  return m;
}
function cyl(parent, rt, rb, h, x, y, z, color, opts = {}) {
  const m = mesh(new THREE.CylinderGeometry(rt, rb, h, opts.seg || 28), color, opts);
  m.position.set(x, y, z);
  if (opts.rx) m.rotation.x = opts.rx;
  if (opts.rz) m.rotation.z = opts.rz;
  parent.add(m);
  return m;
}
function sph(parent, r, x, y, z, color, opts = {}) {
  const m = mesh(new THREE.SphereGeometry(r, opts.w || 32, opts.h || 22), color, opts);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

// Named component groups: the name and userData survive GLB export (as node
// name + extras), and preview.html reads userData.label to place floating tags.
function unit(name, label, labelEn, x = 0, y = 0, z = 0) {
  const g = new THREE.Group();
  g.name = name;
  if (label) g.userData = { label, label_en: labelEn, level: 'unit' };
  g.position.set(x, y, z);
  root.add(g);
  return g;
}
// device-level child group inside a unit (second tier of the label hierarchy)
function device(parent, name, label, labelEn) {
  const g = new THREE.Group();
  g.name = name;
  g.userData = { label, label_en: labelEn, level: 'device' };
  parent.add(g);
  return g;
}

// Chunky pipe run: fat cylinders between waypoints, sphere elbows at bends,
// flange collars at both ends.
const UP = new THREE.Vector3(0, 1, 0);
function pipeRun(parent, pts, r, color = C.lightGray, opts = {}) {
  const dust = opts.dust ?? 0.5;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = new THREE.Vector3(...pts[i]);
    const b = new THREE.Vector3(...pts[i + 1]);
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    const m = mesh(new THREE.CylinderGeometry(r, r, len, 20), color, { dust });
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(UP, dir.normalize());
    parent.add(m);
    // flange collars at run ends
    if (i === 0 || i === pts.length - 2) {
      const at = i === 0 ? a.clone().addScaledVector(dir, 0.12) : b.clone().addScaledVector(dir, -0.12);
      const f = mesh(new THREE.CylinderGeometry(r * 1.4, r * 1.4, 0.14, 20), color, { dust });
      f.position.copy(at);
      f.quaternion.copy(m.quaternion);
      parent.add(f);
    }
  }
  for (let i = 1; i < pts.length - 1; i++) {
    sph(parent, r * 1.18, ...pts[i], color, { dust, w: 20, h: 14 });
  }
}

// ---------------------------------------------------------------- platform
// Compacted-regolith slab with a wider berm skirt, plus light-gray work pads.
const gPlat = unit('platform');
box(gPlat, 35, 0.7, 21.5, 0, -0.35, 0, C.regolith, { dust: 0.3 });
box(gPlat, 36.2, 0.34, 22.7, 0, -0.53, 0, C.regolithDark, { dust: 0.25 });
box(gPlat, 6.4, 0.12, 6.4, 10, 0.06, -4, C.pad, { dust: 0.55 });     // reactor
box(gPlat, 19, 0.12, 4.8, -4, 0.06, -5.5, C.pad, { dust: 0.55 });    // tanks
box(gPlat, 11.4, 0.12, 4.2, -8.8, 0.06, 6, C.pad, { dust: 0.55 });   // intake
box(gPlat, 2.6, 0.12, 2.6, 14, 0.06, 8, C.pad, { dust: 0.55 });      // flare
box(gPlat, 2.6, 0.12, 11.4, 16, 0.06, -2.0, C.pad, { dust: 0.55 });  // radiators + pump skid

// ---------------------------------------------------------------- reactor column (8 m)
{
  const g = unit('reactor', 'Sabatier 反应柱', 'Sabatier Reactor', 10, 0, -4);
  cyl(g, 1.5, 1.6, 0.9, 0, 0.45, 0, C.midGray);                       // skirt

  // shell with a 90° cutaway window facing the default 3/4 view (+x+z),
  // exposing the internals; cream cut faces read as insulation cross-section
  const W0 = Math.PI / 2, WL = Math.PI * 1.5;                          // intact sweep
  const shellO = mesh(new THREE.CylinderGeometry(1.25, 1.25, 8, 48, 1, true, W0, WL), C.white);
  shellO.position.set(0, 4, 0); g.add(shellO);
  const shellI = mesh(new THREE.CylinderGeometry(1.1, 1.1, 8, 48, 1, true, W0, WL), C.lightGray, { dust: 0.1 });
  shellI.position.set(0, 4, 0); g.add(shellI);
  box(g, 0.06, 8, 0.16, 0, 4, 1.175, C.cream, { dust: 0 });            // cut faces
  box(g, 0.16, 8, 0.06, 1.175, 4, 0, C.cream, { dust: 0 });
  const dome = sph(g, 1.25, 0, 8.0, 0, C.white);                       // top head
  dome.scale.y = 0.55;
  const band = mesh(new THREE.CylinderGeometry(1.27, 1.27, 0.4, 48, 1, true, W0, WL), C.orange, { dust: 0.35 });
  band.position.set(0, 7.1, 0); g.add(band);                           // safety band

  // ---- internals, bottom to top (device level) ----
  const dRec = device(g, 'recuperator', '进料预热换热器', 'Feed Recuperator');
  cyl(dRec, 1.08, 1.08, 0.08, 0, 1.15, 0, C.midGray, { dust: 0 });     // tube sheets
  cyl(dRec, 1.08, 1.08, 0.08, 0, 2.1, 0, C.midGray, { dust: 0 });
  cyl(dRec, 0.18, 0.18, 0.95, 0, 1.62, 0, C.midGray, { dust: 0 });     // center downcomer
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.3;
    cyl(dRec, 0.055, 0.055, 0.87, Math.cos(a) * 0.45, 1.62, Math.sin(a) * 0.45, C.lightGray, { dust: 0, seg: 10 });
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    cyl(dRec, 0.055, 0.055, 0.87, Math.cos(a) * 0.82, 1.62, Math.sin(a) * 0.82, C.lightGray, { dust: 0, seg: 10 });
  }

  const dBed1 = device(g, 'catalyst_bed_1', '催化剂床 I（Ru/Al₂O₃）', 'Catalyst Bed I');
  cyl(dBed1, 1.05, 1.05, 0.05, 0, 2.33, 0, C.darkGray, { dust: 0 });   // support grid
  const b1 = mesh(new THREE.CylinderGeometry(1.04, 1.04, 1.5, 64, 24), C.catalyst, { dust: 0.3, grain: 0.2 });
  b1.position.set(0, 3.13, 0); dBed1.add(b1);
  cyl(dBed1, 1.05, 1.05, 0.04, 0, 3.9, 0, C.darkGray, { dust: 0 });    // hold-down grid

  const dCoil = device(g, 'interbed_coil', '床间冷却盘管', 'Interbed Cooling Coil');
  for (const cy of [4.08, 4.26, 4.44]) {
    const t = mesh(new THREE.TorusGeometry(0.82, 0.07, 12, 40), C.copper, { dust: 0 });
    t.position.set(0, cy, 0);
    t.rotation.x = -Math.PI / 2;
    dCoil.add(t);
  }

  const dBed2 = device(g, 'catalyst_bed_2', '催化剂床 II（Ru/Al₂O₃）', 'Catalyst Bed II');
  cyl(dBed2, 1.05, 1.05, 0.05, 0, 4.62, 0, C.darkGray, { dust: 0 });
  const b2 = mesh(new THREE.CylinderGeometry(1.04, 1.04, 1.5, 64, 24), C.catalyst, { dust: 0.3, grain: 0.2 });
  b2.position.set(0, 5.42, 0); dBed2.add(b2);
  cyl(dBed2, 1.05, 1.05, 0.04, 0, 6.2, 0, C.darkGray, { dust: 0 });

  const dDist = device(g, 'distributor', '进气分布器', 'Inlet Distributor');
  cyl(dDist, 0.14, 0.55, 0.5, 0, 7.15, 0, C.midGray, { dust: 0 });     // cone
  cyl(dDist, 1.0, 1.0, 0.12, 0, 6.65, 0, C.lightGray, { dust: 0 });    // demister pad

  const dTw = device(g, 'thermowells', '热电偶测温 ×3', 'Thermowells');
  cyl(dTw, 0.045, 0.045, 5.6, 0.4, 5.1, 0.4, C.darkGray, { dust: 0, seg: 8 });
  for (const sy of [3.13, 4.26, 5.42]) {
    sph(dTw, 0.09, 0.4, sy, 0.4, C.orange, { dust: 0, w: 12, h: 8 });
  }

  const dPsv = device(g, 'psv', '安全阀+爆破片', 'Pressure Safety Valve');
  box(dPsv, 0.3, 0.32, 0.3, 0, 9.05, 0, C.orange, { dust: 0.3 });      // valve body on vent stub
  cyl(dPsv, 0.1, 0.1, 0.5, 0, 9.05, -0.4, C.midGray, { rx: Math.PI / 2 }); // relief outlet
  cyl(dPsv, 0.1, 0.1, 0.35, 0, 8.85, -0.62, C.midGray);
  // bolted flange rings
  for (const fy of [1.9, 4.1, 6.3]) {
    cyl(g, 1.44, 1.44, 0.22, 0, fy, 0, C.lightGray);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      cyl(g, 0.055, 0.055, 0.36, Math.cos(a) * 1.36, fy, Math.sin(a) * 1.36, C.darkGray, { seg: 8 });
    }
  }
  // side nozzles with blind flanges
  for (const [nx, ny, nz, rz] of [[-1.45, 2.9, 0.4, Math.PI / 2], [-1.45, 5.2, -0.5, Math.PI / 2]]) {
    cyl(g, 0.22, 0.22, 0.55, nx, ny, nz, C.midGray, { rz });
    cyl(g, 0.34, 0.34, 0.12, nx - 0.3, ny, nz, C.midGray, { rz });
  }
  cyl(g, 0.16, 0.16, 0.9, 0, 8.9, 0, C.midGray);                      // top vent stub
  // control cabinet + junction box beside the column
  box(g, 1.1, 1.7, 0.65, -2.6, 0.85, 2.1, C.lightGray);
  box(g, 1.1, 0.24, 0.65, -2.6, 1.82, 2.1, C.orange, { dust: 0.35 });
  box(g, 0.7, 0.9, 0.5, 2.2, 0.45, 1.7, C.darkGray);
}

// ---------------------------------------------------------------- CO2 intake + compressor
{
  const gI = unit('co2_intake', 'CO₂ 吸入·过滤·压缩', 'CO₂ Intake & Compression');
  for (const fx of [-12.4, -8.9]) {
    box(gI, 2.9, 2.7, 2.2, fx, 1.35, 6, C.white);
    box(gI, 3.1, 0.25, 2.4, fx, 0.13, 6, C.midGray);                  // plinth
    for (let i = 0; i < 5; i++) {                                     // louver slats
      box(gI, 2.5, 0.16, 0.1, fx, 0.75 + i * 0.38, 7.13, C.darkGray, { rx: -0.5 });
    }
    box(gI, 2.5, 0.22, 0.06, fx, 2.35, 7.11, C.orange, { dust: 0.35 }); // stripe
    cyl(gI, 0.55, 0.55, 0.5, fx, 2.95, 6, C.lightGray);               // intake hood
    cyl(gI, 0.85, 0.85, 0.16, fx, 3.28, 6, C.lightGray);              // hood cap
  }
  // squat compressor: open shell, +x end wall removed (cutaway faces reactor)
  box(gI, 2.6, 0.06, 1.9, -5.2, 0.2, 6, C.lightGray, { dust: 0.1 });  // floor
  box(gI, 2.6, 0.06, 1.9, -5.2, 1.45, 6, C.lightGray, { dust: 0.1 }); // roof
  box(gI, 2.6, 1.25, 0.08, -5.2, 0.83, 5.09, C.lightGray);            // back wall
  box(gI, 2.6, 1.25, 0.08, -5.2, 0.83, 6.91, C.lightGray);            // front wall
  box(gI, 0.08, 1.25, 1.9, -6.46, 0.83, 6, C.lightGray);              // left wall
  box(gI, 0.08, 0.12, 1.9, -3.94, 1.42, 6, C.cream, { dust: 0 });     // cut edges
  box(gI, 0.08, 1.25, 0.12, -3.94, 0.83, 5.14, C.cream, { dust: 0 });
  box(gI, 0.08, 1.25, 0.12, -3.94, 0.83, 6.86, C.cream, { dust: 0 });
  cyl(gI, 0.45, 0.45, 2.2, -5.2, 1.95, 6, C.midGray, { rz: Math.PI / 2 }); // accumulator
  cyl(gI, 0.47, 0.47, 0.16, -6.25, 1.95, 6, C.orange, { rz: Math.PI / 2, dust: 0.35 });
  cyl(gI, 0.47, 0.47, 0.16, -4.15, 1.95, 6, C.orange, { rz: Math.PI / 2, dust: 0.35 });

  // ---- compressor internals (device level) ----
  const dCore = device(gI, 'comp_core', '两级压缩机芯', 'Two-Stage Compressor Core');
  box(dCore, 1.3, 0.45, 1.5, -5.0, 0.48, 6, C.midGray, { dust: 0 });  // crankcase
  // scroll-type stages per EQUIPMENT.md §2: flat pancake housings with
  // eccentric drive caps and top discharge stubs
  cyl(dCore, 0.36, 0.36, 0.3, -4.6, 0.86, 5.55, C.lightGray, { dust: 0 });  // stage 1 scroll
  cyl(dCore, 0.15, 0.15, 0.14, -4.52, 1.08, 5.55, C.darkGray, { dust: 0 });
  cyl(dCore, 0.07, 0.07, 0.3, -4.52, 1.26, 5.55, C.midGray, { dust: 0, seg: 10 });
  cyl(dCore, 0.28, 0.28, 0.26, -4.6, 0.84, 6.45, C.lightGray, { dust: 0 }); // stage 2 scroll
  cyl(dCore, 0.12, 0.12, 0.13, -4.53, 1.03, 6.45, C.darkGray, { dust: 0 });
  cyl(dCore, 0.06, 0.06, 0.28, -4.53, 1.2, 6.45, C.midGray, { dust: 0, seg: 10 });
  const dIC = device(gI, 'intercooler', '级间冷却器', 'Intercooler');
  cyl(dIC, 0.12, 0.12, 0.7, -4.55, 1.12, 6.0, C.copper, { rx: Math.PI / 2, dust: 0 });
  for (let i = 0; i < 5; i++) {
    cyl(dIC, 0.2, 0.2, 0.03, -4.55, 1.12, 5.76 + i * 0.12, C.midGray, { rx: Math.PI / 2, dust: 0 });
  }
  const dMot = device(gI, 'drive_motor', '驱动电机', 'Drive Motor');
  box(dMot, 0.9, 0.9, 0.9, -5.2, 0.46, 7.35, C.darkGray);
  cyl(dMot, 0.08, 0.08, 0.5, -5.2, 0.65, 6.75, C.midGray, { rx: Math.PI / 2, dust: 0, seg: 10 }); // shaft

  // fat ducts chaining filter -> filter -> compressor, with inlet silencer
  pipeRun(gI, [[-10.9, 1.5, 6], [-10.3, 1.5, 6]], 0.3, C.midGray);
  pipeRun(gI, [[-7.4, 1.5, 6], [-6.45, 1.5, 6]], 0.3, C.midGray);
  const dSil = device(gI, 'silencer', '入口消声器', 'Inlet Silencer');
  cyl(dSil, 0.34, 0.34, 0.6, -6.9, 1.5, 6, C.midGray, { rz: Math.PI / 2, dust: 0.3 });
}

// ---------------------------------------------------------------- cryogenic tank row (3 x 4 m spheres)
const gT = unit('cryo_tanks', '低温储罐 2×LOX + LCH₄', 'Cryogenic Storage');
const TANK_X = [-11, -4, 3];
const CUT_TANK = 3; // front tank gets a 90° cutaway showing the MLI inner vessel
for (const tx of TANK_X) {
  if (tx === CUT_TANK) {
    // outer jacket with the +x+z quadrant removed (phi 90°..180° window)
    const sh = mesh(new THREE.SphereGeometry(2, 48, 32, Math.PI, Math.PI * 1.5), C.white);
    sh.position.set(tx, 2.6, -5.5);
    gT.add(sh);
    for (const ry of [0, Math.PI / 2]) {                               // cut-edge rims
      const rim = mesh(new THREE.TorusGeometry(1.98, 0.07, 10, 48), C.cream, { dust: 0 });
      rim.position.set(tx, 2.6, -5.5);
      rim.rotation.y = ry;
      gT.add(rim);
    }
    const dMli = device(gT, 'mli_vessel', 'MLI 隔热内胆', 'MLI Inner Vessel');
    sph(dMli, 1.7, tx, 2.6, -5.5, C.gold, { dust: 0, w: 40, h: 28 });
    cyl(dMli, 0.48, 0.55, 0.24, tx, 0.78, -5.5, C.midGray, { dust: 0 }); // support ring
    cyl(dMli, 0.14, 0.14, 0.5, tx, 4.4, -5.5, C.lightGray, { dust: 0 }); // fill neck
  } else {
    sph(gT, 2, tx, 2.6, -5.5, C.white, { w: 40, h: 28 });
    cyl(gT, 0.38, 0.38, 0.2, tx, 4.62, -5.5, C.lightGray);            // manway boss
  }
  box(gT, 3.6, 0.3, 2.8, tx, 0.15, -5.5, C.midGray);                  // skid
  box(gT, 2.9, 1.25, 0.42, tx, 0.92, -5.5 - 0.95, C.midGray);         // saddle walls
  box(gT, 2.9, 1.25, 0.42, tx, 0.92, -5.5 + 0.95, C.midGray);
  box(gT, 0.9, 0.5, 0.08, tx, 2.6, -3.46, C.darkGray);                // nameplate
}
// zero-boil-off cryocooler cold heads, one per tank (device level)
const dZbo = device(gT, 'zbo_coldheads', 'RTB 零蒸发制冷机 ×3', 'RTB ZBO Cryocoolers');
for (const tx of TANK_X) {
  cyl(dZbo, 0.2, 0.2, 0.45, tx + 0.55, 4.55, -5.5, C.midGray, { dust: 0.2 });   // cold head
  for (let i = 0; i < 3; i++) {
    cyl(dZbo, 0.3, 0.3, 0.03, tx + 0.55, 4.42 + i * 0.12, -5.5, C.darkGray, { dust: 0.2 });
  }
  cyl(dZbo, 0.09, 0.09, 0.4, tx + 0.55, 4.78, -5.7, C.midGray, { rx: Math.PI / 2, dust: 0.2, seg: 12 });
  box(dZbo, 0.45, 0.35, 0.4, tx + 1.1, 4.4, -5.5, C.midGray, { dust: 0.25 });   // RTB compressor unit
  cyl(dZbo, 0.07, 0.07, 0.35, tx + 0.82, 4.55, -5.5, C.midGray, { rz: Math.PI / 2, dust: 0.2, seg: 10 });
}

// ---------------------------------------------------------------- pipe network (all >= 30 cm dia)
const gP = unit('piping');
// CO2 feed: compressor -> reactor base, with two orange valve stations
pipeRun(gP, [[-3.9, 0.9, 5.5], [10, 0.9, 5.5], [10, 0.9, -2.7]], 0.2, C.lightGray);
for (const vx of [2, 6.5]) {
  cyl(gP, 0.13, 0.13, 0.55, vx, 1.15, 5.5, C.midGray);
  const wheel = mesh(new THREE.TorusGeometry(0.24, 0.06, 10, 22), C.orange, { dust: 0.35 });
  wheel.position.set(vx, 1.48, 5.5);
  wheel.rotation.x = -Math.PI / 2;
  gP.add(wheel);
}
// methane product: reactor top -> elevated manifold over the tank row
pipeRun(gP, [[9.3, 6.2, -4], [3, 6.2, -4], [3, 6.2, -5.5], [-11, 6.2, -5.5]], 0.2, C.lightGray);
for (const tx of TANK_X) {                                             // drops into each tank
  pipeRun(gP, [[tx, 6.2, -5.5], [tx, 4.35, -5.5]], 0.2, C.lightGray);
  sph(gP, 0.24, tx, 6.2, -5.5, C.lightGray, { w: 18, h: 12 });
}
for (const px of [-7.5, 0]) {                                          // manifold support posts
  box(gP, 0.26, 6.0, 0.26, px, 3.0, -5.5, C.midGray);
}
// flare line: reactor -> stack, one support post
pipeRun(gP, [[10, 5, -4], [14, 5, -4], [14, 5, 7.6]], 0.18, C.lightGray);
box(gP, 0.26, 4.8, 0.26, 14, 2.4, 2, C.midGray);
// cryocooler loops: each tank -> collector along the back -> radiator header
for (const tx of TANK_X) {
  pipeRun(gP, [[tx, 2.6, -7.35], [tx, 2.6, -8.5], [tx, 0.5, -8.5]], 0.16, C.midGray);
}
pipeRun(gP, [[-11, 0.5, -8.5], [15.6, 0.5, -8.5], [15.6, 0.5, -7.2]], 0.16, C.midGray);
pipeRun(gP, [[15.6, 0.45, -7.0], [15.6, 0.45, 2.3]], 0.16, C.midGray); // header

// inline instruments (device level)
const dFm = device(gP, 'flow_meter', '孔板流量计', 'Orifice Flow Meter');
cyl(dFm, 0.34, 0.34, 0.13, 4.13, 0.9, 5.5, C.midGray, { rz: Math.PI / 2, dust: 0.3 }); // flange pair
cyl(dFm, 0.34, 0.34, 0.13, 4.33, 0.9, 5.5, C.midGray, { rz: Math.PI / 2, dust: 0.3 });
cyl(dFm, 0.05, 0.05, 0.35, 4.23, 1.15, 5.5, C.darkGray, { dust: 0, seg: 8 });           // impulse line
box(dFm, 0.22, 0.28, 0.18, 4.23, 1.45, 5.5, C.orange, { dust: 0.3 });                   // transmitter
const dPg = device(gP, 'gauges', '就地压力表 ×2', 'Pressure Gauges');
for (const [gx, gy, gz] of [[8.5, 0.9, 5.5], [15.6, 0.45, -3]]) {
  cyl(dPg, 0.05, 0.05, 0.3, gx, gy + 0.25, gz, C.midGray, { dust: 0, seg: 10 });
  cyl(dPg, 0.16, 0.16, 0.06, gx, gy + 0.43, gz, C.white, { dust: 0 });
  cyl(dPg, 0.05, 0.05, 0.03, gx, gy + 0.47, gz, C.darkGray, { dust: 0, seg: 10 });
}
const dMov = device(gP, 'mov', '电动阀执行机构', 'Motorized Valve');
box(dMov, 0.4, 0.36, 0.4, 5.5, 6.2, -4, C.midGray, { dust: 0.2 });                      // body on CH4 manifold
box(dMov, 0.3, 0.42, 0.26, 5.5, 6.6, -4, C.orange, { dust: 0.3 });                      // actuator
cyl(dMov, 0.05, 0.05, 0.25, 5.5, 6.93, -4, C.darkGray, { dust: 0.2, seg: 8 });          // stem

// ---------------------------------------------------------------- radiator bank (right edge)
const gR = unit('radiators', '制冷散热板', 'Cryocooler Radiators');
const dSerp = device(gR, 'serpentine', '工质蛇形盘管', 'Coolant Serpentine');
for (let i = 0; i < 4; i++) {
  const rz = -6.2 + i * 2.55;
  box(gR, 0.14, 2.5, 2.3, 16.2, 1.8, rz, C.black, { dust: 0.18 });
  box(gR, 0.2, 1.5, 0.2, 16.1, 0.75, rz - 1.0, C.midGray);
  box(gR, 0.2, 1.5, 0.2, 16.1, 0.75, rz + 1.0, C.midGray);
  for (let k = 0; k < 4; k++) {                                        // tubes on outward face
    cyl(dSerp, 0.05, 0.05, 2.1, 16.3, 1.8, rz - 0.75 + k * 0.5, C.midGray, { dust: 0.25, seg: 10 });
  }
  for (let k = 0; k < 3; k++) {                                        // U-bend connectors
    cyl(dSerp, 0.05, 0.05, 0.56, 16.3, k % 2 ? 0.82 : 2.78, rz - 0.5 + k * 0.5, C.midGray, { rx: Math.PI / 2, dust: 0.25, seg: 10 });
  }
}
const dCp = device(gR, 'coolant_pump', '工质泵撬', 'Coolant Pump Skid');
box(dCp, 0.9, 0.2, 0.9, 15.6, 0.22, 3.05, C.midGray, { dust: 0.3 });
cyl(dCp, 0.14, 0.14, 0.4, 15.6, 0.5, 3.2, C.midGray, { rx: Math.PI / 2, dust: 0.2 });   // motor
sph(dCp, 0.18, 15.6, 0.5, 2.9, C.orange, { dust: 0.2, w: 16, h: 12 });                  // volute
cyl(dCp, 0.09, 0.09, 0.55, 15.6, 0.47, 2.6, C.midGray, { rx: Math.PI / 2, dust: 0.2, seg: 12 });

// ---------------------------------------------------------------- electrolysis / water-recovery skid
// CO2+4H2 -> CH4+2H2O: product water is condensed, electrolyzed, H2 returned
// to the reactor, O2 sent to cryo storage. Water feed comes from external ice
// mining via the capped inlet on the skid front.
{
  const gE = unit('electrolysis', '电解·水回收撬块', 'Electrolysis & Water Recovery');
  box(gE, 5.9, 0.12, 3.6, 3.1, 0.06, 1.0, C.pad, { dust: 0.55 });
  box(gE, 4.0, 0.25, 2.6, 2.2, 0.13, 1.0, C.midGray);                 // skid frame

  // housing as an open shell: the +x end wall is removed (cutaway faces the
  // reactor / default view); cream edge strips read as the section cut
  box(gE, 3.2, 0.08, 2.0, 1.9, 0.34, 1.0, C.lightGray, { dust: 0.1 }); // floor
  box(gE, 3.2, 0.06, 2.0, 1.9, 2.16, 1.0, C.white, { dust: 0.1 });     // ceiling
  box(gE, 3.2, 0.24, 2.0, 1.9, 2.34, 1.0, C.orange, { dust: 0.35 });   // roof cap
  box(gE, 3.2, 1.82, 0.08, 1.9, 1.25, 0.08, C.white);                  // back wall
  box(gE, 0.08, 1.82, 2.0, 0.34, 1.25, 1.0, C.white);                  // left wall
  box(gE, 3.2, 1.82, 0.08, 1.9, 1.25, 1.96, C.white);                  // front wall
  box(gE, 1.6, 0.9, 0.08, 1.9, 1.0, 2.02, C.darkGray);                 // vent grille
  box(gE, 0.1, 1.82, 0.12, 3.46, 1.25, 0.1, C.cream, { dust: 0 });     // cut edges
  box(gE, 0.1, 1.82, 0.12, 3.46, 1.25, 1.9, C.cream, { dust: 0 });
  box(gE, 0.1, 0.14, 2.0, 3.46, 2.22, 1.0, C.cream, { dust: 0 });

  // ---- internals (device level) ----
  const dStk = device(gE, 'pem_stack', 'PEM 电解堆', 'PEM Electrolyzer Stack');
  box(dStk, 1.2, 0.2, 1.4, 2.35, 0.44, 1.0, C.midGray, { dust: 0 });   // pedestal
  box(dStk, 1.0, 1.0, 0.12, 2.35, 1.15, 0.45, C.midGray, { dust: 0 }); // end plates
  box(dStk, 1.0, 1.0, 0.12, 2.35, 1.15, 1.55, C.midGray, { dust: 0 });
  for (let i = 0; i < 13; i++) {                                       // bipolar cells
    box(dStk, 0.92, 0.92, 0.06, 2.35, 1.15, 0.57 + i * 0.072, i % 2 ? C.darkGray : C.white, { dust: 0 });
  }
  for (const [tx, ty] of [[1.93, 0.73], [1.93, 1.57], [2.77, 0.73], [2.77, 1.57]]) {
    cyl(dStk, 0.035, 0.035, 1.24, tx, ty, 1.0, C.darkGray, { rx: Math.PI / 2, seg: 8 }); // tie rods
  }

  const dTank = device(gE, 'water_tank', '缓冲水箱', 'Water Buffer Tank');
  box(dTank, 0.75, 0.9, 0.7, 0.75, 0.85, 0.5, C.lightGray, { dust: 0 });

  const dPump = device(gE, 'circ_pump', '循环泵', 'Circulation Pump');
  cyl(dPump, 0.16, 0.16, 0.45, 3.05, 0.55, 1.7, C.midGray, { rz: Math.PI / 2, dust: 0 }); // motor
  sph(dPump, 0.2, 2.78, 0.55, 1.7, C.orange, { dust: 0, w: 16, h: 12 });                  // volute
  cyl(dPump, 0.07, 0.07, 0.5, 2.78, 0.85, 1.7, C.midGray, { dust: 0, seg: 10 });          // outlet

  const dDry = device(gE, 'dryer', '干燥床', 'Gas Dryer');
  cyl(dDry, 0.17, 0.17, 0.75, 0.65, 1.05, 1.3, C.white, { dust: 0 });
  cyl(dDry, 0.17, 0.17, 0.75, 0.65, 1.05, 1.7, C.white, { dust: 0 });
  box(dDry, 0.4, 0.06, 0.6, 0.65, 1.46, 1.5, C.midGray, { dust: 0 });  // top manifold

  // stack outlet header + risers up through the ceiling into the roof drums
  cyl(gE, 0.07, 0.07, 1.15, 1.78, 1.7, 0.45, C.midGray, { rz: Math.PI / 2, dust: 0, seg: 12 });
  cyl(gE, 0.08, 0.08, 0.95, 1.2, 2.05, 0.45, C.midGray, { dust: 0, seg: 12 });
  cyl(gE, 0.08, 0.08, 0.95, 2.6, 2.05, 0.45, C.midGray, { dust: 0, seg: 12 });

  // H2 / O2 gas separator drums on the roof (device level)
  const dSep = device(gE, 'separators', '气液分离罐 ×2', 'Gas/Liquid Separators');
  for (const sx of [1.2, 2.6]) {
    cyl(dSep, 0.36, 0.36, 0.9, sx, 2.9, 0.45, C.lightGray);
    const cap = sph(dSep, 0.36, sx, 3.35, 0.45, C.lightGray, { w: 20, h: 14 });
    cap.scale.y = 0.5;
  }
  // water inlet stub (from external ice-mining line), capped, with valve wheel
  cyl(gE, 0.16, 0.16, 0.6, 1.9, 0.7, 2.35, C.midGray, { rx: Math.PI / 2 });
  cyl(gE, 0.26, 0.26, 0.14, 1.9, 0.7, 2.68, C.orange, { rx: Math.PI / 2, dust: 0.35 });
  // horizontal water condenser vessel on saddles (device level)
  const dCond = device(gE, 'condenser', '水冷凝器', 'Water Condenser');
  cyl(dCond, 0.55, 0.55, 2.4, 4.9, 0.95, 1.0, C.lightGray, { rz: Math.PI / 2 });
  sph(dCond, 0.55, 3.7, 0.95, 1.0, C.lightGray, { w: 20, h: 14 });
  sph(dCond, 0.55, 6.1, 0.95, 1.0, C.lightGray, { w: 20, h: 14 });
  box(dCond, 0.5, 0.55, 1.3, 4.2, 0.28, 1.0, C.midGray);
  box(dCond, 0.5, 0.55, 1.3, 5.6, 0.28, 1.0, C.midGray);
  // reactor product/steam -> condenser (from lower side nozzle)
  pipeRun(gP, [[8.4, 2.9, -3.6], [6.8, 2.9, -3.6], [6.8, 0.95, -3.6], [6.8, 0.95, 1.0], [6.3, 0.95, 1.0]], 0.18, C.lightGray);
  // condensed water -> electrolyzer
  pipeRun(gP, [[3.75, 0.7, 1.0], [3.4, 0.7, 1.0]], 0.16, C.midGray);
  // H2 return -> reactor upper side nozzle
  pipeRun(gP, [[1.2, 3.3, 0.45], [1.2, 5.2, 0.45], [1.2, 5.2, -4.5], [8.25, 5.2, -4.5]], 0.17, C.lightGray);
  box(gP, 0.24, 5.0, 0.24, 1.2, 2.5, -4.5, C.midGray);                // pipe support
  // O2 product -> cryo tank manifold (tee joint)
  pipeRun(gP, [[2.6, 3.3, 0.45], [2.6, 6.2, 0.45], [2.6, 6.2, -5.5]], 0.17, C.lightGray);
  sph(gP, 0.24, 2.6, 6.2, -5.5, C.lightGray, { w: 18, h: 12 });
}

// ---------------------------------------------------------------- HMI status display
// Outdoor control display on a pylon: plant mimic diagram built from tiny
// unlit (self-illuminated) geometry — process icons, flow lines, status
// lamps and tank level gauges, like a real plant SCADA board.
{
  const gD = unit('display', '中控显示屏', 'Plant HMI Display', 1.5, 0, 8.6);

  // pylon + panel body (standard dusty materials)
  box(gD, 0.24, 1.2, 0.24, -1.65, 0.6, 0, C.midGray);
  box(gD, 0.24, 1.2, 0.24, 1.65, 0.6, 0, C.midGray);
  box(gD, 4.3, 2.7, 0.28, 0, 2.45, 0, C.lightGray);                   // cabinet
  box(gD, 4.3, 0.16, 0.32, 0, 1.18, 0, C.orange, { dust: 0.35 });     // trim
  box(gD, 4.5, 0.12, 0.6, 0, 3.86, 0.18, C.white);                    // sun visor
  box(gD, 0.5, 0.6, 0.2, 0, 1.6, -0.24, C.darkGray);                  // controller box

  // unlit screen materials (exported with KHR_materials_unlit; skipped by dust bake)
  const S = {
    bg: new THREE.MeshBasicMaterial({ color: 0x0d1b2a }),
    panel: new THREE.MeshBasicMaterial({ color: 0x16324a }),
    line: new THREE.MeshBasicMaterial({ color: 0x8fd0f0 }),
    text: new THREE.MeshBasicMaterial({ color: 0x5f88a0 }),
    white: new THREE.MeshBasicMaterial({ color: 0xdfe8ee }),
    green: new THREE.MeshBasicMaterial({ color: 0x35e06a }),
    amber: new THREE.MeshBasicMaterial({ color: 0xffb02e }),
    orange: new THREE.MeshBasicMaterial({ color: 0xe4661c }),
    dark: new THREE.MeshBasicMaterial({ color: 0x1e2f3f }),
    black: new THREE.MeshBasicMaterial({ color: 0x10151a }),
  };
  // screen content grouped under an emit_* node -> engine keeps it lit at night
  const gS = new THREE.Group();
  gS.name = 'emit_hmi_screen';
  gD.add(gS);
  const flat = (w, h, x, y, z, mat) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.02), mat);
    m.position.set(x, y, z);
    gS.add(m);
    return m;
  };
  const dot = (r, x, y, z, mat) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.015, 16), mat);
    m.rotation.x = Math.PI / 2;
    m.position.set(x, y, z);
    gS.add(m);
    return m;
  };
  const lampAnchor = new THREE.Object3D();                             // light_* hook
  lampAnchor.name = 'light_display';
  lampAnchor.position.set(0, 3.4, 1.0);
  gD.add(lampAnchor);

  const Z0 = 0.16;                                                     // screen face depth
  flat(3.95, 2.35, 0, 2.45, Z0, S.bg);                                 // screen
  // title bar with fake text dashes and a RUN lamp
  flat(3.75, 0.2, 0, 3.42, Z0 + 0.02, S.panel);
  flat(0.7, 0.07, -1.35, 3.42, Z0 + 0.035, S.line);
  flat(0.4, 0.07, -0.7, 3.42, Z0 + 0.035, S.text);
  dot(0.055, 1.6, 3.42, Z0 + 0.035, S.green);
  // process flow, left to right: intake -> compressor -> reactor -> electrolysis -> tanks
  const FY = 2.62;                                                     // main flow line y
  flat(3.0, 0.05, -0.2, FY, Z0 + 0.02, S.line);                        // main line
  flat(0.34, 0.34, -1.55, FY, Z0 + 0.03, S.white);                     // intake icon
  flat(0.24, 0.05, -1.55, FY - 0.06, Z0 + 0.045, S.dark);
  flat(0.24, 0.05, -1.55, FY + 0.06, Z0 + 0.045, S.dark);
  flat(0.26, 0.26, -1.0, FY, Z0 + 0.03, S.text);                       // compressor icon
  flat(0.24, 0.6, -0.45, FY + 0.05, Z0 + 0.03, S.white);               // reactor icon
  flat(0.24, 0.07, -0.45, FY + 0.22, Z0 + 0.045, S.orange);
  flat(0.32, 0.32, 0.15, FY, Z0 + 0.03, S.line);                       // electrolysis icon
  dot(0.05, 0.08, FY + 0.07, Z0 + 0.045, S.bg);
  dot(0.05, 0.22, FY - 0.07, Z0 + 0.045, S.bg);
  for (let i = 0; i < 3; i++) {                                        // tank circles
    dot(0.15, 0.85, FY + 0.32 - i * 0.32, Z0 + 0.03, S.white);
  }
  flat(0.05, 0.7, 0.85, FY, Z0 + 0.025, S.line);                       // tank branch line
  // radiator + flare branches
  flat(0.05, 0.55, 1.3, FY - 0.28, Z0 + 0.02, S.line);
  flat(0.42, 0.2, 1.3, FY - 0.62, Z0 + 0.03, S.black);                 // radiator icon
  flat(0.05, 0.4, -0.45, FY + 0.55, Z0 + 0.02, S.line);
  flat(0.16, 0.16, -0.45, FY + 0.8, Z0 + 0.03, S.dark);                // flare icon
  dot(0.05, -0.3, FY + 0.88, Z0 + 0.045, S.amber);                     // flare standby lamp
  // green status lamps beside each unit icon
  for (const lx of [-1.72, -1.16, -0.62, -0.02, 0.66]) {
    dot(0.045, lx, FY + 0.2, Z0 + 0.045, S.green);
  }
  // tank level gauges, bottom center: LOX 78% / LOX 52% / LCH4 31%
  for (const [i, lvl] of [[0, 0.78], [1, 0.52], [2, 0.31]].values()) {
    const bx = -0.1 + i * 0.28;
    flat(0.14, 0.56, bx, 1.78, Z0 + 0.02, S.dark);
    flat(0.1, 0.5 * lvl, bx, 1.55 + 0.25 * lvl, Z0 + 0.035, i < 2 ? S.green : S.amber);
    flat(0.12, 0.05, bx, 1.42, Z0 + 0.03, S.text);
  }
  // bottom-left fake status text lines
  flat(0.9, 0.06, -1.3, 1.75, Z0 + 0.02, S.text);
  flat(0.6, 0.06, -1.45, 1.6, Z0 + 0.02, S.text);
  flat(0.75, 0.06, -1.37, 1.45, Z0 + 0.02, S.line);
  // power feed status: 6 Kilopower units online (EQUIPMENT.md §7)
  flat(0.5, 0.06, 1.37, 1.88, Z0 + 0.02, S.text);
  for (let i = 0; i < 6; i++) {
    flat(0.09, 0.09, 1.07 + i * 0.13, 1.7, Z0 + 0.03, S.green);
  }
}

// ---------------------------------------------------------------- flare stack (unlit)
{
  const gF = unit('flare', '火炬塔', 'Flare Stack');
  cyl(gF, 0.62, 0.72, 0.3, 14, 0.15, 8, C.midGray);                   // base flange
  cyl(gF, 0.32, 0.32, 6, 14, 3.0, 8, C.lightGray);                    // stack
  cyl(gF, 0.75, 0.75, 1.3, 14, 5.5, 8, C.darkGray);                   // windshield collar
  cyl(gF, 0.77, 0.77, 0.28, 14, 4.75, 8, C.orange, { dust: 0.35 });   // band
  cyl(gF, 0.2, 0.2, 0.5, 14, 6.35, 8, C.darkGray);                    // tip
  const beacon = new THREE.Mesh(                                       // blink_* hook
    new THREE.SphereGeometry(0.09, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0x7a1512 }),
  );
  beacon.name = 'blink_beacon_flare';
  beacon.position.set(14, 6.72, 8);
  gF.add(beacon);
}

// ---------------------------------------------------------------- dust bake (vertex colors)
// Upward-facing surfaces get a rust-red film, with cheap positional noise
// for patchiness. Colors end up linear, which is what glTF COLOR_0 expects.
root.updateMatrixWorld(true);
const nMat = new THREE.Matrix3();
const n = new THREE.Vector3();
const p = new THREE.Vector3();
const c = new THREE.Color();
root.traverse((m) => {
  if (!m.isMesh || m.material !== sharedMat) return; // unlit screen elements stay clean
  const geo = m.geometry;
  nMat.getNormalMatrix(m.matrixWorld);
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  const colors = new Float32Array(pos.count * 3);
  const base = m.userData.color;
  const strength = m.userData.dust;
  for (let i = 0; i < pos.count; i++) {
    n.fromBufferAttribute(nor, i).applyMatrix3(nMat).normalize();
    p.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld);
    const noise = 0.7 + 0.3 * Math.sin(p.x * 2.7 + p.z * 3.3 + p.y * 1.9);
    const t = THREE.MathUtils.smoothstep(n.y, 0.25, 0.95) * strength * noise;
    c.copy(base).lerp(DUST, t);
    if (m.userData.grain) { // per-vertex speckle for granular beds
      c.multiplyScalar(1 + m.userData.grain * Math.sin(p.x * 91.7 + p.y * 47.3 + p.z * 73.1));
    }
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
});

// ---------------------------------------------------------------- export
const DEPLOY = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'models', 'res-isru-01', 'model.glb');

new GLTFExporter().parse(
  root,
  (result) => {
    const buf = Buffer.from(result);
    for (const dest of [OUT, DEPLOY]) {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, buf);
    }
    let tris = 0;
    root.traverse((m) => {
      if (m.isMesh) tris += (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3;
    });
    console.log(`Wrote ${OUT} + ${DEPLOY} (${(buf.length / 1024).toFixed(0)} KB, ${tris | 0} tris)`);
  },
  (err) => { console.error(err); process.exit(1); },
  { binary: true },
);
