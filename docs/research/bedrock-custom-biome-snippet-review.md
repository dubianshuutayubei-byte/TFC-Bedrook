# ユーザー提供カスタム高山バイオームJSONの技術監査

確認日: 2026-11-28  
対象: ユーザー提供の Behavior Pack manifest と `minecraft:biome` 定義  
目的: TFC-Bedrook の地形生成設計に利用できる要素と、現行Bedrockでの注意点を分離する。

## 結論

このサンプルは「カスタムバイオームの定義例」として参考になる。ただし、提示された内容をそのまま導入しても、高山地形の生成を保証しない。特に `minecraft:overworld_height` と `minecraft:overworld_generation_rules` は、現行公式資料でそれぞれ旧Caves & Cliffs以前のコンポーネントと説明され、カスタムバイオームでは未使用、または地形高を変更しないと明記されている。

## サンプルから利用できる設計要素

- `minecraft:climate`: 気温・降水・積雪のバイオーム環境値。
- `minecraft:surface_parameters`: 地表・地下・海底の基本ブロック指定。現行のSurface Builder仕様とのバージョン整合を別途確認する。
- `minecraft:tags`: バイオーム識別・フィルタリング用タグ。
- `minecraft:biome` の `description.identifier`: Feature Ruleや他のデータから参照する識別子。
- Behavior Pack manifest: BPとして読み込ませるための基本構造。

## 現行仕様との重要な差

### 1. `minecraft:overworld_height`

公式リファレンスでは pre-Caves and Cliffs component とされ、ワールドの地形高を変更せず、現在は地図アイテム表示にのみ影響すると説明されている。したがって `noise_params: [1.2, 0.6]` を「山を高くする設定」として採用してはいけない。

### 2. `minecraft:overworld_generation_rules`

公式リファレンスでは pre-Caves and Cliffs component で、custom biomes では unused とされている。`generate_for_climates` や `mutate_transformation` を書いても、現行のカスタムバイオーム配置方法として期待できない。

### 3. 現行の山岳関連コンポーネント

現行のBiome Definitionリファレンスには `minecraft:mountain_parameters` が存在し、Overworldの山岳地形生成に使うノイズ関連パラメータとして説明されている。急斜面用素材や方角別斜面、top_slide等の設定項目がある。ただし、このコンポーネント単体でTFCのような大陸・山脈・谷の配置制御を実現できるとは限らない。対象バージョンでの挙動検証が必要。

### 4. バイオームの配置

公式チュートリアルは、カスタムバイオームを追加するだけではワールドに現れず、ワールド生成に参加するコンポーネントが必要と説明している。現行リファレンスには `minecraft:replace_biomes` があり、1.21.110以降のカスタム部分置換が実験トグルなしで利用可能と説明されている。これは既存バイオームの一部を置き換える方式であり、新しい大陸地形をゼロから生成する機能と同一ではない。

## TFC-Bedrookへの採用方針

1. このサンプルのmanifest構造・バイオーム識別子・気候/地表定義の考え方を参考にする。
2. 旧式の `overworld_height` と `overworld_generation_rules` を、地形生成の中核ロジックには使用しない。
3. 山岳バイオームの地表・斜面設定は現行 `mountain_parameters` とSurface Builderの仕様を基準に別途構成する。
4. バイオーム配置は、既存地形置換・Feature/Feature Ruleによる地形再構成・その他の生成経路を分けて検証する。
5. ユーザーが後で提供する地形参考資料と照合してから、山脈・谷・崖・火山・河川の最終生成方式を決定する。

## サンプル内の注意点

- manifest内のUUIDは例示値であり、実プロジェクトのBP/RPと重複しない固有UUIDへ置き換える必要がある。
- manifestの `min_engine_version: [1, 21, 0]` は古い下限指定であり、TFC-Bedrookの対象バージョンと依存APIに合わせて決める。
- biome JSONの `format_version: "1.21.0"` は例示のまま固定せず、採用コンポーネントが要求する最小フォーマットに合わせる。
- `grass_block` などの地表素材はTFC独自ブロック導入後に置き換え候補を検討する。
- JSONが構文的に正しくても、ゲーム内生成・チャンク境界・端末負荷の正常性を保証しない。

## 公式資料

- [Custom Biome Tutorial](https://learn.microsoft.com/en-us/minecraft/creator/documents/biomes/custombiometutorial?view=minecraft-bedrock-stable)
- [Biome Definition Reference](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/biomesreference/examples/components/biome_definition?view=minecraft-bedrock-stable)
- [minecraft:overworld_height](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/biomesreference/examples/components/minecraftbiomes_overworld_height)
- [minecraft:overworld_generation_rules](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/biomesreference/examples/components/minecraftbiomes_overworld_generation_rules)

## 検証限界

これは公式スキーマ文書と提供JSONの照合結果であり、Bedrock 26.60の実機でのバイオーム配置・山岳形状・生成順を確認したものではない。今後、最小構成のテストワールドで確認する。
