import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { evaluateCropEnvironment, validateCropClimateDatabase } from "../packs/behavior_pack/scripts/core/crop-service.mjs";

const database = JSON.parse(await readFile(new URL("../packs/behavior_pack/data/crop-climate-profiles.json", import.meta.url)));

test("all 23 source crop climate profiles validate", () => {
  assert.deepEqual(validateCropClimateDatabase(database), { cropCount: 23 });
});

test("crop evaluation uses source temperature and hydration ranges", () => {
  assert.equal(evaluateCropEnvironment(database, "maize", { temperatureC: 25, hydration: 80 }).status, "optimal");
  assert.equal(evaluateCropEnvironment(database, "maize", { temperatureC: 11, hydration: 80 }).status, "marginal");
  assert.equal(evaluateCropEnvironment(database, "maize", { temperatureC: 7, hydration: 80 }).status, "unsuitable");
  assert.equal(evaluateCropEnvironment(database, "garlic", { temperatureC: -18, hydration: 30 }).status, "optimal");
});

test("unknown crop ids fail closed without inventing a profile", () => {
  assert.deepEqual(
    evaluateCropEnvironment(database, "not_a_crop", { temperatureC: 20, hydration: 50 }),
    { status: "unknown_crop", reasons: ["crop_not_found"] },
  );
});

test("database validation rejects duplicate ids and invalid ranges", () => {
  assert.throws(() => validateCropClimateDatabase({ crops: [database.crops[0], database.crops[0]] }), /duplicate crop id/);
  const invalid = structuredClone(database);
  invalid.crops[0].maxHydration = 101;
  assert.throws(() => validateCropClimateDatabase(invalid), /hydration must stay/);
});
