// sci-weather-net-01 — 气象观测网远端杆(scatter 散件包,sci-weather-01 的城外围观测网)
// 契约:导出 meta + builders;每 builder 接收 THREE 返回 Group;1u=1m、原点=地面中心、
// 每件 ≤800 三角形;夜光→userData.nightMats、闪烁→userData.blinkMats;撒放归引擎/总控。
// 存在意义(设计轮 #14, E:\Claude\mars-weather\sim_network_triangulation.py):
// 主站+3 远端的到达时差平面波反演给出尘暴前锋速度矢量(σ_v 4-5% / σ_az 2-3°,
// 提前量 1-3.5 分钟)——单站只能报"来了",网才能报"从哪来、多快、几分钟到"。
// 建议撒放:主站 (300,-300) 外围 1.5~2.2 km、方位岔开 ≥90°,3 件(A/B/C 各一)。

export const meta = {
  id: 'sci-weather-net-01',
  name: '气象观测网远端杆',
  name_en: 'Weather Network Remote Poles',
  kind: 'scatter',
};

function std(THREE, opts) {
  return new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.85, metalness: 0.12 }, opts));
}
function box(THREE, g, w, h, d, mat, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  g.add(m);
  return m;
}
function cyl(THREE, g, r1, r2, h, seg, mat, x, y, z) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), mat);
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  g.add(m);
  return m;
}
function poi(THREE, g, id, x, y, z) {
  const a = new THREE.Object3D();
  a.name = 'poi_' + id;
  a.position.set(x, y, z);
  g.add(a);
}
function mats(THREE) {
  const dust = new THREE.Color(0x9e5b3d);
  const M = {
    steel: std(THREE, { color: 0x9aa0a6, metalness: 0.4, roughness: 0.6 }),
    dark: std(THREE, { color: 0x565b61, metalness: 0.35 }),
    white: std(THREE, { color: 0xe9ebec, roughness: 0.75 }),
    orange: std(THREE, { color: 0xe8621f }),
    pv: std(THREE, { color: 0x1b2a49, metalness: 0.5, roughness: 0.35 }),
    copper: std(THREE, { color: 0x9a6a3a, metalness: 0.6, roughness: 0.5 }),
    pad: std(THREE, { color: 0x6f635a, roughness: 1.0 }),
  };
  Object.values(M).forEach(m => m.color.lerp(dust, 0.05));   // 尘膜 pass
  return M;
}
function ledGreen(THREE) {
  return new THREE.MeshStandardMaterial({
    color: 0x46ff92, emissive: 0x46ff92, emissiveIntensity: 0.3, roughness: 0.4 });
}
function beaconAmber(THREE) {
  return new THREE.MeshStandardMaterial({
    color: 0xffb020, emissive: 0xcc8010, emissiveIntensity: 2.0, roughness: 0.4 });
}

export const builders = {

  // A. 标准远端杆 2.2 m —— 迷你热膜头 + 基座气压墩 + PV + UHF 鞭天线,三脚锚
  netMastA(THREE) {
    const g = new THREE.Group();
    const M = mats(THREE);
    box(THREE, g, 0.7, 0.1, 0.7, M.pad, 0, 0.05, 0);                       // 基础板
    cyl(THREE, g, 0.035, 0.05, 2.1, 8, M.steel, 0, 1.15, 0);               // 锥杆
    for (let i = 0; i < 3; i++) {                                          // 三脚斜撑+配重石袋
      const a = (i / 3) * Math.PI * 2 + 0.5;
      const leg = cyl(THREE, g, 0.018, 0.018, 1.0, 6, M.dark,
        Math.cos(a) * 0.28, 0.48, Math.sin(a) * 0.28);
      leg.lookAt(Math.cos(a) * 0.56, 0, Math.sin(a) * 0.56);
      leg.rotateX(Math.PI / 2);
      box(THREE, g, 0.22, 0.14, 0.22, M.pad, Math.cos(a) * 0.55, 0.07, Math.sin(a) * 0.55);
    }
    // 迷你热膜头(环罩+3 片)
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.014, 6, 16), M.white);
    ring.rotation.x = Math.PI / 2; ring.position.y = 2.24; g.add(ring);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const fin = box(THREE, g, 0.012, 0.06, 0.036, M.copper,
        Math.cos(a) * 0.072, 2.24, Math.sin(a) * 0.072);
      fin.rotation.y = -a;
    }
    // 气压墩(鹅颈进气)+ 电子盒 + 状态灯
    box(THREE, g, 0.3, 0.26, 0.24, M.white, 0.22, 0.28, 0);
    const neck = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.014, 6, 10, Math.PI), M.steel);
    neck.position.set(0.22, 0.46, 0.08); neck.rotation.y = Math.PI / 2; g.add(neck);
    const led = ledGreen(THREE);
    box(THREE, g, 0.05, 0.035, 0.02, led, 0.22, 0.24, 0.13);
    // PV 板 + UHF 鞭
    const pv = box(THREE, g, 0.5, 0.03, 0.38, M.pv, -0.28, 0.62, 0);
    pv.rotation.z = 0.5;
    box(THREE, g, 0.05, 0.5, 0.05, M.steel, -0.34, 0.3, 0);
    cyl(THREE, g, 0.008, 0.008, 0.7, 6, M.dark, 0.05, 2.55, -0.05);
    poi(THREE, g, 'netmast', 0, 1.6, 0.4);
    g.userData.nightMats = [led];
    return g;
  },

  // B. 尘通量强化杆 2.8 m —— 双环电极 + 静电球 + 琥珀信标(blink),尘暴前锋哨兵
  netMastB(THREE) {
    const g = new THREE.Group();
    const M = mats(THREE);
    box(THREE, g, 0.8, 0.1, 0.8, M.pad, 0, 0.05, 0);
    cyl(THREE, g, 0.04, 0.055, 2.7, 8, M.steel, 0, 1.45, 0);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      box(THREE, g, 0.24, 0.15, 0.24, M.pad, Math.cos(a) * 0.62, 0.075, Math.sin(a) * 0.62);
      const leg = cyl(THREE, g, 0.02, 0.02, 1.15, 6, M.dark,
        Math.cos(a) * 0.32, 0.55, Math.sin(a) * 0.32);
      leg.lookAt(Math.cos(a) * 0.62, 0, Math.sin(a) * 0.62);
      leg.rotateX(Math.PI / 2);
    }
    [1.7, 2.1].forEach(hy => {                                             // 尘通量环电极 ×2
      const el = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.012, 6, 16), M.copper);
      el.rotation.x = Math.PI / 2; el.position.y = hy; g.add(el);
      cyl(THREE, g, 0.01, 0.01, 0.12, 6, M.dark, 0.07, hy - 0.07, 0);
    });
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), M.copper);
    ball.position.y = 2.92; g.add(ball);                                   // 静电球头
    box(THREE, g, 0.26, 0.3, 0.2, M.white, -0.26, 0.3, 0);                 // 电子舱(CSA+静电计)
    const pv = box(THREE, g, 0.55, 0.03, 0.4, M.pv, 0.3, 0.66, 0);
    pv.rotation.z = -0.5;
    box(THREE, g, 0.05, 0.52, 0.05, M.steel, 0.36, 0.32, 0);
    const bk = beaconAmber(THREE);
    const beacon = box(THREE, g, 0.06, 0.06, 0.06, bk, 0, 2.62, 0.09);
    beacon.name = 'blink_netbeacon';
    poi(THREE, g, 'netdust', 0, 1.9, 0.4);
    g.userData.blinkMats = [bk];
    return g;
  },

  // C. 岩钉矮墩气压站 0.65 m —— 崖边/碎石区用,无杆低风阻,岩栓锚定
  netPuckC(THREE) {
    const g = new THREE.Group();
    const M = mats(THREE);
    cyl(THREE, g, 0.34, 0.42, 0.16, 14, M.pad, 0, 0.08, 0);               // 裙边墩座
    cyl(THREE, g, 0.24, 0.26, 0.3, 14, M.white, 0, 0.31, 0);              // 仪器筒
    cyl(THREE, g, 0.26, 0.26, 0.04, 14, M.dark, 0, 0.48, 0);              // 顶盖
    const neck = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.016, 6, 10, Math.PI), M.steel);
    neck.position.set(0, 0.55, 0.1); neck.rotation.y = Math.PI / 2; g.add(neck);
    cyl(THREE, g, 0.016, 0.016, 0.12, 6, M.steel, 0, 0.52, 0.1);
    for (let i = 0; i < 4; i++) {                                          // 岩栓 ×4
      const a = (i / 4) * Math.PI * 2 + 0.4;
      box(THREE, g, 0.06, 0.1, 0.06, M.copper, Math.cos(a) * 0.38, 0.06, Math.sin(a) * 0.38);
    }
    const pv = box(THREE, g, 0.36, 0.02, 0.28, M.pv, 0, 0.51, -0.02);     // 平铺 PV
    pv.rotation.x = -0.08;
    cyl(THREE, g, 0.007, 0.007, 0.55, 6, M.dark, 0.18, 0.75, -0.12);      // UHF 鞭
    const led = ledGreen(THREE);
    box(THREE, g, 0.04, 0.03, 0.02, led, 0, 0.38, 0.26);
    poi(THREE, g, 'netpuck', 0, 0.6, 0.35);
    g.userData.nightMats = [led];
    return g;
  },
};
