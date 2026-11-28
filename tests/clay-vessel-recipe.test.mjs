import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
test("unfired clay vessel has a shaping recipe and a kiln firing path",()=>{
 const recipe=JSON.parse(readFileSync(join(root,"packs/behavior_pack/recipes/clay_vessel.json"),"utf8"));
 assert.equal(recipe["minecraft:recipe_shaped"].result.item,"tfc:clay_vessel");
 const recipes=readFileSync(join(root,"packs/behavior_pack/scripts/core/processing-recipes.mjs"),"utf8");
 assert.match(recipes,/inputs:Object\.freeze\(\{"tfc:clay_vessel":1\}\)/);
 assert.match(recipes,/outputs:Object\.freeze\(\{"tfc:fired_vessel":1\}\)/);
});
