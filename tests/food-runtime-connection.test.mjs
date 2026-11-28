import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const profiles=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/food-profiles.json"),"utf8"));
const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");

test("registered edible items use the food service and match canonical nutrition profiles",()=>{
  assert.match(runtime,/import \{ consumeFood, advanceFoodDecay \} from "\.\/core\/food-service\.mjs"/);
  assert.match(runtime,/consumeFood\(s,/);
  const expected=[
    ["raw_meat","raw_meat","protein"],
    ["cooked_meat","cooked_meat","protein"],
    ["grain","grain","grain"],
    ["maize","maize","grain"],
    ["potato","potato","vegetables"],
    ["milk_bottle","milk","dairy"]
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
