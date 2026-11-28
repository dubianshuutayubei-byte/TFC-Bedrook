import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  evaluateCropOrPlantEnvironment,
  validateCropPlantDatabase,
} from "../packs/behavior_pack/scripts/core/crop-plant-service.mjs";

const database = JSON.parse(await readFile(
  new URL("../packs/behavior_pack/data/climate-profiles.json", import.meta.url),
  "utf8",
));

test("unified source database contains 23 crops and 20 wild plants", () => {
  assert.deepEqual(validateCropPlantDatabase(database), { cropCount: 23, plantCount: 20 });
});

test("crop temperature wiggle and hydration limits are applied", () => {
  assert.equal(
    evaluateCropOrPlantEnvironment(database, "crops", "maize", { temperatureC: 11, hydration: 80 }).status,
    "marginal",
  );
  assert.equal(
    evaluateCropOrPlantEnvironment(database, "crops", "maize", { temperatureC: 20, hydration: 70 }).status,
    "unsuitable",
  );
});

test("wild plant climate thresholds remain strict", () => {
  assert.equal(
    evaluateCropOrPlantEnvironment(database, "plants", "cloudberry_bush", { temperatureC: 17, hydration: 50 }).status,
    "optimal",
  );
  assert.equal(
    evaluateCropOrPlantEnvironment(database, "plants", "cloudberry_bush", { temperatureC: 17.1, hydration: 50 }).status,
    "unsuitable",
  );
});

test("invalid category and unknown IDs are reported without guessed defaults", () => {
  assert.equal(
    evaluateCropOrPlantEnvironment(database, "animals", "cow", { temperatureC: 20, hydration: 50 }).status,
    "unknown_profile",
  );
  assert.equal(
    evaluateCropOrPlantEnvironment(database, "plants", "made_up_tree", { temperatureC: 20, hydration: 50 }).status,
    "unknown_profile",
  );
});
