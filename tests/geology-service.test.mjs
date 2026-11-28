import test from "node:test";
import assert from "node:assert/strict";
import { selectRockLayer, evaluateOreProspecting, classifyTerrain } from "../packs/behavior_pack/scripts/core/geology-service.mjs";

test("rock layer is selected by depth", () => {
  assert.equal(selectRockLayer({ layers: [{ minDepth: 0, maxDepth: 10, rock: "granite" }] }, 5), "granite");
});
test("prospecting respects host rock and vein radius", () => {
  const vein = { hostRock: "granite", radius: 10, abundance: 80 };
  assert.equal(evaluateOreProspecting(vein, { rock: "diorite", distance: 2 }).found, false);
  assert.equal(evaluateOreProspecting(vein, { rock: "granite", distance: 2 }).found, true);
  assert.equal(evaluateOreProspecting(vein, { rock: "granite", distance: 30 }).found, false);
});
test("terrain classification separates ocean, coast, hills and mountains", () => {
  assert.equal(classifyTerrain(-2, 0), "ocean");
  assert.equal(classifyTerrain(3, 0.02), "coast");
  assert.equal(classifyTerrain(30, 0.4), "hills");
  assert.equal(classifyTerrain(200, 0.6), "mountain");
});

import { summarizeOreSamples } from "../packs/behavior_pack/scripts/core/geology-service.mjs";
test("prospecting summary classifies ore samples by count",()=>{
 const summary=summarizeOreSamples({copper:2,iron:5,coal:0});
 assert.deepEqual(summary.map(x=>x.ore),["iron","copper"]);
 assert.equal(summary[0].abundance,"large");
 assert.equal(summary[1].abundance,"small");
 assert.throws(()=>summarizeOreSamples([]),TypeError);
});
