import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ticksToHours } from "../packs/behavior_pack/scripts/core/food-service.mjs";
import { readStackFreshness } from "../packs/behavior_pack/scripts/core/food-stack-service.mjs";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");
const ids=["raw_meat","cooked_meat","grain","maize","potato","vegetable","fruit","milk_bottle","dried_meat","dried_fruit","dried_vegetables","barley","oat","rye","beet","cabbage","carrot","garlic","onion","squash","lentils","soybean","peanuts","bread"];
test("inventory food freshness is stored on each ItemStack lore",()=>{
 assert.match(runtime,/advanceStackFreshness\(lore,nowTick,\{temperatureC,baseDecayPerHour\}\)/);
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
