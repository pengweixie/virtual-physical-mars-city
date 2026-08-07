// viewer/units/sci-thz-01.js — 183 GHz 水汽廓线辐射计（摆镜扫描）
// 183 GHz water-vapor profiling radiometer: horizontal quasi-optical tube
// (receiver bay -> parabola -> feed horn) ending in a scan-mirror drum that
// rotates about the tube axis — zenith ladder 0/30/48/60/70.5 deg, then a
// 180-deg swing straight down into the ground calibration blackbody.
// Cutaways: receiver bay (Schottky mixer / LO chain / FFTS board) and tube
// (off-axis paraboloid + gold beam line). FFTS door screen draws the narrow
// martian line (37 MHz vs Earth's 3 GHz).
// Design ledger: mars-thz (5 accounts + HFSS horn full-wave).
// Sited with sci-weather-01 (300,-300): dust is transparent at 183 GHz;
// the met station's T(z) de-biases storm-time retrievals (linkage card).
// Contract: MODELS.md §4 — 1 unit = 1 m, THREE injected, no textures.

export const meta = {
  id: 'sci-thz-01',
  name: '太赫兹水汽廓线辐射计',
  name_en: '183 GHz Water-Vapor Radiometer',
  size_m: 3.34,              // measured bbox max edge (validate 复核)
  effects: ['glow_windows', 'blink'],
};

export function build(THREE) {
  const group = new THREE.Group();

  let _seed = 20260807;
  const rnd = () => { _seed = (_seed * 16807) % 2147483647; return _seed / 2147483647; };

  // ---------------------------------------------------------------- materials
  const M = {
    shell:  new THREE.MeshLambertMaterial({ color: 0xcfc8ba }),
    shell2: new THREE.MeshLambertMaterial({ color: 0xb8b0a0 }),
    steel:  new THREE.MeshLambertMaterial({ color: 0x6e7681 }),
    dark:   new THREE.MeshLambertMaterial({ color: 0x3a3f46 }),
    orange: new THREE.MeshLambertMaterial({ color: 0xd97b29 }),
    copper: new THREE.MeshLambertMaterial({ color: 0xa5673f }),
    gold:   new THREE.MeshLambertMaterial({ color: 0xcfa348, emissive: 0x3a1e0f, emissiveIntensity: 0.25 }),
    mirror: new THREE.MeshLambertMaterial({ color: 0xdfe4ea, emissive: 0x2a3038, emissiveIntensity: 0.4 }),
    inner:  new THREE.MeshLambertMaterial({ color: 0x565c66, emissive: 0x20242a, emissiveIntensity: 0.35 }),
    innerB: new THREE.MeshLambertMaterial({ color: 0x565c66, emissive: 0x20242a, emissiveIntensity: 0.35, side: 1 /*BackSide*/ }),
    absorb: new THREE.MeshLambertMaterial({ color: 0x14161a, emissive: 0x0a0b0d, emissiveIntensity: 0.3 }),
    heater: new THREE.MeshLambertMaterial({ color: 0x8a4a2f, emissive: 0x341507, emissiveIntensity: 0.3 }),
  };

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
  const poi = (name, x, y, z) => {
    const a = new THREE.Object3D();
    a.name = name; a.position.set(x, y, z); group.add(a);
  };

  const nightMats = [];
  const blinkMats = [];
  const AX = 0.0;              // optical axis height offset ref (tube z)
  const TZ = 0.0;              // tube z-plane
  const TY = 1.5;              // optical axis height
  const DX = 0.55;             // drum axis x

  // ---------------------------------------------------------------- pad + skid
  box(3.2, 0.14, 2.4, M.shell2, 0, 0.07, 0);
  box(3.3, 0.05, 2.5, M.steel, 0, 0.16, 0);
  for (const [px, pz] of [[-1.45, -1.0], [1.45, -1.0], [-1.45, 1.0], [1.45, 1.0]])
    box(0.18, 0.1, 0.18, M.dark, px, 0.05, pz);
  for (const px of [-1.5, 1.5]) {
    cyl(0.035, 0.035, 0.55, 8, M.orange, px, 0.45, 1.15);
    cyl(0.05, 0.05, 0.05, 8, M.dark, px, 0.72, 1.15);
  }
  for (let i = 0; i < 9; i++) {
    const s = 0.03 + rnd() * 0.05;
    const g = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), M.shell2);
    g.position.set((rnd() - 0.5) * 4.2, 0.02 + 1.62 * s * 0.5, (rnd() - 0.5) * 3.4);
    g.rotation.y = rnd() * Math.PI;
    group.add(g);
  }

  // ================================================================ receiver bay
  // pedestal cabinet at -X end; front (+Z) face open: mixer-first chain.
  const RX = -0.85;
  box(0.7, 1.14, 0.62, M.shell, RX, 0.72, TZ);
  box(0.72, 0.06, 0.64, M.shell2, RX, 1.32, TZ);               // top cap strip
  box(0.72, 0.08, 0.64, M.shell2, RX, 0.19, TZ);               // bottom skirt
  box(0.72, 0.24, 0.64, M.gold, RX, 1.14, TZ);                 // MLI thermal wrap band
  for (let i = 0; i < 5; i++)                                   // anti-sun radiator fins (-Z)
    box(0.5, 0.3, 0.015, M.dark, RX, 0.62, TZ - 0.33 - i * 0.028);
  // cutaway window + interior
  box(0.52, 0.62, 0.05, M.inner, RX, 0.78, TZ + 0.29);
  box(0.16, 0.12, 0.1, M.gold, RX - 0.14, 0.62, TZ + 0.28);    // subharmonic Schottky mixer
  box(0.2, 0.1, 0.09, M.copper, RX + 0.12, 0.6, TZ + 0.28);    // 91.655 GHz LO doubler chain
  box(0.26, 0.07, 0.08, M.dark, RX + 0.02, 0.97, TZ + 0.28);   // IF amp + FFT spectrometer
  cyl(0.012, 0.012, 0.28, 6, M.copper, RX - 0.02, 0.61, TZ + 0.29).rotation.z = Math.PI / 2;
  // feed horn: wide mouth pointing +X into the tube
  const horn = cyl(0.06, 0.018, 0.24, 12, M.gold, RX + 0.42, TY, TZ);
  horn.rotation.z = -Math.PI / 2;

  // ================================================================ tube
  // horizontal quasi-optical tube, front-open cutaway (gap faces +Z)
  const tubeLen = 0.85, tubeR = 0.22, tubeX = 0.02;
  for (const [mat, r, len] of [[M.shell, tubeR, tubeLen], [M.innerB, tubeR - 0.014, tubeLen - 0.02]]) {
    const sh = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r, len, 20, 1, true, Math.PI * 0.22, Math.PI * 1.56),
      mat);
    sh.rotation.z = Math.PI / 2;               // axis -> X; gap stays centered +Z
    sh.position.set(tubeX, TY, TZ);
    group.add(sh);
  }
  // NOTE gap check: cylinder circumference x=r·sinθ, z=r·cosθ; after
  // rotation.z=+90deg the circle lives in (y=r·sinθ, z=r·cosθ): covered arc
  // θ∈[0.22π,1.78π] leaves the gap centered at θ=0 → +Z. Front-open ✓.
  // off-axis paraboloid: tilted dish between horn and drum
  const dish = cyl(0.16, 0.19, 0.05, 18, M.mirror, tubeX - 0.18, TY, TZ - 0.03);
  dish.rotation.z = 1.15;
  dish.rotation.y = 0.25;
  // static in-tube beam line horn -> drum (gold pencil)
  const beamMat = new THREE.MeshLambertMaterial({
    color: 0xcfa348, emissive: 0x8a5a18, emissiveIntensity: 0.55,
    transparent: true, opacity: 0.35 });
  const tubeBeam = cyl(0.012, 0.012, 1.0, 6, beamMat, 0.05, TY, TZ);
  tubeBeam.rotation.z = Math.PI / 2;
  // tube support column: box core + corner angle ribs + base gussets
  box(0.2, 1.3, 0.2, M.steel, tubeX, 0.72, TZ - 0.0);
  for (const [ox, oz] of [[-0.11, -0.11], [0.11, -0.11], [-0.11, 0.11], [0.11, 0.11]])
    box(0.04, 1.32, 0.04, M.dark, tubeX + ox, 0.72, TZ + oz);
  for (const oz of [-0.16, 0.16])
    box(0.3, 0.12, 0.04, M.steel, tubeX, 0.2, TZ + oz);
  box(0.05, 0.05, 0.9, M.steel, tubeX, 1.0, TZ + 0.35).rotation.x = 0.9;

  // ================================================================ scan head
  // yoke: flange at tube end + outer bearing plate + stepper pod
  cyl(0.26, 0.26, 0.05, 20, M.shell2, DX - 0.24, TY, TZ).rotation.z = Math.PI / 2;
  box(0.06, 0.62, 0.5, M.shell, DX + 0.28, TY - 0.08, TZ);
  box(0.5, 0.06, 0.5, M.shell, DX + 0.05, TY - 0.36, TZ);
  box(0.14, 0.18, 0.18, M.dark, DX + 0.38, TY, TZ);            // stepper + encoder
  cyl(0.03, 0.03, 0.1, 8, M.steel, DX + 0.32, TY, TZ).rotation.z = Math.PI / 2;

  // pivot rotates about X: 0 = zenith, +a = ladder toward +Z, 180 = blackbody
  const pivot = new THREE.Group();
  pivot.name = 'scan_drum';
  pivot.position.set(DX, TY, TZ);
  group.add(pivot);
  // drum shell: slot centered on +Y (beam exit); covered arc θ∈[0.68π,2.32π]
  for (const [mat, r, len] of [[M.shell, 0.24, 0.4], [M.innerB, 0.228, 0.39]]) {
    const sh = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r, len, 20, 1, true, Math.PI * 0.68, Math.PI * 1.64),
      mat);
    sh.rotation.z = Math.PI / 2;
    pivot.add(sh);
  }
  // end caps
  for (const ex of [-0.2, 0.2]) {
    const cap = new THREE.Mesh(new THREE.CircleGeometry(0.24, 20), M.shell);
    cap.position.x = ex;
    cap.rotation.y = ex > 0 ? Math.PI / 2 : -Math.PI / 2;
    pivot.add(cap);
  }
  // 45-deg fold mirror: reflects tube beam (+X) into slot direction (+Y);
  // normal (1,-1,0)/√2 via quaternion, elliptical footprint
  const mir = new THREE.Mesh(new THREE.CircleGeometry(0.15, 20), M.mirror);
  mir.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1),
                                    new THREE.Vector3(1, -1, 0).normalize());
  mir.scale.y = 1.41;
  pivot.add(mir);
  const mirBack = new THREE.Mesh(new THREE.CircleGeometry(0.15, 20), M.dark);
  mirBack.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1),
                                        new THREE.Vector3(-1, 1, 0).normalize());
  mirBack.scale.y = 1.41;
  mirBack.position.set(-0.006, 0.006, 0);
  pivot.add(mirBack);
  // sky beam out of the slot (child of pivot; scaled short for calibration)
  const beamGrp = new THREE.Group();
  pivot.add(beamGrp);
  const BEAM_LEN = 1.35, BEAM_OFF = 0.25 + 0.675;
  const BEAM_TIP = BEAM_OFF + BEAM_LEN / 2;   // axis -> far end at scale 1 = 1.6
  cyl(0.014, 0.022, BEAM_LEN, 6, beamMat, 0, BEAM_OFF, 0, beamGrp);
  // rear dust visor (static, on yoke; clear of beam angles 0-70.5 and 180)
  const visor = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.34, 0.55, 16, 1, true, Math.PI * 0.6, Math.PI * 0.7),
    M.shell2);
  visor.rotation.z = Math.PI / 2;
  visor.position.set(DX, TY, TZ);
  group.add(visor);

  // ================================================================ blackbody
  // ground calibration target straight below the drum, opening up
  const bbY = 0.26;
  const bbGrp = new THREE.Group();
  bbGrp.position.set(DX, bbY, TZ);
  group.add(bbGrp);
  box(0.4, 0.18, 0.4, M.shell, 0, -0.04, 0, bbGrp);
  box(0.34, 0.02, 0.34, M.heater, 0, 0.06, 0, bbGrp);          // heater backplate
  for (let i = -1; i <= 1; i++)
    for (let j = -1; j <= 1; j++) {
      const c = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.11, 6), M.absorb);
      c.position.set(i * 0.105, 0.12, j * 0.105);
      bbGrp.add(c);
    }
  // PT100 conduit from blackbody to receiver bay
  cyl(0.015, 0.015, 1.35, 6, M.dark, (DX + RX) / 2, 0.2, TZ - 0.18).rotation.z = Math.PI / 2;

  // ================================================================ cabinet
  const CX = 1.05, CZ = -0.7;
  box(0.7, 1.0, 0.5, M.shell, CX, 0.66, CZ);
  box(0.72, 0.06, 0.52, M.shell2, CX, 1.19, CZ);
  box(0.72, 0.08, 0.52, M.shell2, CX, 0.2, CZ);
  box(0.015, 0.78, 0.02, M.dark, CX + 0.1, 0.66, CZ + 0.26);   // door seam
  box(0.05, 0.1, 0.03, M.steel, CX + 0.16, 0.6, CZ + 0.26);    // latch
  for (const hy of [0.42, 0.92]) box(0.03, 0.08, 0.03, M.steel, CX - 0.24, hy, CZ + 0.25);
  // FFTS screen: the narrow martian line as emissive bars
  const scr = new THREE.MeshLambertMaterial({ color: 0x0c1620, emissive: 0x0c1620, emissiveIntensity: 1 });
  box(0.34, 0.24, 0.02, scr, CX - 0.1, 0.9, CZ + 0.26);
  nightMats.push(scr);
  const lineMat = new THREE.MeshLambertMaterial({ color: 0x39c1d8, emissive: 0x1a95aa, emissiveIntensity: 0.8 });
  const H_BAR = [0.02, 0.03, 0.05, 0.09, 0.16, 0.09, 0.05, 0.03, 0.02];
  H_BAR.forEach((h, i) => {
    box(0.024, h, 0.012, lineMat, CX - 0.1 + (i - 4) * 0.033, 0.81 + h / 2, CZ + 0.272);
  });
  nightMats.push(lineMat);
  // status lamps: green = met-station link, amber = storm mode (blink)
  const lampG = new THREE.MeshLambertMaterial({ color: 0x2ecc71, emissive: 0x1a7a43, emissiveIntensity: 0.8 });
  const lampA = new THREE.MeshLambertMaterial({ color: 0xe8a23a, emissive: 0x9a6a1e, emissiveIntensity: 0.6 });
  box(0.05, 0.05, 0.02, lampG, CX + 0.16, 1.08, CZ + 0.26);
  box(0.05, 0.05, 0.02, lampA, CX + 0.24, 1.08, CZ + 0.26);
  nightMats.push(lampG);
  blinkMats.push(lampA);
  // side vent fan (spinner about X)
  const fan = new THREE.Group();
  fan.name = 'cab_fan';
  fan.position.set(CX + 0.36, 0.8, CZ);
  group.add(fan);
  for (let i = 0; i < 4; i++) {
    const bl = box(0.015, 0.13, 0.05, M.dark, 0, 0, 0, fan);
    bl.position.set(0, 0.05 * Math.cos(i * Math.PI / 2), 0.05 * Math.sin(i * Math.PI / 2));
    bl.rotation.x = i * Math.PI / 2 + 0.5;
  }
  cyl(0.09, 0.09, 0.02, 12, M.steel, CX + 0.37, 0.8, CZ).rotation.z = Math.PI / 2;
  // cable tray heading NE off-pad toward sci-weather-01, junction box at edge
  const tray = box(0.85, 0.06, 0.12, M.steel, CX + 0.25, 0.1, CZ + 0.05);
  tray.rotation.y = -0.55;
  box(0.16, 0.22, 0.12, M.dark, CX + 0.52, 0.15, CZ - 0.32);
  // receiver-bay -> cabinet power/data run
  cyl(0.018, 0.018, 1.9, 6, M.dark, (RX + CX) / 2, 0.22, (TZ + CZ) / 2)
    .rotation.set(0, Math.atan2(CX - RX, CZ - TZ) - Math.PI / 2, Math.PI / 2);

  // ================================================================ POI anchors
  poi('poi_scanhead', DX, TY + 0.55, TZ);
  poi('poi_frost', DX - 0.34, TY + 0.1, TZ + 0.3);   // mirror + heater foil
  poi('poi_optics', tubeX, TY + 0.1, TZ + 0.4);
  poi('poi_receiver', RX, 0.8, TZ + 0.45);
  poi('poi_blackbody', DX, bbY + 0.25, TZ + 0.25);
  poi('poi_link', CX, 1.0, CZ + 0.35);

  // ================================================================ animation
  // Pure-t loop, no accumulated state: zenith ladder 0/30/48.2/60/70.5 deg
  // (airmass 1/1.15/1.5/2/3, account 4), then 180 deg = stare into the ground
  // blackbody (two-point calibration), then home. Display mapping: drum angle
  // = zenith angle for readability; the physical fold mirror moves za/2
  // (stated on the knowledge card).
  const D2R = Math.PI / 180;
  // 140 deg = the ground stop, i.e. 50 deg below horizontal. From the 1.5 m drum
  // axis that puts the footprint at 1.96 m slant range — the 2 m account 10 works
  // with. (A first pass used 110 deg, but that is only 20 deg below horizontal and
  // would not reach ground until 4.4 m, so the geometry did not match the ledger.)
  // At 2 m the ground is far inside the 27.5 m Fraunhofer distance, so this is a
  // near-field stare measuring ground BRIGHTNESS — not far-field sidelobe coupling,
  // which is retrieved from the six-channel spectral signature instead. Scheduled
  // at LTST 4.6 h where the 183 GHz brightness crosses sci-ir-01's 8-14 um skin
  // temperature; that same pre-dawn posture is the anti-dust park position and the
  // hour the mirror heater runs against frost (account 6).
  const KEY_T = [0, 3, 5.5, 8, 10.5, 13, 15.5, 17.5, 20, 22.5, 23.5, 24];  // s
  const KEY_A = [0, 0, 30, 48.2, 60, 70.5, 140, 140, 180, 180, 2, 0];      // deg
  const T_SCAN = 24;
  const smooth = (a, b, u) => a + (b - a) * (u * u * (3 - 2 * u));
  group.userData.animate = (t) => {
    const tt = ((t % T_SCAN) + T_SCAN) % T_SCAN;
    let a = 0;
    for (let i = 0; i < KEY_T.length - 1; i++) {
      if (tt >= KEY_T[i] && tt <= KEY_T[i + 1]) {
        const u = Math.min(1, (tt - KEY_T[i]) / Math.max(0.6, (KEY_T[i + 1] - KEY_T[i]) * 0.55));
        a = smooth(KEY_A[i], KEY_A[i + 1], u);
        break;
      }
    }
    pivot.rotation.x = a * D2R;
    // Beam length tracks what it is actually looking at. Below horizontal the
    // pencil is stretched to exactly reach the regolith — length = axis height /
    // |cos a| — so it terminates ON the ground at every angle instead of either
    // stopping in mid-air or (with a fixed 1.45x stretch) punching through it
    // during the sweep to the blackbody. Inside the blackbody it is cut short.
    const bb = a > 165;
    const gnd = a > 100 && !bb;
    // BEAM_TIP = distance from the drum axis to the pencil's far end at scale 1:
    // the cylinder is 1.35 long but offset, so it is (0.25+0.675)+0.675 = 1.6,
    // not 1.35. Using 1.35 here let the beam overshoot and punch 0.29 m through
    // the ground mid-sweep — caught by the full-cycle envelope scan, not by eye.
    beamGrp.scale.y = bb ? 0.90
                    : gnd ? Math.min((TY - 0.03) / (Math.abs(Math.cos(a * D2R)) * BEAM_TIP), 1.45)
                    : 1.0;
    beamMat.opacity = bb ? 0.18 : gnd ? 0.30 : 0.35;
  };
  group.userData.spinners = [{ node: 'cab_fan', axis: 'x', rpm: 18 }];
  group.userData.nightMats = nightMats;
  group.userData.blinkMats = blinkMats;
  group.userData.lights = [{ color: 0x9fd8ff, pos: [CX, 1.1, CZ + 0.6], range: 6 }];

  // dust film pass — once per unique material (shared mats must not stack)
  const seen = new Set();
  group.traverse((o) => {
    if (o.isMesh && o.material && o.material.color && !o.material.transparent && !seen.has(o.material)) {
      seen.add(o.material);
      o.material.color.lerp(new THREE.Color(0x9e5b3d), 0.05);
    }
  });

  return group;
}
