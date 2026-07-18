// Atmospheric LiDAR ground station — code asset per MODELS.md §4.
// Ported from the mars_lidar project's procedural Blender build
// (mars_lidar\build_mars_lidar.py) at real metric scale: a wedge
// enclosure (1.6 x 1.2 m, 20 deg sloped roof, 2.2 m at the back), twin
// biaxial optical ports (TX beam expander + RX Ø125 mm telescope), a 9-fin
// radiator wall, a 3.47 m meteorology mast, sealed cable glands, four
// leveling feet, and a tilted solar panel. 905 nm micro-pulse photon-counting.
// 1 unit = 1 m. Origin = pad-center ground point (y=0 = terrain), +Y up,
// front (cable-gland wall) faces +Z. THREE is injected — no imports.
// Blender axis remap: three(x, y, z) = blender(x, z, -y).
// POI anchors are poi_* empties matching sci-lidar-01.info.json; the 905 nm
// beam exits along the roof normal (userData.beams, effect "beam_nir").

export const meta = {
  id: 'sci-lidar-01',
  name: '大气激光雷达站',
  name_en: 'Atmospheric LiDAR Ground Station',
  size_m: 3.47,             // met-mast sonic head above grade; self-check only
  size_axis: 'height',
  effects: ['beam_nir'],
};

export function build(THREE) {
  const root = new THREE.Group();
  root.name = 'sci-lidar-01';
  const nightMats = [];

  // ---------------------------------------------------------------- palette
  const M = (color, opts = {}) => new THREE.MeshLambertMaterial({ color, ...opts });
  const C = {
    white: M(0xd9d8d3),        // insulated panel skin, dust-filmed
    trim: M(0xbfbdb2),
    roof: M(0xcf9f86),         // dust-filmed sloped roof
    steel: M(0x8f9194),
    dark: M(0x3a3d40),         // radiator fins, connectors
    gray: M(0x66655f),
    pad: M(0x6e4127),          // regolith bearing pad
    cells: M(0x1a2740),        // PV cells
    frame: M(0xa2a4a6),
    stripe: M(0x9c3a22),
  };
  const glowGreen = M(0x0d3320, { emissive: 0x2ad07a, emissiveIntensity: 0.0 });
  const glowAmber = M(0x3a2c12, { emissive: 0xffb54a, emissiveIntensity: 0.0 });
  nightMats.push(glowGreen, glowAmber);

  // ---------------------------------------------------------------- helpers
  function box(w, h, d, material, x, y, z, parent) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    m.position.set(x, y, z);
    (parent || root).add(m);
    return m;
  }
  function cyl(rT, rB, h, material, x, y, z, seg, parent) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rT, rB, h, seg || 20), material);
    m.position.set(x, y, z);
    (parent || root).add(m);
    return m;
  }
  function poi(name, x, y, z) {
    const a = new THREE.Object3D();
    a.name = 'poi_' + name;
    a.position.set(x, y, z);
    root.add(a);
  }

  // enclosure dimensions (Blender-derived, remapped to three)
  const W = 1.6, D = 1.2, Z0 = 0.20;
  const SLOPE = 20 * Math.PI / 180;
  const Z_BACK = 2.2, Z_FRONT = Z_BACK - D * Math.tan(SLOPE);   // 1.763
  const hw = W / 2, hd = D / 2;
  // roof outward normal in three: (0, cos, sin) — tilts up toward +z (front)
  const NRM = new THREE.Vector3(0, Math.cos(SLOPE), Math.sin(SLOPE));
  const roofY = (z) => Z_FRONT + (hd - z) * Math.tan(SLOPE);    // z: +front..-back

  // ---------------------------------------------------------------- wedge body
  (function enclosure() {
    // eight corners: three = blender(x, z, -y)
    const V = [
      [-hw, Z0,  hd], [hw, Z0,  hd], [hw, Z0, -hd], [-hw, Z0, -hd],       // floor
      [-hw, Z_FRONT, hd], [hw, Z_FRONT, hd], [hw, Z_BACK, -hd], [-hw, Z_BACK, -hd], // top
    ];
    const F = [                                   // quads (CCW outward)
      [0, 3, 2, 1], [4, 5, 6, 7],                 // floor / roof
      [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7],  // walls
    ];
    const isRoof = (fi) => fi === 1;
    const pos = [], grp = [];
    F.forEach((q, fi) => {
      const a = V[q[0]], b = V[q[1]], c = V[q[2]], d = V[q[3]];
      pos.push(...a, ...b, ...c, ...a, ...c, ...d);
      grp.push(fi);
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.computeVertexNormals();
    // per-face material groups: roof gets dusty tan, rest white
    F.forEach((_, fi) => geo.addGroup(fi * 6, 6, isRoof(fi) ? 1 : 0));
    const mesh = new THREE.Mesh(geo, [C.white, C.roof]);
    root.add(mesh);
    // corner trim strips (front verticals) + stripe band
    box(0.02, 1.4, 0.02, C.trim, -0.27, 1.0, hd + 0.005);
    box(0.02, 1.4, 0.02, C.trim, 0.27, 1.0, hd + 0.005);
    box(W, 0.05, 0.02, C.stripe, 0, 0.55, hd + 0.006);       // red band
    // roof center seam between the two ports
    const midZ = -0.02, my = roofY(midZ);
    box(0.02, 0.012, D * 0.98, C.trim, 0, my + 0.01, midZ).rotation.x = SLOPE;
  })();

  // ---------------------------------------------------------------- twin ports
  function port(px, rCol, rLid, tag) {
    const pz = -0.02;                       // slightly back of center
    const base = new THREE.Vector3(px, roofY(pz), pz);
    const at = (t) => base.clone().addScaledVector(NRM, t);
    const collar = cyl(rCol, rCol, 0.16, C.white, 0, 0, 0, 28);
    collar.position.copy(at(0.06)); collar.rotation.x = SLOPE;
    const seal = cyl(rCol + 0.012, rCol + 0.012, 0.025, C.gray, 0, 0, 0, 28);
    seal.position.copy(at(0.15)); seal.rotation.x = SLOPE;
    const lid = cyl(rLid, rLid, 0.03, C.white, 0, 0, 0, 28);
    lid.position.copy(at(0.18)); lid.rotation.x = SLOPE;
    const rim = cyl(rLid, rLid, 0.012, C.trim, 0, 0, 0, 28);
    rim.position.copy(at(0.20)); rim.rotation.x = SLOPE;
    // hinge block on the up-slope (back) edge
    const hp = base.clone().add(new THREE.Vector3(0, 0, -rLid)).addScaledVector(NRM, 0.18);
    box(0.06, 0.035, 0.04, C.gray, hp.x, hp.y, hp.z).rotation.x = SLOPE;
    return at(0.21);                        // beam / poi tip
  }
  const txTip = port(-0.19, 0.055, 0.075, 'tx');   // TX beam expander
  const rxTip = port(0.19, 0.090, 0.115, 'rx');    // RX Ø125 telescope

  // ---------------------------------------------------------------- radiator
  (function radiator() {
    for (let i = 0; i < 9; i++) {
      const z = 0.44 - i * 0.11;
      box(0.09, 1.05, 0.022, C.dark, hw + 0.045, 1.05, z);
    }
    box(0.02, 1.06, D * 0.95, C.dark, hw + 0.01, 1.05, 0);   // shroud
  })();

  // ---------------------------------------------------------------- cable glands
  (function glands() {
    box(0.42, 0.30, 0.03, C.gray, -0.28, 0.85, hd + 0.015);
    [-0.42, -0.32, -0.22, -0.12].forEach((gx) => {
      const g = cyl(0.028, 0.028, 0.09, C.dark, gx, 0.85, hd + 0.05, 16);
      g.rotation.x = Math.PI / 2;
    });
    box(0.46, 0.018, 0.05, C.gray, -0.28, 1.02, hd + 0.03);  // drip lip
    // status lamps (night glow)
    box(0.03, 0.03, 0.02, glowGreen, -0.02, 0.98, hd + 0.03);
    box(0.03, 0.03, 0.02, glowAmber, -0.08, 0.98, hd + 0.03);
  })();

  // ---------------------------------------------------------------- feet
  [[-0.65, -0.45], [0.65, -0.45], [0.65, 0.45], [-0.65, 0.45]].forEach(([fx, fz]) => {
    cyl(0.13, 0.13, 0.035, C.pad, fx, 0.018, fz, 24);
    cyl(0.035, 0.035, 0.19, C.steel, fx, 0.13, fz, 16);
    box(0.13, 0.025, 0.13, C.steel, fx, 0.20, fz);
  });

  // ---------------------------------------------------------------- met mast
  const MX = 0.94, MZ = -0.48;
  (function mast() {
    cyl(0.10, 0.10, 0.04, C.steel, MX, 0.02, MZ, 24);
    cyl(0.05, 0.05, 3.15, C.white, MX, 1.615, MZ, 24);
    // wall standoff brackets
    box(0.18, 0.07, 0.09, C.steel, (MX + hw) / 2, 0.9, MZ);
    box(0.18, 0.07, 0.09, C.steel, (MX + hw) / 2, 1.9, MZ);
    // wind sensor head
    box(0.20, 0.13, 0.15, C.dark, MX, 3.26, MZ);
    [-0.055, 0.055].forEach((sx) => cyl(0.013, 0.013, 0.14, C.dark, MX + sx, 3.39, MZ, 12));
    cyl(0.09, 0.09, 0.022, C.dark, MX, 3.47, MZ, 24);
    // bare fine-wire thermocouple spokes: 2 heights x 3 azimuths
    [1.7, 2.6].forEach((yt) => {
      for (let k = 0; k < 3; k++) {
        const a = (30 + k * 120) * Math.PI / 180;
        const dx = Math.cos(a), dz = Math.sin(a);
        const sp = cyl(0.008, 0.008, 0.14, C.steel, MX + dx * 0.10, yt, MZ + dz * 0.10, 8);
        sp.rotation.z = Math.PI / 2; sp.rotation.y = -a;
        cyl(0.004, 0.004, 0.06, C.dark, MX + dx * 0.185, yt, MZ + dz * 0.185, 6);
      }
    });
  })();

  // ---------------------------------------------------------------- solar panel
  const SX = -1.75, SY = 0.78;
  (function solar() {
    const g = new THREE.Group();
    g.position.set(SX, 0, 0);
    root.add(g);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.40, 0.04, 0.96),
      [C.frame, C.frame, C.cells, C.frame, C.frame, C.frame]);
    panel.position.set(0, SY, 0);
    panel.rotation.x = -35 * Math.PI / 180;
    g.add(panel);
    [-0.58, 0.58].forEach((lx) => {
      cyl(0.028, 0.028, SY + 0.28, C.frame, lx, (SY + 0.28) / 2, -0.5, 12, g);
      cyl(0.028, 0.028, SY - 0.28, C.frame, lx, (SY - 0.28) / 2, 0.5, 12, g);
      box(0.07, 0.05, 1.25, C.frame, lx, 0.03, 0, g);
    });
  })();

  // ---------------------------------------------------------------- POI anchors
  poi('tx', txTip.x, txTip.y, txTip.z);
  poi('rx', rxTip.x, rxTip.y, rxTip.z);
  poi('det', 0.35, 1.5, -0.1);          // SPAD detector (inside cabin)
  poi('daq', -0.35, 1.3, -0.1);         // FPGA + MCU (inside cabin)
  poi('fins', hw + 0.06, 1.05, 0);
  poi('mast', MX, 2.5, MZ);
  poi('solar', SX, SY, 0);
  poi('beam', txTip.x + NRM.x * 1.4, txTip.y + NRM.y * 1.4, txTip.z + NRM.z * 1.4);

  // ---------------------------------------------------------------- engine hooks
  root.userData.nightMats = nightMats;
  root.userData.lights = [
    { color: 0xbfe0ff, pos: [-0.28, 1.15, hd + 0.35], range: 6 },   // gland-panel work light
  ];
  // 905 nm probe pulse: exits the TX port along the roof normal (20 deg off zenith)
  root.userData.beams = [
    { pos: [txTip.x, txTip.y, txTip.z], dir: [NRM.x, NRM.y, NRM.z] },
  ];

  return root;
}
