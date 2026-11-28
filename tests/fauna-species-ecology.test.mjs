import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createAnimalState, determineOffspringCount, recordProduct, recordBreedingUse, canBreed } from "../packs/behavior_pack/scripts/core/fauna-service.mjs";
import { CUSTOM_FAUNA_PROFILES } from "../packs/behavior_pack/scripts/core/fauna-runtime-profiles.mjs";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const read=p=>JSON.parse(readFileSync(join(root,p),"utf8"));
const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");

test("TFC livestock litter sizes are rolled within documented ranges",()=>{
 assert.equal(determineOffspringCount({childCountMin:1,childCountMax:10},()=>0),1);
 assert.equal(determineOffspringCount({childCountMin:1,childCountMax:10},()=>0.999999),10);
 assert.equal(determineOffspringCount({childCount:1},()=>0.5),1);
 assert.throws(()=>determineOffspringCount({childCountMin:1,childCountMax:2},()=>1),RangeError);
});

test("product and breeding use counters independently trigger old age at their TFC limits",()=>{
 const product=recordProduct(createAnimalState({uses:127}),20,{maxUses:128,oldDayDelay:2});
 assert.equal(product.uses,128);
 assert.equal(product.oldDay,22);
 const breeding=recordBreedingUse(createAnimalState({breedUses:12}),20,{maxBreedUses:13,oldDayDelay:3});
 assert.equal(breeding.breedUses,13);
 assert.equal(breeding.oldDay,23);
 assert.equal(recordBreedingUse(createAnimalState(),20).breedUses,1);
});

test("livestock breeding stops at the per-species breeding-use limit",()=>{
 const male={species:"cow",sex:"male",ageDays:192,lifeStage:"adult",health:100,hunger:0,thirst:0,familiarity:40,lastFedDay:4,lastBreedAt:0};
 const female={...male,sex:"female"};
 assert.equal(canBreed(male,female,{adultAgeDays:192,requiredFamiliarity:30,currentDay:4,currentTime:5,maxBreedUses:13}),true);
 assert.equal(canBreed({...male,breedUses:13},female,{adultAgeDays:192,requiredFamiliarity:30,currentDay:4,currentTime:5,maxBreedUses:13}),false);
});

test("official livestock values are represented for alpaca, musk ox and yak",()=>{
 const alpaca=CUSTOM_FAUNA_PROFILES["tfc:alpaca"],musk=CUSTOM_FAUNA_PROFILES["tfc:musk_ox"],yak=CUSTOM_FAUNA_PROFILES["tfc:yak"];
 assert.deepEqual([alpaca.adultAgeDays,alpaca.gestationDays,alpaca.childCountMin,alpaca.childCountMax,alpaca.productCooldownDays,alpaca.maxUses,alpaca.maxBreedUses],[98,36,1,2,6,128,13]);
 assert.deepEqual([musk.adultAgeDays,musk.gestationDays,musk.childCountMin,musk.childCountMax,musk.productCooldownDays,musk.maxUses,musk.maxBreedUses],[168,64,1,1,4,160,16]);
 assert.deepEqual([yak.adultAgeDays,yak.gestationDays,yak.childCountMin,yak.childCountMax,yak.productCooldownDays,yak.maxUses,yak.maxBreedUses],[180,64,1,1,1,230,23]);
 assert.equal(alpaca.wooly,true);
 assert.equal(musk.wooly,true);
 assert.equal(yak.dairy,true);
});

test("duck and quail use automatic nest-box laying with eight-day incubation",()=>{
 for(const id of ["tfc:duck","tfc:quail"]){
  const p=CUSTOM_FAUNA_PROFILES[id];
  assert.equal(p.eggProduct,true);
  assert.equal(p.hatchDays,8);
 }
 assert.match(runtime,/function eggNestTick\(block\)/);
 assert.match(runtime,/!profile\?\.eggProduct\|\|bird\.typeId==="minecraft:chicken"/);
 assert.match(runtime,/const maleNearby=nearby\.some/);
 assert.match(runtime,/requiredDays:profile\.hatchDays\?\?8/);
 assert.match(runtime,/recordProduct\(state,day/);
 assert.match(runtime,/巣箱で産卵します/);
});

test("aquatic fauna distinguish swimming fish from seafloor shellfish",()=>{
 const aquatic=Object.entries(CUSTOM_FAUNA_PROFILES).filter(([,p])=>p.kind==="aquatic");
 assert.ok(aquatic.length>=10);
 const shellfish=new Set(["lobster","crayfish","isopod","horseshoe_crab"]);
 for(const [entityId] of aquatic){
  const id=entityId.split(":")[1],e=read("packs/behavior_pack/entities/"+id+".json")["minecraft:entity"].components;
  assert.ok(e["minecraft:breathable"],id+" missing breathing component");
  if(shellfish.has(id)){
   assert.ok(e["minecraft:navigation.walk"],id+" must move along the water floor");
   assert.ok(e["minecraft:behavior.avoid_mob_type"],id+" must avoid predators");
   assert.equal(e["minecraft:behavior.swim_wander"],undefined,id+" should not swim freely");
  }else{
   assert.ok(e["minecraft:navigation.swim"],id+" missing swim navigation");
   assert.ok(e["minecraft:movement.swim"],id+" missing swim movement");
  }
 }
 const manatee=read("packs/behavior_pack/entities/manatee.json")["minecraft:entity"].components["minecraft:breathable"];
 assert.equal(manatee.breathes_water,true);
});

test("predators follow TFC day/night schedules, territory and post-kill pacification",()=>{
 assert.match(runtime,/profile\.diurnal!==undefined/);
 assert.match(runtime,/state\.lastHuntAt>=0&&currentDay-state\.lastHuntAt<=0\.5\)return state/);
 assert.match(runtime,/homeDx\*homeDx\+homeDy\*homeDy\+homeDz\*homeDz>6400/);
 assert.match(runtime,/player\.applyDamage\(profile\.playerAttackDamage\?\?3\)/);
 assert.match(runtime,/if\(remaining<=0\)\{state\.hunger=Math\.max\(0,state\.hunger-28\);state\.lastHuntAt=currentDay;\}/);
 for(const id of ["black_bear","grizzly_bear"])assert.equal(CUSTOM_FAUNA_PROFILES["tfc:"+id].diurnal,true);
 for(const id of ["cougar","panther","lion","sabertooth","tiger","hyena","direwolf","crocodile"])assert.equal(CUSTOM_FAUNA_PROFILES["tfc:"+id].diurnal,false);
});

test("boar, wildebeest and moose have species-specific ramming behavior",()=>{
 for(const id of ["boar","wildebeest","moose"])assert.equal(CUSTOM_FAUNA_PROFILES["tfc:"+id].ramming,true);
 assert.match(runtime,/function tickRamming\(entity,profile,state,currentDay\)/);
 assert.match(runtime,/target\.applyDamage\(profile\.ramDamage\?\?6\)/);
 assert.match(runtime,/target\.applyKnockback/);
});

test("custom prey avoid predator family while predator archetypes can target prey",()=>{
 for(const id of ["bongo","caribou","gazelle","grouse","pheasant","turkey","peafowl"]){
  const e=read("packs/behavior_pack/entities/"+id+".json")["minecraft:entity"].components;
  assert.ok(e["minecraft:behavior.avoid_mob_type"],id+" missing predator avoidance");
  assert.ok(e["minecraft:behavior.panic"],id+" missing panic behavior");
  assert.ok(e["minecraft:behavior.avoid_mob_type"].entity_types.some(t=>t.filters?.value==="player"),id+" should fear players");
 }
 for(const id of ["black_bear","grizzly_bear","cougar","lion","tiger","hyena","direwolf","crocodile"]){
  const e=read("packs/behavior_pack/entities/"+id+".json")["minecraft:entity"].components;
  assert.ok(e["minecraft:behavior.nearest_attackable_target"],id+" missing target AI");
 }
});

test("native mule and rabbit are excluded from shared mammal breeding",()=>{
 assert.match(runtime,/for\(const id of \["minecraft:cow","minecraft:sheep","minecraft:pig","minecraft:goat","minecraft:horse","minecraft:donkey"\]\)/);
 assert.doesNotMatch(runtime,/for\(const id of \[[^\]]*"minecraft:mule"/);
 assert.doesNotMatch(runtime,/for\(const id of \[[^\]]*"minecraft:rabbit"/);
});
