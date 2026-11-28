import test from "node:test";
import assert from "node:assert/strict";
import { getRainfallMm, normalizeDimensionId, normalizeWeather } from "../packs/behavior_pack/scripts/core/environment-service.mjs";

test("dimension identifiers from Bedrock normalize to stable keys",()=>{
  assert.equal(normalizeDimensionId("minecraft:overworld"),"overworld");
  assert.equal(normalizeDimensionId("overworld"),"overworld");
  assert.equal(normalizeDimensionId("minecraft:the_end"),"the_end");
});

test("weather values are normalized independent of capitalization",()=>{
  assert.equal(normalizeWeather("Rain"),"rain");
  assert.equal(normalizeWeather("THUNDER"),"thunder");
  assert.equal(normalizeWeather("Clear"),"clear");
});

test("only rain and thunder add soil rainfall",()=>{
  assert.equal(getRainfallMm("rain"),0.8);
  assert.equal(getRainfallMm("Thunder"),0.8);
  assert.equal(getRainfallMm("clear"),0);
  assert.equal(getRainfallMm("rain",1.25),1.25);
  assert.throws(()=>getRainfallMm("rain",-1),RangeError);
});

import { inferBiomeRainfallMultiplierFromBiomeId } from "../packs/behavior_pack/scripts/core/environment-service.mjs";
test("rainfall is scaled by biome-family precipitation",()=>{
 assert.equal(getRainfallMm("rain",0.8,inferBiomeRainfallMultiplierFromBiomeId("minecraft:desert")),0.12);
 assert.equal(getRainfallMm("thunder",0.8,inferBiomeRainfallMultiplierFromBiomeId("minecraft:jungle")),1.16);
 assert.equal(getRainfallMm("clear",0.8,1.5),0);
 assert.equal(inferBiomeRainfallMultiplierFromBiomeId("minecraft:plains"),1);
});
