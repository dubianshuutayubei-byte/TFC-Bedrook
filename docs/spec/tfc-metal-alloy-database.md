# TFC 3.2.26 金属・合金データベース

更新日：2026-11-27  
取得元：公式TerraFirmaCraft/TerraFirmaCraft、tag v3.2.26

## 1. 金属プロファイル（28）

以下はtfс/metals内の各JSONから直接取得した値。Melt Temperatureは°C。Specific Heat CapacityはTFCのデータ値をそのまま記載し、Bedrock用の物理単位へ変換していない。

| Metal | Tier | Melt Temp °C | Specific Heat Capacity |
|---|---:|---:|---:|
| Bismuth | 1 | 270 | 0.02143 |
| Bismuth Bronze | 2 | 985 | 0.00857 |
| Black Bronze | 2 | 1070 | 0.00857 |
| Black Steel | 5 | 1485 | 0.00857 |
| Blue Steel | 6 | 1540 | 0.00857 |
| Brass | 2 | 930 | 0.00857 |
| Bronze | 2 | 950 | 0.00857 |
| Cast Iron | 1 | 1535 | 0.00857 |
| Copper | 1 | 1080 | 0.00857 |
| Gold | 1 | 1060 | 0.00500 |
| High Carbon Black Steel | 4 | 1540 | 0.00857 |
| High Carbon Blue Steel | 5 | 1540 | 0.00857 |
| High Carbon Red Steel | 5 | 1540 | 0.00857 |
| High Carbon Steel | 3 | 1540 | 0.00857 |
| Nickel | 1 | 1453 | 0.00625 |
| Pig Iron | 3 | 1535 | 0.00857 |
| Red Steel | 6 | 1540 | 0.00857 |
| Rose Gold | 1 | 960 | 0.00857 |
| Silver | 1 | 961 | 0.00625 |
| Steel | 4 | 1540 | 0.00857 |
| Sterling Silver | 1 | 950 | 0.00857 |
| Tin | 1 | 230 | 0.02143 |
| Unknown | 0 | 400 | 0.00600 |
| Weak Blue Steel | 5 | 1540 | 0.00857 |
| Weak Red Steel | 5 | 1540 | 0.00857 |
| Weak Steel | 4 | 1540 | 0.00857 |
| Wrought Iron | 3 | 1535 | 0.00857 |
| Zinc | 1 | 420 | 0.01429 |

## 2. 合金レシピ（9）

以下の範囲は入力金属の全体量に対する比率。各金属の最小値・最大値を同時に満たす組み合わせが必要。Bedrock版でも単純な固定比率クラフトにせず、範囲判定を行う。

| Result Alloy | Component | Min | Max |
|---|---|---:|---:|
| Bismuth Bronze | Copper | 0.50 | 0.65 |
|  | Zinc | 0.20 | 0.30 |
|  | Bismuth | 0.10 | 0.20 |
| Black Bronze | Copper | 0.50 | 0.70 |
|  | Silver | 0.10 | 0.25 |
|  | Gold | 0.10 | 0.25 |
| Brass | Copper | 0.88 | 0.92 |
|  | Zinc | 0.08 | 0.12 |
| Bronze | Copper | 0.88 | 0.92 |
|  | Tin | 0.08 | 0.12 |
| Rose Gold | Copper | 0.15 | 0.30 |
|  | Gold | 0.70 | 0.85 |
| Sterling Silver | Copper | 0.20 | 0.40 |
|  | Silver | 0.60 | 0.80 |
| Weak Blue Steel | Black Steel | 0.50 | 0.55 |
|  | Steel | 0.20 | 0.25 |
|  | Bismuth Bronze | 0.10 | 0.15 |
|  | Sterling Silver | 0.10 | 0.15 |
| Weak Red Steel | Black Steel | 0.50 | 0.55 |
|  | Steel | 0.20 | 0.25 |
|  | Brass | 0.10 | 0.15 |
|  | Rose Gold | 0.10 | 0.15 |
| Weak Steel | Steel | 0.50 | 0.70 |
|  | Nickel | 0.15 | 0.25 |
|  | Black Bronze | 0.15 | 0.25 |

## 3. データ構造の意味

### 3.1 Metal Profile
Metal Profileは最低限次を持つ。
- Tier
- Fluid ID
- Melt Temperature
- Specific Heat Capacity
- Ingot / Double Ingot / Sheet等のアイテムタグ

### 3.2 Alloy
Alloy Recipeは次を持つ。
- 出力Metal ID
- 構成金属ID
- 各構成金属の最小比率
- 各構成金属の最大比率

### 3.3 Bedrock移植時の注意
- TierはAnvil加工・装備進行・工具進行の共通データにする。
- Melt TemperatureとHeat Capacityは共通Heatサービスから参照する。
- Alloyは入力の合計量を基準に比率を計算する。
- TFCの高Tier金属は単純な合金クラフトではなく、High Carbon化・溶接・Anvil工程など複数の加工工程に分かれる。
- 金属のTierと融点は同じ概念ではない。Tier判定を融点から自動推定しない。

## 4. 公式ソース

- [Metal Profiles at v3.2.26](https://github.com/TerraFirmaCraft/TerraFirmaCraft/tree/v3.2.26/src/main/resources/data/tfc/tfc/metals)
- [Alloy Recipes at v3.2.26](https://github.com/TerraFirmaCraft/TerraFirmaCraft/tree/v3.2.26/src/main/resources/data/tfc/recipes/alloy)
- [Anvils Field Guide](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/anvils.html)
- [Crucible Field Guide](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/crucible.html)
