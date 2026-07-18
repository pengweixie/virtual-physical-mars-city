// sci-pan-01 —— MiniPAN 穿透粒子分析仪（卫星载荷，几何自 Codex/PAN 的
// PANSim MiniPAN_Sep2022 构型移植）。ORBITAL PAYLOAD——不进 manifest；
// 引擎把它挂到 com-relay-01 主星的天顶(-Z)甲板上。只建模，不做计算分析。
//
// 1 unit = 1 m。原点 = 探测器盒中心；望远镜轴 = z 轴（粒子沿 ±z 穿越）。
// 层序（z，mm，来自 PANSim 几何常数）：
//   TOF 闪烁体 ±85.4 · TPX3 像素板 ±79 · 硅微条 +70/+64.5/+59 与 -59/-64.5/-70
//   · 中央微条 ±5 · NdFeB 环形永磁 ±30.5。探测器盒 200×200×250 mm，MLI 包覆。

export const meta = {
  id: 'sci-pan-01',
  name: 'MiniPAN 穿透粒子分析仪',
  name_en: 'MiniPAN Penetrating-particle ANalyser',
  size_m: 0.25,
  size_axis: 'height',
  kind: 'orbital-payload',      // viewer attaches it to one relay satellite
};

export function build(THREE) {
  const g = new THREE.Group();
  g.name = 'sci-pan-01';
  const L = (c, o = {}) => new THREE.MeshLambertMaterial({ color: c, ...o });
  const M = {
    mli: L(0xb9902f),                                  // gold MLI wrap
    frame: L(0x8d9198),
    tof: L(0x2fae72, { emissive: 0x0c3d24, emissiveIntensity: 0.5 }),   // scintillator
    tpx: L(0x6d3fc4),                                  // TimePix3 boards
    strip: L(0x2458c8),                                // Si strip layers
    magnet: L(0xd96a1e),                               // NdFeB rings
    bracket: L(0x4c5054),
  };
  const box = (w, h, d, mat, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    g.add(m);
    return m;
  };

  // MLI 包覆盒：四面侧板（±z 端开孔径，粒子入出口）
  const T = 0.008;
  box(0.21, T, 0.26, M.mli, 0, 0.105, 0);
  box(0.21, T, 0.26, M.mli, 0, -0.105, 0);
  box(T, 0.202, 0.26, M.mli, 0.105, 0, 0);
  box(T, 0.202, 0.26, M.mli, -0.105, 0, 0);
  // 端面框（±z 孔径口的四条边框，中间留空 = 粒子入出口）
  for (const s of [1, -1]) {
    box(0.21, 0.024, 0.006, M.frame, 0, 0.093, s * 0.132);
    box(0.21, 0.024, 0.006, M.frame, 0, -0.093, s * 0.132);
    box(0.024, 0.21, 0.006, M.frame, 0.093, 0, s * 0.132);
    box(0.024, 0.21, 0.006, M.frame, -0.093, 0, s * 0.132);
  }

  // TOF 闪烁体平面 ×2（z=±85.4 mm）
  for (const s of [1, -1]) box(0.18, 0.18, 0.010, M.tof, 0, 0, s * 0.0854);
  // TPX3 像素平面 ×2（z=±79 mm）
  for (const s of [1, -1]) box(0.16, 0.16, 0.004, M.tpx, 0, 0, s * 0.079);
  // 硅微条层：外侧 3+3（±59/64.5/70 mm）+ 中央 2（±5 mm）
  for (const z of [0.070, 0.0645, 0.059, 0.005, -0.005, -0.059, -0.0645, -0.070])
    box(0.15, 0.15, 0.002, M.strip, 0, 0, z);
  // NdFeB 环形永磁 ×2（z=±30.5 mm）——环内是磁谱仪弯折区
  for (const s of [1, -1]) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.056, 0.018, 12, 28), M.magnet);
    ring.position.z = s * 0.0305;
    g.add(ring);
  }
  // 安装支架：四根短柱 + 底板（-y 面贴卫星甲板）
  box(0.16, 0.006, 0.20, M.bracket, 0, -0.132, 0);
  for (const [bx, bz] of [[0.06, 0.08], [-0.06, 0.08], [0.06, -0.08], [-0.06, -0.08]])
    box(0.014, 0.05, 0.014, M.bracket, bx, -0.155, bz);

  return g;
}
