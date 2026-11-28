# Climate profile database

## Source and scope

The 23 crop and 20 wild-plant climate ranges are transcribed from TerraFirmaCraft
Java 1.20.1, tag v3.2.26. See
`packs/behavior_pack/data/climate-profiles.json`.

The values are source profile thresholds, not a calibrated Bedrock simulation.
The profile's hydration numbers are retained on the documented 0..100 scale;
how Bedrock derives soil hydration from rainfall, nearby water, soil and season
is still an independent implementation task.

## Runtime contract

Each profile contains:
- `minTemperatureC` / `maxTemperatureC`
- `temperatureWiggleC`
- `minHydration` / `maxHydration`
- `hydrationWiggle`

Crops and wild plants remain separate lists. Both can be evaluated by the same
pure climate function, but their source thresholds differ: crop profiles in
this dataset have a 5°C temperature wiggle; plant profiles have zero wiggle.

## Verification

The climate profile validator checks unique IDs, numeric bounds, valid
temperature/hydration ranges, and non-negative wiggle values. Tests assert the
expected 23 crop and 20 plant profile counts and selected source thresholds.

## References

- [TFC v3.2.26 crop climate ranges](https://github.com/TerraFirmaCraft/TerraFirmaCraft/tree/v3.2.26/src/main/resources/data/tfc/tfc/climate_ranges/crop)
- [TFC v3.2.26 plant climate ranges](https://github.com/TerraFirmaCraft/TerraFirmaCraft/tree/v3.2.26/src/main/resources/data/tfc/tfc/climate_ranges/plant)
- [TFC Field Guide: Agriculture](https://terrafirmacraft.github.io/Field-Guide/20/en_us/the_world/agriculture.html)
