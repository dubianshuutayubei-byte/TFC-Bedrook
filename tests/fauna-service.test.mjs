import test from"node:test";import assert from"node:assert/strict";import{createAnimalState,syncAnimalHealth,advanceAnimalNeeds,feedAnimal,waterAnimal,canBreed,beginPregnancy,advancePregnancy,evaluateHabitat,canProduce,recordProduct}from"../packs/behavior_pack/scripts/core/fauna-service.mjs";
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
