import { OFFICIAL_FAUNA_PROFILES } from "../packs/behavior_pack/scripts/core/fauna-profiles.mjs";
import test from"node:test";import assert from"node:assert/strict";import{createAnimalState,createAnimalOffspringState,initializeAnimalLifeStage,canFeedAnimal,advanceAnimalFamiliarityDecay,syncAnimalHealth,advanceAnimalNeeds,feedAnimal,waterAnimal,canBreed,beginPregnancy,advancePregnancy,evaluateHabitat,evaluateFaunaSpawn,canProduce,recordProduct,canLayEgg,recordEggLaid,getOffspringCount} from"../packs/behavior_pack/scripts/core/fauna-service.mjs";
test("needs and age advance",()=>{const a=advanceAnimalNeeds(createAnimalState({species:"deer"}),2);assert.equal(a.ageDays,2);assert.equal(a.hunger,16);assert.equal(a.thirst,24);});
test("feeding and watering reduce needs",()=>{const a=feedAnimal({hunger:80,thirst:50},10);assert.equal(a.hunger,45);assert.equal(waterAnimal(a,20).thirst,25);});
test("breeding requires opposite-sex adults, familiarity, feeding today and calendar cooldown",()=>{const p={adultAgeDays:10,requiredFamiliarity:30,breedingCooldownDays:1,currentDay:10,currentTime:10.5};const a={species:"deer",sex:"male",ageDays:20,lifeStage:"adult",familiarity:30,lastFedDay:10,lastBreedAt:9};const b={...a,sex:"female"};assert.equal(canBreed(a,b,p),true);assert.equal(canBreed({...a,lastFedDay:9},b,p),false);assert.equal(canBreed({...a,lastBreedAt:10},b,p),false);assert.equal(canBreed({...a,fertilized:true},b,p),false);const started=beginPregnancy(b,a,p);assert.equal(started.started,true);assert.equal(started.animal.fertilized,true);assert.equal(started.animal.lastBreedAt,10.5);assert.equal(started.animal.lastFedDay,9);});
test("pregnancy timer signals birth readiness",()=>{assert.equal(advancePregnancy({species:"deer",pregnancyDays:4},6,10).birthReady,true);});
test("habitat rejects unsuitable temperature",()=>{assert.deepEqual(evaluateHabitat({minTemperatureC:5},{temperatureC:0}).failures,["temperature_low"]);});

test("severe hunger and thirst gradually reduce animal health",()=>{const a=advanceAnimalNeeds({species:"deer",hunger:100,thirst:100,health:100},1);assert.equal(a.health,98);});
test("animal product cooldown is respected",()=>{const a=recordProduct({species:"cow",ageDays:40,familiarity:50},100);assert.equal(canProduce(a,{requiredFamiliarity:30,cooldownDays:5,currentDay:103}),false);assert.equal(canProduce(a,{requiredFamiliarity:30,cooldownDays:5,currentDay:105}),true);});

import { grazeAnimal } from "../packs/behavior_pack/scripts/core/fauna-service.mjs";
test("natural grazing reduces hunger without increasing familiarity",()=>{const a=grazeAnimal({species:"deer",hunger:50,familiarity:12},{hungerReduction:8});assert.equal(a.hunger,42);assert.equal(a.familiarity,12);});

test("animal health sync preserves damage instead of restoring full health",()=>{
 const damaged=syncAnimalHealth({species:"cow",health:100},6,10);
 assert.equal(damaged.health,60);
 const invalid=syncAnimalHealth(damaged,6,0);
 assert.equal(invalid.health,60);
});

test("product eligibility checks maturity, sex, health, needs and cooldown",()=>{
 const cow={species:"minecraft_cow",sex:"female",ageDays:200,health:90,hunger:20,thirst:20,familiarity:10,lastProductAt:10};
 const rules={requiredSex:"female",minimumAgeDays:192,minimumHealth:50,maximumHunger:60,maximumThirst:60,cooldownDays:1,currentDay:11};
 assert.equal(canProduce(cow,rules),true);
 assert.equal(canProduce({...cow,sex:"male"},rules),false);
 assert.equal(canProduce({...cow,ageDays:100},rules),false);
 assert.equal(canProduce({...cow,health:20},rules),false);
 assert.equal(canProduce({...cow,hunger:80},rules),false);
 assert.equal(canProduce({...cow,lastProductAt:11},rules),false);
});

test("product eligibility rejects time moving backwards",()=>{
 assert.equal(canProduce({species:"cow",ageDays:200,lastProductAt:10},{currentDay:9}),false);
});

test("breeding rejects same-sex, immature, unhealthy, hungry, thirsty and already pregnant pairs",()=>{
 const p={adultAgeDays:10,requiredFamiliarity:20,breedingCooldownDays:2,currentDay:10,currentTime:10.5};
 const male={species:"deer",sex:"male",ageDays:20,lifeStage:"adult",familiarity:30,hunger:10,thirst:10,health:100,lastFedDay:10,lastBreedAt:8};
 const female={...male,sex:"female"};
 assert.equal(canBreed(male,female,p),true);
 assert.equal(canBreed(male,{...female,sex:"male"},p),false);
 assert.equal(canBreed({...male,ageDays:9},female,p),false);
 assert.equal(canBreed(male,{...female,health:0},p),false);
 assert.equal(canBreed(male,{...female,hunger:70},p),false);
 assert.equal(canBreed(male,{...female,thirst:70},p),false);
 assert.equal(canBreed(male,{...female,pregnancyDays:1},p),false);
});
test("breeding cooldown is enforced independently for both parents",()=>{
 const p={adultAgeDays:10,requiredFamiliarity:0,breedingCooldownDays:5,currentDay:20,currentTime:20};
 const male={species:"deer",sex:"male",lifeStage:"adult",ageDays:20,familiarity:1,hunger:0,thirst:0,lastFedDay:20,lastBreedAt:16};
 const female={...male,sex:"female",lastBreedAt:10};
 assert.equal(canBreed(male,female,p),false);
 assert.equal(canBreed({...male,lastBreedAt:15},female,p),true);
});
test("starting pregnancy records the mother's breeding time and blocks another pregnancy",()=>{
 const p={adultAgeDays:10,requiredFamiliarity:0,breedingCooldownDays:2,currentDay:20,currentTime:20};
 const mother={species:"deer",sex:"female",lifeStage:"adult",ageDays:20,familiarity:1,hunger:0,thirst:0,lastFedDay:20,lastBreedAt:18};
 const father={...mother,sex:"male"};
 const started=beginPregnancy(mother,father,p);
 assert.equal(started.started,true);
 assert.equal(started.animal.pregnancyDays,0.001);
 assert.equal(started.animal.lastBreedAt,20);
 assert.equal(started.animal.lastFedDay,19);
 assert.equal(canBreed(father,started.animal,p),false);
});
test("pregnancy progress never moves backwards",()=>{
 const result=advancePregnancy({species:"deer",pregnancyDays:4},-10,10);
 assert.equal(result.animal.pregnancyDays,4);
 assert.equal(result.birthReady,false);
});

test("official fauna habitat checks rainfall, forest density and water depth",()=>{
 const profile={minTemperatureC:-10,maxTemperatureC:20,minRainfall:100,maxRainfall:400,minForest:"edge",maxForest:"normal",belowSeaLevel:5,maxBrightness:8};
 const good=evaluateHabitat(profile,{temperatureC:10,rainfall:200,forestType:"normal",belowSeaLevel:6,brightness:4});
 assert.equal(good.suitable,true);
 assert.deepEqual(good.failures,[]);
 const bad=evaluateHabitat(profile,{temperatureC:10,rainfall:50,forestType:"none",belowSeaLevel:2,brightness:12});
 assert.equal(bad.suitable,false);
 assert.ok(bad.failures.includes("rainfall_low"));
 assert.ok(bad.failures.includes("forest_below_minimum"));
 assert.ok(bad.failures.includes("water_too_shallow"));
 assert.ok(bad.failures.includes("brightness_high"));
});
test("official fauna habitat does not treat missing climate measurements as suitable",()=>{
 const result=evaluateHabitat({minTemperatureC:0,minRainfall:100},{});
 assert.equal(result.suitable,false);
 assert.deepEqual(result.missing,["temperatureC","rainfall"]);
});

test("forest density ordering matches the official TFC ForestType enum",()=>{
 const profile={minForest:"edge",maxForest:"normal"};
 assert.equal(evaluateHabitat(profile,{forestType:"sparse"}).suitable,false);
 assert.equal(evaluateHabitat(profile,{forestType:"edge"}).suitable,true);
 assert.equal(evaluateHabitat(profile,{forestType:"normal"}).suitable,true);
 assert.equal(evaluateHabitat(profile,{forestType:"old_growth"}).suitable,false);
});

test("official fauna spawn evaluator applies chance, placement, depth, climate and brightness",()=>{
 const profile={chance:10,placement:"in_water",distanceBelowSeaLevel:5,minTemperatureC:0,maxTemperatureC:20,minRainfall:100,maxRainfall:400,minForest:"edge",maxForest:"normal",maxBrightness:4};
 const environment={inWater:true,y:50,seaLevel:63,temperatureC:10,rainfall:200,forestType:"normal",brightness:3};
 const good=evaluateFaunaSpawn(profile,environment,()=>0.01);
 assert.equal(good.suitable,true);
 assert.deepEqual(good.failures,[]);
 const bad=evaluateFaunaSpawn(profile,{...environment,y:60,brightness:8},()=>0.5);
 assert.equal(bad.suitable,false);
 assert.ok(bad.failures.includes("chance"));
 assert.ok(bad.failures.includes("too_high_above_depth_limit"));
 assert.ok(bad.failures.includes("brightness_high"));
});
test("official fauna spawn evaluator never accepts missing required environment measurements",()=>{
 const result=evaluateFaunaSpawn({distanceBelowSeaLevel:10,minTemperatureC:0,solidGround:true},{});
 assert.equal(result.suitable,false);
 assert.ok(result.missing.includes("y"));
 assert.ok(result.missing.includes("seaLevel"));
 assert.ok(result.missing.includes("temperatureC"));
 assert.ok(result.missing.includes("validSpawnGround"));
});
test("official fauna spawn evaluator validates placement and aquatic fluid requirements",()=>{
 assert.ok(evaluateFaunaSpawn({placement:"in_water"},{inWater:false},()=>0).failures.includes("not_in_water"));
 assert.ok(evaluateFaunaSpawn({placement:"on_ground"},{onGround:false},()=>0).failures.includes("not_on_ground"));
 assert.equal(evaluateFaunaSpawn({placement:"no_restrictions"},{},()=>0).suitable,true);
});

test("newly encountered adult animals start at their configured maturity age",()=>{
 const adult=initializeAnimalLifeStage({species:"cow"},{isBaby:false,adultAgeDays:192});
 assert.equal(adult.ageDays,192);assert.equal(adult.lifeStage,"adult");
});
test("baby animals remain juvenile after vanilla visual growth until TFC maturity age",()=>{
 const baby=initializeAnimalLifeStage({species:"cow"},{isBaby:true,adultAgeDays:192,currentDay:10});
 assert.equal(baby.ageDays,0);assert.equal(baby.lifeStage,"juvenile");assert.equal(baby.lastAgeUpdateAt,10);
 const visuallyAdult=initializeAnimalLifeStage({...baby,ageDays:30},{isBaby:false,adultAgeDays:192,currentDay:40});
 assert.equal(visuallyAdult.ageDays,30);assert.equal(visuallyAdult.lifeStage,"juvenile");
 const mature=initializeAnimalLifeStage({...visuallyAdult,ageDays:192},{isBaby:false,adultAgeDays:192,currentDay:202});
 assert.equal(mature.lifeStage,"adult");
});
test("species without verified maturity ages do not receive fabricated ages",()=>{
 const adult=initializeAnimalLifeStage({species:"wolf"},{isBaby:false,adultAgeDays:null});
 assert.equal(adult.ageDays,0);assert.equal(adult.lifeStage,"adult");
});

test("animal product uses schedule old age only after exceeding the configured limit",()=>{
 const a=recordProduct({species:"cow",lifeStage:"adult",familiarity:1,uses:2},10,{maxUses:2,oldDayDelay:2});
 assert.equal(a.uses,3);
 assert.equal(a.oldDay,12);
 assert.equal(a.lifeStage,"adult");
 assert.equal(canProduce(a,{currentDay:11,maxUses:2}),true);
 const old=initializeAnimalLifeStage(a,{isBaby:false,adultAgeDays:192,maxUses:2,currentDay:13});
 assert.equal(old.lifeStage,"old");
 assert.equal(canProduce(old,{currentDay:13,maxUses:2}),false);
});
test("animal initialization restores old age from the persisted old-day marker",()=>{
 const a=initializeAnimalLifeStage({species:"sheep",ageDays:60,lifeStage:"adult",uses:61,oldDay:100},{isBaby:false,adultAgeDays:56,maxUses:60,currentDay:101});
 assert.equal(a.lifeStage,"old");
});
test("pregnancy state records fertilization",()=>{
 const p={adultAgeDays:10,requiredFamiliarity:0,breedingCooldownDays:0};
 const result=beginPregnancy({species:"deer",sex:"female",lifeStage:"adult",ageDays:20,familiarity:1,lastFedDay:5,lastBreedAt:5},{species:"deer",sex:"male",lifeStage:"adult",ageDays:20,familiarity:1,lastFedDay:5,lastBreedAt:5},{...p,currentDay:5,currentTime:5});
 assert.equal(result.started,true);
 assert.equal(result.animal.fertilized,true);
});

test("TFC animal feeding is limited to once per calendar day and updates fed timestamp",()=>{
 const state={species:"cow",lifeStage:"adult",familiarity:0,lastFedDay:4};
 assert.equal(canFeedAnimal(state,4),false);
 assert.equal(canFeedAnimal(state,5),true);
 const fed=feedAnimal(state,6,0,{currentDay:5,adultFamiliarityCap:35});
 assert.equal(fed.familiarity,6);
 assert.equal(fed.lastFedDay,5);
 assert.equal(canFeedAnimal(fed,5),false);
 assert.equal(canFeedAnimal(fed,6),true);
});
test("adult familiarity is capped at the official 0.35 setting while juveniles can grow beyond it",()=>{
 const adult=feedAnimal({species:"cow",lifeStage:"adult",familiarity:33},6,0,{currentDay:1,adultFamiliarityCap:35});
 assert.equal(adult.familiarity,35);
 const juvenile=feedAnimal({species:"cow",lifeStage:"juvenile",familiarity:33},6,0,{currentDay:1,adultFamiliarityCap:35});
 assert.equal(juvenile.familiarity,39);
});
test("TFC familiarity decays by 2 percentage points per day below 30 after the grace period",()=>{
 const a=advanceAnimalFamiliarityDecay({species:"cow",familiarity:20,lastFamiliarityDecay:1},3);
 assert.equal(a.familiarity,16);
 assert.equal(a.lastFamiliarityDecay,3);
 const protectedState=advanceAnimalFamiliarityDecay({species:"cow",familiarity:35,lastFamiliarityDecay:1},3);
 assert.equal(protectedState.familiarity,35);
});

test("fuzzy fauna climate follows official TFC center-weighted probability",()=>{
 const panda={minTemperatureC:18,maxTemperatureC:28,minRainfall:300,maxRainfall:500,minForest:"normal",fuzzy:true,placement:"on_ground"};
 const center=evaluateFaunaSpawn(panda,{onGround:true,temperatureC:23,rainfall:400,forestType:"normal"},()=>0.9);
 assert.equal(center.suitable,true);
 const edge=evaluateFaunaSpawn(panda,{onGround:true,temperatureC:18,rainfall:300,forestType:"normal"},()=>0.1);
 assert.equal(edge.suitable,false);
 assert.ok(edge.failures.includes("fuzzy_climate"));
});

test("TFC animal products require familiarity strictly above the configured threshold",()=>{
 const base={species:"sheep",sex:"female",ageDays:56,health:100,hunger:0,thirst:0,lastProductAt:0,lifeStage:"adult"};
 const rules={requiredFamiliarity:15,cooldownDays:0,currentDay:1,minimumAgeDays:56};
 assert.equal(canProduce({...base,familiarity:15},rules),false);
 assert.equal(canProduce({...base,familiarity:16},rules),true);
});

test("offspring inherit the official TFC familiarity rule and begin as juveniles",()=>{
 const half=createAnimalOffspringState({familiarity:80},"deer","female");
 assert.equal(half.familiarity,40);assert.equal(half.ageDays,0);assert.equal(half.lifeStage,"juvenile");
 const high=createAnimalOffspringState({familiarity:95},"deer","male");
 assert.equal(high.familiarity,85.5);
});
test("animal state persists a partially delivered litter count",()=>{
 const state=createAnimalState({pregnancyDays:210,birthsRemaining:2});
 assert.equal(state.birthsRemaining,2);
});

test("animal needs use loaded time while TFC age can advance by world-calendar elapsed days",()=>{
 const start=createAnimalState({ageDays:4,hunger:20,thirst:20});
 const next=advanceAnimalNeeds(start,0.05,{hungerPerDay:8,thirstPerDay:12,ageElapsedDays:1});
 assert.equal(next.ageDays,5);
 assert.equal(next.hunger,20.4);
 assert.equal(next.thirst,20.6);
});

test("configured animal lifespan causes a persisted old-age death exactly at the limit",()=>{
 const start={species:"deer",ageDays:9.5,lifespanDays:10,health:100,hunger:0,thirst:0,lifeStage:"adult"};
 const alive=advanceAnimalNeeds(start,0.25,{hungerPerDay:0,thirstPerDay:0,healthLossPerDay:0});
 assert.equal(alive.isAlive,true);
 assert.equal(alive.ageDays,9.75);
 const dead=advanceAnimalNeeds(alive,0.25,{hungerPerDay:0,thirstPerDay:0,healthLossPerDay:0});
 assert.equal(dead.isAlive,false);
 assert.equal(dead.deathReason,"old_age");
 assert.equal(dead.lifeStage,"dead");
 assert.equal(dead.health,0);
});
test("dead animals remain dead and cannot breed or produce",()=>{
 const dead={species:"cow",sex:"female",ageDays:200,lifeStage:"dead",isAlive:false,deathReason:"old_age",health:0,familiarity:40,lastFedDay:10,lastBreedAt:0};
 const male={...dead,sex:"male"};
 assert.equal(canBreed(dead,male,{adultAgeDays:100,requiredFamiliarity:20,currentDay:10,currentTime:10}),false);
 assert.equal(canProduce(dead,{currentDay:10,requiredFamiliarity:10}),false);
 const unchanged=advanceAnimalNeeds(dead,10);
 assert.equal(unchanged.isAlive,false);
 assert.equal(unchanged.deathReason,"old_age");
});
test("animals without a verified lifespan do not receive a fabricated death age",()=>{
 const animal=advanceAnimalNeeds({species:"wolf",ageDays:1000,health:100},10,{hungerPerDay:0,thirstPerDay:0,healthLossPerDay:0});
 assert.equal(animal.isAlive,true);
 assert.equal(animal.lifespanDays,null);
});

test("official TFC 3.2.26 fauna database contains 63 unique species with supported placement rules",()=>{
 const entries=Object.entries(OFFICIAL_FAUNA_PROFILES);
 assert.equal(entries.length,63);
 assert.equal(new Set(entries.map(([id])=>id)).size,63);
 for(const [id,profile] of entries){
  assert.equal(profile.id,id);
  assert.ok(["on_ground","in_water","no_restrictions"].includes(profile.placement),id+" placement");
 }
});
test("all 63 official fauna profiles can be evaluated with a complete matching habitat sample",()=>{
 const forestRank={none:0,sparse:1,edge:2,normal:3,old_growth:4};
 for(const [id,p] of Object.entries(OFFICIAL_FAUNA_PROFILES)){
  let forest="normal";
  if(p.minForest&&p.maxForest){
   const candidates=Object.keys(forestRank).filter(v=>forestRank[v]>=forestRank[p.minForest]&&forestRank[v]<=forestRank[p.maxForest]);
   forest=candidates[0]??p.minForest;
  }else if(p.minForest)forest=p.minForest;
  else if(p.maxForest)forest=p.maxForest;
  const temperature=p.minTemperatureC!=null&&p.maxTemperatureC!=null?(p.minTemperatureC+p.maxTemperatureC)/2:p.minTemperatureC??p.maxTemperatureC??10;
  const rainfall=p.minRainfall!=null&&p.maxRainfall!=null?(p.minRainfall+p.maxRainfall)/2:p.minRainfall??p.maxRainfall??200;
  const environment={temperatureC:temperature,rainfall,belowSeaLevel:(p.belowSeaLevel??0)+1,brightness:p.maxBrightness??0,forestType:forest,waterType:p.waterType??"freshwater",terrain:"plains",inWater:p.placement==="in_water",onGround:p.placement==="on_ground",validSpawnGround:true,y:40,seaLevel:63};
  let rollIndex=0;const rolls=[0,0.99,0.99];const result=evaluateFaunaSpawn(p,environment,()=>rolls[Math.min(rollIndex++,rolls.length-1)]);
  assert.equal(result.suitable,true,id+": "+JSON.stringify(result));
 }
});


test("egg laying requires a healthy mature adult female and respects cooldown",()=>{
 const hen={species:"chicken",sex:"female",lifeStage:"adult",ageDays:24,familiarity:20,health:90,hunger:20,thirst:20,lastFedDay:11,lastEggAt:10};
 const rules={currentDay:11,cooldownDays:1,minimumAgeDays:24,minimumFamiliarity:15,minimumHealth:30,maximumHunger:70,maximumThirst:70,maxUses:100};
 assert.equal(canLayEgg(hen,rules),true);
 assert.equal(canLayEgg({...hen,sex:"male"},rules),false);
 assert.equal(canLayEgg({...hen,lifeStage:"juvenile"},rules),false);
 assert.equal(canLayEgg({...hen,health:20},rules),false);
 assert.equal(canLayEgg({...hen,hunger:80},rules),false);
 assert.equal(canLayEgg({...hen,lastEggAt:10.5},rules),false);
 assert.equal(canLayEgg({...hen,familiarity:15},rules),false);
 assert.equal(canLayEgg({...hen,uses:100},rules),false);
 assert.equal(canLayEgg({...hen,lastFedDay:10},rules),false);
});

test("recording an egg laid preserves the last laying day",()=>{
 const hen=recordEggLaid({species:"chicken",sex:"female",lastEggAt:4},7.25);
 assert.equal(hen.lastEggAt,7.25);
 assert.equal(hen.uses,1);
 assert.equal(recordEggLaid(hen,"invalid").lastEggAt,7.25);
});


test("offspring count supports fixed litters and bounded randomized litters",()=>{
 assert.equal(getOffspringCount({childCount:2},()=>0.5),2);
 assert.equal(getOffspringCount({childCountMin:1,childCountMax:10,childCount:6},()=>0),1);
 assert.equal(getOffspringCount({childCountMin:1,childCountMax:10,childCount:6},()=>0.999),10);
 assert.throws(()=>getOffspringCount({childCountMin:1,childCountMax:10},()=>1),RangeError);
});

test("horse and donkey can produce a persisted mule offspring while other cross-species pairs remain incompatible",()=>{
 const mare={species:"horse",sex:"female",lifeStage:"adult",ageDays:80,familiarity:40,health:100,hunger:10,thirst:10,lastFedDay:5,lastBreedAt:0};
 const jack={species:"donkey",sex:"male",lifeStage:"adult",ageDays:80,familiarity:40,health:100,hunger:10,thirst:10,lastFedDay:5,lastBreedAt:0};
 const profile={adultAgeDays:80,requiredFamiliarity:30,currentDay:5,currentTime:5,compatibleSpeciesPairs:[["horse","donkey"]],offspringSpecies:"mule",offspringEntityType:"minecraft:mule"};
 assert.equal(canBreed(mare,jack),false);
 assert.equal(canBreed(mare,jack,profile),true);
 const pregnancy=beginPregnancy(mare,jack,profile);
 assert.equal(pregnancy.started,true);
 assert.equal(pregnancy.animal.pregnancyOffspringSpecies,"mule");
 assert.equal(pregnancy.animal.pregnancyOffspringEntityType,"minecraft:mule");
 const advanced=advancePregnancy(pregnancy.animal,19,19);
 assert.equal(advanced.birthReady,true);
 assert.equal(advanced.animal.pregnancyOffspringSpecies,"mule");
 assert.equal(advanced.animal.pregnancyOffspringEntityType,"minecraft:mule");
});


import { FAUNA_ECOLOGY, getFaunaPrey, getFaunaPredators, isFaunaPredatorOf, isFaunaThreatenedBy } from "../packs/behavior_pack/scripts/core/fauna-ecology-service.mjs";
test("fauna ecology defines explicit predator and prey links without making every carnivore omnipotent",()=>{
 assert.ok(getFaunaPrey("lion").includes("gazelle"));
 assert.ok(getFaunaPrey("lion").includes("wildebeest"));
 assert.equal(isFaunaPredatorOf("lion","rabbit"),false);
 assert.equal(isFaunaPredatorOf("fox","rabbit"),true);
 assert.equal(isFaunaThreatenedBy("deer","wolf"),true);
 assert.ok(getFaunaPredators("rabbit").includes("fox"));
 assert.ok(Object.keys(FAUNA_ECOLOGY).length>=10);
});

import { OFFICIAL_LIVESTOCK_LIFECYCLE } from "../packs/behavior_pack/scripts/core/fauna-profiles.mjs";
test("verified TFC 1.21 livestock lifecycle values stay centralized and exact",()=>{
 assert.deepEqual(OFFICIAL_LIVESTOCK_LIFECYCLE.cow,{adultAgeDays:192,maxUses:128,gestationDays:58,childCount:2,productCooldownDays:1});
 assert.equal(OFFICIAL_LIVESTOCK_LIFECYCLE.alpaca.adultAgeDays,98);
 assert.equal(OFFICIAL_LIVESTOCK_LIFECYCLE.musk_ox.gestationDays,64);
 assert.equal(OFFICIAL_LIVESTOCK_LIFECYCLE.chicken.eggLayCooldownDays,30/24);
 assert.equal(OFFICIAL_LIVESTOCK_LIFECYCLE.duck.hatchDays,8);
 assert.equal(OFFICIAL_LIVESTOCK_LIFECYCLE.quail.eggLayCooldownDays,28/24);
 assert.equal(OFFICIAL_LIVESTOCK_LIFECYCLE.mule.sterile,true);
});
