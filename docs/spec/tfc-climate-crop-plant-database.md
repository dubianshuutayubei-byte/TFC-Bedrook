# TFC 3.2.26 作物・植物の気候データベース

更新日：2026-11-27  
取得元：公式 TerraFirmaCraft/TerraFirmaCraft、tag v3.2.26

## 1. 共通データ構造

Crop / Plant Climate Range JSONは、主に次の値を持つ。

- min_hydration / max_hydration：生育可能な水分範囲
- hydration_wiggle_range：水分範囲の揺らぎ
- min_temperature / max_temperature：生育可能な温度範囲
- temperature_wiggle_range：温度範囲の揺らぎ

このJSON値はJava TFCの定義値。Bedrock版では気温・降水・土壌水分の算出方法を独自に定義し、単位とスケールを合わせてから使用する。数値だけ移植しても同じ生育判定にはならない。

## 2. Crop Climate Range（23種）

| Crop ID | Min Hydration | Max Hydration | Hydration Wiggle | Min Temp °C | Max Temp °C | Temp Wiggle °C |
|---|---:|---:|---:|---:|---:|---:|
| barley | 18 | 75 | 0 | -8 | 26 | 5 |
| beet | 18 | 85 | 0 | -5 | 20 | 5 |
| cabbage | 15 | 65 | 0 | -10 | 27 | 5 |
| carrot | 25 | 100 | 0 | 3 | 30 | 5 |
| garlic | 15 | 75 | 0 | -20 | 18 | 5 |
| green_bean | 38 | 100 | 0 | 2 | 35 | 5 |
| jute | 25 | 100 | 0 | 5 | 37 | 5 |
| maize | 75 | 100 | 0 | 13 | 40 | 5 |
| melon | 75 | 100 | 0 | 5 | 37 | 5 |
| oat | 35 | 100 | 0 | 3 | 40 | 5 |
| onion | 25 | 90 | 0 | 0 | 30 | 5 |
| papyrus | 70 | 100 | 0 | 19 | 37 | 5 |
| potato | 50 | 100 | 0 | -1 | 37 | 5 |
| pumpkin | 30 | 80 | 0 | 0 | 30 | 5 |
| red_bell_pepper | 25 | 60 | 0 | 16 | 30 | 5 |
| rice | 25 | 100 | 0 | 15 | 30 | 5 |
| rye | 25 | 85 | 0 | -11 | 30 | 5 |
| soybean | 40 | 100 | 0 | 8 | 30 | 5 |
| squash | 23 | 95 | 0 | 5 | 33 | 5 |
| sugarcane | 40 | 100 | 0 | 12 | 38 | 5 |
| tomato | 30 | 95 | 0 | 0 | 36 | 5 |
| wheat | 25 | 100 | 0 | -4 | 35 | 5 |
| yellow_bell_pepper | 25 | 60 | 0 | 16 | 30 | 5 |

## 3. Plant Climate Range（20種）

| Plant ID | Min Hydration | Max Hydration | Hydration Wiggle | Min Temp °C | Max Temp °C | Temp Wiggle °C |
|---|---:|---:|---:|---:|---:|---:|
| banana_tree | 33 | 100 | 0 | 10 | 42 | 0 |
| blackberry_bush | 24 | 100 | 0 | 7 | 24 | 0 |
| blueberry_bush | 12 | 100 | 0 | 7 | 29 | 0 |
| bunchberry_bush | 24 | 100 | 0 | 15 | 35 | 0 |
| cherry_tree | 12 | 100 | 0 | -2 | 32 | 0 |
| cloudberry_bush | 9 | 100 | 0 | -2 | 17 | 0 |
| cranberry_bush | 30 | 100 | 0 | -5 | 17 | 0 |
| elderberry_bush | 12 | 100 | 0 | 10 | 33 | 0 |
| gooseberry_bush | 24 | 100 | 0 | 5 | 27 | 0 |
| green_apple_tree | 13 | 100 | 0 | -6 | 32 | 0 |
| lemon_tree | 21 | 100 | 0 | 3 | 37 | 0 |
| olive_tree | 18 | 100 | 0 | -2 | 37 | 0 |
| orange_tree | 30 | 100 | 0 | 8 | 43 | 0 |
| peach_tree | 7 | 100 | 0 | -3 | 34 | 0 |
| plum_tree | 30 | 100 | 0 | 8 | 38 | 0 |
| raspberry_bush | 24 | 100 | 0 | 5 | 25 | 0 |
| red_apple_tree | 12 | 100 | 0 | -6 | 32 | 0 |
| snowberry_bush | 24 | 100 | 0 | -7 | 18 | 0 |
| strawberry_bush | 12 | 100 | 0 | 5 | 28 | 0 |
| wintergreen_berry_bush | 12 | 100 | 0 | -6 | 17 | 0 |

## 4. 設計上の読み取り

### 4.1 作物と野生植物は同じ気候表を使わない
- 作物はhydrationとtemperatureの両方にwiggle rangeを持つ（この版の作物はtemperature wiggle 5）。
- 野生植物はこのデータ群ではwiggle rangeが0。
- したがって、同じ気候システムを共有しつつ、生育許容幅・季節変化の適用ルールを別にする。

### 4.2 気温の幅
- Garlicは最低-20°C、最大18°Cで寒冷側に強い。
- Papyrusは19～37°C、Red / Yellow Bell Pepperは16～30°Cと高温側に寄る。
- Banana Tree / Orange Treeは上限42～43°C。
- Cloudberry / Wintergreen Berry / Snowberryは低温側の植物。
- これは単なるバイオーム配置ではなく、気候計算を作物ごとの生育判定へつなぐ必要があることを示す。

### 4.3 水分の幅
- Maize / Melonはmin hydration 75で高水分を要求する。
- Garlicは15、Cloudberryは9と低い値から許容する。
- Plant側は20種すべてmax hydration 100。
- Hydration値の単位・算出方法はTFC内部実装に依存するため、Bedrock版の水分スケールは別途設計する。

## 5. Bedrock実装仕様への変換

1. Climate Serviceを作り、温度と水分の基準値を1か所で算出する。
2. Crop ProfileとPlant Profileを別々のデータ表にする。
3. 作物はtemperature wiggleを含む生育許容判定を行う。
4. 野生植物は個別の生育条件とBiome / 地質 / 標高の分布条件を組み合わせる。
5. 水分値は地表水・降水・土壌・季節のどれから算出するか定義する。
6. 生育条件外のとき、成長停止・成長低下・枯死のどれにするかは別途Field Guideと実装を照合する。
7. 収穫量・成長段階・種の入手方法は、Climate JSONだけでは決めない。Crop / Plantのブロック・loot・recipeデータも参照する。

## 6. 公式ソース

- [Crop Climate Ranges](https://github.com/TerraFirmaCraft/TerraFirmaCraft/tree/v3.2.26/src/main/resources/data/tfc/tfc/climate_ranges/crop)
- [Plant Climate Ranges](https://github.com/TerraFirmaCraft/TerraFirmaCraft/tree/v3.2.26/src/main/resources/data/tfc/tfc/climate_ranges/plant)
- [TFC Field Guide - Agriculture](https://terrafirmacraft.github.io/Field-Guide/20/en_us/the_world/agriculture.html)
