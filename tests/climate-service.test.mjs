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
