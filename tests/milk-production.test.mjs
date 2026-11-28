import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");
const item=JSON.parse(readFileSync(join(root,"packs/behavior_pack/items/milk_bottle.json"),"utf8"));
const profiles=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/food-profiles.json"),"utf8"));

test("adult female dairy animals produce milk bottles with a per-animal cooldown",()=>{
  assert.match(runtime,/profile\.dairy&&held\.typeId==="minecraft:glass_bottle"/);
  assert.match(runtime,/canProduce\(state,\{requiredFamiliarity:profile\.productFamiliarityMin\?\?0,cooldownDays:profile\.productCooldownDays\?\?1,currentDay,requiredSex:"female",minimumAgeDays:profile\.adultAgeDays,minimumHealth:40,maximumHunger:60,maximumThirst:60,maxUses:profile\.maxUses\?\?Infinity\}\)/);
  assert.match(runtime,/state\.sex!=="female"/);
  assert.match(runtime,/recordProduct\(state,currentDay,\{maxUses:profile\.maxUses\?\?Infinity,oldDayDelay:1\+Math\.floor\(Math\.random\(\)\*5\)\}\)/);
});

test("milk bottle is registered as the dairy food profile",()=>{
  const components=item["minecraft:item"].components;
  assert.equal(item["minecraft:item"].description.identifier,"tfc:milk_bottle");
  assert.equal(components["tfc:consume_food"].category,"dairy");
  assert.equal(components["tfc:consume_food"].nutrition,profiles.foods.find(x=>x.id==="milk").nutrition.dairy);
  assert.equal(components["tfc:consume_food"].hydration,profiles.foods.find(x=>x.id==="milk").hydration);
});

test("milk production imports its runtime cooldown functions",()=>{
  assert.match(runtime,/import \{[^}]*canProduce[^}]*recordProduct[^}]*\} from "\.\/core\/fauna-service\.mjs"/);
});

test("goats are included in the dairy animal profile",()=>{
 assert.match(runtime,/"minecraft:cow":\{[^}]*dairy:true/);
 assert.match(runtime,/"minecraft:goat":\{[^}]*dairy:true/);
 assert.match(runtime,/entity\.typeId==="minecraft:goat"\?"\\n産出: 山羊乳/);
});
