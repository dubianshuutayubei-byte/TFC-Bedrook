import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");
test("vanilla livestock relies on vanilla breeding and avoids duplicate feed consumption",()=>{
 assert.match(runtime,/"minecraft:cow":\{[^}]*customBreeding:false/);
 assert.match(runtime,/"minecraft:sheep":\{[^}]*customBreeding:false/);
 assert.match(runtime,/"minecraft:chicken":\{[^}]*customBreeding:false/);
 assert.match(runtime,/if\(entity\.typeId==="tfc:deer"&&!take\(player,held\.typeId,1\)\)return/);
 assert.match(runtime,/if\(profile\.customBreeding&&state\.sex==="female"/);
});
test("custom deer retains its own pregnancy and birth cycle",()=>{
 assert.match(runtime,/"tfc:deer":\{[^}]*customBreeding:true/);
 assert.match(runtime,/advancePregnancy\(state,0\.05,profile\.gestationDays\)/);
});

test("custom pregnancy is confined to deer; vanilla livestock uses native breeding",()=>{
 assert.match(runtime,/if\(profile\.customBreeding&&state\.pregnancyDays>0\)/);
 assert.match(runtime,/if\(profile\.customBreeding&&state\.sex==="female"/);
 assert.match(runtime,/other\.lastBreedAt=other\.ageDays/);
 assert.match(runtime,/entity\.dimension\.spawnEntity\(entity\.typeId/);
});
test("animal needs and age update on the periodic loaded-entity tick",()=>{
 assert.match(runtime,/advanceAnimalNeeds\(state,0\.05,/);
 assert.match(runtime,/system\.runInterval\(\(\)=>\{for\(const dimensionId of \["overworld","nether","the_end"\]\)/);
 assert.match(runtime,/\},1200\)/);
});

test("native Bedrock fauna adapters cover domestic, wild, aquatic and amphibian species",()=>{
 for(const [entity,species,kind] of [
  ["minecraft:pig","pig","terrestrial"],["minecraft:goat","goat","terrestrial"],
  ["minecraft:horse","horse","terrestrial"],["minecraft:donkey","donkey","terrestrial"],
  ["minecraft:mule","mule","terrestrial"],["minecraft:rabbit","rabbit","terrestrial"],
  ["minecraft:wolf","wolf","terrestrial"],["minecraft:fox","fox","terrestrial"],
  ["minecraft:polar_bear","polar_bear","terrestrial"],["minecraft:panda","panda","terrestrial"],
  ["minecraft:ocelot","ocelot","terrestrial"],["minecraft:dolphin","dolphin","aquatic"],
  ["minecraft:cod","cod","aquatic"],["minecraft:salmon","salmon","aquatic"],
  ["minecraft:tropicalfish","tropical_fish","aquatic"],["minecraft:pufferfish","pufferfish","aquatic"],
  ["minecraft:turtle","turtle","aquatic"],["minecraft:frog","frog","amphibian"],
  ["minecraft:squid","squid","aquatic"]
 ]){
  assert.match(runtime,new RegExp('"'+entity.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+'":\\{speciesId:"'+species+'",displayName:'));
  assert.match(runtime,new RegExp('"'+entity.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+'":\\{[^}]*kind:"'+kind+'"'));
 }
});
test("animal state stores TFC species identifiers rather than Minecraft namespace identifiers",()=>{
 assert.match(runtime,/species:profile\?\.speciesId\?\?base\.species\?\?entity\.typeId/);
});
test("all supported animal entity types are included in the periodic state update and interaction handlers",()=>{
 assert.match(runtime,/Object\.keys\(ANIMAL_PROFILES\).*dimension\.getEntities\(\{type\}\).*animalTick/);
 assert.match(runtime,/if\(ANIMAL_PROFILES\[event\.target\?\.typeId\]\)animalInteract/);
});

test("animal runtime applies species-specific needs and natural dropped-food pickup",()=>{
 assert.match(runtime,/hungerPerDay:profile\.hungerPerDay\?\?8/);
 assert.match(runtime,/thirstPerDay:profile\.thirstPerDay\?\?\(profile\.kind==="aquatic"\?0:12\)/);
 assert.match(runtime,/function consumeDroppedAnimalFood\(entity,profile,state\)/);
 assert.match(runtime,/getEntities\(\{type:"minecraft:item",location:entity\.location,maxDistance:1\.5\}\)/);
 assert.match(runtime,/grazeAnimal\(state,\{hungerReduction:35,thirstReduction:3\}\)/);
});
test("aquatic species do not lose health from terrestrial hunger and thirst simulation",()=>{
 for(const id of ["cod","salmon","tropicalfish","pufferfish","squid"]){
  const entry=runtime.match(new RegExp('"minecraft:'+id+'":\\{[^}]*\\}'))?.[0]??"";
  assert.match(entry,/hungerPerDay:0/);
  assert.match(entry,/thirstPerDay:0/);
 }
});

test("dropped-food pickup is actually invoked by the periodic animal tick",()=>{
 const start=runtime.indexOf("function animalTick");
 const end=runtime.indexOf("function animalInteract",start);
 const tick=runtime.slice(start,end);
 assert.match(tick,/state=consumeDroppedAnimalFood\(entity,profile,state\)/);
});

test("players can restore terrestrial animal thirst with a water vessel",()=>{
 assert.match(runtime,/if\(held\.typeId==="tfc:water_vessel"\)/);
 assert.match(runtime,/profile\.kind==="aquatic"/);
 assert.match(runtime,/state=waterAnimal\(state,40\);saveAnimal\(entity,state\)/);
 assert.match(runtime,/give\(player,"tfc:fired_vessel",1\)/);
});

test("animal age initialization reads the Bedrock baby component and uses verified maturity only",()=>{
 assert.match(runtime,/entity\.hasComponent\("minecraft:is_baby"\)/);
 assert.match(runtime,/initializeAnimalLifeStage\(\{\.\.\.base,species:profile\?\.speciesId/);
 assert.match(runtime,/adultAgeDays:profile\?\.adultAgeDays\?\?null/);
});

test("animal status UI only advertises manual feeding for species with configured food items",()=>{
 assert.match(runtime,/const feedHint=profile\.feedItems\.length\?/);
 assert.match(runtime,/給餌可能: .*profile\.feedItems\.map/);
 assert.match(runtime,/この種への手動給餌は未対応です/);
});
