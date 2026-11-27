# TFC-Bedrook 独自地形再構成方式の検討

更新日：2026-11-27

## 1. 結論

現時点で最も現実的な候補は、BedrockのFeature Ruleをfirst_passに登録し、Molangの2Dノイズと既存地形の高さクエリを使って、チャンク内の各XZ列を独自の目標地形へ近づける方式。

ただし、これを「Java TFCと同じ独自ワールドジェネレーター」とは呼べない。Bedrockの基礎地形生成を完全に差し替える手段は、確認したMicrosoft公式Creator資料では見つかっていない。

また、山を高くする処理と、地面を削って谷・海を作る処理は別問題。上方向への追加配置はTerraSphereで実例を確認できたが、既存の地表を安定して削る方法は未検証であり、ここが現時点の最大の技術的ブロッカー。

## 2. TFCが必要とする地形構造

公式TFC World Preset / Geology / Biome Documentationから、地形を次の層に分ける。

### 2.1 地形の大域構造
- 大陸と海洋。大陸は数km規模で、海洋で隔てられる。
- 大陸内部に山脈・丘陵・平原・低地・峡谷。
- 高地には山岳湖、海洋側には海溝や海洋山岳。
- 火山域は通常の山岳と区別する。

### 2.2 水系
- 海岸・海底・深海・海溝。
- 河川と山岳河川。
- 湖と高地湖。
- 川は地形の谷線と連続し、海へ接続する必要がある。

### 2.3 地質
TFCのWorld Presetは地域を次のLayer Typeに分類する。
- ocean_floor
- volcanic
- uplift
- land

それぞれ異なるRock Layerの連鎖を使う。地表岩石だけでなく、その下に続く層の組み合わせが重要。TFCでは地質地域は1kmを超える場合があり、足元に2～3層の岩石層が存在する。

## 3. Bedrock公式機能の能力と制約

### 3.1 minecraft:overworld_height

Microsoft公式リファレンスは、このコンポーネントについて「Caves & Cliffs以前のもの」「オーバーワールドの高さを変更せず、現在はマップアイテム描画にのみ影響する」と明記している。

noise_typeにmountains / lowlands / river等があるが、TFC-Bedrookの地形高さ制御に使えると考えてはいけない。

### 3.2 minecraft:surface_builder / subsurface_builder

- Surface Builderは地形生成で使うブロック材質と表面処理を指定する。
- Overworld Builderではtop / mid / foundation / sea_floor / sea_material等を設定する。
- Subsurface Builderは通常地表より下の高さ帯にSurface Builderを適用する。
- これらは地形の岩石・土壌層を再現するのに有用だが、任意の大陸・山脈形状を生成する高さフィールドではない。
- Subsurface Builderは既存Builderの地下処理が未最適化の場合があり、公式に予期しない結果への注意がある。

### 3.3 Feature / Feature Rule

- Featureはブロックや別Featureを配置できる。
- Feature RuleはBiome Filterとplacement_passで配置時期・対象Biomeを決める。
- 公式資料にfirst_pass、before_underground_pass、underground_pass、after_underground_pass、before_surface_pass、surface_pass、after_surface_pass等がある。
- したがって、Featureは表面装飾専用ではなく、first_passに差し込む設計も可能。
- ただし、Feature Ruleの同一パス内の実行順は保証されない。相互依存する複数ルールを作る場合は注意する。

### 3.4 Molang Query

- query.noiseはX/Z座標を入力してPerlin Noise Mapを返す。
- query.heightmapは指定XZ位置の地形高さを返す。
- query.above_top_solidは最上部の固体ブロックの直上の高さを返す。
- query.noiseのワールドseed依存性、同seedでの再現性、異なるseedでの差異は今回の資料だけでは確定できない。必ず実機で確認する。

## 4. TerraSphereで実証されているパターン

TerraSphere 1.4 default subpackのFeature Ruleはfirst_passを使う。

構造：
1. Feature RuleがBiome Tagで対象領域を選ぶ。
2. terrain Featureがチャンク内の16×16 fixed_gridを実行する。
3. 各XZ位置で複数スケールのq.noiseを評価する。
4. 地形用フィールドをMolang変数へ保存する。
5. query.heightmap / query.above_top_solidで既存地形を読む。
6. 目標標高との差を計算し、必要な場合だけ地形列Featureへ進む。
7. 表層・地下Featureがブロックを配置する。

重要な観察：
- TerraSphereのterrain_optional_column_selectorは、目標標高と既存地形の差が1以上の場合に山岳Featureへ進む。
- この分岐は、目標地形が既存地形より高い場合に列を追加する方式。
- 少なくとも今回確認したこの経路は、既存地形を下方向へ削る処理ではない。
- よってTerraSphereの方式をそのまま使うだけでは、陸地を海へ沈めたり、深い峡谷を掘り下げたりする要件を満たさない。

TFC-Bedrookは、数値や式を流用せず、この構成上の考え方だけを参考にする。

## 5. TFC-Bedrook向け独自計算モデル案

以下は独自実装のための設計案。実際のMolang式・Feature JSONとして検証済みではない。

### 5.1 ノイズ層

| フィールド | 役割 | スケールの方向性 |
|---|---|---|
| Continentalness | 大陸・海洋の大域区分 | 最も大きい |
| Mountain Belt | 山脈の帯状配置 | 大～中 |
| Elevation | 大陸内の標高帯 | 中 |
| Ridge | 山稜・尾根 | 中～小 |
| Valley | 谷・盆地 | 中～小 |
| River Distance | 河川中心線と河岸 | 小～中 |
| Volcanic Field | 火山域・カルデラ | 中 |
| Local Roughness | 崖・岩場・細かな起伏 | 小 |

### 5.2 目標標高

設計上は、まず大陸区分と標高帯を決め、その上に山脈・谷・河川・火山の局所変形を加える。

概念式：
- continent = 大域ノイズ
- elevation = continentから決まる基礎標高
- mountain = mountain belt × ridge
- valley = valley field × valley mask
- river = river distanceから求める河床・河岸
- volcanic = volcanic fieldから求める火山円錐・カルデラ
- target_height = elevation + mountain - valley - river_cut + volcanic_shape

数値係数は未設定。Bedrockの既存Y範囲、海面、使用可能なブロック配置パスを実測してから決める。

### 5.3 生成段階

1. first_passで各チャンクの地形フィールドを評価する。
2. 目標標高・既存地形高・水域条件を比較する。
3. 既存地形より高い列は、地質に応じたブロック列で補う。
4. 既存地形より低くする必要がある列は、Air置換またはCarver機能の利用可否を検証する。
5. 地形高が確定した後に、Surface Builder / Subsurface Builderまたは専用Featureで岩石層・土壌層を整える。
6. 地質区に応じて鉱脈・露頭を配置する。
7. 河川・湖・海岸・火山の水・溶岩状態を地形と整合させる。
8. 最後に気候・植生・野生作物・動物条件を結びつける。

## 6. 既存地形を削る候補と未解決点

### 候補A：single_block_featureでAirを配置
公式single_block_featureはplaces_blockを配置し、may_replaceを省略すると任意のブロックを置換可能と説明されている。

ただし、places_blockにminecraft:airを指定して既存地形を安定して削れるかは公式例で確認できていない。地形削除に使用可能と断定せず、実機テスト対象とする。

### 候補B：ore_featureでAirを配置
公式ore_featureは「鉱石以外の任意ブロックも配置できる」と説明し、replace_rulesで既存ブロックを置換する。Airがplaces_blockとして有効か、地形を連続して削る用途に適するかは未確認。

### 候補C：cave_carver_feature
公式リファレンスにはcave_carver_featureとunderwater_cave_carver_featureがあるが、どちらもpregeneration_passでのみ動作すると説明される。Feature Ruleでこのpassを指定できるかは、今回確認したFeature Ruleのpass一覧から確認できていない。通常のカスタム地形生成の中核に使えると仮定しない。

### 候補D：beards_and_shavers
公式リファレンスは、このFeature Typeを「バニラ内部用であり、カスタムMinecraftコンテンツでは機能せず、サポートされない」と明記している。使用しない。

## 7. 最小限の実機検証が必要な項目

この段階は静的資料だけでは決着しない。

1. first_passのFeature Ruleが26.60系で実際に呼び出されるか。
2. first_pass内でquery.heightmap / query.above_top_solidがどの地形状態を返すか。
3. query.noiseがseedごとに変化するか。同じseedで再現するか。
4. single_block_featureでAirを置き、石・土などを置換できるか。
5. ore_featureでAirを配置できるか。
6. Feature Ruleの複数チャンク境界で地形列が途切れないか。
7. 大量のXZ列・Y列を処理した場合の生成時間と負荷。
8. 海面・河川・地下空洞・既存洞窟との整合性。

## 8. 現在の判断

- Surface Builder / Subsurface Builderは地質層と表面材質に採用候補。
- first_pass Feature Rule + Molang noise + heightmapは地形再構成の主候補。
- Air置換による地形削除が確認できるまでは、完全な大陸・海洋・峡谷生成を実現できるとは判断しない。
- TFCの独自generator typeと同等の機能がBedrock標準アドオンで使えるとは主張しない。
- もしAir置換が不可能なら、ベース地形に依存した地形再構成という制約を受け入れるか、別のワールド生成手段を探す必要がある。

## 9. 公式参照元

- [Minecraft World Generation Overview](https://learn.microsoft.com/en-us/minecraft/creator/documents/world-generation?view=minecraft-bedrock-stable)
- [Feature Introduction](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/featuresreference/examples/featuresintroduction?view=minecraft-bedrock-stable)
- [Single Block Feature](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/featuresreference/examples/features/minecraftsingle_block_feature?view=minecraft-bedrock-stable)
- [Ore Feature](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/featuresreference/examples/features/minecraftore_feature?view=minecraft-bedrock-stable)
- [Cave Carver Feature](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/featuresreference/examples/features/minecraft_cave_carver_feature?view=minecraft-bedrock-stable)
- [Underwater Cave Carver Feature](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/featuresreference/examples/features/minecraft_underwater_cave_carver_feature?view=minecraft-bedrock-stable)
- [Beards and Shavers](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/featuresreference/examples/features/minecraft_beards_and_shavers?view=minecraft-bedrock-stable)
- [query.noise](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/molangreference/examples/molangconcepts/queryfunctions/query_noise?view=minecraft-bedrock-stable)
- [query.heightmap](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/molangreference/examples/molangconcepts/queryfunctions/query_heightmap?view=minecraft-bedrock-stable)
- [Surface Builder](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/biomesreference/examples/components/minecraftbiomes_surface_builder?view=minecraft-bedrock-stable)
- [Subsurface Builder](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/biomesreference/examples/components/minecraftbiomes_subsurface_builder?view=minecraft-bedrock-stable)
- [Overworld Height](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/biomesreference/examples/components/minecraftbiomes_overworld_height?view=minecraft-bedrock-stable)
