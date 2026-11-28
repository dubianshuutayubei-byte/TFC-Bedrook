import test from "node:test";
import assert from "node:assert/strict";
import { advanceStackFreshness, readStackFreshness, writeStackFreshness } from "../packs/behavior_pack/scripts/core/food-stack-service.mjs";

test("freshness metadata stays with the stack lore and preserves unrelated lore",()=>{
 const lore=writeStackFreshness(["品質: 上質"],72.4,1200);
 assert.equal(readStackFreshness(lore).freshness,72.4);
 assert.equal(readStackFreshness(lore).lastTick,1200);
 assert.ok(lore.includes("品質: 上質"));
 assert.ok(lore.some(line=>line.startsWith("鮮度: ")));
});
test("food stack freshness decays from its own saved tick",()=>{
 const first=writeStackFreshness([],100,72000);
 const next=advanceStackFreshness(first,144000,{temperatureC:20,baseDecayPerHour:10});
 assert.equal(next.elapsedTicks,72000);
 assert.equal(next.food.freshness,90);
 assert.equal(readStackFreshness(next.lore).lastTick,144000);
});
test("new stacks begin fresh and do not instantly decay",()=>{
 const result=advanceStackFreshness([],72000,{temperatureC:20,baseDecayPerHour:10});
 assert.equal(result.food.freshness,100);
 assert.equal(readStackFreshness(result.lore).lastTick,72000);
});
test("invalid or negative stack metadata safely defaults to fresh",()=>{
 assert.equal(readStackFreshness(["§0TFCFRESH:bad"]).freshness,100);
 assert.equal(readStackFreshness([]).freshness,100);
});
