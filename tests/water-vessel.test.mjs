import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");
const empty=JSON.parse(readFileSync(join(root,"packs/behavior_pack/items/fired_vessel.json"),"utf8"))["minecraft:item"];
const filled=JSON.parse(readFileSync(join(root,"packs/behavior_pack/items/water_vessel.json"),"utf8"))["minecraft:item"];

test("fired vessel can be filled from a water block",()=>{
 assert.ok(empty.components["tfc:fill_water_vessel"]);
 assert.match(runtime,/registerCustomComponent\("tfc:fill_water_vessel",\{onUseOn:/);
 assert.match(runtime,/fillWaterVessel\(a\.source,a\.block\)/);
 assert.match(runtime,/block\.typeId!=="minecraft:water"&&block\.typeId!=="minecraft:flowing_water"/);
 assert.match(runtime,/give\(player,"tfc:water_vessel",1\)/);
});

test("drinking water restores hydration and returns an empty vessel",()=>{
 assert.equal(filled.description.identifier,"tfc:water_vessel");
 assert.ok(filled.components["tfc:drink_water"]);
 assert.match(runtime,/registerCustomComponent\("tfc:drink_water",\{onUse:/);
 assert.match(runtime,/consumeFood\(state,\{freshness:100,hydration:35,nutrition:\{\}\}\)/);
 assert.match(runtime,/give\(player,"tfc:fired_vessel",1\)/);
});
