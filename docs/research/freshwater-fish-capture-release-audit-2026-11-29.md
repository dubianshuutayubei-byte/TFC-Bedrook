# Freshwater fish capture, release and ecology audit

Baseline: TerraFirmaCraft Java 1.21.1-4.2.16 (v4.2.16), shared freshwater fish behavior audited from `Fish.java` and `FreshwaterFish.java`.

## Current Bedrock implementation

- The 15 custom freshwater fish entities have `minecraft:bucketable`, water breathing, swim movement and swim navigation. The engine-provided bucket interaction is the capture/release path; no duplicate scripted bucket system is added.
- Salmon intentionally remains the vanilla Bedrock entity and is not duplicated as `tfc:salmon`.
- All 15 custom freshwater fish have underwater spawn rules in the `water_animal` population.
- The official 16-species Java freshwater-fish inventory remains the source-of-truth list.
- Existing fauna ecology data includes fish prey for the audited aquatic/semi-aquatic predators.

## Verification boundary

Automated checks can confirm entity components, spawn-rule registration and prey identifiers. They cannot prove that Bedrock actually captures and places every custom entity correctly on a live device, nor that custom names or any future individual fish attributes survive the bucket round-trip. That remains an in-game test requirement.

No species-specific fish bucket items or scripted inventory mutation are introduced: native bucketable behavior avoids a second, competing capture system. No fish size, sex, breeding or population-recovery behavior is claimed unless supported by the pinned Java source and separately implemented.

## Validation

Run `npm test` / the repository's GitHub Actions workflow. The dedicated test file is `tests/freshwater-fish-capture-release.test.mjs`.
