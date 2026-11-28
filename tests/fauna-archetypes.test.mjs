import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const roster=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/fauna-roster.json"),"utf8"));
const archetypes=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/fauna-archetypes.json"),"utf8"));
test("official TFC Java entity archetypes cover all 78 fauna",()=>{
 assert.equal(archetypes.total,78);
 assert.equal(archetypes.species.length,78);
 assert.equal(new Set(archetypes.species.map(x=>x.id)).size,78);
 assert.deepEqual(new Set(archetypes.species.map(x=>x.id)),new Set(roster.species.map(x=>x.id)));
});
test("official predator, prey, livestock, fish and aquatic classes are preserved",()=>{
 for(const id of ["polar_bear","grizzly_bear","black_bear"])assert.equal(archetypes.species.find(x=>x.id===id).archetype,"bear_predator");
 for(const id of ["cougar","panther","lion","sabertooth","tiger"])assert.equal(archetypes.species.find(x=>x.id===id).archetype,"feline_predator");
 for(const id of ["cow","goat","yak"])assert.equal(archetypes.species.find(x=>x.id===id).archetype,"dairy_livestock");
 for(const id of ["alpaca","sheep","musk_ox"])assert.equal(archetypes.species.find(x=>x.id===id).archetype,"wool_livestock");
 for(const id of ["bluegill","crappie","lake_trout","largemouth_bass","rainbow_trout","salmon","smallmouth_bass"])assert.equal(archetypes.species.find(x=>x.id===id).archetype,"freshwater_fish");
});

const coverage=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/fauna-runtime-coverage.json"),"utf8"));
const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");
test("78 official fauna have runtime state profiles while 55 still need species-specific work",()=>{
 assert.equal(coverage.total,78);
 assert.equal(coverage.runtimeTrackedCount,78);
 assert.equal(coverage.runtimeTrackedSpecies.length,78);
 assert.equal(coverage.remainingCount,55);
 const tracked=new Set(coverage.runtimeTrackedSpecies);
 const remaining=new Set(coverage.requiresSpeciesImplementation);
 assert.equal(tracked.size,78);
 assert.equal(remaining.size,55);
 for(const id of tracked){assert.ok(roster.species.some(x=>x.id===id),id);assert.ok(runtime.includes('"speciesId":"'+id+'"')||runtime.includes('speciesId:"'+id+'"'),id);}
 for(const id of remaining){assert.ok(roster.species.some(x=>x.id===id),id);assert.ok(!tracked.has(id)||coverage.customEntitySpecies.includes(id),id+" must be either legacy runtime-tracked or have a custom entity scaffold");}
 for(const id of coverage.missingOfficialSpecies){assert.ok(!tracked.has(id),id+" must not be claimed as runtime tracked");assert.equal(roster.species.find(x=>x.id===id).status,"not_implemented");}
});
