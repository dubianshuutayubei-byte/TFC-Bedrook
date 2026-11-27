# TFC 3.2.26 作物・果樹の気候データ

更新日：2026-11-27  
取得元：公式TerraFirmaCraft/TerraFirmaCraft、tag v3.2.26  
対象：tfc/climate_ranges/crop と tfc/climate_ranges/plant

## 1. 読み方

この表は公式JSONの値をそのまま整理したもの。

- Hydration：土壌水分の必要範囲（%）。
- Temperature：適正温度範囲（°C）。
- Cropのtemperature_wiggle_rangeは全23作物で5。
- Cropのhydration_wiggle_rangeは全23作物で0。
- Plantのtemperature_wiggle_range / hydration_wiggle_rangeは全20植物で0。
- このデータファイルにはN/P/Kの栄養素要求値や月ごとの成長段階は含まれない。それらは別データ・コード・Field Guideと照合する。

## 2. 栽培作物（23）

| Crop | Min Hydration | Max Hydration | Min Temp °C | Max Temp °C |
|---|---:|---:|---:|---:|
| Barley | 18 | 75 | -8 | 26 |
| Beet | 18 | 85 | -5 | 20 |
| Cabbage | 15 | 65 | -10 | 27 |
| Carrot | 25 | 100 | 3 | 30 |
| Garlic | 15 | 75 | -20 | 18 |
| Green Bean | 38 | 100 | 2 | 35 |
| Jute | 25 | 100 | 5 | 37 |
| Maize | 75 | 100 | 13 | 40 |
| Melon | 75 | 100 | 5 | 37 |
| Oat | 35 | 100 | 3 | 40 |
| Onion | 25 | 90 | 0 | 30 |
| Papyrus | 70 | 100 | 19 | 37 |
| Potato | 50 | 100 | -1 | 37 |
| Pumpkin | 30 | 80 | 0 | 30 |
| Red Bell Pepper | 25 | 60 | 16 | 30 |
| Rice | 25 | 100 | 15 | 30 |
| Rye | 25 | 85 | -11 | 30 |
| Soybean | 40 | 100 | 8 | 30 |
| Squash | 23 | 95 | 5 | 33 |
| Sugarcane | 40 | 100 | 12 | 38 |
| Tomato | 30 | 95 | 0 | 36 |
| Wheat | 25 | 100 | -4 | 35 |
| Yellow Bell Pepper | 25 | 60 | 16 | 30 |

## 3. 果樹・ベリー（20）

| Plant | Min Hydration | Max Hydration | Min Temp °C | Max Temp °C |
|---|---:|---:|---:|---:|
| Banana Tree | 33 | 100 | 10 | 42 |
| Blackberry Bush | 24 | 100 | 7 | 24 |
| Blueberry Bush | 12 | 100 | 7 | 29 |
| Bunchberry Bush | 24 | 100 | 15 | 35 |
| Cherry Tree | 12 | 100 | -2 | 32 |
| Cloudberry Bush | 9 | 100 | -2 | 17 |
| Cranberry Bush | 30 | 100 | -5 | 17 |
| Elderberry Bush | 12 | 100 | 10 | 33 |
| Gooseberry Bush | 24 | 100 | 5 | 27 |
| Green Apple Tree | 13 | 100 | -6 | 32 |
| Lemon Tree | 21 | 100 | 3 | 37 |
| Olive Tree | 18 | 100 | -2 | 37 |
| Orange Tree | 30 | 100 | 8 | 43 |
| Peach Tree | 7 | 100 | -3 | 34 |
| Plum Tree | 30 | 100 | 8 | 38 |
| Raspberry Bush | 24 | 100 | 5 | 25 |
| Red Apple Tree | 12 | 100 | -6 | 32 |
| Snowberry Bush | 24 | 100 | -7 | 18 |
| Strawberry Bush | 12 | 100 | 5 | 28 |
| Wintergreen Berry Bush | 12 | 100 | -6 | 17 |

## 4. 実装時の注意

- Java TFCの温度・Hydration計算をBedrockのバニラBiome temperature / downfallへそのまま置き換えない。
- TFCのClimateサービスを作り、作物・果樹・野生作物・動物が共通の地域温度を参照する。
- Hydrationは土壌・水源・降雨の影響をまとめて算出する。
- CropとPlantは別の定義テーブルにする。果樹・ベリーは季節ライフサイクルが異なる。
- Field Guideに載る野生作物のTemperature / Rainfall範囲と、このJSONのCrop Temperature / Hydration範囲は別の条件として扱う。
- 気候条件は「生成できる条件」「生育できる条件」「現在の成長段階」の三つに分ける。

## 5. 公式ソース

- [Crop Climate Ranges at v3.2.26](https://github.com/TerraFirmaCraft/TerraFirmaCraft/tree/v3.2.26/src/main/resources/data/tfc/tfc/climate_ranges/crop)
- [Plant Climate Ranges at v3.2.26](https://github.com/TerraFirmaCraft/TerraFirmaCraft/tree/v3.2.26/src/main/resources/data/tfc/tfc/climate_ranges/plant)
- [Calendar and Climate Field Guide](https://terrafirmacraft.github.io/Field-Guide/20/en_us/the_world/climate.html)
- [Crops Field Guide](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/crops.html)
- [Wild Fruits Field Guide](https://terrafirmacraft.github.io/Field-Guide/20/en_us/the_world/wild_fruits.html)
