import test from"node:test";import assert from"node:assert/strict";import{createAnimalState,createAnimalOffspringState,initializeAnimalLifeStage,canFeedAnimal,advanceAnimalFamiliarityDecay,syncAnimalHealth,advanceAnimalNeeds,feedAnimal,waterAnimal,canBreed,beginPregnancy,advancePregnancy,evaluateHabitat,evaluateFaunaSpawn,canProduce,recordProduct}from"../packs/behavior_pack/scripts/core/fauna-service.mjs";
test("needs and age advance",()=>{const a=advanceAnimalNeeds(createAnimalState({species:"deer"}),2);assert.equal(a.ageDays,2);assert.equal(a.hunger,16);assert.equal(a.thirst,24);});
test("feeding and watering reduce needs",()=>{const a=feedAnimal({hunger:80,thirst:50},10);assert.equal(a.hunger,45);assert.equal(waterAnimal(a,20).thirst,25);});
test("breeding requires healthy, fed, adult, familiar pair",()=>{const p={adultAgeDays:10,requiredFamiliarity:20,breedingCooldownDays:2};const a={species:"deer",sex:"male",ageDays:20,familiarity:30,hunger:10,thirst:10};const b={...a,sex:"female"};assert.equal(canBreed(a,b,p),true);assert.equal(canBreed({...a,hunger:90},b,p),false);assert.equal(beginPregnancy(b,a,p).started,true);});
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

test("breeding rejects same-sex, immature, unhealthy, thirsty and already pregnant pairs",()=>{
 const p={adultAgeDays:10,requiredFamiliarity:20,breedingCooldownDays:2};
 const male={species:"deer",sex:"male",ageDays:20,familiarity:30,hunger:10,thirst:10,health:100};
 const female={...male,sex:"female"};
 assert.equal(canBreed(male,{...female,sex:"female"},p),true);
 assert.equal(canBreed(male,{...female,sex:"male"},p),false);
 assert.equal(canBreed({...male,ageDays:9},female,p),false);
 assert.equal(canBreed(male,{...female,health:0},p),false);
 assert.equal(canBreed(male,{...female,thirst:70},p),false);
 assert.equal(canBreed(male,{...female,pregnancyDays:1},p),false);
});
test("breeding cooldown is enforced independently for both parents",()=>{
 const p={adultAgeDays:10,requiredFamiliarity:0,breedingCooldownDays:5};
 const male={species:"deer",sex:"male",ageDays:20,lastBreedAt:16,hunger:0,thirst:0};
 const female={...male,sex:"female",lastBreedAt:10};
 assert.equal(canBreed(male,female,p),false);
 assert.equal(canBreed({...male,lastBreedAt:15},female,p),true);
});
test("starting pregnancy records the mother's breeding time and blocks another pregnancy",()=>{
 const p={adultAgeDays:10,requiredFamiliarity:0,breedingCooldownDays:2};
 const mother={species:"deer",sex:"female",ageDays:20,hunger:0,thirst:0};
 const father={...mother,sex:"male"};
 const started=beginPregnancy(mother,father,p);
 assert.equal(started.started,true);
 assert.equal(started.animal.pregnancyDays,0.001);
 assert.equal(started.animal.lastBreedAt,20);
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
test("baby animals begin at age zero and mature when the Bedrock baby component disappears",()=>{
 const baby=initializeAnimalLifeStage({species:"cow"},{isBaby:true,adultAgeDays:192});
 assert.equal(baby.ageDays,0);assert.equal(baby.lifeStage,"juvenile");
 const adult=initializeAnimalLifeStage(baby,{isBaby:false,adultAgeDays:192});
 assert.equal(adult.ageDays,192);assert.equal(adult.lifeStage,"adult");
});
test("species without verified maturity ages do not receive fabricated ages",()=>{
 const adult=initializeAnimalLifeStage({species:"wolf"},{isBaby:false,adultAgeDays:null});
 assert.equal(adult.ageDays,0);assert.equal(adult.lifeStage,"adult");
});

test("animal product uses schedule old age only after exceeding the configured limit",()=>{
 const a=recordProduct({species:"cow",lifeStage:"adult",uses:2},10,{maxUses:2,oldDayDelay:2});
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
 const result=beginPregnancy({species:"deer",sex:"female",ageDays:20},{species:"deer",sex:"male",ageDays:20},p);
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
