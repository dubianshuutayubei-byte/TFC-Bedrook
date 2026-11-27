# 地形生成リファレンス監査（2026-11-27）

## 目的

TFC-Bedrook の地形生成方式を決めるため、ユーザー提供の BioScape v3、TerraSphere 1.4、Terafermacraft Alpha 1.11.14 をアーカイブ内部まで調査した記録。

この文書は実装完了報告ではない。アーカイブから直接確認できた事実、そこからの技術的推論、未検証事項を分けて記録する。

## 結論

- TerraSphere 1.4 は、Bedrock の Feature / Feature Rule と Molang のノイズ計算を組み合わせて、既存地形を上書き・補正する地形再構成方式の参考になる。
- ただし、これは Java TFC の大陸スケール地形生成をそのまま実現できる証明ではない。ベース地形、生成パス、チャンク境界、Y座標、処理負荷などの制約が残る。
- BioScape のコード・アセットは CC BY-ND 4.0 と明記されている。改変物の配布を前提とする TFC-Bedrook には取り込まない。
- TerraSphere の独自部分について再利用許諾を確認できていない。コード・テクスチャ・モデル・JSONのコピーは行わず、技術パターンの分析に限定する。
- TFC-Bedrook は独自の地形計算・独自アセットで実装する。

## アーカイブ監査

### BioScape v3

確認したファイル：bioScape v3 2.mcaddon

- 外側の mcaddon には BP.mcpack と RP.mcpack が含まれる。
- 両パックは複数段の ZIP ラッパーを経て実データに到達する構造だった。
- 実データ側の BP は 796 エントリ、RP は 88 エントリ。
- BP manifest は BioScape Behavior Pack v2.3.0、RP manifest は Resource Pack v2.3.0。
- 両 manifest の min_engine_version は 1.26.50。
- BP/RP の双方に license.txt があり、CC BY-ND 4.0 と記載されている。
- BP側にはバイオーム定義などが含まれる。今回の監査では、大陸・山脈を独立して再構成する地形計算エンジンは確認できていない。

**採用判断：** バイオーム・植生の構成を観察する参考に限定。ファイル・コード・テクスチャの複製、改変、再配布はしない。

### TerraSphere 1.4

確認したファイル：TerraSphere_1.4.mcaddon

- BP manifest の min_engine_version は 1.26.0。
- BP は Script module を含み、@minecraft/server 2.4.0 に依存する。
- BP manifest には default / high / ultra の subpack が定義されている。
- ルートのバイオーム定義 JSON は 40 個。
- default subpack は features 806 個、feature_rules 51 個。
- high subpack は features 820 個、feature_rules 64 個。
- ultra subpack は features 950 個、feature_rules 90 個。
- 上記の数はアーカイブ内の JSON ファイル数であり、すべてが地形生成用という意味ではない。
- BioScape由来のバイオーム・樹木・Featureを含む旨のクレジットと、BioScape CC BY-ND 4.0 のライセンス文書が同梱されている。
- info.txt と JavaScript のウェルカムメッセージには Panda's Community への言及がある。作者・配布経路・再利用権限は別途確認が必要。
- default subpack の scripts/main.js は難読化されている。今回の設計では依存しない。

**注意：** TerraSphere 全体のライセンスが確認できたわけではない。BioScape部分のライセンスだけで TerraSphere の独自部分の権利を推定しない。

### Terafermacraft Alpha 1.11.14

確認したファイル：Terafermacraft_Alpha_1_11_14_StoneFurnace_NoVanillaBoats_GroundOre.mcaddon

- BP manifest は v1.11.14、RP manifest は v1.11.7。
- min_engine_version は両方とも 1.26.40。
- BP は @minecraft/server 2.9.0、@minecraft/server-ui 2.0.0 に依存し、script module と script_eval capability を含む。
- BP/RPの説明文は、複数コンテンツをまとめた Combined パックであることを示す。
- 内部 README の旧メタデータには別名・別バージョンの記載があり、現在の manifest と一致しない。
- 同梱の進捗メモには、Java TFCの鍛冶工程を完全再現したものではなく、既存レシピを独自のクラフトタグへ接続した段階である旨が書かれている。
- 進捗メモ自身が、アーカイブ/JSON検査とゲーム内動作検証を区別している。

**採用判断：** 機能の着想・Bedrock実装例を調べる参考資料。内部資産の出所・ライセンスを個別確認せずに移植しない。現状の大規模CombinedパックをTFC-Bedrookの土台にはしない。

## 追加の静的再確認

2026-11-27に提供アーカイブを再度直接集計し、Feature / Feature Rule数を修正した。JSONファイル数は以下の通り。

| Subpack | Feature JSON | Feature Rule JSON |
|---|---:|---:|
| default | 806 | 51 |
| high | 820 | 64 |
| ultra | 950 | 90 |

バイオーム定義はBP直下に40個。上記Feature数には植生・装飾・地形・その他のFeatureが含まれ、すべてが地形生成専用ではない。

default subpackの実JSONから、地形計算のより正確な構造も確認した。

- terrain.json は scatter_feature で terrain__per_chunk_math を呼ぶ。
- terrain__per_chunk_math は x/z の fixed_grid を step_size 16、extent 0～15で設定し、各チャンク内の16×16座標で terrain__per_block_math を呼ぶ。
- terrain__per_block_math の Molang は q.noise(x, z) の2引数形式を複数スケールで使い、v.worldx / v.worldzからriver、sand、path、death_hole、normal、mesa、main、pillar、wallなどの値を算出する。
- terrain.main.noise_val は確認したdefault JSONでは、概ね 140 ×（バイオームグループ別の地形係数）× clamp(q.noise(world座標を1500で縮尺した値)+0.5, 0, 1) + 30 の形。
- terrain_optional_column_selector は q.heightmap と q.above_top_solid を読み、目標値との差が1以上の場合にterrain_mountainへ進む分岐を選択する。
- terrain_mountain は terrain_mountain_surface_layer と terrain_mountain_below_surface_layer のaggregate_feature。
- 表層Featureは計算したbottomからtarget heightまでを1ブロック刻みでscatterし、surfaces Featureへ接続する。

これはJSONの静的読解結果であり、ゲーム内での実際の配置順やチャンク境界での結果を確認したものではない。式の係数・ノイズ値・変数名はTerraSphere固有の実装であり、TFC-Bedrookへコピーしない。

## TerraSphereで確認した地形生成パターン

確認対象は default subpack の以下のJSON。

- features/terrain.json
- features/terrain__per_chunk_math.json
- features/terrain__per_block_math.json
- features/terrain_optional_column_selector.json
- features/terrain_mountain.json
- features/terrain_mountain_surface_layer.json
- feature_rules/terrain__*.json

処理の概略：

1. Feature Rule が対象バイオームを選び、地形処理用 Feature を呼び出す。
2. terrain.json が terrain__per_chunk_math を呼ぶ。
3. terrain__per_chunk_math は16×16の固定グリッドで terrain__per_block_math を実行する。
4. terrain__per_block_math は q.noise() と v.worldx / v.worldz を用い、複数スケールのノイズ値を計算する。
5. 計算値には river / sand / path / death_hole / normal / mesa / main / pillar / wall などの地形フィールドがある。
6. terrain.main.noise_val はバイオームグループに応じた係数と大スケールノイズを組み合わせ、目標地形高に相当する値を作る。
7. terrain_optional_column_selector は q.heightmap と q.above_top_solid を参照し、既存地形と目標値の差を調べて処理対象を選ぶ。
8. terrain_mountain は表層と地下側の Feature を組み合わせ、地表・地下のブロック列を配置する。

この方式は、任意の地形密度場を直接生成する仕組みではなく、BedrockのFeature配置を使って既存地形を補正する方式として理解するのが安全。

## TFC-Bedrookに活かせる設計上の示唆

### 1. 大域地形と局所地形を分ける

独自の地形モデルは少なくとも次のスケールに分離する。

- 大陸・海洋：非常に低周波のノイズまたは領域分割
- 山脈・高原・盆地：中周波の地形場
- 谷・丘陵・崖：局所地形場
- 河川・湖沼：地形場とは別の水系マスク
- 表層地質・露頭：地形確定後の表層処理

これらは TFC の地形表現を実現するための独自設計案であり、TerraSphereの値や式をコピーするものではない。

### 2. 生成段階を分離する

候補となる段階：

- 地形領域の分類
- 目標標高の算出
- ベース地形との差分判定
- 地形の追加・削除・置換
- 地表ブロックの決定
- 地質層・露頭の配置
- 河川・湖沼・海岸の整合
- 気候・植生との整合

実際のFeature Ruleの配置パスや呼び出し順は、対象Bedrockバージョンで検証してから確定する。

### 3. チャンク境界を最優先で検査する

ノイズ計算がワールド座標に基づいていても、配置Featureがチャンク単位で呼び出される場合、隣接チャンク間で処理漏れ・重複・段差が起きる可能性がある。少なくとも次を検査する。

- チャンク境界の標高差
- 川の連続性
- 山脈の連続性
- 地表・地下層の欠損
- ワールド生成順による結果差
- 同じseedでの再現性

### 4. 負荷を設計段階から測る

16×16単位で各列の計算を行う方式は、計算回数と配置Feature数が増えやすい。TFC-Bedrookでは、生成時の一回限りの処理を優先し、常時実行スクリプトで地形を再計算する設計は避ける。実測なしに軽量とは断定しない。

## 未解決・次の調査項目

- 対象Bedrock安定版の最新バージョンと、Feature / Feature Rule / Molangの対応範囲を公式資料で確定する。
- TFC Java 1.20.1-3.2.26の地形・地質・気候の仕様をField Guide / Documentationから機能単位に抽出する。
- 海洋・大陸・山脈・河川・火山を、Bedrockでどの程度一体的に生成できるかを検証する。
- ベース地形依存を減らす方法、またはベース地形の影響を許容できる領域設計を比較する。
- 既存のTerafermacraft Alphaに含まれる各機能の出所・ライセンス・実装状態を個別に監査する。

## 検査範囲と限界

この監査は、提供されたアーカイブの構造、manifest、ライセンス文書、代表的なFeature JSON、Feature Rule JSON、スクリプト冒頭の静的確認に基づく。ゲーム内でのワールド生成、実機FPS/TPS、チャンク境界、全Featureの実動作は未検証。
