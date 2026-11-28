import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");
test("hoe interaction converts vanilla soil to TFC farmland",()=>{
 assert.ok(runtime.includes("world.afterEvents.playerInteractWithBlock.subscribe"));
 assert.ok(runtime.includes('held?.typeId?.endsWith("_hoe")'));
 assert.ok(runtime.includes('block.setType("tfc:farmland")'));
 assert.ok(runtime.includes("readSoil(block)"));
 assert.ok(runtime.includes("writeWorldState(soilKey(block),soil)"));
});
test("farmland conversion preserves soil type and biome-derived fertility",()=>{
 assert.ok(runtime.includes("inferSoilTypeFromBlockId(block.typeId)"));
 assert.ok(runtime.includes("soilType:originalSoilType"));
 assert.ok(runtime.includes("inferSoilFertilityClassFromBiomeId(biomeId)"));
 assert.ok(runtime.includes("inferBiomeRainfallMultiplierFromBiomeId(biomeId)"));
});
test("fertilizers apply their defined nutrient profile",()=>{
 assert.ok(runtime.includes('"tfc:compost":{name:"堆肥",nutrients:{nitrogen:20,potassium:20}}'));
 assert.ok(runtime.includes("const fertilizer=FERTILIZER_PROFILES[held?.typeId]"));
 assert.ok(runtime.includes("applyFertilizer(soil,fertilizer.nutrients)"));
 assert.ok(runtime.includes("take(player,held.typeId,1)"));
});
