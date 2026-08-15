// pwr-grid-net-01 —— 埋地电网地表标识散件包
// Buried-grid surface furniture: route markers, joint pits, tap cabinets
//
// 本包解决本设计最难的视觉问题：**电网全在地下，地表怎么读得出来。**
// 答案是把电网的拓扑编码进三件沿走廊撒放的小件，规则一眼可学：
//
//   色带 = 电压等级   琥珀 13.8 kV 交流 · 红/蓝 ±10 kV 直流 ·
//                     青 1500 V · 绿 400 V · 紫 48 V
//   人字 = 走向       标桩顶的 V 形牌指着电缆去的方向
//   井盖 = 接头       每隔一段有一座接线井，说明电缆在这儿可以被挖出来修
//   分接柜 = 取电点   密封机柜，帕邢账要求 ≥250 V 处处无气隙（设计册账 2）
//
// 于是走在城里，不用看图也知道脚下有什么、去哪里、多少伏。
//
// 单件 ≤500 面（会有几十个实例）。契约同代码资产：不 import、THREE 传入、
// 1 单位 = 1 米、原点在底面中心地面点。
export const meta = {
  id: 'pwr-grid-net-01',
  name: '埋地电网地表标识散件包',
  name_en: 'Buried-grid surface marker pack',
  kind: 'scatter',
};

// 电压等级色板 —— 与 pwr-grid-01 站内同色因果链一致
const LEVELS = {
  ac138: 0xd9a441,   // 13.8 kV AC
  dcPos: 0xc0392b,   // +10 kV
  dcNeg: 0x2f6fb0,   // −10 kV
  mv15: 0x63b4d8,    // 1500 V DC
  lv400: 0x7fb069,   // 400 V DC
  elv48: 0x9b8fc4,   // 48 V DC
};

function kit(THREE) {
  const M = (c, o = {}) => new THREE.MeshStandardMaterial(
    Object.assign({ color: c, roughness: 0.78 }, o));
  return {
    M,
    white: M(0xe6e2d8, { roughness: 0.62 }),
    conc: M(0x8a7566),
    dconc: M(0x6f5c50),
    steel: M(0x9aa0a8, { roughness: 0.5, metalness: 0.45 }),
    dark: M(0x22262c),
    bond: M(0x86b03a),
    bondy: M(0xd8c832),
    copper: M(0xb87333, { roughness: 0.42, metalness: 0.7 }),
    orange: M(0xd4762a, { roughness: 0.62 }),
  };
}

const dust = (mats, THREE) => {
  for (const m of mats) if (m && m.color) m.color.lerp(new THREE.Color(0x9e5b3d), 0.05);
};

export const builders = {
  // ---------------------------------------------------------------
  // 1) 走向标桩 —— 色带报电压，人字牌指走向，里程牌报位置
  //    ~230 面
  // ---------------------------------------------------------------
  markerPost(THREE, opt) {
    const o = opt || {};
    const level = LEVELS[o.level] || LEVELS.dcPos;
    const bearing = (o.bearing !== undefined) ? o.bearing : 0.4;
    const g = new THREE.Group();
    const k = kit(THREE);
    const band = k.M(level, { roughness: 0.55, metalness: 0.2 });
    const mats = [k.white, k.conc, k.dconc, k.steel, k.dark, k.bond, k.copper, band];
    const nightMats = [];
    const add = (w, h, d, m, x, y, z, ry) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
      b.position.set(x, y, z); if (ry) b.rotation.y = ry; g.add(b); return b;
    };
    add(0.52, 0.22, 0.52, k.dconc, 0, 0.11, 0);              // 桩基（底面正好 y=0）
    add(0.28, 1.45, 0.28, k.white, 0, 0.90, 0);              // 桩身
    add(0.40, 0.14, 0.40, k.dconc, 0, 1.69, 0);              // 桩帽
    add(0.46, 0.30, 0.045, band, 0, 1.42, 0.16);             // 电压色带
    // 人字走向牌（两片斜板夹成 V，指着电缆走向）
    for (const s of [-1, 1]) {
      const v = add(0.30, 0.05, 0.05, k.dark, s * 0.10, 1.06, 0.17, bearing);
      v.rotation.z = s * 0.62;
    }
    add(0.34, 0.20, 0.045, k.dark, 0, 1.06, 0.155, bearing);
    add(0.30, 0.10, 0.045, k.white, 0, 0.72, 0.16);          // 里程号牌
    // 联结柱：地表金属件一律接等电位网（账 2 —— 尘暴期大气就在击穿边缘）
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.18, 6), k.copper);
    st.position.set(0.16, 0.30, 0); g.add(st);
    add(0.14, 0.06, 0.14, k.bond, 0.16, 0.22, 0);
    // 反光警示环（夜间可见）
    const refl = new THREE.MeshStandardMaterial({ color: 0xffb347, emissive: 0xffb347,
      emissiveIntensity: 0.9, roughness: 0.4 });
    nightMats.push(refl); mats.push(refl);
    add(0.30, 0.07, 0.30, refl, 0, 1.60, 0);
    dust(mats, THREE);
    g.userData.nightMats = nightMats;
    return g;
  },

  // ---------------------------------------------------------------
  // 2) 接线井 —— 埋地电缆的检修入口，栓接盖 + 吊耳 + 联结柱
  //    ~300 面
  // ---------------------------------------------------------------
  jointPit(THREE, opt) {
    const o = opt || {};
    const level = LEVELS[o.level] || LEVELS.dcPos;
    const g = new THREE.Group();
    const k = kit(THREE);
    const band = k.M(level, { roughness: 0.55, metalness: 0.2 });
    const mats = [k.white, k.conc, k.dconc, k.steel, k.dark, k.bond, k.copper, k.orange, band];
    const cy = (r1, r2, h, seg, m, x, y, z) => {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), m);
      c.position.set(x, y, z); g.add(c); return c;
    };
    const add = (w, h, d, m, x, y, z, ry) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
      b.position.set(x, y, z); if (ry) b.rotation.y = ry; g.add(b); return b;
    };
    cy(1.02, 1.08, 0.30, 14, k.dconc, 0, 0.15, 0);           // 井圈（略出地面防灌沙）
    cy(0.88, 0.88, 0.10, 14, k.steel, 0, 0.30, 0);           // 井盖
    for (let i = 0; i < 6; i++) {                            // 盖螺栓
      const a = i * Math.PI / 3;
      add(0.09, 0.05, 0.09, k.steel, Math.cos(a) * 0.72, 0.36, Math.sin(a) * 0.72);
    }
    cy(0.14, 0.14, 0.06, 8, k.steel, 0, 0.38, 0);            // 吊耳座
    add(0.05, 0.16, 0.05, k.steel, 0, 0.46, 0);
    add(0.52, 0.05, 0.20, band, 0, 0.36, 0.30);              // 盖面电压色带
    add(0.30, 0.04, 0.16, k.dark, 0, 0.36, -0.30);           // 井号牌
    cy(0.035, 0.035, 0.20, 6, k.copper, 0.85, 0.33, 0);      // 联结柱
    add(0.16, 0.06, 0.16, k.bond, 0.85, 0.24, 0);
    add(0.44, 0.03, 0.44, k.orange, 0, 0.015, 1.35);         // 走向压顶砖（指下一段）
    add(0.44, 0.03, 0.44, k.orange, 0, 0.015, -1.35);
    dust(mats, THREE);
    return g;
  },

  // ---------------------------------------------------------------
  // 3) 沿廊分接柜 —— 从干线取电给沿途设施；密封是帕邢账的硬要求
  //    ~430 面
  // ---------------------------------------------------------------
  tapCabinet(THREE, opt) {
    const o = opt || {};
    const level = LEVELS[o.level] || LEVELS.mv15;
    const g = new THREE.Group();
    const k = kit(THREE);
    const band = k.M(level, { roughness: 0.55, metalness: 0.2 });
    const mats = [k.white, k.conc, k.dconc, k.steel, k.dark, k.bond, k.copper, k.orange, band];
    const nightMats = [];
    const add = (w, h, d, m, x, y, z, ry) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
      b.position.set(x, y, z); if (ry) b.rotation.y = ry; g.add(b); return b;
    };
    add(1.55, 0.26, 1.05, k.dconc, 0, 0.13, 0);              // 混凝土墩（底面正好 y=0）
    add(1.20, 1.55, 0.72, k.white, 0, 1.02, 0);              // 柜体
    add(1.32, 0.12, 0.84, k.steel, 0, 1.85, 0);              // 柜顶压条（挡尘）
    add(1.26, 0.09, 0.78, k.steel, 0, 0.31, 0);              // 底裙
    for (let i = 0; i < 7; i++)                              // 散热鳍（火星只能靠辐射）
      add(0.05, 1.20, 0.30, k.steel, -0.48 + i * 0.16, 1.02, -0.48);
    add(1.10, 0.20, 0.04, band, 0, 1.66, 0.37);              // 电压色带
    // 密封检修门：框 + 扇 + 闩 + 双铰链（≥250 V 处处无气隙 —— 账 2）
    add(0.98, 1.22, 0.06, k.steel, 0, 0.98, 0.365);
    add(0.86, 1.10, 0.05, k.dark, 0, 0.98, 0.40);
    add(0.20, 0.08, 0.08, k.steel, 0.40, 0.98, 0.43);
    for (const dy of [0.55, 1.42]) add(0.07, 0.20, 0.07, k.steel, -0.46, dy, 0.40);
    add(0.34, 0.09, 0.03, k.orange, 0, 0.50, 0.43);          // 「带电勿开」警示条
    const lamp = new THREE.MeshStandardMaterial({ color: 0x59ff8f, emissive: 0x59ff8f,
      emissiveIntensity: 1.4, roughness: 0.4 });
    nightMats.push(lamp); mats.push(lamp);
    add(0.16, 0.16, 0.05, lamp, 0.44, 1.62, 0.37);           // 状态灯
    const win = new THREE.MeshStandardMaterial({ color: 0x2b3038, emissive: 0x63b4d8,
      emissiveIntensity: 0.5, roughness: 0.4 });
    nightMats.push(win); mats.push(win);
    add(0.40, 0.22, 0.03, win, -0.20, 1.40, 0.40);           // 密封观察窗（不开门读表）
    // 出线：向下入沟，色带同级
    add(0.14, 0.34, 0.14, band, -0.42, 0.30, 0.20);
    add(0.14, 0.34, 0.14, band, 0.42, 0.30, 0.20);
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.20, 6), k.copper);
    st.position.set(0.66, 0.36, 0); g.add(st);               // 联结柱
    add(0.16, 0.06, 0.16, k.bond, 0.66, 0.27, 0);
    dust(mats, THREE);
    g.userData.nightMats = nightMats;
    return g;
  },
};
