// hab-bot-01 —— 地下城室内服务机器人（陪伴型人形，身高 1.65 m）
// 契约（MODELS.md §4 / §4c）：1u=1m；原点=双脚间地面点；+Y 上；面朝 +Z；
//   THREE 由 build 传入；无外部资源（表情屏 CanvasTexture 在无 DOM 环境
//   自动降级为纯发光材质，node 校验可跑通）。
// 宿主：hab-foyer-01（manifest kind:"interior-companion", host 字段）。
//   推荐挂载：作为玄关 group 的子节点加在 (0, 0.30, -9.5)（地坪顶面、大厅
//   中段），本模块的巡逻/充电坐标全部按该挂载点的本地系设计。
// 三大继承资产：
//   1) 感知闭环（res-mine-01 同款）：头部导航相机 64x64@5Hz 声明进
//      userData.sensors，引擎回填像素；CIS 成像模型五阶段参数原样移植
//      （QE 0.60 / 满阱 17,880 e- / 读噪 1.76 e- / 暗电流 170 e-/s / 10-bit）。
//   2) 测距思维（905 nm 微型闪光 LiDAR）：胸口 15 束 x 90° 前扇区、20 m 量程，
//      Raycaster 对室内场景根求交得深度剖面——工程近似的 LiDAR，链路预算
//      按真的算（见 info.json 📐 层）。
//   3) AI 眼镜作脸：面罩小屏显示状态表情（◡ → ! ◠ z），镜腿带相机窗；
//      侧面丝印 "WORLD-B RESIDENT"。
// 运动：MuJoCo 烘焙步态（火星 g=3.71，sim/run_gait.py，随附
//   hab-bot-01.gait.json 为出处存档；模块内嵌同一份曲线做确定性回放），
//   walk/turn/idle 三循环按 (v, w) 相位混合；头部扫视走 oscillators。
// 优雅降级（硬要求）：sensor.frame>0 才进自主状态机（粘性）；引擎无感知
//   通道时永远跑纯 t 烘焙 8 字巡逻。玩家位置通过 ctx.player（[x,y,z] 世界系，
//   总控扩展室内分支时回填）驱动迎宾；无该字段则迎宾不触发、巡逻不受影响。

export const meta = {
  id: 'hab-bot-01',
  name: '室内服务机器人',
  size_m: 1.65,
  size_axis: 'height',
  kind: 'interior-companion',
  host: 'hab-foyer-01',
  effects: [],
};

export function build(THREE) {
  const group = new THREE.Group();
  group.name = meta.id;

  /* ---------------- 材质（与玄关同族的室内质感） ---------------- */
  const M = {
    shell:  new THREE.MeshStandardMaterial({ color: 0xdcd8ce, roughness: 0.55 }), // 外壳白
    shellD: new THREE.MeshStandardMaterial({ color: 0xc4bfb2, roughness: 0.6 }),  // 壳体分色
    joint:  new THREE.MeshStandardMaterial({ color: 0x2f3237, roughness: 0.5, metalness: 0.4 }), // 关节深灰
    grey:   new THREE.MeshStandardMaterial({ color: 0x8f949a, roughness: 0.55, metalness: 0.3 }),
    orange: new THREE.MeshStandardMaterial({ color: 0xe07020, roughness: 0.6 }),  // 安全橙
    visor:  new THREE.MeshStandardMaterial({ color: 0x10151c, roughness: 0.25, metalness: 0.3 }), // 面罩玻璃
    dark:   new THREE.MeshStandardMaterial({ color: 0x1a1d22, roughness: 0.7 }),
    pad:    new THREE.MeshStandardMaterial({ color: 0xb8860b, roughness: 0.4, metalness: 0.6 }),  // 充电触点铜色
  };
  const ledMat = new THREE.MeshStandardMaterial({ color: 0x0a2a0a, emissive: 0x35e055, emissiveIntensity: 1.6, roughness: 0.5 });
  const dockLed = new THREE.MeshStandardMaterial({ color: 0x2a1c05, emissive: 0xffb020, emissiveIntensity: 1.6, roughness: 0.5 });
  const lidarEmit = new THREE.MeshStandardMaterial({ color: 0x1a0505, emissive: 0xff2a1a, emissiveIntensity: 0.9, roughness: 0.5 }); // 905nm 出光窗（红表意）

  const box = (w, h, d, mat, x, y, z, parent) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    (parent || group).add(m);
    return m;
  };
  const cyl = (r1, r2, h, seg, mat, x, y, z, rx, rz, parent) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), mat);
    m.position.set(x, y, z);
    if (rx) m.rotation.x = rx;
    if (rz) m.rotation.z = rz;
    (parent || group).add(m);
    return m;
  };
  // 确定性伪随机（噪声/坏点图共用）
  let _seed = 20260726;
  const rnd = () => { _seed = (_seed * 16807) % 2147483647; return _seed / 2147483647; };
  const hash3 = (x, y, z) => {
    const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
    return s - Math.floor(s);
  };

  /* ==========================================================
   * 1) 机体：body(位置+航向) -> pelvis/torsoP(俯仰) -> 四肢关节 pivot 链
   *    尺寸与 MJCF 严格一致：髋 0.84 / 大腿 0.38 / 小腿 0.38 / 踝 0.08 /
   *    肩 1.30 / 上臂 0.26 / 前臂 0.24 / 总高 1.65
   * ========================================================== */
  const body = new THREE.Group();
  body.name = 'body';
  body.rotation.order = 'YXZ';                 // 先航向后俯仰
  group.add(body);

  // ---- 腿（挂 body：俯仰只给上身,脚不入地） ----
  const legs = {};
  [['L', -0.10], ['R', 0.10]].forEach(([s, x]) => {
    const hip = new THREE.Group();
    hip.position.set(x, 0.84, 0);
    body.add(hip);
    cyl(0.052, 0.052, 0.09, 12, M.joint, 0, 0, 0, 0, Math.PI / 2, hip); // 髋关节鼓
    cyl(0.045, 0.040, 0.34, 10, M.shell, 0, -0.19, 0, 0, 0, hip);       // 大腿壳
    box(0.06, 0.30, 0.02, M.shellD, x > 0 ? 0.045 : -0.045, -0.19, 0, hip); // 外侧饰板
    const knee = new THREE.Group();
    knee.position.set(0, -0.38, 0);
    hip.add(knee);
    cyl(0.048, 0.048, 0.08, 12, M.joint, 0, 0, 0, 0, Math.PI / 2, knee); // 膝关节鼓
    cyl(0.038, 0.034, 0.34, 10, M.shell, 0, -0.19, 0, 0, 0, knee);       // 小腿壳
    const ankle = new THREE.Group();
    ankle.position.set(0, -0.38, 0);
    knee.add(ankle);
    cyl(0.034, 0.034, 0.055, 10, M.joint, 0, 0, 0, 0, Math.PI / 2, ankle);
    box(0.09, 0.045, 0.20, M.joint, 0, -0.0525, 0.03, ankle);           // 足体（前长后短）
    box(0.095, 0.012, 0.21, M.dark, 0, -0.074, 0.03, ankle);            // 鞋底
    box(0.07, 0.03, 0.03, M.shellD, 0, -0.045, 0.135, ankle);           // 鞋头护块
    legs[s] = { hip, knee, ankle };
  });

  // ---- 骨盆 + 躯干（torsoP 俯仰 pivot 在髋线） ----
  box(0.20, 0.11, 0.13, M.shellD, 0, 0.895, 0, body);                   // 骨盆块
  const torsoP = new THREE.Group();                                     // 上身俯仰关节
  torsoP.position.set(0, 0.95, 0);
  body.add(torsoP);
  box(0.17, 0.05, 0.12, M.joint, 0, 0.005, 0, torsoP);                  // 腰环
  const chest = box(0.26, 0.30, 0.16, M.shell, 0, 0.22, 0, torsoP);     // 胸壳（中心 y1.17）
  box(0.24, 0.08, 0.015, M.shellD, 0, 0.30, 0.082, torsoP);             // 锁骨饰板
  // 胸口 LiDAR 窗：横缝 + 905nm 出光条 + 两粒接收镜头（镜腿风格呼应）
  const lidarAnchor = new THREE.Object3D();
  lidarAnchor.name = 'lidar_origin';
  lidarAnchor.position.set(0, 0.16, 0.085);                             // 世界 y≈1.11
  torsoP.add(lidarAnchor);
  box(0.14, 0.035, 0.012, M.dark, 0, 0.16, 0.082, torsoP);              // 窗框缝
  box(0.11, 0.012, 0.014, lidarEmit, 0, 0.16, 0.084, torsoP);           // 发射条
  [-0.085, 0.085].forEach(x => cyl(0.011, 0.011, 0.014, 8, M.visor, x, 0.16, 0.084, Math.PI / 2, 0, torsoP));
  // 状态灯（胸口右上）
  const led = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.028, 0.012), ledMat);
  led.position.set(0.09, 0.30, 0.083);
  torsoP.add(led);
  // 背包：电池舱 + 通讯天线（推理在城内计算中心,机器人只带边缘感知）
  box(0.20, 0.24, 0.06, M.shellD, 0, 0.20, -0.108, torsoP);
  box(0.16, 0.05, 0.02, M.orange, 0, 0.30, -0.128, torsoP);             // 电池橙色提手
  box(0.14, 0.16, 0.012, M.dark, 0, 0.16, -0.142, torsoP);              // 散热格
  cyl(0.006, 0.006, 0.14, 6, M.grey, 0.08, 0.42, -0.12, 0, 0, torsoP);  // 天线
  cyl(0.012, 0.012, 0.02, 8, M.orange, 0.08, 0.50, -0.12, 0, 0, torsoP);

  // ---- 手臂（肩/肘 pivot + 简化三指手） ----
  const arms = {};
  [['L', -1], ['R', 1]].forEach(([s, sg]) => {
    const sh = new THREE.Group();
    sh.position.set(sg * 0.165, 0.35, 0);                               // 世界 y=1.30
    torsoP.add(sh);
    cyl(0.045, 0.045, 0.07, 12, M.joint, 0, 0, 0, 0, Math.PI / 2, sh);  // 肩关节鼓
    cyl(0.032, 0.029, 0.22, 10, M.shell, 0, -0.14, 0, 0, 0, sh);        // 上臂
    const elb = new THREE.Group();
    elb.position.set(0, -0.26, 0);
    sh.add(elb);
    cyl(0.03, 0.03, 0.062, 10, M.joint, 0, 0, 0, 0, Math.PI / 2, elb);  // 肘关节鼓
    cyl(0.027, 0.024, 0.20, 10, M.shellD, 0, -0.125, 0, 0, 0, elb);     // 前臂
    // 三指手：掌 + 对置双指 + 拇指（室内服务的力闭合抓取,见知识卡）
    const palm = box(0.055, 0.07, 0.035, M.joint, 0, -0.27, 0, elb);
    [[-0.016, 0.012], [0.016, 0.012]].forEach(([fx, fz]) => {
      const f = box(0.014, 0.055, 0.016, M.grey, fx, -0.055, fz, palm);
      f.rotation.x = -0.25;                                             // 微屈
    });
    const th = box(0.014, 0.045, 0.016, M.grey, 0, -0.045, -0.018, palm);
    th.rotation.x = 0.5;                                                // 拇指对握
    arms[s] = { sh, elb };
    if (sg > 0) {
      const a = new THREE.Object3D();
      a.name = 'poi_hand';
      a.position.set(0, -0.30, 0);
      elb.add(a);
    }
  });

  /* ==========================================================
   * 2) 头 + AI 眼镜面罩（表情屏 CanvasTexture,无 DOM 自动降级）
   * ========================================================== */
  const neck = new THREE.Group();                                       // 迎宾面向玩家用
  neck.name = 'neck';
  neck.position.set(0, 0.44, 0);                                       // 世界 y=1.39
  torsoP.add(neck);
  cyl(0.032, 0.036, 0.05, 10, M.joint, 0, 0.01, 0, 0, 0, neck);
  const headScan = new THREE.Group();                                   // 扫视关节 -> oscillators
  headScan.name = 'head_scan';
  headScan.position.set(0, 0.05, 0);
  neck.add(headScan);
  box(0.20, 0.17, 0.19, M.shell, 0, 0.115, -0.005, headScan);           // 头壳（顶 1.645）
  box(0.16, 0.02, 0.15, M.shellD, 0, 0.21, -0.005, headScan);           // 顶盖压条
  // 面罩：AI 眼镜造型——前屏 + 两侧斜切角 + 镜腿
  box(0.19, 0.085, 0.016, M.visor, 0, 0.115, 0.094, headScan);          // 面罩玻璃
  [[-0.102, 0.075], [0.102, 0.075]].forEach(([x, z]) => {
    const p = box(0.016, 0.085, 0.05, M.visor, x, 0.115, z, headScan);  // 斜切侧角
    p.rotation.y = x > 0 ? -0.5 : 0.5;
  });
  box(0.20, 0.014, 0.02, M.joint, 0, 0.165, 0.095, headScan);           // 眉框(镜框上梁)
  // 镜腿：左腿前端=导航相机窗,右腿外侧=丝印彩蛋
  [[-1, 'L'], [1, 'R']].forEach(([sg]) => {
    box(0.014, 0.03, 0.16, M.joint, sg * 0.104, 0.13, 0.01, headScan);  // 镜腿沿头侧
  });
  box(0.024, 0.024, 0.03, M.dark, -0.104, 0.13, 0.095, headScan);       // 左腿相机舱
  const camLens = cyl(0.008, 0.008, 0.012, 8, M.visor, -0.104, 0.13, 0.112, Math.PI / 2, 0, headScan);
  camLens.name = 'nav_cam_window';

  // 表情屏 + 丝印：DOM 可用时走 CanvasTexture,否则纯发光材质(优雅降级)
  const hasDOM = typeof document !== 'undefined';
  let faceCtx = null, faceTex = null, printTex = null;
  let screenMat;
  if (hasDOM) {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 96;
    faceCtx = c.getContext('2d');
    faceTex = new THREE.CanvasTexture(c);
    faceTex.colorSpace = THREE.SRGBColorSpace;
    screenMat = new THREE.MeshBasicMaterial({ map: faceTex });
    const p = document.createElement('canvas');                          // 丝印彩蛋
    p.width = 512; p.height = 48;
    const pc = p.getContext('2d');
    pc.fillStyle = '#c4bfb2';
    pc.fillRect(0, 0, 512, 48);
    pc.fillStyle = '#6b675e';
    pc.font = '600 26px system-ui, sans-serif';
    pc.textAlign = 'center'; pc.textBaseline = 'middle';
    pc.fillText('W O R L D - B   R E S I D E N T', 256, 25);
    printTex = new THREE.CanvasTexture(p);
    printTex.colorSpace = THREE.SRGBColorSpace;
  } else {
    screenMat = new THREE.MeshStandardMaterial({ color: 0x06222c, emissive: 0x2aa8c8, emissiveIntensity: 0.8, roughness: 0.4 });
  }
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.164, 0.0615), screenMat);
  screen.position.set(0, 0.115, 0.104);
  headScan.add(screen);
  const printPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 0.0122),
    printTex ? new THREE.MeshBasicMaterial({ map: printTex })
             : new THREE.MeshStandardMaterial({ color: 0xc4bfb2 }));
  printPlate.position.set(0.112, 0.13, 0.01);                           // 右镜腿外侧
  printPlate.rotation.y = Math.PI / 2;
  headScan.add(printPlate);

  // 导航相机（感知通道本体,方形像面匹配 64x64）
  const eye = new THREE.PerspectiveCamera(70, 1.0, 0.05, 25);
  eye.rotation.order = 'YXZ';
  eye.rotation.y = Math.PI;                                             // 朝机器人正前 +Z
  eye.rotation.x = -0.18;                                               // 微俯视近场地面
  eye.position.set(-0.104, 0.13, 0.11);                                 // 左镜腿相机窗处
  headScan.add(eye);

  /* ==========================================================
   * 3) 壁挂充电座（0.6 m,随资产交付；本地 x≈5.8 = 玄关右墙内面）
   * ========================================================== */
  const dock = new THREE.Group();
  dock.name = 'dock';
  dock.position.set(5.82, 0, 0);
  group.add(dock);
  box(0.34, 0.60, 0.07, M.shellD, 0, 0.90, 0, dock).rotation.y = Math.PI / 2; // 背板(贴墙)
  box(0.30, 0.10, 0.14, M.joint, -0.07, 0.68, 0, dock).rotation.y = Math.PI / 2; // 下托檐
  [[-0.05, 0.98], [-0.05, 1.06]].forEach(([dx, y]) =>
    box(0.012, 0.03, 0.10, M.pad, dx, y, 0, dock));                     // 两条铜触点(对接胸背触点高度)
  const dLed = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.05, 0.05), dockLed);
  dLed.position.set(-0.045, 1.16, 0);
  dock.add(dLed);
  cyl(0.014, 0.014, 0.32, 8, M.grey, 0.02, 1.36, 0, 0, 0, dock);        // 供电导管沿墙向上
  box(0.10, 0.12, 0.08, M.dark, 0.02, 1.56, 0, dock);                   // 接线箱(顶 1.62<身高)
  // 地面停机标线(黄框角)
  [[-0.55, -0.3], [-0.55, 0.3], [-1.15, -0.3], [-1.15, 0.3]].forEach(([dx, dz]) => {
    box(0.14, 0.006, 0.03, M.orange, dx, 0.004, dz + (dz > 0 ? 0.06 : -0.06), dock);
    box(0.03, 0.006, 0.14, M.orange, dx + (dx > -0.85 ? 0.06 : -0.06), 0.004, dz, dock);
  });
  {
    const a = new THREE.Object3D();
    a.name = 'poi_dock';
    a.position.set(-0.05, 0.95, 0);
    dock.add(a);
  }

  // POI 锚点（知识卡 info.json 对应）
  [['poi_visor', 0, 1.505, 0.10, headScan, 0, 0.115, 0.10],
   ['poi_lidar', 0, 0, 0, torsoP, 0, 0.16, 0.09],
   ['poi_battery', 0, 0, 0, torsoP, 0, 0.20, -0.14],
   ['poi_gait', 0, 0, 0, body, 0.10, 0.46, 0],
  ].forEach(([nm, , , , parent, x, y, z]) => {
    const a = new THREE.Object3D();
    a.name = nm;
    a.position.set(x, y, z);
    parent.add(a);
  });

  /* ==========================================================
   * 4) MuJoCo 烘焙步态（sim/run_gait.py,火星 g=3.71,详见 gait.json）
   *    js 符号:rotation.x 正 = 肢体向后;heave 米;pitch 正 = 前倾
   * ========================================================== */
  const GAIT = {
    walk: { T: 1.8, dt: 0.06, speed: 0.7506,
      hip_L: [-0.316,-0.352,-0.376,-0.380,-0.369,-0.315,-0.247,-0.176,-0.105,-0.037,0.028,0.092,0.152,0.209,0.260,0.305,0.346,0.384,0.405,0.331,0.253,0.180,0.109,0.041,-0.024,-0.087,-0.174,-0.259,-0.305,-0.316],
      hip_R: [0.307,0.348,0.387,0.403,0.329,0.251,0.177,0.107,0.040,-0.024,-0.087,-0.147,-0.201,-0.249,-0.287,-0.315,-0.351,-0.374,-0.374,-0.369,-0.316,-0.247,-0.175,-0.104,-0.035,0.032,0.129,0.232,0.292,0.307],
      knee_L: [0.332,0.183,0.130,0.129,0.115,0.122,0.139,0.153,0.163,0.167,0.167,0.165,0.163,0.161,0.160,0.160,0.163,0.171,0.182,0.219,0.365,0.543,0.711,0.848,0.937,0.971,0.849,0.596,0.393,0.332],
      knee_R: [0.161,0.164,0.173,0.181,0.218,0.364,0.542,0.711,0.848,0.937,0.971,0.945,0.860,0.723,0.543,0.332,0.183,0.131,0.127,0.117,0.122,0.139,0.154,0.163,0.168,0.169,0.167,0.163,0.161,0.161],
      ank_L: [-0.007,-0.033,-0.057,-0.092,-0.171,-0.205,-0.220,-0.227,-0.231,-0.235,-0.237,-0.235,-0.229,-0.216,-0.196,-0.167,-0.122,-0.049,0.034,0.069,0.083,0.091,0.094,0.092,0.087,0.078,0.055,0.022,-0.001,-0.007],
      ank_R: [-0.171,-0.125,-0.050,0.038,0.068,0.082,0.090,0.093,0.092,0.087,0.078,0.066,0.051,0.033,0.013,-0.007,-0.033,-0.057,-0.086,-0.172,-0.206,-0.220,-0.227,-0.230,-0.233,-0.234,-0.222,-0.198,-0.177,-0.171],
      sh_L: [0.260,0.274,0.276,0.258,0.221,0.196,0.160,0.115,0.065,0.011,-0.043,-0.095,-0.142,-0.184,-0.217,-0.241,-0.254,-0.256,-0.249,-0.232,-0.199,-0.160,-0.113,-0.060,-0.004,0.053,0.131,0.209,0.251,0.260],
      sh_R: [-0.241,-0.254,-0.256,-0.250,-0.232,-0.199,-0.160,-0.113,-0.060,-0.004,0.053,0.108,0.158,0.201,0.236,0.260,0.274,0.276,0.261,0.221,0.196,0.160,0.115,0.065,0.011,-0.043,-0.118,-0.192,-0.232,-0.241],
      elb_L: [-0.413,-0.432,-0.452,-0.471,-0.494,-0.509,-0.521,-0.531,-0.538,-0.540,-0.538,-0.533,-0.523,-0.510,-0.495,-0.477,-0.458,-0.438,-0.419,-0.399,-0.382,-0.370,-0.361,-0.355,-0.352,-0.353,-0.367,-0.390,-0.408,-0.413],
      elb_R: [-0.477,-0.458,-0.438,-0.419,-0.399,-0.382,-0.370,-0.361,-0.355,-0.352,-0.353,-0.358,-0.367,-0.380,-0.395,-0.413,-0.432,-0.452,-0.471,-0.494,-0.509,-0.521,-0.531,-0.538,-0.540,-0.538,-0.524,-0.500,-0.482,-0.477],
      pitch: [-0.026,-0.013,0.002,0.034,0.077,0.073,0.050,0.024,0.001,-0.018,-0.033,-0.043,-0.050,-0.051,-0.046,-0.035,-0.019,-0.002,0.029,0.077,0.076,0.054,0.029,0.006,-0.013,-0.027,-0.035,-0.034,-0.029,-0.026],
      heave: [-0.001,-0.012,-0.026,-0.041,-0.027,-0.014,-0.003,0.006,0.012,0.017,0.020,0.021,0.019,0.016,0.010,0.001,-0.010,-0.024,-0.041,-0.028,-0.013,-0.002,0.007,0.013,0.018,0.020,0.017,0.009,0.002,-0.001],
    },
    turn: { T: 1.2, dt: 0.06, speed: 0.1476,
      hip_L: [0.069,0.060,0.028,-0.029,-0.099,-0.154,-0.169,-0.144,-0.089,-0.019,0.034,0.058,0.069,0.079,0.092,0.107,0.118,0.108,0.081,0.069],
      hip_R: [0.022,0.046,0.057,0.067,0.081,0.097,0.110,0.114,0.106,0.090,0.080,0.070,0.039,-0.018,-0.086,-0.139,-0.154,-0.090,-0.003,0.022],
      knee_L: [0.102,0.110,0.166,0.271,0.394,0.492,0.533,0.507,0.419,0.291,0.185,0.135,0.116,0.112,0.115,0.122,0.129,0.123,0.108,0.102],
      knee_R: [0.178,0.128,0.109,0.105,0.108,0.116,0.124,0.125,0.119,0.112,0.108,0.116,0.172,0.278,0.402,0.501,0.542,0.427,0.243,0.178],
      ank_L: [0.061,0.058,0.052,0.053,0.056,0.063,0.079,0.057,-0.001,-0.022,-0.023,-0.035,-0.050,-0.070,-0.083,-0.081,-0.064,-0.003,0.054,0.061],
      ank_R: [-0.032,-0.045,-0.062,-0.082,-0.093,-0.088,-0.069,-0.027,0.026,0.055,0.070,0.066,0.059,0.063,0.068,0.078,0.094,0.045,-0.020,-0.032],
      sh_L: [-0.027,-0.016,-0.011,-0.008,-0.006,-0.004,-0.003,-0.004,-0.005,-0.006,-0.007,-0.009,-0.015,-0.027,-0.045,-0.062,-0.073,-0.062,-0.036,-0.027],
      sh_R: [-0.006,-0.007,-0.013,-0.026,-0.043,-0.060,-0.071,-0.072,-0.062,-0.045,-0.029,-0.018,-0.012,-0.009,-0.007,-0.006,-0.005,-0.006,-0.006,-0.006],
      elb_L: [-0.419,-0.419,-0.418,-0.418,-0.418,-0.418,-0.418,-0.418,-0.418,-0.419,-0.420,-0.420,-0.419,-0.418,-0.418,-0.418,-0.420,-0.420,-0.420,-0.419],
      elb_R: [-0.419,-0.419,-0.418,-0.417,-0.417,-0.418,-0.419,-0.420,-0.420,-0.420,-0.420,-0.419,-0.419,-0.419,-0.418,-0.418,-0.419,-0.419,-0.419,-0.419],
      pitch: [-0.050,-0.037,-0.027,-0.022,-0.025,-0.032,-0.036,-0.031,-0.020,-0.007,0.007,0.021,0.030,0.034,0.032,0.026,0.022,0.007,-0.028,-0.050],
      heave: [0.026,0.023,0.020,0.017,0.013,0.008,0.004,0.001,0.002,0.004,0.004,0.001,-0.003,-0.007,-0.011,-0.016,-0.020,-0.010,0.013,0.026],
    },
    idle: { T: 4.8, dt: 0.12, speed: 0,
      hip_L: [0.084,0.083,0.081,0.079,0.077,0.075,0.073,0.071,0.069,0.067,0.065,0.064,0.063,0.062,0.061,0.061,0.061,0.062,0.063,0.064,0.065,0.067,0.069,0.071,0.073,0.075,0.077,0.079,0.081,0.083,0.084,0.086,0.087,0.088,0.088,0.087,0.086,0.085,0.085,0.084],
      hip_R: [0.084,0.083,0.081,0.079,0.077,0.075,0.073,0.071,0.069,0.067,0.065,0.064,0.063,0.062,0.061,0.061,0.061,0.062,0.063,0.064,0.065,0.067,0.069,0.071,0.073,0.075,0.077,0.079,0.081,0.083,0.084,0.086,0.087,0.088,0.088,0.087,0.086,0.085,0.085,0.084],
      knee_L: [0.127,0.123,0.119,0.115,0.111,0.107,0.103,0.100,0.098,0.096,0.094,0.094,0.093,0.094,0.095,0.097,0.099,0.102,0.105,0.108,0.112,0.116,0.120,0.124,0.128,0.132,0.135,0.138,0.141,0.143,0.144,0.145,0.145,0.145,0.143,0.138,0.133,0.129,0.127,0.127],
      knee_R: [0.127,0.123,0.119,0.115,0.111,0.107,0.103,0.100,0.098,0.096,0.094,0.094,0.093,0.094,0.095,0.097,0.099,0.102,0.105,0.108,0.112,0.116,0.120,0.124,0.128,0.132,0.135,0.138,0.141,0.143,0.144,0.145,0.145,0.145,0.143,0.138,0.133,0.129,0.127,0.127],
      ank_L: [-0.006,-0.006,-0.006,-0.005,-0.005,-0.004,-0.004,-0.003,-0.003,-0.002,-0.001,-0.001,-0.001,0,0,0,0.001,0.001,0.001,0,0,0,0,-0.001,-0.001,-0.002,-0.002,-0.003,-0.004,-0.004,-0.005,-0.005,-0.006,-0.006,-0.006,-0.006,-0.006,-0.006,-0.006,-0.006],
      ank_R: [-0.006,-0.006,-0.006,-0.005,-0.005,-0.004,-0.004,-0.003,-0.003,-0.002,-0.001,-0.001,-0.001,0,0,0,0.001,0.001,0.001,0,0,0,0,-0.001,-0.001,-0.002,-0.002,-0.003,-0.004,-0.004,-0.005,-0.005,-0.006,-0.006,-0.006,-0.006,-0.006,-0.006,-0.006,-0.006],
      sh_L: [-0.002,-0.010,-0.018,-0.026,-0.033,-0.039,-0.045,-0.050,-0.054,-0.056,-0.058,-0.058,-0.057,-0.055,-0.051,-0.047,-0.041,-0.035,-0.028,-0.021,-0.013,-0.005,0.003,0.011,0.018,0.024,0.030,0.035,0.039,0.041,0.043,0.043,0.042,0.040,0.033,0.023,0.012,0.004,-0.001,-0.002],
      sh_R: [-0.002,-0.010,-0.018,-0.026,-0.033,-0.039,-0.045,-0.050,-0.054,-0.056,-0.058,-0.058,-0.057,-0.055,-0.051,-0.047,-0.041,-0.035,-0.028,-0.021,-0.013,-0.005,0.003,0.011,0.018,0.024,0.030,0.035,0.039,0.041,0.043,0.043,0.042,0.040,0.033,0.023,0.012,0.004,-0.001,-0.002],
      elb_L: [-0.395,-0.401,-0.407,-0.413,-0.419,-0.424,-0.429,-0.433,-0.436,-0.438,-0.439,-0.439,-0.439,-0.437,-0.434,-0.431,-0.427,-0.422,-0.416,-0.410,-0.404,-0.398,-0.392,-0.386,-0.380,-0.375,-0.370,-0.367,-0.364,-0.361,-0.360,-0.360,-0.361,-0.362,-0.367,-0.375,-0.384,-0.391,-0.394,-0.395],
      elb_R: [-0.395,-0.401,-0.407,-0.413,-0.419,-0.424,-0.429,-0.433,-0.436,-0.438,-0.439,-0.439,-0.439,-0.437,-0.434,-0.431,-0.427,-0.422,-0.416,-0.410,-0.404,-0.398,-0.392,-0.386,-0.380,-0.375,-0.370,-0.367,-0.364,-0.361,-0.360,-0.360,-0.361,-0.362,-0.367,-0.375,-0.384,-0.391,-0.394,-0.395],
      pitch: [0.027,0.037,0.045,0.053,0.059,0.064,0.067,0.069,0.069,0.067,0.063,0.058,0.052,0.044,0.035,0.025,0.015,0.004,-0.007,-0.017,-0.028,-0.037,-0.046,-0.053,-0.060,-0.064,-0.067,-0.069,-0.069,-0.067,-0.063,-0.058,-0.052,-0.044,-0.030,-0.012,0.006,0.019,0.026,0.027],
      heave: [-0.015,-0.017,-0.019,-0.020,-0.021,-0.021,-0.021,-0.020,-0.019,-0.017,-0.015,-0.012,-0.009,-0.006,-0.002,0.001,0.004,0.007,0.010,0.013,0.015,0.017,0.018,0.020,0.020,0.020,0.020,0.019,0.018,0.017,0.015,0.012,0.009,0.007,0.002,-0.004,-0.009,-0.013,-0.014,-0.015],
    },
  };
  const cyc = (g, ch, ph) => {                  // 循环线性插值(ph 单位:圈)
    const arr = g[ch], n = arr.length;
    const x = ((ph % 1) + 1) % 1 * n;
    const i = Math.floor(x) % n, f = x - Math.floor(x);
    return arr[i] * (1 - f) + arr[(i + 1) % n] * f;
  };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ss01 = s => { s = clamp(s, 0, 1); return s * s * (3 - 2 * s); };

  // 步态相位与混合权重（v m/s, w rad/s -> 全身关节）
  const PH = { walk: 0, turn: 0, greetW: 0 };
  const STRIDE = GAIT.walk.speed * GAIT.walk.T;                         // 1.351 m/圈
  function applyGait(t, dt, v, w) {
    PH.walk += Math.abs(v) * dt / STRIDE;
    PH.turn += Math.abs(w) / 0.9 * dt / GAIT.turn.T;
    const idlePh = (t / GAIT.idle.T) % 1;
    const wWalk = ss01(Math.abs(v) / 0.25);
    const wTurn = (1 - wWalk) * ss01(Math.abs(w) / 0.4);
    const wIdle = 1 - wWalk - wTurn;
    const J = ch =>
      wIdle * cyc(GAIT.idle, ch, idlePh) +
      wWalk * cyc(GAIT.walk, ch, PH.walk) +
      wTurn * cyc(GAIT.turn, ch, PH.turn);
    legs.L.hip.rotation.x = J('hip_L');
    legs.R.hip.rotation.x = J('hip_R');
    legs.L.knee.rotation.x = J('knee_L');
    legs.R.knee.rotation.x = J('knee_R');
    legs.L.ankle.rotation.x = J('ank_L');
    legs.R.ankle.rotation.x = J('ank_R');
    arms.L.sh.rotation.x = J('sh_L');
    arms.L.elb.rotation.x = J('elb_L');
    // 右臂:迎宾时平滑接管为举手挥动(0.4s smoothstep 淡入淡出)
    const gw = PH.greetW;
    arms.R.sh.rotation.x = (1 - gw) * J('sh_R') + gw * (-2.25 + 0.10 * Math.sin(t * 6));
    arms.R.sh.rotation.z = gw * (-0.25 + 0.18 * Math.sin(t * 6));
    arms.R.elb.rotation.x = (1 - gw) * J('elb_R') + gw * (-0.45 + 0.22 * Math.sin(t * 6 + 1.2));
    // 回放安全包络:俯仰只给上身且 x0.6,heave x0.8 并托底(脚不穿地坪)
    torsoP.rotation.x = 0.6 * J('pitch');
    body.position.y = Math.max(-0.015, 0.8 * J('heave'));
  }

  /* ==========================================================
   * 5) 胸口闪光 LiDAR:15 束 x 90°,20 m,Raycaster 对场景根求交
   *    (工程近似;链路预算见知识卡:3 uJ/脉冲 @905nm, PDE 40.3%)
   * ========================================================== */
  const LIDAR = {
    n: 15, fov: Math.PI / 2, range: 20, hz: 6,
    profile: new Float32Array(15).fill(20), stamp: -1, scans: 0,
  };
  const _ray = new THREE.Raycaster();
  _ray.far = LIDAR.range;
  const _o = new THREE.Vector3(), _d = new THREE.Vector3(), _q = new THREE.Quaternion();
  // debug 扇区可视化(LineSegments,默认关;?debug=1 或 action 开)
  const dbgGeo = new THREE.BufferGeometry();
  dbgGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(LIDAR.n * 6), 3));
  const dbgLines = new THREE.LineSegments(dbgGeo,
    new THREE.LineBasicMaterial({ color: 0x35e055, transparent: true, opacity: 0.55, depthWrite: false }));
  dbgLines.visible = false;
  dbgLines.frustumCulled = false;
  group.add(dbgLines);
  // 905 nm 对相机不可见:调试射线只是可视化覆盖层,绝不能进导航相机
  // (否则机器人会怕自己的激光——自视污染,矿场"避开自己滚筒"坑账同族)
  dbgLines.onBeforeRender = (r, s, cam) => { if (cam === eye) dbgLines.material.opacity = 0; };
  dbgLines.onAfterRender = () => { dbgLines.material.opacity = 0.55; };
  let debugOn = false;
  try { debugOn = typeof location !== 'undefined' && /[?&]debug=1/.test(location.search); } catch { /* headless */ }
  dbgLines.visible = debugOn;

  function lidarScan(t) {
    if (t - LIDAR.stamp < 1 / LIDAR.hz) return;
    LIDAR.stamp = t;
    LIDAR.scans++;
    const root = group.parent;
    if (!root) return;
    const targets = root.children.filter(c => c !== group);
    lidarAnchor.getWorldPosition(_o);
    body.getWorldQuaternion(_q);
    const pos = dbgGeo.attributes.position.array;
    for (let i = 0; i < LIDAR.n; i++) {
      const a = LIDAR.fov * (i / (LIDAR.n - 1) - 0.5);                  // +a -> +X 侧(左)
      _d.set(Math.sin(a), 0, Math.cos(a)).applyQuaternion(_q).normalize();
      _ray.set(_o, _d);
      const hit = _ray.intersectObjects(targets, true)[0];
      const dist = hit ? hit.distance : LIDAR.range;
      LIDAR.profile[i] = dist;
      if (dbgLines.visible) {                                           // 世界系 -> group 本地
        const gp = group.worldToLocal(_o.clone());
        const ge = group.worldToLocal(_o.clone().addScaledVector(_d, dist));
        pos[i * 6] = gp.x; pos[i * 6 + 1] = gp.y; pos[i * 6 + 2] = gp.z;
        pos[i * 6 + 3] = ge.x; pos[i * 6 + 4] = ge.y; pos[i * 6 + 5] = ge.z;
      }
    }
    if (dbgLines.visible) dbgGeo.attributes.position.needsUpdate = true;
  }
  // 前扇区最近距 / 左右侧净空(避障用)
  const lidarFront = () => Math.min(LIDAR.profile[6], LIDAR.profile[7], LIDAR.profile[8]);
  const lidarSide = left => {
    let s = 0;
    for (let i = 0; i < 6; i++) s += LIDAR.profile[left ? 9 + i : i];
    return s / 6;
  };

  /* ==========================================================
   * 6) CIS 成像模型(五阶段验证参数原样移植)+ 暗区分割
   * ========================================================== */
  const W = 64, H = 64;
  const sensor = { id: 'nav', camera: eye, width: W, height: H, hz: 5, data: null, frame: 0, stamp: 0 };
  group.userData.sensors = [sensor];
  const CIS = {
    N: 64, FWC: 17880, LSB: 16.5, READ: 1.76, DARK: 170,
    expMs: 30, EXP0: 12, KEXP: 13400,          // 室内暗,初始曝光放宽,AE 自收敛
    meanDN: 0, dn: new Uint8ClampedArray(W * H),
    deadRate: 0, hotRate: 0, readMult: 1, defMap: null, _defKey: -1,
  };
  const buildDefMap = () => {
    if (!CIS.defMap) CIS.defMap = new Int8Array(W * H);
    for (let i = 0; i < W * H; i++) {
      const h = hash3((i & 63) + 0.5, (i >> 6) + 0.5, 3.7);
      CIS.defMap[i] = h < CIS.deadRate ? -1 : (h > 1 - CIS.hotRate ? 1 : 0);
    }
  };
  let _g2 = null;
  const gauss = () => {
    if (_g2 !== null) { const v = _g2; _g2 = null; return v; }
    const u = Math.max(1e-9, rnd()), v = rnd();
    const r = Math.sqrt(-2 * Math.log(u));
    _g2 = r * Math.sin(6.2832 * v);
    return r * Math.cos(6.2832 * v);
  };
  const dnFrame = new Uint16Array(W * H);
  const VIS = { hazL: 0, hazR: 0 };
  function perceive(px) {
    const dkey = CIS.deadRate * 1e4 + CIS.hotRate;
    if (dkey !== CIS._defKey) { buildDefMap(); CIS._defKey = dkey; }
    const kE = CIS.KEXP * (CIS.expMs / CIS.EXP0);
    const nDark = CIS.DARK * CIS.expMs / 1000;
    const rn = CIS.READ * CIS.readMult, rn2 = rn * rn;
    for (let i = 0; i < W * H; i++) {
      const luma01 = (px[4 * i] * 0.35 + px[4 * i + 1] * 0.5 + px[4 * i + 2] * 0.15) / 255;
      const ne = luma01 * kE + nDark;
      const noisy = ne + gauss() * Math.sqrt(ne + rn2);
      let dn = Math.min(1023, Math.round(Math.min(CIS.FWC, Math.max(0, noisy)) / CIS.LSB));
      const def = CIS.defMap[i];
      if (def === -1) dn = 0; else if (def === 1) dn = 1023;
      dnFrame[i] = dn;
      CIS.dn[i] = dn >> 2;
    }
    // 扫描带:底部 12~28 行 ≈ 前方 1~4.5 m 近场(下缘避开自己的胸壳;
    // 上限必须收窄——看太远会把远处深色墙面/门体当持续威胁,矿场坑账同款)
    let sum = 0, n = 0;
    for (let y = 12; y < 28; y++) for (let x = 0; x < W; x++) { sum += dnFrame[y * W + x]; n++; }
    const mean = sum / n;
    CIS.meanDN = mean;
    CIS.expMs = Math.min(400, Math.max(1.5, CIS.expMs * Math.min(1.45, Math.max(0.7, 400 / Math.max(20, mean)))));
    const thr = mean * 0.72;                    // 自适应阈值:暗于均值 28% 判危险
    let hl = 0, hr = 0;
    for (let y = 12; y < 28; y++) for (let x = 0; x < W; x++) {
      if (dnFrame[y * W + x] < thr) { if (x < W / 2) hl++; else hr++; }
    }
    VIS.hazL = hl / (W * 8); VIS.hazR = hr / (W * 8);
  }

  /* ==========================================================
   * 7) 行为层:巡逻(8字) -> 避障 -> 迎宾 -> 回充,电量账本
   *    烘焙(纯 t)与自主(状态机)共用步态/迎宾/表情基础设施
   * ========================================================== */
  // 8 字巡逻路径(Gerono 双纽线,本地系;推荐挂载点=玄关大厅中段)
  const P8 = { Wx: 2.6, Lz: 5.2, T: 75 };
  const p8 = u => ({ x: P8.Wx * Math.sin(2 * u), z: P8.Lz * Math.sin(u) });
  const p8head = u => {
    const e = 1e-3, a = p8(u), b = p8(u + e);
    return Math.atan2(b.x - a.x, b.z - a.z);
  };
  // 自主巡逻用的采样路点(同一条 8 字)
  const WPS = [];
  for (let k = 0; k < 24; k++) {
    const u = (k / 24) * Math.PI * 2;
    WPS.push(p8(u));
  }
  // 电量账本(知识卡同源):行走 80 W / 待机 12 W / 充电 150 W / 260 Wh 电池;
  // 演示加速 x60(1 真秒=1 分钟班次时间),4h 班次在演示里约 4 分钟
  const BATT = { soc: 0.86, CAP: 260, P_WALK: 80, P_IDLE: 12, P_CHG: 150, ACCEL: 60 };
  const S = {
    mode: 'baked',                              // 遥测:baked|auto
    state: 'patrol',                            // patrol|greet|toDock|charge
    pos: { x: 0, z: 0 }, head: 0, v: 0, w: 0,
    wp: 0, pauseT: 0, greetCool: 0, avoidT: 0, expr: '',
  };
  const DOCK_AT = { x: 4.95, z: 0 }, DOCK_HEAD = Math.PI / 2;           // 面向 +X 贴墙
  const angTo = (tx, tz) => {
    let e = Math.atan2(tx - S.pos.x, tz - S.pos.z) - S.head;
    while (e > Math.PI) e -= 2 * Math.PI;
    while (e < -Math.PI) e += 2 * Math.PI;
    return e;
  };

  // 表情屏(spec:待机◡ 巡逻→ 避障! 迎宾◠ 充电z)
  const FACE = { idle: '◡ ◡', patrol: '→ →', alert: '! !', greet: '◠ ◠', charge: 'z z', low: '▂ ▂' };
  let lastFaceKey = '';
  function drawFace(expr) {
    const key = expr + '|' + Math.round(BATT.soc * 20);
    if (!faceCtx || key === lastFaceKey) return;
    lastFaceKey = key;
    faceCtx.fillStyle = '#08131a';
    faceCtx.fillRect(0, 0, 256, 96);
    faceCtx.fillStyle = expr === 'alert' ? '#ffb24a' : expr === 'low' ? '#ff5040' : '#7de8ff';
    faceCtx.font = '600 58px system-ui, monospace';
    faceCtx.textAlign = 'center';
    faceCtx.textBaseline = 'middle';
    faceCtx.fillText(FACE[expr] || FACE.idle, 128, 44);
    faceCtx.fillStyle = '#123241';
    faceCtx.fillRect(78, 82, 100, 7);
    faceCtx.fillStyle = BATT.soc < 0.25 ? '#ff5040' : '#39d98a';
    faceCtx.fillRect(78, 82, 100 * BATT.soc, 7);
    faceTex.needsUpdate = true;
  }
  function setExpr(e) { S.expr = e; drawFace(e); }

  // 玩家位置(总控扩展契约:ctx.player=[x,y,z] 世界系;缺省=不迎宾)
  const _pv = new THREE.Vector3();
  function playerLocal(ctx) {
    const p = ctx && (ctx.player || ctx.playerPos);
    if (!p) return null;
    if (Array.isArray(p)) _pv.set(p[0], p[1] || 0, p[2]);
    else if (p.isVector3) _pv.copy(p);
    else _pv.set(p.x, p.y || 0, p.z);
    return group.worldToLocal(_pv);             // group 静止,本地系稳定
  }
  // 迎宾判定(两模式共用):2.5 m 进入,3.2 m + 1.5 s 退出
  const GREET = { on: false, offT: 0 };
  function updateGreet(pl, dt) {
    if (pl) {
      const d = Math.hypot(pl.x - S.pos.x, pl.z - S.pos.z);
      if (!GREET.on && d < 2.5 && S.state !== 'charge' && S.state !== 'toDock') { GREET.on = true; GREET.offT = 0; }
      if (GREET.on) {
        if (d > 3.2) { GREET.offT += dt; if (GREET.offT > 1.5) GREET.on = false; }
        else GREET.offT = 0;
      }
    } else GREET.on = false;
    PH.greetW = clamp(PH.greetW + (GREET.on ? 2.5 : -2.5) * dt, 0, 1);
  }

  function applyBody() {
    body.position.x = S.pos.x;
    body.position.z = S.pos.z;
    body.rotation.y = S.head;
  }
  function faceByState() {
    if (S.state === 'charge') setExpr('charge');
    else if (BATT.soc < 0.25 || S.state === 'toDock') setExpr('low');
    else if (PH.greetW > 0.5) setExpr('greet');
    else if (S.avoidT > 0) setExpr('alert');
    else if (Math.abs(S.v) > 0.05) setExpr('patrol');
    else setExpr('idle');
  }

  // ---- 烘焙巡逻(纯 t 的 8 字循环;迎宾以"暂停时钟"叠加,恢复即无缝接上) ----
  // SEAM:自主->烘焙交接的位置/朝向混合(断供接管不跳变)
  const SEAM = { x: 0, z: 0, head: 0, w: 0 };
  function bakedLoop(t, dt, pl) {
    updateGreet(pl, dt);
    if (PH.greetW > 0.02) S.pauseT += dt * PH.greetW;
    const te = t - S.pauseT;
    const u = (te / P8.T) * Math.PI * 2;
    let p = p8(u), h = p8head(u);
    if (SEAM.w > 0) {                           // 1.5 s 内从断供点滑回路径
      SEAM.w = Math.max(0, SEAM.w - dt / 1.5);
      const k = ss01(SEAM.w);
      p = { x: k * SEAM.x + (1 - k) * p.x, z: k * SEAM.z + (1 - k) * p.z };
      let dh = h - SEAM.head;
      while (dh > Math.PI) dh -= 2 * Math.PI;
      while (dh < -Math.PI) dh += 2 * Math.PI;
      h = SEAM.head + dh * (1 - k);
    }
    const e = 0.5, pn = p8(u + e * Math.PI * 2 / P8.T), hn = p8head(u + e * Math.PI * 2 / P8.T);
    const v = Math.hypot(pn.x - p.x, pn.z - p.z) / e;                   // 路径瞬时速度(纯 t)
    let dw = hn - h;
    while (dw > Math.PI) dw -= 2 * Math.PI;
    while (dw < -Math.PI) dw += 2 * Math.PI;
    const w = dw / e;
    S.pos.x = p.x; S.pos.z = p.z;
    // 迎宾:朝向按权重转向玩家,速度按权重压零(相位冻结由 pauseT 完成)
    let head = h;
    if (PH.greetW > 0.02 && pl) {
      const pa = Math.atan2(pl.x - p.x, pl.z - p.z);
      let d2 = pa - h;
      while (d2 > Math.PI) d2 -= 2 * Math.PI;
      while (d2 < -Math.PI) d2 += 2 * Math.PI;
      head = h + d2 * PH.greetW;
    }
    S.head = head;
    S.v = v * (1 - PH.greetW); S.w = w * (1 - PH.greetW);
    applyGait(t, dt, S.v, S.w);
    applyBody();
    faceByState();
  }

  // ---- 自主状态机(传感器供帧后粘性进入) ----
  function control(t, dt, pl) {
    updateGreet(pl, dt);
    S.avoidT = Math.max(0, S.avoidT - dt);
    let v = 0, w = 0;
    if (GREET.on && S.state !== 'toDock' && S.state !== 'charge') S.state = 'greet';
    else if (S.state === 'greet' && !GREET.on) S.state = 'patrol';

    if (S.state === 'patrol') {
      const wp = WPS[S.wp];
      const steer = angTo(wp.x, wp.z);
      v = Math.abs(steer) < 0.8 ? 0.55 : 0.10;
      w = clamp(steer * 1.6, -1.0, 1.0);
      if (Math.hypot(wp.x - S.pos.x, wp.z - S.pos.z) < 0.55) S.wp = (S.wp + 1) % WPS.length;
      if (BATT.soc < 0.25) S.state = 'toDock';
    } else if (S.state === 'greet') {
      const steer = pl ? angTo(pl.x, pl.z) : 0;                         // 停下,面向玩家
      v = 0;
      w = clamp(steer * 2.0, -1.2, 1.2) * PH.greetW;
    } else if (S.state === 'toDock') {
      const steer = angTo(DOCK_AT.x, DOCK_AT.z);
      v = Math.abs(steer) < 0.8 ? 0.5 : 0.08;
      w = clamp(steer * 1.6, -1.0, 1.0);
      if (Math.hypot(DOCK_AT.x - S.pos.x, DOCK_AT.z - S.pos.z) < 0.22) S.state = 'align';
    } else if (S.state === 'align') {
      let e = DOCK_HEAD - S.head;                                       // 原地对准充电触点
      while (e > Math.PI) e -= 2 * Math.PI;
      while (e < -Math.PI) e += 2 * Math.PI;
      v = 0; w = clamp(e * 2.0, -1.0, 1.0);
      if (Math.abs(e) < 0.1) S.state = 'charge';
    } else if (S.state === 'charge') {
      v = 0; w = 0;
      if (BATT.soc > 0.95) { S.state = 'patrol'; S.wp = 0; }
    }

    // LiDAR 近距避障(<1.2 m 转向净空侧;<0.5 m 急停原地转)——回充末段豁免
    const docking = (S.state === 'toDock' && Math.hypot(DOCK_AT.x - S.pos.x, DOCK_AT.z - S.pos.z) < 1.6)
      || S.state === 'align' || S.state === 'charge';
    if (!docking && S.state !== 'greet') {
      const f = lidarFront();
      if (f < 1.2) {
        const turnL = lidarSide(true) > lidarSide(false);
        w = clamp(w + (turnL ? 1.2 : -1.2) * (1.2 - f), -1.4, 1.4);
        v = Math.min(v, Math.max(0, (f - 0.5) * 0.6));
        S.avoidT = 0.6;
      }
      // 视觉暗区(CIS 亮度分割):暗侧回避、减速
      const hz = VIS.hazL + VIS.hazR;
      if (v > 0.2 && hz > 0.06) {
        w += (VIS.hazL > VIS.hazR ? -1 : 1) * 1.2 * Math.min(1, hz * 4);
        v *= Math.max(0.3, 1 - hz * 3);
        S.avoidT = 0.6;
      }
    }
    // 地理围栏(玄关净空区,本地系):越界转向中心
    if (Math.abs(S.pos.x) > 4.3 && !docking || S.pos.z > 8.5 || S.pos.z < -9.3) {
      const back = angTo(0, 0);
      w = clamp(back * 2, -1.2, 1.2);
      v = Math.min(v, 0.3);
    }
    // 电量账本(演示加速 x60)
    const P = S.state === 'charge' ? -BATT.P_CHG : (Math.abs(v) > 0.05 ? BATT.P_WALK : BATT.P_IDLE);
    BATT.soc = clamp(BATT.soc - P * BATT.ACCEL * dt / 3600 / BATT.CAP, 0, 1);
    // 差速积分
    S.head += w * dt;
    S.pos.x += Math.sin(S.head) * v * dt;
    S.pos.z += Math.cos(S.head) * v * dt;
    S.v = v; S.w = w;
    applyGait(t, dt, v, w);
    applyBody();
    // 迎宾/充电时颈部朝向玩家/回正
    if (pl && PH.greetW > 0.02) {
      const na = angTo(pl.x, pl.z);
      neck.rotation.y = clamp(na, -0.6, 0.6) * PH.greetW;
    } else neck.rotation.y *= Math.max(0, 1 - 3 * dt);
    faceByState();
    // 状态灯:巡逻绿/充电琥珀呼吸
    if (S.state === 'charge') {
      ledMat.emissive.setHex(0xffb020);
      ledMat.emissiveIntensity = 1.1 + 0.6 * Math.sin(t * 2.2);
      dockLed.emissiveIntensity = 1.1 + 0.6 * Math.sin(t * 2.2);
    } else {
      ledMat.emissive.setHex(BATT.soc < 0.25 ? 0xff4030 : 0x35e055);
      ledMat.emissiveIntensity = 1.6;
      dockLed.emissiveIntensity = 1.6;
    }
  }

  /* ---------------- 统一入口:优雅降级(SENSOR_SPEC §2 消费模式) -------- */
  let lastFrame = 0, seenFrame = 0, autoOn = false;
  group.userData.animate = (t, dt, ctx) => {
    dt = Math.min(dt || 0.016, 0.1);
    lidarScan(t);                               // 自带测距,两模式都在跑(debug 可视化)
    const pl = playerLocal(ctx);
    if (S.disabled) { S.mode = 'baked'; bakedLoop(t, dt, pl); return; }
    if (sensor.frame > seenFrame) { seenFrame = sensor.frame; autoOn = true; } // 供帧(恢复)即自主
    if (autoOn && t - sensor.stamp > 3) {       // 断供 3 s:无缝交还烘焙路线
      autoOn = false;
      SEAM.x = S.pos.x; SEAM.z = S.pos.z; SEAM.head = S.head; SEAM.w = 1;
      let bu = 0, bd = 1e9;                     // 相位对齐:纯 t 路径上最近点
      for (let k = 0; k < 96; k++) {
        const uu = (k / 96) * Math.PI * 2, pp = p8(uu);
        const d2 = (pp.x - S.pos.x) ** 2 + (pp.z - S.pos.z) ** 2;
        if (d2 < bd) { bd = d2; bu = uu; }
      }
      S.pauseT = t - (bu / (Math.PI * 2)) * P8.T;
    }
    if (!autoOn) { S.mode = 'baked'; bakedLoop(t, dt, pl); return; }
    S.mode = 'auto';
    if (sensor.frame !== lastFrame) {           // 感知 5 Hz,控制每帧
      lastFrame = sensor.frame;
      perceive(sensor.data);
    }
    control(t, dt, pl);
  };

  /* ---------------- 引擎接口与遥测 ---------------- */
  group.userData.oscillators = [                // 头部/眼镜扫视(统一运动词汇)
    { node: 'head_scan', axis: 'y', amp: 0.26, period: 6.5 },
  ];
  group.userData.nightMats = [ledMat, dockLed, lidarEmit];
  group.userData.actions = {
    '雷达可视化': () => { dbgLines.visible = !dbgLines.visible; },
    '召回充电': () => { if (S.mode === 'auto') S.state = 'toDock'; },
  };
  group.userData.autonomy = S;                  // 只读遥测:mode/state/pos/soc 经 BATT
  group.userData.battery = BATT;
  group.userData.lidar = LIDAR;
  group.userData.cis = CIS;
  group.userData.vis = VIS;                     // 视觉危险量遥测(幻影基准测试用)
  group.userData.eye = eye;

  return group;
}
