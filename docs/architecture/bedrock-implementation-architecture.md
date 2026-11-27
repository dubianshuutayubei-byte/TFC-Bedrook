# Bedrock実装アーキテクチャ（設計案）

更新日：2026-11-27

## 1. 設計目標

TFC-Bedrookは、Java版TFC 1.20.1-3.2.26の主要なゲームループをBedrock上で独立再現する。アイテム名やレシピを移すだけではなく、自然環境・採集・加工・進行・生活システムを一つのデータモデルで連動させる。

この文書は、公式TFC資料から抽出した機能をBedrockの実装単位へ割り当てる設計案である。Bedrockの個別APIの可否・引数・バージョンは実装時に公式リファレンスで再確認する。未検証のAPI名やコードを確定仕様として扱わない。

## 2. パック構成案

### Behavior Pack
- manifest：BP識別子、依存関係、最小エンジンバージョン、Script API依存
- blocks：TFC固有ブロック、加工設備、農地、地質ブロック
- items：工具、鉱石、金属、陶器、食品、素材
- entities：必要な家畜・野生動物の独自定義
- recipes：通常レシピと工程開始用レシピ
- loot_tables：採集・採掘・破壊結果
- features / feature_rules：地形補正、岩石露頭、鉱石、植物、樹木、野生作物
- biomes：気候・スポーン・表層構成
- scripts：ゲーム状態、UI、進行、季節、腐敗、温度、農業、設備制御
- texts：日本語ローカライズ、アイテム名、説明、UI文字列

### Resource Pack
- textures：ブロック・アイテム・UI
- models：必要なブロック・アイテムモデル
- render_controllers：必要な表示制御
- animations：必要な設備・動物のアニメーション
- sounds：独自効果音
- texts：日本語リソース文字列

### 依存の原則
- BPが必須のゲームロジックを所有する。
- RPは表示・音声・ローカライズを所有する。
- BPとRPはmanifest UUIDで明示的に依存関係を結ぶ。
- 既存の外部アドオンを必須依存にしない。
- CEID / Iパックとは独立してロードできる構成を保つ。

## 3. 中核データモデル

TFCの公式Custom Data Documentationが扱う概念を参考に、Bedrock側でも「アイテムごとの値」「環境条件」「加工条件」をレシピの羅列から分離する。

| データ領域 | 管理する情報 | 利用するシステム |
|---|---|---|
| Climate | 地域気温、現在気温、平均気温、降雨量、季節、標高帯 | 作物、植物、動物、雪氷 |
| Geology | 地質区、岩石層、岩石種、鉱脈、鉱石品位 | 採掘、露頭、鉱石生成、Prospecting |
| Metal | 金属種、溶融量、融点、加工可能温度、溶接温度、Tier | 溶解、鋳造、鍛冶、合金、装備 |
| Heat | 現在温度、熱容量、熱源、燃料温度、燃焼時間 | Pit Kiln、Forge、Crucible、Blast Furnace |
| ItemProfile | Size、Weight、スタック上限、保管可否 | 容器、Pit Kiln、インベントリ負荷 |
| Food | 腐敗値、腐敗速度、空腹、水分、栄養素 | 食事、保存、調理、農業 |
| Crop | 作物種、成長段階、温度帯、水分、N/P/K要求 | 野生作物、農地、収穫 |
| Fauna | 種、性別、年齢、親密度、繁殖・産出状態 | 畜産、野生動物 |
| Processing | 工程ID、入力、出力、時間、温度、設備条件 | 全加工設備 |

これはBedrock用の内部データ設計案であり、Java版TFCのJSONファイルをそのまま読み込めるという意味ではない。

## 4. システム別の実装責務

### 4.1 ワールド・地形・地質

データ：
- 大陸/海洋の領域
- 標高帯と山岳・丘陵・低地の地形区分
- 河川・湖・海岸・海溝・火山のマスク
- 岩石地質区と上下の岩石層
- バイオームと気候

実装候補：
- Biome / Surface Builder：気候帯、表層・地下表面の岩石・土壌
- Feature / Feature Rule：地形補正、露頭、鉱脈、植生、野生作物
- Script：生成後に必要な地域情報の参照、ゲームプレイ側の気候計算

重要な境界：
- Scriptを使って全チャンクの地形を常時書き換える設計は避ける。
- 地形生成の静的Featureと、プレイ中に更新される環境システムを分離する。
- 地形の完全な基礎生成差し替えはBedrock公式資料からサポートを確認できていないため、最上位リスクとして扱う。

### 4.2 採集・ナッピング・陶器

必要な体験：
- 地面の棒・小枝・石の採集
- 石・粘土・革などのナッピング
- ナッピングパターンを選択して形状を作るUI
- 粘土の未焼成品と焼成後の陶器の区別
- Pit Kilnでの焼成

実装候補：
- Script UI：ナッピング操作画面
- Item / Block：素材・未焼成品・焼成済み品
- Block state / Script state：焼成進行と状態表示
- Script tickを必要最小限にし、全プレイヤー・全ブロックの毎tick走査を避ける

### 4.3 熱・燃料・金属

共通熱モデル：
- アイテム温度
- アイテム熱容量
- 熱源温度
- 燃料温度と燃焼時間
- 熱の伝達・冷却
- Can Work / Can Weldなどの状態判定

設備：
- Pit Kiln：初期焼成、初期鉱石溶解
- Charcoal Pit：Log Pileを密閉して木炭化
- Charcoal Forge：アイテム加熱、金属溶解、Crucible加熱
- Crucible：9入力スロット相当の合金管理、溶融金属の排出
- Blast Furnace：多層煙突、鉱石・Flux・Charcoal、Tuyere、Bellows、Pig Iron生成

実装方針：
- 各設備ごとに独立した温度処理を作らず、共通Heat/Metalサービスを使う。
- 温度や溶融量は数値で保持し、表示用文字列はそこから生成する。
- 容器に入った溶融金属をアイテム化する場合は、種類・量・温度・固化状態を失わない設計にする。

### 4.4 合金・鍛冶・溶接

必要な体験：
- Small Vesselでの初期合金
- Crucibleでの精密合金
- 金属TierによるAnvil加工制限
- 加熱してCan Workになった素材を加工
- Anvil UIでPlan、Target、Action Ruleを処理
- Hammerの耐久消費
- Fluxを使った溶接
- 加工効率によるForging Bonus

実装方針：
- 合金レシピはパーセンテージ範囲として定義し、入力合計量から判定する。
- 鍛冶は固定クラフトレシピにせず、操作履歴と目標値を持つ工程UIにする。
- 鍛冶ルール・目標値・加工結果はアイテム種別ごとのデータで定義する。
- Tier判定を装備・工具の全レシピに共通適用する。

### 4.5 採掘・鉱脈・Prospecting

必要な体験：
- 地表小鉱石を地下鉱脈の手掛かりにする。
- 鉱石は岩石種・地質区に依存する。
- Prospector's Pickで周囲の鉱石を調査する。
- 調査結果は量の段階で返す。
- Sluice / Panningで鉱石・岩石・宝石を得る。

実装方針：
- 鉱脈は生成時に配置し、採掘時に周辺全ブロックを検索する処理は避ける。
- Prospecting結果は、鉱脈の事前定義データまたは限定範囲の調査で返す。
- 鉱石生成と岩石生成は同じGeologyデータを参照する。
- 採掘量・鉱石除去状態と調査結果の矛盾を防ぐ。

### 4.6 農業・植物・気候

必要な体験：
- 作物ごとの温度・水分・季節条件
- 土壌のNitrogen / Phosphorus / Potassium
- 肥料ごとの栄養追加量
- 成長段階・成熟・収穫量
- 野生作物の季節生成
- 果樹・ベリーの年間周期
- 降雨量・土壌水分の反映

実装方針：
- Crop定義とClimate定義を分離する。
- 作物の成長は常時毎tickではなく、間隔を空けて評価する。
- 農地ごとの水分・栄養値は、ブロックまたは周辺チャンク単位の状態として管理する。
- 同じClimateサービスを野生植物・動物スポーンにも利用する。

### 4.7 食品・水分・保存

必要な体験：
- 空腹・水分・栄養素（Grain / Fruit / Vegetables / Protein / Dairy）
- 食品ごとの腐敗速度
- 調理・塩漬け・酢漬け・密封容器による保存
- 容器内食品の保存状態
- 腐敗状態の表示と摂取制御

実装方針：
- 食品定義をデータ駆動にする。
- 腐敗時計は個別食品の状態を基準にし、ログイン時に一括計算できるようにする。
- オンライン中だけ経過する時間と、オフライン中も経過する時間の扱いはTFC実仕様を確認して決定する。
- 保存容器の内容物移動で腐敗データが消失しないようにする。

### 4.8 動物・畜産

必要な体験：
- 性別・年齢・親密度
- 成長、繁殖、妊娠、産卵、孵化
- 乳・羊毛・卵などの周期的産出
- 飼料と親密度の関係
- 気候・地形・水域に基づく野生動物

実装方針：
- 既存Mobを流用するか独自Entityを作るか、種別ごとに判断する。
- 個体状態はEntityに保存し、定期処理は近距離・必要時に限定する。
- 繁殖・成長・産出の時間処理を共通化する。
- 大量Mobがいる場合の負荷上限を設ける。

### 4.9 建築・収納・重量

必要な体験：
- Mud Bricks、Wattle and Daubなどの建築素材
- Item Sizeによる容器収納制限
- Weightによるスタック数制限
- Huge + Very HeavyによるOverburdening
- Pit Kilnや容器の収納容量制限

実装方針：
- ItemProfileを共通データにする。
- 収納UIを独自実装する場合、アイテム移動時にサイズ・重量制限を一箇所で判定する。
- 既存インベントリを直接改造できない部分は、専用容器UIなどで代替し、見た目だけの制限にしない。

## 5. セーブデータ設計

保存データは最低限、次の範囲を考慮する。
- ワールド全体：暦、季節、世界設定、生成seedに結びつく設定
- チャンク/地域：地質区、気候補助情報、生成済み鉱脈の参照情報
- ブロック設備：設備種、入力、出力、温度、進行時間、燃料
- 農地：水分、N/P/K、作物状態
- 食品：腐敗進行、保存処理、調理状態
- 動物個体：性別、年齢、親密度、繁殖・産出タイマー
- プレイヤー：水分、栄養状態、所持品の重量計算に必要な情報

保存方式は、利用可能なScript APIと各オブジェクトの永続化機能を公式資料で確認してから決定する。保存領域の上限、再起動・Realm/サーバー移行時の挙動、古いデータの更新方法を検証する。

## 6. 負荷設計

- 地形の大規模演算はワールド生成時に限定する。
- 毎tickの全ブロック走査をしない。
- 作物・腐敗・季節・家畜の時間処理は間隔実行または参照時の経過時間計算を優先する。
- UIは要求された時だけ構築する。
- 鉱脈・地質データを必要時に全ワールド検索しない。
- 複数人で同じ設備を操作した際の競合を防ぐ。
- Script APIイベントで状態を更新し、常時ポーリングを最小化する。
- パフォーマンスを「軽い」と断定する前に、Switch 2 / iPadで実測する。

## 7. テスト設計

### 静的検査
- JSON構文
- manifest UUID / dependency / version
- 参照先IDの存在
- アイテム・ブロック・レシピID重複
- Feature / Feature Rule参照整合
- ローカライズキーの欠落
- Script importとAPI型の整合
- データ定義の範囲・必須項目

### ゲーム内検証
- 新規ワールド生成
- 地形とチャンク境界
- 岩石層と鉱脈
- 初期石器進行
- 焼成・溶解・鋳造
- 合金・鍛冶・溶接
- 農業・季節・腐敗
- 動物繁殖・産出
- マルチプレイの設備共有
- セーブ/再起動後の状態保持
- 長時間プレイでの負荷

### 完了判定

各機能は「仕様抽出済み」「設計済み」「実装済み」「静的検査済み」「ゲーム内検証済み」を分けて記録する。静的検査だけで実機動作確認済みとはしない。

## 8. 根拠資料

### TFC公式
- [Field Guide 1.20.1](https://terrafirmacraft.github.io/Field-Guide/20/en_us/)
- [Anvils](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/anvils.html)
- [Prospecting](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/prospecting.html)
- [Charcoal Pit](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/charcoal_pit.html)
- [Charcoal Forge](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/charcoal_forge.html)
- [Crucible](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/crucible.html)
- [Bellows](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/bellows.html)
- [Blast Furnace](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/blast_furnace.html)
- [Sluices](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/sluices.html)
- [Flux](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/flux.html)
- [Chisel](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/chisel.html)
- [Custom Data Documentation](https://terrafirmacraft.github.io/Documentation/1.20.x/custom/)

### Bedrock公式
- [Minecraft Creator Documentation](https://learn.microsoft.com/en-us/minecraft/creator/)
- [Script API Changelog](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/changelog?view=minecraft-bedrock-stable)
- [World Generation Overview](https://learn.microsoft.com/en-us/minecraft/creator/documents/world-generation?view=minecraft-bedrock-stable)

## 9. 未確定事項

- BedrockのUIでナッピング・鍛冶・鋳造をどこまで操作感含めて再現できるか。
- アイテム固有の腐敗・温度・サイズ・重量情報をどの保存方式で安定保持するか。
- 独自バイオームとFeatureの組み合わせで、大陸スケールの地形をどこまで再構成できるか。
- Bedrockの通常インベントリにどの範囲まで制限を適用できるか。
- 全機能を有効にした場合のメモリ・CPU・セーブサイズ。
