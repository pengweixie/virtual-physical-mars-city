// Compact tokamak fusion power plant (v4 baseline) — code asset per MODELS.md §4.
// Ported from the project's Blender build (build_tokamak.py) at real metric
// scale: cryostat Ø14.3 m, 18 D-ribs, bolted ports, cryo plant, RF launchers,
// power-conversion block, control cabin, on-platform radiator rows.
// 1 unit = 1 m. Origin = base-center ground point (y=0 = terrain), +Y up,
// front faces +Z. THREE is injected (no import) to keep a single instance.
// Sub-devices are named groups carrying userData.{label,label_en,level} —
// same convention as res-isru-01 — so the viewer can hang floating tags.

export const meta = {
  id: 'pwr-fusion-01',
  name: '托卡马克聚变电站',
  name_en: 'Tokamak Fusion Power Plant',
  size_m: 62,               // as-built platform width (x) incl. berm; self-check only
  size_axis: 'width',
  effects: ['glow_windows'],
};

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
  };
  // night-glow materials (engine ramps emissiveIntensity after dusk)
  const glowWin = M(0x0e1a2a, { emissive: 0xffd9a0, emissiveIntensity: 0.0 });
  const glowStripe = M(0xcc4b1a, { emissive: 0xff7a2a, emissiveIntensity: 0.0 });
  nightMats.push(glowWin, glowStripe);

  // ---------------------------------------------------------------- helpers
  const PAD = 1.0;                       // regolith pad thickness; parts sit on top
  const UP = new THREE.Vector3(0, 1, 0);
  const g = new THREE.Group();           // plant frame above the pad
  g.position.y = PAD;
  root.add(g);

  // labeled sub-device group (viewer hangs a floating tag on each)
  function unit(name, label, labelEn) {
    const u = new THREE.Group();
    u.name = name;
    u.userData = { label, label_en: labelEn, level: 'unit' };
    g.add(u);
    return u;
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
  function prism(parent, ptsXZ, thick, mat, cx, cz, rot) {
    const shape = new THREE.Shape();
    shape.moveTo(ptsXZ[0][0], ptsXZ[0][1]);
    for (let i = 1; i < ptsXZ.length; i++) shape.lineTo(ptsXZ[i][0], ptsXZ[i][1]);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: false });
    geo.translate(0, 0, -thick / 2);
    const m = new THREE.Mesh(geo, mat);
    m.rotation.y = rot;
    m.position.set(cx, 0, cz);
    parent.add(m);
    return m;
  }

  // ---------------------------------------------------------------- pad
  root.add(new THREE.Mesh(new THREE.BoxGeometry(60, PAD, 44),
    C.regolith).translateY(PAD / 2));
  box(root, 62, PAD * 0.5, 46, 0, PAD * 0.25, 0, C.regoDark);

  // ================================================================ cryostat
  const uCryo = unit('cryostat', '托卡马克本体（低温恒温器 Ø14.3 m）', 'Tokamak Cryostat');
  const CX = 0, CZ = 0, R = 7.15, H = 15;
  cyl(uCryo, R, R, H, CX, H / 2, CZ, C.steel, 'Y', 64);
  cyl(uCryo, R + 0.7, R + 0.7, 0.9, CX, 0.45, CZ, C.steel2, 'Y', 64);
  sph(uCryo, R + 0.02, CX, H, CZ, C.steel, 1.7 / R, 48);
  cyl(uCryo, 1.1, 1.1, 0.9, CX, H + 2.0, CZ, C.steel2, 'Y', 24);

  const prof = [[6.85, 0.35], [8.75, 0.35], [8.75, 8.5]];
  for (let i = 1; i <= 10; i++) {
    const t = (i / 10) * Math.PI / 2;
    prof.push([6.85 + 1.9 * Math.cos(t), 8.5 + 6.2 * Math.sin(t)]);
  }
  for (let k = 0; k < 18; k++) {
    prism(uCryo, prof, 0.42, C.steel2, CX, CZ, (k / 18) * Math.PI * 2);
  }

  const PORT_Y = 7.5;
  for (let k = 0; k < 9; k++) {
    const a = (10 + 40 * k) * Math.PI / 180;
    const ca = Math.cos(a), sa = Math.sin(a);
    const midR = 7.9;
    box(uCryo, 2.2, 2.0, 1.7, CX + ca * midR, PORT_Y, CZ - sa * midR, C.steel, -a);
    box(uCryo, 0.35, 2.6, 2.4, CX + ca * 9.2, PORT_Y, CZ - sa * 9.2, C.steel2, -a);
    for (let bi = 0; bi < 8; bi++) {
      const bb = (bi / 8) * Math.PI * 2;
      const bu = Math.cos(bb) * 1.0, bv = Math.sin(bb) * 0.9;
      cyl(uCryo, 0.09, 0.09, 0.22,
          CX + ca * 9.36 - sa * bu, PORT_Y + bv, CZ - sa * 9.36 - ca * bu,
          C.steel2, null, 8).rotation.set(0, -a, Math.PI / 2);
    }
  }

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
    const fx = CX + Math.cos(a) * 9.4, fz = CZ - Math.sin(a) * 9.4;
    pipe(uRF, [[fx, PORT_Y, fz], [fx + Math.cos(a) * 3, PORT_Y, fz - Math.sin(a) * 3],
               [mx, PORT_Y, mz], [mx, 3.0, mz]], 0.32, C.steel);
  }

  // ================================================================ power conversion (east)
  const uHX = unit('heat_exchanger', '换热器（sCO₂ 一回路）', 'Heat Exchanger');
  cyl(uHX, 1.7, 1.7, 9, 22, 2.4, 4, C.steel, 'X', 28);
  sph(uHX, 1.7, 26.5, 2.4, 4, C.steel, 1, 20).scale.x = 0.55;
  sph(uHX, 1.7, 17.5, 2.4, 4, C.steel, 1, 20).scale.x = 0.55;
  box(uHX, 1.2, 1.6, 3.8, 19, 0.8, 4, C.orange);
  box(uHX, 1.2, 1.6, 3.8, 25, 0.8, 4, C.orange);

  const uHall = unit('generator_hall', '发电机厅（390 MWe 毛功率）', 'Generator Hall');
  box(uHall, 13, 4.6, 5, 22, 2.3, -6, C.white);
  box(uHall, 13.3, 0.4, 5.3, 22, 0.2, -6, C.steel2);
  box(uHall, 13.05, 0.4, 5.05, 22, 4.25, -6, glowStripe);
  for (let wi = 0; wi < 5; wi++)
    box(uHall, 1.4, 1.1, 0.1, 16.5 + wi * 2.6, 2.4, -3.42, glowWin);
  box(uHall, 0.12, 2.4, 1.3, 15.4, 1.4, -6, C.door);
  lights.push({ color: 0xffd9a0, pos: [22, 3.5, -3.4], range: 30 });
  pipe(uHall, [[20, 3.9, 4], [20, 5.4, 4], [20, 5.4, -6], [20, 4.3, -6]], 0.26, C.steel);

  // thick port pipe -> heat exchanger (piping, unlabeled)
  const gPipes = new THREE.Group();
  gPipes.name = 'piping';
  g.add(gPipes);
  const pa = 290 * Math.PI / 180;
  pipe(gPipes, [[CX + Math.cos(pa) * 9.4, PORT_Y, CZ - Math.sin(pa) * 9.4],
                [12, PORT_Y, 4], [12, 1.2, 4], [18.6, 1.2, 4], [18.6, 2.4, 4]],
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

  // ---------------------------------------------------------------- publish contract
  root.userData.nightMats = nightMats;
  root.userData.lights = lights;
  root.userData.beams = [];
  return root;
}
