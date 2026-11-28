import { ItemStack, system, world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { deserializePlayerState, serializePlayerState } from "./core/player-state-service.mjs";
import { consumeFood, advanceFoodDecay } from "./core/food-service.mjs";
import { createFireState, addFuel, advanceFire, canProcessAtTemperature } from "./core/firepit-service.mjs";
import { createSoilState, applySoilCompost, advanceSoilHydration, evaluateCropGrowth, applyNutrientUptake, inferSoilTypeFromBlockId, advanceCropGrowthProgress } from "./core/agriculture-service.mjs";
import { createAnimalState, advanceAnimalNeeds, feedAnimal, waterAnimal, canBreed, beginPregnancy, advancePregnancy, grazeAnimal } from "./core/fauna-service.mjs";
import { getStationRecipes } from "./core/processing-recipes.mjs";
import { isStationJobDue, getPendingStationOutputs, markStationOutputDelivered, markStationJobRecoverable } from "./core/station-job-service.mjs";
import { normalizeDimensionId, normalizeWeather, getRainfallMm } from "./core/environment-service.mjs";
import { calculateAmbientTemperatureC } from "./core/climate-service.mjs";
import { findMatchingAlloys } from "./core/metal-service.mjs";

const STATE_KEY="tfc:player_state",PROGRESS_KEY="tfc:knapping_progress",FOOD_FRESHNESS_KEY="tfc:food_freshness";
const FOOD_DECAY_PROFILES={"tfc:raw_meat":0.16,"tfc:cooked_meat":0.12,"tfc:grain":0.025,"tfc:maize":0.025,"tfc:potato":0.1,"tfc:vegetable":0.1,"tfc:fruit":0.11,"tfc:milk_bottle":0.18};
const CROP_PROFILES={
 wheat:{minTemperatureC:5,maxTemperatureC:30,minHydration:25,maxHydration:100,preferredNutrient:"nitrogen",minPreferredNutrient:10,optimalNutrient:60,soilTypes:["loam","silt","clay"],seed:"tfc:crop_seed",harvest:"tfc:grain"},
 maize:{minTemperatureC:12,maxTemperatureC:35,minHydration:30,maxHydration:100,preferredNutrient:"nitrogen",minPreferredNutrient:15,optimalNutrient:65,soilTypes:["loam","silt"],seed:"tfc:maize_seed",harvest:"tfc:maize"},
 potato:{minTemperatureC:4,maxTemperatureC:25,minHydration:20,maxHydration:90,preferredNutrient:"potassium",minPreferredNutrient:10,optimalNutrient:55,soilTypes:["loam","silt"],seed:"tfc:potato_seed",harvest:"tfc:potato"}
};
const WEATHER_BY_DIMENSION=new Map([["overworld","clear"]]);
const ANIMAL_PROFILES={
 "tfc:deer":{adultAgeDays:30,requiredFamiliarity:35,breedingCooldownDays:20,gestationDays:210,customBreeding:true,feedItems:["minecraft:wheat","minecraft:wheat_seeds"],grazeBlocks:["minecraft:grass_block","minecraft:tallgrass"]},
 "minecraft:cow":{adultAgeDays:30,requiredFamiliarity:30,customBreeding:false,feedItems:["minecraft:wheat"],grazeBlocks:["minecraft:grass_block"]},
 "minecraft:sheep":{adultAgeDays:24,requiredFamiliarity:25,customBreeding:false,feedItems:["minecraft:wheat"],grazeBlocks:["minecraft:grass_block"]},
 "minecraft:chicken":{adultAgeDays:12,requiredFamiliarity:20,customBreeding:false,feedItems:["minecraft:wheat_seeds","minecraft:beetroot_seeds","minecraft:melon_seeds","minecraft:pumpkin_seeds"],grazeBlocks:["minecraft:grass_block"]}
};
const inv=p=>p.getComponent("minecraft:inventory")?.container;
function count(p,id){const c=inv(p);if(!c)return 0;let n=0;for(let i=0;i<c.size;i++){const s=c.getItem(i);if(s?.typeId===id)n+=s.amount;}return n;}
function take(p,id,n){const c=inv(p);if(!c||count(p,id)<n)return false;for(let i=0;i<c.size&&n>0;i++){const s=c.getItem(i);if(!s||s.typeId!==id)continue;const k=Math.min(n,s.amount);if(k===s.amount)c.setItem(i,undefined);else{s.amount-=k;c.setItem(i,s);}n-=k;}return n===0;}
function give(p,id,n=1){const c=inv(p);if(!c)return false;const rest=c.addItem(new ItemStack(id,n));if(rest)p.dimension.spawnItem(rest,p.location);return true;}
function readFoodFreshness(player){try{const raw=player.getDynamicProperty(FOOD_FRESHNESS_KEY);return raw?JSON.parse(String(raw)):{};}catch{return {};}}
function writeFoodFreshness(player,state){try{player.setDynamicProperty(FOOD_FRESHNESS_KEY,JSON.stringify(state));}catch(error){console.warn("[TFC-Bedrook] food freshness save:",error);}}
function food(p,params){if(!p||p.typeId!=="minecraft:player")return;const s=deserializePlayerState(String(p.getDynamicProperty(STATE_KEY)??""));const freshnessState=readFoodFreshness(p);const itemId=String(params.itemId??"");const freshness=Number(freshnessState[itemId]?.freshness??100);const nutrition=params.category?{[params.category]:Number(params.nutrition??0)}:{};const result=consumeFood(s,{freshness,hydration:Number(params.hydration??0),nutrition});if(!result.consumed){p.sendMessage("§cこの食品は腐敗していて食べられません。");return;}p.setDynamicProperty(STATE_KEY,serializePlayerState(result.playerState));p.sendMessage("§a水分・栄養状態を更新しました。");}
function tickFoodFreshness(player,nowTick){
 const container=inv(player);if(!container)return;
 const freshnessState=readFoodFreshness(player);
 for(const [itemId,baseDecayPerHour] of Object.entries(FOOD_DECAY_PROFILES)){
  const slots=[];let amount=0;
  for(let slot=0;slot<container.size;slot++){const stack=container.getItem(slot);if(stack?.typeId===itemId){slots.push({slot,amount:stack.amount});amount+=stack.amount;}}
  if(amount===0){delete freshnessState[itemId];continue;}
  const previous=freshnessState[itemId]??{freshness:100,lastTick:nowTick};
  const elapsedTicks=Math.max(0,nowTick-Number(previous.lastTick??nowTick));
  const decayed=advanceFoodDecay({id:itemId,freshness:previous.freshness},elapsedTicks/72000,{temperatureC:currentTemperatureC(player.location.y-63),baseDecayPerHour});
  if(decayed.spoiled){
   for(const entry of slots)container.setItem(entry.slot,new ItemStack("tfc:spoiled_food",entry.amount));
   delete freshnessState[itemId];
  }else freshnessState[itemId]={freshness:decayed.freshness,lastTick:nowTick};
 }
 writeFoodFreshness(player,freshnessState);
}
function posKey(block,kind){const l=block.location;return "tfc:"+kind+":"+block.dimension.id+":"+Math.floor(l.x)+","+Math.floor(l.y)+","+Math.floor(l.z);}
function readWorldState(key,fallback){try{const raw=world.getDynamicProperty(key);return typeof raw==="string"?JSON.parse(raw):fallback;}catch{return fallback;}}
function writeWorldState(key,value){try{world.setDynamicProperty(key,JSON.stringify(value));return true;}catch(error){console.warn("[TFC-Bedrook] world state save:",error);return false;}}
const FUELS={
"minecraft:coal":{id:"coal",duration:2200,temperatureC:1415},
"minecraft:charcoal":{id:"charcoal",duration:1800,temperatureC:1350},
"minecraft:stick":{id:"stick",duration:600,temperatureC:900},
"minecraft:oak_log":{id:"oak_log",duration:2250,temperatureC:728},
"minecraft:spruce_log":{id:"spruce_log",duration:1500,temperatureC:608},
"minecraft:birch_log":{id:"birch_log",duration:1750,temperatureC:652},
"minecraft:jungle_log":{id:"jungle_log",duration:1500,temperatureC:700},
"minecraft:acacia_log":{id:"acacia_log",duration:1000,temperatureC:650},
"minecraft:dark_oak_log":{id:"dark_oak_log",duration:1750,temperatureC:700}
};

function stationJobKey(block){return posKey(block,"station_job");}
function completeStationJob(key,dimension,location){
 let job=readWorldState(key,null);if(!isStationJobDue(job))return false;
 try{
  for(const [id,n] of getPendingStationOutputs(job)){
   dimension.spawnItem(new ItemStack(id,n),location);
   job=markStationOutputDelivered(job,id);
   writeWorldState(key,job);
  }
  writeWorldState(key,null);
  const player=world.getAllPlayers().find(p=>p.id===job.playerId);
  if(player)player.sendMessage("§a加工完了。完成品を設備の場所に搬出しました。");
  return true;
 }catch(error){
  writeWorldState(key,markStationJobRecoverable(job));
  console.warn("[TFC-Bedrook] output retained for recovery:",error);return false;
 }
}
function recoverPlayerStationJobs(player){
 if(!player)return;
 let ids=[];try{ids=world.getDynamicPropertyIds();}catch{return;}
 for(const key of ids){if(!key.startsWith("tfc:station_job:"))continue;const job=readWorldState(key,null);if(!job||job.playerId!==player.id)continue;
  let dimension;try{dimension=world.getDimension(job.dimensionId);}catch{continue;}
  const location=job.location;if(!location)continue;
  const remaining=Math.max(0,job.endsAt-Date.now());
  if(remaining===0)completeStationJob(key,dimension,location);else scheduleStationJob(key,dimension,location,remaining/50);
 }
}
function scheduleStationJob(key,dimension,location,delayTicks){
 system.runTimeout(()=>{try{completeStationJob(key,dimension,location);}catch(error){console.warn("[TFC-Bedrook] station job completion:",error);}},Math.max(1,Math.ceil(delayTicks)));
}
async function station(player,id,block){
 const recipes=getStationRecipes(id);if(!recipes.length)return;
 const key=stationJobKey(block),existing=readWorldState(key,null);
 if(existing&&["running","ready_to_claim","delivering"].includes(existing.status)){
  const remaining=Math.max(0,existing.endsAt-Date.now());
  if(remaining<=0){const completed=completeStationJob(key,block.dimension,block.location);player.sendMessage(completed?"§a保存されていた加工が完了しました。完成品は設備の場所に出ました。":"§e加工時間は終了していますが、完成品をまだ搬出できません。後で再試行します。");return;}
  scheduleStationJob(key,block.dimension,block.location,remaining/50);
  const progress=Math.floor(100*(1-remaining/Math.max(1,existing.endsAt-existing.startedAt)));
  const form=new ActionFormData().title("設備状態").body("§e加工中: "+existing.recipeId+"\n進捗: "+progress+"%\n残り: "+Math.ceil(remaining/1000)+"秒\n\n開始後に退出しても処理結果は保存されます。").button("閉じる");
  try{await form.show(player);}catch{}return;
 }
 const state=createFireState(readWorldState(posKey(block,"fire"),{}));
 const held=inv(player)?.getItem(player.selectedSlotIndex),fuel=id==="anvil"?null:(held?FUELS[held.typeId]:null);
 if(fuel){if(!take(player,held.typeId,1)){player.sendMessage("§c燃料を取り出せません。");return;}writeWorldState(posKey(block,"fire"),addFuel(state,fuel));player.sendMessage("§a燃料投入: "+Math.round(fuel.duration/20)+"秒分");return;}
 const body=recipes.map((r,i)=>(i+1)+". "+r.title+"\n   必要温度 "+r.minimumTemperatureC+"°C / "+Math.ceil(r.durationTicks/20)+"秒").join("\n\n");
 const form=new ActionFormData().title(id==="anvil"?"金床":"加工設備").body(body+"\n\n現在温度: "+Math.floor(state.temperatureC)+"°C\n燃料残り: "+Math.ceil(state.burnTicks/20)+"秒");
 for(const recipe of recipes)form.button(recipe.title);
 if(id==="anvil")form.button("水で冷却");
 form.button("閉じる");
 let response;try{response=await form.show(player);}catch{player.sendMessage("§c設備UIを開けませんでした。");return;}
 if(response.canceled)return;
 if(id==="anvil"&&response.selection===recipes.length){
  const heldNow=inv(player)?.getItem(player.selectedSlotIndex);let water=false;
  for(let x=-2;x<=2&&!water;x++)for(let z=-2;z<=2&&!water;z++)for(const y of [0,1]){try{const b=block.dimension.getBlock({x:block.location.x+x,y:block.location.y+y,z:block.location.z+z});if(b&&(b.typeId==="minecraft:water"||b.typeId==="minecraft:flowing_water")){water=true;break;}}catch{}}
  if(!water){player.sendMessage("§c近くに水が必要です。");return;}
  const coolingMap={"tfc:heated_copper_ingot":"tfc:copper_ingot","tfc:heated_tin_ingot":"tfc:tin_ingot","tfc:heated_bronze_ingot":"tfc:bronze_ingot"};const output=coolingMap[heldNow?.typeId];if(!output||!take(player,heldNow.typeId,1)){player.sendMessage("§c加熱済みの銅・錫・青銅インゴットを手に持ってください。");return;}
  give(player,output,1);player.sendMessage("§b金属インゴットを水で冷却しました。");return;
 }
 if(response.selection>=recipes.length)return;
 const recipe=recipes[response.selection];
 if(recipe.alloyId){const matches=findMatchingAlloys(recipe.metalInputs,{recipes:[{id:recipe.alloyId,components:recipe.alloyComponents}]});if(!matches.includes(recipe.alloyId)){player.sendMessage("§c合金の配合比が範囲外です。");return;}}
 if(id!=="anvil"&&!canProcessAtTemperature(state,recipe.minimumTemperatureC)){player.sendMessage("§c温度不足です。");return;}
 for(const [itemId,amount] of Object.entries(recipe.inputs)){if(count(player,itemId)<amount){player.sendMessage("§c材料不足: "+itemId+" ×"+amount);return;}}
 const consumedInputs={};
 for(const [itemId,amount] of Object.entries(recipe.inputs)){if(!take(player,itemId,amount)){for(const [rollbackId,rollbackAmount] of Object.entries(consumedInputs))give(player,rollbackId,rollbackAmount);player.sendMessage("§c材料の取り出しに失敗したため、投入済み材料を返却しました。");return;}consumedInputs[itemId]=amount;}
 const now=Date.now(),job={status:"running",recipeId:recipe.id,outputs:recipe.outputs,playerId:player.id,startedAt:now,endsAt:now+recipe.durationTicks*50,dimensionId:block.dimension.id,location:{x:block.location.x,y:block.location.y,z:block.location.z}};
 if(!writeWorldState(key,job)){for(const [rollbackId,rollbackAmount] of Object.entries(consumedInputs))give(player,rollbackId,rollbackAmount);player.sendMessage("§c加工状態を保存できなかったため、材料を返却しました。");return;}
 player.sendMessage("§e加工を開始しました。途中退出後もジョブを保存します。");
 scheduleStationJob(key,block.dimension,block.location,recipe.durationTicks);
}
async function knap(player){
let selected=[];try{selected=JSON.parse(String(player.getDynamicProperty(PROGRESS_KEY)??"[]"));}catch{selected=[];}if(!Array.isArray(selected))selected=[];
const form=new ActionFormData().title("石器成形").body("3×3の打撃位置を選択してください。\n正解パターン: 左上・中央・右下\n選択済み: "+selected.length+"/3");
for(let i=0;i<9;i++)form.button((selected.includes(i)?"§a[選択] ":"§7[ ] ")+"位置 "+(i+1));
let response;try{response=await form.show(player);}catch{return;}if(response.canceled||response.selection===undefined)return;
const index=response.selection;if(selected.includes(index))selected=selected.filter(v=>v!==index);else if(selected.length<3)selected.push(index);
if(selected.length<3){player.setDynamicProperty(PROGRESS_KEY,JSON.stringify(selected));player.sendMessage("§e打撃位置を記録しました。");return;}
const correct=[0,4,8].every(v=>selected.includes(v));player.setDynamicProperty(PROGRESS_KEY,"[]");
if(!correct){player.sendMessage("§c形が合いません。");return;}
if(take(player,"tfc:flint",1)){give(player,"tfc:stone_shard",2);player.sendMessage("§a石片を2個作成しました。");}else player.sendMessage("§c火打石がありません。");
}
function soilKey(block){return posKey(block,"soil");}
function readSoil(block){const saved=readWorldState(soilKey(block),{});let substrate;try{substrate=block.below()?.typeId;}catch{}return createSoilState({...saved,soilType:saved.soilType??inferSoilTypeFromBlockId(substrate)});}
function soilTick(block){const soil=readSoil(block);let nearbyWater=false;for(let x=-2;x<=2&&!nearbyWater;x++)for(let z=-2;z<=2;z++){try{const b=block.dimension.getBlock({x:block.location.x+x,y:block.location.y,z:block.location.z+z});if(b&&b.typeId==="minecraft:water"){nearbyWater=true;break;}}catch{}}const weather=WEATHER_BY_DIMENSION.get(normalizeDimensionId(block.dimension.id))??"clear";const rainfallMm=getRainfallMm(weather);const next=advanceSoilHydration(soil,1/60,{rainfallMm,evaporationPerHour:nearbyWater?0.02:0.15,shadeFactor:0.7});if(nearbyWater)next.hydration=Math.min(100,next.hydration+0.5);writeWorldState(soilKey(block),next);}
async function farmlandInteract(player,block){if(!player||!block)return;const held=inv(player)?.getItem(player.selectedSlotIndex);const soil=readSoil(block);
const seedProfile=Object.values(CROP_PROFILES).find(profile=>profile.seed===held?.typeId);
if(seedProfile){const top=block.above();if(!top?.isAir){player.sendMessage("§c耕作土の上に空間が必要です。");return;}if(take(player,seedProfile.seed,1)){writeWorldState(soilKey(block),soil);top.setType("tfc:crop");top.setPermutation(top.permutation.withState("tfc:crop_type",Object.keys(CROP_PROFILES).find(key=>CROP_PROFILES[key]===seedProfile)));writeWorldState(posKey(top,"crop_progress"),0);player.sendMessage("§a"+(seedProfile.harvest==="tfc:grain"?"小麦":seedProfile.harvest==="tfc:maize"?"トウモロコシ":"ジャガイモ")+"を植えました。");}return;}
if(held?.typeId==="minecraft:bone_meal"){if(take(player,"minecraft:bone_meal",1)){writeWorldState(soilKey(block),applySoilCompost(soil));player.sendMessage("§a骨粉肥料を混ぜました。土壌養分が回復しました。");}return;}
const soilNames={loam:"壌土",silt:"シルト",clay:"粘土質"};const form=new ActionFormData().title("土壌状態").body("土質: "+(soilNames[soil.soilType]??soil.soilType)+"\n推定気温: "+currentTemperatureC(block.location.y-63).toFixed(1)+"°C\n水分: "+Math.floor(soil.hydration)+"%\n窒素: "+Math.floor(soil.nitrogen)+"\nリン: "+Math.floor(soil.phosphorus)+"\nカリウム: "+Math.floor(soil.potassium)+"\n\n骨粉を持って操作すると肥料として使えます。").button("閉じる");try{await form.show(player);}catch{}
}
function currentTemperatureC(elevationM=0){return calculateAmbientTemperatureC({meanAnnualTempC:12,seasonalAmplitudeC:14,dayOfYear:((world.getDay()%96)+96)%96,timeOfDay:world.getTimeOfDay(),elevationM:Math.max(0,elevationM),diurnalAmplitudeC:3});}
function cropTick(block){const age=block.permutation.getState("tfc:age");if(typeof age!=="number"||age>=3)return;const cropType=block.permutation.getState("tfc:crop_type")??"wheat";const profile=CROP_PROFILES[cropType]??CROP_PROFILES.wheat;let soil;try{soil=readSoil(block.below());}catch{return;}const evaluation=evaluateCropGrowth(profile,{temperatureC:currentTemperatureC(block.location.y-63)},soil);if(!evaluation.suitable)return;const progressKey=posKey(block,"crop_progress");const growth=advanceCropGrowthProgress(Number(readWorldState(progressKey,0)),evaluation.growthMultiplier);soil.hydration=Math.max(0,soil.hydration-2*evaluation.growthMultiplier);soil=applyNutrientUptake(soil,profile.preferredNutrient,1.5*evaluation.growthMultiplier);writeWorldState(soilKey(block.below()),soil);writeWorldState(progressKey,growth.progress);if(growth.stageAdvanced)block.setPermutation(block.permutation.withState("tfc:age",age+1));}
function fireTick(block){const key=posKey(block,"fire");const state=advanceFire(readWorldState(key,{}),20);writeWorldState(key,state);}
function animalState(entity){try{const raw=entity.getDynamicProperty("tfc:animal_state");const base=typeof raw==="string"?JSON.parse(raw):{};return createAnimalState({...base,species:entity.typeId.replace(":","_")});}catch{return createAnimalState({species:entity.typeId.replace(":","_")});}}
function saveAnimal(entity,state){try{entity.setDynamicProperty("tfc:animal_state",JSON.stringify(state));}catch(error){console.warn("[TFC-Bedrook] animal state save:",error);}}
function animalTick(entity){
 const profile=ANIMAL_PROFILES[entity.typeId];if(!profile)return;
 let state=animalState(entity);state=advanceAnimalNeeds(state,0.05);
 try{
  const base={x:Math.floor(entity.location.x),y:Math.floor(entity.location.y),z:Math.floor(entity.location.z)};
  let waterNearby=false,forageNearby=false;
  for(let x=-2;x<=2;x++)for(let z=-2;z<=2;z++){
   for(const y of [base.y,base.y-1]){
    const b=entity.dimension.getBlock({x:base.x+x,y,z:base.z+z});if(!b)continue;
    if(b.typeId==="minecraft:water"||b.typeId==="minecraft:flowing_water")waterNearby=true;
    if(profile.grazeBlocks.includes(b.typeId))forageNearby=true;
   }
  }
  if(waterNearby)state=waterAnimal(state,1.5);
  if(forageNearby)state=grazeAnimal(state,{hungerReduction:2});
 }catch{}
 try{const hp=entity.getComponent("minecraft:health");if(hp)hp.setCurrentValue(Math.max(0,hp.effectiveMax*state.health/100));}catch{}
 if(profile.customBreeding&&state.pregnancyDays>0){const result=advancePregnancy(state,0.05,profile.gestationDays);state=result.animal;if(result.birthReady){let born=false;try{entity.dimension.spawnEntity(entity.typeId,{x:entity.location.x+1,y:entity.location.y,z:entity.location.z});born=true;}catch(error){console.warn("[TFC-Bedrook] animal birth deferred:",error);}if(born)state.pregnancyDays=0;}}
 if(profile.customBreeding&&state.sex==="unknown")state.sex=Math.random()<0.5?"male":"female";
 if(profile.customBreeding&&state.sex==="female"&&state.ageDays>=profile.adultAgeDays&&state.familiarity>=profile.requiredFamiliarity&&state.hunger<60&&state.thirst<60&&state.pregnancyDays===0){
  try{const nearby=entity.dimension.getEntities({type:entity.typeId,location:entity.location,maxDistance:6});for(const partner of nearby){if(partner.id===entity.id)continue;const other=animalState(partner);if(canBreed(state,other,profile)){const started=beginPregnancy(state,other,profile);if(started.started){state=started.animal;other.lastBreedAt=other.ageDays;saveAnimal(partner,other);break;}}}}catch{}
 }
 saveAnimal(entity,state);
}
function animalInteract(player,entity){
 if(!player||!entity)return;
 const profile=ANIMAL_PROFILES[entity.typeId];if(!profile)return;
 const held=inv(player)?.getItem(player.selectedSlotIndex);
 if(!held){const state=animalState(entity);const names={"tfc:deer":"シカ","minecraft:cow":"ウシ","minecraft:sheep":"ヒツジ","minecraft:chicken":"ニワトリ"};player.sendMessage("§e"+(names[entity.typeId]??entity.typeId)+"\n年齢: "+state.ageDays.toFixed(1)+"日\n空腹: "+Math.floor(state.hunger)+" / 100\n渇き: "+Math.floor(state.thirst)+" / 100\n健康: "+Math.floor(state.health)+" / 100\nなつき度: "+Math.floor(state.familiarity)+" / 100"+(state.pregnancyDays>0?"\n妊娠: "+Math.floor(state.pregnancyDays)+"日":""));return;}
 if(entity.typeId==="minecraft:cow"&&held?.typeId==="minecraft:glass_bottle"){
  const state=animalState(entity);
  if(state.ageDays<profile.adultAgeDays){player.sendMessage("§eこの牛はまだ成長中です。");return;}
  const currentDay=state.ageDays;
  if(!canProduce(state,{requiredFamiliarity:0,cooldownDays:0.5,currentDay})){player.sendMessage("§eこの牛はまだミルクを補充中です。");return;}
  if(!take(player,"minecraft:glass_bottle",1)){player.sendMessage("§c空き瓶を取り出せません。");return;}
  give(player,"tfc:milk_bottle",1);
  saveAnimal(entity,recordProduct(state,currentDay));
  player.sendMessage("§a牛乳を採取しました。");
  return;
 }
 if(!held||!profile.feedItems.includes(held.typeId))return;
 // Vanilla livestock already consumes its breeding feed during the interaction event.
 // Only the custom deer entity needs a manual inventory deduction.
 if(entity.typeId==="tfc:deer"&&!take(player,held.typeId,1))return;
 const state=feedAnimal(animalState(entity),15,0);saveAnimal(entity,state);
 player.sendMessage("§a餌を与えました。なつき度: "+Math.floor(state.familiarity));
}
export function initializeGameplay(){world.afterEvents.weatherChange.subscribe(event=>{const key=normalizeDimensionId(event.dimension?.id);if(key)WEATHER_BY_DIMENSION.set(key,normalizeWeather(event.newWeather));});system.beforeEvents.startup.subscribe(event=>{
event.itemComponentRegistry.registerCustomComponent("tfc:open_knapping",{onUse:a=>{if(a.source?.typeId==="minecraft:player")void knap(a.source);}});
event.itemComponentRegistry.registerCustomComponent("tfc:consume_food",{onConsume:(a,p)=>food(a.source,p.params??{})}});
event.blockComponentRegistry.registerCustomComponent("tfc:station_ui",{onPlayerInteract:a=>{if(a.player)void station(a.player,a.block.typeId.split(":")[1],a.block);}});event.blockComponentRegistry.registerCustomComponent("tfc:heated_station_tick",{onTick:a=>fireTick(a.block)});
event.blockComponentRegistry.registerCustomComponent("tfc:farmland_interaction",{onPlayerInteract:a=>void farmlandInteract(a.player,a.block),onTick:a=>soilTick(a.block)});
event.blockComponentRegistry.registerCustomComponent("tfc:crop_growth",{onTick:a=>cropTick(a.block),onPlayerInteract:a=>{const p=a.player,b=a.block;if(!p||!b)return;if(b.permutation.getState("tfc:age")!==3){p.sendMessage("§e成長中: "+Math.floor(Number(readWorldState(posKey(b,"crop_progress"),0)))+"%");return;}const cropType=b.permutation.getState("tfc:crop_type")??"wheat";const profile=CROP_PROFILES[cropType]??CROP_PROFILES.wheat;give(p,profile.harvest,cropType==="potato"?2:3);give(p,profile.seed,1);b.setPermutation(b.permutation.withState("tfc:age",0));writeWorldState(posKey(b,"crop_progress"),0);p.sendMessage("§a収穫しました。");}});
system.runInterval(()=>{for(const dimensionId of ["overworld","nether","the_end"]){try{const dimension=world.getDimension(dimensionId);for(const type of Object.keys(ANIMAL_PROFILES))for(const entity of dimension.getEntities({type}))animalTick(entity);}catch(error){}}},1200);
system.runInterval(()=>{for(const player of world.getAllPlayers()){try{tickFoodFreshness(player,system.currentTick);}catch(error){console.warn("[TFC-Bedrook] food freshness tick failed:",error);}}},1200);
});
world.afterEvents.playerInteractWithEntity.subscribe(event=>{if(ANIMAL_PROFILES[event.target?.typeId])animalInteract(event.player,event.target);});
world.afterEvents.playerInteractWithBlock.subscribe(event=>{
 if(!event.isFirstEvent)return;
 const held=event.beforeItemStack??event.itemStack;
 if(!held?.typeId?.endsWith("_hoe"))return;
 const block=event.block;
 if(!["minecraft:dirt","minecraft:grass_block","minecraft:coarse_dirt","minecraft:rooted_dirt","minecraft:farmland"].includes(block.typeId))return;
 try{block.setType("tfc:farmland");const soil=readSoil(block);writeWorldState(soilKey(block),soil);event.player.sendMessage("§a耕作土を作りました。種を持って操作すると植えられます。");}catch(error){console.warn("[TFC-Bedrook] farmland conversion failed:",error);}
});world.afterEvents.playerSpawn.subscribe(event=>{if(event.player)recoverPlayerStationJobs(event.player);});
}
