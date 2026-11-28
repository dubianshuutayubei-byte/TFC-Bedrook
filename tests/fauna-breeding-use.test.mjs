import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  advanceAnimalFamiliarityDecay,
  canLayEgg,
  canProduce,
  recordBreedingUse,
  recordEggLaid,
  recordProduct
} from "../packs/behavior_pack/scripts/core/fauna-service.mjs";

const runtime = readFileSync(
  new URL("../packs/behavior_pack/scripts/gameplay-runtime.js", import.meta.url),
  "utf8"
);

test("TFC breeding adds five uses to the male parent only", () => {
  const male = recordBreedingUse(
    { species: "cow", sex: "male", uses: 10, oldDay: -1 },
    200,
    { maxUses: 128, useCost: 5, oldDayDelay: 2 }
  );
  assert.equal(male.uses, 15);
  assert.equal(male.oldDay, -1);
  assert.match(runtime, /state=started\.animal;other\.lastBreedAt=breedingTime;/);
  assert.match(runtime, /recordBreedingUse\(other,breedingTime/);
  assert.doesNotMatch(runtime, /recordBreedingUse\(started\.animal/);
});

test("reaching the uses-to-elderly threshold does not schedule old age", () => {
  const animal = recordBreedingUse(
    { species: "donkey", sex: "male", uses: 55, oldDay: -1 },
    200,
    { maxUses: 60, useCost: 5, oldDayDelay: 3 }
  );
  assert.equal(animal.uses, 60);
  assert.equal(animal.oldDay, -1);
});

test("exceeding the uses-to-elderly threshold schedules old age", () => {
  const animal = recordBreedingUse(
    { species: "donkey", sex: "male", uses: 60, oldDay: -1 },
    200,
    { maxUses: 60, useCost: 5, oldDayDelay: 3 }
  );
  assert.equal(animal.uses, 65);
  assert.equal(animal.oldDay, 203);
});

test("the exact use threshold still permits animal products before old age is scheduled", () => {
  const animal = { lifeStage: "adult", ageDays: 100, familiarity: 30, health: 100,
    hunger: 0, thirst: 0, uses: 60, oldDay: -1, lastProductAt: 0 };
  assert.equal(canProduce(animal, {
    requiredFamiliarity: 15, cooldownDays: 0, currentDay: 10,
    minimumAgeDays: 1, minimumHealth: 40, maxUses: 60
  }), true);
});

test("egg laying uses the same inclusive threshold rule", () => {
  const hen = { lifeStage: "adult", sex: "female", ageDays: 30, familiarity: 30,
    health: 100, hunger: 0, thirst: 0, uses: 100, oldDay: -1,
    lastFedDay: 10, lastEggAt: -1, isAlive: true };
  assert.equal(canLayEgg(hen, { currentDay: 10, maxUses: 100 }), true);
});

test("product and egg use counters schedule old age only after exceeding the limit", () => {
  const product = recordProduct(
    { uses: 60, oldDay: -1 }, 200, { maxUses: 60, oldDayDelay: 2 }
  );
  const egg = recordEggLaid(
    { uses: 100, oldDay: -1 }, 200, { maxUses: 100, oldDayDelay: 2 }
  );
  assert.equal(product.uses, 61);
  assert.equal(product.oldDay, 202);
  assert.equal(egg.uses, 101);
  assert.equal(egg.oldDay, 202);
});

test("invalid breeding timestamps do not mutate the animal", () => {
  const original = { species: "sheep", sex: "male", uses: 12, oldDay: -1 };
  const result = recordBreedingUse(original, Number.NaN, { maxUses: 60, useCost: 5 });
  assert.equal(result.uses, 12);
  assert.equal(result.oldDay, -1);
});

test("familiarity decay observes TFC's two-day grace period", () => {
  const animal = { familiarity: 20, lastFamiliarityDecay: 0 };
  assert.equal(advanceAnimalFamiliarityDecay(animal, 2).familiarity, 20);
  assert.equal(advanceAnimalFamiliarityDecay(animal, 2.5).familiarity, 18);
});

test("familiarity decay advances in whole days and preserves fractional time", () => {
  const first = advanceAnimalFamiliarityDecay(
    { familiarity: 20, lastFamiliarityDecay: 0 }, 2.5
  );
  assert.equal(first.familiarity, 18);
  assert.equal(first.lastFamiliarityDecay, 1);
  const second = advanceAnimalFamiliarityDecay(first, 3.2);
  assert.equal(second.familiarity, 16);
  assert.equal(second.lastFamiliarityDecay, 2);
});
