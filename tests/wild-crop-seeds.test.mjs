import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");
const ui=readFileSync(join(root,"packs/behavior_pack/scripts/ui/main-menu.js"),"utf8");

test("grass, ferns, water plants and dead bushes can provide crop seeds",()=>{
 assert.match(runtime,/"minecraft:short_grass":\["tfc:barley_seed"/);
 assert.match(runtime,/"minecraft:fern":\["tfc:beet_seed"/);
 assert.match(runtime,/"minecraft:seagrass":\["tfc:rice_seed","tfc:sugarcane_seed","tfc:papyrus_seed"/);
 assert.match(runtime,/"minecraft:dead_bush":\["tfc:cassava_seed"/);
 for(const id of ["tfc:tomato_seed","tfc:red_bell_pepper_seed","tfc:yellow_bell_pepper_seed","tfc:alfalfa_seed","tfc:canola_seed","tfc:radish_seed","tfc:green_beans_seed","tfc:jute_seed"])assert.ok(runtime.includes(id));
 assert.match(runtime,/Math\.random\(\)<0\.12/);
 assert.match(runtime,/spawnItem\(new ItemStack\(seed,1\)/);
});

test("seed collection and crop return are described in the field guide",()=>{
 assert.match(ui,/水稲・パピルス・サトウキビの種は水草/);
 assert.match(ui,/成熟作物を収穫すると対応する種が1つ戻ります/);
});

test("firepit ash and wild seed drops share one block-break listener",()=>{
 assert.equal((runtime.match(/playerBreakBlock\.subscribe/g)||[]).length,1);
 assert.match(runtime,/brokenId==="tfc:firepit"/);
});
