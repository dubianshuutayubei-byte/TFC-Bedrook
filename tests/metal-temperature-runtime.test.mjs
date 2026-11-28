import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");
const recipes=readFileSync(join(root,"packs/behavior_pack/scripts/core/processing-recipes.mjs"),"utf8");

test("heated metal ingots store individual temperature and cool over time",()=>{
 for(const id of ["heated_copper_ingot","heated_tin_ingot","heated_bronze_ingot"]){
  const item=JSON.parse(readFileSync(join(root,"packs/behavior_pack/items",id+".json"),"utf8"))["minecraft:item"];
  assert.equal(item.components["minecraft:max_stack_size"],1);
 }
 assert.match(runtime,/setDynamicProperties\(\{\[ITEM_TEMPERATURE_KEY\]:profile\.initialTemperatureC/);
 assert.match(runtime,/coolItemTemperature\(current,profile,elapsed\)/);
 assert.match(runtime,/tickMetalHeat\(player,system\.currentTick\)/);
});

test("anvil sheet forming requires each metal's forging temperature",()=>{
 assert.match(runtime,/temperature<profile\.forgingTemperatureC/);
 assert.match(recipes,/tfc:copper_sheet[^\n]+minimumTemperatureC:648/);
 assert.match(recipes,/tfc:bronze_sheet[^\n]+minimumTemperatureC:570/);
});

test("tin sheet forging recipe and item are registered",()=>{
 const item=JSON.parse(readFileSync(join(root,"packs/behavior_pack/items/tin_sheet.json"),"utf8"))["minecraft:item"];
 assert.equal(item.description.identifier,"tfc:tin_sheet");
 assert.match(recipes,/tfc:tin_sheet[^
]+minimumTemperatureC:138/);
});
