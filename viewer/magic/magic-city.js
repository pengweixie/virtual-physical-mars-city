// viewer/magic/magic-city.js — 魔幻城(X 键图层),从 main.js 剥离的独立模块。
// 契约:引擎调用 build(ctx) 一次;模块不 import three、不碰引擎其他部分。
// ctx = {
//   THREE,                    三方库单例(勿自行 import)
//   group,                    magicGroup —— 全部几何挂这里,随 X 键显隐
//   anims,                    push (t, dt) 每帧回调(图层可见时驱动)
//   lights,                   push PointLight —— 引擎按夜色统一调强度
//   sampleHeight(x, z),       地形采样(全城平原海拔 ~42 m)
//   renderer,                 仅用于纹理各向异性上限查询
//   T,                        i18n 文案表(水晶城加载进度按钮)
//   crystalTime, crystalDay,  水晶着色器共享 uniform(引擎每帧/每昼夜写值)
//   cryGlowMats,              push 发光盘材质 —— 引擎按夜色调 opacity
//   cityPbrMats,              【本层已不再使用】原本是水晶王城 GLB 的 PBR 材质
//                             通道;王城改为程序化自建后本层没有 GLB,此数组保持
//                             为空(引擎侧空转,契约字段保留)。renderer / T 同理。
//   player,                   【可选,引擎未提供时自动降级】{ position:Vector3,
//                             teleport?(x, z, yaw) } —— 见文件尾"总控待办"
// }
// 场址:MX,MZ = (-150,-520),城南第二平地;水晶王城在 (-170,-730) 程序化自建
// (2026-08-14 起不再懒加载 Rodin GLB —— 整层零外部资产、零加载等待)。
//
// ── 本层的自建子系统(2026-08-13 艺术轮) ─────────────────────────────
// 1. 水晶着色器:平面切面 + 色散菲涅尔边缘 + 折射视差内芯(视线折射后按
//    通道分深度采样脉络场)+ 破土生长(uGrow 波)+ 受击涟漪(uHit)。
//    4 个材质共享全部 uniform 对象,InstancedMesh 走 instanceColor。
// 2. 传送门做戏:玩家穿过符印面 → 粒子涌出(Points)+ 冲击壳 + 相机前
//    畸变闪光 + 全场水晶涟漪 + 步道涌流;真传送需要 ctx.player.teleport。
// 3. 王城活化:GLB 表面采样出的窗火点阵(呼吸明灭)、环城飞光(样条上的
//    精灵点)、王城⇄法师塔之间的能量束脉冲。
// 4. 地形融合:魔幻区外围的发光苔藓斑 + 渐密水晶碎屑(都是 InstancedMesh)
//    + 地面光晕环 + 低矮雾罩,把"科学半球→魔法半球"摊成梯度。
// 5. 确定性:本文件不使用 Math.random —— 按功能分流的 mulberry32 子流 R.<feature>()。
//
// 性能:新增几何 ~8.3k 三角形(见 dev/dev-preview-magic.html 的 HUD 实测),
// 粒子全部是 Points / InstancedMesh,ShaderMaterial 共 9 个(4 水晶 + 3 精灵
// + 能量束 + 冲击壳),不随实例数增长。
export const meta = { id: 'magic-city', name: '魔幻城', name_en: 'Magic City' };

export function build(ctx) {
  const { THREE, group: magicGroup, anims: magicAnims, lights: magicLights,
          sampleHeight, renderer, T, sunDirUniform, crystalTime, crystalDay,
          cryGlowMats, cityPbrMats } = ctx;
  const MX = -150, MZ = -520;                // second flat site, south of spawn
  // ?mlite=1 : quality tier for weak GPUs. Drops the full-screen additive
  // sheets (ground halo, mist curtain, aurora) and the flock at the end of
  // build(); nothing else changes, determinism included. Read here, not in
  // the engine, so it needs no contract change.
  const LITE = typeof location !== 'undefined'
    && new URLSearchParams(location.search).get('mlite') === '1';
  const CX = MX - 20, CZ = MZ - 210;         // crystal palace (lazy GLB) centre
  const gY = (x, z) => sampleHeight(x, z);
  magicGroup.name = 'magicCity';             // handle for ?debug=1 / capture

  // deterministic stand-in for Math.random (MODELS.md: no bare rng in assets).
  // one stream, fixed seed, fixed call order -> the city is byte-identical
  // every load, so screenshots and captures are comparable across sessions.
  const mulberry = (a0) => {
    let a = a0 | 0;
    return () => {
      a = a + 0x6d2b79f5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  };
  const rnd = mulberry(0x9a61c1);               // legacy default stream (unused)
  // One stream per feature. A single shared stream meant that inserting one
  // rnd() call anywhere reshuffled every jitter downstream of it in the file;
  // with a stream per feature, the crystal shapes, the debris scatter and the
  // wisps are independent of each other and of whatever gets added next.
  const R = Object.fromEntries(['crag', 'crystal', 'spark', 'mesa', 'vein', 'fly',
    'skirt', 'burst', 'band', 'districts', 'wisps']
    .map((k, i) => [k, mulberry(0x9a61c1 ^ Math.imul(i + 1, 0x9e3779b1))]));

  // masonry carries a faint violet self-glow at night (driven below): with only
  // point lights the tower and the capital fall to flat black silhouettes after
  // dusk, and the built structure stops reading against its own crystal
  const rock = new THREE.MeshLambertMaterial({ color: 0x96755a, flatShading: true,
    emissive: 0x2a2338 });
  const stoneDark = new THREE.MeshLambertMaterial({ color: 0x7a6e94, flatShading: true,
    emissive: 0x2e2942 });
  const stonePale = new THREE.MeshLambertMaterial({ color: 0xcfc4e0, flatShading: true,
    emissive: 0x413a5c });
  const nightStone = [rock, stoneDark, stonePale];
  // three window materials so the tower's lit spiral flickers out of step
  const WIN_BASE = new THREE.Color(0xbfe8ff);
  const winMats = [0, 1, 2].map(() =>
    new THREE.MeshBasicMaterial({ color: WIN_BASE.clone() }));
  const runeMat = new THREE.MeshBasicMaterial({ color: 0xbfe8ff });

  // ---- shared crystal uniforms (all four materials + the instanced debris) --
  const uGrow = { value: 0 };                          // 0→1 emergence wave
  const contacts = [];                                 // footprints -> contact shadows
  const contact = (x, z, r) => contacts.push([x, z, r]); // (declared early: the tower calls it)
  const uHit = { value: new THREE.Vector4(0, -999, 0, -1000) };  // xyz + t fired

  // jittered icosahedron: craggy rock, no two alike
  function cragGeometry(radius, detail, rough) {
    const g = new THREE.IcosahedronGeometry(radius, detail);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const s = 1 + (R.crag() - 0.5) * rough;
      p.setXYZ(i, p.getX(i) * s,
               p.getY(i) * s * (0.9 + R.crag() * 0.2), p.getZ(i) * s);
    }
    g.computeVertexNormals();
    return g;
  }

  // ---- faceted crystal shader ---------------------------------------------
  // flat facets (screen-space derivative normals) + chromatic fresnel rim +
  // a parallaxed inner vein field read through a refracted view ray (three
  // depths, one per channel = dispersion) + growth + strike ripple.
  const cryVert = /* glsl */`
    attribute float aH;
    #ifdef MERGED
      attribute vec3 aOrg, aUp;                 // per-vertex: this crystal's world
    #endif                                      // origin and up axis (see cryMerge)
    uniform vec3 uColor;
    uniform float uGrow;
    varying vec3 vWorldPos, vRel, vTint;
    varying float vH, vG;
    float h11(float n) { n = fract(n * 0.1031); n *= n + 33.33; n *= n + n; return fract(n); }
    void main() {
      vTint = uColor;
      #ifdef MERGED
        // hundreds of static crystals live in one mesh at the world origin:
        // the growth stagger and the vein field need each crystal's own frame,
        // so it is baked into the vertices and the scaling happens along aUp
        // about aOrg - exactly what local-space p.y / p.xz scaling did before
        vec3 org = aOrg;
        vec3 up = aUp;
        vec3 d = position - org;
        float along = dot(d, up);
        vec3 perp = d - up * along;
      #else
        mat4 m = modelMatrix;
        #ifdef USE_INSTANCING
          m = modelMatrix * instanceMatrix;
        #endif
        #ifdef USE_INSTANCING_COLOR
          vTint = instanceColor;
        #endif
        vec3 org = m[3].xyz;                      // this crystal's world origin
      #endif
      float seed = h11(org.x * 0.317 + org.z * 1.131 + org.y * 0.071);
      float g = clamp((uGrow - seed * 0.45) / 0.55, 0.0, 1.0);
      g = g * g * (3.0 - 2.0 * g);                // smoothstep ease
      vG = g;
      float gy = g * (1.0 + 0.14 * sin(g * 3.14159));   // overshoot on break-out
      float gxz = mix(0.22, 1.0, g);
      #ifdef MERGED
        vec4 wp = vec4(org + up * (along * gy) + perp * gxz, 1.0);
      #else
        vec3 p = position;
        p.y *= gy;
        p.xz *= gxz;
        vec4 wp = m * vec4(p, 1.0);
      #endif
      vWorldPos = wp.xyz;
      vRel = wp.xyz - org;                        // vein field rides the crystal
      vH = aH;
      gl_Position = projectionMatrix * viewMatrix * wp;
    }`;
  const cryFrag = /* glsl */`
    uniform vec3 uSunDir;
    uniform float uTime, uDay;
    uniform vec4 uHit;
    varying vec3 vWorldPos, vRel, vTint;
    varying float vH, vG;
    float vein(vec3 p) {
      return 0.5 + 0.5 * sin(p.x * 1.7 + p.y * 0.9)
                       * sin(p.z * 1.3 - p.y * 1.1)
                       * sin(p.y * 0.7 + p.x * 0.5);
    }
    void main() {
      vec3 n = normalize(cross(dFdx(vWorldPos), dFdy(vWorldPos)));
      vec3 v = normalize(cameraPosition - vWorldPos);
      if (dot(n, v) < 0.0) n = -n;
      float diff = max(dot(n, uSunDir), 0.0);
      float ndv = max(dot(n, v), 0.0);
      vec3 fres3 = vec3(pow(1.0 - ndv, 1.95), pow(1.0 - ndv, 2.25),
                        pow(1.0 - ndv, 2.75));    // rim splits into colour
      vec3 rd = refract(-v, n, 0.66);             // n≈1.5 glass
      vec3 q = vRel + rd * (1.4 + 3.2 * (1.0 - ndv));
      vec3 disp = vec3(vein(q * 0.85), vein(q * 0.85 + rd * 0.55),
                       vein(q * 0.85 + rd * 1.10));
      disp = pow(disp, vec3(2.4)) * (0.7 + 0.3 * vein(q * 2.6));
      float pulse = 0.75 + 0.25 * sin(uTime * 1.4
        + vWorldPos.x * 0.35 + vWorldPos.z * 0.27);
      float age = uTime - uHit.w;                 // struck: ring through the lattice
      float dh = distance(vWorldPos, uHit.xyz);
      float w = age * 30.0 - dh;
      float ring = exp(-w * w * 0.05) * exp(-age * 1.3) * exp(-dh * 0.010)
                 * step(0.0, age) * step(age, 4.0);
      vec3 base = vTint * (0.20 + 0.55 * diff * uDay);
      vec3 core = vTint * (0.35 + 0.65 * (1.0 - vH)) * 0.5 * pulse * (1.4 - uDay * 0.7);
      vec3 inner = mix(vTint, vec3(1.0), 0.30) * disp * (0.75 + (1.0 - uDay) * 0.95);
      vec3 rim = mix(vTint, vec3(1.0), 0.55) * fres3
               * (0.9 + (1.0 - uDay) * 1.5) * pulse;
      vec3 hit = mix(vTint, vec3(1.0), 0.75) * ring * 2.4;
      vec3 born = mix(vTint, vec3(1.0), 0.55) * (1.0 - vG) * vG * 3.2;  // molten
      float a = 0.80 + fres3.g * 0.15 + ring * 0.45 + (1.0 - vG) * vG * 0.5;
      gl_FragColor = vec4(base + core + inner + rim + hit + born,
                          clamp(a, 0.0, 1.0) * smoothstep(0.0, 0.10, vG));
    }`;
  const cryUniforms = (c) => ({
    uColor: { value: new THREE.Color(c) },
    uSunDir: sunDirUniform,                  // shared with the engine sky
    uTime: crystalTime,
    uDay: crystalDay,
    uGrow,
    uHit,
  });
  const cryShaderMats = [0x8fe8ff, 0xff9fe0, 0xbfa8ff, 0xffd98f].map((c) =>
    new THREE.ShaderMaterial({
      transparent: true, side: THREE.DoubleSide,
      uniforms: cryUniforms(c), vertexShader: cryVert, fragmentShader: cryFrag,
    }));
  // one more instance for the instanced debris (per-instance colour via
  // instanceColor; keeping it separate leaves the four garden mats untouched)
  const cryInstMat = new THREE.ShaderMaterial({
    transparent: true, side: THREE.DoubleSide,
    uniforms: cryUniforms(0xbfa8ff), vertexShader: cryVert, fragmentShader: cryFrag,
  });

  // Prismatic shaft + pyramid tip, per-vertex jitter so no two look alike.
  // `sides` / `tiers` are for the hero crystals: more facets give the refraction
  // shader more to break up, and each extra tier drifts sideways, so a 90 m
  // shaft kinks like real growth instead of reading as a clean extrusion.
  // The defaults reproduce the original 18-triangle crystal.
  function crystalGeometry(r, h, tip, sides = 6, tiers = 1) {
    const rings = [];
    let ox = 0, oz = 0;
    for (let t = 0; t <= tiers; t++) {
      const u = t / tiers;
      const rr = r * (1 - 0.22 * u);
      if (t > 0) {
        ox += (R.crystal() - 0.5) * r * 0.34;
        oz += (R.crystal() - 0.5) * r * 0.34;
      }
      const ring = [];
      for (let i = 0; i < sides; i++) {
        const a = i / sides * Math.PI * 2;
        const j = 1 + (R.crystal() - 0.5) * (t === 0 ? 0.25 : 0.35);
        ring.push([ox + Math.cos(a) * rr * j,
          t === 0 ? 0 : h * u * (1 + (R.crystal() - 0.5) * 0.12),
          oz + Math.sin(a) * rr * j]);
      }
      rings.push(ring);
    }
    const apex = [ox + (R.crystal() - 0.5) * r * 0.5, h + tip,
                  oz + (R.crystal() - 0.5) * r * 0.5];
    const H = h + tip;
    const pos = [], aH = [];
    const tri = (...ps) => ps.forEach((p) => {
      pos.push(...p);
      aH.push(Math.max(p[1], 0) / H);
    });
    for (let t = 0; t < tiers; t++) {
      const lo = rings[t], hi = rings[t + 1];
      for (let i = 0; i < sides; i++) {
        const j = (i + 1) % sides;
        tri(lo[i], lo[j], hi[j]);
        tri(lo[i], hi[j], hi[i]);
      }
    }
    const top = rings[tiers];
    for (let i = 0; i < sides; i++) tri(top[i], top[(i + 1) % sides], apex);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
    g.setAttribute('aH', new THREE.BufferAttribute(new Float32Array(aH), 1));
    return g;
  }

  // ---- sprite-point shader (window fire / fly-lights / portal burst) -------
  // one source, three instances. mode 0 = breathe in place, mode 1 = burst
  // outward from the spawn point along aDir.
  const sparkVert = /* glsl */`
    attribute float aPhase;
    attribute vec3 aDir;
    uniform float uTime, uT0, uSize, uSpread, uBurst;
    varying float vA;
    void main() {
      vec3 p = position;
      float a;
      if (uBurst > 0.5) {
        float age = max(uTime - uT0, 0.0);
        float k = age * (0.45 + aPhase * 1.15);
        p += aDir * uSpread * k * (1.0 - 0.3 * min(k, 1.0));
        p.y -= 2.2 * k * k;                      // they arc and fall back
        a = exp(-age * 1.05) * step(age, 5.0);
      } else {
        a = 0.42 + 0.58 * sin(uTime * (1.1 + aPhase * 2.6) + aPhase * 31.4);
        a *= a;
      }
      vA = a;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = clamp(uSize * (260.0 / max(-mv.z, 1.0)), 1.0, 24.0);
      gl_Position = projectionMatrix * mv;
    }`;
  const sparkFrag = /* glsl */`
    uniform vec3 uColor;
    uniform float uDay, uNightOnly;
    varying float vA;
    void main() {
      vec2 d = gl_PointCoord - 0.5;
      float r2 = dot(d, d);
      if (r2 > 0.25) discard;
      float f = exp(-r2 * 13.0) - 0.075;
      float night = mix(1.0, 1.0 - 0.72 * uDay, uNightOnly);
      gl_FragColor = vec4(uColor * (0.55 + 1.45 * f), max(f, 0.0) * vA * night);
    }`;
  function sparkMaterial(color, size, opts = {}) {
    return new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: sparkVert, fragmentShader: sparkFrag,
      uniforms: {
        uColor: { value: new THREE.Color(color) },
        uTime: crystalTime, uDay: crystalDay,
        uT0: { value: -1000 }, uSize: { value: size },
        uSpread: { value: opts.spread ?? 0 },
        uBurst: { value: opts.burst ? 1 : 0 },
        uNightOnly: { value: opts.nightOnly === false ? 0 : 1 },
      },
    });
  }
  // Points geometry helper: positions + per-point phase (+ burst directions)
  function sparkGeometry(pts, dirs) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3));
    const n = pts.length / 3;
    const ph = new Float32Array(n);
    for (let i = 0; i < n; i++) ph[i] = R.spark();
    g.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1));
    g.setAttribute('aDir', new THREE.BufferAttribute(
      new Float32Array(dirs || new Float32Array(n * 3)), 3));
    return g;
  }

  // glowing walkway ribbon draped on the terrain
  const pathMat = new THREE.MeshLambertMaterial(
    { color: 0x9fdcff, emissive: 0x2f7fa8, emissiveIntensity: 0.9 });
  const pathSegs = [];                          // every walkway, for the wisps
  function glowPath(x1, z1, x2, z2, w = 2.6) {
    pathSegs.push([x1, z1, x2, z2, Math.hypot(x2 - x1, z2 - z1)]);
    const len = Math.hypot(x2 - x1, z2 - z1);
    const n = Math.max(2, Math.ceil(len / 8));
    const dx = (x2 - x1) / len, dz = (z2 - z1) / len;
    const px = -dz * w / 2, pz = dx * w / 2;
    const pos = new Float32Array((n + 1) * 6);
    for (let i = 0; i <= n; i++) {
      const x = x1 + (x2 - x1) * i / n, z = z1 + (z2 - z1) * i / n;
      pos.set([x - px, gY(x - px, z - pz) + 0.2, z - pz,
               x + px, gY(x + px, z + pz) + 0.2, z + pz], i * 6);
    }
    const idx = [];
    for (let i = 0; i < n; i++) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    magicGroup.add(new THREE.Mesh(g, pathMat));
  }

  // ---- where is the player? -----------------------------------------------
  // ctx has no player handle yet (MODELS.md §4a+). Until the engine supplies
  // one, read the camera three.js hands every renderable object in
  // onBeforeRender — a one-vertex invisible Points costs nothing and keeps the
  // probe inside this module. ctx.player wins whenever it shows up.
  const playerPos = new THREE.Vector3();
  const camQuat = new THREE.Quaternion();
  let probeSeen = false;
  {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(
      new Float32Array([MX, gY(MX, MZ) + 2, MZ]), 3));
    const probe = new THREE.Points(g, new THREE.PointsMaterial(
      { size: 0, transparent: true, opacity: 0, depthWrite: false }));
    probe.frustumCulled = false;              // must render to report the camera
    probe.renderOrder = -1;
    probe.onBeforeRender = (r, s, cam) => {
      cam.getWorldPosition(playerPos);
      cam.getWorldQuaternion(camQuat);
      probeSeen = true;
    };
    magicGroup.add(probe);
  }
  const havePlayer = () => {
    if (ctx.player?.position) { playerPos.copy(ctx.player.position); return true; }
    return probeSeen;
  };
  const strike = (x, y, z, t) => uHit.value.set(x, y, z, t);   // ripple origin

  // crystal mage tower: fluted lathe body, helical ramp, spiral of lit
  // windows, embedded crystal shards and a crystal crown under the orb
  const ty = gY(MX, MZ);
  const TH = 46;
  const plinth = new THREE.Mesh(cragGeometry(11, 1, 0.4), stoneDark);
  plinth.scale.y = 0.38;
  plinth.position.set(MX, ty + 1.2, MZ);
  contact(MX, MZ, 15);
  magicGroup.add(plinth);
  {
    const pts = [];
    for (let i = 0; i <= 30; i++) {
      const t = i / 30;
      const r = 8.6 * (1 - 0.62 * t) * (1 + 0.055 * Math.sin(t * Math.PI * 7));
      pts.push(new THREE.Vector2(r, t * TH));
    }
    const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 18), stonePale);
    body.position.set(MX, ty + 2, MZ);
    magicGroup.add(body);
  }
  {
    const helix = new THREE.Curve();
    helix.getPoint = (t) => {
      const a = t * Math.PI * 6.5;
      const r = 9.6 * (1 - 0.6 * t) + 0.9;
      return new THREE.Vector3(Math.cos(a) * r, 2.5 + t * (TH - 7), Math.sin(a) * r);
    };
    const ramp = new THREE.Mesh(new THREE.TubeGeometry(helix, 160, 0.75, 7), stoneDark);
    ramp.position.set(MX, ty, MZ);
    magicGroup.add(ramp);
  }
  for (let i = 0; i < 11; i++) {               // windows follow the ramp
    const t = 0.12 + i * 0.075;
    const a = t * Math.PI * 6.5 + Math.PI / 5;
    const r = 8.6 * (1 - 0.62 * t) + 0.12;
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.2, 0.22), winMats[i % 3]);
    win.position.set(MX + Math.cos(a) * r, ty + 2 + t * TH, MZ + Math.sin(a) * r);
    win.lookAt(MX, win.position.y, MZ);
    magicGroup.add(win);
  }
  for (let i = 0; i < 6; i++) {                // crystal shards grown into it
    const t = 0.22 + (i * 37 % 52) / 100;
    const a = i * 2.4;
    const r = 8.6 * (1 - 0.62 * t) * 0.92;
    const sh = new THREE.Mesh(
      crystalGeometry(0.7, 3.2 + (i % 3), 1.8), cryShaderMats[i % 4]);
    sh.position.set(MX + Math.cos(a) * r, ty + 2 + t * TH, MZ + Math.sin(a) * r);
    sh.rotation.set(Math.sin(a) * 0.9, a, -Math.cos(a) * 0.9);
    magicGroup.add(sh);
  }
  const orb = new THREE.Mesh(new THREE.SphereGeometry(3.0, 20, 14),
    new THREE.MeshBasicMaterial({ color: 0xaef4ff }));
  {
    const topR = 8.6 * 0.38 + 0.6;             // crown of crystals
    for (let i = 0; i < 7; i++) {
      const a = i / 7 * Math.PI * 2;
      const c = new THREE.Mesh(crystalGeometry(0.9, 5.5, 2.5, 7, 2), cryShaderMats[i % 4]);
      c.position.set(MX + Math.cos(a) * topR, ty + 1.2 + TH, MZ + Math.sin(a) * topR);
      c.rotation.set(Math.sin(a) * 0.45, 0, -Math.cos(a) * 0.45);
      magicGroup.add(c);
    }
    const halo = new THREE.Mesh(new THREE.SphereGeometry(4.3, 20, 14),
      new THREE.MeshBasicMaterial({ color: 0xaef4ff, transparent: true,
        opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false }));
    magicGroup.add(orb, halo);
    magicAnims.push((t) => {
      const y = ty + TH + 8 + Math.sin(t * 0.8) * 1.4;
      orb.position.set(MX, y, MZ);
      halo.position.set(MX, y, MZ);
      halo.scale.setScalar(1 + Math.sin(t * 1.7) * 0.08);
    });
  }
  const ORB_Y = ty + TH + 8;                   // beam anchor (mean orb height)

  // ring of floating stones orbiting the tower
  const stoneRing = new THREE.Group();
  stoneRing.userData.moving = true;             // (no crystals, but be explicit)
  stoneRing.position.set(MX, ty + 33, MZ);
  for (let i = 0; i < 9; i++) {
    const a = i / 9 * Math.PI * 2;
    const st = new THREE.Mesh(cragGeometry(1.1 + (i % 3) * 0.4, 0, 0.55), rock);
    st.position.set(Math.cos(a) * 16, Math.sin(i * 2.1) * 1.8, Math.sin(a) * 16);
    st.rotation.set(i, i * 2.3, 0);
    stoneRing.add(st);
  }
  magicGroup.add(stoneRing);
  magicAnims.push((t, dt) => { stoneRing.rotation.y += dt * 0.25; });

  // crystal garden: clustered formations, each a main shaft with satellites
  const clusters = [];                         // {x, y, z} — strike targets
  for (let i = 0; i < 11; i++) {
    const a = i / 11 * Math.PI * 2 + Math.sin(i * 7) * 0.4;
    const r = 26 + (i * 37 % 46);
    const cx = MX + Math.cos(a) * r, cz = MZ + Math.sin(a) * r;
    const cy = gY(cx, cz);
    const matC = cryShaderMats[i % 4];
    const mainR = 0.9 + (i * 11 % 7) * 0.12;
    const mainH = 6 + (i * 13 % 14);
    const main = new THREE.Mesh(crystalGeometry(mainR, mainH, mainH * 0.4, 8, 3), matC);
    main.position.set(cx, cy - 0.4, cz);
    main.rotation.set(Math.sin(i * 3) * 0.12, i * 1.1, Math.cos(i * 5) * 0.12);
    magicGroup.add(main);
    clusters.push({ x: cx, y: cy + mainH * 0.5, z: cz });
    const kids = 2 + (i % 3);
    for (let k = 0; k < kids; k++) {
      const ka = (k / kids + i * 0.13) * Math.PI * 2;
      const s = 0.3 + (k * 7 % 4) * 0.08;                 // child scale
      const kid = new THREE.Mesh(
        crystalGeometry(mainR * (0.5 + s), mainH * s, mainH * s * 0.5), matC);
      const kx = cx + Math.cos(ka) * mainR * 2.2;
      const kz = cz + Math.sin(ka) * mainR * 2.2;
      kid.position.set(kx, gY(kx, kz) - 0.3, kz);
      kid.rotation.set(Math.cos(ka) * 0.45, ka, -Math.sin(ka) * 0.45);
      magicGroup.add(kid);
    }
    // soft light spill on the ground
    const glowM = new THREE.MeshBasicMaterial({
      color: cryShaderMats[i % 4].uniforms.uColor.value, transparent: true,
      opacity: 0.15, blending: THREE.AdditiveBlending, depthWrite: false });
    const disc = new THREE.Mesh(new THREE.CircleGeometry(mainR * 5, 20), glowM);
    disc.rotation.x = -Math.PI / 2;
    disc.position.set(cx, cy + 0.22, cz);
    magicGroup.add(disc);
    cryGlowMats.push(glowM);
  }

  // ---- growth clock -------------------------------------------------------
  // anims only tick while the layer is visible, so a gap in t means the player
  // just pressed X: replay the emergence from bare ground every time.
  const GROW_SECS = 4.2;
  let growT = 0, lastT = -1e9, winFlick = 0;
  magicAnims.push((t, dt) => {
    crystalTime.value = t;
    if (t - lastT > 0.5) growT = 0;            // layer was hidden -> regrow
    lastT = t;
    growT = Math.min(1, growT + dt / GROW_SECS);
    uGrow.value = growT;
    // tower windows: three phases, dimmed in daylight
    winFlick += dt;
    const dayF = crystalDay.value;
    for (const m of nightStone) m.emissiveIntensity = (1 - dayF) * 0.9;
    for (let i = 0; i < 3; i++) {
      const f = 0.62 + 0.38 * Math.sin(winFlick * (1.7 + i * 0.6) + i * 2.1)
                     * Math.sin(winFlick * 0.37 + i);
      winMats[i].color.copy(WIN_BASE).multiplyScalar(
        (0.35 + 0.65 * (1 - dayF)) * f * growT);
    }
  });

  // ---- ambient strike: the crystals notice you --------------------------
  {
    let nextStrike = 0;
    magicAnims.push((t) => {
      if (t < nextStrike || !havePlayer()) return;
      for (const c of clusters) {
        const d = Math.hypot(playerPos.x - c.x, playerPos.z - c.z);
        if (d < 5.5) { strike(c.x, c.y, c.z, t); nextStrike = t + 3.5; return; }
      }
    });
  }

  // ---- building vocabulary ------------------------------------------------
  // The capital's detail kit — per-material batcher, pointed arches, window
  // bays, three tower tops, swaying banners — extracted from the palace block
  // so every district of the city builds in the same language. Materials and
  // unit geometries live here ONCE (material count does not grow with the
  // number of buildings); makeBuilder(group) binds the kit to one building.
  const roofMat = new THREE.MeshLambertMaterial({ color: 0x565080,
    flatShading: true, emissive: 0x1c1930 });
  const trimMat = new THREE.MeshLambertMaterial({ color: 0xe6dff7,
    flatShading: true, emissive: 0x4c4576 });
  const slitMat = new THREE.MeshLambertMaterial({ color: 0x241f33 });
  const woodMat = new THREE.MeshLambertMaterial({ color: 0x54412e,
    flatShading: true, emissive: 0x1d160e });
  nightStone.push(roofMat, trimMat, woodMat);
  // the wards get their own, duller stone and grey-plum roofs: the eye needs
  // somewhere to rest in a city that is otherwise all saturated pastel
  const wardWallMat = new THREE.MeshLambertMaterial({ color: 0xb4aabf,
    flatShading: true, emissive: 0x352f45 });
  const wardRoofMat = new THREE.MeshLambertMaterial({ color: 0x4a4554,
    flatShading: true, emissive: 0x17151c });
  nightStone.push(wardWallMat, wardRoofMat);
  // batching is keyed on material identity; only static parts use these mats.
  // Crystals never batch — their shader reads each object's own origin for
  // the growth stagger and the vein field, and merging would fuse them.
  // runeMat batches safely: merging shares the material, and its colour anim
  // (portal flash) applies to the merged mesh exactly as to the parts
  const BATCHABLE = new Set([stonePale, stoneDark, rock, roofMat, trimMat,
    slitMat, woodMat, pathMat, runeMat, wardWallMat, wardRoofMat,
    winMats[0], winMats[1], winMats[2]]);
  // contact shadows: the engine has no shadow maps, so by day every mass sat
  // on the dirt like a sticker. Every building registers a footprint here and
  // the end of build() turns them into ONE InstancedMesh of soft dark discs
  // (RGBA vertex colour, normal blending) - the cheapest AO there is.
  const ARCH_HEAD = new THREE.TorusGeometry(1, 0.085, 3, 7, Math.PI);
  const JAMB = new THREE.BoxGeometry(1, 1, 1);
  const UNIT = new THREE.BoxGeometry(1, 1, 1);
  const winPts = [];                            // window-fire seeds, world space
  let nWin = 0;                                 // phase dealer for winMats
  // Hanging banners. Cloth is the one thing a fortress has that is not
  // stone, and the sway is what stops the whole city from reading as a
  // frozen model — one anim drives every banner in every district.
  const bannerMats = [0x8f6fd8, 0xd86f9f, 0x6fa8d8, 0xd8b06f].map((c) =>
    new THREE.MeshLambertMaterial({ color: c, side: THREE.DoubleSide,
      emissive: c, emissiveIntensity: 0.45, flatShading: true }));
  // deliberately NOT in nightStone: the masonry ramp would drive cloth to
  // 0.9 and the banners would read as neon strips after dusk
  const banners = [];
  const BANNER = (() => {                       // a strip with a baked ripple
    const g = new THREE.PlaneGeometry(8.5, 24, 3, 6);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const u = p.getX(i) / 8.5, v = (p.getY(i) / 24) + 0.5;
      p.setZ(i, Math.sin(u * 5.2 + v * 3.1) * 0.8 * (1 - v * 0.55));
      if (v < 0.12) p.setX(i, p.getX(i) * (0.55 + v * 3.6));   // tapered foot
    }
    g.computeVertexNormals();
    return g;
  })();
  magicAnims.push((t) => {
    for (const b of banners) {
      b.rotation.y = b.userData.ry + Math.sin(t * 0.9 + b.userData.ph) * 0.16;
      b.rotation.z = Math.sin(t * 1.3 + b.userData.ph) * 0.05;
    }
  });

  function makeBuilder(group) {
    // Placement + batching. A building detailed down to arrow slits is many
    // hundreds of small meshes = as many draw calls, a worse bill than the
    // triangles. Static parts in a BATCHABLE material are banked (geometry +
    // matrix) instead of entering the graph, and flush() merges each
    // material's worth into a single mesh. Anything animated must bypass put()
    // and go straight to group.add(), or the batch would freeze it.
    const batches = new Map();
    const put = (mesh, x, y, z, ry = 0) => {
      mesh.position.set(x, y, z);
      mesh.rotation.y = ry;
      if (BATCHABLE.has(mesh.material)) {
        mesh.updateMatrix();
        let arr = batches.get(mesh.material);
        if (!arr) batches.set(mesh.material, arr = []);
        arr.push({ g: mesh.geometry, m: mesh.matrix.clone() });
        return mesh;                            // deliberately not in the graph
      }
      group.add(mesh);
      return mesh;
    };
    const flush = () => {
      for (const [mat, parts] of batches) {
        let n = 0;
        const flat = parts.map(({ g, m }) => {
          const q = g.index ? g.toNonIndexed() : g.clone();
          q.applyMatrix4(m);                    // transforms normals too
          n += q.attributes.position.count;
          return q;
        });
        const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3);
        let o = 0;
        for (const q of flat) {
          pos.set(q.attributes.position.array, o * 3);
          if (q.attributes.normal) nor.set(q.attributes.normal.array, o * 3);
          o += q.attributes.position.count;
          q.dispose();
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
        group.add(new THREE.Mesh(g, mat));
      }
      batches.clear();
    };
    // a pointed arch (two jambs + a stretched half-torus head). Arcades are
    // the cheapest thing that reads as *architecture* rather than as boxes.
    const arch = (x, y, z, ry, w, h, d, mat) => {
      const c = Math.cos(ry), s0 = Math.sin(ry);
      for (const s of [-1, 1]) {                     // jambs, rotated into place
        const j = new THREE.Mesh(JAMB, mat);
        j.scale.set(w * 0.16, h, d);
        put(j, x + s * (w / 2) * c, y + h / 2, z - s * (w / 2) * s0, ry);
      }
      const head = new THREE.Mesh(ARCH_HEAD, mat);
      head.scale.set(w / 2, w * 0.72, d / 0.17);     // stretched = pointed
      put(head, x, y + h, z, ry);
    };
    // a window: lit box + surround (reveal, sill, pointed head) + a seed for
    // the shared window-fire sprites. Coordinates are group-local; the seed is
    // world, so every district's windows join the same Points.
    const window = (x, y, z, ry, w = 1.6, h = 3.4) => {
      put(new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.5), winMats[nWin++ % 3]),
        x, y, z, ry);
      const c = Math.cos(ry), s0 = Math.sin(ry);
      for (const s of [-1, 1]) {
        const j = new THREE.Mesh(UNIT, trimMat);
        j.scale.set(0.42, h + 0.7, 0.85);
        const d = s * (w / 2 + 0.28);
        put(j, x + d * c, y, z - d * s0, ry);
      }
      const sill = new THREE.Mesh(UNIT, trimMat);
      sill.scale.set(w + 1.6, 0.42, 1.25);
      put(sill, x, y - h / 2 - 0.3, z, ry);
      const head = new THREE.Mesh(ARCH_HEAD, trimMat);
      head.scale.set(w / 2 + 0.28, w * 0.85, 5.4);
      put(head, x, y + h / 2, z, ry);
      const r = Math.hypot(x, z) || 1;
      winPts.push(group.position.x + x + x / r * 1.2,
        group.position.y + y, group.position.z + z + z / r * 1.2);
    };
    // a tower top: corbel table, machicolated ring, parapet, then one of
    // three roofs — steep spire / onion dome / open lantern. The eye counts
    // silhouettes, not triangles.
    const spireTop = (x, z, r, y, tint, kind = 0) => {
      for (let m = 0; m < 8; m++) {                  // corbel table
        const ma = m / 8 * Math.PI * 2 + 0.2;
        put(new THREE.Mesh(new THREE.BoxGeometry(r * 0.5, 1.1, r * 0.42), trimMat),
          x + Math.cos(ma) * r * 1.12, y - 0.4, z + Math.sin(ma) * r * 1.12, -ma);
      }
      put(new THREE.Mesh(new THREE.CylinderGeometry(r * 1.28, r * 1.06, 2.6, 10),
        trimMat), x, y + 1.5, z);                    // machicolated ring
      for (let m = 0; m < 6; m++) {                  // parapet
        const ma = m / 6 * Math.PI * 2 + 0.4;
        put(new THREE.Mesh(new THREE.BoxGeometry(r * 0.62, 2.6, r * 0.62), stoneDark),
          x + Math.cos(ma) * r * 1.06, y + 4.1, z + Math.sin(ma) * r * 1.06, -ma);
        put(new THREE.Mesh(new THREE.BoxGeometry(r * 0.7, 0.4, r * 0.7), trimMat),
          x + Math.cos(ma) * r * 1.06, y + 5.5, z + Math.sin(ma) * r * 1.06, -ma);
      }
      const top = y + 5.6;
      if (kind === 1) {                              // onion dome + lantern rod
        const pts = [];
        for (let i = 0; i <= 9; i++) {
          const t = i / 9;
          const rr = Math.sin(t * Math.PI * 0.96) * (1 + 0.42 * Math.sin(t * Math.PI))
                   * (1 - t * 0.06);
          pts.push(new THREE.Vector2(Math.max(rr * r * 0.92, 0.05), t * r * 2.4));
        }
        put(new THREE.Mesh(new THREE.LatheGeometry(pts, 10), roofMat), x, top, z);
        put(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, r * 0.9, 5),
          trimMat), x, top + r * 2.4 + r * 0.45, z);
        const fin = new THREE.Mesh(crystalGeometry(r * 0.22, r * 1.0, r * 0.8),
          cryShaderMats[tint % 4]);
        put(fin, x, top + r * 3.3, z);
      } else if (kind === 2) {                       // open lantern + spire
        put(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.62, r * 0.72, r * 1.5, 8),
          stonePale), x, top + r * 0.75, z);
        for (let m = 0; m < 4; m++) {                // lantern openings
          const ma = m / 4 * Math.PI * 2 + 0.5;
          arch(x + Math.cos(ma) * r * 0.66, top + 0.2, z + Math.sin(ma) * r * 0.66,
            -ma + Math.PI / 2, r * 0.62, r * 0.85, 0.5, trimMat);
        }
        put(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.86, r * 0.7, 0.7, 8),
          trimMat), x, top + r * 1.6, z);
        put(new THREE.Mesh(new THREE.ConeGeometry(r * 0.78, r * 2.6, 8), roofMat),
          x, top + r * 1.9 + r * 1.3, z);
        const fin = new THREE.Mesh(crystalGeometry(r * 0.2, r * 0.9, r * 0.7),
          cryShaderMats[tint % 4]);
        put(fin, x, top + r * 3.4, z);
      } else {                                       // steep spire + skirt
        put(new THREE.Mesh(new THREE.ConeGeometry(r * 1.22, 3.4, 10), roofMat),
          x, top - 1.2, z);
        put(new THREE.Mesh(new THREE.ConeGeometry(r * 0.97, r * 3.8, 10), roofMat),
          x, top + 0.4 + r * 1.9, z);
        const fin = new THREE.Mesh(crystalGeometry(r * 0.26, r * 1.2, r * 0.9),
          cryShaderMats[tint % 4]);
        put(fin, x, top + 0.4 + r * 3.8, z);
      }
    };
    const banner = (x, y, z, ry, seed, sc = 1) => {
      const b = new THREE.Mesh(BANNER, bannerMats[seed % 4]);
      b.scale.setScalar(sc);                    // wall-size by default (8.5x24)
      b.position.set(x, y - 12 * sc, z);
      b.rotation.y = ry;
      b.userData.ry = ry;
      b.userData.ph = seed * 1.7;
      group.add(b);
      banners.push(b);
    };
    return { put, flush, arch, window, spireTop, banner };
  }

  // an energy link: tube + pulse shader, one material instance per beam
  function energyBeam(curve, color, radius = 1.5, segs = 72) {
    const beam = new THREE.Mesh(
      new THREE.TubeGeometry(curve, segs, radius, 6, false),
      new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: { uColor: { value: new THREE.Color(color) },
                    uTime: crystalTime, uDay: crystalDay },
        vertexShader: /* glsl */`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: /* glsl */`
          uniform vec3 uColor;
          uniform float uTime, uDay;
          varying vec2 vUv;
          void main() {
            float pulse = 0.0;
            for (int i = 0; i < 3; i++) {
              float ph = fract(uTime * 0.19 + float(i) * 0.3333);
              float d = abs(fract(vUv.x - ph + 0.5) - 0.5);
              pulse += exp(-d * d * 900.0);
            }
            float base = 0.16 + 0.08 * sin(vUv.x * 46.0 - uTime * 2.6);
            float a = (base + pulse) * (1.25 - uDay * 0.85);
            gl_FragColor = vec4(mix(uColor, vec3(1.0), min(pulse, 1.0) * 0.65),
                                clamp(a, 0.0, 1.0) * 0.6);
          }`,
      }));
    beam.frustumCulled = false;
    magicGroup.add(beam);
    return beam;
  }

  // ---- crystal palace — built here, no longer imported --------------------
  // It used to be a Rodin photoscan GLB (models/crystal/2/base_tex.glb, 1.0 M
  // triangles / 50 MB, lazy-loaded on first X). Two rounds of shader grafting
  // got it close, but a warm photoscan will never be the same object as a
  // faceted low-poly layer, and it cost a 40 s stall on first open. So the
  // capital is written in the layer's own vocabulary instead — the mage
  // tower's grammar at ten times the scale: fluted lathes, a helical ramp, lit
  // windows spiralling up, and faceted crystal grown straight through the
  // masonry. The layer now opens instantly and has no imported parts at all.
  // (The GLB path is recoverable from git — see dev/HANDOFF_magic-city.md.)
  const palace = new THREE.Group();
  palace.name = 'magicPalace';
  magicGroup.add(palace);
  let palaceGroundY = 0, palaceTopY = 0, palaceGate = null;
  {
    const NW = 12, R_WALL = 96, PHI = -Math.PI / 12, GATE = 3;
    const vA = (i) => i * Math.PI / 6 + PHI;    // wall vertex angles
    let baseY = gY(CX, CZ);                     // sit on the lowest ground we cover
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2;
      baseY = Math.min(baseY, gY(CX + Math.cos(a) * 104, CZ + Math.sin(a) * 104));
    }
    baseY -= 1.5;
    palace.position.set(CX, baseY, CZ);         // everything below is local
    contact(CX, CZ, 140);

    const { put, flush, arch, window, spireTop, banner } = makeBuilder(palace);

    // -- L0 stepped rock plinth: the castle stands on its own mesa, which is
    //    also what keeps a 200 m footprint from cutting a hard line in the dirt
    //    (scale.y is a *fraction of the radius* — 0.3 on a 128 m disc is a 38 m
    //     dome that swallows the whole curtain wall. Drive the half-height.)
    for (const [r, top, mat] of [[126, 7, rock], [104, 12, rock], [84, 16, stoneDark]]) {
      const HALF = 11;
      const step = new THREE.Mesh(cragGeometry(r, 1, 0.22), mat);
      step.scale.y = HALF / r;
      put(step, 0, top - HALF, 0);
    }

    // -- L0b the mesa is engineered, not a boulder: a battered retaining wall
    //    round each terrace, a rubble apron at its foot, and a switchback ramp
    //    cut into the north face for anything that cannot use the great stair
    for (const [rr, top, seg] of [[84, 16, 18], [104, 12, 22]]) {
      for (let i = 0; i < seg; i++) {
        const a = i / seg * Math.PI * 2;
        const ch = 2 * rr * Math.sin(Math.PI / seg);
        const ap = rr * Math.cos(Math.PI / seg);
        put(new THREE.Mesh(new THREE.BoxGeometry(ch + 1, 7, 4.5), stoneDark),
          Math.cos(a) * ap, top - 2.6, Math.sin(a) * ap, -a);
        put(new THREE.Mesh(new THREE.BoxGeometry(ch + 1.6, 0.7, 5.6), trimMat),
          Math.cos(a) * ap, top + 1.1, Math.sin(a) * ap, -a);
      }
    }
    {                                            // rubble apron, one draw call
      const RB = 150;
      const rub = new THREE.InstancedMesh(cragGeometry(1, 0, 0.7), rock, RB);
      rub.name = 'magicRubble';
      rub.frustumCulled = false;
      const mm = new THREE.Matrix4(), mq = new THREE.Quaternion();
      const mv = new THREE.Vector3(), ms = new THREE.Vector3();
      let n = 0;
      for (let i = 0; n < RB && i < RB * 4; i++) {
        const a = i * 2.39996 + 0.4;
        const band = i % 3;
        const rr = [88, 108, 128][band] + (R.mesa() - 0.5) * 13;
        const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
        if (Math.abs(x) < 24 && z > 60) continue;      // the road stays clear
        const s = 1.1 + R.mesa() * 3.4;
        mq.setFromEuler(new THREE.Euler(R.mesa() * 3, R.mesa() * 6.28, R.mesa() * 3));
        ms.set(s, s * (0.5 + R.mesa() * 0.5), s);
        mv.set(x, [16, 12, 7][band] - 5 + R.mesa() * 2.5, z);
        mm.compose(mv, mq, ms);
        rub.setMatrixAt(n++, mm);
      }
      rub.count = n;
      rub.instanceMatrix.needsUpdate = true;
      palace.add(rub);
    }
    for (let k = 0; k < 9; k++) {                // switchback ramp, north face
      const leg = k % 2 ? -1 : 1;
      const a0 = -Math.PI / 2 - leg * 0.42, a1 = -Math.PI / 2 + leg * 0.42;
      const y0 = 5 + k * 1.35, rr = 122 - k * 4.4;
      for (let s2 = 0; s2 < 8; s2++) {
        const a = a0 + (a1 - a0) * (s2 + 0.5) / 8;
        put(new THREE.Mesh(new THREE.BoxGeometry(9, 1.5, 7), stoneDark),
          Math.cos(a) * rr, y0 + s2 * 0.17, Math.sin(a) * rr, -a + Math.PI / 2);
      }
    }

    // -- L1 curtain wall: 12-gon, one side left open for the gate. A plain
    //    extruded ring reads as a toy; what sells a wall is the vertical
    //    articulation — battered base, string course, buttresses, slits.
    const chord = 2 * R_WALL * Math.sin(Math.PI / NW);
    const apo = R_WALL * Math.cos(Math.PI / NW);      // apothem: wall mid-face
    for (let i = 0; i < NW; i++) {
      if (i === GATE) continue;
      const a0 = vA(i), a1 = vA(i + 1), am = (a0 + a1) / 2;
      const mx = Math.cos(am) * apo, mz = Math.sin(am) * apo;
      const ox = -Math.sin(am), oz = Math.cos(am);    // along the wall face
      const nx = Math.cos(am), nz = Math.sin(am);     // outward normal
      put(new THREE.Mesh(new THREE.BoxGeometry(chord + 1.5, 17, 6), stonePale),
        mx, 24.5, mz, -am);
      put(new THREE.Mesh(new THREE.BoxGeometry(chord + 2.5, 6, 8.4), stoneDark),
        mx + nx * 0.6, 19, mz + nz * 0.6, -am);       // battered base course
      put(new THREE.Mesh(new THREE.BoxGeometry(chord + 2, 0.9, 7.2), trimMat),
        mx + nx * 0.5, 28.5, mz + nz * 0.5, -am);     // string course
      for (const s of [-1, 1]) {                      // buttresses
        put(new THREE.Mesh(new THREE.BoxGeometry(3, 13, 3.4), stonePale),
          mx + ox * s * chord * 0.27 + nx * 2.6, 22.5,
          mz + oz * s * chord * 0.27 + nz * 2.6, -am);
      }
      for (let s = -1; s <= 1; s++) {                 // arrow slits
        put(new THREE.Mesh(new THREE.BoxGeometry(0.55, 3.4, 0.5), slitMat),
          mx + ox * s * chord * 0.28 + nx * 3.05, 26,
          mz + oz * s * chord * 0.28 + nz * 3.05, -am);
      }
      // machicolation: a corbel table carrying an overhanging parapet. This is
      // the band the eye reads as "fortress" from 200 m out.
      for (let k = 0; k < 7; k++) {
        const u = (k + 0.5) / 7 - 0.5;
        put(new THREE.Mesh(new THREE.BoxGeometry(1.5, 2, 2.4), trimMat),
          mx + ox * chord * u + nx * 3.7, 31.3, mz + oz * chord * u + nz * 3.7, -am);
      }
      put(new THREE.Mesh(new THREE.BoxGeometry(chord + 1.5, 2.6, 8.6), stonePale),
        mx + nx * 1.3, 33.6, mz + nz * 1.3, -am);     // overhanging parapet
      put(new THREE.Mesh(new THREE.BoxGeometry(chord - 1, 2.2, 1.4), stoneDark),
        mx - nx * 2.3, 33.6, mz - nz * 2.3, -am);     // inner parapet: a walkway
      // glowing rune seam along the parapet — same material as the walkways,
      // so it surges with them when the portal fires
      put(new THREE.Mesh(new THREE.BoxGeometry(chord, 0.5, 1.6), pathMat),
        mx + nx * 4.6, 34.4, mz + nz * 4.6, -am);
      for (let m = 0; m < 5; m++) {                   // crenellations
        const u = (m + 0.5) / 5 - 0.5;
        put(new THREE.Mesh(new THREE.BoxGeometry(3.4, 3.4, 8.6), stoneDark),
          mx + ox * chord * u + nx * 1.3, 36.6, mz + oz * chord * u + nz * 1.3, -am);
        put(new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.5, 9), trimMat),
          mx + ox * chord * u + nx * 1.3, 38.5, mz + oz * chord * u + nz * 1.3, -am);
        put(new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.8, 0.5), slitMat),
          mx + ox * chord * u + nx * 5.6, 36.4,
          mz + oz * chord * u + nz * 5.6, -am);       // merlon loophole
      }
    }
    // wall towers on every vertex — slimmer and much taller than the wall, so
    // the skyline has rhythm instead of one flat band
    for (let i = 0; i < NW; i++) {
      const a = vA(i), gt = i === GATE || i === GATE + 1;
      const r = gt ? 8.6 : 6.8, hgt = gt ? 42 : 34 + (i % 3) * 4;
      const x = Math.cos(a) * R_WALL, z = Math.sin(a) * R_WALL;
      put(new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.16, hgt, 10), stonePale),
        x, 16 + hgt / 2, z, a);
      put(new THREE.Mesh(new THREE.CylinderGeometry(r * 1.1, r * 1.24, 1.6, 10),
        trimMat), x, 21.5, z, a);                     // plinth moulding
      for (const sy of [0.42, 0.74]) {                // string courses up the shaft
        put(new THREE.Mesh(new THREE.CylinderGeometry(r * 1.05, r * 1.05, 0.7, 10),
          trimMat), x, 16 + hgt * sy, z, a);
      }
      spireTop(x, z, r, 16 + hgt, i, i % 3);
      for (let w = 0; w < 2; w++) {
        window(x * (1 - 0.02), 25 + w * 10, z * (1 - 0.02), a + Math.PI / 2, 1.3, 2.8);
      }
      put(new THREE.Mesh(new THREE.BoxGeometry(0.55, 3.6, 0.5), slitMat),
        x * (1 + 0.055), 38 + (i % 3) * 3, z * (1 + 0.055), a + Math.PI / 2);
      if (i % 4 === 1) {                              // bartizan on some towers
        const ba = a + 0.9;
        const bx = x + Math.cos(ba) * r * 0.95, bz = z + Math.sin(ba) * r * 0.95;
        put(new THREE.Mesh(new THREE.ConeGeometry(2.4, 4.5, 7), trimMat),
          bx, 16 + hgt * 0.58, bz);                   // corbel under it
        put(new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 7, 7), stonePale),
          bx, 16 + hgt * 0.58 + 5.6, bz);
        put(new THREE.Mesh(new THREE.ConeGeometry(3.0, 5, 7), roofMat),
          bx, 16 + hgt * 0.58 + 11.5, bz);
        put(new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.4, 0.5), slitMat),
          bx + Math.cos(ba) * 2.5, 16 + hgt * 0.58 + 5.6, bz + Math.sin(ba) * 2.5,
          ba + Math.PI / 2);
      }
      // a lamp hung between this tower and the next
      const an = vA(i + 1), lam = (a + an) / 2;
      const lc = new THREE.Mesh(crystalGeometry(0.75, 3.4, 1.6), cryShaderMats[(i + 2) % 4]);
      lc.rotation.x = Math.PI;
      put(lc, Math.cos(lam) * (R_WALL + 3.4), 31, Math.sin(lam) * (R_WALL + 3.4));
      if (i !== GATE) banner(Math.cos(lam) * (R_WALL + 3.4), 37,
        Math.sin(lam) * (R_WALL + 3.4), -lam + Math.PI / 2, i);
    }
    {                                            // -- the great gate, facing the tower
      const am = (vA(GATE) + vA(GATE + 1)) / 2;
      const gx = Math.cos(am) * R_WALL * Math.cos(Math.PI / NW);
      const gz = Math.sin(am) * R_WALL * Math.cos(Math.PI / NW);
      // a gatehouse, not two posts: solid block either side of a 19 m opening,
      // a lintel over it, and a lit membrane in the gap so the eye finds the
      // door from the far end of the walkway
      const ox = -Math.sin(am), oz = Math.cos(am);        // along the wall
      const nx2 = Math.cos(am), nz2 = Math.sin(am);       // outward, down the road
      for (const s of [-1, 1]) {                          // jambs
        put(new THREE.Mesh(new THREE.BoxGeometry(11, 30, 9), stonePale),
          gx + ox * s * 15, 31, gz + oz * s * 15, -am);
        put(new THREE.Mesh(new THREE.BoxGeometry(11, 0.5, 2), pathMat),
          gx + ox * s * 15, 46.3, gz + oz * s * 15, -am);
        for (let m = 0; m < 3; m++) {                     // merlons on the jamb
          put(new THREE.Mesh(new THREE.BoxGeometry(2.8, 3, 9), stoneDark),
            gx + ox * (s * 15 + (m - 1) * 3.8), 47.5,
            gz + oz * (s * 15 + (m - 1) * 3.8), -am);
        }
      }
      put(new THREE.Mesh(new THREE.BoxGeometry(41, 8, 9), stonePale),
        gx, 42, gz, -am);                                 // lintel
      put(new THREE.Mesh(new THREE.BoxGeometry(41, 0.6, 2), pathMat),
        gx, 46.3, gz, -am);
      for (const s of [-1, 1]) {                          // finials over the arch
        const c = new THREE.Mesh(crystalGeometry(1.4, 9, 4), cryShaderMats[s > 0 ? 0 : 2]);
        put(c, gx + ox * s * 6, 46.5, gz + oz * s * 6);
      }
      const film = new THREE.Mesh(new THREE.PlaneGeometry(19, 22),
        new THREE.MeshBasicMaterial({ color: 0x9fe8ff, transparent: true,
          opacity: 0.3, side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending, depthWrite: false }));
      put(film, gx, 27, gz, -am);                // the hall breathes through it
      magicAnims.push((t) => {
        film.material.opacity = (0.16 + Math.sin(t * 0.9) * 0.08)
          * (1.35 - crystalDay.value);
      });
      // crystals flanking the road in — nothing on the centreline, or you walk
      // up to the capital with a 17 m shaft parked in front of the door
      const flank = [-27, -15, 15, 27];
      for (let i = 0; i < flank.length; i++) {
        const s = flank[i];
        const c = new THREE.Mesh(crystalGeometry(1.4, 9 + (i % 3) * 4, 5, 7, 2),
          cryShaderMats[i % 4]);
        const cx2 = gx - Math.sin(am) * s + Math.cos(am) * 18;
        const cz2 = gz + Math.cos(am) * s + Math.sin(am) * 18;
        put(c, cx2, gY(CX + cx2, CZ + cz2) - baseY - 0.6, cz2);
      }
      // two guardians on the gate piers. Abstract — a robed lathe under a
      // crystal head — but a figure at human scale is what tells the eye how
      // big everything else is.
      for (const s2 of [-1, 1]) {
        // at the head of the stair, flanking the road — not against the wall,
        // where the gate towers already are
        const gx2 = gx + ox * s2 * 16 + nx2 * 7, gz2 = gz + oz * s2 * 16 + nz2 * 7;
        put(new THREE.Mesh(new THREE.BoxGeometry(7, 6, 7), stoneDark), gx2, 17.5, gz2, -am);
        put(new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.6, 7.8), trimMat),
          gx2, 20.8, gz2, -am);
        const pts = [];
        for (let k = 0; k <= 8; k++) {
          const t = k / 8;
          pts.push(new THREE.Vector2(
            2.7 * (1 - t * 0.62) * (1 + 0.22 * Math.sin(t * Math.PI * 2.2)), t * 13));
        }
        put(new THREE.Mesh(new THREE.LatheGeometry(pts, 9), stonePale), gx2, 21, gz2);
        put(new THREE.Mesh(new THREE.BoxGeometry(6.4, 1.6, 2.4), stonePale),
          gx2, 31, gz2, -am);                    // shoulders
        const head = new THREE.Mesh(crystalGeometry(1.1, 3.2, 1.6, 8, 2),
          cryShaderMats[s2 > 0 ? 0 : 2]);
        put(head, gx2, 32.9, gz2);
        const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 17, 5),
          stoneDark);
        put(staff, gx2 + ox * s2 * 3.6, 28.5, gz2 + oz * s2 * 3.6);
        const orb2 = new THREE.Mesh(crystalGeometry(0.9, 2.6, 1.3, 7, 2),
          cryShaderMats[s2 > 0 ? 3 : 1]);
        put(orb2, gx2 + ox * s2 * 3.6, 37, gz2 + oz * s2 * 3.6);
      }
      // a stair up the mesa and a barbican either side of it: the capital used
      // to be enterable only by levitation
      for (let s2 = 0; s2 < 11; s2++) {
        const u = s2 / 10;
        put(new THREE.Mesh(new THREE.BoxGeometry(23, 1.9, 5.4), stoneDark),
          gx + nx2 * (42 - u * 40), 6.4 + u * 10.4, gz + nz2 * (42 - u * 40), -am);
      }
      for (const s2 of [-1, 1]) {
        put(new THREE.Mesh(new THREE.BoxGeometry(3.4, 7, 40), stonePale),
          gx + ox * s2 * 14 + nx2 * 24, 13, gz + oz * s2 * 14 + nz2 * 24, -am);
        put(new THREE.Mesh(new THREE.BoxGeometry(4, 0.6, 40), pathMat),
          gx + ox * s2 * 14 + nx2 * 24, 16.8, gz + oz * s2 * 14 + nz2 * 24, -am);
        for (let m = 0; m < 7; m++) {            // the barbican gets a parapet
          const d2 = 24 + (m - 3) * 5.4;
          put(new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.6, 2.8), stoneDark),
            gx + ox * s2 * 14 + nx2 * d2, 18.4, gz + oz * s2 * 14 + nz2 * d2, -am);
          put(new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.4, 3.2), trimMat),
            gx + ox * s2 * 14 + nx2 * d2, 19.9, gz + oz * s2 * 14 + nz2 * d2, -am);
        }
        for (let p = 0; p < 3; p++) {            // pylons along the barbican
          const c = new THREE.Mesh(crystalGeometry(1.0, 6, 2.6),
            cryShaderMats[(p + (s2 > 0 ? 1 : 3)) % 4]);
          put(c, gx + ox * s2 * 14 + nx2 * (10 + p * 14), 17,
            gz + oz * s2 * 14 + nz2 * (10 + p * 14));
        }
      }
    }

    // -- L1b the courtyard is inhabited: a ring of small halls whose roofs
    //    just clear the parapet. Nothing says "capital" like rooflines behind
    //    a wall, and at 20 triangles each they are the cheapest thing here.
    // two rings of houses, tall enough that their roofs break the parapet
    // line. A bailey with nothing in it is just a gap between two cylinders.
    for (let ring = 0; ring < 2; ring++) {
      const N = ring ? 16 : 13, R0h = ring ? 84 : 66;
      for (let i = 0; i < N; i++) {
        const a = i / N * Math.PI * 2 + (ring ? 0.19 : 0.42);
        let d = Math.abs(a - Math.PI / 2);
        d = Math.min(d, Math.PI * 2 - d);
        if (d < 0.30) continue;                 // leave the gate street open
        const r = R0h + ((i * 5) % 3) * 3.5;
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        const w = 8 + ((i * 7) % 3) * 3.5, dep = 7 + ((i * 3) % 2) * 2.5;
        const h = 10 + ((i * 11) % 4) * 5;      // 10..25 → some clear the wall
        put(new THREE.Mesh(new THREE.BoxGeometry(w, h, dep), stonePale),
          x, 16 + h / 2, z, -a);
        put(new THREE.Mesh(new THREE.BoxGeometry(w + 1.2, 0.6, dep + 1.2), trimMat),
          x, 16 + h + 0.2, z, -a);              // eaves
        const roof = new THREE.Mesh(new THREE.ConeGeometry(w * 0.72, 5 + h * 0.16, 4),
          roofMat);
        roof.scale.set(1, 1, dep / w);
        put(roof, x, 16 + h + 2.6 + h * 0.08, z, -a + Math.PI / 4);
        put(new THREE.Mesh(new THREE.BoxGeometry(1.6, 4.5, 1.6), stoneDark),
          x + Math.cos(a + 1.2) * w * 0.28, 16 + h + 4, z + Math.sin(a + 1.2) * w * 0.28,
          -a);                                  // chimney
        window(x + Math.cos(a) * (dep / 2 + 0.3), 16 + h * 0.45,
          z + Math.sin(a) * (dep / 2 + 0.3), a + Math.PI / 2, 1.5, 2.6);
        if (h > 18) {
          window(x + Math.cos(a) * (dep / 2 + 0.3), 16 + h * 0.78,
            z + Math.sin(a) * (dep / 2 + 0.3), a + Math.PI / 2, 1.4, 2.2);
        }
      }
    }
    {                                            // the gate street and its market
      const am = Math.PI / 2;
      for (let k = 0; k < 9; k++) {
        const r = 76 + k * 2.4;
        put(new THREE.Mesh(new THREE.BoxGeometry(19, 0.5, 2.6), stoneDark),
          0, 16.3, Math.sin(am) * r);
      }
      put(new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.4, 22), pathMat), -9, 16.5, 86);
      put(new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.4, 22), pathMat), 9, 16.5, 86);
      for (let k = 0; k < 8; k++) {              // stalls under awnings
        const s2 = k % 2 ? 1 : -1, zz = 78 + Math.floor(k / 2) * 6.5;
        put(new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.6, 3.6), stoneDark),
          s2 * 13.5, 17.5, zz);
        put(new THREE.Mesh(new THREE.BoxGeometry(6, 0.4, 5), roofMat),
          s2 * 13.5, 19.4, zz);
        const lc = new THREE.Mesh(crystalGeometry(0.5, 1.8, 0.9),
          cryShaderMats[k % 4]);
        put(lc, s2 * 13.5, 19.8, zz);
      }
      for (let k = 0; k < 6; k++) {              // steps up onto the terrace
        put(new THREE.Mesh(new THREE.BoxGeometry(16, 1.1, 3), stoneDark),
          0, 16.6 + k * 1.05, 74 - k * 2.4);
      }
    }

    // -- L1d the courtyard floor: a stepped terrace skirting the drum, so the
    //    bailey is a place rather than a gap between two cylinders
    for (const [r0, y0, h0] of [[70, 16, 3.2], [64, 19, 3.2], [59, 22, 3.6]]) {
      put(new THREE.Mesh(new THREE.CylinderGeometry(r0, r0 + 1.4, h0, 28),
        stoneDark), 0, y0 + h0 / 2, 0);
      put(new THREE.Mesh(new THREE.CylinderGeometry(r0 + 0.4, r0 + 0.4, 0.5, 28),
        trimMat), 0, y0 + h0, 0);
    }
    for (let i = 0; i < 6; i++) {                // lamp posts round the terrace
      const a = i / 6 * Math.PI * 2 + 0.5;
      const x = Math.cos(a) * 74, z = Math.sin(a) * 74;
      put(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 7, 5), stoneDark),
        x, 19.5, z);
      const lc = new THREE.Mesh(crystalGeometry(1.1, 3.2, 1.6), cryShaderMats[i % 4]);
      put(lc, x, 23, z);
    }

    // -- L2 inner ward: a fluted drum lifting the keep clear of the wall
    {
      const pts = [];
      for (let i = 0; i <= 12; i++) {
        const t = i / 12;
        const r = 58 * (1 - 0.10 * t) * (1 + 0.045 * Math.sin(t * Math.PI * 6));
        pts.push(new THREE.Vector2(r, 8 + t * 34));
      }
      put(new THREE.Mesh(new THREE.LatheGeometry(pts, 20), stonePale), 0, 0, 0);
      // the only part of the drum that clears the curtain wall is its top 9 m,
      // so all of its detail money goes there: a corbel arcade under a
      // parapet, which is what turns a smooth cylinder into a building
      for (let i = 0; i < 20; i++) {
        const a = i / 20 * Math.PI * 2, r = 53.6;
        arch(Math.cos(a) * r, 31, Math.sin(a) * r, -a + Math.PI / 2,
          8.4, 4.6, 1.6, trimMat);
        put(new THREE.Mesh(new THREE.BoxGeometry(6.4, 3.4, 2.2), stoneDark),
          Math.cos(a + Math.PI / 20) * r, 42.6, Math.sin(a + Math.PI / 20) * r,
          -a - Math.PI / 20 + Math.PI / 2);
      }
      put(new THREE.Mesh(new THREE.TorusGeometry(53, 1.4, 6, 24)
        .rotateX(Math.PI / 2), pathMat), 0, 40.8, 0);       // lit cornice
      for (let i = 0; i < 20; i++) {             // two rows of ward windows
        const a = i / 20 * Math.PI * 2;
        for (const [y, r] of [[20, 56.5], [36, 54.0]]) {
          window(Math.cos(a) * r, y, Math.sin(a) * r, a + Math.PI / 2);
        }
      }
    }

    // -- L3 the keep: the mage tower's own profile, grown to capital scale
    const WARD = 42, KEEP_H = 96;
    {
      const pts = [];
      for (let i = 0; i <= 26; i++) {
        const t = i / 26;
        const r = 27 * (1 - 0.60 * t) * (1 + 0.05 * Math.sin(t * Math.PI * 9));
        pts.push(new THREE.Vector2(r, t * KEEP_H));
      }
      put(new THREE.Mesh(new THREE.LatheGeometry(pts, 24), stonePale), 0, WARD, 0);
      const helix = new THREE.Curve();           // the ramp, echoing the tower
      helix.getPoint = (t) => {
        const a = t * Math.PI * 5.5;
        const r = 29 * (1 - 0.58 * t) + 1.6;
        return new THREE.Vector3(Math.cos(a) * r, t * (KEEP_H - 10), Math.sin(a) * r);
      };
      const ramp = new THREE.Mesh(new THREE.TubeGeometry(helix, 96, 1.7, 5), stoneDark);
      put(ramp, 0, WARD + 3, 0);
      for (let i = 0; i < 15; i++) {             // windows follow the ramp
        const t = 0.10 + i * 0.058;
        const a = t * Math.PI * 5.5 + Math.PI / 4;
        const r = 27 * (1 - 0.60 * t) + 0.2;
        window(Math.cos(a) * r, WARD + t * KEEP_H, Math.sin(a) * r,
          a + Math.PI / 2, 1.7, 3.8);
      }
      // -- the keep's own articulation. A bare lathe is a chimney; pilasters
      //    give it vertical rhythm, the lit tracery between them gives it the
      //    layer's magic, and a corbelled crown gives it a head.
      const kr = (t) => 27 * (1 - 0.60 * t);     // keep radius at height t
      for (let i = 0; i < 10; i++) {
        const a = i / 10 * Math.PI * 2 + 0.31;
        for (const [t0, t1] of [[0.02, 0.42], [0.44, 0.82]]) {
          const rm = kr((t0 + t1) / 2) + 0.5, hh = (t1 - t0) * KEEP_H;
          put(new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.7, hh, 4), stonePale),
            Math.cos(a) * rm, WARD + (t0 + t1) / 2 * KEEP_H, Math.sin(a) * rm, a);
        }
        const rt = kr(0.24) + 0.9;               // lit tracery between pilasters
        put(new THREE.Mesh(new THREE.BoxGeometry(0.6, KEEP_H * 0.34, 0.6), pathMat),
          Math.cos(a + 0.31) * rt, WARD + KEEP_H * 0.26, Math.sin(a + 0.31) * rt);
      }
      {                                          // gallery arcade round the base
        const r = kr(0.06) + 0.6;
        for (let i = 0; i < 14; i++) {
          const a = i / 14 * Math.PI * 2;
          arch(Math.cos(a) * r, WARD + 5, Math.sin(a) * r, -a + Math.PI / 2,
            9, 7.5, 1.8, trimMat);
        }
      }
      {                                          // machicolated crown
        const r = kr(0.97);
        put(new THREE.Mesh(new THREE.CylinderGeometry(r * 1.34, r * 1.02, 3.2, 24),
          trimMat), 0, WARD + KEEP_H - 2.6, 0);
        for (let i = 0; i < 12; i++) {
          const a = i / 12 * Math.PI * 2;
          put(new THREE.Mesh(new THREE.BoxGeometry(2.8, 3.4, 2.4), stoneDark),
            Math.cos(a) * r * 1.2, WARD + KEEP_H + 1.4, Math.sin(a) * r * 1.2, -a);
        }
      }
      {                                          // rose window, facing the gate
        const a = Math.PI / 2, r = kr(0.20) + 0.4;
        const rose = new THREE.Mesh(new THREE.TorusGeometry(4.6, 0.42, 3, 12),
          trimMat);
        rose.rotation.y = -a + Math.PI / 2;
        put(rose, Math.cos(a) * r, WARD + KEEP_H * 0.22, Math.sin(a) * r);
        const pane = new THREE.Mesh(new THREE.CircleGeometry(4.4, 12),
          new THREE.MeshBasicMaterial({ color: 0xbfe8ff, transparent: true,
            opacity: 0.5, side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending, depthWrite: false }));
        put(pane, Math.cos(a) * r, WARD + KEEP_H * 0.22, Math.sin(a) * r,
          -a + Math.PI / 2);
        magicAnims.push((t) => {
          pane.material.opacity = (0.28 + Math.sin(t * 1.1 + 2) * 0.12)
            * (1.3 - crystalDay.value);
        });
      }
      for (let i = 0; i < 9; i++) {              // crown of crystals
        const a = i / 9 * Math.PI * 2;
        const rr = 27 * 0.40 + 1.2;
        const c = new THREE.Mesh(crystalGeometry(1.9, 13, 6, 7, 2), cryShaderMats[i % 4]);
        c.position.set(Math.cos(a) * rr, WARD + KEEP_H + 1, Math.sin(a) * rr);
        c.rotation.set(Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4);
        palace.add(c);
      }
      {                                          // crowning lantern: the keep
        // needs a head, not just a flat top under a ring of crystal
        const ly = WARD + KEEP_H + 2;
        put(new THREE.Mesh(new THREE.CylinderGeometry(7.6, 8.4, 13, 8), stonePale),
          0, ly + 6.5, 0);
        for (let m = 0; m < 8; m++) {
          const ma = m / 8 * Math.PI * 2 + 0.39;
          arch(Math.cos(ma) * 7.8, ly + 1, Math.sin(ma) * 7.8, -ma + Math.PI / 2,
            4.4, 8, 0.7, trimMat);
          put(new THREE.Mesh(new THREE.BoxGeometry(1.5, 13, 1.5), stonePale),
            Math.cos(ma + Math.PI / 8) * 8.1, ly + 6.5,
            Math.sin(ma + Math.PI / 8) * 8.1, -ma);
        }
        put(new THREE.Mesh(new THREE.CylinderGeometry(9.6, 7.8, 1.6, 8), trimMat),
          0, ly + 13.6, 0);
        put(new THREE.Mesh(new THREE.ConeGeometry(9.0, 24, 8), roofMat),
          0, ly + 14.4 + 12, 0);
        const fin = new THREE.Mesh(crystalGeometry(2.0, 11, 5, 8, 2), cryShaderMats[1]);
        put(fin, 0, ly + 26, 0);
        put(new THREE.Mesh(new THREE.BoxGeometry(0.5, 9, 0.5), pathMat),
          0, ly + 30, 0);
      }
      // real flying buttresses: pier on the ward, arc up to the keep, pinnacle
      // on top. A cathedral silhouette is mostly this.
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * Math.PI * 2 + Math.PI / 8;
        let dg = Math.abs(a - Math.PI / 2); dg = Math.min(dg, Math.PI * 2 - dg);
        let dh = Math.abs(a - Math.PI); dh = Math.min(dh, Math.PI * 2 - dh);
        if (dg < 0.4 || dh < 0.4) continue;      // clear the rose window & hall
        const pr = 48, px2 = Math.cos(a) * pr, pz2 = Math.sin(a) * pr;
        put(new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3.2, 22, 6), stonePale),
          px2, WARD + 11, pz2, a);
        put(new THREE.Mesh(new THREE.ConeGeometry(2.6, 7, 6), roofMat),
          px2, WARD + 25, pz2, a);
        const fin = new THREE.Mesh(crystalGeometry(0.8, 5, 2.4), cryShaderMats[i % 4]);
        put(fin, px2, WARD + 29, pz2);
        const arc2 = new THREE.CatmullRomCurve3([
          new THREE.Vector3(px2, WARD + 20, pz2),
          new THREE.Vector3(Math.cos(a) * 38, WARD + 34, Math.sin(a) * 38),
          new THREE.Vector3(Math.cos(a) * (kr(0.34) + 1), WARD + KEEP_H * 0.34,
            Math.sin(a) * (kr(0.34) + 1)),
        ]);
        put(new THREE.Mesh(new THREE.TubeGeometry(arc2, 14, 1.15, 5), stonePale),
          0, 0, 0);
      }
    }

    // -- L3b the great hall and the annex. Three concentric drums is a
    //    generator's silhouette; a building looks designed when something
    //    sticks out of it asymmetrically.
    // a wing that projects past the ward's rim, carried on piers down to the
    // courtyard — that overhang is what breaks the concentric-drum reading
    const wing = (a, len, wid, hgt, apse) => {
      const c = Math.cos(a), s0 = Math.sin(a);
      const P = (rad, tan, y) => [c * rad - s0 * tan, y, s0 * rad + c * tan];
      // the inner end starts at 44 so most of the wing clears the drum's 52 m
      // rim — buried inside it, a projecting wing projects nothing
      const mid = 44 + len / 2;
      let p = P(mid, 0, 0);
      put(new THREE.Mesh(new THREE.BoxGeometry(len, hgt, wid), stonePale),
        p[0], WARD + hgt / 2, p[2], -a);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(wid * 0.78, hgt * 0.52, 4),
        roofMat);
      roof.scale.set(len / wid * 0.92, 1, 1);
      put(roof, p[0], WARD + hgt + hgt * 0.2, p[2], -a + Math.PI / 4);
      put(new THREE.Mesh(new THREE.BoxGeometry(len + 1.5, 0.8, wid + 1.5), trimMat),
        p[0], WARD + hgt + 0.4, p[2], -a);
      for (const sd of [-1, 1]) {                // aisle bays: window + buttress
        for (let k = -1; k <= 1; k++) {
          const wp = P(mid + k * len * 0.28, sd * (wid / 2 + 0.2), 0);
          window(wp[0], WARD + hgt * 0.55, wp[2], a + (sd > 0 ? 0 : Math.PI),
            wid * 0.14, hgt * 0.5);
          const bp = P(mid + k * len * 0.28 + len * 0.14, sd * (wid / 2 + 1.5), 0);
          put(new THREE.Mesh(new THREE.BoxGeometry(2.8, hgt * 0.9, 3.6), stonePale),
            bp[0], WARD + hgt * 0.45, bp[2], -a);
        }
      }
      for (const sd of [-1, 1]) {                // piers carrying the overhang
        for (const rd of [mid + len * 0.18, mid + len * 0.44]) {
          const pp = P(rd, sd * (wid / 2 - 1.5), 0);
          put(new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.6, WARD - 16, 6),
            stonePale), pp[0], 16 + (WARD - 16) / 2, pp[2], -a);
        }
      }
      if (apse) {                                // rounded east end
        const pts = [];
        for (let k = 0; k <= 8; k++) {
          const t = k / 8;
          pts.push(new THREE.Vector2(wid / 2 * Math.sqrt(1 - t * t * 0.55) || 0.1,
            t * hgt));
        }
        p = P(mid + len / 2, 0, 0);
        put(new THREE.Mesh(new THREE.LatheGeometry(pts, 10), stonePale),
          p[0], WARD, p[2]);
      }
      p = P(44 + len + 2, 0, 0);                 // great window on the end wall
      window(p[0], WARD + hgt * 0.5, p[2], a + Math.PI / 2, wid * 0.3, hgt * 0.6);
    };
    wing(Math.PI, 40, 24, 25, false);            // the great hall, west
    wing(Math.PI * 1.5, 26, 17, 19, true);       // the chapel with its apse, south
    {                                            // the annex: a slim signal tower
      const a = 0, tx = Math.cos(a) * 36, tz = Math.sin(a) * 36;
      const pts = [];
      for (let k = 0; k <= 10; k++) {
        const t = k / 10;
        const r = 6.6 * (1 - 0.26 * t) * (1 + 0.05 * Math.sin(t * Math.PI * 4));
        pts.push(new THREE.Vector2(r, t * 58));
      }
      put(new THREE.Mesh(new THREE.LatheGeometry(pts, 10), stonePale), tx, WARD, tz);
      for (let k = 0; k < 4; k++) {
        window(tx + Math.cos(a + k * 1.6) * 6.4, WARD + 12 + k * 12,
          tz + Math.sin(a + k * 1.6) * 6.4, a + k * 1.6 + Math.PI / 2, 1.5, 3.4);
      }
      spireTop(tx, tz, 5.4, WARD + 58, 3, 1);
    }

    // -- L4 four flanking towers on the ward
    for (let i = 0; i < 4; i++) {
      const a = i / 4 * Math.PI * 2 + Math.PI / 4;
      const x = Math.cos(a) * 40, z = Math.sin(a) * 40;
      const pts = [];
      for (let k = 0; k <= 12; k++) {
        const t = k / 12;
        const r = 11 * (1 - 0.38 * t) * (1 + 0.05 * Math.sin(t * Math.PI * 5));
        pts.push(new THREE.Vector2(r, t * 46));
      }
      put(new THREE.Mesh(new THREE.LatheGeometry(pts, 14), stonePale), x, WARD - 4, z);
      spireTop(x, z, 7.4, WARD + 42, i + 1);     // same head as the wall towers
      for (let w = 0; w < 3; w++) {
        const wa = a + w * 2.1;
        window(x + Math.cos(wa) * 9.6, WARD + 8 + w * 12, z + Math.sin(wa) * 9.6,
          wa + Math.PI / 2, 1.4, 3.0);
      }
      // -- L6 flying bridge from the keep to each tower, plus a thinner rib
      //    below it — one arc alone reads as a wire, a pair reads as structure
      const arc = new THREE.CatmullRomCurve3([
        new THREE.Vector3(Math.cos(a) * 20, WARD + 40, Math.sin(a) * 20),
        new THREE.Vector3(Math.cos(a) * 30, WARD + 50, Math.sin(a) * 30),
        new THREE.Vector3(x, WARD + 34, z),
      ]);
      put(new THREE.Mesh(new THREE.TubeGeometry(arc, 20, 1.5, 5), stoneDark), 0, 0, 0);
      for (let k = 1; k < 10; k++) {             // balustrade, so it reads as a
        const p = arc.getPoint(k / 10);          // bridge and not as a cable
        put(new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.6, 0.7), trimMat),
          p.x, p.y + 1.9, p.z, a);
      }
      const rib = new THREE.CatmullRomCurve3([
        new THREE.Vector3(Math.cos(a) * 17, WARD + 16, Math.sin(a) * 17),
        new THREE.Vector3(Math.cos(a) * 29, WARD + 34, Math.sin(a) * 29),
        new THREE.Vector3(x, WARD + 20, z),
      ]);
      put(new THREE.Mesh(new THREE.TubeGeometry(rib, 14, 0.85, 4), trimMat), 0, 0, 0);
    }

    // -- L5 the main vein: crystal grown straight through the masonry. This is
    //    what makes it a crystal capital and not a castle with crystals on it.
    //    (kept just clear of the keep's own crown — taller and the architecture
    //     disappears into a thicket and the capital stops reading as built)
    const VEIN = [                               // x, z, radius, height, tilt
      [0, 0, 6.0, 88, 0.00], [-19, 11, 4.2, 60, 0.13], [17, -13, 3.8, 54, -0.15],
      [9, 24, 3.2, 42, 0.18], [-25, -18, 3.6, 46, -0.12], [31, 8, 2.9, 36, 0.20],
      [-34, 21, 2.5, 31, -0.22],
    ];
    for (let i = 0; i < VEIN.length; i++) {
      const [vx, vz, vr, vh, tilt] = VEIN[i];
      const a = Math.atan2(vz, vx);
      const c = new THREE.Mesh(crystalGeometry(vr, vh, vh * 0.34, 9, 3), cryShaderMats[i % 4]);
      c.position.set(vx, WARD + 6, vz);
      c.rotation.set(Math.sin(a) * tilt, i * 1.3, -Math.cos(a) * tilt);
      palace.add(c);
      for (let k = 0; k < 3; k++) {              // satellites at its foot
        const ka = a + (k - 1) * 1.1 + R.vein() * 0.5;
        const kd = vr * (2.2 + R.vein() * 1.6);
        const kid = new THREE.Mesh(
          crystalGeometry(vr * 0.36, vh * (0.18 + R.vein() * 0.2), vh * 0.1),
          cryShaderMats[(i + k) % 4]);
        kid.position.set(vx + Math.cos(ka) * kd, WARD + 5, vz + Math.sin(ka) * kd);
        kid.rotation.set(Math.cos(ka) * 0.4, ka, -Math.sin(ka) * 0.4);
        palace.add(kid);
      }
    }

    // -- L8 a ring of stones adrift over the keep (the tower has one too —
    //    the capital's is wider, slower, and made of broken crystal)
    const crownRing = new THREE.Group();
    crownRing.userData.moving = true;            // rotates: its crystals stay live
    crownRing.position.set(0, WARD + KEEP_H + 26, 0);
    for (let i = 0; i < 11; i++) {
      const a = i / 11 * Math.PI * 2;
      const st = new THREE.Mesh(cragGeometry(2.0 + (i % 3) * 0.8, 0, 0.5), rock);
      st.position.set(Math.cos(a) * 34, Math.sin(i * 1.9) * 4, Math.sin(a) * 34);
      st.rotation.set(i, i * 2.1, 0);
      crownRing.add(st);
      if (i % 2 === 0) {
        const sh = new THREE.Mesh(crystalGeometry(1.1, 5, 2.4), cryShaderMats[i % 4]);
        sh.rotation.x = Math.PI;
        sh.position.set(Math.cos(a) * 34, Math.sin(i * 1.9) * 4 - 2, Math.sin(a) * 34);
        crownRing.add(sh);
      }
    }
    palace.add(crownRing);
    magicAnims.push((t, dt) => { crownRing.rotation.y -= dt * 0.11; });

    flush();                                     // ~950 parts → 10 draw calls
    palaceTopY = baseY + WARD + KEEP_H + 26;
    palaceGroundY = baseY;
  }

  // ---- the capital wakes --------------------------------------------------
  // Window fire on the facades, fly-lights orbiting, a beam answering the mage
  // tower, crystal roots in the ground around it. All of this used to wait on
  // a 50 MB download; it is just geometry now, so it is up on the first frame.
  {
    const groundY = palaceGroundY, topY = palaceTopY;
    const gate = palaceGate = [CX, CZ + 132];    // outside the curtain wall
    glowPath(MX, MZ, gate[0], gate[1], 3.2);     // walkway from the tower

    // -- fly-lights: sprites drifting along a closed spline around the capital
    const ctrl = [];
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * Math.PI * 2;
      const r = 128 + Math.sin(i * 2.3) * 34;
      const x = CX + Math.cos(a) * r, z = CZ + Math.sin(a) * r;
      ctrl.push(new THREE.Vector3(x, gY(x, z) + 56 + Math.sin(i * 1.7) * 38, z));
    }
    const loop = new THREE.CatmullRomCurve3(ctrl, true, 'catmullrom', 0.4);
    const SAMP = 512;
    const path = loop.getSpacedPoints(SAMP - 1);
    const NFLY = 90;
    const fly = new THREE.Points(sparkGeometry(new Float32Array(NFLY * 3)),
      sparkMaterial(0xd8f0ff, 6.0));
    fly.frustumCulled = false;
    magicGroup.add(fly);
    const flyAttr = fly.geometry.attributes.position;
    const flySpeed = [];
    for (let i = 0; i < NFLY; i++) flySpeed.push(0.006 + R.fly() * 0.010);
    magicAnims.push((t) => {
      for (let i = 0; i < NFLY; i++) {
        const u = (i / NFLY + t * flySpeed[i]) % 1;
        const f = u * SAMP;
        const i0 = Math.floor(f) % SAMP, i1 = (i0 + 1) % SAMP, k = f - Math.floor(f);
        const p0 = path[i0], p1 = path[i1];
        flyAttr.setXYZ(i, p0.x + (p1.x - p0.x) * k,
          p0.y + (p1.y - p0.y) * k + Math.sin(t * 1.3 + i) * 1.6,
          p0.z + (p1.z - p0.z) * k);
      }
      flyAttr.needsUpdate = true;
    });

    // -- energy beam: mage tower orb <-> the keep's crown, pulses along the arc
    const beamEnd = new THREE.Vector3(CX, topY - 20, CZ);
    energyBeam(new THREE.CatmullRomCurve3([
      new THREE.Vector3(MX, ORB_Y, MZ),
      new THREE.Vector3((MX + CX) / 2, (ORB_Y + beamEnd.y) / 2 + 34, (MZ + CZ) / 2),
      beamEnd,
    ]), 0xbfe8ff);

    // -- crystal roots: the garden's own crystals break out of the ground all
    //    round the walls, in clumps — evenly spaced shafts read as a fence
    {
      const SK = 96;
      const skirt = new THREE.InstancedMesh(crystalGeometry(1, 1, 0.5), cryInstMat, SK);
      skirt.name = 'magicSkirt';
      skirt.frustumCulled = false;
      const mm = new THREE.Matrix4(), mq = new THREE.Quaternion();
      const mv = new THREE.Vector3(), ms = new THREE.Vector3(), mc = new THREE.Color();
      const COL = [0x8fe8ff, 0xff9fe0, 0xbfa8ff, 0xffd98f];
      let n = 0;
      for (let c = 0; c < 14 && n < SK; c++) {
        const ca = c * 2.39996 + 0.7;
        const cr = 112 + R.skirt() * 66;
        const ccx = CX + Math.cos(ca) * cr, ccz = CZ + Math.sin(ca) * cr;
        if (Math.hypot(ccx - gate[0], ccz - gate[1]) < 34) continue;   // door stays clear
        const big = 1.2 + R.skirt() * 3.6;           // this outcrop's headline size
        const kids = 5 + Math.floor(R.skirt() * 6);
        for (let k = 0; k < kids && n < SK; k++) {
          const ka = R.skirt() * 6.283, kd = Math.pow(R.skirt(), 0.7) * 19;
          const x = ccx + Math.cos(ka) * kd, z = ccz + Math.sin(ka) * kd;
          // keep the whole approach corridor clear, not just a disc round the
          // gate — a clump centre 40 m away still throws a 15 m shaft into it
          if (Math.abs(x - CX) < 25 && z > CZ + 70 && z < CZ + 205) continue;
          const s = big * (k === 0 ? 1 : 0.25 + Math.pow(R.skirt(), 1.8) * 0.8);
          const lean = 0.10 + R.skirt() * 0.26;      // splayed away from the walls
          mq.setFromEuler(new THREE.Euler(Math.sin(ca) * lean, R.skirt() * 6.283,
            -Math.cos(ca) * lean));
          ms.set(s * 0.6, s * (1.7 + R.skirt() * 1.7), s * 0.6);
          mv.set(x, gY(x, z) - 0.9, z);
          mm.compose(mv, mq, ms);
          skirt.setMatrixAt(n, mm);
          skirt.setColorAt(n, mc.setHex(COL[(c + k) % 4]));
          n++;
        }
      }
      skirt.count = n;
      skirt.instanceMatrix.needsUpdate = true;
      if (skirt.instanceColor) skirt.instanceColor.needsUpdate = true;
      magicGroup.add(skirt);
    }

    const l = new THREE.PointLight(0xbfa8ff, 0, 800, 2);
    l.position.set(CX, groundY + 120, CZ);
    magicGroup.add(l);
    magicLights.push(l);
    for (const [c, dx, dz] of [[0x8fe8ff, -58, 74]]) {   // one gate lamp: every
      const gl2 = new THREE.PointLight(c, 0, 300, 2);   // lit material in the WHOLE
      // scene loops all point lights per fragment, so this layer's budget is 5
      gl2.position.set(CX + dx, groundY + 26, CZ + dz);
      magicGroup.add(gl2);
      magicLights.push(gl2);
    }
  }

  // glowing mushrooms scattered between the crystals
  const capMats = [0xff9fe0, 0xbfa8ff, 0x8fe8ff].map((c) =>
    new THREE.MeshLambertMaterial({ color: c, emissive: c, emissiveIntensity: 0.7 }));
  const gillMats = [0xff9fe0, 0xbfa8ff, 0x8fe8ff].map((c) =>
    new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.35,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  const stemMat = new THREE.MeshLambertMaterial({ color: 0xd8cfc0 });
  for (let i = 0; i < 22; i++) {
    const a = i * 2.39996;                   // golden angle scatter
    const r = 18 + (i * 29 % 70);
    const mx2 = MX + Math.cos(a) * r, mz2 = MZ + Math.sin(a) * r;
    const my2 = gY(mx2, mz2);
    const hgt = 0.7 + (i % 4) * 0.35;
    const capR = 0.45 + (i % 3) * 0.2;
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.18, hgt, 6), stemMat);
    stem.position.set(mx2, my2 + hgt / 2, mz2);
    magicGroup.add(stem);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(
      capR, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), capMats[i % 3]);
    cap.position.set(mx2, my2 + hgt, mz2);
    magicGroup.add(cap);
    const gill = new THREE.Mesh(new THREE.CircleGeometry(capR * 0.85, 12),
      gillMats[i % 3]);
    gill.rotation.x = Math.PI / 2;             // faces the ground, lights it
    gill.position.set(mx2, my2 + hgt - 0.04, mz2);
    magicGroup.add(gill);
  }
  for (let i = 0; i < 3; i++) {                // elder mushrooms
    const a = 1.3 + i * 2.1;
    const r = 42 + i * 23;
    const mx2 = MX + Math.cos(a) * r, mz2 = MZ + Math.sin(a) * r;
    const my2 = gY(mx2, mz2);
    const hgt = 2.6 + i * 0.5, capR = 1.35 + i * 0.25;
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.45, hgt, 9), stemMat);
    stem.position.set(mx2, my2 + hgt / 2, mz2);
    magicGroup.add(stem);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(
      capR, 16, 9, 0, Math.PI * 2, 0, Math.PI / 2), capMats[i]);
    cap.scale.y = 0.72;
    cap.position.set(mx2, my2 + hgt, mz2);
    magicGroup.add(cap);
    const gill = new THREE.Mesh(new THREE.CircleGeometry(capR * 0.9, 16),
      gillMats[i]);
    gill.rotation.x = Math.PI / 2;
    gill.position.set(mx2, my2 + hgt - 0.06, mz2);
    magicGroup.add(gill);
  }

  // floating islands with luminous trees
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * Math.PI * 2 + 0.6;
    const ix = MX + Math.cos(a) * (72 + i * 14);
    const iz = MZ + Math.sin(a) * (72 + i * 14);
    const base = gY(ix, iz) + 32 + i * 10;
    const isl = new THREE.Group();
    isl.userData.moving = true;                  // bobs + rotates
    const chunk = new THREE.Mesh(cragGeometry(7 + i * 1.4, 1, 0.5), rock);
    chunk.scale.y = 0.62;
    isl.add(chunk);
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5a4632 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.7, 4.5, 7), trunkMat);
    trunk.position.y = 6.2;
    isl.add(trunk);
    for (const [bx, by, tilt] of [[1.2, 8.2, 0.7], [-1.0, 8.6, -0.6]]) {
      const br = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.28, 2.6, 6), trunkMat);
      br.position.set(bx, by, 0.3);
      br.rotation.z = tilt;
      isl.add(br);
    }
    const folMat = new THREE.MeshLambertMaterial({ color: 0x7fffd4,
      emissive: 0x2fbf9f, emissiveIntensity: 0.8, flatShading: true });
    for (const [fx, fy, fz, fr] of
         [[0, 10.4, 0, 2.6], [2.0, 9.3, 0.4, 1.5], [-1.8, 9.7, 0.6, 1.3]]) {
      const fol = new THREE.Mesh(cragGeometry(fr, 1, 0.35), folMat);
      fol.position.set(fx, fy, fz);
      isl.add(fol);
    }
    for (let v = 0; v < 4; v++) {            // light vines under the island
      const vine = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3 + v, 4),
        capMats[v % 3]);
      vine.position.set(Math.sin(v * 2.7) * 3, -5 - v * 0.6, Math.cos(v * 2.7) * 3);
      isl.add(vine);
    }
    for (let h = 0; h < 3; h++) {            // crystals hanging from the bottom
      const hc = new THREE.Mesh(
        crystalGeometry(0.7, 2.5 + h, 1.4), cryShaderMats[(i + h) % 4]);
      hc.rotation.x = Math.PI;
      hc.position.set(Math.sin(h * 2.1 + i) * 3.2, -2.2, Math.cos(h * 2.1 + i) * 3.2);
      isl.add(hc);
    }
    isl.position.set(ix, base, iz);
    magicGroup.add(isl);
    const groundY2 = gY(ix, iz);             // faint light shaft to the ground
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 6.5, base - groundY2, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x7fffd4, transparent: true,
        opacity: 0.028, blending: THREE.AdditiveBlending,
        depthWrite: false, side: THREE.DoubleSide }));
    shaft.position.set(ix, groundY2 + (base - groundY2) / 2, iz);
    magicGroup.add(shaft);
    magicAnims.push((t, dt) => {
      isl.position.y = base + Math.sin(t * 0.4 + i * 1.7) * 2.5;
      isl.rotation.y += dt * 0.05;
    });
  }

  // portal: ring of rune-carved standing stones with a spinning inner sigil
  const px2 = MX - 81, pz2 = MZ + 27;
  const py2 = gY(px2, pz2);
  const ga = Math.atan2(-0.95, 0.32) + Math.PI / 2;
  const gateG = new THREE.Group();
  gateG.position.set(px2, py2, pz2);
  gateG.rotation.y = ga;
  magicGroup.add(gateG);
  for (let i = 0; i < 13; i++) {
    const a = i / 13 * Math.PI * 2;
    const blk = new THREE.Mesh(cragGeometry(1.05, 0, 0.55), stoneDark);
    blk.scale.set(1, 1.55, 0.62);
    blk.position.set(Math.cos(a) * 7, 7.2 + Math.sin(a) * 7, 0);
    blk.rotation.z = a;
    gateG.add(blk);
    if (i % 3 === 0) {
      const rune = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.55, 0.12), runeMat);
      rune.position.set(Math.cos(a) * 7, 7.2 + Math.sin(a) * 7, 0.72);
      gateG.add(rune);
    }
  }
  for (const sx of [-1, 1]) {                  // rough pillar bases
    const pb = new THREE.Mesh(cragGeometry(1.6, 0, 0.4), stoneDark);
    pb.scale.set(1.2, 0.7, 1);
    pb.position.set(sx * 6.6, 0.7, 0);
    gateG.add(pb);
  }
  const sigil = new THREE.Mesh(new THREE.TorusGeometry(5.8, 0.09, 8, 48),
    new THREE.MeshBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0.5,
      blending: THREE.AdditiveBlending, depthWrite: false }));
  sigil.position.set(0, 7.2, 0);
  gateG.add(sigil);
  const film = new THREE.Mesh(new THREE.CircleGeometry(6.2, 24),
    new THREE.MeshBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.3,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
  film.position.set(0, 7.2, 0);
  gateG.add(film);

  // ---- portal event: walk through the sigil and the gate answers ----------
  const BURST_N = 260;
  const burstPts = new Float32Array(BURST_N * 3);
  const burstDir = new Float32Array(BURST_N * 3);
  for (let i = 0; i < BURST_N; i++) {
    const u = R.burst() * Math.PI * 2, w = R.burst();
    const rr = Math.sqrt(w) * 5.6;                    // spawn across the film
    burstPts.set([Math.cos(u) * rr, 7.2 + Math.sin(u) * rr, 0], i * 3);
    const th = R.burst() * Math.PI * 2, ph = Math.acos(2 * R.burst() - 1);
    burstDir.set([Math.sin(ph) * Math.cos(th) * 0.55,
                  Math.abs(Math.cos(ph)) * 0.7 + 0.25,
                  Math.sin(ph) * Math.sin(th) * 1.6], i * 3);   // mostly forward
  }
  const burstMat = sparkMaterial(0xd8f4ff, 4.0,
    { burst: true, spread: 22, nightOnly: false });
  const burst = new THREE.Points(sparkGeometry(burstPts, burstDir), burstMat);
  burst.frustumCulled = false;
  burst.visible = false;
  gateG.add(burst);

  const shock = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16),
    new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: { uColor: { value: new THREE.Color(0xcfe8ff) }, uA: { value: 0 } },
      vertexShader: /* glsl */`
        varying vec3 vN, vW;
        void main() {
          vN = normalize(mat3(modelMatrix) * normal);
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vW = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uColor;
        uniform float uA;
        varying vec3 vN, vW;
        void main() {
          vec3 v = normalize(cameraPosition - vW);
          float f = pow(1.0 - abs(dot(normalize(vN), v)), 4.5);
          gl_FragColor = vec4(mix(uColor, vec3(1.0), f * 0.7), f * uA);
        }`,
    }));
  shock.position.set(0, 7.2, 0);
  shock.visible = false;
  gateG.add(shock);

  // camera-locked warp flash — no post-processing in the engine, so the
  // "space bends" beat is a chromatic ring card held in front of the eye
  // 1.15×0.68 at 0.4 m ≈ the 70° viewport: any bigger and only the flat centre
  // of the ring pattern is on screen, which reads as a plain colour wash
  const flash = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.68),
    new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uA: { value: 0 }, uT: { value: 0 } },
      vertexShader: /* glsl */`
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */`
        uniform float uA, uT;
        varying vec2 vUv;
        void main() {
          vec2 d = (vUv - 0.5) * vec2(1.5, 1.0);
          float r = length(d) * 2.0;
          float ring = sin(r * 30.0 - uT * 20.0);
          vec3 c = vec3(0.62 + 0.38 * ring,
                        0.74 + 0.26 * sin(r * 30.0 - uT * 20.0 + 0.9), 1.0);
          float m = exp(-r * r * 4.0) * uA * (0.2 + 0.8 * abs(ring));
          gl_FragColor = vec4(c, clamp(m, 0.0, 1.0));
        }`,
    }));
  flash.renderOrder = 999;
  flash.frustumCulled = false;
  flash.visible = false;
  magicGroup.add(flash);

  let portalT = -1000, sidePrev = 0, pathSurge = 0;
  const _fwd = new THREE.Vector3(), _lp = new THREE.Vector3();
  function firePortal(t) {
    portalT = t ?? crystalTime.value;
    burst.visible = true;
    burstMat.uniforms.uT0.value = portalT;
    shock.visible = true;
    flash.visible = true;
    pathSurge = 1;
    const wp = gateG.localToWorld(new THREE.Vector3(0, 7.2, 0));
    strike(wp.x, wp.y, wp.z, portalT);           // every crystal rings
    const gate = palaceGate;
    if (gate && ctx.player?.teleport) {          // real teleport, when offered
      ctx.player.teleport(gate[0], gate[1], Math.atan2(CX - gate[0], CZ - gate[1]));
    }
  }
  magicAnims.push((t, dt) => {
    sigil.rotation.z -= dt * 0.7;
    film.material.opacity = 0.22 + Math.sin(t * 1.6) * 0.12;
    runeMat.color.setRGB(0.75, 0.91, 1).multiplyScalar(
      0.6 + 0.4 * Math.sin(t * 2.2) + 2.2 * Math.max(0, 1 - (t - portalT)));
    // walkways surge toward the palace after a crossing
    if (pathSurge > 0) pathSurge = Math.max(0, pathSurge - dt * 0.55);
    pathMat.emissiveIntensity = 0.9 + 2.0 * pathSurge;

    const age = t - portalT;
    if (age < 5.2) {                             // event playback
      shock.scale.setScalar(1 + age * 46);
      shock.material.uniforms.uA.value = Math.max(0, 0.55 * (1 - age / 1.6));
      shock.visible = age < 1.6;
      const fa = Math.max(0, 1 - age / 0.9);
      flash.material.uniforms.uA.value = fa * fa;
      flash.material.uniforms.uT.value = age;
      flash.visible = age < 0.9;
      if (flash.visible && havePlayer()) {       // pin the card to the eye
        _fwd.set(0, 0, -1).applyQuaternion(camQuat);
        flash.position.copy(playerPos).addScaledVector(_fwd, 0.4);
        flash.quaternion.copy(camQuat);
      }
      burst.visible = true;
    } else if (shock.visible || flash.visible || burst.visible) {
      shock.visible = flash.visible = burst.visible = false;
    }

    // crossing test, in the gate's own frame: inside the sigil disc and the
    // sign of z flips = the player went through it
    if (!havePlayer()) return;
    _lp.copy(playerPos);
    gateG.worldToLocal(_lp);
    const rad = Math.hypot(_lp.x, _lp.y - 7.2);
    const near = rad < 8 && Math.abs(_lp.z) < 4;
    const side = _lp.z >= 0 ? 1 : -1;
    if (near && rad < 6 && sidePrev !== 0 && side !== sidePrev && t - portalT > 6) {
      firePortal(t);
    }
    sidePrev = near ? side : 0;
  });

  // luminous walkways: portal -> tower -> island anchors
  glowPath(px2, pz2, MX, MZ, 3.2);
  glowPath(MX, MZ, MX + 60, MZ + 46);
  glowPath(MX, MZ, MX - 40, MZ - 58);

  // ---- transition band: science half -> magic half ------------------------
  // the boundary used to be a hard edge. three layers of gradient now: a
  // ground halo ring, glowing moss patches, and crystal debris that thickens
  // as you walk in — all instanced, all night-ramped by the engine.
  const BX = MX - 10, BZ = MZ - 105;             // band centre (tower..palace)
  const R0 = 45, R1 = 300;
  const nearness = (x, z) => {                   // 1 in the core, 0 at the rim
    const d = Math.min(Math.hypot(x - MX, z - MZ), Math.hypot(x - CX, z - CZ));
    return Math.max(0, Math.min(1, 1 - (d - 35) / 235));
  };
  {                                              // ground halo — a full disc:
    // an annulus leaves a hard-edged hole over the core (measured, 08-13), so
    // the falloff comes from `nearness` (distance to tower *or* palace), which
    // also gives the halo the peanut shape the two anchors deserve.
    const NA = 64, NR = 8;
    const pos = [], col = [], idx = [];
    const tint = new THREE.Color(0xa98fff);
    for (let ri = 0; ri <= NR; ri++) {
      const u = ri / NR;
      const r = R1 * Math.pow(u, 1.4);            // denser rings inside
      for (let ai = 0; ai <= NA; ai++) {
        const a = ai / NA * Math.PI * 2;
        const x = BX + Math.cos(a) * r, z = BZ + Math.sin(a) * r;
        pos.push(x, gY(x, z) + 0.35, z);
        const blotch = 0.65 + 0.35 * Math.sin(a * 5 + r * 0.06)
                            * Math.sin(a * 3.1 - r * 0.031);
        const w = Math.pow(nearness(x, z), 1.3) * blotch * 0.36;
        col.push(tint.r * w, tint.g * w, tint.b * w);
      }
    }
    for (let ri = 0; ri < NR; ri++) {
      for (let ai = 0; ai < NA; ai++) {
        const a0 = ri * (NA + 1) + ai, a1 = a0 + 1;
        const b0 = a0 + NA + 1, b1 = b0 + 1;
        idx.push(a0, b0, a1, a1, b0, b1);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(col), 3));
    g.setIndex(idx);
    const m = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true,
      opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false,
      side: THREE.DoubleSide });
    const halo = new THREE.Mesh(g, m);
    halo.name = 'magicHalo';
    magicGroup.add(halo);
    cryGlowMats.push(m);
  }
  // violet mist standing on the band's rim. A dome would be the obvious move,
  // but its open bottom clips against the terrain and leaves a hard elliptical
  // seam on the ground (measured, 08-13) — a curtain has no such rim: seen from
  // the science city it is a glow around the magic half, seen from inside it is
  // the far wall of the world.
  for (const [rad, hgt, amp] of [[R1, 42, 0.21]]) {   // one curtain: two read as rings
    const g = new THREE.CylinderGeometry(rad, rad, hgt, 48, 4, true);
    const p = g.attributes.position;
    const col = new Float32Array(p.count * 3);
    const tint = new THREE.Color(0xb9a0ff);
    for (let i = 0; i < p.count; i++) {
      const u = (p.getY(i) / hgt) + 0.5;          // 0 at the base, 1 at the top
      const a = Math.atan2(p.getZ(i), p.getX(i));
      // zero at the base: a curtain that is brightest where it meets the
      // ground draws a hard seam along that intersection
      const w = Math.pow(u, 0.55) * Math.pow(1 - u, 2.0) * 2.6 * amp
              * (0.65 + 0.35 * Math.sin(a * 4 + rad * 0.05));
      col.set([tint.r * w, tint.g * w, tint.b * w], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mist = new THREE.Mesh(g, new THREE.MeshBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0.25, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, depthWrite: false }));
    mist.name = 'magicMist';
    mist.position.set(BX, gY(BX, BZ) + hgt / 2 - 2, BZ);
    magicGroup.add(mist);
    cryGlowMats.push(mist.material);
  }
  {                                              // glowing moss patches
    const disc = new THREE.CircleGeometry(1, 14);
    disc.rotateX(-Math.PI / 2);
    const dp = disc.attributes.position;
    const dc = new Float32Array(dp.count * 3);
    for (let i = 0; i < dp.count; i++) {         // bright centre, rim to zero
      const v = i === 0 ? 1 : 0;
      dc.set([v, v, v], i * 3);
    }
    disc.setAttribute('color', new THREE.BufferAttribute(dc, 3));
    const mossMat = new THREE.MeshBasicMaterial({ vertexColors: true,
      transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending,
      depthWrite: false });
    const MOSS = 160;
    const moss = new THREE.InstancedMesh(disc, mossMat, MOSS);
    moss.name = 'magicMoss';
    moss.frustumCulled = false;
    const mm = new THREE.Matrix4(), mc = new THREE.Color();
    const MOSS_COL = [0x7fffd4, 0xbfa8ff, 0xff9fe0];   // mushroom palette, not ice
    let placed = 0;
    for (let i = 0; placed < MOSS && i < MOSS * 12; i++) {
      const a = i * 2.39996;
      const r = R0 * 0.6 + Math.sqrt((i % 137) / 137) * (R1 - R0 * 0.6);
      const x = BX + Math.cos(a) * r, z = BZ + Math.sin(a) * r;
      const w = nearness(x, z);
      if (R.band() > 0.15 + w * 0.85) continue;
      const s = 1.4 + w * 3.4 + R.band() * 1.8;
      mm.makeScale(s, 1, s);
      mm.setPosition(x, gY(x, z) + 0.12, z);
      moss.setMatrixAt(placed, mm);
      moss.setColorAt(placed, mc.setHex(MOSS_COL[(i * 7) % 3])
        .multiplyScalar(0.11 + w * 0.30));
      placed++;
    }
    moss.count = placed;
    moss.instanceMatrix.needsUpdate = true;
    if (moss.instanceColor) moss.instanceColor.needsUpdate = true;
    magicGroup.add(moss);
    cryGlowMats.push(mossMat);
  }
  {                                              // crystal debris, thickening in
    const DEB = 240;
    const deb = new THREE.InstancedMesh(crystalGeometry(1, 1, 0.45), cryInstMat, DEB);
    deb.name = 'magicDebris';
    deb.frustumCulled = false;
    const mm = new THREE.Matrix4(), mq = new THREE.Quaternion();
    const mv = new THREE.Vector3(), ms = new THREE.Vector3(), mc = new THREE.Color();
    const DEB_COL = [0x8fe8ff, 0xff9fe0, 0xbfa8ff, 0xffd98f];
    let placed = 0;
    for (let i = 0; placed < DEB && i < DEB * 14; i++) {
      const a = i * 2.39996 + 1.1;
      const r = R0 * 0.75 + Math.sqrt((i % 211) / 211) * (R1 - R0 * 0.75);
      const x = BX + Math.cos(a) * r, z = BZ + Math.sin(a) * r;
      const w = nearness(x, z);
      if (R.band() > 0.08 + w * 0.92) continue;
      const s = 0.18 + w * 0.55 + R.band() * 0.3;
      mq.setFromEuler(new THREE.Euler((R.band() - 0.5) * 0.7, R.band() * 6.28,
        (R.band() - 0.5) * 0.7));
      ms.set(s, s * (0.8 + R.band() * 1.4), s);
      mv.set(x, gY(x, z) - 0.15, z);
      mm.compose(mv, mq, ms);
      deb.setMatrixAt(placed, mm);
      deb.setColorAt(placed, mc.setHex(DEB_COL[(i * 5) % 4]));
      placed++;
    }
    deb.count = placed;
    deb.instanceMatrix.needsUpdate = true;
    if (deb.instanceColor) deb.instanceColor.needsUpdate = true;
    magicGroup.add(deb);
  }

  // colored night lights
  for (const [c, lx2, lz2, ly2] of [
    [0x9fe8ff, MX, MZ, ty + TH + 10],
    [0x7fffd4, px2, pz2, py2 + 9],
  ]) {
    const l = new THREE.PointLight(c, 0, 130, 2);
    l.position.set(lx2, ly2, lz2);
    magicGroup.add(l);
    magicLights.push(l);
  }

  // ---- the city between the landmarks -------------------------------------
  // Five districts fill the empty flanks of the tower-palace corridor. Every
  // one builds through makeBuilder (static parts batch per material), places
  // itself deterministically off rnd(), and joins the layer's existing
  // channels: crystals wear cryShaderMats (growth wave / strike ripple for
  // free), windows seed the shared window fire, banners join the city sway,
  // lights go through magicLights for the engine's night ramp.

  // -- Arcanum Academy: three unequal towers round a cloistered court, the
  //    east flank's answer to the palace. Kind 0/1/2 roofs — one of each.
  {
    const AX = -55, AZ = -560;
    const g = new THREE.Group();
    g.name = 'magicAcademy';
    const ay = gY(AX, AZ) - 0.5;
    g.position.set(AX, ay, AZ);
    contact(AX, AZ, 36);
    magicGroup.add(g);
    const { put, flush, arch, window, spireTop, banner } = makeBuilder(g);
    // court platform with a lipped edge
    put(new THREE.Mesh(new THREE.CylinderGeometry(26, 29.5, 4, 12), stoneDark), 0, 2, 0);
    put(new THREE.Mesh(new THREE.CylinderGeometry(26.6, 26.6, 0.8, 12), trimMat), 0, 4.2, 0);
    // cloister arcade, open toward the walkway from the tower (west-north-west)
    const GAP = Math.atan2(-40, -95);            // direction back to the tower
    for (let i = 0; i < 14; i++) {
      const a = i / 14 * Math.PI * 2;
      let d = Math.abs(a - ((GAP + Math.PI * 2) % (Math.PI * 2)));
      d = Math.min(d, Math.PI * 2 - d);
      if (d < 0.30) continue;
      arch(Math.cos(a) * 21.5, 4.6, Math.sin(a) * 21.5, -a + Math.PI / 2,
        7.2, 5.2, 1.5, trimMat);
    }
    // three towers, heights and roofs all different
    const towers = [];
    for (const [ta, r, h, kind, tint] of
         [[0.35, 6.4, 38, 2, 0], [2.45, 5.6, 30, 1, 2], [4.55, 4.9, 24, 0, 3]]) {
      const x = Math.cos(ta) * 15.5, z = Math.sin(ta) * 15.5;
      const pts = [];
      for (let k = 0; k <= 14; k++) {
        const t2 = k / 14;
        const rr = r * (1 - 0.34 * t2) * (1 + 0.05 * Math.sin(t2 * Math.PI * 6));
        pts.push(new THREE.Vector2(rr, t2 * h));
      }
      put(new THREE.Mesh(new THREE.LatheGeometry(pts, 12), stonePale), x, 4, z);
      put(new THREE.Mesh(new THREE.CylinderGeometry(r * 1.08, r * 1.22, 1.5, 12),
        trimMat), x, 5.1, z);
      spireTop(x, z, r * 0.68 + 0.5, 4 + h, tint, kind);
      for (let wi = 0; wi < Math.floor(h / 8); wi++) {   // windows spiral up
        const wa = ta + 0.9 + wi * 1.9;
        const wr = r * (1 - 0.34 * ((6 + wi * 8) / h)) + 0.3;
        window(x + Math.cos(wa) * wr, 4 + 6 + wi * 8, z + Math.sin(wa) * wr,
          wa + Math.PI / 2, 1.4, 2.9);
      }
      towers.push([x, z, 4 + h]);
    }
    banner(Math.cos(0.35) * 9.5, 16, Math.sin(0.35) * 9.5, -0.35 + Math.PI / 2, 5);
    banner(Math.cos(2.45) * 8.6, 15, Math.sin(2.45) * 8.6, -2.45 + Math.PI / 2, 6);
    // bridges: tall->mid, mid->low, each a walkway arc over a thin rib
    for (const [i0, i1] of [[0, 1], [1, 2]]) {
      const [x1, z1, y1] = towers[i0], [x2, z2, y2] = towers[i1];
      const lo = Math.min(y1, y2) - 6;
      const arc = new THREE.CatmullRomCurve3([
        new THREE.Vector3(x1, y1 - 4, z1),
        new THREE.Vector3((x1 + x2) / 2, lo + 5.5, (z1 + z2) / 2),
        new THREE.Vector3(x2, y2 - 4, z2),
      ]);
      put(new THREE.Mesh(new THREE.TubeGeometry(arc, 16, 1.0, 5), stoneDark), 0, 0, 0);
      const rib = new THREE.CatmullRomCurve3([
        new THREE.Vector3(x1, y1 - 9, z1),
        new THREE.Vector3((x1 + x2) / 2, lo - 1, (z1 + z2) / 2),
        new THREE.Vector3(x2, y2 - 9, z2),
      ]);
      put(new THREE.Mesh(new THREE.TubeGeometry(rib, 12, 0.55, 4), trimMat), 0, 0, 0);
    }
    // the court studies one thing: a hero crystal on a stepped dais
    put(new THREE.Mesh(new THREE.CylinderGeometry(4.6, 5.4, 1.1, 10), trimMat), 0, 4.7, 0);
    put(new THREE.Mesh(new THREE.CylinderGeometry(3.4, 4.2, 1.1, 10), stoneDark), 0, 5.6, 0);
    const heroC = new THREE.Mesh(crystalGeometry(2.1, 14, 6, 8, 3), cryShaderMats[2]);
    heroC.position.set(0, 6, 0);
    g.add(heroC);
    for (let i = 0; i < 4; i++) {                // satellites round the dais
      const a = i / 4 * Math.PI * 2 + 0.7;
      const c = new THREE.Mesh(crystalGeometry(0.6, 3 + (i % 2) * 1.5, 1.6),
        cryShaderMats[(i + 1) % 4]);
      c.position.set(Math.cos(a) * 6.8, 4.4, Math.sin(a) * 6.8);
      c.rotation.set(Math.cos(a) * 0.3, a, -Math.sin(a) * 0.3);
      g.add(c);
    }
    flush();                                     // no lamp: emissive carries it
  }
  glowPath(MX, MZ, -76, -551, 2.6);              // tower -> academy court rim

  // -- Mushroom Hamlet: six cottages under cap roofs, between the portal
  //    walkway and the elder mushrooms. The caps reuse capMats/gillMats, so
  //    the village glows the way the wild mushrooms already do.
  {
    const HX = -215, HZ = -545;
    const g = new THREE.Group();
    g.name = 'magicHamlet';
    g.position.set(HX, 0, HZ);                   // flat group: local y is world y
    magicGroup.add(g);
    BATCHABLE.add(capMats[0]).add(capMats[1]).add(capMats[2]);
    BATCHABLE.add(gillMats[0]).add(gillMats[1]).add(gillMats[2]);
    const { put, flush, window } = makeBuilder(g);
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2 + 0.5 + (R.districts() - 0.5) * 0.5;
      const r = 9 + (i % 3) * 5 + R.districts() * 3;
      const lx = Math.cos(a) * r, lz = Math.sin(a) * r;
      const hy = gY(HX + lx, HZ + lz);
      const s = 0.85 + (i % 3) * 0.2;
      const bodyR = 2.7 * s, bodyH = 3.4 * s;
      contact(HX + lx, HZ + lz, bodyR * 2.1);
      put(new THREE.Mesh(new THREE.CylinderGeometry(bodyR * 0.86, bodyR, bodyH, 9),
        stonePale), lx, hy + bodyH / 2, lz);
      put(new THREE.Mesh(new THREE.CylinderGeometry(bodyR * 0.92, bodyR * 0.92, 0.5, 9),
        trimMat), lx, hy + bodyH - 0.2, lz);     // eaves ring under the cap
      const cap = new THREE.Mesh(new THREE.SphereGeometry(
        bodyR * 1.8, 12, 7, 0, Math.PI * 2, 0, Math.PI / 2), capMats[i % 3]);
      cap.scale.y = 0.6;
      put(cap, lx, hy + bodyH, lz);
      const gill = new THREE.Mesh(new THREE.CircleGeometry(bodyR * 1.6, 14),
        gillMats[i % 3]);
      gill.rotation.x = Math.PI / 2;
      put(gill, lx, hy + bodyH - 0.05, lz);
      const da = Math.atan2(-lz, -lx);           // door faces the village green
      const door = new THREE.Mesh(UNIT, slitMat);
      door.scale.set(1.35 * s, 2.1 * s, 0.6);
      put(door, lx + Math.cos(da) * bodyR * 0.92, hy + 1.05 * s,
        lz + Math.sin(da) * bodyR * 0.92, da + Math.PI / 2);
      const head = new THREE.Mesh(ARCH_HEAD, trimMat);
      head.scale.set(0.75 * s, 0.8 * s, 4.2);
      put(head, lx + Math.cos(da) * bodyR * 0.95, hy + 2.1 * s,
        lz + Math.sin(da) * bodyR * 0.95, da + Math.PI / 2);
      window(lx + Math.cos(da + 2.2) * bodyR * 0.96, hy + bodyH * 0.55,
        lz + Math.sin(da + 2.2) * bodyR * 0.96, da + 2.2 + Math.PI / 2,
        1.0 * s, 1.5 * s);
      put(new THREE.Mesh(new THREE.BoxGeometry(0.75 * s, 3.2 * s, 0.75 * s),
        stoneDark), lx + Math.cos(da + 3.6) * bodyR * 0.8, hy + bodyH,
        lz + Math.sin(da + 3.6) * bodyR * 0.8);  // chimney through the cap rim
    }
    // the village green: a lamp crystal on a post, and a well
    put(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 4.6, 6), woodMat),
      0, gY(HX, HZ) + 2.3, 0);
    const lamp = new THREE.Mesh(crystalGeometry(0.55, 2.2, 1.1, 7, 2), cryShaderMats[1]);
    lamp.rotation.x = Math.PI;
    lamp.position.set(0, gY(HX, HZ) + 6.6, 0);
    g.add(lamp);
    put(new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.9, 1.3, 8), stoneDark),
      4.2, gY(HX + 4.2, HZ) + 0.65, 1.5);        // the well ring
    put(new THREE.Mesh(new THREE.CircleGeometry(1.35, 8).rotateX(-Math.PI / 2),
      gillMats[2]), 4.2, gY(HX + 4.2, HZ) + 1.35, 1.5);  // water glows faintly
    flush();
  }
  glowPath(-215, -545, -213, -502, 1.4);         // lane to the portal walkway

  // -- Crystal Quarry: a terraced dig into a knoll on the west flank — the
  //    quarry can't cut the engine's terrain, so it rises: a rim of spoil
  //    boulders round three stepped benches, hero crystals still in the seam.
  {
    const QX = -290, QZ = -640;
    const g = new THREE.Group();
    g.name = 'magicQuarry';
    const qy = gY(QX, QZ);
    g.position.set(QX, qy, QZ);
    contact(QX, QZ, 34);
    magicGroup.add(g);
    const { put, flush } = makeBuilder(g);
    for (let i = 0; i < 14; i++) {               // spoil rim
      const a = i / 14 * Math.PI * 2 + 0.3;
      if (Math.abs(a - 0.9) < 0.35) continue;    // haul road gap (toward NE)
      const b = new THREE.Mesh(cragGeometry(2.6 + (i % 3) * 1.1, 0, 0.5), rock);
      b.scale.y = 0.62;
      put(b, Math.cos(a) * 25, 3.4, Math.sin(a) * 25, a * 2.1);
    }
    // benches: wall ring + floor disc, stepping down toward the centre
    for (const [wr, wh, fy] of [[22, 4.4, 3.2], [15.5, 3.2, 1.9], [9.5, 2.2, 0.8]]) {
      put(new THREE.Mesh(new THREE.CylinderGeometry(wr, wr + 1.2, wh, 14, 1, true),
        stoneDark), 0, fy + wh / 2 - 1.6, 0);
      put(new THREE.Mesh(new THREE.CircleGeometry(wr, 14).rotateX(-Math.PI / 2),
        rock), 0, fy, 0);
    }
    // the seam: hero crystals on the benches, small ones in the walls
    for (const [cx2, cz2, cr, ch, tint] of
         [[0, -2, 1.7, 9, 0], [-4.5, 3.5, 1.2, 6.5, 2], [5, 2, 1.0, 5, 3]]) {
      const c = new THREE.Mesh(crystalGeometry(cr, ch, ch * 0.45, 8, 2),
        cryShaderMats[tint]);
      c.position.set(cx2, 0.8, cz2);
      c.rotation.y = tint * 1.3;
      g.add(c);
    }
    {
      const NV = 34;                             // vein stubs in the bench walls
      const vein = new THREE.InstancedMesh(crystalGeometry(1, 1, 0.5), cryInstMat, NV);
      vein.frustumCulled = false;
      const mm = new THREE.Matrix4(), mq = new THREE.Quaternion();
      const mv = new THREE.Vector3(), ms = new THREE.Vector3(), mc = new THREE.Color();
      const COL = [0x8fe8ff, 0xff9fe0, 0xbfa8ff, 0xffd98f];
      for (let i = 0; i < NV; i++) {
        const a = R.districts() * Math.PI * 2;
        const [wr, fy] = [[22, 3.2], [15.5, 1.9], [9.5, 0.8]][i % 3];
        mq.setFromEuler(new THREE.Euler(
          Math.sin(a) * (0.9 + R.districts() * 0.5), R.districts() * 6.28,
          -Math.cos(a) * (0.9 + R.districts() * 0.5)));  // leaning out of the wall
        const s = 0.5 + R.districts() * 0.9;
        ms.set(s * 0.5, s * 1.6, s * 0.5);
        mv.set(Math.cos(a) * (wr - 0.5), fy + 0.6, Math.sin(a) * (wr - 0.5));
        mm.compose(mv, mq, ms);
        vein.setMatrixAt(i, mm);
        vein.setColorAt(i, mc.setHex(COL[i % 4]));
      }
      vein.instanceMatrix.needsUpdate = true;
      if (vein.instanceColor) vein.instanceColor.needsUpdate = true;
      g.add(vein);
    }
    // timber derrick on the rim, hoisting a crystal out of the pit.
    // Everything hangs off one rim anchor angle: u = radial out, t = tangent,
    // so the jib provably points at the pit and the hoist rides INSIDE it.
    const DA2 = -0.46;
    const ux = Math.cos(DA2), uz = Math.sin(DA2);
    const tx2 = -uz, tz2 = ux;
    const px3 = ux * 18, pz3 = uz * 18;          // tower base on the rim
    const AT = Math.atan2(tz2, tx2);             // tangent yaw for boxes
    for (const [su, st] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.55, 15, 0.55), woodMat);
      leg.rotation.set(st * -0.18, 0, su * 0.18);
      put(leg, px3 + su * 3.4 * ux + st * 3.4 * tx2, 9.4,
        pz3 + su * 3.4 * uz + st * 3.4 * tz2);
    }
    for (const [y2, s2] of [[6, 2.6], [11, 1.8]]) {      // brace rings
      put(new THREE.Mesh(new THREE.BoxGeometry(s2 * 2.9, 0.45, 0.45), woodMat),
        px3, y2, pz3, -AT);
      put(new THREE.Mesh(new THREE.BoxGeometry(s2 * 2.9, 0.45, 0.45), woodMat),
        px3, y2, pz3, -DA2);
    }
    const jib = new THREE.Mesh(new THREE.BoxGeometry(13, 0.6, 0.6), woodMat);
    jib.rotation.set(0, -Math.atan2(-uz, -ux), -0.18);   // inward, nose down
    put(jib, px3 - ux * 5.8, 17.6, pz3 - uz * 5.8);
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 0.9, 0.5, 8).rotateX(Math.PI / 2), trimMat);
    put(wheel, px3 - ux * 11.6, 18.9, pz3 - uz * 11.6, -AT);
    const hx3 = px3 - ux * 11.6, hz3 = pz3 - uz * 11.6; // hoist line, r=6.4: in the pit
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1, 4), woodMat);
    const hoist = new THREE.Mesh(crystalGeometry(0.9, 3.2, 1.5, 7, 2), cryShaderMats[0]);
    hoist.userData.moving = true;
    g.add(rope, hoist);                          // animated: never batched
    magicAnims.push((t) => {
      const y2 = 6.5 + Math.sin(t * 0.32) * 4.9; // slow round trips out of the pit
      const len = 18.9 - y2;
      rope.scale.y = len;
      rope.position.set(hx3, 18.9 - len / 2, hz3);
      hoist.position.set(hx3, y2 - 1.6, hz3);
      hoist.rotation.y = t * 0.4;
    });
    // haul road: rails from just outside the top bench, out through the rim gap
    const RA = 0.9;
    const rx = Math.cos(RA), rz = Math.sin(RA);
    for (const off of [-0.9, 0.9]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.3, 20), woodMat);
      put(rail, rx * 34 - rz * off, 2.9, rz * 34 + rx * off, -RA + Math.PI / 2);
    }
    for (let i = 0; i < 5; i++) {                // sleepers
      put(new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.24, 0.7), woodMat),
        rx * (26 + i * 4.4), 2.75, rz * (26 + i * 4.4), -RA + Math.PI / 2);
    }
    for (const d of [28, 37]) {                  // two ore carts
      put(new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.5, 3.2), woodMat),
        rx * d, 3.9, rz * d, -RA + Math.PI / 2);
      for (const [wx2, wz2] of [[-1.2, -1.1], [1.2, -1.1], [-1.2, 1.1], [1.2, 1.1]]) {
        const wl = new THREE.Mesh(
          new THREE.CylinderGeometry(0.45, 0.45, 0.3, 7).rotateZ(Math.PI / 2), stoneDark);
        // cart frame: across the road = (-rz, rx), along it = (rx, rz)
        put(wl, rx * d - rz * wx2 + rx * wz2, 3.1,
          rz * d + rx * wx2 + rz * wz2, -RA + Math.PI / 2);
      }
    }
    const ore = new THREE.Mesh(crystalGeometry(0.8, 1.6, 0.8, 6, 1), cryShaderMats[3]);
    ore.position.set(rx * 28, 4.8, rz * 28);
    g.add(ore);
    flush();
    const l = new THREE.PointLight(0x8fe8ff, 0, 90, 2);
    l.position.set(QX, qy + 8, QZ);
    magicGroup.add(l);
    magicLights.push(l);
  }

  // -- Sky Sanctuary: a fifth island, larger than the four and not anchored —
  //    it patrols a slow 25 m circle with a shrine on its back. No windows
  //    (window fire seeds are static; a moving building may not use them).
  {
    const SX = -10, SZ = -640;                   // open sky on the east flank
    const g = new THREE.Group();
    g.name = 'magicSanctuary';
    g.userData.moving = true;                    // patrols a circle
    const base = gY(SX, SZ) + 62;
    g.position.set(SX, base, SZ);
    magicGroup.add(g);
    const { put, flush, arch, spireTop } = makeBuilder(g);
    const chunk = new THREE.Mesh(cragGeometry(11, 1, 0.5), rock);
    chunk.scale.y = 0.55;
    put(chunk, 0, 0, 0);
    put(new THREE.Mesh(new THREE.CylinderGeometry(8.8, 10, 1.6, 12), trimMat), 0, 3.4, 0);
    put(new THREE.Mesh(new THREE.CylinderGeometry(6.4, 7, 6.2, 12), stonePale), 0, 7.3, 0);
    for (let i = 0; i < 8; i++) {                // open ring of arches
      const a = i / 8 * Math.PI * 2;
      arch(Math.cos(a) * 6.8, 4.2, Math.sin(a) * 6.8, -a + Math.PI / 2,
        4.4, 4.4, 1.2, trimMat);
    }
    spireTop(0, 0, 5.4, 10.6, 1, 1);             // onion dome crown
    for (let h = 0; h < 5; h++) {                // roots of crystal underneath
      const hc = new THREE.Mesh(
        crystalGeometry(0.8, 3 + (h % 3), 1.6), cryShaderMats[h % 4]);
      hc.rotation.x = Math.PI;
      hc.position.set(Math.sin(h * 2.4) * 4.4, -3, Math.cos(h * 2.4) * 4.4);
      g.add(hc);
    }
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 7, 62, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xbfa8ff, transparent: true,
        opacity: 0.03, blending: THREE.AdditiveBlending,
        depthWrite: false, side: THREE.DoubleSide }));
    shaft.position.set(0, -31.5, 0);
    g.add(shaft);
    flush();
    magicAnims.push((t) => {
      const a = t * 0.045;
      g.position.set(SX + Math.cos(a) * 25, base + Math.sin(t * 0.35) * 1.8,
        SZ + Math.sin(a) * 25);
      g.rotation.y = -a * 0.6;
    });
  }

  // -- Mana Mill: a squat tower with two counter-rotating crystal rings,
  //    feeding the mage tower's orb through a thin beam — the north-east
  //    walkway finally leads somewhere, and the orb has a power source.
  {
    const LX2 = -108, LZ2 = -450;
    const g = new THREE.Group();
    g.name = 'magicMill';
    const my = gY(LX2, LZ2);
    g.position.set(LX2, my, LZ2);
    contact(LX2, LZ2, 8);
    magicGroup.add(g);
    const { put, flush, arch, window } = makeBuilder(g);
    const pts = [];
    for (let k = 0; k <= 12; k++) {
      const t2 = k / 12;
      const rr = 4.4 * (1 - 0.30 * t2) * (1 + 0.05 * Math.sin(t2 * Math.PI * 5));
      pts.push(new THREE.Vector2(rr, t2 * 15));
    }
    put(new THREE.Mesh(new THREE.LatheGeometry(pts, 11), stonePale), 0, 0.5, 0);
    put(new THREE.Mesh(new THREE.CylinderGeometry(4.6, 5.2, 1.4, 11), trimMat), 0, 0.9, 0);
    const door = new THREE.Mesh(UNIT, slitMat);
    door.scale.set(1.6, 2.6, 0.6);
    put(door, 4.15, 1.9, 0, Math.PI / 2);
    arch(4.3, 0.6, 0, Math.PI / 2, 2.1, 2.6, 0.9, trimMat);
    window(0, 7, 4.0, Math.PI, 1.3, 2.6);
    window(-3.6, 11, 0, -Math.PI / 2, 1.2, 2.4);
    put(new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.7, 1, 10), trimMat),
      0, 15.9, 0);
    flush();
    const collector = new THREE.Mesh(crystalGeometry(1.3, 6.5, 3, 7, 2), cryShaderMats[0]);
    collector.position.set(0, 16.4, 0);
    g.add(collector);
    for (const [ry, rr, dir, n] of [[9.6, 6.4, 1, 6], [13.2, 4.8, -1, 5]]) {
      const ring = new THREE.Group();
      ring.userData.moving = true;
      ring.position.y = ry;
      ring.add(new THREE.Mesh(
        new THREE.TorusGeometry(rr, 0.16, 5, 24).rotateX(Math.PI / 2), pathMat));
      for (let i = 0; i < n; i++) {
        const a = i / n * Math.PI * 2;
        const c = new THREE.Mesh(crystalGeometry(0.5, 2.2, 1.1), cryShaderMats[i % 4]);
        c.position.set(Math.cos(a) * rr, -1.1, Math.sin(a) * rr);
        ring.add(c);
      }
      g.add(ring);
      magicAnims.push((t, dt) => { ring.rotation.y += dt * 0.5 * dir; });
    }
    energyBeam(new THREE.CatmullRomCurve3([
      new THREE.Vector3(LX2, my + 20, LZ2),
      new THREE.Vector3((LX2 + MX) / 2, (my + 20 + ORB_Y) / 2 + 15, (LZ2 + MZ) / 2),
      new THREE.Vector3(MX, ORB_Y, MZ),
    ]), 0x8fe8ff, 0.8, 48);
  }
  glowPath(-108, -450, MX + 60, MZ + 46, 2.0);   // mill -> the NE walkway's end

  // ---- commons: the city grows together -----------------------------------
  // Odds and ends that belong to no one district. One builder at the world
  // origin (local coords = world coords) batches all of it.
  {
    const commons = new THREE.Group();
    commons.name = 'magicCommons';
    magicGroup.add(commons);
    const { put, flush, banner } = makeBuilder(commons);

    // -- the mage tower catches up. It is the first thing the player sees and
    //    it predates every vocabulary upgrade — the newest hamlet cottage was
    //    better dressed than the founding tower. Trim, surrounds, a balcony
    //    and banners, all fitted around the existing geometry.
    const ty2 = gY(MX, MZ), TH2 = 46;
    put(new THREE.Mesh(new THREE.CylinderGeometry(9.6, 10.4, 1.3, 18), trimMat),
      MX, ty2 + 2.9, MZ);                        // plinth moulding
    for (const tt of [0.30, 0.62]) {             // string courses up the flute
      const rr = 8.6 * (1 - 0.62 * tt) * (1 + 0.055 * Math.sin(tt * Math.PI * 7));
      put(new THREE.Mesh(new THREE.CylinderGeometry(rr + 0.5, rr + 0.7, 0.85, 18),
        trimMat), MX, ty2 + 2 + tt * TH2, MZ);
    }
    {                                            // crown balcony under the orb
      const br = 8.6 * 0.38 + 1.3;
      put(new THREE.Mesh(new THREE.CylinderGeometry(br + 1.3, br + 0.2, 1.7, 14),
        trimMat), MX, ty2 + 2 + TH2 - 1.9, MZ);
      for (let i = 0; i < 9; i++) {
        const a = i / 9 * Math.PI * 2;
        put(new THREE.Mesh(new THREE.BoxGeometry(0.55, 2.0, 0.55), stoneDark),
          MX + Math.cos(a) * (br + 1.15), ty2 + 2 + TH2 + 0.1,
          MZ + Math.sin(a) * (br + 1.15), -a);
      }
    }
    for (let i = 0; i < 11; i++) {               // surrounds for the ramp windows
      const t = 0.12 + i * 0.075;
      const a = t * Math.PI * 6.5 + Math.PI / 5;
      const r = 8.6 * (1 - 0.62 * t) + 0.12;
      const wx = MX + Math.cos(a) * r, wz = MZ + Math.sin(a) * r;
      const wy = ty2 + 2 + t * TH2, ry = a + Math.PI / 2;
      const c = Math.cos(ry), s0 = Math.sin(ry);
      for (const s2 of [-1, 1]) {                // reveals
        const j = new THREE.Mesh(UNIT, trimMat);
        j.scale.set(0.34, 1.75, 0.62);
        const d = s2 * 0.62;
        put(j, wx + d * c, wy, wz - d * s0, ry);
      }
      const sill = new THREE.Mesh(UNIT, trimMat);
      sill.scale.set(1.9, 0.32, 0.9);
      put(sill, wx, wy - 0.82, wz, ry);
      const head = new THREE.Mesh(ARCH_HEAD, trimMat);
      head.scale.set(0.62, 0.85, 3.8);
      put(head, wx, wy + 0.6, wz, ry);
      // and the founding tower's windows finally join the window fire
      const rr2 = Math.hypot(wx - MX, wz - MZ) || 1;
      winPts.push(wx + (wx - MX) / rr2 * 1.0, wy, wz + (wz - MZ) / rr2 * 1.0);
    }
    // hung from the crown balcony — anywhere lower tangles with the ramp
    banner(MX + 5.3, ty2 + 2 + TH2 - 2.4, MZ, Math.PI * 0.5, 1, 0.38);
    banner(MX - 5.3, ty2 + 2 + TH2 - 2.4, MZ, -Math.PI * 0.5, 4, 0.38);

    // -- processional way: paired rune stones walk the pilgrim from the portal
    //    to the tower. Their runes share the portal's material, so a crossing
    //    lights the whole avenue at once. Jitter is hashed, not rnd() — the
    //    stones must not shift every earlier jitter in the city.
    {
      const dx2 = MX - px2, dz2 = MZ - pz2;
      const L2 = Math.hypot(dx2, dz2);
      const ux2 = dx2 / L2, uz2 = dz2 / L2;
      const nx3 = -uz2, nz3 = ux2;
      for (let i = 0; i < 4; i++) {
        const d = 16 + i * 17;
        for (const s2 of [-1, 1]) {
          const x = px2 + ux2 * d + nx3 * s2 * 5.4;
          const z = pz2 + uz2 * d + nz3 * s2 * 5.4;
          const y = gY(x, z);
          const st = new THREE.Mesh(UNIT, stoneDark);
          st.scale.set(1.35, 3.6 + ((i * 5 + s2) % 3) * 0.5, 0.95);
          st.rotation.set(Math.sin(i * 3.1 + s2) * 0.07, 0, Math.cos(i * 5.3) * 0.07);
          put(st, x, y + 1.7, z, Math.atan2(ux2, uz2));
          const rn = new THREE.Mesh(UNIT, runeMat);
          rn.scale.set(0.42, 1.6, 0.14);
          put(rn, x - nx3 * s2 * 0.56, y + 2.3, z - nz3 * s2 * 0.56,
            Math.atan2(ux2, uz2));
          const cap = new THREE.Mesh(UNIT, trimMat);
          cap.scale.set(1.55, 0.4, 1.15);
          put(cap, x, y + 3.6 + ((i * 5 + s2) % 3) * 0.5 * 0.5, z,
            Math.atan2(ux2, uz2));
        }
      }
    }
    flush();
  }

  // ---- the Great Wheel -----------------------------------------------------
  // A 60 m crystal ferris wheel on the east flank, facing the mage tower.
  // In-world it is not a fairground ride but an orrery the city built for
  // itself: a rune-lit rim, ten lantern gondolas that stay level as it turns,
  // stone A-frames astride a glowing hub. Key trick: parts that are static
  // *relative to the rotating group* still batch — makeBuilder is bound to
  // the wheel group, so rim + spokes merge per material and rotate as one.
  // No rnd(): all jitter is index-hashed, so the older city keeps its shapes.
  {
    // H0 - R - gondola drop must clear the deck: 37 - 30 - 4.3 = 2.7 m over
    // the 1.45 m deck top (at 34 the bottom car carved into the boards)
    const WX = -15, WZ = -555, R = 30, H0 = 37;
    const g = new THREE.Group();
    g.name = 'magicWheel';
    g.position.set(WX, gY(WX, WZ), WZ);
    g.rotation.y = Math.atan2(-150 - WX, -520 - WZ);   // plane faces the tower
    contact(WX, WZ, 14);
    magicGroup.add(g);

    // static frame: A-frame pylons, axle, boarding deck
    {
      const { put, flush } = makeBuilder(g);
      for (const sz of [-1, 1]) {                // two pylons astride the wheel
        for (const sx of [-1, 1]) {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(1.7, 39, 2.3), stonePale);
          leg.rotation.z = sx * 0.244;
          put(leg, sx * 4.6, 18.7, sz * 6.5);
          put(new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.2, 3.6), trimMat),
            sx * 9.2, 1.1, sz * 6.5);            // feet
        }
        put(new THREE.Mesh(new THREE.BoxGeometry(11, 1.4, 2.1), stoneDark),
          0, 22, sz * 6.5);                      // crossbar
        put(new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.6, 2.5), trimMat),
          0, H0 + 1.3, sz * 6.5);                // bearing cap
      }
      const axle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.9, 0.9, 15, 8).rotateX(Math.PI / 2), stoneDark);
      put(axle, 0, H0, 0);
      // boarding deck under the bottom arc, steps off the tower side
      put(new THREE.Mesh(new THREE.CylinderGeometry(7.5, 8.4, 1.2, 10), stoneDark),
        0, 0.6, 0);
      put(new THREE.Mesh(new THREE.CylinderGeometry(7.8, 7.8, 0.4, 10), trimMat),
        0, 1.35, 0);
      for (let k = 0; k < 4; k++) {              // steps
        put(new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.9, 1.7), stoneDark),
          0, 0.45 + k * 0.0, 8.5 + k * 1.5);
      }
      for (const sx of [-1, 1]) {                // gate lamps on the deck edge
        put(new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 3.4, 6), woodMat),
          sx * 4.4, 3.1, 8.2);
      }
      flush();
      for (const sx of [-1, 1]) {
        const lc = new THREE.Mesh(crystalGeometry(0.5, 1.9, 0.95, 7, 2),
          cryShaderMats[sx > 0 ? 0 : 3]);
        lc.rotation.x = Math.PI;
        lc.position.set(sx * 4.4, 6.6, 8.2);
        g.add(lc);
      }
    }

    // the wheel itself: rim, spokes and hub batch INTO the rotating group
    const w = new THREE.Group();
    w.userData.moving = true;                    // the wheel and everything on it
    w.position.set(0, H0, 0);
    g.add(w);
    {
      const { put, flush } = makeBuilder(w);
      put(new THREE.Mesh(new THREE.TorusGeometry(R, 0.75, 6, 40), pathMat), 0, 0, 0);
      put(new THREE.Mesh(new THREE.TorusGeometry(R - 3.2, 0.4, 5, 36), trimMat),
        0, 0, 0);
      for (let i = 0; i < 12; i++) {             // spokes, hub to inner ring
        const a = i / 12 * Math.PI * 2;
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.55, R - 3.2, 0.55),
          stonePale);
        spoke.rotation.z = a - Math.PI / 2;
        put(spoke, Math.cos(a) * (R - 3.2) / 2, Math.sin(a) * (R - 3.2) / 2, 0);
        const tie = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.4, 0.4), trimMat);
        tie.rotation.z = a - Math.PI / 2;        // rim-to-inner-ring tie
        put(tie, Math.cos(a) * (R - 1.7), Math.sin(a) * (R - 1.7), 0);
      }
      put(new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 3.4, 10)
        .rotateX(Math.PI / 2), trimMat), 0, 0, 0);       // hub drum
      flush();
    }
    const hubOrb = new THREE.Mesh(new THREE.SphereGeometry(1.7, 14, 10),
      new THREE.MeshBasicMaterial({ color: 0xaef4ff }));
    w.add(hubOrb);                               // echoes the tower's orb

    // ten lantern gondolas; each pivot counter-rotates to stay level
    const gondolas = [];
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * Math.PI * 2;
      const p = new THREE.Group();
      p.position.set(Math.cos(a) * R, Math.sin(a) * R, 0);
      w.add(p);
      gondolas.push(p);
      const { put, flush } = makeBuilder(p);     // arm+cup merge: 1 draw each
      put(new THREE.Mesh(new THREE.BoxGeometry(0.32, 2.8, 0.32), stoneDark),
        0, -1.4, 0);
      const cupPts = [];
      for (let k = 0; k <= 5; k++) {
        const t2 = k / 5;
        cupPts.push(new THREE.Vector2(2.25 * (0.55 + 0.45 * t2), t2 * 1.9));
      }
      put(new THREE.Mesh(new THREE.LatheGeometry(cupPts, 8), stoneDark), 0, -4.3, 0);
      put(new THREE.Mesh(new THREE.CylinderGeometry(2.42, 2.42, 0.34, 8), trimMat),
        0, -2.4, 0);                             // gunwale
      flush();
      const lantern = new THREE.Mesh(crystalGeometry(0.85, 2.3, 1.1, 7, 2),
        cryShaderMats[i % 4]);
      lantern.rotation.x = Math.PI;
      lantern.position.set(0, -0.35, 0);         // hung at the pivot arm
      p.add(lantern);
    }
    magicAnims.push((t, dt) => {
      w.rotation.z += dt * 0.055;                // one lap ≈ two minutes
      for (const p of gondolas) p.rotation.z = -w.rotation.z;
    });
  }
  glowPath(-55, -560, -24, -556, 2.2);           // academy -> the Wheel

  // ---- the outer wards -----------------------------------------------------
  // The landmarks were reading as islands in bare dirt — a city is mostly its
  // fabric, not its monuments. Seven residential wards fill the pockets
  // between districts: ~45 houses in four rotating types round small plazas,
  // one medium building per few wards, lanes tying into the walkway network
  // (laid before the wisps section, so the lanes are patrolled too), every
  // window seeding the city-wide window fire. All jitter is index-hashed —
  // zero rnd(), the older city keeps its exact shapes.
  {
    const h1 = (n) => {                          // cheap deterministic hash
      const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
      return x - Math.floor(x);
    };
    // [cx, cz, houses, plazaR, lane end x, lane end z]
    const WARDS = [
      [-100, -588, 8, 7.5, -166, -586],          // corridor east
      [-205, -612, 7, 7.0, -172, -599],          // corridor west
      [-68, -497, 6, 6.5, -104, -486],           // tower / mill / academy triangle
      [-252, -492, 6, 6.5, -234, -494],          // portal north
      [-78, -632, 7, 7.0, -59, -566],            // south of the academy
      [-243, -688, 6, 6.5, -260, -660],          // quarry side
      [-155, -462, 5, 6.0, -171, -511],          // north gate pocket
    ];
    glowPath(-215, -545, -290, -640, 2.2);       // west trunk: hamlet -> quarry
    const stonePale = wardWallMat, roofMat = wardRoofMat;   // the wards' palette
    for (let wi = 0; wi < WARDS.length; wi++) {
      const [cx, cz, N, plazaR, lx2, lz2] = WARDS[wi];
      const g = new THREE.Group();
      g.name = 'magicWard' + wi;
      g.position.set(cx, 0, cz);                 // flat group: local y = world y
      magicGroup.add(g);
      const { put, flush, arch, window, spireTop } = makeBuilder(g);
      const py3 = gY(cx, cz);
      // plaza: paved disc + kerb + a lantern post
      put(new THREE.Mesh(new THREE.CylinderGeometry(plazaR, plazaR + 0.7, 0.8, 10),
        stoneDark), 0, py3 + 0.2, 0);
      put(new THREE.Mesh(new THREE.CylinderGeometry(plazaR - 0.9, plazaR - 0.9, 0.3, 10),
        trimMat), 0, py3 + 0.7, 0);
      put(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 4.2, 6), woodMat),
        0, py3 + 2.7, 0);
      const lamp = new THREE.Mesh(crystalGeometry(0.5, 1.9, 0.95, 7, 2),
        cryShaderMats[wi % 4]);
      lamp.rotation.x = Math.PI;
      lamp.position.set(cx * 0 + 0, py3 + 6.4, 0);
      g.add(lamp);
      for (let i = 0; i < N; i++) {              // houses ring the plaza
        const seed = wi * 31 + i * 7;
        const a = i / N * Math.PI * 2 + h1(seed) * 0.7;
        const r = plazaR + 5.5 + h1(seed + 1) * 5;
        const hx = Math.cos(a) * r, hz = Math.sin(a) * r;
        const hy = gY(cx + hx, cz + hz);
        const kind = (wi * 2 + i) % 4;
        const s = 0.85 + h1(seed + 2) * 0.4;
        contact(cx + hx, cz + hz, 5.2 * s);
        const face = a + Math.PI;                // door faces the plaza
        if (kind === 0) {                        // gabled row house
          const w = 7 * s, d = 5.4 * s, hh = 4.6 * s;
          put(new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), stonePale),
            hx, hy + hh / 2, hz, -a);
          put(new THREE.Mesh(new THREE.BoxGeometry(w + 1, 0.5, d + 1), trimMat),
            hx, hy + hh + 0.15, hz, -a);
          const roof = new THREE.Mesh(new THREE.ConeGeometry(d * 0.74, 3 * s, 4),
            roofMat);
          roof.scale.set(w / d * 0.95, 1, 1);
          roof.rotation.y = -a + Math.PI / 4;
          put(roof, hx, hy + hh + 1.5 * s + 0.3, hz);
          put(new THREE.Mesh(new THREE.BoxGeometry(1.1, 3.4 * s, 1.1), stoneDark),
            hx + Math.cos(a + 1.9) * w * 0.28, hy + hh + 1.2, hz + Math.sin(a + 1.9) * w * 0.28, -a);
        } else if (kind === 1) {                 // round hut, conical cap
          const rr = 2.9 * s, hh = 3.6 * s;
          put(new THREE.Mesh(new THREE.CylinderGeometry(rr * 0.9, rr, hh, 9),
            stonePale), hx, hy + hh / 2, hz);
          put(new THREE.Mesh(new THREE.CylinderGeometry(rr * 0.96, rr * 0.96, 0.4, 9),
            trimMat), hx, hy + hh - 0.15, hz);
          put(new THREE.Mesh(new THREE.ConeGeometry(rr * 1.3, 2.8 * s, 9), roofMat),
            hx, hy + hh + 1.4 * s, hz);
        } else if (kind === 2) {                 // tower house
          const rr = 2.4 * s, hh = 8.5 * s;
          const pts = [];
          for (let k = 0; k <= 6; k++) {
            const t2 = k / 6;
            pts.push(new THREE.Vector2(rr * (1 - 0.22 * t2), t2 * hh));
          }
          put(new THREE.Mesh(new THREE.LatheGeometry(pts, 9), stonePale),
            hx, hy, hz);
          put(new THREE.Mesh(new THREE.ConeGeometry(rr * 1.05, 2.6 * s, 9), roofMat),
            hx, hy + hh + 1.2 * s, hz);
          const fin = new THREE.Mesh(crystalGeometry(0.4, 1.3, 0.7),
            cryShaderMats[(wi + i) % 4]);
          fin.position.set(hx, hy + hh + 2.6 * s, hz);
          g.add(fin);
          window(hx + Math.cos(a) * (rr * 0.82), hy + hh * 0.68,
            hz + Math.sin(a) * (rr * 0.82), a + Math.PI / 2, 1.0, 1.7);
        } else {                                 // L-shaped cottage
          const w = 5.4 * s, hh = 3.9 * s;
          put(new THREE.Mesh(new THREE.BoxGeometry(w, hh, 4.2 * s), stonePale),
            hx, hy + hh / 2, hz, -a);
          put(new THREE.Mesh(new THREE.BoxGeometry(3.4 * s, hh * 0.78, 3.2 * s),
            stonePale), hx + Math.cos(a + 2.2) * w * 0.62, hy + hh * 0.39,
            hz + Math.sin(a + 2.2) * w * 0.62, -a);
          const roof = new THREE.Mesh(new THREE.ConeGeometry(3.4 * s, 2.6 * s, 4),
            roofMat);
          roof.scale.set(w / (4.2 * s) * 0.9, 1, 1);
          roof.rotation.y = -a + Math.PI / 4;
          put(roof, hx, hy + hh + 1.2 * s, hz);
        }
        // door + a lit window on the plaza face (all kinds)
        const dr = kind === 1 ? 2.9 * s : (kind === 2 ? 2.4 * s : 2.7 * s);
        const door = new THREE.Mesh(UNIT, slitMat);
        door.scale.set(1.15 * s, 1.9 * s, 0.5);
        put(door, hx + Math.cos(face) * dr * 0.96, hy + 0.95 * s,
          hz + Math.sin(face) * dr * 0.96, face + Math.PI / 2);
        window(hx + Math.cos(face + 0.85) * dr * 0.94, hy + 1.9 * s,
          hz + Math.sin(face + 0.85) * dr * 0.94, face + 0.85 + Math.PI / 2,
          1.05 * s, 1.5 * s);
      }
      // one medium building for every second ward, opposite the lane mouth
      if (wi % 2 === 0) {
        const la = Math.atan2(lz2 - cz, lx2 - cx) + Math.PI;
        const mx2 = Math.cos(la) * (plazaR + 12), mz2 = Math.sin(la) * (plazaR + 12);
        const my2 = gY(cx + mx2, cz + mz2);
        if (wi % 4 === 0) {                      // chapel with an apse
          put(new THREE.Mesh(new THREE.BoxGeometry(9, 6.5, 6.4), stonePale),
            mx2, my2 + 3.25, mz2, -la);
          const apsePts = [];
          for (let k = 0; k <= 6; k++) {
            const t2 = k / 6;
            apsePts.push(new THREE.Vector2(
              3.1 * Math.sqrt(Math.max(1 - t2 * t2 * 0.6, 0.01)), t2 * 6));
          }
          put(new THREE.Mesh(new THREE.LatheGeometry(apsePts, 8), stonePale),
            mx2 + Math.cos(la) * 4.6, my2, mz2 + Math.sin(la) * 4.6);
          const roof = new THREE.Mesh(new THREE.ConeGeometry(4.6, 3.4, 4), roofMat);
          roof.scale.set(9 / 6.4 * 0.92, 1, 1);
          roof.rotation.y = -la + Math.PI / 4;
          put(roof, mx2, my2 + 8.1, mz2);
          arch(mx2 - Math.cos(la) * 4.7, my2 + 0.4, mz2 - Math.sin(la) * 4.7,
            la + Math.PI / 2, 2.6, 3.4, 0.8, trimMat);
          const fin = new THREE.Mesh(crystalGeometry(0.6, 2.4, 1.2, 7, 2),
            cryShaderMats[wi % 4]);
          fin.position.set(mx2, my2 + 10, mz2);
          g.add(fin);
        } else {                                 // watch tower with a real top
          const pts = [];
          for (let k = 0; k <= 8; k++) {
            const t2 = k / 8;
            pts.push(new THREE.Vector2(3.1 * (1 - 0.3 * t2), t2 * 13));
          }
          put(new THREE.Mesh(new THREE.LatheGeometry(pts, 10), stonePale),
            mx2, my2, mz2);
          spireTop(mx2, mz2, 2.4, my2 + 13, wi, (wi >> 1) % 3);
          window(mx2 + Math.cos(la) * 2.6, my2 + 8, mz2 + Math.sin(la) * 2.6,
            la + Math.PI / 2, 1.1, 2.2);
        }
      }
      flush();
      // the lane into the network — narrow, and patrolled once wisps spawn
      glowPath(cx, cz, lx2, lz2, 1.6);
    }
    // street lamps down the ceremonial spine (tower -> palace gate): the road
    // the player actually walks deserves more than a glowing ribbon
    for (let i = 1; i <= 4; i++) {
      const u = i / 5;
      const sx2 = MX + (-170 - MX) * u, sz2 = MZ + (-598 - MZ) * u;
      const dxn = (-170 - MX) / 78, dzn = (-598 - MZ) / 78;
      for (const s2 of [-1, 1]) {
        const lx3 = sx2 - dzn * s2 * 3.6, lz3 = sz2 + dxn * s2 * 3.6;
        const ly3 = gY(lx3, lz3);
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 3.8, 6),
          woodMat);
        post.position.set(lx3, ly3 + 1.9, lz3);
        magicGroup.add(post);
        const lc = new THREE.Mesh(crystalGeometry(0.42, 1.6, 0.8, 7, 2),
          cryShaderMats[(i + (s2 > 0 ? 0 : 2)) % 4]);
        lc.rotation.x = Math.PI;
        lc.position.set(lx3, ly3 + 5.4, lz3);
        magicGroup.add(lc);
      }
    }
  }

  // ---- wisps: somebody lives here ------------------------------------------
  // Drifting lights that patrol the walkway network — the same network the
  // districts hang off, so the roads read as used, not just lit. Points only;
  // zero triangles, one draw call, ~140 gY samples per frame.
  {
    const totalLen = pathSegs.reduce((s2, e) => s2 + e[4], 0);
    const NW2 = Math.min(140, Math.round(totalLen / 6));
    const wisps = new THREE.Points(sparkGeometry(new Float32Array(NW2 * 3)),
      sparkMaterial(0xcfe8d8, 4.6));
    wisps.frustumCulled = false;
    magicGroup.add(wisps);
    const asg = [];
    for (let i = 0; i < NW2; i++) {              // longer roads get more wisps
      let pick = R.wisps() * totalLen, k = 0;
      while (pick > pathSegs[k][4] && k < pathSegs.length - 1) {
        pick -= pathSegs[k][4];
        k++;
      }
      asg.push([k, R.wisps(), (0.014 + R.wisps() * 0.022) * 60 / pathSegs[k][4],
        R.wisps() * 6.28]);
    }
    const attr = wisps.geometry.attributes.position;
    magicAnims.push((t) => {
      for (let i = 0; i < NW2; i++) {
        const [k, ph, sp, wo] = asg[i];
        const seg = pathSegs[k];
        let u = (ph + t * sp) % 1;
        u = u < 0.5 ? u * 2 : (1 - u) * 2;       // there and back again
        const x = seg[0] + (seg[2] - seg[0]) * u + Math.sin(t * 1.1 + wo) * 1.4;
        const z = seg[1] + (seg[3] - seg[1]) * u + Math.cos(t * 0.9 + wo) * 1.4;
        attr.setXYZ(i, x, gY(x, z) + 1.4 + Math.sin(t * 1.7 + wo) * 0.5, z);
      }
      attr.needsUpdate = true;
    });
  }

  // ---- opening shockwave ---------------------------------------------------
  // The growth wave already replays on every X press; this rides it — a thin
  // ground ring racing out from the tower just ahead of the crystals breaking
  // soil, so the whole city visibly answers the switch being thrown.
  {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.94, 1, 48).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x9fe8ff, transparent: true,
        opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false,
        side: THREE.DoubleSide }));
    ring.position.set(MX, gY(MX, MZ) + 0.7, MZ);
    ring.visible = false;
    magicGroup.add(ring);
    magicAnims.push(() => {
      const g2 = uGrow.value;
      const on = g2 > 0.02 && g2 < 0.9;
      ring.visible = on;
      if (on) {
        ring.scale.setScalar(24 + g2 * 400);
        ring.material.opacity = 0.5 * (1 - g2) * (1.3 - crystalDay.value * 0.6);
      }
    });
  }

  // ---- fields, flock, and the burning sky ----------------------------------
  // Connective tissue and a crown. Wards gave the city its buildings; this
  // gives it agriculture between them, birds over it, and a sky of its own.
  {
    const h2 = (n) => {
      const x = Math.sin(n * 91.7 + 47.123) * 24634.6345;
      return x - Math.floor(x);
    };
    // -- A) crop plots: walled fields of glowing reed near the wards. Plain
    //    green by day; the engine's night ramp lights them (cropMat rides
    //    nightStone). All tufts across all plots are ONE InstancedMesh.
    const cropMat = new THREE.MeshLambertMaterial({ color: 0x9fe8c8,
      emissive: 0x2fbf8f, flatShading: true });
    nightStone.push(cropMat);
    const PLOTS = [                              // [cx, cz, w, d, yaw]
      [-125, -470, 16, 11, 0.5],
      [-237, -577, 14, 10, 1.2],
      [-95, -657, 15, 9, 2.4],
    ];
    const mats2 = [];
    const fields = new THREE.Group();
    fields.name = 'magicFields';
    magicGroup.add(fields);
    const { put, flush } = makeBuilder(fields);
    for (let pi = 0; pi < PLOTS.length; pi++) {
      const [cx, cz, w2, d2, yaw] = PLOTS[pi];
      const c = Math.cos(yaw), s0 = Math.sin(yaw);
      const py3 = gY(cx, cz);
      contact(cx, cz, Math.max(w2, d2) * 0.72);
      for (const [ex, ez, el, across] of [      // low field walls, w x d ring
        [0, d2 / 2, w2, true], [0, -d2 / 2, w2, true],
        [w2 / 2, 0, d2, false], [-w2 / 2, 0, d2, false]]) {
        const wallB = new THREE.Mesh(
          new THREE.BoxGeometry(across ? el + 0.8 : 0.8, 0.9, across ? 0.8 : el + 0.8),
          stoneDark);
        put(wallB, cx + ex * c - ez * s0, py3 + 0.45, cz + ex * s0 + ez * c, -yaw);
      }
      for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        put(new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.6, 1.1), trimMat),
          cx + (sx * w2 / 2) * c - (sz * d2 / 2) * s0, py3 + 0.8,
          cz + (sx * w2 / 2) * s0 + (sz * d2 / 2) * c, -yaw);
      }
      // a drying rack: two posts, a bar, glowing pods hung from it (capMats
      // batches since the hamlet round, so the pods cost no draws)
      const rx2 = cx + (w2 / 2 + 3.2) * c, rz2 = cz + (w2 / 2 + 3.2) * s0;
      const ry3 = gY(rx2, rz2);
      for (const s2 of [-1, 1]) {
        put(new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 3, 5), woodMat),
          rx2 - s2 * 2.2 * s0, ry3 + 1.5, rz2 + s2 * 2.2 * c);
      }
      put(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 4.6), woodMat),
        rx2, ry3 + 2.9, rz2, -yaw + Math.PI / 2);
      for (let k = 0; k < 4; k++) {
        const pod = new THREE.Mesh(new THREE.SphereGeometry(0.34, 7, 5),
          capMats[(pi + k) % 3]);
        put(pod, rx2 - (k - 1.5) * 1.05 * s0, ry3 + 2.3, rz2 + (k - 1.5) * 1.05 * c);
      }
      // tuft matrices, in rows with hashed stagger
      const rows = Math.floor(d2 / 1.6), cols = Math.floor(w2 / 1.1);
      for (let r2 = 0; r2 < rows; r2++) {
        for (let q = 0; q < cols; q++) {
          const seed = pi * 997 + r2 * 61 + q;
          const lx3 = (q / (cols - 1) - 0.5) * (w2 - 2.4) + (h2(seed) - 0.5) * 0.5;
          const lz3 = (r2 / (rows - 1) - 0.5) * (d2 - 2.4) + (h2(seed + 1) - 0.5) * 0.5;
          const x = cx + lx3 * c - lz3 * s0, z = cz + lx3 * s0 + lz3 * c;
          mats2.push([x, gY(x, z) + 0.38, z, h2(seed + 2)]);
        }
      }
    }
    flush();
    const tuft = new THREE.ConeGeometry(0.17, 0.95, 3);
    const crops = new THREE.InstancedMesh(tuft, cropMat, mats2.length);
    crops.frustumCulled = false;
    const mm2 = new THREE.Matrix4(), mq2 = new THREE.Quaternion();
    const mv2 = new THREE.Vector3(), ms2 = new THREE.Vector3();
    for (let i = 0; i < mats2.length; i++) {
      const [x, y2, z, hsh] = mats2[i];
      mq2.setFromEuler(new THREE.Euler((hsh - 0.5) * 0.24, hsh * 6.28,
        (hsh - 0.5) * 0.24));
      ms2.set(1, 0.7 + hsh * 0.7, 1);
      mv2.set(x, y2, z);
      mm2.compose(mv2, mq2, ms2);
      crops.setMatrixAt(i, mm2);
    }
    crops.instanceMatrix.needsUpdate = true;
    fields.add(crops);

    // -- B) the spirit flock: a loose ring of lights riding a city-sized
    //    ellipse, each bird with its own wobble. Visible by day too, dimmer.
    const NB = 26;
    const flock = new THREE.Points(sparkGeometry(new Float32Array(NB * 3)),
      sparkMaterial(0xffeacc, 5.2, { nightOnly: false }));
    flock.name = 'magicFlock';
    flock.frustumCulled = false;
    magicGroup.add(flock);
    const fAttr = flock.geometry.attributes.position;
    magicAnims.push((t) => {
      const t0 = t * 0.020;
      for (let i = 0; i < NB; i++) {
        const a = (t0 + i * 0.011 + Math.sin(t * 0.7 + i * 2.1) * 0.003) * Math.PI * 2;
        const x = -140 + Math.cos(a) * (250 + Math.sin(i * 3.7) * 26);
        const z = -590 + Math.sin(a) * (190 + Math.cos(i * 2.3) * 22);
        fAttr.setXYZ(i, x,
          gY(x, z) + 52 + Math.sin(t * 0.5 + i) * 13 + Math.sin(a * 2.0) * 9, z);
      }
      fAttr.needsUpdate = true;
    });

    // -- C) the aurora: the magic half's own sky. Two additive ribbons high
    //    over the tower-palace axis, curtains flowing along them, faded out
    //    entirely by day (uDay) so the engine's sky stays untouched.
    const auroraMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: crystalTime, uDay: crystalDay },
      vertexShader: /* glsl */`
        varying vec2 vUv;
        uniform float uTime;
        void main() {
          vUv = uv;
          vec3 p = position;
          p.z += sin(uv.x * 9.42 + uTime * 0.23) * 9.0
               + sin(uv.x * 23.0 - uTime * 0.11) * 4.0;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: /* glsl */`
        varying vec2 vUv;
        uniform float uTime, uDay;
        void main() {
          float x = vUv.x;
          float v = sin(x * 40.0 + sin(x * 7.0 + uTime * 0.35) * 2.6 - uTime * 0.12)
                  + 0.5 * sin(x * 90.0 - uTime * 0.21);
          float b = pow(max(v * 0.5 + 0.5, 0.0), 3.0);
          vec3 c = mix(vec3(0.35, 1.0, 0.62), vec3(0.62, 0.38, 1.0), vUv.y)
                 * (0.55 + 0.45 * b);
          float edge = smoothstep(0.0, 0.16, x) * smoothstep(1.0, 0.84, x)
                     * smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.6, vUv.y);
          gl_FragColor = vec4(c, b * edge * (1.0 - uDay) * 0.32);
        }`,
    });
    for (const [alt, ry2, len, wid] of [[238, 0.55, 720, 95], [268, 0.9, 640, 72]]) {
      const rib = new THREE.Mesh(new THREE.PlaneGeometry(len, wid, 80, 1), auroraMat);
      rib.name = 'magicAurora';
      rib.position.set(-130, alt, -590);
      rib.rotation.set(-Math.PI / 2 + 0.38, ry2, 0);
      rib.frustumCulled = false;
      magicGroup.add(rib);
    }
  }

  // ---- window fire, city-wide ---------------------------------------------
  // created AFTER every district (the palace used to own this Points; now the
  // academy, hamlet and mill windows breathe in the same swarm)
  if (winPts.length) {
    const winFire = new THREE.Points(sparkGeometry(winPts),
      sparkMaterial(0xffd58a, 6.2));
    winFire.frustumCulled = false;
    magicGroup.add(winFire);
  }

  // ---- contact shadows -----------------------------------------------------
  {
    const disc = new THREE.CircleGeometry(1, 16).rotateX(-Math.PI / 2);
    const dp = disc.attributes.position;
    const dc = new Float32Array(dp.count * 4);
    for (let i = 0; i < dp.count; i++) dc.set([0, 0, 0, i === 0 ? 0.42 : 0], i * 4);
    disc.setAttribute('color', new THREE.BufferAttribute(dc, 4));
    const m = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true,
      depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    const im = new THREE.InstancedMesh(disc, m, contacts.length);
    im.name = 'magicContacts';
    im.frustumCulled = false;
    const mm = new THREE.Matrix4();
    contacts.forEach(([x, z, r], i) => {
      mm.makeScale(r, 1, r);
      mm.setPosition(x, gY(x, z) + 0.16, z);
      im.setMatrixAt(i, mm);
    });
    im.instanceMatrix.needsUpdate = true;
    magicGroup.add(im);
  }

  // ---- crystal merge -------------------------------------------------------
  // The layer's draw calls were 81% crystals: every static shaft was its own
  // mesh because the shader read the object origin off modelMatrix. This pass
  // bakes that origin (and the up axis) into the vertices instead and merges
  // every static crystal of a material into ONE mesh at the world origin. Only
  // crystals under a group marked userData.moving (islands, the wheel, mill
  // rings, the crown ring, the hoist, the sanctuary) stay live.
  {
    magicGroup.updateMatrixWorld(true);
    const buckets = cryShaderMats.map(() => []);
    const isMoving = (o) => {
      for (let n = o; n && n !== magicGroup; n = n.parent) if (n.userData.moving) return true;
      return false;
    };
    magicGroup.traverse((o) => {
      if (!o.isMesh || o.isInstancedMesh) return;
      const mi = cryShaderMats.indexOf(o.material);
      if (mi < 0 || isMoving(o)) return;
      buckets[mi].push(o);
    });
    const _p = new THREE.Vector3(), _up = new THREE.Vector3(), _org = new THREE.Vector3();
    let merged = 0, kept = 0;
    buckets.forEach((list, mi) => {
      if (!list.length) return;
      let n = 0;
      for (const o of list) n += o.geometry.attributes.position.count;
      const pos = new Float32Array(n * 3), org = new Float32Array(n * 3);
      const up = new Float32Array(n * 3), aH = new Float32Array(n);
      let k = 0;
      for (const o of list) {
        const pa = o.geometry.attributes.position, ha = o.geometry.attributes.aH;
        _org.setFromMatrixPosition(o.matrixWorld);
        _up.set(0, 1, 0).transformDirection(o.matrixWorld);   // local +y in world
        for (let i = 0; i < pa.count; i++, k++) {
          _p.fromBufferAttribute(pa, i).applyMatrix4(o.matrixWorld);
          pos.set([_p.x, _p.y, _p.z], k * 3);
          org.set([_org.x, _org.y, _org.z], k * 3);
          up.set([_up.x, _up.y, _up.z], k * 3);
          aH[k] = ha.getX(i);
        }
        o.parent.remove(o);
        o.geometry.dispose();
        merged++;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setAttribute('aOrg', new THREE.BufferAttribute(org, 3));
      g.setAttribute('aUp', new THREE.BufferAttribute(up, 3));
      g.setAttribute('aH', new THREE.BufferAttribute(aH, 1));
      const mat = new THREE.ShaderMaterial({
        transparent: true, side: THREE.DoubleSide, defines: { MERGED: 1 },
        uniforms: cryUniforms(cryShaderMats[mi].uniforms.uColor.value.getHex()),
        vertexShader: cryVert, fragmentShader: cryFrag,
      });
      const m = new THREE.Mesh(g, mat);
      m.name = 'magicCrystals' + mi;
      m.frustumCulled = false;                    // spans the whole city
      magicGroup.add(m);
    });
    magicGroup.traverse((o) => {
      if (o.isMesh && !o.isInstancedMesh && cryShaderMats.includes(o.material)) kept++;
    });
    magicGroup.userData.cryMerge = { merged, kept };   // for the regression
  }

  if (LITE) {                                  // see LITE at the top of build()
    const drop = ['magicHalo', 'magicMist', 'magicAurora', 'magicFlock'];
    for (let i = magicGroup.children.length - 1; i >= 0; i--) {
      if (drop.includes(magicGroup.children[i].name)) magicGroup.children[i].removeFromParent();
    }
  }

  // ---- layer API ----------------------------------------------------------
  // ?debug=1 → __mars.scene.getObjectByName('magicCity').userData.magic
  // 总控待办:传送门真传送需要引擎在 ctx 里给 player(§4c sensors 的同类通道):
  //   ctx.player = { position: THREE.Vector3,          // 只读,世界坐标
  //                  teleport(x, z, yaw) }             // 落点由引擎贴地
  // 有 teleport 时下面 firePortal 自动把玩家送到王城门口(palaceGate),
  // 没有时降级为"只做戏不搬人",本模块两条路径都已跑通。
  magicGroup.userData.magic = {
    firePortal: () => firePortal(crystalTime.value),
    strike,
    get lastPortal() { return portalT; },        // t of the last crossing
    get playerAt() { return havePlayer() ? playerPos.toArray() : null; },
    get palaceGate() { return palaceGate; },     // teleport target at the door
    gate: [px2, pz2],
    tower: [MX, MZ],
  };
}
