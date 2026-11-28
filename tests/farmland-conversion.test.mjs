import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");
test("hoe interaction converts vanilla tilled soil to TFC farmland",()=>{
 assert.match(runtime,/world\.afterEvents\.playerInteractWithBlock\.subscribe/);
 assert.match(runtime,/held\?\.typeId\?\.endsWith\("_hoe"\)/);
 assert.match(runtime,/block\.setType\("tfc:farmland"\)/);
 assert.match(runtime,/const soil=readSoil\(block\);writeWorldState\(soilKey\(block\),soil\)/);
});
