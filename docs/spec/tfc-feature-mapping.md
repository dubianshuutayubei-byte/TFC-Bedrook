# TFC 1.20.1 機能マッピング（初期版）

更新日：2026-11-27

## この文書の位置づけ

TFC-Bedrookを「TFCらしい雰囲気のアドオン」ではなく、Java版TFC 1.20.1-3.2.26の主要な遊びの流れをBedrock上で独立再現するための機能台帳の初期版。

根拠は公式Field Guide 1.20.1と公式Documentation 1.20.x。ここに記載した内容は参照ページで確認できた要素を中心に整理している。Field Guide全ページの転記・完全な仕様抽出はまだ終わっていないため、これを最終機能一覧とは扱わない。

## 1. 自然環境・ワールド生成

### 1.1 大陸・地形

公式Geologyの説明では、TFC世界は数km規模の大陸と海洋に分かれ、大陸内に山脈・河川・各種環境が存在する。

公式Biome Documentationの分類：
- 低高度の大陸：plains / hills / lowlands / low_canyons
- 中高度の大陸：rolling_hills / badlands / plateau / canyons
- 高高度の大陸：mountains / old_mountains / oceanic_mountains / volcanic_mountains / volcanic_oceanic_mountains
- 海洋：ocean / ocean_reef / deep_ocean / deep_ocean_trench
- 補助地形：shore、各種 lake、各種 river

TFC-Bedrookの再現要件：
- 大陸と海洋のスケール差を明確にする。
- 低地・中高度・高山帯を地形として作り分ける。
- 川・湖・海岸・海溝を単なるバイオーム名だけでなく、標高と水域の形状に結びつける。
- 火山地形と通常の山岳地形を分ける。
- 構造物・村は追加しない。

### 1.2 地質・岩石層

公式Geologyでは、岩石地域は1kmを超える規模になり、通常は足元の地下に2～3種類の岩石層が存在する。鉱石は出現する岩石の種類に依存する。

岩石の分類：
- 堆積岩：Shale, Claystone, Limestone, Conglomerate, Dolomite, Chert, Chalk
- 変成岩：Quartzite, Slate, Phyllite, Schist, Gneiss, Marble
- 火山性火成岩（噴出岩）：Rhyolite, Basalt, Andesite, Dacite
- 深成岩：Granite, Diorite, Gabbro

公式World Preset Documentationで確認できる地質層タイプ：
- ocean_floor
- volcanic
- uplift
- land

地層は上層から次の層へ連鎖する。最下部のbottom層は、その下も岩石候補を繰り返す構造。

TFC-Bedrookの再現要件：
- 岩石地域は小さなランダムパッチではなく、広い地質区画として生成する。
- 表層岩と地下岩の対応関係を保持する。
- 海底・火山域・隆起域・通常大陸で異なる地層構造を使う。
- 岩石種と鉱石生成条件を連動させる。
- 露頭・岩脈・隆起による岩石露出を別の生成処理として扱う。

### 1.3 気候・季節

公式Field Guideの確認事項：
- 4季節：春（3～5月）、夏（6～8月）、秋（9～11月）、冬（12～2月）。
- 季節は気温と降水形態に影響する。
- 気温は主に地域・緯度（Z座標）に影響され、季節・日ごと・時間ごとの変化も受ける。
- 年間降雨量は0～500mm。
- 降雨量は植生、土壌、農業可能性に影響する。
- 気候画面には地域気候、地質区、平均年間気温などが表示される。

補足：公式DocumentationのBiome説明では、TFCはバイオームの通常temperature/downfallだけに依存せず、独自の気候処理を使うと説明されている。TFC-Bedrookでも、バイオームIDと気温・降雨量の値を同一視しない。

TFC-Bedrookの再現要件：
- 緯度・標高・季節・日内変化を分離して気温を算出する。
- 降雨量は地域スケールで持ち、季節変化と現在の降雨を別にする。
- 気温・降雨量を植生、作物、雪氷、動物出現条件へ共通入力する。
- 現在気温と平均年間気温を区別する。

## 2. 石器時代・初期進行

公式Field Guide Getting Startedの構成：
1. Introduction
2. Pits of Fire
3. Pottery
4. Pit Kilns
5. Ores, Metal, and Casting
6. Primitive Alloys
7. Primitive Anvils
8. Building Materials
9. A Place to Sleep
10. Size and Weight

確認できた初期要素：
- 地面に落ちた棒・小枝・石を採集する。
- 石を2個以上持ってナッピング画面を開き、不要なマスを削って工具形状を作る。
- 石器ヘッドを棒・小枝と組み合わせて工具にする。
- ナイフは植物から藁を得る用途などに使う。
- 斧、シャベル、鍬、ハンマー、ジャベリンなどに役割がある。
- 粘土はナッピングして器・型などを作り、焼成して陶器化する。
- 初期焼成にはPit Kilnを使う。
- 地表の小さな鉱石は金属源であると同時に、地下鉱脈の手掛かりになる。
- 初期金属は溶解・鋳造し、銅などから始める。
- 青銅系合金は小型容器内で構成金属の比率を満たして作る。
- Primitive Anvilは岩石ブロックをハンマーで加工して作り、低Tierの接合などに使う。

TFC-Bedrookの再現要件：
- 石器作成を通常クラフトレシピだけに置き換えない。
- ナッピングの操作UIとレシピパターンを実装する。
- 粘土成形、焼成、鋳造、合金化、鍛冶を別工程として扱う。
- 地表小鉱石と地下鉱脈を関連付ける。
- 技術進行は石器→銅→青銅→鉄系→鋼系へ段階化する。個別の全金属・全レシピはField Guideの追加調査で確定する。

## 3. 農業・植物

### 3.1 野生作物

- 栽培可能な作物は野生でも見つかる。
- 野生作物は小さな群生として生成され、収穫すると食料と種を得る。
- 野生作物は6～10月に成熟し、それ以外の季節は次の夏まで枯れた見た目になる。
- 野生作物の出現は平均気温と降雨量に基づく。
- 野生作物自体は栽培作物のようなHydration要求を持たない。

### 3.2 栽培作物

- 作物はFarmlandに植える。
- 作物ごとに温度・Hydration・好む栄養素がある。
- 栄養素はNitrogen / Phosphorous / Potassiumの3種類。
- 好む栄養素を消費すると成長速度と収穫量が増える。
- 栄養素の消費は周囲の別栄養素を少量補う。
- 一部の作物は水没状態、支柱、複数ブロック高、周囲への実の生成などの固有条件を持つ。
- Hydrationは降雨由来の土壌水分と近くの水ブロックの影響を受ける。鍬を持って土壌や作物を見ると割合を確認できる。
- 肥料には堆肥、骨粉、硝石、グアノ、木灰、Sylvite Powderなどがあり、与える栄養素が異なる。

TFC-Bedrookの再現要件：
- 作物ごとの成長条件をデータ化する。
- Hydrationをブロック単位または農地単位で管理する。
- N/P/Kの3栄養素を独立管理する。
- 季節・気温・Hydration・栄養素を同時に判定する。
- 収穫量と種の回収を成長履歴に結びつける。

### 3.3 野生植物・果樹

公式Floraでは、植物は気候や季節により分布・見た目が変化する。植物の種類には標準型、乾燥地型、サボテン、這う植物、着生植物、短草・高草、水生植物、浮遊植物、海藻類などがある。

果樹・ベリー類は年間周期で成長・開花・結実・休眠し、適切な気候条件が必要。果樹と茂みではHydrationの扱いが異なる。

TFC-Bedrookの再現要件：
- 植物を単なるバイオーム装飾にせず、気候・季節・水域条件と連動させる。
- 果樹の成長段階と結実タイミングを実装する。
- 水生植物は淡水・海水の条件を分ける。

## 4. 食料・保存

公式Preservationページで確認できた要素：
- 食品は時間経過で腐敗する。
- 腐敗食品は通常の空腹回復をせず、不利な効果を起こす可能性がある。
- 食品ツールチップに腐敗までの残り時間・期限が表示される。
- 密封した大型容器や小型容器は内容物をPreserved状態にし、残存寿命を延ばす。
- 肉は生より調理済みの方が腐敗しにくい。
- 調理器具によって保存効果が異なる。
- 塩漬けは生肉に適用でき、後の調理後も塩漬け状態が残る。
- 酢漬けは酢・塩水・樽を用いる保存工程。

TFC-Bedrookの再現要件：
- 食品に腐敗データを持たせる。
- 保存状態は食品個別のデータと容器の状態を組み合わせて管理する。
- 調理・塩漬け・密封・酢漬けで腐敗速度を変える。
- 腐敗表示と腐敗後の挙動を実装する。

## 5. 動物・畜産

公式Animal Husbandryで確認できた要素：
- 家畜には性別・年齢・親密度がある。
- 家畜は幼体から成体へ成長し、繁殖・乳生産などが可能になる。
- 餌やりで親密度が上がり、餌を与えない期間が続くと親密度が低下する。
- 哺乳類は条件を満たすと妊娠・出産する。
- 羊毛動物は毛刈りでき、乳用動物は乳を生産する。
- 卵生動物は巣箱で産卵し、受精卵は孵化までの時間を持つ。
- 馬・ロバ・ラバなどのEquineは飼いならして騎乗できる。ロバ・ラバは荷物を運べる。

TFC-Bedrookの再現要件：
- 家畜の成長・親密度・性別・繁殖回数・産出周期を管理する。
- 乳・羊毛・卵・肉などの産物を個別化する。
- 野生動物の出現も気温・降雨量・地形に結びつける。
- 動物の常時AI負荷を抑えるため、必要な処理だけを間隔実行する設計を検討する。

## 6. Bedrock実装上の制約と方針

Microsoft LearnのWorld Generation Overviewでは、Bedrockの生成は概ね次のパスに分かれる。
1. First pass：谷・平原・山・海洋などの基礎地形
2. Biome pass：バイオーム・生態系・表面関連
3. Structure pass
4. Feature pass
5. Sky pass
6. Final pass

同資料は、地形生成パス自体のカスタマイズは限定的と説明している。高さ範囲の変更は地形を切り取るような影響があり、Behavior Packで範囲を指定すると新規生成が空洞になるケースがあるため、地形の高さ設定を安易に変更しない。

Bedrock 1.26.30以降で確認できるBiomeコンポーネント：
- minecraft:surface_builder：地表・海底・地下深部などの素材と表面処理を指定する。
- minecraft:subsurface_builder：通常の地表より下の高さ帯にSurface Builderを適用する。ただし既存Builderの処理は地下高さ帯に最適化されていない場合があり、予期しない結果の注意書きがある。

Molangではquery.noise、query.heightmap、query.above_top_solidが公式資料に記載されている。これらは地形のノイズ参照や既存地形の高さ取得に使えるが、基礎地形生成エンジンを完全に置き換えるものではない。

### 実装方針

- 地形はFeature / Feature Rule / Surface Builderの組み合わせを中心に検証する。
- Java TFCの地形生成を完全に置き換えられると仮定しない。
- 地形の見た目だけでなく、地質・気候・河川・海洋のデータ整合性を優先する。
- Script APIは、ワールド生成後の動的処理やUI・状態管理に使う。地形全体を常時スクリプトで再計算する構成は避ける。
- 対象バージョンはユーザーの現行26.60系を基準に、安定版APIを選ぶ。26.70 PreviewのAPIを本体依存にしない。

## 7. 公式参照元

### TerraFirmaCraft
- [Field Guide 1.20.1](https://terrafirmacraft.github.io/Field-Guide/20/en_us/)
- [Geology](https://terrafirmacraft.github.io/Field-Guide/20/en_us/the_world/geology.html)
- [Calendar and Climate](https://terrafirmacraft.github.io/Field-Guide/20/en_us/the_world/climate.html)
- [Flora](https://terrafirmacraft.github.io/Field-Guide/20/en_us/the_world/flora.html)
- [Wild Crops](https://terrafirmacraft.github.io/Field-Guide/20/en_us/the_world/wild_crops.html)
- [Crops](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/crops.html)
- [Keeping Hydrated](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/hydration.html)
- [Preservation](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/decay.html)
- [Animal Husbandry](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/animal_husbandry.html)
- [World Preset Documentation](https://terrafirmacraft.github.io/Documentation/1.20.x/worldgen/world-preset/)
- [Biome Documentation](https://terrafirmacraft.github.io/Documentation/1.20.x/worldgen/biomes/)

### Minecraft Bedrock
- [World Generation Overview](https://learn.microsoft.com/en-us/minecraft/creator/documents/world-generation?view=minecraft-bedrock-stable)
- [Surface Builder](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/biomesreference/examples/components/minecraftbiomes_surface_builder?view=minecraft-bedrock-stable)
- [Subsurface Builder](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/biomesreference/examples/components/minecraftbiomes_subsurface_builder?view=minecraft-bedrock-stable)
- [Molang Query Functions](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/molangreference/examples/molangconcepts/queryfunctions?view=minecraft-bedrock-stable)
- [Script API Changelog](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/changelog?view=minecraft-bedrock-stable)
- [26.60 Update Notes](https://learn.microsoft.com/en-us/minecraft/creator/documents/update1.26.60?view=minecraft-bedrock-stable)

## 8. 未完了項目

- Field Guideの全ページをカテゴリ別に読み、機能台帳を完全化する。
- 金属加工・鉱石・工具・装備・建材・食品加工の全レシピと進行条件を抽出する。
- 岩石・鉱脈・地形・気候の正確な生成パラメータをDocumentationとデータ定義から確認する。
- Bedrockで各機能をどのAPI・コンポーネントで実装するかを機能単位に確定する。
- 全システムの依存関係とセーブデータ設計を定義する。
- 静的テストと実機テストを分けた検証計画を作る。
