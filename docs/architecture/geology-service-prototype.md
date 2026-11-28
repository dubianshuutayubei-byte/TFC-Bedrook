# Geology layer resolver

## Source basis

The profile data in `packs/behavior_pack/data/geology-layers.json` is transcribed
from the official TerraFirmaCraft v3.2.26 Overworld world preset. It contains the
20 rock IDs, the bottom-rock candidates, the named layer graph, and the four
region root lists: `ocean_floor`, `volcanic`, `land`, and `uplift`.

TFC Java's `RockLayerSettings` resolves named layers into linked candidate
lists. At each depth it chooses a rock from the current candidate list, then
follows that rock's next-layer reference. The bottom list loops to itself.

## Bedrock adaptation

`geology-service.mjs` validates the graph and samples a deterministic sequence
using a small local PRNG. This is a new Bedrock implementation; it does not
reproduce TFC Java's Xoroshiro random sequence or bit-identical seed mapping.

The service currently resolves only the order of rock types in a geological
column. It does not yet determine:
- world coordinates or geological region boundaries;
- vertical layer thickness or depth-to-rock transitions;
- terrain, exposed outcrops, or bedrock;
- ore veins, host-rock deposits, or prospecting results.

Those systems must consume the same region/rock data later. A sequence of
three rocks is a test fixture, not a claim that every TFC column has exactly
three layers.

## Verification

- `npm test` checks graph references, region roots, deterministic sampling,
  invalid input handling, and all four region classes.
- CI's static validation and JavaScript syntax checks remain required.
- Actual world-generation integration still requires Bedrock 26.60 testing.

## References

- [TFC v3.2.26 Overworld preset](https://github.com/TerraFirmaCraft/TerraFirmaCraft/blob/v3.2.26/src/main/resources/data/tfc/worldgen/world_preset/overworld.json)
- [TFC v3.2.26 RockLayerSettings.java](https://github.com/TerraFirmaCraft/TerraFirmaCraft/blob/v3.2.26/src/main/java/net/dries007/tfc/world/settings/RockLayerSettings.java)
