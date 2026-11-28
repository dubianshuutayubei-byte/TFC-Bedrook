import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { evaluatePlantEnvironment, validatePlantClimateDatabase } from "../packs/behavior_pack/scripts/core/plant-service.mjs";

const database = JSON.parse(await readFile(new URL("../packs/behavior_pack/data/plant-climate-profiles.json", import.meta.url)));

test("all 20 source wild plant climate profiles validate", () => {
  assert.deepEqual(validatePlantClimateDatabase(database), { plantCount: 20 });
});

test("plant climate ranges are strict and have no wiggle allowance", () => {
  assert.equal(evaluatePlantEnvironment(database, "cloudberry_bush", { temperatureC: 0, hydration: 50 }).status, "optimal");
  assert.equal(evaluatePlantEnvironment(database, "cloudberry_bush", { temperatureC: 18, hydration: 50 }).status, "unsuitable");
  assert.equal(evaluatePlantEnvironment(database, "orange_tree", { temperatureC: 43, hydration: 30 }).status, "optimal");
});

test("unknown plant ids are not assigned guessed profiles", () => {
  assert.deepEqual(
    evaluatePlantEnvironment(database, "unknown_tree", { temperatureC: 20, hydration: 50 }),
    { status: "unknown_plant", reasons: ["plant_not_found"] },
  );
});
