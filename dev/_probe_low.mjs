import * as THREE from 'three';
import { pathToFileURL } from 'url';
const mod = await import(pathToFileURL('viewer/units/veh-uav-01.js').href);
const g = mod.build(THREE);
g.userData.animate(66.6, 0.1, {}); g.updateMatrixWorld(true);
const low = [];
g.traverse(o => { if (o.isMesh) { const b = new THREE.Box3().setFromObject(o);
  if (b.min.y < 0.0) low.push([o.geometry.type, b.min.y.toFixed(3),
    o.position.toArray().map(v=>+v.toFixed(2)).join(',')]); } });
console.log('低于地面的构件:'); low.slice(0,8).forEach(r=>console.log(' ',r.join('  ')));
console.log('共', low.length, '件');
