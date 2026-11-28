import test from "node:test";
import assert from "node:assert/strict";
import { PROCESSING_RECIPES, getStationRecipes, validateProcessingRecipes } from "../packs/behavior_pack/scripts/core/processing-recipes.mjs";

test("canonical station recipes are valid and unique",()=>{
  assert.deepEqual(validateProcessingRecipes(),{count:41});
});
test("pit kiln exposes both vessel and ingot-mold firing",()=>{
  const ids=getStationRecipes("pit_kiln").map(r=>r.id);
  assert.deepEqual(ids,["tfc:fired_vessel","tfc:fired_ingot_mold","tfc:fired_crucible"]);
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
 assert.ok(recipes.some(r=>r.id==="tfc:dried_meat"));
 assert.ok(recipes.some(r=>r.id==="tfc:dried_fruit"));
 assert.ok(recipes.some(r=>r.id==="tfc:dried_vegetables"));
 assert.ok(recipes.some(r=>r.inputs["tfc:carrot"]));
 assert.equal(recipes.find(r=>r.id==="tfc:dried_meat").inputs["tfc:raw_meat"],1);
});

test("composter provides two green-and-brown compost recipes",()=>{
 const recipes=getStationRecipes("composter");
 assert.equal(recipes.length,2);
 assert.equal(recipes[0].inputs["tfc:vegetable"],4);
 assert.equal(recipes[0].inputs["minecraft:oak_leaves"],16);
 assert.equal(recipes[1].inputs["tfc:fruit"],4);
 assert.equal(recipes[1].outputs["tfc:compost"],1);
 assert.equal(recipes[0].durationTicks,240000);
});

test("quern grinds five grain crops into flour and returns its handstone",()=>{
 const recipes=getStationRecipes("quern");
 assert.equal(recipes.length,5);
 for(const recipe of recipes){
  assert.equal(recipe.inputs["tfc:handstone"],1);
  assert.equal(recipe.outputs["tfc:handstone"],1);
  assert.equal(recipe.outputs["tfc:flour"],1);
 }
});
test("bread baking consumes dough at cooking temperature",()=>{
 const recipe=getStationRecipes("firepit").find(r=>r.id==="tfc:bread");
 assert.equal(recipe.inputs["tfc:dough"],1);
 assert.equal(recipe.outputs["tfc:bread"],1);
 assert.equal(recipe.minimumTemperatureC,180);
});

test("brine can be evaporated into salt and an empty fired vessel",()=>{
 const recipe=getStationRecipes("firepit").find(r=>r.id==="tfc:salt_from_brine");
 assert.equal(recipe.inputs["tfc:brine_vessel"],1);
 assert.equal(recipe.outputs["tfc:salt"],1);
 assert.equal(recipe.outputs["tfc:fired_vessel"],1);
 assert.equal(recipe.minimumTemperatureC,100);
});
test("salted meat and smoked meat are distinct preservation routes",()=>{
 const salted=getStationRecipes("drying_rack").find(r=>r.id==="tfc:salted_meat");
 const smoked=getStationRecipes("smokehouse").find(r=>r.id==="tfc:smoked_meat");
 assert.equal(salted.inputs["tfc:salt"],1);
 assert.equal(salted.inputs["tfc:raw_meat"],1);
 assert.equal(smoked.inputs["minecraft:oak_leaves"],2);
 assert.equal(smoked.outputs["tfc:smoked_meat"],1);
});
test("tin sheet can be formed from heated tin at its forging temperature",()=>{
 const recipe=getStationRecipes("anvil").find(r=>r.id==="tfc:tin_sheet");
 assert.equal(recipe.inputs["tfc:heated_tin_ingot"],1);
 assert.equal(recipe.outputs["tfc:tin_sheet"],1);
 assert.equal(recipe.minimumTemperatureC,138);
});
