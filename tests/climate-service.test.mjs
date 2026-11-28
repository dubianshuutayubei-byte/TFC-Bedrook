import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateTemperatureC,
  calculateAmbientTemperatureC,
  getSeasonName,
  evaluateCropClimate,
  evaluateFaunaHabitat,
  normalizeHydration,
  getBiomeClimateProfile,
  calculateTfcAverageGroundwater,
  adjustTfcAverageTemperatureForElevation,
  adjustTfcRainVarianceForHemisphere,
} from "../packs/behavior_pack/scripts/core/climate-service.mjs";

test("temperature follows season and elevation", () => {
  const winter = calculateTemperatureC({
    meanAnnualTempC: 10, seasonalAmplitudeC: 12, dayOfYear: 0,
  });
  const summer = calculateTemperatureC({
    meanAnnualTempC: 10, seasonalAmplitudeC: 12, dayOfYear: 48,
  });
  const highland = calculateTemperatureC({
    meanAnnualTempC: 10, seasonalAmplitudeC: 0, dayOfYear: 24, elevationM: 1000,
  });
  assert.equal(winter, -2);
  assert.equal(summer, 22);
  assert.equal(highland, 3.5);
});

test("crop climate distinguishes optimal, marginal and unsuitable", () => {
  const profile = {
    minTemperatureC: 5, maxTemperatureC: 25, temperatureWiggleC: 5,
    minHydration: 20, maxHydration: 80, hydrationWiggle: 0,
  };
  assert.equal(evaluateCropClimate(profile, { temperatureC: 15, hydration: 50 }).status, "optimal");
  assert.equal(evaluateCropClimate(profile, { temperatureC: 28, hydration: 50 }).status, "marginal");
  assert.equal(evaluateCropClimate(profile, { temperatureC: 31, hydration: 50 }).status, "unsuitable");
  assert.equal(evaluateCropClimate(profile, { temperatureC: 15, hydration: 90 }).status, "unsuitable");
});

test("fauna profile treats absent constraints as unconstrained", () => {
  assert.deepEqual(
    evaluateFaunaHabitat({}, { temperatureC: 12, rainfall: 300, belowSeaLevel: 0, brightness: 15 }),
    { suitable: true, failures: [] },
  );
});

test("fauna habitat reports all specified mismatches", () => {
  const result = evaluateFaunaHabitat(
    { minTemperatureC: 10, maxRainfall: 200, waterType: "fresh" },
    { temperatureC: 4, rainfall: 300, waterType: "salt" },
  );
  assert.deepEqual(result.failures, ["minTemperatureC", "maxRainfall", "waterType"]);
});

test("hydration is clamped to the normalized range", () => {
  assert.equal(normalizeHydration(-5), 0);
  assert.equal(normalizeHydration(45), 45);
  assert.equal(normalizeHydration(120), 100);
});

test("ambient temperature follows both season and day-night cycle", () => {
  const winterNight = calculateAmbientTemperatureC({
    meanAnnualTempC: 12, seasonalAmplitudeC: 14, dayOfYear: 0, timeOfDay: 0,
  });
  const winterNoon = calculateAmbientTemperatureC({
    meanAnnualTempC: 12, seasonalAmplitudeC: 14, dayOfYear: 0, timeOfDay: 12000,
  });
  const summerNoon = calculateAmbientTemperatureC({
    meanAnnualTempC: 12, seasonalAmplitudeC: 14, dayOfYear: 48, timeOfDay: 12000,
  });
  assert.equal(winterNight, -5);
  assert.equal(winterNoon, 1);
  assert.equal(summerNoon, 29);
  assert.throws(() => calculateAmbientTemperatureC({
    meanAnnualTempC: 12, dayOfYear: 0, timeOfDay: 25000,
  }), RangeError);
});

test("season labels align with day zero winter solstice", () => {
  assert.equal(getSeasonName(0), "冬");
  assert.equal(getSeasonName(24), "春");
  assert.equal(getSeasonName(48), "夏");
  assert.equal(getSeasonName(72), "秋");
  assert.equal(getSeasonName(96), "冬");
});

test("biome climate profiles distinguish tropical, arid and cold regions",()=>{
 assert.deepEqual(getBiomeClimateProfile("minecraft:jungle"),{meanAnnualTempC:24,seasonalAmplitudeC:8});
 assert.deepEqual(getBiomeClimateProfile("minecraft:desert"),{meanAnnualTempC:22,seasonalAmplitudeC:16});
 assert.deepEqual(getBiomeClimateProfile("minecraft:snowy_plains"),{meanAnnualTempC:-2,seasonalAmplitudeC:18});
 assert.deepEqual(getBiomeClimateProfile("minecraft:taiga"),{meanAnnualTempC:3,seasonalAmplitudeC:16});
 assert.deepEqual(getBiomeClimateProfile("minecraft:plains"),{meanAnnualTempC:12,seasonalAmplitudeC:14});
});

test("TFC 4.2.16 annual groundwater is capped base groundwater plus average rainfall", () => {
  assert.equal(calculateTfcAverageGroundwater(100, 250), 350);
  assert.equal(calculateTfcAverageGroundwater(400, 250), 500);
});

test("TFC 4.2.16 average temperature only cools above sea level", () => {
  assert.equal(adjustTfcAverageTemperatureForElevation(63, 12), 12);
  assert.equal(adjustTfcAverageTemperatureForElevation(73, 12), 12 - 10 * 0.16225);
  assert.equal(adjustTfcAverageTemperatureForElevation(200, 12), 12 - 17.822);
  assert.equal(adjustTfcAverageTemperatureForElevation(20, 12), 12);
});

test("TFC 4.2.16 rain variance flips by hemisphere unless absolute", () => {
  assert.equal(adjustTfcRainVarianceForHemisphere(-0.3, true), -0.3);
  assert.equal(adjustTfcRainVarianceForHemisphere(-0.3, false), 0.3);
  assert.equal(adjustTfcRainVarianceForHemisphere(-0.3, false, true), 0.3);
});
