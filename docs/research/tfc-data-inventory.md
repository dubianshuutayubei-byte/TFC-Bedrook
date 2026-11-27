# TFC 3.2.26 データ資産インベントリ

更新日：2026-11-27  
取得元：公式 TerraFirmaCraft/TerraFirmaCraft、Git tag v3.2.26

## 1. 目的

TFC-Bedrookの全機能を漏れなく設計するため、公式TFCのデータ駆動フォルダをGitHub APIで直接一覧化した。ここにある数字は指定フォルダ直下のJSONファイル数、またはファイル・サブフォルダの合計であり、ブロック数・アイテム数・ゲーム内要素の総数とは必ずしも一致しない。

## 2. World Generation

| データ領域 | パス（src/main/resources/data/tfc/以下） | 件数 |
|---|---|---:|
| Biomes | worldgen/biome | 30 |
| Configured Features | worldgen/configured_feature | 106 entries |
| Placed Features | worldgen/placed_feature | 108 entries |
| Configured Carvers | worldgen/configured_carver | 2 |
| Ore / Mineral Veins | worldgen/configured_feature/vein | 41 JSON |
| Panning Deposits | tfc/panning/deposits | 80 JSON |
| Sluicing Deposits | tfc/sluicing/deposits | 80 JSON |

Configured Feature / Placed Featureの件数にはplant、tree、vein等のサブフォルダが含まれる。再帰的な全JSON数ではない。

Biomeファイルの例：badlands、canyons、deep_ocean、deep_ocean_trench、highlands、hills、lake、lowlands、mountains、ocean、ocean_reef、old_mountains、plains、plateau、river、shore、tidal_flats、volcanic_mountains、volcanic_oceanic_mountainsなど。

## 3. Gameplay Data

| データ領域 | パス | 件数 |
|---|---|---:|
| Crop Climate Ranges | tfc/climate_ranges/crop | 23 |
| Plant Climate Ranges | tfc/climate_ranges/plant | 20 |
| Drinkables | tfc/drinkables | 5 |
| Fauna | tfc/fauna | 63 |
| Fertilizers | tfc/fertilizers | 9 |
| Food Item Profiles | tfc/food_items | 170 |
| Fuels | tfc/fuels | 29 |
| Item Heats | tfc/item_heats | 41 entries |
| Item Sizes | tfc/item_sizes | 56 |
| Knapping Types | tfc/knapping_types | 5 |
| Lamp Fuels | tfc/lamp_fuels | 3 |
| Metals | tfc/metals | 28 |
| Panning Definitions | tfc/panning | 1 subfolder |
| Sluicing Definitions | tfc/sluicing | 1 subfolder |
| Supports | tfc/supports | 1 JSON |
| Entity Damage Resistances | tfc/entity_damage_resistances | 3 |
| Item Damage Resistances | tfc/item_damage_resistances | 2 |

### 3.1 Metal profiles (28)
Bismuth、Bismuth Bronze、Black Bronze、Black Steel、Blue Steel、Brass、Bronze、Cast Iron、Copper、Gold、High Carbon Black Steel、High Carbon Blue Steel、High Carbon Red Steel、High Carbon Steel、Nickel、Pig Iron、Red Steel、Rose Gold、Silver、Steel、Sterling Silver、Tin、Unknown、Weak Blue Steel、Weak Red Steel、Weak Steel、Wrought Iron、Zinc。

### 3.2 Crop climate profiles (23)
Barley、Beet、Cabbage、Carrot、Garlic、Green Bean、Jute、Maize、Melon、Oat、Onion、Papyrus、Potato、Pumpkin、Red Bell Pepper、Rice、Rye、Soybean、Squash、Sugarcane、Tomato、Wheat、Yellow Bell Pepper。

### 3.3 Plant climate profiles (20)
Banana Tree、Blackberry Bush、Blueberry Bush、Bunchberry Bush、Cherry Tree、Cloudberry Bush、Cranberry Bush、Elderberry Bush、Gooseberry Bush、Green Apple Tree、Lemon Tree、Olive Tree、Orange Tree、Peach Tree、Plum Tree、Raspberry Bush、Red Apple Tree、Snowberry Bush、Strawberry Bush、Wintergreen Berry Bush。

### 3.4 Knapping types (5)
Clay、Fire Clay、Goat Horn、Leather、Rock。

### 3.5 Fauna
Fauna profiles include domestic animals, wild mammals, birds, reptiles, amphibians, fish, and aquatic invertebrates. Examples include Alpaca、Cow、Goat、Horse、Pig、Sheep、Yak、Bear、Cougar、Deer、Lion、Moose、Wolf、Salmon、Trout、Turtle、Dolphin、Octopus-like marine fauna and others. Full exact IDs are in the source directory.

## 4. Recipe Categories

The recipes directory contains 35 direct entries, including these folders/files:
- alloy
- anvil
- barrel
- blast_furnace
- bloomery
- casting
- chisel
- clay_knapping
- collapse
- crafting
- fire_clay_knapping
- glassworking
- goat_horn_knapping
- heating
- leather_knapping
- loom
- pot
- quern
- rock_knapping
- scraping
- sewing
- stonecutting
- welding
- plus standalone recipes such as casting and food_combining

This confirms that TFC's progression is not a single crafting-recipe system. It has separate processing families for heat, metal, vessels, glass, leather, weaving, knapping, and food combination.

## 5. Implementation implications

- The source contains 170 food profiles, so food properties should be data-driven rather than hard-coded per item.
- The 28 metal profiles are the base for one common metal/heat/alloy system.
- The 23 crop and 20 plant climate profiles should share a common Climate service but remain separate data tables.
- The 63 fauna profiles require a common spawn/climate schema, with species-specific behavior layered on top.
- 41 vein definitions and 80 panning + 80 sluicing deposit definitions show that geology is more than a list of ore IDs; deposit type and host rock matter.
- 56 item-size profiles and 41 item-heat entries are separate mechanics that must feed containers, heating, inventory and processing.
- Recipe categories should map to separate UI/process handlers that share common item, heat, metal, and time data.

## 6. Limitations

- Counts are direct directory listings from tag v3.2.26, not a full recursive count.
- The complete recipe subdirectory file counts have not yet been enumerated.
- The source data may reference Java registries, tags, capabilities, and code-side behavior that do not map directly to Bedrock.
- This inventory is a specification reference, not permission to copy source assets or code.
- The repository is EUPL-1.2; third-party assets in the repository may have their own license notices. Verify before copying.

## 7. Official Source Links

- [TFC v3.2.26 source root](https://github.com/TerraFirmaCraft/TerraFirmaCraft/tree/v3.2.26/src/main/resources/data/tfc)
- [Worldgen Biomes](https://github.com/TerraFirmaCraft/TerraFirmaCraft/tree/v3.2.26/src/main/resources/data/tfc/worldgen/biome)
- [Ore Veins](https://github.com/TerraFirmaCraft/TerraFirmaCraft/tree/v3.2.26/src/main/resources/data/tfc/worldgen/configured_feature/vein)
- [Metals](https://github.com/TerraFirmaCraft/TerraFirmaCraft/tree/v3.2.26/src/main/resources/data/tfc/tfc/metals)
- [Food Items](https://github.com/TerraFirmaCraft/TerraFirmaCraft/tree/v3.2.26/src/main/resources/data/tfc/tfc/food_items)
- [Fauna](https://github.com/TerraFirmaCraft/TerraFirmaCraft/tree/v3.2.26/src/main/resources/data/tfc/tfc/fauna)
- [Crop Climate Ranges](https://github.com/TerraFirmaCraft/TerraFirmaCraft/tree/v3.2.26/src/main/resources/data/tfc/tfc/climate_ranges/crop)
- [Plant Climate Ranges](https://github.com/TerraFirmaCraft/TerraFirmaCraft/tree/v3.2.26/src/main/resources/data/tfc/tfc/climate_ranges/plant)
- [Recipes](https://github.com/TerraFirmaCraft/TerraFirmaCraft/tree/v3.2.26/src/main/resources/data/tfc/recipes)
