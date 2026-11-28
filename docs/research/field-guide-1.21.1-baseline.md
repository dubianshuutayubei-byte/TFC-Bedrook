# TFC Field Guide 1.21.1 基準台帳

更新日：2026-11-29  
対象：TerraFirmaCraft Java 1.21.1-4.2.16  
公式参照：[Field Guide 1.21.1](https://terrafirmacraft.github.io/Field-Guide/en_us/) / [日本語版](https://terrafirmacraft.github.io/Field-Guide/ja_jp/)

## 1. 基準の固定

本プロジェクトの完成基準は、TFC Java 1.21.1-4.2.16とする。1.20.1-3.2.26のField Guide台帳・データは履歴資料として保持するが、1.21.1の仕様と混ぜて「公式最新版」と扱わない。

1.21.1公式Field Guideのトップカテゴリは次の7区分。

| 公式カテゴリ | 日本語整理 | 台帳状態 |
|---|---|---|
| Getting Started | はじめに・石器時代の生存導入 | 既存資料を再照合中 |
| Core Mechanics | コアシステム・プレイヤー状態 | 既存資料を再照合中 |
| The World | 地形・気候・地質・植物・動物 | 地形生成は最後、他は差分監査中 |
| Metalworking | 金属・合金・鋳造・鍛冶 | 既存の金属データを再照合中 |
| Food and Agriculture | 食品・栄養・農業・畜産 | 既存の農業/食品/動物実装を再照合中 |
| Crafting Systems | 各種加工設備・専用クラフト | 既存の加工工程を再照合中 |
| Miscellaneous | その他の生活・発展システム | 個別ページの再調査が必要 |

## 2. 旧台帳との関係

- `field-guide-completion-matrix.md` はTFC 1.20.1 / v3.2.26の旧版照合記録。
- `tfc-fauna-climate-database.md` の63種気候JSONも1.20.1 / v3.2.26由来。
- 1.21.1で追加・変更された動物、気候条件、レシピ、設備、AIは1.21.1ソースまたは1.21.1 Field Guideで再確認してから反映する。
- 旧版データが1.21.1でも同じだと確認できない場合、推測で上書きしない。
- 仕様の出典がField Guide、ServerConfig、Javaソース、データJSONのどれかを記録し、値の意味を混同しない。

## 3. 実装判定

| 判定 | 意味 |
|---|---|
| 未調査 | 1.21.1の該当ページ/ソースをまだ確認していない |
| 調査中 | 一部の情報を確認したが全条件・全レシピが未確定 |
| 仕様確定 | 1.21.1の一次資料に基づく要件を記録済み |
| コード実装 | Bedrockコードとデータ登録が存在 |
| 自動テスト済み | Node/CIで対象ロジックを検査 |
| 実機検証済み | Bedrock 26.60で操作・保存・再参加を確認 |

「仕様確定」「コード実装」「自動テスト済み」「実機検証済み」は別々に記録する。カテゴリやデータファイルが存在するだけで完成扱いにしない。

## 4. 直近の重点差分

1. 78種の公式動物ロスターを種別に再照合し、専用Entity/モデル/スポーン/AI/餌/ライフサイクルを分けて追跡する。
2. 1.21.1の動物気候・地下水・海洋深度・季節条件を、旧1.20.1 JSONと区別して確定する。
3. Field Guideに記載された操作・レシピと、Javaソース/ServerConfigの既定値を照合する。
4. UIとプレイヤー説明書を、Bedrookで実装済みの操作だけに合わせて更新する。
5. 全システムの差分を埋めた後、ユーザー提供地形資料を反映して地形生成を実装する。

## 5. 公式一次資料

- [TFC Field Guide 1.21.1 - English](https://terrafirmacraft.github.io/Field-Guide/en_us/)
- [TFC Field Guide 1.21.1 - Japanese](https://terrafirmacraft.github.io/Field-Guide/ja_jp/)
- [TFC 1.21.x API Documentation](https://terrafirmacraft.github.io/Documentation/1.21.x/)
- [TFC 1.21.x Source](https://github.com/TerraFirmaCraft/TerraFirmaCraft/tree/1.21.x)
- [TFC 1.21.1-4.2.16 Release](https://github.com/TerraFirmaCraft/TerraFirmaCraft/releases/tag/v4.2.16)

この文書は1.21.1基準を固定するための新台帳であり、Field Guide全ページの照合完了を意味しない。
