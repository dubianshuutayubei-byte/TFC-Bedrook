import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
test("each crop seed has a survival acquisition recipe",()=>{
 const expected=[["crop_seed","minecraft:wheat_seeds"],["maize_seed","minecraft:melon_seeds"],["potato_seed","minecraft:potato"]];
 for(const [id,input] of expected){
  const recipe=JSON.parse(readFileSync(join(root,"packs/behavior_pack/recipes",id+".json"),"utf8"))["minecraft:recipe_shapeless"];
  assert.equal(recipe.result.item,"tfc:"+id);
  assert.equal(recipe.ingredients[0].item,input);
 }
});
