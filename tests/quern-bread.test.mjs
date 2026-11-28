import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getStationRecipes } from "../packs/behavior_pack/scripts/core/processing-recipes.mjs";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const read=p=>JSON.parse(readFileSync(join(root,p),"utf8"));
const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");

test("quern base and handstone are registered craftable equipment",()=>{
 const item=read("packs/behavior_pack/items/quern.json")["minecraft:item"];
 const block=read("packs/behavior_pack/blocks/quern.json")["minecraft:block"];
 const handstone=read("packs/behavior_pack/items/handstone.json")["minecraft:item"];
 const baseRecipe=read("packs/behavior_pack/recipes/quern.json")["minecraft:recipe_shaped"];
 const handstoneRecipe=read("packs/behavior_pack/recipes/handstone.json")["minecraft:recipe_shapeless"];
 assert.equal(item.description.identifier,"tfc:quern");
 assert.equal(item.components["minecraft:block_placer"].block,"tfc:quern");
 assert.equal(block.description.identifier,"tfc:quern");
 assert.equal(block.components["tfc:station_ui"].station,"quern");
 assert.equal(handstone.description.identifier,"tfc:handstone");
 assert.equal(baseRecipe.result.item,"tfc:quern");
 assert.equal(handstoneRecipe.result.item,"tfc:handstone");
});

test("quern recipes return the reusable handstone and produce flour",()=>{
 const recipes=getStationRecipes("quern");
 assert.equal(recipes.length,5);
 for(const recipe of recipes){
  assert.equal(recipe.inputs["tfc:handstone"],1);
  assert.equal(recipe.outputs["tfc:handstone"],1);
  assert.equal(recipe.outputs["tfc:flour"],1);
 }
 assert.match(runtime,/id==="quern"\|\|id==="smokehouse"\)\?null/);
 assert.match(runtime,/!["anvil","drying_rack","composter","quern","smokehouse"].includes(id)/);
});

test("flour can be mixed with a filled vessel to make dough and return the vessel",()=>{
 const flour=read("packs/behavior_pack/items/flour.json")["minecraft:item"];
 assert.ok(flour.components["tfc:mix_dough"]);
 assert.match(runtime,/registerCustomComponent\("tfc:mix_dough"/);
 assert.match(runtime,/function mixDough\(player\)/);
 assert.match(runtime,/take\(player,"tfc:water_vessel",1\)/);
 assert.match(runtime,/give\(player,"tfc:dough",1\);give\(player,"tfc:fired_vessel",1\)/);
});

test("dough is baked into bread and bread is a tracked food",()=>{
 const bread=read("packs/behavior_pack/items/bread.json")["minecraft:item"];
 const profile=read("packs/behavior_pack/data/food-profiles.json").foods.find(x=>x.id==="bread");
 const recipe=getStationRecipes("firepit").find(x=>x.id==="tfc:bread");
 assert.equal(bread.description.identifier,"tfc:bread");
 assert.equal(bread.components["tfc:consume_food"].category,"grain");
 assert.equal(profile.nutrition.grain,20);
 assert.equal(recipe.inputs["tfc:dough"],1);
 assert.equal(recipe.outputs["tfc:bread"],1);
 assert.match(runtime,/"tfc:bread":0\.05/);
});
