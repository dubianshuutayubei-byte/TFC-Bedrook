import test from "node:test";
import assert from "node:assert/strict";
import { PROCESSING_RECIPES, getStationRecipes, validateProcessingRecipes } from "../packs/behavior_pack/scripts/core/processing-recipes.mjs";

test("canonical station recipes are valid and unique",()=>{
  assert.deepEqual(validateProcessingRecipes(),{count:11});
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
test("tin casting and bronze alloy casting are connected",()=>{
 const tin=getStationRecipes("crucible").find(r=>r.id==="tfc:heated_tin_ingot");
 const bronze=getStationRecipes("crucible").find(r=>r.id==="tfc:heated_bronze_ingot");
 assert.equal(tin.inputs["tfc:tin_ore"],2);
 assert.equal(tin.outputs["tfc:heated_tin_ingot"],1);
 assert.equal(bronze.inputs["tfc:copper_ingot"],9);
 assert.equal(bronze.inputs["tfc:tin_ingot"],1);
 assert.equal(bronze.alloyId,"bronze");
 assert.equal(bronze.minimumTemperatureC,950);
});
test("bronze sheet can be formed at the anvil",()=>{
 const recipe=getStationRecipes("anvil").find(r=>r.id==="tfc:bronze_sheet");
 assert.equal(recipe.inputs["tfc:heated_bronze_ingot"],1);
 assert.equal(recipe.outputs["tfc:bronze_sheet"],1);
});
test("unknown station has no recipes",()=>assert.deepEqual(getStationRecipes("unknown"),[]));

test("tin and bronze alloy stages are available",()=>{
 const crucible=getStationRecipes("crucible");
 const tin=crucible.find(r=>r.id==="tfc:heated_tin_ingot");
 const bronze=crucible.find(r=>r.id==="tfc:heated_bronze_ingot");
 assert.ok(tin);
 assert.equal(tin.inputs["tfc:tin_ore"],2);
 assert.ok(bronze);
 assert.equal(bronze.inputs["tfc:copper_ingot"],9);
 assert.equal(bronze.inputs["tfc:tin_ingot"],1);
 assert.equal(bronze.outputs["tfc:heated_bronze_ingot"],1);
 assert.equal(getStationRecipes("anvil").some(r=>r.id==="tfc:bronze_sheet"),true);
});

test("drying rack preserves meat, fruit and vegetables",()=>{
 const recipes=getStationRecipes("drying_rack");
 assert.deepEqual(recipes.map(r=>r.id),["tfc:dried_meat","tfc:dried_fruit","tfc:dried_vegetables"]);
 assert.equal(recipes.find(r=>r.id==="tfc:dried_meat").inputs["tfc:raw_meat"],1);
});
