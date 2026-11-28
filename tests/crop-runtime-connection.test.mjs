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

test("crop harvest yield is based on accumulated nutrient quality",()=>{
 assert.match(runtime,/calculateCropYield\(cropType==="potato"\?2:3,quality\)/);
 assert.match(runtime,/Math\.min\(previousQuality,evaluation\.nutrientFactor\)/);
 assert.match(runtime,/writeWorldState\(posKey\(top,"crop_quality"\),1\)/);
});

test("maize requires two blocks of space, grows an upper segment and harvests from either segment",()=>{
 assert.match(runtime,/seedProfile\.twoBlock&&!top\.above\(\)\?\.isAir/);
 assert.match(runtime,/withState\("tfc:part","lower"\)/);
 assert.match(runtime,/if\(block\.permutation\.getState\("tfc:part"\)==="upper"\)return/);
 assert.match(runtime,/if\(profile\.twoBlock&&age===1&&!block\.above\(\)\?\.isAir\)return/);
 assert.match(runtime,/if\(profile\.twoBlock&&nextAge===2\)/);
 assert.match(runtime,/withState\("tfc:part","upper"\)/);
 assert.match(runtime,/clicked\.permutation\.getState\("tfc:part"\)==="upper"\?clicked\.below\(\):clicked/);
});
