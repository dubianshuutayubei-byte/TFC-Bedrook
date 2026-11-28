import test from "node:test";
import assert from "node:assert/strict";
import { validateRecipeDatabase, evaluateProcess, calculateProcessProgress } from "../packs/behavior_pack/scripts/core/processing-service.mjs";

const recipe = {
  id: "tfc:test_cast",
  stage: "copper",
  method: "casting",
  inputs: { "tfc:molten_copper": 100 },
  outputs: { "tfc:copper_ingot": 1 },
  minimumTemperatureC: 1080,
  requiresMold: true
};
test("recipe database validates IDs and positive quantities", () => {
  assert.deepEqual(validateRecipeDatabase({ recipes: [recipe] }), { recipeCount: 1 });
  assert.throws(() => validateRecipeDatabase({ recipes: [{ ...recipe, inputs: { x: 0 } }] }));
});
test("process evaluation checks inventory, mold and temperature", () => {
  assert.equal(evaluateProcess(recipe, { inventory: { "tfc:molten_copper": 100 }, moldAvailable: true, temperatureC: 1100 }).allowed, true);
  assert.deepEqual(evaluateProcess(recipe, { inventory: {}, moldAvailable: false, temperatureC: 900 }).failures, ["mold_required", "temperature_too_low", "missing_input:tfc:molten_copper"]);
});
test("process progress is bounded and reports completion", () => {
  assert.deepEqual(calculateProcessProgress(25, 100), { progress: 0.25, complete: false, remainingSeconds: 75 });
  assert.equal(calculateProcessProgress(120, 100).complete, true);
});
