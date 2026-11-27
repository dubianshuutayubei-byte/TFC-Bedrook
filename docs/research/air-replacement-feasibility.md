# 地形削り・Air置換の実現可能性調査

更新日：2026-11-27

## 結論

Microsoft Learnの現行Feature仕様では、`minecraft:single_block_feature` と `minecraft:ore_feature` は既存ブロックを置換できる設計になっている。ただし、公式の説明・例で「`minecraft:air` を配置ブロックとして使い、既存の石・土を削る」手順は確認できなかった。

したがって、地形を下方向へ削る方式は **未確定のまま** とする。仕様上ただちに不可能とは言えないが、実機で成功するまではTFCの海洋・峡谷・河川を成立させる基盤として採用しない。

## 1. 公式資料で確認できた事実

### 1.1 Single Block Feature

Microsoft Learnの `minecraft:single_block_feature` は、`places_block` に配置するブロックを指定し、`may_replace` に置換可能な既存ブロックの許可リストを指定する。両方のフィールドを省略した場合は、配置先を限定しない仕様と説明されている。

- 最低format_version：1.20.30
- `places_block`：単一ブロック、または重み付きブロック配列
- `may_replace`：置換可能なブロックIDの配列
- 公式例では、植物などを `minecraft:air` のみへ配置する用途が示されている。

重要な違い：公式例の `may_replace: ["minecraft:air"]` は「空気を置換する」指定ではなく、「空気の位置に植物を置く」指定である。これを地形削りの証拠として扱ってはならない。

### 1.2 Ore Feature

`minecraft:ore_feature` は鉱石以外の任意ブロックも配置できると説明されており、`replace_rules` ごとに `places_block` と `may_replace` を設定する。したがって、置換先ブロックの種類を変える機構自体は存在する。

ただし、公式例は鉱石や油ブロックなどを既存ブロックへ置くもの。Airを配置する例は確認できなかった。

### 1.3 Feature Rule

Feature Ruleの `placement_pass` には `first_pass` が存在する。Microsoft Learnは各パスの前後関係を保証する一方、同一パス内の実行順は保証しないと明記している。

このため、複数Feature Ruleで「先に地形を削り、次に盛り、最後に表層を整える」という厳密な順序を組む設計は危険。順番が必須の処理は、単一の `sequence_feature` 等で連結可能かを個別に検証する必要がある。

## 2. 現時点の判定

| 案 | 公式資料で確認できたこと | 判定 |
|---|---|---|
| single_block_featureでAirを配置 | 任意ブロックを配置できる説明はあるが、Air配置例なし | 未検証 |
| ore_featureでAirを配置 | 任意ブロックを配置できる説明はあるが、Air配置例なし | 未検証 |
| may_replaceで既存地形を置換 | 既存ブロックの置換許可リストがある | 仕様確認済み |
| first_passで地形Featureを実行 | placement_passとして公式に存在 | 仕様確認済み |
| 複数Ruleを同一パスで順序制御 | 同一パス内の順番は保証されない | 依存設計に使わない |

## 3. 実機検証が必要な最小ケース

本体へ採用する前に、以下の4ケースを独立に検証する。

1. single_block_featureの `places_block` に `minecraft:air` を指定し、`may_replace` を省略した場合、石・土をAirへ置換できるか。
2. 同じFeatureで `may_replace` を石・土のみに指定した場合、指定したブロックだけがAirへ置換されるか。
3. ore_featureの `places_block` に `minecraft:air` を指定し、replace_rulesで石・土を対象にした場合、連続した削りが成立するか。
4. first_pass内で上記Featureを使ったとき、query.heightmap / query.above_top_solidが参照する地形状態と実行順がどうなるか。

検証結果には、ゲームバージョン、端末、実験設定、Content Log、生成前後の座標とブロック状態を記録する。

## 4. TFC-Bedrookへの影響

- Air置換が成功しても、チャンク境界の連続性・水の再配置・洞窟との接続・生成負荷を別途検証する。
- Air置換が失敗した場合、Featureによる地形再構成は既存地形への盛り土・表層変更を中心とした方式へ限定される。
- その場合、Java TFCのような大陸・海洋・海溝・深い峡谷を同じ精度で再現できるとは言えない。別の地形生成経路が見つからなければ、この差は既知の再現制約として残す。
- 地形生成の実機検証が終わるまで、全ワールド生成仕様を固定しない。

## 5. 公式参照元

- [Single Block Feature - Microsoft Learn](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/featuresreference/examples/features/minecraft_single_block_feature?view=minecraft-bedrock-stable)
- [Ore Feature - Microsoft Learn](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/featuresreference/examples/features/minecraft_ore_feature?view=minecraft-bedrock-stable)
- [Feature Rules - Microsoft Learn](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/featuresreference/examples/featuresintroduction?view=minecraft-bedrock-stable)
- [World Generation Overview - Microsoft Learn](https://learn.microsoft.com/en-us/minecraft/creator/documents/world-generation?view=minecraft-bedrock-stable)
