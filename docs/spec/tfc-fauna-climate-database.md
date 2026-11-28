# TFC 3.2.26 Fauna 気候・生息条件データベース

更新日：2026-11-27  
取得元：公式 TerraFirmaCraft/TerraFirmaCraft、tag v3.2.26、tfc/fauna/*.json

## 1. 読み方

- Tmin / Tmax：最低・最高気温。片側が未指定ならJSON上の制限なし。
- Rain min / max：最低・最高降水量。片側が未指定ならJSON上の制限なし。
- Forest min / max：森林密度の下限・上限。edge / normalはTFCのForestType。
- Below sea：海面下の距離条件。
- Chance：出現chanceの指定がある場合のみ記載。
- Brightness：明るさ上限。
- fuzzy：気候判定を曖昧化する指定。
- 「—」はJSONに値が存在しないことを表し、0を意味しない。

これらはTFCの生息条件データであり、スポーン頻度・群れの大きさ・繁殖・行動AIの全仕様ではない。

## 2. 63 Fauna Profiles

| ID | Tmin °C | Tmax °C | Rain min | Rain max | Forest min | Forest max | Below sea | Other |
|---|---:|---:|---:|---:|---|---|---:|---|
| alpaca | -8 | 20 | 250 | — | — | — | — | |
| black_bear | 5 | 20 | 250 | — | edge | — | — | |
| bluegill | -10 | 26 | — | — | — | — | — | |
| boar | -5 | 25 | 130 | 400 | — | normal | — | |
| bongo | 15 | — | 230 | 500 | edge | — | — | |
| caribou | — | -9 | 110 | 500 | — | — | — | |
| chicken | 14 | — | 225 | — | edge | — | — | |
| cod | — | 18 | — | — | — | — | 5 | |
| cougar | -10 | 21 | 150 | — | — | — | — | |
| cow | -10 | 35 | 250 | — | — | — | — | |
| crappie | -10 | 26 | — | — | — | — | — | |
| crayfish | 5 | — | 125 | — | — | — | 2 | |
| crocodile | 15 | — | — | — | — | — | 0 | |
| deer | -12 | 16 | 160 | 500 | edge | — | — | |
| direwolf | — | -5 | 150 | 420 | — | normal | — | |
| dolphin | 10 | — | 200 | — | — | — | 6 | chance 10 |
| donkey | -15 | — | 130 | 400 | — | edge | — | |
| duck | -25 | 30 | 100 | — | — | edge | — | |
| fox | — | 25 | 130 | 400 | edge | — | — | |
| frog | -13 | — | 150 | — | — | — | — | |
| gazelle | 12 | — | 90 | 380 | — | edge | — | |
| goat | -12 | 25 | — | 300 | — | — | — | |
| grizzly_bear | -15 | 15 | 200 | — | edge | — | — | |
| grouse | -12 | 13 | 150 | 400 | — | — | — | |
| horse | -15 | — | 130 | 400 | — | edge | — | |
| horseshoe_crab | 10 | 21 | — | 400 | — | — | 1 | |
| hyena | 15 | — | 80 | 380 | — | normal | — | |
| isopod | — | 14 | — | — | — | — | 20 | |
| jellyfish | 18 | — | — | — | — | — | 3 | |
| lake_trout | — | 23 | 250 | — | — | — | — | |
| largemouth_bass | -14 | 20 | 100 | 400 | — | — | — | |
| lion | 16 | — | 50 | 300 | — | edge | — | |
| lobster | — | 21 | — | — | — | — | 1 | |
| manatee | 20 | — | 300 | — | — | — | 3 | chance 10 |
| moose | -15 | 10 | 150 | 300 | edge | — | — | |
| mule | -15 | — | 130 | 400 | — | edge | — | |
| musk_ox | -25 | 0 | 100 | — | — | — | — | |
| ocelot | 15 | 30 | 300 | 500 | edge | — | — | |
| octopoteuthis | — | — | — | — | — | — | 33 | max brightness 0 |
| orca | — | 19 | 100 | — | — | — | 6 | chance 10 |
| panda | 18 | 28 | 300 | 500 | normal | — | — | fuzzy true |
| panther | -10 | 21 | 150 | — | — | — | — | |
| peafowl | 14 | — | 190 | 500 | normal | — | — | |
| penguin | — | -14 | 75 | — | — | — | — | |
| pheasant | -5 | 17 | 100 | 300 | edge | — | — | |
| pig | -10 | 35 | 200 | — | edge | — | — | |
| polar_bear | — | -10 | 100 | — | — | — | — | |
| pufferfish | 10 | — | — | — | — | — | 3 | |
| quail | -15 | 10 | 200 | — | — | — | — | |
| rabbit | — | — | 15 | — | — | — | — | |
| rainbow_trout | — | 10 | 150 | — | — | — | — | |
| sabertooth | — | 0 | 250 | — | — | — | — | |
| salmon | -5 | — | — | — | — | — | — | |
| sheep | 0 | 35 | 70 | 300 | — | — | — | |
| smallmouth_bass | -14 | 20 | 100 | 400 | — | — | — | |
| squid | — | — | — | — | — | — | 15 | |
| tiger | 13 | — | 100 | — | edge | — | — | |
| tropical_fish | 18 | — | — | — | — | — | 3 | |
| turkey | 0 | 17 | 250 | 450 | — | normal | — | |
| turtle | 21 | — | 250 | — | — | — | — | |
| wildebeest | 13 | — | 90 | 380 | — | edge | — | |
| wolf | -12 | 17 | 150 | 420 | — | normal | — | |
| yak | — | -11 | 100 | — | — | — | — | |

## 3. 1.21.xの全78種スポーン配置監査

2026-11-28追記。`Faunas.java` と `aquatic/Fish.java` の登録経路を確認し、78種すべての配置タイプを別データとして記録した。

| 配置 | 種数 | Java側の登録経路 |
|---|---:|---|
| in_water | 29 | `FISH.values()` / `registerFish` を含む水生登録 |
| on_ground | 48 | `registerAnimal` |
| no_restrictions | 1 | `registerAmphibiousPredator`（crocodile） |

従来の気候JSON 63種に存在しない15種も、配置タイプだけはJava登録経路から確定できる。淡水魚9種（arctic_char, burbot, muksun, northern_pike, pacu, peacock_bass, red_piranha, spotted_gudgeon, tilapia）は `FISH.values()` 経由で `in_water`。陸上6種（armadillo, bactrian_camel, bison, dromedary_camel, leopard_seal, pond_turtle）は `registerAnimal` 経由で `on_ground`。

**注意：** この15種には気候JSONの裏付けがないため、気温・降水量・森林・深度などの制約は追加していない。配置タイプが判明したことは、自然スポーン条件全体やBedrock実装が完成したことを意味しない。

公式参照：
- `TerraFirmaCraft/src/main/java/net/dries007/tfc/common/entities/Faunas.java`（1.21.x）
- `TerraFirmaCraft/src/main/java/net/dries007/tfc/common/entities/aquatic/Fish.java`（1.21.x）

## 4. 設計上の重要点

1. 陸上動物は温度だけでなく、降水量と森林密度の条件を持つ個体が多い。
2. 水生動物はBelow sea levelを指定するものがあり、海面下の深さがスポーン条件の一部になる。
3. 海洋生物の中には明るさ条件もある（octopoteuthis：max_brightness 0）。
4. 熱帯性・寒冷性の動物が明確に分かれる。例：Lionはmin 16°C、Polar Bearはmax -10°C、Yakはmax -11°C。
5. 同じ動物群でも条件は別々。たとえばBlack BearとGrizzly Bearでは温度・森林条件が異なる。
6. これらは生息可能範囲であって、個体数を直接決めるものではない。Bedrock側ではBiome/Climate判定とスポーン密度・群れ生成を分離する。
7. Fauna profileにない行動・繁殖・家畜化・成長・ドロップは別のEntity / code / lootデータから抽出する必要がある。

## 5. Bedrock実装への変換

- Climate Serviceが温度・降水量・森林密度を返す。
- Fauna Profileは共通スキーマとして保持し、Entityごとに異なる条件だけを埋める。
- 水生生物は海面下深度・水ブロック・海水/淡水・Biome条件を別に評価する。
- chanceはスポーン試行の抽選値として意味を確認してから移植し、確率と決めつけない。
- fuzzyは元実装の判定方法を調べてから再現する。
- 家畜・野生動物・海洋生物のAIは生息条件と別モジュールにする。
- TFCの温度・降水スケールをBedrock側の気候計算へ正規化する。

## 6. 公式ソース

- [TFC v3.2.26 Fauna Profiles](https://github.com/TerraFirmaCraft/TerraFirmaCraft/tree/v3.2.26/src/main/resources/data/tfc/tfc/fauna)
- [TFC Field Guide - Animals](https://terrafirmacraft.github.io/Field-Guide/20/en_us/the_world/animals.html)
