# Climate service prototype

This is the first executable gameplay subsystem, deliberately implemented as a
pure module before connecting it to Minecraft events.

- Temperature model: annual mean + seasonal cycle + altitude lapse rate.
- Crop climate: separate temperature and hydration windows with wiggle ranges.
- Fauna habitat: only explicitly supplied constraints are enforced.
- Units: Celsius and normalized hydration (0..100). Rainfall remains in source
  profile units until a calibrated conversion is documented.

The seasonal curve and lapse rate are configurable approximations. They are not
claimed to reproduce TFC's full climate engine. Integration with Bedrock world
clocks, biome sampling and persistent player/block state remains a later step.

Run the automated tests with `node --test tests/*.test.mjs`.
