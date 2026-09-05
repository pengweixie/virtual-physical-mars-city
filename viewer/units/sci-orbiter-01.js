// 400 km low-orbit science platform — code asset per MODELS.md §4.
// Upgrades the generic buildSat() placeholder into the real sci-orbiter-01:
// a three-payload bus (SHARAD-lineage ice radar, CRISM-lineage SWIR
// hyperspectral pushbroom, radio-occultation via the Ka crosslink) in a
// 400 km sun-synchronous orbit (92.9 deg, 12.5 orbits/sol).
//
// ORBITAL ASSET — NOT surface-placed. manifest kind:"orbital", pos:null
// (com-polar-01 / com-l4-01 precedent). The viewer instantiates it on the
// low-orbit ring in place of the old placeholder.
//
// 1 unit = 1 m. Origin = bus centroid. Frame (same as com-relay-01):
//   +Z → Mars nadir  (radar boresight + SWIR telescope stare down +Z)
//   -Z → zenith      (Ka crosslink dish looks up at the areostationary ring)
//   ±X → solar-wing axis (SADA)
//   ±Y → radar dipole axis (10 m tip-to-tip, the signature silhouette)
// Integrator points +Z at Mars (lookAt planet, then rotateY(PI)).
// THREE injected — no imports, no textures. Coarse silhouette: the whole sat
// is scaled far down in the orbit view, thin sections kept ≥0.15 m.

export const meta = {
  id: 'sci-orbiter-01',
  name: '400 km 科学轨道器',
  name_en: 'Low-Orbit Science Platform',
  size_m: 10,               // radar dipole tip-to-tip; self-check only
  size_axis: 'height',      // the 10 m span lies along ±Y (validator's y axis)
  kind: 'orbital',
};

export function build(THREE) {
  const root = new THREE.Group();
  root.name = 'sci-orbiter-01';
  const nightMats = [];

  const L = (color, opts = {}) => new THREE.MeshLambertMaterial({ color, ...opts });
  const S = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, ...opts });
  const C = {
    mliGold: L(0xb9902f),
    mliSilver: L(0xb7bcc4),
    rib: L(0x8d9198),
    steel: L(0x8a8d92),
    dark: L(0x3a3d42),
    boom: L(0xe8e4da),                                      // radar tube dipole
    boomTip: L(0xc2571a),                                   // safety-orange tips
    cells: L(0x162542),
    panelBack: L(0xd6d6d2),
    frame: L(0xa6a8ab),
    osr: S(0x0c0d11, { metalness: 0.35, roughness: 0.5 }),
    goldMesh: S(0xcaa43c, { side: THREE.DoubleSide,
      metalness: 0.6, roughness: 0.35, transparent: true, opacity: 0.85 }),
    baffle: L(0x14161a),
    horn: L(0xcaa43c),
  };
  const glowRed = L(0x2a0606, { emissive: 0xff2a1e, emissiveIntensity: 0.0 });
  nightMats.push(glowRed);

  function box(w, h, d, mat, x, y, z, parent) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    (parent || root).add(m);
    return m;
  }
  function cyl(rT, rB, h, mat, x, y, z, seg, parent) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rT, rB, h, seg || 14), mat);
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

  // ------------------------------------------------------------- bus module
  const HX = 0.6, HY = 0.6, HZ = 0.8;          // 1.2 × 1.2 × 1.6 m
  const body = new THREE.Mesh(new THREE.BoxGeometry(2 * HX, 2 * HY, 2 * HZ),
    [C.mliGold, C.mliGold, C.mliSilver, C.mliSilver, C.mliGold, C.mliGold]);
  root.add(body);
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    box(0.15, 0.15, 2 * HZ + 0.02, C.rib, sx * HX, sy * HY, 0);
  }
  box(2 * HX + 0.04, 0.15, 0.15, C.rib, 0, HY, 0);
  box(2 * HX + 0.04, 0.15, 0.15, C.rib, 0, -HY, 0);

  // ---------------------------------------------- payload 1: ice radar dipole
  // 10 m tip-to-tip deployable tube dipole along ±Y, HF 15–35 MHz. Root
  // canisters on the bus faces, orange tip masses, matching-network box.
  for (const sy of [-1, 1]) {
    box(0.3, 0.34, 0.3, C.steel, 0, sy * (HY + 0.17), HZ - 0.35);   // canister
    const bl = 5.0 - (HY + 0.34);                    // boom length to y=±5.0
    const bc = sy * (HY + 0.34 + bl / 2);
    cyl(0.08, 0.08, bl, C.boom, 0, bc, HZ - 0.35);   // tube boom (native Y axis)
    cyl(0.1, 0.1, 0.5, C.boomTip, 0, sy * 4.75, HZ - 0.35);         // tip mass
  }
  box(0.4, 0.3, 0.2, C.horn, 0, 0, HZ + 0.1);        // matching network / feed
  // dipole boresight = +Z nadir; no dish — the planet is the antenna's mirror

  // ---------------------------------------------- payload 2: SWIR pushbroom
  // 12 cm f/2.5 spectrometer telescope staring +Z; gold housing, black baffle,
  // and the FPA passive radiator (dark plate, deep-space side) on -Y.
  (function swir() {
    const bx = 0.42;                                  // offset from bus center
    box(0.5, 0.5, 0.45, C.mliGold, bx, 0, HZ + 0.12); // spectrometer housing
    const tube = cyl(0.16, 0.16, 0.5, C.baffle, bx, 0, HZ + 0.55, 18);
    tube.rotation.x = Math.PI / 2;                    // barrel along +Z
    const lip = cyl(0.18, 0.18, 0.08, C.frame, bx, 0, HZ + 0.78, 18);
    lip.rotation.x = Math.PI / 2;
    box(0.55, 0.04, 0.6, C.osr, bx, -(HY + 0.04), HZ - 0.4);   // FPA radiator
    box(0.12, 0.3, 0.12, C.steel, bx, -(HY - 0.1), HZ + 0.1);  // cold strap run
  })();

  // ------------------------------- payload 3 / comms: Ka crosslink terminal
  // 0.5 m gimbaled gold-mesh dish on the zenith (-Z) deck — data trunk to the
  // areostationary ring AND the radio-occultation instrument (USO-referenced
  // carrier; the atmosphere writes its T/P profile into this link's phase).
  const kaGimbal = new THREE.Group();
  kaGimbal.position.set(-0.25, 0, -HZ - 0.3);
  root.add(kaGimbal);
  cyl(0.09, 0.09, 0.45, C.steel, -0.25, 0, -HZ - 0.12, 12).rotation.x = Math.PI / 2;
  box(0.34, 0.15, 0.15, C.dark, 0, 0, -0.02, kaGimbal);
  (function kaDish() {
    const prof = [];
    for (let i = 0; i <= 8; i++) {
      const r = (i / 8) * 0.25;
      prof.push(new THREE.Vector2(r, (r * r) / (4 * 0.2)));
    }
    const bowl = new THREE.Mesh(new THREE.LatheGeometry(prof, 22), C.goldMesh);
    bowl.rotation.x = -Math.PI / 2;                   // open toward -Z (zenith)
    bowl.position.z = -0.1;
    kaGimbal.add(bowl);
    const feed = cyl(0.03, 0.05, 0.12, C.horn, 0, 0, -0.3, 10, kaGimbal);
    feed.rotation.x = Math.PI / 2;
  })();
  box(0.25, 0.25, 0.2, C.mliSilver, 0.35, 0.3, -HZ - 0.12);  // USO / transceiver
  cyl(0.04, 0.07, 0.14, C.steel, 0.35, -0.35, -HZ - 0.1, 10) // X-band LGA cone
    .rotation.x = Math.PI / 2;

  // ------------------------------------------------------------ solar wings
  const wings = [];
  for (const sx of [-1, 1]) {
    const w = new THREE.Group();
    w.position.set(sx * HX, 0, 0);
    root.add(w);
    const sada = cyl(0.12, 0.12, 0.26, C.steel, sx * 0.1, 0, 0, 14, w);
    sada.rotation.z = Math.PI / 2;
    const yoke = cyl(0.06, 0.06, 0.5, C.frame, sx * 0.48, 0, 0, 10, w);
    yoke.rotation.z = Math.PI / 2;
    // two 1.1 × 0.9 panels in series → wing tips at ±3.6 m
    const mats = [C.frame, C.frame, C.cells, C.panelBack, C.frame, C.frame];
    for (let p = 0; p < 2; p++) {
      const cx = sx * (0.75 + 0.575 + p * 1.15);
      const panel = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.07, 0.9), mats);
      panel.position.set(cx, 0, 0);
      w.add(panel);
    }
    wings.push(w);
  }

  // -------------------------------------------------------- radiators / ADCS
  box(1.0, 0.03, 1.1, C.osr, 0, HY + 0.02, -0.2);     // bus OSR, +Y face
  for (const [tx, ty] of [[-0.3, 0.3], [0.1, 0.42]]) { // star trackers, zenith
    const b = box(0.15, 0.15, 0.2, C.dark, tx, ty, -HZ - 0.1);
    b.rotation.set(0.25 * ty, 0.3 * tx, 0);
  }
  for (const sx of [-1, 1]) {                          // thruster pods (drag
    const px = sx * HX, pz = -HZ + 0.12;               // make-up 0.4 m/s/yr)
    box(0.16, 0.16, 0.16, C.dark, px, -HY, pz);
    const n = cyl(0.06, 0.09, 0.12, C.steel, px, -HY, pz - 0.12, 10);
    n.rotation.x = Math.PI / 2;
  }
  const beacon = box(0.13, 0.13, 0.13, glowRed, HX + 0.08, HY + 0.08, HZ - 0.15);
  beacon.name = 'blink_beacon';

  // ------------------------------------------------------------ POI anchors
  poi('bus', 0, 0, 0);
  poi('radar', 0, 4.6, HZ - 0.35);                     // out on the +Y boom
  poi('swir', 0.42, 0, HZ + 0.7);                      // telescope aperture
  poi('ro', -0.25, 0, -HZ - 0.75);                     // Ka dish / occultation
  poi('link', 0.35, 0.3, -HZ - 0.25);                  // USO + transceiver
  poi('solar', 2.2, 0, 0);                             // out on the +X wing
  poi('orbit', 0, -1.4, 0);                            // orbit-verdict card

  // ------------------------------------------------------------ engine hooks
  root.userData.nightMats = nightMats;
  root.userData.lights = [
    { color: 0xff3020, pos: [HX + 0.08, HY + 0.08, HZ - 0.15], range: 6 },
  ];
  // wings sun-track about the SADA axis; the Ka gimbal sways as it hands the
  // trunk between the three relays (12.5 orbits/sol → frequent re-points)
  root.userData.spinners = wings.map((w) =>
    ({ node: w, axis: 'x', rpm: 0.191 }));
  root.userData.oscillators = [
    { node: kaGimbal, axis: 'x', amp: 0.35, period: 47 },
    { node: kaGimbal, axis: 'y', amp: 0.5, period: 71 },
  ];

  return root;
}
