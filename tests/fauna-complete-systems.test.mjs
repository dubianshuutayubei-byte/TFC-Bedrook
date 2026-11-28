import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { advanceAnimalLifecycle, initializeAnimalLifeStage, createAnimalState, createEggState, advanceEggIncubation, evaluatePredation } from "../packs/behavior_pack/scripts/core/fauna-service.mjs";
import { CUSTOM_FAUNA_PROFILES } from "../packs/behavior_pack/scripts/core/fauna-runtime-profiles.mjs";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const read=(p)=>JSON.parse(readFileSync(join(root,p),"utf8"));
const roster=read("packs/behavior_pack/data/fauna-roster.json");
const coverage=read("packs/behavior_pack/data/fauna-runtime-coverage.json");
const spawnProfiles=read("packs/behavior_pack/data/official-fauna-spawn-profiles.json");
const archetypes=read("packs/behavior_pack/data/fauna-archetypes.json");
const native=new Set(["cow","sheep","chicken","deer","pig","goat","horse","donkey","mule","rabbit","wolf","fox","polar_bear","panda","ocelot","dolphin","cod","salmon","tropical_fish","pufferfish","turtle","frog","squid"]);
const custom=roster.species.filter(s=>!native.has(s.id));

test("all 63 TFC fauna have runtime coverage and all 40 missing species have custom profiles",()=>{
 assert.equal(roster.species.length,63);
 assert.equal(coverage.runtimeTrackedCount,63);
 assert.equal(coverage.customEntityDefinitionCount,40);
 assert.equal(custom.length,40);
 assert.equal(Object.keys(CUSTOM_FAUNA_PROFILES).length,40);
 for(const s of custom)assert.ok(CUSTOM_FAUNA_PROFILES["tfc:"+s.id],s.id);
});

test("each of the 40 custom species has behavior, client geometry, spawn rule and spawn egg assets",()=>{
 for(const s of custom){
  const id=s.id;
  const entity=read("packs/behavior_pack/entities/"+id+".json")["minecraft:entity"];
  const client=read("packs/resource_pack/entity/"+id+".entity.json")["minecraft:client_entity"].description;
  const geo=read("packs/resource_pack/models/entity/"+id+".geo.json")["minecraft:geometry"][0].description;
  const spawn=read("packs/behavior_pack/spawn_rules/"+id+".json")["minecraft:spawn_rules"];
  const egg=read("packs/behavior_pack/items/"+id+"_spawn_egg.json")["minecraft:item"];
  assert.equal(entity.description.identifier,"tfc:"+id,id);
  assert.ok(entity.events["tfc:spawn_baby"],id+" missing baby spawn event");
  assert.ok(entity.events["tfc:grow_up"],id+" missing grow-up event");
  assert.ok(entity.component_groups["tfc:baby"],id+" missing juvenile component group");
  assert.equal(client.identifier,"tfc:"+id,id);
  assert.equal(client.geometry.default,geo.identifier,id);
  assert.equal(spawn.description.identifier,"tfc:"+id,id);
  assert.equal(egg.description.identifier,"tfc:"+id+"_spawn_egg",id);
  assert.equal(egg.components["minecraft:entity_placer"].entity,"tfc:"+id,id);
 }
});

test("custom natural spawn rules preserve aquatic versus surface placement",()=>{
 const byId=Object.fromEntries(spawnProfiles.species.map(s=>[s.id,s]));
 for(const s of custom){
  const rule=read("packs/behavior_pack/spawn_rules/"+s.id+".json")["minecraft:spawn_rules"];
  const c=rule.conditions[0],p=byId[s.id];
  assert.ok(c["minecraft:weight"],s.id);
  assert.ok(c["minecraft:biome_filter"],s.id);
  if(p.placement==="in_water")assert.ok(c["minecraft:spawns_underwater"],s.id);
  else assert.ok(c["minecraft:spawns_on_surface"],s.id);
 }
});

test("custom predator and prey entities expose their ecology families",()=>{
 const predatorIds=archetypes.species.filter(s=>["bear_predator","feline_predator","amphibious_predator","pack_predator"].includes(s.archetype)).map(s=>s.id).filter(id=>custom.some(s=>s.id===id));
 for(const id of predatorIds){
  const e=read("packs/behavior_pack/entities/"+id+".json")["minecraft:entity"];
  assert.ok(e.components["minecraft:type_family"].family.includes("tfc_predator"),id);
  assert.ok(e.components["minecraft:behavior.nearest_attackable_target"],id);
 }
});

test("life-stage progression, senescence and death are persistent states",()=>{
 const adult=advanceAnimalLifecycle(createAnimalState({ageDays:12,lifeStage:"juvenile",health:100}),12,{adultAgeDays:12,elapsedDays:1});
 assert.equal(adult.lifeStage,"adult");
 assert.equal(initializeAnimalLifeStage({ageDays:0,lifeStage:"juvenile"},{isBaby:true,adultAgeDays:null}).lifeStage,"juvenile");
 const old=advanceAnimalLifecycle({ageDays:30,lifeStage:"adult",oldDay:5,health:100},6,{elapsedDays:2,oldAgeHealthLossPerDay:1});
 assert.equal(old.lifeStage,"old");
 assert.equal(old.health,98);
 const dead=advanceAnimalLifecycle({...old,health:0},7,{elapsedDays:1});
 assert.equal(dead.dead,true);
 assert.equal(dead.lifeStage,"dead");
 assert.equal(dead.deathCause,"old_age");
});

test("starvation and dehydration deaths are distinguished",()=>{
 assert.equal(advanceAnimalLifecycle({health:0,hunger:100,thirst:10},1).deathCause,"starvation");
 assert.equal(advanceAnimalLifecycle({health:0,hunger:10,thirst:100},1).deathCause,"dehydration");
});

test("fertilized eggs hatch after eight viable days, while infertile or cold eggs do not",()=>{
 const egg=createEggState({species:"chicken",fertilized:true,requiredDays:8,temperatureC:37});
 const halfway=advanceEggIncubation(egg,4);
 assert.equal(halfway.ready,false);
 const hatched=advanceEggIncubation(halfway.egg,4);
 assert.equal(hatched.ready,true);
 assert.equal(hatched.egg.hatched,true);
 assert.equal(advanceEggIncubation({fertilized:false,temperatureC:37},20).ready,false);
 const cold=advanceEggIncubation({fertilized:true,temperatureC:5,viability:10},2);
 assert.equal(cold.egg.spoiled,true);
});

test("predation requires hunger, matching diet and an unprotected viable prey",()=>{
 const predator={hunger:80,health:100},prey={health:100,lifeStage:"adult"};
 assert.equal(evaluatePredation(predator,prey,{predatorDiet:["deer"],preySpecies:"deer"}).eligible,true);
 assert.equal(evaluatePredation({...predator,hunger:10},prey,{predatorDiet:["deer"],preySpecies:"deer"}).eligible,false);
 assert.equal(evaluatePredation(predator,prey,{predatorDiet:["rabbit"],preySpecies:"deer"}).eligible,false);
 assert.equal(evaluatePredation(predator,prey,{predatorDiet:["deer"],preySpecies:"deer",herdDefense:1}).eligible,false);
});

test("runtime wires lifecycle, predation and egg nest incubation into gameplay",()=>{
 const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");
 assert.match(runtime,/CUSTOM_FAUNA_PROFILES/);
 assert.match(runtime,/advanceAnimalLifecycle\(state,currentDay/);
 assert.match(runtime,/tickPredation\(entity,profile,state,currentDay\)/);
 assert.match(runtime,/registerCustomComponent\("tfc:egg_nest"/);
 assert.match(runtime,/function eggNestTick\(block\)/);
 assert.match(runtime,/valid=\["minecraft:egg","tfc:chicken_egg","tfc:duck_egg","tfc:quail_egg"\]/);
 assert.match(runtime,/stack\.typeId==="minecraft:egg"\?"chicken"/);
});

test("egg nest block, item and three bird egg items are registered",()=>{
 const block=read("packs/behavior_pack/blocks/egg_nest.json")["minecraft:block"];
 assert.equal(block.description.identifier,"tfc:egg_nest");
 assert.ok(block.components["minecraft:tick"]);
 assert.deepEqual(block.components["minecraft:tick"].interval_range,[1200,1200]);
 assert.ok(block.components["tfc:egg_nest"]);
 assert.equal(read("packs/behavior_pack/items/egg_nest.json")["minecraft:item"].components["minecraft:block_placer"].block,"tfc:egg_nest");
 for(const id of ["chicken","duck","quail"])assert.equal(read("packs/behavior_pack/items/"+id+"_egg.json")["minecraft:item"].description.identifier,"tfc:"+id+"_egg");
});

test("official domestic life-cycle profiles use the shared breeding and egg systems",()=>{
 for(const id of ["tfc:alpaca","tfc:musk_ox","tfc:yak"])assert.equal(CUSTOM_FAUNA_PROFILES[id].customBreeding,true,id);
 for(const id of ["tfc:duck","tfc:quail"])assert.equal(CUSTOM_FAUNA_PROFILES[id].eggProduct,true,id);
 const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");
 assert.match(runtime,/for\(const id of \["minecraft:cow","minecraft:sheep","minecraft:pig","minecraft:goat","minecraft:horse","minecraft:donkey","minecraft:mule","minecraft:rabbit"\]\)if\(ANIMAL_PROFILES\[id\]\?\.gestationDays\)ANIMAL_PROFILES\[id\]\.customBreeding=true/);
 assert.match(runtime,/baby\.triggerEvent\("minecraft:entity_born"\)/);
});
