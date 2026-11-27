import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  validateFuelDatabase, validateItemHeatDatabase, energyRequired,
  temperatureAfterEnergy, evaluateMetalWorkState
} from "../packs/behavior_pack/scripts/core/heat-service.mjs";

const fuels = JSON.parse(await readFile(new URL("../packs/behavior_pack/data/fuels.json", import.meta.url)));
const profiles = JSON.parse(await readFile(new URL("../packs/behavior_pack/data/item-heat-profiles.json", import.meta.url)));
const metals = JSON.parse(await readFile(new URL("../packs/behavior_pack/data/metals.json", import.meta.url)));
const metalIds = new Set(metals.metals.map(m => m.id));

test("official reference fuel and heat profile data validate", () => {
  assert.equal(validateFuelDatabase(fuels).fuelCount, 4);
  assert.equal(validateItemHeatDatabase(profiles, metalIds).profileCount, 4);
});

test("energy required follows documented heat capacity", () => {
  const copper = profiles.profiles.find(p => p.id === "copper_ingot");
  assert.equal(energyRequired(copper, 20, 120), 285.7);
  assert.equal(energyRequired(copper, 120, 20), 0);
});

test("supplied energy changes idealized temperature without heat loss", () => {
  const copper = profiles.profiles.find(p => p.id === "copper_ingot");
  assert.equal(temperatureAfterEnergy(copper, 20, 285.7), 120);
});

test("work, weld and melt thresholds are independent", () => {
  const steel = profiles.profiles.find(p => p.id === "steel_ingot");
  const metal = metals.metals.find(m => m.id === "steel");
  const state = evaluateMetalWorkState(steel, metal, 1300);
  assert.equal(state.canWork, true);
  assert.equal(state.canWeld, true);
  assert.equal(state.canMelt, false);
});

test("invalid heat capacities and negative energy are rejected", () => {
  const profile = { heatCapacity: 0 };
  assert.throws(() => energyRequired(profile, 20, 100), RangeError);
  assert.throws(() => temperatureAfterEnergy({ heatCapacity: 1 }, 20, -1), RangeError);
});
