import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  FAUNA_ECOLOGY,
  getFaunaPrey,
  getFaunaPredators,
  isFaunaPredatorOf,
  isFaunaThreatenedBy
} from "../packs/behavior_pack/scripts/core/fauna-ecology-service.mjs";

const roster = JSON.parse(readFileSync(new URL("../packs/behavior_pack/data/fauna-roster.json", import.meta.url), "utf8"));
const speciesIds = new Set(roster.species.map((entry) => typeof entry === "string" ? entry : entry.id));

test("predator and prey profiles only reference official TFC species", () => {
  for (const [predator, profile] of Object.entries(FAUNA_ECOLOGY)) {
    assert.ok(speciesIds.has(predator), `Unknown predator species: ${predator}`);
    assert.ok(Array.isArray(profile.prey), `Missing prey list for ${predator}`);
    assert.equal(new Set(profile.prey).size, profile.prey.length, `Duplicate prey in ${predator}`);
    for (const prey of profile.prey) {
      assert.ok(speciesIds.has(prey), `Unknown prey species ${prey} in ${predator}`);
      assert.notEqual(prey, predator, `${predator} cannot prey on itself`);
    }
  }
});

test("predator queries and reverse threat queries agree", () => {
  for (const [predator, profile] of Object.entries(FAUNA_ECOLOGY)) {
    for (const prey of profile.prey) {
      assert.equal(isFaunaPredatorOf(predator, prey), true);
      assert.equal(isFaunaThreatenedBy(prey, predator), true);
      assert.ok(getFaunaPredators(prey).includes(predator));
      assert.ok(getFaunaPrey(predator).includes(prey));
    }
  }
});

test("unknown species safely return no predator-prey relationships", () => {
  assert.deepEqual(getFaunaPrey("not_a_tfc_species"), []);
  assert.deepEqual(getFaunaPredators("not_a_tfc_species"), []);
  assert.equal(isFaunaPredatorOf("not_a_tfc_species", "deer"), false);
  assert.equal(isFaunaThreatenedBy("deer", "not_a_tfc_species"), false);
});

test("every predator and prey species resolves to an actual runtime entity profile", async () => {
  const { readFileSync } = await import("node:fs");
  const runtime = readFileSync(new URL("../packs/behavior_pack/scripts/gameplay-runtime.js", import.meta.url), "utf8");
  const profileBlock = runtime.match(/const ANIMAL_PROFILES\s*=\s*\{([\s\S]*?)\n\};/);
  assert.ok(profileBlock, "ANIMAL_PROFILES runtime table must exist");
  const runtimeSpecies = new Set(
    profileBlock[1].split("\n").map((line) => line.match(/speciesId"?\s*:\s*"([^"]+)"/)?.[1]).filter(Boolean)
  );
  for (const [predator, profile] of Object.entries(FAUNA_ECOLOGY)) {
    assert.ok(runtimeSpecies.has(predator), `Predator ${predator} must resolve to a runtime entity`);
    for (const prey of profile.prey) {
      assert.ok(runtimeSpecies.has(prey), `Prey ${prey} from ${predator} must resolve to a runtime entity`);
    }
  }
});

test("runtime predation uses bounded local targeting and real entity interactions", async () => {
  const { readFileSync } = await import("node:fs");
  const runtime = readFileSync(new URL("../packs/behavior_pack/scripts/gameplay-runtime.js", import.meta.url), "utf8");
  const start = runtime.indexOf("function runFaunaPredatorPreyInteraction");
  const end = runtime.indexOf("\nfunction animalTick", start);
  assert.ok(start >= 0 && end > start, "predator-prey runtime interaction must be present");
  const implementation = runtime.slice(start, end);
  assert.match(implementation, /getFaunaPrey\(species\)/);
  assert.match(implementation, /getFaunaPredators\(species\)/);
  assert.match(implementation, /maxDistance:1\.8/);
  assert.match(implementation, /maxDistance:5/);
  assert.match(implementation, /target\.applyDamage\(3\)/);
  assert.match(implementation, /entity\.applyKnockback/);
  assert.match(implementation, /tfc:ecology_action_at/);
});
