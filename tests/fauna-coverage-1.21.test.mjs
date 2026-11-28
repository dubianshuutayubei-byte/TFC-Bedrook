import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { OFFICIAL_FAUNA_HABITATS_1_21 } from "../packs/behavior_pack/scripts/core/official-fauna-habitat-profiles.mjs";
import { OFFICIAL_LIVESTOCK_LIFECYCLE } from "../packs/behavior_pack/scripts/core/official-livestock-lifecycle.mjs";

const runtime = readFileSync(
  new URL("../packs/behavior_pack/scripts/gameplay-runtime.js", import.meta.url),
  "utf8"
);
const start = runtime.indexOf("const ANIMAL_PROFILES={");
const end = runtime.indexOf("\n};", start);
assert.ok(start >= 0 && end > start, "ANIMAL_PROFILES declaration must exist");
const profileSource = runtime.slice(start, end);
const entries = [...profileSource.matchAll(
  /^\s*"([^"]+)":\s*\{([\s\S]*?)(?=^\s*"[^"]+":\s*\{|$)/gm
)].map((match) => ({ entityId: match[1], body: match[2] }));

function speciesOf(profile) {
  const explicit = profile.body.match(/["']?speciesId["']?\s*:\s*["']([^"']+)["']/);
  return explicit?.[1] ?? profile.entityId.replace(/^(?:tfc|minecraft):/, "");
}

function profileFor(species) {
  return entries.find((entry) => speciesOf(entry) === species);
}

test("every official TFC 1.21 fauna habitat profile is connected to a runtime entity profile", () => {
  const missing = Object.keys(OFFICIAL_FAUNA_HABITATS_1_21).filter(
    (species) => !profileFor(species)
  );
  assert.deepEqual(missing, []);
});

test("all official livestock lifecycle species are connected to runtime profiles", () => {
  const missing = Object.keys(OFFICIAL_LIVESTOCK_LIFECYCLE).filter(
    (species) => !profileFor(species)
  );
  assert.deepEqual(missing, []);
});

test("all livestock maturity and use limits reference the official lifecycle table", () => {
  for (const [species, lifecycle] of Object.entries(OFFICIAL_LIVESTOCK_LIFECYCLE)) {
    const profile = profileFor(species);
    assert.ok(profile, species + " runtime profile");
    assert.ok(
      profile.body.includes("OFFICIAL_LIVESTOCK_LIFECYCLE." + species + ".adultAgeDays"),
      species + " maturity must use the official lifecycle value"
    );
    assert.ok(
      profile.body.includes("OFFICIAL_LIVESTOCK_LIFECYCLE." + species + ".maxUses"),
      species + " use limit must use the official lifecycle value"
    );
    if (lifecycle.gestationDays !== undefined && species !== "mule") {
      assert.ok(
        profile.body.includes("OFFICIAL_LIVESTOCK_LIFECYCLE." + species + ".gestationDays"),
        species + " gestation must use the official lifecycle value"
      );
    }
  }
});

test("chicken, duck and quail incubation periods use official lifecycle settings", () => {
  for (const species of ["chicken", "duck", "quail"]) {
    const profile = profileFor(species);
    assert.ok(profile, species + " runtime profile");
    assert.ok(profile.body.includes('eggSpecies:"' + species + '"') || profile.body.includes('"eggSpecies":"' + species + '"'));
    assert.ok(
      profile.body.includes("OFFICIAL_LIVESTOCK_LIFECYCLE." + species + ".eggLayCooldownDays"),
      species + " egg interval must use the official lifecycle value"
    );
    assert.ok(
      profile.body.includes("OFFICIAL_LIVESTOCK_LIFECYCLE." + species + ".hatchDays"),
      species + " incubation must use the official lifecycle value"
    );
  }
});

test("juvenile maturity transitions are profile-driven, not a manually maintained entity allowlist", () => {
  assert.match(
    runtime,
    /if\(state\.lifeStage==="juvenile"&&profile\.adultAgeDays!=null&&state\.ageDays>=profile\.adultAgeDays\)/
  );
  assert.doesNotMatch(runtime, /\["tfc:deer","tfc:chicken","tfc:duck"/);
});
