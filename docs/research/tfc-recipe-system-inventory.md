# TFC 3.2.26 レシピ体系インベントリ

更新日：2026-11-27  
取得元：公式 TerraFirmaCraft/TerraFirmaCraft、tag v3.2.26、data/tfc/recipes/

## 1. 概要

recipes直下には35項目（レシピ分類フォルダと単独JSON）が存在する。以下の24分類フォルダの直下だけで合計1,438エントリを確認した。これは各フォルダ直下のファイルとサブフォルダの合計であり、再帰的なJSON総数ではない。

## 2. 分類別エントリ数

| Recipe Category | Direct Entries |
|---|---:|
| alloy | 9 |
| anvil | 278 |
| barrel | 45 |
| blast_furnace | 1 |
| bloomery | 1 |
| casting | 111 |
| chisel | 3 |
| clay_knapping | 26 |
| collapse | 45 |
| crafting | 163 |
| fire_clay_knapping | 3 |
| glassworking | 60 |
| goat_horn_knapping | 8 |
| heating | 142 |
| landslide | 173 |
| leather_knapping | 6 |
| loom | 5 |
| pot | 98 |
| quern | 100 |
| rock_knapping | 44 |
| scraping | 7 |
| sewing | 22 |
| stonecutting | 1 |
| welding | 87 |
| **合計** | **1,438** |

## 3. 各分類の役割

- alloy：複数金属の合金配合。
- anvil：金属加工の工程・作業選択。TFC金属装備・道具・部品を含む。
- barrel：液体処理、浸漬、発酵、保存、皮革処理など。
- blast_furnace：高温製錬。
- bloomery：鉄Bloomの生成。
- casting：鋳型への溶融金属注入。
- chisel：石材のslab / smooth / stair加工。
- clay_knapping：粘土製の型・容器・道具の成形。
- collapse：地盤・岩石崩落の変換。
- crafting：通常クラフト。多数のサブカテゴリを含む。
- fire_clay_knapping：耐火粘土の成形。
- glassworking：ガラス加工・色付きガラス・瓶・レンズ等。
- goat_horn_knapping：角製の楽器・用途別アイテム。
- heating：食品調理、陶器焼成、金属加熱など。
- landslide：崩落・地表堆積物・鉱床露頭など。
- leather_knapping：革装備・馬具の成形。
- loom：布・紙などの織機処理。
- pot：鍋を使う料理、煮沸、ジャム、染料等。
- quern：穀物粉砕、鉱石粉砕、染料・粉末処理。
- rock_knapping：岩石分類ごとの石器成形。
- scraping：皮革・紙等の表面加工。
- sewing：縫製・バニラ側の装飾レシピを含む。
- stonecutting：岩石別の石材切断。
- welding：金属部材の溶接、Double Ingot / Double Sheet、装備部品。

## 4. TFC進行の設計上の意味

TFCの製作は、通常クラフトだけに集約できない。少なくとも以下の工程群を別システムとして扱う必要がある。

1. 採集・原料選別
2. Knapping（Rock / Clay / Fire Clay / Leather）
3. Heating / Fuel / Temperature
4. Alloying
5. Bloomery / Blast Furnace
6. Casting
7. Anvil Work
8. Welding
9. Barrel / Pot / Quern / Loom
10. Glassworking / Scraping / Sewing / Chisel
11. Landslide / Collapseなどの地形・地質イベント

これらは独立したレシピUIを持たせるだけでは不十分で、Item Heat / Item Size / Metal / Fuel / Food / Climateなどの共通データと連携する必要がある。

## 5. 重要な注意点

- Direct Entries数はJSON総数ではない。サブフォルダを含む分類は再帰的に数えていない。
- recipes直下の35項目には、単独JSONと分類フォルダが混在する。
- TFCの独自Recipe SerializerやJava側ロジックが必要なレシピがあり、Bedrock JSONへ機械的に変換できるとは限らない。
- Landslide / Collapseのように、通常の作業台レシピではない地形イベントも同じデータ階層に含まれる。
- Sewingにはバニラ系の装飾レシピもあるため、TFC独自進行として扱うレシピと区別する。
- 数値・材料・工程は各レシピJSONの中身を追加抽出して仕様化する必要がある。

## 6. 次の実装調査優先度

1. Anvil / Heating / Alloy / Casting / Welding：金属進行の中核。
2. Knapping / Bloomery / Blast Furnace：石器時代から鉄器時代への進行。
3. Barrel / Pot / Quern / Loom：生活・食品・保存・農業。
4. Glassworking：高度加工。
5. Landslide / Collapse：地質と地形の安全性・採掘体験。
6. Crafting / Sewing / Stonecutting / Chisel：補助加工。

## 7. 公式ソース

- [TFC v3.2.26 Recipes](https://github.com/TerraFirmaCraft/TerraFirmaCraft/tree/v3.2.26/src/main/resources/data/tfc/recipes)
- [Anvil Recipes](https://github.com/TerraFirmaCraft/TerraFirmaCraft/tree/v3.2.26/src/main/resources/data/tfc/recipes/anvil)
- [Heating Recipes](https://github.com/TerraFirmaCraft/TerraFirmaCraft/tree/v3.2.26/src/main/resources/data/tfc/recipes/heating)
- [Alloy Recipes](https://github.com/TerraFirmaCraft/TerraFirmaCraft/tree/v3.2.26/src/main/resources/data/tfc/recipes/alloy)
- [Casting Recipes](https://github.com/TerraFirmaCraft/TerraFirmaCraft/tree/v3.2.26/src/main/resources/data/tfc/recipes/casting)
- [Welding Recipes](https://github.com/TerraFirmaCraft/TerraFirmaCraft/tree/v3.2.26/src/main/resources/data/tfc/recipes/welding)
- [Barrel Recipes](https://github.com/TerraFirmaCraft/TerraFirmaCraft/tree/v3.2.26/src/main/resources/data/tfc/recipes/barrel)
