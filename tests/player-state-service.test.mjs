import test from "node:test";
import assert from "node:assert/strict";
import { createPlayerState, applyHydration, applyNutrition, serializePlayerState, deserializePlayerState } from "../packs/behavior_pack/scripts/core/player-state-service.mjs";

test("player state clamps values and fills defaults", () => {
  const state = createPlayerState({ hydration: 120, nutrition: { grain: -2 } });
  assert.equal(state.hydration, 100);
  assert.equal(state.nutrition.grain, 0);
  assert.equal(state.nutrition.protein, 0);
});
test("hydration and nutrition changes are immutable", () => {
  const initial = createPlayerState();
  const next = applyNutrition(applyHydration(initial, -20), "grain", 15);
  assert.equal(initial.hydration, 100);
  assert.equal(next.hydration, 80);
  assert.equal(next.nutrition.grain, 15);
});
test("serialized state survives roundtrip and invalid data resets", () => {
  const state = createPlayerState({ hydration: 44 });
  assert.deepEqual(deserializePlayerState(serializePlayerState(state)), state);
  assert.equal(deserializePlayerState("{").hydration, 100);
});
