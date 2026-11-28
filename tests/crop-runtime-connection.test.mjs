import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");

test("in-world wheat growth uses crop climate and soil suitability checks",()=>{
  assert.match(runtime,/evaluateCropGrowth\(profile,\{temperatureC:15\},soil\)/);
  assert.match(runtime,/applyNutrientUptake\(soil,profile\.preferredNutrient,1\.5\)/);
  assert.match(runtime,/if\(!evaluation\.suitable\)return/);
});
