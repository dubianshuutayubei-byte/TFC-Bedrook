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
