import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const db=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/official-fauna-profiles.json"),"utf8"));
const roster=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/fauna-roster.json"),"utf8"));
test("official fauna climate database covers all 63 TFC 3.2.26 species",()=>{
 assert.equal(db.species.length,63);
 assert.deepEqual(db.species.map(x=>x.id).sort(),roster.species.map(x=>x.id).sort());
 assert.equal(new Set(db.species.map(x=>x.id)).size,63);
});
test("official fauna constraints preserve cold, aquatic depth and special brightness profiles",()=>{
 const byId=Object.fromEntries(db.species.map(x=>[x.id,x]));
 assert.equal(byId.yak.maxTemperatureC,-11);
 assert.equal(byId.polar_bear.maxTemperatureC,-10);
 assert.equal(byId.octopoteuthis.belowSeaLevel,33);
 assert.equal(byId.octopoteuthis.maxBrightness,0);
 assert.equal(byId.panda.fuzzy,true);
 assert.equal(byId.dolphin.chance,10);
});
test("missing official constraints remain unspecified rather than becoming zero",()=>{
 const rabbit=db.species.find(x=>x.id==="rabbit");
 assert.equal(Object.hasOwn(rabbit,"minTemperatureC"),false);
 assert.equal(Object.hasOwn(rabbit,"maxTemperatureC"),false);
});
