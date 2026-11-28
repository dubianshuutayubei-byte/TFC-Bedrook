import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");
test("empty-hand animal interaction shows husbandry state",()=>{
 assert.match(runtime,/if\(!held\)\{const state=animalState\(entity\)/);
 assert.match(runtime,/年齢: /);
 assert.match(runtime,/空腹: /);
 assert.match(runtime,/渇き: /);
 assert.match(runtime,/健康: /);
 assert.match(runtime,/なつき度: /);
});
