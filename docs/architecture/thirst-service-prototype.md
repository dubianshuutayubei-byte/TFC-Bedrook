# Thirst service prototype

## Source basis

The pure functions in `packs/behavior_pack/scripts/core/thirst-service.mjs`
follow TerraFirmaCraft v3.2.26 source behavior:

- Maximum thirst is 100.
- The server default `thirstModifier` is 5.
- Thirst decreases when the exhaustion level reaches 4.
- Ambient temperature adds a contribution mapped from 0 at 22°C to 0.4 at 34°C.
- Below 20 thirst, movement and mining slowdown thresholds apply; below 10, the stronger level applies. At zero, TFC applies one point of dehydration damage on its periodic check.
- Food and drink profiles contribute their own `water` value to thirst.

## Bedrock adaptation boundary

This module only models deterministic values and thresholds. It does not yet:

- connect exhaustion events to Player Dynamic Properties;
- read the actual ambient temperature from the Bedrock world;
- implement drinking interactions or freshwater/saltwater block detection;
- render a thirst HUD;
- apply effects or damage in the Bedrock runtime;
- persist or migrate player thirst state.

The runtime integration must use the same player state owner and event gating as the existing calendar entry point. Do not poll every player every tick. TFC applies low-thirst effects periodically (every 100 player ticks), outside Peaceful difficulty and when the player is not invulnerable.

## Verification

`tests/thirst-service.test.mjs` covers the source thresholds, temperature scaling,
exhaustion gating, water-value application, clamping, and boundary behavior.
These tests do not establish in-game API compatibility.
