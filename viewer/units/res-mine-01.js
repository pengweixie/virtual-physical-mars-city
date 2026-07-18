// res-mine-01 土壤矿场
// 1 单位 = 1 米；原点在矿坑中心，+Y 向上，出场道路朝 +Z。
// 硬约束：所有几何 y >= 0.2 —— 矿坑用"外高内低"视错觉：外圈土堤垫高到 3 m，
// 坑底贴着 y = 0.3，从不真正向下挖。

export const meta = {
  id: 'res-mine-01',
  name: '土壤矿场',
  size_m: 90,             // 场区长边，1 单位 = 1 米，禁止整体缩放
  effects: ['glow_windows'],
};

export function build(THREE) {
  const group = new THREE.Group();
  group.name = 'res-mine-01';

  // ---------- 材质 ----------
  // 土方铁锈红系；朝天面带尘膜（整体已调暗调红约 5%），全部哑光
  const M = {
    soil:      new THREE.MeshLambertMaterial({ color: 0x96543a, side: THREE.DoubleSide }), // 主土色（含尘膜）
    // 地层色带带一点自发光托底：坑的背光面也要能读出层理（视觉灵魂）
    strataA:   new THREE.MeshLambertMaterial({ color: 0xc4805a, emissive: 0xc4805a, emissiveIntensity: 0.22, side: THREE.DoubleSide }), // 浅锈红
    strataB:   new THREE.MeshLambertMaterial({ color: 0x54351e, emissive: 0x54351e, emissiveIntensity: 0.22, side: THREE.DoubleSide }), // 深褐
    strataC:   new THREE.MeshLambertMaterial({ color: 0xa08e7e, emissive: 0xa08e7e, emissiveIntensity: 0.22, side: THREE.DoubleSide }), // 灰褐
    rock:      new THREE.MeshLambertMaterial({ color: 0x7a4f38 }),
    pad:       new THREE.MeshLambertMaterial({ color: 0x8a6047 }),  // 压实场地
    ramp:      new THREE.MeshLambertMaterial({ color: 0x9c5f42 }),  // 坡道路面
    white:     new THREE.MeshLambertMaterial({ color: 0xe8e8e4 }),  // 机械白
    whiteDust: new THREE.MeshLambertMaterial({ color: 0xd9d2c8 }),  // 白件朝天面尘膜
    orange:    new THREE.MeshLambertMaterial({ color: 0xe07020 }),  // 安全橙
    orangeDS:  new THREE.MeshLambertMaterial({ color: 0xe07020, side: THREE.DoubleSide }), // 开口容器用
    dark:      new THREE.MeshLambertMaterial({ color: 0x3a3a3c }),  // 深灰机械件
    grey:      new THREE.MeshLambertMaterial({ color: 0x9a9a96 }),  // 中灰机械件
    greyDS:    new THREE.MeshLambertMaterial({ color: 0x9a9a96, side: THREE.DoubleSide }), // 空心斗筒用
    tire:      new THREE.MeshLambertMaterial({ color: 0x2e2e30 }),
    tireDS:    new THREE.MeshLambertMaterial({ color: 0x2e2e30, side: THREE.DoubleSide }), // 镂空轮圈用
    pv:        new THREE.MeshLambertMaterial({ color: 0x1c2a52 }),  // 光伏深蓝
    pileFine:  new THREE.MeshLambertMaterial({ color: 0xb8b3ab }),  // 细料浅灰
    pileMid:   new THREE.MeshLambertMaterial({ color: 0xa15b3e }),  // 中料锈红
    pileCoarse:new THREE.MeshLambertMaterial({ color: 0x5b4130 }),  // 粗渣深褐
  };
  // 夜间发光材质 -> userData.nightMats
  const winMat  = new THREE.MeshStandardMaterial({ color: 0x332a18, emissive: 0xffc46a, emissiveIntensity: 1.2, roughness: 0.6 });
  const lampMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3c, emissive: 0xfff0d8, emissiveIntensity: 1.5, roughness: 0.5 });
  const led1Mat = new THREE.MeshStandardMaterial({ color: 0x0a2a0a, emissive: 0x35e055, emissiveIntensity: 1.4, roughness: 0.5 });
  const led2Mat = new THREE.MeshStandardMaterial({ color: 0x0a2a0a, emissive: 0x35e055, emissiveIntensity: 1.4, roughness: 0.5 });
  // 机器人状态灯：作业绿 / 充电琥珀
  const ledBotA = new THREE.MeshStandardMaterial({ color: 0x0a2a0a, emissive: 0x35e055, emissiveIntensity: 1.4, roughness: 0.5 });
  const ledBotB = new THREE.MeshStandardMaterial({ color: 0x2a1c05, emissive: 0xffb020, emissiveIntensity: 1.4, roughness: 0.5 });

  const box = (w, h, d, mat, x, y, z, parent) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    (parent || group).add(m);
    return m;
  };

  // ---------- 质感工具（确定性：同种子每次构建一致） ----------
  let _seed = 20260712;
  const rnd = () => { _seed = (_seed * 16807) % 2147483647; return _seed / 2147483647; };
  const hash3 = (x, y, z) => {
    const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
    return s - Math.floor(s);
  };
  const vnoise = (x, y, z) => {                                // 三线性值噪声
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const xf = x - xi, yf = y - yi, zf = z - zi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
    let a = 0;
    for (let dx = 0; dx <= 1; dx++) for (let dy = 0; dy <= 1; dy++) for (let dz = 0; dz <= 1; dz++)
      a += hash3(xi + dx, yi + dy, zi + dz) * (dx ? u : 1 - u) * (dy ? v : 1 - v) * (dz ? w : 1 - w);
    return a;
  };
  // 两点之间放一根方截面结构梁（桁架/斜撑用）
  const _ba = new THREE.Vector3(), _bb = new THREE.Vector3();
  const beam = (ax, ay, az, bx, by, bz, w, mat, parent) => {
    _ba.set(ax, ay, az); _bb.set(bx, by, bz);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, w, _ba.distanceTo(_bb) + w * 0.6), mat);
    m.position.copy(_ba).lerp(_bb, 0.5);
    m.lookAt(_bb);
    (parent || group).add(m);
    return m;
  };
  // 有机料堆：锥体侧面噪声粗糙化 + 双色顶点斑驳 + 底部散落碎块
  const makePile = (x, z, r, h, hexA, hexB, baseY, chunks) => {
    const geo = new THREE.ConeGeometry(r, h, 48, 8);
    const pos = geo.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const cA = new THREE.Color(hexA), cB = new THREE.Color(hexB), tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      let px = pos.getX(i), py = pos.getY(i), pz = pos.getZ(i);
      if (Math.hypot(px, pz) > 0.05 && py < h / 2 - 0.05) {
        const k = 1 + (vnoise(px * 1.6 + x, py * 1.6, pz * 1.6 + z) - 0.5) * 0.17;
        px *= k; pz *= k;
        pos.setX(i, px); pos.setZ(i, pz);
      }
      const n = 0.6 * vnoise(px * 2.1 + x, py * 2.1, pz * 2.1 + z) +
                0.4 * vnoise(px * 4.7, py * 4.7 + 5, pz * 4.7);
      tmp.copy(cA).lerp(cB, Math.min(1, Math.max(0, n * 0.85 + 0.2 * (1 - (py + h / 2) / h))));
      col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeVertexNormals();
    const pile = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
    pile.position.set(x, baseY + h / 2, z);
    group.add(pile);
    for (let i = 0; i < (chunks || 0); i++) {                  // 底部散落碎块
      const a = rnd() * 6.283, d = r * (0.85 + rnd() * 0.4), s = 0.1 + rnd() * 0.12;
      const rock = new THREE.Mesh(rockGeo, new THREE.MeshLambertMaterial({ color: rnd() < 0.5 ? hexA : hexB }));
      rock.position.set(x + Math.cos(a) * d, baseY - 0.35 * s + 1.62 * s, z + Math.sin(a) * d);
      rock.scale.setScalar(s);
      rock.rotation.y = rnd() * 6.28;
      group.add(rock);
    }
    return pile;
  };

  // ==========================================================
  // 1) 矿坑本体：椭圆采掘区 ~50 x 35 m，外高内低
  //    旋转体剖面按半长轴（25 m 级）建，整组 z 向压 0.7 成椭圆
  // ==========================================================
  const pit = new THREE.Group();
  pit.scale.set(1, 1, 0.7);
  group.add(pit);

  // 剖面 (半径, 高度)：坑底 0.30 -> 两级台阶 -> 堤顶 3.0 -> 外坡脚 0.22
  // 立面处土体半径故意外凹 0.15，让地层色带锥台盖在立面之前（否则色带被土体遮死）
  const profile = [
    [0.0, 0.30], [13.15, 0.30],   // 坑底
    [13.40, 1.15], [18.15, 1.15], // 台阶二
    [18.40, 2.05], [23.15, 2.05], // 台阶一
    [23.40, 3.00], [25.5, 3.00],  // 堤顶
    [34.0, 0.22],                 // 外坡脚
  ].map(p => new THREE.Vector2(p[0], p[1]));
  // 土面顶点色斑驳：大尺度锈斑 + 小尺度砾石噪点，打破"完美旋转体"的塑料感
  {
    const pitGeo = new THREE.LatheGeometry(profile, 96);
    const pos = pitGeo.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const cBase = new THREE.Color(0x96543a), cDark = new THREE.Color(0x784430),
          cLite = new THREE.Color(0xac6a4a), tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i), py = pos.getY(i), pz = pos.getZ(i);
      const n1 = vnoise(px * 0.14, py * 0.6, pz * 0.14);       // 大尺度色斑
      const n2 = vnoise(px * 0.9 + 31, py * 2.1, pz * 0.9);    // 小尺度颗粒
      tmp.copy(cBase).lerp(n1 > 0.5 ? cLite : cDark, Math.abs(n1 - 0.5) * 1.3)
         .lerp(cDark, (n2 - 0.5) * 0.25 + 0.125);
      col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
    }
    pitGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    pit.add(new THREE.Mesh(pitGeo, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })));
  }

  // 台阶立面地层色带（视觉灵魂）：锥台分段贴合立面坡度，深浅交替。
  // 观察面是筒的内侧，必须真正翻转 winding+法线才能被正确照亮
  // （scale(-1,1,1) 对旋转对称体是无效翻面）。
  const flipInside = g => {
    const idx = g.index.array;
    for (let i = 0; i < idx.length; i += 3) {
      const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t;
    }
    const nrm = g.attributes.normal.array;
    for (let i = 0; i < nrm.length; i++) nrm[i] = -nrm[i];
    return g;
  };
  const strata = (rBot, rTop, y0, y1, mats) => {
    const n = mats.length, dh = (y1 - y0) / n;
    for (let i = 0; i < n; i++) {
      const rb = rBot + (rTop - rBot) * (i / n);
      const rt = rBot + (rTop - rBot) * ((i + 1) / n);
      const g = flipInside(new THREE.CylinderGeometry(rt, rb, dh, 72, 1, true));
      const m = new THREE.Mesh(g, mats[i]);
      m.position.y = y0 + dh * (i + 0.5);
      pit.add(m);
    }
  };
  // 每级 2 条宽带，六层自下而上 深褐/浅锈红 | 灰褐/深褐 | 浅锈红/灰褐 交替
  strata(13.0, 13.25, 0.30, 1.15, [M.strataB, M.strataA]); // 台阶二立面
  strata(18.0, 18.25, 1.15, 2.05, [M.strataC, M.strataB]); // 台阶一立面
  strata(23.0, 23.25, 2.05, 3.00, [M.strataA, M.strataC]); // 堤内壁

  // 堤顶散落碎岩（主坐标系里按椭圆放，避免被压扁）
  // 注意：DodecahedronGeometry(1,0) 顶点半径实为 φ≈1.62，不是 1
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);
  [[0.4, 0.55], [2.2, 0.4], [3.1, 0.62], [3.9, 0.45], [5.0, 0.5], [5.7, 0.38]].forEach(([t, s], i) => {
    const r = new THREE.Mesh(rockGeo, M.rock);
    r.position.set(24.6 * Math.cos(t), 2.95 + s * 1.62, 17.2 * Math.sin(t));
    r.scale.setScalar(s);
    r.rotation.y = i * 1.7;   // 只绕 Y 转：底顶点固定在 φ·s，略埋 5 cm 不悬浮
    group.add(r);
  });

  // 坑内运输坡道（+Z 侧，从坑底跨两级台阶上到堤顶）
  const rampIn = box(5, 0.35, 11.8, M.ramp, 0, 1.78, 11.6);
  rampIn.rotation.x = -Math.atan2(2.7, 11);        // +Z 端抬高
  box(5, 0.26, 2.6, M.ramp, 0, 0.34, 5.4);         // 坡道脚与坑底的接坡
  // 堤外坡道路面（顺外坡而下）+ 出场平路，道路朝 +Z
  const rampOut = box(5, 0.3, 6.8, M.ramp, 0, 1.82, 20.8);
  rampOut.rotation.x = Math.atan2(2.78, 5.95);     // +Z 端降低
  box(5, 0.12, 17, M.ramp, 0, 0.26, 32);

  // 坑底作业痕迹：渣土堆（机器人卸料堆，有机形）+ 碎石
  makePile(-4.2, -1.4, 1.3, 0.9, 0x96543a, 0x6e3e2a, 0.3, 4);
  // 坑底碎岩只绕 Y 转（顶点最低点 = φ·s，可精确落在 0.21）
  [[-2.5, -4.2, 0.3], [3.5, 2.0, 0.35], [7.0, -2.8, 0.28]].forEach(([x, z, s], i) => {
    const r = new THREE.Mesh(rockGeo, M.rock);
    r.position.set(x, 0.21 + s * 1.62, z);
    r.scale.setScalar(s);
    r.rotation.y = i * 2.1;
    group.add(r);
  });

  // ==========================================================
  // 2) RASSOR 型挖掘机器人 x2（长 2.5 m，前后斗轮滚筒，滚筒可转）
  // ==========================================================
  const spinners = [];
  // RASSOR 核心机理全部外露：
  //  1) 空心开口斗筒——挖起的土就存在筒内（作业机的筒里能看到土，充电机是空筒）；
  //  2) 前后滚筒对转——0.38g 低重力下靠对转抵消挖掘反力（spinners 里 rpm 一正一负）；
  //  3) 摆臂机构——肩部横轴+轴毂+双侧臂板，'dig' 压筒贴地 / 'stow' 收臂抬筒两种姿态。
  function makeRassor(pose, ledMat) {
    const bot = new THREE.Group();
    const dig = pose === 'dig';
    // 底盘 + 设备箱 + 工程件
    box(0.7, 0.3, 1.5, M.white, 0, 0.57, 0, bot);
    box(0.08, 0.12, 1.56, M.dark, -0.36, 0.46, 0, bot);        // 底盘纵梁（左右）
    box(0.08, 0.12, 1.56, M.dark, 0.36, 0.46, 0, bot);
    box(0.5, 0.26, 0.7, M.orange, 0, 0.85, 0, bot);            // 电池/航电箱
    box(0.44, 0.05, 0.5, M.whiteDust, 0, 1.0, -0.15, bot);     // 散热板 + 三道散热鳍
    [-0.16, 0, 0.16].forEach(dz => box(0.4, 0.05, 0.05, M.grey, 0, 1.05, -0.15 + dz, bot));
    [[-0.28, 0.68], [0.28, 0.68], [-0.28, -0.68], [0.28, -0.68]].forEach(([lx, lz]) =>
      box(0.09, 0.1, 0.09, M.orange, lx, 0.76, lz, bot));      // 四角吊装点
    // 传感桅杆 + 相机头 + 状态灯
    box(0.26, 0.45, 0.26, M.white, 0, 1.1, 0.45, bot);
    box(0.55, 0.26, 0.28, M.dark, 0, 1.42, 0.45, bot);         // 立体相机头
    [-0.14, 0.14].forEach(x => {                               // 双目镜头
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.05, 10), M.grey);
      lens.rotation.x = Math.PI / 2;
      lens.position.set(x, 1.42, 0.61);
      bot.add(lens);
    });
    box(0.1, 0.28, 0.1, M.white, 0, 1.62, 0.45, bot);          // 感知桅杆加高段
    box(0.3, 0.16, 0.2, M.dark, 0, 1.8, 0.45, bot);            // 导航相机传感器舱（CIS 单元供货）
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.26, 0.26), ledMat);
    led.position.set(0, 1.42, -0.45);
    bot.add(led);
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.55, 6), M.grey);
    ant.position.set(0, 1.25, -0.45);
    bot.add(ant);
    // 四轮：镂空格栅轮（真火星轮样式）——开口轮圈 + 双轮缘环 + 六辐 + 轮毂 + 14 抓地格栅。
    // 每轮一个 Group，animate 里按行驶里程滚动（含原地转向的左右差速）。
    const grouserGeo = new THREE.BoxGeometry(0.32, 0.1, 0.05);
    const wheels = [];
    [[-0.55, 0.42], [0.55, 0.42], [-0.55, -0.42], [0.55, -0.42]].forEach(([x, z]) => {
      const wg = new THREE.Group();
      wg.position.set(x, 0.34, z);
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.3, 18, 1, true), M.tireDS);
      rim.rotation.z = Math.PI / 2;
      wg.add(rim);
      [-0.15, 0.15].forEach(dx => {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.025, 8, 20), M.grey);
        ring.rotation.y = Math.PI / 2;
        ring.position.x = dx;
        wg.add(ring);
      });
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const sp = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.24, 0.05), M.grey);
        sp.position.set(0, 0.125 * Math.cos(a), 0.125 * Math.sin(a));
        sp.rotation.x = -a;
        wg.add(sp);
      }
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.32, 12), M.orange);
      hub.rotation.z = Math.PI / 2;
      wg.add(hub);
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        const c = new THREE.Mesh(grouserGeo, M.grey);
        c.position.set(0, 0.31 * Math.cos(a), 0.31 * Math.sin(a));
        c.rotation.x = -a;
        wg.add(c);
      }
      bot.add(wg);
      wheels.push({ node: wg, side: Math.sign(x) });
    });
    // 前后斗轮滚筒（直径 0.7）：肩部横轴 ->（转动关节 pivot）-> 轴毂 + 双侧臂板 -> 筒轴
    // pivot.rotation.x 就是真实的臂关节角：姿态与动画都走这个关节，不再烘死在几何里
    const drums = [], pivots = [];
    const L = 0.8;                                             // 肩轴心到筒轴心距离
    const baseAng = dig ? 0.331 : -0.567;                      // 关节角：正=下压（挖掘），负=上收
    [1, -1].forEach(sign => {
      const shoulder = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.5, 10), M.dark);
      shoulder.rotation.z = Math.PI / 2;
      shoulder.position.set(0, 0.62, sign * 0.55);             // 肩部横轴（静止）
      bot.add(shoulder);
      const pivot = new THREE.Group();
      pivot.position.set(0, 0.62, sign * 0.55);
      [-0.6, 0.6].forEach(x => {
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.22, 14), M.orange);
        hub.rotation.z = Math.PI / 2;
        hub.position.set(x, 0, 0);
        pivot.add(hub);
        const mot = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.16, 12), M.dark);
        mot.rotation.z = Math.PI / 2;                          // 关节驱动电机壳（毂外侧）
        mot.position.set(x * 1.22, 0, 0);
        pivot.add(mot);
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.24, L + 0.15), M.grey);
        arm.position.set(x, 0, sign * L / 2);
        pivot.add(arm);                                        // 薄臂板，随关节转
      });
      const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, L - 0.05, 8), M.dark);
      cable.rotation.x = Math.PI / 2;                          // 沿臂走线到滚筒电机
      cable.position.set(0.56, -0.16, sign * L / 2);
      pivot.add(cable);
      // 滚筒本体（旋转组，挂在关节末端）
      const drum = new THREE.Group();
      drum.position.set(0, 0, sign * L);
      const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.36, 10), M.dark);
      axle.rotation.z = Math.PI / 2;
      drum.add(axle);
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.95, 16, 1, true), M.greyDS);
      tube.rotation.z = Math.PI / 2;
      drum.add(tube);
      [-0.475, 0.475].forEach(x => {                           // 筒口加强环圈
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.03, 8, 22), M.grey);
        ring.rotation.y = Math.PI / 2;
        ring.position.x = x;
        drum.add(ring);
      });
      [-0.44, 0.44].forEach(x => {                             // 筒口内辐条（空筒的机械支撑）
        for (let i = 0; i < 3; i++) {
          const sp = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.64, 0.04), M.grey);
          sp.position.x = x;
          sp.rotation.x = (i / 3) * Math.PI;
          drum.add(sp);
        }
      });
      // 6 只斗勺三列螺旋排布（RASSOR 真机布局）：薄底板 + 外沿唇板，勺口切向张开
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2, xOff = -0.3 + (i % 3) * 0.3;
        const plate = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.06, 0.3), M.orange);
        plate.position.set(xOff, 0.3 * Math.cos(a), 0.3 * Math.sin(a));
        plate.rotation.x = -a - 0.35;
        drum.add(plate);
        const lip = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.1, 0.05), M.orange);
        lip.position.set(xOff, 0.4 * Math.cos(a + 0.32), 0.4 * Math.sin(a + 0.32));
        lip.rotation.x = -a - 0.35;
        drum.add(lip);
      }
      if (dig) {
        // 筒内存土：端面微伸出筒口、亮锈红 + 微自发光（与地层色带同款处理），
        // 暗侧/夜里也能读出"土装在筒里"——满载筒微亮 vs 空筒黑，一眼分清两台机的状态
        const fillMat = new THREE.MeshLambertMaterial({
          color: 0xa15b3e, emissive: 0xa15b3e, emissiveIntensity: 0.18,
        });
        const fill = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.02, 14), fillMat);
        fill.rotation.z = Math.PI / 2;
        drum.add(fill);
      }
      pivot.add(drum);
      pivot.rotation.x = sign * baseAng;
      bot.add(pivot);
      drums.push(drum);
      pivots.push(pivot);
    });
    return { bot, drums, pivots, baseAng, wheels };
  }

  // A 机：坑底工作位（挖掘姿态，滚筒贴地、勺尖入土，筒内有料）
  const botA = makeRassor('dig', ledBotA);
  botA.bot.position.set(-7.6, 0.32, -5.3);   // = 作业循环起挖点 A0，静态摆放与动画首帧一致
  botA.bot.rotation.y = 0.6;
  group.add(botA.bot);
  // B 机：坑口充电棚充电位（收臂抬筒，空筒，琥珀充电灯）
  const botB = makeRassor('stow', ledBotB);
  botB.bot.position.set(11.5, 0.32, 29.4);
  botB.bot.rotation.y = Math.PI;
  group.add(botB.bot);
  // 前后滚筒对转（rpm 一正一负）：低重力挖掘反力抵消的机理直接可见
  [botA, botB].forEach(b => {
    spinners.push({ node: b.drums[0], axis: 'x', rpm: 8 });
    spinners.push({ node: b.drums[1], axis: 'x', rpm: -8 });
  });
  // 可选动画钩子：查看器每帧调用 group.userData.animate(t秒) 即可（不调用则保持静态姿态）。
  // A 机跑一条 24s 的完整采掘作业循环（纯 t 的确定性函数，任意时刻跳入都成立）：
  //   挖掘蠕进(0-8) -> 收臂(8-10) -> 转向渣土堆(10-11.2) -> 行驶(11.2-14.5)
  //   -> 抬臂卸料(14.5-17.5) -> 收臂(17.5-19) -> 倒车回位(19-23) -> 放臂复位(23-24)。
  // 臂关节角/车身俯仰/垂向起伏三条曲线由 MuJoCo 动力学仿真烘焙（sim/rassor-01，
  // 火星重力 3.71 m/s²，与底盘路径同一条时间线；改时间线后重跑 run_dig_cycle.py 再烘）。
  // 伺服迟滞、重力下垂（行驶位 -0.13 而非指令 -0.2）、卸料抖料、加减速俯仰踢、
  // 放臂落地回弹，全部来自仿真而非手调。仿真含等效切削模型（入地滚筒受对抗旋转的
  // 切削力矩 + 前进拖曳阻力，土壤不均匀度为确定性双正弦）：挖掘段因此有臂角随载荷
  // 的缓慢起伏、约 -2° 的切削抬头偏置、以及 t≈4s 附近一次"硬块松脱"的突降事件。
  {
    const T = 24;
    const A0 = [-7.6, -5.3], A1 = [-6.9, -4.3], DP = [-5.47, -2.52]; // 起挖点/蠕进终点/卸料点
    const H0 = 0.6, H1 = 0.85;                                 // 挖掘朝向 / 卸料朝向
    const ss = (a, b, t) => {                                  // smoothstep
      const s = Math.min(1, Math.max(0, (t - a) / (b - a)));
      return s * s * (3 - 2 * s);
    };
    const lerp = (a, b, s) => a + (b - a) * s;
    // MuJoCo 烘焙曲线（dt=0.125s，192 样本，循环首尾闭合；arm 已按 js 符号：正=下压）
    const CYC = {
      dt: 0.125,
      arm: [0.266,0.277,0.288,0.296,0.300,0.300,0.293,0.284,0.277,0.271,0.267,0.266,0.268,0.272,0.279,0.285,0.292,0.299,0.306,0.313,0.320,0.325,0.326,0.326,0.327,0.331,0.331,0.331,0.331,0.331,0.331,0.293,0.265,0.282,0.296,0.308,0.317,0.325,0.330,0.330,0.326,0.319,0.311,0.304,0.298,0.293,0.287,0.279,0.273,0.268,0.266,0.267,0.271,0.277,0.284,0.291,0.297,0.303,0.310,0.316,0.323,0.329,0.330,0.328,0.327,0.150,-0.052,-0.183,-0.206,-0.169,-0.131,-0.114,-0.117,-0.126,-0.132,-0.133,-0.132,-0.130,-0.129,-0.129,-0.130,-0.130,-0.130,-0.130,-0.130,-0.130,-0.130,-0.130,-0.130,-0.130,-0.126,-0.136,-0.141,-0.134,-0.129,-0.127,-0.128,-0.130,-0.130,-0.130,-0.130,-0.130,-0.130,-0.130,-0.130,-0.130,-0.130,-0.130,-0.130,-0.130,-0.130,-0.130,-0.130,-0.130,-0.130,-0.130,-0.130,-0.260,-0.434,-0.527,-0.542,-0.524,-0.495,-0.479,-0.477,-0.488,-0.513,-0.538,-0.539,-0.511,-0.468,-0.432,-0.427,-0.455,-0.500,-0.540,-0.551,-0.528,-0.484,-0.441,-0.424,-0.316,-0.161,-0.078,-0.076,-0.108,-0.134,-0.142,-0.138,-0.131,-0.128,-0.128,-0.129,-0.139,-0.125,-0.107,-0.109,-0.137,-0.143,-0.138,-0.131,-0.127,-0.128,-0.129,-0.130,-0.130,-0.130,-0.130,-0.130,-0.130,-0.130,-0.130,-0.130,-0.130,-0.130,-0.130,-0.130,-0.130,-0.130,-0.130,-0.130,-0.130,-0.130,-0.130,-0.130,0.064,0.294,0.267,0.265,0.266,0.266,0.266],
      pitch: [-0.0000,-0.0053,-0.0097,-0.0134,-0.0155,-0.0151,-0.0121,-0.0083,-0.0050,-0.0025,-0.0007,-0.0004,-0.0014,-0.0031,-0.0059,-0.0088,-0.0118,-0.0147,-0.0181,-0.0212,-0.0243,-0.0263,-0.0268,-0.0267,-0.0273,-0.0297,-0.0321,-0.0328,-0.0340,-0.0353,-0.0307,-0.0091,-0.0001,-0.0073,-0.0134,-0.0186,-0.0229,-0.0263,-0.0287,-0.0284,-0.0266,-0.0237,-0.0203,-0.0169,-0.0146,-0.0124,-0.0093,-0.0060,-0.0033,-0.0012,-0.0003,-0.0007,-0.0024,-0.0051,-0.0081,-0.0111,-0.0139,-0.0167,-0.0196,-0.0224,-0.0254,-0.0280,-0.0283,-0.0275,-0.0272,0.0037,0.0034,-0.0002,-0.0001,-0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,-0.0001,0.0000,0.0000,0.0001,-0.0001,-0.0000,-0.0001,0.0000,0.0000,-0.0025,-0.0026,0.0001,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0165,0.0186,0.0100,-0.0004,-0.0001,-0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,-0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0208,0.0292,0.0185,-0.0016,-0.0001,-0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,-0.0163,-0.0223,-0.0009,0.0002,0.0000,-0.0000,-0.0000],
      heave: [0.0000,0.0022,0.0041,0.0056,0.0065,0.0063,0.0050,0.0034,0.0020,0.0010,0.0003,0.0001,0.0005,0.0013,0.0024,0.0037,0.0049,0.0062,0.0076,0.0089,0.0102,0.0110,0.0112,0.0112,0.0114,0.0124,0.0134,0.0137,0.0142,0.0148,0.0137,0.0088,-0.0004,0.0030,0.0056,0.0078,0.0096,0.0110,0.0120,0.0119,0.0111,0.0099,0.0085,0.0071,0.0061,0.0051,0.0039,0.0025,0.0013,0.0005,0.0001,0.0003,0.0010,0.0021,0.0034,0.0046,0.0058,0.0070,0.0082,0.0094,0.0106,0.0117,0.0119,0.0115,0.0114,-0.0005,0.0014,-0.0000,0.0000,0.0000,-0.0000,-0.0000,-0.0000,0.0000,0.0000,0.0000,0.0000,-0.0000,-0.0000,-0.0000,0.0000,0.0001,0.0001,0.0001,0.0002,0.0001,0.0001,0.0001,0.0001,0.0001,0.0011,0.0010,-0.0001,-0.0000,-0.0000,-0.0000,-0.0000,0.0000,0.0000,0.0000,0.0000,-0.0000,-0.0000,-0.0000,0.0000,0.0000,0.0000,0.0000,-0.0000,-0.0000,-0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0068,0.0077,0.0042,-0.0001,-0.0000,-0.0000,-0.0000,-0.0000,-0.0000,-0.0000,0.0000,0.0000,0.0000,-0.0000,-0.0000,-0.0000,-0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,-0.0000,-0.0000,0.0000,-0.0000,-0.0000,-0.0000,0.0000,0.0000,0.0000,0.0000,-0.0000,-0.0000,-0.0000,0.0000,0.0087,0.0121,0.0076,-0.0005,-0.0000,-0.0000,0.0000,0.0000,-0.0000,-0.0000,-0.0000,0.0000,0.0000,0.0000,0.0000,-0.0000,-0.0000,-0.0000,0.0000,0.0000,0.0000,-0.0000,-0.0000,-0.0000,-0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0139,0.0102,-0.0006,-0.0000,0.0000,0.0000,0.0000],
    };
    const cyc = (arr, tt) => {                                 // 循环线性插值采样
      const n = arr.length, x = tt / CYC.dt;
      const i = Math.floor(x) % n, f = x - Math.floor(x);
      return arr[i] * (1 - f) + arr[(i + 1) % n] * f;
    };
    botA.bot.rotation.order = 'YXZ';                           // 先航向、再俯仰
    group.userData.animate = t => {
      const tt = ((t % T) + T) % T;
      let head = H0, px, pz;
      if (tt < 8) {          // 挖掘蠕进
        const s = ss(0, 8, tt);
        px = lerp(A0[0], A1[0], s); pz = lerp(A0[1], A1[1], s);
      } else if (tt < 10) {  // 收臂
        px = A1[0]; pz = A1[1];
      } else if (tt < 11.2) { // 原地转向渣土堆
        head = lerp(H0, H1, ss(10, 11.2, tt));
        px = A1[0]; pz = A1[1];
      } else if (tt < 14.5) { // 驶向卸料点
        head = H1;
        const s = ss(11.2, 14.5, tt);
        px = lerp(A1[0], DP[0], s); pz = lerp(A1[1], DP[1], s);
      } else if (tt < 19) {  // 抬臂卸料 + 收臂
        head = H1; px = DP[0]; pz = DP[1];
      } else if (tt < 23) {  // 倒车回起挖点（滑移转向，边退边回正朝向）
        const s = ss(19, 23, tt);
        head = lerp(H1, H0, s);
        px = lerp(DP[0], A0[0], s); pz = lerp(DP[1], A0[1], s);
      } else {               // 放臂复位，衔接下一轮
        px = A0[0]; pz = A0[1];
      }
      // 回放安全包络：仿真里俯仰以"接地滚筒"为支点（地面接触托住），运动学回放
      // 没有接触约束，直接回放会让另一端滚筒下穿地面。臂角钳 0.30、俯仰缩 0.6，
      // 保证任意 t 全场 y>=0.2（全循环扫描验证）。
      const arm = Math.min(cyc(CYC.arm, tt), 0.30);
      botA.pivots[0].rotation.x = arm;                         // 前臂（+Z）
      botA.pivots[1].rotation.x = -arm;                        // 后臂（-Z）
      botA.bot.position.set(px, 0.32 + cyc(CYC.heave, tt), pz);
      botA.bot.rotation.y = head;
      botA.bot.rotation.x = 0.6 * cyc(CYC.pitch, tt);          // 切削抬头偏置 + 加减速俯仰踢
      // 轮子按实际里程滚动（蠕进+行驶−倒车），原地转向时左右差速对转
      const dist = 1.2 * ss(0, 8, tt) + 2.28 * ss(11.2, 14.5, tt) - 2.9 * ss(19, 23, tt);
      const skid = 3.0 * (ss(10, 11.2, tt) - ss(19, 23, tt));
      botA.wheels.forEach(w => { w.node.rotation.x = dist / 0.28 - w.side * skid; });
      ledBotB.emissiveIntensity = 1.0 + 0.7 * Math.sin(t * 2.2); // 充电灯呼吸
    };
  }

  // ==========================================================
  // 视觉-运动闭环（自主模式）：感知 -> 决策 -> 运动，全部真实发生。
  // 相机传感器本体由 CIS 单元供货，这里是它的"算法端"：
  //   感知：桅杆相机 POV 渲到 64x48 离屏缓冲，近场亮度自适应阈值分割出
  //         暗区障碍（岩块/深影），统计左右危险质量；
  //   决策：状态机 找挖点->挖掘->运土->对准->卸料，视觉避障叠加转向/减速，
  //         导航用航位推算（与真火星车同构：视觉管危险，路径靠里程）；
  //   运动：差速滑移底盘积分 + 坑底椭圆地理围栏。
  // 引擎接入（MODELS.md §4c 感知通道）：资产声明 userData.sensors=[{camera,hz,...}]，
  // 引擎按预算渲染并回填 sensor.data/frame；统一入口 animate(t,dt,ctx) 检测到传感器
  // 供数据即进入自主模式，引擎无此通道则自动退回烘焙电影循环（优雅降级，同文件两用）。
  {
    const eye = new THREE.PerspectiveCamera(72, 1.0, 0.1, 90); // 方形像面，匹配 CIS 64x64 阵列
    eye.rotation.order = 'YXZ';
    eye.rotation.y = Math.PI;                                  // 朝机器人正前方（+Z）
    eye.rotation.x = -0.24;                                    // 俯视地面
    eye.position.set(0, 1.8, 0.5);                             // 传感器舱位置
    botA.bot.add(eye);

    // ---- CIS 成像模型（参数来自 CIS 五阶段验证结果）----
    // 64x64 4T PPD @5µm / rolling shutter / 列级 CDS / 10-bit 单斜率 ADC
    // 信号链：场景亮度 -> 光电子(QE 0.60 已并入曝光标定) -> +暗电流 170 e-/s
    //        -> 散粒噪声 sqrt(Ne) + 读噪 1.76 e- -> 满阱 17,880 e- 截止
    //        -> DN = Ne / LSB(16.5 e-) 取整 0..1023（量化噪声 ~4.8 e- 自然产生）
    // 自动曝光：扫描带均值 DN 稳到 ~400（约 45% 量程）
    const CIS = {
      N: 64, FWC: 17880, LSB: 16.5, READ: 1.76, DARK: 170,
      expMs: 12, EXP0: 12, KEXP: 13400,   // 曝光标定：白天 12ms 下 luma=1 给 ~0.75 FWC
      meanDN: 0, dn: new Uint8ClampedArray(64 * 64),           // 8bit 预览帧（DN>>2）
      // ---- 可注入的传感器缺陷（联合实验用；出厂良品全 0/1）----
      deadRate: 0, hotRate: 0, readMult: 1,                    // 死点率/亮点率/读噪倍率
      defMap: null, _defKey: -1,                               // 固定图案缺陷图（真实 FPN 特性）
    };
    // 缺陷图：按确定性 hash 阈值分类，缺陷随率单调累积（真实坏点是固定图案，不是每帧随机）
    const buildDefMap = () => {
      if (!CIS.defMap) CIS.defMap = new Int8Array(W * H);
      for (let i = 0; i < W * H; i++) {
        const h = hash3((i & 63) + 0.5, (i >> 6) + 0.5, 3.7);
        CIS.defMap[i] = h < CIS.deadRate ? -1 : (h > 1 - CIS.hotRate ? 1 : 0);
      }
    };
    let _g2 = null;                                            // Box-Muller 高斯
    const gauss = () => {
      if (_g2 !== null) { const v = _g2; _g2 = null; return v; }
      const u = Math.max(1e-9, rnd()), v = rnd();
      const r = Math.sqrt(-2 * Math.log(u));
      _g2 = r * Math.sin(6.2832 * v);
      return r * Math.cos(6.2832 * v);
    };

    const W = 64, H = 64;
    // 传感器声明（引擎感知通道）：引擎按 hz 渲染 eye 并回填 data(RGBA,原点左下)/frame/stamp
    const sensor = { id: 'nav', camera: eye, width: W, height: H, hz: 5, data: null, frame: 0, stamp: 0 };
    group.userData.sensors = [sensor];
    const AUTO = {
      state: 'dig', fill: 0, t: 0, digT: 0, dumpT: 0,
      pos: { x: -7.6, z: -5.3 }, head: 0.6, v: 0, w: 0, arm: 0.30,
      wheelA: 0, skidA: 0, seeT: 0, hazL: 0, hazR: 0,
      target: { x: -7.6, z: -5.3 },
      cycles: 0, simT: 0, swerveT: 0,                          // 产量指标：完成循环数 / 作业时长 / 避障耗时
      rt: null, buf: new Uint8Array(W * H * 4),
    };
    const DUMP_AT = { x: -5.1, z: -2.3 }, MOUND = { x: -4.2, z: -1.4 };
    const ROCKS = [[-2.5, -4.2], [3.5, 2.0], [7.0, -2.8]];     // 场地测绘图（选挖点用；途中意外靠视觉）

    const dnFrame = new Uint16Array(W * H);
    // 独立运行（无引擎感知通道）时自采像素：渲到自建 RT 并回填 sensor.data/frame
    const selfCapture = (renderer, scene) => {
      if (!AUTO.rt) AUTO.rt = new THREE.WebGLRenderTarget(W, H);
      if (!sensor.data) sensor.data = new Uint8Array(W * H * 4);
      const old = renderer.getRenderTarget();
      renderer.setRenderTarget(AUTO.rt);
      renderer.render(scene, eye);
      renderer.readRenderTargetPixels(AUTO.rt, 0, 0, W, H, sensor.data);
      renderer.setRenderTarget(old);
      sensor.frame++;
    };
    // 感知：消费传感器像素（引擎回填或 selfCapture 自采），跑 CIS 信号链 + 危险分割
    const perceive = px => {
      // --- CIS 成像：理想辐照 -> 光电子 -> 噪声 -> 缺陷 -> 满阱 -> 10-bit DN ---
      const dkey = CIS.deadRate * 1e4 + CIS.hotRate;           // 缺陷率变化时重建缺陷图
      if (dkey !== CIS._defKey) { buildDefMap(); CIS._defKey = dkey; }
      const kE = CIS.KEXP * (CIS.expMs / CIS.EXP0);            // 本帧曝光的 e-/满亮度
      const nDark = CIS.DARK * CIS.expMs / 1000;               // 暗电流电子数
      const rn = CIS.READ * CIS.readMult, rn2 = rn * rn;       // 读噪（可放大）
      for (let i = 0; i < W * H; i++) {
        const luma01 = (px[4 * i] * 0.35 + px[4 * i + 1] * 0.5 + px[4 * i + 2] * 0.15) / 255;
        const ne = luma01 * kE + nDark;
        const noisy = ne + gauss() * Math.sqrt(ne + rn2);      // 散粒 + 读出噪声
        let dn = Math.min(1023, Math.round(Math.min(CIS.FWC, Math.max(0, noisy)) / CIS.LSB));
        const def = CIS.defMap[i];                             // 坏点覆盖：死点卡暗、亮点卡满
        if (def === -1) dn = 0; else if (def === 1) dn = 1023;
        dnFrame[i] = dn;
        CIS.dn[i] = dn >> 2;                                   // 8bit 预览帧
      }
      // 扫描带取像底部第 14~32 行 = 前方约 2.7~7.6 m 的近场地面
      // （下缘避开画面里自己的滚筒；上限收窄，否则远处坑壁深色地层带会被当成持续威胁）
      let sum = 0, n = 0;
      for (let y = 14; y < 32; y++) for (let x = 0; x < W; x++) { sum += dnFrame[y * W + x]; n++; }
      const mean = sum / n;
      CIS.meanDN = mean;
      // 自动曝光：把扫描带均值 DN 拉向 400（下一帧生效）
      CIS.expMs = Math.min(400, Math.max(1.5, CIS.expMs * Math.min(1.45, Math.max(0.7, 400 / Math.max(20, mean)))));
      const thr = mean * 0.72;                                 // 自适应阈值：暗于均值 28% 判危险
      let hl = 0, hr = 0;
      for (let y = 14; y < 32; y++) for (let x = 0; x < W; x++) {
        if (dnFrame[y * W + x] < thr) { if (x < W / 2) hl++; else hr++; }
      }
      AUTO.hazL = hl / (W * 9); AUTO.hazR = hr / (W * 9);
    };

    const angTo = (tx, tz) => {
      let e = Math.atan2(tx - AUTO.pos.x, tz - AUTO.pos.z) - AUTO.head;
      while (e > Math.PI) e -= 2 * Math.PI;
      while (e < -Math.PI) e += 2 * Math.PI;
      return e;
    };
    const distTo = p => Math.hypot(p.x - AUTO.pos.x, p.z - AUTO.pos.z);
    const pickDigSpot = () => {                                // 蒙特卡洛选新挖点，避开测绘图上的岩块
      for (let k = 0; k < 20; k++) {
        const x = -9 + rnd() * 12, z = -6 + rnd() * 8.5;
        if ((x / 11) ** 2 + (z / 7.6) ** 2 > 0.85) continue;
        if (ROCKS.some(r => Math.hypot(r[0] - x, r[1] - z) < 2.5)) continue;
        if (Math.hypot(MOUND.x - x, MOUND.z - z) < 3) continue;
        return { x, z };
      }
      return { x: -7.6, z: -5.3 };
    };

    const control = dt => {
      const s = AUTO;
      s.t += dt; s.simT += dt;
      let steer = 0;
      if (s.state === 'dig') {                                 // 压筒蠕进采掘
        s.v = 0.13; s.w = 0;
        s.arm = 0.30 - 0.02 * (0.5 + 0.5 * Math.sin(s.t * 1.3));
        s.fill += dt / 8; s.digT += dt;
        if (s.fill >= 1) { s.state = 'toDump'; }
      } else if (s.state === 'toDump') {                       // 收筒运土去卸料点
        s.arm = -0.12;
        steer = angTo(DUMP_AT.x, DUMP_AT.z);
        s.v = Math.abs(steer) < 0.5 ? 0.5 : 0.08;
        s.w = Math.max(-1.1, Math.min(1.1, steer * 1.6));
        if (distTo(DUMP_AT) < 0.45) s.state = 'align';
      } else if (s.state === 'align') {                        // 原地对准渣土堆
        steer = angTo(MOUND.x, MOUND.z);
        s.v = 0; s.w = Math.max(-0.9, Math.min(0.9, steer * 2));
        if (Math.abs(steer) < 0.12) { s.state = 'dump'; s.dumpT = 0; }
      } else if (s.state === 'dump') {                         // 抬筒卸料
        s.v = 0; s.w = 0; s.dumpT += dt;
        s.arm = Math.max(-0.55, s.arm - dt * 0.6);
        if (s.dumpT > 1.2) s.arm = -0.55 + 0.03 * Math.sin((s.dumpT - 1.2) * 6);
        if (s.dumpT > 3.5) { s.fill = 0; s.cycles++; s.target = pickDigSpot(); s.state = 'toDig'; }
      } else {                                                 // toDig：空载去新挖点
        s.arm = -0.12;
        steer = angTo(s.target.x, s.target.z);
        s.v = Math.abs(steer) < 0.5 ? 0.55 : 0.08;
        s.w = Math.max(-1.1, Math.min(1.1, steer * 1.6));
        if (distTo(s.target) < 0.4) { s.state = 'dig'; s.digT = 0; }
      }
      // 视觉避障叠加：行进中前方暗区多 -> 向危险少的一侧转、减速。
      // 例外（进场模式）：接近已知卸料点时信任测绘图放宽门限——渣土堆的背阴面
      // 是一整片暗区，否则机器人会怕自己的卸料堆（亮度检测的真实局限）。
      const hz = s.hazL + s.hazR;
      const approaching = s.state === 'toDump' && distTo(DUMP_AT) < 4;
      if (s.v > 0.2 && hz > 0.05 && !approaching) {
        s.w += (s.hazL > s.hazR ? -1 : 1) * 1.4 * Math.min(1, hz * 5);
        s.v *= Math.max(0.25, 1 - hz * 3.5);
        s.swerveT += dt;                                       // 记避障耗时（缺陷升高 -> 幻影障碍 -> 飙升）
      }
      // 坑底地理围栏：越界则强制转向坑心
      if ((s.pos.x / 11) ** 2 + (s.pos.z / 7.6) ** 2 > 1) {
        const back = angTo(0, -1);
        s.w = Math.max(-1.2, Math.min(1.2, back * 2));
        s.v = Math.min(s.v, 0.3);
      }
      // 差速底盘积分 + 施加到模型
      s.head += s.w * dt;
      s.pos.x += Math.sin(s.head) * s.v * dt;
      s.pos.z += Math.cos(s.head) * s.v * dt;
      const arm = Math.max(-0.55, Math.min(0.30, s.arm));
      botA.pivots[0].rotation.x = arm;
      botA.pivots[1].rotation.x = -arm;
      botA.bot.position.set(s.pos.x, 0.32, s.pos.z);
      botA.bot.rotation.y = s.head;
      botA.bot.rotation.x = 0;
      s.wheelA += s.v / 0.28 * dt;
      s.skidA += s.w * dt;
      botA.wheels.forEach(w2 => { w2.node.rotation.x = s.wheelA - w2.side * s.skidA * 1.96; });
      ledBotB.emissiveIntensity = 1.0 + 0.7 * Math.sin(s.t * 2.2);
    };

    group.userData.eye = eye;                                  // 机器人 POV 相机（画中画/调试用）
    group.userData.autonomy = AUTO;                            // 只读遥测：state/fill/pos/haz/cycles/simT/swerveT
    group.userData.cis = CIS;                                  // CIS 遥测：expMs/meanDN/dn；可写缺陷 deadRate/hotRate/readMult
    group.userData.autonomyReset = (x, z, hd) => {             // 重置作业状态（基准测试每个工况前调）
      Object.assign(AUTO, {
        state: 'dig', fill: 0, t: 0, digT: 0, dumpT: 0, cycles: 0, simT: 0, swerveT: 0,
        pos: { x: x ?? -7.6, z: z ?? -5.3 }, head: hd ?? 0.6, v: 0, w: 0, arm: 0.30,
        wheelA: 0, skidA: 0, seeT: 0, hazL: 0, hazR: 0, target: { x: x ?? -7.6, z: z ?? -5.3 },
      });
    };
    // 统一入口：城内引擎每帧调 animate(t,dt,ctx)。传感器通道回填过数据即进入自主
    // 模式（粘性），引擎没有感知通道则永远走烘焙电影循环——同一文件旧引擎放动画、
    // 新引擎跑自主，优雅降级。AUTO.disabled=true 可强制回烘焙（预览页开关用）。
    const bakedAnimate = group.userData.animate;
    let lastFrame = 0, autoOn = false;
    group.userData.animate = (t, dt, ctx) => {
      if (AUTO.disabled) { bakedAnimate(t); return; }
      if (sensor.frame > 0) autoOn = true;
      if (!autoOn) { bakedAnimate(t); return; }
      if (sensor.frame !== lastFrame) { lastFrame = sensor.frame; perceive(sensor.data); }
      control(Math.min(dt || 0.016, 0.1));
    };
    // 兼容旧预览/独立运行：无引擎通道时自采像素喂同一条管线（城内不用此接口）
    group.userData.think = (renderer, scene, dt) => {
      dt = Math.min(dt || 0.016, 0.1);
      AUTO.seeT -= dt;
      if (AUTO.seeT <= 0 && renderer && scene) { selfCapture(renderer, scene); AUTO.seeT = 0.2; }
      if (sensor.frame !== lastFrame) { lastFrame = sensor.frame; perceive(sensor.data); }
      control(dt);
    };
  }

  // ==========================================================
  // 3) 运料机器人 x1：六轮平板车 + 橙色翻斗，停在坑内坡道上
  // ==========================================================
  const hauler = new THREE.Group();
  box(1.5, 0.28, 3.4, M.white, 0, 0.55, 0, hauler);            // 平板底盘
  const bed = box(1.4, 0.75, 2.2, M.orange, 0, 1.06, -0.35, hauler); // 翻斗
  bed.rotation.x = 0.06;
  box(1.15, 0.26, 1.95, M.strataB, 0, 1.48, -0.36, hauler);    // 斗内土料
  box(1.2, 0.55, 0.75, M.white, 0, 0.95, 1.25, hauler);        // 驾驶/控制舱
  const hWheel = new THREE.CylinderGeometry(0.3, 0.3, 0.3, 18);
  [-1.15, 0, 1.15].forEach(z => [0.85, -0.85].forEach(x => {
    const w = new THREE.Mesh(hWheel, M.tire);
    w.rotation.z = Math.PI / 2;
    w.position.set(x, 0.3, z);
    hauler.add(w);
  }));
  hauler.position.set(0.9, 2.07, 12);
  hauler.rotation.x = -Math.atan2(2.7, 11);                    // 与坡道同倾角
  group.add(hauler);

  // ==========================================================
  // 4) 破碎筛分站（坑外 -X 侧）：受料斗 + 30° 输送带桥 + 筛分塔 + 溜槽
  // ==========================================================
  box(9, 0.12, 19, M.pad, -36, 0.26, -2.5);                    // 场地压实垫层
  // 受料斗：上宽下窄方斗（总高 4 m），四条腿
  [[-1.1, -1.1], [1.1, -1.1], [-1.1, 1.1], [1.1, 1.1]].forEach(([dx, dz]) => {
    box(0.3, 1.5, 0.3, M.dark, -36 + dx, 1.0, -9 + dz);
    // 腿顶到斗沿角的角撑
    beam(-36 + dx, 1.72, -9 + dz, -36 + dx * 1.4, 3.9, -9 + dz * 1.4, 0.13, M.grey);
  });
  // 斗体上下开口（DoubleSide 露内壁），斗内可见土料——核心不做黑盒
  const hopper = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 0.7, 2.3, 4, 1, true), M.orangeDS);
  hopper.rotation.y = Math.PI / 4;
  hopper.position.set(-36, 2.75, -9);
  group.add(hopper);
  box(2.3, 0.26, 2.3, M.strataB, -36, 3.75, -9);               // 斗内料面
  const heap = new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.5, 16), M.strataB);
  heap.position.set(-36, 4.13, -9);                            // 刚倒进来的小料尖，略高于斗沿
  group.add(heap);
  // 斗口四边加强框（不是整板，避免像桌面）
  box(3.3, 0.26, 0.3, M.whiteDust, -36, 4.0, -10.5);
  box(3.3, 0.26, 0.3, M.whiteDust, -36, 4.0, -7.5);
  box(0.3, 0.26, 3.3, M.whiteDust, -37.5, 4.0, -9);
  box(0.3, 0.26, 3.3, M.whiteDust, -34.5, 4.0, -9);

  // 输送带桥：箱形截面，长 12 m，30° 倾角，通向筛分塔顶
  const belt = box(1.5, 1.0, 12, M.white, -36, 3.9, -3.0);
  belt.rotation.x = -Math.PI / 6;                              // +Z 端（塔侧）抬高
  // 桥顶两个检修天窗，露出深色皮带面（证明箱体里是运转的带）
  [-2.6, 2.6].forEach(z => {
    const w = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.26, 2.2), M.tire);
    w.position.set(0, 0.4, z);                                 // 皮带面略高于桥顶 0.03
    belt.add(w);
  });
  // 桥面两侧检修护栏（跟随桥体倾角）
  [-0.66, 0.66].forEach(sx => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 11.2), M.orange);
    rail.position.set(sx, 1.05, 0);
    belt.add(rail);
    for (let z = -4.4; z <= 4.4; z += 2.2) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.55, 0.06), M.orange);
      post.position.set(sx, 0.78, z);
      belt.add(post);
    }
  });
  // A 字桁架支撑排架 ×2（代替光杆立柱）
  beam(-37.0, 0.32, -3.0, -36.5, 3.42, -3.0, 0.22, M.dark);
  beam(-35.0, 0.32, -3.0, -35.5, 3.42, -3.0, 0.22, M.dark);
  beam(-36.9, 1.7, -3.0, -35.1, 1.7, -3.0, 0.16, M.dark);      // 横撑
  beam(-36.9, 1.7, -3.0, -35.5, 3.35, -3.0, 0.12, M.grey);     // 斜撑
  box(0.5, 0.14, 0.5, M.dark, -37.0, 0.39, -3.0);              // 基脚
  box(0.5, 0.14, 0.5, M.dark, -35.0, 0.39, -3.0);
  beam(-36.8, 0.32, -5.6, -36.4, 1.98, -5.6, 0.2, M.dark);
  beam(-35.2, 0.32, -5.6, -35.6, 1.98, -5.6, 0.2, M.dark);
  beam(-36.7, 1.1, -5.6, -35.3, 1.1, -5.6, 0.14, M.dark);
  box(0.45, 0.14, 0.45, M.dark, -36.8, 0.39, -5.6);
  box(0.45, 0.14, 0.45, M.dark, -35.2, 0.39, -5.6);

  // 筛分塔：6 m 方塔，+Z 面整面剖切露出工艺核心——三层振动筛
  box(3, 6, 0.3, M.white, -36, 3.3, 1.45);                     // 背墙
  box(0.3, 6, 3, M.white, -37.35, 3.3, 2.8);                   // 侧墙
  box(0.3, 6, 3, M.white, -34.65, 3.3, 2.8);
  box(3, 0.3, 3, M.whiteDust, -36, 6.15, 2.8);                 // 顶盖
  box(0.3, 6, 0.3, M.white, -37.35, 3.3, 4.15);                // 开口面两根边柱
  box(0.3, 6, 0.3, M.white, -34.65, 3.3, 4.15);
  box(2.0, 1.3, 2.0, M.whiteDust, -36, 6.95, 2.6);             // 塔顶受料间（接输送带头部）
  // 塔顶检修平台护栏（安全橙）
  [[-1.43, 1.37], [1.43, 1.37], [-1.43, 4.23], [1.43, 4.23], [0, 4.23], [-1.43, 2.8], [1.43, 2.8]]
    .forEach(([dx, z]) => box(0.07, 0.8, 0.07, M.orange, -36 + dx, 6.7, z));
  box(2.93, 0.07, 0.07, M.orange, -36, 7.08, 4.23);
  box(0.07, 0.07, 2.93, M.orange, -37.43, 7.08, 2.8);
  box(0.07, 0.07, 2.93, M.orange, -34.57, 7.08, 2.8);
  // 外墙电缆导管 + 接线箱
  [2.35, 2.65].forEach(z => {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 5.4, 10), M.grey);
    c.position.set(-37.57, 3.0, z);
    group.add(c);
  });
  box(0.2, 0.5, 0.4, M.dark, -37.6, 5.95, 2.5);
  // 三层倾斜筛板，自上而下 粗/中/细，颜色 = 对应料堆色（因果一眼闭环）
  [[4.7, 2.7, M.pileCoarse], [3.55, 2.9, M.pileMid], [2.4, 3.1, M.pileFine]].forEach(([y, z, mat]) => {
    const deck = box(2.4, 0.26, 2.7, mat, -36, y, z);
    deck.rotation.x = 0.32;                                    // 朝 +Z 出料口下倾；逐层前伸错位，三层前缘都可见
  });
  // 顶层筛板上两块未过筛的粗料
  [[-36.5, 1.9, 0.28], [-35.7, 2.15, 0.26]].forEach(([x, z, s], i) => {
    const r = new THREE.Mesh(rockGeo, M.rock);
    r.position.set(x, 4.84 + (2.8 - z) * 0.33 + 1.62 * s, z);
    r.scale.setScalar(s);
    r.rotation.y = 1.3 + i;
    group.add(r);
  });
  // 振动筛偏心轴（开口面上方，可见的动力核心）-> spinners
  const eccShaft = new THREE.Group();
  eccShaft.position.set(-36, 5.5, 3.85);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 2.7, 12), M.dark);
  shaft.rotation.z = Math.PI / 2;
  eccShaft.add(shaft);
  [-0.7, 0.7].forEach(x => {
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.26, 16), M.orange);
    disc.rotation.z = Math.PI / 2;
    disc.position.set(x, 0.13, 0);                             // 偏心：转起来看得出摆动
    eccShaft.add(disc);
  });
  group.add(eccShaft);
  spinners.push({ node: eccShaft, axis: 'x', rpm: 12 });
  // 检修梯（背墙外侧）
  box(0.26, 5.6, 0.26, M.grey, -36.5, 3.1, 1.16);
  box(0.26, 5.6, 0.26, M.grey, -35.5, 3.1, 1.16);
  for (let i = 0; i < 11; i++) box(1.0, 0.25, 0.25, M.grey, -36, 0.85 + i * 0.5, 1.16);
  // 三条陡溜槽从各层筛板出口滑到塔脚（粗层最高所以最长），
  // 末端各接一个同色落料小堆——"三层筛 -> 三色料"的因果在塔脚闭环
  [[-37.0, 4.28, 4.0, 0x5b4130, 0x3f2c20, 1.0, 0.7, 7.3],
   [-36.0, 3.13, 2.6, 0xa15b3e, 0x7c452f, 0.9, 0.7, 6.6],
   [-35.0, 1.98, 1.3, 0xb8b3ab, 0x8f8a80, 0.8, 0.6, 5.9]].forEach(([x, yTop, L, hexA, hexB, pr, ph, pz]) => {
    const cy = yTop - (L / 2) * Math.sin(0.95);
    const cz = 4.2 + (L / 2) * Math.cos(0.95);
    const chute = box(0.7, 0.3, L, M.orange, x, cy, cz);
    chute.rotation.x = 0.95;
    makePile(x, pz, pr, ph, hexA, hexB, 0.25, 2);              // 落料小堆（有机形）
  });

  // ==========================================================
  // 5) 成品料堆 x3：细料浅灰 / 中料锈红 / 粗渣深褐
  // ==========================================================
  // 有机形三色料堆 + 底部散落碎块（颜色分级：细浅灰/中锈红/粗深褐）
  makePile(-40.8, 9.5, 4.0, 3.0, 0xb8b3ab, 0x8f8a80, 0.25, 6);
  makePile(-33.5, 10.5, 3.5, 2.5, 0xa15b3e, 0x7c452f, 0.25, 6);
  makePile(-38.5, 15.0, 3.0, 2.0, 0x5b4130, 0x3f2c20, 0.25, 5);

  // ==========================================================
  // 6) 机器人充电棚（坑口 +Z 侧）：单坡顶光伏棚 + 双充电位
  // ==========================================================
  box(7, 0.14, 6, M.pad, 10, 0.27, 30);                        // 棚区垫层
  [[7.4, 27.8, 2.5], [12.6, 27.8, 2.5], [7.4, 32.2, 3.1], [12.6, 32.2, 3.1]]
    .forEach(([x, z, h]) => box(0.28, h, 0.28, M.white, x, 0.34 + h / 2, z));
  const roof = box(6.2, 0.25, 5.4, M.white, 10, 3.15, 30);
  roof.rotation.x = -0.135;                                    // 单坡：后(+Z)高前低
  [8.6, 11.4].forEach(x => {
    const pv = box(2.5, 0.26, 4.6, M.pv, x, 3.42, 30);
    pv.rotation.x = -0.135;                                    // 光伏板随坡
  });
  // 两个地面充电桩，各带绿色指示灯
  const stall = (x, ledMat) => {
    box(0.5, 1.1, 0.4, M.white, x, 0.34 + 0.55, 31.9);
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.26, 0.26), ledMat);
    led.position.set(x, 1.6, 31.82);
    group.add(led);
  };
  stall(8.5, led1Mat);
  stall(11.5, led2Mat);                                        // B 机就停在这一位
  // 光伏 -> 充电桩馈电导管 + 汇流箱
  [8.5, 11.5].forEach(x => {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.7, 10), M.grey);
    c.position.set(x, 2.3, 32.14);
    group.add(c);
  });
  box(0.4, 0.3, 0.16, M.dark, 10, 3.0, 32.28);

  // ==========================================================
  // 7) 防尘围栏：迎风侧(-Z) 8 块白色挡尘板，两块故意歪斜
  // ==========================================================
  for (let i = 0; i < 8; i++) {
    const x = -14 + i * 4;
    const p = box(2.5, 2.0, 0.25, M.white, x, 1.22, -29.5);
    box(2.5, 0.28, 0.9, M.grey, x, 0.35, -29.4);               // 底部压脚配重（锚定视觉）
    const strut = box(0.26, 1.6, 0.26, M.grey, x, 1.0, -29.05); // 背撑斜杆
    strut.rotation.x = -0.45;
    if (i === 2) { p.rotation.z = 0.09; p.position.y = 1.31; }
    if (i === 5) { p.rotation.x = 0.12; p.rotation.z = -0.07; p.position.y = 1.33; }
  }

  // ==========================================================
  // 8) 维修方舱：白色集装箱工房 6 x 2.5 m，一门一窗 + 备用滚筒轴
  // ==========================================================
  box(8, 0.12, 5, M.pad, 23, 0.26, 30);
  box(6, 2.6, 2.5, M.white, 23, 0.32 + 1.3, 30);               // 箱体
  box(3.2, 0.26, 2.6, M.whiteDust, 23, 2.75, 30);              // 顶面尘膜盖板（视觉分色）
  box(6.2, 0.14, 2.7, M.whiteDust, 23, 2.99, 30);              // 顶盖压条
  box(6.15, 0.2, 2.65, M.whiteDust, 23, 0.44, 30);             // 底部裙边
  // 密封检修门（-Z 面）：密封框 + 门扇 + 门闩 + 双铰链
  box(1.06, 2.02, 0.07, M.orange, 21.3, 1.29, 28.72);
  box(0.9, 1.86, 0.09, M.whiteDust, 21.3, 1.29, 28.68);
  box(0.1, 0.26, 0.08, M.dark, 21.62, 1.28, 28.62);
  box(0.14, 0.1, 0.06, M.dark, 20.93, 1.92, 28.64);
  box(0.14, 0.1, 0.06, M.dark, 20.93, 0.66, 28.64);
  // 外墙电缆导管 + 接线箱（+X 端面）
  [29.4, 29.7].forEach(z => {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.9, 10), M.grey);
    c.position.set(26.06, 1.35, z);
    group.add(c);
  });
  box(0.2, 0.55, 0.4, M.dark, 26.1, 2.35, 29.55);
  const win = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.8, 0.26), winMat);
  win.position.set(24.2, 1.75, 28.68);
  group.add(win);                                              // 窗，夜间发光
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 2.3, 14), M.grey);
  axle.position.set(20.2, 1.34, 28.9);
  axle.rotation.z = 0.4;                                       // 斜靠箱体门口
  axle.rotation.x = 0.08;
  group.add(axle);

  // ==========================================================
  // 9) 照明杆：坑边 8 m 灯杆，灯头夜间发光
  // ==========================================================
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 8, 12), M.white);
  pole.position.set(28, 0.25 + 4, 16);
  group.add(pole);
  box(0.9, 0.26, 0.3, M.grey, 27.6, 8.2, 16);                  // 灯臂（伸向矿坑）
  const lampHead = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.28, 0.45), lampMat);
  lampHead.position.set(27.2, 8.05, 16);
  group.add(lampHead);

  // ==========================================================
  // 作业痕迹：车辙 + 散落砾石（确定性随机），"用过的场地"质感
  // ==========================================================
  const trackMat = new THREE.MeshLambertMaterial({ color: 0x7a452e });
  [-0.8, 0.8].forEach(sx => {
    box(0.5, 0.03, 16.4, trackMat, sx, 0.335, 32);             // 出场平路双车辙
    const t1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 6.6), trackMat);
    t1.position.set(sx, 0.165, 0);
    rampOut.add(t1);                                           // 堤外坡道车辙（随坡）
    const t2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 11.6), trackMat);
    t2.position.set(sx, 0.19, 0);
    rampIn.add(t2);                                            // 坑内坡道车辙（随坡）
  });
  // 坑底机器人作业路径的履痕（挖掘蠕进段 + 驶向渣土堆段）
  [[-7.25, -4.8, 0.6, 4.5], [-5.2, -2.2, 0.85, 3.2]].forEach(([cx, cz, hd, len]) => {
    const px2 = Math.cos(hd), pz2 = -Math.sin(hd);             // 航向的横向单位向量
    [-0.45, 0.45].forEach(o => {
      const t = box(0.4, 0.03, len, trackMat, cx - px2 * o, 0.315, cz - pz2 * o);
      t.rotation.y = hd;
    });
  });
  // 散落砾石
  const gravelMat = new THREE.MeshLambertMaterial({ color: 0x7e4a33 });
  const scatter = (n, fx, fz, surf) => {
    for (let i = 0; i < n; i++) {
      const s = 0.08 + rnd() * 0.13, sy = s * (0.55 + rnd() * 0.45);
      const g = new THREE.Mesh(rockGeo, gravelMat);
      g.position.set(fx(), surf - 0.3 * sy + 1.62 * sy, fz());
      g.scale.set(s, sy, s);
      g.rotation.y = rnd() * 6.28;
      group.add(g);
    }
  };
  scatter(10, () => (rnd() - 0.5) * 16, () => (rnd() - 0.5) * 11, 0.30);           // 坑底
  scatter(8, () => (rnd() - 0.5) * 5.5, () => 25 + rnd() * 14, 0.33);              // 道路两侧
  scatter(8, () => -36 + (rnd() - 0.5) * 8, () => -2.5 + (rnd() - 0.5) * 16, 0.33); // 破碎站场地

  // 尘膜 pass：所有涂装/机械面统一向锈红压 5%，与场地融为一体
  const dust = new THREE.Color(0x9e5b3d);
  [M.white, M.whiteDust, M.grey, M.greyDS, M.orange, M.orangeDS, M.pv, M.dark]
    .forEach(m => m.color.lerp(dust, 0.05));

  // ---------- 引擎接口 ----------
  group.userData.spinners = spinners;                          // 4 个斗轮滚筒
  group.userData.nightMats = [winMat, lampMat, led1Mat, led2Mat, ledBotA, ledBotB];
  group.userData.lights = [{ color: 0xfff0d8, pos: [0, 10, 0], range: 45 }];

  return group;
}
