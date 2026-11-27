# TFC公式ソース基準・バージョン監査

更新日：2026-11-27

## 1. 固定する仕様基準

TFC-Bedrookの主仕様は、ユーザーが指定した以下の版に固定する。

- TerraFirmaCraft Java Edition 1.20.1
- TerraFirmaCraft 3.2.26
- 公式Gitタグ：v3.2.26
- 公式リポジトリ：TerraFirmaCraft/TerraFirmaCraft

GitHub Releaseは2026-09-28公開。Field Guide 1.20.1と同じ系統の仕様基準として扱う。

## 2. その後の公式更新

2026-11-27時点で、同じ1.20.1系列の最新Releaseは3.2.30（2026-11-08公開）。

| バージョン | 公開日 | 公式リリースノートの主な変更 |
|---|---|---|
| 3.2.26 | 2026-09-28 | バケツ/水没ブロック、Pot/Crucible同期、動物成長クラッシュ、Chisel関連クラッシュ、植物配置、ベリー説明、水中Mob関連の修正 |
| 3.2.27 | 2026-10-10 | 登攀作物のBedrock破壊、Squidスポーン警告、Cranberry/ベリー茂みの修正 |
| 3.2.28 | 2026-10-20 | 熊の遊泳、二段作物のBedrock破壊、農地温度表示、Squid、ベリー、Chunkデータ稀なクラッシュ、革加工、Loom同期の修正 |
| 3.2.29 | 2026-11-07 | Create等とのBlock Entityドロップ互換性、Patchouli、深海生物、海洋パフォーマンス、植物・Worldgen・Entityの小規模修正 |
| 3.2.30 | 2026-11-08 | 直前更新で導入されたLoot Table挙動の小規模Regression修正 |

**判断：** 仕様の正本は3.2.26に固定する。3.2.27～3.2.30は、必要に応じて「後発修正として取り込むか」を別途評価する。後発版の新しい挙動を3.2.26の仕様として混ぜない。

特に3.2.29には海洋パフォーマンス改善が含まれる。TFC-Bedrookの海洋・動物・植物・Create連携の参考にはなるが、仕様基準を無断で3.2.29へ更新する理由にはしない。

## 3. 公式ソースのライセンス

公式GitHubリポジトリはEUPL-1.2と表示されている。

TFC-Bedrookでは、Java版のコードやアセットをそのまま移植するのではなく、公式Field Guideと公式Documentationからゲームルールを抽出し、Bedrock向けに独自実装する。ソースコード・テクスチャ・モデル・音声・翻訳データをコピーする場合は、EUPL-1.2を含む各ライセンス条件と配布義務を別途確認する。

BioScape / TerraSphere等の第三者アドオンのライセンスは、TFC公式ソースのライセンスとは別に扱う。

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
