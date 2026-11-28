import test from "node:test";
import assert from "node:assert/strict";
import { createPlayerState, applyHydration, applyNutrition, advancePlayerNeeds, serializePlayerState, deserializePlayerState } from "../packs/behavior_pack/scripts/core/player-state-service.mjs";

test("player state clamps values and fills defaults", () => {
  const state = createPlayerState({ hydration: 140, nutrition: { grain: -5 } });
  assert.equal(state.hydration, 100);
  assert.equal(state.nutrition.grain, 0);
  assert.equal(state.nutrition.fruit, 0);
});

test("hydration and nutrition changes are immutable", () => {
  const initial = createPlayerState();
  const hydrated = applyHydration(initial, -10);
  const fed = applyNutrition(hydrated, "grain", 20);
  assert.equal(initial.hydration, 100);
  assert.equal(hydrated.hydration, 90);
  assert.equal(fed.nutrition.grain, 20);
});

test("needs decay proportionally to active game ticks", () => {
  const next = advancePlayerNeeds(createPlayerState({ hydration: 100, nutrition: { grain: 50 } }), 12000, 12000);
  assert.equal(next.hydration, 91);
  assert.equal(next.nutrition.grain, 48.8);
  assert.equal(next.lastUpdated, 12000);
});

test("invalid or negative elapsed time does not increase needs", () => {
  const state = createPlayerState({ hydration: 50, lastUpdated: 200 });
  const next = advancePlayerNeeds(state, -100, 250);
  assert.equal(next.hydration, 50);
  assert.equal(next.lastUpdated, 250);
});

test("serialized state survives roundtrip and invalid data resets", () => {
  const state = createPlayerState({ hydration: 63, nutrition: { protein: 22 }, lastUpdated: 900 });
  assert.deepEqual(deserializePlayerState(serializePlayerState(state)), state);
  assert.equal(deserializePlayerState("bad json").hydration, 100);
});
