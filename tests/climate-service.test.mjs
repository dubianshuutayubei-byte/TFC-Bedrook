import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateTemperatureC,
  evaluateCropClimate,
  evaluateFaunaHabitat,
  normalizeHydration,
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
