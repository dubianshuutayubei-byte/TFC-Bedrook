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
