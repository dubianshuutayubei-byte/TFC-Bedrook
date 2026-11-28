import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { FAUNA_ECOLOGY, getFaunaPrey } from "../packs/behavior_pack/scripts/core/fauna-ecology-service.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (path) => JSON.parse(readFileSync(join(root, path), "utf8"));

test("all 16 official TFC freshwater fish have a Bedrock capture/release path", () => {
  const catalog = readJson("packs/behavior_pack/data/official-freshwater-fish-profiles-1.21.1-4.2.16.json");
  assert.equal(catalog.count, 16);
  assert.equal(catalog.entries.length, 16);

  for (const profile of catalog.entries) {
    if (profile.id === "salmon") {
      // Salmon intentionally uses the vanilla entity and its native bucket interaction.
      assert.equal(existsSync(join(root, "packs/behavior_pack/entities/salmon.json")), false);
      continue;
    }

    const entity = readJson(`packs/behavior_pack/entities/${profile.id}.json` )["minecraft:entity"];
    const components = entity.components ?? {};
    assert.deepEqual(components["minecraft:bucketable"], {}, profile.id + " must support bucket pickup");
    assert.ok(components["minecraft:movement.swim"], profile.id + " must swim");
    assert.ok(components["minecraft:navigation.swim"], profile.id + " must use swim navigation");
    assert.equal(components["minecraft:breathable"]?.breathes_water, true, profile.id + " must breathe water");
    assert.ok((components["minecraft:type_family"]?.family ?? []).includes("tfc_aquatic"));
  }
});

test("all 15 custom freshwater fish spawn underwater as water animals", () => {
  const catalog = readJson("packs/behavior_pack/data/official-freshwater-fish-profiles-1.21.1-4.2.16.json");
  for (const profile of catalog.entries.filter(entry => entry.id !== "salmon")) {
    const rule = readJson(`packs/behavior_pack/spawn_rules/${profile.id}.json`)["minecraft:spawn_rules"];
    assert.equal(rule.description.identifier, profile.identifier);
    assert.equal(rule.description.population_control, "water_animal");
    assert.ok(rule.conditions.some(condition => Object.hasOwn(condition, "minecraft:spawns_underwater")),
      profile.id + " must spawn underwater");
  }
});

test("aquatic predator relationships only reference registered freshwater fish or vanilla aquatic prey", () => {
  const catalog = readJson("packs/behavior_pack/data/official-freshwater-fish-profiles-1.21.1-4.2.16.json");
  const fishIds = new Set(catalog.entries.map(entry => entry.id));
  for (const predator of ["leopard_seal", "black_bear", "grizzly_bear", "polar_bear", "crocodile", "orca"]) {
    for (const prey of getFaunaPrey(predator)) {
      assert.ok(
        fishIds.has(prey) || ["cod", "salmon", "pufferfish", "tropical_fish", "squid"].includes(prey),
        predator + " has an unknown aquatic prey reference: " + prey
      );
    }
  }
  assert.ok(FAUNA_ECOLOGY.leopard_seal.prey.includes("northern_pike"));
});

test("freshwater fish capture audit does not claim unverified entity-data retention", () => {
  const coverage = readJson("packs/behavior_pack/data/fauna-runtime-coverage.json");
  assert.match(coverage.caveat, /real in-game capture\/placement and individual data retention remain unverified/i);
});
