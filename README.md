# TFC-Bedrook

Minecraft Bedrock Edition 向けに TerraFirmaCraft（TFC）Java 1.20.1-3.2.26 の主要なゲーム体験を独立再現するプロジェクト。

## 開発方針

- 公式Field Guide / Documentationを仕様の基準にする。
- 日本語対応を前提とする。
- 大陸・海洋・山脈・谷・火山・河川・気候・地質を連動させる独自ワールド生成を目指す。
- 構造物・村は追加しない。
- 実験的機能・Beta APIは必要性と安定性を確認して使用する。
- CEID / Iパックとは現段階で統合しない。TFC-Bedrook単体で開発し、後で連携可能な構造を保つ。
- 外部アドオンのコード・アセットは、ライセンスと再利用許諾を確認せず流用しない。

## 設計・調査資料

- [地形生成リファレンス監査](docs/research/terrain-generation-reference-audit.md)
- [ユーザー提供カスタム高山バイオームJSON監査](docs/research/bedrock-custom-biome-snippet-review.md)
- [独自地形再構成方式の検討](docs/research/terrain-reconstruction-design.md)
- [地形削り・Air置換の実現可能性調査](docs/research/air-replacement-feasibility.md)
- [TFC機能マッピング](docs/spec/tfc-feature-mapping.md)
- [Field Guide全項目照合台帳](docs/research/field-guide-completion-matrix.md)
- [TFC追加システム仕様台帳](docs/spec/tfc-additional-systems.md)
- [TFC公式ソース・バージョン監査](docs/research/tfc-source-version-audit.md)
- [TFC公式データ資産インベントリ](docs/research/tfc-data-inventory.md)
- [TFC鉱脈生成データベース](docs/spec/tfc-ore-vein-database.md)
- [TFC作物・植物気候データベース](docs/spec/tfc-climate-crop-plant-database.md)
- [TFC動物気候・生息条件データベース](docs/spec/tfc-fauna-climate-database.md)
- [TFCレシピ体系インベントリ](docs/research/tfc-recipe-system-inventory.md)
- [TFC作物・果樹気候データベース](docs/spec/tfc-crop-plant-climate-database.md)
- [TFC金属・合金データベース](docs/spec/tfc-metal-alloy-database.md)
- [Bedrock互換性・API基準](docs/compatibility/bedrock-version-matrix.md)
- [Bedrock実装アーキテクチャ](docs/architecture/bedrock-implementation-architecture.md)
- [UI設計・初期実装](docs/architecture/ui-design.md)
- [2026-11-28 実装進捗（工程1〜8）](docs/implementation-progress-2026-11-28.md)
- [ランタイム状態・セーブデータ設計](docs/architecture/runtime-state-model.md)
- [気候サービス試作](docs/architecture/climate-service-prototype.md)
- [金属・合金サービス試作](docs/architecture/metal-service-prototype.md)
- [熱・燃料サービス試作](docs/architecture/heat-service-prototype.md)

## 検証環境

GitHub ActionsでJSON・manifestの静的検査、JavaScript構文検査、Node.js単体テストを実行する。気候計算、金属・合金判定、熱・燃料の基礎計算に関する純粋関数プロトタイプを追加済み。Behavior Packのmanifest・Script API起動点・初期UIは追加済み。Resource Pack、専用ガイドアイテム、ゲーム内各機能との接続は未完成。

- [静的検査ツール](tools/validate-pack.mjs)
- [プレイヤー状態サービス](packs/behavior_pack/scripts/core/player-state-service.mjs)
- [農業・土壌サービス](packs/behavior_pack/scripts/core/agriculture-service.mjs)
- [食品・腐敗サービス](packs/behavior_pack/scripts/core/food-service.mjs)
- [動物・畜産サービス](packs/behavior_pack/scripts/core/fauna-service.mjs)
- [加工工程サービス](packs/behavior_pack/scripts/core/processing-service.mjs)
- [地質サービス](packs/behavior_pack/scripts/core/geology-service.mjs)
- [地形プロファイル試作](packs/behavior_pack/scripts/core/terrain-profile-service.mjs)
- [内部アイテムIDカタログ](packs/behavior_pack/data/item-catalog.json)
- [加工工程レシピ試作](packs/behavior_pack/data/processing-recipes.json)
- [作物データ](packs/behavior_pack/data/crops.json)
- [動物データ](packs/behavior_pack/data/fauna.json)
- [地質プロファイル](packs/behavior_pack/data/geology-profiles.json)
- [地形プロファイル](packs/behavior_pack/data/terrain-profile.json)
- [気候計算モジュール](packs/behavior_pack/scripts/core/climate-service.mjs)
- [気候計算テスト](tests/climate-service.test.mjs)
- [金属データ](packs/behavior_pack/data/metals.json)
- [合金比率データ](packs/behavior_pack/data/alloys.json)
- [金属・合金計算モジュール](packs/behavior_pack/scripts/core/metal-service.mjs)
- [金属・合金テスト](tests/metal-service.test.mjs)
- [燃料データ](packs/behavior_pack/data/fuels.json)
- [アイテム熱プロファイル](packs/behavior_pack/data/item-heat-profiles.json)
- [熱・燃料計算モジュール](packs/behavior_pack/scripts/core/heat-service.mjs)
- [熱・燃料テスト](tests/heat-service.test.mjs)
- [GitHub Actions workflow](.github/workflows/static-validation.yml)

静的検査はゲーム内検証の代わりにはならない。地形生成・設備動作・セーブデータ・端末負荷はMinecraft実機で確認する。

## 公式参照元

- [TFC Field Guide 1.20.1](https://terrafirmacraft.github.io/Field-Guide/20/en_us/)
- [TFC Documentation 1.20.x](https://terrafirmacraft.github.io/Documentation/1.20.x/)
- [Minecraft Creator Documentation](https://learn.microsoft.com/en-us/minecraft/creator/)

## 現在の状態

調査・仕様整理に加え、気候、金属・合金、熱・燃料、プレイヤー状態、加工工程、農業・土壌、食品腐敗、動物・畜産、地質・地形プロファイルの基礎モジュールとNode単体テストを追加。Behavior Packのmanifest、プレイヤー参加時の状態初期化、`/scriptevent tfc:menu` で開く日本語UIを追加した。内部アイテムIDカタログと地形生成プロトタイプも追加済み。ただし、カタログはBedrock登録済みアイテムではなく、地形プロトタイプもMinecraftの地形生成へ未接続。完成アドオンやMinecraft実機検証済みビルドはまだ存在しない。
