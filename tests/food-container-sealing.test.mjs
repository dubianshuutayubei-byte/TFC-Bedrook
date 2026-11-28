import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const read=p=>JSON.parse(readFileSync(join(root,p),"utf8"));
const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");

test("clay seal is craftable and registered as a reusable item component",()=>{
 const item=read("packs/behavior_pack/items/clay_seal.json")["minecraft:item"];
 const recipe=read("packs/behavior_pack/recipes/clay_seal.json")["minecraft:recipe_shaped"];
 assert.equal(item.description.identifier,"tfc:clay_seal");
 assert.ok(item.components["tfc:clay_seal"]);
 assert.equal(item.components["minecraft:max_stack_size"],1);
 assert.equal(recipe.result.item,"tfc:clay_seal");
});

test("sealed tracked containers preserve food at half decay rate",()=>{
 assert.match(runtime,/function tickFoodContainerFreshness\(container,dimension,location,nowTick,\{sealed=false\}=\{\}\)/);
 assert.match(runtime,/baseDecayPerHour:\s*baseDecayPerHour\*\(sealed\?0\.5:1\)/);
 assert.match(runtime,/readWorldState\(posKey\(block,"container_sealed"\),false\)===true/);
 assert.match(runtime,/registerCustomComponent\("tfc:clay_seal"/);
 assert.match(runtime,/writeWorldState\(key,!sealed\)/);
});

test("opening a sealed container accounts for sealed time then unseals it",()=>{
 assert.match(runtime,/tickFoodContainerFreshness\(container,event\.block\.dimension,event\.block\.location,system\.currentTick,\{sealed:true\}\)/);
 assert.match(runtime,/held\?\.typeId!=="tfc:clay_seal"/);
});
