import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");

test("cow milk requires an adult female meeting health and needs thresholds",()=>{
 assert.match(runtime,/requiredSex:"female",minimumAgeDays:profile\.adultAgeDays,minimumHealth:40,maximumHunger:60,maximumThirst:60/);
 assert.match(runtime,/give\(player,"tfc:milk_bottle",1\)/);
 assert.match(runtime,/recordProduct\(state,currentDay\)/);
});

test("sheep wool and chicken eggs use native Bedrock collection systems",()=>{
 assert.match(runtime,/産出: 羊毛（バニラのハサミ操作で採取）/);
 assert.match(runtime,/産出: 卵（バニラの産卵AI）/);
 assert.doesNotMatch(runtime,/spawnItem\(new ItemStack\("minecraft:egg"/);
 assert.doesNotMatch(runtime,/spawnItem\(new ItemStack\("minecraft:white_wool"/);
});

test("livestock status displays age, needs, health and product instructions",()=>{
 for(const label of ["性別: ","年齢: ","空腹: ","渇き: ","健康: ","なつき度: ","産出: 牛乳","産出: 羊毛","産出: 卵"])assert.ok(runtime.includes(label),label);
});
