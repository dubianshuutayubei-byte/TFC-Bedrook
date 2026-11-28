import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const roster=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/fauna-roster.json"),"utf8"));
const implemented=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/fauna.json"),"utf8"));
test("fauna coverage roster contains all 63 official TFC 3.2.26 profiles",()=>{
 assert.equal(roster.source.count,63);
 assert.equal(roster.species.length,63);
 assert.equal(new Set(roster.species.map(x=>x.id)).size,63);
 assert.ok(roster.species.some(x=>x.id==="alpaca"));
 assert.ok(roster.species.some(x=>x.id==="octopoteuthis"));
});
test("current Bedrock animal profiles are explicitly distinguished from planned fauna",()=>{
 for(const id of Object.keys(implemented)) assert.ok(roster.species.some(x=>x.id===id),id+" missing from full roster");
 assert.equal(roster.species.find(x=>x.id==="deer").status,"not_implemented");
});
