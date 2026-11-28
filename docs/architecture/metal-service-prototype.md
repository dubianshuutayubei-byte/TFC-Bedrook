# Metal and alloy service

The source-backed database contains 28 metal profiles and 9 alloy ratio recipes
from TerraFirmaCraft 3.2.26. The values are transcribed into normalized IDs.

- Melt temperature is stored in degrees Celsius.
- Specific heat capacity is retained as a source value; it is not converted
  into a Bedrock physical unit.
- Metal tier is stored independently from melt temperature.
- Alloy matching uses the fraction of total input amount and inclusive min/max
  bounds for every declared component.
- Unlisted metals invalidate a match; zero-amount inputs are ignored.

## Runtime integration currently connected

- Copper ore is melted and cast into a heated copper ingot.
- Tin ore can be melted and cast into a heated tin ingot.
- Heated copper and tin ingots can be water-cooled into ingots.
- Bronze is cast from a 9:1 copper/tin input ratio. Runtime calls
  `findMatchingAlloys` against the TFC 3.2.26 bronze component bounds
  (88–92% copper, 8–12% tin) before consuming materials.
- Heated bronze can be cooled and shaped into a bronze sheet at the anvil.

## Remaining boundaries

- Tin ore is registered as an item but has no natural world-generation source
  until the terrain/geology phase.
- Only bronze is connected as a live alloy recipe. Other source alloy profiles
  remain data/rules only.
- The current station heat model is a simplified game-time approximation;
  item-level heat capacity, heat loss, and full fluid transfer are not yet
  simulated.
- No weapon or weapon-part recipes are part of this runtime integration.
