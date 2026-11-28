import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const profiles=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/official-freshwater-fish-profiles-1.21.1-4.2.16.json"),"utf8"));
const roster=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/fauna-roster.json"),"utf8"));
test("official TFC 4.2.16 freshwater fish profiles cover all 16 registered fish",()=>{
 assert.equal(profiles.count,16);
 assert.equal(profiles.entries.length,16);
 const ids=profiles.entries.map(x=>x.id);
 assert.equal(new Set(ids).size,16);
 for(const id of ids)assert.ok(roster.species.some(x=>x.id===id),id+" must exist in the official fauna roster");
});
test("freshwater fish dimensions match the Java Fish enum",()=>{
 const bluegill=profiles.entries.find(x=>x.id==="bluegill");
 assert.deepEqual({width:bluegill.width,height:bluegill.height},{width:0.5,height:0.3});
 for(const fish of profiles.entries.filter(x=>x.id!=="bluegill"))assert.deepEqual({width:fish.width,height:fish.height},{width:0.7,height:0.4});
});
test("freshwater fish share the Java base class and water-only behavior contract",()=>{
 assert.equal(profiles.sharedClass,"FreshwaterFish");
 assert.ok(profiles.sharedClassBehaviors.includes("GetHookedGoal"));
 assert.ok(profiles.sharedClassBehaviors.includes("bucket pickup interaction"));
 assert.ok(profiles.sharedClassBehaviors.includes("spawn only in water fluid"));
 assert.ok(profiles.entries.every(x=>x.spawnPlacement==="in_water"&&x.waterFluid==="minecraft:water"));
});
test("salmon sound exception is preserved without inventing other species sound IDs",()=>{
 assert.equal(profiles.entries.find(x=>x.id==="salmon").sound,"vanilla_salmon_sound_events");
 assert.ok(profiles.entries.filter(x=>x.id!=="salmon").every(x=>x.sound==="tfc_registered_fish_sound"));
});
