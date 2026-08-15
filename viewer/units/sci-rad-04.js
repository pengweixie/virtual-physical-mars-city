// sci-rad-04 —— 深地辐射哨兵柱(4H-SiC,室内伴生)
// 契约:kind:"interior-companion",host sci-deeplab-01,
//   host_pos [-8.5, 0, 9.5](洞室入口左手岩壁边:洞室 R15/长32,水罐 R7 居中,
//   控制间 (8.5,-8.5),entry (0,0,12),exitZone (0,15.2) r1.8——此位不挡
//   +Z 轴向的 TPC/水罐视线,不进出口圈,不压 POI)。前面朝水罐方向。
// 设计输入(E:\Claude\mars_rad_sic 账3):3000 m 岩 = 7.8e5 g/cm²,µ ×1e-6
//   (对表 sci-deeplab-01 portal 卡)→ µ 道 ~26 天一跳;中子只剩裸岩
//   radiogenic 底 ~1e-6 n/cm²/s。屏几乎不动——静默就是屏蔽账的活体证明。
//   屏上唯一的活动是 4 s 心跳灯与 ~30 s DAQ 自检脉冲(标定注入,不是计数)。
// 动画:animate 只驱动心跳/自检材质;屏底/率条(0 亮)/状态灯进 nightMats。

export const meta = {
  id: 'sci-rad-04',
  name: '深地辐射哨兵柱(4H-SiC)',
  name_en: 'Deep-Lab Radiation Sentinel (4H-SiC)',
  size_m: 2.24,           // validate 实测(高,含工作灯;缆槽使 x/z 包络更大,轴取 height)
  size_axis: 'height',
  kind: 'interior-companion',
  host: 'sci-deeplab-01',
  effects: [],
};

export function build(THREE) {
  const group = new THREE.Group();
  group.name = meta.id;
  const nightMats = [];
  const hash = (k) => { const s = Math.sin(k * 12.9898 + 78.233) * 43758.5453; return s - Math.floor(s); };

  /* ---------------- 材质(与深地实验室同族:不锈钢/机柜白) ---------------- */
  // 洞室边缘无点光,柱体材质加同色 emissive 托底(坑账 4 同法),否则一团黑
  const M = {
    body:   new THREE.MeshStandardMaterial({ color: 0xe8eaec, roughness: 0.5, metalness: 0.1, emissive: 0xe8eaec, emissiveIntensity: 0.22 }),
    trim:   new THREE.MeshStandardMaterial({ color: 0x3a3e44, roughness: 0.55, metalness: 0.5, emissive: 0x3a3e44, emissiveIntensity: 0.25 }),
    ss:     new THREE.MeshStandardMaterial({ color: 0xc2c6cb, roughness: 0.33, metalness: 0.75, emissive: 0xc2c6cb, emissiveIntensity: 0.18 }),
    dark:   new THREE.MeshStandardMaterial({ color: 0x22252a, roughness: 0.7 }),
    hdpe:   new THREE.MeshStandardMaterial({ color: 0xe9e7de, roughness: 0.85, emissive: 0xe9e7de, emissiveIntensity: 0.2 }),
    lif:    new THREE.MeshStandardMaterial({ color: 0xf0e2b8, roughness: 0.8, emissive: 0xf0e2b8, emissiveIntensity: 0.22 }),
    sic:    new THREE.MeshStandardMaterial({ color: 0x25311f, roughness: 0.35, metalness: 0.3, emissive: 0x25311f, emissiveIntensity: 0.35 }),
    copper: new THREE.MeshStandardMaterial({ color: 0xb87333, roughness: 0.4, metalness: 0.7, emissive: 0xb87333, emissiveIntensity: 0.25 }),
    cableK: new THREE.MeshStandardMaterial({ color: 0x191b1e, roughness: 0.8 }),
    bolt:   new THREE.MeshStandardMaterial({ color: 0x6a6d72, roughness: 0.6, metalness: 0.5, emissive: 0x6a6d72, emissiveIntensity: 0.2 }),
  };
  const lampMat = new THREE.MeshStandardMaterial({ color: 0x2a2418, emissive: 0xfff0d0, emissiveIntensity: 2.0, roughness: 0.6 });
  const screenMat = new THREE.MeshStandardMaterial({ color: 0x0a1014, emissive: 0x2b9ed4, emissiveIntensity: 1.3, roughness: 0.5 });
  const selfTest  = new THREE.MeshStandardMaterial({ color: 0x06131a, emissive: 0x4dd8ff, emissiveIntensity: 0.15, roughness: 0.5 });
  const heartMat  = new THREE.MeshStandardMaterial({ color: 0x061a0a, emissive: 0x3ee06a, emissiveIntensity: 0.6, roughness: 0.5 });
  nightMats.push(screenMat, lampMat);

  const inner = new THREE.Group();          // 建模面朝 +Z,再整体转向水罐
  group.add(inner);
  function box(w, h, d, mat, x, y, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    inner.add(m);
    return m;
  }

  /* ---------------- 基础:岩栓底板(深地语法) ---------------- */
  box(0.7, 0.05, 0.6, M.ss, 0, 0.025, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1])
    box(0.06, 0.09, 0.06, M.bolt, sx * 0.28, 0.06, sz * 0.24);

  /* ---------------- 柱身(自立,总高 ~2.1) ---------------- */
  box(0.32, 1.34, 0.3, M.body, 0, 0.72, 0);
  for (const sx of [-1, 1])
    box(0.04, 1.34, 0.04, M.trim, sx * 0.15, 0.72, 0.12);
  box(0.36, 0.05, 0.34, M.trim, 0, 1.42, 0);
  // 检修门语法(前面)
  box(0.24, 0.5, 0.02, M.trim, 0, 0.62, 0.152);
  box(0.19, 0.42, 0.03, M.body, 0, 0.62, 0.158);
  box(0.035, 0.07, 0.035, M.dark, 0.065, 0.6, 0.172);
  box(0.04, 0.03, 0.03, M.dark, -0.09, 0.76, 0.168);
  box(0.04, 0.03, 0.03, M.dark, -0.09, 0.48, 0.168);
  // 侧走线 + 地面缆槽(通向控制间方向)
  box(0.05, 1.7, 0.04, M.cableK, -0.19, 0.9, -0.05);
  box(0.16, 0.2, 0.1, M.ss, 0.2, 0.3, -0.08);
  box(0.2, 0.035, 2.6, M.cableK, 0.05, 0.018, -1.55);

  /* ---------------- 探测舱(剖切开放壳体) ---------------- */
  const hy = 1.7;
  box(0.46, 0.04, 0.4, M.trim, 0, hy + 0.18, 0);
  box(0.46, 0.04, 0.4, M.trim, 0, hy - 0.18, 0);
  box(0.04, 0.32, 0.4, M.body, -0.21, hy, 0);
  box(0.04, 0.32, 0.4, M.body, 0.21, hy, 0);
  box(0.03, 0.32, 0.03, M.trim, -0.195, hy, 0.17);
  box(0.03, 0.32, 0.03, M.trim, 0.195, hy, 0.17);
  // 叠层因果链:慢化片 → LiF → SiC 2×2 → 铜读出 → 前放
  box(0.36, 0.26, 0.06, M.hdpe, 0, hy, -0.16);
  box(0.32, 0.22, 0.015, M.lif, 0, hy, -0.1);
  for (const sx of [-1, 1]) for (const sy of [-1, 1])
    box(0.13, 0.09, 0.012, M.sic, sx * 0.078, hy + sy * 0.055, -0.055);
  box(0.34, 0.24, 0.012, M.copper, 0, hy, 0.0);
  box(0.09, 0.06, 0.05, M.dark, 0.11, hy - 0.09, 0.06);
  box(0.015, 0.24, 0.015, M.cableK, -0.13, hy - 0.29, 0.09);

  /* ---------------- 计数屏:率条 0 亮 + 心跳灯 + 自检脉冲点 ---------------- */
  box(0.28, 0.2, 0.03, M.trim, 0, 1.2, 0.16);
  box(0.24, 0.16, 0.015, screenMat, 0, 1.2, 0.178);
  box(0.05, 0.05, 0.012, selfTest, 0.065, 1.225, 0.188);      // 自检脉冲(青)
  for (let i = 0; i < 8; i++)                                  // 率条全暗 = 静默
    box(0.022, 0.02, 0.011, M.dark, -0.09 + i * 0.026, 1.148, 0.188);
  box(0.04, 0.04, 0.015, heartMat, -0.1, 1.34, 0.165);         // 心跳灯(呼吸)

  /* ---------------- 检修工作灯(悬臂,照亮剖切面) ---------------- */
  box(0.04, 0.32, 0.04, M.trim, 0.16, 2.08, -0.06);            // 灯杆
  box(0.04, 0.04, 0.34, M.trim, 0.16, 2.22, 0.1);              // 悬臂
  box(0.16, 0.05, 0.14, M.trim, 0.16, 2.2, 0.26);              // 灯罩
  box(0.13, 0.02, 0.11, lampMat, 0.16, 2.17, 0.26);            // 发光面(朝下)

  inner.rotation.y = 2.412;   // 前面 +Z → 指向水罐中心((-8.5,9.5)→(0,0))

  /* ---------------- POI 锚点 ---------------- */
  for (const [id, y] of [['cabin', 1.7], ['screen', 1.2], ['net', 2.0]]) {
    const a = new THREE.Object3D();
    a.name = 'poi_' + id;
    a.position.set(0, y, 0.2);
    group.add(a);
  }

  /* ---------------- 动画:心跳呼吸 + ~30 s 自检脉冲(无计数 blip) ---------------- */
  group.userData.animate = (t) => {
    heartMat.emissiveIntensity = 0.5 + 0.7 * (0.5 + 0.5 * Math.sin(t * 1.57));
    const k = Math.floor(t / 30);
    const o = 2 + hash(k * 1.618 + 5.5) * 24;
    const dt = t - k * 30 - o;
    const lv = dt >= 0 && dt < 1.2 ? Math.exp(-dt / 0.35) : 0;
    selfTest.emissiveIntensity = 0.15 + 2.6 * lv;
  };

  group.userData.nightMats = nightMats;
  return group;
}
