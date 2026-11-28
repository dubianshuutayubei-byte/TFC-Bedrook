# Climate service prototype

This is the first executable gameplay subsystem. Mathematical functions remain
pure and independently testable; the Bedrock adapter reads world time and
announces calendar transitions.

## Implemented

- Temperature model: annual mean + seasonal cycle + altitude lapse rate.
- Crop climate: separate temperature and hydration windows with wiggle ranges.
- Fauna habitat: only explicitly supplied constraints are enforced.
- Calendar: 96 Minecraft world-days per addon year, split into four equal
  24-day seasons. World day 0 starts at year 1, winter, day 1.
- Bedrock adapter: reads `world.getDay()`, displays the calendar on initial
  player spawn, and announces season transitions using a low-frequency
  `system.runInterval` check (200 ticks).
- Units: Celsius and normalized hydration (0..100). Rainfall remains in source
  profile units until a calibrated conversion is documented.

## Deliberate approximations

The 96-day year, equal season lengths, sinusoidal temperature curve and lapse
rate are gameplay approximations. They are not claimed to reproduce TFC's full
climate engine or its calendar month mapping. TFC's Field Guide describes four
seasons by three-month ranges; exact day lengths and day-to-day climate
variation still need source-level verification.

The current adapter does not yet calculate latitude, regional mean temperature,
rainfall, soil hydration, biome climate or crop growth. It only exposes a
world-time-based calendar. No per-block or per-entity scan is performed.

## Next integration stages

1. Establish regional climate inputs from the world-generation/geology data.
2. Add a deterministic latitude/altitude climate profile.
3. Calibrate rainfall and soil hydration against TFC source definitions.
4. Connect crop/plant/fauna profiles to the shared climate service.
5. Add persistence only when a value cannot be derived from world time or
   static profile data.

## Verification

Run the automated tests with `npm test`. CI also validates pack manifests,
JavaScript syntax and creates a development `.mcaddon`. Actual loading and
calendar behavior still require in-game verification on Bedrock 26.60.
