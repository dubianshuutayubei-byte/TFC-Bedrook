import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const roster=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/fauna-roster.json"),"utf8"));
const spawn=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/fauna-spawn-types.json"),"utf8"));
test("official TFC spawn placement is recorded for all 63 fauna",()=>{
 assert.equal(spawn.total,63);
 assert.equal(spawn.species.length,63);
 assert.deepEqual(new Set(spawn.species.map(x=>x.id)),new Set(roster.species.map(x=>x.id)));
 assert.equal(spawn.placementCounts.in_water,20);
 assert.equal(spawn.placementCounts.no_restrictions,1);
 assert.equal(spawn.placementCounts.on_ground,42);
});
test("aquatic, amphibious and terrestrial spawn categories are mapped correctly",()=>{
 for(const id of ["cod","jellyfish","tropical_fish","pufferfish","bluegill","crayfish","horseshoe_crab","isopod","lobster","dolphin","orca","manatee","squid","octopoteuthis","salmon","rainbow_trout","lake_trout","largemouth_bass","smallmouth_bass","crappie"])assert.equal(spawn.species.find(x=>x.id===id).placement,"in_water",id);
 assert.equal(spawn.species.find(x=>x.id==="crocodile").placement,"no_restrictions");
 for(const id of ["deer","cow","sheep","chicken","wolf","fox","horse","penguin","frog"])assert.equal(spawn.species.find(x=>x.id===id).placement,"on_ground",id);
});

import { evaluateFaunaSpawn } from "../packs/behavior_pack/scripts/core/fauna-service.mjs";
const combined=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/official-fauna-spawn-profiles.json"),"utf8"));
const officialProfiles=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/official-fauna-profiles.json"),"utf8"));
test("all 63 official fauna spawn profiles combine exact placement and climate constraints",()=>{
 assert.equal(combined.total,63);
 assert.equal(combined.species.length,63);
 const byId=Object.fromEntries(combined.species.map(x=>[x.id,x]));
 for(const p of combined.species){
  assert.ok(["on_ground","in_water","no_restrictions"].includes(p.placement),p.id);
  assert.ok(officialProfiles.species.some(x=>x.id===p.id),p.id);
 }
 assert.equal(byId.cod.placement,"in_water");
 assert.equal(byId.crocodile.placement,"no_restrictions");
 assert.equal(byId.deer.placement,"on_ground");
 assert.equal(byId.octopoteuthis.distanceBelowSeaLevel,33);
});
test("official spawn profile evaluator rejects wrong placement and unknown climate samples",()=>{
 const deer=combined.species.find(x=>x.id==="deer");
 const wrong=evaluateFaunaSpawn(deer,{onGround:false,temperatureC:10,rainfall:250,forestType:"normal",y:64,seaLevel:63,validSpawnGround:true});
 assert.equal(wrong.suitable,false);
 assert.ok(wrong.failures.includes("not_on_ground"));
 const missing=evaluateFaunaSpawn(deer,{onGround:true});
 assert.equal(missing.suitable,false);
 assert.ok(missing.missing.includes("temperatureC"));
});
