import test from "node:test";
import assert from "node:assert/strict";
import { PROCESSING_RECIPES, getStationRecipes, validateProcessingRecipes } from "../packs/behavior_pack/scripts/core/processing-recipes.mjs";

test("canonical station recipes are valid and unique",()=>{
  assert.deepEqual(validateProcessingRecipes(),{count:5});
});
test("pit kiln exposes both vessel and ingot-mold firing",()=>{
  const ids=getStationRecipes("pit_kiln").map(r=>r.id);
  assert.deepEqual(ids,["tfc:fired_vessel","tfc:fired_ingot_mold"]);
});
test("copper casting returns the reusable fired mold",()=>{
  const recipe=getStationRecipes("crucible")[0];
  assert.equal(recipe.inputs["tfc:fired_ingot_mold"],1);
  assert.equal(recipe.outputs["tfc:fired_ingot_mold"],1);
  assert.equal(recipe.outputs["tfc:heated_copper_ingot"],1);
});
test("unknown station has no recipes",()=>assert.deepEqual(getStationRecipes("unknown"),[]));
