import test from "node:test";
import assert from "node:assert/strict";
import { recordBreedingUse } from "../packs/behavior_pack/scripts/core/fauna-service.mjs";

test("successful breeding consumes uses for the pregnant parent", () => {
  const mother = recordBreedingUse(
    { species: "cow", sex: "female", uses: 10, oldDay: -1 },
    200,
    { maxUses: 128, useCost: 5, oldDayDelay: 2 }
  );
  assert.equal(mother.uses, 15);
  assert.equal(mother.oldDay, -1);
});

test("successful breeding consumes uses for the other parent independently", () => {
  const father = recordBreedingUse(
    { species: "donkey", sex: "male", uses: 58, oldDay: -1 },
    200,
    { maxUses: 60, useCost: 5, oldDayDelay: 3 }
  );
  assert.equal(father.uses, 63);
  assert.equal(father.oldDay, 203);
});

test("each parent uses its own max-use limit", () => {
  const mother = recordBreedingUse({ uses: 58 }, 50, { maxUses: 128, useCost: 5, oldDayDelay: 2 });
  const father = recordBreedingUse({ uses: 58 }, 50, { maxUses: 60, useCost: 5, oldDayDelay: 2 });
  assert.equal(mother.oldDay, -1);
  assert.equal(father.oldDay, 52);
});

test("breeding use does not schedule old age before the use limit", () => {
  const animal = recordBreedingUse({ uses: 54 }, 80, { maxUses: 60, useCost: 5, oldDayDelay: 4 });
  assert.equal(animal.uses, 59);
  assert.equal(animal.oldDay, -1);
});

test("invalid breeding timestamps do not mutate the animal", () => {
  const original = { species: "sheep", uses: 12, oldDay: -1 };
  const result = recordBreedingUse(original, Number.NaN, { maxUses: 60, useCost: 5 });
  assert.equal(result.uses, 12);
  assert.equal(result.oldDay, -1);
});
