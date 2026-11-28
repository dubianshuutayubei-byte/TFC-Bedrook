import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getFaunaPrey } from "../packs/behavior_pack/scripts/core/fauna-ecology-service.mjs";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const folder=join(root,"packs/behavior_pack/entities");
const entities=readdirSync(folder).filter(name=>name.endsWith(".json")).map(name=>({
 name,
 entity:JSON.parse(readFileSync(join(folder,name),"utf8"))["minecraft:entity"]
}));
const familyOf=entry=>entry.entity.components?.["minecraft:type_family"]?.family??[];

test("all predator fauna have target selection and melee behavior for prey and livestock",()=>{
 const predators=entities.filter(entry=>familyOf(entry).includes("tfc_predator"));
 assert.ok(predators.length>0,"no predator entities were registered");
 for(const entry of predators){
  const components=entry.entity.components??{};
  const target=components["minecraft:behavior.nearest_attackable_target"];
  assert.ok(target,entry.name+" lacks predator target selection");
  assert.ok(components["minecraft:behavior.melee_attack"],entry.name+" lacks its configured attack behavior");
  const targets=(target.entity_types??[]).map(value=>value.filters?.value);
  assert.ok(targets.includes("tfc_prey"),entry.name+" does not target prey");
  assert.ok(targets.includes("tfc_livestock"),entry.name+" does not target livestock");
 }
});

test("prey and livestock entities avoid predator-family mobs",()=>{
 const prey=entities.filter(entry=>familyOf(entry).includes("tfc_prey")||familyOf(entry).includes("tfc_livestock"));
 assert.ok(prey.length>0,"no prey or livestock entities were registered");
 for(const entry of prey){
  const components=entry.entity.components??{};
  const avoid=components["minecraft:behavior.avoid_mob_type"];
  assert.ok(avoid,entry.name+" lacks predator avoidance");
  assert.ok((avoid.entity_types??[]).some(value=>value.filters?.value==="tfc_predator"),entry.name+" does not avoid predator family");
 }
});

test("deer is included in the shared prey ecosystem family",()=>{
 const deer=entities.find(entry=>entry.name==="deer.json");
 assert.ok(deer);
 assert.ok(familyOf(deer).includes("tfc_prey"));
});

test("leopard seal ecology follows the official TFC small-fish prey tag",()=>{const prey=getFaunaPrey("leopard_seal");for(const id of ["cod","pufferfish","tropical_fish","salmon","rainbow_trout","lake_trout","bluegill","largemouth_bass","smallmouth_bass","crappie","arctic_char","burbot","peacock_bass","pacu","red_piranha","northern_pike","muksun","tilapia","spotted_gudgeon"])assert.ok(prey.includes(id),id);});

test("leopard seal and pond turtle use Bedrock amphibious movement and breathing",()=>{for(const id of ["leopard_seal","pond_turtle"]){const entity=JSON.parse(readFileSync(join(folder,id+".json"),"utf8"))["minecraft:entity"];const c=entity.components;assert.ok(c["minecraft:movement.amphibious"],id);assert.ok(c["minecraft:navigation.generic"]?.is_amphibious,id);assert.equal(c["minecraft:navigation.generic"].can_walk,true,id);assert.equal(c["minecraft:navigation.generic"].can_swim,true,id);assert.equal(c["minecraft:breathable"].breathes_air,true,id);assert.equal(c["minecraft:breathable"].breathes_water,true,id);}});
test("leopard seal targets the TFC small-fish family",()=>{const seal=entities.find(x=>x.name==="leopard_seal.json");const c=seal.entity.components;assert.ok(c["minecraft:behavior.nearest_attackable_target"].entity_types.some(x=>x.filters?.value==="tfc_small_fish"));assert.ok(c["minecraft:behavior.melee_attack"]);for(const id of ["arctic_char","burbot","bluegill","crappie","lake_trout","largemouth_bass","muksun","northern_pike","pacu","peacock_bass","red_piranha","spotted_gudgeon","tilapia","smallmouth_bass","rainbow_trout"]){const fish=entities.find(x=>x.name===id+".json");assert.ok(fish,id);assert.ok(familyOf(fish).includes("tfc_small_fish"),id);}});

test("bison uses a defensive ram response with a TFC-like cooldown window",()=>{const bison=entities.find(x=>x.name==="bison.json");const c=bison.entity.components;assert.ok(c["minecraft:behavior.hurt_by_target"]);const ram=c["minecraft:behavior.ram_attack"];assert.ok(ram);assert.deepEqual(ram.cooldown_range,{min:30,max:80});assert.equal(ram.min_ram_distance,4);assert.equal(ram.ram_distance,9);assert.equal(ram.knockback_force,2.5);});

test("armadillo has a damage-triggered defensive play-dead response as a Bedrock approximation of TFC rolling",()=>{const armadillo=entities.find(x=>x.name==="armadillo.json");const behavior=armadillo.entity.components["minecraft:behavior.play_dead"];assert.ok(behavior);assert.equal(behavior.duration,4);assert.equal(behavior.random_start_chance,1);assert.deepEqual(behavior.damage_sources,["entity_attack","projectile"]);});

import { getFaunaPredators, FAUNA_ECOLOGY } from "../packs/behavior_pack/scripts/core/fauna-ecology-service.mjs";
const roster=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/fauna-roster.json"),"utf8"));
const rosterIds=new Set(roster.species.map(entry=>typeof entry==="string"?entry:entry.id));

test("every predator-prey relationship references species in the official TFC roster",()=>{
 for(const [predator,profile] of Object.entries(FAUNA_ECOLOGY)){
  assert.ok(rosterIds.has(predator),`unknown predator species: ${predator}`);
  assert.ok(profile.prey.length>0,`${predator} has no prey`);
  assert.equal(new Set(profile.prey).size,profile.prey.length,`${predator} has duplicate prey`);
  for(const prey of profile.prey){
   assert.ok(rosterIds.has(prey),`${predator} references unknown prey ${prey}`);
   assert.ok(getFaunaPredators(prey).includes(predator),`reverse predator index missing ${predator} -> ${prey}`);
  }
 }
});

test("fauna prey queries return isolated arrays",()=>{
 const first=getFaunaPrey("leopard_seal");
 first.push("not_a_species");
 assert.equal(getFaunaPrey("leopard_seal").includes("not_a_species"),false);
});
