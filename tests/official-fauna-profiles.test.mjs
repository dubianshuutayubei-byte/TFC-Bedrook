import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const db=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/official-fauna-profiles.json"),"utf8"));
const roster=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/fauna-roster.json"),"utf8"));
test("official fauna climate database covers all 63 TFC 3.2.26 species",()=>{
 assert.equal(db.species.length,63);
 assert.deepEqual(db.species.map(x=>x.id).sort(),roster.species.map(x=>x.id).sort());
 assert.equal(new Set(db.species.map(x=>x.id)).size,63);
});
test("official fauna constraints preserve cold, aquatic depth and special brightness profiles",()=>{
 const byId=Object.fromEntries(db.species.map(x=>[x.id,x]));
 assert.equal(byId.yak.maxTemperatureC,-11);
 assert.equal(byId.polar_bear.maxTemperatureC,-10);
 assert.equal(byId.octopoteuthis.belowSeaLevel,33);
 assert.equal(byId.octopoteuthis.maxBrightness,0);
 assert.equal(byId.panda.fuzzy,true);
 assert.equal(byId.dolphin.chance,10);
});
test("missing official constraints remain unspecified rather than becoming zero",()=>{
 const rabbit=db.species.find(x=>x.id==="rabbit");
 assert.equal(Object.hasOwn(rabbit,"minTemperatureC"),false);
 assert.equal(Object.hasOwn(rabbit,"maxTemperatureC"),false);
});

test("all official fauna profiles include their exact official spawn placement",()=>{
 const profiles=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/official-fauna-profiles.json"),"utf8"));
 const spawn=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/fauna-spawn-types.json"),"utf8"));
 const expected=new Map(spawn.species.map(x=>[x.id,x]));
 for(const p of profiles.species){
  const source=expected.get(p.id);
  assert.ok(source, "missing official spawn source for "+p.id);
  assert.equal(p.placement,source.placement,p.id);
  assert.equal(p.heightmap,source.heightmap,p.id);
 }
 assert.deepEqual(profiles.spawnPlacementAudit.placementCounts,spawn.placementCounts);
});

import { evaluateFaunaSpawn } from "../packs/behavior_pack/scripts/core/fauna-service.mjs";
test("official aquatic placement is enforced by the shared fauna spawn evaluator",()=>{
 const cod=db.species.find(x=>x.id==="cod");
 const valid=evaluateFaunaSpawn(cod,{inWater:true,onGround:false,temperatureC:10,belowSeaLevel:8},()=>0);
 assert.equal(valid.suitable,true);
 const invalid=evaluateFaunaSpawn(cod,{inWater:false,onGround:true,temperatureC:10,belowSeaLevel:8},()=>0);
 assert.equal(invalid.suitable,false);
 assert.ok(invalid.failures.includes("not_in_water"));
});
test("official terrestrial placement does not silently accept a water spawn point",()=>{
 const deer=db.species.find(x=>x.id==="deer");
 const result=evaluateFaunaSpawn(deer,{inWater:true,onGround:false,temperatureC:5,rainfall:250,forestType:"edge"},()=>0);
 assert.equal(result.suitable,false);
 assert.ok(result.failures.includes("not_on_ground"));
});
