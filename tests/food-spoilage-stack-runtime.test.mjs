import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");
const ui=readFileSync(join(root,"packs/behavior_pack/scripts/ui/main-menu.js"),"utf8");
test("runtime decays each food stack and persists freshness in its lore",()=>{
 assert.match(runtime,/import \{ readStackFreshness, advanceStackFreshness \}/);
 assert.match(runtime,/function tickFoodFreshness\(player,nowTick\)/);
 assert.match(runtime,/advanceStackFreshness\(lore,nowTick,\{temperatureC,baseDecayPerHour:baseDecayPerHour\*\(sealed\?0\.5:1\)\}\)/);
 assert.match(runtime,/stack\.setLore\(result\.lore\);container\.setItem\(slot,stack\)/);
 assert.match(runtime,/new ItemStack\("tfc:spoiled_food",stack\.amount\)/);
});
test("food consumption reads the consumed stack freshness",()=>{
 assert.match(runtime,/function food\(event,params\)/);
 assert.match(runtime,/readStackFreshness\(event\.itemStack\?\.getLore\?\.\(\)\?\?\[\]\)/);
 assert.match(runtime,/onConsume:\(a,p\)=>food\(a,p\.params\?\?\{\}\)/);
});
test("player status UI displays inventory stack freshness rather than player-level food IDs",()=>{
 assert.match(ui,/readStackFreshness\(stack\.getLore\(\)\)/);
 assert.match(ui,/Math\.min\(\.\.\.values\)/);
 assert.doesNotMatch(ui,/FOOD_FRESHNESS_KEY/);
});
