import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");
test("vanilla livestock relies on vanilla breeding and avoids duplicate feed consumption",()=>{
 assert.match(runtime,/"minecraft:cow":\{[^}]*customBreeding:false/);
 assert.match(runtime,/"minecraft:sheep":\{[^}]*customBreeding:false/);
 assert.match(runtime,/"minecraft:chicken":\{[^}]*customBreeding:false/);
 assert.match(runtime,/if\(entity\.typeId==="tfc:deer"&&!take\(player,held\.typeId,1\)\)return/);
 assert.match(runtime,/if\(profile\.customBreeding&&state\.sex==="female"/);
});
test("custom deer retains its own pregnancy and birth cycle",()=>{
 assert.match(runtime,/"tfc:deer":\{[^}]*customBreeding:true/);
 assert.match(runtime,/advancePregnancy\(state,0\.05,profile\.gestationDays\)/);
});

test("custom pregnancy is confined to deer; vanilla livestock uses native breeding",()=>{
 assert.match(runtime,/if\(profile\.customBreeding&&state\.pregnancyDays>0\)/);
 assert.match(runtime,/if\(profile\.customBreeding&&state\.sex==="female"/);
 assert.match(runtime,/other\.lastBreedAt=other\.ageDays/);
 assert.match(runtime,/entity\.dimension\.spawnEntity\(entity\.typeId/);
});
test("animal needs and age update on the periodic loaded-entity tick",()=>{
 assert.match(runtime,/advanceAnimalNeeds\(state,0\.05\)/);
 assert.match(runtime,/system\.runInterval\(\(\)=>\{for\(const dimensionId of \["overworld","nether","the_end"\]\)/);
 assert.match(runtime,/\},1200\)/);
});
