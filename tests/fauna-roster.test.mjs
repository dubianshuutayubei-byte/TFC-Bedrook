import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const roster=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/fauna-roster.json"),"utf8"));
const implemented=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/fauna.json"),"utf8"));
const coverage=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/fauna-runtime-coverage.json"),"utf8"));
test("fauna coverage roster contains all 63 official TFC 3.2.26 profiles",()=>{
 assert.equal(roster.source.count,63);
 assert.equal(roster.species.length,63);
 assert.equal(new Set(roster.species.map(x=>x.id)).size,63);
 assert.ok(roster.species.some(x=>x.id==="alpaca"));
 assert.ok(roster.species.some(x=>x.id==="octopoteuthis"));
});
test("current Bedrock animal profiles are explicitly distinguished from planned fauna",()=>{
 for(const id of Object.keys(implemented)) assert.ok(roster.species.some(x=>x.id===id),id+" missing from full roster");
 for(const id of ["deer","cow","sheep","chicken"]) assert.ok(["custom_entity_state_adapter","native_entity_state_adapter"].includes(roster.species.find(x=>x.id===id).status));
});
test("runtime coverage is explicit and does not claim all 63 species are implemented",()=>{
 assert.equal(coverage.total,63);
 assert.equal(coverage.runtimeTrackedCount,23);
 assert.equal(coverage.runtimeTrackedSpecies.length,23);
 assert.equal(coverage.requiresSpeciesImplementation.length,40);
 for(const id of coverage.runtimeTrackedSpecies)assert.ok(roster.species.some(x=>x.id===id));
 for(const id of coverage.requiresSpeciesImplementation)assert.ok(roster.species.some(x=>x.id===id));
});
