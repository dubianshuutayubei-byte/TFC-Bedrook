import test from "node:test";
import assert from "node:assert/strict";
import { elapsedGameHours, shouldRunInterval } from "../packs/behavior_pack/scripts/core/state-clock.mjs";

test("elapsed game hours never becomes negative", () => {
  assert.equal(elapsedGameHours(100, 2100, 1000), 2);
  assert.equal(elapsedGameHours(2100, 100, 1000), 0);
});
test("interval scheduler waits until interval elapsed", () => {
  assert.equal(shouldRunInterval(99, 100, 0), false);
  assert.equal(shouldRunInterval(100, 100, 0), true);
});
