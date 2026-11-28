import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ARMADILLO_SCUTE_COOLDOWN_TICKS, ARMADILLO_INITIAL_PROGRESS_TICKS, initializeArmadilloScuteClock, isArmadilloScuteDue } from "../packs/behavior_pack/scripts/core/armadillo-service.mjs";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");

test("TFC armadillo scute cooldown matches 30 default hours",()=>{
 assert.equal(ARMADILLO_SCUTE_COOLDOWN_TICKS,36000);
 assert.equal(isArmadilloScuteDue(1000,36999),false);
 assert.equal(isArmadilloScuteDue(1000,37000),true);
});

test("new armadillos receive the official randomized initial production progress",()=>{
 assert.equal(ARMADILLO_INITIAL_PROGRESS_TICKS,24000);
 assert.equal(initializeArmadilloScuteClock(50000,0),50000);
 assert.equal(initializeArmadilloScuteClock(50000,1),26000);
 assert.equal(initializeArmadilloScuteClock(50000,0.5),38000);
});

test("armadillo scute production is connected to entity runtime and uses vanilla scute item",()=>{
 assert.match(runtime,/function tickArmadilloScuteProduction\(entity,state\)/);
 assert.match(runtime,/world\.getAbsoluteTime\(\)/);
 assert.match(runtime,/minecraft:armadillo_scute/);
 assert.match(runtime,/tickArmadilloScuteProduction\(entity,state\)/);
 assert.match(runtime,/state\.lifeStage!=="adult"/);
});

test("scute clock rejects backwards time and invalid inputs",()=>{
 assert.equal(isArmadilloScuteDue(100,99),false);
 assert.equal(isArmadilloScuteDue(Number.NaN,100000),false);
 assert.equal(isArmadilloScuteDue(0,100,Number.NaN),false);
});
