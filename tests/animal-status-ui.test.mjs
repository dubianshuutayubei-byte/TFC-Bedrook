import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");
test("empty-hand animal interaction shows husbandry state",()=>{
 assert.match(runtime,/if\(!held\)\{/);
 assert.match(runtime,/年齢: /);
 assert.match(runtime,/空腹: /);
 assert.match(runtime,/渇き: /);
 assert.match(runtime,/健康: /);
 assert.match(runtime,/なつき度: /);\n assert.match(runtime,/性別: /);
});

test("livestock forage scan is bounded to a 3x3 area",()=>{
 assert.match(runtime,/for\(let x=-1;x<=1;x\+\+\)for\(let z=-1;z<=1;z\+\+\)/);
});

test("livestock sex and maturity follow TFC adult thresholds",()=>{
 assert.match(runtime,/minecraft:cow":\{adultAgeDays:192/);
 assert.match(runtime,/minecraft:sheep":\{adultAgeDays:56/);
 assert.match(runtime,/minecraft:chicken":\{adultAgeDays:24/);
 assert.match(runtime,/state\.sex!=="female"/);
 assert.match(runtime,/cooldownDays:1,currentDay/);
});
