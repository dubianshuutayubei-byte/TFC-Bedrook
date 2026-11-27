import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  validateMetalDatabase, validateAlloyDatabase, findMatchingAlloys, getMetalTier
} from "../packs/behavior_pack/scripts/core/metal-service.mjs";

const metals = JSON.parse(await readFile(new URL("../packs/behavior_pack/data/metals.json", import.meta.url)));
const alloys = JSON.parse(await readFile(new URL("../packs/behavior_pack/data/alloys.json", import.meta.url)));
const ids = new Set(metals.metals.map(m => m.id));

test("source metal and alloy databases validate", () => {
  assert.equal(validateMetalDatabase(metals).metalCount, 28);
  assert.equal(validateAlloyDatabase(alloys, ids).alloyCount, 9);
});

test("bronze accepts valid copper/tin ratios", () => {
  assert.deepEqual(findMatchingAlloys({ copper: 90, tin: 10 }, alloys), ["bronze"]);
});

test("bronze rejects ratios outside source ranges", () => {
  assert.deepEqual(findMatchingAlloys({ copper: 80, tin: 20 }, alloys), []);
});

test("alloy matching rejects undeclared contamination", () => {
  assert.deepEqual(findMatchingAlloys({ copper: 90, tin: 10, gold: 1 }, alloys), []);
});

test("multi-component alloy checks every component", () => {
  assert.deepEqual(findMatchingAlloys({
    copper: 60, zinc: 25, bismuth: 15
  }, alloys), ["bismuth_bronze"]);
});

test("metal tier is independent from melting point", () => {
  assert.equal(getMetalTier(metals, "black_steel"), 5);
  assert.equal(getMetalTier(metals, "tin"), 1);
  assert.equal(getMetalTier(metals, "not_a_metal"), null);
});

test("zero total input has no recipe", () => {
  assert.deepEqual(findMatchingAlloys({ copper: 0, tin: 0 }, alloys), []);
});
