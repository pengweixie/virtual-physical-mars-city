// Spare water holding tank (dust-storm water bank) — code asset per MODELS.md §4.
// Ported from the mars-water-ice project (mars-water-ice\src\).
// 13 m^3 horizontal vessel on cradles with crossover stub + isolation valve.
// 1 unit = 1 m. Origin = base-center ground point (y=0), +Y up, valve side +Z.
// Knowledge cards: res-tank-02.info.json (TS-01 R1 storm-bank sizing).

export const meta = {
  id: 'res-tank-02',
  name: '备用储水罐（尘暴水银行）',
  name_en: 'Spare Water Tank (Storm Bank)',
  size_m: 4.7,              // overall length incl. dished ends; self-check only
  size_axis: 'width',
  effects: [],
};

export function build(THREE) {
  const root = new THREE.Group();
  root.name = 'res-tank-02';
  const M = (color, opts = {}) => new THREE.MeshLambertMaterial({ color, ...opts });
  const WHITE = M(0xe2dcd1), ORANGE = M(0xd96a22), DARK = M(0x585b5e),
        STEEL = M(0x8f9194), INSUL = M(0xd2ccc2);
  const glowLamp = M(0x3a2c12, { emissive: 0xffb54a, emissiveIntensity: 0.0 });

  function box(w, h, d, material, x, y, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    m.position.set(x, y, z);
    root.add(m);
    return m;
  }
  function cyl(r, h, material, x, y, z, seg) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg || 24), material);
    m.position.set(x, y, z);
    root.add(m);
    return m;
  }

  const R = 0.95, LEN = 3.6, Y = 1.2;
  const body = cyl(R, LEN, WHITE, 0, Y, 0, 32);
  body.rotation.z = Math.PI / 2;
  [-1, 1].forEach((s) => {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(R, 24, 16), WHITE);
    cap.position.set(s * LEN / 2, Y, 0);
    cap.scale.set(0.58, 1, 1);
    root.add(cap);
  });
  [-1.3, 1.3].forEach((x) => {
    const b = cyl(R + 0.015, 0.22, ORANGE, x, Y, 0, 32);
    b.rotation.z = Math.PI / 2;
  });
  // top manway + level lamp
  cyl(0.3, 0.3, STEEL, 0, Y + R + 0.1, 0, 16);
  cyl(0.36, 0.1, ORANGE, 0, Y + R + 0.28, 0, 16);
  box(0.1, 0.08, 0.03, glowLamp, 0.42, Y + R + 0.22, 0);
  // cradles
  [-1.15, 1.15].forEach((x) => {
    const ch = Y - 0.45;
    box(0.55, ch, 1.9, DARK, x, ch / 2, 0);
    box(0.75, 0.12, 2.15, DARK, x, 0.06, 0);
  });
  // crossover stub + isolation valve (+Z flank, mates with station tank A)
  const stub = cyl(0.09, 0.7, INSUL, 0, Y, R + 0.3, 14);
  stub.rotation.x = Math.PI / 2;
  cyl(0.075, 0.26, STEEL, 0, Y + 0.12, R + 0.45, 12);
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.032, 8, 20), ORANGE);
  wheel.position.set(0, Y + 0.28, R + 0.45);
  wheel.rotation.x = Math.PI / 2;
  root.add(wheel);

  // POI anchors (cards in res-tank-02.info.json)
  [['shell', 0, Y, 0], ['valve', 0, Y + 0.3, R + 0.45], ['manway', 0, Y + R + 0.3, 0]]
    .forEach(([n, x, y, z]) => {
      const a = new THREE.Object3D();
      a.name = 'poi_' + n;
      a.position.set(x, y, z);
      root.add(a);
    });

  root.userData.nightMats = [glowLamp];
  return root;
}
