// veh-rocket-02 —— 长十乙运载火箭(竖立待发)— 代码资产,MODELS.md §4 契约。
// 真实米制:Ø5.0 m 单芯级,全高 67 m(逃逸塔针尖);原点 = 尾焰口地面中心,
// +Y 向上,铭牌/舷窗面朝 +Z。THREE 由查看器注入,不 import;无外部贴图
// (铭牌用运行时 CanvasTexture 绘制,非外部资源)。
//
// 动画接口(统一运动词汇):
//   - userData.actions = { '发射', '栅格舵展开/收拢', '着陆腿展开/收拢' }
//     一次性事件置标志,时间线由 userData.animate 状态机逐帧推进;
//     meta.schedule 每火星日 14:00 自动触发发射(演示,升空后自动复位归位)。
//   - 整箭在 userData.rocket 子 Group(发射动画契约:引擎/动画只动它,
//     发射支座留在原地);喷焰为自发光锥体,仅发射态显隐。
//   - userData.flames = [{ pos, r, type }] 7 台喷管出口挂点(羽流特效用)。
// 世界观:芯级推进剂标注 ISRU 甲烷化改型(YF-100M 示意)——煤油在火星
// 无法就地生产,详见 veh-rocket-02.info.json poi_body。

export const meta = {
  id: 'veh-rocket-02',
  name: '长十乙运载火箭',
  name_en: 'CZ-10B launch vehicle (pad, vertical)',
  size_m: 67, size_axis: 'height',   // 自检用,引擎不缩放
  effects: ['glow_windows'],
  schedule: { action: '发射', ltst: 14.0 },   // 火星时 14:00 例行发射演示
};

export function build(THREE) {
  const g = new THREE.Group();
  g.name = 'veh-rocket-02';
  const nightMats = [];
  const UP = new THREE.Vector3(0, 1, 0);
  const radial = (phi) => new THREE.Vector3(Math.sin(phi), 0, Math.cos(phi));

  // ---------------------------------------------------------------- 材质
  // 场景无环境贴图,metalness 压低让基色主导(veh-rocket-01 实测经验)
  const white = new THREE.MeshStandardMaterial({ color: 0xf2f0ea, metalness: 0.15, roughness: 0.55 });
  const grey = new THREE.MeshStandardMaterial({ color: 0xb9bcc0, metalness: 0.2, roughness: 0.55 });
  const seam = new THREE.MeshStandardMaterial({ color: 0xc9c7c0, metalness: 0.15, roughness: 0.6 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2b2e33, metalness: 0.35, roughness: 0.6 });
  const steelDk = new THREE.MeshStandardMaterial({ color: 0x6f7478, metalness: 0.4, roughness: 0.5 });
  const copper = new THREE.MeshStandardMaterial({ color: 0x8a5a34, metalness: 0.5, roughness: 0.5 });
  const flagRed = new THREE.MeshStandardMaterial({ color: 0xc8102e, metalness: 0.1, roughness: 0.6 });
  const flagYel = new THREE.MeshStandardMaterial({ color: 0xe8b31a, metalness: 0.1, roughness: 0.6 });
  const orange = new THREE.MeshStandardMaterial({ color: 0xd97a35, metalness: 0.3, roughness: 0.5 });
  // 夜光:飞船舷窗、QD 状态灯(绿)、发动机舱指示灯(琥珀)——白天灭,引擎随夜色拉
  const glowWin = new THREE.MeshStandardMaterial({ color: 0x0e1a2a, emissive: 0xffd9a0, emissiveIntensity: 0.0 });
  const glowStat = new THREE.MeshStandardMaterial({ color: 0x061a0c, emissive: 0x5aff9a, emissiveIntensity: 0.0 });
  const glowInd = new THREE.MeshStandardMaterial({ color: 0x1c1206, emissive: 0xffb347, emissiveIntensity: 0.0 });
  nightMats.push(glowWin, glowStat, glowInd);

  // ---------------------------------------------------------------- 整箭子组(发射动画契约:只动它)
  const rocket = new THREE.Group();
  rocket.name = 'rocket';
  g.add(rocket);
  // 分离动画契约:一子级/上面级各自命名子组,引擎可 attach 分家
  const stage1 = new THREE.Group(); stage1.name = 'stage1'; rocket.add(stage1);
  const upper = new THREE.Group(); upper.name = 'upper'; rocket.add(upper);
  let CUR = stage1;                       // 当前落舱组(按建造段切换)
  const add = (m) => { CUR.add(m); return m; };
  const rbox = (w, h, d, m, x, y, z, ry = 0) => {
    const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    o.position.set(x, y, z); if (ry) o.rotation.y = ry; return add(o);
  };
  const rcyl = (rT, rB, h, m, y, seg = 40, open = false) => {
    const o = new THREE.Mesh(new THREE.CylinderGeometry(rT, rB, h, seg, 1, open), m);
    o.position.y = y; return add(o);
  };

  const R1 = 2.5;    // 五米级芯半径
  const R2 = 2.6;    // Ø5.2 飞船段肩部半径

  // ========== 1. 箭体:尾裙 → 一级 → 级间段 → 二级(环缝分段) ==========
  rcyl(R1, R1 + 0.12, 2.4, white, 2.2);                 // 尾段防热裙(1.0..3.4,微外扩)
  rcyl(2.45, 2.45, 0.1, dark, 1.2);                     // 尾部防热底板
  rcyl(R1, R1, 30.2, white, 18.5);                      // 一级筒身 3.4..33.6
  for (let wy = 5.6; wy < 33.2; wy += 2.2)              // 一级贮箱环缝
    rcyl(R1 + 0.012, R1 + 0.012, 0.07, seam, wy, 40, true);
  rcyl(R1 + 0.02, R1 + 0.02, 2.6, dark, 34.9);          // 级间段 33.6..36.2(分色深灰)
  for (let i = 0; i < 8; i++) {                         // 级间段排气格栅口
    const a = (i + 0.5) / 8 * Math.PI * 2;
    const v = rbox(0.6, 0.3, 0.1, steelDk, 0, 34.9, 0);
    v.position.copy(radial(a)).multiplyScalar(R1 + 0.06).setY(34.9);
    v.rotation.y = a;
  }
  CUR = upper;
  rcyl(R1, R1, 10.2, white, 41.3);                      // 二级筒身 36.2..46.4
  for (const wy of [39.2, 42.4, 45.2])                  // 二级环缝
    rcyl(R1 + 0.012, R1 + 0.012, 0.07, seam, wy, 40, true);
  // 上面级真空发动机(平时藏在级间段内,分离后露出)+ 二级喷焰挂点
  rcyl(0.28, 0.92, 1.6, steelDk, 35.4, 18);             // 钟形喷管 34.6..36.2
  rcyl(0.5, 0.5, 0.5, dark, 36.5, 14);                  // 机架短段
  const flame2 = new THREE.Group();
  flame2.name = 'flame2';
  flame2.visible = false;
  flame2.scale.set(1, 0.001, 1);
  flame2.position.y = 34.6;
  upper.add(flame2);
  {
    const f2m = new THREE.MeshBasicMaterial({ color: 0xffc060, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1.6, 9, 14, 1, true), f2m);
    c.position.y = -4.5;
    flame2.add(c);
  }
  CUR = stage1;

  // 国旗色环带(一级上部):红底宽带 + 上下细黄边
  rcyl(R1 + 0.015, R1 + 0.015, 1.1, flagRed, 29.0, 40, true);
  rcyl(R1 + 0.015, R1 + 0.015, 0.16, flagYel, 29.65, 40, true);
  rcyl(R1 + 0.015, R1 + 0.015, 0.16, flagYel, 28.35, 40, true);

  // 电缆槽(避开 +Z 铭牌,偏 40°;分离面 36.2 处断开,分属两级)
  const RW = 0.7;
  const raceway = rbox(0.5, 30.0, 0.36, dark, 0, 0, 0);
  raceway.position.copy(radial(RW)).multiplyScalar(R1 + 0.1).setY(18.4);
  raceway.rotation.y = RW;
  CUR = upper;
  const raceway2 = rbox(0.5, 9.8, 0.36, dark, 0, 0, 0);
  raceway2.position.copy(radial(RW)).multiplyScalar(R1 + 0.1).setY(41.3);
  raceway2.rotation.y = RW;
  CUR = stage1;
  // QD 脱插区(-Z 塔侧):一级/二级凹板 + 状态灯
  for (const [qy, gm] of [[5.2, glowStat], [44.2, glowStat]]) {
    CUR = qy > 36.2 ? upper : stage1;
    const p = rbox(1.8, 2.0, 0.24, dark, 0, qy, -(R1 + 0.05));
    p.rotation.y = Math.PI;
    const s = rbox(0.5, 0.2, 0.12, gm, 0.9, qy + 1.2, -(R1 + 0.06));
    s.rotation.y = Math.PI;
  }
  CUR = stage1;
  const ind = rbox(0.8, 0.24, 0.12, glowInd, 0, 2.6, R1 + 0.1);  // 尾舱指示灯(琥珀,+Z)
  ind.rotation.y = 0;

  // ========== 2. 铭牌(CanvasTexture):国旗 + 竖排「长征十号乙」+ CZ-10B Y1 ==========
  {
    const c = document.createElement('canvas');
    c.width = 160; c.height = 1024;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, 160, 160);
    // 国旗(简化五星):红底 + 大星 + 4 小星
    const star = (cx, cy, r, rot = -Math.PI / 2) => {
      ctx.beginPath();
      for (let k = 0; k < 5; k++) {
        const a = rot + k * (Math.PI * 4 / 5);
        ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      }
      ctx.closePath(); ctx.fill();
    };
    ctx.fillStyle = '#c8102e';
    ctx.fillRect(23, 26, 114, 76);
    ctx.fillStyle = '#ffde00';
    star(48, 52, 14);
    star(74, 36, 5); star(84, 48, 5); star(84, 62, 5); star(74, 74, 5);
    // 竖排箭名(航天蓝)+ 型号编号
    ctx.fillStyle = '#1a4fa0';
    ctx.font = 'bold 96px "Microsoft YaHei", "PingFang SC", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const chars = '长征十号乙';
    for (let i = 0; i < chars.length; i++) ctx.fillText(chars[i], 80, 190 + i * 128);
    ctx.font = 'bold 44px "Arial", sans-serif';
    ctx.fillText('CZ-10B', 80, 880);
    ctx.fillText('Y1', 80, 940);
    const tex = new THREE.CanvasTexture(c);
    if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    const plateMat = new THREE.MeshStandardMaterial({ map: tex, transparent: true, metalness: 0.1, roughness: 0.55, polygonOffset: true, polygonOffsetFactor: -1 });
    // 曲面贴片(顺箭体弧面,+Z 中心;theta=0 在 +Z)
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(R1 + 0.03, R1 + 0.03, 9.6, 16, 1, true, -0.26, 0.52), plateMat);
    plate.position.y = 21.6;   // 铭牌区 16.8..26.4
    add(plate);
  }

  // ========== 3. 动力段:7×YF-100K(中心 1 + 环布 6),钟形喷管 + 摇摆机构 ==========
  const flames = [];
  {
    // 发动机常年在尾裙阴影里,微自发光保证可读(veh-rocket-01 经验)
    const bellM = new THREE.MeshStandardMaterial({ color: 0x4a4640, emissive: 0x4a4640, emissiveIntensity: 0.12, metalness: 0.55, roughness: 0.45, flatShading: true, side: THREE.DoubleSide });
    const pumpM = new THREE.MeshStandardMaterial({ color: 0x94999e, emissive: 0x94999e, emissiveIntensity: 0.15, metalness: 0.5, roughness: 0.45 });
    const chamberM = new THREE.MeshStandardMaterial({ color: 0xa8683a, emissive: 0xa8683a, emissiveIntensity: 0.18, metalness: 0.55, roughness: 0.4 });
    const ringM = new THREE.MeshStandardMaterial({ color: 0x26282c, emissive: 0x26282c, emissiveIntensity: 0.1, metalness: 0.5, roughness: 0.5 });
    // 钟形喷管轮廓(喉部→出口,幂律张开)
    const bellGeo = (() => {
      const pts = [];
      for (let k = 0; k <= 7; k++) {
        const t = k / 7;
        pts.push(new THREE.Vector2(0.16 + (0.66 - 0.16) * Math.pow(t, 0.6), -1.15 * t));
      }
      return new THREE.LatheGeometry(pts, 20);
    })();
    const gimbalGeo = new THREE.BoxGeometry(0.3, 0.22, 0.3);
    const chamberGeo = new THREE.CylinderGeometry(0.24, 0.17, 0.5, 12);
    const pumpGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.55, 10);
    function engine(phi, ringR, center) {
      const x = Math.sin(phi) * ringR, z = Math.cos(phi) * ringR;
      const eg = new THREE.Group();
      eg.name = 'yf100k';
      eg.position.set(x, 2.15, z);
      eg.rotation.y = phi;
      stage1.add(eg);
      const gim = new THREE.Mesh(gimbalGeo, pumpM); gim.position.y = -0.05; eg.add(gim);
      const ch = new THREE.Mesh(chamberGeo, chamberM); ch.position.y = -0.38; eg.add(ch);
      const pump = new THREE.Mesh(pumpGeo, pumpM);          // 涡轮泵斜挂
      pump.position.set(0.24, -0.3, 0.1); pump.rotation.z = 0.5; eg.add(pump);
      const bell = new THREE.Mesh(bellGeo, bellM); bell.position.y = -0.65; eg.add(bell);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.67, 0.035, 6, 18), ringM);
      ring.rotation.x = Math.PI / 2; ring.position.y = -1.8; eg.add(ring);   // 出口加强环
      if (!center) {                                        // 燃气摇摆机构作动器 ×2(橙)→ 裙壁
        for (const da of [-0.55, 0.55]) {
          const a1 = new THREE.Vector3(x + Math.sin(phi + da) * 0.24, 1.95, z + Math.cos(phi + da) * 0.24);
          const a2 = radial(phi + da * 0.5).multiplyScalar(2.35).setY(2.85);
          const d = a2.clone().sub(a1);
          const act = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, d.length(), 8), orange);
          act.position.copy(a1).addScaledVector(d, 0.5);
          act.quaternion.setFromUnitVectors(UP, d.clone().normalize());
          stage1.add(act);
        }
      }
      flames.push({ pos: [x, 0.35, z], r: 0.66, type: 'sl' });
    }
    engine(0, 0, true);
    for (let i = 0; i < 6; i++) engine((i / 6) * Math.PI * 2, 1.72, false);
  }

  // ========== 4. 复用回收组件:栅格舵 ×4(折叠贴壁)+ 着陆腿 ×4(收拢贴壁) ==========
  // 铰点 Group,'发射'外的动作把目标角交给 animate 状态机平滑推进
  const finPivots = [];
  for (let i = 0; i < 4; i++) {                           // 栅格舵:一级顶部,正交方位
    const phi = (i / 4) * Math.PI * 2;
    const pivot = new THREE.Group();
    pivot.name = 'gridfin-' + i;
    pivot.position.copy(radial(phi)).multiplyScalar(R1 + 0.08).setY(33.1);
    pivot.rotation.y = phi;                               // 本地 +Z = 径向朝外
    stage1.add(pivot);
    const fin = new THREE.Group();
    pivot.add(fin);
    // 框架 2.2×1.5(悬垂 -Y),粗肋示意网格:竖肋 ×4 + 横肋 ×2
    const frameH = new THREE.BoxGeometry(2.2, 0.14, 0.16);
    const frameV = new THREE.BoxGeometry(0.14, 1.5, 0.16);
    for (const fy of [-0.25, -1.75 + 0.07]) {
      const b = new THREE.Mesh(frameH, steelDk); b.position.set(0, fy, 0.16); fin.add(b);
    }
    for (const fx of [-1.03, 1.03]) {
      const b = new THREE.Mesh(frameV, steelDk); b.position.set(fx, -1.0, 0.16); fin.add(b);
    }
    for (const fx of [-0.55, 0, 0.55]) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.36, 0.12), steelDk);
      b.position.set(fx, -1.0, 0.16); fin.add(b);
    }
    for (const fy of [-0.62, -1.0, -1.38]) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(2.06, 0.09, 0.12), steelDk);
      b.position.set(0, fy, 0.16); fin.add(b);
    }
    const hinge = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.24, 0.3), dark);
    hinge.position.set(0, 0, 0.05); pivot.add(hinge);     // 铰座(不随舵面转)
    finPivots.push(fin);                                  // 展开:fin.rotation.x → -1.75
  }
  const legPivots = [];
  for (let i = 0; i < 4; i++) {                           // 着陆腿:尾段,对角方位(避开栅格舵/铭牌)
    const phi = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const pivot = new THREE.Group();
    pivot.name = 'leg-' + i;
    pivot.position.copy(radial(phi)).multiplyScalar(R1 + 0.1).setY(8.2);
    pivot.rotation.y = phi;
    stage1.add(pivot);
    const leg = new THREE.Group();
    pivot.add(leg);
    const main = new THREE.Mesh(new THREE.BoxGeometry(0.55, 7.2, 0.4), grey);
    main.position.set(0, -3.6, 0.1); leg.add(main);       // 主撑(收拢竖直贴壁)
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 0.22, 12), dark);
    foot.position.set(0, -7.15, 0.1); leg.add(foot);      // 脚垫
    const brace = new THREE.Mesh(new THREE.BoxGeometry(0.24, 2.6, 0.24), steelDk);
    brace.position.set(0, -5.4, -0.12); brace.rotation.x = 0.1; leg.add(brace);  // 副撑(示意)
    const fair = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.6, 0.5), grey);
    fair.position.set(0, 0.4, 0.06); pivot.add(fair);     // 收放铰整流罩
    legPivots.push(leg);                                  // 展开:leg.rotation.x → -0.55
  }

  // ========== 5. 飞船段:Ø5.2 肩部 + 梦舟风格飞船 + 逃逸塔(格栅稳定翼) ==========
  CUR = upper;
  rcyl(R2, R1, 1.8, white, 47.3, 40);                     // 过渡肩锥 46.4..48.2
  rcyl(R2, R2, 5.2, white, 50.8);                         // 飞船段/服务舱裙 48.2..53.4
  rcyl(R2 + 0.012, R2 + 0.012, 0.5, grey, 48.6, 40, true);  // 分色环带
  rcyl(R2 + 0.012, R2 + 0.012, 0.5, grey, 53.0, 40, true);
  for (let i = 0; i < 4; i++) {                           // 服务舱 RCS 推力器块 ×4
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const rcs = rbox(0.5, 0.4, 0.45, dark, 0, 52.2, 0);
    rcs.position.copy(radial(a)).multiplyScalar(R2 + 0.12).setY(52.2);
    rcs.rotation.y = a;
  }
  rcyl(1.75, R2, 2.2, grey, 54.5, 40);                    // 收口锥 53.4..55.6
  rcyl(0.95, 1.75, 3.0, white, 57.1, 32);                 // 返回舱锥段 55.6..58.6
  rcyl(1.76, 1.76, 0.5, dark, 55.85, 32, true);           // 舱底防热环(分色)
  for (const s of [-0.5, 0.5]) {                          // 返回舱舷窗 ×2(+Z,夜光)
    const win = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.12, 12), glowWin);
    win.position.copy(radial(s * 0.32)).multiplyScalar(1.32).setY(57.3);
    win.quaternion.setFromUnitVectors(UP, radial(s * 0.32));
    add(win);
  }
  // 逃逸塔:适配锥 + 塔杆 + 逃逸发动机(斜喷管 ×4)+ 格栅稳定翼 ×4 + 针尖
  rcyl(0.5, 0.95, 0.8, dark, 59.0, 24);                   // 适配锥 58.6..59.4
  rcyl(0.32, 0.32, 5.2, white, 62.0, 16);                 // 塔杆 59.4..64.6
  rcyl(0.34, 0.5, 1.4, steelDk, 61.0, 16);                // 逃逸主发动机壳段
  for (let i = 0; i < 4; i++) {                           // 斜置喷管 ×4
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const noz = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.2, 0.5, 10), dark);
    noz.position.copy(radial(a)).multiplyScalar(0.5).setY(60.2);
    noz.rotation.set(Math.cos(a) * 0.5, 0, -Math.sin(a) * 0.5);
    add(noz);
  }
  for (let i = 0; i < 4; i++) {                           // 格栅稳定翼 ×4(塔底,小框+肋)
    const a = (i / 4) * Math.PI * 2;
    const wing = new THREE.Group();
    wing.position.copy(radial(a)).multiplyScalar(0.34).setY(59.8);
    wing.rotation.y = a;
    add(wing);
    const fr = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.08), steelDk);
    fr.position.z = 0.4; wing.add(fr);
    for (const wx of [-0.18, 0, 0.18]) {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.42, 0.1), dark);
      rib.position.set(wx, 0, 0.4); wing.add(rib);
    }
  }
  rcyl(0.02, 0.34, 1.0, flagRed, 65.1, 12);               // 塔尖锥
  rcyl(0.015, 0.015, 1.4, steelDk, 66.3, 6);              // 针尖杆(到 67.0)
  CUR = stage1;

  // ========== 6. 喷焰(自发光锥体,发射态显隐)+ 发射支座(留在原地) ==========
  const flameGrp = new THREE.Group();
  flameGrp.name = 'flame';
  flameGrp.visible = false;
  flameGrp.scale.set(1, 0.001, 1);   // 待机收起:隐藏网格也计入 Box3,不能戳破地面影响落位
  stage1.add(flameGrp);
  {
    const coreM = new THREE.MeshBasicMaterial({ color: 0xffe8b0, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
    const plumeM = new THREE.MeshBasicMaterial({ color: 0xff8a30, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    for (const f of flames) {                             // 每喷管亮芯
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.14, 4.2, 10, 1, true), coreM);
      c.position.set(f.pos[0], f.pos[1] - 2.1, f.pos[2]);
      flameGrp.add(c);
    }
    const plume = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 3.0, 16, 20, 1, true), plumeM);
    plume.name = 'plume';
    plume.position.y = -7.6;
    flameGrp.add(plume);
  }
  for (let i = 0; i < 4; i++) {                           // 发射支座 ×4(根组,不随箭升空)
    const a = (i / 4) * Math.PI * 2;
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.05, 0.9), steelDk);
    m.position.copy(radial(a)).multiplyScalar(2.15).setY(0.52);
    m.rotation.y = a;
    g.add(m);
  }

  // ---------------------------------------------------------------- POI 锚点(卡片见 veh-rocket-02.info.json)
  for (const [n, x, y, z] of [
    ['engines', 0, 1.5, 0],          // 7×YF-100K 动力段
    ['gridfin', 0, 32.4, 2.9],       // 栅格舵(+Z 那片)
    ['legs', 2.0, 4.5, 2.0],         // 着陆腿(对角方位)
    ['fairing', 0, 57.5, 1.9],       // 飞船/逃逸塔
    ['body', 0, 18, 2.6],            // 五米级芯(推进剂)
  ]) {
    const a = new THREE.Object3D();
    a.name = 'poi_' + n;
    a.position.set(x, y, z);
    g.add(a);
  }

  // ---------------------------------------------------------------- 动作 + 状态机
  // '发射':点火 1.8 s(喷焰长成+抖动)→ 匀加速上升 → 900 m 关机断焰 →
  // 1600 m 出视野后瞬移复位(支持 meta.schedule 每日例行发射)。
  // 栅格舵/着陆腿:目标角切换,animate 平滑收放(回收演示)。
  const st = { phase: 'idle', tl: 0, v: 0, finT: 0, fin: 0, legT: 0, leg: 0 };
  g.userData.actions = {
    '发射': () => { if (st.phase === 'idle') { st.phase = 'ignite'; st.tl = 0; st.v = 0; } },
    '栅格舵展开/收拢': () => { st.finT = st.finT > 0.5 ? 0 : 1; },
    '着陆腿展开/收拢': () => { st.legT = st.legT > 0.5 ? 0 : 1; },
  };
  const plume = flameGrp.getObjectByName('plume');
  g.userData.animate = (t, dt) => {
    dt = Math.min(dt, 0.1);
    // 收放平滑推进(一阶趋近)
    st.fin += (st.finT - st.fin) * Math.min(dt * 2.0, 1);
    st.leg += (st.legT - st.leg) * Math.min(dt * 1.5, 1);
    for (const f of finPivots) f.rotation.x = -1.75 * st.fin;
    for (const l of legPivots) l.rotation.x = -0.55 * st.leg;
    // 发射时间线
    if (st.phase === 'idle') return;
    st.tl += dt;
    const flick = 0.9 + 0.1 * Math.sin(t * 37) + 0.06 * Math.sin(t * 61);
    if (st.phase === 'ignite') {
      flameGrp.visible = true;
      const grow = Math.min(st.tl / 1.5, 1);
      flameGrp.scale.set(1, grow * flick, 1);
      rocket.position.x = (Math.sin(t * 53) * 0.04) * grow;   // 点火抖动
      rocket.position.z = (Math.sin(t * 47 + 1) * 0.04) * grow;
      if (st.tl > 1.8) st.phase = 'ascent';
    } else if (st.phase === 'ascent') {
      st.v += 12 * dt;                                        // 视觉加速度
      rocket.position.y += st.v * dt;
      const damp = Math.max(0, 1 - rocket.position.y / 120);  // 抖动随高度衰减
      rocket.position.x = Math.sin(t * 53) * 0.05 * damp;
      rocket.position.z = Math.sin(t * 47 + 1) * 0.05 * damp;
      flameGrp.scale.set(1, flick * (1 + Math.min(rocket.position.y / 300, 0.6)), 1);
      if (plume) plume.material.opacity = 0.32 * flick;
      if (rocket.position.y > 900) { flameGrp.visible = false; st.phase = 'coast'; }
    } else if (st.phase === 'coast') {
      rocket.position.y += st.v * dt;                         // 关机滑行出视野
      if (rocket.position.y > 1600) {
        rocket.position.set(0, 0, 0);
        flameGrp.scale.set(1, 0.001, 1);
        st.phase = 'idle'; st.v = 0;
      }
    }
  };

  // ---------------------------------------------------------------- 引擎接口
  g.userData.rocket = rocket;
  g.userData.stage1 = stage1;        // 分离动画契约:两级子组 + 上面级喷焰
  g.userData.upper = upper;
  g.userData.flame2 = flame2;
  g.userData.nightMats = nightMats;
  g.userData.lights = [{ color: 0xffd9a0, pos: [0, 57.3, 2.2], range: 22 }];  // 舷窗外侧
  g.userData.beams = [];
  g.userData.flames = flames;
  return g;
}
