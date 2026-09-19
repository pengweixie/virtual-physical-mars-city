// Compact tokamak fusion power plant — code asset per MODELS.md §4.
// Rebuilt 2026-09-05 to the DECLARED neutronics geometry; 2026-09-18 the
// outboard gap corrected 0.13 -> 0.05 (design SOL, tokamak_0d.py; 0.13 was the
// 1-D model's own gap) - retired: dia 17.15 / cryostat 16.55 (tokamak repo,
// neutronics/SOURCE_TERM_DELIVERY.md + TVL_measurements.md outline table):
//   plasma  R0 = 3.8225 m, a = 1.416 m (A = 2.7), kappa = 1.8   (tokamak_0d.py)
//   outboard first wall  R0 + a + SOL 0.05 = 5.288 m         (tokamak_0d.py SOL)
//   radial stack outboard from the first wall, from the printed LAYER table
//   (chain3/ch_step0.log): W 0.005 | steel 0.020 | LiPb 1.0 | WC-B4C 0.12 |
//   VV 0.30 | vacuum 0.15 | TF 0.10+0.55 | cryo gap 0.60 | cryostat 0.06
//   => cryostat outer 8.193 m (dia 16.39); + biological shield 0.30 m of
//   borated concrete (declared construction thickness) => 8.493 m, dia 16.99.
//   total height 2 x (kappa a + 3.205) = 11.51 m (all layers wrap vertically;
//   vertical build not yet decided - the 7.02 m "TF-outer-layers-only" case
//   is printed on the card, not modelled).
// The old asset (cryostat dia 14.3 x 15, an early outline) is retired.
// A 60 deg cutaway at the front (+Z) exposes the radial build layer by layer
// (science-city rule: the core is not a black box). Materials are plain
// MeshLambert colours; no textures, no imports. 1 unit = 1 m, origin =
// pad-centre ground point, +Y up, front faces +Z. THREE is injected.
// Sub-devices are named groups with userData.{label,label_en,level}; POI
// anchors are poi_<id> nodes under root (static, root-local coordinates).

export const meta = {
  id: 'pwr-fusion-01',
  name: '托卡马克聚变电站',
  name_en: 'Tokamak Fusion Power Plant',
  size_m: 62,               // as-built platform width (x) incl. berm; self-check only
  size_axis: 'width',
  effects: ['glow_windows'],
};

// ---- declared geometry (single source: tokamak repo outline table) -------
const R0 = 3.8225, A_MINOR = 3.8225 / 2.7, KAPPA = 1.8;
const SOL_OUT = 0.05;                              // design scrape-off gap (tokamak_0d.py)
const R_FW = R0 + A_MINOR + SOL_OUT;              // 5.288 m outboard first wall
const KA = KAPPA * A_MINOR;                        // 2.548 m plasma half-height
// thickness and colour of each layer, outboard from the first wall (LAYER table)
const STACK = [
  ['FW_W',     0.005, 0x3b3f45],
  ['FW_st',    0.020, 0x5a5e63],
  ['LiPb',     1.000, 0x8fa3b8],
  ['Shield',   0.120, 0x26292c],
  ['VV',       0.300, 0x6b7075],
  ['gap',      0.150, null],          // VV -> TF vacuum gap: nothing drawn
  ['TF',       0.100, 0x9a6a3a],
  ['TFbody',   0.550, 0x8a5a2b],
  ['CryoGap',  0.600, null],          // vacuum: nothing drawn
  ['Cryo',     0.060, 0x777b80],
  ['Concrete', 0.300, 0x9a9285],
];
let _r = R_FW;
const LAYERS = STACK.map(([n, t, c]) => { _r += t; return { n, t, r: _r, c }; });
const R_CRYO = LAYERS.find(l => l.n === 'Cryo').r;       // 8.193
const R_SHIELD = LAYERS.find(l => l.n === 'Concrete').r; // 8.493
const H_HALF = KA + (R_SHIELD - R_FW);                   // 5.753 -> 11.51 total

export function build(THREE) {
  const root = new THREE.Group();
  root.name = 'pwr-fusion-01';
  const nightMats = [];
  const lights = [];

  // ---------------------------------------------------------------- palette
  const M = (color, opts = {}) =>
    new THREE.MeshLambertMaterial({ color, ...opts });
  const C = {
    regolith: M(0x74381f),
    regoDark: M(0x5c2e1a),
    steel: M(0x777b80),
    steel2: M(0x4c5054),
    white: M(0xdcdcd7),
    orange: M(0xcc4b1a),
    black: M(0x1c1c1e),
    door: M(0x33363a),
    concreteDark: M(0x7e786d),
  };
  const glowWin = M(0x0e1a2a, { emissive: 0xffd9a0, emissiveIntensity: 0.0 });
  const glowStripe = M(0xcc4b1a, { emissive: 0xff7a2a, emissiveIntensity: 0.0 });
  nightMats.push(glowWin, glowStripe);

  // ---------------------------------------------------------------- helpers
  const PAD = 1.0;
  const UP = new THREE.Vector3(0, 1, 0);
  const g = new THREE.Group();
  g.position.y = PAD;
  root.add(g);

  function unit(name, label, labelEn) {
    const u = new THREE.Group();
    u.name = name;
    u.userData = { label, label_en: labelEn, level: 'unit' };
    g.add(u);
    return u;
  }
  function poi(id, x, y, z) {           // static anchor, root-local (pad included)
    const a = new THREE.Object3D();
    a.name = 'poi_' + id;
    a.position.set(x, y, z);
    root.add(a);
  }
  function box(parent, w, h, d, x, y, z, mat, ry = 0) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    if (ry) m.rotation.y = ry;
    parent.add(m);
    return m;
  }
  function cyl(parent, rt, rb, h, x, y, z, mat, axis = 'Y', seg = 24) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
    m.position.set(x, y, z);
    if (axis === 'X') m.rotation.z = Math.PI / 2;
    else if (axis === 'Z') m.rotation.x = Math.PI / 2;
    parent.add(m);
    return m;
  }
  function sph(parent, r, x, y, z, mat, sy = 1, seg = 20) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(8, seg / 2)), mat);
    m.position.set(x, y, z);
    if (sy !== 1) m.scale.y = sy;
    parent.add(m);
    return m;
  }
  function pipe(parent, pts, r, mat) {
    for (let i = 0; i < pts.length - 1; i++) {
      const a = new THREE.Vector3(...pts[i]);
      const b = new THREE.Vector3(...pts[i + 1]);
      const dir = new THREE.Vector3().subVectors(b, a);
      const len = dir.length();
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 14), mat);
      m.position.copy(a).add(b).multiplyScalar(0.5);
      m.quaternion.setFromUnitVectors(UP, dir.clone().normalize());
      parent.add(m);
    }
    for (let i = 1; i < pts.length - 1; i++) sph(parent, r * 1.15, ...pts[i], mat, 1, 12);
  }

  // ---------------------------------------------------------------- pad
  root.add(new THREE.Mesh(new THREE.BoxGeometry(60, PAD, 44),
    C.regolith).translateY(PAD / 2));
  box(root, 62, PAD * 0.5, 46, 0, PAD * 0.25, 0, C.regoDark);

  // ================================================================ tokamak body
  // cutaway: a 60 deg wedge at the front (+Z). three.js cylinders start their
  // theta at +Z, so the wedge is theta in [-W, +W]; each layer inward is cut
  // a little narrower than the one outside it, so the cut reads as steps.
  const uCryo = unit('cryostat',
    '托卡马克本体（生物屏蔽 Ø16.99 m × 11.51 m，剖切露径向建造）',
    'Tokamak Body (bio-shield dia 16.99 m x 11.51 m, cutaway)');
  const CX = 0, CZ = 0;
  const YC = H_HALF;                              // mid-height above the pad
  const W0 = Math.PI / 6;                         // 30 deg half-angle at the outside
  const drawn = LAYERS.filter(l => l.c !== null);
  const layerMats = [];
  drawn.forEach((L, i) => {
    const idxFromOut = drawn.length - 1 - i;      // 0 = concrete
    const W = W0 - idxFromOut * (Math.PI / 180) * 1.6;   // inner layers cut narrower
    const hh = KA + (L.r - R_FW);                 // half-height: all layers wrap vertically
    const closed = L.n === 'Concrete';            // only the outer envelope has caps
    const geo = new THREE.CylinderGeometry(L.r, L.r, 2 * hh, 96, 1, !closed,
      W, Math.PI * 2 - 2 * W);
    const mat = M(L.c, { side: THREE.DoubleSide });
    layerMats.push(mat);
    const m = new THREE.Mesh(geo, mat);
    m.position.set(CX, YC, CZ);
    m.name = 'layer_' + L.n;
    uCryo.add(m);
    // cut faces: two radial rectangles per layer, so the section reads solid
    for (const s of [-1, 1]) {
      const th = s * W;
      const f = new THREE.Mesh(new THREE.PlaneGeometry(L.t, 2 * hh), mat);
      const rm = L.r - L.t / 2;
      f.position.set(CX + Math.sin(th) * rm, YC, CZ + Math.cos(th) * rm);
      f.rotation.y = th + Math.PI / 2;
      uCryo.add(f);
    }
  });
  // plasma: torus elongated by kappa along the machine axis; visible through the cut
  const plasmaWrap = new THREE.Group();
  plasmaWrap.position.set(CX, YC, CZ);
  plasmaWrap.scale.y = KAPPA;
  const plasma = new THREE.Mesh(
    new THREE.TorusGeometry(R0, A_MINOR, 20, 96),
    M(0xff4fb0, { emissive: 0xff2a90, emissiveIntensity: 0.9, side: THREE.DoubleSide }));
  plasma.rotation.x = Math.PI / 2;                 // torus axis -> Y
  plasmaWrap.add(plasma);
  uCryo.add(plasmaWrap);
  // inboard column (the 1-D stack is outboard only; a steel column fills the bore)
  cyl(uCryo, R0 - A_MINOR - 0.5, R0 - A_MINOR - 0.5, 2 * (KA + 2.0), CX, YC, CZ, C.steel2, 'Y', 48);
  // concrete plinth and roof plug
  cyl(uCryo, R_SHIELD + 0.7, R_SHIELD + 0.7, 0.9, CX, 0.45, CZ, C.concreteDark, 'Y', 96);
  cyl(uCryo, 1.1, 1.1, 0.9, CX, 2 * H_HALF + 0.45, CZ, C.steel2, 'Y', 24);
  // shield seams: 12 shallow vertical grooves (cast-segment joints), outside the wedge
  for (let k = 0; k < 12; k++) {
    const th = (k / 12) * Math.PI * 2 + Math.PI / 12;      // theta from +Z
    const rel = Math.atan2(Math.sin(th), Math.cos(th));    // wrap to [-pi, pi]
    if (Math.abs(rel) < W0 + 0.05) continue;
    box(uCryo, 0.12, 2 * H_HALF - 0.6, 0.06,
        CX + Math.sin(th) * (R_SHIELD + 0.02), YC, CZ + Math.cos(th) * (R_SHIELD + 0.02),
        C.concreteDark, th);
  }

  // equatorial ports through the shield (the two inside the wedge are skipped)
  const PORT_Y = YC;
  const PORTS = [];
  for (let k = 0; k < 9; k++) {
    const a = (10 + 40 * k) * Math.PI / 180;     // legacy convention: x = cos a, z = -sin a
    const th = Math.atan2(Math.cos(a), -Math.sin(a));  // same direction, theta-from-+Z
    if (Math.abs(th) < W0 + 0.12) continue;
    PORTS.push(10 + 40 * k);
    const ca = Math.cos(a), sa = Math.sin(a);
    const rMid = R_SHIELD + 0.65;
    box(uCryo, 2.2, 2.0, 1.7, CX + ca * rMid, PORT_Y, CZ - sa * rMid, C.steel, -a);
    const rFl = R_SHIELD + 1.55;
    box(uCryo, 0.35, 2.6, 2.4, CX + ca * rFl, PORT_Y, CZ - sa * rFl, C.steel2, -a);
    for (let bi = 0; bi < 8; bi++) {
      const bb = (bi / 8) * Math.PI * 2;
      const bu = Math.cos(bb) * 1.0, bv = Math.sin(bb) * 0.9;
      cyl(uCryo, 0.09, 0.09, 0.22,
          CX + ca * (rFl + 0.16) - sa * bu, PORT_Y + bv, CZ - sa * (rFl + 0.16) - ca * bu,
          C.steel2, null, 8).rotation.set(0, -a, Math.PI / 2);
    }
  }
  const portFace = (aDeg) => {                     // pipe start just outside the flange
    const a = aDeg * Math.PI / 180, r = R_SHIELD + 1.9;
    return [CX + Math.cos(a) * r, PORT_Y, CZ - Math.sin(a) * r];
  };

  // ================================================================ cryo plant (west)
  const uTanks = unit('cryo_tanks', '低温储罐（液氦/液氢）', 'Cryogenic Tanks');
  for (let ti = 0; ti < 2; ti++) {
    const tz = -6 - ti * 4.5;
    cyl(uTanks, 1.5, 1.5, 9, -20, 2.3, tz, C.white, 'X', 32);
    sph(uTanks, 1.5, -15.5, 2.3, tz, C.white, 1, 20).scale.x = 0.55;
    sph(uTanks, 1.5, -24.5, 2.3, tz, C.white, 1, 20).scale.x = 0.55;
    cyl(uTanks, 0.45, 0.45, 0.5, -20, 3.85, tz, C.steel2, 'Y', 16);
    box(uTanks, 1.2, 1.4, 3.4, -22.5, 0.7, tz, C.orange);
    box(uTanks, 1.2, 1.4, 3.4, -17.5, 0.7, tz, C.orange);
  }
  const uSkid = unit('compressor_skid', '低温压缩机撬块', 'Cryo Compressor Skid');
  box(uSkid, 6, 0.6, 3.5, -21, 0.3, 2, C.orange);
  cyl(uSkid, 0.85, 0.85, 2.8, -22.2, 1.55, 2, C.steel, 'X', 20);
  box(uSkid, 2.1, 1.7, 1.5, -19.4, 1.45, 2, C.steel2);
  cyl(uSkid, 0.48, 0.48, 2.2, -19.2, 1.7, 3.4, C.steel, 'Y', 16);
  cyl(uSkid, 0.48, 0.48, 2.2, -20.7, 1.7, 3.4, C.steel, 'Y', 16);

  // ================================================================ RF launchers (LHCD)
  const uRF = unit('rf_lhcd', 'LHCD 射频加热·电流驱动模块', 'LHCD RF Heating & Current Drive');
  const rf = [[16, 3, 10], [6, -19, 50]];
  for (const [mx, mz, pdeg] of rf) {
    box(uRF, 12, 3, 3, mx, 1.55, mz, C.white);
    box(uRF, 12.05, 0.35, 3.05, mx, 2.75, mz, glowStripe);
    box(uRF, 2, 0.6, 2, mx + 3.5, 3.3, mz, C.steel2);
    box(uRF, 1.1, 2.2, 0.12, mx - 4.5, 1.3, mz + 1.5, C.door);
    const a = pdeg * Math.PI / 180;
    const [fx, fy, fz] = portFace(pdeg);
    pipe(uRF, [[fx, fy, fz], [fx + Math.cos(a) * 2.0, fy, fz - Math.sin(a) * 2.0],
               [mx, fy, mz], [mx, 3.0, mz]], 0.32, C.steel);
  }

  // ================================================================ power conversion (east)
  const uHX = unit('heat_exchanger', '换热器（sCO₂ 一回路）', 'Heat Exchanger');
  cyl(uHX, 1.7, 1.7, 9, 22, 2.4, 4, C.steel, 'X', 28);
  sph(uHX, 1.7, 26.5, 2.4, 4, C.steel, 1, 20).scale.x = 0.55;
  sph(uHX, 1.7, 17.5, 2.4, 4, C.steel, 1, 20).scale.x = 0.55;
  box(uHX, 1.2, 1.6, 3.8, 19, 0.8, 4, C.orange);
  box(uHX, 1.2, 1.6, 3.8, 25, 0.8, 4, C.orange);

  const uHall = unit('generator_hall', '发电机厅（v5：335 MWe 毛功率）', 'Generator Hall');
  box(uHall, 13, 4.6, 5, 22, 2.3, -6, C.white);
  box(uHall, 13.3, 0.4, 5.3, 22, 0.2, -6, C.steel2);
  box(uHall, 13.05, 0.4, 5.05, 22, 4.25, -6, glowStripe);
  for (let wi = 0; wi < 5; wi++)
    box(uHall, 1.4, 1.1, 0.1, 16.5 + wi * 2.6, 2.4, -3.42, glowWin);
  box(uHall, 0.12, 2.4, 1.3, 15.4, 1.4, -6, C.door);
  lights.push({ color: 0xffd9a0, pos: [22, 3.5, -3.4], range: 30 });
  pipe(uHall, [[20, 3.9, 4], [20, 5.4, 4], [20, 5.4, -6], [20, 4.3, -6]], 0.26, C.steel);

  // primary-loop pipe: port at 330 deg (the 290 deg port sits in the cutaway) -> HX
  const gPipes = new THREE.Group();
  gPipes.name = 'piping';
  g.add(gPipes);
  const [px, py, pz] = portFace(330);
  pipe(gPipes, [[px, py, pz], [px + 1.5, py, pz], [14, py, 4], [14, 1.2, 4], [18.6, 1.2, 4], [18.6, 2.4, 4]],
       0.27, C.steel);

  // ================================================================ control cabin (SE)
  const uCab = unit('control_cabin', '控制舱', 'Control Cabin');
  box(uCab, 4.2, 3.4, 3.4, 28, 1.7, -15, C.white);
  box(uCab, 1.1, 1.0, 0.12, 28, 1.8, -13.28, glowWin);
  box(uCab, 0.12, 2.3, 1.15, 25.88, 1.25, -15, C.door);
  box(uCab, 1.6, 0.5, 1.6, 28.8, 3.65, -15, C.steel2);
  lights.push({ color: 0xffe0b0, pos: [28, 2.4, -13], range: 14 });

  // ================================================================ on-platform radiators
  const uRad = unit('aux_radiators', '辅助散热排（平台）', 'Auxiliary Radiators');
  const tilt = 35 * Math.PI / 180;
  for (let row = 0; row < 2; row++) {
    const rz = 14 + row * 6;
    for (let u = 0; u < 6; u++) {
      const ux = -18 + u * 7;
      box(uRad, 7.6, 0.38, 0.38, ux, 0.95, rz, C.steel2);
      for (const sgn of [1, -1]) {
        const p = box(uRad, 7.2, 3.5, 0.16, ux,
          1.0 + Math.cos(tilt) * 1.75, rz + sgn * Math.sin(tilt) * 1.75, C.black);
        p.rotation.x = -sgn * tilt;
      }
    }
  }

  // ---------------------------------------------------------------- POI anchors (root-local, static)
  poi('cryostat', 0, PAD + YC, R_FW - 0.8);      // inside the cutaway, just off the plasma edge
  poi('cryo_tanks', -20, 3.3, -8);
  poi('compressor_skid', -21, 2.5, 2);
  poi('rf_lhcd', 16, 2.5, 3);
  poi('heat_exchanger', 22, 3.4, 4);
  poi('generator_hall', 22, 3.3, -6);
  poi('control_cabin', 28, 2.7, -15);
  poi('aux_radiators', 0, 3, 17);

  // ---------------------------------------------------------------- dust pass + contract
  const dust = new THREE.Color(0x9e5b3d);
  for (const k of Object.keys(C)) C[k].color.lerp(dust, 0.05);
  for (const m of layerMats) m.color.lerp(dust, 0.03);
  root.userData.nightMats = nightMats;
  root.userData.lights = lights;
  root.userData.beams = [];
  root.userData.declared_geometry = {
    R0, a: A_MINOR, kappa: KAPPA, R_fw: R_FW, R_cryo_out: R_CRYO, R_shield_out: R_SHIELD,
    height: 2 * H_HALF, ports_deg: PORTS,
  };
  return root;
}
