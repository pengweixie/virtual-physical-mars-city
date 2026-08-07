// hab-quarter-01 —— 地下城居住区(舱室 + 水培农场 + 公共区 + B 世界休息舱)
// 契约(室内场景 §4b):米制;原点=厅中心地面;入口朝 +Z;引擎平地 y=0。
// 设计依据(知识卡锚点):
//   水账  res-rodwell-01(Rodwell 井寿命 669 sol 台账)/ 电账 pwr-fusion-01(176 MWe 净电)
//   气账  res-isru-01(Sabatier 甲烷厂,CO2/H2O 循环)/ ECLSS 标准人日代谢数
//   叙事  idea_worldAB(World A/B:51% 的人更常「住」在 B——「眼镜」带引号)
// 核心不做黑盒:一间舱室整面敞开(床铺/书桌/私人物品可读);农场三层架
//   紫光直给「植物要的光谱」;生保墙的管路从农场接到回收机——水循环用几何讲。
export const meta = {
  id: 'hab-quarter-01',
  name: '地下城居住区',
  name_en: 'Undercity Residential Quarter',
  kind: 'interior',
  size_m: 20.4,          // 实测包围盒最大边(validate_unit: 20.42)
};

export function build(THREE) {
  const group = new THREE.Group();
  const M = {
    floor:  new THREE.MeshStandardMaterial({ color: 0x8a7a68, roughness: 0.8 }),                   // 暖木色地坪
    rug:    new THREE.MeshStandardMaterial({ color: 0x9c4a35, roughness: 0.9 }),                   // 地毯
    wall:   new THREE.MeshStandardMaterial({ color: 0xbfa079, roughness: 0.93 }),                  // 打印土层墙
    wallDim: new THREE.MeshStandardMaterial({ color: 0xa8895f, roughness: 0.94 }),
    vault:  new THREE.MeshStandardMaterial({ color: 0xb0916b, roughness: 0.95 }),
    steel:  new THREE.MeshStandardMaterial({ color: 0x9aa2a8, roughness: 0.45, metalness: 0.7 }),
    frame:  new THREE.MeshStandardMaterial({ color: 0x39404a, roughness: 0.55, metalness: 0.55 }),
    white:  new THREE.MeshStandardMaterial({ color: 0xd9d5cb, roughness: 0.8 }),
    cabin:  new THREE.MeshStandardMaterial({ color: 0xcabb9e, roughness: 0.85 }),                  // 舱室外板
    doorM:  new THREE.MeshStandardMaterial({ color: 0x3b3f45, roughness: 0.58, metalness: 0.55 }),
    wood:   new THREE.MeshStandardMaterial({ color: 0x7a5a3a, roughness: 0.8 }),                   // 家具木
    fabric: new THREE.MeshStandardMaterial({ color: 0x4a6a8a, roughness: 0.95 }),                  // 床品蓝
    fabric2: new THREE.MeshStandardMaterial({ color: 0x8a6a4a, roughness: 0.95 }),
    leaf:   new THREE.MeshStandardMaterial({ color: 0x3f7a3a, roughness: 0.9 }),                   // 绿植
    leafY:  new THREE.MeshStandardMaterial({ color: 0x6a9a45, roughness: 0.9 }),
    trunk:  new THREE.MeshStandardMaterial({ color: 0x5a4530, roughness: 0.95 }),
    soil:   new THREE.MeshStandardMaterial({ color: 0x40342a, roughness: 1.0 }),
    tray:   new THREE.MeshStandardMaterial({ color: 0xd8dde0, roughness: 0.6 }),                   // 水培槽
    pipe:   new THREE.MeshStandardMaterial({ color: 0x6a8a9a, roughness: 0.5, metalness: 0.5 }),   // 水管青
    pod:    new THREE.MeshStandardMaterial({ color: 0xd4d8db, roughness: 0.4, metalness: 0.2 }),   // VR 躺舱
    podPad: new THREE.MeshStandardMaterial({ color: 0x2a3a4a, roughness: 0.9 }),
    hazardY: new THREE.MeshStandardMaterial({ color: 0xc7a03c, roughness: 0.7 }),
    hazardK: new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.7 }),
  };
  const G = {
    sky:    new THREE.MeshStandardMaterial({ color: 0x181410, emissive: 0xffe6bb, emissiveIntensity: 1.9 }),  // 人造天穹带
    lamp:   new THREE.MeshStandardMaterial({ color: 0x2a2418, emissive: 0xfff0d0, emissiveIntensity: 2.0 }),  // 暖顶灯
    pendant: new THREE.MeshStandardMaterial({ color: 0x241d12, emissive: 0xffd9a0, emissiveIntensity: 2.2 }), // 餐区吊灯
    grow:   new THREE.MeshStandardMaterial({ color: 0x2a0a2a, emissive: 0xe85ae8, emissiveIntensity: 2.2 }),  // 植物灯洋红
    teal:   new THREE.MeshStandardMaterial({ color: 0x0a2a30, emissive: 0x4fd8e8, emissiveIntensity: 2.0 }),
    ledG:   new THREE.MeshStandardMaterial({ color: 0x11220f, emissive: 0x4fe86a, emissiveIntensity: 2.0 }),
    sign:   new THREE.MeshStandardMaterial({ color: 0x2a2016, emissive: 0xffc878, emissiveIntensity: 2.0 }),
    podRing: new THREE.MeshStandardMaterial({ color: 0x081a2a, emissive: 0x4a9ee8, emissiveIntensity: 1.8 }), // 躺舱光环
    bScreen: new THREE.MeshStandardMaterial({ color: 0x060a12, emissive: 0x1a2a4a, emissiveIntensity: 1.5 }), // B 世界屏底
    bCity:  new THREE.MeshStandardMaterial({ color: 0x101a30, emissive: 0x6ab0ff, emissiveIntensity: 1.9 }),  // B 世界城市线条
    winGlow: new THREE.MeshStandardMaterial({ color: 0x241d12, emissive: 0xffd9a0, emissiveIntensity: 1.8 }), // 舱室小窗
  };

  function box(w, h, d, mat, x, y, z, rx = 0, rz = 0, parent = group) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    if (rx) m.rotation.x = rx;
    if (rz) m.rotation.z = rz;
    parent.add(m);
    return m;
  }
  function cyl(r1, r2, h, mat, x, y, z, seg = 14, parent = group) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), mat);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  }
  function poi(id, x, y, z) {
    const a = new THREE.Object3D();
    a.name = 'poi_' + id;
    a.position.set(x, y, z);
    group.add(a);
  }
  let seed = 7;
  const rng = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  /* ==========================================================
   * 1. 洞室壳体:净 20×17,土层墙 + 折面拱顶;入口 +Z
   * ========================================================== */
  function layeredWall(len, height, thick, mat) {
    const g = new THREE.Group();
    const layerH = 0.5;
    const n = Math.round(height / layerH);
    for (let i = 0; i < n; i++) {
      const t = (i % 2 === 0 ? thick : thick * 0.76) + (rng() - 0.5) * 0.05;
      const l = len + (rng() - 0.5) * 0.1;
      const layer = new THREE.Mesh(new THREE.BoxGeometry(l, layerH * 1.04, t), mat);
      layer.position.y = (i + 0.5) * layerH + 0.011;
      g.add(layer);
    }
    return g;
  }
  box(20.1, 0.3, 17.6, M.floor, 0, -0.14, -0.5);
  const wallL = layeredWall(17.4, 5, 0.7, M.wall);
  wallL.rotation.y = Math.PI / 2;
  wallL.position.set(-9.85, 0, -0.5);
  group.add(wallL);
  const wallR = layeredWall(17.4, 5, 0.7, M.wall);
  wallR.rotation.y = Math.PI / 2;
  wallR.position.set(9.85, 0, -0.5);
  group.add(wallR);
  const wallB = layeredWall(19.8, 5, 0.7, M.wall);
  wallB.position.set(0, 0, -8.85);
  group.add(wallB);
  const wallF1 = layeredWall(7.6, 5, 0.7, M.wall);
  wallF1.position.set(-6.2, 0, 7.85);
  group.add(wallF1);
  const wallF2 = layeredWall(7.6, 5, 0.7, M.wall);
  wallF2.position.set(6.2, 0, 7.85);
  group.add(wallF2);
  box(4.9, 2.4, 0.7, M.wallDim, 0, 4.0, 7.85);           // 门楣
  // 折面拱顶 + 人造天穹光带(中脊两条)
  box(7.4, 0.35, 18.1, M.vault, -6.4, 6.0, -0.5, 0, 0.5);
  box(7.4, 0.35, 18.1, M.vault,  6.4, 6.0, -0.5, 0, -0.5);
  box(7.8, 0.35, 18.1, M.vault,  0, 7.6, -0.5);
  box(20.0, 3.0, 0.4, M.wallDim, 0, 6.2, -8.75);         // 尾山墙(封拱顶黑三角)
  box(20.0, 3.0, 0.4, M.wallDim, 0, 6.2, 7.75);          // 前山墙
  box(0.9, 0.1, 16.8, G.sky, -1.6, 7.42, -0.5);          // 天穹带(暖光,模拟昼夜街灯)
  box(0.9, 0.1, 16.8, G.sky,  1.6, 7.42, -0.5);
  for (const lz of [-6, 0, 5.5]) box(4.6, 0.1, 0.3, G.lamp, 0, 7.3, lz);

  /* ==========================================================
   * 2. 入口门组(+Z 通玄关)+ 地表电梯龛(+Z 右)
   * ========================================================== */
  box(0.3, 3.0, 0.24, M.frame, -2.15, 1.5, 7.6);
  box(0.3, 3.0, 0.24, M.frame,  2.15, 1.5, 7.6);
  box(4.6, 0.3, 0.24, M.frame, 0, 3.0, 7.6);
  box(1.9, 2.75, 0.14, M.steel, -1.0, 1.38, 7.66);
  box(1.9, 2.75, 0.14, M.steel,  1.0, 1.38, 7.66);
  box(2.6, 0.5, 0.12, G.sign, 0, 3.55, 7.65);
  for (let i = 0; i < 5; i++) {
    box(0.6, 0.02, 1.2, i % 2 === 0 ? M.hazardY : M.hazardK, -1.5 + i * 0.62, 0.03, 6.7);
  }
  box(0.16, 2.7, 2.4, M.frame, 6.4, 1.35, 7.65);          // 地表电梯龛(exitZone)
  box(1.0, 2.3, 0.08, M.steel, 5.9, 1.15, 7.72);
  box(1.0, 2.3, 0.08, M.steel, 6.9, 1.15, 7.72);
  box(1.7, 0.35, 0.07, G.sign, 6.4, 2.95, 7.7);

  /* ==========================================================
   * 3. 舱室排(左墙):4 间紧凑舱 + 1 间敞开样板舱(带全套家具)
   * ========================================================== */
  for (let k = 0; k < 4; k++) {                           // 关门的 4 间:门+舷窗+号牌
    const cz = 5.0 - k * 2.5;
    box(0.35, 3.0, 2.2, M.cabin, -9.35, 1.5, cz);         // 舱面板(凸出墙)
    box(0.12, 2.15, 1.0, M.doorM, -9.14, 1.1, cz);        // 舱门
    const win = box(0.1, 0.32, 0.32, G.winGlow, -9.12, 2.45, cz);  // 门上小窗(暖光)
    box(0.08, 0.2, 0.42, G.sign, -9.13, 2.9, cz);         // 号牌
    box(0.06, 0.05, 0.14, G.ledG, -9.1, 1.32, cz + 0.68); // 门禁灯
  }
  // 敞开样板舱(左后角,3.2×2.8 小间,面向房间敞开)
  const cab = new THREE.Group();
  cab.position.set(-8.1, 0, -6.6);
  group.add(cab);
  box(3.4, 3.0, 0.3, M.cabin, 0, 1.5, -1.55, 0, 0, cab);  // 舱背板
  box(0.3, 3.0, 3.0, M.cabin, -1.7, 1.5, 0, 0, 0, cab);   // 左端板
  box(0.3, 3.0, 3.0, M.cabin, 1.7, 1.5, 0, 0, 0, cab);    // 右端板
  box(3.4, 0.3, 3.2, M.cabin, 0, 3.0, 0, 0, 0, cab);      // 顶板
  box(3.2, 0.06, 3.0, M.rug, 0, 0.05, 0, 0, 0, cab);      // 舱内地毯
  box(2.0, 0.35, 1.0, M.wood, -0.5, 0.4, -0.9, 0, 0, cab);   // 床架
  box(1.9, 0.16, 0.92, M.fabric, -0.5, 0.66, -0.9, 0, 0, cab); // 床垫
  box(0.5, 0.12, 0.6, M.white, -1.2, 0.76, -0.9, 0, 0, cab);   // 枕头
  box(0.8, 0.7, 0.5, M.wood, 1.15, 0.35, -1.1, 0, 0, cab);     // 书桌
  box(0.36, 0.4, 0.36, M.fabric2, 1.15, 0.2, -0.3, 0, 0, cab); // 凳
  box(0.5, 0.35, 0.04, G.teal, 1.15, 1.05, -1.28, -0.15, 0, cab); // 桌上屏
  box(0.7, 1.6, 0.3, M.wood, -1.35, 0.8, 0.9, 0, 0, cab);      // 衣柜
  cyl(0.1, 0.12, 0.22, M.soil, 0.6, 0.82, -1.2, 10, cab);      // 桌角盆栽
  const plant = new THREE.Mesh(new THREE.IcosahedronGeometry(0.14, 0), M.leafY);
  plant.position.set(0.6, 1.02, -1.2);
  cab.add(plant);
  box(0.9, 0.06, 0.06, G.lamp, 0, 2.8, 0.3, 0, 0, cab);        // 舱内灯
  poi('cabin', -7.6, 1.5, -4.6);

  /* ==========================================================
   * 4. 水培农场(尾墙整面):三层架 ×4 组,洋红植物灯,水循环管
   * ========================================================== */
  const growMats = [];
  for (let c = 0; c < 4; c++) {
    const fx = -6.9 + c * 3.0;
    box(0.14, 3.0, 0.9, M.steel, fx - 1.25, 1.5, -8.0);   // 架柱
    box(0.14, 3.0, 0.9, M.steel, fx + 1.25, 1.5, -8.0);
    for (let t = 0; t < 3; t++) {
      const ty = 0.6 + t * 0.95;
      box(2.6, 0.12, 0.85, M.tray, fx, ty, -8.0);          // 水培槽
      for (let p = 0; p < 6; p++) {                        // 作物(两色错落)
        const g = new THREE.Mesh(new THREE.IcosahedronGeometry(0.11 + (p % 3) * 0.02, 0),
          p % 2 === 0 ? M.leaf : M.leafY);
        g.position.set(fx - 1.05 + p * 0.42, ty + 0.17, -8.0);
        group.add(g);
      }
      const gl = box(2.4, 0.05, 0.5, G.grow.clone(), fx, ty + 0.72, -8.0); // 植物灯
      growMats.push(gl.material);
    }
  }
  // 水循环:总管沿架顶 → 立管下到回收机(左);营养液泵撬
  const mainPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 12.4, 10), M.pipe);
  mainPipe.rotation.z = Math.PI / 2;
  mainPipe.position.set(-0.9, 3.25, -8.15);
  group.add(mainPipe);
  cyl(0.07, 0.07, 2.4, M.pipe, -7.1, 2.0, -8.15, 10);
  box(1.1, 1.2, 0.8, M.white, -9.0, 0.6, -7.6);            // 冷凝回收机
  box(0.5, 0.35, 0.05, G.teal, -9.0, 1.45, -7.15);
  cyl(0.22, 0.22, 0.9, M.pipe, -8.3, 0.45, -7.9, 12);      // 营养液罐
  poi('farm', -1, 1.8, -7.2);
  poi('water', -8.6, 1.2, -7.0);

  /* ==========================================================
   * 5. 公共区(右侧):餐桌×3 + 厨台 + 吊灯;中央树池
   * ========================================================== */
  box(3.4, 0.9, 1.1, M.wood, 8.0, 0.45, -5.6);             // 厨台
  box(3.5, 0.06, 1.2, M.white, 8.0, 0.93, -5.6);
  box(0.5, 0.4, 0.5, M.steel, 7.0, 1.16, -5.6);            // 灶
  box(0.4, 0.5, 0.35, M.steel, 8.9, 1.2, -5.6);            // 热水器
  for (let k = 0; k < 3; k++) {                            // 餐桌组
    const tz = -2.2 + k * 2.6;
    cyl(0.55, 0.55, 0.06, M.wood, 6.8, 0.78, tz, 16);
    cyl(0.07, 0.09, 0.76, M.frame, 6.8, 0.38, tz, 8);
    for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
      box(0.4, 0.06, 0.4, M.fabric2, 6.8 + Math.cos(a) * 0.85, 0.45, tz + Math.sin(a) * 0.85);
      box(0.05, 0.45, 0.05, M.frame, 6.8 + Math.cos(a) * 0.85, 0.22, tz + Math.sin(a) * 0.85);
    }
    const pd = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.2, 12), G.pendant);
    pd.position.set(6.8, 3.1, tz);
    group.add(pd);
    cyl(0.015, 0.015, 2.6, M.frame, 6.8, 4.5, tz, 6);
  }
  // 中央树池:环座 + 真树(干+三层叶球)
  cyl(1.15, 1.3, 0.5, M.wood, 0, 0.25, -1.5, 18);
  cyl(1.0, 1.0, 0.12, M.soil, 0, 0.52, -1.5, 18);
  cyl(0.09, 0.14, 1.7, M.trunk, 0, 1.35, -1.5, 10);
  const cl1 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.85, 1), M.leaf);
  cl1.position.set(0, 2.6, -1.5);
  cl1.scale.set(1, 0.75, 1);
  group.add(cl1);
  const cl2 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 1), M.leafY);
  cl2.position.set(0.5, 2.15, -1.2);
  group.add(cl2);
  const cl3 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 1), M.leaf);
  cl3.position.set(-0.45, 2.1, -1.85);
  group.add(cl3);
  box(2.6, 0.02, 2.6, M.rug, 3.4, 0.03, -1.5);             // 树旁地毯
  poi('commons', 6.0, 1.4, -1.5);
  poi('tree', 0, 1.8, -0.2);

  /* ==========================================================
   * 6. B 世界休息舱(右前角):躺舱×3 + 「B 世界」大屏 + 51/49 灯牌
   * ========================================================== */
  for (let k = 0; k < 3; k++) {
    const px = 4.2 + k * 1.9;
    const pod = new THREE.Group();
    pod.position.set(px, 0, 4.6);
    pod.rotation.y = -0.25;
    group.add(pod);
    box(1.6, 0.35, 0.75, M.pod, 0, 0.3, 0, 0, 0, pod);      // 躺舱底
    box(1.5, 0.14, 0.65, M.podPad, 0, 0.52, 0, 0, -0.12, pod); // 躺垫(微倾)
    box(0.5, 0.5, 0.7, M.pod, -0.62, 0.55, 0, 0, 0.5, pod); // 头罩壳
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 8, 20), G.podRing);
    ring.rotation.y = Math.PI / 2;
    ring.position.set(-0.55, 0.72, 0);
    pod.add(ring);
    box(0.34, 0.05, 0.16, M.frame, -0.3, 0.66, 0, 0, 0, pod); // 「眼镜」托架
    box(0.3, 0.03, 0.1, G.teal, -0.3, 0.7, 0, 0, 0, pod);     // 那副「眼镜」
  }
  // B 世界大屏(右墙):深蓝底 + 发光城市天际线(线条城市 = 另一个世界)
  box(0.12, 2.0, 3.6, M.frame, 9.35, 2.2, 4.2);
  box(0.06, 1.8, 3.4, G.bScreen, 9.29, 2.2, 4.2);
  for (let k = 0; k < 7; k++) {                             // 天际线塔楼
    const th = 0.35 + ((k * 37) % 5) * 0.18;
    box(0.06, th, 0.3, G.bCity, 9.25, 1.5 + th / 2, 3.0 + k * 0.4);
  }
  box(0.06, 0.03, 2.6, G.bCity, 9.25, 1.42, 4.2);           // 地平线
  box(0.08, 0.35, 1.6, G.sign, 9.3, 3.5, 4.2);              // 「51% / 49%」灯牌(屏上方贴墙)
  poi('pods', 5.6, 1.2, 5.3);

  /* ==========================================================
   * 7. 生保墙(右墙后段):空气机组 + 风扇(spinner)+ CO2 管去 ISRU
   * ========================================================== */
  box(1.6, 2.2, 0.7, M.white, 9.2, 1.1, -7.6);
  const fanPivot = new THREE.Group();
  fanPivot.position.set(8.78, 1.6, -7.6);
  fanPivot.rotation.z = Math.PI / 2;
  group.add(fanPivot);
  for (let k = 0; k < 4; k++) {
    const arm = new THREE.Group();
    arm.rotation.y = (k / 4) * Math.PI * 2;
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.015, 0.22), M.steel);
    blade.position.set(0, 0, 0.13);
    arm.add(blade);
    fanPivot.add(arm);
  }
  cyl(0.26, 0.26, 0.03, M.frame, 8.76, 1.6, -7.6, 16).rotation.z = Math.PI / 2;
  box(0.4, 0.3, 0.05, G.ledG, 9.2, 2.0, -7.2);
  const co2pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.0, 8), M.pipe);
  co2pipe.rotation.x = 0.35;
  co2pipe.position.set(9.3, 3.6, -6.9);
  group.add(co2pipe);
  poi('eclss', 8.6, 1.6, -6.6);

  /* ==========================================================
   * 8. 声明:灯光 / 动画 / 出入口
   * ========================================================== */
  group.userData.lights = [
    { color: 0xffe0b8, pos: [0, 6.6, -1], range: 22 },      // 天穹暖光
    { color: 0xffe0b8, pos: [0, 6.6, 5], range: 16 },
    { color: 0xffd9a0, pos: [6.8, 3.4, -1], range: 9 },     // 餐区吊灯
    { color: 0xe86ae8, pos: [-1, 2.4, -7.4], range: 10 },   // 农场洋红
    { color: 0x6ab0ff, pos: [6.5, 2.2, 4.8], range: 8 },    // B 世界角冷蓝
  ];
  group.userData.spinners = [
    { node: fanPivot, axis: 'y', rpm: 40 },                 // 生保风扇
  ];
  group.userData.animate = (t) => {
    for (let i = 0; i < growMats.length; i++) {             // 植物灯轻微明暗游走
      growMats[i].emissiveIntensity = 1.9 + 0.4 * Math.sin(t * 0.9 + i * 0.7);
    }
    G.podRing.emissiveIntensity = 1.4 + 0.7 * Math.sin(t * 1.3);   // 躺舱光环呼吸
    G.bCity.emissiveIntensity = 1.6 + 0.4 * Math.sin(t * 0.6);     // B 世界天际线缓闪
  };
  group.userData.entry = { pos: [0, 0, 6.3], yaw: 0 };
  group.userData.exitZone = { pos: [6.4, 7.2], radius: 1.2 };
  return group;
}
