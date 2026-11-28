import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");

test("in-world wheat growth uses crop climate and soil suitability checks",()=>{
  assert.match(runtime,/evaluateCropGrowth\(profile,\{temperatureC:temperatureAt\(block\.dimension,block\.location\)\},soil\)/);
  assert.match(runtime,/applyCropNutrientEffects\(soil,profile\.nutrientEffects,evaluation\.growthMultiplier\)/);
  assert.match(runtime,/if\(!evaluation\.suitable\)return/);
  assert.match(runtime,/advanceCropGrowthProgress\(Number\(readWorldState\(progressKey,0\)\),evaluation\.growthMultiplier\)/);
});

test("crop profiles use TFC Field Guide temperature and hydration ranges",()=>{
 assert.match(runtime,/wheat:\{minTemperatureC:-7,maxTemperatureC:22,minHydration:15,maxHydration:85/);
 assert.match(runtime,/maize:\{minTemperatureC:-7,maxTemperatureC:27,minHydration:50,maxHydration:100/);
 assert.match(runtime,/potato:\{minTemperatureC:-7,maxTemperatureC:22,minHydration:35,maxHydration:90/);
});
