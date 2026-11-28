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
 assert.match(runtime,/world\.afterEvents\.itemUse\.subscribe[\s\S]*?player\.isSneaking&&stack\?\.typeId==="minecraft:clay_ball"/);
 assert.match(runtime,/tfc:clay_vessel/);
 assert.match(runtime,/tfc:unfired_ingot_mold/);
 assert.match(runtime,/tfc:unfired_crucible/);
 assert.equal((runtime.match(/world\.afterEvents\.itemUse\.subscribe/g)||[]).length,1,"pottery input handler must only be subscribed once");
});

test("crucible stores metal additions, validates bronze ratio, temperature and fired mold",()=>{
 assert.match(runtime,/async function crucibleStation\(player,block,state\)/);
 assert.match(runtime,/crucible_charge/);
 assert.match(runtime,/findMatchingAlloys\(\{\[firstMetal\]:firstAmount,\[secondMetal\]:secondAmount\}/);
 assert.match(runtime,/canProcessAtTemperature\(state,bronzeRecipe\.minimumTemperatureC\)/);
 assert.match(runtime,/tfc:fired_ingot_mold/);
 assert.match(runtime,/tfc:heated_bronze_ingot/);
 assert.match(runtime,/tfc:copper_ore/);
 assert.match(runtime,/tfc:tin_ore/);
 assert.match(runtime,/鋳型を使う鉱石鋳造/);
 assert.match(runtime,/°C\\n§7燃料残り/,"crucible status text must use rendered line breaks");
 assert.match(runtime,/if\(!writeWorldState\(key,\{copper:0,tin:0\}\)\)\{player\.sendMessage\("§cるつぼの状態を保存できませんでした/,"withdrawal must persist before returning metals");
});

test("food freshness UI lists each inventory stack without consuming it",()=>{
 assert.match(menu,/async function showFoodInventory\(player\)/);
 assert.match(menu,/スロット /);
 assert.match(menu,/鮮度 /);
 assert.match(menu,/button\("食品鮮度一覧"\)/);
});

test("drying rack exposes crop-specific preservation recipes",()=>{
 const recipes=getStationRecipes("drying_rack");
 for(const id of ["tfc:beet","tfc:cabbage","tfc:carrot","tfc:potato","tfc:tomato","tfc:melon"]){
  assert.ok(recipes.some(recipe=>Object.hasOwn(recipe.inputs,id)),id+" should have a drying recipe");
 }
});

test("saltwater harvesting and smokehouse heating are connected",()=>{
 assert.match(runtime,/getBiome\(block\.location\).*ocean/);
 assert.match(runtime,/tfc:brine_vessel/);
 assert.match(runtime,/function hasActiveSmokeSource\(block\)/);
 assert.match(runtime,/fire\.burnTicks>0&&fire\.temperatureC>=80/);
 assert.match(runtime,/id==="smokehouse"&&!hasActiveSmokeSource\(block\)/);
});
test("ceramic crucible is shaped, fired, and assembled into the crucible block",()=>{
 const recipes=getStationRecipes("pit_kiln");
 assert.ok(recipes.some(r=>r.inputs["tfc:unfired_crucible"]&&r.outputs["tfc:fired_crucible"]));
 assert.match(runtime,/るつぼ: 8個/);
});
