import test from "node:test";
import assert from "node:assert/strict";
import { createAnimalState, evaluateHabitat, feedAnimal, advanceAnimalAge, canBreed } from "../packs/behavior_pack/scripts/core/fauna-service.mjs";

test("animal age and familiarity progress independently", () => {
  const animal = feedAnimal(advanceAnimalAge({ species: "cow", ageDays: 10 }, 5), 20);
  assert.equal(animal.ageDays, 15);
  assert.equal(animal.familiarity, 20);
});
test("habitat checks all configured requirements", () => {
  const result = evaluateHabitat({ minTemperatureC: 5, maxRainfall: 200 }, { temperatureC: 0, rainfall: 300 });
  assert.deepEqual(result.failures, ["temperature_low", "rainfall_high"]);
});
test("breeding requires adults, health, familiarity and opposite sex", () => {
  const profile = { adultAgeDays: 30, requiredFamiliarity: 20 };
  const a = createAnimalState({ species: "cow", sex: "male", ageDays: 40, familiarity: 30 });
  const b = createAnimalState({ species: "cow", sex: "female", ageDays: 35, familiarity: 30 });
  assert.equal(canBreed(a, b, profile), true);
  assert.equal(canBreed(a, { ...b, sex: "female", familiarity: 0 }, profile), false);
});
