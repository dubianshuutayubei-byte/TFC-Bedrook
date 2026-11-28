# TFC Java 1.21.x fauna habitat audit

Updated: 2026-11-28

## Scope and source boundary

This audit is pinned to the official TerraFirmaCraft Java release tag `v4.2.16` (TerraFirmaCraft 1.21.1-4.2.16). The four relevant source blobs were fetched from both `v4.2.16` and `1.21.x`; their Git blob SHAs match exactly, confirming the branch snapshot used for extraction is byte-identical to the release-tag files.

Primary source files:
- `src/data/java/net/dries007/tfc/data/providers/BuiltinFauna.java` — species habitat builder expressions
- `src/main/java/net/dries007/tfc/common/entities/Faunas.java` — spawn placement, spawn chance, aquatic checks, depth, season and ground checks
- `src/main/java/net/dries007/tfc/world/placement/ClimatePlacement.java` — climate evaluation semantics
- `src/main/java/net/dries007/tfc/world/chunkdata/ForestType.java` — exact forest density values

Release tag: [TerraFirmaCraft v4.2.16](https://github.com/TerraFirmaCraft/TerraFirmaCraft/releases/tag/v4.2.16). The habitat dataset records source blob SHAs for BuiltinFauna, Faunas, and ClimatePlacement; the forest-density dataset records the ForestType blob SHA.

The extracted data is stored in `packs/behavior_pack/data/official-fauna-habitat-1.21x.json`. It contains 78 unique species, each retaining the exact source builder chain in `sourceExpression`, plus the release tag and source blob SHAs. The source expression is the audit anchor; derived numeric fields must not be edited independently without rechecking it.

## Java semantics captured

- `temperature(min, max)`, `minTemperature`, and `maxTemperature` constrain average sea-level temperature adjusted for the candidate spawn Y coordinate.
- `groundwater(min, max)`, `minGroundwater`, and `maxGroundwater` constrain average groundwater. If `ignoreRivers()` is set, Java uses average rainfall instead of average groundwater for this same range.
- `minForest` and `maxForest` use the numeric forest density from 0 through 4.
- `distanceBelowSeaLevel(n)` requires candidate Y to be at or below sea level minus n blocks.
- `maxBrightness(n)` compares raw brightness at the spawn position.
- `months(FRESHWATER_FISH_MONTHS)` uses the TFC hemispheric calendar month. The extracted constant resolves to May through October.
- `chance(n)` is a one-in-n spawn roll in `Faunas.java`; it is not a climate value or percentage.
- `fuzzy()` applies the source random threshold after hard climate limits pass. It uses normalized temperature, groundwater/rainfall, and rain-variance deltas, with two random floats.
- Java's spawn placement separately checks entity placement type, aquatic fluid compatibility, heightmap, optional valid solid ground, and season.

## Climate-layer formulas required by the habitat evaluator

The pinned 4.2.16 source also confirms why biome-name estimates are not sufficient:
- `RegionChunkDataGenerator` derives `baseGroundwater` from nearby sufficiently wide rivers: river segments below width 12 are ignored; width influence is scaled from 0 to 1; distance influence falls from 1 to 0 over `Units.blockToGridExact(40)`; each river contributes up to 300 and overlapping rivers use the maximum influence.
- After surface height is generated, `ChunkData.modifyBaseGroundwaterPoint` attenuates that river contribution: full strength through sea level +10, linearly reduced to zero by sea level +25.
- `ChunkData.getAverageGroundwater(x,z)` is `min(baseGroundwater + averageRainfall, 500)`.
- `baseGroundwater` represents local freshwater-body influence (the source comment identifies rivers as its current use); it is not the same as rainfall.
- `averageRainfall` is a time-invariant annual value in mm/year, in the documented 0–500 range.
- `getAverageSeaLevelTemp` is a per-chunk climate layer. `ClimatePlacement` adjusts it for candidate Y using `EnvironmentHelpers.adjustAvgTempForElev`.
- `rainVariance` is a separate climate-layer value. For non-absolute rain variance, the source flips its sign in the southern hemisphere before the fuzzy check.
- `ignoreRivers()` substitutes average rainfall for average groundwater; it does not mean that rainfall can be replaced by a biome category label.

These formulas and source blob IDs are also recorded in the habitat JSON metadata. The terrain/world-climate layer is still a prerequisite for runtime parity; no synthetic groundwater values have been introduced.

## Forest density reference

The 1.21.x `ForestType.java` enum has 29 entries. Its second constructor argument is the exact `getDensity()` value used by `ClimatePlacement` (0–4). The values are stored in `packs/behavior_pack/data/official-forest-type-density-1.21x.json` so habitat limits such as `minForest(3)` and `maxForest(2)` can be evaluated numerically without translating them into guessed labels.

## Bedrock implementation status

A pure evaluator, `evaluateOfficialFaunaHabitat`, now models the branch-source climate fields and reports unavailable measurements in `missing` instead of substituting guesses. It intentionally expects source-equivalent inputs such as `averageGroundwater`, `averageRainfall`, numeric `forestDensity`, `rainVariance`, hemispherically adjusted `month`, `seaLevel`, and `brightness`.

**This evaluator is not yet connected to live Bedrock world sampling.** The current runtime sampler estimates rainfall from biome names and does not provide TFC-equivalent average groundwater or rain variance. Those estimates must not be passed off as official TFC climate data. In particular, camel spawn rules must remain unresolved until groundwater can be sampled from the TFC-style world climate layer.

The existing 63-species legacy climate profiles and 78-species 1.21.x habitat profiles are separate source snapshots. Do not merge them by silently filling missing values. The 15 species added to the 1.21.x habitat dataset have source-derived builder expressions now, but runtime spawn behavior remains incomplete.

## Verification

- Dataset: 78 unique entries, matched against the current 78-species target roster.
- Tests cover camel and armadillo groundwater constraints, numeric forest density, freshwater fish seasonal and ignore-rivers behavior, deep-water and brightness limits, and panda fuzzy climate rolls.
- GitHub Actions validates JSON, JavaScript syntax, and Node tests only. It does not launch Minecraft Bedrock or validate entity rendering, spawning, or gameplay in the game.
