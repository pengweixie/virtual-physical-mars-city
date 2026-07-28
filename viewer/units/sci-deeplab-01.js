// sci-deeplab-01 — 深地暗物质实验室（100t 液氙 TPC）室内场景
// 几何依据：双相液氙 TPC 探测器几何，按 100t 目标 ×3 放大，见 GEOMETRY_REF.md
// 缩放策略（两档）：低温罐及以内严格 ×3.0（与实测吻合）；水罐及以外按施工单目标值。
// 规则：1 单位 = 1 米；不 import three；材质仅 MeshLambert/MeshStandard；室内灯常亮；
//       ≤8 万面；粗构件优先；光探测器阵列用 InstancedMesh。
// 坐标：原点在洞室地面中心，+Y 上，通道口朝 +Z。Geant4 竖直 Z → three 的 +Y。

export const meta = {
  id: 'sci-deeplab-01',
  name: '深地暗物质实验室（100t 液氙）',
  kind: 'interior',
  size_m: 32,          // 实测包围盒最大边（洞室 32×30×32；1 单位 = 1 米）
  size_axis: 'width',
};

export function build(THREE) {
  const group = new THREE.Group();
  group.name = meta.id;
  group.userData.lights = [];      // 常亮工业灯（不接火星时）
  group.userData.nightMats = [];   // 控制间窗/屏幕发光材质（也常亮，仅收集）
  group.userData.pois = [];        // POI 知识卡锚点

  // ---- 材质库（仅 MeshLambert/MeshStandard）----
  const M = {
    rock:      new THREE.MeshStandardMaterial({ color: 0x35353b, roughness: 0.97, metalness: 0.0, side: THREE.BackSide }),
    rockFloor: new THREE.MeshStandardMaterial({ color: 0x2e2e33, roughness: 0.98 }),
    bolt:      new THREE.MeshStandardMaterial({ color: 0x6a6d72, roughness: 0.6, metalness: 0.5 }),
    concrete:  new THREE.MeshStandardMaterial({ color: 0x8c8b86, roughness: 0.92 }),
    epoxy:     new THREE.MeshStandardMaterial({ color: 0x3c454d, roughness: 0.5, metalness: 0.1 }),
    ss:        new THREE.MeshStandardMaterial({ color: 0xc2c6cb, roughness: 0.33, metalness: 0.75 }),
    ssMatte:   new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.55, metalness: 0.5 }),
    // 罐体"透视"半透版：让内构与中微子事件可见（否则被不透明罐挡死）
    ssGhost:      new THREE.MeshStandardMaterial({ color: 0xc2c6cb, roughness: 0.33, metalness: 0.75, transparent: true, opacity: 0.30, side: THREE.DoubleSide }),
    ssMatteGhost: new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.55, metalness: 0.5, transparent: true, opacity: 0.26, side: THREE.DoubleSide }),
    copper:    new THREE.MeshStandardMaterial({ color: 0xb87333, roughness: 0.4, metalness: 0.8 }),
    ptfe:      new THREE.MeshStandardMaterial({ color: 0xf2f4f5, roughness: 0.85, metalness: 0.0 }),
    ptfeGhost: new THREE.MeshStandardMaterial({ color: 0xf2f4f5, roughness: 0.85, metalness: 0.0, transparent: true, opacity: 0.38, side: THREE.DoubleSide }),
    water:     new THREE.MeshStandardMaterial({ color: 0x2f78a0, roughness: 0.1, metalness: 0.0, transparent: true, opacity: 0.16 }),
    gdls:      new THREE.MeshStandardMaterial({ color: 0xcfe0a8, roughness: 0.2, transparent: true, opacity: 0.18 }),
    lxe:       new THREE.MeshStandardMaterial({ color: 0xa9e6ef, roughness: 0.05, metalness: 0.0, transparent: true, opacity: 0.30, emissive: 0x113a44, emissiveIntensity: 0.35 }),
    gxe:       new THREE.MeshStandardMaterial({ color: 0xcfeef4, roughness: 0.05, transparent: true, opacity: 0.12 }),
    glass:     new THREE.MeshStandardMaterial({ color: 0x9fc4d6, roughness: 0.08, metalness: 0.0, transparent: true, opacity: 0.22, side: THREE.DoubleSide }),
    pmtBody:   new THREE.MeshStandardMaterial({ color: 0x1b2230, roughness: 0.4, metalness: 0.5 }),
    pmtWin:    new THREE.MeshStandardMaterial({ color: 0x223a45, roughness: 0.2, metalness: 0.3, emissive: 0x0a2a33, emissiveIntensity: 0.5, side: THREE.DoubleSide }),
    grating:   new THREE.MeshStandardMaterial({ color: 0x676c72, roughness: 0.6, metalness: 0.6, side: THREE.DoubleSide }),
    railing:   new THREE.MeshStandardMaterial({ color: 0xd8c341, roughness: 0.5, metalness: 0.5 }), // 安全黄
    cabinet:   new THREE.MeshStandardMaterial({ color: 0xe8eaec, roughness: 0.5, metalness: 0.1 }),
    pipe:      new THREE.MeshStandardMaterial({ color: 0xbfc4c8, roughness: 0.4, metalness: 0.7 }),
    veto:      new THREE.MeshStandardMaterial({ color: 0x2f3a4a, roughness: 0.7, metalness: 0.2 }),
    lampHous:  new THREE.MeshStandardMaterial({ color: 0x1c1f24, roughness: 0.5, metalness: 0.6 }),
    lampGlow:  new THREE.MeshStandardMaterial({ color: 0xeaf2ff, emissive: 0xdfeaff, emissiveIntensity: 1.4 }),
    screen:    new THREE.MeshStandardMaterial({ color: 0x0a1c26, emissive: 0x1c86a8, emissiveIntensity: 0.9 }),
    winGlow:   new THREE.MeshStandardMaterial({ color: 0xbfe0ee, emissive: 0x6fb6cf, emissiveIntensity: 0.7, transparent: true, opacity: 0.5, side: THREE.DoubleSide }),
  };

  const dummy = new THREE.Object3D();
  const add = (geo, mat, x = 0, y = 0, z = 0, name) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (name) m.name = name;
    group.add(m);
    return m;
  };
  const poi = (id, title, x, y, z, lines) => {
    const a = new THREE.Object3D();
    a.position.set(x, y, z);
    a.name = 'poi_' + id;
    a.userData.poi = { id, title, lines };
    group.add(a);
    group.userData.pois.push({ id, title, position: [x, y, z], lines });
    return a;
  };

  // ======================================================================
  // 1) 洞室围合：拱顶石室（~30 m 跨 × 24 m 高）+ 岩地面 + 锚杆网
  //    做法：沿 Z 轴的大岩石管（半径 15，长 32，BackSide）当拱顶+侧壁，
  //          平地板盖住下半，−Z 端封岩壁，+Z 端留通道口。
  // ======================================================================
  const CAV_R = 15, CAV_LEN = 32, CAV_CY = 9; // 拱心高 9 → 拱顶 24
  {
    const vault = new THREE.Mesh(
      new THREE.CylinderGeometry(CAV_R, CAV_R, CAV_LEN, 40, 1, true), M.rock);
    vault.rotation.x = Math.PI / 2;       // 轴转到 Z
    vault.position.set(0, CAV_CY, 0);
    vault.name = 'cavern_shell';
    group.add(vault);

    // 岩地面
    add(new THREE.CylinderGeometry(CAV_R + 1, CAV_R + 1, 0.4, 8), M.rockFloor, 0, -0.2, 0, 'rock_floor');

    // −Z 端岩壁封头（+Z 留口）
    const endCap = add(new THREE.CircleGeometry(CAV_R, 40), M.rock, 0, CAV_CY, -CAV_LEN / 2);
    endCap.rotation.y = Math.PI; endCap.name = 'cavern_endwall';

    // 锚杆网：拱顶内表面上排布短杆（InstancedMesh）
    const boltGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.7, 6);
    const NB_A = 22, NB_Z = 9, NB = NB_A * NB_Z;
    const bolts = new THREE.InstancedMesh(boltGeo, M.bolt, NB);
    let bi = 0;
    for (let iz = 0; iz < NB_Z; iz++) {
      const z = -CAV_LEN / 2 + 2 + iz * ((CAV_LEN - 4) / (NB_Z - 1));
      for (let ia = 0; ia < NB_A; ia++) {
        // 只在上半拱（约 25°~155°）布锚杆
        const ang = Math.PI * (0.14 + 0.72 * (ia / (NB_A - 1)));
        const r = CAV_R - 0.35;
        const x = Math.cos(ang) * r, y = CAV_CY + Math.sin(ang) * r;
        dummy.position.set(x, y, z);
        dummy.lookAt(0, CAV_CY, z);        // 指向拱心 → 杆垂直插入岩面
        dummy.rotateX(Math.PI / 2);
        dummy.updateMatrix();
        bolts.setMatrixAt(bi++, dummy.matrix);
      }
    }
    bolts.name = 'rock_bolts';
    group.add(bolts);
  }

  // ======================================================================
  // 2) 混凝土实验厅（22 m 跨 × 20 m 高，环氧地面）— 环墙（顶开口）
  // ======================================================================
  const HALL_R = 11, HALL_H = 22;   // 施工单：22 m 高
  {
    add(new THREE.CylinderGeometry(HALL_R, HALL_R, HALL_H, 48, 1, true), M.concrete, 0, HALL_H / 2, 0, 'concrete_hall');
    // 环氧地面
    add(new THREE.CylinderGeometry(HALL_R - 0.05, HALL_R - 0.05, 0.06, 48), M.epoxy, 0, 0.05, 0, 'epoxy_floor');
  }

  // ======================================================================
  // 3) 外水屏蔽罐：立式不锈钢 内⌀14 m × 15 m 高，环向加强筋 + 顶盖法兰
  //    （水罐及以外按施工单目标值）
  // ======================================================================
  const TANK_R = 7, TANK_H = 15, TANK_Y0 = 0.15;
  const TANK_CY = TANK_Y0 + TANK_H / 2;
  {
    // 罐壁（薄壳，双面，半透——让内构/事件可见）
    const wallMat = M.ss.clone(); wallMat.side = THREE.DoubleSide; wallMat.transparent = true; wallMat.opacity = 0.14;
    add(new THREE.CylinderGeometry(TANK_R, TANK_R, TANK_H, 56, 1, true), wallMat, 0, TANK_CY, 0, 'water_tank_wall');
    // 罐底
    add(new THREE.CylinderGeometry(TANK_R, TANK_R, 0.1, 56), M.ss, 0, TANK_Y0, 0, 'water_tank_bottom');
    // 顶盖 + 顶盖法兰
    add(new THREE.CylinderGeometry(TANK_R, TANK_R, 0.12, 56), M.ss, 0, TANK_Y0 + TANK_H, 0, 'water_tank_lid');
    add(new THREE.CylinderGeometry(3.0, 3.0, 0.5, 40), M.ssMatte, 0, TANK_Y0 + TANK_H + 0.3, 0, 'water_tank_flange');
    // 内部超纯水（略低于顶，留气隙）
    add(new THREE.CylinderGeometry(TANK_R - 0.1, TANK_R - 0.1, TANK_H - 1.2, 48), M.water, 0, TANK_Y0 + (TANK_H - 1.2) / 2, 0, 'shield_water');

    // 环向加强筋（InstancedMesh 圆环）
    const ringGeo = new THREE.TorusGeometry(TANK_R + 0.08, 0.09, 6, 56);
    const NR = 6;
    const rings = new THREE.InstancedMesh(ringGeo, M.ssMatte, NR);
    for (let i = 0; i < NR; i++) {
      dummy.position.set(0, TANK_Y0 + 1.5 + i * ((TANK_H - 3) / (NR - 1)), 0);
      dummy.rotation.set(Math.PI / 2, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      rings.setMatrixAt(i, dummy.matrix);
    }
    rings.name = 'tank_stiffeners';
    group.add(rings);

    poi('water', '水屏蔽罐', 0, TANK_Y0 + TANK_H + 1.0, TANK_R, [
      '⌀14 × 15 m 超纯水，压低外部 γ / 中子本底',
      '兼作缪子切伦科夫 veto（水切伦科夫）',
    ]);
  }

  // ======================================================================
  // 4) Gd-液闪反符合层（LsVeto 示意）：水罐内一层薄壁容器，包住低温罐
  // ======================================================================
  const CRYO_CY = TANK_Y0 + 6.6;   // 低温罐中心高度（悬于水中）
  {
    const gdMat = M.gdls.clone(); gdMat.side = THREE.DoubleSide;
    add(new THREE.CylinderGeometry(3.4, 3.4, 8.2, 40, 1, true), gdMat, 0, CRYO_CY, 0, 'gd_veto_wall');
    poi('muveto', '缪子否决 / Gd 反符合', 3.4, CRYO_CY + 3, 0, [
      'Gd-液闪 + 水切伦科夫，否决宇宙线 μ 本底',
      '包住低温罐一层薄壁反符合容器',
    ]);
  }

  // ======================================================================
  // 5) 低温外真空罐：⌀5.15 × 7.15 m + 顶穹 1.1，法兰⌀2.82，金属哑光（严格 ×3）
  // ======================================================================
  const OUT_R = 2.575, OUT_H = 7.15;
  const OUT_CY = CRYO_CY;
  {
    add(new THREE.CylinderGeometry(OUT_R, OUT_R, OUT_H, 48, 1, true), M.ssMatteGhost, 0, OUT_CY, 0, 'cryo_outer_wall');
    // 顶穹：上半球，赤道(rim)贴罐壁顶，scale.y 定穹高 1.1 m
    const dome = add(new THREE.SphereGeometry(OUT_R, 40, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.ssMatteGhost, 0, OUT_CY + OUT_H / 2, 0, 'cryo_outer_dome');
    dome.scale.y = 1.1 / OUT_R;
    // 底封头：下半球，赤道贴罐壁底，浅碟 0.6 m
    const obot = add(new THREE.SphereGeometry(OUT_R, 40, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M.ssMatteGhost, 0, OUT_CY - OUT_H / 2, 0, 'cryo_outer_bot');
    obot.scale.y = 0.6 / OUT_R;
    // 顶法兰 ⌀2.82（实体，作对比）
    add(new THREE.CylinderGeometry(1.41, 1.41, 0.5, 40), M.ss, 0, OUT_CY + OUT_H / 2 + 1.0, 0, 'cryo_outer_flange');

    poi('cryo', '低温系统', OUT_R, OUT_CY + 2, 0, [
      '双层真空罐 + 循环纯化，液氙 ~178 K',
      '外罐 ⌀5.15 × 7.15 m（顶穹 1.1 m），内套内罐',
    ]);
  }

  // ======================================================================
  // 6) 低温内真空罐：⌀4.05 × 5.3 m + 穹 0.85（套在外罐内，双层，严格 ×3）
  // ======================================================================
  const IN_R = 2.025, IN_H = 5.3;
  const IN_CY = CRYO_CY - 0.2;
  {
    add(new THREE.CylinderGeometry(IN_R, IN_R, IN_H, 44, 1, true), M.ssGhost, 0, IN_CY, 0, 'cryo_inner_wall');
    const d = add(new THREE.SphereGeometry(IN_R, 36, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.ssGhost, 0, IN_CY + IN_H / 2, 0, 'cryo_inner_dome');
    d.scale.y = 0.85 / IN_R;
    const ibot = add(new THREE.SphereGeometry(IN_R, 36, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M.ssGhost, 0, IN_CY - IN_H / 2, 0, 'cryo_inner_bot');
    ibot.scale.y = 0.5 / IN_R;
    // 内罐法兰 ⌀1.5×3=4.5（实体）
    add(new THREE.CylinderGeometry(2.25, 2.25, 0.35, 44), M.ssMatte, 0, IN_CY + IN_H / 2 + 0.2, 0, 'cryo_inner_flange');
  }

  // ======================================================================
  // 7) TPC 场笼：⌀3.55 × 漂移 3.55，白 PTFE 反射筒（24 边）+ 58→可视 40 铜环叠环
  //    + 100 t 液氙靶（气液界面在顶）+ 顶/底光探测器阵列 + 三层栅网
  // ======================================================================
  const TPC_R = 1.775, DRIFT = 3.55;
  const TPC_CY = IN_CY - 0.15;         // 场笼中心
  const TPC_BOT = TPC_CY - DRIFT / 2;  // 阴极面
  const TPC_TOP = TPC_CY + DRIFT / 2;  // 门极/液面
  {
    // PTFE 反射筒（24 边棱柱 → radialSegments=24 开口圆柱近似；半透以露出内部事件）
    add(new THREE.CylinderGeometry(TPC_R, TPC_R, DRIFT, 24, 1, true), M.ptfeGhost, 0, TPC_CY, 0, 'ptfe_reflector');

    // 液氙靶（充满场笼，顶部留薄气氙层）
    const GXE_H = 0.18; // 气氙层（视觉薄层，与动画一致）
    add(new THREE.CylinderGeometry(TPC_R - 0.03, TPC_R - 0.03, DRIFT - GXE_H, 40), M.lxe, 0, TPC_CY - GXE_H / 2, 0, 'lxe_target');
    add(new THREE.CylinderGeometry(TPC_R - 0.03, TPC_R - 0.03, GXE_H, 40), M.gxe, 0, TPC_TOP - GXE_H / 2, 0, 'gxe_layer');

    // 铜场整形环叠环（真机 58；可视 40，InstancedMesh 圆环）
    const scrGeo = new THREE.TorusGeometry(TPC_R + 0.03, 0.03, 6, 32);
    const NR = 40;
    const shp = new THREE.InstancedMesh(scrGeo, M.copper, NR);
    for (let i = 0; i < NR; i++) {
      const y = TPC_BOT + 0.15 + i * ((DRIFT - 0.3) / (NR - 1));
      dummy.position.set(0, y, 0);
      dummy.rotation.set(Math.PI / 2, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      shp.setMatrixAt(i, dummy.matrix);
    }
    shp.name = 'shaping_rings';
    group.add(shp);

    // 铜顶/底端板
    add(new THREE.CylinderGeometry(TPC_R + 0.1, TPC_R + 0.1, 0.06, 40), M.copper, 0, TPC_BOT - 0.05, 0, 'cu_plate_bottom');
    add(new THREE.CylinderGeometry(TPC_R + 0.1, TPC_R + 0.1, 0.06, 40), M.copper, 0, TPC_TOP + 0.05, 0, 'cu_plate_top');

    // 三层栅网（阴极 / 门极 / 阳极）薄盘示意
    const meshMat = M.ss.clone(); meshMat.transparent = true; meshMat.opacity = 0.35; meshMat.side = THREE.DoubleSide;
    add(new THREE.CylinderGeometry(TPC_R - 0.02, TPC_R - 0.02, 0.01, 40), meshMat, 0, TPC_BOT + 0.02, 0, 'cathode_mesh');
    add(new THREE.CylinderGeometry(TPC_R - 0.02, TPC_R - 0.02, 0.01, 40), meshMat, 0, TPC_TOP - GXE_H, 0, 'gate_mesh');
    add(new THREE.CylinderGeometry(TPC_R - 0.02, TPC_R - 0.02, 0.01, 40), meshMat, 0, TPC_TOP - 0.02, 0, 'anode_mesh');

    // 高压馈入杆（阴极 → 罐外）
    add(new THREE.CylinderGeometry(0.06, 0.06, 3.2, 12), M.pipe, TPC_R + 0.3, TPC_BOT - 1.4, 0, 'hv_feed');

    // 顶/底光探测器阵列：线性 ×3 → 面积 ×9 → 顶 1521 / 底 1791 只 3 吋密排。
    // 数目大，每只只画一枚扁平窗盘（CircleGeometry，8 面），控面数；铜端板当阵列背板。
    const buildPMTArray = (count, y, faceUp, tag) => {
      const winGeo = new THREE.CircleGeometry(0.032, 8);        // 3 吋管光电阴极窗 ⌀0.064 m（casing ⌀0.076；底阵列间距 0.0743，窗/间距=0.86 不重叠）
      const win = new THREE.InstancedMesh(winGeo, M.pmtWin, count);
      const pts = hexPack(count, TPC_R - 0.12);                 // 六方密排（与 sim 一致）
      const rot = faceUp ? -Math.PI / 2 : Math.PI / 2;          // 窗面朝液氙
      for (let i = 0; i < count; i++) {
        const p = pts[i];
        dummy.position.set(p.x, y, p.z);
        dummy.rotation.set(rot, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix();
        win.setMatrixAt(i, dummy.matrix);
      }
      win.name = 'pmt_' + tag;
      group.add(win);
    };
    buildPMTArray(1791, TPC_BOT - 0.09, true, 'bottom');   // 底阵列窗面朝上
    buildPMTArray(1521, TPC_TOP + 0.09, false, 'top');     // 顶阵列窗面朝下

    poi('tpc', 'TPC 双相时间投影室', TPC_R, TPC_CY, 0, [
      '⌀3.55 m，漂移 3.55 m，双相（气液）TPC',
      'S1 直接闪烁 + S2 电离在气相放大读出',
      '铜场整形环叠环建均匀漂移场',
    ]);
    poi('lxe', '液氙靶', 0, TPC_CY, TPC_R, [
      '100 t 活性液氙（总装量 ~130 t），密度 2.86 t/m³',
      '气液界面在场笼顶部',
    ]);
    poi('pmt', '光探测器阵列', -TPC_R, TPC_TOP, 0, [
      '顶 1521 + 底 1791 只 3 吋光电管（面积 ×9 密排）',
      '另有顶/底各 ~650 只 skin veto（1 吋）',
      'S1 / S2 光子读出',
    ]);

    // ===== 事件动画：中微子 CEνNS 事件（100t 设计，⌀3.55 场笼 + 1521/1791 PMT）=====
    // host 每帧调用 group.userData.update(dt秒)，触发用 group.userData.playNeutrinoEvent()。
    // 时间线 5 s：中微子入射 → S1 闪烁(底 PMT 亮) → 电子上漂 → S2 电致发光(顶 PMT 亮) → 淡出。
    {
      const evGrp = new THREE.Group(); evGrp.name = 'neutrino_event'; evGrp.visible = false;
      group.add(evGrp);
      const Vx = 0.5, Vz = -0.35, Vy = TPC_CY + 0.2;         // 顶点（液氙内，略偏心）
      const vertex = new THREE.Vector3(Vx, Vy, Vz);
      const entry = new THREE.Vector3(Vx, Vy + 8, Vz + 8);   // 从 +Z 上后方竖井方向入射
      const s2Pos = new THREE.Vector3(Vx, TPC_TOP, Vz);      // S2 在顶点正上方气隙
      const UP = new THREE.Vector3(0, 1, 0);

      const nu = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1, 6),
        new THREE.MeshStandardMaterial({ color: 0xffd23f, emissive: 0xffd23f, emissiveIntensity: 1.3, transparent: true, opacity: 0.9 }));
      evGrp.add(nu);

      const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12),
        new THREE.MeshStandardMaterial({ color: 0xdffaff, emissive: 0x8fe0ec, emissiveIntensity: 2.2, transparent: true, opacity: 0.9 }));
      s1.position.copy(vertex); evGrp.add(s1);
      const s1Light = new THREE.PointLight(0x8fe0ec, 0, 30, 2); s1Light.position.copy(vertex); evGrp.add(s1Light);
      const botGlow = new THREE.PointLight(0xfff0b0, 0, 18, 2); botGlow.position.set(Vx, TPC_BOT - 0.2, Vz); evGrp.add(botGlow);

      const NE = 12;
      const eCloud = new THREE.InstancedMesh(new THREE.SphereGeometry(0.045, 6, 5),
        new THREE.MeshStandardMaterial({ color: 0xffa53c, emissive: 0xff7a1c, emissiveIntensity: 1.6 }), NE);
      evGrp.add(eCloud);

      const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12),
        new THREE.MeshStandardMaterial({ color: 0xfff0c8, emissive: 0xffcf6a, emissiveIntensity: 2.4, transparent: true, opacity: 0.9 }));
      s2.position.copy(s2Pos); evGrp.add(s2);
      const s2Light = new THREE.PointLight(0xffcf6a, 0, 32, 2); s2Light.position.copy(s2Pos); evGrp.add(s2Light);
      const topGlow = new THREE.PointLight(0xffd27a, 0, 18, 2); topGlow.position.set(Vx, TPC_TOP + 0.3, Vz); evGrp.add(topGlow);

      const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
      const gauss = (x, mu, s) => Math.exp(-0.5 * Math.pow((x - mu) / s, 2));
      const T_IN = 1.0, T_DRIFT0 = 1.15, T_S2 = 3.5, T_END = 5.0;
      let evT = -1;                                          // <0 = 空闲

      group.userData.neutrinoEventDuration = T_END;
      group.userData.playNeutrinoEvent = function () { evT = 0; evGrp.visible = true; };
      group.userData.update = function (dt) {
        if (evT < 0) return;
        evT += dt;
        // 中微子入射径迹（细长圆柱，穿透外层直达顶点）
        const f = clamp(evT / T_IN, 0, 1);
        const tip = entry.clone().lerp(vertex, f);
        const len = Math.max(entry.distanceTo(tip), 1e-3);
        nu.position.copy(entry).add(tip).multiplyScalar(0.5);
        nu.scale.set(1, len, 1);
        nu.quaternion.setFromUnitVectors(UP, tip.clone().sub(entry).normalize());
        nu.visible = evT < T_S2;
        nu.material.opacity = evT < T_IN ? 0.9 : Math.max(0, 0.9 * (1 - (evT - T_IN) / 0.8));
        // S1 闪烁 + 底 PMT 辉光
        const p1 = gauss(evT, T_IN, 0.22);
        s1.visible = p1 > 0.03; s1.scale.setScalar(0.9 + p1 * 2.4); s1.material.opacity = 0.9 * p1;
        s1Light.intensity = 110 * p1; botGlow.intensity = 45 * p1;   // 事件光脉冲照亮全洞（decay=2 物理衰减）
        // 电子上漂
        const df = clamp((evT - T_DRIFT0) / (T_S2 - T_DRIFT0), 0, 1);
        eCloud.visible = df > 0.001 && df < 0.999;
        if (eCloud.visible) {
          const zc = Vy + (TPC_TOP - Vy) * df;
          for (let i = 0; i < NE; i++) {
            const a = i * 1.9;
            dummy.position.set(Vx + 0.05 * Math.cos(a), zc - 0.14 + 0.28 * (i / NE), Vz + 0.05 * Math.sin(a));
            dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix();
            eCloud.setMatrixAt(i, dummy.matrix);
          }
          eCloud.instanceMatrix.needsUpdate = true;
        }
        // S2 电致发光 + 顶 PMT 辉光
        const p2 = gauss(evT, T_S2, 0.28);
        s2.visible = p2 > 0.03; s2.scale.setScalar(0.9 + p2 * 3.0); s2.material.opacity = 0.9 * p2;
        s2Light.intensity = 140 * p2; topGlow.intensity = 55 * p2;
        if (evT > T_END) { evT = -1; evGrp.visible = false; }  // 结束复位
      };
    }
  }

  // ======================================================================
  // 8) 外围：环罐检修平台（3 层格栅 + 栏杆 + 螺旋梯）
  // ======================================================================
  {
    const levels = [4.5, 8.5, 12.5];
    const pIn = TANK_R + 0.15, pOut = TANK_R + 1.8;
    levels.forEach((y, k) => {
      // 格栅圈（环面盘）
      const ring = add(new THREE.RingGeometry(pIn, pOut, 56, 1), M.grating, 0, y, 0, 'platform_' + k);
      ring.rotation.x = -Math.PI / 2;
      // 栏杆（外圈细环 + 立柱 InstancedMesh）
      const rail = add(new THREE.TorusGeometry(pOut, 0.03, 6, 56), M.railing, 0, y + 1.05, 0, 'rail_' + k);
      rail.rotation.x = Math.PI / 2;
      const postGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.05, 6);
      const NP = 28;
      const posts = new THREE.InstancedMesh(postGeo, M.railing, NP);
      for (let i = 0; i < NP; i++) {
        const a = (i / NP) * Math.PI * 2;
        dummy.position.set(Math.cos(a) * pOut, y + 0.52, Math.sin(a) * pOut);
        dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix();
        posts.setMatrixAt(i, dummy.matrix);
      }
      posts.name = 'rail_posts_' + k;
      group.add(posts);
    });

    // 螺旋梯：绕罐一侧盘旋的踏步（InstancedMesh）
    const stepGeo = new THREE.BoxGeometry(1.4, 0.06, 0.5);
    const NS = 60;
    const steps = new THREE.InstancedMesh(stepGeo, M.grating, NS);
    const stairR = pOut + 0.9;
    for (let i = 0; i < NS; i++) {
      const a = -1.2 + i * 0.32;                 // 盘旋角
      const y = 0.4 + i * (12.5 / NS);
      const x = Math.cos(a) * stairR, z = Math.sin(a) * stairR;
      dummy.position.set(x, y, z);
      dummy.rotation.set(0, -a, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix();
      steps.setMatrixAt(i, dummy.matrix);
    }
    steps.name = 'spiral_stair';
    group.add(steps);
  }

  // ======================================================================
  // 9) 低温 / 纯化系统：白色机柜橇 + 立式储氙罐×2（⌀2 m）+ 粗管路到罐顶
  // ======================================================================
  {
    const bx = -9.5, bz = 3.5;
    // 机柜橇（一排白柜）
    for (let i = 0; i < 4; i++) {
      add(new THREE.BoxGeometry(1.1, 2.2, 1.0), M.cabinet, bx + i * 1.25, 1.1, bz, 'cryo_cabinet_' + i);
    }
    // 立式储氙罐 ×2（⌀2 m）
    add(new THREE.CylinderGeometry(1.0, 1.0, 4.0, 32), M.ss, bx - 2.2, 2.0, bz - 1.5, 'xe_storage_1');
    add(new THREE.SphereGeometry(1.0, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.ss, bx - 2.2, 4.0, bz - 1.5, 'xe_storage_1_cap');
    add(new THREE.CylinderGeometry(1.0, 1.0, 4.0, 32), M.ss, bx - 4.2, 2.0, bz - 1.5, 'xe_storage_2');
    add(new THREE.SphereGeometry(1.0, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.ss, bx - 4.2, 4.0, bz - 1.5, 'xe_storage_2_cap');
    // 粗管路（≥20 cm）：机柜 → 罐顶低温头（两段折线用直管近似）
    const p1 = add(new THREE.CylinderGeometry(0.13, 0.13, 8.0, 16), M.pipe, bx - 1.0, 4.0, bz - 0.5, 'cryo_pipe_h');
    p1.rotation.z = Math.PI / 2 - 0.2;
    add(new THREE.CylinderGeometry(0.13, 0.13, 5.0, 16), M.pipe, -3.5, TANK_Y0 + TANK_H - 1.5, bz - 0.5, 'cryo_pipe_up');
  }

  // ======================================================================
  // 10) 缪子 veto：洞顶 / 侧壁贴大塑闪板数块
  // ======================================================================
  {
    const panelGeo = new THREE.BoxGeometry(6, 0.25, 4);
    const spots = [
      [0, CAV_CY + CAV_R - 0.8, -6, 0, 0, 0],
      [0, CAV_CY + CAV_R - 0.8, 6, 0, 0, 0],
      [-CAV_R + 1.5, 10, 0, 0, 0, Math.PI / 2 - 0.3],
      [CAV_R - 1.5, 10, 0, 0, 0, -(Math.PI / 2 - 0.3)],
    ];
    spots.forEach((s, i) => {
      const m = add(panelGeo, M.veto, s[0], s[1], s[2], 'muon_veto_' + i);
      m.rotation.set(s[3], s[4], s[5]);
    });
  }

  // ======================================================================
  // 11) 控制间：洞室一角玻璃隔间（发光窗）+ 机柜排 + 屏幕墙（nightMats，常亮）
  // ======================================================================
  {
    const cx = 8.5, cz = -8.5;
    const booth = new THREE.Group();
    booth.position.set(cx, 0, cz);
    booth.rotation.y = Math.PI * 0.75;
    // 地台
    const floor = new THREE.Mesh(new THREE.BoxGeometry(6, 0.1, 4), M.epoxy); floor.position.y = 0.05; booth.add(floor);
    // 玻璃墙（发光窗）
    const g1 = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 0.08), M.winGlow); g1.position.set(0, 1.6, 2); booth.add(g1);
    const g2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 3, 4), M.glass); g2.position.set(3, 1.6, 0); booth.add(g2);
    M.winGlow && group.userData.nightMats.push(M.winGlow);
    // 屏幕墙
    const scr = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.6, 0.06), M.screen); scr.position.set(0, 1.8, -1.9); booth.add(scr);
    group.userData.nightMats.push(M.screen);
    // 机柜排
    for (let i = 0; i < 5; i++) {
      const r = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.0, 0.8), M.pmtBody);
      r.position.set(-2.2 + i * 0.9, 1.0, -1.5); booth.add(r);
    }
    booth.name = 'control_room';
    group.add(booth);
    poi('control', '控制间', cx, 3.2, cz, ['玻璃隔间 + 机柜排 + 屏幕墙', '数据获取与慢控制']);
  }

  // ======================================================================
  // 12) 通道口：+Z 方向竖井/气闸接口（将来"从地下城下降 3 km"接这里）
  // ======================================================================
  {
    const z = CAV_LEN / 2 - 0.5;
    // 气闸门框
    const frame = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.35, 8, 24), M.ssMatte);
    frame.position.set(0, 3.2, z); frame.name = 'airlock_frame';
    group.add(frame);
    // 门盘（半开示意）
    add(new THREE.CylinderGeometry(2.0, 2.0, 0.25, 24), M.ss, 0.6, 3.2, z, 'airlock_door').rotation.x = Math.PI / 2;
    // 竖井接口标记
    group.userData.portal = { position: [0, 3.2, z], normal: [0, 0, 1], radius: 2.2 };
    poi('portal', '通道口 / 竖井', 0, 5.6, z, ['+Z 竖井 / 气闸接口', '从地下城下降 ~3 km 进入']);
  }

  // ======================================================================
  // 12b) 进场过场：竖井下降 → 穿气闸 → 弧线降落观景位 → 自动触发中微子事件
  //   host 用法：group.userData.playEntryCutscene(camera)；每帧照常调 update(dt)，
  //   过场期间本模块直接驱动 camera（host 勿同时操作），结束后归还控制权。
  //   竖井真实 3 km，此处艺术压缩为 240 m（下降 7 s + 深度环飞掠营造纵深）。
  // ======================================================================
  {
    const AIR_Z = CAV_LEN / 2 - 0.5;                    // 气闸 z = 15.5
    const SH_Z = AIR_Z + 3.0, SH_R = 2.6, SH_TOP = 240; // 竖井轴心 z、半径、顶高
    const entry = new THREE.Group(); entry.name = 'entry_shaft';
    group.add(entry);

    // 井筒（岩壁 BackSide，从洞外地坪直通井顶）
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(SH_R, SH_R, SH_TOP - 1, 20, 8, true), M.rock);
    tube.position.set(0, (SH_TOP + 1) / 2, SH_Z); entry.add(tube);
    // 井底水平连接段（井 → 气闸）
    const conn = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, 3.2, 16, 1, true), M.rock);
    conn.rotation.x = Math.PI / 2; conn.position.set(0, 3.2, AIR_Z + 1.5); entry.add(conn);
    // 井口"火星天光"盘（橙色发光，下降起点头顶）
    const sky = new THREE.Mesh(new THREE.CircleGeometry(SH_R - 0.05, 20),
      new THREE.MeshStandardMaterial({ color: 0xd77a4a, emissive: 0xc96a3c, emissiveIntensity: 1.6, side: THREE.DoubleSide }));
    sky.rotation.x = Math.PI / 2; sky.position.set(0, SH_TOP - 0.5, SH_Z); entry.add(sky);
    // 深度标记环（InstancedMesh，每 12 m 一圈，冷光）
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x9fd8e8, emissive: 0x6fb8cf, emissiveIntensity: 0.9 });
    const NRG = 19;
    const rings = new THREE.InstancedMesh(new THREE.TorusGeometry(SH_R - 0.12, 0.05, 4, 20), ringMat, NRG);
    for (let i = 0; i < NRG; i++) {
      dummy.position.set(0, 14 + i * 12, SH_Z);
      dummy.rotation.set(Math.PI / 2, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix();
      rings.setMatrixAt(i, dummy.matrix);
    }
    rings.name = 'shaft_depth_rings'; entry.add(rings);
    // 井内微光（常亮，井筒内可见）——§4b 描述，引擎建灯
    group.userData.lights.push({ color: 0x9fd8e8, pos: [0, 30, SH_Z], range: 60 });

    // ---- 过场状态机 ----
    const DUR_A = 7.0, DUR_B = 2.0, DUR_C = 3.5;        // 下降 / 穿闸 / 弧线降落
    const DUR = DUR_A + DUR_B + DUR_C;
    const sm = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));  // smoothstep
    const airlock = new THREE.Vector3(0, 3.2, AIR_Z);
    const tankAim = new THREE.Vector3(0, 7, 0);          // 洞内注视点（水罐中心）
    const vp0 = new THREE.Vector3(0, 3.5, 12.5);         // 出闸点
    const vpC = new THREE.Vector3(6.5, 4.2, 14.0);       // 弧线控制点
    const vp1 = new THREE.Vector3(10.5, 6.5, 10.5);      // 最终观景位
    const look = new THREE.Vector3(); const pa = new THREE.Vector3(); const pb = new THREE.Vector3();
    let cam = null, ct = -1;

    group.userData.entryCutsceneDuration = DUR;
    group.userData.playEntryCutscene = function (camera) { cam = camera; ct = 0; };
    group.userData.stopEntryCutscene = function () { ct = -1; cam = null; };

    const prevUpdate = group.userData.update;            // 与中微子事件的 update 串联
    group.userData.update = function (dt) {
      prevUpdate(dt);
      if (ct < 0 || !cam) return;
      ct += dt;
      if (ct < DUR_A) {
        // A 段：井内下降（视线向下，末段转向气闸）
        const f = sm(ct / DUR_A);
        const y = SH_TOP - 6 - (SH_TOP - 6 - 3.2) * f;
        cam.position.set(0, y, SH_Z);
        const blend = sm((f - 0.85) / 0.15);
        look.set(0, y - 10, SH_Z - 0.35).lerp(airlock, blend);
        cam.lookAt(look.x, look.y, look.z);
      } else if (ct < DUR_A + DUR_B) {
        // B 段：穿过气闸（直线推进，注视洞内）
        const f = sm((ct - DUR_A) / DUR_B);
        pa.set(0, 3.2, SH_Z).lerp(vp0, f);
        cam.position.copy(pa);
        look.copy(airlock).lerp(tankAim, f);
        cam.lookAt(look.x, look.y, look.z);
      } else if (ct < DUR) {
        // C 段：二次贝塞尔弧线降落到观景位，注视水罐
        const f = sm((ct - DUR_A - DUR_B) / DUR_C);
        pa.copy(vp0).lerp(vpC, f); pb.copy(vpC).lerp(vp1, f);
        cam.position.copy(pa.lerp(pb, f));
        cam.lookAt(tankAim.x, tankAim.y, tankAim.z);
      } else {
        // 结束：归还相机控制权，接力中微子事件
        ct = -1; cam = null;
        group.userData.playNeutrinoEvent();
      }
    };
  }

  // ======================================================================
  // 灯光：洞顶冷白工业灯常亮（不随火星时调制）
  // §4b 契约：userData.lights = 描述数组 {color,pos,range}，PointLight 由引擎创建；
  // 模块只放灯具几何。事件闪光的动态 PointLight（S1/S2/井内微光）是模块自驱，不进列表。
  // ======================================================================
  {
    const lampPos = [
      [-6, CAV_CY + CAV_R - 1.5, -8], [6, CAV_CY + CAV_R - 1.5, -8],
      [-6, CAV_CY + CAV_R - 1.5, 4], [6, CAV_CY + CAV_R - 1.5, 4],
      [0, CAV_CY + CAV_R - 1.5, -2],
    ];
    lampPos.forEach((p) => {
      const hous = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.3, 0.6), M.lampHous);
      hous.position.set(p[0], p[1], p[2]); group.add(hous);
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.5), M.lampGlow);
      glow.position.set(p[0], p[1] - 0.18, p[2]); glow.rotation.x = Math.PI / 2; group.add(glow);
      group.userData.lights.push({ color: 0xeaf2ff, pos: [p[0], p[1] - 0.3, p[2]], range: 45 });
    });
    // 罐内液氙微光（点缀）
    group.userData.lights.push({ color: 0x66d6e6, pos: [0, TPC_CY, 0], range: 10 });
  }

  // ======================================================================
  // 穿门契约（§4b）+ 引擎动画/动作词汇
  // ======================================================================
  // 进门落在气闸内侧 ~3.5 m、面向洞内(-Z)；走回气闸口即返回地表
  group.userData.entry = { pos: [0, 0, 12], yaw: 0 };
  group.userData.exitZone = { pos: [0, 15.2], radius: 1.8 };
  // 引擎每帧词汇：animate(t,dt,ctx) 桥接到本模块的 update(dt)（过场/事件状态机）
  group.userData.animate = (t, dt) => group.userData.update(dt);
  // 环视动作按钮：一次性触发中微子事件
  group.userData.actions = { '中微子事件': () => group.userData.playNeutrinoEvent() };

  // InstancedMesh 写入矩阵后需通知 GPU 上传；
  // 同时给不透明材质加同色 emissive 托底——新版 three 物理光衰减(decay=2)下
  // 点光照不满 30 m 洞室，室内"常亮"(§4b)靠自发光保基础可见度，点光只做局部氛围。
  const lifted = new Set();
  group.traverse((o) => {
    if (o.isInstancedMesh && o.instanceMatrix) o.instanceMatrix.needsUpdate = true;
    if (!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) {
      if (!m || !m.emissive || m.transparent || lifted.has(m)) continue;
      lifted.add(m);
      if (m.emissive.getHex() === 0) { m.emissive.copy(m.color); m.emissiveIntensity = 0.42; }
    }
  });

  return group;

  // ---- 局部工具：六方密排（蜂窝）取最内 count 个格点于半径 R 内 ----
  // 真实 PMT 阵列排布；169 为中心六边形数，恰好拼成完美 8 环正六边形。
  function hexPack(count, R) {
    const N = Math.floor(Math.sqrt(count)) + 6;
    const pts = [];
    for (let j = -2 * N; j <= 2 * N; j++) {
      for (let i = -2 * N; i <= 2 * N; i++) {
        const x = i + 0.5 * j;               // 三角格：奇偶行错开半格
        const z = (Math.sqrt(3) / 2) * j;
        pts.push({ x, z, r2: x * x + z * z });
      }
    }
    pts.sort((a, b) => a.r2 - b.r2);
    const sel = pts.slice(0, count);
    let rmax = 0;
    for (const p of sel) rmax = Math.max(rmax, Math.sqrt(p.r2));
    const s = rmax > 0 ? R / rmax : 1;       // 缩放使最外圈落在 R 上
    return sel.map((p) => ({ x: p.x * s, z: p.z * s }));
  }
}
