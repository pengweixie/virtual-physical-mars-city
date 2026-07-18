// hab-clinic-01 —— 地下城医务室（PET-CT 影像套间）
// 契约（内部场景变体，同 hab-foyer-01）：米制；原点 = 入口地面中心；
//   房间向 -Z 延伸，门开口朝 +Z；y >= 0（室内地面 y=0）；<=5 万面。
// 主角：忠实复刻隔壁 pet-ct-design 的临床全身 PET-CT（Ø700 孔径、机架
//   2.5x2.12x1.4m、等中心离地 1.15m、青色喇叭发光环、橙色 PET 环 37 模块、
//   蓝色 CT 转盘、两级升降病床）。尺寸源：pet-ct-design/system/out/system_params.json
//   + system/blender/build_petct.py。Blender(竖直=Z,孔径=Y) → three(竖直=Y,孔径=Z)。
// 布局：扫描间 + 带铅玻璃观察窗的操作间 + PET 热室传递窗（FDG 剂量）。
// userData.nightMats = 发光材质（室内常亮）；userData.lights = 点光源锚点。

export const meta = {
  id: 'hab-clinic-01',
  name: '地下城医务室',
  size_m: 10,
  size_axis: 'width',
  effects: ['glow_windows'],
};

export function build(THREE) {
  const group = new THREE.Group();
  group.name = meta.id;
  const nightMats = [];

  /* ---------------- 材质 ---------------- */
  const M = {
    // 房间
    wall:    new THREE.MeshStandardMaterial({ color: 0xe8e6e0, roughness: 0.85 }), // 洁净白墙板
    wallLow: new THREE.MeshStandardMaterial({ color: 0xbfa079, roughness: 0.93 }), // 打印土层裙脚（呼应城市）
    floor:   new THREE.MeshStandardMaterial({ color: 0xcdd2d4, roughness: 0.35, metalness: 0.05 }), // 医用地胶
    ceil:    new THREE.MeshStandardMaterial({ color: 0xdedcd6, roughness: 0.9 }),
    trim:    new THREE.MeshStandardMaterial({ color: 0x8a9096, roughness: 0.5, metalness: 0.4 }),
    lead:    new THREE.MeshStandardMaterial({ color: 0x6f7478, roughness: 0.6, metalness: 0.5 }),  // 铅防护
    leadGlass: new THREE.MeshStandardMaterial({ color: 0xbfd8d8, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.28 }),
    steel:   new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.4, metalness: 0.7 }),
    dark:    new THREE.MeshStandardMaterial({ color: 0x2a2d31, roughness: 0.5, metalness: 0.4 }),
    red:     new THREE.MeshStandardMaterial({ color: 0xb03024, roughness: 0.6 }),
    pad:     new THREE.MeshStandardMaterial({ color: 0x8a8f96, roughness: 0.7 }),
    yellow:  new THREE.MeshStandardMaterial({ color: 0xd9b021, roughness: 0.6 }),
    // PET-CT 机（取自 build_petct.py 配色）
    shell:   new THREE.MeshStandardMaterial({ color: 0xe6e8ec, roughness: 0.28, metalness: 0.05 }), // 光泽白机壳
    shell2:  new THREE.MeshStandardMaterial({ color: 0xd2d5da, roughness: 0.35, metalness: 0.1 }),
    band:    new THREE.MeshStandardMaterial({ color: 0x282b30, roughness: 0.45, metalness: 0.4 }),  // 深色带
    glass:   new THREE.MeshStandardMaterial({ color: 0x06070a, roughness: 0.12, metalness: 0.2 }),  // 屏玻璃
    rotor:   new THREE.MeshStandardMaterial({ color: 0x24262b, roughness: 0.65, metalness: 0.5 }),
    ctblu:   new THREE.MeshStandardMaterial({ color: 0x1a3fa6, roughness: 0.35, metalness: 0.3 }),   // CT 载荷蓝
    petor:   new THREE.MeshStandardMaterial({ color: 0xe64d0a, roughness: 0.4, metalness: 0.2 }),    // PET 模块橙
    gold:    new THREE.MeshStandardMaterial({ color: 0xd99e2e, roughness: 0.35, metalness: 1.0 }),   // 滑环金
    pallet:  new THREE.MeshStandardMaterial({ color: 0x191a1c, roughness: 0.45, metalness: 0.1 }),
  };
  // 发光材质 → nightMats
  const G = {
    ring:    new THREE.MeshStandardMaterial({ color: 0x0a2224, emissive: 0x25d8e6, emissiveIntensity: 2.6, roughness: 0.4 }), // 喇叭口青环（招牌）
    panel:   new THREE.MeshStandardMaterial({ color: 0x2a2a24, emissive: 0xfff4d8, emissiveIntensity: 1.6, roughness: 0.7 }), // 顶灯板
    scr:     new THREE.MeshStandardMaterial({ color: 0x081018, emissive: 0x4aa6ff, emissiveIntensity: 1.7, roughness: 0.5 }), // 显示器蓝屏
    scrCT:   new THREE.MeshStandardMaterial({ color: 0x0a1410, emissive: 0x38d878, emissiveIntensity: 1.5, roughness: 0.5 }), // 机上屏
    dose:    new THREE.MeshStandardMaterial({ color: 0x1a1206, emissive: 0xffb030, emissiveIntensity: 2.2, roughness: 0.5 }), // 热室 FDG 剂量窗
    estop:   new THREE.MeshStandardMaterial({ color: 0x200404, emissive: 0xff3020, emissiveIntensity: 1.4, roughness: 0.5 }),
    exit:    new THREE.MeshStandardMaterial({ color: 0x04180a, emissive: 0x30e060, emissiveIntensity: 1.8, roughness: 0.5 }), // 安全出口
    warn:    new THREE.MeshStandardMaterial({ color: 0x1a1500, emissive: 0xffd21a, emissiveIntensity: 1.5, roughness: 0.5 }), // 辐射警示背光
    nameplate: new THREE.MeshStandardMaterial({ color: 0x0a1a1c, emissive: 0x25d8e6, emissiveIntensity: 1.2, roughness: 0.5 }),
  };
  for (const k in G) nightMats.push(G[k]);

  /* ---------------- 网格工具（创建并加入指定父级） ---------------- */
  function box(parent, w, h, d, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
    parent.add(m); return m;
  }
  // 沿轴圆柱：axis 'Y'(默认竖直) / 'Z'(孔径向) / 'X'
  function cyl(parent, rt, rb, h, seg, mat, x, y, z, axis = 'Y', open = false) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg, 1, open), mat);
    m.position.set(x, y, z);
    if (axis === 'Z') m.rotation.x = Math.PI / 2;
    else if (axis === 'X') m.rotation.z = Math.PI / 2;
    parent.add(m); return m;
  }
  function torusZ(parent, R, r, mat, x, y, z, seg = 64) {
    const m = new THREE.Mesh(new THREE.TorusGeometry(R, r, 12, seg), mat);
    m.position.set(x, y, z); // TorusGeometry 默认在 XY 平面、法线 +Z —— 正好朝孔径向
    parent.add(m); return m;
  }
  function ringZ(parent, ri, ro, mat, x, y, z, seg = 64) {
    const m = new THREE.Mesh(new THREE.RingGeometry(ri, ro, seg), mat);
    m.position.set(x, y, z);
    parent.add(m); return m;
  }
  function poi(parent, name, x, y, z) {
    const a = new THREE.Object3D(); a.name = 'poi_' + name; a.position.set(x, y, z);
    parent.add(a); return a;
  }

  /* ==========================================================
   * A. PET-CT 整机（本地组：等中心在原点，孔径沿 +Z，病床朝 +Z 出）
   *    Blender→three 换算：three.Z = -blender.Y，three.Y = blender.Z
   * ========================================================== */
  function makePetCt() {
    const g = new THREE.Group();
    const boreR = 0.35;

    // — 机壳（实体白箱；孔径靠深色衬筒 + 前环制造隧道感）—
    box(g, 2.50, 2.12, 0.24, M.shell, 0, 0.05, 0.28);   // 前脸 fascia（z 0.16..0.40）
    box(g, 2.32, 1.98, 1.06, M.shell, 0, 0.05, -0.37);  // 机身 body
    box(g, 2.02, 1.70, 0.20, M.shell2, 0, 0.05, -0.95); // 尾盖 cap
    box(g, 1.70, 0.24, 1.05, M.band, 0, -1.03, -0.30);  // 机座（落地）
    // 孔径衬筒（深色开口管，前端凸出机壳制造隧道）+ 尾封
    cyl(g, boreR + 0.01, boreR + 0.01, 1.55, 48, M.rotor, 0, 0, -0.32, 'Z', true);
    cyl(g, boreR + 0.005, boreR + 0.005, 0.02, 48, M.band, 0, 0, -1.05, 'Z'); // 隧道尽头暗封
    // 前脸圆环面板（把方机壳前面收成圆孔）
    ringZ(g, boreR, 1.06, M.shell, 0, 0.05, 0.401, 48);
    // 喇叭口（前大后小锥）+ 招牌青色发光环
    cyl(g, 0.47, boreR + 0.01, 0.14, 48, M.shell2, 0, 0.05, 0.33, 'Z', true);
    torusZ(g, 0.415, 0.02, G.ring, 0, 0.05, 0.44, 96);
    // 前脸控制屏（双暗玻璃）+ 急停 + 机上绿屏 + 铭牌
    for (const s of [-1, 1]) {
      box(g, 0.30, 0.20, 0.02, M.glass, s * 0.78, -0.55, 0.41);
      cyl(g, 0.024, 0.024, 0.02, 12, G.estop, s * 0.60, -0.55, 0.42, 'Z');
    }
    box(g, 0.26, 0.16, 0.008, G.scrCT, -0.78, -0.55, 0.421); // 左屏点亮
    box(g, 0.5, 0.12, 0.01, G.nameplate, -0.95, 0.82, 0.402); // “PET/CT”铭牌发光条

    // — 孔内窥见的内部件（低模暗示，透过孔径可见）—
    cyl(g, 0.335, 0.335, 0.06, 40, M.rotor, 0, 0, -0.20, 'Z');   // CT 结构转盘（暗环）
    box(g, 0.20, 0.13, 0.10, M.ctblu, 0, 0.26, -0.24);          // 球管（顶部蓝）
    box(g, 0.14, 0.09, 0.08, M.ctblu, 0.18, -0.10, -0.24, 0, 0, -0.5); // 探测器弧一角
    // PET 环 37 橙模块（深处 z≈-0.6，孔内可见一圈）
    const NMOD = 37, petR = 0.30 + 0.03;
    for (let i = 0; i < NMOD; i++) {
      const th = (i / NMOD) * Math.PI * 2;
      box(g, 0.052, 0.10, 0.10, M.petor,
        petR * Math.sin(th), petR * Math.cos(th), -0.60, 0, 0, -th);
    }
    // 滑环（盘后 3 道金环，孔外后部略见）
    for (const yz of [-0.55, -0.6, -0.65]) torusZ(g, 0.5, 0.008, M.gold, 0, 0, yz, 48);

    // — 两级升降病床（从孔径朝 +Z 伸出室内）—
    box(g, 0.72, 0.06, 1.55, M.band, 0, -1.12, 1.55);   // 底板
    box(g, 0.46, 0.44, 0.36, M.shell2, 0, -0.85, 1.55); // 升降柱一级
    box(g, 0.40, 0.34, 0.38, M.shell, 0, -0.55, 1.50);  // 升降柱二级
    box(g, 0.50, 0.10, 0.90, M.band, 0, -0.36, 1.45);   // 托架
    box(g, 0.52, 0.05, 2.75, M.pallet, 0, -0.295, 0.78); // 长床板（伸入孔径）
    box(g, 0.48, 0.04, 2.30, M.pad, 0, -0.255, 0.95);    // 床垫
    box(g, 0.40, 0.05, 0.28, M.pad, 0, -0.245, 2.05, -0.14); // 头枕（微仰）

    poi(g, 'petct', 0, 0.6, -0.2);   // 主设备锚
    poi(g, 'bore', 0, 0, 0.44);      // 孔径/发光环
    return g;
  }

  /* ==========================================================
   * B. 房间外壳（扫描间 9×9.5×3.3，入口在 +Z，门洞居中）
   * ========================================================== */
  const RW = 9.0, RD = 9.5, RH = 3.3, T = 0.3;
  const xL = -RW / 2, xR = RW / 2, zBack = -RD;
  // 地面 / 天花
  box(group, RW + 2 * T, 0.1, RD + T, M.floor, 0, -0.05, -RD / 2 + 0.15);
  box(group, RW + 2 * T, 0.2, RD + T, M.ceil, 0, RH + 0.1, -RD / 2 + 0.15);
  // 打印土层裙脚（沿墙脚一圈 0.5m 高，呼应城市结构）
  function skirt(x, z, w, d) { box(group, w, 0.5, d, M.wallLow, x, 0.25, z); }
  // 侧墙 + 背墙（白墙板，墙脚裙）
  box(group, T, RH, RD, M.wall, xL - T / 2, RH / 2, -RD / 2); skirt(xL - T / 2, -RD / 2, T, RD);
  box(group, T, RH, RD, M.wall, xR + T / 2, RH / 2, -RD / 2); skirt(xR + T / 2, -RD / 2, T, RD);
  box(group, RW + 2 * T, RH, T, M.wall, 0, RH / 2, zBack - T / 2); skirt(0, zBack - T / 2, RW, T);
  // 前墙（带门洞：宽 2.6 高 2.4，居中）
  const doorW = 2.6, doorH = 2.4;
  box(group, (RW - doorW) / 2, RH, T, M.wall, -(doorW / 2 + (RW - doorW) / 4), RH / 2, 0.3 - T / 2);
  box(group, (RW - doorW) / 2, RH, T, M.wall,  (doorW / 2 + (RW - doorW) / 4), RH / 2, 0.3 - T / 2);
  box(group, doorW, RH - doorH, T, M.wall, 0, doorH + (RH - doorH) / 2, 0.3 - T / 2);
  box(group, doorW + 0.3, 0.16, 0.16, M.trim, 0, doorH + 0.08, 0.3);      // 门楣
  box(group, 0.5, 0.28, 0.06, G.exit, 0, doorH + 0.35, 0.28);            // 安全出口标志
  // 辐射管控警示牌（门侧，黄色背光）
  box(group, 0.5, 0.5, 0.04, G.warn, doorW / 2 + 0.5, 1.7, 0.3);

  // 放置 PET-CT：等中心 (0.4, 1.15, -5.2)，孔径沿 Z，病床朝 +Z
  const petct = makePetCt();
  petct.position.set(0.4, 1.15, -5.2);
  group.add(petct);

  /* ==========================================================
   * C. 操作间（前右角，铅防护隔断 + 铅玻璃观察窗 + 控制台）
   * ========================================================== */
  const bx0 = 1.7, bz0 = -2.7; // 隔断内角
  // 沿 Z 的隔断（x=bx0），中段留观察窗
  box(group, 0.2, RH, Math.abs(bz0) + 0.3, M.lead, bx0, RH / 2, (0.3 + bz0) / 2); // 满墙（下面挖窗用叠加窗框近似）
  // 观察窗（铅玻璃，嵌在隔断朝扫描间一侧）
  box(group, 0.06, 1.0, 1.6, M.leadGlass, bx0 - 0.09, 1.5, -1.15);
  box(group, 0.14, 1.3, 1.9, M.lead, bx0, 1.5, -1.15);   // 窗框（略厚，压在墙上形成洞口感）
  box(group, 0.08, 1.0, 1.6, M.leadGlass, bx0, 1.5, -1.15); // 玻璃芯
  // 沿 X 的隔断（z=bz0）
  box(group, xR - bx0 + 0.2, RH, 0.2, M.lead, (bx0 + xR) / 2, RH / 2, bz0);
  // 控制台（U 形桌 + 三联显示器 + 座椅），操作员朝 -X 看窗
  box(group, 1.4, 0.06, 0.8, M.dark, 3.1, 0.78, -1.2);        // 桌面
  box(group, 0.06, 0.75, 0.8, M.dark, 3.78, 0.4, -1.2);       // 桌腿侧板
  box(group, 0.06, 0.75, 0.8, M.dark, 2.42, 0.4, -1.2);
  for (const dz of [-0.55, -0.05, 0.45]) {                    // 三联蓝屏（面朝 -X）
    box(group, 0.05, 0.34, 0.44, G.scr, 2.55, 1.12, dz + -0.7, 0, 0, 0);
    box(group, 0.05, 0.02, 0.44, M.dark, 2.53, 0.93, dz + -0.7);
  }
  box(group, 0.4, 0.08, 0.4, M.dark, 3.1, 0.5, -0.6);         // 座椅盘
  cyl(group, 0.04, 0.04, 0.5, 8, M.steel, 3.1, 0.25, -0.6);
  box(group, 0.4, 0.5, 0.06, M.dark, 3.1, 0.85, -0.42);       // 椅背
  poi(group, 'console', 3.1, 1.2, -1.2);

  /* ==========================================================
   * D. PET 热室传递窗（-X 墙，FDG 剂量热窗，招牌琥珀发光）+ 医疗杂项
   * ========================================================== */
  box(group, 0.14, 1.0, 1.0, M.lead, xL + 0.08, 1.2, -6.5);     // 铅传递箱
  box(group, 0.05, 0.5, 0.5, G.dose, xL + 0.16, 1.25, -6.5);    // 剂量热窗（琥珀）
  box(group, 0.16, 0.16, 1.1, M.yellow, xL + 0.08, 1.8, -6.5);  // 上警示条
  poi(group, 'hotlab', xL + 0.1, 1.3, -6.5);
  // 抢救车（红色多屉，靠背墙）
  box(group, 0.5, 0.9, 0.7, M.red, -3.4, 0.45, zBack + 0.6);
  for (let i = 0; i < 4; i++) box(group, 0.52, 0.02, 0.72, M.dark, -3.4, 0.25 + i * 0.18, zBack + 0.6);
  box(group, 0.54, 0.05, 0.74, M.steel, -3.4, 0.93, zBack + 0.6);
  // 输液架
  cyl(group, 0.03, 0.03, 1.9, 8, M.steel, -2.4, 0.95, -4.2);
  cyl(group, 0.18, 0.18, 0.04, 12, M.steel, -2.4, 0.03, -4.2);
  for (const a of [0, 2.1, 4.2]) box(group, 0.12, 0.03, 0.03, M.steel, -2.4 + 0.14 * Math.cos(a), 1.85, -4.2 + 0.14 * Math.sin(a), 0, a, 0);
  // 洗手台 + 吊柜（-X 墙近门）
  box(group, 0.12, 0.9, 1.6, M.wall, xL + 0.1, 0.45, -1.6);     // 台体
  box(group, 0.5, 0.06, 1.5, M.trim, xL + 0.35, 0.9, -1.6);     // 台面
  box(group, 0.3, 0.1, 0.4, M.steel, xL + 0.35, 0.86, -1.6);    // 水槽
  cyl(group, 0.02, 0.02, 0.25, 8, M.steel, xL + 0.35, 1.05, -1.35);
  box(group, 0.35, 0.6, 1.6, M.wall, xL + 0.1, 2.4, -1.6);      // 吊柜
  // 壁挂读片显示器（背墙）
  box(group, 1.4, 0.85, 0.08, M.dark, 1.5, 1.9, zBack + 0.12);
  box(group, 1.28, 0.72, 0.02, G.scr, 1.5, 1.9, zBack + 0.17);
  // 检查床（近门 +X 侧靠墙）
  box(group, 0.7, 0.5, 2.0, M.trim, 3.6, 0.55, -0.9);
  box(group, 0.66, 0.12, 1.95, M.pad, 3.6, 0.86, -0.9);

  /* ==========================================================
   * E. 顶部 LED 灯板阵（发光 → nightMats）+ 点光源锚点
   * ========================================================== */
  for (const gx of [-2.6, 0.4, 2.8]) {
    for (const gz of [-1.8, -4.6, -7.6]) {
      box(group, 1.2, 0.06, 0.6, G.panel, gx, RH - 0.12, gz);
      box(group, 1.3, 0.05, 0.7, M.trim, gx, RH - 0.06, gz);
    }
  }

  /* ---------------- 贴地归一化 + userData ---------------- */
  const bb = new THREE.Box3().setFromObject(group);
  const dy = isFinite(bb.min.y) ? bb.min.y : 0;
  if (Math.abs(dy) > 1e-4) for (const c of group.children) c.position.y -= dy;

  group.userData = {
    lights: [
      { color: 0xfff4d8, pos: [-1, 3.0 - dy, -3.5], range: 12 },  // 扫描间顶光
      { color: 0xfff4d8, pos: [1.5, 3.0 - dy, -7], range: 12 },   // 后区顶光
      { color: 0x25d8e6, pos: [0.4, 1.15 - dy, -4.5], range: 5 },  // 孔径青环辉光
      { color: 0x4aa6ff, pos: [3.0, 1.35 - dy, -1.0], range: 2.2 }, // 操作台屏光（弱，防灌满小操作间）
    ],
    beams: [],
    nightMats,
  };
  return group;
}
