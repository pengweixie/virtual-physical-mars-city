// veh-uav-01 城内烟测:落位缩放 / 全循环包络 / 循环闭合 / 优雅降级
// 用法:cd E:\Claude\mars && node dev/smoke_veh_uav_01.mjs
import * as THREE from 'three';
import { readFileSync } from 'fs';
import { pathToFileURL } from 'url';

const mod = await import(pathToFileURL('viewer/units/veh-uav-01.js').href);
const g = mod.build(THREE);
const ud = g.userData;
let bad = 0;
const ck = (c, m) => { console.log(`  ${c ? '[ OK ]' : '[FAIL]'} ${m}`); if (!c) bad++; };

console.log('== veh-uav-01 城内烟测 ==');

// 1. 落位:manifest 的 size_m 必须等于实测,否则 placeUnit 会整体缩放(契约禁止)
const man = JSON.parse(readFileSync('models/manifest.json', 'utf8'));
const ent = man.assets.find(a => a.id === 'veh-uav-01');
const sz = new THREE.Box3().setFromObject(g).getSize(new THREE.Vector3());
const measured = Math.max(sz.x, sz.y, sz.z);
const scale = ent.size_m / measured;
console.log(`  manifest size_m ${ent.size_m} vs 实测 ${measured.toFixed(2)} → scale ${scale.toFixed(4)}`);
ck(Math.abs(scale - 1) < 0.02, '落位 scale 在 2% 容差内(引擎不会缩放)');
ck(ent.pos && ent.pos.length === 2, 'manifest 有 pos(null 会被 loadUnits 跳过)');

// 2. 全循环包络:任意 t 都不得穿地。有动画的资产不做单帧检查。
const T = 72;
let minY = 1e9, maxY = -1e9, tLow = -1;
for (let t = 0; t < T; t += 0.1) {
  ud.animate(t, 0.1, { t, dt: 0.1, night: false });
  g.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(g);
  if (b.min.y < minY) { minY = b.min.y; tLow = t; }
  if (b.max.y > maxY) maxY = b.max.y;
}
console.log(`  全循环包络 y ∈ [${minY.toFixed(3)}, ${maxY.toFixed(3)}]  最低点在 t=${tLow.toFixed(1)}s`);
ck(minY > -ent.sink_m - 0.01, `最低点不低于 sink_m(${ent.sink_m}）`);
ck(maxY > 5.0, '巡航段确实爬升了(否则烘焙回路没动)');

// 3. 循环闭合:t=0 与 t=T 的姿态必须一致,否则循环会跳
ud.animate(0, 0.1, {}); g.updateMatrixWorld(true);
const ac = g.getObjectByName('aircraft');
const m0 = ac.matrixWorld.clone();
ud.animate(T, 0.1, {}); g.updateMatrixWorld(true);
let diff = 0;
for (let i = 0; i < 16; i++) diff += Math.abs(m0.elements[i] - ac.matrixWorld.elements[i]);
console.log(`  循环闭合 matrix diff = ${diff.toExponential(2)}`);
ck(diff < 1e-6, 't=0 与 t=T 姿态一致(首尾闭合)');

// 4. 优雅降级:引擎没供传感器数据时必须退回烘焙,而不是卡住
ud.animate(10, 0.1, {});
ck(ud.sensors.length === 1 && ud.sensors[0].camera, '传感器声明的是真 camera 对象');
ck(ud.vioBrightness === undefined, '无 frame 时不消费像素(退烘焙路径)');
// 灌一帧假数据,确认自主路径也通
ud.sensors[0].frame = 1;
ud.sensors[0].data = new Uint8Array(64 * 64 * 4).fill(128);
ud.animate(11, 0.1, {});
ck(typeof ud.vioBrightness === 'number', '有 frame 时消费像素(自主路径)');

// 5. 过渡机理确实发生了:某个 t 旋翼可见、另一个 t 巡航桨可见
const vis = (t, name) => { ud.animate(t, 0.1, {}); return g.getObjectByName(name).visible; };
ck(vis(10, 'rotor0') && !vis(10, 'pusher'), '爬升段:旋翼转、巡航桨停');
ck(!vis(40, 'rotor0') && vis(40, 'pusher'), '巡航段:旋翼停、巡航桨转');

console.log(bad ? `\n${bad} 项失败` : '\n全部通过');
process.exit(bad ? 1 : 0);
