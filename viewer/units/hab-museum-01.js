// hab-museum-01 —— 火星城博物馆(地表壳:半埋覆土主体 + 玻璃前厅)
// 契约(MODELS.md §4):1u=1m;原点=基座中心地面点;+Y 上;正面朝 +Z;THREE 传入;纯色材质。
// 设计输入(E:\Claude\mars-museum\DESIGN.md):
//   半埋覆土主体 = 辐射防护语言与 hab-village-01 一致(2 m 覆土 234→7.6 mSv/yr,31×;
//   2026-08 λ_p 锚点更正后口径,绝对值持 ×2~3 不确定度);
//   玻璃前厅朝 +Z,七格漫画灯箱透出(第 7 格「51/49 之问」装在门楣正上方);
//   屋顶天窗带(北向漫射,展品避直射);门楣数据屏 nightMats 常亮(毅力号活展品的外部信号);
//   室内馆另件交付:hab-museum-hall-01(kind:interior)。
// 动画全声明式:nightMats(灯箱/天窗/门牌/数据屏) + blinkMats(通风桅信标);无 animate。

export const meta = {
  id: 'hab-museum-01',
  name: '火星城博物馆',
  name_en: 'Mars City Museum',
  size_m: 40.5,            // validate 实测包围盒(z=40.53,含前庭)
  size_axis: 'depth',
  effects: ['glow_windows', 'blink'],
};

export function build(THREE) {
  const group = new THREE.Group();
  group.name = meta.id;
  const nightMats = [];
  const blinkMats = [];

  /* ---------------- 确定性伪随机(禁 Math.random) ---------------- */
  let _seed = 20260821;
  const rnd = () => { _seed = (_seed * 16807) % 2147483647; return _seed / 2147483647; };
  const hash3 = (x, y, z) => {
    const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
    return s - Math.floor(s);
  };
  const vnoise = (x, y, z) => {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const xf = x - xi, yf = y - yi, zf = z - zi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
    let a = 0;
    for (let dx = 0; dx <= 1; dx++) for (let dy = 0; dy <= 1; dy++) for (let dz = 0; dz <= 1; dz++)
      a += hash3(xi + dx, yi + dy, zi + dz) * (dx ? u : 1 - u) * (dy ? v : 1 - v) * (dz ? w : 1 - w);
    return a;
  };

  /* ---------------- 材质 ---------------- */
  const M = {
    berm:   new THREE.MeshLambertMaterial({ vertexColors: true }),           // 覆土(顶点色)
    plaza:  new THREE.MeshLambertMaterial({ vertexColors: true }),           // 前庭地坪
    wall:   new THREE.MeshStandardMaterial({ color: 0x8a8378, roughness: 0.95 }), // 打印墙(村裙脚同源)
    trim:   new THREE.MeshStandardMaterial({ color: 0x3a3e44, roughness: 0.55, metalness: 0.4 }),
    steel:  new THREE.MeshStandardMaterial({ color: 0x6a7076, roughness: 0.5, metalness: 0.6 }),
    orange: new THREE.MeshStandardMaterial({ color: 0xe07020, roughness: 0.65 }),
    dark:   new THREE.MeshStandardMaterial({ color: 0x22252a, roughness: 0.7 }),
    glass:  new THREE.MeshStandardMaterial({ color: 0x9fc4cc, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.32 }),
    floor:  new THREE.MeshStandardMaterial({ color: 0xbcb6a8, roughness: 0.8 }),
    track:  new THREE.MeshStandardMaterial({ color: 0x6e4a33, roughness: 1.0 }),
    flag:   new THREE.MeshStandardMaterial({ color: 0xc84b32, roughness: 0.8, side: THREE.DoubleSide }),
    white:  new THREE.MeshStandardMaterial({ color: 0xd6d1c6, roughness: 0.75 }),
  };
  // 发光族 → nightMats
  const G = {
    boxA:  new THREE.MeshStandardMaterial({ color: 0x2a2013, emissive: 0xffd9a0, emissiveIntensity: 1.0, roughness: 0.5 }), // 漫画灯箱(暖)
    boxQ:  new THREE.MeshStandardMaterial({ color: 0x101a20, emissive: 0x63b4d8, emissiveIntensity: 1.2, roughness: 0.5 }), // 第七格(青,51/49 之问)
    sign:  new THREE.MeshStandardMaterial({ color: 0x1a1206, emissive: 0xe0aa48, emissiveIntensity: 1.3, roughness: 0.5 }), // 馆名门牌
    data:  new THREE.MeshStandardMaterial({ color: 0x060a12, emissive: 0x2a76c8, emissiveIntensity: 1.5, roughness: 0.5 }), // 门楣数据屏底
    sol:   new THREE.MeshStandardMaterial({ color: 0x1a1206, emissive: 0xffb030, emissiveIntensity: 2.0, roughness: 0.5 }), // sol 数字段
    sky:   new THREE.MeshStandardMaterial({ color: 0x201a12, emissive: 0xfff0d0, emissiveIntensity: 0.35, roughness: 0.5 }), // 天窗淡光
    lamp:  new THREE.MeshStandardMaterial({ color: 0x2a2013, emissive: 0xffd9a0, emissiveIntensity: 1.0, roughness: 0.5 }), // 门灯/庭灯
  };
  for (const k in G) nightMats.push(G[k]);
  const beaconMat = new THREE.MeshStandardMaterial({ color: 0x400808, emissive: 0xff3020, emissiveIntensity: 1.5, roughness: 0.5 });
  blinkMats.push(beaconMat);

  /* ---------------- 工具 ---------------- */
  function box(w, h, d, mat, x, y, z, ry = 0, parent = group) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z); m.rotation.y = ry;
    parent.add(m); return m;
  }
  function cyl(rt, rb, h, seg, mat, x, y, z, parent = group) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
    m.position.set(x, y, z); parent.add(m); return m;
  }
  function poi(name, x, y, z) {
    const a = new THREE.Object3D(); a.name = 'poi_' + name; a.position.set(x, y, z);
    group.add(a); return a;
  }
  const rockGeo = new THREE.DodecahedronGeometry(1, 0); // 顶点半径 φ≈1.618(坑账 3)

  /* ==========================================================
   * A. 覆土主体(半埋拱顶读作土丘;双尺度顶点色 + 值噪声粗糙化)
   *    丘心 (0, 0, -5.5),半轴 x17 / y7.0 / z11 → 前缘 z≈+5.5 与立面相接
   * ========================================================== */
  function mound(sx, sy, sz, cx, cz, colA, colB, seg = 40, ring = 18) {
    const geo = new THREE.SphereGeometry(1, seg, ring, 0, Math.PI * 2, 0, Math.PI / 2);
    const pos = geo.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const cA = new THREE.Color(colA), cB = new THREE.Color(colB), tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      let px = pos.getX(i), py = pos.getY(i), pz = pos.getZ(i);
      // 径向噪声(顶部保平滑,近裙脚更糙)
      const k = 1 + (vnoise(px * 2.3 + cx, py * 2.3, pz * 2.3 + cz) - 0.5) * 0.10 * (1 - py * 0.7);
      px *= k; pz *= k;
      pos.setX(i, px); pos.setZ(i, pz);
      const wx = px * sx + cx, wy = py * sy, wz = pz * sz + cz;
      const n = 0.6 * vnoise(wx * 0.14, wy * 0.14, wz * 0.14) + 0.4 * vnoise(wx * 0.9, wy * 0.9 + 5, wz * 0.9);
      tmp.copy(cA).lerp(cB, Math.min(1, Math.max(0, n * 0.9 + 0.15 * py)));
      col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, M.berm);
    m.scale.set(sx, sy, sz);
    m.position.set(cx, 0, cz);
    group.add(m); return m;
  }
  mound(17, 7.0, 11, 0, -5.5, 0x9a6a4a, 0x7d5238);          // 主丘
  mound(19.5, 1.4, 11.6, 0, -7.0, 0x8f6044, 0x6f4a32, 36, 8); // 裙脚过渡环(略大更扁;中心后移防探进前厅)

  /* ==========================================================
   * B. 立面(打印墙,自丘前缘露出)+ 玻璃前厅(z 5.7~10.5)
   * ========================================================== */
  // 立面墙:宽 18,高 5,厚 0.7,顶压条 + 底裙边(工业细节语法)
  box(18, 5.0, 0.7, M.wall, 0, 2.5, 5.4);
  box(18.4, 0.35, 0.95, M.trim, 0, 5.1, 5.4);   // 顶盖压条
  box(18.4, 0.5, 0.95, M.trim, 0, 0.25, 5.4);   // 底裙边
  // 立面两肩的覆土挡墙(短翼,把丘"兜"在立面两侧)
  for (const s of [-1, 1]) {
    box(0.6, 3.2, 4.0, M.wall, s * 9.3, 1.6, 3.6, s * 0.35);
  }

  // 玻璃前厅:14 × 4.0 × 4.8(z 5.75~10.55),柱框 + 玻璃板 + 顶板
  const FW = 14, FD = 4.8, FH = 4.0, fz0 = 5.75, fz1 = fz0 + FD;
  box(FW + 0.6, 0.12, FD + 0.6, M.floor, 0, 0.06, (fz0 + fz1) / 2);          // 前厅地板
  box(FW + 0.8, 0.3, FD + 0.8, M.trim, 0, FH + 0.15, (fz0 + fz1) / 2);       // 顶板
  // 角柱与中柱
  for (const sx of [-1, 1]) {
    box(0.28, FH, 0.28, M.trim, sx * FW / 2, FH / 2, fz1 - 0.14);
    box(0.28, FH, 0.28, M.trim, sx * FW / 2, FH / 2, fz0 + 0.14);
  }
  for (const mx of [-FW / 4, FW / 4]) box(0.18, FH, 0.18, M.trim, mx, FH / 2, fz1 - 0.09);
  // 玻璃:前面(留门洞 2.0 宽)+ 两侧
  const doorW = 2.0, doorH = 2.5;
  const sideW = (FW - doorW) / 2;
  for (const s of [-1, 1]) {
    box(sideW, FH - 0.24, 0.08, M.glass, s * (doorW / 2 + sideW / 2), FH / 2, fz1 - 0.04);
    box(0.08, FH - 0.24, FD - 0.4, M.glass, s * (FW / 2 - 0.04), FH / 2, (fz0 + fz1) / 2);
  }
  box(doorW, FH - doorH - 0.24, 0.08, M.glass, 0, doorH + (FH - doorH) / 2, fz1 - 0.04); // 门上亮子
  // 玻璃横梃
  for (const yy of [1.1, 2.5]) box(FW, 0.09, 0.1, M.trim, 0, yy, fz1 - 0.04);

  // 前厅门(密封框 + 双扇 + 闩 + 铰链,开在玻璃面正中)
  box(doorW + 0.26, doorH + 0.16, 0.14, M.orange, 0, doorH / 2 + 0.05, fz1 + 0.02); // 密封框
  for (const s of [-1, 1]) {
    box(doorW / 2 - 0.06, doorH - 0.08, 0.1, M.white, s * doorW / 4, doorH / 2, fz1 - 0.02); // 扇
    box(0.09, 0.24, 0.09, M.dark, s * 0.16, 1.25, fz1 + 0.05);                                // 闩把手
    box(0.12, 0.09, 0.06, M.dark, s * (doorW / 2 - 0.02), 1.95, fz1 + 0.04);                  // 铰链
    box(0.12, 0.09, 0.06, M.dark, s * (doorW / 2 - 0.02), 0.55, fz1 + 0.04);
  }

  /* ==========================================================
   * C. 七格漫画灯箱(前厅内背墙,透玻璃可读;第 7 格在门楣正上)
   *    红线:第 7 格 = 51/49 之问 → 独用青色调,居中于门上方
   * ========================================================== */
  const lbz = fz0 + 0.35; // 灯箱贴立面内侧
  const panelY = 1.9, pw = 1.15, ph = 1.55;
  const px6 = [-5.7, -3.8, -1.9, 1.9, 3.8, 5.7]; // 门两侧各三格
  for (let i = 0; i < 6; i++) {
    box(pw + 0.14, ph + 0.14, 0.1, M.trim, px6[i], panelY, lbz);        // 框
    box(pw, ph, 0.06, G.boxA, px6[i], panelY, lbz + 0.05);              // 发光面
    // 抽象格内构图:嵌套矩形(世界里造世界)——两层暗框
    box(pw * 0.62, ph * 0.62, 0.05, M.dark, px6[i], panelY, lbz + 0.09);
    box(pw * 0.34, ph * 0.34, 0.05, G.boxA, px6[i], panelY + 0.05, lbz + 0.11);
  }
  // 第 7 格:门正上方,横幅比例,51/49 双条(只提问不作答:两条几乎等长)
  box(2.4, 1.0, 0.1, M.trim, 0, 3.35, lbz);
  box(2.26, 0.86, 0.06, G.boxQ, 0, 3.35, lbz + 0.05);
  box(1.02, 0.16, 0.05, G.boxA, -0.06, 3.5, lbz + 0.09);   // 51%(琥珀,略长)
  box(0.98, 0.16, 0.05, M.dark, -0.04, 3.2, lbz + 0.09);   // 49%(暗,略短)

  // 前厅接待台(轻,不喧宾)
  box(2.2, 0.95, 0.6, M.white, -4.2, 0.48, fz0 + 1.6);
  box(2.3, 0.06, 0.7, M.trim, -4.2, 0.98, fz0 + 1.6);

  /* ==========================================================
   * D. 门楣馆名牌 + 数据屏(sol 常亮——活展品的外部信号)
   * ========================================================== */
  box(5.2, 0.7, 0.16, M.trim, 0, FH + 0.65, fz1 - 0.2);
  box(4.9, 0.5, 0.06, G.sign, 0, FH + 0.65, fz1 - 0.1);       // 馆名发光牌
  // 数据屏(蓝底):sol 四位数字用七段发光块拼出「1947」
  box(3.4, 1.0, 0.16, M.dark, 0, FH + 1.62, fz1 - 0.28);
  box(3.2, 0.84, 0.06, G.data, 0, FH + 1.62, fz1 - 0.19);
  const SEG = { // 七段:a上 b右上 c右下 d下 e左下 f左上 g中
    0: 'abcdef', 1: 'bc', 4: 'bcfg', 7: 'abc', 9: 'abcdfg',
  };
  function digit(n, dx, dy, dz, s) {
    const on = SEG[n] || '';
    const L = s, T = s * 0.16; // 段长/段厚
    const segs = {
      a: [0, L, 0, L, T], b: [L / 2, L / 2, 0, T, L], c: [L / 2, -L / 2, 0, T, L],
      d: [0, -L, 0, L, T], e: [-L / 2, -L / 2, 0, T, L], f: [-L / 2, L / 2, 0, T, L],
      g: [0, 0, 0, L, T],
    };
    for (const k of on) {
      const [ox, oy, , w, h] = segs[k];
      box(w, h, 0.03, G.sol, dx + ox, dy + oy, dz);
    }
  }
  // sol 1947(与 data/mission/mission.json 交付时点一致;活口径见知识卡)
  const dg = [1, 9, 4, 7];
  for (let i = 0; i < 4; i++) digit(dg[i], -1.05 + i * 0.7, FH + 1.62, fz1 - 0.15, 0.22);

  /* ==========================================================
   * E. 屋顶天窗带(北向漫射,沿丘脊 4 座)+ 通风桅 + 信标
   * ========================================================== */
  for (const sx of [-6.3, -2.1, 2.1, 6.3]) {
    const sy = 6.9 * Math.sqrt(Math.max(0, 1 - (sx / 17) ** 2 - ((-4.5 + 5.5) / 11) ** 2));
    box(1.7, 0.55, 1.3, M.wall, sx, sy + 0.1, -4.5);          // 天窗基座
    box(1.8, 0.12, 1.4, M.trim, sx, sy + 0.42, -4.5);
    const skl = box(1.5, 0.07, 1.1, G.sky, sx, sy + 0.5, -4.5); // 淡光玻璃顶
    skl.rotation.x = -0.12;                                    // 北倾(避直射)
  }
  // 通风桅(丘后肩)+ 检修箱 + 双导管 + 红信标
  const vmx = 10.5, vmz = -9;
  cyl(0.22, 0.26, 3.4, 10, M.steel, vmx, 4.4, vmz);
  box(0.7, 0.5, 0.5, M.steel, vmx, 6.3, vmz);                  // 顶罩
  box(0.5, 0.7, 0.4, M.trim, vmx + 0.8, 2.9, vmz);             // 接线箱
  for (const dz of [-0.12, 0.12]) cyl(0.05, 0.05, 2.6, 8, M.dark, vmx + 0.55, 3.9, vmz + dz);
  cyl(0.07, 0.07, 0.16, 8, beaconMat, vmx, 6.65, vmz);         // 信标(blink)

  /* ==========================================================
   * F. 前庭:地坪 + 缓坡 + 护栏 + 旗杆 + 长凳 + 立牌 + 痕迹
   * ========================================================== */
  // 地坪(顶点色两尺度)
  {
    const geo = new THREE.PlaneGeometry(24, 11, 24, 12);
    const pos = geo.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const cA = new THREE.Color(0xa5765a), cB = new THREE.Color(0x8a5f44), tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const wx = pos.getX(i), wy = pos.getY(i);
      const n = 0.6 * vnoise(wx * 0.14, 3, wy * 0.14) + 0.4 * vnoise(wx * 0.9, 7, wy * 0.9);
      tmp.copy(cA).lerp(cB, Math.min(1, Math.max(0, n)));
      col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const m = new THREE.Mesh(geo, M.plaza);
    m.rotation.x = -Math.PI / 2; m.position.set(0, 0.025, 16.2);
    group.add(m);
  }
  // 入口缓坡(玻璃厅门前)+ 安全橙护栏
  box(3.2, 0.1, 2.4, M.floor, 0, 0.05, fz1 + 1.3);
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) cyl(0.035, 0.035, 0.9, 6, M.orange, s * 1.7, 0.45, fz1 + 0.4 + i * 0.9);
    box(0.07, 0.07, 2.4, M.orange, s * 1.7, 0.92, fz1 + 1.3);
  }
  // 旗杆 + 城旗
  cyl(0.05, 0.07, 6.4, 8, M.steel, -8.5, 3.2, 14.5);
  box(1.5, 0.9, 0.03, M.flag, -7.66, 5.7, 14.5);
  // 长凳 ×2
  for (const bx of [4.5, 7.2]) {
    box(1.9, 0.09, 0.5, M.white, bx, 0.46, 13.6);
    for (const s of [-1, 1]) box(0.12, 0.42, 0.45, M.trim, bx + s * 0.75, 0.21, 13.6);
  }
  // 馆前立牌(totem):立柱 + 发光带
  box(0.55, 3.0, 0.35, M.wall, 8.6, 1.5, 12.2);
  box(0.62, 0.2, 0.42, M.trim, 8.6, 3.05, 12.2);
  box(0.45, 1.5, 0.05, G.sign, 8.6, 1.9, 12.42);
  // 庭灯 ×2
  for (const s of [-1, 1]) {
    cyl(0.05, 0.06, 2.6, 8, M.trim, s * 5.5, 1.3, 11.6);
    box(0.3, 0.16, 0.3, G.lamp, s * 5.5, 2.7, 11.6);
  }
  // 车辙(双条)+ 散落砾石
  for (const s of [-1, 1]) box(0.5, 0.03, 10.5, M.track, s * 1.05, 0.045, 17.0);
  for (let i = 0; i < 14; i++) {
    const a = rnd() * 6.283, d = 8 + rnd() * 9, sc = 0.08 + rnd() * 0.12;
    const rock = new THREE.Mesh(rockGeo, rnd() < 0.5 ? M.wall : M.track);
    rock.position.set(Math.cos(a) * d * 1.2, -0.3 * sc + 1.618 * sc, 12 + Math.abs(Math.sin(a)) * d * 0.6);
    rock.scale.set(sc, sc * 0.7, sc);
    rock.rotation.y = rnd() * 6.28;
    group.add(rock);
  }

  /* ---------------- POI 锚点 ---------------- */
  poi('entry', 0, 2.6, fz1 + 0.5);   // 观众账(门口)
  poi('berm', 0, 7.2, -5.5);         // 选址与覆土账(丘顶)

  /* ---------------- 尘膜 pass ---------------- */
  const dust = new THREE.Color(0x9e5b3d);
  [M.wall, M.trim, M.steel, M.orange, M.white, M.floor].forEach(m => m.color.lerp(dust, 0.05));

  /* ---------------- userData ---------------- */
  group.userData = {
    nightMats,
    blinkMats,
    lights: [
      { color: 0xffd9a0, pos: [0, 3.4, 11.2], range: 14 },   // 门口暖光
      { color: 0xffd9a0, pos: [0, 3.2, 7.6], range: 12 },    // 前厅内光(灯箱辉)
      { color: 0x63b4d8, pos: [0, 5.8, 10.4], range: 6 },    // 数据屏冷辉
    ],
    beams: [],
  };
  return group;
}
