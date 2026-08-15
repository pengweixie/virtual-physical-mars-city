// viewer/units/sci-rad-01.js — 地表辐射监测站（Timepix4 粒子相机）
// Surface radiation monitoring station: Timepix4 particle camera tower,
// live track-morphology screen, SEP alert tower, EVA dosimeter rack.
// Design ledger: E:\Claude\mars_rad (4 ledgers); device anchor: own Timepix4
// campaign (55 um pitch / 300 um Si / 150 V / 500 e threshold, ENC 52.7 e).
// Contract: MODELS.md §4 — 1 unit = 1 m, THREE injected, no textures.

export const meta = {
  id: 'sci-rad-01',
  name: '地表辐射监测站',
  name_en: 'Surface Radiation Monitoring Station',
  size_m: 9.2,               // measured bbox max edge (validate 复核过)
  effects: ['glow_windows', 'blink'],
};

export function build(THREE) {
  const group = new THREE.Group();

  // deterministic prng (rebuildable identically)
  let _seed = 20260806;
  const rnd = () => { _seed = (_seed * 16807) % 2147483647; return _seed / 2147483647; };
  const hash3 = (x, y, z) => {
    const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
    return s - Math.floor(s);
  };

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
    // detector-stack colour code (same colours reused on head / cutaway / screen)
    si:     new THREE.MeshLambertMaterial({ color: 0x27404f, emissive: 0x142530, emissiveIntensity: 0.4 }),
    hdpe:   new THREE.MeshLambertMaterial({ color: 0xe8e4da }),
    lif:    new THREE.MeshLambertMaterial({ color: 0x9fc4a0 }),
  };

  const box = (w, h, d, mat, x, y, z, parent) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
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
  box(8.8, 0.4, 6.8, M.grey, 0, 0.2, 0);                 // pad (sink_m friendly)
  box(9.2, 0.1, 7.2, M.shell, 0, 0.05, 0);               // skirt
  const TOP = 0.4;                                       // walking surface

  // ================================================================ 1. kiosk
  const KX = -2.7, KZ = -1.6;
  box(2.3, 2.0, 1.6, M.white, KX, TOP + 1.0, KZ);
  box(2.5, 0.14, 1.8, M.shell, KX, TOP + 2.06, KZ);      // roof strip
  box(2.5, 0.16, 1.8, M.grey, KX, TOP + 0.09, KZ);       // skirt
  // sealed door (frame + leaf + latch + hinges)
  box(0.86, 1.62, 0.06, M.orange, KX - 0.55, TOP + 0.92, KZ + 0.82);
  box(0.72, 1.48, 0.08, M.shell, KX - 0.55, TOP + 0.92, KZ + 0.80);
  box(0.09, 0.2, 0.07, M.dark, KX - 0.30, TOP + 0.92, KZ + 0.86);
  box(0.11, 0.09, 0.05, M.dark, KX - 0.84, TOP + 1.42, KZ + 0.85);
  box(0.11, 0.09, 0.05, M.dark, KX - 0.84, TOP + 0.46, KZ + 0.85);
  // open service bay: recessed dark bay + three electronics boards w/ lit edges
  box(0.98, 1.1, 0.1, M.dark, KX + 0.55, TOP + 1.15, KZ + 0.79);
  for (let i = 0; i < 3; i++) {
    box(0.8, 0.24, 0.06, M.steel, KX + 0.55, TOP + 0.8 + i * 0.34, KZ + 0.84);
    const led = new THREE.MeshLambertMaterial({ color: 0x143c1e, emissive: 0x2bd96a, emissiveIntensity: 0.9 });
    nightMats.push(led);
    box(0.06, 0.05, 0.05, led, KX + 0.88, TOP + 0.8 + i * 0.34, KZ + 0.86);
  }
  // radiator fins + conduits + junction box
  for (let i = 0; i < 5; i++) box(0.04, 1.15, 0.16, M.steel, KX - 1.2, TOP + 1.1, KZ - 0.55 + i * 0.26);
  box(0.06, 1.5, 0.06, M.steel, KX + 1.18, TOP + 0.85, KZ - 0.6);
  box(0.06, 1.5, 0.06, M.steel, KX + 1.18, TOP + 0.85, KZ - 0.75);
  box(0.24, 0.5, 0.4, M.dark, KX + 1.2, TOP + 0.6, KZ - 0.3);
  poi('poi_kiosk', KX, TOP + 1.4, KZ);

  // ================================================================ 2. detector tower + head
  const TX = 0.9, TZ = -2.2, TH = 3.3;                   // lattice mast
  const legs = [[-0.32, -0.32], [0.32, -0.32], [-0.32, 0.32], [0.32, 0.32]];
  for (const [lx, lz] of legs)
    beam(TX + lx, TOP, TZ + lz, TX + lx * 0.55, TOP + TH, TZ + lz * 0.55, 0.07, M.steel);
  for (let k = 1; k <= 3; k++) {
    const y = TOP + k * TH / 4, s = 0.32 - 0.144 * (k * TH / 4) / TH;
    beam(TX - s, y, TZ - s, TX + s, y, TZ - s, 0.05, M.steel);
    beam(TX - s, y, TZ + s, TX + s, y, TZ + s, 0.05, M.steel);
    beam(TX - s, y, TZ - s, TX - s, y, TZ + s, 0.05, M.steel);
    beam(TX + s, y, TZ - s, TX + s, y, TZ + s, 0.05, M.steel);
    beam(TX - s, y, TZ - s, TX + s, y + TH / 4 * 0.9, TZ - s, 0.04, M.steel);
    beam(TX + s, y, TZ + s, TX - s, y + TH / 4 * 0.9, TZ + s, 0.04, M.steel);
  }
  // head platform + open-sided head: three converter-faced Timepix4 layers,
  // stepped forward so every layer edge reads from the ground (逐层错位)
  const HY = TOP + TH + 0.12;
  box(1.5, 0.1, 1.15, M.shell, TX, HY, TZ);
  box(1.6, 0.08, 1.3, M.white, TX, HY + 1.06, TZ);       // sunshade roof
  box(0.08, 1.0, 1.1, M.white, TX - 0.72, HY + 0.55, TZ);// back+side walls (open +Z/+X face)
  box(1.5, 1.0, 0.08, M.white, TX, HY + 0.55, TZ - 0.52);
  const layer = (mat, face, y, zoff) => {
    box(1.05, 0.09, 0.8, mat, TX, HY + y, TZ + zoff);            // sensor board
    box(1.05, 0.05, 0.82, face, TX, HY + y + 0.07, TZ + zoff);   // converter face
    box(0.16, 0.06, 0.3, M.copper, TX + 0.56, HY + y, TZ + zoff);// readout flex
  };
  layer(M.si, M.si, 0.18, -0.10);        // A: bare Si (charged reference)
  layer(M.si, M.hdpe, 0.45, 0.02);       // B: 1 mm HDPE face (fast n)
  layer(M.si, M.lif, 0.72, 0.14);        // C: 6LiF face (thermal n)
  poi('poi_head', TX, HY + 0.6, TZ);
  // orange guard rail on two open sides of the pad
  for (const [rx, rz] of [[TX + 0.72, TZ], [TX, TZ + 0.55]]) {
    const horiz = rz === TZ;
    beam(rx - (horiz ? 0 : 0.7), HY + 0.5, rz - (horiz ? 0.55 : 0),
         rx + (horiz ? 0 : 0.7), HY + 0.5, rz + (horiz ? 0.55 : 0), 0.05, M.orange);
  }

  // ================================================================ 3. track screen (the soul)
  const SX = -0.3, SZ = 2.0;
  const scr = new THREE.Group(); scr.position.set(SX, 0, SZ); group.add(scr);
  box(0.16, 1.1, 0.16, M.steel, -1.5, TOP + 0.55, 0, scr);
  box(0.16, 1.1, 0.16, M.steel, 1.5, TOP + 0.55, 0, scr);
  box(3.6, 2.1, 0.14, M.dark, 0, TOP + 2.05, -0.02, scr);        // housing
  const bgMat = new THREE.MeshLambertMaterial({ color: 0x06121c, emissive: 0x0a2233, emissiveIntensity: 0.85 });
  box(3.3, 1.8, 0.03, bgMat, 0, TOP + 2.05, 0.06, scr);          // phosphor field
  box(3.7, 0.12, 0.3, M.shell, 0, TOP + 3.16, 0, scr);           // roof drip strip
  // legend chips (colour code == glyph colours == stack colours)
  const legend = [0x59d97b, 0xf2b04a, 0xe8524a];
  legend.forEach((c, i) => {
    const m = new THREE.MeshLambertMaterial({ color: 0x0a0a0a, emissive: c, emissiveIntensity: 0.9 });
    box(0.16, 0.07, 0.02, m, -1.35 + i * 0.4, TOP + 1.28, 0.08, scr);
  });
  poi('poi_screen', SX, TOP + 2.0, SZ + 0.2);

  // glyph factory — each glyph: one Group + its own transparent materials
  const glyphs = [];                       // {g, mats, period, phase, storm, kind}
  const field = new THREE.Group();         // glyph plane, sits on phosphor field
  field.position.set(0, TOP + 2.05, 0.09); scr.add(field);
  const plane = (w, h, mat, x, y, rot, parent) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    p.position.set(x, y, 0.001); p.rotation.z = rot || 0;
    parent.add(p); return p;
  };
  const mkMat = (c, ei) => {
    // black diffuse: glyph colour rides on emissive only, immune to scene lights
    const m = new THREE.MeshLambertMaterial({
      color: 0x000000, emissive: c, emissiveIntensity: ei || 1.0,
      transparent: true, opacity: 0, side: THREE.DoubleSide });
    return m;
  };
  const electronGlyph = () => {            // curly chain of dim squares
    const g = new THREE.Group(); const m = mkMat(0x59d97b, 0.9);
    let x = 0, y = 0, a = rnd() * 6.28;
    for (let i = 0; i < 10; i++) {
      plane(0.05, 0.05, m, x, y, 0, g);
      a += (rnd() - 0.5) * 1.9;            // multiple scattering walk
      x += Math.cos(a) * 0.07; y += Math.sin(a) * 0.07;
    }
    return { g, mats: [m], kind: 'e' };
  };
  const protonGlyph = () => {              // straight fat bar + Bragg cap
    const g = new THREE.Group();
    const m = mkMat(0xf2b04a, 0.95), mc = mkMat(0xffd98c, 1.3);
    const a = rnd() * 6.28, L = 0.4 + rnd() * 0.35;
    plane(L, 0.075, m, 0, 0, a, g);
    plane(0.1, 0.1, mc, Math.cos(a) * L / 2, Math.sin(a) * L / 2, a, g);
    return { g, mats: [m, mc], kind: 'p' };
  };
  const hzeGlyph = () => {                 // saturated blob + delta spokes
    const g = new THREE.Group();
    const m = mkMat(0xe8524a, 1.4), ms = mkMat(0xe8524a, 0.6);
    plane(0.17, 0.17, m, 0, 0, 0.6, g);
    for (let i = 0; i < 6; i++) {
      const a = i * 1.047 + rnd() * 0.4;
      plane(0.16, 0.02, ms, Math.cos(a) * 0.12, Math.sin(a) * 0.12, a, g);
    }
    return { g, mats: [m, ms], kind: 'z' };
  };
  const addGlyph = (mk, period, phase, storm) => {
    const rec = mk(); rec.period = period; rec.phase = phase; rec.storm = !!storm;
    field.add(rec.g); glyphs.push(rec);
  };
  // quiet population — mix follows ledger #2 (e/p common, HZE rare)
  for (let i = 0; i < 5; i++) addGlyph(electronGlyph, 5.5 + i * 1.3, i * 2.1);
  for (let i = 0; i < 6; i++) addGlyph(protonGlyph, 4.6 + i * 1.1, 7 + i * 1.7);
  for (let i = 0; i < 2; i++) addGlyph(hzeGlyph, 19 + i * 7, 11 + i * 9);
  // storm population — proton-rich rain, only alive inside the SEP window
  for (let i = 0; i < 9; i++) addGlyph(protonGlyph, 1.1 + (i % 3) * 0.35, i * 0.43, true);
  for (let i = 0; i < 2; i++) addGlyph(electronGlyph, 1.6, 2 + i * 0.8, true);
  addGlyph(hzeGlyph, 3.4, 1.2, true);

  // ================================================================ 4. SEP alert tower
  const AX = 3.3, AZ = 0.3;
  box(0.5, 0.12, 0.5, M.grey, AX, TOP + 0.06, AZ);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.7, 10), M.steel);
  pole.position.set(AX, TOP + 1.35, AZ); group.add(pole);
  // dark diffuse base so on/off contrast is carried by emissive alone
  const lampMat = (base, glow) => new THREE.MeshLambertMaterial(
    { color: base, emissive: glow, emissiveIntensity: 0.05 });
  const gMat = lampMat(0x0e2e17, 0x2bd96a), yMat = lampMat(0x33270a, 0xf2b04a),
        rMat = lampMat(0x330d0a, 0xe8524a);
  const seg = (mat, y) => {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.3, 12), mat);
    s.position.set(AX, y, AZ); group.add(s);
  };
  seg(rMat, TOP + 3.1); seg(yMat, TOP + 2.78); seg(gMat, TOP + 2.46);
  box(0.36, 0.08, 0.36, M.dark, AX, TOP + 3.3, AZ);      // cap
  // twin alarm horns
  for (const s of [-1, 1]) {
    const horn = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.16, 0.42, 10, 1, true),
      new THREE.MeshLambertMaterial({ color: 0xcfc8ba, side: THREE.DoubleSide }));
    horn.rotation.z = Math.PI / 2 * s; horn.rotation.y = s * 0.5;
    horn.position.set(AX + s * 0.3, TOP + 2.1, AZ); group.add(horn);
  }
  poi('poi_alert', AX, TOP + 2.6, AZ);

  // ================================================================ 5. EVA dosimeter rack
  const RX = -3.1, RZ = 1.9;
  box(1.5, 0.1, 0.6, M.grey, RX, TOP + 0.05, RZ);
  box(1.4, 0.9, 0.18, M.white, RX, TOP + 0.75, RZ);      // back board
  box(1.5, 0.1, 0.5, M.shell, RX, TOP + 1.28, RZ + 0.1); // canopy
  box(0.08, 0.55, 0.08, M.steel, RX - 0.66, TOP + 0.3, RZ + 0.12);
  box(0.08, 0.55, 0.08, M.steel, RX + 0.66, TOP + 0.3, RZ + 0.12);
  for (let i = 0; i < 8; i++) {
    const x = RX - 0.56 + i * 0.16;
    box(0.12, 0.3, 0.1, M.dark, x, TOP + 0.62, RZ + 0.12);       // slot
    if (i < 5) {                                                  // 5 badges docked
      box(0.09, 0.24, 0.03, M.shell, x, TOP + 0.78, RZ + 0.14);
      const chg = new THREE.MeshLambertMaterial({ color: 0x59d97b, emissive: 0x2bd96a, emissiveIntensity: 0.8 });
      nightMats.push(chg);
      box(0.07, 0.03, 0.01, chg, x, TOP + 0.86, RZ + 0.16);
    }
  }
  poi('poi_rack', RX, TOP + 0.9, RZ);

  // ================================================================ 6. neutron stack cutaway
  const CX = 2.9, CZ = 2.3;
  box(0.9, 0.7, 0.7, M.shell, CX, TOP + 0.35, CZ);       // plinth
  const cut = new THREE.Group(); cut.position.set(CX, TOP + 0.86, CZ);
  cut.rotation.x = -0.45; group.add(cut);
  // x100 enlarged stack, stepped front edges (each layer reads separately)
  box(0.8, 0.1, 0.55, M.hdpe, 0, 0.0, 0.0, cut);         // 1 mm HDPE
  box(0.8, 0.025, 0.55, M.lif, 0, 0.065, 0.05, cut);     // 6LiF film
  box(0.8, 0.06, 0.55, M.si, 0, 0.11, 0.10, cut);        // 300 um Si
  box(0.8, 0.05, 0.55, M.copper, 0, 0.17, 0.15, cut);    // Timepix4 ASIC
  // recoil-proton arrow: neutron comes in (white), proton knocks into Si (amber)
  beam(-0.5, 0.42, -0.1, -0.12, 0.1, -0.02, 0.025, M.white, cut);
  beam(-0.12, 0.1, -0.02, 0.18, 0.16, 0.1, 0.03, M.orange, cut);
  poi('poi_cutaway', CX, TOP + 1.0, CZ);

  // ================================================================ 7. antenna + solar
  const NX = -1.3, NZ = -2.9;
  box(0.45, 0.5, 0.45, M.grey, NX, TOP + 0.25, NZ);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 3.6, 10), M.steel);
  mast.position.set(NX, TOP + 2.05, NZ); group.add(mast);
  const yagi = new THREE.Group(); yagi.position.set(NX, TOP + 3.7, NZ);
  yagi.rotation.y = 2.45;                                // aimed at com-station-01 (west)
  group.add(yagi);
  box(1.1, 0.05, 0.05, M.dark, 0, 0, 0, yagi);
  for (let i = 0; i < 5; i++) box(0.04, 0.04, 0.42 - i * 0.06, M.steel, -0.4 + i * 0.2, 0, 0, yagi);
  const bk = new THREE.MeshLambertMaterial({ color: 0xe8524a, emissive: 0xe8524a, emissiveIntensity: 0.9 });
  blinkMats.push(bk);                                    // engine-driven aviation beacon
  box(0.09, 0.09, 0.09, bk, NX, TOP + 3.95, NZ);
  box(0.2, 0.3, 0.14, M.dark, NX + 0.24, TOP + 1.0, NZ); // junction box
  // solar panel on A-frame + cable to kiosk
  const PX = 3.5, PZ = -2.0;
  const pv = box(2.2, 0.08, 1.5, M.pv, PX, TOP + 1.15, PZ);
  pv.rotation.x = -0.42;
  for (const s of [-1, 1]) {
    beam(PX + s * 0.9, TOP, PZ + 0.55, PX + s * 0.9, TOP + 1.35, PZ - 0.35, 0.07, M.steel);
    beam(PX + s * 0.9, TOP, PZ - 0.75, PX + s * 0.9, TOP + 0.9, PZ - 0.15, 0.06, M.steel);
  }
  for (let i = 0; i < 3; i++) box(0.72, 0.02, 1.46, M.steel, PX - 0.73 + i * 0.73, TOP + 1.16, PZ);
  poi('poi_power', PX, TOP + 1.2, PZ);

  // ================================================================ 8. weather-link sign
  // env-alert cluster marker: this station + sci-weather-01 share the NE knoll;
  // cable tray leaves the pad toward the weather mast (SW).
  const LX = -1.6, LZ = 3.1;
  const sign = new THREE.Group(); sign.position.set(LX, 0, LZ);
  sign.rotation.y = 0.65; group.add(sign);
  box(0.1, 1.15, 0.1, M.steel, 0, TOP + 0.57, 0, sign);
  box(1.15, 0.62, 0.06, M.white, 0, TOP + 1.28, 0, sign);
  const wChip = new THREE.MeshLambertMaterial({ color: 0xf2b04a, emissive: 0xf2b04a, emissiveIntensity: 0.5 });
  const rChip = new THREE.MeshLambertMaterial({ color: 0xe8524a, emissive: 0xe8524a, emissiveIntensity: 0.5 });
  nightMats.push(wChip, rChip);
  box(0.3, 0.3, 0.03, wChip, -0.26, TOP + 1.32, 0.045, sign);    // τ 停飞 (weather)
  box(0.3, 0.3, 0.03, rChip, 0.26, TOP + 1.32, 0.045, sign);     // SEP 红警 (rad)
  box(0.86, 0.1, 0.04, M.dark, 0, TOP + 1.08, 0.045, sign);
  poi('poi_net', LX, TOP + 1.2, LZ);

  // cable trays: kiosk -> tower / screen / alert / antenna, and off-pad stub SW
  const tray = (ax, az, bx, bz) => beam(ax, TOP + 0.05, az, bx, TOP + 0.05, bz, 0.09, M.dark);
  tray(KX + 1.1, KZ, TX - 0.3, TZ + 0.2);
  tray(KX + 1.1, KZ + 0.4, SX - 1.2, SZ - 0.2);
  tray(KX + 1.1, KZ + 0.2, AX - 0.3, AZ);
  tray(KX - 0.5, KZ - 0.6, NX + 0.2, NZ + 0.3);
  beam(-3.2, 0.1, 2.6, -4.4, 0.06, 3.4, 0.09, M.dark);           // off-pad, toward weather mast

  // worn-site details: two wheel ruts + deterministic gravel
  box(0.5, 0.03, 2.6, M.dark, -4.1, 0.015, -0.9);
  box(0.5, 0.03, 2.6, M.dark, -4.1 + 1.1, 0.015, -0.9);
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);
  for (let i = 0; i < 14; i++) {
    const a = rnd() * 6.283, d = 4.0 + rnd() * 1.0, s = 0.06 + rnd() * 0.1;
    const rock = new THREE.Mesh(rockGeo,
      new THREE.MeshLambertMaterial({ color: rnd() < 0.5 ? 0x8a5a3b : 0x9e6a45 }));
    rock.position.set(Math.cos(a) * d, 1.62 * s - 0.3 * s, Math.sin(a) * d * 0.72);
    rock.scale.set(s, s * 0.7, s); rock.rotation.y = rnd() * 6.28;
    group.add(rock);
  }

  // ---------------------------------------------------------------- dust pass
  const dust = new THREE.Color(0x9e5b3d);
  [M.white, M.shell, M.grey, M.steel, M.orange, M.pv, M.hdpe].forEach((m) => m.color.lerp(dust, 0.05));

  // ================================================================ animation
  // One 60 s supercycle, pure function of t (same t -> same frame, any-t entry):
  //   [0,42)  quiet   — green lamp, sparse glyphs (GCR mix from ledger #2)
  //   [42,45) watch   — yellow lamp (rate climbing)
  //   [45,55) SEP     — red lamp flashing, proton track-rain (ledger #4: even a
  //                     1972-class storm is 1.7e-4 of chip ceiling — screen rain
  //                     is the alert, the camera itself never saturates)
  //   [55,60) recover — yellow -> green
  const T = 60;
  const envelope = (u, a, b, c, d) =>       // trapezoid on [0,1]
    u < a ? 0 : u < b ? (u - a) / (b - a) : u < c ? 1 : u < d ? 1 - (u - c) / (d - c) : 0;
  const W = 1.15, H = 0.62;                 // glyph field half-extent

  group.userData.animate = (t) => {
    const tt = ((t % T) + T) % T;
    const storm = envelope(tt / T, 45 / T, 46 / T, 54 / T, 55 / T);
    // lamps (own materials — deliberately NOT in blinkMats, animate owns them)
    const flash = (tt * 1.25) % 1 < 0.7 ? 1 : 0.1;
    rMat.emissiveIntensity = 0.05 + storm * 2.2 * flash;
    yMat.emissiveIntensity = 0.05 + 2.0 * (envelope(tt / T, 42 / T, 42.5 / T, 44.8 / T, 45 / T)
                                          + envelope(tt / T, 55 / T, 55.3 / T, 58 / T, 59 / T));
    gMat.emissiveIntensity = 0.05 + 1.8 * (1 - Math.max(storm,
        envelope(tt / T, 42 / T, 42.5 / T, 58 / T, 59 / T)));
    bgMat.emissiveIntensity = 0.85 + storm * 0.35;       // field brightens in the rain
    // glyphs: per-glyph cycle index -> hashed screen position, trapezoid life
    for (let i = 0; i < glyphs.length; i++) {
      const rec = glyphs[i];
      const lt = (t + rec.phase) / rec.period;
      const c = Math.floor(lt), u = lt - c;
      let op = envelope(u, 0, 0.12, 0.55, 0.9);
      op *= rec.storm ? storm : (1 - storm * 0.85);       // storm set gated in, quiet set ducks
      rec.g.position.set((hash3(c * 1.7 + i, i * 2.31, 3.7) - 0.5) * 2 * W,
                         (hash3(c * 0.9, i * 5.13, 7.1) - 0.5) * 2 * H, 0);
      rec.g.visible = op > 0.01;
      for (const m of rec.mats) m.opacity = op * (rec.kind === 'e' ? 0.85 : 1);
    }
  };

  group.userData.nightMats = nightMats;
  group.userData.blinkMats = blinkMats;
  group.userData.lights = [{ color: 0x9fd8ff, pos: [SX, TOP + 2.2, SZ + 1.2], range: 9 }];

  return group;
}
