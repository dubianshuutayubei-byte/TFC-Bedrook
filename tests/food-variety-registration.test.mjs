import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
test("vegetable and fruit food profiles have craftable game items",()=>{
 for(const [id,recipe] of [["vegetable","vegetable_mix"],["fruit","fruit_mix"]]){
  const item=JSON.parse(readFileSync(join(root,"packs/behavior_pack/items",id+".json"),"utf8"))["minecraft:item"];
  const profile=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/food-profiles.json"),"utf8")).foods.find(x=>x.id===id);
  const food=item.components["tfc:consume_food"];
  assert.equal(food.itemId,"tfc:"+id);
  assert.equal(food.nutrition,profile.nutrition[id==="fruit"?"fruit":"vegetables"]);
  const data=JSON.parse(readFileSync(join(root,"packs/behavior_pack/recipes",recipe+".json"),"utf8"));
  assert.equal(data["minecraft:recipe_shapeless"].result.item,"tfc:"+id);
 }
});

test("dried food items match preservation profiles",()=>{
 const profiles=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/food-profiles.json"),"utf8"));
 for(const id of ["dried_meat","dried_fruit","dried_vegetables"]){
  const item=JSON.parse(readFileSync(join(root,"packs/behavior_pack/items",id+".json"),"utf8"))["minecraft:item"];
  const food=item.components["tfc:consume_food"];
  const profile=profiles.foods.find(x=>x.id===id);
  assert.equal(food.itemId,"tfc:"+id);
  assert.equal(food.nutrition,profile.nutrition[food.category]);
  assert.equal(food.hydration,profile.hydration);
 }
});

test("every food profile has a matching registered edible item",()=>{
 const profiles=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/food-profiles.json"),"utf8"));
 const fileIds={milk:"milk_bottle"};
 for(const profile of profiles.foods){
  const fileId=fileIds[profile.id]??profile.id;
  const item=JSON.parse(readFileSync(join(root,"packs/behavior_pack/items",fileId+".json"),"utf8"))["minecraft:item"];
  const food=item.components["tfc:consume_food"];
  assert.ok(food,"missing food component for "+profile.id);
  const category=Object.keys(profile.nutrition)[0];
  assert.equal(food.category,category,profile.id+" category mismatch");
  assert.equal(food.nutrition,profile.nutrition[category],profile.id+" nutrition mismatch");
  assert.equal(food.hydration,profile.hydration,profile.id+" hydration mismatch");
 }
});
