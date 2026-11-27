# 熱・燃料サービス試作

更新日：2026-11-28

## 参照基準

TFC 1.20.x（Minecraft 1.20.1 / TFC 3.x）の公式Documentationと公式リポジトリのデータを参照する。

- [Custom Data: Fuels](https://terrafirmacraft.github.io/Documentation/1.20.x/custom/#fuels)
- [Custom Data: Item Heats](https://terrafirmacraft.github.io/Documentation/1.20.x/custom/#item-heats)
- [Custom Data: Metals](https://terrafirmacraft.github.io/Documentation/1.20.x/custom/#metals)
- [Heating Field Guide](https://terrafirmacraft.github.io/Field-Guide/20/en_us/mechanics/heating.html)
- [Official source: fuels](https://github.com/TerraFirmaCraft/TerraFirmaCraft/tree/1.20.x/src/main/resources/data/tfc/tfc/fuels)
- [Official source: item heats](https://github.com/TerraFirmaCraft/TerraFirmaCraft/tree/1.20.x/src/main/resources/data/tfc/tfc/item_heats/metal)

## 収録データ

- 燃料4種：Charcoal / Coal / Lignite / Peat
- 金属インゴットの加熱プロファイル4種：Copper / Bismuth Bronze / Steel / Wrought Iron
- 燃料の燃焼時間はtick、燃焼温度は°C。
- アイテム熱容量はTFC DocumentationのEnergy / °Cという単位に従う。

## 実装済みの計算

- 燃料・アイテム熱プロファイルのデータ検証
- 現在温度から目標温度までの理想必要エネルギー
- 与えたエネルギーによる理想温度上昇
- 鍛造可能・溶接可能・金属融解温度到達の独立判定

## 意図的に未実装

この段階では、燃料温度をアイテムへそのまま適用しない。熱源・対象物・設備の熱伝達率、周囲への熱損失、Bellowsの効果、燃料消費タイミングを完全に再現するにはTFC実装コードとの追加照合が必要であり、温度上昇速度を創作しないためである。

このサービスは温度とエネルギーの基礎計算であり、Firepit / Pit Kiln / Charcoal Forge / Crucibleのゲーム内設備ではない。TFCの燃焼時間・温度を記録した参照データもBedrock側のtick挙動を保証しない。
