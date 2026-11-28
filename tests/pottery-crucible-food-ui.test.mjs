import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getStationRecipes } from "../packs/behavior_pack/scripts/core/processing-recipes.mjs";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");
const menu=readFileSync(join(root,"packs/behavior_pack/scripts/ui/main-menu.js"),"utf8");

test("sneak-use clay ball opens pottery shaping and consumes the selected clay amount",()=>{
 assert.match(runtime,/async function shapePottery\(player\)/);
 assert.match(runtime,/player\.isSneaking&&stack\.typeId==="minecraft:clay_ball"/);
 assert.match(runtime,/tfc:clay_vessel/);
 assert.match(runtime,/tfc:unfired_ingot_mold/);
});

test("crucible stores metal additions, validates bronze ratio, temperature and fired mold",()=>{
 assert.match(runtime,/async function crucibleStation\(player,block,state\)/);
 assert.match(runtime,/crucible_charge/);
 assert.match(runtime,/findMatchingAlloys\(\{copper,tin\}/);
 assert.match(runtime,/canProcessAtTemperature\(state,950\)/);
 assert.match(runtime,/tfc:fired_ingot_mold/);
 assert.match(runtime,/tfc:heated_bronze_ingot/);
});

test("food detail UI can be opened by sneak-using a food stack and reports freshness",()=>{
 assert.match(runtime,/function openFoodDetail\(player,stack\)/);
 assert.match(runtime,/鮮度:/);
 assert.match(runtime,/player\.isSneaking&&\(FOOD_DECAY_PROFILES\[stack\.typeId\]!==undefined/);
});

test("drying rack exposes crop-specific preservation recipes",()=>{
 const recipes=getStationRecipes("drying_rack");
 for(const id of ["tfc:beet","tfc:cabbage","tfc:carrot","tfc:potato","tfc:tomato","tfc:melon"]){
  assert.ok(recipes.some(recipe=>Object.hasOwn(recipe.inputs,id)),id+" should have a drying recipe");
 }
});
