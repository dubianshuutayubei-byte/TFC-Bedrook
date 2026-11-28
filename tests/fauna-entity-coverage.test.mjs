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
test("all 63 TFC fauna have shared runtime profiles and entity coverage",()=>{
 assert.equal(coverage.runtimeTrackedCount,63);
 assert.equal(coverage.runtimeTrackedSpecies.length,63);
 for(const species of roster.species)assert.ok(runtime.includes('speciesId:"'+species.id+'"'),species.id+" runtime profile missing");
});
test("all 40 missing species now have behavior, client and spawn definitions",()=>{
 assert.equal(coverage.customEntityDefinitionCount,40);
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
 assert.equal(geometry["minecraft:geometry"].length,40);
 assert.equal(archetypes.species.length,63);
});
