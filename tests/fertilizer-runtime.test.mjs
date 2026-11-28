import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");
const data=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/fertilizer-profiles.json"),"utf8"));
test("bone meal, compost and wood ash are connected as fertilizers",()=>{
 for(const id of ["minecraft:bone_meal","tfc:compost","tfc:wood_ash"])assert.ok(runtime.includes('"'+id+'"'));
 assert.match(runtime,/applyFertilizer\(soil,fertilizer\.nutrients\)/);
 assert.equal(data.fertilizers.find(x=>x.id==="tfc:wood_ash").nutrients.phosphorus,10);
 assert.equal(data.fertilizers.find(x=>x.id==="tfc:wood_ash").nutrients.potassium,20);
});
test("breaking a firepit produces wood ash",()=>{
 assert.match(runtime,/playerBreakBlock\.subscribe/);
 assert.match(runtime,/brokenBlockPermutation\?\.type\?\.id!=="tfc:firepit"/);
 assert.match(runtime,/spawnItem\(new ItemStack\("tfc:wood_ash",1\)/);
});
