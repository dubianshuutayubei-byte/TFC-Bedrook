# TFC-Bedrook

Minecraft Bedrock Edition 向けに TerraFirmaCraft（TFC）のゲーム体験を独立再現するプロジェクト。

## 開発方針

- Java版 TerraFirmaCraft 1.20.1-3.2.26 を主な仕様参照元とする。
- Field Guide / Documentation の構成と進行を基準に、機能を体系的に整理する。
- 日本語対応を前提とする。
- 独自地形生成を重要課題として扱う。山脈・谷・火山・河川・海洋・気候・地質の整合を目指す。
- 構造物・村の追加は行わない。
- 実験的機能や Beta API は、必要性と安定性を検証したうえで使用可能とする。
- CEIDやIパックとは現段階で統合しない。TFC-Bedrook単体として設計・実装する。

## 品質方針

- 小さな見本だけを完成品として提示しない。全体仕様を整理してから統合実装する。
- JSON/manifest/Script APIの静的検査と、Minecraft実機での動作検証を区別する。
- ゲーム内検証をしていない機能を「動作確認済み」と表現しない。
- 外部アドオンのコード・アセットは、ライセンスと再利用許諾を確認せず流用しない。
- 既存作品の技術的な考え方を調査する場合も、必要に応じて独自実装に置き換える。

## 現在の調査記録

- [地形生成リファレンス監査](docs/research/terrain-generation-reference-audit.md)

## 参照元

- [TFC Field Guide 1.20](https://terrafirmacraft.github.io/Field-Guide/20/en_us/)
- [TFC Documentation 1.20.x](https://terrafirmacraft.github.io/Documentation/1.20.x/)
- [Minecraft Creator Documentation](https://learn.microsoft.com/en-us/minecraft/creator/)

## 現在の状態

調査・仕様整理段階。完成アドオンや実機検証済みビルドはまだ存在しない。
