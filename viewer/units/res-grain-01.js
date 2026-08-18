// res-grain-01 —— 主粮种植舱(多层立体·剖切露层架+补光+滴灌)
// 契约(MODELS.md §4):1u=1m;原点=舱中心地面点(y=0);+Y 上;正面(剖开面)朝 +Z;
//   THREE 由 build 传入;模块内无 import、无外部贴图/网络资源。
// 使命(总控裁定方案 C):把全城食物自给率从 8.3% 拉向 50% —— 需 +2300 m² 种植面。
//   构型选「多层立体」而非平铺掩土:火星上受压+屏蔽的容积才是稀缺资源,层架把
//   2300 m² 冠层折进小占地。基质=堆肥+洗盐 regolith(接 res-recycle-01),滴灌供液,
//   窄谱 LED 补光(光量子法口径对齐 hab-quarter-01:0.0208 kg 干物质/m²/天)。
// 同色因果链(科学城原则):三种作物色(马铃薯绿/小麦金/大豆青)= 三只成品料箱色 ——
//   「一舱三主粮」一眼读懂;并留一层「刚收割空盘」作状态对照。
// 水/氧/CO₂ 不另立账:全部挂 res-eclss-01 的 115 人总账(见 info 卡)。
// 质感六招:beam 桁架层架/反光灯槽/安全橙检修马道栏杆/滴灌歧管+滴头/工业收边/尘膜。
// 夜测仪表(应 pwr-fission-01 crop 卡之请,账见 mars-grain/ledger/night_co2_ledger.py):
//   三组各一支 NDIR CO₂/T 传感杆 + 门侧夜测仪表柜 + 门框琥珀「封舱测试」信标(blinkMats)
//   —— 夜里封舱测 CO₂ 上升率(预计 ~656 ppm/h),直接量出维持通量 M=m×B,
//   把存活负荷蒙卡的两条主导不确定带一次删掉(53.1 vs 阈值 53.7 kW,纸面裁不了)。
// 动画:声明式 —— spinners(循环风机×3 + 营养液泵) · oscillators(收获桁架沿 x)
//   · nightMats(补光条/状态灯/门灯) · blinkMats(封舱信标)。无累积状态。

export const meta = {
  id: 'res-grain-01',
  name: '主粮种植舱',
  name_en: 'Staple-Crop Module',
  size_m: 30,
  size_axis: 'width',
  effects: ['glow_windows'],
};

export function build(THREE) {
  const g = new THREE.Group();
  g.name = meta.id;
  const nightMats = [];
  const hash = (k) => { const s = Math.sin(k * 12.9898 + 78.233) * 43758.5453; return s - Math.floor(s); };

  const box = (p, w, h, d, mat, x, y, z, ry = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z); if (ry) m.rotation.y = ry; p.add(m); return m;
  };
  const cyl = (p, r, h, mat, x, y, z, seg = 12, axis = 'y') => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat);
    m.position.set(x, y, z);
    if (axis === 'x') m.rotation.z = Math.PI / 2;
    if (axis === 'z') m.rotation.x = Math.PI / 2;
    p.add(m); return m;
  };
  const _ba = new THREE.Vector3(), _bb = new THREE.Vector3();
  const beam = (p, ax, ay, az, bx, by, bz, w, mat) => {   // 两点方梁(桁架积木)
    _ba.set(ax, ay, az); _bb.set(bx, by, bz);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, w, _ba.distanceTo(_bb) + w * 0.6), mat);
    m.position.copy(_ba).lerp(_bb, 0.5); m.lookAt(_bb); p.add(m); return m;
  };

  const M = {
    shell: new THREE.MeshStandardMaterial({ color: 0xc9c0b2, roughness: 0.88, metalness: 0.04 }),
    liner: new THREE.MeshStandardMaterial({ color: 0xb4ab9c, roughness: 0.9, side: THREE.DoubleSide }),
    trim: new THREE.MeshStandardMaterial({ color: 0x3a3e44, roughness: 0.5, metalness: 0.45 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x6a7076, roughness: 0.5, metalness: 0.62 }),
    rack: new THREE.MeshStandardMaterial({ color: 0x9098a0, roughness: 0.45, metalness: 0.6 }),
    rackD: new THREE.MeshStandardMaterial({ color: 0x565c63, roughness: 0.55, metalness: 0.5 }),
    tray: new THREE.MeshStandardMaterial({ color: 0x40454b, roughness: 0.7, metalness: 0.3 }),
    media: new THREE.MeshStandardMaterial({ color: 0x6b4a2e, roughness: 1.0 }),
    media2: new THREE.MeshStandardMaterial({ color: 0x543a24, roughness: 1.0 }),
    slab: new THREE.MeshStandardMaterial({ color: 0x8d857a, roughness: 0.95 }),
    reflect: new THREE.MeshStandardMaterial({ color: 0xd8d4cc, roughness: 0.35, metalness: 0.5 }),
    pipeW: new THREE.MeshStandardMaterial({ color: 0x4a7a9a, roughness: 0.42, metalness: 0.55 }),
    orange: new THREE.MeshStandardMaterial({ color: 0xd6741e, roughness: 0.55, metalness: 0.2 }),
    fan: new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.4, metalness: 0.72 }),
    potato: new THREE.MeshStandardMaterial({ color: 0x3f7a34, roughness: 0.85 }),
    potato2: new THREE.MeshStandardMaterial({ color: 0x599040, roughness: 0.85 }),
    wheat: new THREE.MeshStandardMaterial({ color: 0xc9a53a, roughness: 0.82 }),
    wheat2: new THREE.MeshStandardMaterial({ color: 0xd9be5c, roughness: 0.82 }),
    soy: new THREE.MeshStandardMaterial({ color: 0x6fa04a, roughness: 0.82 }),
    soy2: new THREE.MeshStandardMaterial({ color: 0x86b85e, roughness: 0.82 }),
  };
  // 窄谱补光:白天近黑深品红,夜里引擎推亮成整舱粉紫
  const grow = new THREE.MeshStandardMaterial({ color: 0x38182c, emissive: 0xff4f96, emissiveIntensity: 0.5, roughness: 0.6 });
  const doorLit = new THREE.MeshStandardMaterial({ color: 0x2a2013, emissive: 0xffc37a, emissiveIntensity: 0.7, roughness: 0.5 });
  const okLit = new THREE.MeshStandardMaterial({ color: 0x0f2a14, emissive: 0x46e06a, emissiveIntensity: 0.6, roughness: 0.5 });
  const idleLit = new THREE.MeshStandardMaterial({ color: 0x2a2205, emissive: 0xffb020, emissiveIntensity: 0.6, roughness: 0.5 });
  nightMats.push(grow, doorLit, okLit, idleLit);

  /* ===================== 舱体壳:三面墙 + 顶盖(露桁架) + 前边柱(+Z 剖开) ===================== */
  const L = 30, D = 14, H = 6.8, t = 0.3;
  box(g, L, 0.3, D, M.slab, 0, 0.15, 0);                          // 地板
  box(g, L, H, t, M.shell, 0, H / 2, -D / 2 + t / 2);            // 后墙外壳
  box(g, L - 0.4, H - 0.4, 0.06, M.liner, 0, H / 2, -D / 2 + t + 0.02); // 后墙内衬(浅)
  box(g, t, H, D, M.shell, -L / 2 + t / 2, H / 2, 0);            // 左墙
  box(g, t, H, D, M.shell, L / 2 - t / 2, H / 2, 0);            // 右墙
  box(g, L, t, D, M.shell, 0, H - t / 2, 0);                     // 顶盖
  box(g, L + 0.4, 0.26, D + 0.4, M.trim, 0, H + 0.03, 0);        // 顶盖压条
  box(g, L + 0.4, 0.34, 0.4, M.trim, 0, 0.4, D / 2 + 0.05);      // 底裙边(前沿)
  // 屋顶桁架(露在顶盖下,beam 格构) ×4 榀
  for (const tx of [-11, -3.7, 3.7, 11]) {
    beam(g, tx, H - 0.45, -D / 2 + 0.6, tx, H - 0.45, D / 2 - 0.6, 0.14, M.rack);
    for (let k = -2; k <= 2; k++)
      beam(g, tx, H - 0.45, k * 2.6, tx, H - 1.05, k * 2.6 + 1.3, 0.09, M.rack); // 腹杆
  }
  // 前边柱 + 剖口边框(工业收边)
  for (const cx of [-L / 2 + 0.3, -4.7, 4.7, L / 2 - 0.3])
    box(g, 0.42, H, 0.42, M.steel, cx, H / 2, D / 2 - 0.28);
  box(g, L, 0.44, 0.5, M.steel, 0, H - 0.22, D / 2 - 0.28);      // 前沿顶梁(过梁)
  box(g, L, 0.3, 0.4, M.orange, 0, 0.55, D / 2 - 0.28);         // 剖口下沿安全踢板

  /* ===================== 作物构建器(每种主粮各具形态) ===================== */
  const potatoMound = (p, cx, y, cz, s) => {                      // 马铃薯:低矮丛叶堆
    box(p, 0.36 * s, 0.26 * s, 0.36 * s, M.potato, cx, y + 0.13 * s, cz);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * 6.283 + hash(cx * 3 + i) * 1.2, r = 0.22 * s;
      const leaf = box(p, 0.46 * s, 0.05, 0.28 * s, hash(i + cx) > 0.5 ? M.potato : M.potato2,
        cx + Math.cos(a) * r, y + 0.2 * s + hash(i) * 0.1 * s, cz + Math.sin(a) * r);
      leaf.rotation.set((hash(i + 1) - 0.5) * 0.7, a, (hash(i + 2) - 0.5) * 0.5);
    }
  };
  const soyBush = (p, cx, y, cz, s) => {                          // 大豆:圆丛灌木
    box(p, 0.32 * s, 0.38 * s, 0.32 * s, M.soy, cx, y + 0.19 * s, cz);
    for (let i = 0; i < 3; i++) {
      const a = i * 2.094 + hash(cx + i) * 0.6, r = 0.18 * s;
      box(p, 0.3 * s, 0.28 * s, 0.3 * s, hash(i + cx * 2) > 0.5 ? M.soy : M.soy2,
        cx + Math.cos(a) * r, y + 0.28 * s + hash(i * 2) * 0.12 * s, cz + Math.sin(a) * r);
    }
  };
  const wheatStand = (p, x0, x1, y, zc) => {                      // 小麦:成排直立金秆
    const n = Math.max(3, Math.round((x1 - x0) / 0.72));
    for (let k = 0; k < n; k++) {
      const sx = x0 + 0.2 + k * (x1 - x0 - 0.4) / Math.max(1, n - 1);
      const hh = 0.6 + hash(k * 3 + sx + zc) * 0.3;
      const st = box(p, 0.06, hh, 0.06, hash(k + zc) > 0.4 ? M.wheat : M.wheat2, sx, y + hh / 2, zc + (hash(k) - 0.5) * 0.12);
      st.rotation.z = (hash(k * 1.7 + zc) - 0.5) * 0.2;
      box(p, 0.11, 0.2, 0.08, M.wheat, sx, y + hh, zc);          // 麦穗
    }
  };

  /* ===================== 三组多层层架(桁架柱 + 逐层错位 + 安全橙前栏) ===================== */
  const blocks = [
    { x0: -14.2, x1: -5.4, crop: 'potato' },
    { x0: -4.2, x1: 4.2, crop: 'wheat' },
    { x0: 5.4, x1: 14.2, crop: 'soy' },
  ];
  const TIERS = 5;
  const tierY = [0.85, 2.0, 3.15, 4.3, 5.45];

  blocks.forEach((b, bi) => {
    const bw = b.x1 - b.x0, bx = (b.x0 + b.x1) / 2;
    const grp = new THREE.Group(); grp.position.set(bx, 0, 0); g.add(grp);
    const zBack = -4.6, zFrontMax = 2.4;
    // 四角桁架立柱 + 背面斜撑(beam 格构)
    for (const sx of [-bw / 2 + 0.25, bw / 2 - 0.25]) {
      for (const sz of [zBack, zFrontMax]) box(grp, 0.14, H - 0.5, 0.14, M.rack, sx, (H - 0.5) / 2, sz);
      beam(grp, sx, 0.4, zBack, sx, H - 0.9, zFrontMax, 0.08, M.rack);       // 侧斜撑
      beam(grp, sx, H - 0.9, zBack, sx, 0.4, zFrontMax, 0.06, M.rack);       // 交叉
    }
    box(grp, bw, 0.16, 0.16, M.rack, 0, H - 0.7, zBack);                     // 顶横梁

    for (let ti = 0; ti < TIERS; ti++) {
      const y = tierY[ti];
      const zc = -0.4 - ti * 0.22;         // 上层略后退(错位露前缘)
      const zf = zc + 1.4;                 // 托盘前缘
      const harvested = (bi === 1 && ti === TIERS - 1);
      // 层横梁 + 托盘 + 双色基质
      box(grp, bw, 0.09, 0.14, M.rackD, 0, y - 0.05, zf);                    // 前缘梁
      box(grp, bw, 0.09, 0.14, M.rackD, 0, y - 0.05, zc - 1.4);              // 后缘梁
      box(grp, bw - 0.2, 0.14, 2.9, M.tray, 0, y + 0.04, zc);                // 托盘
      box(grp, bw - 0.4, 0.06, 2.7, harvested ? M.media2 : M.media, 0, y + 0.14, zc);
      // 反光灯槽:反光板 + 内嵌补光条(照下层冠层)
      box(grp, bw - 0.3, 0.05, 2.4, M.reflect, 0, y + 0.96, zc);
      box(grp, bw - 0.5, 0.07, 0.28, grow, 0, y + 0.9, zc + 0.7);
      box(grp, bw - 0.5, 0.07, 0.28, grow, 0, y + 0.9, zc - 0.7);
      // 滴灌歧管(前沿蓝管)+ 滴头下垂
      cyl(grp, 0.045, bw - 0.4, M.pipeW, 0, y + 0.34, zf - 0.15, 8, 'x');
      for (let k = 0; k < Math.round(bw / 1.5); k++)
        box(grp, 0.025, 0.2, 0.025, M.pipeW, -bw / 2 + 0.6 + k * 1.5, y + 0.22, zf - 0.15);
      // 安全橙前栏(立柱 + 顶杆)
      for (let k = 0; k <= Math.round(bw / 2.2); k++)
        box(grp, 0.05, 0.34, 0.05, M.orange, -bw / 2 + 0.3 + k * 2.2, y + 0.34, zf + 0.05);
      box(grp, bw - 0.3, 0.05, 0.05, M.orange, 0, y + 0.5, zf + 0.05);
      // 作物冠层 or 空盘
      if (harvested) {
        for (let k = 0; k < Math.round(bw / 0.9); k++)            // 育苗穴盘格
          box(grp, 0.6, 0.04, 2.3, M.rackD, -bw / 2 + 0.6 + k * 0.9, y + 0.19, zc);
        box(grp, 0.14, 0.18, 0.4, idleLit, -bw / 2 + 0.5, y + 0.34, zf - 0.1);
      } else {
        if (b.crop === 'wheat') {
          for (let k = 0; k < 3; k++) wheatStand(grp, b.x0 - bx + 0.4, b.x1 - bx - 0.4, y + 0.17, zc - 0.8 + k * 0.8);
        } else {
          const build = b.crop === 'potato' ? potatoMound : soyBush;
          const nC = Math.round(bw / 2.2);
          for (let k = 0; k < nC; k++) {
            const cx = -bw / 2 + 0.8 + k * (bw - 1.6) / Math.max(1, nC - 1);
            for (const cz of [zc - 0.8, zc + 0.8])
              build(grp, cx + (hash(k + ti + cz) - 0.5) * 0.3, y + 0.17, cz, 1.0 + hash(k * 2 + ti) * 0.3);
          }
        }
        box(grp, 0.14, 0.18, 0.4, okLit, -bw / 2 + 0.5, y + 0.36, zf - 0.1);
      }
    }
  });

  /* ===================== 服务马道(前沿中层,安全橙栏杆) ===================== */
  const cat = new THREE.Group(); cat.position.set(0, 3.0, D / 2 - 1.0); g.add(cat);
  box(cat, L - 1.6, 0.1, 0.9, M.rackD, 0, 0, 0);                            // 走道板
  box(cat, L - 1.6, 0.06, 0.12, M.orange, 0, 0.9, 0.4);                     // 顶栏
  box(cat, L - 1.6, 0.05, 0.1, M.orange, 0, 0.5, 0.4);                      // 腰栏
  for (let k = 0; k <= Math.round((L - 2) / 2.2); k++)
    box(cat, 0.06, 0.95, 0.06, M.orange, -(L - 2) / 2 + k * 2.2, 0.45, 0.4); // 立柱
  for (const gx of [-6, 6]) beam(cat, gx, -0.1, -0.3, gx, -2.4, -1.2, 0.1, M.steel); // 撑脚

  /* ===================== 滴灌/营养液主管 + 泵撬(西端) ===================== */
  const util = new THREE.Group(); util.position.set(-L / 2 + 1.0, 0, -3.2); g.add(util);
  cyl(util, 0.16, H - 1.2, M.pipeW, 0, (H - 1.2) / 2, 0, 10, 'y');          // 立管
  for (const y of tierY) { box(util, 0.32, 0.4, 0.26, M.steel, 0.34, y + 0.34, 0); box(util, 0.12, 0.14, 0.1, M.orange, 0.55, y + 0.34, 0); } // 层阀+手轮
  const pumpBody = cyl(util, 0.42, 0.9, M.steel, 0.2, 0.55, 2.4, 14, 'y');
  const pumpRot = cyl(util, 0.16, 0.55, M.fan, 0.2, 1.2, 2.4, 10, 'y'); pumpRot.name = 'pump_rotor';
  box(util, 1.3, 0.5, 1.3, M.trim, 0.2, 0.25, 2.4);                        // 泵基座
  cyl(util, 0.16, 0.7, M.steel, -0.35, 0.9, 2.4, 8, 'x');                  // 电机
  const tank = cyl(util, 0.5, 1.5, M.pipeW, 0.2, 0.75, 4.3, 14, 'y');      // 配液罐
  box(util, 1.1, 0.16, 1.1, M.trim, 0.2, 1.55, 4.3);                       // 罐顶法兰
  box(util, 0.5, 0.7, 0.35, M.trim, -0.4, 1.3, 3.4);                       // 控制箱

  /* ===================== 基质料斗(堆肥+洗盐土 接 res-recycle-01) ===================== */
  const hop = new THREE.Group(); hop.position.set(L / 2 - 2.2, 0, -3.6); g.add(hop);
  box(hop, 2.4, 1.5, 2.4, M.trim, 0, 4.7, 0);                              // 斗身
  box(hop, 2.0, 0.4, 2.0, M.media, 0, 5.55, 0);                            // 斗口露基质(赭黄)
  for (const [lx, lz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    box(hop, 0.16, 3.9, 0.16, M.steel, lx, 1.95, lz);                      // 斗腿
    beam(hop, lx, 3.9, lz, lx * 0.5, 4.2, lz * 0.5, 0.08, M.steel);        // 腿到斗角撑
  }
  box(hop, 3.4, 0.42, 0.9, M.steel, -1.5, 0.6, 0);                         // 布料输送带外壳
  box(hop, 3.0, 0.06, 0.5, M.rackD, -1.5, 0.84, 0);                        // 带面(检修露)
  box(hop, 0.14, 0.5, 0.4, okLit, 1.25, 5.0, 0);                          // 料位灯

  /* ===================== 配电柜 + 桥架(动力核心可见) ===================== */
  const pwr = new THREE.Group(); pwr.position.set(0, 0, -D / 2 + 0.75); g.add(pwr);
  for (let i = 0; i < 4; i++) {
    const px = -9 + i * 6;
    box(pwr, 2.0, 2.3, 0.72, M.trim, px, 1.25, 0);                         // LED 驱动柜
    for (let v = 0; v < 4; v++) box(pwr, 1.6, 0.05, 0.03, M.rackD, px, 0.7 + v * 0.32, 0.38); // 散热百叶
    box(pwr, 0.5, 0.5, 0.05, i % 2 ? okLit : grow, px + 0.55, 1.95, 0.38); // 柜面指示
    box(pwr, 0.16, 0.4, 0.1, M.steel, px - 0.7, 1.25, 0.4);               // 门把
  }
  box(pwr, L - 2, 0.34, 0.34, M.steel, 0, 2.7, 0.15);                     // 桥架
  for (let i = 0; i < 12; i++) cyl(pwr, 0.035, 0.95, M.pipeW, -13 + i * 2.4, 2.2, 0.28, 6, 'y'); // 线缆下行

  /* ===================== 三只成品料箱(同色因果链闭环) ===================== */
  [{ x: -10, m: M.potato }, { x: 0, m: M.wheat }, { x: 10, m: M.soy }].forEach((o) => {
    box(g, 1.9, 1.2, 1.7, M.trim, o.x, 0.6, D / 2 - 1.4);                  // 箱体
    for (let r = 0; r < 3; r++) box(g, 2.0, 0.05, 0.05, M.rackD, o.x, 0.35 + r * 0.35, D / 2 - 0.56); // 加强筋
    box(g, 1.5, 0.3, 1.3, o.m, o.x, 1.28, D / 2 - 1.4);                   // 箱口露成品
    box(g, 0.7, 0.3, 0.04, M.reflect, o.x, 0.75, D / 2 - 0.54);           // 标牌
  });

  /* ===================== 循环风机 ×3(后墙高处,带护栅,spinner) ===================== */
  for (let i = 0; i < 3; i++) {
    const fx = -9 + i * 9;
    cyl(g, 0.78, 0.4, M.steel, fx, H - 1.15, -D / 2 + 0.55, 14, 'z');      // 机筒
    const blades = new THREE.Group(); blades.position.set(fx, H - 1.15, -D / 2 + 0.7); blades.name = 'fan_' + i;
    for (let b = 0; b < 5; b++) { const bl = box(blades, 0.16, 1.3, 0.04, M.fan, 0, 0, 0); bl.rotation.z = b * 1.2566; }
    cyl(blades, 0.14, 0.14, M.steel, 0, 0, 0.06, 8, 'z');                  // 轮毂
    g.add(blades);
    for (let b = 0; b < 4; b++) box(g, 0.05, 1.6, 0.05, M.rackD, fx, H - 1.15, -D / 2 + 0.9, b * 0.785); // 护栅
  }

  /* ===================== 收获桁架(沿 x 往复,oscillator) ===================== */
  const gantry = new THREE.Group(); gantry.name = 'harvest_gantry'; gantry.position.set(0, 6.0, 1.4);
  box(gantry, 0.5, 0.4, D - 3.4, M.steel, 0, 0, 0);                        // 横梁(沿 z)
  for (let k = -1; k <= 1; k++) beam(gantry, -0.25, 0, k * 3, 0.25, -0.35, k * 3, 0.07, M.rack); // 梁下腹杆
  box(gantry, 0.3, 1.1, 0.3, M.steel, 0, -0.65, 2.3);                     // 抓取头立柱
  box(gantry, 1.0, 0.32, 1.0, M.rack, 0, -1.2, 2.3);                      // 抓取头
  box(gantry, 0.16, 0.16, 0.4, okLit, 0.35, 0.1, -4.9);                   // 桁架灯
  g.add(gantry);
  box(g, L - 1, 0.2, 0.3, M.steel, 0, 6.35, 1.4);                        // 顶轨

  /* ===================== 门 + 门灯(左墙服务舱门:框+扇+闩+双铰,外立面外凸) ===================== */
  box(g, 0.12, 2.3, 1.5, M.trim, -L / 2 - 0.05, 1.2, 4.6);              // 密封框
  box(g, 0.1, 2.0, 1.2, M.steel, -L / 2 - 0.1, 1.15, 4.6);              // 门扇
  box(g, 0.07, 0.26, 0.09, M.rackD, -L / 2 - 0.17, 1.15, 4.28);         // 闩
  box(g, 0.07, 0.1, 0.14, M.rackD, -L / 2 - 0.15, 1.9, 5.08);           // 铰 ×2
  box(g, 0.07, 0.1, 0.14, M.rackD, -L / 2 - 0.15, 0.5, 5.08);
  box(g, 0.08, 0.22, 0.5, doorLit, -L / 2 - 0.08, 2.55, 4.6);           // 门灯

  /* ===================== 夜测 CO₂ 仪表(应 pwr-fission-01 之请) ===================== */
  // 琥珀「封舱测试」信标:亮 = 封舱测量中、任何人不得进入(把 2% 的人呼吸项按规程钉在零)
  const sealBeacon = new THREE.MeshStandardMaterial({ color: 0x2a1c05, emissive: 0xffa020,
    emissiveIntensity: 0.9, roughness: 0.5 });
  box(g, 0.12, 0.18, 0.34, sealBeacon, -L / 2 - 0.08, 2.95, 4.6);       // 门框上方信标(外立面)
  // NDIR CO₂/T 传感杆 ×3(每作物组一支,立在组前沿走道边)
  for (const sx of [-9.8, 0.6, 9.8]) {
    box(g, 0.07, 2.3, 0.07, M.rackD, sx, 1.15, 3.15);                    // 杆
    box(g, 0.22, 0.3, 0.16, M.steel, sx, 2.42, 3.15);                    // NDIR 传感头
    box(g, 0.06, 0.06, 0.05, okLit, sx, 2.3, 3.24);                      // 采样指示
  }
  // 夜测仪表柜(门侧:记录仪 + 显示屏)
  box(g, 0.5, 1.5, 0.9, M.trim, -L / 2 + 0.55, 0.75, 3.0);
  box(g, 0.05, 0.42, 0.6, grow, -L / 2 + 0.82, 1.05, 3.0);               // 屏(夜里同补光色发光)

  /* ===================== 作业痕迹:前坪车辙 + 散石 ===================== */
  for (const rz of [D / 2 + 1.2, D / 2 + 2.6]) box(g, L, 0.03, 0.5, M.slab, 0, 0.03, rz);
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);
  const rockM = new THREE.MeshStandardMaterial({ color: 0x9e6b48, roughness: 1.0 });
  for (let i = 0; i < 10; i++) {
    const s = 0.08 + hash(i * 5.9) * 0.12;
    const m = new THREE.Mesh(rockGeo, rockM); m.scale.set(s, s * 0.7, s);
    m.position.set((hash(i * 3.3) - 0.5) * 26, 1.62 * s * 0.7 + 0.02, D / 2 + 1.0 + hash(i * 7.7) * 3);
    m.rotation.y = hash(i * 2.1) * 6.28; g.add(m);
  }

  /* ===================== POI 锚点(对应 info 卡) ===================== */
  const poi = (id, x, y, z) => { const a = new THREE.Object3D(); a.name = 'poi_' + id; a.position.set(x, y, z); g.add(a); };
  poi('config', 0, 3.6, 5.8);
  poi('light', -9.4, 3.4, 1.2);
  poi('crop', 9.4, 3.4, 1.2);
  poi('water', -13.6, 1.7, -1.0);
  poi('media', 12.6, 3.2, -3.6);
  poi('gas', 0, 5.7, -5.2);

  /* ===================== 尘膜 pass ===================== */
  const dust = new THREE.Color(0x9e5b3d);
  [M.shell, M.liner, M.trim, M.steel, M.rack, M.rackD, M.tray, M.slab, M.pipeW, M.fan, M.reflect, M.orange]
    .forEach((m) => m.color.lerp(dust, 0.05));

  /* ===================== 声明式动画 ===================== */
  g.userData.spinners = [
    { node: 'fan_0', axis: 'z', rpm: 42 },
    { node: 'fan_1', axis: 'z', rpm: 42 },
    { node: 'fan_2', axis: 'z', rpm: 42 },
    { node: 'pump_rotor', axis: 'y', rpm: 90 },
  ];
  g.userData.oscillators = [
    { node: 'harvest_gantry', prop: 'position', axis: 'x', amp: 11, period: 20 },
  ];
  g.userData.nightMats = nightMats;
  g.userData.blinkMats = [sealBeacon];   // 封舱测试信标:引擎驱动闪烁
  g.userData.lights = [
    { color: 0xff6faa, pos: [0, 3.2, 1.2], range: 34 },
    { color: 0xffc37a, pos: [-L / 2 - 1, 2.5, 4.6], range: 10 },
  ];
  return g;
}
