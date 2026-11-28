import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const fauna=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/fauna.json"),"utf8"));
const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");
test("livestock maturity data matches runtime adult thresholds",()=>{
 for(const [species,age] of [["cow",192],["sheep",56],["chicken",24]]){
  assert.equal(fauna[species].adultAgeDays,age);
  const entityId=species==="chicken"?"tfc:chicken":"minecraft:"+species;
  assert.ok(runtime.includes('"'+entityId+'":{adultAgeDays:'+age));
 }
});
