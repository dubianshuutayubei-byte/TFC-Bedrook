import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");
const ui=readFileSync(join(root,"packs/behavior_pack/scripts/ui/main-menu.js"),"utf8");

test("grass and ferns can provide seeds for the six additional crops",()=>{
 for(const block of ["minecraft:short_grass","minecraft:tall_grass"])assert.match(runtime,new RegExp('"'+block+'":\\["tfc:barley_seed"'));
 for(const block of ["minecraft:fern","minecraft:large_fern"])assert.match(runtime,new RegExp('"'+block+'":\\["tfc:beet_seed"'));
 assert.match(runtime,/Math\.random\(\)<0\.12/);
 assert.match(runtime,/spawnItem\(new ItemStack\(seed,1\)/);
});

test("seed collection and crop return are described in the field guide",()=>{
 assert.match(ui,/草地、ビーツ・キャベツ・ニンジンの種はシダを壊すと低確率で見つかります/);
 assert.match(ui,/成熟作物を収穫すると対応する種が1つ戻ります/);
});

test("firepit ash and wild seed drops share one block-break listener",()=>{
 assert.equal((runtime.match(/playerBreakBlock\.subscribe/g)||[]).length,1);
 assert.match(runtime,/brokenId==="tfc:firepit"/);
});
