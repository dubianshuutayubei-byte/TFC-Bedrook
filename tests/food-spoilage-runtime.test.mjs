import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ticksToHours } from "../packs/behavior_pack/scripts/core/food-service.mjs";
import { readStackFreshness } from "../packs/behavior_pack/scripts/core/food-stack-service.mjs";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");
const ids=["raw_meat","cooked_meat","grain","maize","potato","vegetable","fruit","milk_bottle","dried_meat","dried_fruit","dried_vegetables","barley","oat","rye","beet","cabbage","carrot","garlic","onion","squash","lentils","soybean","peanuts","bread","rice","cassava","green_beans","pumpkin","melon","tomato","green_bell_pepper","radish","salted_meat","smoked_meat"];
test("inventory food freshness is stored on each ItemStack lore",()=>{
 assert.match(runtime,/advanceStackFreshness\(lore,nowTick,\{temperatureC,baseDecayPerHour:baseDecayPerHour\*\(sealed\?0\.5:1\)\}\)/);
 assert.match(runtime,/stack\.setLore\(result\.lore\);container\.setItem\(slot,stack\)/);
 assert.match(runtime,/readStackFreshness\(event\.itemStack\?\.getLore\?\.\(\)\?\?\[\]\)/);
 assert.match(runtime,/new ItemStack\("tfc:spoiled_food",stack\.amount\)/);
 assert.doesNotMatch(runtime,/FOOD_FRESHNESS_KEY/);
});
test("all edible inventory items identify themselves to the freshness tracker",()=>{
 for(const id of ids){const item=JSON.parse(readFileSync(join(root,"packs/behavior_pack/items",id+".json"),"utf8"));assert.equal(item["minecraft:item"].components["tfc:consume_food"].itemId,"tfc:"+id);}
});
test("stack lore freshness is preserved and readable after movement",()=>{
 const lore=["鮮度: 73%","§0TFCFRESH:73:1000"];
 assert.deepEqual(readStackFreshness(lore),{freshness:73,lastTick:1000});
});
test("Bedrock ticks convert to real elapsed hours for food spoilage",()=>{
 assert.equal(ticksToHours(72000),1);
 assert.equal(ticksToHours(1200),1/60);
 assert.equal(ticksToHours(0),0);
 assert.equal(ticksToHours(-100),0);
});

test("every edible item has a freshness decay profile",()=>{
 const files=readdirSync(join(root,"packs/behavior_pack/items")).filter(name=>name.endsWith(".json"));
 assert.match(runtime,/const FOOD_DECAY_PROFILES=\{/);
 const missing=[];
 for(const file of files){
  const item=JSON.parse(readFileSync(join(root,"packs/behavior_pack/items",file),"utf8"))["minecraft:item"];
  if(item.components?.["tfc:consume_food"]&&!runtime.includes(JSON.stringify(item.description.identifier)+":"))missing.push(item.description.identifier);
 }
 assert.deepEqual(missing,[]);
});

test("runtime decay rates stay synchronized with canonical food profiles",()=>{
 const database=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/food-profiles.json"),"utf8"));
 const start=runtime.indexOf("const FOOD_DECAY_PROFILES=");
 assert.notEqual(start,-1);
 const end=runtime.indexOf(";",start);
 const source=runtime.slice(start,end);
 const runtimeRates=new Map([...source.matchAll(/"([^"]+)":([0-9]+(?:\\.[0-9]+)?)/g)].map(match=>[match[1],Number(match[2])]));
 const aliases={milk:"milk_bottle"};
 const expected=new Map(database.foods.map(food=>["tfc:"+(aliases[food.id]??food.id),food.baseDecayPerHour]));
 assert.deepEqual([...runtimeRates].sort(([a],[b])=>a.localeCompare(b)),[...expected].sort(([a],[b])=>a.localeCompare(b)));
});
