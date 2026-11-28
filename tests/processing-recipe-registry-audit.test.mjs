import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PROCESSING_RECIPES } from "../packs/behavior_pack/scripts/core/processing-recipes.mjs";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const itemIds=new Set(readdirSync(join(root,"packs/behavior_pack/items"))
 .filter(name=>name.endsWith(".json"))
 .map(name=>JSON.parse(readFileSync(join(root,"packs/behavior_pack/items",name),"utf8"))["minecraft:item"].description.identifier));

test("every processing recipe input and output has a registered item definition",()=>{
 const missing=[];
 for(const [station,recipes] of Object.entries(PROCESSING_RECIPES)){
  for(const recipe of recipes){
   for(const id of [...Object.keys(recipe.inputs),...Object.keys(recipe.outputs)]){
    if(!itemIds.has(id))missing.push(station+"/"+recipe.id+": "+id);
   }
  }
 }
 assert.deepEqual(missing,[]);
});
