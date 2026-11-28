import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { OFFICIAL_FAUNA_PROFILES } from "../packs/behavior_pack/scripts/core/fauna-profiles.mjs";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const source=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");
const json=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/official-fauna-profiles.json"),"utf8"));
test("runtime fauna climate profiles preserve all 63 official source records",()=>{
 assert.equal(Object.keys(OFFICIAL_FAUNA_PROFILES).length,63);
 for(const profile of json.species)assert.deepEqual(OFFICIAL_FAUNA_PROFILES[profile.id],profile);
});
test("natural spawn validation uses official TFC profile constraints only for naturally spawned entities",()=>{
 assert.match(source,/world\.afterEvents\.entitySpawn\.subscribe\(validateNaturalFaunaSpawn\)/);
 assert.match(source,/event\?\.cause!=="Spawned"/);
 assert.match(source,/OFFICIAL_FAUNA_PROFILES\[profile\.speciesId\]/);
 assert.match(source,/evaluateFaunaSpawn\(official,environment\)/);
 assert.match(source,/if\(!result\.suitable\)\{?entity\.remove\(\)/);
});
test("spawn environment sampler provides temperature, rainfall, depth, light and forest density",()=>{
 for(const token of ["temperatureC:currentTemperatureC","rainfall:rainfallForBiome","belowSeaLevel:Math.max(0,63-blockLocation.y)","brightness","forestType:forestTypeAt"])assert.ok(source.includes(token),token);
});


test("natural fauna spawn sampler supplies TFC calendar month",()=>{
 assert.match(runtime,/month:tfcMonthFromDay\\(world\\.getDay\\(\\)\\)/);
});
