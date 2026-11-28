import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const profiles=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/food-profiles.json"),"utf8"));
const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");
const processing=readFileSync(join(root,"packs/behavior_pack/scripts/core/processing-recipes.mjs"),"utf8");

test("registered edible items use the food service and match canonical nutrition profiles",()=>{
  assert.match(runtime,/import \{ consumeFood \} from "\.\/core\/food-service\.mjs"/);
  assert.match(runtime,/import \{ readStackFreshness, advanceStackFreshness \} from "\.\/core\/food-stack-service\.mjs"/);
  assert.match(runtime,/consumeFood\(s,/);
  assert.match(runtime,/readStackFreshness\(event\.itemStack\?\.getLore\?\.\(\)\?\?\[\]\)/);
  const expected=[
    ["raw_meat","raw_meat","protein"],
    ["cooked_meat","cooked_meat","protein"],
    ["grain","grain","grain"],
    ["maize","maize","grain"],
    ["potato","potato","vegetables"],
    ["vegetable","vegetable","vegetables"],
    ["fruit","fruit","fruit"],
    ["milk_bottle","milk","dairy"],
    ["salted_meat","salted_meat","protein"],
    ["smoked_meat","smoked_meat","protein"]
  ];
  for(const [file,id,category] of expected){
    const item=JSON.parse(readFileSync(join(root,"packs/behavior_pack/items",file+".json"),"utf8"));
    const params=item["minecraft:item"].components["tfc:consume_food"];
    const profile=profiles.foods.find(food=>food.id===id);
    assert.ok(profile,"missing profile "+id);
    assert.equal(params.category,category);
    assert.equal(params.nutrition,profile.nutrition[category],id+" nutrition mismatch");
    assert.equal(params.hydration,profile.hydration,id+" hydration mismatch");
  }
});

test("smokehouse output is registered as smoked-preserved food, not merely cooked food",()=>{
  const smoked=profiles.foods.find(food=>food.id==="smoked_meat");
  assert.ok(smoked);
  assert.equal(smoked.preservation,"smoked");
  assert.equal(smoked.cooked,true);
  assert.match(runtime,/"tfc:smoked_meat":0\.03/);
  assert.match(processing,/id:"tfc:smoked_meat",station:"smokehouse"/);
});
