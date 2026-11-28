import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getStationRecipes } from "../packs/behavior_pack/scripts/core/processing-recipes.mjs";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const read=p=>JSON.parse(readFileSync(join(root,p),"utf8"));

test("compost and composter item/block definitions are registered",()=>{
 const compost=read("packs/behavior_pack/items/compost.json")["minecraft:item"];
 const item=read("packs/behavior_pack/items/composter.json")["minecraft:item"];
 const block=read("packs/behavior_pack/blocks/composter.json")["minecraft:block"];
 const recipe=read("packs/behavior_pack/recipes/composter.json")["minecraft:recipe_shaped"];
 assert.equal(compost.description.identifier,"tfc:compost");
 assert.equal(item.description.identifier,"tfc:composter");
 assert.equal(item.components["minecraft:block_placer"].block,"tfc:composter");
 assert.equal(block.description.identifier,"tfc:composter");
 assert.equal(block.components["tfc:station_ui"].station,"composter");
 assert.equal(recipe.result.item,"tfc:composter");
});

test("composter is a passive station with long-duration preserved jobs",()=>{
 const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");
 assert.match(runtime,/id==="anvil"\|\|id==="drying_rack"\|\|id==="composter"\|\|id==="quern"\)\?null/);
 assert.match(runtime,/"tfc:compost":\{name:"堆肥",nutrients:\{nitrogen:20,potassium:20\}\}/);
 assert.match(runtime,/const fertilizer=FERTILIZER_PROFILES\[held\?\.typeId\]/);
 assert.match(runtime,/applyFertilizer\(soil,fertilizer\.nutrients\)/);
 assert.equal(getStationRecipes("composter").length,2);
 assert.ok(getStationRecipes("composter").every(r=>r.durationTicks===240000));
});

test("field guide exposes composting and soil fertility",()=>{
 const ui=readFileSync(join(root,"packs/behavior_pack/scripts/ui/main-menu.js"),"utf8");
 assert.match(ui,/button\("堆肥・土壌肥沃度"\)/);
 assert.match(ui,/約10日かけて堆肥/);
});
