import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const roster=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/fauna-roster.json"),"utf8"));
const coverage=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/fauna-runtime-coverage.json"),"utf8"));
const archetypes=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/fauna-archetypes.json"),"utf8"));
const geometry=JSON.parse(readFileSync(join(root,"packs/resource_pack/models/entity/fauna-archetypes.geo.json"),"utf8"));
const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");
test("all 78 TFC fauna have shared runtime profiles and entity coverage",()=>{
 assert.equal(coverage.officialSourceVersion,"TerraFirmaCraft 1.21.1-4.2.16");
 assert.equal(coverage.officialSourceTag,"v4.2.16");
 assert.equal(coverage.total,78);
 assert.equal(coverage.officialSpawnPlacementCount,78);
 assert.deepEqual(coverage.officialSpawnPlacementCounts,{in_water:29,no_restrictions:1,on_ground:48});
 assert.equal(coverage.officialClimateProfileCount,78);
 assert.equal(coverage.officialHabitatProfileCount,78);
 assert.equal(coverage.legacyClimateJsonProfileCount,63);
 assert.equal(coverage.runtimeTrackedCount,78);
 assert.equal(coverage.runtimeTrackedSpecies.length,78);
 for(const id of coverage.runtimeTrackedSpecies){const species=roster.species.find(x=>x.id===id);assert.ok(species,"runtime species must exist in official roster: "+id);assert.ok(runtime.includes('"speciesId":"'+species.id+'"')||runtime.includes('speciesId:"'+species.id+'"'),species.id+" runtime profile missing");}
});
test("all 55 custom-scaffold species have behavior, client and spawn definitions",()=>{
 assert.equal(coverage.customEntityDefinitionCount,55);
 for(const id of coverage.customEntitySpecies){
  const bp=JSON.parse(readFileSync(join(root,"packs/behavior_pack/entities",id+".json"),"utf8"));
  const rp=JSON.parse(readFileSync(join(root,"packs/resource_pack/entity",id+".entity.json"),"utf8"));
  const sr=JSON.parse(readFileSync(join(root,"packs/behavior_pack/spawn_rules",id+".json"),"utf8"));
  assert.equal(bp["minecraft:entity"].description.identifier,"tfc:"+id);
  assert.equal(rp["minecraft:client_entity"].description.identifier,"tfc:"+id);
  assert.equal(sr["minecraft:spawn_rules"].description.identifier,"tfc:"+id);
  assert.ok(existsSync(join(root,"packs/resource_pack/textures/entity/tfc_fauna_atlas.png")));
 }
});
test("every custom fauna geometry is registered in the shared archetype model",()=>{
 const ids=geometry["minecraft:geometry"].map(x=>x.description.identifier);
 for(const id of coverage.customEntitySpecies)assert.ok(ids.includes("geometry.tfc.fauna."+id),id+" geometry missing");
 assert.equal(geometry["minecraft:geometry"].length,55);
 assert.equal(archetypes.species.length,78);
});


test("official Java 1.21.x fauna additions are tracked as missing rather than falsely complete",()=>{
 assert.equal(roster.species.length,78);
 assert.equal(coverage.missingOfficialSpecies.length,0);
 for(const id of coverage.missingOfficialSpecies){
  assert.ok(roster.species.some(x=>x.id===id),id+" must be in official target roster");
  assert.ok(coverage.requiresSpeciesImplementation.includes(id),id+" must remain in implementation backlog");
  assert.equal(roster.species.find(x=>x.id===id).status,"not_implemented");
 }
 assert.equal(coverage.entityDefinitionsComplete,true);
});

test("new Java 1.21.1 fauna scaffolds remain explicitly marked as species-specific work",()=>{
 const ids=["arctic_char","burbot","muksun","northern_pike","pacu","peacock_bass","red_piranha","spotted_gudgeon","tilapia","armadillo","bactrian_camel","bison","dromedary_camel","leopard_seal","pond_turtle"];
 for(const id of ids){
  assert.equal(roster.species.find(x=>x.id===id).status,"custom_entity_scaffold");
  assert.ok(coverage.remainingSpeciesSpecificWork.includes(id));
  assert.ok(geometry["minecraft:geometry"].some(x=>x.description.identifier==="geometry.tfc.fauna."+id));
 }
});
