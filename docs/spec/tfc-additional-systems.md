# TFC追加システム仕様台帳（公式Field Guide追加調査）

更新日：2026-11-27  
参照基準：TerraFirmaCraft Java 1.20.1-3.2.26 公式Field Guide

## 1. この文書の目的

既存のTFC機能マッピングで薄かった、鉱業・機械動力・革加工・水輸送・建築補助・釣り・食料加工・家畜の細部を補う。ここに記す挙動は公式Field Guideの記載に基づく。Bedrockでの再現方式は別途実装検証が必要。

## 2. 金属進行の追加詳細

### 2.1 鉄の二段階処理

公式Field Guideでは、鉄鉱石（Hematite / Limonite / Magnetite）や鉄を含むアイテムを溶かすとCast Ironになる。Cast IronをそのままWrought Ironとして扱わず、BloomeryでIron Bloomへ加工し、Anvilで段階的にWrought Ironへ仕上げる。

Bloomery：
- Bronze Double Sheets 8枚で作成するマルチブロック。
- 煙突の層ごとに投入容量が増え、最大48入力。
- Cast Iron 100mBとCharcoal 2個でBloom 1個を作る。
- 稼働時間は15時間。
- Raw Iron Bloomを採掘で取り出し、AnvilでRefined Iron Bloom、さらにWrought Iron Ingotへ加工する。

### 2.2 鋼

- Blast FurnaceでPig Ironを作る。
- Pig Ironを鋳造し、AnvilでHigh Carbon Steel、さらにSteelへ加工する。
- Black SteelはCrucibleでWeak Steelを作り、Pig Ironと溶接してHigh Carbon Black Steelにし、Anvilで加工する。
- Red Steel / Blue SteelもBlack Steelを含む中間合金から作る。
- Red SteelとBlue Steelは最高Tier。用途・耐久・ダメージ耐性が異なる。

### 2.3 Anvil Tier

| Tier | Anvil / 金属 |
|---|---|
| 0 | Stone Anvil |
| I | Copper |
| II | Bismuth Bronze / Black Bronze / Bronze |
| III | Wrought Iron |
| IV | Steel |
| V | Black Steel |
| VI | Red Steel / Blue Steel |

Anvilは自分のTierの金属を加工でき、1 Tier上の金属を溶接できる。鍛冶UIではPlan、Target、Action Rule、加工温度を扱う。効率よく加工するとForging Bonusが付く。

## 3. 採掘・鉱物調査

### 3.1 Prospector's Pick

- 地表の小鉱石は、水平15ブロック以内・垂直35ブロック以内に鉱石がある目印になり得る。
- Prospector's Pickは使用地点を中心とした25×25×25範囲を調査する。
- 結果はNothing / Traces / Small / Medium / Large / Very Large Sampleなどの段階。
- Very Large Sampleは少なくとも80ブロック相当の鉱石を示す。
- 高Tierの道具は誤検出（False Negative）を減らす。
- 鉱石が複数種ある場合、結果表示はそのうち一つのみ。

### 3.2 Panning / Sluicing

Panning：
- 粘土をナッピングしてPanを作り、焼成してCeramic Panにする。
- 川底・湖底などのOre Depositを探す。
- DepositをPanで採取し、水中でPan操作を続ける。
- Ore / Loose Rock / Gemを得る。

Sluice：
- SticksとLumberで作る2ブロック構造。
- 上から水が入り、下へ流れ出る必要がある。
- 水流の最後のブロックがSluiceへ入り、下に排水用の空間が必要。
- Depositを水流に投入すると処理され、時間経過で結果が排出される。
- Panningとは排出確率が異なる。

## 4. 機械動力

TFCにはCreateとは別の独自の回転動力システムがある。風力・水力を軸の回転に変え、設備へ伝える。

### 4.1 動力源
- Windmill：13×13×1の障害物のない空間が必要。最大5枚のWindmill Bladeを取り付け、枚数が多いほど回転が速い。
- Water Wheel：5×5×1の空間が必要。川の流れを利用し、設置高さ・水流方向・周辺の水の状態が回転速度に影響する。

### 4.2 伝達・制御
- Axle：回転動力を伝える。通常の軸は最大5ブロック連結。
- Encased Axle：軸を覆う。
- Gear Box：回転方向を変え、軸ネットワークを接続する。Hammerで面の入出力を設定。
- Clutch：Redstone信号で回転ネットワークを切断・接続する。

### 4.3 動力利用設備
- Quern：上から縦向きAxleを接続すると自動粉砕し、回転速度に応じて処理速度が変わる。
- Trip Hammer：Bladed Axleでハンマーを駆動し、Anvil加工を自動化する。常にLight Hit相当の動作を行い、温度やAnvil Tierが不足すると失敗する。

**TFC-Bedrookでの重要性：** この動力網はTFC独自の中核システムであり、CEIDのCreate動力とは別物として再現する。後のCEID連携時には、動力体系を混同せず、必要に応じて橋渡し層で変換する。

## 5. 水・樽・液体加工

### 5.1 Aqueducts
- BricksとMortarで作る。
- 水源または落下水に接続すると、水を水平に長距離輸送できる。
- Fresh Water / Salt Water / Hot Spring Waterを扱う。
- Aqueductを壊すと流れは止まり、永久的な水源ブロックは生成しない。

### 5.2 Barrels
- アイテムと液体の両方を保持する。
- Seal状態を切り替えられる。
- Sealは内容物を保持したまま運搬でき、一定時間の液体・アイテム反応レシピに使われる。
- 雨や上部の融けた氷柱から水を受け取る。
- 熱いアイテムを水・オリーブオイル・塩水で冷却できる。
- Vinegar / Brineなどの液体比率レシピ、染色、漂白、食品保存に使う。
- 横向きBarrelはTapを通じて下方へ液体を排出できる。

## 6. 革加工

Raw Hideは動物から得る。革にするまでの工程は単純クラフトではなく、段階処理。

必要素材：
- Limewater：FluxとWaterの溶液
- Water
- Tannin：特定樹皮から作る酸性溶液
- Raw Hide

公式ガイドで確認できる工程には、Soaking、Scraping、Preparing、Tanningがある。ScrapingはLog側面にHideを置き、Knifeで複数箇所を処理する。

革はArmor、Saddle、Bellowsなどに使用する。

## 7. 食品加工・農業補助

### 7.1 Bread
- 穀物作物を収穫し、Knifeで藁を除去する。
- GrainをQuernで挽いてFlourにする。
- FlourにFresh Waterを加えてDoughを作る。
- Doughを加熱してBreadにする。
- Grainは食品段階の中でも腐敗が遅い。

### 7.2 Composter
- Green itemとBrown itemの両方が必要。
- 材料ごとに寄与量が異なる。
- 平均条件で完成まで12日。
- 上にSnowがあると少し速くなる。
- 年間降雨量150mm未満または350mm超では遅くなる。
- Composter同士が隣接すると遅くなる。
- Meat / Bonesなどは堆肥を腐敗させ、作物に使うと作物を即座に枯らす。

### 7.3 Fertilizers
公式Field Guideの値：
| 肥料 | Nitrogen | Phosphorus | Potassium |
|---|---:|---:|---:|
| Compost | 40 | 20 | 40 |
| Bone Meal | 0 | 10 | 0 |
| Saltpeter | 10 | 0 | 40 |
| Guano | 80 | 50 | 10 |
| Wood Ash | 0 | 10 | 30 |
| Sylvite Powder | 0 | 0 | 50 |

これらは公式ガイドに記載された値であり、Bedrock版独自のバランス値ではない。

## 8. 生存・戦闘・生活

### 8.1 Food and Water
- HungerだけでなくThirstを管理する。
- Fresh WaterはThirstを回復するが、Salt WaterはThirstを減らし、Thirst効果を与える可能性がある。
- 食品はSaturation / Water / Nutrition / Decay Dateを持つ。
- 栄養素はFruit / Vegetables / Protein / Grain / Dairyの5種類。
- 全栄養素が高いと最大体力が増加し、栄養不足は最大体力を低下させる。
- HungerまたはThirstが尽きると移動・採掘が鈍くなり、ダメージを受ける。
- Jugを焼成して水を携帯できる。

### 8.2 Fishing
- 釣り針はAnvilで鍛造する。
- Fishing RodにBaitを取り付けて使用する。
- 通常の魚にはSeedsまたはShellfish、大型魚には魚類を餌にする。
- 魚が食いついた後、引き上げ操作のメーターを管理する。速く引きすぎると逃げられる。

### 8.3 Support Beams & Collapses
- Raw RockやOreなどは周囲の支持状態によって崩落する。
- 支柱と横梁で支持範囲を作る。
- 横梁は中心から9×5×9の範囲を支持する。
- 鉱石が崩落すると品位がRich→Normal→Poor→Cobblestoneのように低下する。
- Dirt / Grass / Clay / Gravel / Cobblestone / Sandも重力・斜面落下の影響を受ける。
- Chiselによる加工も崩落を誘発する場合がある。

### 8.4 Pets
- Dog / CatはFamiliarityを上げると飼い主を認識する。
- Pet ScreenからRelax / We're Home / Sit / Follow Me / Hunt With Meなどの命令を行う。
- Dogは狩り、Catは小動物・害獣への対応など、種ごとに役割が異なる。

### 8.5 Damage Types / Armor
- 物理ダメージはPiercing / Slashing / Crushingの3種類。
- 防具は素材Tierだけでなく、各ダメージ種への耐性が異なる。
- Armorは金属Tierに応じて強くなり、上位SteelにはToughnessやKnockback Resistanceもある。

## 9. Advanced Mechanicsの公式目次

2026-11-27に取得した公式Field Guide目次で確認できたページ名：
Animal Husbandry、Anvils、Aqueducts、Armor、Armor Trims、Barrels、Bellows、Blast Furnace、Bloomery、Bowls、Bread、Charcoal Forge、Charcoal Pit、Chisel、Composter、Crankshafts、Crops、Crucible、Dairy Products、Damage Types、Preservation、Dye、Fertilizers、Fire Clay、Fishing、Flux、Glassworking、Glass Products、Firepit And Grill、Heating、Keeping Hydrated、Jarring、Lamps、Leather Making、Light Sources、Mechanical Power、Minecarts、Panning、Papermaking、Pets、Firepit And Pot、Powderkegs、Prospecting。

これは公式目次から取得できた項目一覧であり、全項目の詳細仕様をこの文書で網羅したという意味ではない。未記載項目は今後、公式ページを個別に読み、台帳へ追加する。

## 10. 公式参照元

- [Advanced Mechanics Index](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/)
- [Bloomery](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/bloomery.html)
- [Mechanical Power](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/mechanical_power.html)
- [Panning](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/panning.html)
- [Sluices](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/sluices.html)
- [Barrels](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/barrels.html)
- [Aqueducts](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/aqueducts.html)
- [Support Beams & Collapses](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/support_beams.html)
- [Animal Husbandry](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/animal_husbandry.html)
- [Pets](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/pets.html)
- [Fishing](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/fishing.html)
- [Leather Making](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/leather_making.html)
- [Food and Water](https://terrafirmacraft.github.io/Field-Guide/20/en_us/getting_started/food_and_water.html)
- [Bread](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/bread.html)
- [Composter](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/composter.html)
- [Fertilizers](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/fertilizers.html)
- [Armor](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/armor.html)
- [Damage Types](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/damage_types.html)


## 11. 加工設備・生活系の追加詳細

### 11.1 Quern
- BaseとHandstoneで構成する粉砕設備。
- 手動ではHandstoneを回して処理する。
- 粉末、染料、宝石粉、Flour、Fluxなどを作る。
- Mechanical PowerのAxleを接続すると自動化でき、回転速度が高いほど粉砕が速い。

### 11.2 Dairy / Cheese
- Dairy AnimalsのMilkは飲用でき、Jugで扱う。
- MilkはVinegarと9:1でBarrelに入れてMilk Vinegarを作る。
- DairyはFood Nutritionの独立カテゴリ。
- Milkを飲むだけでなく、チーズ加工や食事との組み合わせが必要。

### 11.3 Bowls / Salads / Sandwiches
- Ceramic Bowlは粘土をKnappingして焼成する。Wooden Bowlも別工程で作れる。
- BowlはSalad / Soup / Salted Meat / Glass Powderの用途を持つ。
- Saladは最大5個のFruit / Vegetable / Cooked MeatをBowlでまとめる。
- SandwichはBread 2個とVegetable / Cooked Meat / Cheeseなど3素材をWorkbenchで組み合わせる。
- SandwichのNutritionはBread分50%、具材分80%として合算される。材料は作成時に腐敗していない必要がある。完成品は新しい食品として腐敗を開始する。

### 11.4 Jarring
- JarはGlassworkingで作る。
- Tin製Jar LidをAnvilで加工し、Jarと組み合わせる。
- PotでSugarとFruitを煮て、蓋付きJarで封をしてJamを保存する。
- JamはSandwichの具材にもなる。
- Jarは固体面に置け、Jar Shelfへ配置できる。

### 11.5 Glassworking
- Glass Batchは砂の色・種類に応じてSilica / Hematitic / Olivine / Volcanicの系統がある。
- Batchには砂、Lime、Potash系素材を使う。
- Blowpipeを中心にBlow / Stretch / Flatten / Pinch / Saw / Rollの操作を行う。
- Paddle、Jacks、Gem Saw、Wool Clothなどの補助工具が工程ごとに必要。
- Table PourでGlass Pane、Basin PourでGlass Blockを作る。
- Jar、Lamp Glass、Bottle、Lensなどにもつながる。

### 11.6 Weaving / Sewing / Papermaking
- Wooly Animalsから得るWoolはSpindleでWool Yarnへ加工し、LoomでClothにする。
- Silk ClothはStringからLoomで作れる。
- Sewing TableはCloth / Yarn / Needleを使い、配置と縫い目をUI上で操作して成果物を作る。
- PapyrusはKnifeでStripにし、浸水・Loomでの編み込み・Log上でのScrapingを経てPaperになる。
- ParchmentはScraped HideをPumiceなどで処理して作る。
- PaperはBooksやMapsなどの書き物素材に使われる。

### 11.7 Minecarts
- プレイヤー、Entity、大型ブロックを運搬する。
- Anvil、Crucible、Large Vessel、Barrel、Powderkegなど、通常プレイヤーが持つと負担になる設備を搭載できる。
- Chest Minecartは通常TFC Chest相当の18スロットで、LogsなどのVery Largeアイテムは収納できない。
- 運搬・収納制限はItem Size / Weightシステムと連動する。

### 11.8 Crankshaft / Pump
- Crankshaftは回転動力を往復運動に変換する。
- BellowsやWater Pumpを駆動できる。
- Steel Pump / Steel Pipeは水・塩水・温泉水などの液体を運ぶ。
- PumpはCrankshaftとMechanical Powerを必要とし、最大16ブロック先から液体を移送できる。閉じた領域を最大32ブロックまで水源で満たせる。

### 11.9 Lamps / Light Sources
- Lampsは液体燃料を使う長期光源で、Olive Oil / Tallowなどを燃料とする。
- Lampは破壊しても燃料を保持する。
- Torches、Candles、Jack 'o Lanternsは寿命を持ち、時間経過で消えるか別状態へ変化する。
- 光源を単なる永続的なバニラTorchへ統合しない。

### 11.10 Dye
- 花・植物・鉱石粉末などをQuern等で加工して16色のDyeを得る。
- Dye Itemを水とPotで煮てDye Fluidを作り、Barrelで染色に使う。
- DyeはGlassworkingの色付けにも関係する。

### 11.11 Support / Collapse
- 採掘・Chiselingと地質支持状態が連動する。
- Support Beamは水平梁と垂直柱を組み合わせる。
- 落盤は単なる演出ではなく、岩石・鉱石の落下と鉱石品位低下を伴う。
- 実装時はプレイヤー周辺の局所範囲だけを評価し、全地下を常時走査しない。

## 12. 実装優先度の提案（設計上の判断）

以下は公式ガイドの順番そのものではなく、Bedrockで依存関係を組むための提案。

1. **基礎データ層**：Climate / Geology / ItemProfile / Metal / Heat / Food / Crop / Fauna
2. **序盤の必須進行**：採集、Knapping、陶器、Pit Kiln、Small Vessel、Casting、Primitive Anvil
3. **資源獲得**：地表小鉱石、鉱脈、Prospecting、Panning、Sluice
4. **鉄・金属加工**：Charcoal Pit、Forge、Bloomery、Crucible、Anvil、Blast Furnace、Steel
5. **生活システム**：Thirst、Nutrition、Decay、Cooking、Preservation、Farming、Animal Husbandry
6. **加工拡張**：Leather、Quern、Barrel、Glass、Weaving、Papermaking、Jarring
7. **建築・探索補助**：Support / Collapse、Aqueduct、Pump、Minecart、Lighting
8. **動力・自動化**：Windmill、Water Wheel、Axle、Gearbox、Clutch、Crankshaft、Trip Hammer

この順番は「小出しに完成品を配布する」ためではなく、全機能の依存関係と統合テストの順番を管理するための内部ロードマップである。

## 13. 追加参照元
- [Quern](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/quern.html)
- [Dairy Products](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/dairy.html)
- [Bowls](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/bowls.html)
- [Salads](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/salad.html)
- [Sandwiches](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/sandwiches.html)
- [Jarring](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/jarring.html)
- [Glassworking](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/glassworking.html)
- [Glass Products](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/glassworking_applications.html)
- [Weaving](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/weaving.html)
- [Sewing Table](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/sewing_table.html)
- [Papermaking](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/papermaking.html)
- [Minecarts](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/minecarts.html)
- [Crankshafts](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/crankshaft.html)
- [Pumps](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/pumps.html)
- [Lamps](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/lamps.html)
- [Light Sources](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/lighting.html)
- [Dye](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/dye.html)
- [Composter](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/composter.html)
- [Fertilizers](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/fertilizers.html)
