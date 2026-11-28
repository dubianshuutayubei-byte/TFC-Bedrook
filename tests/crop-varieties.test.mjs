import test from "node:test";
import { CROP_PROFILES } from "../packs/behavior_pack/scripts/core/crop-profiles.mjs";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const read=p=>JSON.parse(readFileSync(join(root,p),"utf8"));
const cropData=read("packs/behavior_pack/data/crops.json");
const block=read("packs/behavior_pack/blocks/crop.json")["minecraft:block"];
const catalog=read("packs/behavior_pack/data/item-catalog.json");
const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");

test("every crop profile has a matching block state and registered seed/harvest item",()=>{
 const states=block.description.states["tfc:crop_type"];
 assert.deepEqual([...Object.keys(cropData)].sort(),[...states].sort());
 for(const [id,profile] of Object.entries(cropData)){
  assert.ok(profile.seed, id+" seed missing");
  assert.ok(profile.harvest, id+" harvest missing");
  assert.ok(catalog.registeredIdentifiers.includes(profile.seed),id+" seed not registered");
  assert.ok(catalog.registeredIdentifiers.includes(profile.harvest),id+" harvest not registered");
  assert.ok(runtime.includes(id+":{minTemperatureC:"),id+" runtime profile missing");
 }
});

test("special crop mechanics are represented in canonical data and runtime",()=>{
 assert.equal(cropData.rice.requiresWater,true);
 assert.equal(cropData.green_beans.supportRequired,true);
 assert.equal(cropData.tomato.supportRequired,true);
 assert.equal(cropData.pumpkin.fruitBlock,"tfc:pumpkin_fruit");
 assert.equal(cropData.melon.fruitBlock,"tfc:melon_fruit");
 assert.equal(cropData.red_bell_pepper.pickable,true);
 assert.match(runtime,/profile\.requiresWater&&!hasFreshWaterAdjacent/);
 assert.match(runtime,/profile\.supportRequired&&!hasCropSupport/);
 assert.match(runtime,/profile\.spreading\)trySpreadFruit/);
 assert.match(runtime,/profile\.pickable/);
});
