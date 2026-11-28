import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const roster=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/fauna-roster.json"),"utf8"));
const spawn=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/fauna-spawn-types.json"),"utf8"));
test("all 78 official TFC 1.21.x fauna have source-derived spawn placements",()=>{
 assert.equal(spawn.officialSourceVersion,"TerraFirmaCraft 1.21.1-4.2.16");
 assert.equal(spawn.officialSourceTag,"v4.2.16");
 assert.equal(spawn.officialSourceBlobs["src/main/java/net/dries007/tfc/common/entities/aquatic/Fish.java"],"a3765670f52f68abed08c6057b68e248c8f0fbf9");
 assert.equal(spawn.total,78);
 assert.equal(spawn.species.length,78);
 assert.equal(new Set(spawn.species.map(x=>x.id)).size,78);
 assert.deepEqual(new Set(spawn.species.map(x=>x.id)),new Set(roster.species.map(x=>x.id)));
 assert.equal(spawn.placementCounts.in_water,29);
 assert.equal(spawn.placementCounts.no_restrictions,1);
 assert.equal(spawn.placementCounts.on_ground,48);
 for(const item of spawn.species)assert.equal(item.heightmap,"motion_blocking_no_leaves",item.id);
});
test("aquatic, amphibious and terrestrial spawn categories are mapped correctly",()=>{
 for(const id of ["cod","jellyfish","tropical_fish","pufferfish","bluegill","crayfish","horseshoe_crab","isopod","lobster","dolphin","orca","manatee","squid","octopoteuthis","salmon","rainbow_trout","lake_trout","largemouth_bass","smallmouth_bass","crappie"])assert.equal(spawn.species.find(x=>x.id===id).placement,"in_water",id);
 assert.equal(spawn.species.find(x=>x.id==="crocodile").placement,"no_restrictions");
 for(const id of ["deer","cow","sheep","chicken","wolf","fox","horse","penguin","frog"])assert.equal(spawn.species.find(x=>x.id===id).placement,"on_ground",id);
});

import { evaluateFaunaSpawn } from "../packs/behavior_pack/scripts/core/fauna-service.mjs";
const combined=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/official-fauna-spawn-profiles.json"),"utf8"));
const officialProfiles=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/official-fauna-profiles.json"),"utf8"));
test("all 78 fauna have official placement while only 63 carry sourced climate constraints",()=>{
 assert.equal(combined.total,78);
 assert.equal(combined.species.length,78);
 const byId=Object.fromEntries(combined.species.map(x=>[x.id,x]));
 for(const p of combined.species)assert.ok(["on_ground","in_water","no_restrictions"].includes(p.placement),p.id);
 for(const p of officialProfiles.species)assert.ok(byId[p.id],p.id+" placement missing");
 for(const id of ["arctic_char","burbot","muksun","northern_pike","pacu","peacock_bass","red_piranha","spotted_gudgeon","tilapia"])assert.equal(byId[id].placement,"in_water",id);
 for(const id of ["armadillo","bactrian_camel","bison","dromedary_camel","leopard_seal","pond_turtle"])assert.equal(byId[id].placement,"on_ground",id);
 assert.equal(byId.cod.placement,"in_water");
 assert.equal(byId.crocodile.placement,"no_restrictions");
 assert.equal(byId.deer.placement,"on_ground");
 assert.equal(byId.octopoteuthis.distanceBelowSeaLevel,33);
 for(const id of ["arctic_char","armadillo","bison","pond_turtle"])assert.equal(Object.hasOwn(byId[id],"minTemperatureC"),false,id+" climate must remain unspecified");
});
test("placement-only profiles can be validated without fabricated climate values",()=>{
 const arcticChar=combined.species.find(x=>x.id==="arctic_char");
 const valid=evaluateFaunaSpawn(arcticChar,{inWater:true,onGround:false});
 assert.equal(valid.suitable,true);
 assert.deepEqual(valid.failures,[]);
 assert.deepEqual(valid.missing,[]);
 const wrong=evaluateFaunaSpawn(arcticChar,{inWater:false,onGround:true});
 assert.equal(wrong.suitable,false);
 assert.ok(wrong.failures.includes("not_in_water"));
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
