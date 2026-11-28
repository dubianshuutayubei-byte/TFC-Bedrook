import { ItemStack, system, world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { deserializePlayerState, serializePlayerState, applyHydration, applyNutrition } from "./core/player-state-service.mjs";
import { createFireState, addFuel, advanceFire, canProcessAtTemperature } from "./core/firepit-service.mjs";
import { createSoilState, applySoilCompost } from "./core/agriculture-service.mjs";
import { createAnimalState, advanceAnimalNeeds, feedAnimal, canBreed, beginPregnancy, advancePregnancy } from "./core/fauna-service.mjs";

const STATE_KEY="tfc:player_state",PROGRESS_KEY="tfc:knapping_progress";
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
const RECIPES={
firepit:{title:"焚き火",description:"生肉を加熱調理します。",input:"tfc:raw_meat",amount:1,output:"tfc:cooked_meat",minTemp:180,duration:100},
pit_kiln:{title:"Pit Kiln",description:"粘土容器を焼成します。",input:"tfc:clay_vessel",amount:1,output:"tfc:fired_vessel",minTemp:550,duration:600},
crucible:{title:"るつぼ",description:"銅鉱石2個を溶解して銅インゴットを作ります。",input:"tfc:copper_ore",amount:2,output:"tfc:copper_ingot",minTemp:1085,duration:200},
anvil:{title:"金床",description:"十分に加熱した銅素材を成形します。",input:"tfc:copper_ingot",amount:1,output:"tfc:copper_sheet",minTemp:600,duration:60}
};
async function station(player,id,block){
const recipe=RECIPES[id];if(!recipe)return;
const key=posKey(block,"fire"),state=createFireState(readWorldState(key,{}));
const held=inv(player)?.getItem(player.selectedSlotIndex);
const fuel=held?FUELS[held.typeId]:null;
if(fuel){if(!take(player,held.typeId,1)){player.sendMessage("§c燃料を取り出せません。");return;}writeWorldState(key,addFuel(state,fuel));player.sendMessage("§a燃料を投入しました。燃焼時間: "+Math.round(fuel.duration/20)+"秒");return;}
const form=new ActionFormData().title(recipe.title).body(recipe.description+"\n\n温度: "+Math.floor(state.temperatureC)+"°C\n燃料残り: "+Math.ceil(state.burnTicks/20)+"秒\n必要温度: "+recipe.minTemp+"°C").button("加工を開始").button("閉じる");
let response;try{response=await form.show(player);}catch(e){player.sendMessage("§c設備UIを開けませんでした。");return;}
if(response.canceled||response.selection!==0)return;
if(!canProcessAtTemperature(state,recipe.minTemp)){player.sendMessage("§c温度不足です。燃料を追加して加熱してください。");return;}
if(!take(player,recipe.input,recipe.amount)){player.sendMessage("§c材料が足りません。");return;}
player.sendMessage("§e加工中…");
system.runTimeout(()=>{try{give(player,recipe.output);player.sendMessage("§a加工完了: "+recipe.output);}catch(e){try{block.dimension.spawnItem(new ItemStack(recipe.output,1),block.location);}catch{}}},recipe.duration);
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
function soilTick(block){const soil=readSoil(block);let nearbyWater=false;for(let x=-4;x<=4&&!nearbyWater;x++)for(let z=-4;z<=4;z++){try{const b=block.dimension.getBlock({x:block.location.x+x,y:block.location.y,z:block.location.z+z});if(b&&b.typeId==="minecraft:water"){nearbyWater=true;break;}}catch{}}soil.hydration=Math.max(0,Math.min(100,soil.hydration+(nearbyWater?1.5:-1)));writeWorldState(soilKey(block),soil);}
async function farmlandInteract(player,block){if(!player||!block)return;const held=inv(player)?.getItem(player.selectedSlotIndex);const soil=readSoil(block);
if(held?.typeId==="tfc:crop_seed"){const top=block.above();if(!top?.isAir){player.sendMessage("§c耕作土の上に空間が必要です。");return;}if(take(player,"tfc:crop_seed",1)){writeWorldState(soilKey(block),soil);top.setType("tfc:crop");player.sendMessage("§a種を植えました。");}return;}
if(held?.typeId==="minecraft:bone_meal"){if(take(player,"minecraft:bone_meal",1)){writeWorldState(soilKey(block),applySoilCompost(soil));player.sendMessage("§a堆肥を混ぜました。土壌養分が回復しました。");}return;}
const form=new ActionFormData().title("土壌状態").body("水分: "+Math.floor(soil.hydration)+"%\n窒素: "+Math.floor(soil.nitrogen)+"\nリン: "+Math.floor(soil.phosphorus)+"\nカリウム: "+Math.floor(soil.potassium)+"\n\n骨粉を持って操作すると堆肥として使えます。").button("閉じる");try{await form.show(player);}catch{}
}
function cropTick(block){const age=block.permutation.getState("tfc:age");if(typeof age!=="number"||age>=3)return;let soil;try{soil=readSoil(block.below());}catch{return;}if(soil.hydration<20||soil.nitrogen<8)return;soil.hydration=Math.max(0,soil.hydration-2);soil.nitrogen=Math.max(0,soil.nitrogen-1.5);writeWorldState(soilKey(block.below()),soil);block.setPermutation(block.permutation.withState("tfc:age",age+1));}
function fireTick(block){const key=posKey(block,"fire");const state=advanceFire(readWorldState(key,{}),20);writeWorldState(key,state);}
const DEER_PROFILE={adultAgeDays:30,requiredFamiliarity:35,breedingCooldownDays:20,gestationDays:210};
function animalState(entity){return createAnimalState(readWorldState("tfc:animal:"+entity.id,{}));}
function saveAnimal(entity,state){writeWorldState("tfc:animal:"+entity.id,state);}
function animalTick(entity){let state=animalState(entity);state=advanceAnimalNeeds(state,0.05);if(state.pregnancyDays>0){const result=advancePregnancy(state,0.05,DEER_PROFILE.gestationDays);state=result.animal;if(result.birthReady){try{entity.dimension.spawnEntity("tfc:deer",{x:entity.location.x+1,y:entity.location.y,z:entity.location.z});}catch{}state.pregnancyDays=0;}}
if(state.sex==="unknown"){state.sex=Math.random()<0.5?"male":"female";}
if(state.sex==="female"&&state.ageDays>=DEER_PROFILE.adultAgeDays&&state.familiarity>=DEER_PROFILE.requiredFamiliarity&&state.hunger<60&&state.thirst<60&&state.pregnancyDays===0){try{const nearby=entity.dimension.getEntities({type:"tfc:deer",location:entity.location,maxDistance:6});for(const partner of nearby){if(partner.id===entity.id)continue;const other=animalState(partner);if(canBreed(state,other,DEER_PROFILE)){const started=beginPregnancy(state,other,DEER_PROFILE);if(started.started){state=started.animal;other.lastBreedAt=other.ageDays;saveAnimal(partner,other);break;}}}}catch{}}
saveAnimal(entity,state);}
function animalInteract(player,entity){if(!player||!entity)return;const held=inv(player)?.getItem(player.selectedSlotIndex);if(held?.typeId!=="minecraft:wheat"&&held?.typeId!=="minecraft:wheat_seeds"){player.sendMessage("§eシカには小麦または小麦の種を与えられます。");return;}if(!take(player,held.typeId,1))return;const state=feedAnimal(animalState(entity),15,0);saveAnimal(entity,state);player.sendMessage("§aシカに餌を与えました。なつき度: "+Math.floor(state.familiarity));}
export function initializeGameplay(){system.beforeEvents.startup.subscribe(event=>{
event.itemComponentRegistry.registerCustomComponent("tfc:open_knapping",{onUse:a=>{if(a.source?.typeId==="minecraft:player")void knap(a.source);}});
event.itemComponentRegistry.registerCustomComponent("tfc:consume_food",{onConsume:(a,p)=>food(a.source,p.params??{})}});
event.blockComponentRegistry.registerCustomComponent("tfc:station_ui",{onPlayerInteract:a=>{if(a.player)void station(a.player,a.block.typeId.split(":")[1],a.block);},onTick:a=>fireTick(a.block)});
event.blockComponentRegistry.registerCustomComponent("tfc:farmland_interaction",{onPlayerInteract:a=>void farmlandInteract(a.player,a.block),onTick:a=>soilTick(a.block)});
event.blockComponentRegistry.registerCustomComponent("tfc:crop_growth",{onTick:a=>cropTick(a.block),onPlayerInteract:a=>{const p=a.player,b=a.block;if(!p||!b)return;if(b.permutation.getState("tfc:age")!==3){p.sendMessage("§eまだ成長中です。");return;}give(p,"tfc:grain",2);give(p,"tfc:crop_seed",1);b.setPermutation(b.permutation.withState("tfc:age",0));p.sendMessage("§a収穫しました。");}});
event.entityComponentRegistry.registerCustomComponent("tfc:animal_ecology",{onTick:a=>animalTick(a.entity),onPlayerInteract:a=>animalInteract(a.player,a.entity)});
});}
