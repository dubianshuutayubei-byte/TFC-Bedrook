import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const registry = JSON.parse(readFileSync(join(root, "packs/behavior_pack/data/fauna-species-registry.json"), "utf8"));
const roster = JSON.parse(readFileSync(join(root, "packs/behavior_pack/data/fauna-roster.json"), "utf8"));

test("unified fauna registry covers all 63 official species exactly once", () => {
  assert.equal(registry.total, 63);
  assert.equal(registry.species.length, 63);
  assert.equal(new Set(registry.species.map((species) => species.id)).size, 63);
  assert.deepEqual(registry.species.map((species) => species.id).sort(), roster.species.map((species) => species.id).sort());
});

test("every species has placement and an explicit implementation status", () => {
  for (const species of registry.species) {
    assert.ok(["on_ground", "in_water", "no_restrictions"].includes(species.spawn.placement), species.id);
    assert.ok(species.spawn.heightmap, species.id + " missing heightmap");
    assert.ok(["existing_runtime_adapter", "custom_entity_assets_required"].includes(species.entityImplementation), species.id);
    assert.ok(species.entityId.startsWith("minecraft:") || species.entityId.startsWith("tfc:"), species.id);
  }
});

test("registry honestly separates 23 runtime adapters from 40 custom-entity requirements", () => {
  assert.equal(registry.counts.runtimeAdapters, 23);
  assert.equal(registry.counts.customEntityAssetsRequired, 40);
  assert.equal(registry.species.filter((species) => species.entityImplementation === "existing_runtime_adapter").length, 23);
  assert.equal(registry.species.filter((species) => species.entityImplementation === "custom_entity_assets_required").length, 40);
});
