import test from "node:test";
import assert from "node:assert/strict";
import { sampleTerrainProfile, classifyTerrainSample } from "../packs/behavior_pack/scripts/core/terrain-profile-service.mjs";

test("terrain profile sampling is deterministic for a fixed seed", () => {
  assert.deepEqual(sampleTerrainProfile(120, -340, { seed: 42 }), sampleTerrainProfile(120, -340, { seed: 42 }));
});
test("terrain sampler returns finite elevation and slope proxy", () => {
  const sample = sampleTerrainProfile(0, 0);
  assert.ok(Number.isFinite(sample.elevation));
  assert.ok(sample.slopeProxy >= 0 && sample.slopeProxy <= 1);
});
test("terrain sample classification returns a supported landform", () => {
  const sample = sampleTerrainProfile(10, 10);
  assert.ok(["ocean", "coast", "mountain", "highlands", "hills", "plains"].includes(classifyTerrainSample(sample)));
});
