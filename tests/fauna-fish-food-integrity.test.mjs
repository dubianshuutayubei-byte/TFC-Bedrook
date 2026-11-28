import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (path) => JSON.parse(readFileSync(join(root, path), "utf8"));
const runtime = readFileSync(join(root, "packs/behavior_pack/scripts/gameplay-runtime.js"), "utf8");

test("all custom Java freshwater fish support native bucket pickup and aquatic movement", () => {
  const fish = readJson("packs/behavior_pack/data/official-freshwater-fish-profiles-1.21.1-4.2.16.json");
  assert.equal(fish.entries.length, 16);
  const custom = fish.entries.filter((entry) => entry.id !== "salmon");
  assert.equal(custom.length, 15);
  for (const profile of custom) {
    const entity = readJson(`packs/behavior_pack/entities/${profile.id}.json`)[ "minecraft:entity" ];
    const components = entity.components ?? {};
    assert.deepEqual(components["minecraft:bucketable"], {}, profile.id + " must expose native bucket pickup");
    assert.ok(components["minecraft:movement.swim"], profile.id + " must use aquatic movement");
    assert.ok(components["minecraft:navigation.swim"], profile.id + " must use swim navigation");
    assert.equal(components["minecraft:breathable"]?.breathes_water, true, profile.id + " must breathe water");
    const family = components["minecraft:type_family"]?.family ?? [];
    assert.ok(family.includes("tfc_aquatic"), profile.id + " must be in the aquatic family");
  }
  assert.equal(existsSync(join(root, "packs/behavior_pack/entities/salmon.json")), false,
    "salmon is the vanilla adapter and must not be duplicated as a custom entity");
});

test("runtime food decay rates exactly match every registered food profile", () => {
  const database = readJson("packs/behavior_pack/data/food-profiles.json");
  const source = runtime.match(/const FOOD_DECAY_PROFILES\s*=\s*\{([\s\S]*?)\};/);
  assert.ok(source, "runtime food decay table is missing");
  const rates = Object.fromEntries(
    [...source[1].matchAll(/"([^"]+)"\s*:\s*([0-9.]+)/g)].map((match) => [match[1], Number(match[2])])
  );
  const itemId = (id) => "tfc:" + (id === "milk" ? "milk_bottle" : id);
  for (const food of database.foods) {
    const id = itemId(food.id);
    assert.equal(rates[id], food.baseDecayPerHour, id + " runtime decay rate must match food profile");
  }
  assert.equal(Object.keys(rates).length, database.foods.length,
    "runtime decay table must not contain untracked food entries");
});

test("every official 1.21.x livestock lifecycle entry has a runtime species profile", () => {
  const lifecycle = readJson("packs/behavior_pack/data/official-animal-lifecycle.json");
  for (const species of lifecycle.species) {
    const hasProfile = runtime.includes('speciesId:"' + species.id + '"') ||
      runtime.includes('"speciesId":"' + species.id + '"');
    assert.equal(hasProfile, true, species.id + " lifecycle data must be connected to an entity runtime profile");
  }
});

test("the 78-species fauna coverage stays explicitly separate from terrain completion", () => {
  const coverage = readJson("packs/behavior_pack/data/fauna-runtime-coverage.json");
  assert.equal(coverage.officialJavaSpeciesCount, 78);
  assert.equal(coverage.runtimeTrackedCount, 78);
  assert.equal(coverage.remainingSpeciesSpecificWork.length, coverage.remainingCount);
  assert.ok(coverage.remainingCount > 0,
    "species scaffolds must not be reported as full species-specific implementation");
  assert.match(coverage.caveat, /in-game testing remains outstanding/i);
});
