// env-scatter-01 — 荒野散件包
// 契约:导出 meta + builders;每个 builder 接收 THREE,返回一个 Group。
// 规则:1 单位 = 1 米,原点在地面中心,+Y 向上,无贴图(用顶点色做斑驳/条纹),
//       每件 ≤ 800 三角形;发光材质放 group.userData.nightMats,
//       需要引擎驱动闪烁的放 group.userData.blinkMats。

export const meta = {
  id: 'env-scatter-01',
  name: '荒野散件包',
  kind: 'scatter',
};

// ---------------------------------------------------------------- 工具

// 确定性伪随机:同一 builder 每次调用产出完全一致的几何,
// 撒放变化(旋转/缩放)交给引擎。
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function std(THREE, opts) {
  return new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.8, metalness: 0.1 }, opts));
}

// POI 锚点(MODELS.md §5):poi_ 前缀空节点,引擎按距离浮现知识卡
function poi(THREE, group, id, x, y, z) {
  const anchor = new THREE.Object3D();
  anchor.name = 'poi_' + id;
  anchor.position.set(x, y, z);
  group.add(anchor);
}

function mesh(THREE, geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// 抬升对象自身,使包围盒最低点落在 minY(用于倾斜件防穿地)。
// 注意:只用于返回 Group 的**子级**——返回的 Group 本身的 transform 归引擎管。
function liftToGround(THREE, obj, minY = 0.01) {
  obj.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(obj);
  if (isFinite(box.min.y)) obj.position.y += minY - box.min.y;
}

// 对非索引几何按"位置哈希"做一致抖动,保证共位顶点位移相同、网格不裂
function jitterVertices(THREE, geo, amount, rng) {
  const pos = geo.attributes.position;
  const cache = new Map();
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const key = `${Math.round(v.x * 500)},${Math.round(v.y * 500)},${Math.round(v.z * 500)}`;
    let s = cache.get(key);
    if (s === undefined) { s = 1 + (rng() - 0.5) * 2 * amount; cache.set(key, s); }
    pos.setXYZ(i, v.x * s, v.y * s, v.z * s);
  }
  geo.computeVertexNormals();
  return geo;
}

// ---------------------------------------------------------------- builders

export const builders = {

  // 1. 气象桅杆 高 3.5 m —— 细锥杆 + 十字风传感器臂 + 仪器盒 + 杆底光伏板
  weatherMast(THREE) {
    const g = new THREE.Group();
    const metal = std(THREE, { color: 0x9aa0a6, metalness: 0.6, roughness: 0.4 });
    const white = std(THREE, { color: 0xe9e9e2, roughness: 0.55 });
    const cellMat = std(THREE, { color: 0x1d3057, metalness: 0.5, roughness: 0.3 });
    const ledMat = std(THREE, { color: 0x1a3320, emissive: 0x30ff70, emissiveIntensity: 1.2 });

    // 锥形主杆:底径 0.12(半径 0.06)收到顶部 0.03
    g.add(mesh(THREE, new THREE.CylinderGeometry(0.015, 0.06, 3.5, 8), metal, 0, 1.75, 0));
    // 顶部十字传感器臂(两根横杆交叉)+ 四端小感应头
    const armGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.9, 6);
    const armX = mesh(THREE, armGeo, metal, 0, 3.42, 0); armX.rotation.z = Math.PI / 2;
    const armZ = mesh(THREE, armGeo, metal, 0, 3.42, 0); armZ.rotation.x = Math.PI / 2;
    g.add(armX, armZ);
    const tipGeo = new THREE.OctahedronGeometry(0.045, 0);
    for (const [tx, tz] of [[0.45, 0], [-0.45, 0], [0, 0.45], [0, -0.45]]) {
      g.add(mesh(THREE, tipGeo, white, tx, 3.42, tz));
    }
    // 顶端小避雷针
    g.add(mesh(THREE, new THREE.CylinderGeometry(0.006, 0.006, 0.25, 5), metal, 0, 3.62, 0));
    // 中部白色仪器盒 + 状态 LED(夜间常亮)
    g.add(mesh(THREE, new THREE.BoxGeometry(0.22, 0.3, 0.18), white, 0.08, 1.8, 0));
    g.add(mesh(THREE, new THREE.BoxGeometry(0.035, 0.035, 0.02), ledMat, 0.08, 1.88, 0.095));
    // 杆底一块小光伏板(斜倚杆侧)+ 支架
    const panel = new THREE.Group();
    panel.add(mesh(THREE, new THREE.BoxGeometry(0.5, 0.02, 0.36), cellMat, 0, 0, 0));
    panel.add(mesh(THREE, new THREE.BoxGeometry(0.54, 0.015, 0.4), white, 0, -0.018, 0));
    panel.position.set(0.24, 0.34, 0); panel.rotation.z = -0.5;
    g.add(panel);
    const bracket = mesh(THREE, new THREE.CylinderGeometry(0.018, 0.018, 0.34, 6), metal, 0.24, 0.18, 0);
    bracket.rotation.z = -0.25;
    g.add(bracket);

    g.userData.nightMats = [ledMat];
    return g;
  },

  // 2. 导航信标桩 高 1.5 m —— 白色锥形桩身 + 顶端红色方灯(闪烁)
  navBeacon(THREE) {
    const g = new THREE.Group();
    const white = std(THREE, { color: 0xf0efe8, roughness: 0.5 });
    const dark = std(THREE, { color: 0x33363c, roughness: 0.6 });
    const lampMat = std(THREE, { color: 0x551010, emissive: 0xff2a1a, emissiveIntensity: 2.0 });

    g.add(mesh(THREE, new THREE.CylinderGeometry(0.055, 0.16, 1.32, 10), white, 0, 0.66, 0));
    // 灯座 + 红色方灯
    g.add(mesh(THREE, new THREE.BoxGeometry(0.14, 0.05, 0.14), dark, 0, 1.345, 0));
    g.add(mesh(THREE, new THREE.BoxGeometry(0.12, 0.13, 0.12), lampMat, 0, 1.435, 0));
    // 桩身一圈深色标识带
    g.add(mesh(THREE, new THREE.CylinderGeometry(0.105, 0.118, 0.12, 10), dark, 0, 0.95, 0));

    g.userData.blinkMats = [lampMat];
    return g;
  },

  // 3. 首着陆纪念碑 高 2.6 m —— 玄武岩石板(斜切顶)+ 铭牌 + 半圆平台三面旗
  monument(THREE) {
    const g = new THREE.Group();
    const basalt = std(THREE, { color: 0x2b2b30, roughness: 0.9, flatShading: true });
    const stone = std(THREE, { color: 0x4a4640, roughness: 0.95 });
    const pole = std(THREE, { color: 0xb9bcc0, metalness: 0.6, roughness: 0.4 });
    const plaqueMat = std(THREE, {
      color: 0xd8cdb0, roughness: 0.35, metalness: 0.4,
      emissive: 0xffdf9a, emissiveIntensity: 0.35,
    });

    // 石板:顶面沿 x 方向微斜切(2.6 → 2.42)
    const slabGeo = new THREE.BoxGeometry(0.95, 2.6, 0.38);
    slabGeo.translate(0, 1.3, 0);
    const p = slabGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      if (p.getY(i) > 2.55) p.setY(i, 2.6 - 0.18 * (p.getX(i) / 0.95 + 0.5));
    }
    slabGeo.computeVertexNormals();
    g.add(mesh(THREE, slabGeo, basalt, 0, 0, 0));
    // 正面浅色铭牌(夜间微光)
    g.add(mesh(THREE, new THREE.BoxGeometry(0.6, 0.8, 0.025), plaqueMat, 0, 1.45, 0.20));
    // 碑前半圆小平台
    const plat = mesh(THREE, new THREE.CylinderGeometry(1.0, 1.05, 0.12, 16, 1, false, 0, Math.PI), stone, 0, 0.06, 0.19);
    g.add(plat);
    // 平台上三面小旗:红 / 蓝 / 白,刚性平板旗面
    const flagCols = [0xc0392b, 0x2960b0, 0xe8e8e2];
    for (let i = 0; i < 3; i++) {
      const a = Math.PI * (0.28 + 0.22 * i);
      const fx = Math.cos(a) * 0.8, fz = 0.19 + Math.sin(a) * 0.8;
      g.add(mesh(THREE, new THREE.CylinderGeometry(0.015, 0.02, 1.25, 6), pole, fx, 0.745, fz));
      const flag = mesh(THREE, new THREE.BoxGeometry(0.34, 0.21, 0.012),
        std(THREE, { color: flagCols[i], roughness: 0.7, side: THREE.DoubleSide }),
        fx + 0.18, 1.24, fz);
      flag.rotation.y = 0.25 * (i - 1);
      g.add(flag);
    }

    poi(THREE, g, 'monument', 0, 1.6, 0.4);
    g.userData.nightMats = [plaqueMat];
    return g;
  },

  // 4. 防热大底残骸 直径 4.5 m —— 碳黑浅球冠壳,仰面半埋、倾斜 15°,
  //    边缘两处缺口,内面炭化斑驳(顶点色)。毅力号真把它留在了 Jezero。
  heatshield(THREE) {
    const g = new THREE.Group();
    const rng = mulberry32(41);
    const rimR = 2.25, depth = 0.82;
    const rings = 5, radial = 26;
    const sphR = (rimR * rimR + depth * depth) / (2 * depth); // 球冠母球半径

    const positions = [], colors = [], indices = [];
    // 三档炭化色:基底碳黑 + 烧蚀褐 + 灰白烧穿斑
    const shades = [
      new THREE.Color(0x1b1a1c),
      new THREE.Color(0x5a4028),
      new THREE.Color(0x77726a),
    ];
    for (let i = 0; i <= rings; i++) {
      const t = i / rings, r = rimR * t;
      const y = sphR - Math.sqrt(sphR * sphR - r * r); // 碗形:中心低、边缘高
      for (let j = 0; j < radial; j++) {
        const a = (j / radial) * Math.PI * 2;
        positions.push(Math.cos(a) * r, y, Math.sin(a) * r);
        // 两三个角度扇区做成色块(中心一圈偏褐),叠一点随机
        const sector = Math.floor(((a + 0.7) / (Math.PI * 2)) * 5) % 5;
        let idx = sector === 1 ? 1 : sector === 3 ? 2 : 0;
        if (t < 0.35 && sector !== 3) idx = 1;
        const c = shades[idx].clone();
        c.offsetHSL(0, 0, (rng() - 0.5) * 0.08);
        colors.push(c.r, c.g, c.b);
      }
    }
    // 缺口:最外环两段扇区不连三角形
    const notch = (j) => (j >= 4 && j <= 6) || (j >= 16 && j <= 17);
    for (let i = 0; i < rings; i++) {
      for (let j = 0; j < radial; j++) {
        if (i === rings - 1 && notch(j)) continue;
        const a = i * radial + j, b = i * radial + (j + 1) % radial;
        const c = (i + 1) * radial + j, d = (i + 1) * radial + (j + 1) % radial;
        indices.push(a, c, b, b, c, d);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const shell = mesh(THREE, geo, std(THREE, {
      vertexColors: true, roughness: 0.95, side: THREE.DoubleSide, flatShading: true,
    }));
    shell.rotation.z = THREE.MathUtils.degToRad(15);
    liftToGround(THREE, shell, 0.02); // 倾斜后贴地,低缘"半埋"进地表视感
    g.add(shell);
    poi(THREE, g, 'heatshield', 0, 1.0, 0);
    return g;
  },

  // 5. 降落伞残骸 —— 塌褶白橙条纹伞衣(直径 6 m 摊地)+ 3 m 外倒扣白色后壳锥
  paraDebris(THREE) {
    const g = new THREE.Group();
    const rng = mulberry32(52);
    const R = 3, rings = 6, radial = 34;

    // ---- 伞衣:圆盘网格 + 多段正弦位移做褶皱,顶点色做白/橙条纹
    const positions = [0, 0.34, 0], colors = [];
    const white = new THREE.Color(0xe6e2da), orange = new THREE.Color(0xd9571f);
    colors.push(white.r, white.g, white.b);
    const fold = (t, a) =>
      0.1 + (1 - Math.pow(t, 1.6)) * (
        0.16 + 0.16 * Math.sin(5 * a + 1.7) + 0.1 * Math.sin(9 * a + 0.4)
        + 0.09 * Math.sin(3 * a + 4 * t) + (rng() - 0.5) * 0.05
      );
    for (let i = 1; i <= rings; i++) {
      const t = i / rings;
      for (let j = 0; j < radial; j++) {
        const a = (j / radial) * Math.PI * 2;
        // 皱缩:半径也随角度收缩,轮廓不再是正圆
        const rr = R * t * (1 + 0.09 * Math.sin(3 * a + 1.1) + 0.05 * Math.sin(7 * a));
        positions.push(Math.cos(a) * rr * 1.08, Math.max(0.1, fold(t, a)), Math.sin(a) * rr * 0.82);
        // 12 条辐向伞幅,橙白相间;内圈 1/4 全白(致敬同款配色)
        const gore = Math.floor((j / radial) * 12);
        const c = (t < 0.3 || gore % 2 === 0) ? white : orange;
        colors.push(c.r, c.g, c.b);
      }
    }
    const indices = [];
    for (let j = 0; j < radial; j++) indices.push(0, 1 + j, 1 + (j + 1) % radial); // 中心扇
    for (let i = 0; i < rings - 1; i++) {
      for (let j = 0; j < radial; j++) {
        const a = 1 + i * radial + j, b = 1 + i * radial + (j + 1) % radial;
        const c = 1 + (i + 1) * radial + j, d = 1 + (i + 1) * radial + (j + 1) % radial;
        indices.push(a, c, b, b, c, d);
      }
    }
    const canopyGeo = new THREE.BufferGeometry();
    canopyGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    canopyGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    canopyGeo.setIndex(indices);
    canopyGeo.computeVertexNormals();
    const canopy = mesh(THREE, canopyGeo, std(THREE, {
      vertexColors: true, roughness: 0.85, side: THREE.DoubleSide,
    }), -2.2, 0, -0.5);
    canopy.rotation.y = 0.6;
    g.add(canopy);

    // ---- 3 m 外倒扣的白色后壳锥(宽口朝下)+ 顶部小环
    const shellMat = std(THREE, { color: 0xe8e6df, roughness: 0.5 });
    const back = new THREE.Group();
    const cone = mesh(THREE, new THREE.CylinderGeometry(0.55, 1.15, 1.05, 12, 1, true), shellMat, 0, 0.5, 0);
    cone.material.side = THREE.DoubleSide;
    back.add(cone);
    back.add(mesh(THREE, new THREE.CylinderGeometry(0.56, 0.56, 0.06, 12), shellMat, -0.05, 1.02, -0.02));
    back.rotation.set(0.12, 0, -0.09);
    liftToGround(THREE, back, 0.02);
    back.position.x += 4.2; back.position.z += 1.0; // 距伞衣边缘约 3 m
    g.add(back);
    poi(THREE, g, 'chute', -2.2, 0.8, -0.5);
    return g;
  },

  // 6. 直升机安息地 高 0.5 m —— 机智号构型:方形机身 + 四细腿 +
  //    倾斜卡死的双旋翼 + 一侧小光伏板。2024 年起它永远停在 Neretva Vallis。
  helicopter(THREE) {
    const g = new THREE.Group();
    const bodyMat = std(THREE, { color: 0xc8b98a, metalness: 0.35, roughness: 0.45 }); // 镀金隔热膜
    const dark = std(THREE, { color: 0x26282c, roughness: 0.6 });
    const leg = std(THREE, { color: 0x333333, roughness: 0.7 });
    const cellMat = std(THREE, { color: 0x1d3057, metalness: 0.5, roughness: 0.3 });

    // 方形机身
    g.add(mesh(THREE, new THREE.BoxGeometry(0.16, 0.15, 0.16), bodyMat, 0, 0.21, 0));
    // 四条外撇细腿
    const legGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.3, 5);
    for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const l = mesh(THREE, legGeo, leg, sx * 0.11, 0.13, sz * 0.11);
      l.rotation.set(sz * 0.42, 0, -sx * 0.42);
      g.add(l);
    }
    // 桅杆 + 倾斜卡死的双旋翼(两片交叉平板)
    g.add(mesh(THREE, new THREE.CylinderGeometry(0.014, 0.014, 0.14, 6), dark, 0, 0.35, 0));
    const rotors = new THREE.Group();
    const bladeGeo = new THREE.BoxGeometry(1.2, 0.006, 0.06);
    const b1 = mesh(THREE, bladeGeo, dark, 0, 0, 0);
    const b2 = mesh(THREE, bladeGeo, dark, 0, 0.035, 0);
    b2.rotation.y = Math.PI / 2 + 0.28; // 停转时上下桨叶交叉卡住的角度
    rotors.add(b1, b2);
    rotors.position.set(0, 0.42, 0);
    rotors.rotation.set(0.14, 0.5, -0.1); // 整副旋翼歪着定格
    g.add(rotors);
    g.add(mesh(THREE, new THREE.CylinderGeometry(0.022, 0.022, 0.05, 6), dark, 0, 0.42, 0));
    // 一侧小光伏板
    const panel = mesh(THREE, new THREE.BoxGeometry(0.17, 0.008, 0.12), cellMat, 0.13, 0.30, 0);
    panel.rotation.z = -0.2;
    g.add(panel);
    poi(THREE, g, 'ingenuity', 0, 0.6, 0);
    return g;
  },

  // 7. 石堆路标 0.8 m —— 5~7 块抖动多面体碎石垒塔,顶石一抹白
  cairn(THREE) {
    const g = new THREE.Group();
    const rng = mulberry32(73);
    const rock = std(THREE, { color: 0x6b5140, roughness: 0.95, flatShading: true });
    const rock2 = std(THREE, { color: 0x7d675a, roughness: 0.95, flatShading: true });
    const paint = std(THREE, { color: 0xefeeea, roughness: 0.6, flatShading: true });

    const pile = new THREE.Group();
    const sizes = [0.22, 0.18, 0.15, 0.12, 0.10, 0.085];
    let y = 0;
    let topY = 0, topR = 0;
    sizes.forEach((r, k) => {
      const geo = jitterVertices(THREE, new THREE.DodecahedronGeometry(r, 0), 0.22, rng);
      const m = mesh(THREE, geo, k % 2 ? rock2 : rock,
        (rng() - 0.5) * 0.07, y + r * 0.68, (rng() - 0.5) * 0.07);
      m.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
      m.scale.y = 0.75; // 压扁一点更像垒石
      pile.add(m);
      topY = y + r * 0.68; topR = r;
      y += r * 0.88;
    });
    // 顶石上表面一抹白漆(扁圆片盖在顶石上)
    const smear = jitterVertices(THREE, new THREE.DodecahedronGeometry(topR * 1.05, 0), 0.12, rng);
    const s = mesh(THREE, smear, paint, 0.005, topY + topR * 0.3, 0);
    s.scale.set(1, 0.3, 1);
    pile.add(s);
    liftToGround(THREE, pile, 0.0); // 抖动/旋转后的最低石面贴地
    g.add(pile);
    return g;
  },

  // 8. 应急补给箱 1.2 m —— 亮橙卧式箱体 + 顶部白色信标灯(闪烁)+ 侧面反光条
  supplyCache(THREE) {
    const g = new THREE.Group();
    const orange = std(THREE, { color: 0xe8641e, roughness: 0.5 });
    const orangeDark = std(THREE, { color: 0xc24f12, roughness: 0.55 });
    const strip = std(THREE, { color: 0xdfe3e6, roughness: 0.25, metalness: 0.3 });
    const stem = std(THREE, { color: 0x33363c, roughness: 0.6 });
    const beaconMat = std(THREE, { color: 0x777777, emissive: 0xffffff, emissiveIntensity: 1.8 });

    // 卧式箱体 + 稍宽的箱盖
    g.add(mesh(THREE, new THREE.BoxGeometry(1.2, 0.62, 0.7), orange, 0, 0.31, 0));
    g.add(mesh(THREE, new THREE.BoxGeometry(1.24, 0.1, 0.74), orangeDark, 0, 0.66, 0));
    // 两道箱体加强箍
    for (const x of [-0.38, 0.38]) {
      g.add(mesh(THREE, new THREE.BoxGeometry(0.08, 0.64, 0.73), orangeDark, x, 0.32, 0));
    }
    // 侧面反光长条(前后两面)
    for (const z of [0.356, -0.356]) {
      g.add(mesh(THREE, new THREE.BoxGeometry(1.0, 0.07, 0.012), strip, 0, 0.18, z));
    }
    // 顶部白色小信标灯:短杆 + 发光头
    g.add(mesh(THREE, new THREE.CylinderGeometry(0.018, 0.022, 0.16, 6), stem, 0.45, 0.79, 0.2));
    g.add(mesh(THREE, new THREE.SphereGeometry(0.05, 10, 8), beaconMat, 0.45, 0.9, 0.2));

    poi(THREE, g, 'cache', 0, 0.8, 0);
    g.userData.blinkMats = [beaconMat];
    return g;
  },
};
