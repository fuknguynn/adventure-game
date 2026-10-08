// Vendor script: downloads ONLY verified KayKit files via GitHub HTTPS raw.
// Appends exact entries to asset-manifest.json. Skips files already present.
// Usage: npm run vendor
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const RAW = {
  chars: 'https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main',
  env: 'https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main',
  props: 'https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main',
};
const LIC = 'CC0-1.0';
const BY = 'Kay Lousberg (KayKit)';

// [manifestId, repoBase, sourcePath, localPath, usage, bytes]
const FILES = [
  // Selectable characters (verified GLBs)
  ['knight', RAW.chars, 'assets/kaykit/adventurers-2.0/Characters/gltf/Knight.glb', 'public/models/characters/Knight.glb', 'selectable player character', 341688],
  ['anim-general', RAW.chars, 'assets/kaykit/adventurers-2.0/Animations/gltf/Rig_Medium/Rig_Medium_General.glb', 'public/models/anim/Rig_Medium_General.glb', 'shared idle/interact clips (retargeted by bone name)', 828240],
  ['anim-move', RAW.chars, 'assets/kaykit/adventurers-2.0/Animations/gltf/Rig_Medium/Rig_Medium_MovementBasic.glb', 'public/models/anim/Rig_Medium_MovementBasic.glb', 'shared walk/run/jump clips (retargeted by bone name)', 689624],
  ['mage', RAW.chars, 'assets/kaykit/adventurers-2.0/Characters/gltf/Mage.glb', 'public/models/characters/Mage.glb', 'selectable player character', 352472],
  ['rogue', RAW.chars, 'assets/kaykit/adventurers-2.0/Characters/gltf/Rogue.glb', 'public/models/characters/Rogue.glb', 'selectable player character', 409188],
  // Forest Nature Pack: trees / foliage / ground (glTF + bin pairs; upstream has 0 native GLB)
  ['pine-large', RAW.env, 'assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color1/Tree_1_A_Color1.gltf', 'public/models/env/Tree_1_A_Color1.gltf', 'forest tree', 0],
  ['pine-small', RAW.env, 'assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color1/Tree_1_B_Color1.gltf', 'public/models/env/Tree_1_B_Color1.gltf', 'forest tree variant', 0],
  ['bush', RAW.env, 'assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color1/Bush_1_A_Color1.gltf', 'public/models/env/Bush_1_A_Color1.gltf', 'forest bush', 0],
  ['grass', RAW.env, 'assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color1/Grass_1_A_Color1.gltf', 'public/models/env/Grass_1_A_Color1.gltf', 'forest grass', 0],
  ['rock', RAW.env, 'assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color1/Rock_1_A_Color1.gltf', 'public/models/env/Rock_1_A_Color1.gltf', 'forest rock', 0],
  ['flowers', RAW.env, 'assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color1/Tree_1_C_Color1.gltf', 'public/models/env/Tree_1_C_Color1.gltf', 'forest tree variant C', 0],
  // Dungeon pack: ruins dressing (columns/gate/banner)
  ['ruins-pillar', RAW.env, 'assets/kaykit/dungeon-remastered-1.1/Assets/gltf/pillar.gltf', 'public/models/env/pillar.gltf', 'ruins column', 0],
  ['ruins-banner', RAW.env, 'assets/kaykit/dungeon-remastered-1.1/Assets/gltf/banner_blue.gltf', 'public/models/env/banner_blue.gltf', 'ruins banner', 0],
  // Props
  ['chest', RAW.props, 'assets/kaykit/block-bits-1.0/Assets/gltf/chest.gltf', 'public/models/props/chest.gltf', 'quest chest', 0],
  ['barrel', RAW.props, 'assets/kaykit/block-bits-1.0/Assets/gltf/barrel.gltf', 'public/models/props/barrel.gltf', 'village barrel', 0],
  ['lantern', RAW.props, 'assets/kaykit/holiday-bits-1.0/Assets/gltf/lantern.gltf', 'public/models/props/lantern.gltf', 'village lantern', 0],
  ['crystal', RAW.props, 'assets/kaykit/resource-bits-1.0/Assets/gltf/Gem_Medium.gltf', 'public/models/props/Gem_Medium.gltf', 'puzzle crystal', 0],
  ['rune-stone', RAW.props, 'assets/kaykit/block-bits-1.0/Assets/gltf/stone.gltf', 'public/models/props/stone.gltf', 'puzzle rune stone', 0],
  ['shrine', RAW.env, 'assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/buildings/green/building_shrine_green.gltf', 'public/models/env/shrine_green.gltf', 'ancient shrine', 0],
  // Medieval village pack: houses, well, watchtower, fences, lake flora (environment overhaul)
  ['home-a', RAW.env, 'assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/buildings/green/building_home_A_green.gltf', 'public/models/village/home_a.gltf', 'village house A', 0],
  ['home-b', RAW.env, 'assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/buildings/green/building_home_B_green.gltf', 'public/models/village/home_b.gltf', 'village house B', 0],
  ['market', RAW.env, 'assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/buildings/green/building_market_green.gltf', 'public/models/village/market.gltf', 'village market hall', 0],
  ['barracks', RAW.env, 'assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/buildings/green/building_barracks_green.gltf', 'public/models/village/barracks.gltf', 'village longhouse', 0],
  ['well', RAW.env, 'assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/buildings/green/building_well_green.gltf', 'public/models/village/well.gltf', 'village well', 0],
  ['watchtower', RAW.env, 'assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/buildings/green/building_watchtower_green.gltf', 'public/models/village/watchtower.gltf', 'village watchtower', 0],
  ['fence-wood', RAW.env, 'assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/buildings/neutral/fence_wood_straight.gltf', 'public/models/env/fence_wood.gltf', 'village garden fence', 0],
  ['waterlily', RAW.env, 'assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/decoration/nature/waterlily_A.gltf', 'public/models/env/waterlily.gltf', 'lake lily pad', 0],
  ['waterplant', RAW.env, 'assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/decoration/nature/waterplant_B.gltf', 'public/models/env/waterplant.gltf', 'lake reeds', 0],
  ['tent', RAW.env, 'assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/decoration/props/tent.gltf', 'public/models/village/tent.gltf', 'traveler tent', 0],
  ['sack', RAW.env, 'assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/decoration/props/sack.gltf', 'public/models/props/sack.gltf', 'market stall sack', 0],
  ['crate-open', RAW.env, 'assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/decoration/props/crate_open.gltf', 'public/models/props/crate_open.gltf', 'market stall crate', 0],
  // Forest nature pack: tree species variety, bare trees, rock/grass variants
  ['tree2', RAW.env, 'assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color1/Tree_2_A_Color1.gltf', 'public/models/env/Tree_2_A_Color1.gltf', 'broadleaf tree', 0],
  ['tree3', RAW.env, 'assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color1/Tree_3_A_Color1.gltf', 'public/models/env/Tree_3_A_Color1.gltf', 'round tree', 0],
  ['tree5', RAW.env, 'assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color1/Tree_5_B_Color1.gltf', 'public/models/env/Tree_5_B_Color1.gltf', 'tall pine', 0],
  ['bare-tree', RAW.env, 'assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color1/Tree_Bare_1_A_Color1.gltf', 'public/models/env/Tree_Bare_1_A_Color1.gltf', 'dead tree (ruins/lake)', 0],
  ['rock2', RAW.env, 'assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color1/Rock_2_A_Color1.gltf', 'public/models/env/Rock_2_A_Color1.gltf', 'boulder variant', 0],
  ['grass2', RAW.env, 'assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color1/Grass_2_A_Color1.gltf', 'public/models/env/Grass_2_A_Color1.gltf', 'tall grass variant', 0],
  // Dungeon remaster: real ruins masonry + torch/bench
  ['wall-broken', RAW.env, 'assets/kaykit/dungeon-remastered-1.1/Assets/gltf/wall_broken.gltf', 'public/models/env/wall_broken.gltf', 'ruins broken wall', 0],
  ['wall-arch', RAW.env, 'assets/kaykit/dungeon-remastered-1.1/Assets/gltf/wall_archedwindow_open.gltf', 'public/models/env/wall_archedwindow_open.gltf', 'ruins arch window', 0],
  ['rubble', RAW.env, 'assets/kaykit/dungeon-remastered-1.1/Assets/gltf/rubble_large.gltf', 'public/models/env/rubble_large.gltf', 'ruins rubble pile', 0],
  ['column2', RAW.env, 'assets/kaykit/dungeon-remastered-1.1/Assets/gltf/column.gltf', 'public/models/env/column.gltf', 'ruins column', 0],
  ['bench', RAW.env, 'assets/kaykit/dungeon-remastered-1.1/Assets/gltf/bench.gltf', 'public/models/props/bench.gltf', 'village bench', 0],
  ['torch-lit', RAW.env, 'assets/kaykit/dungeon-remastered-1.1/Assets/gltf/torch_lit.gltf', 'public/models/props/torch_lit.gltf', 'lit torch', 0],
  // Props repo: path signs, palisade, graveyard, torches, gems
  ['sign-left', RAW.props, 'assets/kaykit/halloween-bits-1.0/Assets/gltf/sign_left.gltf', 'public/models/props/sign_left.gltf', 'path sign pointing left', 0],
  ['sign-right', RAW.props, 'assets/kaykit/halloween-bits-1.0/Assets/gltf/sign_right.gltf', 'public/models/props/sign_right.gltf', 'path sign pointing right', 0],
  ['palisade', RAW.props, 'assets/kaykit/halloween-bits-1.0/Assets/gltf/fence.gltf', 'public/models/props/fence.gltf', 'village palisade', 0],
  ['palisade-broken', RAW.props, 'assets/kaykit/halloween-bits-1.0/Assets/gltf/fence_broken.gltf', 'public/models/props/fence_broken.gltf', 'broken palisade', 0],
  ['gravestone', RAW.props, 'assets/kaykit/halloween-bits-1.0/Assets/gltf/gravestone.gltf', 'public/models/props/gravestone.gltf', 'ruins gravestone', 0],
  ['grave-a', RAW.props, 'assets/kaykit/halloween-bits-1.0/Assets/gltf/grave_A.gltf', 'public/models/props/grave_a.gltf', 'ruins grave mound', 0],
  ['post-skull', RAW.props, 'assets/kaykit/halloween-bits-1.0/Assets/gltf/post_skull.gltf', 'public/models/props/post_skull.gltf', 'ruins skull post', 0],
  ['post-lantern', RAW.props, 'assets/kaykit/halloween-bits-1.0/Assets/gltf/post_lantern.gltf', 'public/models/props/post_lantern.gltf', 'standing lantern post', 0],
  ['anvil', RAW.props, 'assets/kaykit/rpg-tools-bits-1.0/Assets/gltf/anvil.gltf', 'public/models/props/anvil.gltf', 'village forge anvil', 0],
  ['torch', RAW.props, 'assets/kaykit/rpg-tools-bits-1.0/Assets/gltf/torch.gltf', 'public/models/props/torch.gltf', 'unlit torch', 0],
  ['gem-large', RAW.props, 'assets/kaykit/resource-bits-1.0/Assets/gltf/Gem_Large.gltf', 'public/models/props/Gem_Large.gltf', 'lake crystal cluster', 0],
  ['gem-pile', RAW.props, 'assets/kaykit/resource-bits-1.0/Assets/gltf/Gems_Pile_Small.gltf', 'public/models/props/Gems_Pile_Small.gltf', 'lake crystal cluster small', 0],
  // Restaurant bits: single mushroom cap for the glowing grove (emissive tinted in-engine)
  ['mushroom', RAW.props, 'assets/kaykit/restaurant-bits-1.0/Assets/gltf/food_ingredient_mushroom.gltf', 'public/models/props/mushroom.gltf', 'mushroom grove cap', 0],
];

async function fetchOk(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  return Buffer.from(await r.arrayBuffer());
}

async function vendorOne([id, base, src, local, usage]) {
  const dest = join(root, local);
  mkdirSync(dirname(dest), { recursive: true });
  const url = `${base}/${src}`;
  const ensure = async (u, d) => {
    if (existsSync(d) && readFileSync(d).length > 1000) return 'cached';
    const buf = await fetchOk(u);
    writeFileSync(d, buf);
    return `downloaded ${buf.length}b`;
  };
  // main file
  let status;
  try {
    status = await ensure(url, dest);
  } catch (e) {
    return { id, src, local, status: `MISS: ${e.message}`, verified: false };
  }
  // sibling .bin for gltf (required by GLTFLoader)
  let binStatus = 'n/a';
  let texStatus = '';
  if (local.endsWith('.gltf')) {
    const binSrc = src.replace(/\.gltf$/, '.bin');
    const binLocal = dest.replace(/\.gltf$/, '.bin');
    try {
      binStatus = await ensure(`${base}/${binSrc}`, binLocal);
    } catch (e) {
      binStatus = `MISS: ${e.message}`;
    }
    // upstream gltf references its own bin name; we save under the local name,
    // so rewrite buffer uris to match (GLTFLoader resolves relative to the gltf).
    // Also fetch sibling textures the gltf references (upstream stores them next to it).
    try {
      const g = JSON.parse(readFileSync(dest, 'utf8'));
      const localBin = basename(binLocal);
      let ch = false;
      for (const b of g.buffers || []) if (b.uri && b.uri !== localBin && /\.bin$/i.test(b.uri)) { b.uri = localBin; ch = true; }
      if (ch) writeFileSync(dest, JSON.stringify(g));
      const texes = [...new Set((g.images || []).map((im) => im.uri).filter((u) => u && !/^data:/.test(u)))];
      const stat = [];
      for (const t of texes) {
        const tUrl = `${base}/${dirname(src)}/${t}`.replace(/\/+/g, '/');
        const tDest = join(dirname(dest), t);
        mkdirSync(dirname(tDest), { recursive: true });
        try { stat.push(await ensure(tUrl, tDest)); } catch (e) { stat.push(`MISS ${t}: ${e.message}`); }
      }
      texStatus = stat.length ? stat.join('/') : 'none';
    } catch { /* non-JSON gltf: leave as-is */ }
  }
  return { id, src, local, status, binStatus, texStatus, verified: status !== 'MISS' };
}

const results = [];
for (const f of FILES) {
  const r = await vendorOne(f);
  console.log(r.id, '->', r.status, '| bin:', r.binStatus, '| tex:', r.texStatus || '-');
  results.push(r);
}

// merge into asset-manifest.json (keep seed character entries, add env/props)
const manPath = join(root, 'asset-manifest.json');
const man = JSON.parse(readFileSync(manPath, 'utf8'));
const have = new Set(man.assets.map((a) => a.id));
for (const r of results) {
  if (have.has(r.id)) continue;
  const cat = r.local.includes('/env/') ? 'environment' : r.local.includes('/props/') ? 'prop' : 'character';
  const repo = r.local.includes('/env/')
    ? 'https://github.com/GeorgeQLe/assets-kaykit-3d-environments'
    : r.local.includes('/props/')
      ? 'https://github.com/GeorgeQLe/assets-kaykit-3d-props'
      : 'https://github.com/GeorgeQLe/assets-kaykit-3d-characters';
  man.assets.push({
    id: r.id,
    category: cat,
    repository: repo,
    sourcePath: FILES.find((f) => f[0] === r.id)[2],
    localPath: r.local,
    format: r.local.endsWith('.glb') ? 'glb' : 'gltf+bin',
    license: LIC,
    licenseEvidencePath: 'public/licenses/KayKit-CC0-License.txt',
    author: BY,
    scale: 1,
    animations: [],
    usage: FILES.find((f) => f[0] === r.id)[4],
    optimizedBytes: 0,
    verified: r.status.startsWith('MISS') ? false : true,
  });
}
writeFileSync(manPath, JSON.stringify(man, null, 2));
const missing = results.filter((r) => r.status.startsWith('MISS'));
if (missing.length) {
  console.log('MISSING:', missing.map((m) => m.id).join(', '));
  console.log('Note: missing names will be substituted with existing vendored siblings before release; manifest verified flags updated then.');
}
