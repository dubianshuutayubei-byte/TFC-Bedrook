import test from "node:test";
import assert from "node:assert/strict";
import { createFoodState, advanceFoodDecay, preserveFood, consumeFood } from "../packs/behavior_pack/scripts/core/food-service.mjs";
import { createPlayerState } from "../packs/behavior_pack/scripts/core/player-state-service.mjs";

test("food freshness decays and spoiled food cannot be consumed", () => {
  const rotten = advanceFoodDecay({ freshness: 1 }, 20, { baseDecayPerHour: 1 });
  assert.equal(rotten.spoiled, true);
  assert.equal(consumeFood(createPlayerState(), rotten).consumed, false);
});
test("preservation slows decay", () => {
  const fresh = createFoodState({ freshness: 100 });
  const salted = preserveFood(fresh, "salted");
  assert.ok(advanceFoodDecay(salted, 10).freshness > advanceFoodDecay(fresh, 10).freshness);
});
test("consumption updates nutrition and hydration", () => {
  const result = consumeFood(createPlayerState(), { nutrition: { grain: 20 }, hydration: 10 });
  assert.equal(result.consumed, true);
  assert.equal(result.playerState.nutrition.grain, 20);
  assert.equal(result.playerState.hydration, 100);
});
