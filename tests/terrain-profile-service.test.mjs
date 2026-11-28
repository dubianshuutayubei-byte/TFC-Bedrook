import test from "node:test";
import assert from "node:assert/strict";
import { sampleTerrainProfile, classifyTerrainSample } from "../packs/behavior_pack/scripts/core/terrain-profile-service.mjs";

test("terrain profile sampling is deterministic for a fixed seed", () => {
  assert.deepEqual(sampleTerrainProfile(120, -340, { seed: 42 }), sampleTerrainProfile(120, -340, { seed: 42 }));
});

test("terrain sampler returns finite terrain fields in their expected ranges", () => {
  const sample = sampleTerrainProfile(0, 0);
  for (const key of ["elevation", "continentalness", "ruggedness", "detail", "valleyStrength", "riverStrength", "slopeProxy"]) {
    assert.ok(Number.isFinite(sample[key]), key);
  }
  for (const key of ["continentalness", "ruggedness", "valleyStrength", "riverStrength", "slopeProxy"]) {
    assert.ok(sample[key] >= 0 && sample[key] <= 1, key);
  }
});

test("smooth noise changes continuously across adjacent world coordinates", () => {
  const a = sampleTerrainProfile(320, 640, { seed: 7 });
  const b = sampleTerrainProfile(321, 640, { seed: 7 });
  assert.ok(Math.abs(a.elevation - b.elevation) < 2.5);
});

test("terrain sample classification returns a supported landform", () => {
  const sample = sampleTerrainProfile(10, 10);
  assert.ok(["ocean", "coast", "river", "valley", "mountain", "highlands", "hills", "plains"].includes(classifyTerrainSample(sample)));
});
