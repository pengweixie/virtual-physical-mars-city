// sci-rad-03 —— 玄关辐射哨兵柱(4H-SiC,室内伴生)
// 契约(MODELS.md §4b + hab-bot-01 先例):kind:"interior-companion",
//   host hab-foyer-01,host_pos [-5.78, 0.3, -11](左墙净段:居住区门 z=-3.5、
//   玄枢门 z=-8 警示垫止于 z≈-9.05,观景窗自 z=-13.05 起;地坪顶面 y=0.3)。
//   贴墙细柱,背贴 x=-6.0 墙内面,前面(剖切+屏)朝 +X 室内。
// 设计输入(E:\Claude\mars_rad_sic 账3):30 m 岩 = 7800 g/cm² = 52 个强子
//   e 折长度,GCR 强子杀绝;屏上"偶尔一跳"主角是 µ 道(×0.03 → ~83 s)+
//   建材/环境 γ 道 → 合并 ~45 s 一跳。器件同 sci-rad-02(4H-SiC PiN,
//   LGAD 同外延栈,室温零冷却零遮光——室内常亮灯光对它是不存在的,账4)。
// 动画:animate 只驱动 blip 点;屏底/率条/状态灯进 nightMats(室内常亮)。

export const meta = {
  id: 'sci-rad-03',
  name: '玄关辐射哨兵柱(4H-SiC)',
  name_en: 'Foyer Radiation Sentinel (4H-SiC)',
  size_m: 1.93,           // validate 实测(高)
  size_axis: 'height',
  kind: 'interior-companion',
  host: 'hab-foyer-01',
  effects: [],
};

export function build(THREE) {
  const group = new THREE.Group();
  group.name = meta.id;
  const nightMats = [];
  const hash = (k) => { const s = Math.sin(k * 12.9898 + 78.233) * 43758.5453; return s - Math.floor(s); };

  /* ---------------- 材质(与玄关同族的室内质感) ---------------- */
  const M = {
    body:   new THREE.MeshStandardMaterial({ color: 0xd9d5cb, roughness: 0.75 }),
    trim:   new THREE.MeshStandardMaterial({ color: 0x3a3e44, roughness: 0.55, metalness: 0.5 }),
    steel:  new THREE.MeshStandardMaterial({ color: 0x555a61, roughness: 0.55, metalness: 0.6 }),
    dark:   new THREE.MeshStandardMaterial({ color: 0x22252a, roughness: 0.7 }),
    hdpe:   new THREE.MeshStandardMaterial({ color: 0xe9e7de, roughness: 0.85 }),
    lif:    new THREE.MeshStandardMaterial({ color: 0xf0e2b8, roughness: 0.8 }),
    sic:    new THREE.MeshStandardMaterial({ color: 0x25311f, roughness: 0.35, metalness: 0.3 }),
    copper: new THREE.MeshStandardMaterial({ color: 0xb87333, roughness: 0.4, metalness: 0.7 }),
    cableK: new THREE.MeshStandardMaterial({ color: 0x191b1e, roughness: 0.8 }),
  };
  const screenMat = new THREE.MeshStandardMaterial({ color: 0x0a1410, emissive: 0x2bd478, emissiveIntensity: 1.4, roughness: 0.5 });
  const blipMat   = new THREE.MeshStandardMaterial({ color: 0x061408, emissive: 0x4dff9a, emissiveIntensity: 0.2, roughness: 0.5 });
  const barMat    = new THREE.MeshStandardMaterial({ color: 0x0c2014, emissive: 0x3ee08a, emissiveIntensity: 1.4, roughness: 0.5 });
  const ledG      = new THREE.MeshStandardMaterial({ color: 0x061a0a, emissive: 0x3ee06a, emissiveIntensity: 1.8, roughness: 0.5 });
  nightMats.push(screenMat, barMat, ledG);

  const inner = new THREE.Group();          // 建模面朝 +Z,整体转 90° 使其朝 +X(室内)
  group.add(inner);
  function box(w, h, d, mat, x, y, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    inner.add(m);
    return m;
  }

  /* ---------------- 柱体(贴墙细柱,总高 ~2.1) ---------------- */
  box(0.5, 0.06, 0.4, M.steel, 0, 0.03, 0);            // 地脚板
  box(0.3, 1.32, 0.26, M.body, 0, 0.72, -0.02);        // 柱身
  for (const sx of [-1, 1])                             // 竖包边
    box(0.04, 1.32, 0.04, M.trim, sx * 0.14, 0.72, 0.1);
  box(0.34, 0.05, 0.3, M.trim, 0, 1.4, -0.02);         // 颈环
  // 检修门语法(前面):框 + 扇 + 闩 + 双铰链
  box(0.24, 0.5, 0.02, M.trim, 0, 0.62, 0.115);
  box(0.19, 0.42, 0.03, M.body, 0, 0.62, 0.122);
  box(0.035, 0.07, 0.035, M.dark, 0.065, 0.6, 0.135);
  box(0.04, 0.03, 0.03, M.dark, -0.09, 0.76, 0.13);
  box(0.04, 0.03, 0.03, M.dark, -0.09, 0.48, 0.13);
  // 背部走线槽(贴墙)+ 接线箱
  box(0.06, 1.9, 0.04, M.cableK, 0.08, 0.98, -0.16);
  box(0.14, 0.18, 0.08, M.steel, -0.08, 0.32, -0.13);

  /* ---------------- 探测舱(剖切开放壳体,前面敞开) ---------------- */
  const hy = 1.68;
  box(0.44, 0.04, 0.38, M.trim, 0, hy + 0.18, -0.02);  // 顶板
  box(0.44, 0.04, 0.38, M.trim, 0, hy - 0.18, -0.02);  // 底板
  box(0.04, 0.32, 0.38, M.body, -0.2, hy, -0.02);      // 左右壁
  box(0.04, 0.32, 0.38, M.body, 0.2, hy, -0.02);
  box(0.03, 0.32, 0.03, M.trim, -0.185, hy, 0.16);     // 开口面边柱
  box(0.03, 0.32, 0.03, M.trim, 0.185, hy, 0.16);
  // 叠层因果链(背→前):慢化片 → LiF → SiC 2×2 → 铜读出 → 前放
  box(0.34, 0.26, 0.06, M.hdpe, 0, hy, -0.16);
  box(0.3, 0.22, 0.015, M.lif, 0, hy, -0.1);
  for (const sx of [-1, 1]) for (const sy of [-1, 1])
    box(0.12, 0.085, 0.012, M.sic, sx * 0.072, hy + sy * 0.052, -0.055);
  box(0.32, 0.23, 0.012, M.copper, 0, hy, 0.0);
  box(0.09, 0.06, 0.05, M.dark, 0.1, hy - 0.09, 0.06);
  box(0.015, 0.22, 0.015, M.cableK, -0.12, hy - 0.28, 0.08);

  /* ---------------- 计数屏 + 率条 + 状态灯 ---------------- */
  box(0.28, 0.2, 0.03, M.trim, 0, 1.18, 0.12);
  box(0.24, 0.16, 0.015, screenMat, 0, 1.18, 0.138);
  box(0.05, 0.05, 0.012, blipMat, 0.065, 1.205, 0.148);
  for (let i = 0; i < 8; i++) {                        // 率条 8 段亮 2 = "安静"
    box(0.022, 0.02, 0.011, i < 2 ? barMat : M.dark, -0.09 + i * 0.026, 1.128, 0.148);
  }
  box(0.04, 0.04, 0.015, ledG, -0.1, 1.32, 0.125);

  inner.rotation.y = Math.PI / 2;                      // 前面 +Z → +X(朝室内)

  /* ---------------- POI 锚点 ---------------- */
  for (const [id, y] of [['cabin', 1.68], ['screen', 1.18], ['net', 2.0]]) {
    const a = new THREE.Object3D();
    a.name = 'poi_' + id;
    a.position.set(0.15, y, 0);
    group.add(a);
  }

  /* ---------------- 动画:偶尔一跳(~45 s,确定性) ---------------- */
  function blipLevel(t, T, p, seed) {
    const k = Math.floor(t / T);
    if (hash(k * 2.71 + seed + 13.7) > p) return 0;
    const o = hash(k * 1.618 + seed) * (T - 0.9);
    const dt = t - k * T - o;
    return dt >= 0 && dt < 0.8 ? Math.exp(-dt / 0.16) : 0;
  }
  group.userData.animate = (t) => {
    blipMat.emissiveIntensity = 0.2 + 3.2 * blipLevel(t, 45, 0.9, 3.3);
  };

  group.userData.nightMats = nightMats;
  return group;
}
