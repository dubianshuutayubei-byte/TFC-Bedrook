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

test("sheep wool and chicken eggs use native Bedrock collection systems",()=>{
 assert.match(runtime,/産出: 羊毛（バニラのハサミ操作で採取）/);
 assert.match(runtime,/産出: 卵（バニラの産卵AI）/);
 assert.doesNotMatch(runtime,/spawnItem\(new ItemStack\("minecraft:egg"/);
 assert.doesNotMatch(runtime,/spawnItem\(new ItemStack\("minecraft:white_wool"/);
});

test("livestock status displays age, needs, health and product instructions",()=>{
 for(const label of ["性別: ","年齢: ","空腹: ","渇き: ","健康: ","なつき度: ","産出: 牛乳","産出: 羊毛","産出: 卵"])assert.ok(runtime.includes(label),label);
});

test("milk collection uses the exact official TFC minimum familiarity of 0.15",()=>{
 assert.ok(runtime.includes('"minecraft:cow":{adultAgeDays:192,speciesId:"cow",displayName:"ウシ",gestationDays:58,childCount:2,maxUses:128,productCooldownDays:1,productFamiliarityMin:15'));
 assert.ok(runtime.includes('"minecraft:goat":{speciesId:"goat",displayName:"ヤギ",adultAgeDays:96,gestationDays:32,childCount:2,maxUses:60,productCooldownDays:3,productFamiliarityMin:15'));
});

test("sheep shearing is gated by TFC familiarity, maturity, cooldown and lifetime use limit",()=>{
 assert.match(runtime,/world\.beforeEvents\.playerInteractWithEntity\.subscribe\(event=>\{/);
 assert.match(runtime,/event\.itemStack\?\.typeId!=="minecraft:shears"/);
 assert.match(runtime,/target\.hasComponent\("minecraft:is_sheared"\)/);
 assert.match(runtime,/canProduce\(state,\{requiredFamiliarity:profile\.productFamiliarityMin\?\?0,cooldownDays:profile\.productCooldownDays\?\?7,currentDay:currentAnimalDay\(\),minimumAgeDays:profile\.adultAgeDays\?\?0,maxUses:profile\.maxUses\?\?Infinity\}\)/);
 assert.match(runtime,/state=recordProduct\(state,currentAnimalDay\(\),\{maxUses:profile\.maxUses\?\?Infinity\}\)/);
});

test("milk and wool cooldowns use fractional world days, not animal age",()=>{
 assert.match(runtime,/function currentAnimalDay\(\)\{return world\.getDay\(\)\+world\.getTimeOfDay\(\)\/24000;\}/);
 assert.match(runtime,/const currentDay=currentAnimalDay\(\);/);
 assert.match(runtime,/cooldownDays:profile\.productCooldownDays\?\?7,currentDay:currentAnimalDay\(\)/);
});

test("sheep shearing uses TFC wool production familiarity, cooldown and per-animal uses",()=>{
 assert.match(runtime,/world\.beforeEvents\.playerInteractWithEntity\.subscribe/);
 assert.match(runtime,/target\?\.typeId!=="minecraft:sheep"\|\|event\.itemStack\?\.typeId!=="minecraft:shears"/);
 assert.match(runtime,/function shearAnimal\(player,entity\)/);
 assert.match(runtime,/requiredFamiliarity:profile\.productFamiliarityMin\?\?16,cooldownDays:profile\.productCooldownDays\?\?7/);
 assert.match(runtime,/give\(player,"tfc:wool",amount\)/);
 assert.match(runtime,/durability\.damage\+=1/);
});

test("product timing uses fractional world calendar days rather than animal age",()=>{
 assert.match(runtime,/function currentAnimalDay\(\)\{return world\.getDay\(\)\+world\.getTimeOfDay\(\)\/24000;\}/);
 assert.match(runtime,/const currentDay=currentAnimalDay\(\);/);
 assert.match(runtime,/recordProduct\(state,currentAnimalDay\(\),\{maxUses:profile\.maxUses\?\?Infinity\}\)/);
});
