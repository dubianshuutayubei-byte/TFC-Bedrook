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
async function station(p,id){const r={
firepit:["焚き火","生肉を加熱します。","焼く","tfc:raw_meat",1,"tfc:cooked_meat"],
pit_kiln:["Pit Kiln","粘土容器を焼成します。","焼成する","tfc:clay_vessel",1,"tfc:fired_vessel"],
crucible:["るつぼ","銅鉱石を溶解します。","銅鉱石2個を溶解","tfc:copper_ore",2,"tfc:copper_ingot"],
anvil:["金床","銅インゴットを板材へ成形します。","銅板を成形","tfc:copper_ingot",1,"tfc:copper_sheet"]
}[id];if(!r)return;const f=new ActionFormData().title(r[0]).body(r[1]).button(r[2]).button("閉じる");const a=await f.show(p);if(a.canceled||a.selection!==0)return;if(!take(p,r[3],r[4])){p.sendMessage("§c材料が足りません。必要数: "+r[4]);return;}give(p,r[5]);p.sendMessage("§a加工しました。");}
async function knap(p){const n=Number(p.getDynamicProperty(PROGRESS_KEY)??0);const f=new ActionFormData().title("石器成形").body("石片を作るための打撃位置を選択します。\n進行度: "+n+"/3");for(let i=1;i<=9;i++)f.button("位置 "+i);const a=await f.show(p);if(a.canceled)return;if(n<2){p.setDynamicProperty(PROGRESS_KEY,n+1);p.sendMessage("§e打撃を記録しました。");return;}if(take(p,"tfc:flint",1)){give(p,"tfc:stone_shard",2);p.sendMessage("§a石片を2個作成しました。");}else p.sendMessage("§c火打石がありません。");p.setDynamicProperty(PROGRESS_KEY,0);}
export function initializeGameplay(){system.beforeEvents.startup.subscribe(e=>{
e.itemComponentRegistry.registerCustomComponent("tfc:open_knapping",{onUse:a=>{if(a.source?.typeId==="minecraft:player")void knap(a.source);}});
e.itemComponentRegistry.registerCustomComponent("tfc:consume_food",{onConsume:(a,p)=>food(a.source,p.params??{})});
e.blockComponentRegistry.registerCustomComponent("tfc:station_ui",{onPlayerInteract:(a,p)=>{if(a.player)void station(a.player,p.params?.station);}});
e.blockComponentRegistry.registerCustomComponent("tfc:farmland_interaction",{onPlayerInteract:a=>{const p=a.player,b=a.block;if(!p||!b)return;const s=inv(p)?.getItem(p.selectedSlotIndex);if(s?.typeId!=="tfc:crop_seed")return;const top=b.above();if(!top?.isAir){p.sendMessage("§c耕作土の上に空間が必要です。");return;}if(take(p,"tfc:crop_seed",1)){top.setType("tfc:crop");p.sendMessage("§a種を植えました。");}}});
e.blockComponentRegistry.registerCustomComponent("tfc:crop_growth",{onRandomTick:a=>{const age=a.block.permutation.getState("tfc:age");if(typeof age==="number"&&age<3)a.block.setPermutation(a.block.permutation.withState("tfc:age",age+1));},onPlayerInteract:a=>{const p=a.player,b=a.block;if(!p||!b)return;if(b.permutation.getState("tfc:age")!==3){p.sendMessage("§eまだ成長中です。");return;}give(p,"tfc:grain",2);give(p,"tfc:crop_seed",1);b.setPermutation(b.permutation.withState("tfc:age",0));p.sendMessage("§a収穫しました。");}});
});}
