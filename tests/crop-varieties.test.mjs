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
 assert.deepEqual(crop["minecraft:block"].description.states["tfc:crop_type"],["wheat","maize","potato"]);
 assert.match(runtime,/maize:\{minTemperatureC:12,maxTemperatureC:35/);
 assert.match(runtime,/potato:\{minTemperatureC:4,maxTemperatureC:25/);
 assert.match(runtime,/const cropType=block\.permutation\.getState\("tfc:crop_type"\)/);
});
test("planting and harvesting route through matching seed and produce ids",()=>{
 for(const id of ["tfc:crop_seed","tfc:maize_seed","tfc:potato_seed","tfc:grain","tfc:maize","tfc:potato"])assert.ok(catalog.registeredIdentifiers.includes(id));
 assert.match(runtime,/profile\.seed/);
 assert.match(runtime,/give\(p,profile\.harvest/);
});
