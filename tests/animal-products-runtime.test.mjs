import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");

test("cow milk requires an adult female meeting health and needs thresholds",()=>{
 assert.match(runtime,/requiredSex:"female",minimumAgeDays:profile\.adultAgeDays,minimumHealth:40,maximumHunger:60,maximumThirst:60/);
 assert.match(runtime,/give\(player,"tfc:milk_bottle",1\)/);
 assert.match(runtime,/recordProduct\(state,currentDay,\{maxUses:profile\.maxUses\?\?Infinity,oldDayDelay:1\+Math\.floor\(Math\.random\(\)\*5\)\}\)/);
});

test("sheep wool uses TFC product logic and oviparous animals use nest boxes",()=>{
 assert.match(runtime,/profile\.wooly\?"\\n産出: 羊毛（TFC式のハサミ操作、"/);
 assert.match(runtime,/productCooldownDays:OFFICIAL_LIVESTOCK_LIFECYCLE\.sheep\.productCooldownDays,productFamiliarityMin:15,familiarityCap:35/);
 assert.match(runtime,/function shearAnimal\(player,entity\)/);
 assert.match(runtime,/give\(player,"tfc:wool",amount\)/);
 assert.match(runtime,/産出: 卵（巣箱へ自動産卵）/);
 assert.match(runtime,/function layAnimalEgg\(entity,state,profile,currentDay\)/);
 assert.match(runtime,/eggSpecies:"chicken"/);
 assert.match(runtime,/nearbyBreedingPair\(nest,entity\.typeId\)/);
 assert.doesNotMatch(runtime,/spawnItem\(new ItemStack\("minecraft:white_wool"/);
});

test("livestock status displays age, needs, health and product instructions",()=>{
 for(const label of ["性別: ","年齢: ","空腹: ","渇き: ","健康: ","なつき度: ","産出: 牛乳","産出: 羊毛","産出: 卵"])assert.ok(runtime.includes(label),label);
});

test("milk collection uses the exact official TFC minimum familiarity of 0.15",()=>{
 assert.ok(runtime.includes('"minecraft:cow":{adultAgeDays:OFFICIAL_LIVESTOCK_LIFECYCLE.cow.adultAgeDays,speciesId:"cow",displayName:"ウシ",gestationDays:OFFICIAL_LIVESTOCK_LIFECYCLE.cow.gestationDays,childCount:OFFICIAL_LIVESTOCK_LIFECYCLE.cow.childCount,maxUses:OFFICIAL_LIVESTOCK_LIFECYCLE.cow.maxUses,productCooldownDays:OFFICIAL_LIVESTOCK_LIFECYCLE.cow.productCooldownDays,productFamiliarityMin:15'));
 assert.ok(runtime.includes('"minecraft:goat":{speciesId:"goat",displayName:"ヤギ",adultAgeDays:OFFICIAL_LIVESTOCK_LIFECYCLE.goat.adultAgeDays,gestationDays:OFFICIAL_LIVESTOCK_LIFECYCLE.goat.gestationDays,childCount:OFFICIAL_LIVESTOCK_LIFECYCLE.goat.childCount,maxUses:OFFICIAL_LIVESTOCK_LIFECYCLE.goat.maxUses,productCooldownDays:OFFICIAL_LIVESTOCK_LIFECYCLE.goat.productCooldownDays,productFamiliarityMin:15'));
});


test("milk and wool cooldowns use fractional world days, not animal age",()=>{
 assert.match(runtime,/function currentAnimalDay\(\)\{return world\.getDay\(\)\+world\.getTimeOfDay\(\)\/24000;\}/);
 assert.match(runtime,/const currentDay=currentAnimalDay\(\),minimumFamiliarity=profile\.productFamiliarityMin\?\?0,cooldown=profile\.productCooldownDays\?\?1/);
 assert.match(runtime,/const state=animalState\(entity\),currentDay=currentAnimalDay\(\),minimumFamiliarity=profile\.productFamiliarityMin\?\?16,cooldown=profile\.productCooldownDays\?\?7/);
});

test("sheep shearing uses TFC wool production familiarity, cooldown and per-animal uses",()=>{
 assert.match(runtime,/world\.beforeEvents\.playerInteractWithEntity\.subscribe/);
 assert.match(runtime,/if\(profile\.wooly&&held\?\.typeId==="minecraft:shears"\)/);
 assert.match(runtime,/function shearAnimal\(player,entity\)/);
 assert.match(runtime,/minimumFamiliarity=profile\.productFamiliarityMin\?\?16,cooldown=profile\.productCooldownDays\?\?7/);
 assert.match(runtime,/requiredFamiliarity:minimumFamiliarity,cooldownDays:cooldown/);
 assert.match(runtime,/give\(player,"tfc:wool",amount\)/);
 assert.match(runtime,/durability\.damage\+=1/);
});

test("product timing uses fractional world calendar days rather than animal age",()=>{
 assert.match(runtime,/function currentAnimalDay\(\)\{return world\.getDay\(\)\+world\.getTimeOfDay\(\)\/24000;\}/);
 assert.match(runtime,/const currentDay=currentAnimalDay\(\),minimumFamiliarity=profile\.productFamiliarityMin\?\?0,cooldown=profile\.productCooldownDays\?\?1/);
 assert.match(runtime,/recordProduct\(state,currentDay,\{maxUses:profile\.maxUses\?\?Infinity,oldDayDelay:1\+Math\.floor\(Math\.random\(\)\*5\)\}\)/);
});

test("sheep status shows remaining wool regrowth time and specific failure reasons",()=>{
 assert.match(runtime,/再生待ち: "\+\(state\.uses>0\?Math\.max\(0,profile\.productCooldownDays-\(currentAnimalDay\(\)-state\.lastProductAt\)\)/);
 assert.match(runtime,/この動物はまだ成熟していません/);
 assert.match(runtime,/なつき度を.*以上にしてください/);
 assert.match(runtime,/羊毛が再生するまであと/);
});

test("dairy collection reports familiarity, regrowth, and animal-condition blockers separately",()=>{
 assert.match(runtime,/なつき度を.*以上にしてください/);
 assert.match(runtime,/次回の乳採取まであと/);
 assert.match(runtime,/乳畜の健康・空腹・渇きを回復させてください/);
 assert.match(runtime,/老齢化し、乳を産出できません/);
});
