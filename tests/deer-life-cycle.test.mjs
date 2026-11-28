import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");
const deer=JSON.parse(readFileSync(join(root,"packs/behavior_pack/entities/deer.json"),"utf8"))["minecraft:entity"];
test("custom deer has explicit juvenile and adult transition events",()=>{
 assert.ok(deer.component_groups["tfc:baby"]["minecraft:is_baby"]);
 assert.equal(deer.component_groups["tfc:baby"]["minecraft:scale"].value,0.55);
 assert.ok(deer.component_groups["tfc:baby"]["minecraft:behavior.follow_parent"]);
 assert.deepEqual(deer.events["tfc:spawn_baby"].add.component_groups,["tfc:baby"]);
 assert.deepEqual(deer.events["tfc:grow_up"].remove.component_groups,["tfc:baby"]);
});
test("deer birth creates a juvenile entity with inherited familiarity",()=>{
 assert.match(runtime,/spawnEntity\(entity\.typeId,\{x:entity\.location\.x\+1/);
 assert.match(runtime,/baby\.triggerEvent\("tfc:spawn_baby"\)/);
 assert.match(runtime,/saveAnimal\(baby,createAnimalOffspringState\(state,profile\.speciesId/);
 assert.match(runtime,/entity\.triggerEvent\("tfc:grow_up"\)/);
});
