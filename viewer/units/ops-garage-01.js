// ops-garage-01 -- ops-dog-01 的母港：防尘正压车库 + 加热充电坞 + 归航靶标。
//
// 这栋建筑的每一条尺寸都不是画出来的，是 mars-dog 那本设计册算出来的
// （sim/garage_ops.py，8 闸；ledger/r13_garage.json）。三条决定了几何长相的账：
//
// ① **狗舱不做人居级加压。** 19.9 m³ 充到 101.3 kPa，每次压缩功 2,313 Wh ——
//    是狗整块可用电池（640 Wh 包，可用 410 Wh）的 5.6 倍，每 sol 一次不可能。
//    而 R8 早就把与狗共处的判据全部按**穿加压服**写完了（刺穿/挤压/撞倒），
//    所以脱服进出根本不在需求里。狗舱做的是 **2 kPa 防尘正压**（5.6 Wh/次），
//    人居级加压留给旁边那间 8.3 m³ 的检修间（968 Wh/次，带回收泵约 97 Wh，
//    一个月一次）。**两间舱、两种密封等级**，这就是右侧那个小体量的由来。
//
// ② **不烤库，烤坞。** 整库维持 +5 °C 要 400 W（一夜 4.8 kWh）；
//    而狗**自带**电池保温壳（R4 实测 UA 0.1435 W/K），把 13.9 W 直接送进那层
//    已有的壳里就够 —— 差 29 倍。首版把坞设计成「整只狗裹保温罩」，105 W，
//    被 G-5 当场判红：那是**重复保温**。而「关节要不要一起烤」R6 已经替我
//    回答了 —— 低温脂过不了夜间 −46 °C，所以那一轮选了 MoS₂ 干膜，干膜没有
//    低温下限。**润滑剂选型顺手取消了整机保温的需求。**
//    所以库里看得见的是一块**加热+充电的接触板**，不是暖房，也不是罩子。
//
// ③ **气源只有这里有。** R6 定的策略是「野外被动密封 + 回库正压吹扫」。
//    库内 2 kPa > R6 射流的滞止压 857 Pa，所以**同一个气源既维持防尘正压
//    又供吹扫**，不需要第二套增压。
//
// 还有一条是 R11 的硬要求：外墙一组**无源角锥**（25 mm × 7），装在门洞正上方，
// 这样「看见靶标」和「对准门」是同一件事。角锥按真实尺寸建（25 mm 在 5 m 的
// 建筑上就是很小），不放大 —— 契约是 1 单位 = 1 米。
export const meta = {
  id: 'ops-garage-01',
  name: '巡检狗母港车库',
  name_en: 'Patrol Dog Home Garage',
  size_m: 6.19,          // 实测包围盒最大边（Z 向：后墙 −2.05 到场坪护栏 +4.14）
  effects: [],
};

export function build(THREE) {
  const group = new THREE.Group();
  group.name = meta.id;

  /* ---------------- 材质 ---------------- */
  const M = {
    shell:  new THREE.MeshStandardMaterial({ color: 0xd8d2c6, roughness: 0.62 }),
    shellD: new THREE.MeshStandardMaterial({ color: 0xb9b2a4, roughness: 0.68 }),
    frame:  new THREE.MeshStandardMaterial({ color: 0x8d9298, roughness: 0.5, metalness: 0.35 }),
    dark:   new THREE.MeshStandardMaterial({ color: 0x1b1e23, roughness: 0.72 }),
    seal:   new THREE.MeshStandardMaterial({ color: 0x2a2622, roughness: 0.95 }),
    orange: new THREE.MeshStandardMaterial({ color: 0xe07020, roughness: 0.6 }),
    steel:  new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.35, metalness: 0.7 }),
    gold:   new THREE.MeshStandardMaterial({ color: 0xb8860b, roughness: 0.3, metalness: 0.75 }),
    pad:    new THREE.MeshStandardMaterial({ color: 0x8a6a52, roughness: 0.98 }),
    rock:   new THREE.MeshStandardMaterial({ color: 0x7a5a44, roughness: 1.0 }),
  };
  // 夜间发光件（引擎按昼夜调 emissiveIntensity）
  const heaterMat = new THREE.MeshStandardMaterial({
    color: 0x3a1c06, emissive: 0xff7a1e, emissiveIntensity: 1.2, roughness: 0.6 });
  const glowIn = new THREE.MeshStandardMaterial({
    color: 0x1a2028, emissive: 0x9fd0ff, emissiveIntensity: 0.9, roughness: 0.5 });
  const ledGreen = new THREE.MeshStandardMaterial({
    color: 0x0a2a0a, emissive: 0x35e055, emissiveIntensity: 1.6, roughness: 0.5 });
  const beaconMat = new THREE.MeshStandardMaterial({
    color: 0x2a0808, emissive: 0xff3020, emissiveIntensity: 1.3, roughness: 0.4 });
  const purgeMat = new THREE.MeshStandardMaterial({
    color: 0x0d1a22, emissive: 0x60d8ff, emissiveIntensity: 0.0, roughness: 0.5 });

  const box = (w, h, d, mat, x, y, z, parent) => {
    const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    me.position.set(x, y, z); (parent || group).add(me); return me;
  };
  const cyl = (r1, r2, h, seg, mat, x, y, z, parent) => {
    const me = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), mat);
    me.position.set(x, y, z); (parent || group).add(me); return me;
  };
  const poi = (name, x, y, z, parent) => {
    const a = new THREE.Object3D(); a.name = 'poi_' + name;
    a.position.set(x, y, z); (parent || group).add(a); return a;
  };
  // 两点之间放一根方梁 —— 桁架/斜撑用，比一根光杆立柱耐看
  const beam = (a, b, t, mat, parent) => {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
    const d = new THREE.Vector3().subVectors(vb, va);
    const me = new THREE.Mesh(new THREE.BoxGeometry(t, t, d.length()), mat);
    me.position.copy(va).addScaledVector(d, 0.5);
    me.lookAt(vb); (parent || group).add(me); return me;
  };
  // 确定性伪随机：同一个种子每次跑出同样的砾石，截图可复现
  let seed = 20260813;
  const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;

  /* ================= 场坪与作业痕迹 =================
     ops-dog-01.js 里明确写了「场地痕迹属于 ops-garage-01」——这里还这笔。 */
  const apron = new THREE.Group(); apron.name = 'apron'; group.add(apron);
  box(5.0, 0.06, 2.0, M.pad, 0, 0.03, 3.0, apron);
  // 车辙：狗每 sol 走同一条线，R9 的「路网复用」在地面上就是这两道沟
  for (const s of [-1, 1]) {
    const rut = box(0.16, 0.02, 1.9, M.rock, -1.10 + s * 0.30, 0.055, 3.0, apron);
    rut.material = M.rock;
  }
  for (let i = 0; i < 26; i++) {
    const r = 0.02 + rnd() * 0.05;
    const g2 = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), M.rock);
    // DodecahedronGeometry(1,0) 的顶点半径是 φ≈1.618，贴地要按 1.62·r 抬
    g2.position.set(-2.4 + rnd() * 4.8, 0.06 + 1.62 * r, 2.1 + rnd() * 2.0);
    g2.rotation.y = rnd() * 6.28;
    apron.add(g2);
  }
  // 安全橙护栏（场坪边缘）
  for (let i = 0; i < 4; i++) {
    const x = -2.4 + i * 1.6;
    cyl(0.035, 0.035, 0.8, 6, M.orange, x, 0.46, 4.0, apron);
  }
  beam([-2.4, 0.82, 4.0], [2.4, 0.82, 4.0], 0.05, M.orange, apron);
  poi('apron', 0, 0.1, 3.4, apron);

  /* ================= 狗舱（剖切：−X 面整面开放） =================
     内净 3.60(Z) × 2.40(X) × 2.30(Y) = 19.9 m³，墙 0.20 厚
     -> 外廓 X −2.50..+0.30，Z −2.00..+2.00，Y 0..2.50 */
  const bay = new THREE.Group(); bay.name = 'dog_bay'; group.add(bay);
  const BX0 = -2.50, BX1 = 0.30, BZ0 = -2.00, BZ1 = 2.00, BY = 2.50;
  const bcx = (BX0 + BX1) / 2, bcz = (BZ0 + BZ1) / 2;

  box(BX1 - BX0, 0.16, BZ1 - BZ0, M.shellD, bcx, 0.08, bcz, bay);   // 地板
  box(0.20, BY, BZ1 - BZ0, M.shell, BX1 - 0.10, BY / 2, bcz, bay);  // +X 隔墙
  box(BX1 - BX0, BY, 0.20, M.shell, bcx, BY / 2, BZ0 + 0.10, bay);  // −Z 后墙
  box(BX1 - BX0, 0.18, BZ1 - BZ0, M.shell, bcx, BY + 0.09, bcz, bay); // 顶盖
  box(BX1 - BX0 + 0.10, 0.06, BZ1 - BZ0 + 0.10, M.shellD, bcx, BY + 0.21, bcz, bay); // 顶盖压条
  box(BX1 - BX0 + 0.08, 0.12, BZ1 - BZ0 + 0.08, M.shellD, bcx, 0.20, bcz, bay);      // 底裙边
  // 剖开的那面只留两根角柱，让内部一览无余
  for (const z of [BZ0 + 0.12, BZ1 - 0.12]) {
    box(0.16, BY, 0.16, M.frame, BX0 + 0.08, BY / 2, z, bay);
  }
  // +Z 前墙：门洞 1.60 × 1.50，两侧留墙垛、上方留过梁
  const DW = 1.60, DH = 1.50, dcx = bcx;
  box((DW < BX1 - BX0 ? (BX1 - BX0 - DW) / 2 : 0.1), DH, 0.20, M.shell,
      BX0 + (BX1 - BX0 - DW) / 4, DH / 2, BZ1 - 0.10, bay);
  box((BX1 - BX0 - DW) / 2, DH, 0.20, M.shell,
      BX1 - (BX1 - BX0 - DW) / 4, DH / 2, BZ1 - 0.10, bay);
  box(BX1 - BX0, BY - DH, 0.20, M.shell, bcx, DH + (BY - DH) / 2, BZ1 - 0.10, bay);
  // 密封框（工业细节语法：密封框 + 扇 + 闩 + 双铰链）
  box(DW + 0.16, 0.08, 0.10, M.seal, dcx, DH + 0.04, BZ1 - 0.02, bay);
  for (const s of [-1, 1]) box(0.08, DH, 0.10, M.seal, dcx + s * (DW / 2 + 0.04), DH / 2, BZ1 - 0.02, bay);

  // 门扇（上翻门：绕门楣转，animate 驱动）
  const doorPiv = new THREE.Group(); doorPiv.name = 'door_pivot';
  doorPiv.position.set(dcx, DH, BZ1 + 0.02); bay.add(doorPiv);
  box(DW, 0.10, 0.08, M.frame, 0, 0, 0, doorPiv);                    // 门楣轴
  const leaf = new THREE.Group(); leaf.name = 'door_leaf'; doorPiv.add(leaf);
  box(DW, DH, 0.09, M.shell, 0, -DH / 2, 0, leaf);
  box(DW - 0.10, 0.07, 0.03, M.orange, 0, -0.16, 0.06, leaf);        // 警示条
  box(DW - 0.10, 0.07, 0.03, M.orange, 0, -DH + 0.16, 0.06, leaf);
  box(0.14, 0.22, 0.07, M.steel, 0, -DH + 0.11, 0.08, leaf);         // 闩
  for (const s of [-1, 1]) cyl(0.05, 0.05, 0.12, 8, M.steel, s * (DW / 2 - 0.10), 0.0, 0.02, leaf)
    .rotation.z = Math.PI / 2;                                        // 双铰链
  poi('door', dcx, DH * 0.6, BZ1 + 0.25, bay);

  /* ---- 归航靶标：R11 要的无源角锥阵列，装在门洞正上方 ---- */
  const retro = new THREE.Group(); retro.name = 'retro_array';
  retro.position.set(dcx, DH + 0.42, BZ1 + 0.04); bay.add(retro);
  box(0.34, 0.20, 0.03, M.dark, 0, 0, 0, retro);                      // 衬板
  // 橙色靶框：25 mm 的角锥在 5 m 的建筑上本来就看不清，靶框是给**人**看的
  // ——它标出「这块地方别碰、别遮、别刷漆」。角锥本身不放大。
  for (const s of [-1, 1]) {
    box(0.36, 0.025, 0.035, M.orange, 0, s * 0.106, 0.008, retro);
    box(0.025, 0.21, 0.035, M.orange, s * 0.168, 0, 0.008, retro);
  }
  // 7 只 25 mm 角锥，六边形排布。**按真实尺寸建**：契约是 1 单位 = 1 米，
  // 放大到「看得清」就等于骗人——这一组在 5 m 的建筑上本来就该是小的。
  const RA = 0.025;
  const hex = [[0, 0], [1, 0], [0.5, 0.866], [-0.5, 0.866],
               [-1, 0], [-0.5, -0.866], [0.5, -0.866]];
  for (const [hx, hy] of hex) {
    const c = new THREE.Mesh(new THREE.ConeGeometry(RA / 2, RA, 3), M.gold);
    c.position.set(hx * RA * 1.15, hy * RA * 1.15, 0.028);
    c.rotation.x = -Math.PI / 2;                                      // 尖朝外
    retro.add(c);
  }
  poi('retro', dcx, DH + 0.42, BZ1 + 0.30, bay);

  /* ---- 加热充电坞：本资产的核心，看得见的就该是它 ---- */
  const dock = new THREE.Group(); dock.name = 'dock';
  dock.position.set(bcx, 0.16, -0.35); bay.add(dock);
  box(1.70, 0.14, 2.10, M.frame, 0, 0.07, 0, dock);                   // 坞台
  const plate = box(1.30, 0.03, 1.70, heaterMat, 0, 0.155, 0, dock);  // 加热触点板
  plate.name = 'heater_plate';
  // 对位挡块：入口宽、里面窄，把 1 m 捕获半径收到接触板上
  for (const s of [-1, 1]) {
    const g1 = box(0.10, 0.26, 1.20, M.orange, s * 0.80, 0.27, 0.35, dock);
    g1.rotation.y = -s * 0.16;
    box(0.10, 0.26, 0.70, M.orange, s * 0.66, 0.27, -0.62, dock);
  }
  // 充电触点（两根柱 + 绿色状态灯）
  for (const s of [-1, 1]) {
    cyl(0.045, 0.045, 0.30, 8, M.steel, s * 0.28, 0.29, -0.92, dock);
    box(0.06, 0.06, 0.02, ledGreen, s * 0.28, 0.46, -0.92, dock);
  }
  poi('dock', bcx, 0.5, -0.35, bay);

  /* ---- 吹扫环：R6 的 CO2 射流，气源与防尘正压同一路 ---- */
  const ring = new THREE.Group(); ring.name = 'purge_ring';
  ring.position.set(bcx, 1.72, -0.35); bay.add(ring);
  const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.028, 6, 20), M.steel);
  hoop.rotation.x = Math.PI / 2; ring.add(hoop);
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2;
    const n = cyl(0.022, 0.010, 0.10, 6, purgeMat,
                  Math.cos(a) * 0.62, -0.05, Math.sin(a) * 0.62, ring);
    n.rotation.x = Math.PI;
  }
  beam([bcx - 0.62, 1.72, -0.35], [BX1 - 0.20, 1.72, -0.35], 0.04, M.steel, bay);

  /* ---- 气瓶架 + 增压机（spinner 的飞轮） ---- */
  const gas = new THREE.Group(); gas.name = 'gas_rack';
  gas.position.set(BX1 - 0.42, 0.16, 1.10); bay.add(gas);
  for (let i = 0; i < 3; i++) {
    cyl(0.13, 0.13, 0.90, 10, M.steel, 0, 0.45, -0.34 + i * 0.34, gas);
    cyl(0.05, 0.05, 0.10, 6, M.frame, 0, 0.95, -0.34 + i * 0.34, gas);
  }
  box(0.30, 0.06, 1.10, M.frame, 0, 0.66, 0, gas);
  const comp = box(0.34, 0.32, 0.36, M.dark, 0, 0.18, 0.62, gas);
  const fly = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.05, 14), M.steel);
  fly.name = 'flywheel'; fly.position.set(-0.20, 0.18, 0.62);
  fly.rotation.z = Math.PI / 2; gas.add(fly);
  poi('gas', BX1 - 0.42, 1.10, 1.10, bay);

  // 内壁灯带（夜里从剖开面透出来）
  const strip = box(0.06, 0.05, 3.2, glowIn, BX1 - 0.22, 2.20, bcz, bay);
  const strip2 = box(2.4, 0.05, 0.06, glowIn, bcx, 2.20, BZ0 + 0.24, bay);
  // 电源进线：导管 + 接线箱（工业细节语法）
  box(0.26, 0.34, 0.20, M.dark, BX1 - 0.20, 0.55, BZ0 + 0.36, bay);
  cyl(0.05, 0.05, 0.55, 8, M.frame, BX1 - 0.20, 1.00, BZ0 + 0.36, bay);

  /* ================= 检修间（人居级加压，8.3 m³，低频） ================= */
  const svc = new THREE.Group(); svc.name = 'service_bay'; group.add(svc);
  const SX0 = 0.30, SX1 = 2.50, SZ0 = -2.00, SZ1 = 0.60, SY = 2.40;
  const scx = (SX0 + SX1) / 2, scz = (SZ0 + SZ1) / 2;
  box(SX1 - SX0, SY, SZ1 - SZ0, M.shell, scx, SY / 2, scz, svc);
  box(SX1 - SX0 + 0.10, 0.06, SZ1 - SZ0 + 0.10, M.shellD, scx, SY + 0.05, scz, svc);
  box(SX1 - SX0 + 0.08, 0.12, SZ1 - SZ0 + 0.08, M.shellD, scx, 0.20, scz, svc);
  // 人孔门：厚得多的密封框（人居级 101 kPa vs 狗舱 2 kPa，密封等级不同）
  box(1.00, 1.90, 0.14, M.seal, scx - 0.20, 0.95, SZ1 + 0.02, svc);
  box(0.86, 1.76, 0.10, M.frame, scx - 0.20, 0.95, SZ1 + 0.08, svc);
  box(0.20, 0.20, 0.06, M.steel, scx + 0.14, 0.95, SZ1 + 0.14, svc);   // 手轮座
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.022, 6, 16), M.steel);
  wheel.position.set(scx + 0.14, 0.95, SZ1 + 0.19); svc.add(wheel);
  box(0.44, 0.30, 0.04, glowIn, scx - 0.20, 1.72, SZ1 + 0.09, svc);    // 观察窗
  // 气体回收罐：人居级加压 968 Wh/次，带 90% 回收泵才降到 ~97 Wh
  // 罐子沿 Z 卧放贴着墙 —— 首版沿 X 卧放，把包围盒从 6.19 撑到 6.19 却让
  // 建筑凭空多出 0.73 m 的悬臂，manifest 的 size_m 会变成一只罐子说了算。
  const tank = new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 0.86, 4, 12), M.steel);
  tank.rotation.x = Math.PI / 2; tank.position.set(SX1 + 0.32, 0.62, scz + 0.10);
  svc.add(tank);
  box(0.26, 0.26, 0.26, M.dark, SX1 + 0.32, 0.24, scz - 0.95, svc);    // 回收泵
  cyl(0.045, 0.045, 0.70, 8, M.frame, SX1 + 0.32, 0.24, scz - 0.50, svc)
    .rotation.x = Math.PI / 2;
  box(0.10, 0.10, 0.9, M.orange, SX1 + 0.32, 1.00, scz + 0.10, svc);   // 罐箍
  poi('service', scx, 1.3, SZ1 + 0.4, svc);

  /* ================= 屋面设备 ================= */
  // UHF 鞭天线（com-station-01 在 222 m 外，R11 算过裕度 74.5 dB）
  cyl(0.05, 0.05, 0.18, 8, M.frame, 1.90, BY + 0.30, -1.40);
  cyl(0.014, 0.010, 1.10, 6, M.steel, 1.90, BY + 0.94, -1.40);
  // 信标灯（引擎驱动红色警示闪烁）
  const beacon = cyl(0.07, 0.07, 0.10, 8, beaconMat, -1.10, BY + 0.32, -1.60);
  beacon.name = 'blink_beacon';
  // 泄压阀 + 通风罩：正压车库必须有一条被动泄放路径
  cyl(0.10, 0.14, 0.16, 8, M.frame, -0.60, BY + 0.30, 1.40);
  cyl(0.16, 0.16, 0.05, 10, M.shellD, -0.60, BY + 0.41, 1.40);
  // 屋面桁架（质感基线：两点方梁，不要光杆）
  beam([BX0 + 0.1, BY + 0.34, BZ0 + 0.2], [BX1 - 0.1, BY + 0.34, BZ0 + 0.2], 0.07, M.frame);
  beam([BX0 + 0.1, BY + 0.34, BZ1 - 0.2], [BX1 - 0.1, BY + 0.34, BZ1 - 0.2], 0.07, M.frame);
  beam([BX0 + 0.1, BY + 0.34, BZ0 + 0.2], [BX1 - 0.1, BY + 0.34, BZ1 - 0.2], 0.05, M.frame);

  // 铭牌
  box(0.70, 0.16, 0.03, M.orange, bcx, BY - 0.22, BZ1 + 0.02);

  /* ---------------- 尘膜 pass（六招最后一招） ---------------- */
  for (const k of ['shell', 'shellD', 'frame', 'orange', 'steel', 'pad']) {
    M[k].color.lerp(new THREE.Color(0x9e5b3d), 0.05);
  }

  /* ---------------- 声明式动画 ---------------- */
  group.userData.spinners = [{ node: 'flywheel', axis: 'y', rpm: 90 }];
  group.userData.nightMats = [heaterMat, glowIn, ledGreen];
  group.userData.blinkMats = [beaconMat];

  // 一次进出的时间线，写成周期 T 的**纯 t 分段**：不累积状态，任意 t 跳进来都成立。
  const T = 48.0;
  const ss = (a, b, x) => {                       // smoothstep
    const u = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return u * u * (3 - 2 * u);
  };
  let purgeOn = false;
  group.userData.animate = (t) => {
    const tt = ((t % T) + T) % T;
    // 0–4 开门 / 4–12 停留（狗进出）/ 12–16 关门 / 16–24 吹扫 / 其余静置
    const open = ss(0, 4, tt) - ss(12, 16, tt);
    doorPiv.rotation.x = -open * 1.48;            // 上翻到近水平
    const p = (tt > 16 && tt < 24) ? 1 : 0;
    if (p !== (purgeOn ? 1 : 0)) {                // 只在跳变时写材质
      purgeOn = !!p;
      purgeMat.emissiveIntensity = purgeOn ? 1.4 : 0.0;
    }
    // 坞的加热板：夜里才真正干活，这里只做一个很慢的呼吸让它不死板
    heaterMat.emissiveIntensity = 1.05 + 0.18 * Math.sin(tt * 0.35);
  };

  group.userData.actions = {
    '开门': () => { group.userData._forceOpen = true; },
    '吹扫': () => { purgeMat.emissiveIntensity = 1.4; purgeOn = true; },
  };

  group.userData.lights = [
    { color: 0xffc98a, pos: [-1.10, 2.05, 0.6], range: 12 },
  ];

  return group;
}
