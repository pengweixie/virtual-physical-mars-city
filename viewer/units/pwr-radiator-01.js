// Waste-heat radiator field for the fusion plant — code asset per MODELS.md §4.
// Ported from build_radiator_field.py at real metric scale: a sea of V-mounted
// high-temperature panels sized to reject the plant's ~585 MW (≈4.65e4 m²),
// the Mars-signature feature that dwarfs the plant itself.
// 1 unit = 1 m. Origin = base-center ground point (y=0 = terrain), +Y up.
// Panels carry a faint warm emissive so the 600 K field glows at night.

export const meta = {
  id: 'pwr-radiator-01',
  name: '废热散热阵',
  name_en: 'Waste-Heat Radiator Field',
  size_m: 429,              // as-built field length (x) incl. headers; self-check only
  size_axis: 'width',
  effects: ['glow_windows'],
};

export function build(THREE) {
  const root = new THREE.Group();
  root.name = 'pwr-radiator-01';
  const nightMats = [];

  const M = (c, o = {}) => new THREE.MeshLambertMaterial({ color: c, ...o });
  const steel2 = M(0x4c5054);
  const regolith = M(0x6f3620);
  const orange = M(0xcc4b1a);
  // hot panel: near-black by day, faint warm-red emissive ramped up at night
  const panelMat = M(0x1b1b1d, { emissive: 0x3a0a04, emissiveIntensity: 0.0 });
  nightMats.push(panelMat);

  // ---------------------------------------------------------------- field grid
  const COLS = 26, ROWS = 12;          // 312 V-units → 624 panels
  const PW = 15, PH = 5, PT = 0.16;    // panel length(x), height, thickness
  const COL_PITCH = 15.6, ROW_PITCH = 9;
  const tilt = 35 * Math.PI / 180;
  const yoff = Math.sin(tilt) * PH / 2;
  const zc = 0.6 + Math.cos(tilt) * PH / 2;

  // instanced meshes: the ~600-panel sea collapses to a handful of draw calls
  const units = COLS * ROWS;
  const panelGeo = new THREE.BoxGeometry(PW, PH, PT);
  const beamGeo = new THREE.BoxGeometry(PW + 0.4, 0.4, 0.4);
  const legGeo = new THREE.BoxGeometry(0.3, 1.0, 0.3);
  const panels = new THREE.InstancedMesh(panelGeo, panelMat, units * 2);
  const beams = new THREE.InstancedMesh(beamGeo, steel2, units);
  const legs = new THREE.InstancedMesh(legGeo, steel2, units * 2);
  // labeled sub-device group (viewer hangs a floating tag), ISRU convention
  const uPanels = new THREE.Group();
  uPanels.name = 'panel_field';
  uPanels.userData = { label: '高温散热板阵（600 K · 624 板）',
                       label_en: 'High-Temp Radiator Array', level: 'unit' };
  uPanels.add(panels, beams, legs);
  root.add(uPanels);

  const x0 = -(COLS - 1) * COL_PITCH / 2;
  const z0 = -(ROWS - 1) * ROW_PITCH / 2;

  // thin regolith pad under the whole array
  root.add(new THREE.Mesh(
    new THREE.BoxGeometry(COLS * COL_PITCH + 20, 0.6, ROWS * ROW_PITCH + 16),
    regolith).translateY(-0.1));

  const mtx = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const pos = new THREE.Vector3();
  const one = new THREE.Vector3(1, 1, 1);
  const XAX = new THREE.Vector3(1, 0, 0);
  let bi = 0, li = 0, pi = 0;
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      const ux = x0 + c * COL_PITCH;
      const uz = z0 + r * ROW_PITCH;
      beams.setMatrixAt(bi++, mtx.makeTranslation(ux, 0.95, uz));
      for (const ex of [ux - PW / 2 + 0.3, ux + PW / 2 - 0.3]) {
        legs.setMatrixAt(li++, mtx.makeTranslation(ex, 0.5, uz));
      }
      for (const sgn of [1, -1]) {
        pos.set(ux, zc, uz + sgn * yoff);
        q.setFromAxisAngle(XAX, -sgn * tilt);
        panels.setMatrixAt(pi++, mtx.compose(pos, q, one));
      }
    }
  }
  panels.instanceMatrix.needsUpdate = true;
  beams.instanceMatrix.needsUpdate = true;
  legs.instanceMatrix.needsUpdate = true;
  panels.computeBoundingBox(); beams.computeBoundingBox(); legs.computeBoundingBox();

  // ---------------------------------------------------------------- coolant headers
  // hot supply / cold return manifolds running the length of the field, with
  // branch stubs into every row and orange pipe supports
  const HZ = z0 - ROW_PITCH * 0.7;
  const xL = x0 - COL_PITCH, xR = x0 + (COLS - 1) * COL_PITCH + COL_PITCH;
  const UP = new THREE.Vector3(0, 1, 0);
  const uHeaders = new THREE.Group();
  uHeaders.name = 'coolant_headers';
  uHeaders.userData = { label: '冷却工质母管', label_en: 'Coolant Headers',
                        level: 'unit' };
  root.add(uHeaders);
  function pipe(pts, rad, mat) {
    for (let i = 0; i < pts.length - 1; i++) {
      const a = new THREE.Vector3(...pts[i]), b = new THREE.Vector3(...pts[i + 1]);
      const dir = new THREE.Vector3().subVectors(b, a), len = dir.length();
      const m = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, len, 12), mat);
      m.position.copy(a).add(b).multiplyScalar(0.5);
      m.quaternion.setFromUnitVectors(UP, dir.normalize());
      uHeaders.add(m);
    }
  }
  for (const hz of [HZ, -HZ]) {
    pipe([[xL, 1.0, hz], [xR, 1.0, hz]], 0.3, steel2);
    for (let s = 0; s < 6; s++) {
      const px = x0 + s * (COLS - 1) * COL_PITCH / 5;
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.8, 0.35), orange);
      leg.position.set(px, 0.4, hz); uHeaders.add(leg);
    }
  }
  // cross-tie from plant side into the near header
  pipe([[xL - 6, 1.0, HZ], [xL, 1.0, HZ]], 0.3, steel2);

  // ---------------------------------------------------------------- beacons
  // the field is low (5 m panels) and reads as a dark carpet from afar; two
  // 18 m warning masts with blink_* heads (MODELS.md §5 hook) mark its ends
  const mastMat = M(0x9aa0a4);
  for (const [bx, i] of [[xL + 4, 1], [xR - 4, 2]]) {
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 18, 10), mastMat);
    mast.position.set(bx, 9, HZ); root.add(mast);
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.25, 10),
      new THREE.MeshLambertMaterial({ color: 0xcc4b1a }));
    ring.position.set(bx, 16.6, HZ); root.add(ring);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 8),
      new THREE.MeshBasicMaterial({ color: 0x7a1512 }));
    head.name = `blink_beacon_radiator_${i}`;
    head.position.set(bx, 18.4, HZ); root.add(head);
  }

  root.userData.nightMats = nightMats;
  root.userData.lights = [];
  root.userData.beams = [];
  return root;
}
