// roster-board.js — 「花名册与配额」看板部件函数(ops-roster-01 设计册,E:\Claude\mars-roster)
// 契约:不 import three(THREE 由调用方传入),纯几何 + 纯色 MeshStandard 材质,米制,原点 = 底座中心地面点,+Y 上,+Z 正面。
// 不用 CanvasTexture、不用 DOM:整块屏是几何条形图,颜色表就是图例(见下 LEGEND)。
// 用法(宿主 hab-quarter-01 公共区 / ops-compute-01 大屏,放不放由它们定):
//   import { RosterBoard } from './roster-board.js'; import { ROSTER } from './roster-data.js';
//   const b = RosterBoard(THREE, ROSTER); host.add(b); host.userData.nightMats.push(...b.userData.nightMats);
// 数据:roster.json(schema ops-roster-01/roster,version 1.0.0,occupancy v1)。null 画成空框,永远不画成 0。
// 三角形 ≈ 2.4k(115 人牌 + 8 位置条 + 4 情景条 + 机架);包围盒 2.6 × 2.45 × 0.6 m。

export const LEGEND = {
  ruled: 0xe0aa48,        // 琥珀:Run B 裁定的地板(下界)
  measured: 0xd86153,     // 红:RAD 实测(地表 234 / EVA 0.66)
  none: 0x5a4a3c,         // 暗灰:无依据 / 卡只有倍数 / 待 Run E —— 只画空框
  village_std: 0xe0aa48,  // 村 std 床(24)
  village_end: 0xe07a48,  // 村 end 床(4)
  village_corner: 0x6a5a4a, // 村 corner 床(2,无 Run B 数)
  under_bed: 0x63b4d8,    // 地下城有卡床(5)
  under_nobed: 0x3a3a44,  // 地下城无卡床(80)——空框
  quota_ok: 0x7fb069,     // 绿:到 20 mSv 的 sol 数刻度
  year_tick: 0xd86153,    // 红刻线:一个地球年 355.5 sol
};

export function RosterBoard(THREE, roster, opts = {}) {
  const W = opts.width || 2.4, H = opts.height || 1.4, Y0 = opts.panelBottom || 0.95;  // 面板 2.4 × 1.4,底边 0.95 m
  const std = (c, r = 0.7, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  const glow = (c, i = 1.4) => new THREE.MeshStandardMaterial({ color: 0x0a0a0c, emissive: c, emissiveIntensity: i });
  const M = {
    frame: std(0x3a3f45, 0.55, 0.6), post: std(0x8f959b, 0.5, 0.65), base: std(0x2c2a28, 0.8),
    panel: std(0x14161a, 0.4, 0.1), rail: std(0x2a2e34, 0.6, 0.3),
  };
  const g = new THREE.Group(); g.name = 'roster_board';
  const night = [];
  const box = (w, h, d, mat, x, y, z, parent = g, name) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); if (name) m.name = name; parent.add(m); return m;
  };
  // ---- 机架:底座 + 双立柱 + 面板 + 顶压条 / 底裙边(工业细节语法)
  box(1.6, 0.06, 0.6, M.base, 0, 0.03, 0);
  for (const x of [-0.9, 0.9]) box(0.08, Y0 + H + 0.1, 0.08, M.post, x, (Y0 + H + 0.1) / 2, -0.12);
  box(W + 0.12, H + 0.12, 0.06, M.frame, 0, Y0 + H / 2, -0.10);            // 外框
  const panel = box(W, H, 0.02, M.panel, 0, Y0 + H / 2, -0.06, g, 'roster_panel');  // 屏面
  box(W + 0.12, 0.04, 0.10, M.rail, 0, Y0 + H + 0.08, -0.08);              // 顶压条
  box(W + 0.12, 0.04, 0.10, M.rail, 0, Y0 - 0.08, -0.08);                  // 底裙边
  const zf = -0.06 + 0.012 + 0.006;  // 图元贴屏面前 6 mm
  const el = (w, h, mat, x, y, name) => box(w, h, 0.012, mat, x, y, zf, g, name);
  const frameEl = (w, h, mat, x, y) => {  // 空框 = 四条细边(null 的画法)
    const t = 0.006; el(w, t, mat, x, y + h / 2 - t / 2); el(w, t, mat, x, y - h / 2 + t / 2); el(t, h, mat, x - w / 2 + t / 2, y); el(t, h, mat, x + w / 2 - t / 2, y);
  };
  const gl = {}; const G = (k, i) => (gl[k] = gl[k] || (night.push(glow(LEGEND[k], i)), night[night.length - 1]));
  const x0 = -W / 2 + 0.10, top = Y0 + H - 0.10;

  // ---- 带 1(上):8 个位置的地板条。长度 ∝ 地板 / 234(地表 = 满格);状态色;无数值 = 空框。
  const locs = (roster.locations || []).slice(0, 8);
  const barW = W - 0.20 - 0.30, rowH = 0.045, gap = 0.012;
  const bandTop = top; let y = bandTop - rowH / 2;
  el(0.02, 0.02, G('measured', 2.0), x0 + 0.01, bandTop + 0.03);          // 带头标记
  for (const L of locs) {
    const label = std(0x9a9088, 0.9); el(0.26, 0.016, label, x0 + 0.13, y);   // 行名占位条(无文字,长度固定)
    const f = L.floor_msv_per_earth_yr;
    if (f == null) frameEl(barW, rowH - 0.01, std(LEGEND.none, 0.9), x0 + 0.30 + barW / 2, y);
    else {
      const len = Math.max(0.02, barW * Math.min(1, f / 234));
      el(len, rowH - 0.014, G(L.status === 'measured' ? 'measured' : 'ruled', 1.6), x0 + 0.30 + len / 2, y, 'bar_' + L.id);
    }
    y -= rowH + gap;
  }
  // 20 mSv/yr 刻线(城用配额)与 50/火星年折算线(26.6 mSv/地球年)——两条线并印,不合并
  const tickX = (v) => x0 + 0.30 + barW * (v / 234);
  const bandH = locs.length * (rowH + gap);
  el(0.004, bandH, G('quota_ok', 1.8), tickX(20), bandTop - bandH / 2);
  el(0.004, bandH, G('ruled', 1.2), tickX(50 / (roster.constants.mars_year_sol * roster.constants.sol_d / roster.constants.earth_year_d)), bandTop - bandH / 2);

  // ---- 带 2(中):115 人牌,23 × 5 网格;颜色 = 住地与床位状态;剂量 null 的人 = 空框。
  const people = roster.people || [];
  const cols = 23, tile = 0.072, tgap = 0.014;
  const gridW = cols * tile + (cols - 1) * tgap;
  const gx0 = -gridW / 2 + tile / 2, gy0 = bandTop - bandH - 0.12 - tile / 2;
  people.forEach((p, i) => {
    const cx = gx0 + (i % cols) * (tile + tgap), cy = gy0 - Math.floor(i / cols) * (tile + tgap);
    const k = p.sleep_location === 'village_bunk_std' ? 'village_std' : p.sleep_location === 'village_bunk_end' ? 'village_end'
      : p.sleep_location === 'village_bunk_corner' ? 'village_corner' : p.sleep_location === 'undercity_cabin' ? 'under_bed' : 'under_nobed';
    if (p.dose_msv_per_sol == null) frameEl(tile, tile, std(LEGEND[k], 0.9), cx, cy);
    else el(tile, tile, G(k, 1.5), cx, cy, 'person_' + p.id);
  });
  const rows = Math.ceil(people.length / cols), gridH = rows * (tile + tgap);

  // ---- 带 3(下):4 个情景条,长度 ∝ 到 20 mSv 的 sol / 365;红刻线 = 一个地球年 355.5 sol(没有一条到得了)。
  const scen = roster.scenarios || [];
  const sTop = gy0 - gridH + tile / 2 - 0.10, sRow = 0.05;
  const scale = barW / 365;
  scen.forEach((s, i) => {
    const yy = sTop - i * (sRow + gap) - sRow / 2;
    el(0.26, 0.016, std(0x9a9088, 0.9), x0 + 0.13, yy);
    const sol = s.city20_sol_std || 0;
    el(Math.max(0.02, sol * scale), sRow - 0.016, G('quota_ok', 1.6), x0 + 0.30 + sol * scale / 2, yy, 'scen_' + s.id);
    const sole = s.city20_sol_end || 0;  // end 床民:细条叠印
    el(Math.max(0.02, sole * scale), 0.010, G('village_end', 1.6), x0 + 0.30 + sole * scale / 2, yy - sRow / 2 + 0.012);
  });
  const sH = scen.length * (sRow + gap);
  el(0.004, sH, G('year_tick', 2.0), x0 + 0.30 + (roster.constants.earth_year_d / roster.constants.sol_d) * scale, sTop - sH / 2);

  // ---- 状态灯:数据版本心跳(绿常亮 = roster.json 已加载;版本进 userData 供宿主读)
  const lamp = el(0.05, 0.05, G('quota_ok', 2.2), W / 2 - 0.08, Y0 + 0.08, 'roster_lamp');
  g.userData.nightMats = night;
  g.userData.roster = { schema: roster.schema, version: roster.version, occupancy: roster.occupancy, n_people: people.length,
    n_with_number: people.filter(p => p.dose_msv_per_sol != null).length, generated: roster.generated };
  g.userData.legend = LEGEND;
  return g;
}
