import test from "node:test";
import assert from "node:assert/strict";
import { createSoilState, evaluateCropGrowth, applyNutrientUptake, applyFertilizer, advanceCropStage } from "../packs/behavior_pack/scripts/core/agriculture-service.mjs";

const wheat = { minTemperatureC: 5, maxTemperatureC: 30, minHydration: 25, maxHydration: 100, preferredNutrient: "nitrogen", minPreferredNutrient: 10, optimalNutrient: 60 };
test("soil state is normalized", () => assert.equal(createSoilState({ hydration: 200 }).hydration, 100));
test("crop growth requires climate and nutrient conditions", () => {
  assert.equal(evaluateCropGrowth(wheat, { temperatureC: 20 }, { hydration: 60, nitrogen: 60 }).suitable, true);
  assert.equal(evaluateCropGrowth(wheat, { temperatureC: 40 }, { hydration: 60, nitrogen: 60 }).suitable, false);
});
test("fertilizer and uptake change only selected nutrients", () => {
  const soil = applyNutrientUptake({ nitrogen: 50 }, "nitrogen", 10);
  assert.equal(soil.nitrogen, 40);
  assert.equal(applyFertilizer(soil, { phosphorus: 20 }).phosphorus, 70);
});
test("growth points advance stages with remainder", () => assert.deepEqual(advanceCropStage(1, 5, 240), { stage: 3, remainder: 40, mature: false }));
