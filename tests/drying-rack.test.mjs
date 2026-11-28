import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getStationRecipes } from "../packs/behavior_pack/scripts/core/processing-recipes.mjs";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const read=p=>JSON.parse(readFileSync(join(root,p),"utf8"));

test("drying rack is craftable and opens the station UI",()=>{
 const item=read("packs/behavior_pack/items/drying_rack.json")["minecraft:item"];
 const block=read("packs/behavior_pack/blocks/drying_rack.json")["minecraft:block"];
 const recipe=read("packs/behavior_pack/recipes/drying_rack.json")["minecraft:recipe_shaped"];
 assert.equal(item.description.identifier,"tfc:drying_rack");
 assert.equal(item.components["minecraft:block_placer"].block,"tfc:drying_rack");
 assert.equal(block.description.identifier,"tfc:drying_rack");
 assert.equal(block.components["tfc:station_ui"].station,"drying_rack");
 assert.equal(recipe.result.item,"tfc:drying_rack");
});

test("drying rack is passive and does not accept fuel",()=>{
 const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");
 assert.match(runtime,/id==="anvil"\|\|id==="drying_rack"\)\?null/);
 assert.match(runtime,/id==="drying_rack"\?"乾燥棚"/);
 const recipes=getStationRecipes("drying_rack");
 assert.equal(recipes.length,3);
 assert.ok(recipes.every(r=>r.minimumTemperatureC===0&&r.durationTicks>=18000));
});

test("dried foods are registered in the canonical decay profiles",()=>{
 const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");
 for(const id of ["tfc:dried_meat","tfc:dried_fruit","tfc:dried_vegetables"])assert.ok(runtime.includes(id));
});
