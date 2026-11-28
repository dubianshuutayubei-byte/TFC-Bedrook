import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { OFFICIAL_FAUNA_HABITATS_1_21 } from "../packs/behavior_pack/scripts/core/official-fauna-habitat-profiles.mjs";
import { evaluateOfficialFaunaHabitat } from "../packs/behavior_pack/scripts/core/fauna-service.mjs";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const source=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");
const habitat=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/official-fauna-habitat-1.21x.json"),"utf8"));
const spawn=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/official-fauna-spawn-profiles.json"),"utf8"));

test("runtime uses all 78 official TFC 1.21.1-4.2.16 fauna habitat profiles",()=>{
 assert.equal(Object.keys(OFFICIAL_FAUNA_HABITATS_1_21).length,78);
 assert.equal(habitat.species.length,78);
 const placements=new Map(spawn.species.map(x=>[x.id,x.placement]));
 for(const {id,...profile} of habitat.species){
  assert.deepEqual(OFFICIAL_FAUNA_HABITATS_1_21[id],{...profile,placement:placements.get(id)},id);
 }
});

test("all official spawn placements are source-derived and counted correctly",()=>{
 const values=Object.values(OFFICIAL_FAUNA_HABITATS_1_21);
 assert.equal(values.filter(x=>x.placement==="on_ground").length,48);
 assert.equal(values.filter(x=>x.placement==="in_water").length,29);
 assert.equal(values.filter(x=>x.placement==="no_restrictions").length,1);
 assert.ok(values.every(x=>["on_ground","in_water","no_restrictions"].includes(x.placement)));
});

test("natural spawns use the 1.21 habitat evaluator and only remove on measured failures",()=>{
 assert.match(source,/world\.afterEvents\.entitySpawn\.subscribe\(validateNaturalFaunaSpawn\)/);
 assert.match(source,/event\?\.cause!==\"Spawned\"/);
 assert.match(source,/OFFICIAL_FAUNA_HABITATS_1_21\[profile\.speciesId\]/);
 assert.match(source,/evaluateOfficialFaunaHabitat\(official,environment\)/);
 assert.match(source,/if\(placementFailure\|\|result\.failures\.length\)\{entity\.remove\(\);return;\}/);
 assert.match(source,/if\(result\.missing\.length\)\{console\.warn/);
});

test("world sampler does not invent groundwater, rainfall or forest density from biome names",()=>{
 const start=source.indexOf("function sampleAnimalEnvironment");
 const end=source.indexOf("function validateNaturalFaunaSpawn",start);
 const sampler=source.slice(start,end);
 assert.match(sampler,/temperatureC:currentTemperatureC/);
 assert.match(sampler,/belowSeaLevel:Math\.max\(0,63-blockLocation\.y\)/);
 assert.match(sampler,/month:tfcMonthFromDay\(world\.getDay\(\)\)/);
 assert.match(sampler,/brightness/);
 assert.doesNotMatch(sampler,/averageGroundwater\s*:/);
 assert.doesNotMatch(sampler,/averageRainfall\s*:/);
 assert.doesNotMatch(sampler,/forestDensity\s*:/);
 assert.doesNotMatch(source,/function rainfallForBiome/);
});

test("measured temperature failures remain enforceable even when groundwater is unavailable",()=>{
 const profile=OFFICIAL_FAUNA_HABITATS_1_21.alpaca;
 const result=evaluateOfficialFaunaHabitat(profile,{temperatureC:40});
 assert.ok(result.failures.includes("temperature_high"));
 assert.ok(result.missing.includes("averageGroundwater"));
 assert.equal(result.suitable,false);
});

test("habitat evaluation defers rather than guessing missing source measurements",()=>{
 const profile=OFFICIAL_FAUNA_HABITATS_1_21.dromedary_camel;
 const result=evaluateOfficialFaunaHabitat(profile,{temperatureC:10,y:70,seaLevel:63,month:"JANUARY"});
 assert.ok(result.missing.includes("averageGroundwater"));
 assert.equal(result.suitable,false);
 assert.doesNotMatch(source.slice(source.indexOf("function sampleAnimalEnvironment"),source.indexOf("function validateNaturalFaunaSpawn")),/groundwater\s*:/);
});

test("water and ground placement are both enforced by the runtime adapter",()=>{
 assert.match(source,/official\.placement===\"in_water\"&&environment\.inWater!==true/);
 assert.match(source,/official\.placement===\"on_ground\"&&environment\.onGround!==true/);
});
