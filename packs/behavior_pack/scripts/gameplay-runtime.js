import { ItemStack, system, world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { deserializePlayerState, serializePlayerState, applyHydration, applyNutrition } from "./core/player-state-service.mjs";
import { createFireState, addFuel, advanceFire, canProcessAtTemperature } from "./core/firepit-service.mjs";
import { createSoilState, applySoilCompost, advanceSoilHydration } from "./core/agriculture-service.mjs";
import { createAnimalState, advanceAnimalNeeds, feedAnimal, waterAnimal, canBreed, beginPregnancy, advancePregnancy } from "./core/fauna-service.mjs";
import { getStationRecipe } from "./core/processing-recipes.mjs";

const STATE_KEY="tfc:player_state",PROGRESS_KEY="tfc:knapping_progress";
const WEATHER_BY_DIMENSION=new Map([["overworld","Clear"]]);
const ANIMAL_PROFILES={
 "tfc:deer":{adultAgeDays:30,requiredFamiliarity:35,breedingCooldownDays:20,gestationDays:210,feedItems:["minecraft:wheat","minecraft:wheat_seeds"],grazeBlocks:["minecraft:grass_block","minecraft:tallgrass"]},
 "minecraft:cow":{adultAgeDays:30,requiredFamiliarity:30,breedingCooldownDays:20,gestationDays:280,feedItems:["minecraft:wheat"],grazeBlocks:["minecraft:grass_block"]},
 "minecraft:sheep":{adultAgeDays:24,requiredFamiliarity:25,breedingCooldownDays:18,gestationDays:150,feedItems:["minecraft:wheat"],grazeBlocks:["minecraft:grass_block"]},
 "minecraft:chicken":{adultAgeDays:12,requiredFamiliarity:20,breedingCooldownDays:10,gestationDays:21,feedItems:["minecraft:wheat_seeds","minecraft:beetroot_seeds","minecraft:melon_seeds","minecraft:pumpkin_seeds"],grazeBlocks:["minecraft:grass_block"]}
};
const inv=p=>p.getComponent("minecraft:inventory")?.container;
function count(p,id){const c=inv(p);if(!c)return 0;let n=0;for(let i=0;i<c.size;i++){const s=c.getItem(i);if(s?.typeId===id)n+=s.amount;}return n;}
function take(p,id,n){const c=inv(p);if(!c||count(p,id)<n)return false;for(let i=0;i<c.size&&n>0;i++){const s=c.getItem(i);if(!s||s.typeId!==id)continue;const k=Math.min(n,s.amount);if(k===s.amount)c.setItem(i,undefined);else{s.amount-=k;c.setItem(i,s);}n-=k;}return n===0;}
function give(p,id,n=1){const c=inv(p);if(!c)return false;const rest=c.addItem(new ItemStack(id,n));if(rest)p.dimension.spawnItem(rest,p.location);return true;}
function food(p,params){if(!p||p.typeId!=="minecraft:player")return;let s=deserializePlayerState(String(p.getDynamicProperty(STATE_KEY)??""));s=applyHydration(s,Number(params.hydration??0));if(params.category)s=applyNutrition(s,params.category,Number(params.nutrition??0));p.setDynamicProperty(STATE_KEY,serializePlayerState(s));p.sendMessage("§a水分・栄養状態を更新しました。");}
function posKey(block,kind){const l=block.location;return "tfc:"+kind+":"+block.dimension.id+":"+Math.floor(l.x)+","+Math.floor(l.y)+","+Math.floor(l.z);}
function readWorldState(key,fallback){try{const raw=world.getDynamicProperty(key);return typeof raw==="string"?JSON.parse(raw):fallback;}catch{return fallback;}}
function writeWorldState(key,value){try{world.setDynamicProperty(key,JSON.stringify(value));}catch(error){console.warn("[TFC-Bedrook] world state save:",error);}}
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
 const job=readWorldState(key,null);if(!job||job.status!=="running"||Date.now()<job.endsAt)return false;
 writeWorldState(key,null);
 let delivered=false;
 try{
  const player=world.getAllPlayers().find(p=>p.id===job.playerId);
  if(player){for(const [id,n] of Object.entries(job.outputs))give(player,id,n);player.sendMessage("§a加工完了: "+Object.keys(job.outputs).join(", "));delivered=true;}
 }catch(error){console.warn("[TFC-Bedrook] station delivery:",error);}
 if(!delivered){for(const [id,n] of Object.entries(job.outputs)){try{dimension.spawnItem(new ItemStack(id,n),location);}catch(error){console.warn("[TFC-Bedrook] output drop failed:",id,error);}}}
 return true;
}
function scheduleStationJob(key,dimension,location,delayTicks){
 system.runTimeout(()=>{try{completeStationJob(key,dimension,location);}catch(error){console.warn("[TFC-Bedrook] station job completion:",error);}},Math.max(1,Math.ceil(delayTicks)));
}
async function station(player,id,block){
 const recipe=getStationRecipe(id);if(!recipe)return;
 const key=stationJobKey(block),existing=readWorldState(key,null);
 if(existing?.status==="running"){
  const remaining=Math.max(0,existing.endsAt-Date.now());
  if(remaining<=0){completeStationJob(key,block.dimension,block.location);player.sendMessage("§a保留されていた加工を完了しました。");return;}
  scheduleStationJob(key,block.dimension,block.location,remaining/50);
  const form=new ActionFormData().title(recipe.title).body("§e加工中\n進捗: "+Math.floor(100*(1-remaining/Math.max(1,existing.endsAt-existing.startedAt)))+"%\n残り: "+Math.ceil(remaining/1000)+"秒\n\n設備を壊しても、処理結果は予定位置に回収可能な形で出力されます。").button("閉じる");
  try{await form.show(player);}catch{}return;
 }
 const state=createFireState(readWorldState(posKey(block,"fire"),{}));
 const held=inv(player)?.getItem(player.selectedSlotIndex);
 const fuel=id==="anvil"?null:(held?FUELS[held.typeId]:null);
 if(fuel){if(!take(player,held.typeId,1)){player.sendMessage("§c燃料を取り出せません。");return;}writeWorldState(posKey(block,"fire"),addFuel(state,fuel));player.sendMessage("§a燃料投入: "+Math.round(fuel.duration/20)+"秒分");return;}
 const status=id==="anvil"?"\n金床は燃料を使いません。加熱済み素材を加工します。":"\n温度: "+Math.floor(state.temperatureC)+"°C\n燃料残り: "+Math.ceil(state.burnTicks/20)+"秒";
 const buttons=id==="anvil"?["加工開始","水で冷却","閉じる"]:["加工開始","閉じる"];const form=new ActionFormData().title(recipe.title).body(recipe.description+status+"\n必要温度: "+recipe.minimumTemperatureC+"°C\n所要時間: "+Math.ceil(recipe.durationTicks/20)+"秒").button(buttons[0]);if(id==="anvil")form.button(buttons[1]);form.button(buttons[buttons.length-1]);
 let response;try{response=await form.show(player);}catch{player.sendMessage("§c設備UIを開けませんでした。");return;}
 if(response.canceled)return;
 if(id==="anvil"&&response.selection===1){const heldNow=inv(player)?.getItem(player.selectedSlotIndex);let water=false;for(let x=-2;x<=2&&!water;x++)for(let z=-2;z<=2&&!water;z++)for(const y of [0,1]){try{const b=block.dimension.getBlock({x:block.location.x+x,y:block.location.y+y,z:block.location.z+z});if(b&&(b.typeId==="minecraft:water"||b.typeId==="minecraft:flowing_water")){water=true;break;}}catch{}}if(!water){player.sendMessage("§c近くに水が必要です。");return;}if(heldNow?.typeId!=="tfc:heated_copper_ingot"||!take(player,"tfc:heated_copper_ingot",1)){player.sendMessage("§c冷却する加熱済み銅インゴットを手に持ってください。");return;}give(player,"tfc:copper_ingot",1);player.sendMessage("§b銅インゴットを水で冷却しました。");return;}
 if(response.selection!==0)return;
 if(id!=="anvil"&&!canProcessAtTemperature(state,recipe.minimumTemperatureC)){player.sendMessage("§c温度不足です。");return;}
 for(const [itemId,amount] of Object.entries(recipe.inputs)){if(count(player,itemId)<amount){player.sendMessage("§c材料不足: "+itemId+" ×"+amount);return;}}
 for(const [itemId,amount] of Object.entries(recipe.inputs)){if(!take(player,itemId,amount)){player.sendMessage("§c材料を取り出せませんでした。処理を中止しました。");return;}}
 const now=Date.now(),job={status:"running",recipeId:recipe.id,outputs:recipe.outputs,playerId:player.id,startedAt:now,endsAt:now+recipe.durationTicks*50,dimensionId:block.dimension.id,location:{x:block.location.x,y:block.location.y,z:block.location.z}};
 writeWorldState(key,job);player.sendMessage("§e加工を開始しました。途中で退出しても処理状態を保存します。");
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
function readSoil(block){return createSoilState(readWorldState(soilKey(block),{}));}
function soilTick(block){const soil=readSoil(block);let nearbyWater=false;for(let x=-2;x<=2&&!nearbyWater;x++)for(let z=-2;z<=2;z++){try{const b=block.dimension.getBlock({x:block.location.x+x,y:block.location.y,z:block.location.z+z});if(b&&b.typeId==="minecraft:water"){nearbyWater=true;break;}}catch{}}const weather=WEATHER_BY_DIMENSION.get(block.dimension.id)??"Clear";const rainfallMm=(weather==="Rain"||weather==="Thunder")?0.8:0;const next=advanceSoilHydration(soil,1/60,{rainfallMm,evaporationPerHour:nearbyWater?0.02:0.15,shadeFactor:0.7});if(nearbyWater)next.hydration=Math.min(100,next.hydration+0.5);writeWorldState(soilKey(block),next);}
async function farmlandInteract(player,block){if(!player||!block)return;const held=inv(player)?.getItem(player.selectedSlotIndex);const soil=readSoil(block);
if(held?.typeId==="tfc:crop_seed"){const top=block.above();if(!top?.isAir){player.sendMessage("§c耕作土の上に空間が必要です。");return;}if(take(player,"tfc:crop_seed",1)){writeWorldState(soilKey(block),soil);top.setType("tfc:crop");player.sendMessage("§a種を植えました。");}return;}
if(held?.typeId==="minecraft:bone_meal"){if(take(player,"minecraft:bone_meal",1)){writeWorldState(soilKey(block),applySoilCompost(soil));player.sendMessage("§a堆肥を混ぜました。土壌養分が回復しました。");}return;}
const form=new ActionFormData().title("土壌状態").body("水分: "+Math.floor(soil.hydration)+"%\n窒素: "+Math.floor(soil.nitrogen)+"\nリン: "+Math.floor(soil.phosphorus)+"\nカリウム: "+Math.floor(soil.potassium)+"\n\n骨粉を持って操作すると堆肥として使えます。").button("閉じる");try{await form.show(player);}catch{}
}
function cropTick(block){const age=block.permutation.getState("tfc:age");if(typeof age!=="number"||age>=3)return;let soil;try{soil=readSoil(block.below());}catch{return;}if(soil.hydration<20||soil.nitrogen<8)return;soil.hydration=Math.max(0,soil.hydration-2);soil.nitrogen=Math.max(0,soil.nitrogen-1.5);writeWorldState(soilKey(block.below()),soil);block.setPermutation(block.permutation.withState("tfc:age",age+1));}
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
  if(forageNearby)state.hunger=Math.max(0,state.hunger-2);
 }catch{}
 try{const hp=entity.getComponent("minecraft:health");if(hp)hp.setCurrentValue(Math.max(0,hp.effectiveMax*state.health/100));}catch{}
 if(state.pregnancyDays>0){const result=advancePregnancy(state,0.05,profile.gestationDays);state=result.animal;if(result.birthReady){try{entity.dimension.spawnEntity(entity.typeId,{x:entity.location.x+1,y:entity.location.y,z:entity.location.z});}catch{}state.pregnancyDays=0;}}
 if(state.sex==="unknown")state.sex=Math.random()<0.5?"male":"female";
 if(state.sex==="female"&&state.ageDays>=profile.adultAgeDays&&state.familiarity>=profile.requiredFamiliarity&&state.hunger<60&&state.thirst<60&&state.pregnancyDays===0){
  try{const nearby=entity.dimension.getEntities({type:entity.typeId,location:entity.location,maxDistance:6});for(const partner of nearby){if(partner.id===entity.id)continue;const other=animalState(partner);if(canBreed(state,other,profile)){const started=beginPregnancy(state,other,profile);if(started.started){state=started.animal;other.lastBreedAt=other.ageDays;saveAnimal(partner,other);break;}}}}catch{}
 }
 saveAnimal(entity,state);
}
function animalInteract(player,entity){if(!player||!entity)return;const profile=ANIMAL_PROFILES[entity.typeId];if(!profile)return;const held=inv(player)?.getItem(player.selectedSlotIndex);if(!held||!profile.feedItems.includes(held.typeId))return;if(!take(player,held.typeId,1))return;const state=feedAnimal(animalState(entity),15,0);saveAnimal(entity,state);player.sendMessage("§a餌を与えました。なつき度: "+Math.floor(state.familiarity));}
export function initializeGameplay(){world.afterEvents.weatherChange.subscribe(event=>{WEATHER_BY_DIMENSION.set(event.dimension,event.newWeather);});system.beforeEvents.startup.subscribe(event=>{
event.itemComponentRegistry.registerCustomComponent("tfc:open_knapping",{onUse:a=>{if(a.source?.typeId==="minecraft:player")void knap(a.source);}});
event.itemComponentRegistry.registerCustomComponent("tfc:consume_food",{onConsume:(a,p)=>food(a.source,p.params??{})}});
event.blockComponentRegistry.registerCustomComponent("tfc:station_ui",{onPlayerInteract:a=>{if(a.player)void station(a.player,a.block.typeId.split(":")[1],a.block);}});event.blockComponentRegistry.registerCustomComponent("tfc:heated_station_tick",{onTick:a=>fireTick(a.block)});
event.blockComponentRegistry.registerCustomComponent("tfc:farmland_interaction",{onPlayerInteract:a=>void farmlandInteract(a.player,a.block),onTick:a=>soilTick(a.block)});
event.blockComponentRegistry.registerCustomComponent("tfc:crop_growth",{onTick:a=>cropTick(a.block),onPlayerInteract:a=>{const p=a.player,b=a.block;if(!p||!b)return;if(b.permutation.getState("tfc:age")!==3){p.sendMessage("§eまだ成長中です。");return;}give(p,"tfc:grain",2);give(p,"tfc:crop_seed",1);b.setPermutation(b.permutation.withState("tfc:age",0));p.sendMessage("§a収穫しました。");}});
system.runInterval(()=>{for(const dimensionId of ["overworld","nether","the_end"]){try{const dimension=world.getDimension(dimensionId);for(const type of Object.keys(ANIMAL_PROFILES))for(const entity of dimension.getEntities({type}))animalTick(entity);}catch(error){}}},1200);
});
world.afterEvents.playerInteractWithEntity.subscribe(event=>{if(ANIMAL_PROFILES[event.target?.typeId])animalInteract(event.player,event.target);});
}
