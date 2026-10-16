// data.vi.ts — Vietnamese translations for game-data i18n keys (depthData, gameData, population).
// Owned by the i18n-data worker; merged into the master VI dictionary by src/i18n/index.ts.
export const dataVi: Record<string, string> = {
  // ---- Main NPC (Elder Mira) dialogue ----
  'npc.dialogue.mira.0.0': 'Rừng đang suy kiệt, hỡi con trẻ. Ba Mảnh Linh Hồn đã thất lạc.',
  'npc.dialogue.mira.0.1': 'Cổ Thụ không thể hồi phục nếu thiếu chúng.',
  'npc.dialogue.mira.0.2': 'Hãy đi theo Linh Hồn — nó sẽ dẫn con đến mảnh đầu tiên.',
  'npc.dialogue.mira.1.0': 'Con đã tìm được một. Linh Hồn sáng dần với mỗi mảnh.',
  'npc.dialogue.mira.1.1': 'Mảnh kế tiếp nằm nơi ánh nước le lói — Hồ Pha Lê giấu kín bí mật của nó.',
  'npc.dialogue.mira.2.0': 'Được hai rồi. Cổ Thụ bắt đầu lay động, nhưng mảnh cuối ẩn sâu lắm.',
  'npc.dialogue.mira.2.1': 'Những phế tích xưa thì thầm về nó — phù văn sẽ chỉ con đường.',
  'npc.dialogue.mira.3.0': 'Cả ba mảnh giờ là của con. Rừng nín thở chờ.',
  'npc.dialogue.mira.3.1': 'Mang chúng về cho Cổ Thụ. Đã đến lúc.',
  'npc.dialogue.mira.4.0': 'Cổ Thụ thở lại rồi. Rừng nhớ những gì con đã làm.',
  'npc.dialogue.mira.4.1': 'Con đã là một phần trong câu chuyện của nó, hỡi con trẻ.',

  // ---- Secondary NPC dialogue ----
  'npc.dialogue.merchant.0.0': 'Rừng dạo này im ắng quá. Im ắng một cách lạ.',
  'npc.dialogue.merchant.0.1': 'Nghe nói ánh sáng cổ xưa đang phai dần.',
  'npc.dialogue.merchant.1.0': 'Tối qua nấm trong Rừng Nấm sáng rực hơn hẳn. Có gì đó đang tỉnh dậy gần Rừng Nấm.',
  'npc.dialogue.fisherman.0.0': 'Đá pha lê dưới hồ rung rinh khi gió đúng chiều.',
  'npc.dialogue.fisherman.0.1': 'Người xưa nói chúng còn nhớ vị người canh giữ đầu tiên.',
  'npc.dialogue.fisherman.1.0': 'Nước gần bờ giờ phát sáng về đêm. Chưa bao giờ thấy chuyện đó.',
  'npc.dialogue.scholar.0.0': 'Phế Tích cũ hơn ngôi làng cả vài thế kỷ. Phù văn là thứ tiếng ta chưa đọc hết được.',
  'npc.dialogue.scholar.0.1': 'Nhưng thứ tự — ta nghĩ nó theo các vì sao.',
  'npc.dialogue.scholar.1.0': 'Mỗi phù văn trong phế tích ứng với một phương. Thứ tự là điều quyết định.',
  'npc.dialogue.villager.0.0': 'Bà nội ta hay kể chuyện về Cổ Thụ. Bà nói nó biết mơ.',
  'npc.dialogue.villager.1.0': 'Ánh Linh Hồn đi theo con, phải không? Đừng lo — nó có ý tốt.',

  // ---- Region entry titles ----
  'region.village': 'Ngôi Làng Rừng',
  'region.spirit': 'Khoảng Rừng Linh Thiêng',
  'region.lake': 'Hồ Pha Lê',
  'region.grove': 'Rừng Nấm',
  'region.ruins': 'Phế Tích Thì Thầm',
  'region.tree': 'Cổ Thụ',

  // ---- Current objective ----
  'obj.return_fragments': 'Mang Mảnh Linh Hồn về cho Cổ Thụ',
  'obj.search_ruins': 'Tìm manh mối phù văn trong Phế Tích',
  'obj.investigate_lake': 'Điều tra Hồ Pha Lê',
  'obj.follow_spirit_grove': 'Đi theo Linh Hồn vào Rừng Nấm',
  'obj.grove_riddle': 'Giải câu đố của Linh Hồn ở Rừng Nấm',
  'obj.speak_keeper': 'Trò chuyện với Người Canh Giữ Rừng',

  // ---- Mini-objectives ----
  'obj.grove_trail': 'Đi theo Vết Dấu Linh Hồn',
  'obj.grove_trail.step': 'Tấm đá rêu phát sáng',
  'obj.grove_trail.toast': 'Linh Hồn vén bức bí ẩn',
  'obj.lake_crystals': 'Tìm Manh Mối Pha Lê',
  'obj.lake_crystals.step': 'Manh mối pha lê',
  'obj.lake_crystals.toast': 'Pha lê vén thứ tự phù văn',
  'obj.ruins_runes': 'Đọc Manh Mối Phù Văn',
  'obj.ruins_runes.step': 'Bia phù văn',
  'obj.ruins_runes.toast': 'Phù văn chỉ ra thứ tự phản chiếu',

  // ---- Environmental interactables ----
  'interact.village_sign.label': 'Đọc tấm biển',
  'interact.village_sign.text': 'Ngôi làng đã đứng vững suốt trăm năm. Cổ Thụ che chở cho nó.',
  'interact.village_shrine.label': 'Khám phá bàn thờ',
  'interact.village_shrine.text': 'Bàn thờ đã nứt. Ánh sáng từng tràn ngập nơi đây giờ đã tắt.',
  'interact.village_supplies.label': 'Nhìn đống đồ dự trữ',
  'interact.village_supplies.text': 'Ai đó bỏ rơi chúng trong lúc vội vã.',
  'interact.ruins_inscription.label': 'Đọc hàng khắc',
  'interact.ruins_inscription.text': 'Các người canh giữ xưa đã khắc lời cảnh báo ở đây. Đọc kỹ từng chữ.',
  'interact.ruins_monument.label': 'Quan sát bia mộ',
  'interact.ruins_monument.text': 'Biên kỷ sụp đổ cùng lúc mảnh linh hồn thất lạc.',
  'interact.ruins_markings.label': 'Khám phá các vết khắc',
  'interact.ruins_markings.text': 'Những vết khắc này xưa hơn ngôi làng cả vài thế kỷ.',
  'interact.lake_crystal_formation.label': 'Chạm vào đám kết tinh',
  'interact.lake_crystal_formation.text': 'Đá pha lê rung lên từng nhịp trầm, đều đặn.',
  'interact.lake_camp.label': 'Tìm trại',
  'interact.lake_camp.text': 'Trại của một người đánh cá, đã bỏ hoang từ lâu. Chiếc đèn lồng vẫn còn le lói.',
  'interact.grove_growth.label': 'Xét khối nấm mọc',
  'interact.grove_growth.text': 'Nấm sáng hơn mức phải có. Có gì đó đang lay động.',
  'interact.grove_marks.label': 'Theo dấu vết',
  'interact.grove_marks.text': 'Linh Hồn để lại những vết này. Chúng chỉ sâu hơn vào rừng nấm.',
  'interact.tree_stones.label': 'Chạm các đá nghi lễ',
  'interact.tree_stones.text': 'Đá ấm áp dù không khí lạnh buốt.',
  'interact.tree_sockets.label': 'Quan sát các hốc',
  'interact.tree_sockets.text': 'Ba hốc, trống rỗng. Cổ Thụ đang chờ những mảnh linh hồn của nó.',

  // ---- Secrets ----
  'secret.secret_grove_glow.label': 'Ánh Sáng Ẩn',
  'secret.secret_grove_glow.text': 'Nấm nhấp nháy ánh sáng',
  'secret.secret_lake_depth.label': 'Ký Ức Sâu Xa',
  'secret.secret_lake_depth.text': 'Hồ là nơi đầu tiên nhớ lại.',
  'secret.secret_ruins_chamber.label': 'Phòng Bí Ẩn',
  'secret.secret_ruins_chamber.text': 'Một mảnh pha lê nhỏ',
  'secret.secret_tree_heart.label': 'Trái Tim',
  'secret.secret_tree_heart.text': 'Con đã chạm vào Trái Tim của Cổ Thụ',

  // ---- Lore fragments ----
  'lore.tree_origin.title': 'Cổ Thụ Đầu Tiên',
  'lore.tree_origin.text': 'Cổ Thụ là thứ thức tỉnh đầu tiên khi khu rừng chìm vào giấc mơ.',
  'lore.keepers.title': 'Những Người Canh Giữ',
  'lore.keepers.text': 'Ba người canh giữ đã bảo vệ các mảnh linh hồn. Tên họ được khắc trong phế tích.',
  'lore.ruins_history.title': 'Những Phế Tích Xưa',
  'lore.ruins_history.text': 'Phế tích từng là nơi trú ẩn. Phù văn chính là ổ khóa.',
  'lore.spirit_lore.title': 'Linh Hồn',
  'lore.spirit_lore.text': 'Linh Hồn là ký ức của khu rừng, được khoác lên ánh sáng.',
  'lore.lake_origin.title': 'Hồ Pha Lê',
  'lore.lake_origin.text': 'Hồ hình thành nơi mảnh linh hồn đầu tiên rơi xuống.',
  'lore.grove_secret.title': 'Rừng Nấm',
  'lore.grove_secret.text': 'Nấm vươn về phía ánh sáng. Chúng nhớ về Cổ Thụ.',

  // ---- Characters ----
  'char.name.knight': 'Kỵ Sĩ Rừng',
  'char.title.knight': 'Người Bảo Vệ',
  'char.desc.knight': 'Người bảo vệ kiên trung của Cổ Thụ. Chỉ là ngoại hình — hành trình giống nhau cho tất cả.',
  'char.name.mage': 'Phù Thư Rêu',
  'char.title.mage': 'Người Giữ Gìn',
  'char.desc.mage': 'Người giữ dịu dàng của ánh rêu và bào tử. Chỉ là ngoại hình — hành trình giống nhau cho tất cả.',
  'char.name.rogue': 'Lữ Khách Gai',
  'char.title.rogue': 'Người Khai Lộ',
  'char.desc.rogue': 'Người khai lộ nhanh nhẹn trên những con đường gai. Chỉ là ngoại hình — hành trình giống nhau cho tất cả.',

  // ---- Main quest ----
  'quest.main.title': 'Khu Rừng Vẫn Nhớ',
  'quest.main.step.0': 'Trò chuyện với linh hồn rừng trong Làng',
  'quest.main.step.1': 'Lấy lại Mảnh Linh Hồn Rừng Nấm (Rừng Nấm — Con Đường Linh Hồn)',
  'quest.main.step.2': 'Lấy lại Mảnh Linh Hồn Hồ (Hồ Pha Lê — Chuỗi Phù Văn)',
  'quest.main.step.3': 'Lấy lại Mảnh Linh Hồn Phế Tích (Phế Tích Thì Thầm — Phản Chiếu Ánh Sáng)',
  'quest.main.step.4': 'Khôi phục Cổ Thụ',

  // ---- Puzzle hints ----
  'puzzle.hint.spirit_path': 'Hãy theo dấu chân Linh Hồn: thứ tự các viên đá sẽ sáng hai lần, rồi hãy thử.',
  'puzzle.hint.rune_sequence': 'Hãy lắng nghe và quan sát: phù văn cất tiếng theo một thứ tự. Có thể nghe lại bất cứ lúc nào.',
  'puzzle.hint.light_reflection': 'Xoay từng khối pha lê cho đến khi tia sáng chạy thẳng về phía cổng.',

  // ---- Population NPC labels ----
  'pop.villager': 'Nói chuyện với dân làng',
  'pop.merchant': 'Nói chuyện với thương nhân',
  'pop.vendor': 'Nói chuyện với tiểu thương',
  'pop.fisherman': 'Nói chuyện với người đánh cá',
  'pop.scholar': 'Nói chuyện với học giả',

  // ---- Population NPC dialogue ----
  'pop.villager.0': 'Bà nội ta hay kể chuyện về Cổ Thụ. Bà nói nó biết mơ.',
  'pop.villager.1': 'Ánh Linh Hồn đi theo con, phải không? Đừng lo — nó có ý tốt.',
  'pop.merchant.0': 'Rừng dạo này im ắng quá. Im ắng một cách lạ.',
  'pop.merchant.1': 'Tối qua nấm trong Rừng Nấm sáng rực hơn hẳn. Có gì đó đang tỉnh dậy gần Rừng Nấm.',
  'pop.vendor.0': 'Ta bán đồ trong rừng — thảo mộc, nấm khô, chút mật ong. Chẳng gì cầu kỳ.',
  'pop.vendor.1': 'Nghe tiếng động lạ gần Rừng Nấm về đêm chưa? Người cao tuổi nói Cổ Thụ đang gọi.',
  'pop.fisherman.0': 'Đá pha lê dưới hồ rung rinh khi gió đúng chiều.',
  'pop.fisherman.1': 'Nước gần bờ giờ phát sáng về đêm. Chưa bao giờ thấy chuyện đó.',
  'pop.scholar.0': 'Phế Tích cũ hơn ngôi làng cả vài thế kỷ. Phù văn là thứ tiếng ta chưa đọc hết được.',
  'pop.scholar.1': 'Nhưng thứ tự — ta nghĩ nó theo các vì sao. Mỗi phù văn ứng với một phương.',
};
