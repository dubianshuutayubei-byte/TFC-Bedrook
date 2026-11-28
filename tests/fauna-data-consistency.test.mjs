import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const fauna=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/fauna.json"),"utf8"));
const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");
import { OFFICIAL_LIVESTOCK_LIFECYCLE } from "../packs/behavior_pack/scripts/core/fauna-profiles.mjs";
test("livestock maturity data matches runtime adult thresholds",()=>{
 for(const [species,entityId,profile] of [["cow","minecraft:cow",OFFICIAL_LIVESTOCK_LIFECYCLE.cow],["sheep","minecraft:sheep",OFFICIAL_LIVESTOCK_LIFECYCLE.sheep],["chicken","tfc:chicken",OFFICIAL_LIVESTOCK_LIFECYCLE.chicken]]){
  assert.equal(fauna[species].adultAgeDays,profile.adultAgeDays);
  assert.ok(runtime.includes('"'+entityId+'":{adultAgeDays:OFFICIAL_LIVESTOCK_LIFECYCLE.'+species+' .adultAgeDays'.replace(" ","")));
 }
});
