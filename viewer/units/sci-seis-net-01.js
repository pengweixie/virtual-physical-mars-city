// sci-seis-net-01 火震观测网远端节点桩(scatter 散件包 ×2 变体)
// 存在理由(设计册账 3):24h 城市源在 SP 高频带的夜残余压不进纯净地板,
// 纯净高频 + 事件定位(方位角覆盖)交给 1.2~2 km 外的远端节点。
// 建议撒放:主站外围 1.2~2.2 km,方位岔开 ≥90°(三站二维慢度最小闭合)。
// 变体 A:标准 SP 节点桩(短周期三分量,打入式尖锥耦合);
// 变体 B:基岩锚节点(崖边低风阻矮墩,4 岩栓,blink 信标)。

export const meta = {
  id: 'sci-seis-net-01',
  name: '火震观测网远端节点',
  name_en: 'Seismic Network Remote Nodes',
  kind: 'scatter',
};

export const builders = {
  seisNodeA(THREE) {
    const g = new THREE.Group();
    const L = (c, o) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, o || {}));
    const M = {
      white: L(0xcfc6b8), dark: L(0x3a3d42), steel: L(0xa9b0b8),
      orange: L(0xc96f2f), pv: L(0x27394f, { emissive: 0x101c2c, emissiveIntensity: 0.25 }),
      led: L(0x2a2f2a, { emissive: 0x35e08a, emissiveIntensity: 1.4 }),
    };
    const box = (w, h, d, m, x, y, z) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
      b.position.set(x, y, z); g.add(b); return b;
    };
    // 打入式尖锥耦合桩(尖端在地下——只露桩帽)+ 传感器罐
    const spike = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.02, 0.3, 8), M.steel);
    spike.position.y = 0.15; g.add(spike);
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.22, 12), M.white);
    pot.position.y = 0.41; g.add(pot);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.115, 12, 6, 0, 6.283, 0, 1.35), M.orange);
    cap.position.y = 0.52; g.add(cap);
    // 迷你桅杆:PV 板 + 鞭状天线 + 状态灯
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.028, 0.85, 6), M.steel);
    mast.position.set(0.22, 0.43, 0); g.add(mast);
    const pv = box(0.42, 0.03, 0.3, M.pv, 0.22, 0.88, 0);
    pv.rotation.z = -0.3;
    const whip = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.5, 4), M.dark);
    whip.position.set(0.22, 1.12, 0); g.add(whip);
    box(0.05, 0.05, 0.02, M.led, 0.22, 0.62, 0.03);
    // 三向拉线锚(风振抑制:桅杆晃动别耦合进地面)
    for (let k = 0; k < 3; k++) {
      const a = k * 2.094 + 0.6;
      const fx = 0.22 + Math.cos(a) * 0.45, fz = Math.sin(a) * 0.45;
      const guy = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 1, 3), M.dark);
      const from = new THREE.Vector3(0.22, 0.8, 0), to = new THREE.Vector3(fx, 0.02, fz);
      guy.scale.y = from.distanceTo(to);
      guy.position.copy(from).lerp(to, 0.5);
      guy.lookAt(to); guy.rotateX(Math.PI / 2); g.add(guy);
      box(0.07, 0.04, 0.07, M.dark, fx, 0.02, fz);
    }
    g.userData.nightMats = [M.led];
    return g;
  },

  seisNodeB(THREE) {
    const g = new THREE.Group();
    const L = (c, o) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, o || {}));
    const M = {
      white: L(0xcfc6b8), dark: L(0x3a3d42), steel: L(0xa9b0b8), grey: L(0x8a8f96),
      beacon: L(0x7a2020, { emissive: 0xff2a1a, emissiveIntensity: 2.0 }),
    };
    // 基岩锚板 + 4 岩栓 + 矮墩传感器罐(低风阻:风噪账在远端同样成立)
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.5), M.grey);
    plate.position.y = 0.03; g.add(plate);
    for (const [dx, dz] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) {
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.09, 6), M.dark);
      bolt.position.set(dx, 0.075, dz); g.add(bolt);
    }
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.17, 0.2, 12), M.white);
    pot.position.y = 0.16; g.add(pot);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.145, 0.04, 12), M.steel);
    lid.position.y = 0.28; g.add(lid);
    // 缆线盘 + 反光标识杆 + blink 信标(尘暴里巡检车能找到它)
    const coil = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.02, 6, 12), M.dark);
    coil.rotation.x = Math.PI / 2; coil.position.set(-0.28, 0.05, 0.18); g.add(coil);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.6, 6), M.steel);
    post.position.set(0.24, 0.3, -0.18); g.add(post);
    const bcn = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.09, 0.07), M.beacon);
    bcn.position.set(0.24, 0.64, -0.18); g.add(bcn);
    g.userData.blinkMats = [M.beacon];
    return g;
  },
};
