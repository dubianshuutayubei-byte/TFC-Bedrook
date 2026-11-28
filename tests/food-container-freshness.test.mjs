import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");

test("opened storage containers are tracked persistently for food freshness",()=>{
 assert.match(runtime,/const TRACKED_FOOD_CONTAINERS_KEY="tfc:tracked_food_containers"/);
 assert.match(runtime,/function trackFoodContainer\(block\)/);
 assert.match(runtime,/block\.getComponent\("minecraft:inventory"\)/);
 assert.match(runtime,/function saveTrackedFoodContainers\(\)/);
 assert.match(runtime,/function loadTrackedFoodContainers\(\)/);
 assert.match(runtime,/world\.setDynamicProperty\(TRACKED_FOOD_CONTAINERS_KEY/);
 assert.match(runtime,/world\.getDimension\(entry\.dimensionId\)/);
});

test("container food uses the same per-stack freshness logic as player inventory",()=>{
 assert.match(runtime,/function tickFoodContainerFreshness\(container,dimension,location,nowTick\)/);
 assert.match(runtime,/advanceStackFreshness\(lore,nowTick,\{temperatureC,baseDecayPerHour\}\)/);
 assert.match(runtime,/tickFoodContainerFreshness\(container,dimension,entry\.location,nowTick\)/);
 assert.match(runtime,/trackFoodContainer\(event\.block\)/);
});
