// viewer/units/res-cryo-01.js
// 低温推进剂罐区与转运站 — Cryogenic Propellant Farm & Transfer Station
//
// Design ledger: E:\Claude\mars-cryo (8 accounts, sim/01-08).  The shape of
// this building is an argument.  There is no cryogenic pipeline leaving it:
// a 547 m liquid line at the city's trickle flow loses 68 % of what it carries
// (account 2) while a road tanker loses 1.0 % per trip (account 3).  Warm gas
// arrives from res-isru-01 on a bare 105 m manifold at the back; liquid leaves
// on wheels from the apron at the front.
//
// 1 unit = 1 m.  Origin = ground centre of the site, +Y up, front (road/apron
// side) faces +Z, gas header faces -Z.  No imports, no textures.

export const meta = {
  id: 'res-cryo-01',
  name: '低温推进剂罐区与转运站',
  name_en: 'Cryogenic Propellant Farm & Transfer Station',
  size_m: 84.5,
  effects: ['glow_windows'],
};

export function build(THREE) {
  const g = new THREE.Group();

  // ------------------------------------------------------------- utilities
  let _seed = 20260809;
  const rnd = () => { _seed = (_seed * 16807) % 2147483647; return _seed / 2147483647; };
  const hash3 = (x, y, z) => {
    const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
    return s - Math.floor(s);
  };
  const vnoise = (x, y, z) => {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const xf = x - xi, yf = y - yi, zf = z - zi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
    let a = 0;
    for (let dx = 0; dx <= 1; dx++) for (let dy = 0; dy <= 1; dy++) for (let dz = 0; dz <= 1; dz++)
      a += hash3(xi + dx, yi + dy, zi + dz) * (dx ? u : 1 - u) * (dy ? v : 1 - v) * (dz ? w : 1 - w);
    return a;
  };

  const M = {
    lox:     new THREE.MeshLambertMaterial({ color: 0xe9eff4 }),
    loxIn:   new THREE.MeshLambertMaterial({ color: 0xaeb9c2, side: THREE.DoubleSide }),
    loxBand: new THREE.MeshLambertMaterial({ color: 0x3f77b0 }),
    ch4:     new THREE.MeshLambertMaterial({ color: 0xccd2cd }),
    ch4Band: new THREE.MeshLambertMaterial({ color: 0x4d9a5f }),
    jacket:  new THREE.MeshLambertMaterial({ color: 0xe9eff4, side: THREE.DoubleSide }),
    mli:     new THREE.MeshLambertMaterial({ color: 0xcaa23f, emissive: 0x2a2008,
                                             side: THREE.DoubleSide }),
    liq:     new THREE.MeshLambertMaterial({ color: 0x76aed4, emissive: 0x142838,
                                             side: THREE.DoubleSide }),
    steel:   new THREE.MeshLambertMaterial({ color: 0x99a1a8 }),
    dark:    new THREE.MeshLambertMaterial({ color: 0x434a50 }),
    darker:  new THREE.MeshLambertMaterial({ color: 0x2a2f33 }),
    orange:  new THREE.MeshLambertMaterial({ color: 0xd0692a }),
    hull:    new THREE.MeshLambertMaterial({ color: 0xb2ada3 }),
    cold:    new THREE.MeshLambertMaterial({ color: 0xc6ccd2 }),
    rad:     new THREE.MeshLambertMaterial({ color: 0x353b40 }),
    window:  new THREE.MeshLambertMaterial({ color: 0xffd9a0, emissive: 0x8a6222 }),
    lampG:   new THREE.MeshLambertMaterial({ color: 0x86e492, emissive: 0x11401a }),
    lampR:   new THREE.MeshLambertMaterial({ color: 0xe25c4a, emissive: 0x3c1310 }),
    lampW:   new THREE.MeshLambertMaterial({ color: 0xf0efe6, emissive: 0x6e6a55 }),
    rubber:  new THREE.MeshLambertMaterial({ color: 0x23272a }),
    gas:     new THREE.MeshLambertMaterial({ color: 0x8d949a }),
  };

  const box = (w, h, d, mat, x, y, z, parent) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    (parent || g).add(m);
    return m;
  };
  const cyl = (r1, r2, h, seg, mat, x, y, z, parent) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), mat);
    m.position.set(x, y, z);
    (parent || g).add(m);
    return m;
  };
  const _ba = new THREE.Vector3(), _bb = new THREE.Vector3();
  const beam = (ax, ay, az, bx, by, bz, w, mat, parent) => {
    _ba.set(ax, ay, az); _bb.set(bx, by, bz);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, w, _ba.distanceTo(_bb) + w * 0.6), mat);
    m.position.copy(_ba).lerp(_bb, 0.5);
    m.lookAt(_bb);
    (parent || g).add(m);
    return m;
  };
  const poi = (name, x, y, z) => {
    const a = new THREE.Object3D();
    a.name = 'poi_' + name;
    a.position.set(x, y, z);
    g.add(a);
  };

  const nightMats = [], blinkMats = [], spinners = [], oscillators = [], lights = [];

  // --------------------------------------------------- graded site platform
  // Two-scale vertex noise on a big plane: rust base, paler compacted tracks.
  {
    const geo = new THREE.PlaneGeometry(82, 64, 18, 14);
    geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position, col = new Float32Array(p.count * 3);
    const cA = new THREE.Color(0x7d4a34), cB = new THREE.Color(0x9c6748), t = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      p.setY(i, 0.10 + 0.10 * vnoise(x * 0.11, 0, z * 0.11));
      const n = 0.62 * vnoise(x * 0.14, 3, z * 0.14) + 0.38 * vnoise(x * 0.9, 7, z * 0.9);
      t.copy(cA).lerp(cB, Math.min(1, Math.max(0, n * 0.9 + 0.08)));
      col[i * 3] = t.r; col[i * 3 + 1] = t.g; col[i * 3 + 2] = t.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeVertexNormals();
    g.add(new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true })));
  }

  // ----------------------------------------------------------- bunded bays
  // Account 7a: the bund is not a temporary containment on Mars.  A spilled
  // LOX pool takes 3.3 days to clear (17x Earth) because there is no
  // convection to boil it, so the dike is sized 2.5x the 110 % rule and the
  // inventory is split across four vessels instead of one.
  function bund(cx, cz, w, d, hDike, tag) {
    const t = 1.8;
    const floor = new THREE.Mesh(new THREE.BoxGeometry(w, 0.22, d), M.hull);
    floor.position.set(cx, 0.30, cz);
    floor.material = new THREE.MeshLambertMaterial({ color: 0x8b7f72 });
    g.add(floor);
    for (const [dx, dz, ww, dd] of [[0, -d / 2, w + t, t], [0, d / 2, w + t, t],
                                    [-w / 2, 0, t, d], [w / 2, 0, t, d]]) {
      box(ww, hDike, dd, M.hull, cx + dx, hDike / 2 + 0.2, cz + dz);
      box(ww + 0.2, 0.18, dd + 0.2, M.orange, cx + dx, hDike + 0.29, cz + dz);  // coping
    }
    // sump + drain at the low corner, and a bay placard
    cyl(0.9, 0.9, 0.5, 10, M.darker, cx - w / 2 + 3, 0.35, cz + d / 2 - 3);
    const sm = new THREE.MeshLambertMaterial({
      color: tag === 'lox' ? 0x3f77b0 : 0x4d9a5f,
      emissive: tag === 'lox' ? 0x14314f : 0x143d1e });
    box(2.6, 1.1, 0.12, sm, cx, 2.2, cz + d / 2 + 1.0);
    nightMats.push(sm);
    // stair over the dike (two flights of treads)
    for (let i = 0; i < 5; i++)
      box(1.4, 0.12, 0.34, M.steel, cx + w / 2 + 0.9, 0.35 + i * 0.26, cz - d / 2 + 3 + i * 0.36);
  }
  bund(-26, -4, 33, 28, 1.2, 'lox');
  bund(21.5, -4, 29, 26, 1.2, 'ch4');

  // ------------------------------------------------------- storage spheres
  // Vacuum-jacketed, 60-layer MLI (account 5b: 0.0076 %/sol, 2.3x better than
  // the identical vessel on Earth purely because ambient is 210 K not 300 K).
  function skirt(cx, cz, r, yc, mat) {
    const h = yc - r * 0.55;
    cyl(r * 0.72, r * 0.86, h, 12, mat, cx, h / 2 + 0.42, cz);
    // ventilation slots in the skirt so it reads as a support, not a plinth
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.2;
      box(0.9, 1.5, 0.16, M.darker,
          cx + Math.cos(a) * r * 0.82, h * 0.55, cz + Math.sin(a) * r * 0.82)
        .rotation.y = -a;
    }
    // G-10 pad ring, called out because account 5b says the skirt is 13 % of
    // the whole heat leak and it is the only conduction path that is a choice
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      box(0.5, 0.34, 0.5, M.orange,
          cx + Math.cos(a) * r * 0.79, h + 0.55, cz + Math.sin(a) * r * 0.79);
    }
  }

  function sphere(cx, cz, r, kind, cut) {
    const yc = r + 2.4;
    const jm = kind === 'lox' ? M.lox : M.ch4;
    const bm = kind === 'lox' ? M.loxBand : M.ch4Band;
    skirt(cx, cz, r, yc, M.steel);
    if (!cut) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 10), jm);
      s.position.set(cx, yc, cz);
      g.add(s);
    } else {
      // ---- cutaway quadrant: jacket -> vacuum annulus -> MLI -> inner shell
      // -> liquid.  Account 6c is why the annulus exists at all: any bare cold
      // surface on Mars cryo-pumps CO2 out of the atmosphere and grows a
      // dry-ice coat that makes the heat leak 4.8x WORSE, not better.
      // the quadrant is removed on the +X/+Z side so the section faces the
      // apron: whoever walks up to load a tanker is looking into the vessel
      // three.js sphere: phi=0 is -X, phi=pi/2 is +Z, phi=pi is +X
      const gapC = Math.PI * 0.74, gapW = Math.PI * 0.52;
      const phi0 = gapC + gapW / 2, phiL = Math.PI * 2 - gapW;
      const shells = [
        [r, 18, 10, M.jacket],            // outer vacuum jacket
        [r * 0.960, 14, 8, M.mli],       // MLI blanket, 60 layers
        [r * 0.930, 14, 8, M.mli],
        [r * 0.88, 14, 8, M.loxIn],      // inner pressure vessel
      ];
      for (const [rr, ws, hs, mm] of shells) {
        const s = new THREE.Mesh(new THREE.SphereGeometry(rr, ws, hs, phi0, phiL), mm);
        s.position.set(cx, yc, cz);
        g.add(s);
      }
      // liquid: a bowl whose rim is the fill level (78 %) + a flat surface disc
      const th0 = 0.92;
      const liq = new THREE.Mesh(
        new THREE.SphereGeometry(r * 0.865, 14, 7, phi0, phiL, th0, Math.PI - th0), M.liq);
      liq.position.set(cx, yc, cz);
      g.add(liq);
      const rl = r * 0.865 * Math.sin(th0);
      const disc = new THREE.Mesh(new THREE.CircleGeometry(rl, 16), M.liq);
      disc.rotation.x = -Math.PI / 2;
      disc.position.set(cx, yc + r * 0.865 * Math.cos(th0), cz);
      g.add(disc);
    }
    // equator service band + top manway + jacket pump-out port
    // (r*1.03 so the band's flat facets clear the sphere's vertices — at equal
    //  radius the polyhedral sphere pokes through the polyhedral band)
    const bandGeo = cut
      ? new THREE.CylinderGeometry(r * 1.03, r * 1.03, 0.62, 18, 1, false,
                                   Math.PI * 0.52, Math.PI * 2 - Math.PI * 0.52)
      : new THREE.CylinderGeometry(r * 1.03, r * 1.03, 0.62, 18);
    const bandM = new THREE.Mesh(bandGeo, bm);
    bandM.position.set(cx, yc, cz);
    g.add(bandM);
    cyl(0.55, 0.55, 0.5, 10, M.steel, cx, yc + r + 0.2, cz);
    box(1.1, 0.14, 1.1, M.dark, cx, yc + r + 0.5, cz);
    cyl(0.16, 0.16, 1.1, 8, M.steel, cx + r * 0.62, yc + r * 0.76, cz);  // pump-out stub
    box(0.42, 0.42, 0.42, M.orange, cx + r * 0.62, yc + r * 0.76 + 0.6, cz);
    // level indicator column with three lamps (blink: the tank is filling)
    const colX = cx - r * 0.98;
    cyl(0.10, 0.10, r * 1.5, 6, M.steel, colX, yc, cz + r * 0.34);
    for (let i = 0; i < 3; i++) {
      const lm = new THREE.MeshLambertMaterial({
        color: i < 2 ? 0x86e492 : 0xe2b34a, emissive: i < 2 ? 0x11401a : 0x3a2a08 });
      cyl(0.20, 0.20, 0.24, 8, lm, colX, yc - r * 0.55 + i * r * 0.55, cz + r * 0.34)
        .rotation.z = Math.PI / 2;
      nightMats.push(lm);
      if (i === 2) blinkMats.push(lm);
    }
    // bottom fill/drain line down the skirt into the header trench
    cyl(0.13, 0.13, 2.6, 8, M.steel, cx + r * 0.30, 1.4, cz + r * 0.62);
    return yc;
  }

  sphere(-34, -4, 4.8, 'lox', false);
  sphere(-18, -4, 4.8, 'lox', true);                  // sectioned vessel
  sphere(14.5, -4, 4.4, 'ch4', false);
  sphere(28.5, -4, 4.4, 'ch4', false);
  poi('lox_bay', -26, 12.4, -4);
  poi('ch4_bay', 21.5, 11.6, -4);

  // ------------------------------------------------------- sunshade canopy
  // Account 6c: the canopy's job is as much to keep the JACKET isothermal as
  // to keep the sun off — an 80 K diurnal swing on a 547 m of vacuum jacket is
  // what eventually breaks the annulus.
  function canopy(cx, cz, w, d, h) {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const px = cx + sx * w / 2, pz = cz + sz * d / 2;
      beam(px, 0.3, pz, px, h, pz, 0.34, M.steel);
      beam(px, h - 1.6, pz, px + (-sx) * 2.4, h, pz, 0.20, M.steel);
    }
    for (const sz of [-1, 1]) {
      beam(cx - w / 2, h, cz + sz * d / 2, cx + w / 2, h, cz + sz * d / 2, 0.30, M.steel);
      for (let i = 1; i < 4; i++) {
        const x = cx - w / 2 + (w * i) / 4;
        beam(x, h, cz - d / 2, x, h, cz + d / 2, 0.22, M.steel);
      }
    }
    // louvred shade, not a slab: it has to block the sun without blocking the
    // sky, because at night the same vessels want the 145 K radiative sink
    const slat = new THREE.MeshLambertMaterial({ color: 0xa9a296 });
    const n = 9, pitch = (w + 1.2) / n;
    for (let i = 0; i < n; i++) {
      const sl = box(pitch * 0.60, 0.14, d + 1.2, slat,
                     cx - (w + 1.2) / 2 + pitch * (i + 0.5), h + 0.32, cz);
      sl.rotation.z = 0.52;
    }
    for (const sz of [-1, 1])
      box(w + 1.4, 0.22, 0.26, M.steel, cx, h + 0.18, cz + sz * (d / 2 + 0.6));
  }
  canopy(-26, -4, 29, 15.5, 14.6);
  canopy(21.5, -4, 25, 14.5, 13.6);

  // ------------------------------------------- cold vent stacks (not flares)
  // Account 7c: a methane release on Mars cannot ignite — the atmosphere has
  // no oxidiser — so this site has cold vents, not flare stacks.  Account 7b:
  // GOX only becomes buoyant above 154 K, so the stacks are tall and warmed.
  function ventStack(x, z, h, kind) {
    cyl(0.34, 0.42, h, 10, M.steel, x, h / 2 + 0.2, z);
    for (let i = 1; i < 4; i++) {                       // warming coil wraps
      cyl(0.52, 0.52, 0.26, 10, M.orange, x, 1.6 + i * (h - 2.6) / 4, z);
    }
    cyl(0.60, 0.34, 1.1, 10, M.dark, x, h + 0.75, z);   // discharge head
    const bl = new THREE.MeshLambertMaterial({ color: 0xe25c4a, emissive: 0x3c1310 });
    cyl(0.22, 0.22, 0.26, 8, bl, x, h + 1.45, z);
    nightMats.push(bl); blinkMats.push(bl);
    for (let i = 0; i < 3; i++) {                       // guy wires as thin beams
      const a = (i / 3) * Math.PI * 2 + 0.4;
      beam(x, h * 0.72, z, x + Math.cos(a) * 4.2, 0.3, z + Math.sin(a) * 4.2, 0.09, M.steel);
    }
    box(1.4, 1.0, 1.0, kind === 'lox' ? M.loxBand : M.ch4Band, x, 0.7, z + 1.4);
  }
  ventStack(-39, 13, 15, 'lox');
  ventStack(33, 13, 13, 'ch4');
  poi('vent', -39, 16.5, 13);

  // ------------------------------------------------------ the one cold box
  // Account 4b: one 11.8 kW machine reaches 12 % of Carnot where forty 0.3 kW
  // skids reach 4 % — the same duty costs 3x the electricity if you split it.
  // That is why this asset exists as a separate building instead of forty
  // little liquefiers bolted to forty Sabatier plants.
  {
    const cx = -24, cz = 17;
    box(8.4, 10.4, 7.6, M.cold, cx, 5.4, cz);                  // insulated cold box
    box(9.0, 0.4, 8.2, M.steel, cx, 10.8, cz);                 // roof cap
    box(9.0, 0.32, 8.2, M.steel, cx, 0.38, cz);                // base skirt
    for (let i = 0; i < 4; i++)                                // vertical stiffeners
      box(0.22, 10.2, 0.30, M.steel, cx - 4.3, 5.4, cz - 3.4 + i * 2.3);
    for (let i = 0; i < 4; i++)
      box(0.22, 10.2, 0.30, M.steel, cx + 4.3, 5.4, cz - 3.4 + i * 2.3);
    // sectioned face: the turbo-expander / heat-exchanger stack is visible
    box(6.2, 8.6, 0.14, M.darker, cx, 5.2, cz + 3.85);
    for (let i = 0; i < 4; i++)                                // brazed-Al HX cores
      box(5.0, 1.3, 0.5, M.steel, cx, 2.0 + i * 2.0, cz + 3.9);
    const exp = cyl(0.66, 0.66, 1.4, 12, M.dark, cx + 1.6, 8.6, cz + 4.2);
    exp.rotation.x = Math.PI / 2;
    const wheel = cyl(0.44, 0.44, 0.22, 12, M.orange, cx + 1.6, 8.6, cz + 4.9);
    wheel.rotation.x = Math.PI / 2;
    wheel.name = 'expander';
    spinners.push({ node: 'expander', axis: 'z', rpm: 240 });
    // door + walkway + hand rail
    box(1.5, 2.3, 0.10, M.orange, cx - 2.8, 1.35, cz + 3.86);
    box(1.28, 2.1, 0.12, M.hull, cx - 2.8, 1.30, cz + 3.92);
    box(0.10, 0.26, 0.09, M.dark, cx - 2.2, 1.28, cz + 3.99);
    // compressor skid with two spinning fans (the machine's warm end)
    const sx = -13;
    box(8.6, 3.6, 5.2, M.hull, sx, 1.9, cz);
    box(9.0, 0.24, 5.6, M.steel, sx, 3.82, cz);
    for (let i = 0; i < 2; i++) {
      const f = cyl(1.05, 1.05, 0.22, 12, M.dark, sx - 2.0 + i * 4.0, 4.06, cz);
      f.name = 'fan' + i;
      for (let b = 0; b < 4; b++)
        box(1.9, 0.06, 0.34, M.steel, 0, 0.10, 0, f).rotation.y = (b / 4) * Math.PI;
      spinners.push({ node: 'fan' + i, axis: 'y', rpm: 300 });
      cyl(1.25, 1.25, 0.10, 12, M.orange, sx - 2.0 + i * 4.0, 4.28, cz);
    }
    box(1.2, 1.6, 0.9, M.darker, sx + 3.6, 1.9, cz + 2.9);     // switchgear box
    box(0.5, 0.34, 0.12, M.lampG, sx + 3.6, 2.5, cz + 3.38);
    nightMats.push(M.lampG);
    // cold lines from the box to the two bays: jacketed, short, and that is
    // the entire point of the ledger — nothing cryogenic runs more than ~30 m
    for (const [tx, tz, mm] of [[-26, 6, M.loxBand], [21.5, 6, M.ch4Band]]) {
      const ax = cx, az = cz - 4.2;
      beam(ax, 2.4, az, ax, 2.4, tz + 4.0, 0.34, M.cold);
      beam(ax, 2.4, tz + 4.0, tx, 2.4, tz + 4.0, 0.34, M.cold);
      beam(ax + 0.02, 2.4, tz + 3.4, tx, 2.4, tz + 3.4, 0.18, mm);
      for (let i = 0; i <= 5; i++) {                            // pipe piers
        const t = i / 5;
        box(0.26, 2.2, 0.26, M.steel, ax + (tx - ax) * t, 1.2, tz + 4.0);
      }
    }
    poi('coldbox', cx, 12.4, cz);
  }

  // ------------------------------------------- boil-off recovery compressor
  // Account 5d: the recovered vapour is worth 15.9 kWh/kg in ISRU electricity
  // and the refrigerator that saves it costs 3.9 kWe — a 17:1 payback.
  {
    const cx = -3.5, cz = 17;
    box(5.6, 3.0, 4.2, M.hull, cx, 1.6, cz);
    box(6.0, 0.22, 4.6, M.steel, cx, 3.22, cz);
    const fw = cyl(1.0, 1.0, 0.30, 14, M.dark, cx + 3.2, 1.8, cz);
    fw.rotation.z = Math.PI / 2;
    fw.name = 'bog_flywheel';
    for (let i = 0; i < 6; i++)
      box(0.16, 1.7, 0.16, M.steel, 0, 0, 0, fw).rotation.z = (i / 6) * Math.PI;
    spinners.push({ node: 'bog_flywheel', axis: 'y', rpm: 420 });
    cyl(0.34, 0.34, 3.4, 10, M.steel, cx - 2.2, 4.9, cz);      // suction knock-out
    cyl(0.5, 0.34, 0.7, 10, M.dark, cx - 2.2, 6.8, cz);
    box(1.4, 1.0, 0.10, M.orange, cx, 2.4, cz + 2.2);
    poi('bog', cx, 5.6, cz);
  }

  // ----------------------------------------------------------- radiator bank
  // Account 5e/6e: sized on the DAY-shift number (280 K sink).  The 190 K
  // night sky is a bonus the depot banks when it can, never capacity it needs
  // — a global dust storm closes the sky for weeks (account 6e).
  for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
    const px = 8 + c * 7.4, pz = 13.5 + r * 5.4;
    const p = box(6.0, 0.16, 4.0, M.rad, px, 2.85, pz);
    p.rotation.x = -0.62;
    box(6.2, 0.10, 0.24, M.steel, px, 3.95, pz - 1.62);
    box(6.2, 0.10, 0.24, M.steel, px, 1.75, pz + 1.62);
    beam(px - 2.6, 0.3, pz + 1.5, px - 2.6, 3.4, pz - 1.4, 0.18, M.steel);
    beam(px + 2.6, 0.3, pz + 1.5, px + 2.6, 3.4, pz - 1.4, 0.18, M.steel);
    box(0.14, 0.14, 4.4, M.steel, px, 2.9, pz);
  }
  box(0.30, 1.4, 22.5, M.steel, 4.6, 1.0, 16.2);               // header run
  poi('radiator', 15.4, 4.6, 16.2);

  // ------------------------------------------ warm gas header (back, -Z side)
  // Account 4a: the ONLY thing crossing the 105 m from res-isru-01 is gas at
  // ambient temperature, <= 10 bar (above ~15 bar the methane dew point climbs
  // into the range a bare pipe reaches on a winter night).  Bare steel, no
  // insulation, no vacuum jacket: that is deliberate and it is the design.
  {
    const hz = -29.5;
    for (const sx of [-4.2, 4.2]) beam(sx - 4, 0.3, hz, sx - 4, 6.2, hz, 0.30, M.steel);
    beam(-8.2, 6.2, hz, 0.2, 6.2, hz, 0.28, M.steel);
    beam(-8.2, 4.4, hz, -6.4, 6.2, hz, 0.18, M.steel);
    beam(0.2, 4.4, hz, -1.6, 6.2, hz, 0.18, M.steel);
    // the two gas lanes arriving from -Z, up over the portal and down into the
    // receivers — bare, grey, obviously un-jacketed
    for (const [ox, rr] of [[-6.0, 0.16], [-2.4, 0.13]]) {
      cyl(rr, rr, 8.0, 10, M.gas, ox, 5.9, hz - 4.0).rotation.x = Math.PI / 2;
      cyl(rr, rr, 5.4, 10, M.gas, ox, 3.2, hz + 0.1);
      cyl(rr, rr, 6.5, 10, M.gas, ox, 0.9, hz + 3.4).rotation.x = Math.PI / 2;
      box(0.44, 0.44, 0.44, M.orange, ox, 5.9, hz - 0.4);       // isolation valve
    }
    box(1.6, 1.2, 1.0, M.darker, 2.6, 0.8, hz + 1.0);           // metering skid
    box(0.6, 0.36, 0.12, M.lampG, 2.6, 1.5, hz + 1.52);
    poi('gas_header', -3, 7.6, hz);
    // two medium-pressure receivers: the day's gas, waiting for the night shift
    for (let i = 0; i < 2; i++) {
      const cz2 = -25.6 + i * 4.6, cxx = 9.5;
      const b = cyl(1.5, 1.5, 8.0, 12, M.gas, cxx, 2.4, cz2);
      b.rotation.z = Math.PI / 2;
      for (const s of [-1, 1]) {
        const h = new THREE.Mesh(new THREE.SphereGeometry(1.5, 10, 6), M.gas);
        h.position.set(cxx + s * 4.0, 2.4, cz2);
        g.add(h);
      }
      cyl(1.52, 1.52, 0.5, 12, M.orange, cxx, 2.4, cz2).rotation.z = Math.PI / 2;
      for (const s of [-2.6, 2.6]) {                            // saddles
        box(1.2, 1.5, 2.2, M.hull, cxx + s, 0.85, cz2);
        beam(cxx + s - 0.7, 1.6, cz2, cxx + s + 0.7, 1.6, cz2, 0.2, M.steel);
      }
      cyl(0.12, 0.12, 1.6, 8, M.steel, cxx, 4.6, cz2);
      box(0.36, 0.36, 0.36, M.orange, cxx, 5.5, cz2);
    }
    poi('receivers', 9.5, 5.2, -27.3);
  }

  // ------------------------------------------ transfer apron (front, +Z side)
  // Account 3: 114 tanker trips fill one 1200 t Starship load.  Disciplined
  // operation costs 1.0 % per trip; without the vapour-return hose and with a
  // throttled instead of pumped transfer it costs 8.9 %.  The hose is on the
  // arm gantry because that 9x is the most useful thing the ledger found.
  {
    const px = -14, pz = 25.5;
    // apron slab with wheel tracks worn into it
    const ap = box(50, 0.16, 12, M.hull, -2, 0.24, 27.5);
    ap.material = new THREE.MeshLambertMaterial({ color: 0x77604f });
    for (const zz of [30.2, 32.4]) box(38, 0.05, 0.55, M.darker, -4, 0.34, zz);
    // raised loading platform
    box(15, 1.3, 5.0, M.hull, px, 0.85, pz);
    box(15.4, 0.16, 5.4, M.steel, px, 1.58, pz);
    for (let i = 0; i < 8; i++) {                               // hand rail
      box(0.10, 1.05, 0.10, M.orange, px - 7 + i * 2, 2.1, pz - 2.6);
    }
    box(15.4, 0.10, 0.10, M.orange, px, 2.6, pz - 2.6);
    for (let i = 0; i < 4; i++)                                  // access steps
      box(2.0, 0.14, 0.36, M.steel, px - 8.3, 0.34 + i * 0.34, pz - 1.4 + i * 0.4);

    // three articulated arms on pivots: LOX, LCH4, vapour return
    const armSpec = [[-4.6, M.loxBand, 'arm_lox', 5.6, 0.30],
                     [0.6, M.ch4Band, 'arm_ch4', 5.2, 0.26],
                     [5.4, M.gas, 'arm_vap', 4.6, 0.20]];
    armSpec.forEach(([ox, mm, nm, len, rr], i) => {
      const pv = new THREE.Group();
      pv.name = nm;
      pv.position.set(px + ox, 1.66, pz + 2.2);
      g.add(pv);
      cyl(0.42, 0.5, 5.0, 10, M.steel, 0, 2.5, 0, pv);           // column
      cyl(0.55, 0.55, 0.4, 10, M.orange, 0, 5.2, 0, pv);         // swivel
      // horizontal boom reaching out over the tanker bay, then a drop leg
      cyl(rr, rr, len, 10, mm, 0, 5.6, len / 2, pv).rotation.x = Math.PI / 2;
      cyl(rr, rr, 1.5, 10, mm, 0, 4.85, len, pv);
      cyl(rr * 1.5, rr * 1.5, 0.45, 10, M.orange, 0, 4.05, len, pv);  // coupler head
      beam(0, 4.1, 0.3, 0, 5.6, len * 0.72, 0.14, M.steel, pv);       // stay
      box(0.34, 0.34, 0.34, M.dark, 0, 5.6, 0.9, pv);                 // actuator
      pv.rotation.y = -0.18 + i * 0.18;
      oscillators.push({ node: nm, axis: 'y', prop: 'rotation',
                         amp: 0.24, period: 20 + i * 3, phase: i * 1.7 });
    });
    // wheel stops + bay markings + a lit sign board
    for (const sx of [-8.5, 5.5]) box(0.6, 0.5, 2.6, M.orange, px + sx, 0.5, pz + 8.6);
    const sb = box(3.4, 1.5, 0.16, M.window, px + 12, 2.4, pz + 1.0);
    nightMats.push(M.window);
    box(3.7, 0.2, 0.24, M.steel, px + 12, 3.25, pz + 1.0);
    box(0.22, 2.4, 0.22, M.steel, px + 12, 1.2, pz + 1.0);
    poi('loadout', px, 6.2, pz + 3);
  }

  // ----------------------------------------------------- the cryogenic tanker
  // Account 3: usable 12.8 m3 -> 14.6 t LOX or 5.4 t LCH4; 0.08 %/sol standing
  // boil-off, 5.2 kWh of traction per round trip (0.002 % of what the
  // propellant cost to make).  The heel is never dumped: letting the vessel
  // warm up between trips would cost 292 kg of chill-down, 2 % of a load.
  {
    const tx = -14, tz = 31.6, tyc = 2.5;
    const T = new THREE.Group();
    T.name = 'tanker';
    T.position.set(tx, 0, tz);
    g.add(T);
    // chassis
    box(11.0, 0.55, 2.9, M.dark, 0, 1.05, 0, T);
    box(11.2, 0.16, 3.1, M.steel, 0, 1.36, 0, T);
    // vacuum-jacketed vessel: cylinder + hemispherical heads
    const v = cyl(1.35, 1.35, 5.4, 14, M.lox, 0.4, tyc, 0, T);
    v.rotation.z = Math.PI / 2;
    for (const s of [-1, 1]) {
      const h = new THREE.Mesh(new THREE.SphereGeometry(1.35, 12, 7), M.lox);
      h.position.set(0.4 + s * 2.7, tyc, 0);
      T.add(h);
    }
    cyl(1.37, 1.37, 0.5, 14, M.loxBand, 0.4, tyc, 0, T).rotation.z = Math.PI / 2;
    for (const s of [-1.9, 1.9]) {                              // saddle cradles
      box(0.9, 1.0, 2.6, M.hull, 0.4 + s, 1.85, 0, T);
    }
    // valve tree + vapour-return stub + relief on top
    box(1.3, 0.7, 1.1, M.darker, 0.4, 4.1, 0, T);
    cyl(0.11, 0.11, 1.0, 8, M.steel, 0.0, 4.6, 0, T);
    cyl(0.09, 0.09, 0.8, 8, M.gas, 0.8, 4.5, 0, T);
    box(0.3, 0.22, 0.3, M.orange, 0.4, 4.55, 0.45, T);
    // cab
    box(2.6, 2.0, 2.7, M.hull, -4.6, 2.3, 0, T);
    const win = box(2.3, 0.85, 0.10, M.window, -4.6, 2.9, 1.38, T);
    box(2.7, 0.18, 2.8, M.steel, -4.6, 3.38, 0, T);
    box(0.9, 0.3, 0.16, M.lampW, -5.9, 2.1, 0.8, T);
    box(0.9, 0.3, 0.16, M.lampW, -5.9, 2.1, -0.8, T);
    nightMats.push(M.lampW);
    const bl = new THREE.MeshLambertMaterial({ color: 0xe25c4a, emissive: 0x3c1310 });
    box(1.5, 0.22, 0.26, bl, -4.6, 3.6, 0, T);
    nightMats.push(bl); blinkMats.push(bl);
    // six wheels
    for (const [wx, wz] of [[-4.4, 1.5], [-4.4, -1.5], [1.4, 1.5], [1.4, -1.5],
                            [3.3, 1.5], [3.3, -1.5]]) {
      const w = cyl(0.82, 0.82, 0.55, 10, M.rubber, wx, 0.82, wz, T);
      w.rotation.x = Math.PI / 2;
      cyl(0.30, 0.30, 0.58, 6, M.steel, wx, 0.82, wz, T).rotation.x = Math.PI / 2;
    }
    box(0.5, 0.5, 3.2, M.orange, 5.9, 1.2, 0, T);               // rear bumper
    poi('tanker', tx, 5.2, tz);
  }

  // ------------------------------------------------ control / valve building
  {
    const cx = 18, cz = 27;
    box(9.5, 4.2, 6.5, M.hull, cx, 2.2, cz);
    box(10.0, 0.28, 7.0, M.steel, cx, 4.45, cz);                // roof cap band
    box(10.0, 0.24, 7.0, M.steel, cx, 0.22, cz);                // skirt
    for (let i = 0; i < 3; i++) {
      const w = box(2.0, 1.0, 0.10, M.window, cx - 2.8 + i * 2.8, 3.0, cz + 3.3);
      box(2.2, 0.14, 0.16, M.steel, cx - 2.8 + i * 2.8, 3.6, cz + 3.34);
    }
    box(1.5, 2.4, 0.10, M.orange, cx - 4.0, 1.3, cz + 3.28);    // sealed door
    box(1.28, 2.2, 0.12, M.hull, cx - 4.0, 1.25, cz + 3.34);
    box(0.10, 0.28, 0.09, M.dark, cx - 3.45, 1.24, cz + 3.42);
    for (const yy of [1.9, 0.6]) box(0.14, 0.10, 0.06, M.dark, cx - 4.58, yy, cz + 3.38);
    cyl(0.09, 0.09, 3.0, 6, M.steel, cx + 4.4, 5.9, cz - 1.0);  // mast + conduit
    box(0.5, 0.5, 0.5, M.darker, cx + 4.4, 7.5, cz - 1.0);
    for (const zz of [-2.2, 0.4]) cyl(0.06, 0.06, 4.4, 6, M.steel, cx + 4.85, 2.3, cz + zz);
    box(0.42, 0.9, 0.5, M.dark, cx + 4.9, 3.4, cz - 0.9);
    poi('control', cx, 6.0, cz);
    lights.push({ color: 0xffd9a0, pos: [cx, 6.5, cz + 5], range: 45 });
    lights.push({ color: 0xe8e2cf, pos: [-14, 9.5, 27], range: 55 });   // apron
    lights.push({ color: 0xbcd2e6, pos: [-26, 12, -4], range: 45 });    // LOX bay
    lights.push({ color: 0xbfe0c6, pos: [21.5, 11, -4], range: 42 });   // CH4 bay
  }

  // -------------------------------------------- flood masts + roadside marks
  for (const [mx, mz] of [[-39, 23], [29, -21], [-39, -25], [33, 23]]) {
    cyl(0.16, 0.22, 9.0, 8, M.steel, mx, 4.6, mz);
    box(1.7, 0.34, 0.5, M.lampW, mx, 9.3, mz);
    box(0.9, 0.5, 0.9, M.dark, mx, 1.2, mz);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.6;
      beam(mx, 5.0, mz, mx + Math.cos(a) * 2.6, 0.3, mz + Math.sin(a) * 2.6, 0.10, M.steel);
    }
  }

  // ------------------------------------------------------- worked-in details
  // scattered gravel and wheel-track scuffs: a yard that has been used
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);
  for (let i = 0; i < 14; i++) {
    const x = -40 + rnd() * 76, z = -31 + rnd() * 62;
    if (Math.abs(x + 27) < 18 && Math.abs(z + 4) < 15) continue;   // not in the bunds
    if (Math.abs(x - 22) < 16 && Math.abs(z + 4) < 14) continue;
    const s = 0.14 + rnd() * 0.22;
    const r = new THREE.Mesh(rockGeo, new THREE.MeshLambertMaterial({
      color: rnd() < 0.5 ? 0x7a4b35 : 0x8f6249 }));
    r.position.set(x, 0.18 - 0.30 * s + 1.618 * s, z);
    r.scale.set(s, s * 0.62, s);
    r.rotation.y = rnd() * 6.28;
    g.add(r);
  }

  // ------------------------------------------------------------- dust pass
  const dust = new THREE.Color(0x9e5b3d);
  [M.lox, M.ch4, M.steel, M.hull, M.cold, M.orange, M.gas, M.rad, M.dark,
   M.loxBand, M.ch4Band, M.jacket].forEach((m) => m.color.lerp(dust, 0.05));

  // ---------------------------------------------------------- declarations
  g.userData.spinners = spinners;
  g.userData.oscillators = oscillators;
  g.userData.blinkMats = blinkMats;
  g.userData.nightMats = nightMats;
  g.userData.lights = lights;
  g.userData.label = 'res-cryo-01 低温推进剂罐区';

  return g;
}
