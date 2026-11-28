import test from "node:test";
import assert from "node:assert/strict";
import {
  TFC_THIRST_DEFAULTS,
  normalizeThirst,
  getTemperatureThirstContribution,
  calculateExhaustionThirstLoss,
  applyExhaustionThirstLoss,
  applyWaterIntake,
  evaluateThirstEffects,
} from "../packs/behavior_pack/scripts/core/thirst-service.mjs";

test("TFC thirst defaults preserve the 0..100 scale and source modifier", () => {
  assert.equal(TFC_THIRST_DEFAULTS.maxThirst, 100);
  assert.equal(TFC_THIRST_DEFAULTS.thirstModifier, 5);
  assert.equal(normalizeThirst(-2), 0);
  assert.equal(normalizeThirst(120), 100);
});

test("temperature adds no thirst loss below 22 C and caps at 0.4 above 34 C", () => {
  assert.equal(getTemperatureThirstContribution(18), 0);
  assert.equal(getTemperatureThirstContribution(22), 0);
  assert.equal(getTemperatureThirstContribution(28), 0.2);
  assert.equal(getTemperatureThirstContribution(34), 0.4);
  assert.equal(getTemperatureThirstContribution(45), 0.4);
  assert.equal(getTemperatureThirstContribution(45, false), 0);
});

test("exhaustion thirst loss scales with temperature contribution", () => {
  assert.equal(calculateExhaustionThirstLoss(), 5);
  assert.equal(calculateExhaustionThirstLoss({ thirstModifier: 5, temperatureContribution: 0.4 }), 7);
});

test("thirst changes only when exhaustion reaches the source threshold", () => {
  assert.deepEqual(
    applyExhaustionThirstLoss({ thirst: 80, exhaustion: 3.99, temperatureC: 34 }),
    { thirst: 80, changed: false, loss: 0 },
  );
  assert.deepEqual(
    applyExhaustionThirstLoss({ thirst: 80, exhaustion: 4, temperatureC: 34 }),
    { thirst: 73, changed: true, loss: 7 },
  );
});

test("water values from data profiles add or remove thirst and clamp safely", () => {
  assert.deepEqual(applyWaterIntake(50, 20), { thirst: 70, change: 20 });
  assert.deepEqual(applyWaterIntake(50, -1), { thirst: 49, change: -1 });
  assert.deepEqual(applyWaterIntake(99, 10), { thirst: 100, change: 1 });
});

test("low-thirst effects use exact TFC threshold boundaries", () => {
  assert.equal(evaluateThirstEffects(20).level, "normal");
  assert.equal(evaluateThirstEffects(19.99).level, "low");
  assert.equal(evaluateThirstEffects(10).level, "low");
  assert.equal(evaluateThirstEffects(9.99).level, "critical");
  assert.equal(evaluateThirstEffects(0).dehydrationDamage, 1);
  assert.equal(evaluateThirstEffects(0.01).dehydrationDamage, 0);
});

test("invalid numeric inputs are rejected", () => {
  assert.throws(() => normalizeThirst(Number.NaN), TypeError);
  assert.throws(() => getTemperatureThirstContribution(20, true, { temperatureEndC: 20 }), RangeError);
  assert.throws(() => calculateExhaustionThirstLoss({ thirstModifier: -1 }), RangeError);
});
