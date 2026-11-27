# Field Guide 全項目照合台帳（TFC 1.20.1）

更新日：2026-11-27  
基準：TerraFirmaCraft 1.20.1 / v3.2.26  
参照：公式 Field Guide 1.20.1 のカテゴリ一覧。ゲーム内ガイドにはWeb版に表示されないマルチブロック図や一部レシピがあるため、Web版だけで完全抽出済みとは判定しない。

## 1. 目的と判定ルール

この台帳は、TFC-Bedrookの仕様漏れを防ぐための照合表。カテゴリが存在することと、その機能が実装済みであることは区別する。

状態：
- **調査済み**：公式ガイドとデータソースを確認し、再現要件を記録した。
- **部分調査**：概念・一部データを確認したが、全レシピ・全条件の照合が残る。
- **未調査**：個別ページとソースデータの照合が必要。
- **実装対象外**：本プロジェクトの実装支援では扱わない項目。

この段階で、アドオン本体の機能が実装済みと判定できる項目はない。実装・静的検査・ゲーム内検証は別の工程として管理する。

## 2. The World（自然環境）

| 公式ガイド項目 | 日本語整理 | 現在の状態 | 既存資料 |
|---|---|---|---|
| Geology | 大陸・地形・岩石層・地質区 | 部分調査 | feature-mapping / terrain-reconstruction |
| Ores and Minerals | 鉱石・鉱物・鉱脈・品位 | 部分調査 | ore-vein-database |
| Calendar and Climate | 暦・季節・気温・降雨 | 部分調査 | feature-mapping / climate databases |
| Flora | 野生植物・樹木・植生 | 部分調査 | feature-mapping / climate databases |
| Wild Crops | 野生作物 | 部分調査 | crop-plant-climate-database |
| Wild Fruits | 野生果実・果樹・ベリー | 部分調査 | crop-plant-climate-database |
| Wild Animals | 野生動物・生息条件 | 部分調査 | fauna-climate-database |

## 3. Getting Started（初期進行）

| 公式ガイド項目 | 日本語整理 | 現在の状態 | 追加で確認する内容 |
|---|---|---|---|
| Introduction | 初期採集・生存導入 | 部分調査 | 採集対象、初期UI、導線 |
| Pits of Fire | 焚き火・初期熱源 | 部分調査 | 燃料、温度、燃焼時間、着火条件 |
| Pottery | 粘土成形・容器・型 | 部分調査 | 全ナッピング形状、容器容量、流体 |
| Pit Kilns | 穴窯・焼成 | 部分調査 | 配置条件、燃料、温度曲線、処理時間 |
| Ores, Metal, and Casting | 鉱石・溶解・鋳造 | 部分調査 | 小鉱石、鉱石処理、溶融量、鋳型 |
| Primitive Alloys | 初期合金 | 部分調査 | 全合金比率、許容範囲、容器条件 |
| Primitive Anvils | 初期金床 | 部分調査 | 作成条件、加工可能Tier |
| Building Materials | 初期建築素材 | 部分調査 | 土壁・乾燥素材・ブロック変種 |
| A Place to Sleep | 寝具・睡眠 | 未調査 | 寝具素材、睡眠制約、季節との関係 |
| Size and Weight | サイズ・重量・収納 | 部分調査 | 全Item Profile、収納制限、負荷 |
| Food and Water | 食料・水分・栄養 | 部分調査 | プレイヤー状態、摂取量、表示、回復 |

## 4. Advanced Mechanics（発展システム）

| 公式ガイド項目 | 日本語整理 | 現在の状態 | 追加で確認する内容 |
|---|---|---|---|
| Advanced Materials | 発展素材 | 部分調査 | 素材系統、Tier、用途 |
| Animal Husbandry | 畜産 | 部分調査 | 性別、年齢、親密度、繁殖、産出 |
| Anvils | 金床加工 | 部分調査 | 加工アクション、目標、Tier |
| Aqueducts | 水路・導水 | 未調査 | 流体接続、距離、流量 |
| Armor | 防具 | 未調査 | 素材・段階・保護特性 |
| Armor Trims | 防具装飾 | 未調査 | 素材、模様、適用条件 |
| Barrels | 樽 | 部分調査 | 液体・密封・浸漬・処理時間 |
| Bellows | ふいご | 部分調査 | 送風・熱源連携・多層設備 |
| Blast Furnace | 高炉 | 部分調査 | 多層構造、入力、温度、出力 |
| Bloomery | たたら炉系設備 | 部分調査 | 構造、装入、処理、生成物 |
| Bowls | ボウル・食器 | 未調査 | 容器用途、食事との連携 |
| Bread | パン | 部分調査 | 粉、発酵・焼成、食品データ |
| Charcoal Forge | 炭火鍛冶炉 | 部分調査 | 熱源、燃料、温度、入力 |
| Charcoal Pit | 炭焼き | 部分調査 | 原木配置、密閉、処理時間 |
| Chisel | 彫刻・ブロック加工 | 部分調査 | 加工対象、形状、耐久 |
| Composter | 堆肥化 | 部分調査 | 入力カテゴリ、進行、出力 |
| Crankshafts | クランクシャフト | 未調査 | 回転入力・機械連携 |
| Crops | 農作物 | 部分調査 | 全作物、気候、水分、N/P/K |
| Crucible | るつぼ | 部分調査 | 溶融容量、合金、排出 |
| Dairy Products | 乳製品 | 未調査 | 乳の採取、加工、保存 |
| Damage Types | ダメージ分類 | 実装対象外 | 本プロジェクトの実装支援対象外 |
| Preservation | 食品保存 | 部分調査 | 腐敗時計、密封、塩漬け、酢漬け |
| Dye | 染料 | 未調査 | 原料、色、染色可能対象 |
| Fertilizers | 肥料 | 部分調査 | 肥料別N/P/K値、土壌への反映 |
| Fire Clay | 耐火粘土 | 部分調査 | 入手条件、成形、焼成 |
| Fishing | 釣り | 未調査 | 水域・魚種・道具・時間 |
| Flux | 溶剤・融剤 | 部分調査 | 対応工程、消費条件 |
| Gems | 宝石 | 部分調査 | 生成、加工、用途 |
| Glassworking | ガラス加工 | 部分調査 | 原料、溶融、成形、冷却 |
| Glass Products | ガラス製品 | 未調査 | 製品群、用途、容器 |
| Firepit and Grill | 焚き火・焼き網 | 部分調査 | 調理時間、燃料、食品状態 |
| Heating | 加熱システム | 部分調査 | 熱容量、温度遷移、冷却 |
| Keeping Hydrated | 水分維持 | 部分調査 | 飲料、摂取量、環境影響 |
| Jarring | 瓶詰め・保存瓶 | 未調査 | 容器、密封、保存期間 |
| Lamps | ランプ | 未調査 | 燃料、明るさ、燃焼時間 |
| Leather Making | 革加工 | 未調査 | 皮処理、薬剤、工程 |
| Light Sources | 光源 | 未調査 | 光源種、燃料、状態 |
| Mechanical Power | 機械動力 | 未調査 | 回転・動力源・負荷 |
| Minecarts | トロッコ | 未調査 | レール、積載、搬送 |
| Panning | 砂金採り・パンニング | 部分調査 | 堆積物、確率、流れ条件 |
| Papermaking | 製紙 | 未調査 | 原料、パルプ、乾燥 |
| Pets | ペット | 未調査 | 飼育、命令、状態 |
| Firepit and Pot | 焚き火と鍋 | 部分調査 | レシピ、液体、温度、時間 |
| Powderkegs | 火薬樽 | 実装対象外 | 本プロジェクトの実装支援対象外 |
| Prospecting | 鉱脈探査 | 部分調査 | 探査範囲、結果段階、地質連動 |
| Pumps | ポンプ | 未調査 | 入出力、高低差、流量 |
| Quern | 石臼 | 部分調査 | 入力、出力、処理時間 |
| Salads | サラダ | 未調査 | 食品組み合わせ、栄養 |
| Sandwiches | サンドイッチ | 未調査 | 食材スロット、栄養、腐敗 |
| Scribing Table | 書見台・記録設備 | 未調査 | 設備用途、書物データ |
| Sewing Table | 裁縫台 | 未調査 | 布・糸・革製品の工程 |
| Sluices | 水門・選鉱樋 | 部分調査 | 流水条件、堆積物、抽選テーブル |
| Steel | 鋼の製造 | 部分調査 | 鉄から鋼への工程、品質 |
| Support Beams & Collapses | 支柱・崩落 | 部分調査 | 支持範囲、荷重、崩落条件 |
| Weaving | 織物 | 未調査 | 糸・織機・布パターン |
| Wooden Buckets | 木製バケツ | 未調査 | 流体容量、耐熱・使用条件 |

## 5. 対象外・安全境界

- 戦闘ダメージ分類および爆発物に関する実装支援は対象外とする。
- 本台帳は、自然環境・生存・加工・農業・畜産・建築・物流・生活システムを中心に再現する。
- 対象外項目を除いても、各項目のゲーム内挙動を完全に再現したと判定するには、個別仕様・実装・実機検証が必要。

## 6. 次の調査順序

1. 初期進行（Pits of Fire ～ Primitive Anvils）のレシピと操作仕様を確定。
2. Heat / Metal / Fluidの共通データモデルを確定。
3. 食品・水分・腐敗・保存を一体のシステムとして確定。
4. 植物・農地・土壌・気候の連動仕様を確定。
5. 畜産・野生動物の共通状態モデルを確定。
6. 水路・ポンプ・機械動力・トロッコなどの物流システムを確定。
7. 建築・重量・収納・支柱・崩落の整合性を確定。

## 7. 公式参照元

- [TFC Field Guide 1.20.1 - Index](https://terrafirmacraft.github.io/Field-Guide/20/en_us/)
- [The World](https://terrafirmacraft.github.io/Field-Guide/20/en_us/the_world/)
- [Getting Started](https://terrafirmacraft.github.io/Field-Guide/20/en_us/getting_started/)
- [Advanced Mechanics](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/)
- [TFC Documentation 1.20.x](https://terrafirmacraft.github.io/Documentation/1.20.x/)
- [Official source repository, v3.2.26](https://github.com/TerraFirmaCraft/TerraFirmaCraft/tree/v3.2.26)
