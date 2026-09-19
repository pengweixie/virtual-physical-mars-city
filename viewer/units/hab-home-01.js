// hab-home-01 —— 家用电器样板间(可走入,室内单元)
// 契约(MODELS.md §4b):米制;原点 = 洞室中心地面;入口朝 +Z(玄关右墙 z=-8 门组进入);灯常亮;pos null。
// 账先于几何:每件家电的尺寸/功率/去向来自 mars-home ledger/out/*.json(提交 036a7e8),部件由 ./home-parts.js 构建
//   (部件库不 import three,与 mb1-demo-board.js 被 ops-compute-01 复用的写法同一契约)。
// 几何讲的账:厨房(电磁灶/烤箱/微波/冰箱/洗碗/压力锅/热水器,400 V 固定接线橙盒)· 卫浴(真空马桶→预处理罐→VCD 管,
//   再循环淋浴 10 L 回路 MF+UV)· 洗衣角(洗衣/热泵烘干/吸尘器/48 V 蓝插座)· 床位(18 m² 隔音板——账 7 把冰箱赶出舱室)·
//   ECLSS 回风(抽油烟机与烘干的湿气都去这里)· 一面小屏(八本账的记分)。
import { HomeParts } from './home-parts.js';

export const meta = {
  id: 'hab-home-01',
  name: '家用电器样板间',
  name_en: 'Appliance Show Home',
  kind: 'interior',
  size_m: 13.4,          // 实测包围盒最大边(validate_unit)
};

export function build(THREE) {
  const group = new THREE.Group();
  const P = HomeParts(THREE);
  const M = {
    floor:  new THREE.MeshStandardMaterial({ color: 0x8a7a68, roughness: 0.8 }),
    rug:    new THREE.MeshStandardMaterial({ color: 0x9c4a35, roughness: 0.9 }),
    wall:   new THREE.MeshStandardMaterial({ color: 0xbfa079, roughness: 0.93 }),
    wallDim: new THREE.MeshStandardMaterial({ color: 0xa8895f, roughness: 0.94 }),
    vault:  new THREE.MeshStandardMaterial({ color: 0xb0916b, roughness: 0.95 }),
    panel:  new THREE.MeshStandardMaterial({ color: 0x5a6a7a, roughness: 1.0 }),     // 隔音板(岩棉芯)
    part:   new THREE.MeshStandardMaterial({ color: 0xd9d5cb, roughness: 0.85 }),    // 打印隔断
    frame:  new THREE.MeshStandardMaterial({ color: 0x39404a, roughness: 0.55, metalness: 0.55 }),
    steel:  new THREE.MeshStandardMaterial({ color: 0x9aa2a8, roughness: 0.45, metalness: 0.7 }),
    stone:  P.materials.stone, wood: P.materials.wood, fabric: P.materials.fabric, white: P.materials.white,
    pipe:   new THREE.MeshStandardMaterial({ color: 0x6a8a9a, roughness: 0.5, metalness: 0.5 }),
    orange: P.materials.orange, blue: P.materials.blue,
    hazardY: new THREE.MeshStandardMaterial({ color: 0xc7a03c, roughness: 0.7 }),
    hazardK: new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.7 }),
    soil:   new THREE.MeshStandardMaterial({ color: 0x40342a, roughness: 1.0 }),
    leaf:   new THREE.MeshStandardMaterial({ color: 0x6a9a45, roughness: 0.9 }),
  };
  const G = {
    sky:   new THREE.MeshStandardMaterial({ color: 0x181410, emissive: 0xffe6bb, emissiveIntensity: 1.8 }),
    lamp:  new THREE.MeshStandardMaterial({ color: 0x2a2418, emissive: 0xfff0d0, emissiveIntensity: 2.0 }),
    sign:  new THREE.MeshStandardMaterial({ color: 0x2a2016, emissive: 0xffc878, emissiveIntensity: 2.0 }),
    screen: new THREE.MeshStandardMaterial({ color: 0x06121a, emissive: 0x1a3a4a, emissiveIntensity: 1.4 }),
    bar:   new THREE.MeshStandardMaterial({ color: 0x0a2a30, emissive: 0x4fd8e8, emissiveIntensity: 1.9 }),
    barR:  new THREE.MeshStandardMaterial({ color: 0x2a0a0a, emissive: 0xff6a4a, emissiveIntensity: 1.8 }),
    ledG:  P.glow.led,
  };
  const spinners = [];
  const nightMats = [];
  function box(w, h, d, mat, x, y, z, rx = 0, ry = 0, rz = 0, parent = group) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z); m.rotation.set(rx, ry, rz); parent.add(m); return m;
  }
  function cyl(r1, r2, h, mat, x, y, z, seg = 12, rx = 0, rz = 0, parent = group) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), mat);
    m.position.set(x, y, z); m.rotation.set(rx, 0, rz); parent.add(m); return m;
  }
  function place(part, x, z, ry = 0) {
    part.position.set(x, 0, z); part.rotation.y = ry; group.add(part);
    if (part.userData.spinners) spinners.push(...part.userData.spinners);
    if (part.userData.nightMats) nightMats.push(...part.userData.nightMats);
    return part;
  }
  function poi(id, x, y, z) {
    const a = new THREE.Object3D(); a.name = 'poi_' + id; a.position.set(x, y, z); group.add(a);
  }
  let seed = 11;
  const rng = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  /* ==========================================================
   * 1. 洞室壳体:净 12 × 9,打印土层墙,折面拱顶;入口 +Z(z=+4.5)
   * ========================================================== */
  function layeredWall(len, height, thick, mat) {
    const g = new THREE.Group();
    const n = Math.round(height / 0.5);
    for (let i = 0; i < n; i++) {
      const t = (i % 2 === 0 ? thick : thick * 0.78) + (rng() - 0.5) * 0.04;
      const layer = new THREE.Mesh(new THREE.BoxGeometry(len + (rng() - 0.5) * 0.08, 0.52, t), mat);
      layer.position.y = (i + 0.5) * 0.5 + 0.011; g.add(layer);
    }
    return g;
  }
  box(12.2, 0.02, 9.4, M.floor, 0, 0.01, 0);                      // 地坪面 y=0.02(minY=0,§4b 原点=地面)
  const wallL = layeredWall(9.6, 3.5, 0.7, M.wall); wallL.rotation.y = Math.PI / 2; wallL.position.set(-6.35, 0, 0); group.add(wallL);
  const wallR = layeredWall(9.6, 3.5, 0.7, M.wall); wallR.rotation.y = Math.PI / 2; wallR.position.set(6.35, 0, 0); group.add(wallR);
  const wallB = layeredWall(12.0, 3.5, 0.7, M.wall); wallB.position.set(0, 0, -4.85); group.add(wallB);
  const wallF1 = layeredWall(4.4, 3.5, 0.7, M.wall); wallF1.position.set(-3.8, 0, 4.85); group.add(wallF1);
  const wallF2 = layeredWall(4.4, 3.5, 0.7, M.wall); wallF2.position.set(3.8, 0, 4.85); group.add(wallF2);
  box(3.2, 0.8, 0.7, M.wallDim, 0, 3.1, 4.85);                     // 门楣
  box(4.6, 0.3, 10.1, M.vault, -3.9, 4.15, 0, 0, 0, 0.42);         // 折面拱顶
  box(4.6, 0.3, 10.1, M.vault, 3.9, 4.15, 0, 0, 0, -0.42);
  box(4.4, 0.3, 10.1, M.vault, 0, 5.05, 0);
  box(12.4, 1.8, 0.3, M.wallDim, 0, 4.3, -4.9);                    // 尾/前山墙封拱顶黑三角
  box(12.4, 1.8, 0.3, M.wallDim, 0, 4.3, 4.9);
  box(0.6, 0.08, 9.0, G.sky, -1.2, 4.9, 0); box(0.6, 0.08, 9.0, G.sky, 1.2, 4.9, 0);   // 天穹暖光带
  for (const lz of [-3.2, 0.4, 3.4]) box(3.2, 0.08, 0.25, G.lamp, 0, 3.9, lz);

  /* ==========================================================
   * 2. 入口门组(+Z,通玄关右墙 z=-8)+ 应急竖井龛(exitZone,右前角)
   * ========================================================== */
  box(0.3, 2.7, 0.24, M.frame, -1.45, 1.35, 4.6); box(0.3, 2.7, 0.24, M.frame, 1.45, 1.35, 4.6);
  box(3.2, 0.3, 0.24, M.frame, 0, 2.75, 4.6);
  box(1.3, 2.5, 0.14, M.steel, -0.68, 1.25, 4.66); box(1.3, 2.5, 0.14, M.steel, 0.68, 1.25, 4.66);
  box(2.2, 0.4, 0.12, G.sign, 0, 3.15, 4.62);                       // 「样板间」发光板
  for (let i = 0; i < 5; i++) box(0.5, 0.02, 1.0, i % 2 === 0 ? M.hazardY : M.hazardK, -1.2 + i * 0.6, 0.02, 3.7);
  box(0.16, 2.5, 1.6, M.frame, 5.95, 1.25, 3.6);                    // 竖井龛(exitZone)
  box(0.7, 2.2, 0.08, M.steel, 5.6, 1.1, 3.65); box(0.7, 2.2, 0.08, M.steel, 6.3, 1.1, 3.65);
  box(1.4, 0.3, 0.07, G.sign, 5.95, 2.7, 3.64);

  /* ==========================================================
   * 3. 厨房(左后):L 形铸石台面;灶/烤箱/微波/洗碗/冰箱/压力锅/热水器/抽油烟机
   * ========================================================== */
  // 台面沿后墙 x -5.6..-1.0(z -4.2),再沿左墙折到 z -1.6
  box(1.35, 0.85, 0.62, M.wood, -4.925, 0.425, -4.15);             // 柜体(打印板)三段,留洗碗机与烤箱的柜位
  box(0.60, 0.85, 0.62, M.wood, -3.25, 0.425, -4.15);
  box(1.25, 0.85, 0.62, M.wood, -1.625, 0.425, -4.15);
  box(4.7, 0.05, 0.66, M.stone, -3.3, 0.875, -4.15);               // 铸石台面(res-glass-01)
  box(0.62, 0.85, 2.0, M.wood, -5.65, 0.425, -2.55);
  box(0.66, 0.05, 2.1, M.stone, -5.65, 0.875, -2.55);
  place(P.hob(), -2.6, -4.15).position.y = 0.90;                    // 电磁灶(台面上)
  place(P.oven(), -2.6, -4.15).position.y = 0.05;                   // 烤箱(灶下柜位)
  place(P.dishwasher(), -3.9, -4.15).position.y = 0.02;            // 洗碗机(柜位)
  place(P.microwave(), -4.6, -4.2).position.y = 1.55;               // 微波(墙架)
  box(0.7, 0.04, 0.45, M.steel, -4.6, 1.53, -4.2);                  // 微波架板
  place(P.rangeHood(), -2.6, -4.15).position.y = 1.85;              // 抽油烟机
  place(P.pressureCooker(), -1.5, -4.05).position.y = 0.90;         // 压力锅(账 1 主粮必需件)
  place(P.fridge(), -0.6, -4.35);                                   // 冰箱(台面尽头,冷凝器朝墙)
  place(P.waterHeater(), -5.6, -1.2).position.y = 1.2;              // 热水器(墙挂)
  box(0.36, 0.08, 0.36, M.steel, -5.6, 1.18, -1.2);
  cyl(0.02, 0.02, 1.1, M.pipe, -5.65, 0.6, -1.2, 8);                // 热水器供水立管
  // 台面盆 + 龙头(中水去灰水线)
  box(0.5, 0.18, 0.4, M.steel, -5.65, 0.80, -2.9);
  cyl(0.015, 0.015, 0.30, M.steel, -5.85, 1.05, -2.9, 8);
  poi('hob', -2.6, 1.3, -3.4);
  poi('oven', -3.2, 0.5, -3.4);
  poi('fridge', -0.6, 1.3, -3.6);
  poi('dishwasher', -3.9, 0.5, -3.4);

  /* ==========================================================
   * 4. 卫浴(右后):打印隔断围出 3.0 × 2.6;真空马桶 + 再循环淋浴 + 盆
   * ========================================================== */
  box(1.05, 2.4, 0.06, M.part, 3.475, 1.2, -1.9);                   // 隔断(前)两段,门洞 x 4.0..4.9
  box(1.2, 2.4, 0.06, M.part, 5.5, 1.2, -1.9);
  box(3.2, 0.3, 0.06, M.part, 4.5, 2.25, -1.9);                     // 门楣
  box(0.06, 2.4, 2.9, M.part, 2.95, 1.2, -3.35);                    // 隔断(左)
  box(0.05, 2.1, 0.08, M.frame, 4.0, 1.05, -1.9); box(0.05, 2.1, 0.08, M.frame, 4.9, 1.05, -1.9);   // 门框(开口 0.9)
  box(3.2, 0.03, 3.0, M.stone, 4.5, 0.015, -3.35);                  // 铸石地坪
  place(P.toilet(), 3.6, -4.2);
  place(P.shower(), 5.3, -3.9, Math.PI);                            // 玻璃门朝 -X(朝卫浴内)
  box(0.5, 0.12, 0.4, M.white, 3.6, 0.85, -2.5);                    // 盆
  box(0.4, 0.7, 0.35, M.wood, 3.6, 0.40, -2.5);
  cyl(0.015, 0.015, 0.25, M.steel, 3.6, 1.05, -2.68, 8);
  // 尿处理管:预处理罐 → 后墙 → 出洞室(橙色段 = 酸化,青色 = 灰水/中水)
  cyl(0.03, 0.03, 0.8, M.orange, 3.72, 0.55, -4.6, 8, Math.PI / 2);
  cyl(0.04, 0.04, 3.0, M.pipe, 4.5, 3.2, -4.6, 8, 0, Math.PI / 2);
  box(0.6, 0.3, 0.02, G.sign, 4.5, 2.0, -4.48);                     // 「→ res-recycle-01 VCD」标牌
  poi('toilet', 3.6, 1.0, -3.6);
  poi('shower', 5.3, 1.4, -3.0);

  /* ==========================================================
   * 5. 洗衣角(右前):洗衣机 + 热泵烘干 + 吸尘器 + 48 V 插座面板 + 400 V 接线盒 + 冷凝水去灰水线
   * ========================================================== */
  place(P.washer(), 5.55, 2.5, -Math.PI / 2);                       // 靠右墙,正面朝 -X(朝房间)
  place(P.dryer(), 5.55, 1.6, -Math.PI / 2);
  box(0.66, 0.06, 1.7, M.stone, 5.55, 0.905, 2.05);                 // 联体铸石台板
  place(P.vacuum(), 5.7, 0.45).position.y = 0.0;                    // 吸尘器(靠墙立)
  place(P.socketPanel(), 5.93, 3.0, -Math.PI / 2).position.y = 1.2; // 48 V 插座面板(蓝)
  box(0.12, 0.16, 0.16, M.orange, 5.93, 0.35, 1.2);                 // 400 V 固定接线盒(橙)
  box(0.02, 0.5, 0.02, M.orange, 5.93, 0.75, 1.2);                  // 到洗衣/烘干的固定电缆槽
  cyl(0.02, 0.02, 1.2, M.pipe, 5.3, 0.12, 1.4, 8, Math.PI / 2);     // 冷凝水/排水 → 灰水线
  box(0.5, 0.25, 0.02, G.sign, 5.93, 2.0, 2.0, 0, -Math.PI / 2);    // 「48 V ≤1.5 kW / 400 V 固定」标牌
  poi('laundry', 5.0, 1.2, 2.0);
  poi('vacuum', 5.3, 0.8, 0.45);
  poi('power', 5.6, 1.5, 3.0);

  /* ==========================================================
   * 6. 床位(左前):床 + 衣柜 + 18 m² 隔音板(账 7)+ 盆栽;没有一件带压缩机/电机的东西
   * ========================================================== */
  box(2.0, 0.35, 1.0, M.wood, -4.8, 0.40, 2.6); box(1.9, 0.16, 0.92, M.fabric, -4.8, 0.66, 2.6);
  box(0.5, 0.12, 0.6, M.white, -5.5, 0.76, 2.6);
  box(0.7, 1.6, 0.3, M.wood, -5.5, 0.8, 0.9);                       // 衣柜
  box(2.6, 0.02, 2.4, M.rug, -4.4, 0.03, 1.4);
  for (let k = 0; k < 4; k++) box(0.04, 1.2, 1.1, M.panel, -5.93, 1.9, 0.4 + k * 1.15);   // 左墙隔音板 4 块
  for (let k = 0; k < 4; k++) box(1.1, 1.2, 0.04, M.panel, -5.0 + k * 1.15, 3.0, 4.42);   // 前墙隔音板 4 块
  for (let k = 0; k < 3; k++) box(1.1, 0.04, 1.1, M.panel, -4.9 + k * 1.2, 3.75, 2.0);    // 顶面吸声板 3 块
  cyl(0.10, 0.12, 0.22, M.soil, -3.3, 0.11, 3.6, 10);
  const plant = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 0), M.leaf); plant.position.set(-3.3, 0.36, 3.6); group.add(plant);
  box(0.6, 0.02, 0.02, G.lamp, -4.8, 3.2, 3.9);                      // 床头暖光
  poi('bed', -4.6, 1.3, 1.6);

  /* ==========================================================
   * 7. ECLSS 回风(后墙中段):风机 spinner + 回风管;油烟机风管与烘干湿气都汇到这里
   * ========================================================== */
  box(1.0, 1.2, 0.35, M.white, 1.2, 2.9, -4.42);
  const fan = new THREE.Group(); fan.position.set(1.2, 2.9, -4.2); group.add(fan);
  for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; box(0.03, 0.22, 0.012, M.steel, Math.sin(a) * 0.13, Math.cos(a) * 0.13, 0, 0, 0, -a, fan); }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.30, 0.02, 6, 24), M.frame); ring.position.set(1.2, 2.9, -4.2); group.add(ring);
  spinners.push({ node: fan, axis: 'z', rpm: 45 });
  cyl(0.10, 0.10, 3.0, M.pipe, -1.2, 3.55, -4.3, 10, 0, Math.PI / 2);     // 油烟机风管 → 回风机组
  box(0.3, 0.2, 0.03, G.ledG, 1.2, 3.6, -4.24);
  poi('eclss', 1.2, 2.4, -3.6);

  /* ==========================================================
   * 8. 小屏(后墙中右):八本账记分——每行一条横条(青=命中/红=偏出),不是装饰
   * ========================================================== */
  box(0.06, 1.3, 2.0, M.frame, 2.3, 2.1, -4.45, 0, Math.PI / 2);
  box(1.9, 1.2, 0.05, G.screen, 2.3, 2.1, -4.43);
  const bars = [[5, 2], [2, 4], [7, 3], [4, 1], [5, 0], [5, 1], [4, 4], [2, 2]];   // 账 1–8:命中/偏出(out/*.json scorecard)
  bars.forEach(([h, m], i) => {
    const y = 2.62 - i * 0.135;
    box(0.10 * h, 0.06, 0.012, G.bar, 1.55 + 0.05 * h, y, -4.40);
    if (m) box(0.10 * m, 0.06, 0.012, G.barR, 1.55 + 0.10 * h + 0.05 * m + 0.02, y, -4.40);
  });
  box(1.7, 0.05, 0.012, G.bar, 2.3, 1.55, -4.40);
  poi('screen', 2.3, 2.1, -3.7);
  nightMats.push(G.sky, G.lamp, G.sign, G.screen, G.bar, G.barR, G.ledG);

  /* ==========================================================
   * 9. 声明
   * ========================================================== */
  group.userData.lights = [
    { color: 0xffe0b8, pos: [0, 4.4, 0], range: 16 },
    { color: 0xffe0b8, pos: [-3.5, 3.4, -2.5], range: 9 },       // 厨房
    { color: 0xdde8ff, pos: [4.5, 2.2, -3.2], range: 6 },        // 卫浴冷白
    { color: 0xffd9a0, pos: [-4.6, 2.6, 2.4], range: 7 },        // 床头暖光
    { color: 0x9fe0ff, pos: [5.0, 2.0, 2.0], range: 6 },         // 洗衣角
    { color: 0xffe0b8, pos: [3.5, 3.6, 0.5], range: 9 },         // 右半拱顶补光
  ];
  group.userData.spinners = spinners;
  group.userData.nightMats = nightMats;
  group.userData.entry = { pos: [0, 0, 3.3], yaw: 0 };
  group.userData.exitZone = { pos: [5.95, 3.6], radius: 1.1 };
  return group;
}
