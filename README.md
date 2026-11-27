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

## 検証環境

GitHub ActionsでJSON・manifestの静的検査とJavaScript構文検査を実行するための基盤を用意している。現段階ではパック本体のソースはまだ追加していない。

- [静的検査ツール](tools/validate-pack.mjs)
- [GitHub Actions workflow](.github/workflows/static-validation.yml)

静的検査はゲーム内検証の代わりにはならない。地形生成・設備動作・セーブデータ・端末負荷はMinecraft実機で確認する。

## 公式参照元

- [TFC Field Guide 1.20.1](https://terrafirmacraft.github.io/Field-Guide/20/en_us/)
- [TFC Documentation 1.20.x](https://terrafirmacraft.github.io/Documentation/1.20.x/)
- [Minecraft Creator Documentation](https://learn.microsoft.com/en-us/minecraft/creator/)

## 現在の状態

調査・仕様整理・検証基盤の準備段階。完成アドオンや実機検証済みビルドはまだ存在しない。
