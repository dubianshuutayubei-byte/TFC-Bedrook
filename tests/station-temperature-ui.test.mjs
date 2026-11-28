import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");
test("station UI displays TFC temperature bands in Japanese",()=>{
 assert.match(runtime,/import \{ classifyTemperature \} from "\.\/core\/heat-service\.mjs"/);
 assert.match(runtime,/tempLabels\[classifyTemperature\(state\.temperatureC\)\]/);
 assert.match(runtime,/強白熱/);
});

test("station UI shows material availability and outputs",()=>{
 assert.match(runtime,/const inputs=Object\.entries\(r\.inputs\)/);
 assert.match(runtime,/count\(player,itemId\)>=amount\?"§a":"§c"/);
 assert.match(runtime,/const outputs=Object\.entries\(r\.outputs\)/);
 assert.match(runtime,/材料: /);
 assert.match(runtime,/完成品: /);
});
