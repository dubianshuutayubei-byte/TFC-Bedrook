import test from "node:test";
import assert from "node:assert/strict";
import {
  advanceAnimalLifecycle,
  initializeAnimalLifeStage,
  createAnimalState,
  createEggState,
  advanceEggIncubation,
  evaluatePredation
} from "../packs/behavior_pack/scripts/core/fauna-service.mjs";

test("shared lifecycle advances juvenile to adult to old and records death cause", () => {
  const juvenile = createAnimalState({ ageDays: 2, lifeStage: "juvenile", health: 100 });
  const adult = advanceAnimalLifecycle(juvenile, 3, { adultDays: 4, oldAgeDays: 20, lifespanDays: 30 }).animal;
  assert.equal(adult.lifeStage, "adult");
  const old = advanceAnimalLifecycle(adult, 18, { adultDays: 4, oldAgeDays: 20, lifespanDays: 30 }).animal;
  assert.equal(old.lifeStage, "old");
  const dead = advanceAnimalLifecycle(old, 12, { adultDays: 4, oldAgeDays: 20, lifespanDays: 30 }).animal;
  assert.equal(dead.dead, true);
  assert.equal(dead.lifeStage, "dead");
  assert.equal(dead.deathCause, "old_age");
});

test("dead animals do not continue aging or lose health", () => {
  const dead = createAnimalState({ dead: true, deathCause: "old_age", ageDays: 50, health: 0 });
  const result = advanceAnimalLifecycle(dead, 20);
  assert.equal(result.died, true);
  assert.equal(result.animal.ageDays, 50);
  assert.equal(initializeAnimalLifeStage(result.animal).lifeStage, "dead");
});

test("fertilized chicken egg incubates only in the viable temperature range", () => {
  const egg = createEggState({ species: "chicken", fertilized: true, requiredDays: 8, temperatureC: 37 });
  const halfway = advanceEggIncubation(egg, 4);
  assert.equal(halfway.ready, false);
  assert.equal(halfway.egg.incubationDays, 4);
  const hatched = advanceEggIncubation(halfway.egg, 4);
  assert.equal(hatched.ready, true);
  assert.equal(hatched.egg.hatched, true);
});

test("unfertilized eggs never hatch and cold eggs lose viability", () => {
  const unfertilized = advanceEggIncubation({ fertilized: false }, 20);
  assert.equal(unfertilized.ready, false);
  const cold = advanceEggIncubation({ fertilized: true, temperatureC: 5, viability: 10 }, 2);
  assert.equal(cold.egg.spoiled, true);
});

test("predator diet, hunger and herd defense gate hunting", () => {
  const predator = createAnimalState({ hunger: 80, health: 100 });
  const prey = createAnimalState({ hunger: 20, health: 100, lifeStage: "adult" });
  const possible = evaluatePredation(predator, prey, { predatorDiet: ["deer"], preySpecies: "deer" });
  assert.equal(possible.eligible, true);
  const protectedHerd = evaluatePredation(predator, prey, { predatorDiet: ["deer"], preySpecies: "deer", herdDefense: 1 });
  assert.equal(protectedHerd.eligible, false);
  const notHungry = evaluatePredation({ hunger: 10 }, prey, { predatorDiet: ["deer"], preySpecies: "deer" });
  assert.equal(notHungry.eligible, false);
});
