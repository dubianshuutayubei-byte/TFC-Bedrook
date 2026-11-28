import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");
const item=JSON.parse(readFileSync(join(root,"packs/behavior_pack/items/milk_bottle.json"),"utf8"));
const profiles=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/food-profiles.json"),"utf8"));

test("adult cows produce milk bottles with a per-animal cooldown",()=>{
  assert.match(runtime,/entity\.typeId==="minecraft:cow"&&held\.typeId==="minecraft:glass_bottle"/);
  assert.match(runtime,/canProduce\(state,\{requiredFamiliarity:0,cooldownDays:1,currentDay\}\)/);
  assert.match(runtime,/recordProduct\(state,currentDay\)/);\n  assert.match(runtime,/state\.sex!=="female"/);
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
