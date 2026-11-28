import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getStationRecipes } from "../packs/behavior_pack/scripts/core/processing-recipes.mjs";
import { findMatchingAlloys } from "../packs/behavior_pack/scripts/core/metal-service.mjs";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
test("bronze station recipe uses source alloy ranges and validates the 9:1 composition",()=>{
 const bronze=getStationRecipes("crucible").find(x=>x.alloyId==="bronze");
 const source=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/alloys.json"),"utf8")).recipes.find(x=>x.id==="bronze");
 assert.deepEqual(bronze.alloyComponents,source.components);
 assert.deepEqual(findMatchingAlloys(bronze.metalInputs,{recipes:[{id:bronze.alloyId,components:bronze.alloyComponents}]}),["bronze"]);
 assert.deepEqual(findMatchingAlloys({copper:8,tin:2},{recipes:[{id:bronze.alloyId,components:bronze.alloyComponents}]}),[]);
});
test("runtime routes alloy checking and cooling through the metal service",()=>{
 const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");
 assert.match(runtime,/import \{ findMatchingAlloys \} from "\.\/core\/metal-service\.mjs"/);
 assert.match(runtime,/findMatchingAlloys\(recipe\.metalInputs/);
 assert.match(runtime,/"tfc:heated_bronze_ingot":"tfc:bronze_ingot"/);
});
test("tin and bronze material identifiers are backed by item definitions",()=>{
 for(const id of ["tin_ore","heated_tin_ingot","tin_ingot","heated_bronze_ingot","bronze_ingot","bronze_sheet"]){
  const item=JSON.parse(readFileSync(join(root,"packs/behavior_pack/items",id+".json"),"utf8"));
  assert.equal(item["minecraft:item"].description.identifier,"tfc:"+id);
 }
});
