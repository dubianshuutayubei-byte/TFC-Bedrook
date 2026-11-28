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
- [ランタイム状態・セーブデータ設計](docs/architecture/runtime-state-model.md)
- [サバイバルHUD実装メモ](docs/architecture/survival-hud.md)
- [気候サービス試作](docs/architecture/climate-service-prototype.md)
- [気候プロファイルデータベース](docs/architecture/climate-profiles.md)
- [Thirstサービス試作](docs/architecture/thirst-service-prototype.md)
- [地質層サービス試作](docs/architecture/geology-service-prototype.md)
- [金属・合金サービス試作](docs/architecture/metal-service-prototype.md)
- [熱・燃料サービス試作](docs/architecture/heat-service-prototype.md)

## アドオン本体の現状

- Behavior Pack / Resource Packのmanifestと相互依存関係を追加済み。
- Behavior PackのJavaScriptエントリーポイントを追加済み。
- 日本語・英語の言語ファイルを追加済み。
- 暦システムをBedrockのワールド日数に接続済み（96日/年、4季節）。初回スポーン時に暦を表示し、Action Barへ年・季節・日付を約2秒ごとに表示。季節の切り替わりも通知する。
- TFC公式v3.2.26由来の作物23種・野生植物20種の気候閾値データを追加。地域気候・土壌水分の実測モデルは未実装。
- TFC公式v3.2.26の地質層グラフ（20岩石、4地域区分）と、決定論的な岩石層サンプラーを追加。地形配置・層厚・鉱脈生成への接続は未実装。
- 独自地形生成・地質の実際のブロック配置はまだ接続していない。
- `min_engine_version` はN-1方針で `[1, 26, 50]`、Script APIはBedrock 26.60で安定版となった `@minecraft/server` 2.11.0を指定。実機ロード確認は未実施。

## 検証環境

GitHub ActionsでJSON・manifestの静的検査、JavaScript構文検査、Node.js単体テストを実行し、開発用mcaddonを生成する。気候・暦、作物・野生植物の環境判定、地質層、Thirst、金属・合金、熱・燃料の純粋関数プロトタイプを追加済み。Behavior Pack / Resource Packのmanifestと暦のScript接続は実装済みだが、ゲーム内ロードと地形生成は未検証。

- [静的検査ツール](tools/validate-pack.mjs)
- [気候計算モジュール](packs/behavior_pack/scripts/core/climate-service.mjs)
- [気候計算テスト](tests/climate-service.test.mjs)
- [作物・植物気候プロファイル](packs/behavior_pack/data/climate-profiles.json)
- [作物・植物気候プロファイルテスト](tests/climate-profiles.test.mjs)
- [作物・野生植物環境判定サービス](packs/behavior_pack/scripts/core/crop-plant-service.mjs)
- [作物・野生植物環境判定テスト](tests/crop-plant-service.test.mjs)
- [Thirst計算モジュール](packs/behavior_pack/scripts/core/thirst-service.mjs)
- [Thirstテスト](tests/thirst-service.test.mjs)
- [HUD表示モジュール](packs/behavior_pack/scripts/ui/hud-service.mjs)
- [HUD表示テスト](tests/hud-service.test.mjs)
- [地質層データ](packs/behavior_pack/data/geology-layers.json)
- [地質層計算モジュール](packs/behavior_pack/scripts/core/geology-service.mjs)
- [地質層テスト](tests/geology-service.test.mjs)
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

Behavior Pack / Resource Packの開発用パッケージ生成、ワールド暦のScript接続、気候・地質データ処理まで進行。CIの最新実行は成功している。完成版ではなく、Minecraft 26.60実機でのロード・表示・ワールド生成検証が残っている。
