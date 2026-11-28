import { ItemStack, system } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { deserializePlayerState, serializePlayerState, applyHydration, applyNutrition } from "./core/player-state-service.mjs";

const STATE_KEY = "tfc:player_state";
const PROGRESS_KEY = "tfc:knapping_progress";
const inv = p => p.getComponent("minecraft:inventory")?.container;
function count(p,id){const c=inv(p);if(!c)return 0;let n=0;for(let i=0;i<c.size;i++){const s=c.getItem(i);if(s?.typeId===id)n+=s.amount;}return n;}
function take(p,id,n){const c=inv(p);if(!c||count(p,id)<n)return false;for(let i=0;i<c.size&&n>0;i++){const s=c.getItem(i);if(!s||s.typeId!==id)continue;const k=Math.min(n,s.amount);if(k===s.amount)c.setItem(i,undefined);else{s.amount-=k;c.setItem(i,s);}n-=k;}return n===0;}
function give(p,id,n=1){const c=inv(p);if(!c)return false;const rest=c.addItem(new ItemStack(id,n));if(rest)p.dimension.spawnItem(rest,p.location);return true;}
function food(p,params){if(!p||p.typeId!=="minecraft:player")return;let s=deserializePlayerState(String(p.getDynamicProperty(STATE_KEY)??""));s=applyHydration(s,Number(params.hydration??0));if(params.category)s=applyNutrition(s,params.category,Number(params.nutrition??0));p.setDynamicProperty(STATE_KEY,serializePlayerState(s));p.sendMessage("§a水分・栄養状態を更新しました。");}
async function station(p,id,block){
const r={
firepit:["焚き火","生肉を加熱します。","肉を焼く","tfc:raw_meat",1,"tfc:cooked_meat",100],
pit_kiln:["Pit Kiln","粘土容器を時間をかけて焼成します。","土器を焼成する","tfc:clay_vessel",1,"tfc:fired_vessel",600],
crucible:["るつぼ","銅鉱石を溶解・鋳造します。","銅鉱石2個を溶解","tfc:copper_ore",2,"tfc:copper_ingot",200],
anvil:["金床","銅インゴットを板材へ成形します。","銅板を成形","tfc:copper_ingot",1,"tfc:copper_sheet",60]
}[id];
if(!r)return;
const f=new ActionFormData().title(r[0]).body(r[1]+"\n処理時間: "+r[6]+" tick").button(r[2]).button("閉じる");
let a;try{a=await f.show(p);}catch(error){p.sendMessage("§c設備UIを開けませんでした。");console.warn("[TFC-Bedrook] Station UI:",error);return;}if(a.canceled||a.selection!==0)return;
if(!take(p,r[3],r[4])){p.sendMessage("§c材料が足りません。必要数: "+r[4]);return;}
p.sendMessage("§e加工を開始しました。完了までお待ちください。");
system.runTimeout(()=>{
try{give(p,r[5]);p.sendMessage("§a加工が完了しました。");}
catch{try{block.dimension.spawnItem(new ItemStack(r[5],1),block.location);}catch{}}
},r[6]);
}
async function knap(p){
let selected=[];try{selected=JSON.parse(String(p.getDynamicProperty(PROGRESS_KEY)??"[]"));}catch{selected=[];}
if(!Array.isArray(selected))selected=[];
const f=new ActionFormData().title("石器成形").body("3×3の打撃位置を選択してください。\n石片の形: 左上・中央・右下の3点\n選択済み: "+selected.length+"/3");
for(let i=0;i<9;i++)f.button((selected.includes(i)?"§a[選択] ":"§7[ ] ")+"位置 "+(i+1));
let a;try{a=await f.show(p);}catch(error){p.sendMessage("§c石器成形UIを開けませんでした。");console.warn("[TFC-Bedrook] Knapping UI:",error);return;}if(a.canceled||a.selection===undefined)return;
const index=a.selection;
if(selected.includes(index))selected=selected.filter(v=>v!==index);else if(selected.length<3)selected.push(index);
if(selected.length<3){p.setDynamicProperty(PROGRESS_KEY,JSON.stringify(selected));p.sendMessage("§e打撃位置を記録しました。");return;}
const correct=[0,4,8].every(v=>selected.includes(v));
p.setDynamicProperty(PROGRESS_KEY,"[]");
if(!correct){p.sendMessage("§c形が合いません。配置をやり直してください。");return;}
if(take(p,"tfc:flint",1)){give(p,"tfc:stone_shard",2);p.sendMessage("§a石片を2個作成しました。");}
else p.sendMessage("§c火打石がありません。");
}
export function initializeGameplay(){system.beforeEvents.startup.subscribe(e=>{
e.itemComponentRegistry.registerCustomComponent("tfc:open_knapping",{onUse:a=>{if(a.source?.typeId==="minecraft:player")void knap(a.source);}});
e.itemComponentRegistry.registerCustomComponent("tfc:consume_food",{onConsume:(a,p)=>food(a.source,p.params??{})});
e.blockComponentRegistry.registerCustomComponent("tfc:station_ui",{onPlayerInteract:(a,p)=>{if(a.player)void station(a.player,p.params?.station,a.block);}});
e.blockComponentRegistry.registerCustomComponent("tfc:farmland_interaction",{onPlayerInteract:a=>{const p=a.player,b=a.block;if(!p||!b)return;const s=inv(p)?.getItem(p.selectedSlotIndex);if(s?.typeId!=="tfc:crop_seed")return;const top=b.above();if(!top?.isAir){p.sendMessage("§c耕作土の上に空間が必要です。");return;}if(take(p,"tfc:crop_seed",1)){top.setType("tfc:crop");p.sendMessage("§a種を植えました。");}}});
e.blockComponentRegistry.registerCustomComponent("tfc:crop_growth",{onTick:a=>{const age=a.block.permutation.getState("tfc:age");if(typeof age==="number"&&age<3)a.block.setPermutation(a.block.permutation.withState("tfc:age",age+1));},onPlayerInteract:a=>{const p=a.player,b=a.block;if(!p||!b)return;if(b.permutation.getState("tfc:age")!==3){p.sendMessage("§eまだ成長中です。");return;}give(p,"tfc:grain",2);give(p,"tfc:crop_seed",1);b.setPermutation(b.permutation.withState("tfc:age",0));p.sendMessage("§a収穫しました。");}});
});}
