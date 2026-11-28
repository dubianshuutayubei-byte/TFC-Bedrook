# TFC公式ソース基準・バージョン監査

更新日：2026-11-29

## 1. 現行の仕様基準（最優先）

TFC-Bedrookの現行開発基準は、ユーザー提供のJava版サンプルJARと対応する公式ソースに合わせ、次へ統一する。

- TerraFirmaCraft Java Edition 1.21.1
- TerraFirmaCraft 1.21.1-4.2.16
- 公式ソースタグ：v4.2.16
- ユーザー提供資料：`TerraFirmaCraft-NeoForge-1.21.1-4.2.16.jar`
- 公式Field Guide：1.21.x 系

動物ロスター、畜産ServerConfig、魚類、スポーン条件など、直近の実装で追加・更新した1.21.1-4.2.16データはこの基準に従う。Java JARはクラス・設定・登録構造の照合に使用し、Javaコードやアセットを無許可でコピーしない。

## 2. 旧1.20.1資料の扱い

過去の調査で参照した以下の資料は、現行仕様の正本ではなく、履歴・比較用として保持する。

- TerraFirmaCraft Java Edition 1.20.1
- TerraFirmaCraft 3.2.26
- 公式Gitタグ：v3.2.26
- 旧Field Guide / 旧Worldgen・鉱脈・金属・食品データ

旧版から抽出したWorld Preset、鉱脈、食品、金属、肥料などの値を、1.21.1-4.2.16の値として扱わない。各機能を更新するときはv4.2.16のJAR・公式ソース・Field Guideと再照合し、差分が未確認なら旧版値であることを明示する。

## 3. 公式ソース・ライセンスと再利用方針

TFC公式ソースのライセンス条件を守り、Java版コード・テクスチャ・モデル・音声・翻訳データをそのまま移植しない。仕様・数値・ゲームルールを抽出し、Bedrock向けに独自実装する。コードやアセットの再利用が必要な場合は、対象バージョンのライセンスと配布条件を個別に確認する。

旧3.2.26ソースに関する当時の調査結果は以下に履歴として残すが、現行1.21.1の仕様判断には流用しない。

## 4. 公式ソースで直接確認したファイル

以下はv3.2.26タグのファイルをGitHubから直接取得して確認した。

### World Preset
- src/main/resources/data/tfc/worldgen/world_preset/overworld.json
- generator.typeはtfc:overworld
- biome_source.typeはtfc:overworld
- tfc_settingsにspawn center / distanceとrock_layer_settingsを持つ。
- rocks、bottom、layers、ocean_floor、volcanic、land、upliftを定義する。

### 鉱脈
- src/main/resources/data/tfc/worldgen/configured_feature/vein/cinnabar.json
- v3.2.26のCinnabarはmin_y -70、max_y 10、size 18、rarity 14、density 0.6。
- Quartzite / Phyllite / Gneiss / Schistの岩石ブロックを置換する定義がある。
- これはTFC公式Field Guideの文章だけでなく、実際のWorldgenデータを照合する必要がある例。

### Food Item
- src/main/resources/data/tfc/tfc/food_items/barley_bread.json
- ingredientはtfc:food/barley_bread。
- hunger 4、saturation 1、decay_modifier 1、grain 1.5。

### Metal
- src/main/resources/data/tfc/tfc/metals/copper.json
- tier 1、fluid tfc:metal/copper、melt_temperature 1080、specific_heat_capacity 0.00857。
- ingot / double_ingot / sheetのタグを定義する。

### Fauna
- src/main/resources/data/tfc/tfc/fauna/cow.json
- min_temperature -10、max_temperature 35、min_rainfall 250。

### Fertilizer
- src/main/resources/data/tfc/tfc/fertilizers/bone_meal.json
- Bone MealはPhosphorus 0.1を付与する。

上記は一部ファイルの例であり、TFC全データを抽出済みという意味ではない。

### v3.2.26 World Presetの実数値

直接取得したoverworld.jsonから確認：
- spawn_center_x = 0
- spawn_center_z = 0
- spawn_distance = 4000
- temperature_scale = 20000
- rainfall_scale = 20000
- flat_bedrock = false
- continentalness = 0.5
- noise settings = minecraft:overworld

このWorld Presetでは、OverworldだけがTFC独自generator / biome_sourceを使う。NetherとEndは通常のMinecraft generator設定になっている。

### 追加で確認した正確なデータ値
- Copper metal：tier 1、melt_temperature 1080°C、specific_heat_capacity 0.00857。
- Barley Bread：hunger 4、saturation 1、decay_modifier 1、grain 1.5。
- Cow fauna：min_temperature -10°C、max_temperature 35°C、min_rainfall 250mm。
- Bone Meal fertilizer：phosphorus 0.1。
- Cinnabar vein：rarity 14、density 0.6、min_y -70、max_y 10、size 18。置換対象はQuartzite / Phyllite / Gneiss / Schistのraw rock。


## 5. 次にソースから抽出するデータ

- World Preset全体と岩石層の設定
- 全Biome定義と高度帯・Biome Tags
- 全Rock / Ore / Mineral / Veinの生成条件
- Metal / Alloy / Item Heat / Fuel / Item Size
- Food Item / Drinkable / Fertilizer / Crop / Climate Range
- Fauna / Spawn Conditions
- Recipe（Knapping / Heating / Anvil / Welding / Barrel / Pot / Quern / Crafting）
- Loot Table / Block / Entity / Tags
- Field Guide各ページと実際のデータ定義の差分

抽出時は、3.2.26のタグを必ず指定する。main / 1.21.x / 最新Releaseのデータを混ぜない。

## 6. 公式参照元

- [Official Repository](https://github.com/TerraFirmaCraft/TerraFirmaCraft)
- [v3.2.26 Release](https://github.com/TerraFirmaCraft/TerraFirmaCraft/releases/tag/v3.2.26)
- [v3.2.27 Release](https://github.com/TerraFirmaCraft/TerraFirmaCraft/releases/tag/v3.2.27)
- [v3.2.28 Release](https://github.com/TerraFirmaCraft/TerraFirmaCraft/releases/tag/v3.2.28)
- [v3.2.29 Release](https://github.com/TerraFirmaCraft/TerraFirmaCraft/releases/tag/v3.2.29)
- [v3.2.30 Release](https://github.com/TerraFirmaCraft/TerraFirmaCraft/releases/tag/v3.2.30)
- [World Preset at v3.2.26](https://github.com/TerraFirmaCraft/TerraFirmaCraft/blob/v3.2.26/src/main/resources/data/tfc/worldgen/world_preset/overworld.json)
- [Cinnabar Vein at v3.2.26](https://github.com/TerraFirmaCraft/TerraFirmaCraft/blob/v3.2.26/src/main/resources/data/tfc/worldgen/configured_feature/vein/cinnabar.json)
- [Barley Bread Food Data at v3.2.26](https://github.com/TerraFirmaCraft/TerraFirmaCraft/blob/v3.2.26/src/main/resources/data/tfc/tfc/food_items/barley_bread.json)
- [Copper Metal Data at v3.2.26](https://github.com/TerraFirmaCraft/TerraFirmaCraft/blob/v3.2.26/src/main/resources/data/tfc/tfc/metals/copper.json)
- [Cow Fauna Data at v3.2.26](https://github.com/TerraFirmaCraft/TerraFirmaCraft/blob/v3.2.26/src/main/resources/data/tfc/tfc/fauna/cow.json)
- [Bone Meal Fertilizer Data at v3.2.26](https://github.com/TerraFirmaCraft/TerraFirmaCraft/blob/v3.2.26/src/main/resources/data/tfc/tfc/fertilizers/bone_meal.json)
