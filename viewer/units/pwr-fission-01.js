// viewer/units/pwr-fission-01.js
// pwr-fission-01 - Emergency fission power plant, Mars City (Jezero)
//
// 8 x 40 kWe FSP-class heat-pipe reactor modules in one shared vault, buried
// under 4.0 m of compacted regolith, rejecting 960 kW to 20 radiator panels
// (16 in the first draft; ledger 12's fin-efficiency account raised it).
// Sized by the quench-x-dust-storm gap (275 kWe firm) - see the info.json cards
// and E:\Claude\mars-fission\sim\*.py for the ledgers behind every number.
//
// Design intent of the GEOMETRY (science-city rule: the core is not a black box):
//   - the hill is visibly built in 0.5 m compaction LIFTS, and a wedge is cut out
//     of it so the regolith section, the vault liner and the modules are all
//     readable from the front
//   - the module stack is exposed: core -> control drums -> sodium heat pipes ->
//     opposed Stirling pair -> NaK header, in that order, bottom to top
//   - the opposed converter pair is ANIMATED IN ANTIPHASE: you can watch the
//     force cancellation that lets this machine sit 617 m from a seismometer
//   - colour is a causal chain: amber = nuclear heat, red = hot NaK out,
//     blue = cold NaK return, green = the passive decay-heat path that needs
//     no pump and no power, copper = the DC power path to the access cubicle
//
// Contract: 1 unit = 1 m, origin at berm centre on the ground plane (y=0),
// +Y up, front faces +Z. THREE is passed in; nothing is imported.

export const meta = {
  id: 'pwr-fission-01',
  name: '应急裂变电源站',
  name_en: 'Emergency Fission Power Plant',
  size_m: 79.6,               // MEASURED bbox max edge (validate_unit.mjs), not nominal
  effects: [],
};

export function build(THREE) {
  const g = new THREE.Group();
  const dustMats = [];        // everything that gets the closing dust-film pass

  // ------------------------------------------------------------- materials --
  const M = (hex, opts = {}) => {
    const m = new THREE.MeshLambertMaterial({ color: hex, ...opts });
    dustMats.push(m);
    return m;
  };
  const MS = (hex, opts = {}) => {
    const m = new THREE.MeshStandardMaterial({ color: hex, ...opts });
    dustMats.push(m);
    return m;
  };

  // palette, written out as a table so the causal colour chain is auditable
  const regoA   = M(0xa06a46);   // compacted regolith lift, light course
  const regoB   = M(0x93603f);   // compacted regolith lift, dark course
  const regoCut = M(0x8a5a3b);   // sectioned face of the berm
  const regoInn = M(0x6d4630);   // inner (hot) zone of the berm, > 273 K
  const pad     = M(0x8e6249);   // graded apron / sintered running surface
  const track   = M(0x7c5540);   // wheel ruts
  const liner   = MS(0x6d757e, { roughness: 0.55, metalness: 0.6 }); // steel vault
  const linerIn = MS(0x565d66, { roughness: 0.6, metalness: 0.5 });
  const conc    = M(0x9a9a95);   // raft / plinths
  const can     = MS(0x8d9299, { roughness: 0.4, metalness: 0.7 });  // module can
  const collar  = MS(0x4e5259, { roughness: 0.5, metalness: 0.6 });  // shadow collar
  const coreMat = MS(0x2c2c31, { roughness: 0.7, metalness: 0.4 });
  const fuelMat = MS(0x6a2f12, { roughness: 0.5, metalness: 0.3,
                                 emissive: 0xff6a18, emissiveIntensity: 0.85 });
  const drumRef = M(0xc4bda9);                    // BeO reflector drum
  const drumAbs = M(0x35353d);                    // B4C absorber face
  const hpMat   = MS(0xc27a36, { roughness: 0.35, metalness: 0.8 }); // Na heat pipe
  const stirl   = MS(0x515c68, { roughness: 0.45, metalness: 0.65 });
  const stirlHd = MS(0xa9b1b9, { roughness: 0.3, metalness: 0.85 });
  const rodMat  = MS(0xd7dde2, { roughness: 0.25, metalness: 0.9 });
  const hotNaK  = M(0xc0453f);   // hot NaK header  (converter -> panel)
  const cldNaK  = M(0x3f7fbf);   // cold NaK return (panel -> converter)
  const decayM  = M(0x3f9d5c);   // passive decay-heat path
  const panel   = MS(0x212429, { roughness: 0.85, metalness: 0.1 }); // radiator
  const panelFr = MS(0x9aa1a8, { roughness: 0.5, metalness: 0.6 });
  const cablesM = MS(0xb5762f, { roughness: 0.4, metalness: 0.7 });  // DC power
  const bunkerM = M(0x7b8087);
  const hazard  = M(0xd8b02a);   // hazard yellow
  const hazardB = M(0x2a2a2e);   // hazard black
  const rail    = M(0xdd7a26);   // safety orange handrail
  const signW   = M(0xe8e4dc);

  // night-lit and blinking materials (engine drives these)
  const nightMats = [];
  const blinkMats = [];
  const emissive = (hex, inten = 1.0) => {
    const m = new THREE.MeshStandardMaterial({
      color: hex, emissive: hex, emissiveIntensity: inten,
      roughness: 0.6, metalness: 0.0,
    });
    nightMats.push(m);
    return m;                                    // NOT dusted - it is a lamp
  };
  const winMat  = emissive(0xffca7a, 0.9);       // bunker / cubicle windows
  const okMat   = emissive(0x54e07a, 0.8);       // module running lamp
  const beaconM = new THREE.MeshStandardMaterial({
    color: 0xd8342a, emissive: 0xd8342a, emissiveIntensity: 1.0,
    roughness: 0.5, metalness: 0.0,
  });
  blinkMats.push(beaconM);

  // ---------------------------------------------------------------- helpers --
  const box = (w, h, d, m, x = 0, y = 0, z = 0, parent = g) => {
    const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    o.position.set(x, y, z);
    parent.add(o);
    return o;
  };
  const cyl = (rt, rb, h, seg, m, x = 0, y = 0, z = 0, parent = g) => {
    const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
    o.position.set(x, y, z);
    parent.add(o);
    return o;
  };
  // deterministic pseudo-random - no Math.random anywhere in this module
  let _s = 20260815;
  const rnd = () => {
    _s = (_s * 1664525 + 1013904223) % 4294967296;
    return _s / 4294967296;
  };

  // =========================================================== SITE GEOMETRY ==
  // berm: crest slab 21 x 15 at y = +10.0 (5.7 m of vault + 4.0 m of cover),
  //       built in 20 visible 0.5 m compaction lifts.
  // notch: a wedge x in [-8, +8], z >= +0.5 removed, exposing the front module
  //        row, the sectioned regolith and the vault liner.
  // The vault floor sits at grade (+0.30) rather than in a cut: the engine's
  // terrain mesh would otherwise slice straight through the open bay and hide
  // everything the cutaway exists to show. The COVER is at its true 4.0 m and
  // the mound proportions are exact; only the datum moved. Noted in HANDOFF s3.
  // Side slopes are 1:1.5 (33.7 deg). NOTE ledger 13's correction: for a dry
  // COHESIONLESS fill the factor of safety is tan(phi)/tan(beta) and is
  // GRAVITY-INDEPENDENT - 1.13 on either planet, short of the usual 1.5. Low
  // gravity helps only through the cohesion term, so this slope carries a
  // requirement: demonstrate c >= 2.1 kPa in the compacted fill, or flatten
  // to 1:2 (which passes with no cohesion at all).
  const CREST_Y = 10.5, LIFT = 0.5, NLIFT = 21;
  const HW_TOP = 10.5, HD_TOP = 7.5;             // half-extents of the crest
  const SLOPE = 1.5;                             // horizontal run per unit rise
  const NX = 8.0;                                // notch half-width
  const NZ = 0.5;                                // notch front-cut plane

  const hw = (y) => HW_TOP + SLOPE * (CREST_Y - y);
  const hd = (y) => HD_TOP + SLOPE * (CREST_Y - y);

  const berm = new THREE.Group();
  berm.name = 'berm';
  g.add(berm);

  // The mound is a TRUE lofted slope, not a staircase: an 8-vertex cross-section
  // (rectangle with a bite taken out of the +Z side for the notch) lofted upward
  // in 0.5 m bands. Each band is its own mesh with an alternating material, so
  // the 0.5 m compaction lifts read as banding on a smooth slope - which is what
  // a finished engineered fill actually looks like. 320 triangles for the whole
  // hill, against 720 for the stepped version it replaces.
  const poly = (y) => {
    const W = hw(y), D = hd(y);
    return [[-W, -D], [-W, D], [-NX, D], [-NX, NZ],
            [NX, NZ], [NX, D], [W, D], [W, -D]];
  };
  const OUTER_EDGES = [0, 1, 5, 6, 7];      // the hill's own slopes
  const NOTCH_EDGES = [2, 3, 4];            // the sectioned faces of the cut

  const band = (y0, y1, edges, m) => {
    const p0 = poly(y0), p1 = poly(y1), pos = [];
    for (const i of edges) {
      const j = (i + 1) % 8;
      const a = p0[i], b = p0[j], c = p1[j], d = p1[i];
      pos.push(a[0], y0, a[1], b[0], y0, b[1], c[0], y1, c[1]);
      pos.push(a[0], y0, a[1], c[0], y1, c[1], d[0], y1, d[1]);
    }
    const gm = new THREE.BufferGeometry();
    gm.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    gm.computeVertexNormals();
    berm.add(new THREE.Mesh(gm, m));
  };

  for (let i = 0; i < NLIFT; i++) {
    const y0 = i * LIFT, y1 = y0 + LIFT;
    band(y0, y1, OUTER_EDGES, (i % 2 === 0) ? regoA : regoB);
    // the inner ~2 m of cover runs above 273 K (ledger 5) - no ice may live
    // there, and the sectioned face is banded darker to say so
    band(y0, y1, NOTCH_EDGES, (CREST_Y - y0) < 2.0 ? regoInn : regoCut);
  }

  // crest cap: three plates spanning the U-shaped top, plus a hazard-striped
  // kerb round the edge. The crest is a signed controlled area (145 uSv/h,
  // ledger 5) - the marking says "do not stand here", it is not decoration.
  const CW = HW_TOP, CD = HD_TOP;
  box(CW - NX, 0.30, 2 * CD, regoA, -(NX + CW) / 2, CREST_Y + 0.15, 0, berm);
  box(CW - NX, 0.30, 2 * CD, regoA,  (NX + CW) / 2, CREST_Y + 0.15, 0, berm);
  box(2 * NX, 0.30, CD + NZ, regoA, 0, CREST_Y + 0.15, (NZ - CD) / 2, berm);
  for (let i = 0; i < 14; i++) {              // kerb, alternating yellow/black
    const t = i / 14, m = i % 2 ? hazard : hazardB;
    box(1.5, 0.14, 0.30, m, -CW + 0.8 + t * (2 * CW - 1.6), CREST_Y + 0.36,
        -CD + 0.2, berm);
  }

  // ------------------------------------------------------- vault + apron ----
  // vault interior x [-9,9], z [-6,6]
  const FLOOR_Y = 0.30;
  const VW = 9.0, VD = 6.0;

  // apron: a graded pad covering the whole footprint so terrain relief is hidden
  box(78, 0.24, 68, pad, 0, 0.12, 0, g);
  // wheel ruts from the gate to the notch (a used site, not a rendering)
  for (const dx of [-1.6, 1.6]) {
    box(1.0, 0.05, 30, track, dx, 0.25, 16, g);
  }

  const vault = new THREE.Group();
  vault.name = 'vault';
  g.add(vault);
  box(2 * VW + 3, 0.5, 2 * VD + 3, conc, 0, FLOOR_Y - 0.25, 0, vault);   // raft
  box(2 * VW, 0.25, 2 * VD, linerIn, 0, FLOOR_Y + 0.12, 0, vault);       // floor
  // liner walls: a welded steel Faraday cage, not a structural nicety - regolith
  // is transparent at HF (skin depth ~3 km at 3 MHz) so burial buys ZERO RF
  // attenuation and sci-radio-01's null does not cover this site. See the tie card.
  const WALL_H = 5.7;
  box(0.5, WALL_H, 2 * VD + 1, liner, -VW - 0.25, FLOOR_Y + WALL_H / 2, 0, vault);
  box(0.5, WALL_H, 2 * VD + 1, liner,  VW + 0.25, FLOOR_Y + WALL_H / 2, 0, vault);
  box(2 * VW + 1, WALL_H, 0.5, liner, 0, FLOOR_Y + WALL_H / 2, -VD - 0.25, vault);
  // roof slab over the rear bay only (the notch removed the front of it)
  box(2 * VW + 1, 0.5, VD + 0.75 - NZ, liner,
      0, FLOOR_Y + WALL_H + 0.25, (NZ - VD - 0.75) / 2 - 0.0, vault);
  // sectioned edge of the roof, so the cut reads as a cut
  box(2 * VW + 1, 0.55, 0.1, hazard, 0, FLOOR_Y + WALL_H + 0.25, NZ + 0.05, vault);
  // front sill of the open bay, so the cut has a lip to read against
  box(2 * NX, 0.45, 0.6, conc, 0, FLOOR_Y + 0.1, VD + 0.3, vault);
  // central column line between the two module rows. An 18 m clear span under
  // 4 m of cover is 992 kN.m/m as a flat slab (ledger 13); halving the span
  // quarters it. The arched liner ledger 13 also calls for is NOT drawn yet.
  for (let i = -2; i <= 2; i++) {
    cyl(0.42, 0.48, WALL_H, 10, conc, i * 4.5, FLOOR_Y + WALL_H / 2, 0, vault);
    box(1.3, 0.35, 1.3, conc, i * 4.5, FLOOR_Y + WALL_H - 0.1, 0, vault);
  }
  box(2 * NX, 0.35, 0.35, rail, 0, FLOOR_Y + 0.5, VD + 0.55, vault);

  // ============================================================== MODULES ====
  // 8 x 40 kWe, two rows of four. Front row (z=+3) sits in the open notch and
  // is fully detailed; rear row (z=-3) is under the roof slab and simplified.
  const MOD_X = [-6.75, -2.25, 2.25, 6.75];
  const modules = new THREE.Group();
  modules.name = 'modules';
  g.add(modules);

  const pistonNodes = [];

  const buildModule = (x, z, detailed, idx) => {
    const mg = new THREE.Group();
    mg.position.set(x, FLOOR_Y + 0.25, z);
    modules.add(mg);

    box(3.0, 0.35, 3.0, conc, 0, 0.17, 0, mg);            // module plinth
    // elastomeric isolator pads (ledger 7: 10 Hz mounts, 103x at 102 Hz)
    for (const sx of [-1.0, 1.0]) for (const sz of [-1.0, 1.0]) {
      cyl(0.16, 0.16, 0.22, 8, hazardB, sx, 0.45, sz, mg);
    }

    if (!detailed) {                                       // rear row: outer can
      cyl(1.05, 1.05, 2.6, 12, can, 0, 1.85, 0, mg);
      cyl(1.25, 1.05, 0.9, 12, collar, 0, 3.6, 0, mg);
      const l = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.06), okMat);
      l.position.set(0, 2.9, 1.06); mg.add(l);
      return mg;
    }

    // ---- core: vessel SECTIONED on the +Z side so the fuel is actually seen.
    // (A closed cylinder with pins hidden inside it is the definition of a black
    //  box; the rear half-shell is drawn and the front half is simply absent.)
    const coreY = 1.30;
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(
      0.66, 0.66, 1.10, 16, 1, true, -Math.PI / 2, Math.PI), coreMat);
    shell.position.set(0, coreY, 0);
    mg.add(shell);
    cyl(0.66, 0.66, 0.10, 16, coreMat, 0, coreY - 0.55, 0, mg);   // vessel floor
    // HALEU fuel block: a central monolith ringed by pins, glowing amber
    cyl(0.26, 0.26, 0.94, 10, fuelMat, 0, coreY, 0, mg);
    for (let i = 0; i < 9; i++) {
      const a = -Math.PI / 2 + (i / 8) * Math.PI;         // front arc only
      cyl(0.085, 0.085, 0.90, 6, fuelMat,
          Math.cos(a) * 0.44, coreY, -Math.sin(a) * 0.44, mg);
    }

    // ---- radial reflector with 8 rotating control drums -------------------
    // BeO drum with a B4C absorber face: rotate the black face inward and the
    // core shuts down. These move at startup and scram only - hence no spinner.
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.39;
      // the section plane took the front arc of the reflector with it, which is
      // what lets you see the fuel at all - draw only the drums behind it
      if (Math.cos(a) > 0.45) continue;
      const dr = new THREE.Group();
      dr.position.set(Math.sin(a) * 0.98, coreY, Math.cos(a) * 0.98);
      dr.rotation.y = -a;
      cyl(0.24, 0.24, 1.12, 10, drumRef, 0, 0, 0, dr);
      box(0.34, 1.08, 0.12, drumAbs, 0, 0, -0.20, dr);    // B4C face, out = ON
      cyl(0.09, 0.09, 0.22, 6, stirlHd, 0, 0.66, 0, dr);  // drum drive shaft
      mg.add(dr);
    }

    // ---- sodium heat pipes: core -> Stirling heater heads ------------------
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const px = Math.sin(a) * 0.46, pz = Math.cos(a) * 0.46;
      cyl(0.065, 0.065, 1.45, 6, hpMat, px, coreY + 1.28, pz, mg);
    }
    cyl(0.56, 0.78, 0.36, 12, hpMat, 0, coreY + 2.16, 0, mg);   // vapour manifold

    // ---- shadow collar (the only shield mass still worth launching) --------
    cyl(1.22, 0.92, 0.58, 14, collar, 0, coreY + 2.62, 0, mg);

    // ---- opposed Stirling pair, axis along X so the antiphase is readable --
    const conv = new THREE.Group();
    conv.position.set(0, coreY + 3.30, 0);
    mg.add(conv);
    // the shared hot manifold both converters draw from
    cyl(0.30, 0.30, 1.10, 10, hpMat, 0, 0, 0, conv).rotation.z = Math.PI / 2;
    for (const s of [-1, 1]) {
      cyl(0.34, 0.34, 0.90, 12, stirl, s * 0.90, 0, 0, conv)   // pressure vessel
        .rotation.z = Math.PI / 2;
      cyl(0.38, 0.38, 0.14, 12, stirlHd, s * 0.48, 0, 0, conv) // heater-head
        .rotation.z = Math.PI / 2;
      const rod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.085, 0.085, 0.52, 8), rodMat);
      rod.rotation.z = Math.PI / 2;
      rod.position.set(s * 1.50, 0, 0);
      rod.name = `piston_${idx}_${s > 0 ? 'a' : 'b'}`;
      conv.add(rod);
      pistonNodes.push({ name: rod.name, amp: 0.17 * s });  // +/- => antiphase
      // linear alternator can outboard of the piston
      cyl(0.28, 0.28, 0.46, 10, stirlHd, s * 1.93, 0, 0, conv)
        .rotation.z = Math.PI / 2;
      // cold-end jacket, feeding the NaK header: blue = the loop that never
      // saw a neutron (the whole Stirling-over-Brayton argument, in colour)
      cyl(0.36, 0.36, 0.18, 10, cldNaK, s * 1.36, 0, 0, conv)
        .rotation.z = Math.PI / 2;
    }

    // ---- NaK header off the cold ends: red out (hot), blue back (cold) -----
    box(0.18, 0.18, 1.5, hotNaK, -0.34, coreY + 3.42, 0.9, mg);
    box(0.18, 0.18, 1.5, cldNaK,  0.34, coreY + 3.08, 0.9, mg);
    box(2.6, 0.18, 0.18, hotNaK, 0, coreY + 3.42, 1.60, mg);
    box(2.6, 0.16, 0.16, cldNaK, 0, coreY + 3.08, 1.60, mg);

    // ---- running lamp ------------------------------------------------------
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.26, 0.08), okMat);
    l.position.set(1.15, coreY + 3.30, 1.15);
    mg.add(l);
    return mg;
  };

  MOD_X.forEach((x, i) => buildModule(x, 3.0, true, i));
  MOD_X.forEach((x, i) => buildModule(x, -3.0, false, i + 4));

  // module POI anchor (front-left module)
  const aMod = new THREE.Object3D();
  aMod.name = 'poi_modules';
  aMod.position.set(-6.75, FLOOR_Y + 2.6, 3.0);
  g.add(aMod);
  const aConv = new THREE.Object3D();
  aConv.name = 'poi_convert';
  aConv.position.set(2.25, FLOOR_Y + 4.6, 3.0);
  g.add(aConv);

  // ======================================================= RADIATOR WINGS ====
  // 20 panels, 3.0 x 5.5 m = 330 m2 of panel against the 300 m2 ledger 12
  // requires once fin efficiency (0.864 at a 10 cm heat-pipe pitch) is counted.
  // Ledger 4's first draft said 16 and carried an implicit eta_fin = 1.00.
  // Two rows leaning OUTWARD 15 deg so the rows do not radiate into each other.
  // The end panel of each row carries the always-open decay-heat leg (green).
  const PANELS_PER_ROW = 10, P_W = 3.0, P_H = 5.5, P_PITCH = 4.0, ROW_X = 33.0;
  const rads = new THREE.Group();
  rads.name = 'radiators';
  g.add(rads);

  for (const side of [-1, 1]) {
    // header pipes running the length of the row: hot supply, cold return
    box(0.34, 0.34, PANELS_PER_ROW * P_PITCH, hotNaK,
        side * (ROW_X - 1.5), 0.75, 0, rads);
    box(0.28, 0.28, PANELS_PER_ROW * P_PITCH, cldNaK,
        side * (ROW_X - 1.0), 0.40, 0, rads);
    // dog-legged penetration out of the berm toe (streaming control, ledger 5)
    box(1.1, 1.4, 2.0, liner, side * 21.9, 0.7, 0, rads);   // dog-leg penetration
    box(10.0, 0.36, 0.36, hotNaK, side * 26.8, 0.9, 0.6, rads);
    box(10.0, 0.30, 0.30, cldNaK, side * 26.8, 0.4, -0.6, rads);

    for (let i = 0; i < PANELS_PER_ROW; i++) {
      const z = (i - (PANELS_PER_ROW - 1) / 2) * P_PITCH;
      const decay = (i === 0);                       // one per row = 2 of 16
      const p = new THREE.Group();
      p.position.set(side * ROW_X, 0.2, z);
      p.rotation.z = side * -0.26;                   // lean outward ~15 deg
      rads.add(p);
      box(0.10, P_H, P_W, panel, 0, P_H / 2, 0, p);           // the panel
      box(0.16, 0.14, P_W + 0.2, panelFr, 0, P_H, 0, p);      // top rail
      box(0.16, 0.14, P_W + 0.2, panelFr, 0, 0.1, 0, p);      // bottom rail
      // mid-height cross rail (ledger 15): halves the free length and takes the
      // first bending mode from 3.62 Hz - inside sci-seis-01's SP band, where
      // ordinary storm buffeting drove it 7x over the red line - to 14.5 Hz.
      box(0.17, 0.13, P_W + 0.2, panelFr, 0, P_H / 2, 0, p);
      for (const sz of [-1, 1]) {                              // side stiles
        box(0.14, P_H, 0.12, panelFr, 0, P_H / 2, sz * (P_W / 2 + 0.05), p);
      }
      // riser to the header, colour-coded; green if this is a decay-heat panel
      box(0.13, P_H * 0.9, 0.13, decay ? decayM : hotNaK, 0.09, P_H * 0.45,
          -P_W / 4, p);
      box(0.11, P_H * 0.9, 0.11, decay ? decayM : cldNaK, 0.09, P_H * 0.45,
          P_W / 4, p);
      if (decay) {                                   // marker plate
        box(0.05, 0.55, 0.55, decayM, -0.09, P_H * 0.55, 0, p);
      }
      // footing pad on elastomeric mounts at f_n = 1.5 Hz. Ledger 7 asked for
      // footing isolation; ledger 15 supplies the frequency, and the frequency
      // is the whole point - it must sit below f1/sqrt(2).
      box(1.3, 0.3, P_W + 0.6, conc, 0, -0.05, 0, p);
      for (const sz of [-1, 1]) {
        cyl(0.13, 0.13, 0.18, 8, hazardB, 0, 0.02, sz * (P_W / 2 + 0.1), p);
      }
    }
  }
  const aRad = new THREE.Object3D();
  aRad.name = 'poi_radiator';
  aRad.position.set(33.0, 5.6, 0);
  g.add(aRad);

  // ====================================================== CONTROL BUNKER =====
  // Sited BEHIND the mound: the hill is its shield. Windows face away from
  // the vault; the reactor is watched through a mast camera, not a window.
  const bunker = new THREE.Group();
  bunker.name = 'bunker';
  bunker.position.set(0, 0, -29.0);
  g.add(bunker);
  box(10.0, 3.0, 6.0, bunkerM, 0, 1.5, 0, bunker);
  box(10.8, 0.3, 6.8, bunkerM, 0, 3.1, 0, bunker);                // roof coping
  for (let i = 0; i < 3; i++) {                                   // window band
    const w = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.9, 0.12), winMat);
    w.position.set((i - 1) * 2.8, 1.9, -3.06);
    bunker.add(w);
  }
  box(1.2, 2.2, 0.25, liner, 3.6, 1.1, -3.1, bunker);             // door
  // its own berm on the reactor side
  for (let i = 0; i < 5; i++) {
    box(12 - i * 0.6, 0.5, 3.4 - i * 0.5, i % 2 ? regoB : regoA,
        0, 0.25 + i * 0.5, 3.6 + i * 0.25, bunker);
  }
  // mast camera looking over the hill
  cyl(0.09, 0.11, 6.0, 8, panelFr, -4.4, 3.0, 2.6, bunker);
  box(0.5, 0.35, 0.6, liner, -4.4, 6.1, 2.35, bunker);

  // ================================================= GRID ACCESS CUBICLE =====
  // The doorstep (MODELS.md): a few metres of stub toward the corridor, and
  // that is all. The G-R / G-S trenches are main control's to lay.
  const tie = new THREE.Group();
  tie.name = 'tie';
  tie.position.set(18.0, 0, 27.0);
  g.add(tie);
  box(4.6, 2.6, 2.2, liner, 0, 1.3, 0, tie);                       // switchgear
  box(5.0, 0.22, 2.6, panelFr, 0, 2.7, 0, tie);                    // rain hood
  for (let i = 0; i < 2; i++) {
    const w = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 0.1), winMat);
    w.position.set(i * 1.6 - 0.8, 1.75, 1.16); tie.add(w);
  }
  box(1.0, 0.4, 0.3, hazard, 1.6, 0.55, 1.15, tie);                // labels
  // DC power path in from the vault (copper), out to the corridor (+Z stub)
  box(2.0, 0.9, 3.2, conc, -3.4, 0.45, -2.0, tie);        // duct headwall at toe
  box(1.6, 0.26, 3.0, cablesM, -3.4, 0.62, -2.0, tie);    // DC pair, lids off
  box(2.2, 0.16, 3.2, conc, -3.4, 0.86, -2.0, tie);       // duct lids
  box(0.5, 0.9, 5.0, conc, 0, 0.45, 3.6, tie);                     // trench head
  box(0.30, 0.30, 5.4, cablesM, -0.3, 0.62, 3.8, tie);             // G-R stub
  box(0.22, 0.22, 5.4, cablesM,  0.3, 0.62, 3.8, tie);             // G-S stub
  box(1.4, 0.16, 5.2, conc, 0, 0.98, 3.7, tie);                    // trench lids
  const aTie = new THREE.Object3D();
  aTie.name = 'poi_tie';
  aTie.position.set(18.0, 3.0, 27.0);
  g.add(aTie);

  // ============================================ EXCLUSION FENCE + MARKERS ====
  const FX = 39.0, FZ = 33.0;
  const fence = new THREE.Group();
  fence.name = 'fence';
  g.add(fence);
  const postAt = (x, z) => {
    cyl(0.07, 0.09, 1.8, 6, panelFr, x, 0.9, z, fence);
  };
  // one span of fence between two points; `gate` leaves the middle open
  const runFence = (x0, z0, x1, z1, gate) => {
    const n = Math.max(2, Math.round(Math.hypot(x1 - x0, z1 - z0) / 6.4));
    const seg = gate ? [[0, 0.40], [0.60, 1]] : [[0, 1]];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      if (gate && t > 0.40 && t < 0.60) continue;
      postAt(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t);
    }
    for (const [a, b] of seg) {
      const ax = x0 + (x1 - x0) * a, az = z0 + (z1 - z0) * a;
      const bx = x0 + (x1 - x0) * b, bz = z0 + (z1 - z0) * b;
      for (const y of [0.62, 1.32]) {
        const r = new THREE.Mesh(new THREE.BoxGeometry(
          Math.abs(bx - ax) || 0.05, 0.05, Math.abs(bz - az) || 0.05), hazard);
        r.position.set((ax + bx) / 2, y, (az + bz) / 2);
        fence.add(r);
      }
    }
  };
  runFence(-FX, -FZ, FX, -FZ, false);
  runFence(-FX,  FZ, FX,  FZ, true);      // gate on the +Z (approach) side
  runFence(-FX, -FZ, -FX, FZ, false);
  runFence( FX, -FZ,  FX, FZ, false);

  // hazard-striped boundary markers at the corners + mid-sides
  const marker = (x, z, h = 3.4) => {
    const m = new THREE.Group();
    m.position.set(x, 0, z);
    for (let i = 0; i < 6; i++) {
      cyl(0.16, 0.17, h / 6, 6, i % 2 ? hazardB : hazard,
          0, h / 12 + i * h / 6, 0, m);
    }
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.20, 8, 6), beaconM);
    b.position.set(0, h + 0.18, 0);
    m.add(b);
    box(1.3, 0.9, 0.08, signW, 0, h * 0.62, 0.2, m);
    box(1.1, 0.16, 0.05, hazardB, 0, h * 0.70, 0.26, m);
    box(0.7, 0.16, 0.05, hazardB, 0, h * 0.52, 0.26, m);
    g.add(m);
    return m;
  };
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) marker(sx * FX, sz * FZ);
  marker(0, FZ + 0.0, 3.4);
  // two 9 m warning masts, on the approach axis
  for (const sx of [-1, 1]) {
    const mm = new THREE.Group();
    mm.position.set(sx * FX, 0, 0);
    cyl(0.10, 0.16, 9.0, 8, panelFr, 0, 4.5, 0, mm);
    for (const yy of [3.2, 6.4]) {
      box(1.6, 0.08, 0.08, panelFr, 0, yy, 0, mm);
    }
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 6), beaconM);
    b.position.set(0, 9.2, 0);
    mm.add(b);
    g.add(mm);
  }

  // radiation trefoil signboards facing the approach
  for (const sx of [-8, 8]) {
    const s = new THREE.Group();
    s.position.set(sx, 0, FZ - 1.2);
    cyl(0.06, 0.06, 2.0, 6, panelFr, -0.5, 1.0, 0, s);
    cyl(0.06, 0.06, 2.0, 6, panelFr, 0.5, 1.0, 0, s);
    box(1.9, 1.3, 0.07, hazard, 0, 1.75, 0, s);
    for (let i = 0; i < 3; i++) {                      // trefoil blades
      const a = i * (Math.PI * 2 / 3);
      const bl = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.52, 0.04), hazardB);
      bl.position.set(Math.sin(a) * 0.30, 1.75 + Math.cos(a) * 0.30, 0.06);
      bl.rotation.z = -a;
      s.add(bl);
    }
    cyl(0.10, 0.10, 0.05, 8, hazardB, 0, 1.75, 0.07, s).rotation.x = Math.PI / 2;
    g.add(s);
  }

  // ---------------------------------------------------- worked-in site detail
  // scattered gravel from the excavation, deterministic
  for (let i = 0; i < 24; i++) {
    const r = 26 + rnd() * 12, a = rnd() * Math.PI * 2;
    const s = 0.12 + rnd() * 0.22;
    const st = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0),
                              rnd() > 0.5 ? regoB : regoCut);
    st.position.set(Math.sin(a) * r, 0.17 + 1.62 * s * 0.35, Math.cos(a) * r * 0.8);
    st.rotation.y = rnd() * 3.14;
    g.add(st);
  }
  // spoil / borrow heap on the west side, the material the berm came from
  for (let i = 0; i < 5; i++) {
    cyl(2.4 - i * 0.45, 3.1 - i * 0.45, 0.5, 9, i % 2 ? regoA : regoB,
        -34, 0.3 + i * 0.5, -28, g);
  }

  // POI anchors that have no natural node
  const anchor = (name, x, y, z) => {
    const o = new THREE.Object3D();
    o.name = name;
    o.position.set(x, y, z);
    g.add(o);
  };
  anchor('poi_berm', 0, CREST_Y + 0.6, -6.0);
  anchor('poi_gap', -8, 2.0, FZ - 1.2);
  anchor('poi_crop', 8, 2.0, FZ - 1.2);
  anchor('poi_seis', -FX, 5.0, 0);

  // ------------------------------------------------------- dust film pass ---
  for (const m of dustMats) m.color.lerp(new THREE.Color(0x9e5b3d), 0.05);

  // --------------------------------------------------------- declarations ---
  g.userData.nightMats = nightMats;
  g.userData.blinkMats = blinkMats;
  // The opposed Stirling pair, animated in antiphase. There is no flywheel on
  // this plant and that is the point (see the convert card) - the visible motion
  // is the piston pair cancelling its own reaction force. Slowed ~120x from the
  // real 102 Hz so the eye can read it, exactly as pwr-storage-01 states for its
  // flywheels.
  g.userData.oscillators = pistonNodes.map((p) => ({
    node: p.name, prop: 'position', axis: 'x',
    amp: p.amp, period: 1.2, phase: 0,
  }));
  g.userData.lights = [
    { color: 0xffca7a, pos: [0, 3.2, -25.6], range: 22 },   // bunker apron
    { color: 0xffca7a, pos: [18, 3.0, 27.0], range: 18 },   // access cubicle
    { color: 0x8fd4ff, pos: [0, 2.5, 5.0], range: 30 },     // open vault bay
  ];

  return g;
}
