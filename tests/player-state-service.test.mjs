import test from "node:test";
import assert from "node:assert/strict";
import {
  changeNutrition,
  deserializePlayerState,
  normalizePlayerState,
  serializePlayerState,
  setHydration,
} from "../packs/behavior_pack/scripts/core/player-state-service.mjs";

test("creates safe defaults for a new player", () => {
  const result = deserializePlayerState(undefined);
  assert.equal(result.state.hydration, 100);
  assert.equal(result.state.nutrition.grain, 0);
  assert.equal(result.needsSave, true);
});

test("clamps out-of-range values and repairs malformed categories", () => {
  const state = normalizePlayerState({
    version: 1,
    hydration: 150,
    nutrition: { grain: -5, fruit: 44, vegetables: "bad", protein: 120 },
  });
  assert.equal(state.hydration, 100);
  assert.equal(state.nutrition.grain, 0);
  assert.equal(state.nutrition.fruit, 44);
  assert.equal(state.nutrition.vegetables, 0);
  assert.equal(state.nutrition.protein, 100);
  assert.equal(state.nutrition.dairy, 0);
});

test("round-trips the versioned player state", () => {
  const state = normalizePlayerState({
    hydration: 63,
    nutrition: { grain: 20, fruit: 10, vegetables: 30, protein: 40, dairy: 50 },
  });
  const loaded = deserializePlayerState(serializePlayerState(state));
  assert.deepEqual(loaded.state, state);
  assert.equal(loaded.needsSave, false);
});

test("repairs invalid JSON without throwing", () => {
  const loaded = deserializePlayerState("{broken");
  assert.equal(loaded.state.hydration, 100);
  assert.equal(loaded.needsSave, true);
});

test("updates hydration and nutrition with bounds", () => {
  const state = normalizePlayerState({});
  assert.equal(setHydration(state, -20).hydration, 0);
  assert.equal(changeNutrition(state, "grain", 25).nutrition.grain, 25);
  assert.equal(changeNutrition(state, "grain", 500).nutrition.grain, 100);
  assert.throws(() => changeNutrition(state, "unknown", 1), RangeError);
});
