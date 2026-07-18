// Rodwell water-ice extraction station — code asset per MODELS.md §4.
// Ported from the mars-water-ice project's procedural three.js build
// (mars-water-ice\src\scene.js) at real metric scale: 10 m derrick
// over a sealed drill house, insulated DN25 line to a 13 m^3 service tank,
// icy tailings pile, auxiliary solar panel, staked WELL-2 reserve site.
// 1 unit = 1 m. Origin = pad-center ground point (y=0 = terrain), +Y up,
// front (drill-house door) faces +Z. THREE is injected — no imports.
// POI anchors are poi_* empties; knowledge cards live in the sidecar
// res-rodwell-01.info.json (trade-study TS-01 R1 / TS-02 conclusions).

export const meta = {
  id: 'res-rodwell-01',
  name: 'Rodwell 水冰取水井架',
  name_en: 'Rodwell Water-Ice Extraction Station',
  size_m: 12.0,             // crown-vent top above grade; self-check only
  size_axis: 'height',
  effects: [],
};

export function build(THREE) {
  const root = new THREE.Group();
  root.name = 'res-rodwell-01';
  const nightMats = [];
  const lights = [];

  // ---------------------------------------------------------------- palette
  const M = (color, opts = {}) => new THREE.MeshLambertMaterial({ color, ...opts });
  const C = {
    regolith: M(0x9e5b3d),
    regoSide: M(0x8f5236),
    white: M(0xe2dcd1),        // thermal panels, dust-filmed
    whiteTrim: M(0xcbc3b6),
    steel: M(0x8f9194),
    steelLight: M(0xa9aaab),
    dark: M(0x585b5e),
    orange: M(0xd96a22),
    insul: M(0xd2ccc2),
    insulBand: M(0xb3aca0),
    panelSkin: M(0x3a3f47),
    frame: M(0xa2a4a6),
  };
  const glowBeacon = M(0x551512, { emissive: 0xff2a1a, emissiveIntensity: 0.0 });
  const glowLamp = M(0x3a2c12, { emissive: 0xffb54a, emissiveIntensity: 0.0 });
  nightMats.push(glowBeacon, glowLamp);

  // ---------------------------------------------------------------- helpers
  let seed = 20260704;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const hash3 = (x, y, z) => {
    const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
    return s - Math.floor(s);
  };
  function box(w, h, d, material, x, y, z, parent) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    m.position.set(x, y, z);
    (parent || root).add(m);
    return m;
  }
  function cyl(rT, rB, h, material, x, y, z, seg, parent) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rT, rB, h, seg || 20), material);
    m.position.set(x, y, z);
    (parent || root).add(m);
    return m;
  }
  const _a = new THREE.Vector3(), _b = new THREE.Vector3();
  function beam(ax, ay, az, bx, by, bz, w, material) {
    _a.set(ax, ay, az); _b.set(bx, by, bz);
    const len = _a.distanceTo(_b);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, w, len + w * 0.6), material);
    m.position.copy(_a).lerp(_b, 0.5);
    m.lookAt(_b);
    root.add(m);
    return m;
  }
  function poi(name, x, y, z) {
    const a = new THREE.Object3D();
    a.name = 'poi_' + name;
    a.position.set(x, y, z);
    root.add(a);
  }

  const PAD = 0.55;
  const TX = -5;                     // derrick / wellhead axis
  const TANK_Y = 1.75, PIPE_Y = 1.15, PIPE_R = 0.21;

  // ---------------------------------------------------------------- pad
  const pad = new THREE.Mesh(new THREE.BoxGeometry(19.4, PAD, 10.4), [
    C.regoSide, C.regoSide, C.regolith, C.regoSide, C.regoSide, C.regoSide,
  ]);
  pad.position.set(0, PAD / 2, 0);
  root.add(pad);
  box(19.8, 0.14, 10.8, C.regoSide, 0, 0.07, 0);

  // ---------------------------------------------------------------- derrick
  (function derrick() {
    const levels = [0, 3.0, 5.0, 7.0, 8.5, 10.0];
    const baseH = 1.75, topH = 0.95;
    const half = (y) => baseH + (topH - baseH) * (y / 10);
    const CORNERS = [[1, 1], [1, -1], [-1, -1], [-1, 1]];
    CORNERS.forEach((c) => {
      for (let i = 0; i < levels.length - 1; i++) {
        const y0 = levels[i], y1 = levels[i + 1];
        beam(TX + c[0] * half(y0), PAD + y0, c[1] * half(y0),
             TX + c[0] * half(y1), PAD + y1, c[1] * half(y1), 0.32, C.steel);
      }
      box(0.6, 0.18, 0.6, C.dark, TX + c[0] * baseH, PAD + 0.09, c[1] * baseH);
    });
    levels.forEach((ly) => {
      const h = half(ly), y = PAD + ly;
      for (let f = 0; f < 4; f++) {
        const a = CORNERS[f], b = CORNERS[(f + 1) % 4];
        beam(TX + a[0] * h, y, a[1] * h, TX + b[0] * h, y, b[1] * h, 0.26, C.steel);
      }
    });
    for (let i = 1; i < levels.length - 1; i++) {       // no diagonals in bay 0
      const y0 = levels[i], y1 = levels[i + 1];
      const h0 = half(y0), h1 = half(y1);
      for (let f = 0; f < 4; f++) {
        const a = CORNERS[f], b = CORNERS[(f + 1) % 4];
        const flip = (i + f) % 2 === 0;
        const p = flip ? a : b, q = flip ? b : a;
        beam(TX + p[0] * h0, PAD + y0, p[1] * h0,
             TX + q[0] * h1, PAD + y1, q[1] * h1, 0.26, C.steelLight);
      }
    }
    // mid-tower service platform
    const py = PAD + 7.0, ph = half(7.0);
    box(1.5, 0.1, 0.55, C.dark, TX, py + 0.05, ph + 0.28);
    box(1.5, 0.12, 0.12, C.orange, TX, py + 1.0, ph + 0.52);
    box(0.12, 0.9, 0.12, C.orange, TX - 0.69, py + 0.55, ph + 0.52);
    box(0.12, 0.9, 0.12, C.orange, TX + 0.69, py + 0.55, ph + 0.52);
    // crown block housing + aviation beacon (night blink handled as glow)
    const cy = PAD + 10.0;
    box(2.1, 0.16, 2.1, C.orange, TX, cy + 0.08, 0);
    box(1.9, 0.85, 1.9, C.steel, TX, cy + 0.58, 0);
    box(2.05, 0.1, 2.05, C.whiteTrim, TX, cy + 1.05, 0);
    cyl(0.07, 0.07, 0.4, C.dark, TX + 0.55, cy + 1.28, 0.55, 10);
    box(0.45, 0.28, 0.3, C.dark, TX - 0.5, cy + 0.5, 0.9);
    cyl(0.06, 0.06, 0.18, C.dark, TX - 0.55, cy + 1.19, -0.55, 10);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 10), glowBeacon);
    dome.position.set(TX - 0.55, cy + 1.32, -0.55);
    root.add(dome);
  })();

  // ---------------------------------------------------------------- drill house
  (function drillHouse() {
    const W = 2.75, H = 2.5, hw = W / 2;
    box(W, H, W, C.white, TX, PAD + H / 2, 0);
    box(W + 0.24, 0.14, W + 0.24, C.whiteTrim, TX, PAD + H + 0.07, 0);
    box(W + 0.18, 0.22, W + 0.18, C.whiteTrim, TX, PAD + 0.11, 0);
    [-0.68, 0, 0.68].forEach((o) => {
      box(0.05, H - 0.5, 0.04, C.whiteTrim, TX + o, PAD + H / 2, hw + 0.02);
      box(0.04, H - 0.5, 0.05, C.whiteTrim, TX + hw + 0.02, PAD + H / 2, o);
    });
    box(1.06, 2.02, 0.07, C.orange, TX - 0.55, PAD + 1.06, hw + 0.035);
    box(0.9, 1.86, 0.09, C.whiteTrim, TX - 0.55, PAD + 1.06, hw + 0.05);
    box(0.1, 0.26, 0.08, C.dark, TX - 0.22, PAD + 1.05, hw + 0.1);
    box(0.16, 0.1, 0.06, C.dark, TX - 0.94, PAD + 1.7, hw + 0.09);
    box(0.16, 0.1, 0.06, C.dark, TX - 0.94, PAD + 0.5, hw + 0.09);
    // conduits + junction box with a status lamp
    box(0.4, 0.62, 0.18, C.dark, TX + hw + 0.09, PAD + 1.8, -0.72);
    box(0.1, 0.08, 0.03, glowLamp, TX + hw + 0.19, PAD + 2.0, -0.72);
    cyl(0.055, 0.055, 1.55, C.steel, TX + hw + 0.07, PAD + 0.85, -0.62, 10);
    cyl(0.055, 0.055, 1.55, C.steel, TX + hw + 0.07, PAD + 0.85, -0.82, 10);
  })();

  // ---------------------------------------------------------------- pipeline
  (function pipeline() {
    const x0 = -3.63, xE = 2.45;
    const fl = cyl(0.32, 0.32, 0.16, C.steel, x0 + 0.08, PIPE_Y, 0);
    fl.rotation.z = Math.PI / 2;
    const run = cyl(PIPE_R, PIPE_R, xE - x0, C.insul, (x0 + xE) / 2, PIPE_Y, 0);
    run.rotation.z = Math.PI / 2;
    [-2.5, -1.0, 0.5, 1.9].forEach((x) => {
      const b = cyl(PIPE_R + 0.03, PIPE_R + 0.03, 0.13, C.insulBand, x, PIPE_Y, 0);
      b.rotation.z = Math.PI / 2;
    });
    const e1 = new THREE.Mesh(new THREE.SphereGeometry(PIPE_R + 0.05, 16, 12), C.insul);
    e1.position.set(xE, PIPE_Y, 0); root.add(e1);
    cyl(PIPE_R, PIPE_R, TANK_Y - PIPE_Y, C.insul, xE, (PIPE_Y + TANK_Y) / 2, 0);
    const e2 = new THREE.Mesh(new THREE.SphereGeometry(PIPE_R + 0.05, 16, 12), C.insul);
    e2.position.set(xE, TANK_Y, 0); root.add(e2);
    const stub = cyl(PIPE_R, PIPE_R, 0.6, C.insul, xE + 0.3, TANK_Y, 0);
    stub.rotation.z = Math.PI / 2;
    cyl(0.13, 0.13, 0.34, C.steel, xE + 0.32, TANK_Y + 0.14, 0, 12);
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.04, 8, 20), C.orange);
    wheel.position.set(xE + 0.32, TANK_Y + 0.34, 0);
    wheel.rotation.x = Math.PI / 2;
    root.add(wheel);
    [-2.55, -0.75, 1.05].forEach((x) => {
      box(0.56, 0.1, 0.66, C.dark, x, PAD + 0.05, 0);
      box(0.26, PIPE_Y - PIPE_R - PAD - 0.1, 0.26, C.orange, x, (PAD + 0.1 + PIPE_Y - PIPE_R) / 2, 0);
      box(0.5, 0.09, 0.5, C.steel, x, PIPE_Y - PIPE_R - 0.04, 0);
      box(0.5, 0.22, 0.07, C.steel, x, PIPE_Y - PIPE_R + 0.08, 0.26);
      box(0.5, 0.22, 0.07, C.steel, x, PIPE_Y - PIPE_R + 0.08, -0.26);
    });
  })();

  // ---------------------------------------------------------------- tank A
  (function tank() {
    const CX = 5.3, R = 0.95, LEN = 3.6;
    const body = cyl(R, R, LEN, C.white, CX, TANK_Y, 0, 32);
    body.rotation.z = Math.PI / 2;
    [-1, 1].forEach((s) => {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(R, 24, 16), C.white);
      cap.position.set(CX + s * LEN / 2, TANK_Y, 0);
      cap.scale.set(0.58, 1, 1);
      root.add(cap);
    });
    [CX - 1.3, CX + 1.3].forEach((x) => {
      const b = cyl(R + 0.015, R + 0.015, 0.22, C.orange, x, TANK_Y, 0, 32);
      b.rotation.z = Math.PI / 2;
    });
    cyl(0.3, 0.3, 0.3, C.steel, CX, TANK_Y + R + 0.1, 0, 16);
    cyl(0.36, 0.36, 0.1, C.orange, CX, TANK_Y + R + 0.28, 0, 16);
    [CX - 1.15, CX + 1.15].forEach((x) => {
      const ch = TANK_Y - 0.45 - PAD;
      box(0.55, ch, 1.9, C.dark, x, PAD + ch / 2, 0);
      box(0.75, 0.12, 2.15, C.dark, x, PAD + 0.06, 0);
    });
  })();

  // ---------------------------------------------------------------- tailings
  (function tailings() {
    const R = 2.7, H = 2.05;
    const geo = new THREE.ConeGeometry(R, H, 40, 8);
    const vnoise = (x, y, z) => {
      const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
      const xf = x - xi, yf = y - yi, zf = z - zi;
      const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
      let acc = 0;
      for (let dx = 0; dx <= 1; dx++) for (let dy = 0; dy <= 1; dy++) for (let dz = 0; dz <= 1; dz++) {
        acc += hash3(xi + dx, yi + dy, zi + dz) *
          (dx ? u : 1 - u) * (dy ? v : 1 - v) * (dz ? w : 1 - w);
      }
      return acc;
    };
    const pos = geo.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const ice = new THREE.Color(0xd8d3c9), rust = new THREE.Color(0x9c5a3d);
    const tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const rad = Math.sqrt(x * x + z * z);
      if (rad > 0.05 && y < H / 2 - 0.05) {
        const k = 1 + (vnoise(x * 1.6 + 9, y * 1.6, z * 1.6 - 4) - 0.5) * 0.18;
        x *= k; z *= k;
        pos.setX(i, x); pos.setZ(i, z);
      }
      const n = 0.55 * vnoise(x * 1.9, y * 1.9, z * 1.9) +
                0.45 * vnoise(x * 4.3 + 7, y * 4.3, z * 4.3 + 3);
      const hgt = (y + H / 2) / H;
      const m = Math.min(1, Math.max(0, 0.18 + 0.55 * n + 0.22 * (1 - hgt)));
      tmp.copy(ice).lerp(rust, m);
      col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeVertexNormals();
    const pile = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
    pile.position.set(-11.7, H / 2, 1.2);
    root.add(pile);
    for (let i = 0; i < 6; i++) {
      const a = rnd() * 6.283, d = R * (0.8 + rnd() * 0.45), s = 0.1 + rnd() * 0.13;
      const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0),
        rnd() < 0.5 ? M(0xc8c3b9) : M(0x9c5f3f));
      rock.position.set(-11.7 + Math.cos(a) * d, s * 0.6, 1.2 + Math.sin(a) * d);
      rock.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
      root.add(rock);
    }
  })();

  // ---------------------------------------------------------------- solar
  (function solar() {
    const g = new THREE.Group();
    g.position.set(7.5, PAD, 3.3);
    g.rotation.y = -0.5;
    root.add(g);
    [-0.95, 0.95].forEach((x) => {
      box(0.12, 0.55, 0.12, C.frame, 0, 0, 0, g).position.set(x, 0.28, 0.55);
      box(0.12, 1.25, 0.12, C.frame, 0, 0, 0, g).position.set(x, 0.63, -0.5);
      box(0.3, 0.08, 0.4, C.dark, 0, 0, 0, g).position.set(x, 0.04, 0.55);
      box(0.3, 0.08, 0.4, C.dark, 0, 0, 0, g).position.set(x, 0.04, -0.5);
    });
    const panel = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.09, 1.5),
      [C.frame, C.frame, C.panelSkin, C.frame, C.frame, C.frame]);
    panel.position.set(0, 0.9, 0.02);
    panel.rotation.x = -0.58;
    g.add(panel);
    box(0.14, 0.1, 1.4, C.dark, 0, 0, 0, g).position.set(0, 0.05, 1.35);
  })();

  // ---------------------------------------------------------------- WELL-2 site
  (function wellSite() {
    const SX = -20, SZ = -1.5;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.05, 8, 36), C.orange);
    ring.position.set(SX, 0.03, SZ);
    ring.rotation.x = Math.PI / 2;
    root.add(ring);
    cyl(0.09, 0.09, 0.5, C.orange, SX, 0.25, SZ, 8);
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach((c) => {
      box(0.09, 0.55, 0.09, C.orange, SX + c[0] * 1.45, 0.27, SZ + c[1] * 1.45);
    });
    for (let i = 0; i < 8; i++) {
      const t = i / 7;
      box(0.55, 0.04, 0.14, C.orange,
        -10.4 + (-18.2 + 10.4) * t, 0.02, -2.2 + (-1.7 + 2.2) * t);
    }
  })();

  // ---------------------------------------------------------------- POI anchors
  poi('derrick', TX, 8.5, 0);
  poi('drillhouse', TX, 1.8, 1.6);
  poi('pipeline', -0.5, 1.3, 0);
  poi('tank', 5.3, 1.75, 0);
  poi('tailings', -11.7, 1.6, 1.2);
  poi('solar', 7.5, 1.3, 3.3);
  poi('well2', -20, 0.6, -1.5);

  // engine hooks
  root.userData.nightMats = nightMats;
  root.userData.lights = [
    { color: 0xffd9a0, pos: [TX - 0.55, PAD + 2.6, 1.9], range: 10 },  // door work light
  ];
  lights.length = 0; // (single fixture; kept explicit above)

  return root;
}
