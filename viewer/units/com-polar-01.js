// Polar-cap gap-filler relay — code asset per MODELS.md §4.
// One satellite of the 3-ship polar ring: circular areosynchronous-PERIOD
// polar orbit (a = 20 428 km, i ≈ 90°, one plane, 120° phasing) that closes
// the ±71°-to-pole blind caps the areostationary ring declared. Same relay
// platform as com-relay-01 (91.5% common lines, s06): silver-liveried bus
// with blind-zone-orange trim, one 3 m two-axis Ka/X user dish (nadir),
// a 2.5 m gold-mesh crosslink dish (backhaul to the areo ring), and a
// UHF quadrifilar-helix pair for small polar surface stations.
//
// ORBITAL ASSET — NOT surface-placed. The viewer instantiates it onto the
// polar ring per the HANDOFF_COMGAP orbit-parameter table (manifest entry
// carries kind:"orbital", pos:null so loadUnits skips it).
//
// 1 unit = 1 m. Origin = bus centroid. Frame (same convention as com-relay-01):
//   +Z → Mars nadir (user dish stares down +Z)
//   -Z → zenith (trackers, thrusters)
//   ±X → solar-wing / SADA axis
//   +Y → crosslink mast side; -Y → main radiator face
// Coarse-silhouette build: scaled DOWN into orbit view; thin sections ≥0.15 m.

export const meta = {
  id: 'com-polar-01',
  name: '极区补盲中继星',
  name_en: 'Polar-Cap Relay Satellite',
  size_m: 30,               // solar-wing tip-to-tip span; self-check only
  size_axis: 'width',
  kind: 'orbital',          // not surface-placed; viewer instances the ring of 3
};

export function build(THREE) {
  const root = new THREE.Group();
  root.name = 'com-polar-01';
  const nightMats = [];

  // ---------------------------------------------------------------- palette
  const L = (color, opts = {}) => new THREE.MeshLambertMaterial({ color, ...opts });
  const S = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, ...opts });
  const C = {
    mliSilver: L(0xb7bcc4),                                 // silver MLI (this bird's livery)
    mliGold: L(0xb9902f),                                   // gold MLI accents (common bus parts)
    trim: L(0xd07a2e),                                      // blind-zone orange trim
    rib: L(0x8d9198),
    steel: L(0x8a8d92),
    dark: L(0x3a3d42),
    reflector: L(0xe9e9ec, { side: THREE.DoubleSide }),
    goldMesh: S(0xcaa43c, { side: THREE.DoubleSide,
      metalness: 0.6, roughness: 0.35, transparent: true, opacity: 0.82 }),
    cells: L(0x162542),
    panelBack: L(0xd6d6d2),
    frame: L(0xa6a8ab),
    truss: L(0x9a9ca0),
    osr: S(0x0c0d11, { metalness: 0.35, roughness: 0.5 }),
    horn: L(0xcaa43c),
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
  // Parabolic dish opening along local +Y (vertex at origin); caller aims it.
  function makeDish(R, f, reflMat) {
    const g = new THREE.Group();
    const prof = [];
    const N = 9;
    for (let i = 0; i <= N; i++) {
      const r = (i / N) * R;
      prof.push(new THREE.Vector2(r, (r * r) / (4 * f)));
    }
    g.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 28), reflMat));
    const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.08, 6, 28), C.frame);
    rim.position.y = (R * R) / (4 * f);
    rim.rotation.x = Math.PI / 2;
    g.add(rim);
    cyl(0.08, 0.13, 0.24, C.horn, 0, f - 0.12, 0, 12, g);   // feed at focus
    cyl(0.13, 0.13, 0.06, C.horn, 0, f + 0.03, 0, 16, g);   // subreflector
    for (let k = 0; k < 3; k++) {                            // tripod struts
      const a = (k / 3) * Math.PI * 2;
      const rx = Math.cos(a) * R * 0.92, rz = Math.sin(a) * R * 0.92;
      const rimY = (R * R) / (4 * f);
      const mid = new THREE.Vector3(rx / 2, (f + rimY) / 2, rz / 2);
      const len = Math.hypot(rx, f - rimY, rz);
      const strut = cyl(0.075, 0.075, len, C.steel, mid.x, mid.y, mid.z, 8, g);
      strut.lookAt(new THREE.Vector3(0, f, 0));
      strut.rotateX(Math.PI / 2);
    }
    return g;
  }

  // ---------------------------------------------------------------- bus module
  // Same 1.8×1.8 section as the relay bus (common structure line), silver-clad.
  const HX = 0.9, HY = 0.9, HZ = 1.1;          // 1.8×1.8×2.2 box
  (function bus() {
    const body = new THREE.Mesh(new THREE.BoxGeometry(2 * HX, 2 * HY, 2 * HZ),
      [C.mliSilver, C.mliSilver, C.mliGold, C.mliGold, C.mliSilver, C.mliSilver]);
    root.add(body);
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      box(0.15, 0.15, 2 * HZ + 0.02, C.rib, sx * HX, sy * HY, 0);
    }
    // blind-zone-orange girth band: the ring's visual signature (matches the
    // dashed ±71° cap rings this constellation was built to erase)
    box(2 * HX + 0.05, 0.22, 0.16, C.trim, 0, HY, -0.35);
    box(2 * HX + 0.05, 0.22, 0.16, C.trim, 0, -HY, -0.35);
    box(0.22, 2 * HY + 0.05, 0.16, C.trim, HX, 0, -0.35);
    box(0.22, 2 * HY + 0.05, 0.16, C.trim, -HX, 0, -0.35);
  })();

  // ---------------------------------------------------------------- solar wings
  // Identical wing line to com-relay-01 (common part; the commonality account
  // in s06 leans on this): SADA drum, truss yoke, 3×(4.0×1.5) panels, ±15 m.
  const wings = [];
  function buildWing(sign) {
    const w = new THREE.Group();
    w.position.set(sign * HX, 0, 0);
    root.add(w);
    const sada = cyl(0.16, 0.16, 0.34, C.steel, sign * 0.12, 0, 0, 16, w);
    sada.rotation.z = Math.PI / 2;
    const yokeIn = sign * 0.28, yokeOut = sign * 1.95;
    for (const sz of [-0.55, 0.55]) {
      const mx = (yokeIn + yokeOut) / 2;
      const arm = cyl(0.08, 0.08, Math.abs(yokeOut - yokeIn), C.truss, mx, 0, sz, 10, w);
      arm.rotation.z = Math.PI / 2;
    }
    box(0.15, 0.15, 1.2, C.truss, (yokeIn + yokeOut) / 2, 0, 0, w);
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

  // ------------------------------------------------------------- user dish (3 m)
  // ONE Ø3 m Ka/X reflector on a two-axis gimbal staring down +Z: unlike the
  // areo birds' fixed nadir stare, a polar bird's users slide past below, so
  // the dish is steerable and the gimbal sways in the oscillator channel.
  const userGimbal = new THREE.Group();
  userGimbal.position.set(0, 0, HZ + 0.5);
  root.add(userGimbal);
  cyl(0.12, 0.12, 0.55, C.steel, 0, 0, HZ + 0.25, 12, root).rotation.x = Math.PI / 2;
  box(0.55, 0.18, 0.18, C.dark, 0, 0, -0.02, userGimbal);   // gimbal yoke
  const userDish = makeDish(1.5, 1.2, C.reflector);
  userDish.position.set(0, 0, 0.1);
  userDish.rotation.x = Math.PI / 2;            // open toward +Z (nadir)
  userGimbal.add(userDish);

  // -------------------------------------------------- crosslink dish (2.5 m)
  // Gold-mesh 2.5 m on a mast off the +Y face: backhaul to the areostationary
  // ring (same part as the relay's Earth dish — the commonality poster child).
  // Nominal boresight +Y (equator-ward); two-axis sway tracks the moving peer.
  const xlinkGimbal = new THREE.Group();
  xlinkGimbal.position.set(0, HY + 0.55, -0.3);
  root.add(xlinkGimbal);
  const xmast = cyl(0.1, 0.1, 0.5, C.steel, 0, HY + 0.2, -0.3, 12, root);
  xmast.rotation.z = 0;                          // native Y axis — already vertical
  box(0.18, 0.18, 0.55, C.dark, 0, 0, 0.02, xlinkGimbal);
  const xdish = makeDish(1.25, 1.0, C.goldMesh);
  xdish.position.set(0, 0.12, 0);               // open toward +Y
  xlinkGimbal.add(xdish);

  // ----------------------------------------------------- UHF proximity helices
  // Two quadrifilar-helix UHF antennas on the +Z deck: the polar surface users
  // are small science stations and ice-prospecting rovers with palm-size
  // radios; they talk UHF up, and this bird trunks it on Ka. Coarse helix:
  // a tapered tube + 3 canted rib hoops (readable at orbit-view scale).
  for (const sx of [-0.55, 0.55]) {
    const h = new THREE.Group();
    h.position.set(sx, -0.55, HZ + 0.1);
    root.add(h);
    cyl(0.16, 0.1, 0.8, C.dark, 0, 0, 0.4, 10, h).rotation.x = Math.PI / 2;
    for (let k = 0; k < 3; k++) {
      const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.17 - k * 0.025, 0.02, 6, 14), C.trim);
      hoop.position.z = 0.2 + k * 0.25;
      hoop.rotation.x = 0.35;
      h.add(hoop);
    }
  }

  // ---------------------------------------------------------------- radiators
  // Main OSR on -Y (crosslink mast owns +Y); a half panel squeezes beside it.
  box(1.5, 0.03, 1.3, C.osr, 0, -(HY + 0.02), -0.3);
  box(1.6, 0.06, 0.03, C.rib, 0, -(HY + 0.02), 0.38);
  box(0.7, 0.03, 1.0, C.osr, 0.5, HY + 0.02, -0.45);

  // ---------------------------------------------------------------- attitude
  const trk = [[-0.35, 0.35], [0.35, 0.3], [0.05, -0.4]];
  trk.forEach(([tx, ty], i) => {
    const b = box(0.18, 0.18, 0.24, C.dark, tx, ty, -HZ - 0.12, root);
    b.rotation.set(0.3 * (i - 1), 0.4 * (i - 1), 0);
    const baffle = cyl(0.09, 0.11, 0.08, C.steel, 0, 0, -0.14, 12, b);
    baffle.rotation.x = Math.PI / 2;
  });
  (function wheels() {
    box(0.55, 0.55, 0.1, C.dark, 0.42, -0.42, -HZ - 0.05);
    for (const [dx, dy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const drum = cyl(0.15, 0.15, 0.13, C.steel,
        0.42 + dx * 0.16, -0.42 + dy * 0.16, -HZ - 0.16, 14);
      drum.rotation.x = Math.PI / 2;
    }
  })();
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    const px = sx * HX, py = sy * HY, pz = -HZ + 0.1;
    box(0.2, 0.2, 0.2, C.dark, px, py, pz);
    for (const [ox, oy] of [[0.06, 0.06], [-0.06, -0.06]]) {
      const n = cyl(0.08, 0.11, 0.16, C.steel, px + ox, py + oy, pz - 0.14, 10);
      n.rotation.x = Math.PI / 2;
    }
  }

  // ------------------------------------------- space-weather hosted package
  // (integrator request, s07): boom-mounted fluxgate MAG + energetic-particle
  // spectrometer, MAVEN-heritage slim. The 1.8 m boom leans up-and-out in the
  // Y-Z plane, clear of the crosslink dish sweep; sensor head is the small
  // gold cube at the tip (kept far from wing/TWTA current loops).
  (function swx() {
    const ang = 0.7;                               // boom elevation from +Y
    const boomLen = 1.8;
    const base = new THREE.Vector3(-0.55, HY - 0.35, HZ - 0.2);
    const boom = cyl(0.075, 0.075, boomLen, C.steel,
      base.x, base.y + Math.cos(ang)*boomLen/2, base.z + Math.sin(ang)*boomLen/2, 10);
    boom.rotation.x = ang;
    box(0.18, 0.18, 0.18, C.rib, base.x, base.y, base.z);       // hinge root
    const tip = new THREE.Vector3(base.x,
      base.y + Math.cos(ang)*boomLen, base.z + Math.sin(ang)*boomLen);
    box(0.22, 0.22, 0.22, C.horn, tip.x, tip.y, tip.z);         // MAG sensor head
    // EPS: twin-telescope box on the -Z (zenith) deck, apertures to open sky
    box(0.3, 0.28, 0.24, C.dark, -0.55, -0.2, -HZ - 0.13);
    for (const [oy, tilt] of [[-0.08, 0.35], [0.08, -0.35]]) {
      const ap = cyl(0.07, 0.09, 0.16, C.steel, -0.55, -0.2 + oy, -HZ - 0.3, 10);
      ap.rotation.x = Math.PI / 2 + tilt;
    }
  })();

  // ---------------------------------------------------------------- beacon
  const beacon = box(0.15, 0.15, 0.15, glowRed, HX + 0.09, HY + 0.09, HZ - 0.2);
  beacon.name = 'blink_beacon';

  // ---------------------------------------------------------------- POI anchors
  poi('bus', 0, 0, 0);                          // configuration adjudication card
  poi('ka', 0, 0, HZ + 1.8);                    // user link + coverage account
  poi('xlink', 0, HY + 1.3, -0.3);              // crosslink / handover account
  poi('uhf', 0, -0.55, HZ + 1.0);               // polar surface user segment
  poi('skeep', HX, -HY, -HZ + 0.1);             // orbit maintenance
  poi('swx', -0.55, HY + 0.9, HZ + 0.9);        // space-weather hosted package
  poi('solar', 7.0, 0, 0);                      // platform commonality / power

  // ---------------------------------------------------------------- engine hooks
  root.userData.nightMats = nightMats;
  root.userData.lights = [
    { color: 0xff3020, pos: [HX + 0.09, HY + 0.09, HZ - 0.2], range: 8 },
  ];
  // wings sun-track on the SADA (same rates as the relay bus — common drive);
  // user dish noses after sliding polar users; crosslink dish tracks its
  // areo-ring peer on both axes.
  root.userData.spinners = wings.map((w) =>
    ({ node: w, axis: 'x', rpm: 0.191 }));
  root.userData.oscillators = [
    { node: userGimbal, axis: 'x', amp: 0.22, period: 89.4 },
    { node: userGimbal, axis: 'y', amp: 0.16, period: 61.1 },
    { node: xlinkGimbal, axis: 'x', amp: 0.25, period: 118.2 },
    { node: xlinkGimbal, axis: 'z', amp: 0.18, period: 76.3 },
  ];

  return root;
}
