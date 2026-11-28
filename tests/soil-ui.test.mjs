import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");
test("soil status UI displays soil type and ambient temperature",()=>{
 assert.match(runtime,/title\("土壌状態"\)/);
 assert.match(runtime,/soilNames=\{loam:"壌土",silt:"シルト",clay:"粘土質"\}/);
 assert.match(runtime,/currentTemperatureC\(block\.location\.y-63\)\.toFixed\(1\)/);
 assert.match(runtime,/骨粉を持って操作すると肥料として使えます/);
});
