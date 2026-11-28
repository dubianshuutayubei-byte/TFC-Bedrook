import test from "node:test";
import assert from "node:assert/strict";
import { tfcMonthFromDay, evaluateFaunaSpawn } from "../packs/behavior_pack/scripts/core/fauna-service.mjs";

test("TFC calendar month conversion uses twelve eight-day months", () => {
  assert.equal(tfcMonthFromDay(0), "january");
  assert.equal(tfcMonthFromDay(8), "february");
  assert.equal(tfcMonthFromDay(95), "december");
  assert.equal(tfcMonthFromDay(96), "january");
});

test("seasonal fauna profiles require a matching month", () => {
  const profile = { chance: 1, placement: "no_restrictions", months: ["march"] };
  const valid = evaluateFaunaSpawn(profile, { month: "march" }, () => 0);
  const invalid = evaluateFaunaSpawn(profile, { month: "february" }, () => 0);
  const missing = evaluateFaunaSpawn(profile, {}, () => 0);
  assert.equal(valid.suitable, true);
  assert.deepEqual(invalid.failures, ["wrong_month"]);
  assert.deepEqual(missing.missing, ["month"]);
});
