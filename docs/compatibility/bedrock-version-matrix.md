# Bedrock互換性・API基準（2026-11-27）

## 開発基準

- ユーザーの現行環境であるBedrock 26.60系を優先して検証する。
- 端末・プラットフォーム別のホットフィックスがあり得るため、バージョン番号だけで全端末の互換性を断定しない。
- Script APIは安定版を基本とし、Preview専用のBeta APIを本体の必須依存にしない。

## 2026-11-27時点の公式Script API掲載バージョン

Microsoft Learnの安定版changelogに掲載されているバージョン：
- @minecraft/server：2.11.0
- @minecraft/server-ui：2.3.0

同じchangelogにはPreview向けとして以下も掲載されているが、安定版の本体依存には採用しない：
- @minecraft/server：2.13.0-beta.1.26.70-preview.26
- @minecraft/server-ui：2.5.0-beta.1.26.70-preview.26

2.11.0 / 2.3.0がユーザーの全端末・26.60系の全ビルドで使えるかは、実機起動テストで最終確認する。APIの最新版掲載と、対象クライアントでの実行互換性は別問題である。

## World Generation API / JSON

| 機能 | 公式資料で確認した状態 | TFC-Bedrookでの用途 | 制約・注意 |
|---|---|---|---|
| minecraft:surface_builder | format version 1.26.30以上 | 表層・海底・地下深部の材質指定 | 基礎地形の高さそのものを任意生成する機能ではない |
| minecraft:subsurface_builder | format version 1.26.30以上 | 通常地表より下の高さ帯にSurface Builderを適用 | 既存Builderは地下高さ帯に未最適化の場合があり、公式に予期しない結果への注意あり |
| Feature / Feature Rule | BedrockのWorld Generation機能。placement_passにはfirst_pass等がある | 初期生成段階の地形再構成、露頭、鉱脈、植物など | 独自の地形密度場やgenerator typeを登録する機能とは異なる。配置順・既存地形との相互作用を実機確認する |
| query.noise | Molang query。X/Zの2引数でPerlin Noise Mapを参照 | 独自の連続地形フィールドの計算 | 基礎地形ジェネレーターの差し替えではない。seed依存性・再現性は未検証 |
| query.heightmap | Molang query | 既存地形の高さ取得 | 参照する地形は既に生成された地形 |
| query.above_top_solid | Molang query | 最上部の固体ブロックの上の高さ取得 | 既存地形の形状参照に使う |

## 重要な地形生成制約

Microsoft LearnのWorld Generation Overviewでは、Bedrockの生成は概ね次のパスに分かれる。
1. First pass：谷・平原・山・海洋などの基礎地形
2. Biome pass：バイオーム・生態系・表面関連
3. Structure pass
4. Feature pass
5. Sky pass
6. Final pass

同資料はTerrain pass自体のカスタマイズ範囲が限定的と説明している。高さ範囲の変更は地形を切り取るような影響を与える可能性があり、Behavior Packで範囲を指定した場合に新規エリアが空洞生成になるケースも記載されている。TFC-Bedrookではheight range変更を安易に採用しない。

重要：minecraft:overworld_heightはCaves & Cliffs以前のコンポーネントであり、Microsoft Learnの現行リファレンスは「オーバーワールドの高さを変更せず、現在はマップアイテム描画にのみ影響する」と明記している。noise_typeにmountains / lowlands等があっても、これを地形の高さ制御に使えると見なしてはならない。

TFC Java 1.20.xのWorld Preset Documentationは、独自generator type、独自biome source、continentalness、温度・降雨スケール、rock_layer_settingsなどを持つ。Bedrockアドオンに同等の独自ワールドジェネレーター登録手段があることは、今回参照した公式Creator資料から確認できていない。

したがってBedrock版の地形再現は、「TFC Javaのワールドジェネレーターを移植する」ではなく、「BedrockのBiome・Surface Builder・Feature/Feature Ruleを組み合わせ、可能な範囲でTFCに近い地形と地質を再構成する」方針にする。

## manifest設計方針

- min_engine_versionは採用機能が必要とする最小バージョンを確認してから設定する。
- @minecraft/server 2.11.0 / @minecraft/server-ui 2.3.0を候補基準とし、実際に使用するAPIとクライアント互換性を確認する。
- Preview専用のBeta APIを本体の必須依存にしない。
- format_versionはJSON種別ごとに検証する。全ファイルを一律に新しい値へ上げない。
- Beta APIが必要な場合は、任意機能として分離できるかを先に検討する。

## 検証が必要な事項

- 26.60系の各端末でFeature Rule / Surface Builder / Subsurface Builderの実際の挙動が一致するか。
- 生成パスごとの呼び出し順と、既存地形に対するFeatureの置換可能範囲。
- 地下Surface Builderで岩石層を何段まで安定して作れるか。
- query.noiseの再現性・座標スケール・チャンク境界での連続性。
- Feature大量配置時の生成時間・メモリ・端末負荷。
- iOS / iPadOS / Switch 2での挙動差。

## 公式参照元

- [World Generation Overview](https://learn.microsoft.com/en-us/minecraft/creator/documents/world-generation?view=minecraft-bedrock-stable)
- [Surface Builder](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/biomesreference/examples/components/minecraftbiomes_surface_builder?view=minecraft-bedrock-stable)
- [Subsurface Builder](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/biomesreference/examples/components/minecraftbiomes_subsurface_builder?view=minecraft-bedrock-stable)
- [Molang Query Functions](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/molangreference/examples/molangconcepts/queryfunctions?view=minecraft-bedrock-stable)
- [query.noise](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/molangreference/examples/molangconcepts/queryfunctions/query_noise?view=minecraft-bedrock-stable)
- [query.heightmap](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/molangreference/examples/molangconcepts/queryfunctions/query_heightmap?view=minecraft-bedrock-stable)
- [overworld_height](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/biomesreference/examples/components/minecraftbiomes_overworld_height?view=minecraft-bedrock-stable)
- [Script API Changelog](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/changelog?view=minecraft-bedrock-stable)
- [Script UI Changelog](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server-ui/changelog?view=minecraft-bedrock-stable)
- [26.60 Update Notes](https://learn.microsoft.com/en-us/minecraft/creator/documents/update1.26.60?view=minecraft-bedrock-stable)
- [TFC World Preset Documentation](https://terrafirmacraft.github.io/Documentation/1.20.x/worldgen/world-preset/)
