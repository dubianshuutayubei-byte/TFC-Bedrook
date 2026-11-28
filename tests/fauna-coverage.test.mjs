import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const readJson = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const roster = readJson("../packs/behavior_pack/data/fauna-roster.json");
const coverage = readJson("../packs/behavior_pack/data/fauna-runtime-coverage.json");
const spawnProfiles = readJson("../packs/behavior_pack/data/official-fauna-spawn-profiles.json");

const ids = (entries) => entries.map((entry) => typeof entry === "string" ? entry : entry.id);

test("official TFC 1.21.1 fauna roster contains 78 unique species", () => {
  const speciesIds = ids(roster.species);
  assert.equal(roster.source.count, 78);
  assert.equal(speciesIds.length, 78);
  assert.equal(new Set(speciesIds).size, speciesIds.length);
});

test("all official fauna species have runtime tracking and spawn placement entries", () => {
  const officialIds = new Set(ids(roster.species));
  const runtimeIds = coverage.runtimeTrackedSpecies;
  const spawnIds = ids(spawnProfiles.species);

  assert.equal(coverage.officialJavaSpeciesCount, 78);
  assert.equal(coverage.runtimeTrackedCount, 78);
  assert.equal(coverage.implementedEntityCount, 78);
  assert.equal(coverage.missingOfficialSpecies.length, 0);
  assert.deepEqual(new Set(runtimeIds), officialIds);
  assert.deepEqual(new Set(spawnIds), officialIds);
  assert.equal(new Set(runtimeIds).size, runtimeIds.length);
  assert.equal(new Set(spawnIds).size, spawnIds.length);
});

test("official spawn placement counts match the 78-species roster", () => {
  const counts = spawnProfiles.placementCounts;
  assert.equal(spawnProfiles.total, 78);
  assert.equal(counts.on_ground, 48);
  assert.equal(counts.in_water, 29);
  assert.equal(counts.no_restrictions, 1);
  assert.equal(counts.on_ground + counts.in_water + counts.no_restrictions, 78);
  for (const entry of spawnProfiles.species) {
    assert.ok(["on_ground", "in_water", "no_restrictions"].includes(entry.placement), `Invalid placement for ${entry.id}`);
  }
});

test("species-specific work remains explicitly tracked instead of being marked complete", () => {
  const remaining = coverage.remainingSpeciesSpecificWork;
  assert.equal(remaining.length, coverage.remainingCount);
  assert.ok(remaining.length > 0, "Species-specific implementation must not be silently marked complete");
  assert.ok(coverage.requiresSpeciesImplementation.length > 0);
});
