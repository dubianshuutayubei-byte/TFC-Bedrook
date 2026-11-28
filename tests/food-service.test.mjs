import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import { createFoodState, createFoodFromProfile, validateFoodDatabase, classifyFoodFreshness, advanceFoodDecay, preserveFood, consumeFood } from "../packs/behavior_pack/scripts/core/food-service.mjs";
import { createPlayerState } from "../packs/behavior_pack/scripts/core/player-state-service.mjs";

test("food freshness decays and spoiled food cannot be consumed", () => {
  const rotten = advanceFoodDecay({ freshness: 1 }, 20, { baseDecayPerHour: 1 });
  assert.equal(rotten.spoiled, true);
  assert.equal(consumeFood(createPlayerState(), rotten).consumed, false);
});
test("preservation slows decay and cannot revive spoiled food", () => {
  const fresh = createFoodState({ freshness: 100 });
  const salted = preserveFood(fresh, "salted");
  assert.ok(advanceFoodDecay(salted, 10).freshness > advanceFoodDecay(fresh, 10).freshness);
  assert.throws(() => preserveFood({ freshness: 0 }, "salted"), /Spoiled/);
});
test("consumption updates nutrition and hydration without exceeding limits", () => {
  const result = consumeFood(createPlayerState({ hydration: 95 }), { nutrition: { grain: 20 }, hydration: 10 });
  assert.equal(result.consumed, true);
  assert.equal(result.playerState.nutrition.grain, 20);
  assert.equal(result.playerState.hydration, 100);
});
test("food profile database validates ids and nutrition", () => {
  const db = { foods: [{ id: "apple", nutrition: { fruit: 12 }, hydration: 4 }] };
  assert.deepEqual(validateFoodDatabase(db), { foodCount: 1 });
  assert.equal(createFoodFromProfile(db.foods[0]).nutrition.fruit, 12);
  assert.throws(() => validateFoodDatabase({ foods: [{ id: "bad", nutrition: { magic: 10 } }] }), /unknown nutrition/);
});
test("freshness classes and invalid elapsed time are safe", () => {
  assert.equal(classifyFoodFreshness({ freshness: 80 }), "fresh");
  assert.equal(classifyFoodFreshness({ freshness: 55 }), "aging");
  assert.equal(classifyFoodFreshness({ freshness: 20 }), "near_spoilage");
  assert.equal(classifyFoodFreshness({ freshness: 0 }), "spoiled");
  assert.equal(advanceFoodDecay({ freshness: 70 }, Number.NaN).freshness, 70);
});

test("dried food profiles apply a recognized preservation multiplier", () => {
  const dried = createFoodFromProfile({ id: "dried_meat", freshness: 100, baseDecayPerHour: 1, preservation: "dried" });
  const ordinary = createFoodState({ id: "ordinary_meat", freshness: 100 });
  assert.equal(dried.preservation, "dried");
  assert.ok(advanceFoodDecay(dried, 10, { baseDecayPerHour: 1 }).freshness > advanceFoodDecay(ordinary, 10, { baseDecayPerHour: 1 }).freshness);
});

test("food profile validation rejects unknown preservation methods", () => {
  assert.throws(() => validateFoodDatabase({ foods: [{ id: "bad_food", preservation: "sun_magic" }] }), /unknown preservation/);
});

test("smoked meat uses a distinct preservation method from ordinary cooked food", () => {
  const smoked = createFoodFromProfile({ id: "smoked_meat", freshness: 100, baseDecayPerHour: 1, preservation: "smoked", cooked: true });
  const cooked = createFoodState({ id: "cooked_meat", freshness: 100, baseDecayPerHour: 1, preservation: "cooked", cooked: true });
  assert.equal(smoked.preservation, "smoked");
  assert.ok(advanceFoodDecay(smoked, 10, { baseDecayPerHour: 1 }).freshness > advanceFoodDecay(cooked, 10, { baseDecayPerHour: 1 }).freshness);
});

test("food database exposes a recognized smoked preservation profile", () => {
  const database = JSON.parse(readFileSync(new URL("../packs/behavior_pack/data/food-profiles.json", import.meta.url), "utf8"));
  assert.equal(validateFoodDatabase(database).foodCount, database.foods.length);
  assert.equal(database.foods.find(food => food.id === "smoked_meat").preservation, "smoked");
});
