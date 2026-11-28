import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  getClimateProfile,
  validateClimateProfiles,
} from "../packs/behavior_pack/scripts/core/climate-service.mjs";

const data = JSON.parse(await readFile(
  new URL("../packs/behavior_pack/data/climate-profiles.json", import.meta.url),
  "utf8",
));

test("official crop and plant climate profiles pass validation", () => {
  assert.deepEqual(validateClimateProfiles(data), []);
  assert.equal(data.crops.length, 23);
  assert.equal(data.plants.length, 20);
});

test("source profile thresholds remain distinct by category", () => {
  assert.equal(getClimateProfile(data, "crops", "garlic").minTemperatureC, -20);
  assert.equal(getClimateProfile(data, "crops", "maize").minHydration, 75);
  assert.equal(getClimateProfile(data, "plants", "cloudberry_bush").minTemperatureC, -2);
  assert.equal(getClimateProfile(data, "plants", "orange_tree").maxTemperatureC, 43);
  assert.equal(getClimateProfile(data, "plants", "orange_tree").temperatureWiggleC, 0);
});

test("unknown climate profile IDs and categories are rejected", () => {
  assert.throws(() => getClimateProfile(data, "crops", "not_a_crop"), RangeError);
  assert.throws(() => getClimateProfile(data, "fauna", "cow"), RangeError);
});

test("duplicate IDs and invalid profile ranges are reported", () => {
  const broken = structuredClone(data);
  broken.crops.push(structuredClone(broken.crops[0]));
  broken.plants[0].minHydration = 120;
  assert.ok(validateClimateProfiles(broken).some(error => error.includes("duplicate crops id")));
  assert.ok(validateClimateProfiles(broken).some(error => error.includes("hydration must be within 0..100")));
});
