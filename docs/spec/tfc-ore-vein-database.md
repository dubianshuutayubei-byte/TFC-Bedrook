# TFC 3.2.26 鉱脈生成データ監査

更新日：2026-11-27  
取得元：公式TerraFirmaCraft/TerraFirmaCraft、tag v3.2.26  
対象：src/main/resources/data/tfc/worldgen/configured_feature/vein/

## 1. 重要事項

以下は公式ソースのJSONから抽出した値。rarity / density / sizeはTFC独自の生成アルゴリズムに渡すパラメータであり、Bedrock側で同じ数値をそのまま使って同じ出現率になるとは限らない。

- min_y / max_yはJava TFCのワールド座標条件。
- hostsは置換対象ブロックの岩石名をまとめたもの。
- 「全岩石」は、対象JSONがraw / gravel / hardenedの各岩石ブロックを複数含む場合の要約。
- kaolin_discは通常のhost rock置換ではなく、Biome Tagとindicator設定を持つ特殊なKaolin Disc Vein。
- Pipe Veinはsizeを持たず、別の構造パラメータで生成する。

## 2. 41個のVein定義

| ID | Type | Rarity | Density | Min Y | Max Y | Size | Host Rock / 条件 |
|---|---|---:|---:|---:|---:|---:|---|
| amethyst | disc | 25 | 0.20 | 40 | 60 | 8 | sedimentary + quartzite, slate, phyllite, schist, gneiss, marble |
| bituminous_coal | disc | 210 | 0.90 | -35 | -12 | 50 | shale, claystone, limestone, conglomerate, dolomite, chert, chalk |
| borax | disc | 40 | 0.20 | 40 | 100 | 23 | claystone, limestone, shale |
| cinnabar | cluster | 14 | 0.60 | -70 | 10 | 18 | quartzite, phyllite, gneiss, schist |
| cryolite | cluster | 16 | 0.70 | -70 | -10 | 18 | granite, diorite |
| diamond | pipe | 30 | 0.15 | -64 | 100 | — | gabbro |
| diorite_dike | pipe | 300 | 0.98 | -64 | 180 | — | all rock types; raw, gravel, hardened |
| emerald | pipe | 80 | 0.15 | -64 | 100 | — | granite, diorite, gabbro |
| fake_native_gold | cluster | 16 | 0.35 | -50 | 70 | 15 | rhyolite, basalt, andesite, dacite, granite, diorite, gabbro |
| gabbro_dike | pipe | 300 | 0.98 | -64 | 180 | — | all rock types; raw, gravel, hardened |
| gabbro_garnierite | cluster | 20 | 0.60 | -80 | 0 | 30 | gabbro |
| granite_dike | pipe | 300 | 0.98 | -64 | 180 | — | all rock types; raw, gravel, hardened |
| graphite | cluster | 20 | 0.40 | -30 | 60 | 20 | gneiss, marble, quartzite, schist |
| gravel | disc | 30 | 0.98 | -64 | 100 | 44 | all 20 rock types |
| gypsum | disc | 70 | 0.30 | 40 | 100 | 25 | shale, claystone, limestone, conglomerate, dolomite, chert, chalk |
| halite | disc | 110 | 0.85 | -45 | -12 | 35 | shale, claystone, limestone, conglomerate, dolomite, chert, chalk |
| kaolin_disc | kaolin_disc | 40 | 1.00 | 75 | 110 | 18 | Biome Tag tfc:kaolin_clay_spawns_in; height 6; blood_lily indicator |
| lapis_lazuli | cluster | 30 | 0.12 | -20 | 80 | 30 | limestone, marble |
| lignite | disc | 160 | 0.85 | -20 | -8 | 40 | shale, claystone, limestone, conglomerate, dolomite, chert, chalk |
| normal_bismuthinite | cluster | 45 | 0.60 | -80 | 20 | 40 | granite, diorite, gabbro |
| normal_garnierite | cluster | 25 | 0.30 | -80 | 0 | 18 | granite, diorite, gabbro |
| normal_malachite | cluster | 45 | 0.50 | -30 | 70 | 30 | marble, limestone, chalk, dolomite |
| normal_native_gold | cluster | 90 | 0.25 | 0 | 70 | 15 | rhyolite, basalt, andesite, dacite, granite, diorite, gabbro |
| normal_native_silver | cluster | 25 | 0.60 | -80 | 20 | 25 | granite, diorite, gneiss, schist |
| normal_sphalerite | cluster | 45 | 0.60 | -80 | 20 | 40 | granite, diorite, gabbro |
| normal_tetrahedrite | cluster | 40 | 0.50 | -30 | 70 | 30 | quartzite, slate, phyllite, schist, gneiss, marble |
| opal | disc | 25 | 0.20 | 40 | 60 | 8 | sedimentary + rhyolite, basalt, andesite, dacite |
| rich_native_gold | cluster | 50 | 0.50 | -80 | 20 | 40 | granite, diorite, gabbro |
| saltpeter | disc | 110 | 0.40 | 40 | 100 | 35 | shale, claystone, limestone, conglomerate, dolomite, chert, chalk |
| sulfur | disc | 4 | 0.25 | -64 | -45 | 18 | granite, diorite, gabbro, quartzite, slate, phyllite, schist, gneiss, marble |
| surface_bismuthinite | cluster | 32 | 0.30 | 40 | 130 | 20 | shale, claystone, limestone, conglomerate, dolomite, chert, chalk |
| surface_cassiterite | cluster | 5 | 0.40 | 80 | 180 | 15 | granite, diorite, gabbro |
| surface_hematite | cluster | 45 | 0.40 | 10 | 90 | 20 | rhyolite, basalt, andesite, dacite |
| surface_limonite | cluster | 90 | 0.40 | 10 | 90 | 20 | shale, claystone, limestone, conglomerate, dolomite, chert, chalk |
| surface_magnetite | cluster | 90 | 0.40 | 10 | 90 | 20 | shale, claystone, limestone, conglomerate, dolomite, chert, chalk |
| surface_malachite | cluster | 32 | 0.25 | 40 | 130 | 20 | marble, limestone, chalk, dolomite |
| surface_native_copper | cluster | 24 | 0.25 | 40 | 130 | 20 | rhyolite, basalt, andesite, dacite |
| surface_native_silver | cluster | 15 | 0.20 | 90 | 180 | 10 | granite, diorite |
| surface_sphalerite | cluster | 30 | 0.30 | 40 | 130 | 20 | rhyolite, basalt, andesite, dacite |
| surface_tetrahedrite | cluster | 7 | 0.25 | 90 | 170 | 20 | quartzite, slate, phyllite, schist, gneiss, marble |
| sylvite | disc | 60 | 0.35 | 40 | 100 | 35 | shale, claystone, chert |

## 3. 地質設計への重要な示唆

### 3.1 鉱石と母岩の結びつき
- Garnierite / Bismuthinite / Sphalerite / Rich-Normal Native Goldは深成岩系のGranite / Diorite / Gabbroを主な母岩にする。
- MalachiteはLimestone / Marble / Chalk / Dolomite系。
- HematiteはRhyolite / Basalt / Andesite / Dacite系。
- Limonite / Magnetite / Bituminous Coal / Lignite / Halite / Gypsum / Saltpeterなどは堆積岩系に結びつく。
- CinnabarはQuartzite / Phyllite / Gneiss / Schist。Field Guideの文章だけでなく、3.2.26の実データを優先する。

### 3.2 深度帯
- 地表寄りの鉱脈群はY 10～180の範囲に分布する。
- 深部寄りの鉱脈群はY -80～20などの範囲に分布する。
- Java TFCのY座標はBedrockの座標範囲と一致しない。Bedrock版では相対深度・標高帯へ変換する必要がある。

### 3.3 複数タイプの鉱脈
- Disc Vein：広がった層状の鉱床
- Cluster Vein：塊状の鉱脈
- Pipe Vein：パイプ状の鉱脈
- Kaolin Disc：Biome Tagと地表indicatorを持つ特殊な鉱床

Bedrockではこれらを単一のOre Featureに統一せず、生成形状・母岩置換・露頭・Prospectingとの関連を保つ。

## 4. Bedrock移植時の変換方針

- Rarityをそのまま確率に置き換えない。TFC側の抽選方式とBedrockのFeature Ruleの試行回数を別々に定義する。
- Densityをブロック配置確率として直接流用する前に、元のTFC実装の意味を確認する。
- Min/Max YはBedrockの地形標高と地下深度に合わせて正規化する。
- Host RockはRock Layerの生成結果を参照して選択する。鉱石生成側で母岩を独立にランダム化しない。
- Dikeは通常鉱脈と異なる形状なので、独立したFeature群として扱う。
- Surface indicatorと地下鉱脈の対応を維持する。
- 生成後に岩石層が変わった場合でも、鉱石の母岩種類が不整合にならないようにする。

## 5. 公式ソース

- [TFC v3.2.26 Vein Data](https://github.com/TerraFirmaCraft/TerraFirmaCraft/tree/v3.2.26/src/main/resources/data/tfc/worldgen/configured_feature/vein)
- [World Preset at v3.2.26](https://github.com/TerraFirmaCraft/TerraFirmaCraft/blob/v3.2.26/src/main/resources/data/tfc/worldgen/world_preset/overworld.json)
- [TFC Geology Field Guide](https://terrafirmacraft.github.io/Field-Guide/20/en_us/the_world/geology.html)
