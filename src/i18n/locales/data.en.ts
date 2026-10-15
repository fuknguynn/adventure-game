// data.en.ts — English source text for game-data i18n keys (depthData, gameData, population).
// Owned by the i18n-data worker; merged into the master EN dictionary by src/i18n/index.ts.
export const dataEn: Record<string, string> = {
  // ---- Main NPC (Elder Mira) dialogue ----
  'npc.dialogue.mira.0.0': 'The forest is weakening, child. Three Spirit Fragments are lost.',
  'npc.dialogue.mira.0.1': 'The Ancient Tree cannot recover without them.',
  'npc.dialogue.mira.0.2': 'Follow the Spirit — it will guide you to the first.',
  'npc.dialogue.mira.1.0': 'You found one. The Spirit grows brighter with each fragment.',
  'npc.dialogue.mira.1.1': 'The next lies where the water glows — Crystal Lake holds its secret.',
  'npc.dialogue.mira.2.0': 'Two down. The Tree stirs, but the last fragment is hidden deep.',
  'npc.dialogue.mira.2.1': 'The old ruins whisper of it — the runes will show you the way.',
  'npc.dialogue.mira.3.0': 'All three fragments are yours. The forest holds its breath.',
  'npc.dialogue.mira.3.1': 'Take them to the Ancient Tree. It is time.',
  'npc.dialogue.mira.4.0': 'The Tree breathes again. The forest remembers what you did.',
  'npc.dialogue.mira.4.1': 'You are part of its story now, child.',

  // ---- Secondary NPC dialogue ----
  'npc.dialogue.merchant.0.0': 'The forest has been quiet lately. Too quiet.',
  'npc.dialogue.merchant.0.1': 'Folks say the old light is fading.',
  'npc.dialogue.merchant.1.0': 'I heard the grove mushrooms glow brighter last night. Something is stirring near the Grove.',
  'npc.dialogue.fisherman.0.0': 'The crystals under the lake hum when the wind is right.',
  'npc.dialogue.fisherman.0.1': 'Old folk say they remember the first keeper.',
  'npc.dialogue.fisherman.1.0': 'The water near the shore glows at night now. Never seen that before.',
  'npc.dialogue.scholar.0.0': 'The ruins predate the village by centuries. The runes are a language I cannot fully read.',
  'npc.dialogue.scholar.0.1': 'But the sequence — I think it follows the stars.',
  'npc.dialogue.scholar.1.0': 'Each rune in the ruins corresponds to a direction. The order matters.',
  'npc.dialogue.villager.0.0': 'My grandmother used to tell stories about the Tree. She said it dreamed.',
  'npc.dialogue.villager.1.0': "The spirit light follows you, doesn't it? Don't worry — it means well.",

  // ---- Region entry titles ----
  'region.village': 'Forest Village',
  'region.spirit': 'Spirit Clearing',
  'region.lake': 'Crystal Lake',
  'region.grove': 'Mushroom Grove',
  'region.ruins': 'Whispering Ruins',
  'region.tree': 'The Ancient Tree',

  // ---- Current objective ----
  'obj.return_fragments': 'Return the Spirit Fragments to the Ancient Tree',
  'obj.search_ruins': 'Search the Ruins for rune clues',
  'obj.investigate_lake': 'Investigate the Crystal Lake',
  'obj.follow_spirit_grove': 'Follow the Spirit into the Grove',
  'obj.speak_keeper': 'Speak with the Forest Keeper',

  // ---- Mini-objectives ----
  'obj.grove_trail': 'Follow the Spirit Trail',
  'obj.grove_trail.step': 'Glowing moss stone',
  'obj.grove_trail.toast': 'The Spirit reveals the puzzle',
  'obj.lake_crystals': 'Find the Crystal Clues',
  'obj.lake_crystals.step': 'Crystal clue',
  'obj.lake_crystals.toast': 'The crystals reveal the sequence',
  'obj.ruins_runes': 'Read the Rune Clues',
  'obj.ruins_runes.step': 'Rune inscription',
  'obj.ruins_runes.toast': 'The runes show the reflection order',

  // ---- Environmental interactables ----
  'interact.village_sign.label': 'Read the sign',
  'interact.village_sign.text': 'The village has stood for a hundred years. The Tree keeps it safe.',
  'interact.village_shrine.label': 'Examine the shrine',
  'interact.village_shrine.text': 'The shrine is cracked. The light that once filled it is gone.',
  'interact.village_supplies.label': 'Look at the supplies',
  'interact.village_supplies.text': 'Someone left these behind in a hurry.',
  'interact.ruins_inscription.label': 'Read the inscription',
  'interact.ruins_inscription.text': 'The old keepers carved their warnings here. Read carefully.',
  'interact.ruins_monument.label': 'Study the monument',
  'interact.ruins_monument.text': 'The monument fell when the fragments were lost.',
  'interact.ruins_markings.label': 'Examine the markings',
  'interact.ruins_markings.text': 'These markings predate the village by centuries.',
  'interact.lake_crystal_formation.label': 'Touch the formation',
  'interact.lake_crystal_formation.text': 'The crystals hum with a low, steady pulse.',
  'interact.lake_camp.label': 'Search the camp',
  'interact.lake_camp.text': "A fisherman's camp, long abandoned. The lantern still glows.",
  'interact.grove_growth.label': 'Inspect the growth',
  'interact.grove_growth.text': 'The mushrooms glow brighter than they should. Something is stirring.',
  'interact.grove_marks.label': 'Follow the marks',
  'interact.grove_marks.text': 'The Spirit left these marks. They point deeper into the grove.',
  'interact.tree_stones.label': 'Touch the ritual stones',
  'interact.tree_stones.text': 'The stones are warm despite the cold air.',
  'interact.tree_sockets.label': 'Study the sockets',
  'interact.tree_sockets.text': 'Three sockets, empty. The Tree waits for its fragments.',

  // ---- Secrets ----
  'secret.secret_grove_glow.label': 'Hidden Glow',
  'secret.secret_grove_glow.text': 'The mushrooms pulse with light',
  'secret.secret_lake_depth.label': 'Deep Memory',
  'secret.secret_lake_depth.text': 'The lake was the first to remember.',
  'secret.secret_ruins_chamber.label': 'Hidden Chamber',
  'secret.secret_ruins_chamber.text': 'A small crystal shard',
  'secret.secret_tree_heart.label': 'The Heart',
  'secret.secret_tree_heart.text': "You touched the Tree's heart",

  // ---- Lore fragments ----
  'lore.tree_origin.title': 'The First Tree',
  'lore.tree_origin.text': 'The Ancient Tree was the first to wake when the forest dreamed.',
  'lore.keepers.title': 'The Keepers',
  'lore.keepers.text': 'Three keepers guarded the fragments. Their names are carved in the ruins.',
  'lore.ruins_history.title': 'The Old Ruins',
  'lore.ruins_history.text': 'The ruins were a sanctuary. The runes were a lock.',
  'lore.spirit_lore.title': 'The Spirit',
  'lore.spirit_lore.text': "The Spirit is the forest's memory, given light.",
  'lore.lake_origin.title': 'Crystal Lake',
  'lore.lake_origin.text': 'The lake formed where the first fragment fell.',
  'lore.grove_secret.title': 'The Grove',
  'lore.grove_secret.text': 'The mushrooms grow toward the light. They remember the Tree.',

  // ---- Characters ----
  'char.name.knight': 'Knight of the Grove',
  'char.title.knight': 'Warden',
  'char.desc.knight': 'A steadfast warden sworn to the Ancient Tree. Cosmetic choice — same journey for all.',
  'char.name.mage': 'Moss Mage',
  'char.title.mage': 'Keeper',
  'char.desc.mage': 'A gentle keeper of mosslight and spores. Cosmetic choice — same journey for all.',
  'char.name.rogue': 'Thorn Rogue',
  'char.title.rogue': 'Pathfinder',
  'char.desc.rogue': 'A quick pathfinder of briar trails. Cosmetic choice — same journey for all.',

  // ---- Main quest ----
  'quest.main.title': 'The Forest Remembers',
  'quest.main.step.0': 'Speak with the forest spirit in the Village',
  'quest.main.step.1': 'Recover the Grove Fragment (Mushroom Grove — Spirit Path)',
  'quest.main.step.2': 'Recover the Lake Fragment (Crystal Lake — Rune Sequence)',
  'quest.main.step.3': 'Recover the Ruins Fragment (Whispering Ruins — Light Reflection)',
  'quest.main.step.4': 'Restore the Ancient Tree',

  // ---- Puzzle hints ----
  'puzzle.hint.spirit_path': 'Follow the spirit footprints: stone order glows twice, then try.',
  'puzzle.hint.rune_sequence': 'Listen and watch: the runes sing in order. Replay any time.',
  'puzzle.hint.light_reflection': 'Turn each crystal until its beam runs straight to the gate.',

  // ---- Population NPC labels ----
  'pop.villager': 'Talk to the villager',
  'pop.merchant': 'Talk to the merchant',
  'pop.vendor': 'Talk to the vendor',
  'pop.fisherman': 'Talk to the fisherman',
  'pop.scholar': 'Talk to the scholar',

  // ---- Population NPC dialogue ----
  'pop.villager.0': 'My grandmother used to tell stories about the Tree. She said it dreamed.',
  'pop.villager.1': "The spirit light follows you, doesn't it? Don't worry — it means well.",
  'pop.merchant.0': 'The forest has been quiet lately. Too quiet.',
  'pop.merchant.1': 'I heard the grove mushrooms glow brighter last night. Something is stirring near the Grove.',
  'pop.vendor.0': 'I sell forest goods — herbs, dried caps, a little honey. Nothing fancy.',
  'pop.vendor.1': 'Have you heard the strange sounds near the grove at night? The elders say the Tree is calling.',
  'pop.fisherman.0': 'The crystals under the lake hum when the wind is right.',
  'pop.fisherman.1': 'The water near the shore glows at night now. Never seen that before.',
  'pop.scholar.0': 'The ruins predate the village by centuries. The runes are a language I cannot fully read.',
  'pop.scholar.1': 'But the sequence — I think it follows the stars. Each rune corresponds to a direction.',
};
