import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");
const recipes=readFileSync(join(root,"packs/behavior_pack/scripts/core/processing-recipes.mjs"),"utf8");
const handstone=JSON.parse(readFileSync(join(root,"packs/behavior_pack/items/handstone.json"),"utf8"))["minecraft:item"];
const quern=JSON.parse(readFileSync(join(root,"packs/behavior_pack/blocks/quern.json"),"utf8"))["minecraft:block"];

test("quern requires a handstone and three manual turns",()=>{
 assert.equal(handstone.description.identifier,"tfc:handstone");
 assert.equal(quern.components["tfc:station_ui"].station,"quern");
 assert.match(runtime,/async function processQuernManually\(player,block,recipe\)/);
 assert.match(runtime,/held\?\.typeId!=="tfc:handstone"/);
 assert.match(runtime,/for\(let turn=0;turn<3;turn\+\+\)/);
 assert.match(runtime,/手動回転: /);
 assert.match(runtime,/if\(id==="quern"\)\{await processQuernManually\(player,block,recipe\);return;\}/);
});

test("quern returns its reusable handstone and produces flour",()=>{
 assert.match(recipes,/inputs:Object\.freeze\(\{"tfc:grain":1,"tfc:handstone":1\}\),outputs:Object\.freeze\(\{"tfc:flour":1,"tfc:handstone":1\}\)/);
 assert.match(runtime,/for\(const \[itemId,amount\] of Object\.entries\(recipe\.outputs\)\)give\(player,itemId,amount\)/);
});

test("quern does not consume fuel or use a timed station job",()=>{
 assert.match(runtime,/id==="anvil"\|\|id==="drying_rack"\|\|id==="composter"\|\|id==="quern"/);
 assert.match(runtime,/id==="quern"\?"手動回転 3回"/);
});

test("quern flour can be mixed with water and baked into bread",()=>{
 const flour=JSON.parse(readFileSync(join(root,"packs/behavior_pack/items/flour.json"),"utf8"))["minecraft:item"];
 const bread=JSON.parse(readFileSync(join(root,"packs/behavior_pack/items/bread.json"),"utf8"))["minecraft:item"];
 assert.ok(flour.components["tfc:mix_dough"]);
 assert.equal(bread.description.identifier,"tfc:bread");
 assert.match(runtime,/function mixDough\(player\)/);
 assert.match(runtime,/give\(player,"tfc:dough",1\)/);
 assert.match(recipes,/id:"tfc:bread",station:"firepit"/);
});
