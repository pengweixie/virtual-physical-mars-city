// viewer/units/sci-uv-01.js — 紫外监测站（AlGaN 日盲三通道辐射计）
// UV monitoring station: three-channel filter radiometer (UV-A 365 / UV-B 310 /
// UV-C 270 nm) on AlGaN photodiodes (solar-blind Al0.45GaN for UV-C), diffuser
// sphere, data kiosk, EVA UV-advisory lamp stack.
// Design ledger: mars-uv (R1 composition-cutoff / R2-R3 Sentaurus TCAD
// spectral response, dark current, CV / R4 Mars UV Monte-Carlo dose account).
// Colour causality chain: channel ring colours on the tubes = screen spectrum
// bars = cutaway filter disc (UV-C violet / UV-B blue / UV-A amber).
// Contract: MODELS.md §4 — 1 unit = 1 m, THREE injected, no textures.

export const meta = {
  id: 'sci-uv-01',
  name: '紫外监测站',
  name_en: 'UV Monitoring Station',
  size_m: 6.37,              // measured bbox max edge (validate 复核)
  effects: ['glow_windows', 'blink'],
};

export function build(THREE) {
  const group = new THREE.Group();

  let _seed = 20260807;
  const rnd = () => { _seed = (_seed * 16807) % 2147483647; return _seed / 2147483647; };

  // ---------------------------------------------------------------- materials
  const M = {
    white:  new THREE.MeshLambertMaterial({ color: 0xd8d2c8 }),
    shell:  new THREE.MeshLambertMaterial({ color: 0xbfb6a8 }),
    grey:   new THREE.MeshLambertMaterial({ color: 0x8a8578 }),
    dark:   new THREE.MeshLambertMaterial({ color: 0x3a3f46 }),
    steel:  new THREE.MeshLambertMaterial({ color: 0x6e7681 }),
    orange: new THREE.MeshLambertMaterial({ color: 0xd97b29 }),
    pv:     new THREE.MeshLambertMaterial({ color: 0x1c2c4e }),
    copper: new THREE.MeshLambertMaterial({ color: 0xa5673f }),
    ptfe:   new THREE.MeshLambertMaterial({ color: 0xf2efe9, emissive: 0x8a8578, emissiveIntensity: 0.18 }),
    quartz: new THREE.MeshLambertMaterial({ color: 0xbfe4f2, emissive: 0x9fd8ff, emissiveIntensity: 0.25, transparent: true, opacity: 0.85 }),
  };
  // channel colour code (tube rings = screen bars = cutaway filter)
  const CH = {
    uvc: 0x8a5fd8,   // violet  — solar-blind Al0.45GaN, 255–285 nm
    uvb: 0x3f8fd8,   // blue    — Al0.30GaN, 300–320 nm
    uva: 0xd88f3f,   // amber   — GaN, 350–380 nm
  };
  const chMat = (c, e) => new THREE.MeshLambertMaterial({
    color: c, emissive: c, emissiveIntensity: e === undefined ? 0.35 : e });

  const box = (w, h, d, mat, x, y, z, parent) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    (parent || group).add(m);
    return m;
  };
  const cyl = (rt, rb, h, seg, mat, x, y, z, parent) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
    m.position.set(x, y, z);
    (parent || group).add(m);
    return m;
  };
  const _ba = new THREE.Vector3(), _bb = new THREE.Vector3();
  const beam = (ax, ay, az, bx, by, bz, w, mat, parent) => {
    _ba.set(ax, ay, az); _bb.set(bx, by, bz);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, w, _ba.distanceTo(_bb) + w * 0.6), mat);
    m.position.copy(_ba).lerp(_bb, 0.5);
    m.lookAt(_bb);
    (parent || group).add(m);
    return m;
  };
  const poi = (name, x, y, z) => {
    const a = new THREE.Object3D();
    a.name = name; a.position.set(x, y, z); group.add(a);
  };

  const nightMats = [], blinkMats = [];

  // ---------------------------------------------------------------- base slab
  box(5.2, 0.36, 4.2, M.grey, 0, 0.18, 0);                // pad
  box(5.6, 0.1, 4.6, M.shell, 0, 0.05, 0);                // skirt
  const TOP = 0.36;

  // ================================================================ 1. probe tower (three baffle tubes, zenith-pointing)
  const TX = -1.45, TZ = -1.05, TH = 2.1;
  const legs = [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]];
  for (const [lx, lz] of legs)
    beam(TX + lx, TOP, TZ + lz, TX + lx * 0.5, TOP + TH, TZ + lz * 0.5, 0.06, M.steel);
  for (let k = 1; k <= 2; k++) {
    const y = TOP + k * TH / 3, s = 0.3 - 0.15 * (k * TH / 3) / TH;
    beam(TX - s, y, TZ - s, TX + s, y, TZ - s, 0.045, M.steel);
    beam(TX - s, y, TZ + s, TX + s, y, TZ + s, 0.045, M.steel);
    beam(TX - s, y, TZ - s, TX - s, y, TZ + s, 0.045, M.steel);
    beam(TX + s, y, TZ - s, TX + s, y, TZ + s, 0.045, M.steel);
    beam(TX - s, y, TZ - s, TX + s, y + TH / 3 * 0.85, TZ - s, 0.035, M.steel);
  }
  const PY = TOP + TH;
  box(1.5, 0.09, 1.0, M.shell, TX, PY, TZ);               // head platform
  // three baffle tubes, slight outward elevation tilt (~8 deg), channel-coded
  const tubes = [
    { c: CH.uvc, dx: -0.45, tilt: -0.14 },
    { c: CH.uvb, dx: 0.0,   tilt: 0.0   },
    { c: CH.uva, dx: 0.45,  tilt: 0.14 },
  ];
  for (const tb of tubes) {
    const piv = new THREE.Group();
    piv.position.set(TX + tb.dx, PY + 0.05, TZ);
    piv.rotation.z = tb.tilt;
    group.add(piv);
    cyl(0.11, 0.11, 0.72, 14, M.white, 0, 0.4, 0, piv);   // baffle tube
    cyl(0.115, 0.115, 0.06, 14, chMat(tb.c), 0, 0.62, 0, piv);  // channel ring
    cyl(0.115, 0.115, 0.04, 14, chMat(tb.c), 0, 0.22, 0, piv);  // lower ring
    cyl(0.13, 0.13, 0.045, 14, M.steel, 0, 0.78, 0, piv); // dust lip / rim shield
    cyl(0.085, 0.085, 0.02, 14, M.quartz, 0, 0.775, 0, piv);    // quartz window
    cyl(0.05, 0.05, 0.3, 10, M.dark, 0, -0.02, 0, piv);   // stem / cable neck
  }
  box(0.5, 0.22, 0.34, M.dark, TX, PY + 0.2, TZ + 0.32);  // preamp junction box
  poi('poi_tower', TX, PY + 0.75, TZ);

  // ================================================================ 2. diffuser sphere (global cosine collector)
  const SX = 1.55, SZ = -1.15;
  cyl(0.07, 0.09, 1.5, 10, M.steel, SX, TOP + 0.75, SZ);  // pillar
  cyl(0.24, 0.24, 0.07, 14, M.shell, SX, TOP + 1.53, SZ); // head plate
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.17, 14, 9, 0, Math.PI * 2, 0, Math.PI / 2), M.ptfe);
  dome.position.set(SX, TOP + 1.565, SZ); group.add(dome);
  cyl(0.3, 0.3, 0.02, 16, M.white, SX, TOP + 1.5, SZ);    // shadow/horizon ring
  // service hatch open on pillar: fiber trio to the three channels (colour chain)
  box(0.16, 0.4, 0.1, M.dark, SX, TOP + 0.9, SZ + 0.06);
  let fi = 0;
  for (const c of [CH.uvc, CH.uvb, CH.uva])
    box(0.03, 0.34, 0.03, chMat(c, 0.5), SX - 0.04 + 0.04 * fi++, TOP + 0.9, SZ + 0.1);
  poi('poi_sphere', SX, TOP + 1.7, SZ);

  // ================================================================ 3. data kiosk + spectrum screen
  const KX = -1.5, KZ = 1.05;
  box(1.9, 1.7, 1.2, M.white, KX, TOP + 0.85, KZ);
  box(2.05, 0.12, 1.35, M.shell, KX, TOP + 1.76, KZ);     // roof strip
  box(2.05, 0.14, 1.35, M.grey, KX, TOP + 0.07, KZ);      // skirt
  // sealed door (frame + leaf + latch + hinges)
  box(0.7, 1.3, 0.06, M.orange, KX - 0.5, TOP + 0.72, KZ + 0.62);
  box(0.58, 1.18, 0.08, M.shell, KX - 0.5, TOP + 0.72, KZ + 0.60);
  box(0.08, 0.16, 0.06, M.dark, KX - 0.28, TOP + 0.72, KZ + 0.66);
  box(0.1, 0.08, 0.05, M.dark, KX - 0.76, TOP + 1.12, KZ + 0.65);
  box(0.1, 0.08, 0.05, M.dark, KX - 0.76, TOP + 0.36, KZ + 0.65);
  // spectrum screen: dark bezel + three channel bars (animate scales them) + UVI ladder
  const bgMat = new THREE.MeshLambertMaterial({ color: 0x10141c, emissive: 0x1a2436, emissiveIntensity: 0.9 });
  nightMats.push(bgMat);
  box(0.95, 1.0, 0.07, M.dark, KX + 0.45, TOP + 1.05, KZ + 0.62);
  box(0.85, 0.9, 0.05, bgMat, KX + 0.45, TOP + 1.05, KZ + 0.64);
  const barMats = {}, bars = {};
  const barDef = [['uvc', CH.uvc, -0.25], ['uvb', CH.uvb, 0.0], ['uva', CH.uva, 0.25]];
  for (const [k, c, dx] of barDef) {
    barMats[k] = chMat(c, 0.85);
    const b = box(0.16, 1.0, 0.03, barMats[k], KX + 0.32 + dx, TOP + 0.66, KZ + 0.67);
    b.geometry.translate(0, 0.5, 0);          // scale-from-bottom
    bars[k] = b;
  }
  // UVI ladder: 8 segment lamps up the right edge (lit count = UV index tier)
  const segMats = [];
  for (let i = 0; i < 8; i++) {
    const m = new THREE.MeshLambertMaterial({
      color: 0x2a2f38, emissive: i < 5 ? 0xd8b23f : 0xd84a3f, emissiveIntensity: 0.06 });
    segMats.push(m);
    box(0.09, 0.075, 0.03, m, KX + 0.78, TOP + 0.68 + i * 0.105, KZ + 0.67);
  }
  // cable tray runs: kiosk -> tower / sphere / solar
  box(0.16, 0.05, 1.6, M.dark, KX + 0.1, TOP + 0.03, KZ - 1.05);
  box(2.6, 0.05, 0.16, M.dark, KX + 1.4, TOP + 0.03, KZ - 1.9);
  poi('poi_kiosk', KX, TOP + 1.2, KZ);

  // ================================================================ 4. EVA UV-advisory lamp stack + beacon mast
  const AX = 2.05, AZ = 0.95;
  cyl(0.05, 0.07, 2.6, 10, M.steel, AX, TOP + 1.3, AZ);
  box(0.26, 0.1, 0.26, M.orange, AX, TOP + 0.06, AZ);     // base band
  // advisory lamp stack green/amber/red — animate OWNS these (state machine),
  // deliberately NOT in blinkMats (double-drive gotcha #20/21)
  const gMat = new THREE.MeshLambertMaterial({ color: 0x1e3a24, emissive: 0x2bd96a, emissiveIntensity: 0.1 });
  const yMat = new THREE.MeshLambertMaterial({ color: 0x4a3a16, emissive: 0xd8b23f, emissiveIntensity: 0.1 });
  const rMat = new THREE.MeshLambertMaterial({ color: 0x441d18, emissive: 0xd84a3f, emissiveIntensity: 0.1 });
  cyl(0.09, 0.09, 0.16, 10, gMat, AX, TOP + 2.06, AZ);
  cyl(0.09, 0.09, 0.16, 10, yMat, AX, TOP + 2.24, AZ);
  cyl(0.09, 0.09, 0.16, 10, rMat, AX, TOP + 2.42, AZ);
  cyl(0.1, 0.1, 0.03, 10, M.dark, AX, TOP + 2.55, AZ);
  // sign panel: UV advisory board (colour-banded, no text)
  box(0.5, 0.36, 0.04, M.white, AX, TOP + 1.55, AZ + 0.03);
  box(0.42, 0.08, 0.045, chMat(CH.uvc, 0.3), AX, TOP + 1.64, AZ + 0.05);
  box(0.42, 0.08, 0.045, yMat, AX, TOP + 1.53, AZ + 0.05);
  box(0.42, 0.08, 0.045, rMat, AX, TOP + 1.42, AZ + 0.05);
  // mast-top obstruction beacon -> engine blink rhythm (contract vocabulary)
  const bkMat = new THREE.MeshLambertMaterial({ color: 0x5c1f18, emissive: 0xff5040, emissiveIntensity: 0.9 });
  blinkMats.push(bkMat);
  cyl(0.045, 0.045, 0.09, 8, bkMat, AX, TOP + 2.64, AZ);
  // UHF whip toward relay
  beam(AX, TOP + 2.6, AZ, AX + 0.35, TOP + 3.0, AZ - 0.15, 0.02, M.steel);
  poi('poi_beacon', AX, TOP + 2.3, AZ);

  // ================================================================ 5. cutaway spare tube (service rack) — the device, not a black box
  const CX = 0.55, CZ = 1.45;
  box(1.3, 0.08, 0.5, M.shell, CX, TOP + 0.62, CZ);       // rack table
  for (const dx of [-0.55, 0.55]) beam(CX + dx, TOP, CZ, CX + dx, TOP + 0.6, CZ, 0.05, M.steel);
  // half-shell tube lying horizontally, open side facing +Z (observer)
  const half = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.14, 1.05, 12, 1, true, 0, Math.PI),
    new THREE.MeshLambertMaterial({ color: 0xd8d2c8, side: THREE.DoubleSide, emissive: 0x554f46, emissiveIntensity: 0.22 }));
  half.rotation.z = Math.PI / 2;              // axis along x
  half.rotation.y = Math.PI;                  // opening toward +Z
  half.position.set(CX, TOP + 0.82, CZ);
  group.add(half);
  // interior chain along the optical axis (+x = entrance):
  const disc = (r, th, mat, dx) => {
    const d = cyl(r, r, th, 12, mat, CX + dx, TOP + 0.82, CZ);
    d.rotation.z = Math.PI / 2;
    return d;
  };
  disc(0.1, 0.025, M.quartz, 0.46);                       // quartz window
  for (let i = 0; i < 3; i++)                             // stray-light baffle vanes
    disc(0.105, 0.02, M.dark, 0.28 - i * 0.14);
  disc(0.095, 0.045, chMat(CH.uvc, 0.5), -0.16);          // interference filter (UV-C violet)
  disc(0.06, 0.08, M.steel, -0.30);                       // TO-46 header
  box(0.035, 0.035, 0.012, chMat(CH.uvc, 0.9), CX - 0.27, TOP + 0.82, CZ + 0.03); // AlGaN chip
  box(0.14, 0.06, 0.2, M.copper, CX - 0.44, TOP + 0.80, CZ); // TIA board
  poi('poi_cutaway', CX, TOP + 1.0, CZ);

  // ---- epi-stack display block: the AlGaN device itself, layer by layer ----
  // 15x scale cutaway of the 1.15 um epi stack (top = light entrance).
  // Layer colours are the ledger: AlN buffer / n-Al0.60 window (violet-blue,
  // cutoff 255) / i-Al0.45 absorber (violet, cutoff 279) / p-GaN cap (amber).
  const EX = CX + 0.86, EZ = CZ + 0.02;
  const epi = [
    [0.20, 0xe6e2d8],   // AlN buffer
    [0.50, 0x6f7fd0],   // n-Al0.60GaN window
    [0.30, CH.uvc],     // i-Al0.45GaN absorber (the solar-blind layer)
    [0.10, 0xa07fd8],   // p-Al0.45GaN
    [0.05, CH.uva],     // p-GaN cap
  ];
  let ey = TOP + 0.70;
  for (const [th, c] of epi) {
    const t = th * 0.42;                       // 1 um -> 0.42 m display scale
    const m = new THREE.MeshLambertMaterial({ color: c, emissive: c, emissiveIntensity: 0.22 });
    box(0.42, t, 0.34, m, EX, ey + t / 2, EZ);
    box(0.44, 0.005, 0.36, M.dark, EX, ey, EZ);   // layer parting line
    ey += t;
  }
  box(0.5, 0.06, 0.42, M.steel, EX, TOP + 0.67, EZ);        // sapphire carrier plate
  for (const dz of [-0.14, 0, 0.14])                        // support posts under the plate
    beam(EX, TOP, EZ + dz, EX, TOP + 0.64, EZ + dz, 0.05, M.steel);
  box(0.08, 0.04, 0.08, M.copper, EX + 0.2, ey - 0.01, EZ); // anode dot on the cap
  poi('poi_epi', EX, ey + 0.16, EZ);

  // ================================================================ 6. solar panel + battery
  const PX = 1.7, PZ = -0.1;
  const pv = new THREE.Group();
  pv.position.set(PX, TOP + 0.62, PZ);
  pv.rotation.x = -0.42;
  group.add(pv);
  box(1.5, 0.06, 1.05, M.pv, 0, 0.28, 0, pv);
  for (let i = 0; i < 3; i++) box(0.015, 0.065, 1.02, M.steel, -0.45 + i * 0.45, 0.29, 0, pv);
  beam(PX - 0.55, TOP, PZ - 0.35, PX - 0.55, TOP + 0.62, PZ + 0.2, 0.05, M.steel);
  beam(PX + 0.55, TOP, PZ - 0.35, PX + 0.55, TOP + 0.62, PZ + 0.2, 0.05, M.steel);
  box(0.6, 0.45, 0.45, M.grey, PX, TOP + 0.23, PZ - 0.65);   // battery/PCDU box
  box(0.08, 0.1, 0.06, chMat(0x2bd96a, 0.6), PX + 0.2, TOP + 0.35, PZ - 0.42);
  poi('poi_solar', PX, TOP + 0.9, PZ);

  // ================================================================ 7. site dressing
  // calibration plaque (field PTFE reference) on a short post
  cyl(0.03, 0.04, 0.5, 8, M.steel, -0.15, TOP + 0.25, -1.7);
  box(0.3, 0.02, 0.3, M.ptfe, -0.15, TOP + 0.52, -1.7);
  // safety-orange handrail along the rear pad edge (posts + top rail)
  for (let i = 0; i < 5; i++)
    beam(-2.2 + i * 1.1, TOP, -1.95, -2.2 + i * 1.1, TOP + 0.85, -1.95, 0.05, M.orange);
  beam(-2.25, TOP + 0.83, -1.95, 2.25, TOP + 0.83, -1.95, 0.045, M.orange);
  beam(-2.25, TOP + 0.5, -1.95, 2.25, TOP + 0.5, -1.95, 0.035, M.orange);
  // wheel ruts + scattered rocks (used-site traces)
  box(0.45, 0.025, 3.4, M.dark, -2.9, 0.013, 0.3);
  box(0.45, 0.025, 3.4, M.dark, -2.0, 0.013, 0.3);
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);
  for (let i = 0; i < 12; i++) {
    const a = rnd() * 6.283, d = 3.1 + rnd() * 0.9, s = 0.05 + rnd() * 0.09;
    const rock = new THREE.Mesh(rockGeo,
      new THREE.MeshLambertMaterial({ color: rnd() < 0.5 ? 0x8a5a3b : 0x9e6a45 }));
    rock.position.set(Math.cos(a) * d, 1.62 * s - 0.3 * s, Math.sin(a) * d * 0.7);
    rock.scale.set(s, s * 0.7, s); rock.rotation.y = rnd() * 6.28;
    group.add(rock);
  }

  // ---------------------------------------------------------------- dust pass
  const dust = new THREE.Color(0x9e5b3d);
  [M.white, M.shell, M.grey, M.steel, M.orange, M.pv, M.ptfe].forEach((m) => m.color.lerp(dust, 0.05));

  // ================================================================ animation
  // 60 s supercycle, pure t (any-t entry, closed loop) — a compressed sol:
  //   [0,10)   morning ramp     bars rise, green lamp
  //   [10,22)  forenoon         E_act crosses amber 1.65 W/m2 (aged-visor 8h dose > 15 J/m2)
  //   [22,38)  noon peak        E_act > 3.3 W/m2 -> red SLOW-FLASH (2 s), UVI ladder full
  //   [38,48)  dust front       tau 0.5 -> 2.5, bars sink, lamp falls straight back to GREEN
  //                             (E_act 1.18 W/m2 at t=44) — a dust storm is a UV parasol,
  //                             the mirror image of the rad station's storm alarm
  //   [48,60)  evening          green, bars to night floor
  // Levels follow ledger R4: UVI 217 @ tau 0.5 noon; alarm thresholds 1.65/3.3 W/m2.
  const T = 60;
  const smooth = (a, b, u) => {
    const x = Math.min(1, Math.max(0, (u - a) / (b - a)));
    return x * x * (3 - 2 * x);
  };
  group.userData.animate = (t) => {
    const tt = ((t % T) + T) % T;
    // solar elevation envelope (0..1) and dust optical depth tau (0.5 -> 2.5)
    const sun = smooth(2, 22, tt) * (1 - smooth(38, 58, tt));
    const dustF = smooth(38, 44, tt) * (1 - smooth(52, 58, tt));   // dust front passing
    const tau = 0.5 + 2.0 * dustF;
    const T_dust = Math.exp(-tau * 0.53);        // MC-fit total transmission (R4)
    const Eact = 4.35 * sun * T_dust / 0.767;    // W/m2; noon tau0.5 = 4.35 (perihelion sol)
    // three channel bars (relative in-band irradiance, UVA/UVB/UVC of R4 tau table)
    const s = Eact / 3.35, sBar = Math.min(1, s);
    bars.uva.scale.y = Math.max(0.03, 0.88 * sBar);
    bars.uvb.scale.y = Math.max(0.03, 0.40 * sBar);
    bars.uvc.scale.y = Math.max(0.03, 0.175 * sBar);
    barMats.uva.emissiveIntensity = 0.25 + 0.7 * s;
    barMats.uvb.emissiveIntensity = 0.25 + 0.7 * s;
    barMats.uvc.emissiveIntensity = 0.25 + 0.7 * s;
    // UVI ladder (UVI = 217 * s roughly; 8 segments ~ 27 UVI each)
    const lit = Math.round(8 * Math.min(1, s * 1.02));
    for (let i = 0; i < 8; i++) segMats[i].emissiveIntensity = i < lit ? 0.9 : 0.06;
    // advisory lamps: green < 1.65, amber 1.65-3.3, red > 3.3 with 2 s slow flash
    const red = Eact >= 3.3, amb = Eact >= 1.65 && !red;
    const slow = (tt % 2) < 1.2 ? 1 : 0.15;      // 缓闪 slow flash
    gMat.emissiveIntensity = (!red && !amb) ? 1.6 : 0.08;
    yMat.emissiveIntensity = amb ? 1.8 : 0.08;
    rMat.emissiveIntensity = red ? 2.2 * slow : 0.08;
  };

  group.userData.nightMats = nightMats;
  group.userData.blinkMats = blinkMats;
  group.userData.lights = [{ color: 0xbfa8ff, pos: [KX + 0.45, TOP + 1.6, KZ + 1.0], range: 7 }];

  return group;
}
