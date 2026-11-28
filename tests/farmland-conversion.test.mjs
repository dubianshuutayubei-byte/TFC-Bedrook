import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");
test("hoe interaction converts vanilla tilled soil to TFC farmland",()=>{
 assert.match(runtime,/world\.afterEvents\.playerInteractWithBlock\.subscribe/);
 assert.match(runtime,/held\?\.typeId\?\.endsWith\("_hoe"\)/);
 assert.match(runtime,/block\.setType\("tfc:farmland"\)/);
 assert.match(runtime,/readSoil\(block\)/);
 assert.match(runtime,/writeWorldState\(soilKey\(block\),soil\)/);
});

test("farmland conversion preserves the original soil block type",()=>{
 assert.match(runtime,/const originalSoilType=inferSoilTypeFromBlockId\(block\.typeId\)/);
 assert.match(runtime,/soilType:originalSoilType/);
});

test("farmland conversion stores biome-derived fertility class",()=>{
 assert.match(runtime,/block\.dimension\.getBiome\(block\.location\)\.id/);
 assert.match(runtime,/fertilityClass,rainfallMultiplier\}\)/);
 assert.match(runtime,/inferBiomeRainfallMultiplierFromBiomeId\(biomeId\)/);
});

test("compost item applies nitrogen and potassium through farmland interaction",()=>{
 assert.match(runtime,/"tfc:compost":\{name:"堆肥",nutrients:\{nitrogen:20,potassium:20\}\}/);
 assert.match(runtime,/const fertilizer=FERTILIZER_PROFILES\[held\?\.typeId\]/);
 assert.match(runtime,/applyFertilizer\(soil,fertilizer\.nutrients\)/);
 assert.match(runtime,/take\(player,held\.typeId,1\)/);
});
