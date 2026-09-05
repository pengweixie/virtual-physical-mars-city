// Sun-Mars L4 conjunction-relay satellite — code asset per MODELS.md §4.
// The city's only link to Earth during solar conjunction: parked in a tadpole
// libration about Sun-Mars L4 (1.38-1.67 AU from Mars, 60° ahead), it turns
// the ~14-day total blackout every 780 d into ZERO days of total blackout
// (s03: the two relay hops never black out together with the direct link).
// It does not save latency — the relay path is ~33 light-minutes vs 22 direct;
// what it saves is the existence of a link. Same relay platform as
// com-relay-01 (65.7% common, s06) plus a deep-space kit: 3 m dual-band HGA
// (Earth), the common 2.5 m gold-mesh dish (Mars), an SEP transfer module
// with its xenon tanks shown in an open truss bay, and a small coronagraph —
// during conjunction the Sun stands between Mars and Earth, and this is the
// only camera watching it from the side.
//
// ORBITAL ASSET — NOT surface-placed; not on any planet-centric orbit either.
// The viewer draws it as a scale-broken inset per HANDOFF_COMGAP (manifest
// entry carries kind:"orbital", pos:null so loadUnits skips it).
//
// 1 unit = 1 m. Origin = bus centroid. Frame:
//   -Z → Earth (HGA boresight)      +Z → Mars (2.5 m gold-mesh dish)
//   ±X → solar-wing / SADA axis     -Y → SEP bay; +Y → coronagraph deck
// Coarse-silhouette build; thin sections ≥0.15 m.

export const meta = {
  id: 'com-l4-01',
  name: '日火 L4 合日中继星',
  name_en: 'Sun-Mars L4 Conjunction Relay',
  size_m: 30,               // solar-wing tip-to-tip span; self-check only
  size_axis: 'width',
  kind: 'orbital',
};

export function build(THREE) {
  const root = new THREE.Group();
  root.name = 'com-l4-01';
  const nightMats = [];

  // ---------------------------------------------------------------- palette
  const L = (color, opts = {}) => new THREE.MeshLambertMaterial({ color, ...opts });
  const S = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, ...opts });
  const C = {
    mliGold: L(0xb9902f),
    mliSilver: L(0xb7bcc4),
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
    tank: S(0xc8ccd2, { metalness: 0.55, roughness: 0.4 }),  // xenon tanks
  };
  const glowRed = L(0x2a0606, { emissive: 0xff2a1e, emissiveIntensity: 0.0 });
  const glowIon = L(0x0a1a2a, { emissive: 0x4fa8ff, emissiveIntensity: 0.0 });
  nightMats.push(glowRed, glowIon);              // Hall thrusters glow at night

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
    cyl(0.08, 0.13, 0.24, C.horn, 0, f - 0.12, 0, 12, g);
    cyl(0.13, 0.13, 0.06, C.horn, 0, f + 0.03, 0, 16, g);
    for (let k = 0; k < 3; k++) {
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
  // The common 1.8×1.8×2.6 relay bus, gold-clad (common structure line).
  const HX = 0.9, HY = 0.9, HZ = 1.3;
  (function bus() {
    const body = new THREE.Mesh(new THREE.BoxGeometry(2 * HX, 2 * HY, 2 * HZ),
      [C.mliGold, C.mliGold, C.mliSilver, C.mliSilver, C.mliGold, C.mliGold]);
    root.add(body);
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      box(0.15, 0.15, 2 * HZ + 0.02, C.rib, sx * HX, sy * HY, 0);
    }
    box(2 * HX + 0.04, 0.15, 0.15, C.rib, 0, HY, 0);
    box(2 * HX + 0.04, 0.15, 0.15, C.rib, 0, -HY, 0);
  })();

  // ---------------------------------------------------------------- solar wings
  // Same wing line as com-relay-01: SEP transit at 1.52 AU sizes them (s06) —
  // and the answer lands on the SAME 36 m² wing. Commonality by physics.
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

  // --------------------------------------------------------- HGA 3 m (Earth)
  // Rigid CFRP dual-band X/Ka dish on -Z with a two-axis gimbal: the whole
  // mission in one aperture. Earth never strays far (37° elongation at Mars
  // conjunction), so the gimbal sways gently.
  const hgaGimbal = new THREE.Group();
  hgaGimbal.position.set(0, 0, -HZ - 0.45);
  root.add(hgaGimbal);
  cyl(0.12, 0.12, 0.6, C.steel, 0, 0, -HZ - 0.15, 12, root).rotation.x = Math.PI / 2;
  box(0.6, 0.18, 0.18, C.dark, 0, 0, 0.05, hgaGimbal);
  const hga = makeDish(1.5, 1.2, C.reflector);
  hga.position.set(0, 0, -0.15);
  hga.rotation.x = -Math.PI / 2;                // open toward -Z (Earth)
  hgaGimbal.add(hga);

  // ------------------------------------------------------ Mars dish (2.5 m)
  // The relay's gold-mesh part, repointed: from L4 it stares back at Mars
  // (the 12 m city station is the far end of the 1.5 AU Ka hop).
  const marsGimbal = new THREE.Group();
  marsGimbal.position.set(0, 0, HZ + 0.4);
  root.add(marsGimbal);
  cyl(0.1, 0.1, 0.5, C.steel, 0, 0, HZ + 0.15, 12, root).rotation.x = Math.PI / 2;
  box(0.5, 0.16, 0.16, C.dark, 0, 0, -0.03, marsGimbal);
  const mdish = makeDish(1.25, 1.0, C.goldMesh);
  mdish.position.set(0, 0, 0.12);
  mdish.rotation.x = Math.PI / 2;               // open toward +Z (Mars)
  marsGimbal.add(mdish);

  // ------------------------------------------------------------- SEP module
  // Open truss bay under the -Y face: two spherical xenon tanks visible in
  // the frame (open-container principle — the 461 kg that buys the 60° of
  // heliocentric phasing), and two gimbaled Hall thrusters aft (-Y), their
  // channels glowing ion-blue at night.
  (function sep() {
    const bayY = -(HY + 0.55);
    // truss cage: 4 corner rails + rings. Rails stop AT the bus face — a first
    // version ran them 0.55 m into the bus (hidden geometry; review catch).
    for (const sx of [-0.55, 0.55]) for (const sz of [-0.55, 0.55]) {
      const rail = cyl(0.06, 0.06, 0.56, C.truss, sx, bayY + 0.275, sz, 8);
      rail.rotation.x = 0;                       // native Y — vertical rails
    }
    for (const yy of [bayY + 0.1, bayY + 0.52]) {
      box(1.25, 0.1, 0.1, C.truss, 0, yy, -0.55);
      box(1.25, 0.1, 0.1, C.truss, 0, yy, 0.55);
      box(0.1, 0.1, 1.2, C.truss, -0.55, yy, 0);
      box(0.1, 0.1, 1.2, C.truss, 0.55, yy, 0);
    }
    // xenon tanks — the visible propellant account
    for (const sz of [-0.32, 0.32]) {
      const t = new THREE.Mesh(new THREE.SphereGeometry(0.34, 18, 12), C.tank);
      t.position.set(0, bayY + 0.5, sz);
      root.add(t);
      const strap = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.035, 6, 20), C.rib);
      strap.position.copy(t.position);
      strap.rotation.x = Math.PI / 2;
      root.add(strap);
    }
    // two Hall thrusters on gimbal pods, thrusting -Y
    for (const sx of [-0.4, 0.4]) {
      box(0.26, 0.2, 0.26, C.dark, sx, bayY - 0.08, 0);
      const th = cyl(0.16, 0.2, 0.22, C.steel, sx, bayY - 0.28, 0, 14);
      const ring = cyl(0.13, 0.13, 0.05, glowIon, sx, bayY - 0.4, 0, 14);
      th.name = 'sep_thruster'; ring.name = 'sep_channel';
    }
    // PPU box on the bus face
    box(0.6, 0.25, 0.5, C.mliSilver, 0, -(HY + 0.13), -0.75);
  })();

  // ---------------------------------------------------------- coronagraph
  // Small solar monitor on the +Y deck: baffled tube + occulter disk on a
  // spider — from 60° aside it watches CMEs crossing the Sun-Mars gap edge-on
  // while every telescope on two planets is blinded by geometry.
  (function corona() {
    const base = box(0.5, 0.2, 0.5, C.mliSilver, 0.35, HY + 0.1, -0.6);
    const tube = cyl(0.14, 0.14, 0.7, C.dark, 0.35, HY + 0.55, -0.6, 14);
    const hood = cyl(0.17, 0.14, 0.12, C.steel, 0.35, HY + 0.95, -0.6, 14);
    const spider = cyl(0.02, 0.02, 0.3, C.steel, 0.35, HY + 1.12, -0.6, 6);
    const occ = cyl(0.07, 0.07, 0.03, C.dark, 0.35, HY + 1.28, -0.6, 12);
    void base; void tube; void hood; void spider; void occ;
  })();

  // ---------------------------------------------------------------- radiators
  // TWTA heat: OSR panel low on the -Y face beside the SEP bay, plus the
  // standard +Y strip behind the coronagraph deck.
  box(1.5, 0.03, 0.9, C.osr, 0, -(HY + 0.02), 0.7);
  box(1.2, 0.03, 0.9, C.osr, -0.4, HY + 0.02, 0.55);
  box(1.3, 0.06, 0.03, C.rib, 0, -(HY + 0.02), 1.17);

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
  // chemical RCS pods (fine SK trims) on the +Z corners, clear of the SEP bay
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    const px = sx * HX, py = sy * HY, pz = HZ - 0.15;
    box(0.2, 0.2, 0.2, C.dark, px, py, pz);
    for (const [ox, oy] of [[0.06, 0.06], [-0.06, -0.06]]) {
      const n = cyl(0.08, 0.11, 0.16, C.steel, px + ox, py + oy, pz + 0.14, 10);
      n.rotation.x = Math.PI / 2;
    }
  }

  // ---------------------------------------------------------------- beacon
  const beacon = box(0.15, 0.15, 0.15, glowRed, HX + 0.09, HY + 0.09, -HZ + 0.2);
  beacon.name = 'blink_beacon';

  // ---------------------------------------------------------------- POI anchors
  poi('bus', 0, 0, 0);                          // L4-vs-L5 adjudication card
  poi('hga', 0, 0, -HZ - 2.0);                  // blackout-compression + Earth leg
  poi('mars', 0, 0, HZ + 1.7);                  // Mars leg + latency honesty card
  poi('sep', 0, -(HY + 0.6), 0);                // transfer + tadpole stationkeeping
  poi('sun', 0.35, HY + 1.0, -0.6);             // coronagraph / conjunction watch
  poi('solar', 7.0, 0, 0);                      // platform commonality / power

  // ---------------------------------------------------------------- engine hooks
  root.userData.nightMats = nightMats;
  root.userData.lights = [
    { color: 0xff3020, pos: [HX + 0.09, HY + 0.09, -HZ + 0.2], range: 8 },
  ];
  root.userData.spinners = wings.map((w) =>
    ({ node: w, axis: 'x', rpm: 0.191 }));
  root.userData.oscillators = [
    { node: hgaGimbal, axis: 'x', amp: 0.1, period: 127.9 },
    { node: hgaGimbal, axis: 'y', amp: 0.14, period: 96.7 },
    { node: marsGimbal, axis: 'x', amp: -0.12, period: 83.6 },
  ];

  return root;
}
