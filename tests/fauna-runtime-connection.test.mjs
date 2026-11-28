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
 assert.ok(runtime.includes('if(!entity.typeId.startsWith("minecraft:")&&!take(player,held.typeId,1))return;'));
 assert.match(runtime,/if\(profile\.customBreeding&&state\.sex==="female"/);
});
test("custom deer retains its own pregnancy and birth cycle",()=>{
 assert.match(runtime,/"tfc:deer":\{[^}]*customBreeding:true/);
 assert.match(runtime,/advancePregnancy\(state,elapsedAgeDays,profile\.gestationDays\)/);
});

test("custom pregnancy is confined to deer; vanilla livestock uses native breeding",()=>{
 assert.match(runtime,/if\(profile\.customBreeding&&state\.pregnancyDays>0\)/);
 assert.match(runtime,/if\(profile\.customBreeding&&state\.sex==="female"/);
 assert.match(runtime,/other\.lastBreedAt=breedingTime/);
 assert.match(runtime,/entity\.dimension\.spawnEntity\(entity\.typeId\+"<tfc:spawn_baby>"/);
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
 assert.match(runtime,/grazeAnimal\(state,\{hungerReduction:35,thirstReduction:3,currentDay:world\.getDay\(\)\}\)/);
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

test("TFC dairy production supports adult female goats as well as cows",()=>{
 assert.match(runtime,/"minecraft:goat":\{[^}]*dairy:true/);
 assert.match(runtime,/if\(profile\.dairy&&held\.typeId==="minecraft:glass_bottle"\)/);
 assert.match(runtime,/entity\.hasComponent\("minecraft:is_baby"\)\|\|\(profile\.adultAgeDays!=null&&state\.ageDays<profile\.adultAgeDays\)/);
 assert.match(runtime,/const products=profile\.dairy/);
});

test("animals do not consume dropped feed when they are not hungry",()=>{
 const start=runtime.indexOf("function consumeDroppedAnimalFood");
 const end=runtime.indexOf("function animalTick",start);
 const pickup=runtime.slice(start,end);
 assert.match(pickup,/if\(!profile\.feedItems\?\.length\|\|state\.hunger<25\)return state/);
});

test("shared dairy interaction messages are species-neutral for cows and goats",()=>{
 assert.match(runtime,/メスの乳畜だけです/);
 assert.match(runtime,/乳畜の健康・空腹・渇きを回復させてください/);
 assert.match(runtime,/§a乳を採取しました/);
});

test("runtime uses official TFC maturity, gestation and production limits for supported livestock",()=>{
 for(const [entity,age,uses] of [
  ["minecraft:pig",80,60],["minecraft:horse",80,60],["minecraft:donkey",80,60],
  ["minecraft:mule",80,60],["minecraft:rabbit",80,40],["minecraft:cow",192,128],
  ["minecraft:goat",96,60],["minecraft:sheep",56,60],["minecraft:chicken",24,100]
 ]){
  const entry=runtime.match(new RegExp('"'+entity+'":\\{[^}]*\\}'))?.[0]??"";
  assert.match(entry,new RegExp("adultAgeDays:"+age));
  assert.match(entry,new RegExp("maxUses:"+uses));
 }
});
test("dairy production applies TFC familiarity, cooldown and use limits",()=>{
 assert.match(runtime,/minimumFamiliarity=profile\.productFamiliarityMin\?\?0,cooldown=profile\.productCooldownDays\?\?1/);
 assert.match(runtime,/requiredFamiliarity:minimumFamiliarity,cooldownDays:cooldown/);
 assert.match(runtime,/maxUses:profile\.maxUses\?\?Infinity/);
 assert.match(runtime,/recordProduct\(state,currentDay,\{maxUses:profile\.maxUses\?\?Infinity,oldDayDelay:1\+Math\.floor\(Math\.random\(\)\*5\)\}\)/);
 assert.match(runtime,/profile\.dairy&&held\.typeId==="minecraft:glass_bottle"/);
});
test("animal status UI reports product uses only for animals with configured production limits",()=>{
 assert.match(runtime,/const usesInfo=profile\.productCooldownDays!=null/);
 assert.match(runtime,/産出回数: .*state\.uses.*profile\.maxUses/);
});

test("animal dropped-food pickup consumes one item and preserves the remainder of a stack",()=>{
 const start=runtime.indexOf("function consumeDroppedAnimalFood");
 const end=runtime.indexOf("function animalTick",start);
 const pickup=runtime.slice(start,end);
 assert.match(pickup,/if\(stack\.amount>1\)/);
 assert.match(pickup,/new ItemStack\(stack\.typeId,stack\.amount-1\)/);
 assert.match(pickup,/entity\.dimension\.spawnItem\(new ItemStack\(stack\.typeId,stack\.amount-1\),dropped\.location\)/);
 assert.match(pickup,/dropped\.kill\(\)/);
});

test("animal runtime applies daily familiarity decay and capped TFC feeding gains",()=>{
 assert.ok(runtime.includes("state=advanceAnimalFamiliarityDecay(state,currentDay,{decayLimit:30,decayPerDay:2});"));
 assert.match(runtime,/canFeedAnimal\(state,currentDay\)/);
 assert.match(runtime,/feedAnimal\(state,firstFeedToday\?6:0,healPercent,\{currentDay,adultFamiliarityCap:profile\.familiarityCap\?\?100\}\)/);
 for(const id of ["cow","goat","sheep","chicken","pig","horse","donkey","mule","rabbit"])assert.match(runtime,new RegExp('"minecraft:'+id+'":\\{[^}]*familiarityCap:35'));
});

test("custom births trigger juvenile state and persist remaining litter count",()=>{
 assert.match(runtime,/spawnEntity\(entity\.typeId\+"<tfc:spawn_baby>"/);
 assert.match(runtime,/createAnimalOffspringState\(state,profile\.speciesId/);
 assert.match(runtime,/state\.birthsRemaining=Math\.max\(1,Math\.floor\(profile\.childCount\?\?1\)\)/);
 assert.match(runtime,/state\.birthsRemaining-=1/);
});

test("loaded animal lifecycle uses fractional world time for decay and old-age transition",()=>{
 assert.match(runtime,/const currentDay=currentAnimalDay\(\),lastAgeUpdateAt=state\.lastAgeUpdateAt>=0\?state\.lastAgeUpdateAt:currentDay,elapsedAgeDays=Math\.max\(0,currentDay-lastAgeUpdateAt\);\s*state\.lastAgeUpdateAt=currentDay;\s*state=advanceAnimalNeeds\(state,0\.05/);
 assert.match(runtime,/currentDay>state\.oldDay/);
});

test("animal tick derives age and pregnancy progress from elapsed world-calendar days",()=>{
 assert.match(runtime,/lastAgeUpdateAt=state\.lastAgeUpdateAt>=0\?state\.lastAgeUpdateAt:currentDay,elapsedAgeDays=Math\.max\(0,currentDay-lastAgeUpdateAt\)/);
 assert.match(runtime,/ageElapsedDays:elapsedAgeDays/);
 assert.match(runtime,/advancePregnancy\(state,elapsedAgeDays,profile\.gestationDays\)/);
});

test("custom breeding uses calendar-day feeding and fractional mating cooldown",()=>{
 assert.match(runtime,/const breedingDay=world\.getDay\(\),breedingTime=currentAnimalDay\(\)/);
 assert.match(runtime,/canBreed\(state,other,breedingProfile\)/);
 assert.match(runtime,/beginPregnancy\(state,other,breedingProfile\)/);
 assert.match(runtime,/other\.lastBreedAt=breedingTime;other\.lastFedDay=breedingDay-1/);
});
