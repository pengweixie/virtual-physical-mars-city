# 交接:星舰资产(veh-rocket-01)建造要求

给建星舰的 session。规范正文是 `MODELS.md`,本文是补充:哪些约定**已实装**、
哪些是坑、有什么现成工具。写这份文档的 session 刚完成 pwr-fusion-01 /
pwr-radiator-01 两个代码资产 + 查看器加载器,以下都是实测结论。

## 0. 走哪条路线

**推荐代码资产路线(MODELS.md §4)**:`viewer/units/veh-rocket-01.js`。
原因:查看器加载器**目前只实装了 `type:"code"` 的加载**(GLB 资产有摄取管线
但查看器端放置尚未接线)。走代码资产,写完登记 manifest 就能在场景里看到。

## 1. 硬性契约(§4,逐条已验证)

```js
export const meta = {
  id: 'veh-rocket-01',
  name: '星舰(着陆状态)',
  size_m: 50, size_axis: 'height',   // 仅自检用!引擎不缩放
  effects: ['glow_windows'],
};
export function build(THREE) {       // THREE 由查看器注入,不要 import
  const g = new THREE.Group();
  // ...
  return g;
}
```

1. **真实米制,1 单位 = 1 米,引擎不做任何缩放**(size_m 只做自检,偏差
   >10% 会 console.warn)。星舰真实尺寸:Ø9 m,上面级全高 ~50 m。
2. 原点 = 基座中心**地面点**(y=0 是地表,着陆腿底贴 y=0),+Y 向上,正面 +Z。
3. 不 import three、不引外部贴图/网络资源,纯几何+材质。
4. 材质 MeshLambertMaterial 或 MeshStandardMaterial(不锈钢体推荐
   MeshStandard metalness≈0.7 / roughness≈0.4;场景其它资产多为 Lambert)。
5. **夜光部件**:材质写成 `emissive` 颜色 + `emissiveIntensity: 0.0`(白天灭),
   塞进 `g.userData.nightMats = [...]` —— 引擎每帧按夜色把 intensity 从 0 拉到 1。
   适用:舷窗带、发动机舱指示灯。
6. 点光源锚:`g.userData.lights = [{ color: 0xffd9a0, pos: [x,y,z], range: 40 }]`
   (pos 是资产本地坐标)。**已实装**。`userData.beams` 契约存在但引擎渲染
   未实装,别依赖。`blink`/`flare` 效果钩子同样是"规划中"。
7. ≤ 5 万三角形。星舰是圆柱+锥+翼,几千面就够;贴瓦面用材质分色而非细几何。
8. 登记 `models/manifest.json`(追加,别动现有 6 条):
```json
{
  "id": "veh-rocket-01", "name": "星舰(着陆状态)",
  "type": "code", "module": "units/veh-rocket-01.js",
  "size_m": 50, "size_axis": "height",
  "pos": [120, 200], "rotation_deg": 0, "sink_m": 0.15,
  "effects": ["glow_windows"]
}
```

## 2. 放置注意(避让已占区)

pos 为 null 时加载器落到默认点 (300, 250) —— 紧贴能源区走廊,别用。已占:
- pwr-fusion-01 @ (300, 140),占地 62×46 m
- pwr-radiator-01 @ (300, 360),占地 **430×124 m**(x 从 ~85 到 515!)
建议着陆坪放能源区以西,如 `pos: [120, 200]` 或更远,自定即可但避开上述矩形。

## 3. 保真度建议(可选,量力)

着陆状态 = 仅上面级(火星表面没有助推器):Ø9 m 筒体、鼻锥、前翼×2 后翼×2、
单侧黑色防热瓦面(向风面)、裙部 3 台海平面猛禽(+3 台真空版藏在裙内可省略)、
着陆腿、加注/脱插板。物流背景(来自聚变电站质量预算,仅供叙事):单舰落火
运力按 100–150 t 设定,聚变电站激进 ISRU 场景需 34 艘次。

## 4. 现成工具(直接复用)

- **结构校验**:`node scripts/validate_units.mjs` —— 把 'veh-rocket-01' 加进
  文件顶部 UNITS 数组,校验 Group/尺寸/面数/接地/契约字段。
- **视觉预览**:`node scripts/export_preview.mjs <输出目录>`(同样加 ID)导出
  GLB,再用 Blender 无头渲染看图(参考该脚本注释;GLTFExporter 对 Lambert 的
  警告无害)。
- **就地验证**:项目根 `python -m http.server 8123` → 浏览器开
  `http://localhost:8123/viewer/`,控制台应出现
  `asset veh-rocket-01: 50m -> placed at ...`,无 warn 无 error 即通过。

## 5. 已踩过的坑

- ExtrudeGeometry 的截面本来就立在 x-y 平面,只需 rotation.y 转向,别多加
  rotation.x(会躺平)。
- node 跑 ESM 脚本会有 MODULE_TYPELESS 警告,无害(mars/package.json 没设
  type:module,别改它,现有脚本靠自动探测)。
- manifest 是严格 JSON(无注释无尾逗号),改完 `node -e "require('./models/manifest.json')"` 验一下。
