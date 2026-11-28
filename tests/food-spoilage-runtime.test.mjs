import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");
const ids=["raw_meat","cooked_meat","grain","maize","potato","vegetable","fruit","milk_bottle","dried_meat","dried_fruit","dried_vegetables","barley","oat","rye","beet","cabbage","carrot","garlic","onion","squash","lentils","soybean","peanuts","bread"];
test("inventory food freshness uses food decay service and persists per player",()=>{
 assert.match(runtime,/import \{ consumeFood, advanceFoodDecay, ticksToHours \}/);
 assert.match(runtime,/function tickFoodFreshness\(player,nowTick\)/);
 assert.match(runtime,/advanceFoodDecay\(\{id:itemId,freshness:previous\.freshness\},ticksToHours\(elapsedTicks\),\{temperatureC:temperatureAt\(player\.dimension,player\.location\),baseDecayPerHour\}\)/);
 assert.match(runtime,/FOOD_FRESHNESS_KEY/);
 assert.match(runtime,/new ItemStack\("tfc:spoiled_food",entry\.amount\)/);
});
test("all edible inventory items identify themselves to the freshness tracker",()=>{
 for(const id of ids){const item=JSON.parse(readFileSync(join(root,"packs/behavior_pack/items",id+".json"),"utf8"));assert.equal(item["minecraft:item"].components["tfc:consume_food"].itemId,"tfc:"+id);}
});

import { ticksToHours } from "../packs/behavior_pack/scripts/core/food-service.mjs";
test("Bedrock ticks convert to real elapsed hours for food spoilage",()=>{
 assert.equal(ticksToHours(72000),1);
 assert.equal(ticksToHours(1200),1/60);
 assert.equal(ticksToHours(0),0);
 assert.equal(ticksToHours(-100),0);
});
