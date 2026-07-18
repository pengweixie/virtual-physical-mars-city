// Areostationary data-relay satellite — code asset per MODELS.md §4.
// A TDRS/EDRS-class relay bus: gold-MLI body module, twin deployable solar
// wings (3 panels each, ~30 m tip-to-tip), two 3 m Ka/X dishes staring at the
// Mars nadir, one 2.5 m gimbaled X-band dish for the Earth downlink, black OSR
// radiators, a star-tracker cluster, corner thruster pods and a red beacon.
//
// ORBITAL ASSET — NOT a surface unit. It does NOT go in models/manifest.json.
// The viewer instantiates it onto the areostationary ring (3 primary + 1 spare)
// in place of the placeholder buildSat().
//
// 1 unit = 1 m. Origin = bus centroid. Frame:
//   +Z → Mars nadir (the two Ka/X dishes stare down +Z)
//   -Z → zenith / anti-Mars (Earth dish + trackers + thrusters live here)
//   ±X → solar-wing deployment axis (SADA rotates each wing about local X)
//   ±Y → radiator faces (deep-space looking)
// The integrator points +Z at Mars (e.g. lookAt the planet from the -Z side).
// THREE is injected — no imports, no external textures.
// Coarse-silhouette build: the whole sat is scaled DOWN into the orbit view, so
// no fragile thin rods — every strut/boom/rib is ≥0.15 m in its thin section.

export const meta = {
  id: 'com-relay-01',
  name: '火星静止轨道中继星',
  name_en: 'Areostationary Data-Relay Satellite',
  size_m: 30,               // solar-wing tip-to-tip span; self-check only
  size_axis: 'width',
  kind: 'orbital',          // hint: not surface-placed; viewer instances it
};

export function build(THREE) {
  const root = new THREE.Group();
  root.name = 'com-relay-01';
  const nightMats = [];

  // ---------------------------------------------------------------- palette
  const L = (color, opts = {}) => new THREE.MeshLambertMaterial({ color, ...opts });
  const S = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, ...opts });
  const C = {
    mliGold: L(0xb9902f),                                   // matte gold MLI blanket
    mliSilver: L(0xb7bcc4),                                 // silver-grey MLI
    rib: L(0x8d9198),                                       // edge stiffener ribs
    steel: L(0x8a8d92),
    dark: L(0x3a3d42),
    reflector: L(0xe9e9ec, { side: THREE.DoubleSide }),     // white dish reflector
    goldMesh: S(0xcaa43c, { side: THREE.DoubleSide,         // gold-mesh Earth dish
      metalness: 0.6, roughness: 0.35, transparent: true, opacity: 0.82 }),
    cells: L(0x162542),                                     // PV cell field (deep blue)
    panelBack: L(0xd6d6d2),                                 // white panel backsheet
    frame: L(0xa6a8ab),
    truss: L(0x9a9ca0),
    osr: S(0x0c0d11, { metalness: 0.35, roughness: 0.5 }),  // black OSR radiator
    horn: L(0xcaa43c),                                      // feed horn / subreflector
  };
  const glowRed = L(0x2a0606, { emissive: 0xff2a1e, emissiveIntensity: 0.0 });
  nightMats.push(glowRed);

  // ---------------------------------------------------------------- helpers
  function box(w, h, d, mat, x, y, z, parent) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    (parent || root).add(m);
    return m;
  }
  function cyl(rT, rB, h, mat, x, y, z, seg, parent) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rT, rB, h, seg || 16), mat);
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
  // Parabolic dish opening along local +Y (vertex at local origin). Caller
  // rotates it to aim. Returns a Group; feed + subreflector sit at the focus.
  function makeDish(R, f, reflMat) {
    const g = new THREE.Group();
    const prof = [];
    const N = 9;
    for (let i = 0; i <= N; i++) {
      const r = (i / N) * R;
      prof.push(new THREE.Vector2(r, (r * r) / (4 * f)));    // y = r²/4f
    }
    const bowl = new THREE.Mesh(
      new THREE.LatheGeometry(prof, 28), reflMat);
    g.add(bowl);
    // rim hoop (chunky so it survives scale-down)
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(R, 0.08, 6, 28), C.frame);
    rim.position.y = (R * R) / (4 * f);
    rim.rotation.x = Math.PI / 2;
    g.add(rim);
    // feed horn at focus, looking back into the dish (-Y)
    cyl(0.08, 0.13, 0.24, C.horn, 0, f - 0.12, 0, 12, g);
    // subreflector cap just forward of the focus
    cyl(0.13, 0.13, 0.06, C.horn, 0, f + 0.03, 0, 16, g);
    // three tripod struts rim → focus (≥0.15 m section)
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2;
      const rx = Math.cos(a) * R * 0.92, rz = Math.sin(a) * R * 0.92;
      const rimY = (R * R) / (4 * f);
      const mid = new THREE.Vector3((0 + rx) / 2, (f + rimY) / 2, (0 + rz) / 2);
      const len = Math.hypot(rx, f - rimY, rz);
      const strut = cyl(0.075, 0.075, len, C.steel, mid.x, mid.y, mid.z, 8, g);
      strut.lookAt(new THREE.Vector3(0, f, 0));
      strut.rotateX(Math.PI / 2);
    }
    return g;
  }

  // ---------------------------------------------------------------- bus module
  const HX = 0.9, HY = 0.9, HZ = 1.3;         // half-dims of the 1.8×1.8×2.6 box
  (function bus() {
    // body: gold MLI on ±Z / ±X, silver on ±Y (radiator faces)
    const body = new THREE.Mesh(new THREE.BoxGeometry(2 * HX, 2 * HY, 2 * HZ),
      [C.mliGold, C.mliGold, C.mliSilver, C.mliSilver, C.mliGold, C.mliGold]);
    root.add(body);
    // edge stiffener beams along the four Z-running corners (chunky, coarse)
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      box(0.15, 0.15, 2 * HZ + 0.02, C.rib, sx * HX, sy * HY, 0);
    }
    // girth ribs around the mid-body
    box(2 * HX + 0.04, 0.15, 0.15, C.rib, 0, HY, 0);
    box(2 * HX + 0.04, 0.15, 0.15, C.rib, 0, -HY, 0);
  })();

  // ---------------------------------------------------------------- solar wings
  // Each wing: SADA joint at the bus edge, a truss yoke, then 3 panels in series.
  // The wing Group pivots about local X (the SADA axis) so animate() can sun-track.
  const wings = [];
  function buildWing(sign) {
    const w = new THREE.Group();
    w.position.set(sign * HX, 0, 0);
    root.add(w);
    // SADA drum at the root
    const sada = cyl(0.16, 0.16, 0.34, C.steel, sign * 0.12, 0, 0, 16, w);
    sada.rotation.z = Math.PI / 2;
    // twin truss yoke arms out to the first panel (≥0.15 m section)
    const yokeIn = sign * 0.28, yokeOut = sign * 1.95;   // tips at ±15.0 → 30 m span
    for (const sz of [-0.55, 0.55]) {
      const mx = (yokeIn + yokeOut) / 2;
      const arm = cyl(0.08, 0.08, Math.abs(yokeOut - yokeIn), C.truss, mx, 0, sz, 10, w);
      arm.rotation.z = Math.PI / 2;
    }
    box(0.15, 0.15, 1.2, C.truss, (yokeIn + yokeOut) / 2, 0, 0, w);  // cross-brace
    // 3 panels in series, each 4.0 (X) × 1.5 (Z); cells on +Y, backsheet on -Y.
    // Broad plates read fine at scale; no thin surface grooves (they'd alias out).
    const panelMats = [C.frame, C.frame, C.cells, C.panelBack, C.frame, C.frame];
    let x = yokeOut + sign * 0.05;
    for (let p = 0; p < 3; p++) {
      const cx = x + sign * 2.0;
      const panel = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.08, 1.5), panelMats);
      panel.position.set(cx, 0, 0);
      w.add(panel);
      x += sign * 4.05;
    }
    wings.push(w);
    return w;
  }
  buildWing(-1);
  buildWing(1);

  // ---------------------------------------------------------------- Mars dishes
  // Two 3 m (Ø) Ka/X reflectors on short booms, staring down the +Z nadir.
  const marsDishTips = [];
  for (const sy of [-1, 1]) {
    const by = sy * 1.7;                        // spread apart in Y, beyond the bus
    // boom runs along Y (cylinder's native axis — no rotation) from the bus edge
    // to behind the dish; stub blocks tie it to the bus face and the dish vertex
    const yIn = sy * (HY - 0.1);
    const boom = cyl(0.09, 0.09, Math.abs(by - yIn) + 0.1, C.steel,
      0, (yIn + by) / 2, HZ + 0.08, 12);
    box(0.16, 0.16, 0.2, C.steel, 0, yIn, HZ + 0.02);        // bus-face stub
    box(0.16, 0.16, 0.24, C.steel, 0, by, HZ + 0.12);        // dish-vertex stub
    // physical primary f/D = 0.4 (Cassegrain: effective f/D 0.8 via subreflector)
    const d = makeDish(1.5, 1.2, C.reflector);
    d.position.set(0, by, HZ + 0.2);
    d.rotation.x = Math.PI / 2;                 // open toward +Z (Mars nadir)
    root.add(d);
    marsDishTips.push([0, by, HZ + 0.2 + 1.2]); // ~focus, for POI/label
  }

  // ---------------------------------------------------------------- Earth dish
  // 2.5 m gold-mesh X-band reflector on a 2-axis gimbal, on the -Z (anti-Mars)
  // side. Nominally points -Z; animate() sways it as it tracks Earth.
  const dteGimbal = new THREE.Group();
  dteGimbal.position.set(0, 0, -HZ - 0.35);
  root.add(dteGimbal);
  // gimbal mast + yoke
  cyl(0.1, 0.1, 0.5, C.steel, 0, 0, 0.25, 12, dteGimbal).rotation.x = Math.PI / 2;
  box(0.5, 0.16, 0.16, C.dark, 0, 0, -0.05, dteGimbal);
  const dte = makeDish(1.25, 1.0, C.goldMesh);
  dte.position.set(0, 0, -0.13);                // vertex meets the gimbal yoke
  dte.rotation.x = -Math.PI / 2;                // open toward -Z (Earth side)
  dteGimbal.add(dte);

  // ------------------------------------------------ payload module (RF / TWTA)
  // Visible gold-MLI equipment module on the +Z deck between the two Mars dishes,
  // with stub waveguides toward the dish feeds. Backs poi_rf so the transponder /
  // TWTA deck is real hardware, not an interior void.
  (function payload() {
    box(0.8, 0.8, 0.35, C.mliGold, 0, 0, HZ + 0.18);          // equipment module
    box(0.84, 0.84, 0.04, C.rib, 0, 0, HZ + 0.37);            // top cover frame
    box(0.5, 0.5, 0.06, C.osr, 0, 0, HZ + 0.4);               // module radiator patch
    for (const sy of [-1, 1]) {                               // stub waveguides
      box(0.16, 0.6, 0.16, C.horn, 0, sy * 0.6, HZ + 0.28);
    }
  })();

  // ---------------------------------------------------------------- radiators
  // Two black OSR panels flush on the ±Y (deep-space) faces, biased anti-nadir.
  for (const sy of [-1, 1]) {
    box(1.5, 0.03, 1.7, C.osr, 0, sy * (HY + 0.02), -0.25);
    // shroud lip
    box(1.6, 0.06, 0.03, C.rib, 0, sy * (HY + 0.02), 0.62);
  }

  // ---------------------------------------------------------------- attitude
  // Star-tracker cluster (3 baffled boxes, different look directions) on -Z.
  const trk = [[-0.35, 0.35], [0.35, 0.3], [0.05, -0.4]];
  trk.forEach(([tx, ty], i) => {
    const b = box(0.18, 0.18, 0.24, C.dark, tx, ty, -HZ - 0.12, root);
    b.rotation.set(0.3 * (i - 1), 0.4 * (i - 1), 0);
    const baffle = cyl(0.09, 0.11, 0.08, C.steel, 0, 0, -0.14, 12, b);
    baffle.rotation.x = Math.PI / 2;            // tube opens along the look axis
  });
  // Reaction-wheel cluster (4 drums on a mount plate) — visible hardware for
  // poi_adcs, tucked in the free -Z quadrant clear of the DTE mast.
  (function wheels() {
    box(0.55, 0.55, 0.1, C.dark, 0.42, -0.42, -HZ - 0.05);   // plate seats on bus face
    for (const [dx, dy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const drum = cyl(0.15, 0.15, 0.13, C.steel,
        0.42 + dx * 0.16, -0.42 + dy * 0.16, -HZ - 0.16, 14);
      drum.rotation.x = Math.PI / 2;                          // flat wheel facing -Z
    }
  })();
  // Four corner thruster pods (nozzle clusters) around the -Z corners.
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    const px = sx * HX, py = sy * HY, pz = -HZ + 0.1;
    box(0.2, 0.2, 0.2, C.dark, px, py, pz);
    for (const [ox, oy] of [[0.06, 0.06], [-0.06, -0.06]]) {
      const n = cyl(0.08, 0.11, 0.16, C.steel, px + ox, py + oy, pz - 0.14, 10);
      n.rotation.x = Math.PI / 2;
    }
  }

  // ---------------------------------------------------------------- beacon
  // Red status light proud of the corner rib (no coplanar z-fighting). Named
  // blink_* so the engine's beacon path (material swap + pulse) drives it —
  // pulsing a near-black diffuse via blinkMats would be invisible.
  const beacon = box(0.15, 0.15, 0.15, glowRed, HX + 0.09, HY + 0.09, HZ - 0.2);
  beacon.name = 'blink_beacon';

  // ---------------------------------------------------------------- POI anchors
  poi('bus', 0, 0, 0);
  poi('solar', 7.0, 0, 0);                      // out on the +X wing
  poi('ka', marsDishTips[1][0], marsDishTips[1][1], marsDishTips[1][2]);
  poi('dte', 0, 0, -HZ - 1.6);                  // in front of the Earth dish
  poi('rf', 0, 0, HZ + 0.4);                    // RF/TWTA payload module (+Z deck)
  poi('adcs', 0.35, 0.35, -HZ - 0.15);          // star-tracker cluster + avionics
  poi('thermal', 0, HY + 0.06, -0.25);          // +Y OSR radiator
  poi('skeep', HX, -HY, -HZ + 0.1);             // aft thruster pod / propulsion

  // ---------------------------------------------------------------- engine hooks
  root.userData.nightMats = nightMats;
  root.userData.lights = [
    { color: 0xff3020, pos: [HX + 0.09, HY + 0.09, HZ - 0.2], range: 8 },
  ];

  // continuous motion, declarative (MODELS.md §4 unified vocabulary): both
  // wings sun-track about their SADA, the Earth dish sways on its gimbal as
  // it tracks Earth. Rates match the retired hand-written animate loop.
  root.userData.spinners = wings.map((w) =>
    ({ node: w, axis: 'x', rpm: 0.191 }));      // 0.02 rad/s ≈ 5 min/rev
  root.userData.oscillators = [
    { node: dteGimbal, axis: 'x', amp: -0.12, period: 104.7 },
    { node: dteGimbal, axis: 'y', amp: 0.18, period: 139.6 },
  ];

  return root;
}
