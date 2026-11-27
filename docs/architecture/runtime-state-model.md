# ランタイム状態・セーブデータ設計

更新日：2026-11-27  
対象：Minecraft Bedrock stable Script API 2.11.0系を候補とする設計。実機での26.60互換確認前に最終固定しない。

## 1. 設計原則

TFC-Bedrookは、長時間プレイで大量の状態を保持する。すべてを1つの巨大なJSON文字列へ詰め込まず、状態の所有者に応じて保存先を分離する。

1. ワールド全体の状態はWorld Dynamic Properties。
2. プレイヤー個人の状態はPlayer Dynamic Properties。
3. 個体ごとの畜産・野生動物状態はEntity Dynamic Properties。
4. 設備ごとの工程状態はBlock Entity Dynamic Properties。
5. 食品・素材など個々のアイテム状態はItemStack Dynamic Properties。
6. 表示用の名前・説明・数値は保存データから都度生成し、二重管理しない。

## 2. 保存先と責務

| 所有者 | 保存する情報 | 代表例 | 注意 |
|---|---|---|---|
| World | 世界共通の少量状態 | スキーマ版、暦の基準時刻、世界設定ID | 全地域の全データを1プロパティへ詰めない |
| Player | プレイヤーごとの状態 | 水分、栄養状態、表示設定 | プレイヤー離脱・再参加を考慮 |
| Entity | 生物個体の状態 | 年齢、性別、親密度、産出タイマー | Entityが無効・アンロード時の例外を考慮 |
| Block Entity | 設備単位の状態 | 工程ID、温度、燃料残量、処理進行 | Dynamic Propertiesは1ブロックエンティティあたり最大1KB |
| ItemStack | アイテム個体の状態 | 腐敗進行、熱、品質、加工状態 | コンテナから取得したItemStackはコピーとして扱い、編集後は元スロットへ書き戻す |

## 3. データモデル案

### 3.1 World State

保持候補：
- schemaVersion
- worldEpoch / calendarEpoch
- worldProfileId
- featureConfigurationVersion

ワールドの季節・日付は、毎tickカウンターを増やす方式ではなく、基準時刻と現在時刻の差から導出する。ワールド時間を止める設定がある場合は、最後に保存した基準時刻を明示的に更新する。

### 3.2 Player State

保持候補：
- hydration
- nutrition.grain
- nutrition.fruit
- nutrition.vegetables
- nutrition.protein
- nutrition.dairy
- lastNeedsUpdate
- dataVersion

値は許容範囲へクランプし、欠損・NaN・異常に大きい数値を読み込んだ場合は安全な初期値へ戻す。表示UIと内部値は分離する。

### 3.3 Entity State

保持候補：
- speciesProfileId
- sex
- ageTicks
- familiarity
- pregnancyState / eggState
- productionCooldown
- lastUpdateTime
- dataVersion

Entity Dynamic Propertiesは値を読み書きできるが、Entityが無効になった後のアクセスは例外になり得る。取得したEntity参照を長期間保持せず、イベント時または処理時に再取得・有効性確認を行う。

### 3.4 Block Entity State

保持候補：
- machineProfileId
- processId
- processProgress
- temperature
- fuelEnergy
- input/output state reference
- dataVersion

ブロックエンティティのDynamic Propertiesには1KBの上限があるため、アイテム一覧や大きなレシピ表を直接保存しない。工程状態は短いIDと数値中心にし、定義データはBP内の静的JSONへ分離する。

また、ブロックエンティティのDynamic Propertiesは、そのブロックをアイテム化した際に自動で引き継がれない仕様がある。設備を回収可能にする場合、必要な状態を明示的にアイテムへ移す設計か、回収時に中身を安全に排出する設計が必要。

### 3.5 ItemStack State

保持候補：
- decayRemaining / decayUpdatedAt
- temperature
- quality
- processingStage
- sealedState

ItemStackはDynamic Propertiesを持てる。コンテナのgetItemで得たItemStackを編集した場合、その編集は自動で元スロットへ反映されない。編集後にcontainer.setItem(slot, stack)で書き戻す。

アイテム状態のキー名はアドオン側で固定管理する。全キーを列挙できる前提にはせず、必要なキーを既知の一覧として扱う。スタック可能なアイテムに個体差が生まれる場合は、スタック分割・統合時の状態引き継ぎルールを必ず定義する。

## 4. 時間処理・負荷対策

### 4.1 原則

- 全プレイヤー・全Entity・全ブロックを毎tick走査しない。
- プレイヤー操作・ブロック操作・Entityイベントを起点に状態を更新する。
- 時間経過だけで変化する状態は、前回更新時刻との差分で計算する。
- 近距離・ロード中の対象だけを定期処理する。
- 大量の初期化や移行処理は、小さな単位へ分割して実行する。

### 4.2 スケジューリング

system.runIntervalは指定tick間隔で繰り返し処理を実行できる。interval=0は毎tickと同じ扱いになるため、通常の生活システムに使わない。

候補：
- 軽い共通時計：低頻度の間隔実行
- プレイヤーNeeds：ログイン・摂取・時間経過の節目で更新
- 食品腐敗：アイテム操作時、コンテナ操作時、参照時に差分更新
- 農作物：作物成長の節目に限定
- 家畜：近距離かつロード中の個体を対象に低頻度更新
- 設備：入力・燃料・熱源の変化時に再計算し、進行中だけ低頻度更新

system.runJobはGeneratorを時間分割して進める用途に使える。初期データ移行や大規模な一回限りの処理に限定し、毎tickの全ワールド探索の代用にはしない。

## 5. データ移行・破損対策

- すべての保存データにdataVersionを持たせる。
- 新バージョン起動時は旧バージョンからの変換処理を明示する。
- 未知のdataVersionは破壊的に上書きせず、警告を記録して安全な既定値へフォールバックする。
- JSON文字列を保存する場合はサイズ上限を設け、巨大化したデータを分割する。
- 不正な数値・欠損キー・存在しないIDを検証する。
- 重要な設備データは、処理開始前と完了後に状態を整合させる。
- 同じイベントが重複発火しても二重消費・二重生成しないよう、処理IDや完了フラグを使う。

## 6. 実装時の必須テスト

1. ワールドを保存・終了・再起動してWorld Stateが保持される。
2. プレイヤー退出・再参加後にNeedsが保持される。
3. 動物をアンロード・再ロードして個体状態が保持される。
4. 設備を再起動後に工程が二重進行・巻き戻りしない。
5. アイテムをインベントリ・容器間で移動して腐敗・温度データが失われない。
6. アイテムを分割・統合して個体状態の扱いが仕様通りになる。
7. 設備を回収・再設置したときに内容物や工程状態が意図せず消失しない。
8. マルチプレイで同じ設備を複数人が操作しても入力が二重消費されない。
9. Dynamic Propertiesの容量を超えた場合にワールドや設備が破損しない。
10. 長時間放置後の差分計算が上限・下限を超えない。

## 7. 公式API参照

- [Entity Dynamic Properties](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entity?view=minecraft-bedrock-stable)
- [ItemStack Dynamic Properties](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/itemstack?view=minecraft-bedrock-stable)
- [Container API](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/container?view=minecraft-bedrock-stable)
- [Block Entity documentation](https://learn.microsoft.com/en-us/minecraft/creator/documents/blockentity?view=minecraft-bedrock-stable)
- [System API](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/system?view=minecraft-bedrock-stable)
- [Script API Changelog](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/changelog?view=minecraft-bedrock-stable)

## 8. 未確定事項

- 26.60系のSwitch 2 / iPadOSで2.11.0が利用可能か。
- World / Player / Entity / ItemStack Dynamic Propertiesの実際の保存容量・性能上限。
- 26.60系におけるBlock Entity Dynamic Propertiesの有効化条件と安定性。
- ItemStackの状態が全てのインベントリ操作・死亡・ドロップ・チェスト移動で保持されるか。
- 同じ設備を複数プレイヤーが同時操作した場合の排他制御方法。
