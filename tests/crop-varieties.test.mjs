import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");
const crop=JSON.parse(readFileSync(join(root,"packs/behavior_pack/blocks/crop.json"),"utf8"));
const catalog=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/item-catalog.json"),"utf8"));
test("crop block distinguishes wheat maize and potato",()=>{
 assert.deepEqual(crop["minecraft:block"].description.states["tfc:crop_type"],["wheat","maize","potato","barley","oat","rye","beet","cabbage","carrot","garlic","onion","squash","lentils","soybean","peanuts","rice","cassava","green_beans","pumpkin","melon","tomato","red_bell_pepper","yellow_bell_pepper","alfalfa","canola","radish","sugarcane","jute","papyrus"]);
 assert.match(runtime,/maize:\{minTemperatureC:-7,maxTemperatureC:27/);
 assert.match(runtime,/potato:\{minTemperatureC:-7,maxTemperatureC:22/);
 assert.match(runtime,/const cropType=block\.permutation\.getState\("tfc:crop_type"\)/);
});
test("planting and harvesting route through matching seed and produce ids",()=>{
 for(const id of ["tfc:crop_seed","tfc:maize_seed","tfc:potato_seed","tfc:grain","tfc:maize","tfc:potato"])assert.ok(catalog.registeredIdentifiers.includes(id));
 assert.match(runtime,/profile\.seed/);
 assert.match(runtime,/give\(p,profile\.harvest/);
});

test("additional single-block crops have matching profiles, seeds and harvest foods",()=>{
 for(const id of ["barley","oat","rye","beet","cabbage","carrot","garlic","onion","squash","lentils","soybean","peanuts"]){
  assert.ok(runtime.includes(id+":{minTemperatureC:"));
  assert.ok(catalog.registeredIdentifiers.includes("tfc:"+id+"_seed"));
  assert.ok(catalog.registeredIdentifiers.includes("tfc:"+id));
 }
});

test("breaking either maize plant half removes its paired half",()=>{
 assert.match(runtime,/const cropType=event\.brokenBlockPermutation\?\.getState\("tfc:crop_type"\),profile=CROP_PROFILES\[cropType\]/);\n assert.match(runtime,/if\(profile\?\.twoBlock\)/);
 assert.match(runtime,/part==="upper"\?-1:1/);
 assert.match(runtime,/other\.setType\("minecraft:air"\)/);
});
