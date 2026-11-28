import { ItemStack, system, world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { deserializePlayerState, serializePlayerState } from "./core/player-state-service.mjs";
import { consumeFood, advanceFoodDecay, ticksToHours } from "./core/food-service.mjs";
import { createFireState, addFuel, advanceFire, canProcessAtTemperature } from "./core/firepit-service.mjs";
import { createSoilState, advanceSoilHydration, evaluateCropGrowth, calculateCropYield, applyFertilizer, applyCropNutrientEffects, inferSoilTypeFromBlockId, inferSoilFertilityClassFromBiomeId, advanceCropGrowthProgress } from "./core/agriculture-service.mjs";
import { createAnimalState, syncAnimalHealth, advanceAnimalNeeds, feedAnimal, waterAnimal, canBreed, beginPregnancy, advancePregnancy, grazeAnimal, canProduce, recordProduct } from "./core/fauna-service.mjs";
import { getStationRecipes } from "./core/processing-recipes.mjs";
import { isStationJobDue, getPendingStationOutputs, markStationOutputDelivered, markStationJobRecoverable } from "./core/station-job-service.mjs";
import { normalizeDimensionId, normalizeWeather, getRainfallMm, inferBiomeRainfallMultiplierFromBiomeId } from "./core/environment-service.mjs";
import { calculateAmbientTemperatureC, getBiomeClimateProfile } from "./core/climate-service.mjs";
import { findMatchingAlloys } from "./core/metal-service.mjs";
import { classifyTemperature, coolItemTemperature } from "./core/heat-service.mjs";
import { summarizeOreSamples } from "./core/geology-service.mjs";

const STATE_KEY="tfc:player_state",PROGRESS_KEY="tfc:knapping_progress",FOOD_FRESHNESS_KEY="tfc:food_freshness";
const FOOD_DECAY_PROFILES={"tfc:raw_meat":0.16,"tfc:cooked_meat":0.12,"tfc:grain":0.025,"tfc:maize":0.025,"tfc:potato":0.1,"tfc:vegetable":0.1,"tfc:fruit":0.11,"tfc:milk_bottle":0.18,"tfc:dried_meat":0.04,"tfc:dried_fruit":0.03,"tfc:dried_vegetables":0.03,"tfc:bread":0.05,"tfc:barley":0.025,"tfc:oat":0.025,"tfc:rye":0.025,"tfc:beet":0.1,"tfc:cabbage":0.1,"tfc:carrot":0.1,"tfc:garlic":0.1,"tfc:onion":0.1,"tfc:squash":0.1,"tfc:lentils":0.08,"tfc:soybean":0.08,"tfc:peanuts":0.08,"tfc:bread":0.05};
const CROP_PROFILES={
 wheat:{minTemperatureC:-7,maxTemperatureC:22,minHydration:15,maxHydration:85,nutrientDemand:{nitrogen:100},nutrientEffects:{nitrogen:-1,phosphorus:0.3,potassium:0.3},seed:"tfc:crop_seed",harvest:"tfc:grain"},
 maize:{minTemperatureC:-7,maxTemperatureC:27,minHydration:50,maxHydration:100,nutrientDemand:{nitrogen:90},nutrientEffects:{nitrogen:-0.9,phosphorus:0.25,potassium:0.25},seed:"tfc:maize_seed",harvest:"tfc:maize"},
 potato:{minTemperatureC:-7,maxTemperatureC:22,minHydration:35,maxHydration:90,nutrientDemand:{nitrogen:40,phosphorus:20,potassium:60},nutrientEffects:{nitrogen:-0.4,phosphorus:-0.2,potassium:-0.6},seed:"tfc:potato_seed",harvest:"tfc:potato"},
 barley:{minTemperatureC:-7,maxTemperatureC:23,minHydration:10,maxHydration:70,nutrientDemand:{"nitrogen":75},nutrientEffects:{"nitrogen":-0.75,"phosphorus":0.2,"potassium":0.2},seed:"tfc:barley_seed",harvest:"tfc:barley"},
 oat:{minTemperatureC:-7,maxTemperatureC:22,minHydration:25,maxHydration:85,nutrientDemand:{"nitrogen":100},nutrientEffects:{"nitrogen":-1,"phosphorus":0.4,"potassium":0.3},seed:"tfc:oat_seed",harvest:"tfc:oat"},
 rye:{minTemperatureC:-7,maxTemperatureC:18,minHydration:15,maxHydration:80,nutrientDemand:{"nitrogen":100},nutrientEffects:{"nitrogen":-1,"phosphorus":0.2,"potassium":0.4},seed:"tfc:rye_seed",harvest:"tfc:rye"},
 beet:{minTemperatureC:-10,maxTemperatureC:27,minHydration:10,maxHydration:70,nutrientDemand:{"nitrogen":40,"phosphorus":30,"potassium":50},nutrientEffects:{"nitrogen":-0.4,"phosphorus":-0.3,"potassium":-0.5},seed:"tfc:beet_seed",harvest:"tfc:beet"},
 cabbage:{minTemperatureC:-10,maxTemperatureC:27,minHydration:10,maxHydration:65,nutrientDemand:{"nitrogen":50,"phosphorus":20,"potassium":40},nutrientEffects:{"nitrogen":-0.5,"phosphorus":-0.2,"potassium":-0.4},seed:"tfc:cabbage_seed",harvest:"tfc:cabbage"},
 carrot:{minTemperatureC:-10,maxTemperatureC:27,minHydration:15,maxHydration:85,nutrientDemand:{"nitrogen":50,"phosphorus":30,"potassium":40},nutrientEffects:{"nitrogen":-0.5,"phosphorus":-0.3,"potassium":-0.4},seed:"tfc:carrot_seed",harvest:"tfc:carrot"},
 garlic:{minTemperatureC:-3,maxTemperatureC:22,minHydration:10,maxHydration:70,nutrientDemand:{"nitrogen":40,"phosphorus":20,"potassium":50},nutrientEffects:{"nitrogen":-0.4,"phosphorus":-0.2,"potassium":-0.5},seed:"tfc:garlic_seed",harvest:"tfc:garlic"},
 onion:{minTemperatureC:-5,maxTemperatureC:26,minHydration:15,maxHydration:85,nutrientDemand:{"nitrogen":40,"phosphorus":40,"potassium":40},nutrientEffects:{"nitrogen":-0.4,"phosphorus":-0.4,"potassium":-0.4},seed:"tfc:onion_seed",harvest:"tfc:onion"},
 squash:{minTemperatureC:-7,maxTemperatureC:25,minHydration:15,maxHydration:85,nutrientDemand:{"nitrogen":25,"phosphorus":45,"potassium":50},nutrientEffects:{"nitrogen":-0.25,"phosphorus":-0.45,"potassium":-0.5},seed:"tfc:squash_seed",harvest:"tfc:squash"},
 lentils:{minTemperatureC:-5,maxTemperatureC:25,minHydration:15,maxHydration:50,nutrientDemand:{"phosphorus":20,"potassium":20},nutrientEffects:{"nitrogen":0.8,"phosphorus":-0.2,"potassium":-0.2},seed:"tfc:lentils_seed",harvest:"tfc:lentils"},
 soybean:{minTemperatureC:-7,maxTemperatureC:22,minHydration:25,maxHydration:90,nutrientDemand:{"phosphorus":60,"potassium":30},nutrientEffects:{"nitrogen":0.8,"phosphorus":-0.6,"potassium":-0.3},seed:"tfc:soybean_seed",harvest:"tfc:soybean"},
 peanuts:{minTemperatureC:11,maxTemperatureC:31,minHydration:20,maxHydration:80,nutrientDemand:{"phosphorus":50,"potassium":50},nutrientEffects:{"nitrogen":0.9,"phosphorus":-0.5,"potassium":-0.5},seed:"tfc:peanuts_seed",harvest:"tfc:peanuts"}
};
const ITEM_TEMPERATURE_KEY="tfc:temperature_c",ITEM_HEAT_TICK_KEY="tfc:heat_updated_tick";
const HEATED_METAL_PROFILES=Object.freeze({
 "tfc:heated_copper_ingot":{initialTemperatureC:1080,heatCapacity:2.857,forgingTemperatureC:648},
 "tfc:heated_tin_ingot":{initialTemperatureC:230,heatCapacity:7.143,forgingTemperatureC:138},
 "tfc:heated_bronze_ingot":{initialTemperatureC:950,heatCapacity:2.857,forgingTemperatureC:570}
});
function createOutputStack(id,amount=1){
 const stack=new ItemStack(id,amount),profile=HEATED_METAL_PROFILES[id];
 if(profile)stack.setDynamicProperties({[ITEM_TEMPERATURE_KEY]:profile.initialTemperatureC,[ITEM_HEAT_TICK_KEY]:system.currentTick});
 return stack;
}
function tickMetalHeat(player,nowTick){
 const container=inv(player);if(!container)return;
 for(let i=0;i<container.size;i++){
  const stack=container.getItem(i),profile=HEATED_METAL_PROFILES[stack?.typeId];if(!stack||!profile)continue;
  const rawTemperature=stack.getDynamicProperty(ITEM_TEMPERATURE_KEY),rawTick=stack.getDynamicProperty(ITEM_HEAT_TICK_KEY);
  const current=Number.isFinite(Number(rawTemperature))?Number(rawTemperature):20;
  const last=Number.isFinite(Number(rawTick))?Number(rawTick):nowTick;
  const elapsed=nowTick>=last?nowTick-last:0;
  const next=coolItemTemperature(current,profile,elapsed);
  if(next!==current||last!==nowTick||rawTemperature===undefined){stack.setDynamicProperties({[ITEM_TEMPERATURE_KEY]:next,[ITEM_HEAT_TICK_KEY]:nowTick});container.setItem(i,stack);}
 }
}
const ITEM_LABELS={"tfc:raw_meat":"生肉","tfc:cooked_meat":"焼いた肉","tfc:clay_vessel":"未焼成土器","tfc:fired_vessel":"焼成土器","tfc:unfired_ingot_mold":"未焼成鋳型","tfc:fired_ingot_mold":"焼成鋳型","tfc:copper_ore":"銅鉱石","tfc:heated_copper_ingot":"加熱銅インゴット","tfc:copper_ingot":"銅インゴット","tfc:tin_ore":"錫鉱石","tfc:heated_tin_ingot":"加熱錫インゴット","tfc:tin_ingot":"錫インゴット","tfc:heated_bronze_ingot":"加熱青銅インゴット","tfc:bronze_ingot":"青銅インゴット","tfc:fruit":"果物","tfc:vegetable":"野菜","tfc:dried_meat":"干し肉","tfc:dried_fruit":"干し果物","tfc:dried_vegetables":"干し野菜","tfc:compost":"堆肥","minecraft:oak_leaves":"落ち葉","tfc:barley":"大麦","tfc:oat":"オーツ麦","tfc:rye":"ライ麦","tfc:beet":"ビーツ","tfc:cabbage":"キャベツ","tfc:carrot":"ニンジン","tfc:garlic":"ニンニク","tfc:onion":"タマネギ","tfc:squash":"カボチャ","tfc:lentils":"レンズ豆","tfc:soybean":"大豆","tfc:peanuts":"落花生","tfc:quern":"石臼","tfc:handstone":"上臼石","tfc:flour":"小麦粉","tfc:dough":"生地","tfc:bread":"パン"};
const WILD_SEED_DROPS=Object.freeze({
 "minecraft:short_grass":["tfc:barley_seed","tfc:oat_seed","tfc:rye_seed","tfc:lentils_seed","tfc:soybean_seed","tfc:peanuts_seed"],
 "minecraft:tall_grass":["tfc:barley_seed","tfc:oat_seed","tfc:rye_seed","tfc:lentils_seed","tfc:soybean_seed","tfc:peanuts_seed"],
 "minecraft:fern":["tfc:beet_seed","tfc:cabbage_seed","tfc:carrot_seed","tfc:garlic_seed","tfc:onion_seed","tfc:squash_seed"],
 "minecraft:large_fern":["tfc:beet_seed","tfc:cabbage_seed","tfc:carrot_seed","tfc:garlic_seed","tfc:onion_seed","tfc:squash_seed"]
});
const FERTILIZER_PROFILES=Object.freeze({
 "minecraft:bone_meal":{name:"骨粉",nutrients:{phosphorus:10}},
 "tfc:compost":{name:"堆肥",nutrients:{nitrogen:20,potassium:20}},
 "tfc:wood_ash":{name:"木灰",nutrients:{phosphorus:10,potassium:20}}
});
const WEATHER_BY_DIMENSION=new Map([["overworld","clear"]]);
const ANIMAL_PROFILES={
 "tfc:deer":{adultAgeDays:30,requiredFamiliarity:35,breedingCooldownDays:20,gestationDays:210,customBreeding:true,feedItems:["minecraft:wheat","minecraft:wheat_seeds"],grazeBlocks:["minecraft:grass_block","minecraft:tallgrass"]},
 "minecraft:cow":{adultAgeDays:192,requiredFamiliarity:30,customBreeding:false,feedItems:["minecraft:wheat"],grazeBlocks:["minecraft:grass_block"]},
 "minecraft:sheep":{adultAgeDays:56,requiredFamiliarity:25,customBreeding:false,feedItems:["minecraft:wheat"],grazeBlocks:["minecraft:grass_block"]},
 "minecraft:chicken":{adultAgeDays:24,requiredFamiliarity:20,customBreeding:false,feedItems:["minecraft:wheat_seeds","minecraft:beetroot_seeds","minecraft:melon_seeds","minecraft:pumpkin_seeds"],grazeBlocks:["minecraft:grass_block"]}
};
const inv=p=>p.getComponent("minecraft:inventory")?.container;
function count(p,id){const c=inv(p);if(!c)return 0;let n=0;for(let i=0;i<c.size;i++){const s=c.getItem(i);if(s?.typeId===id)n+=s.amount;}return n;}
function take(p,id,n){const c=inv(p);if(!c||count(p,id)<n)return false;for(let i=0;i<c.size&&n>0;i++){const s=c.getItem(i);if(!s||s.typeId!==id)continue;const k=Math.min(n,s.amount);if(k===s.amount)c.setItem(i,undefined);else{s.amount-=k;c.setItem(i,s);}n-=k;}return n===0;}
function give(p,id,n=1){const c=inv(p);if(!c)return false;const rest=c.addItem(createOutputStack(id,n));if(rest)p.dimension.spawnItem(rest,p.location);return true;}
function readFoodFreshness(player){try{const raw=player.getDynamicProperty(FOOD_FRESHNESS_KEY);return raw?JSON.parse(String(raw)):{};}catch{return {};}}
function writeFoodFreshness(player,state){try{player.setDynamicProperty(FOOD_FRESHNESS_KEY,JSON.stringify(state));}catch(error){console.warn("[TFC-Bedrook] food freshness save:",error);}}
function fillWaterVessel(player,block){
 if(!player||!block)return;
 if(block.typeId!=="minecraft:water"&&block.typeId!=="minecraft:flowing_water"){player.sendMessage("§c水源に向けて土器を使ってください。");return;}
 if(!take(player,"tfc:fired_vessel",1)){player.sendMessage("§c空の焼成土器が必要です。");return;}
 give(player,"tfc:water_vessel",1);
 player.sendMessage("§b土器に水を汲みました。飲むと水分が回復します。");
}
function drinkWaterVessel(player){
 if(!player||player.typeId!=="minecraft:player")return;
 const state=deserializePlayerState(String(player.getDynamicProperty(STATE_KEY)??""));
 const result=consumeFood(state,{freshness:100,hydration:35,nutrition:{}});
 if(!result.consumed)return;
 if(!take(player,"tfc:water_vessel",1)){player.sendMessage("§c水入り土器を手に持ってください。");return;}
 player.setDynamicProperty(STATE_KEY,serializePlayerState(result.playerState));
 give(player,"tfc:fired_vessel",1);
 player.sendMessage("§b水を飲みました。水分 +35。空の土器が戻りました。");
}
function mixDough(player){
 if(!player||player.typeId!=="minecraft:player")return;
 const held=inv(player)?.getItem(player.selectedSlotIndex);
 if(held?.typeId!=="tfc:flour"){player.sendMessage("§e小麦粉を手に持って使ってください。");return;}
 if(count(player,"tfc:water_vessel")<1){player.sendMessage("§c水入り土器が必要です。");return;}
 if(!take(player,"tfc:flour",1)||!take(player,"tfc:water_vessel",1)){player.sendMessage("§c材料を取り出せませんでした。");return;}
 give(player,"tfc:dough",1);give(player,"tfc:fired_vessel",1);
 player.sendMessage("§a小麦粉と水を混ぜて生地を作りました。空の土器が戻りました。");
}
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
  const decayed=advanceFoodDecay({id:itemId,freshness:previous.freshness},ticksToHours(elapsedTicks),{temperatureC:temperatureAt(player.dimension,player.location),baseDecayPerHour});
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

const PROSPECTING_ORES=Object.freeze({
 "minecraft:coal_ore":"石炭","minecraft:deepslate_coal_ore":"石炭",
 "minecraft:copper_ore":"銅","minecraft:deepslate_copper_ore":"銅",
 "minecraft:iron_ore":"鉄","minecraft:deepslate_iron_ore":"鉄",
 "minecraft:gold_ore":"金","minecraft:deepslate_gold_ore":"金",
 "minecraft:redstone_ore":"レッドストーン","minecraft:deepslate_redstone_ore":"レッドストーン",
 "minecraft:lapis_ore":"ラピスラズリ","minecraft:deepslate_lapis_ore":"ラピスラズリ",
 "minecraft:diamond_ore":"ダイヤモンド","minecraft:deepslate_diamond_ore":"ダイヤモンド",
 "minecraft:emerald_ore":"エメラルド","minecraft:deepslate_emerald_ore":"エメラルド",
 "minecraft:nether_quartz_ore":"ネザークォーツ","minecraft:nether_gold_ore":"ネザー金"
});
const PROSPECTING_ABUNDANCE={trace:"痕跡",small:"少量",large:"豊富",very_large:"非常に豊富"};
function prospect(player,centerBlock){
 if(!player||!centerBlock)return;
 const center=centerBlock.location,counts={},radius=4;
 let samples=0,hostRock=centerBlock.typeId;
 for(let dx=-radius;dx<=radius;dx++)for(let dz=-radius;dz<=radius;dz++)for(let dy=-2;dy<=2;dy++){
  try{
   const block=centerBlock.dimension.getBlock({x:Math.floor(center.x)+dx,y:Math.floor(center.y)+dy,z:Math.floor(center.z)+dz});
   if(!block)continue;samples++;
   const ore=PROSPECTING_ORES[block.typeId];if(ore)counts[ore]=(counts[ore]??0)+1;
  }catch{}
 }
 const summary=summarizeOreSamples(counts);
 const lines=summary.slice(0,5).map(entry=>entry.ore+": "+entry.count+"ブロック（"+PROSPECTING_ABUNDANCE[entry.abundance]+"）");
 player.sendMessage("§6地質調査結果§r\n基準岩石: "+hostRock+"\n調査範囲: 水平"+radius+"ブロック / 上下2ブロック\n調査ブロック数: "+samples+"\n"+(lines.length?lines.join("\n"):"鉱石は検出されませんでした。"));
}

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
   dimension.spawnItem(createOutputStack(id,n),location);
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
async function processQuernManually(player,block,recipe){
 const held=inv(player)?.getItem(player.selectedSlotIndex);
 if(held?.typeId!=="tfc:handstone"){player.sendMessage("§e上臼石を手に持って石臼を操作してください。");return;}
 const missing=Object.entries(recipe.inputs).filter(([itemId,amount])=>count(player,itemId)<amount);
 if(missing.length){player.sendMessage("§c材料不足: "+missing.map(([id,n])=>(ITEM_LABELS[id]??id)+" ×"+n).join("、"));return;}
 for(let turn=0;turn<3;turn++){
  const form=new ActionFormData().title("石臼").body("穀物を挽いています。\n手動回転: "+(turn+1)+" / 3\n上臼石を回してください。").button("上臼を回す").button("中止");
  const response=await form.show(player);
  if(response.canceled||response.selection!==0){player.sendMessage("§e粉挽きを中止しました。材料は消費されていません。");return;}
  const current=inv(player)?.getItem(player.selectedSlotIndex);
  if(current?.typeId!=="tfc:handstone"||block.typeId!=="tfc:quern"){player.sendMessage("§c石臼か上臼石が手元からなくなりました。");return;}
 }
 const removed=[];
 for(const [itemId,amount] of Object.entries(recipe.inputs)){
  if(!take(player,itemId,amount)){
   for(const [restoreId,restoreAmount] of removed)give(player,restoreId,restoreAmount);
   player.sendMessage("§c材料を取り出せませんでした。取り出し済みの材料は返却しました。");return;
  }
  removed.push([itemId,amount]);
 }
 for(const [itemId,amount] of Object.entries(recipe.outputs))give(player,itemId,amount);
 player.sendMessage("§a粉挽き完了: "+recipe.title);
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
 const held=inv(player)?.getItem(player.selectedSlotIndex),fuel=(id==="anvil"||id==="drying_rack"||id==="composter"||id==="quern")?null:(held?FUELS[held.typeId]:null);
 if(fuel){if(!take(player,held.typeId,1)){player.sendMessage("§c燃料を取り出せません。");return;}writeWorldState(posKey(block,"fire"),addFuel(state,fuel));player.sendMessage("§a燃料投入: "+Math.round(fuel.duration/20)+"秒分");return;}
 const tempLabels={unheated:"未加熱",warming:"暖まり中",hot:"熱い",very_hot:"非常に熱い",faint_red:"かすかな赤熱",dark_red:"暗赤色",bright_red:"明るい赤熱",orange:"橙熱",yellow:"黄色熱",yellow_white:"黄白色",white:"白熱",brilliant_white:"強白熱"};
 const body=recipes.map((r,i)=>{const inputs=Object.entries(r.inputs).map(([itemId,amount])=>(count(player,itemId)>=amount?"§a":"§c")+(ITEM_LABELS[itemId]??itemId)+" ×"+amount+"§r").join("、");const outputs=Object.entries(r.outputs).map(([itemId,amount])=>(ITEM_LABELS[itemId]??itemId)+" ×"+amount).join("、");return(i+1)+". "+r.title+"\n   "+(id==="quern"?"手動回転 3回":id==="drying_rack"||id==="composter"?"所要時間 "+Math.ceil(r.durationTicks/20)+"秒":"必要温度 "+r.minimumTemperatureC+"°C / "+Math.ceil(r.durationTicks/20)+"秒")+"\n   材料: "+inputs+"\n   完成品: "+outputs;}).join("\n\n");
 const heldTemperature=Number(held?.getDynamicProperty(ITEM_TEMPERATURE_KEY)??0);const status=id==="quern"?"\n\n上臼石を材料と一緒に投入し、手動回転で穀物を挽きます。燃料・熱源は不要です。":id==="drying_rack"?"\n\n常温・時間式乾燥です。燃料は必要ありません。":id==="composter"?"\n\n常温で約10日間発酵させます。緑の素材と茶色の素材が必要です。":id==="anvil"?"\n\n手持ち金属温度: "+Math.floor(heldTemperature)+"°C（"+tempLabels[classifyTemperature(heldTemperature)]+"）\n鍛造温度に達した加熱インゴットが必要です。":"\n\n現在温度: "+Math.floor(state.temperatureC)+"°C（"+tempLabels[classifyTemperature(state.temperatureC)]+"）\n燃料残り: "+Math.ceil(state.burnTicks/20)+"秒";
 const form=new ActionFormData().title(id==="anvil"?"金床":id==="drying_rack"?"乾燥棚":id==="composter"?"コンポスター":id==="quern"?"石臼":"加工設備").body(body+status);
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
 if(id==="quern"){await processQuernManually(player,block,recipe);return;}
 if(id==="anvil"){const requiredId=Object.keys(recipe.inputs)[0],heldNow=inv(player)?.getItem(player.selectedSlotIndex),profile=HEATED_METAL_PROFILES[requiredId],temperature=Number(heldNow?.getDynamicProperty(ITEM_TEMPERATURE_KEY)??0);if(!profile||heldNow?.typeId!==requiredId||temperature<profile.forgingTemperatureC){player.sendMessage("§c手持ちの加熱インゴットが鍛造温度に達していません。必要温度: "+(profile?.forgingTemperatureC??0)+"°C");return;}}
 if(recipe.alloyId){const matches=findMatchingAlloys(recipe.metalInputs,{recipes:[{id:recipe.alloyId,components:recipe.alloyComponents}]});if(!matches.includes(recipe.alloyId)){player.sendMessage("§c合金の配合比が範囲外です。");return;}}
 if(!["anvil","drying_rack","composter","quern"].includes(id)&&!canProcessAtTemperature(state,recipe.minimumTemperatureC)){player.sendMessage("§c温度不足です。");return;}
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
function soilTick(block){const soil=readSoil(block);let nearbyWater=false;for(let x=-2;x<=2&&!nearbyWater;x++)for(let z=-2;z<=2;z++){try{const b=block.dimension.getBlock({x:block.location.x+x,y:block.location.y,z:block.location.z+z});if(b&&b.typeId==="minecraft:water"){nearbyWater=true;break;}}catch{}}const weather=WEATHER_BY_DIMENSION.get(normalizeDimensionId(block.dimension.id))??"clear";const rainfallMm=getRainfallMm(weather,0.8,soil.rainfallMultiplier);const next=advanceSoilHydration(soil,1/60,{rainfallMm,evaporationPerHour:nearbyWater?0.02:0.15,shadeFactor:0.7});if(nearbyWater)next.hydration=Math.min(100,next.hydration+0.5);writeWorldState(soilKey(block),next);}
async function farmlandInteract(player,block){if(!player||!block)return;const held=inv(player)?.getItem(player.selectedSlotIndex);const soil=readSoil(block);
const seedProfile=Object.values(CROP_PROFILES).find(profile=>profile.seed===held?.typeId);
if(seedProfile){const cropType=Object.keys(CROP_PROFILES).find(key=>CROP_PROFILES[key]===seedProfile);const top=block.above();if(!top?.isAir||(cropType==="maize"&&!top.above()?.isAir)){player.sendMessage(cropType==="maize"?"§cトウモロコシには2ブロック分の空間が必要です。":"§c耕作土の上に空間が必要です。");return;}if(take(player,seedProfile.seed,1)){writeWorldState(soilKey(block),soil);top.setType("tfc:crop");top.setPermutation(top.permutation.withState("tfc:crop_type",cropType).withState("tfc:part","lower"));writeWorldState(posKey(top,"crop_progress"),0);writeWorldState(posKey(top,"crop_quality"),1);player.sendMessage("§a"+(({"tfc:grain":"小麦","tfc:maize":"トウモロコシ","tfc:potato":"ジャガイモ","tfc:barley":"大麦","tfc:oat":"オーツ麦","tfc:rye":"ライ麦","tfc:beet":"ビーツ","tfc:cabbage":"キャベツ","tfc:carrot":"ニンジン","tfc:garlic":"ニンニク","tfc:onion":"タマネギ","tfc:squash":"カボチャ","tfc:lentils":"レンズ豆","tfc:soybean":"大豆","tfc:peanuts":"落花生"}[seedProfile.harvest]??"作物"))+"を植えました。");}return;}
const fertilizer=FERTILIZER_PROFILES[held?.typeId];if(fertilizer){if(take(player,held.typeId,1)){writeWorldState(soilKey(block),applyFertilizer(soil,fertilizer.nutrients));player.sendMessage("§a"+fertilizer.name+"を混ぜました。"+Object.entries(fertilizer.nutrients).map(([name,value])=>name+" +"+value).join(" / ")+"（土壌肥沃度補正後）");}return;}
const soilNames={loam:"壌土",silt:"シルト",clay:"粘土質"};const fertilityNames={entisol:"エンティソル",andisol:"アンドソル",fluvisol:"フルビソル",alfisol:"アルフィソル",mollisol:"モリソル",podzol:"ポドゾル",aridisol:"アリディソル",oxisol:"オキシソル"};const form=new ActionFormData().title("土壌状態").body("基質: "+(soilNames[soil.soilType]??soil.soilType)+"\n土壌肥沃度: "+(fertilityNames[soil.fertilityClass]??soil.fertilityClass)+"（肥料効果 ×"+({entisol:1,andisol:1.1,fluvisol:1.1,alfisol:1.1,mollisol:1.2,podzol:0.9,aridisol:0.9,oxisol:0.8}[soil.fertilityClass]??1).toFixed(1)+"）\n推定気温: "+temperatureAt(block.dimension,block.location).toFixed(1)+"°C\n水分: "+Math.floor(soil.hydration)+"%\n窒素: "+Math.floor(soil.nitrogen)+"\nリン: "+Math.floor(soil.phosphorus)+"\nカリウム: "+Math.floor(soil.potassium)+"\n\n骨粉・堆肥・木灰を持って操作すると、土壌肥沃度に応じた肥料効果が得られます。").button("閉じる");try{await form.show(player);}catch{}
}
function currentTemperatureC(elevationM=0,biomeId="minecraft:plains"){const profile=getBiomeClimateProfile(biomeId);return calculateAmbientTemperatureC({...profile,dayOfYear:((world.getDay()%96)+96)%96,timeOfDay:world.getTimeOfDay(),elevationM:Math.max(0,elevationM),diurnalAmplitudeC:3});}
function temperatureAt(dimension,location){let biomeId="minecraft:plains";try{biomeId=dimension.getBiome({x:Math.floor(location.x),y:Math.floor(location.y),z:Math.floor(location.z)}).id;}catch{}return currentTemperatureC(location.y-63,biomeId);}
function cropTick(block){if(block.permutation.getState("tfc:part")==="upper")return;const age=block.permutation.getState("tfc:age");if(typeof age!=="number"||age>=3)return;const cropType=block.permutation.getState("tfc:crop_type")??"wheat";const profile=CROP_PROFILES[cropType]??CROP_PROFILES.wheat;if(cropType==="maize"&&age===1&&!block.above()?.isAir)return;let soil;try{soil=readSoil(block.below());}catch{return;}const evaluation=evaluateCropGrowth(profile,{temperatureC:temperatureAt(block.dimension,block.location)},soil);if(!evaluation.suitable)return;const qualityKey=posKey(block,"crop_quality");const previousQuality=Number(readWorldState(qualityKey,1));writeWorldState(qualityKey,Math.min(previousQuality,evaluation.nutrientFactor));const progressKey=posKey(block,"crop_progress");const growth=advanceCropGrowthProgress(Number(readWorldState(progressKey,0)),evaluation.growthMultiplier);soil.hydration=Math.max(0,soil.hydration-2*evaluation.growthMultiplier);soil=applyCropNutrientEffects(soil,profile.nutrientEffects,evaluation.growthMultiplier);writeWorldState(soilKey(block.below()),soil);writeWorldState(progressKey,growth.progress);if(growth.stageAdvanced){const nextAge=age+1;block.setPermutation(block.permutation.withState("tfc:age",nextAge));if(cropType==="maize"&&nextAge===2){const upper=block.above();if(upper?.isAir){upper.setType("tfc:crop");upper.setPermutation(upper.permutation.withState("tfc:crop_type","maize").withState("tfc:part","upper").withState("tfc:age",2));}}}}
function fireTick(block){const key=posKey(block,"fire");const state=advanceFire(readWorldState(key,{}),20);writeWorldState(key,state);}
function animalState(entity){try{const raw=entity.getDynamicProperty("tfc:animal_state");const base=typeof raw==="string"?JSON.parse(raw):{};return createAnimalState({...base,species:entity.typeId.replace(":","_")});}catch{return createAnimalState({species:entity.typeId.replace(":","_")});}}
function saveAnimal(entity,state){try{entity.setDynamicProperty("tfc:animal_state",JSON.stringify(state));}catch(error){console.warn("[TFC-Bedrook] animal state save:",error);}}
function animalTick(entity){
 const profile=ANIMAL_PROFILES[entity.typeId];if(!profile)return;
 let state=animalState(entity);
  try{const health=entity.getComponent("minecraft:health");if(health)state=syncAnimalHealth(state,health.currentValue,health.effectiveMax);}catch{}
  state=advanceAnimalNeeds(state,0.05);
 try{
  const base={x:Math.floor(entity.location.x),y:Math.floor(entity.location.y),z:Math.floor(entity.location.z)};
  let waterNearby=false,forageNearby=false;
  for(let x=-1;x<=1;x++)for(let z=-1;z<=1;z++){
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
 if(state.sex==="unknown")state.sex=Math.random()<0.5?"male":"female";
 if(profile.customBreeding&&state.sex==="female"&&state.ageDays>=profile.adultAgeDays&&state.familiarity>=profile.requiredFamiliarity&&state.hunger<60&&state.thirst<60&&state.pregnancyDays===0){
  try{const nearby=entity.dimension.getEntities({type:entity.typeId,location:entity.location,maxDistance:6});for(const partner of nearby){if(partner.id===entity.id)continue;const other=animalState(partner);if(canBreed(state,other,profile)){const started=beginPregnancy(state,other,profile);if(started.started){state=started.animal;other.lastBreedAt=other.ageDays;saveAnimal(partner,other);break;}}}}catch{}
 }
 saveAnimal(entity,state);
}
function animalInteract(player,entity){
 if(!player||!entity)return;
 const profile=ANIMAL_PROFILES[entity.typeId];if(!profile)return;
 let state=animalState(entity);
 if(state.sex==="unknown"){state.sex=Math.random()<0.5?"male":"female";saveAnimal(entity,state);}
 const held=inv(player)?.getItem(player.selectedSlotIndex);
 if(!held){
  const names={"tfc:deer":"シカ","minecraft:cow":"ウシ","minecraft:sheep":"ヒツジ","minecraft:chicken":"ニワトリ"};
  player.sendMessage("§e"+(names[entity.typeId]??entity.typeId)+"\n性別: "+(state.sex==="female"?"メス":"オス")+"\n年齢: "+state.ageDays.toFixed(1)+"日\n空腹: "+Math.floor(state.hunger)+" / 100\n渇き: "+Math.floor(state.thirst)+" / 100\n健康: "+Math.floor(state.health)+" / 100\nなつき度: "+Math.floor(state.familiarity)+" / 100"+(state.pregnancyDays>0?"\n妊娠: "+Math.floor(state.pregnancyDays)+"日":""));
  return;
 }
 if(entity.typeId==="minecraft:cow"&&held.typeId==="minecraft:glass_bottle"){
  if(state.sex!=="female"){player.sendMessage("§e乳を生産できるのはメスの牛だけです。");return;}
  if(state.ageDays<profile.adultAgeDays){player.sendMessage("§eこの牛はまだ成長中です。");return;}
  const currentDay=state.ageDays;
  if(!canProduce(state,{requiredFamiliarity:0,cooldownDays:1,currentDay})){player.sendMessage("§eこの牛はまだミルクを補充中です。");return;}
  if(!take(player,"minecraft:glass_bottle",1)){player.sendMessage("§c空き瓶を取り出せません。");return;}
  give(player,"tfc:milk_bottle",1);
  saveAnimal(entity,recordProduct(state,currentDay));
  player.sendMessage("§a牛乳を採取しました。");
  return;
 }
 if(!profile.feedItems.includes(held.typeId))return;
 // Vanilla livestock already consumes its breeding feed during the interaction event.
 // Only the custom deer entity needs a manual inventory deduction.
 if(entity.typeId==="tfc:deer"&&!take(player,held.typeId,1))return;
 state=feedAnimal(state,15,0);saveAnimal(entity,state);
 player.sendMessage("§a餌を与えました。なつき度: "+Math.floor(state.familiarity));
}

export function initializeGameplay(){world.afterEvents.weatherChange.subscribe(event=>{const key=normalizeDimensionId(event.dimension?.id);if(key)WEATHER_BY_DIMENSION.set(key,normalizeWeather(event.newWeather));});
world.afterEvents.playerBreakBlock.subscribe(event=>{
 const brokenId=event.brokenBlockPermutation?.type?.id,player=event.player;if(!player)return;
 try{
  if(brokenId==="tfc:firepit")player.dimension.spawnItem(new ItemStack("tfc:wood_ash",1),event.block.location);
  if(brokenId==="tfc:crop"&&event.brokenBlockPermutation?.getState("tfc:crop_type")==="maize"){
   const part=event.brokenBlockPermutation.getState("tfc:part")??"lower";
   const otherLocation={x:event.block.location.x,y:event.block.location.y+(part==="upper"?-1:1),z:event.block.location.z};
   const other=player.dimension.getBlock(otherLocation);
   if(other?.typeId==="tfc:crop"&&other.permutation.getState("tfc:crop_type")==="maize")other.setType("minecraft:air");
  }
  const seeds=WILD_SEED_DROPS[brokenId];
  if(seeds&&Math.random()<0.12){const seed=seeds[Math.floor(Math.random()*seeds.length)];player.dimension.spawnItem(new ItemStack(seed,1),event.block.location);player.sendMessage("§a野生の種を見つけました: "+seed);}
 }catch(error){console.warn("[TFC-Bedrook] block-break drops failed:",error);}
});system.beforeEvents.startup.subscribe(event=>{
event.itemComponentRegistry.registerCustomComponent("tfc:open_knapping",{onUse:a=>{if(a.source?.typeId==="minecraft:player")void knap(a.source);}});
event.itemComponentRegistry.registerCustomComponent("tfc:prospect",{onUseOn:a=>{if(a.source?.typeId==="minecraft:player")prospect(a.source,a.block);}});
event.itemComponentRegistry.registerCustomComponent("tfc:consume_food",{onConsume:(a,p)=>food(a.source,p.params??{})}});
event.itemComponentRegistry.registerCustomComponent("tfc:fill_water_vessel",{onUseOn:a=>{if(a.source?.typeId==="minecraft:player")fillWaterVessel(a.source,a.block);}});
event.itemComponentRegistry.registerCustomComponent("tfc:drink_water",{onUse:a=>{if(a.source?.typeId==="minecraft:player")drinkWaterVessel(a.source);}});
event.itemComponentRegistry.registerCustomComponent("tfc:mix_dough",{onUse:a=>{if(a.source?.typeId==="minecraft:player")mixDough(a.source);}});
event.blockComponentRegistry.registerCustomComponent("tfc:station_ui",{onPlayerInteract:a=>{if(a.player)void station(a.player,a.block.typeId.split(":")[1],a.block);}});event.blockComponentRegistry.registerCustomComponent("tfc:heated_station_tick",{onTick:a=>fireTick(a.block)});
event.blockComponentRegistry.registerCustomComponent("tfc:farmland_interaction",{onPlayerInteract:a=>void farmlandInteract(a.player,a.block),onTick:a=>soilTick(a.block)});
event.blockComponentRegistry.registerCustomComponent("tfc:crop_growth",{onTick:a=>cropTick(a.block),onPlayerInteract:a=>{const p=a.player,clicked=a.block;if(!p||!clicked)return;const b=clicked.permutation.getState("tfc:part")==="upper"?clicked.below():clicked;if(!b||b.typeId!=="tfc:crop")return;if(b.permutation.getState("tfc:part")==="upper")return;if(b.permutation.getState("tfc:age")!==3){p.sendMessage("§e成長中: "+Math.floor(Number(readWorldState(posKey(b,"crop_progress"),0)))+"%");return;}const cropType=b.permutation.getState("tfc:crop_type")??"wheat";const profile=CROP_PROFILES[cropType]??CROP_PROFILES.wheat;const quality=Number(readWorldState(posKey(b,"crop_quality"),1));const yieldCount=calculateCropYield(cropType==="potato"?2:3,quality);give(p,profile.harvest,yieldCount);give(p,profile.seed,1);if(cropType==="maize"){const upper=b.above();if(upper?.typeId==="tfc:crop"&&upper.permutation.getState("tfc:part")==="upper")upper.setType("minecraft:air");}b.setPermutation(b.permutation.withState("tfc:age",0));writeWorldState(posKey(b,"crop_progress"),0);writeWorldState(posKey(b,"crop_quality"),1);p.sendMessage("§a収穫しました。収穫量補正: "+Math.floor(quality*100)+"% / "+yieldCount+"個");}});
system.runInterval(()=>{for(const dimensionId of ["overworld","nether","the_end"]){try{const dimension=world.getDimension(dimensionId);for(const type of Object.keys(ANIMAL_PROFILES))for(const entity of dimension.getEntities({type}))animalTick(entity);}catch(error){}}},1200);
system.runInterval(()=>{for(const player of world.getAllPlayers()){try{tickFoodFreshness(player,system.currentTick);}catch(error){console.warn("[TFC-Bedrook] food freshness tick failed:",error);}}},1200);
system.runInterval(()=>{for(const player of world.getAllPlayers()){try{tickMetalHeat(player,system.currentTick);}catch(error){console.warn("[TFC-Bedrook] metal heat tick failed:",error);}}},20);
});
world.afterEvents.playerInteractWithEntity.subscribe(event=>{if(ANIMAL_PROFILES[event.target?.typeId])animalInteract(event.player,event.target);});

world.afterEvents.playerInteractWithBlock.subscribe(event=>{
 if(!event.isFirstEvent)return;
 const held=event.beforeItemStack??event.itemStack;
 if(!held?.typeId?.endsWith("_hoe"))return;
 const block=event.block;
 if(!["minecraft:dirt","minecraft:grass_block","minecraft:coarse_dirt","minecraft:rooted_dirt","minecraft:farmland"].includes(block.typeId))return;
 try{const originalSoilType=inferSoilTypeFromBlockId(block.typeId);const biomeId=block.dimension.getBiome(block.location).id;const fertilityClass=inferSoilFertilityClassFromBiomeId(biomeId);const rainfallMultiplier=inferBiomeRainfallMultiplierFromBiomeId(biomeId);block.setType("tfc:farmland");const soil=createSoilState({...readSoil(block),soilType:originalSoilType,fertilityClass,rainfallMultiplier});writeWorldState(soilKey(block),soil);event.player.sendMessage("§a耕作土を作りました。土質: "+({loam:"壌土",silt:"シルト",clay:"粘土質"}[soil.soilType]??soil.soilType)+"。種を持って操作すると植えられます。");}catch(error){console.warn("[TFC-Bedrook] farmland conversion failed:",error);}
});world.afterEvents.playerSpawn.subscribe(event=>{if(event.player)recoverPlayerStationJobs(event.player);});
}
