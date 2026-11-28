import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { evaluateOfficialFaunaHabitat } from "../packs/behavior_pack/scripts/core/fauna-service.mjs";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const data=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/official-fauna-habitat-1.21x.json"),"utf8"));
const byId=Object.fromEntries(data.species.map(x=>[x.id,x]));
test("camel profiles require measured groundwater and do not substitute rainfall",()=>{
 const missing=evaluateOfficialFaunaHabitat(byId.dromedary_camel,{temperatureC:10});
 assert.equal(missing.suitable,false);
 assert.deepEqual(missing.missing,["averageGroundwater"]);
 const valid=evaluateOfficialFaunaHabitat(byId.dromedary_camel,{temperatureC:10,averageGroundwater:80});
 assert.equal(valid.suitable,true);
 assert.equal(valid.waterMetric,"averageGroundwater");
 const invalid=evaluateOfficialFaunaHabitat(byId.dromedary_camel,{temperatureC:10,averageGroundwater:120});
 assert.ok(invalid.failures.includes("groundwater_high"));
});
test("ignoreRivers profiles use average rainfall as the groundwater metric",()=>{
 const fish=byId.bluegill;
 const valid=evaluateOfficialFaunaHabitat(fish,{temperatureC:15,averageRainfall:250,month:"JUNE"});
 assert.equal(valid.waterMetric,"averageRainfall");
 assert.equal(valid.suitable,true);
 const missing=evaluateOfficialFaunaHabitat(fish,{temperatureC:15,averageGroundwater:250,month:"JUNE"});
 assert.ok(missing.missing.includes("averageRainfall"));
});
test("forest density and elevation use the official numeric ranges",()=>{
 const profile=byId.bison;
 const valid=evaluateOfficialFaunaHabitat(profile,{temperatureC:0,averageGroundwater:250,forestDensity:2,y:80});
 assert.equal(valid.suitable,true);
 const wrongForest=evaluateOfficialFaunaHabitat(profile,{temperatureC:0,averageGroundwater:250,forestDensity:3,y:80});
 assert.ok(wrongForest.failures.includes("forest_above_maximum"));
});
test("season, deep-water and brightness constraints are independently enforced",()=>{
 const fish=evaluateOfficialFaunaHabitat(byId.arctic_char,{temperatureC:5,averageRainfall:250,month:"NOVEMBER"});
 assert.ok(fish.failures.includes("out_of_season"));
 const squid=evaluateOfficialFaunaHabitat(byId.octopoteuthis,{y:20,seaLevel:63,brightness:1});
 assert.ok(squid.failures.includes("water_too_shallow"));
 assert.ok(squid.failures.includes("brightness_high"));
});
test("fuzzy panda climate uses both random rolls and rain variance",()=>{
 const p=byId.panda;
 const missing=evaluateOfficialFaunaHabitat(p,{temperatureC:23,averageGroundwater:400,forestDensity:4});
 assert.ok(missing.missing.includes("rainVariance"));
 const pass=evaluateOfficialFaunaHabitat(p,{temperatureC:23,averageGroundwater:400,forestDensity:4,rainVariance:0,randomFloats:[0.9,0.9]});
 assert.equal(pass.suitable,true);
 const fail=evaluateOfficialFaunaHabitat(p,{temperatureC:28,averageGroundwater:500,forestDensity:4,rainVariance:1,randomFloats:[0.1,0.1]});
 assert.ok(fail.failures.includes("fuzzy_climate_roll"));
});
