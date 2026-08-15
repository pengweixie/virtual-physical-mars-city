# HANDOFF — TT-1 引力波双资产交付（gravity-wave session, 08-06）

## 交付物

| 文件 | 说明 |
|---|---|
| `viewer/units/tt1-formation-01.js` | 三星编队展区（烘焙动力学, animate 纯 t 36 s 循环） |
| `viewer/units/tt1-formation-01.info.json` | 3 卡全双语（`*_en` 孪生字段） |
| `viewer/units/tt1-sat-01.js` | 1:1 单星展品（oscillator×2 + blink/night 信标） |
| `viewer/units/tt1-sat-01.info.json` | 8 卡全双语 |
| `models/manifest.json` | +2 条（name/name_en, size_m 实测值） |
| `CHECKLIST.md` sci 段 | +2 行 ✅ |
| `STATUS.md` 工具账本 | +1 另册行（落库口径可数） |

落位：formation (-430,-150) sink 0.25；sat (-404,-132) rot 205° sink 0.2。
烟测（真引擎 8123, ?colony=1&debug=1）：26 资产、两资产 **scale=1**、
泵帧 12 s sat0 偏航 3.0e-3 rad（烘焙呼吸生效）、console 零报错。
截图存 `E:\Claude\gravity-wave\model\shots\city_{formation,sat,both}.jpg`。

## 设计真源

`E:\Claude\gravity-wave`（9 系统仿真 + Zemax/Lumerical/COMSOL 验证 +
双代理评审 14 处修正）。知识卡的 sim/physics 层全部蒸馏自该 repo 落库账，
双语 README 见其根目录。

## 引擎侧无改动

纯增量交付：未动 main.js/index.html。两资产均为地表 code 资产
（kind:'exhibit'，原 orbital 质心原点已由展示台架抬升为地面原点，
minY≥-0.03，validate 全过——formation 0 WARN）。

## 给总控的两条注记

1. formation 的 `animate(t)` 每帧更新六束激光端点几何——已实测走
   `unitAnims` 通道正常；若引擎日后改 animate 调度签名，此资产是回归点。
2. 拍主查看器截图时注意：主 renderer 无 preserveDrawingBuffer，
   `canvas.toDataURL` 拿到空图。本次用 `__mars.renderer.constructor` 新建
   离屏渲染器（preserveDrawingBuffer:true）→ render(M.scene, cam.clone()) →
   toDataURL，可作通用拍法（不动引擎代码）。
