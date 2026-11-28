import test from "node:test";
import assert from "node:assert/strict";
import { createSoilState, evaluateCropGrowth, applyNutrientUptake, applyFertilizer, advanceCropStage, advanceSoilHydration, calculateCropGrowthPoints, advanceSoilDay, applySoilCompost, inferSoilTypeFromBlockId, advanceCropGrowthProgress, applyCropNutrientEffects, getSoilFertilityMultiplier } from "../packs/behavior_pack/scripts/core/agriculture-service.mjs";

const wheat = { minTemperatureC: -7, maxTemperatureC: 22, minHydration: 15, maxHydration: 85, nutrientDemand: { nitrogen: 100 } };
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
test("rain replenishes soil and evaporation reduces it", () => {
  assert.equal(advanceSoilHydration({ hydration: 40 }, 4, { rainfallMm: 10, evaporationPerHour: 1 }).hydration, 46);
  assert.equal(advanceSoilHydration({ hydration: 40 }, 4, { evaporationPerHour: 1, shadeFactor: 0.5 }).hydration, 38);
});
test("growth points depend on elapsed time and suitable conditions", () => {
  const result = calculateCropGrowthPoints(wheat, { temperatureC: 20 }, { hydration: 60, nitrogen: 60 }, 10);
  assert.equal(result.suitable, true);
  assert.ok(result.growthPoints > 0);
  assert.equal(calculateCropGrowthPoints(wheat, { temperatureC: 40 }, { hydration: 60, nitrogen: 60 }, 10).growthPoints, 0);
});

test("soil loses moisture and nutrients over time but rainfall restores hydration",()=>{const next=advanceSoilDay({hydration:40,nitrogen:50},{rainfallMm:5,evaporation:2,nutrientLeaching:1});assert.equal(next.hydration,43);assert.equal(next.nitrogen,49);});
test("compost replenishes all three soil nutrients",()=>{const next=applySoilCompost({nitrogen:10,phosphorus:10,potassium:10});assert.equal(next.nitrogen,25);assert.equal(next.phosphorus,18);assert.equal(next.potassium,22);});

test("soil type inference maps common substrate blocks to TFC soil classes", () => {
  assert.equal(inferSoilTypeFromBlockId("minecraft:clay"), "clay");
  assert.equal(inferSoilTypeFromBlockId("minecraft:mud"), "silt");
  assert.equal(inferSoilTypeFromBlockId("minecraft:grass_block"), "loam");
  assert.equal(inferSoilTypeFromBlockId("minecraft:unknown"), "loam");
});

test("crop growth progress accumulates proportionally before advancing a stage", () => {
  const first = advanceCropGrowthProgress(0, 1);
  assert.deepEqual(first, { progress: 25, stageAdvanced: false });
  const second = advanceCropGrowthProgress(first.progress, 0.5);
  assert.deepEqual(second, { progress: 37.5, stageAdvanced: false });
  const final = advanceCropGrowthProgress(80, 1);
  assert.deepEqual(final, { progress: 5, stageAdvanced: true });
  assert.deepEqual(advanceCropGrowthProgress(20, 0), { progress: 20, stageAdvanced: false });
});

test("soil fertility classes scale fertilizer effectiveness only",()=>{
 const poor=applyFertilizer({fertilityClass:"oxisol",nitrogen:0},{nitrogen:10});
 const rich=applyFertilizer({fertilityClass:"mollisol",nitrogen:0},{nitrogen:10});
 assert.equal(poor.nitrogen,8);
 assert.equal(rich.nitrogen,12);
 assert.equal(getSoilFertilityMultiplier({fertilityClass:"entisol"}),1);
});

test("crop nutrient effects consume and replenish NPK by crop profile",()=>{
 const wheatSoil=applyCropNutrientEffects({nitrogen:50,phosphorus:50,potassium:50},{nitrogen:-2,phosphorus:1,potassium:1},1);
 assert.deepEqual([wheatSoil.nitrogen,wheatSoil.phosphorus,wheatSoil.potassium],[48,51,51]);
 const potatoSoil=applyCropNutrientEffects({nitrogen:50,phosphorus:50,potassium:50},{nitrogen:-1,phosphorus:-1,potassium:-1},1);
 assert.deepEqual([potatoSoil.nitrogen,potatoSoil.phosphorus,potatoSoil.potassium],[49,49,49]);
});
