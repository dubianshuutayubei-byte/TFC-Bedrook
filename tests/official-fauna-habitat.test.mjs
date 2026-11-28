import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const habitat=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/official-fauna-habitat-1.21x.json"),"utf8"));
const roster=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/fauna-roster.json"),"utf8"));
const byId=Object.fromEntries(habitat.species.map(x=>[x.id,x]));
test("official 1.21.x BuiltinFauna provides exact habitat data for all 78 fauna",()=>{
 assert.equal(habitat.count,78);
 assert.equal(habitat.species.length,78);
 assert.equal(new Set(habitat.species.map(x=>x.id)).size,78);
 assert.deepEqual(new Set(habitat.species.map(x=>x.id)),new Set(roster.species.map(x=>x.id)));
 for(const profile of habitat.species)assert.ok(profile.sourceExpression,profile.id+" must retain its exact Java builder expression");
});
test("camel armadillo bison turtle and seal habitats preserve official groundwater and temperature limits",()=>{
 assert.deepEqual([byId.dromedary_camel.maxGroundwater,byId.dromedary_camel.minTemperatureC],[100,-5]);
 assert.deepEqual([byId.bactrian_camel.maxGroundwater,byId.bactrian_camel.maxTemperatureC],[100,-5]);
 assert.deepEqual([byId.armadillo.minGroundwater,byId.armadillo.maxGroundwater,byId.armadillo.minTemperatureC],[100,400,12]);
 assert.deepEqual([byId.bison.minGroundwater,byId.bison.maxGroundwater,byId.bison.minTemperatureC,byId.bison.maxTemperatureC,byId.bison.maxForestDensity],[160,420,-10,15,2]);
 assert.deepEqual([byId.pond_turtle.minGroundwater,byId.pond_turtle.minTemperatureC],[200,5]);
 assert.deepEqual([byId.leopard_seal.minGroundwater,byId.leopard_seal.maxTemperatureC],[105,-9]);
});
test("all freshwater fish retain their seasonal window and ignore-rivers semantics",()=>{
 const fish=["bluegill","crappie","lake_trout","rainbow_trout","largemouth_bass","smallmouth_bass","salmon","arctic_char","northern_pike","peacock_bass","pacu","red_piranha","tilapia","spotted_gudgeon","muksun","burbot"];
 for(const id of fish){
  assert.equal(byId[id].ignoreRivers,true,id);
  assert.deepEqual(byId[id].months,["MAY","JUNE","JULY","AUGUST","SEPTEMBER","OCTOBER"],id);
 }
});
test("chance and deep-water constraints remain raw source values",()=>{
 assert.equal(byId.dolphin.chance,10);
 assert.equal(byId.orca.chance,10);
 assert.equal(byId.manatee.chance,10);
 assert.equal(byId.octopoteuthis.distanceBelowSeaLevel,40);
 assert.equal(byId.octopoteuthis.maxBrightness,0);
});
